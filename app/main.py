from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
import json
import os
import logging

from app.models.schemas import (
    ImageGenerationRequest, BookPromptRequest, HabitChartRequest,
    AudioVideoRequest, FullMovieRequest,
    # Phase 3
    SimilaritySearchRequest, SaveAgentOutputRequest, ReviewUpdateRequest, FeedbackRequest,
    CorePlanRequest, StoryPagesRequest, SaveProjectAssetsRequest
)
from app.utils.image_generator import generate_image
from app.modules.book import get_letters_prompts
from app.modules.habit import HabitChartOrchestrator
from app.utils.audio_video import compile_story_video, ensure_ffmpeg

# Phase 3 — DB
from app.db.connection import engine, get_db, Base
from app.db import crud
from app.db import chroma_client
from app.services import retrieval_service
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

app = FastAPI(title="Book Generator API")


@app.on_event("startup")
def on_startup():
    """Create all DB tables on startup (safe — skips existing tables)."""
    try:
        # Import models so SQLAlchemy registers them before create_all
        import app.db.models  # noqa: F401
        Base.metadata.create_all(bind=engine)
        logger.info("PostgreSQL tables ready.")
    except Exception as e:
        logger.warning(f"DB startup warning (tables may not be available): {e}")


# Mount React build files
app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

# Ensure generated directory exists and mount it to serve static MP4 files
os.makedirs("app/resources/generated", exist_ok=True)
app.mount("/generated-media", StaticFiles(directory="app/resources/generated"), name="generated-media")

@app.get("/")
def read_root():
    return FileResponse("frontend/dist/index.html")

@app.post("/generate-image")
async def generate_image_endpoint(request: ImageGenerationRequest):
    return await generate_image(request.prompt, request.image, request.model)

@app.post("/generate-prompts")
def generate_prompts_endpoint(request: BookPromptRequest):
    """
    If 'letter' is specified in the request body, returns the prompt for that letter.
    Otherwise, returns prompts for all letters.
    """
    prompts_data = get_letters_prompts(request.profile, request.letter)
    return {"prompts": prompts_data}

@app.post("/generate-core-plan")
def generate_core_plan_endpoint(request: CorePlanRequest, db: Session = Depends(get_db)):
    profile_dict = request.child_profile.model_dump() if request.child_profile else None
    
    orchestrator = HabitChartOrchestrator(
        chart_title=request.title,
        total_scenes=request.total_scenes,
        total_pages=request.total_pages,
        child_profile=profile_dict,
        text_model=request.text_model
    )
    
    # 1. Run planning + consistency
    pages_data, consistency_data = orchestrator._setup()
    
    # 2. Save to database (Auto-create project)
    project = crud.create_project(
        db,
        title=request.title,
        project_type="habit_book",
        config_dict=profile_dict
    )
    
    scene_plan_output = crud.save_agent_output(
        db,
        project_id=project.id,
        page_name="scene_plan",
        agent_role="Planner Agent",
        raw_output={"scenes_data": pages_data}
    )
    
    character_sheet_output = crud.save_agent_output(
        db,
        project_id=project.id,
        page_name="character_sheet",
        agent_role="Character Sheet Agent",
        raw_output=consistency_data
    )
    
    return {
        "project_id": project.id,
        "scene_plan": {
            "id": scene_plan_output.id,
            "data": {"scenes_data": pages_data}
        },
        "character_sheet": {
            "id": character_sheet_output.id,
            "data": consistency_data
        }
    }


