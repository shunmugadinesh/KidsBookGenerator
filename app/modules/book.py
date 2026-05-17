from app.utils.prompts import generate_prompt
from app.resources.data import LETTERS_DATA
from app.models.schemas import ChildProfile
from typing import Optional

def get_letters_prompts(profile: ChildProfile, specific_letter: Optional[str] = None):
    """
    If specific_letter is provided, returns prompt for that letter.
    Otherwise, returns prompts for all letters.
    """
    def _get(letter: str):
        return generate_prompt(
            name=profile.name,
            age=profile.age,
            language=profile.language,
            gender=profile.gender,
            skin_tone=profile.skin_tone,
            hair_color=profile.hair_color,
            hair_style=profile.hair_style,
            eye_color=profile.eye_color,
            outfit_color=profile.outfit_color,
            letter=letter,
        )
        
    if specific_letter:
        return _get(specific_letter)
        
    prompts = {}
    for item in LETTERS_DATA:
        letter = item["l"]
        prompts[letter] = _get(letter)
    return prompts
