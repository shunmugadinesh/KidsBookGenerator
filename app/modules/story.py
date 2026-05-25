"""
StoryOrchestrator — Phase 4
Handles the Creative Story product pipeline.

Design goals:
  - Sequential, causal scene flow across all pages
  - Per-page visual variety (unique environment, props, lighting)
  - Character visual consistency via character sheet
  - Unified style guide injected into every page prompt
  - Matching the same text_to_image_prompt interface as HabitChartOrchestrator
"""

import json
import re
import concurrent.futures
from crewai import Crew, Process

from app.crew_ai.agents import StoryAgents
from app.crew_ai.tasks import StoryTasks
from app.utils.prompts import text_to_image_prompt
from app.models.schemas import ChildProfile


class StoryOrchestrator:
    """
    Orchestrates the creative story book generation pipeline.

    Args:
        story_title:   The book title (e.g. "A Baby Bear Finds Honey")
        story_prompt:  1-3 sentence story concept / topic
        total_pages:   Number of pages to generate
        child_profile: Dict matching ChildProfile schema
        text_model:    'ollama' or 'openrouter'
    """
    def __init__(
        self,
        story_title: str,
        story_prompt: str,
        total_pages: int = 6,
        child_profile: dict | None = None,
        text_model: str = "ollama",
    ):
        self.story_title = story_title
        self.story_prompt = story_prompt
        self.total_pages = max(6, total_pages)
        default_profile = ChildProfile().model_dump()
        self.child_profile = default_profile.copy()
        if child_profile:
            self.child_profile.update({k: v for k, v in child_profile.items() if v is not None})
        self.text_model = text_model

        self.agents_factory = StoryAgents(text_model)
        self.tasks_factory = StoryTasks(story_title)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _profile_str(self) -> str:
        return "\n".join(f"  {k}: {v}" for k, v in self.child_profile.items())

    def _run_single_crew(self, agent, task) -> str:
        crew = Crew(agents=[agent], tasks=[task], process=Process.sequential, verbose=True)
        crew.kickoff()
        return str(task.output.raw) if task.output and hasattr(task.output, "raw") else ""

    def _parse_json(self, raw: str, fallback: dict) -> dict:
        try:
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            data = json.loads(match.group(0)) if match else json.loads(raw)
            parsed_data = None
            if isinstance(data, dict):
                for wrapper in ["char_sheet", "character_sheet", "style_guide", "scene_data", "detail_data", "scenes_data"]:
                    if wrapper in data and isinstance(data[wrapper], dict):
                        parsed_data = data[wrapper]
                        break
                if parsed_data is None:
                    parsed_data = data
                
                # Merge with fallback to ensure no missing keys
                result = fallback.copy()
                result.update(parsed_data)
                return result
            return fallback
        except Exception:
            return fallback

    def _parse_json_list(self, raw: str) -> list[str]:
        try:
            match = re.search(r"\[.*\]", raw, re.DOTALL)
            data = json.loads(match.group(0)) if match else json.loads(raw)
            if isinstance(data, list):
                result = []
                for item in data:
                    if isinstance(item, dict):
                        val = (item.get("scene") or item.get("description")
                               or next(iter(item.values()), str(item)))
                        result.append(str(val))
                    else:
                        result.append(str(item))
                return result
        except Exception:
            pass
        # Fallback: split by newlines
        return [line.strip() for line in raw.split("\n") if line.strip() and len(line) > 5]

    # ------------------------------------------------------------------
    # Setup: scene plan + character sheet + style guide
    # ------------------------------------------------------------------

    def _setup(self) -> tuple[dict[str, str], dict, dict]:
        """
        Returns:
          pages_data:   {page_name: scene_summary_string}
          char_sheet:   character sheet dict
          style_guide:  visual style / consistency dict
        """
        profile_str = self._profile_str()

        # 1. Scene plan
        planner_agent = self.agents_factory.story_planner_agent()
        plan_task = self.tasks_factory.plan_story_scenes_task(
            planner_agent, self.story_prompt, self.total_pages
        )
        plan_raw = self._run_single_crew(planner_agent, plan_task)
        scenes_list = self._parse_json_list(plan_raw)

        # Ensure we have exactly total_pages scenes
        scenes_list = scenes_list[:self.total_pages]
        while len(scenes_list) < self.total_pages:
            scenes_list.append(f"Scene {len(scenes_list) + 1} of the {self.story_title} story")

        pages_data = {f"Page {i+1}": scenes_list[i] for i in range(self.total_pages)}

        # 2. Character sheet
        char_agent = self.agents_factory.character_sheet_agent()
        char_task = self.tasks_factory.story_character_sheet_task(
            char_agent, profile_str, self.story_prompt
        )
        char_raw = self._run_single_crew(char_agent, char_task)
        cp = self.child_profile
        char_sheet = self._parse_json(char_raw, {
            "name": cp.get("name", "child"),
            "age_desc": f"{cp.get('age', 3)}-year-old",
            "gender": cp.get("gender", "child"),
            "skin_tone": cp.get("skin_tone", ""),
            "hair": f"{cp.get('hair_color', '')} {cp.get('hair_style', '')} hair",
            "eyes": cp.get("eye_color", ""),
            "outfit": f"colourful {cp.get('outfit_color', '')} storybook outfit, fully clothed",
            "art_style": cp.get("style", "Pixar-style illustration"),
        })

        # 3. Style guide / consistency
        style_agent = self.agents_factory.consistency_agent()
        style_task = self.tasks_factory.story_consistency_task(
            style_agent, profile_str, self.story_prompt
        )
        style_raw = self._run_single_crew(style_agent, style_task)
        style_guide = self._parse_json(style_raw, {
            "world_palette": "bright warm pastels, vibrant primary accents",
            "style": cp.get("style", "Pixar-style illustration"),
            "lighting": cp.get("lighting", "soft warm lighting"),
            "recurring_elements": "sparkly magic moments, friendly supporting characters",
            "quality": "HD printable, 4k, ultra detailed, storybook illustration quality, vibrant colours",
            "negative_prompt": "blurry, deformed, extra fingers, bad anatomy, dark, scary, adult content, nudity, text overlay, watermark, logo",
            "guidelines": "Keep everything wholesome and toddler-safe. Each page must introduce a new unique prop or environment detail. Character must be visually identical across all pages. Vibrant, joyful colours. HD printable quality.",
        })

        return pages_data, char_sheet, style_guide

    # ------------------------------------------------------------------
    # Per-page processing
    # ------------------------------------------------------------------

    def _build_full_outline(self, pages_data: dict[str, str]) -> str:
        sorted_keys = sorted(pages_data.keys(), key=lambda k: int(k.split()[1]) if len(k.split()) > 1 else 0)
        return "\n".join(f"- {k}: {pages_data[k]}" for k in sorted_keys)

    def _process_page(
        self,
        page_name: str,
        scene_summary: str,
        char_sheet: dict,
        style_guide: dict,
        full_outline: str,
        page_index: int,
    ) -> tuple[str, dict]:
        cp = self.child_profile
        child_name = cp.get("name", "the child").capitalize()
        child_age = cp.get("age", 3)
        child_gender = cp.get("gender", "child")

        style_str = json.dumps(style_guide, indent=2)

        # 1. Story page writer
        page_agent = self.agents_factory.story_page_agent()
        page_task = self.tasks_factory.story_page_task(
            agent=page_agent,
            page_name=page_name,
            child_name=child_name,
            child_age=child_age,
            child_gender=child_gender,
            full_outline=full_outline,
            scene_summary=scene_summary,
            page_index=page_index,
            total_pages=self.total_pages,
        )

        # 2. Scene detail enricher (depends on page task context)
        detail_agent = self.agents_factory.scene_detail_agent()
        detail_task = self.tasks_factory.story_scene_detail_task(
            agent=detail_agent,
            page_name=page_name,
            scene_summary=scene_summary,
            consistency_str=style_str,
            full_outline=full_outline,
            page_index=page_index,
            total_pages=self.total_pages,
            context_tasks=[page_task],
        )

        crew = Crew(
            agents=[page_agent, detail_agent],
            tasks=[page_task, detail_task],
            process=Process.sequential,
            verbose=False,
        )
        crew.kickoff()

        # Parse story page output
        page_raw = str(page_task.output.raw) if page_task.output and hasattr(page_task.output, "raw") else ""
        page_data = self._parse_json(page_raw, {
            "story": scene_summary,
            "action": f"The character is engaged in: {scene_summary}",
            "composition": "eye-level, full body",
            "details": "stars, sparkles, cheerful colours",
        })

        # Parse scene detail output
        detail_raw = str(detail_task.output.raw) if detail_task.output and hasattr(detail_task.output, "raw") else ""
        detail_data = self._parse_json(detail_raw, {
            "environment": style_guide.get("world_palette", "colourful storybook world"),
            "unique_element": "magical sparkle effect",
            "depth_cues": "foreground flowers, midground character, background landscape",
            "mood_lighting": style_guide.get("lighting", "soft warm lighting"),
        })

        # Pass raw dictionaries directly to the prompt builder
        consistency_data = {
            "char_sheet": char_sheet,
            "style_guide": style_guide,
        }

        # Merge unique_element into details
        unique_el = detail_data.get("unique_element", "")
        story_data_for_prompt = {
            "action": page_data.get("action", ""),
            "composition": page_data.get("composition", "eye-level, full body"),
            "details": (
                f"{page_data.get('details', '')}; {unique_el}" if unique_el
                else page_data.get("details", "")
            ),
            "environment": f"{detail_data.get('environment', '')} — {detail_data.get('depth_cues', '')}",
            "mood_lighting": detail_data.get("mood_lighting", ""),
        }

        prompt_text = text_to_image_prompt(consistency_data, story_data_for_prompt)

        story_text = page_data.get("story", scene_summary)

        return page_name, {
            "story": story_text.strip() if isinstance(story_text, str) else str(story_text),
            "engagement": "",
            "prompt": prompt_text.strip(),
            "scene_detail": detail_data,   # Exposed for Agent Review Panel
        }

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run_stream(self):
        """Yields (page_name, page_data) tuples as each page completes."""
        pages_data, char_sheet, style_guide = self._setup()
        if not pages_data:
            return

        full_outline = self._build_full_outline(pages_data)
        sorted_keys = sorted(pages_data.keys(), key=lambda k: int(k.split()[1]) if len(k.split()) > 1 else 0)

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future_to_page = {
                executor.submit(
                    self._process_page,
                    page_name, pages_data[page_name],
                    char_sheet, style_guide, full_outline,
                    sorted_keys.index(page_name) + 1,
                ): page_name
                for page_name in sorted_keys
            }
            for future in concurrent.futures.as_completed(future_to_page):
                res = future.result()
                if res and res[1] is not None:
                    yield res

    def setup_for_db(self) -> tuple[dict, dict]:
        """
        Used by /generate-core-plan to save setup outputs to DB.
        Returns:
          pages_data:       {page_name: [scene_summary]}  (list for schema compat)
          consistency_data: {char_sheet, style_guide}
        """
        pages_data_raw, char_sheet, style_guide = self._setup()
        pages_data = {k: [v] for k, v in pages_data_raw.items()}
        consistency_data = {
            "char_sheet": char_sheet,
            "style_guide": style_guide,
        }
        return pages_data, consistency_data

    def process_page_from_db(
        self,
        page_name: str,
        scene_summary: str,
        char_sheet: dict,
        style_guide: dict,
        full_outline: str,
        page_index: int,
    ) -> tuple[str, dict]:
        """Called by /generate-story-pages after loading setup data from DB."""
        return self._process_page(page_name, scene_summary, char_sheet, style_guide, full_outline, page_index)
