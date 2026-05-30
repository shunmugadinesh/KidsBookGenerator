from crewai import Task

# ---------------------------------------------------------------------------
# Habit Book Tasks (Phase 1-3 — preserved unchanged)
# ---------------------------------------------------------------------------

class HabitTasks:
    def __init__(self, chart_title: str):
        self.chart_title = chart_title

    def plan_scenes_task(self, agent, total_scenes: int):
        return Task(
            description=f"""Plan {total_scenes} short scenes for a kids habit training book titled "{self.chart_title}".
            Each scene must be 1 short sentence describing a simple action a toddler does.
            Output ONLY a JSON list of {total_scenes} strings.""",
            agent=agent,
            expected_output=f"A JSON list of exactly {total_scenes} short scene strings."
        )

    def character_sheet_task(self, agent, profile_str: str):
        """
        NEW — Phase 3.
        Generates a canonical character sheet ONCE per project.
        Saved to PostgreSQL and reused on every page prompt for consistency.
        """
        return Task(
            description=f"""Create a canonical character sheet for the child protagonist of the book titled "{self.chart_title}".

            Child Profile:
            {profile_str}

            Output ONLY a JSON object with exactly these 8 keys:
            - "name": the child's name from the profile
            - "age_desc": e.g. "3-year-old"
            - "gender": from the profile
            - "skin_tone": from the profile
            - "hair": combine hair_color + hair_style from profile (e.g. "black short curly hair")
            - "eyes": eye_color from profile (e.g. "dark brown eyes")
            - "outfit": outfit_color + clothing description — ALWAYS include "oversized T-shirt and colorful training shorts, fully clothed"
            - "art_style": copy the style value from the profile exactly

            Rules:
            - Do NOT invent any visual details not in the profile
            - This output will be copy-pasted into every image prompt — make it precise and self-contained
            """,
            agent=agent,
            expected_output="A JSON object with exactly 8 keys: name, age_desc, gender, skin_tone, hair, eyes, outfit, art_style."
        )

    def consistency_task(self, agent, profile_str: str):
        return Task(
            description=f"""Translate the following Child Profile into a visual description for a kids illustration book.

            Child Profile:
            {profile_str}

            Project: "{self.chart_title}"

            Output ONLY a JSON object with exactly these 7 keys:
            - "subject": full visual description of the child (age, gender, skin tone, hair, outfit). ALWAYS append exactly ", wearing an oversized T-shirt and colorful training shorts, fully clothed" at the end.
            - "environment": a simple, colorful indoor or outdoor setting appropriate for the habit
            - "style": copy the style value from the profile exactly
            - "lighting": copy the lighting value from the profile exactly
            - "quality": exactly "HD printable, 4k, ultra detailed, storybook illustration quality, vibrant colours"
            - "negative_prompt": exactly "blurry, deformed, extra fingers, bad anatomy, dark, scary, adult content, nudity, bare skin, exposed body, toilet graphic, gross, inappropriate, violent"
            - "guidelines": exactly "Keep everything wholesome and toddler-safe. No nudity. No body exposure. No explicit toilet visuals. Use symbols like stars, sparkles, happy emojis, or cute potty icons instead of anything graphic. Toddler must wear an oversized T-shirt and colorful training shorts in every frame. HD printable quality. Make it positive, encouraging, and celebration-based with warm, vibrant colours."
            """,
            agent=agent,
            expected_output="A JSON object with exactly 7 keys: subject, environment, style, lighting, quality, negative_prompt, guidelines."
        )

    def story_page_task(self, agent, page_name: str, child_name: str, child_age: int, child_gender: str, full_outline: str, scenes_text: str):
        return Task(
            description=f"""Write the story text and visual scene details for {page_name} of the "{self.chart_title}" book.
                The child's name is {child_name}, who is a {child_age}-year-old {child_gender}. Use their name naturally in the story text.

                === CHRONOLOGICAL BOOK OUTLINE ===
                {full_outline}

                === CURRENT PAGE SCENE ===
                Page: {page_name}
                Scene(s): {scenes_text}

                Rules:
                - Write the narrative ONLY for the current page ({page_name}).
                - Keep the story sequence and flow flowing logically from the other pages in the CHRONOLOGICAL BOOK OUTLINE. Do not repeat actions, words, or details that occur on other pages.
                - Maximum 2 sentences for the story.
                - Use the child's name ({child_name}) only on Page 1.
                - Simple words a {child_age}-year-old understands.
                - Cheerful and encouraging tone.
                - Do NOT reference character appearance — that is handled elsewhere.
                
                Output ONLY a JSON object with exactly these 4 keys:
                - "story": 1-2 short, cheerful sentences for this page.
                - "action": write a highly descriptive, detailed visual prompt focusing purely on the physical action, body language, facial expression, and interaction with objects in the scene. Provide rich visual context so an image generator knows exactly what the character is doing. Always refer to the characters by their specific names (e.g. "{child_name}", and other characters present by name) instead of using pronouns like "they", "both", "them", or "it". Keep it wholesome and celebration-based.
                - "composition": describe the best camera angle, shot type, and composition based on the scene action (e.g., eye-level, slightly above, full body, close-up, dynamic angle)..
                - "details": 2-3 visual detail words for this scene plus exactly "stars, sparkles, cheerful celebration elements".
                """,
            agent=agent,
            expected_output=f"A JSON object with exactly 4 keys: story, action, composition, details."
        )

    def illustration_task(self, agent, page_name: str, scenes_text: str, consistency_block: str, character_sheet: str, context_tasks: list):
        """
        Re-enabled in Phase 3 — assembles the final image prompt using both
        the consistency block AND the new canonical character sheet.
        """
        return Task(
            description=f"""Assemble the final image prompt by combining the CHARACTER SHEET, CONSISTENCY DATA, and PAGE DETAILS.
                Do NOT invent anything. Format the output exactly as requested below.

                === CHARACTER SHEET (canonical — use verbatim) ===
                {character_sheet}

                === CONSISTENCY DATA ===
                {consistency_block}

                === PAGE DATA ===
                Page: {page_name}
                Scene(s): {scenes_text}

                === OUTPUT FORMAT (output ONLY these 10 lines, nothing else. DO NOT ask the AI to generate text inside the image.) ===
                SUBJECT: [character sheet subject — name, age_desc, gender, skin_tone, hair, eyes, outfit, art_style combined into one sentence]
                ACTION: [copy action value from Story Page Agent context]
                ENVIRONMENT: [copy ENVIRONMENT value from CONSISTENCY DATA]
                STYLE: [copy art_style from CHARACTER SHEET]
                LIGHTING: [copy LIGHTING value from CONSISTENCY DATA]
                COMPOSITION: [copy composition value from Story Page Agent context]
                DETAILS: [copy details value from Story Page Agent context]
                QUALITY: [copy QUALITY value from CONSISTENCY DATA]
                NEGATIVE_PROMPT: [copy NEGATIVE_PROMPT value from CONSISTENCY DATA]
                GUIDELINES: [copy GUIDELINES value from CONSISTENCY DATA]""",
            agent=agent,
            expected_output="Exactly 10 lines starting with SUBJECT, no extra text.",
            context=context_tasks
        )


