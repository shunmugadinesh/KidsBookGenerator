from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
import json

from app.models.schemas import ImageGenerationRequest, BookPromptRequest, HabitChartRequest
from app.utils.image_generator import generate_image
from app.modules.book import get_letters_prompts
from app.modules.habit import HabitChartOrchestrator

app = FastAPI(title="Book Generator API")

# Mount React build files
app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

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
