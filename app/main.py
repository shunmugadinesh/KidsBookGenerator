from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
import json
import os

from app.models.schemas import ImageGenerationRequest, BookPromptRequest, HabitChartRequest, AudioVideoRequest, FullMovieRequest
from app.utils.image_generator import generate_image
from app.modules.book import get_letters_prompts
from app.modules.habit import HabitChartOrchestrator
from app.utils.audio_video import compile_story_video, ensure_ffmpeg

app = FastAPI(title="Book Generator API")

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
