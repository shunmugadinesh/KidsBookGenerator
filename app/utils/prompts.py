from app.resources.data import LETTERS_DATA

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


def text_to_image_prompt(consistency_data: dict, story_data: dict) -> str:
    """
    Constructs a structured text-to-image prompt from the consistency data and page specific story details.
    Supports dynamic mapping and nesting resolution across all book types (Habit, Rhymes, Story).
    """
    # 1. Unnest dictionaries in consistency_data if they are wrapped in sub-keys
    flat_consistency = {}
    if isinstance(consistency_data, dict):
        for k, v in consistency_data.items():
            if not isinstance(v, dict):
                flat_consistency[k] = v
        for wrapper in ["char_sheet", "character_sheet", "style_guide"]:
            if wrapper in consistency_data and isinstance(consistency_data[wrapper], dict):
                for k, v in consistency_data[wrapper].items():
                    if k not in flat_consistency or not flat_consistency[k]:
                        flat_consistency[k] = v

    # 2. Unnest dictionaries in story_data if they are wrapped in sub-keys
    flat_story = {}
    if isinstance(story_data, dict):
        for k, v in story_data.items():
            if not isinstance(v, dict):
                flat_story[k] = v
        for wrapper in ["scene_data", "detail_data", "story_data"]:
            if wrapper in story_data and isinstance(story_data[wrapper], dict):
                for k, v in story_data[wrapper].items():
                    if k not in flat_story or not flat_story[k]:
                        flat_story[k] = v

    # 3. Retrieve or construct subject (resolving double-comma formatting issues)
    subject = flat_consistency.get('subject') or ""
    if not subject or "character, ," in subject or subject.strip() == "character":
        name = flat_consistency.get('name', 'character')
        age = flat_consistency.get('age_desc') or flat_consistency.get('age', '')
        gender = flat_consistency.get('gender', '')
        skin = flat_consistency.get('skin_tone') or flat_consistency.get('skin', '')
        hair = flat_consistency.get('hair') or f"{flat_consistency.get('hair_color', '')} {flat_consistency.get('hair_style', '')}".strip()
        eyes = flat_consistency.get('eyes') or flat_consistency.get('eye_color', '')
        
        parts = [name, age, gender, skin, hair, eyes]
        subj_str = ", ".join([str(p).strip() for p in parts if p and str(p).strip()])
        outfit = flat_consistency.get('outfit') or flat_consistency.get('outfit_color', '')
        if outfit:
            subj_str += f", wearing {outfit}"
        props = flat_consistency.get('props') or ""
        if props:
            subj_str += f", with {props}"
        subject = subj_str

    # 4. Map fields with robust fallbacks
    action = flat_story.get('action') or ""
    environment = flat_consistency.get('environment') or flat_consistency.get('environment_base') or flat_story.get('environment') or ""
    style = flat_consistency.get('style') or flat_consistency.get('art_style') or ""
    lighting = flat_consistency.get('lighting') or flat_story.get('mood_lighting') or ""
    composition = flat_story.get('composition') or ""
    
    # Compose details list cleanly
    details = flat_story.get('details') or ""
    unique_el = flat_story.get('unique_element') or ""
    if unique_el and unique_el not in details:
        details = f"{details}; {unique_el}"

    quality = flat_consistency.get('quality') or "HD printable, 4k, ultra detailed"
    negative_prompt = flat_consistency.get('negative_prompt') or ""
    guidelines = flat_consistency.get('guidelines') or ""

    prompt_lines = [
        f"SUBJECT: {subject}",
        f"ACTION: {action}",
        f"ENVIRONMENT: {environment}",
        f"STYLE: {style}",
        f"LIGHTING: {lighting}",
        f"COMPOSITION: {composition}",
        f"DETAILS: {details}",
        f"QUALITY: {quality}",
        f"NEGATIVE_PROMPT: {negative_prompt}",
        f"GUIDELINES: {guidelines}"
    ]
    return "\n".join(prompt_lines).strip()
