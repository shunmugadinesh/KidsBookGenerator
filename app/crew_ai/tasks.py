from crewai import Task

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
                - Use the child's name ({child_name}) only if needed.
                - Simple words a {child_age}-year-old understands.
                - Cheerful and encouraging tone.
                - Do NOT reference character appearance — that is handled elsewhere.
                
                Output ONLY a JSON object with exactly these 4 keys:
                - "story": 1-2 short, cheerful sentences for this page.
                - "action": write a highly descriptive, detailed visual prompt focusing purely on the physical action, body language, facial expression, and interaction with objects in the scene. Provide rich visual context so an image generator knows exactly what the character is doing. Keep it wholesome and celebration-based.
                - "composition": describe the best camera angle, shot type, and composition based on the scene action (e.g., eye-level, slightly above, full body, close-up, dynamic angle).
                - "details": 2-3 visual detail words for this scene plus exactly "stars, sparkles, cheerful celebration elements".
                """,
            agent=agent,
            expected_output=f"A JSON object with exactly 4 keys: story, action, composition, details."
        )

#     def illustration_task(self, agent, page_name: str, scenes_text: str, consistency_block: str, context_tasks: list):
#         return Task(
#             description=f"""Assemble the final image prompt by combining the CONSISTENCY DATA and the PAGE DETAILS provided by the Story Page Agent.
#                 Do NOT invent anything. Format the output exactly as requested below.
# 
#                 === CONSISTENCY DATA ===
#                 {consistency_block}
# 
#                 === PAGE DATA ===
#                 Page: {page_name}
#                 Scene(s): {scenes_text}
# 
#                 === OUTPUT FORMAT (output ONLY these 10 lines, nothing else. DO NOT ask the AI to generate text inside the image.) ===
#                 SUBJECT: [copy CHARACTER value from CONSISTENCY DATA]
#                 ACTION: [copy action value from Story Page Agent context]
#                 ENVIRONMENT: [copy ENVIRONMENT value from CONSISTENCY DATA]
#                 STYLE: [copy STYLE value from CONSISTENCY DATA]
#                 LIGHTING: [copy LIGHTING value from CONSISTENCY DATA]
#                 COMPOSITION: [copy composition value from Story Page Agent context]
#                 DETAILS: [copy details value from Story Page Agent context]
#                 QUALITY: [copy QUALITY value from CONSISTENCY DATA]
#                 NEGATIVE_PROMPT: [copy NEGATIVE_PROMPT value from CONSISTENCY DATA]
#                 GUIDELINES: [copy GUIDELINES value from CONSISTENCY DATA]""",
#             agent=agent,
#             expected_output="Exactly 10 lines starting with SUBJECT, no extra text.",
#             context=context_tasks
#         )
