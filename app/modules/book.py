from app.utils.prompts import generate_prompt, generate_number_prompt
from app.resources.data import LETTERS_DATA, NUMBERS_DATA
from app.models.schemas import ChildProfile
from typing import Optional

def get_letters_prompts(profile: ChildProfile, specific_letter: Optional[str] = None, custom_word: Optional[str] = None, custom_scene: Optional[str] = None):
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
            style=profile.style,
            lighting=profile.lighting,
            custom_word=custom_word,
            custom_scene=custom_scene,
        )
        
    if specific_letter:
        return _get(specific_letter)
        
    prompts = {}
    for item in LETTERS_DATA:
        letter = item["l"]
        prompts[letter] = _get(letter)
    return prompts

def get_numbers_prompts(profile: ChildProfile, specific_number: Optional[str] = None, custom_word: Optional[str] = None, custom_scene: Optional[str] = None):
    """
    If specific_number is provided, returns prompt for that number.
    Otherwise, returns prompts for all numbers.
    """
    def _get(number: str):
        return generate_number_prompt(
            name=profile.name,
            age=profile.age,
            language=profile.language,
            gender=profile.gender,
            skin_tone=profile.skin_tone,
            hair_color=profile.hair_color,
            hair_style=profile.hair_style,
            eye_color=profile.eye_color,
            outfit_color=profile.outfit_color,
            number=number,
            style=profile.style,
            lighting=profile.lighting,
            custom_word=custom_word,
            custom_scene=custom_scene,
        )
        
    if specific_number:
        return _get(specific_number)
        
    prompts = {}
    for item in NUMBERS_DATA:
        number = item["l"]
        prompts[number] = _get(number)
    return prompts