# ---------------------------------------------------------------------------
# Rhyme Tasks (Phase 4)
# ---------------------------------------------------------------------------

class RhymeTasks:
    """
    Tasks for the Nursery Rhyme product pipeline.
    The key rule: rhyme text must NEVER be modified by the LLM.
    The planner assigns lines to pages; actual narration text comes verbatim
    from the split, not from any LLM generation.
    """
    def __init__(self, rhyme_title: str):
        self.rhyme_title = rhyme_title

    def plan_rhyme_pages_task(self, agent, rhyme_text: str, total_pages: int):
        """
        Ask the LLM to group lines into pages.
        The orchestrator will VERIFY the output and fall back to programmatic
        splitting if any word is altered.
        """
        return Task(
            description=f"""You are given the complete text of the nursery rhyme "{self.rhyme_title}".
            Your task is to divide it into exactly {total_pages} sequential page groups.

            === COMPLETE RHYME TEXT (treat this as sacred — do NOT modify a single word) ===
            {rhyme_text}

            Rules:
            - Output ONLY a JSON object where keys are "Page 1", "Page 2" ... "Page {total_pages}".
            - Each value is a string containing the exact original rhyme lines for that page.
            - Do NOT add, remove, rephrase, or reorder any word.
            - Each page must have at least 1 line. Distribute lines as evenly as possible.
            - Prefer grouping lines that rhyme together or form a logical couplet on the same page.

            Example output format:
            {{
              "Page 1": "Twinkle, twinkle, little star,\\nHow I wonder what you are!",
              "Page 2": "Up above the world so high,\\nLike a diamond in the sky."
            }}
            """,
            agent=agent,
            expected_output=f"A JSON object with exactly {total_pages} keys (Page 1 to Page {total_pages}), each containing verbatim rhyme lines."
        )

    def plan_rhyme_visual_sequence_task(self, agent, full_rhyme_plan: str, total_pages: int):
        """
        Creates a sequential visual narrative outline corresponding to the rhyme pages.
        """
        return Task(
            description=f"""You are a storyboard director for the nursery rhyme "{self.rhyme_title}".
            You have the text divided into {total_pages} pages. Your job is to plan the visual action sequence across these pages.

            === RHYME PAGE PLAN ===
            {full_rhyme_plan}

            Rules:
            - Create exactly {total_pages} visual scene summaries, one for each page.
            - Ensure a continuous, logical narrative sequence of actions from page 1 to the last page. The character should follow the actions in sequence.
            - Each summary should be 1 vividly descriptive sentence focusing on the physical action and setting.
            - Output ONLY a JSON list of exactly {total_pages} strings.
            """,
            agent=agent,
            expected_output=f"A JSON list of exactly {total_pages} sequential scene strings."
        )

    def rhyme_character_sheet_task(self, agent, profile_str: str, rhyme_char_desc: str):
        """Generates the visual character sheet for the rhyme protagonist(s)."""
        return Task(
            description=f"""Create a canonical character sheet for the visual protagonist(s) of the nursery rhyme "{self.rhyme_title}".

            Child Profile (use for art style, age-appropriate rendering):
            {profile_str}

            Rhyme Character Description:
            {rhyme_char_desc}

            Output ONLY a JSON object with exactly these keys:
            - "name": primary character name(s) in the rhyme
            - "age_desc": approximate age description (e.g. "toddler-sized")
            - "gender": from child profile
            - "skin_tone": from child profile
            - "hair": hair colour and style of the character
            - "eyes": eye colour and expression
            - "outfit": exact clothing including colours, style, must be fully clothed
            - "props": 1-2 signature props tied to this rhyme character (e.g. "a shiny silver pail")
            - "art_style": copy the style value from the profile exactly

            Rules:
            - Do NOT invent details beyond what is provided
            - Props must be consistent across every page featuring this character
            - This output will be reused on every page image prompt verbatim
            """,
            agent=agent,
            expected_output="A JSON object with exactly 9 keys: name, age_desc, gender, skin_tone, hair, eyes, outfit, props, art_style."
        )

    def rhyme_consistency_task(self, agent, profile_str: str, rhyme_theme: str, style_palette: str):
        """Generates the visual world / style guide for the rhyme book."""
        return Task(
            description=f"""Create a unified visual style guide for the nursery rhyme picture book "{self.rhyme_title}".

            Child Profile:
            {profile_str}

            Rhyme Theme: {rhyme_theme}
            Colour Palette Hints: {style_palette}

            Output ONLY a JSON object with exactly these 7 keys:
            - "environment_base": the primary setting of this rhyme (describe in 1 evocative sentence)
            - "style": copy the style value from the profile exactly
            - "lighting": describe the consistent lighting mood for this rhyme (e.g. "warm golden dusk light")
            - "colour_palette": 4-6 specific colours that define the visual world of this rhyme
            - "quality": exactly "HD printable, 4k, ultra detailed, storybook illustration quality, vibrant colours"
            - "negative_prompt": exactly "blurry, deformed, extra fingers, bad anatomy, dark, scary, adult content, nudity, bare skin, text overlay, watermark, logo"
            - "guidelines": exactly "Keep everything wholesome and toddler-safe. Vivid storybook colours. Character must remain visually consistent on every page. Soft depth-of-field backgrounds. HD printable quality."
            """,
            agent=agent,
            expected_output="A JSON object with exactly 7 keys: environment_base, style, lighting, colour_palette, quality, negative_prompt, guidelines."
        )

    def rhyme_page_visual_task(
        self, agent, page_name: str, page_lines: str,
        char_sheet_str: str, consistency_str: str,
        full_page_plan: str, scene_summary: str, page_index: int, total_pages: int
    ):
        """
        Generates the visual action, environment variant, composition, and props
        for a single rhyme page. The `story` field is the verbatim rhyme lines
        injected by the orchestrator — NOT generated by the LLM.
        """
        is_first = page_index == 1
        is_last = page_index == total_pages
        position_hint = "This is the opening page — set the scene and introduce the world." if is_first else (
            "This is the final page — provide a satisfying, joyful conclusion to the scene." if is_last else
            f"This is page {page_index} of {total_pages} — advance the scene naturally from the previous page."
        )

        return Task(
            description=f"""You are a storyboard artist creating a visual description for one page of the nursery rhyme "{self.rhyme_title}".

            === RHYME LINES FOR THIS PAGE (verbatim — do NOT rewrite) ===
            {page_lines}

            === CHARACTER SHEET ===
            {char_sheet_str}

            === VISUAL STYLE GUIDE ===
            {consistency_str}

            === FULL BOOK PAGE PLAN (for sequential context) ===
            {full_page_plan}

            === THIS PAGE ===
            {page_name} ({position_hint})
            Planned Action Sequence for this page: {scene_summary}

            Your task:
            1. Read the rhyme lines and the Planned Action Sequence carefully.
            2. Describe the scene visually with specific props, gestures, and expressions that EXACTLY match the Planned Action Sequence.
            3. Choose an environment variant that fits THIS page's moment in the rhyme story.
            4. Pick a unique prop or environment element not used on previous pages.
            5. Suggest the best camera composition for this scene.

            Output ONLY a JSON object with exactly these 5 keys:
            - "action": rich visual description of what the character is physically doing in this exact moment (2-3 sentences, very specific). Always refer to the characters by their specific names (from the character sheet, e.g. "Humpty Dumpty", and other characters by name) instead of using pronouns like "they", "both", "them", or "it".
            - "environment": specific environment for THIS page (must differ from adjacent pages in at least one detail — different time of day, prop placement, distance, or location sub-area)
            - "unique_element": 1 unique prop, lighting effect, or environment detail introduced ONLY on this page to create visual variety
            - "composition": best camera angle and shot type for this scene (e.g. "low angle wide shot looking up at the spider climbing")
            - "details": 3-4 specific visual detail words for this scene (not generic, tied to the rhyme content)
            """,
            agent=agent,
            expected_output="A JSON object with exactly 5 keys: action, environment, unique_element, composition, details."
        )


