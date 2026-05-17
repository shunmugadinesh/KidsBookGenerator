import json
import re
import concurrent.futures
from crewai import Crew, Process
from app.crew_ai.agents import HabitAgents
from app.crew_ai.tasks import HabitTasks
from app.utils.prompts import text_to_image_prompt

class HabitChartOrchestrator:
    def __init__(self, chart_title, total_scenes=3, total_pages=3, child_profile=None, text_model='ollama'):
        self.chart_title = chart_title
        self.total_scenes = total_scenes
        self.total_pages = total_pages
        if self.total_pages > self.total_scenes:
            self.total_pages = self.total_scenes
            
        self.child_profile = child_profile or {
            "name": "rithvin", "age": 3, "language": "english", "gender": "boy",
            "skin_tone": "fair skin", "hair_color": "black", "hair_style": "short curly",
            "eye_color": "dark brown", "outfit_color": "bright red",
            "style": "Pixar-style illustration", "lighting": "soft lighting"
        }
        
        self.agents_factory = HabitAgents(text_model)
        self.tasks_factory = HabitTasks(chart_title)
        
        self.planner_agent = self.agents_factory.planner_agent()
        self.consistency_agent = self.agents_factory.consistency_agent()
        self.story_page_agent = self.agents_factory.story_page_agent()

    def _setup(self):
        """Runs planning + consistency agents. Returns (pages_data, consistency_data)."""
        task_plan = self.tasks_factory.plan_scenes_task(self.planner_agent, self.total_scenes)
        crew_plan = Crew(agents=[self.planner_agent], tasks=[task_plan], verbose=True)
        plan_result = str(crew_plan.kickoff())

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

        profile_str = "\n".join([f"  {k}: {v}" for k, v in self.child_profile.items()])

        task_consistency = self.tasks_factory.consistency_task(self.consistency_agent, profile_str)
        crew_consistency = Crew(agents=[self.consistency_agent], tasks=[task_consistency], verbose=True)
        consistency_result = str(crew_consistency.kickoff())

        try:
            json_match = re.search(r'\{.*\}', consistency_result, re.DOTALL)
            consistency_data = json.loads(json_match.group(0)) if json_match else json.loads(consistency_result)
        except Exception:
            cp = self.child_profile
            consistency_data = {
                "subject": f"{cp.get('age', 3)}-year-old {cp.get('gender', 'boy')} named {cp.get('name', '')} with {cp.get('skin_tone', '')} skin, {cp.get('hair_style', '')} {cp.get('hair_color', '')} hair, wearing {cp.get('outfit_color', '')} outfit, wearing an oversized T-shirt and colorful training shorts, fully clothed",
                "environment": "bright, colorful playroom",
                "style": cp.get("style", "Pixar-style illustration"),
                "lighting": cp.get("lighting", "soft lighting"),
                "quality": "HD printable, 4k, ultra detailed, storybook illustration quality, vibrant colours",
                "negative_prompt": "blurry, deformed, extra fingers, bad anatomy, dark, scary, adult content, nudity, bare skin, exposed body, toilet graphic, gross, inappropriate, violent",
                "guidelines": "Keep everything wholesome and toddler-safe. No nudity. No body exposure. No explicit toilet visuals. Use symbols like stars, sparkles, happy emojis, or cute potty icons instead of anything graphic. Toddler must wear an oversized T-shirt and colorful training shorts in every frame. HD printable quality. Make it positive, encouraging, and celebration-based with warm, vibrant colours."
            }

        pages_data = {}
        scenes_per_page = self.total_scenes // self.total_pages
        remainder = self.total_scenes % self.total_pages
        start_idx = 0
        for i in range(self.total_pages):
            count = scenes_per_page + (1 if i < remainder else 0)
            pages_data[f"Page {i+1}"] = scenes_list[start_idx : start_idx + count]
            start_idx += count

        return pages_data, consistency_data

    def _process_page(self, page_name, p_scenes, consistency_data, full_outline):
        scenes_text = " | ".join(p_scenes)
        child_name = self.child_profile.get('name', 'the child').capitalize()
        child_age = self.child_profile.get('age', 3)
        child_gender = self.child_profile.get('gender', 'boy')

        task_story = self.tasks_factory.story_page_task(
            self.story_page_agent,
            page_name,
            child_name,
            child_age,
            child_gender,
            full_outline,
            scenes_text
        )

        page_crew = Crew(
            agents=[self.story_page_agent],
            tasks=[task_story],
            process=Process.sequential,
            verbose=False
        )
        page_crew.kickoff()

        story_raw = str(task_story.output.raw) if task_story.output and hasattr(task_story.output, 'raw') else ""
        story_data = {}
        try:
            json_match = re.search(r'\{.*\}', story_raw, re.DOTALL)
            story_data = json.loads(json_match.group(0)) if json_match else json.loads(story_raw)
            story_text = story_data.get("story", "")
        except Exception:
            story_text = story_raw
            story_data = {
                "action": p_scenes[0] if p_scenes else self.chart_title,
                "composition": "eye-level, full body",
                "details": "stars, sparkles, cheerful celebration elements"
            }

        # Utilize our reusable prompts organizer method
        prompt_text = text_to_image_prompt(consistency_data, story_data)

        return page_name, {
            "story": story_text.strip() if isinstance(story_text, str) else str(story_text),
            "engagement": "",
            "prompt": prompt_text.strip()
        }

    def run_stream(self):
        pages_data, consistency_data = self._setup()
        if not pages_data:
            return

        def get_page_num(key):
            try:
                return int(key.split()[1])
            except ValueError:
                return 0

        sorted_keys = sorted(pages_data.keys(), key=get_page_num)
        full_outline = "\n".join([f"- {k}: {' | '.join(pages_data[k])}" for k in sorted_keys])

        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            future_to_page = {
                executor.submit(self._process_page, page_name, p_scenes, consistency_data, full_outline): page_name
                for page_name, p_scenes in pages_data.items()
            }
            for future in concurrent.futures.as_completed(future_to_page):
                res = future.result()
                if res and res[1] is not None:
                    yield res
