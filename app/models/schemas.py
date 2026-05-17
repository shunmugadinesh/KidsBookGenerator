from pydantic import BaseModel
from typing import Optional

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
    total_scenes: int = 4
    total_pages: int = 4
    child_profile: Optional[ChildProfile] = None
    text_model: str = 'ollama'

class AudioVideoRequest(BaseModel):
    image: str                 # Base64 data URI of the generated image
    text: str                  # Story narration text for TTS
    voice: str = "en-US-AriaNeural"  # Microsoft Edge Voice ID or 'gtts' / 'eleven_...'
    bgm: str = "none"          # BGM preset key or custom prompt
    page_key: str = "Page 1"   # Page key for logging reference
