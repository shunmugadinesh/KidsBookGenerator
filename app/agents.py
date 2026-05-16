from crewai import Agent, Task, Crew, Process
from crewai.llm import LLM
import os
import json
import re
import concurrent.futures
from dotenv import load_dotenv

load_dotenv()

def build_llm(model_provider: str = 'ollama') -> LLM:
    if model_provider == 'openrouter':
        return LLM(
            model=os.getenv('OPENROUTER_MODEL', 'openrouter/google/gemma-2-9b-it:free'),
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv('OPENROUTER_API_KEY', '')
        )
    return LLM(
        model=os.getenv('OLLAMA_MODEL', 'qwen3:1.7b'),
        base_url=os.getenv('OLLAMA_BASE_URL', 'http://host.docker.internal:11434')
    )

class HabitChartCrew:
    def __init__(self, chart_title, total_scenes=4, total_pages=4, child_profile=None, text_model='ollama'):
        self.chart_title = chart_title
        self.total_scenes = total_scenes
        self.total_pages = total_pages
        if self.total_pages > self.total_scenes:
            self.total_pages = self.total_scenes
        self.llm = build_llm(text_model)

        # Default Child Profile — overridden by UI when provided
        self.child_profile = child_profile or {
            "name": "rithvin",
            "age": 3,
            "language": "english",
            "gender": "boy",
            "skin_tone": "fair skin",
            "hair_color": "black",
            "hair_style": "short curly",
            "eye_color": "dark brown",
            "outfit_color": "bright red",
            "style": "Pixar-style illustration",
            "lighting": "soft lighting"
        }

    def create_agents(self):
        # Agent 1 — Plans the scene structure only
        self.planner_agent = Agent(
            role='Planner Agent',
            goal='Create a clear, sequential list of scenes for a kids habit book.',
            backstory='You plan short, simple scene descriptions for toddler habit training books. Keep each scene to 1 short sentence.',
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

        # Agent 2 — Locks in visual consistency from the child profile
        self.consistency_agent = Agent(
            role='Character and Style Consistency Agent',
            goal='Define the fixed visual identity of the character and scene style using the child profile.',
            backstory='You translate a child profile into a visual description used consistently across all pages. You do not invent — you translate the profile into visual terms.',
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

        # Agent 3 — Writes 1-2 line kid-friendly scene text per page
        self.story_page_agent = Agent(
            role='Story Page Agent',
            goal='Write 1-2 simple, fun sentences describing what happens on this page. Keep it short and toddler-friendly.',
            backstory='You write very short, cheerful scene text for toddler books. Maximum 2 sentences. No long paragraphs.',
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

        # Agent 4 — Suggests 1-2 simple interactive activities per page
        self.engagement_agent = Agent(
            role='Engagement Activity Agent',
            goal='Suggest 1-2 simple, fun activities for the child based on the scene.',
            backstory='You create minimal, clear engagement prompts for toddlers. Examples: "Place a sticker!", "Say I did it!", "Circle the potty", "Give a thumbs up!".',
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

        # Agent 5 — Assembles the final structured image prompt
        self.illustration_agent = Agent(
            role='Illustration Prompt Agent',
            goal='Assemble the final structured image prompt using the consistency data, scene text, and engagement details.',
            backstory='You are a prompt engineer. You assemble image prompts by filling in a fixed template using details provided to you. You do not invent — you fill in the blanks.',
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def _setup(self):
        """Runs planning + consistency agents. Returns (pages_data, consistency_block)."""
        self.create_agents()

        # ── Agent 1: Plan scenes ──────────────────────────────────────────────
        task_plan = Task(
            description=f"""Plan {self.total_scenes} short scenes for a kids habit training book titled "{self.chart_title}".
            Each scene must be 1 short sentence describing a simple action a toddler does.
            Output ONLY a JSON list of {self.total_scenes} strings.""",
            agent=self.planner_agent,
            expected_output=f"A JSON list of exactly {self.total_scenes} short scene strings."
        )

        crew_plan = Crew(agents=[self.planner_agent], tasks=[task_plan], verbose=True)
        plan_result = str(crew_plan.kickoff())

        # Parse scenes
        scenes_list = []
        try:
            json_match = re.search(r'\[.*\]', plan_result, re.DOTALL)
            raw_data = json.loads(json_match.group(0)) if json_match else json.loads(plan_result)
            if isinstance(raw_data, list):
                for item in raw_data:
                    if isinstance(item, dict):
                        val = item.get('scene') or item.get('description') or next(iter(item.values()), str(item))
                        scenes_list.append(str(val))
                    else:
                        scenes_list.append(str(item))
            else:
                scenes_list = [str(raw_data)]
        except Exception:
            scenes_list = [line.strip() for line in plan_result.split('\n') if line.strip() and len(line) > 5]

        scenes_list = scenes_list[:self.total_scenes]
        if len(scenes_list) < self.total_scenes:
            scenes_list.extend([f"Scene {i+1}: {self.chart_title}" for i in range(len(scenes_list), self.total_scenes)])

        # Build a human-readable profile string for Agent 2
        profile_str = "\n".join([f"  {k}: {v}" for k, v in self.child_profile.items()])

        # ── Agent 2: Lock visual consistency ─────────────────────────────────
        task_consistency = Task(
            description=f"""Translate the following Child Profile into a visual description for a kids illustration book.

            Child Profile:
            {profile_str}

            Project: "{self.chart_title}"

            Output ONLY a JSON object with exactly these 6 keys:
            - "subject": full visual description of the child (age, gender, skin tone, hair, outfit)
            - "environment": a simple, colorful indoor or outdoor setting appropriate for the habit
            - "style": copy the style value from the profile exactly
            - "lighting": copy the lighting value from the profile exactly
            - "details": 2-3 visual detail words (e.g. "soft textures, expressive face, clean background")
            - "negative prompt": "blurry, deformed, extra fingers, bad anatomy, dark, scary, adult content"
            """,
                agent=self.consistency_agent,
                expected_output="A JSON object with exactly 6 keys: subject, environment, style, lighting, details, negative prompt."
        )

        crew_consistency = Crew(agents=[self.consistency_agent], tasks=[task_consistency], verbose=True)
        consistency_result = str(crew_consistency.kickoff())

        try:
            json_match = re.search(r'\{.*\}', consistency_result, re.DOTALL)
            consistency_data = json.loads(json_match.group(0)) if json_match else json.loads(consistency_result)
        except Exception:
            cp = self.child_profile
            consistency_data = {
                "subject": f"{cp.get('age', 3)}-year-old {cp.get('gender', 'boy')} named {cp.get('name', '')} with {cp.get('skin_tone', '')} skin, {cp.get('hair_style', '')} {cp.get('hair_color', '')} hair, wearing {cp.get('outfit_color', '')} outfit",
                "environment": "bright, colorful playroom",
                "style": cp.get("style", "Pixar-style illustration"),
                "lighting": cp.get("lighting", "soft lighting"),
                "details": "soft textures, expressive face, clean background",
                "negative prompt": "blurry, deformed, extra fingers, bad anatomy, dark, scary, adult content"
            }

        # Pagination
        pages_data = {}
        scenes_per_page = self.total_scenes // self.total_pages
        remainder = self.total_scenes % self.total_pages
        start_idx = 0
        for i in range(self.total_pages):
            count = scenes_per_page + (1 if i < remainder else 0)
            pages_data[f"Page {i+1}"] = scenes_list[start_idx : start_idx + count]
            start_idx += count

        consistency_block = (
            f"CHARACTER: {consistency_data.get('subject', '')}\n"
            f"ENVIRONMENT: {consistency_data.get('environment', '')}\n"
            f"STYLE: {consistency_data.get('style', '')}\n"
            f"LIGHTING: {consistency_data.get('lighting', '')}\n"
            f"DETAILS: {consistency_data.get('details', '')}\n"
            f"NEGATIVE PROMPT: {consistency_data.get('negative prompt', '')}"
        )

        return pages_data, consistency_block

    def _process_page(self, page_name, p_scenes, consistency_block, full_outline):
        """Processes a single page and returns (page_name, page_data dict)."""
        scenes_text = " | ".join(p_scenes)
        child_name = self.child_profile.get('name', 'the child').capitalize()

        # Agent 3: Personalised 1-2 sentence story narrative with sequencing
        task_story = Task(
            description=f"""Write 1-2 short, cheerful sentences for {page_name} of the "{self.chart_title}" book.
                The child's name is {child_name}. Use their name naturally in the sentence.

                === CHRONOLOGICAL BOOK OUTLINE ===
                {full_outline}

                === CURRENT PAGE SCENE ===
                Page: {page_name}
                Scene(s): {scenes_text}

                Rules:
                - Write the narrative ONLY for the current page ({page_name}).
                - Keep the story sequence and flow flowing logically from the other pages in the CHRONOLOGICAL BOOK OUTLINE. Do not repeat actions, words, or details that occur on other pages.
                - Maximum 2 sentences.
                - Use the child's name ({child_name}) only if needed.
                - Simple words a 3-year-old understands.
                - Cheerful and encouraging tone.
                - Do NOT reference character appearance — that is handled elsewhere.
                - Output ONLY the 1-2 sentences. Do NOT include any prefixes, numbering, or conversational text.""",
            agent=self.story_page_agent,
            expected_output=f"Exactly 1-2 short, simple sentences matching the scene sequence. No conversational filler."
        )

        # Agent 4: Engagement activities (disabled — uncomment to re-enable)
        # task_engagement = Task(
        #     description=f"""Suggest 1-2 simple engagement activities for {page_name}.
        #     Scene(s): {scenes_text}
        #     Rules:
        #     - Maximum 2 bullet points
        #     - Each activity must be 1 short action phrase
        #     - Examples: "Place a gold star!", "Say I did it!", "Circle the potty", "Clap your hands!"
        #     - Activities must relate to the scene""",
        #     agent=self.engagement_agent,
        #     expected_output="1-2 short engagement activity phrases as bullet points.",
        #     context=[task_story]
        # )

        # Agent 5: Assemble the final image prompt
        task_illustration = Task(
            description=f"""Fill in the image prompt template below using ONLY the provided details.
                Do NOT invent anything. Copy values directly from the data given.

                === CONSISTENCY DATA (use exactly as-is) ===
                {consistency_block}

                === PAGE DATA ===
                Page: {page_name}
                Scene(s): {scenes_text}

                === OUTPUT FORMAT (output ONLY these 10 lines, nothing else. DO NOT ask the AI to generate text inside the image.) ===
                SUBJECT: [copy CHARACTER value from CONSISTENCY DATA exactly, word-for-word, without any omission, simplification, or rephrasing. Do not change a single word. Then append exactly: ", wearing an oversized T-shirt and colorful training shorts, fully clothed"]
                ACTION: [describe the action from the scene in 5-8 words, keeping it wholesome and celebration-based]
                ENVIRONMENT: [copy ENVIRONMENT value exactly]
                STYLE: [copy STYLE value exactly]
                LIGHTING: [copy LIGHTING value exactly]
                COMPOSITION: [describe the best camera angle, shot type, and composition based on the scene action (e.g., eye-level, slightly above, full body, close-up, dynamic angle)]
                DETAILS: [copy DETAILS value exactly, append "stars, sparkles, cheerful celebration elements"]
                QUALITY: [HD printable, 4k, ultra detailed, storybook illustration quality, vibrant colours]
                NEGATIVE_PROMPT: [copy NEGATIVE PROMPT value exactly, append "nudity, bare skin, exposed body, toilet graphic, gross, inappropriate, dark, violent, scary"]
                GUIDELINES: [Keep everything wholesome and toddler-safe. No nudity. No body exposure.
                No explicit toilet visuals. Use symbols like stars, sparkles, happy emojis, or cute potty icons instead of anything graphic.
                Toddler must wear an oversized T-shirt and colorful training shorts in every frame.
                HD printable quality.
                Make it positive, encouraging, and celebration-based with warm, vibrant colours.]""",
            agent=self.illustration_agent,
            expected_output="Exactly 10 lines starting with SUBJECT, no extra text.",
            context=[task_story]  # add task_engagement here when re-enabled
        )

        page_crew = Crew(
            agents=[self.story_page_agent, self.illustration_agent],
            tasks=[task_story, task_illustration],
            process=Process.sequential,
            verbose=False
        )
        page_crew.kickoff()

        story_text = str(task_story.output.raw) if task_story.output and hasattr(task_story.output, 'raw') else ""
        # engagement_text = str(task_engagement.output.raw) if task_engagement.output and hasattr(task_engagement.output, 'raw') else ""
        engagement_text = ""  # task_engagement disabled — re-enable above line when needed
        prompt_text = str(task_illustration.output.raw) if task_illustration.output and hasattr(task_illustration.output, 'raw') else ""

        return page_name, {
            "story": story_text.strip(),
            "engagement": engagement_text,
            "prompt": prompt_text.strip()
        }

    def run_stream(self):
        """Generator: yields (page_name, page_data) as each page finishes — enables real-time UI progress."""
        pages_data, consistency_block = self._setup()

        def get_page_num(key):
            try:
                return int(key.split()[1])
            except ValueError:
                return 0

        sorted_keys = sorted(pages_data.keys(), key=get_page_num)
        full_outline = "\n".join([f"- {k}: {' | '.join(pages_data[k])}" for k in sorted_keys])

        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            future_to_page = {
                executor.submit(self._process_page, page_name, p_scenes, consistency_block, full_outline): page_name
                for page_name, p_scenes in pages_data.items()
            }
            for future in concurrent.futures.as_completed(future_to_page):
                yield future.result()  # (page_name, page_data)

    def run(self):
        """Backward-compatible: runs everything and returns JSON string of all pages."""
        pages_data, consistency_block = self._setup()
        final_prompts = {}

        def get_page_num(key):
            try:
                return int(key.split()[1])
            except ValueError:
                return 0

        sorted_keys = sorted(pages_data.keys(), key=get_page_num)
        full_outline = "\n".join([f"- {k}: {' | '.join(pages_data[k])}" for k in sorted_keys])

        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            future_to_page = {
                executor.submit(self._process_page, page_name, p_scenes, consistency_block, full_outline): page_name
                for page_name, p_scenes in pages_data.items()
            }
            for future in concurrent.futures.as_completed(future_to_page):
                page_name, page_result = future.result()
                final_prompts[page_name] = page_result

        sorted_final_prompts = {k: final_prompts[k] for k in sorted(final_prompts.keys(), key=get_page_num)}
        return json.dumps(sorted_final_prompts)

