from pydantic import BaseModel
from typing import Optional, Dict, Any

class ChildProfile(BaseModel):
    name: str = "rithvin"
    age: int = 3
    language: str = "english"
    gender: str = "boy"
    skin_tone: str = "fair skin"
    hair_color: str = "black"
    hair_style: str = "short curly"
    eye_color: str = "dark brown"
    outfit_color: str = "bright red"
    style: str = "Pixar-style illustration"
    lighting: str = "soft lighting"

class ImageGenerationRequest(BaseModel):
    prompt: str
    image: Optional[str] = None
    model: str = "pollinations"

class BookPromptRequest(BaseModel):
    profile: ChildProfile
    letter: Optional[str] = None

class HabitChartRequest(BaseModel):
    title: str
    total_scenes: int = 3
    total_pages: int = 3
    child_profile: Optional[ChildProfile] = None
    text_model: str = 'ollama'

class AudioVideoRequest(BaseModel):
    image: str                 # Base64 data URI of the generated image
    text: str                  # Story narration text for TTS
    voice: str = "en-US-AriaNeural"  # Microsoft Edge Voice ID or 'gtts' / 'eleven_...'
    bgm: str = "none"          # BGM preset key or custom prompt
    page_key: str = "Page 1"   # Page key for logging reference

class FullMovieRequest(BaseModel):
    video_filenames: list[str]

# ---------------------------------------------------------------------------
# Phase 3 — DB / Review / Rating schemas
# ---------------------------------------------------------------------------

class CorePlanRequest(BaseModel):
    title: str
    total_scenes: int = 3
    total_pages: int = 3
    child_profile: Optional[ChildProfile] = None
    text_model: str = 'ollama'

class StoryPagesRequest(BaseModel):
    project_id: int
    text_model: str = 'ollama'

class SimilaritySearchRequest(BaseModel):
    topic: str
    age: int
    style: str = "Pixar-style illustration"
    product_type: str = "habit_book"
 
class SaveAgentOutputRequest(BaseModel):
    project_id: Optional[int] = None   # None means create a new project
    title: str = "Untitled"
    project_type: str = "habit_book"
    page_name: str                      # "scene_plan" / "character_sheet" / "Page 1" etc.
    agent_role: str
    raw_output: Dict[str, Any]
    config_json: Optional[Dict[str, Any]] = None  # ChildProfile dict for new project creation
 
class ReviewUpdateRequest(BaseModel):
    output_id: int
    edited_output: Dict[str, Any]
 
class FeedbackRequest(BaseModel):
    project_id: int
    page_name: str          # specific page name OR "all" for book-level
    score: int              # 1-5  (book-level thumbs up = 5, thumbs down = 1)
    feedback_text: Optional[str] = None
    is_book_level: bool = False   # True → auto-rate all pages for the project

class SaveProjectAssetsRequest(BaseModel):
    project_id: int
    stories: Dict[str, str]
    prompts: Dict[str, str]
    images: Dict[str, str]
    videos: Dict[str, str]
    full_video: Optional[str] = None