# ---------------------------------------------------------------------------
# Story Tasks (Phase 4)
# ---------------------------------------------------------------------------

class StoryTasks:
    """
    Tasks for the Creative Story product pipeline.
    Stories have a custom topic, full narrative arc, and per-page visual variety.
    """
    def __init__(self, story_title: str):
        self.story_title = story_title

    def plan_story_scenes_task(self, agent, story_prompt: str, total_pages: int):
        """Produces a sequential, logical scene outline for the whole story."""
        return Task(
            description=f"""Plan a complete {total_pages}-page toddler story book titled "{self.story_title}".

            Story Concept:
            {story_prompt}

            Rules:
            - Create exactly {total_pages} scene summaries forming a complete narrative arc.
            - Page 1: Introduce the character and their world (setting + mood).
            - Pages 2 to {total_pages - 1}: Progressive adventure / discovery / problem-solving. Each page must advance the plot with a new visual location, object, or emotional beat. No two scenes may use the same setting or action.
            - Page {total_pages}: A joyful, satisfying resolution or celebration.
            - Each scene must be 1 vivid sentence describing a unique, illustratable moment.
            - Scenes must be sequential and causal — each page logically follows from the previous.

            Output ONLY a JSON list of exactly {total_pages} strings (one scene per page, in order).
            """,
            agent=agent,
            expected_output=f"A JSON list of exactly {total_pages} sequential scene strings."
        )

    def story_character_sheet_task(self, agent, profile_str: str, story_prompt: str):
        """Creates the canonical visual identity for the story protagonist."""
        return Task(
            description=f"""Create a canonical character sheet for the child protagonist of the story "{self.story_title}".

            Child Profile:
            {profile_str}

            Story Concept:
            {story_prompt}

            Output ONLY a JSON object with exactly these 8 keys:
            - "name": character name (from profile or story)
            - "age_desc": e.g. "3-year-old"
            - "gender": from profile
            - "skin_tone": from profile
            - "hair": hair colour and style (from profile)
            - "eyes": eye colour (from profile)
            - "outfit": clothing appropriate to the story theme — fully clothed, colourful, toddler-safe
            - "art_style": copy the style value from the profile exactly

            Rules:
            - Do NOT invent details not in the profile
            - The outfit must be specific enough to be reproduced exactly on every page
            - This is reused verbatim in every image prompt
            """,
            agent=agent,
            expected_output="A JSON object with exactly 8 keys: name, age_desc, gender, skin_tone, hair, eyes, outfit, art_style."
        )

    def story_consistency_task(self, agent, profile_str: str, story_prompt: str):
        """Generates the visual style guide and world-building rules for the story."""
        return Task(
            description=f"""Create a unified visual style guide for the toddler story "{self.story_title}".

            Child Profile:
            {profile_str}

            Story Concept:
            {story_prompt}

            Output ONLY a JSON object with exactly these 7 keys:
            - "world_palette": 4-6 core colours that define the visual world of this story
            - "style": copy the style value from the profile exactly
            - "lighting": describe the dominant lighting mood for this story (e.g. "warm afternoon sunlight filtering through leaves")
            - "recurring_elements": 2-3 visual motifs or props that recur across the whole story to create cohesion (e.g. "sparkly magic backpack, friendly woodland creatures")
            - "quality": exactly "HD printable, 4k, ultra detailed, storybook illustration quality, vibrant colours"
            - "negative_prompt": exactly "blurry, deformed, extra fingers, bad anatomy, dark, scary, adult content, nudity, text overlay, watermark, logo"
            - "guidelines": exactly "Keep everything wholesome and toddler-safe. Each page must introduce a new unique prop or environment detail. Character must be visually identical across all pages. Vibrant, joyful colours. HD printable quality."
            """,
            agent=agent,
            expected_output="A JSON object with exactly 7 keys: world_palette, style, lighting, recurring_elements, quality, negative_prompt, guidelines."
        )

    def story_page_task(
        self, agent, page_name: str,
        child_name: str, child_age: int, child_gender: str,
        full_outline: str, scene_summary: str,
        page_index: int, total_pages: int
    ):
        """Writes the narrative text and visual action for one story page."""
        is_first = page_index == 1
        is_last = page_index == total_pages
        position_hint = "Opening page — introduce the character by name and their world." if is_first else (
            "Final page — wrap up the story with joy and celebration." if is_last else
            f"Middle page {page_index} of {total_pages} — advance the plot from page {page_index-1}."
        )

        return Task(
            description=f"""Write the story text and visual scene details for {page_name} of the story "{self.story_title}".

            Child: {child_name}, {child_age}-year-old {child_gender}.

            === FULL STORY OUTLINE (all pages, for continuity) ===
            {full_outline}

            === THIS PAGE ===
            Page: {page_name}
            Scene Summary: {scene_summary}
            Position: {position_hint}

            Rules:
            - Write ONLY for this page — do NOT repeat content from other pages.
            - Maximum 2 sentences. Simple toddler vocabulary. Cheerful tone.
            - Use the child's name only on Page 1.
            - The narrative must match the scene summary provided.
            - Each page's action must be clearly different from all other pages.

            Output ONLY a JSON object with exactly these 4 keys:
            - "story": 1-2 short, cheerful narrative sentences for this page.
            - "action": rich visual description of the physical action happening (body language, props, expression) — 2 sentences specific to this scene. Always refer to the characters by their specific names (from the character sheet, e.g. "{child_name}", and other characters present by name) instead of using pronouns like "they", "both", "them", or "it".
            - "composition": best camera angle and shot type for this scene.
            - "details": 3-4 visual detail words tied specifically to this scene.
            """,
            agent=agent,
            expected_output="A JSON object with exactly 4 keys: story, action, composition, details."
        )

    def story_scene_detail_task(
        self, agent, page_name: str, scene_summary: str,
        consistency_str: str, full_outline: str,
        page_index: int, total_pages: int,
        context_tasks: list
    ):
        """
        Enriches the page with a unique environment variant, specific props,
        and visual elements to prevent repetition across pages.
        """
        return Task(
            description=f"""Enrich the visual scene for {page_name} of the story "{self.story_title}" with unique environment and prop details.

            === FULL STORY OUTLINE ===
            {full_outline}

            === VISUAL STYLE GUIDE ===
            {consistency_str}

            === THIS PAGE SCENE ===
            Page: {page_name} (page {page_index} of {total_pages})
            Scene Summary: {scene_summary}

            Rules:
            - Choose an environment SPECIFIC to this page that differs from adjacent pages.
            - Introduce at least 1 unique prop or environment detail not present on other pages.
            - The environment must logically match the scene summary.
            - Provide detailed depth cues (foreground / midground / background elements).

            Output ONLY a JSON object with exactly these 4 keys:
            - "environment": specific environment for this page (include 2-3 distinctive visual details)
            - "unique_element": 1 new prop, lighting effect, or detail exclusive to this page
            - "depth_cues": foreground, midground, background elements to create visual depth
            - "mood_lighting": specific lighting for this exact scene moment (can vary from the overall story lighting if the scene warrants it)
            """,
            agent=agent,
            expected_output="A JSON object with exactly 4 keys: environment, unique_element, depth_cues, mood_lighting.",
            context=context_tasks
        )

class AlphabetTasks:
    def customization_task(self, agent, item: str, word: str):
        return Task(
            description=f"""The user wants to customize the alphabet or number book page for "{item}".
            They want the word for this page to be "{word}".

            Generate a visual scene description and a fun toddler-friendly fact for this word.
            The visual scene should feature a young child reacting to or playing with the item ({word}).
            
            Rules:
            - The scene description should be 1-2 sentences of vivid visual action.
            - The fact should be 1 short, fun, educational sentence about {word}.
            - Output ONLY a valid JSON object with keys "scene" and "fact".
            """,
            agent=agent,
            expected_output="A JSON object with exactly 2 keys: scene, fact."
        )

