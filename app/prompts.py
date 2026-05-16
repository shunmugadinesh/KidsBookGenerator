# app/prompts.py
from .data import LETTERS_DATA


def generate_prompt(
    name: str,
    age: int,
    language: str,
    gender: str,
    skin_tone: str,
    hair_color: str,
    hair_style: str,
    eye_color: str,
    outfit_color: str,
    letter: str,
):
    letter_data = next(
        (item for item in LETTERS_DATA if item["l"] == letter.upper()), None
    )
    if not letter_data:
        return f"Letter {letter} not found."

    word = letter_data["word"]
    scene = letter_data["scene"]

    prompt = f"""{name}, a {age}-year-old {gender} with {skin_tone} skin, {hair_color} {hair_style} hair, {eye_color} eyes, chubby cute cheeks, cheerful joyful expression, wearing a {outfit_color} outfit with small playful patterns.

Rendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.

{scene}.

Letter "{letter.upper()}" for {word}. Centered full-body or 3/4 body composition, clean soft pastel background with subtle {word.lower()}-themed color wash, single large glowing letter "{letter.upper()}" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.

The word "{word}" should appear as the label text below the scene in {language} script — large, bold, rounded, child-friendly font style.

NEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted"""

    return prompt