@app.post("/generate-story-pages")
def generate_story_pages_endpoint(request: StoryPagesRequest, db: Session = Depends(get_db)):
    project = crud.get_project(db, request.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    outputs = crud.get_agent_outputs_for_project(db, request.project_id)
    scene_plan = None
    character_sheet = None
    for o in outputs:
        if o.page_name == "scene_plan":
            scene_plan = o.get_effective_output()
        elif o.page_name == "character_sheet":
            character_sheet = o.get_effective_output()
            
    if not scene_plan or not character_sheet:
        raise HTTPException(status_code=400, detail="Core plan not found or not yet reviewed.")
        
    pages_data = scene_plan.get("scenes_data", {})
    consistency_data = character_sheet
    
    config_dict = json.loads(project.config_json) if project.config_json else None
    orchestrator = HabitChartOrchestrator(
        chart_title=project.title,
        total_scenes=len(pages_data),
        total_pages=len(pages_data),
        child_profile=config_dict,
        text_model=request.text_model
    )
    
    def stream():
        try:
            yield json.dumps({"type": "meta", "total": len(pages_data)}) + "\n"
            
            sorted_keys = sorted(pages_data.keys(), key=lambda k: int(k.split()[1]) if len(k.split()) > 1 else 0)
            full_outline = "\n".join([f"- {k}: {' | '.join(pages_data[k])}" for k in sorted_keys])
            
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                future_to_page = {
                    executor.submit(orchestrator._process_page, page_name, p_scenes, consistency_data, full_outline): page_name
                    for page_name, p_scenes in pages_data.items()
                }
                for future in concurrent.futures.as_completed(future_to_page):
                    res = future.result()
                    if res and res[1] is not None:
                        page_name, page_data = res
                        
                        from app.db.connection import SessionLocal
                        session = SessionLocal()
                        saved_output_id = None
                        try:
                            saved_output = crud.save_agent_output(
                                session,
                                project_id=request.project_id,
                                page_name=page_name,
                                agent_role="Story Page Agent",
                                raw_output=page_data
                            )
                            session.commit()
                            saved_output_id = saved_output.id
                        except Exception as save_err:
                            session.rollback()
                            print(f"Error saving page {page_name}: {save_err}")
                        finally:
                            session.close()
                            
                        # Append the database output_id to the page data dict sent to frontend
                        streamed_data = {**page_data}
                        if saved_output_id is not None:
                            streamed_data["output_id"] = saved_output_id
                        yield json.dumps({"type": "page", "page": page_name, "data": streamed_data}) + "\n"
        except Exception as e:
            print(f"STREAM ERROR: {e}")
            yield json.dumps({"type": "error", "detail": str(e)}) + "\n"

    return StreamingResponse(stream(), media_type="application/x-ndjson")


@app.post("/generate-habit-chart")
def generate_habit_chart(body: HabitChartRequest):
    profile_dict = body.child_profile.model_dump() if body.child_profile else None
    
    orchestrator = HabitChartOrchestrator(
        chart_title=body.title,
        total_scenes=body.total_scenes,
        total_pages=body.total_pages,
        child_profile=profile_dict,
        text_model=body.text_model
    )
    
    def stream():
        try:
            yield json.dumps({"type": "meta", "total": orchestrator.total_pages}) + "\n"
            for page_name, page_data in orchestrator.run_stream():
                yield json.dumps({"type": "page", "page": page_name, "data": page_data}) + "\n"
        except Exception as e:
            print(f"CREWAI STREAM ERROR: {e}")
            yield json.dumps({"type": "error", "detail": str(e)}) + "\n"

    return StreamingResponse(stream(), media_type="application/x-ndjson")

@app.post("/generate-audio-video")
async def generate_audio_video_endpoint(request: AudioVideoRequest):
    try:
        hf_token = os.getenv("HUGGING_API_KEY") or os.getenv("HF_TOKEN")
        eleven_key = os.getenv("ELEVENLABS_API_KEY")
        
        video_path = compile_story_video(
            image_data_uri_or_path=request.image,
            text=request.text,
            voice=request.voice,
            bgm_option=request.bgm,
            hf_token=hf_token,
            elevenlabs_api_key=eleven_key,
            page_key=request.page_key
        )
        
        filename = os.path.basename(video_path)
        video_url = f"/generated-media/{filename}"
        
        return {
            "status": "success",
            "video_url": video_url,
            "filename": filename
        }
    except Exception as e:
        print(f"AUDIO_VIDEO_GENERATION ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/preview-voice")
def preview_voice_endpoint(voice: str):
    try:
        os.makedirs("app/resources/generated", exist_ok=True)
        preview_filename = f"preview_{voice}.mp3"
        preview_path = f"app/resources/generated/{preview_filename}"
        
        if not os.path.exists(preview_path):
            sample_text = "Hi! I am your AI narrator. I am ready to bring your story to life!"
            eleven_key = os.getenv("ELEVENLABS_API_KEY")
            from app.utils.audio_video import generate_tts
            generate_tts(sample_text, voice, preview_path, eleven_key)
            
        return {
            "status": "success",
            "audio_url": f"/generated-media/{preview_filename}"
        }
    except Exception as e:
        print(f"VOICE PREVIEW ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/book-data")
def get_book_data_endpoint():
    try:
        from app.resources.data import LETTERS_DATA
        return {"status": "success", "letters": LETTERS_DATA}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/compile-full-movie")
def compile_full_movie_endpoint(request: FullMovieRequest):
    try:
        import uuid
        import subprocess
        
        gen_dir = os.path.abspath("app/resources/generated")
        output_filename = f"full_storybook_movie_{uuid.uuid4().hex[:8]}.mp4"
        output_path = os.path.join(gen_dir, output_filename)
        
        # 1. Verify that all listed files exist in app/resources/generated
        valid_paths = []
        for fname in request.video_filenames:
            if not fname:
                continue
            # Prevent directory traversal attacks
            safe_fname = os.path.basename(fname)
            fpath = os.path.join(gen_dir, safe_fname)
            if not os.path.exists(fpath):
                raise FileNotFoundError(f"Required page video segment not found: {safe_fname}. Please compile this page first!")
            valid_paths.append(fpath)
            
        if not valid_paths:
            raise ValueError("No video segments provided to compile.")
            
        # 2. Write the dynamic concat listing file
        list_file_path = os.path.join(gen_dir, f"concat_list_{uuid.uuid4().hex[:8]}.txt")
        with open(list_file_path, "w", encoding="utf-8") as f:
            for p in valid_paths:
                # Standard FFmpeg syntax requires forward slashes even on Windows!
                safe_path = p.replace("\\", "/")
                f.write(f"file '{safe_path}'\n")
                
        try:
            # 3. Call FFmpeg to merge clips instantly using the direct stream copy code
            ffmpeg_bin = ensure_ffmpeg()
            cmd = [
                ffmpeg_bin, "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", list_file_path,
                "-c", "copy",  # Fast stream copy without re-encoding!
                output_path
            ]
            
            print(f"FFmpeg Merge Run: {' '.join(cmd)}")
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
            if result.returncode != 0:
                raise Exception(f"FFmpeg merge execution failed: {result.stderr}")
                
            print(f"Full movie compiled successfully: {output_path}")
            return {
                "status": "success",
                "video_url": f"/generated-media/{output_filename}",
                "filename": output_filename
            }
        finally:
            # Always clean up the listing description file
            if os.path.exists(list_file_path):
                try:
                    os.remove(list_file_path)
                except Exception:
                    pass
    except Exception as e:
        print(f"FULL_MOVIE_COMPILATION ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================================================
# Phase 3 — Knowledge Base, Review Panel & Rating Endpoints
# ===========================================================================

@app.post("/search-similar")
def search_similar_endpoint(request: SimilaritySearchRequest, db: Session = Depends(get_db)):
    """
    Checks ChromaDB for a semantically similar previously-generated story.
    Returns {found, similarity_score, project_id, story_text} or {found: false}.
    Call this BEFORE running agents to potentially skip the slow pipeline.
    """
    result = retrieval_service.check_similar_story(
        topic=request.topic,
        age=request.age,
        style=request.style,
        product_type=request.product_type
    )
    return result


@app.post("/save-agent-output")
def save_agent_output_endpoint(request: SaveAgentOutputRequest, db: Session = Depends(get_db)):
    """
    Saves a single agent output (Planner / Character Sheet / Story Page) to PostgreSQL.
    If project_id is None a new Project row is created automatically.
    Returns {output_id, project_id}.
    """
    project_id = request.project_id

    # Auto-create project if not yet created
    if project_id is None:
        project = crud.create_project(
            db,
            title=request.title,
            project_type=request.project_type,
            config_dict=request.config_json
        )
        project_id = project.id

    output = crud.save_agent_output(
        db,
        project_id=project_id,
        page_name=request.page_name,
        agent_role=request.agent_role,
        raw_output=request.raw_output
    )
    return {"output_id": output.id, "project_id": project_id}


@app.put("/update-review")
def update_review_endpoint(request: ReviewUpdateRequest, db: Session = Depends(get_db)):
    """
    Saves user edits from the Agent Review Panel back to the agent_outputs table.
    Call this when the user clicks 'Save Edits' in the review panel.
    """
    updated = crud.update_agent_output_edited(
        db,
        output_id=request.output_id,
        edited_output=request.edited_output
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Agent output id={request.output_id} not found")
    return {"status": "saved", "output_id": updated.id, "was_edited": updated.was_edited}


@app.post("/save-feedback")
def save_feedback_endpoint(request: FeedbackRequest, db: Session = Depends(get_db)):
    """
    Saves a rating for a specific page or the whole book.
    When is_book_level=True, all pages for the project get the same score.
    """
    if request.score < 1 or request.score > 5:
        raise HTTPException(status_code=422, detail="Score must be between 1 and 5")

    if request.is_book_level:
        ratings = crud.save_book_level_rating(
            db,
            project_id=request.project_id,
            score=request.score,
            feedback_text=request.feedback_text
        )
        return {"status": "saved", "pages_rated": len(ratings), "is_book_level": True}

    rating = crud.save_rating(
        db,
        project_id=request.project_id,
        page_name=request.page_name,
        score=request.score,
        feedback_text=request.feedback_text,
        is_book_level=False
    )
    return {"status": "saved", "rating_id": rating.id}


@app.get("/get-project/{project_id}")
def get_project_endpoint(project_id: int, db: Session = Depends(get_db)):
    """
    Returns a project with all its agent outputs (raw + edited) along with saved images and videos.
    Used by the frontend Review Panel to reload saved edits.
    """
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    outputs = crud.get_agent_outputs_for_project(db, project_id)

    # Fetch images and videos sorted by ID ascending to ensure the latest versions take precedence
    from app.db.models import Image, Video
    images = db.query(Image).filter(Image.project_id == project_id).order_by(Image.id.asc()).all()
    videos = db.query(Video).filter(Video.project_id == project_id).order_by(Video.id.asc()).all()

    images_dict = {img.page_name: img.image_path for img in images}
    videos_dict = {vid.page_name: vid.video_path for vid in videos if vid.page_name != "full_story"}

    full_video_rec = next((vid for vid in videos if vid.page_name in ("full_story", None)), None)
    full_video = full_video_rec.video_path if full_video_rec else None

    return {
        "project_id": project.id,
        "title": project.title,
        "project_type": project.project_type,
        "status": project.status,
        "agent_outputs": [
            {
                "id": o.id,
                "page_name": o.page_name,
                "agent_role": o.agent_role,
                "raw_output": o.get_effective_output(),
                "was_edited": o.was_edited
            }
            for o in outputs
        ],
        "images": images_dict,
        "videos": videos_dict,
        "full_video": full_video
    }


@app.get("/chroma-status")
def chroma_status_endpoint():
    """Quick health check for the ChromaDB connection."""
    available = chroma_client.is_available()
    return {
        "chromadb_available": available,
        "host": chroma_client.CHROMA_HOST,
        "port": chroma_client.CHROMA_PORT
    }

@app.get("/list-projects")
def list_projects_endpoint(db: Session = Depends(get_db)):
    """
    Returns a list of all projects stored in PostgreSQL, sorted by creation date.
    """
    from app.db.models import Project
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }
        for p in projects
    ]

@app.post("/save-project-assets")
def save_project_assets_endpoint(request: SaveProjectAssetsRequest, db: Session = Depends(get_db)):
    # 1. Save stories consolidated
    sorted_pages = sorted(request.stories.keys(), key=lambda k: int(k.split()[1]) if len(k.split()) > 1 else 0)
    story_text = "\n\n".join([f"{page}: {request.stories[page]}" for page in sorted_pages])
    crud.save_story(db, project_id=request.project_id, story_text=story_text)
    
    # 2. Save individual images
    for page, img_path in request.images.items():
        prompt = request.prompts.get(page, "")
        crud.save_image_record(
            db,
            project_id=request.project_id,
            page_name=page,
            image_prompt=prompt,
            image_path=img_path
        )
        
    # 3. Save individual page videos
    for page, vid_path in request.videos.items():
        if vid_path:
            crud.save_video_record(
                db,
                project_id=request.project_id,
                page_name=page,
                video_path=vid_path
            )
        
    # 4. Save full book video
    if request.full_video:
        crud.save_video_record(
            db,
            project_id=request.project_id,
            page_name="full_story",
            video_path=request.full_video
        )
        
    # 5. Add to ChromaDB Vector search database and update status
    project = crud.get_project(db, request.project_id)
    if project:
        try:
            config_dict = json.loads(project.config_json) if project.config_json else {}
            age_raw = config_dict.get("age")
            try:
                age = int(age_raw) if age_raw is not None else 3
            except (ValueError, TypeError):
                age = 3
            style = config_dict.get("style", "Pixar-style illustration")
            
            # Save to vector database (caching template)
            from app.services import retrieval_service
            retrieval_service.save_project_to_knowledge_base(
                db,
                project_id=request.project_id,
                topic=project.title,
                age=age,
                style=style,
                story_text=story_text,
                product_type=project.project_type
            )
        except Exception as e:
            logger.error(f"Error saving to ChromaDB knowledge base: {e}", exc_info=True)
        
    return {"status": "success", "message": "Project assets saved to DB successfully"}
