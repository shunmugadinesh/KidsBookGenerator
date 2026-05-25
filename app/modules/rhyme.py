"""
RhymeOrchestrator — Phase 4
Handles the nursery rhyme product pipeline.

Key guarantee:
  Every page's "story" text is the VERBATIM rhyme lines from the original source.
  The LLM is only used for:
    1. Distributing lines across pages (verified + fallback)
    2. Character sheet (visual identity)
    3. Style guide (visual world)
    4. Visual scene description per page (action, environment, composition, details)
"""

import json
import re
import concurrent.futures
from crewai import Crew, Process

from app.crew_ai.agents import RhymeAgents
from app.crew_ai.tasks import RhymeTasks
from app.utils.prompts import text_to_image_prompt
from app.models.schemas import ChildProfile


# ---------------------------------------------------------------------------
# Verbatim integrity helpers
# ---------------------------------------------------------------------------

def _normalize(text: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace for comparison."""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    return re.sub(r"\s+", " ", text).strip()


def _words_match(original: str, planned: str) -> bool:
    """
    Returns True only if the word-multiset of all planned page lines
    exactly matches the original rhyme text (ignoring punctuation and case).
    """
    return _normalize(original) == _normalize(planned)


def _programmatic_split(rhyme_data: dict, total_pages: int) -> dict[str, str]:
    """
    Fallback: split stanzas from the preset database (or split by blank lines)
    across `total_pages` as evenly as possible.
    Returns {page_name: verbatim_lines_string}
    """
    stanzas: list[str] = rhyme_data.get("stanzas") or []

    if not stanzas:
        # Split raw text on blank lines
        stanzas = [s.strip() for s in re.split(r"\n\s*\n", rhyme_data["text"]) if s.strip()]

    if not stanzas:
        # Last resort: split by single newline
        stanzas = [line.strip() for line in rhyme_data["text"].split("\n") if line.strip()]

    # Distribute stanzas across pages
    pages: dict[str, str] = {}
    stanzas_per_page = max(1, len(stanzas) // total_pages)
    remainder = len(stanzas) % total_pages
    idx = 0
    for i in range(1, total_pages + 1):
        count = stanzas_per_page + (1 if i <= remainder else 0)
        chunk = stanzas[idx: idx + count]
        pages[f"Page {i}"] = "\n".join(chunk)
        idx += count
        if idx >= len(stanzas):
            break

    # If we ended early (fewer stanzas than pages), mark remaining empty
    for i in range(len(pages) + 1, total_pages + 1):
        pages[f"Page {i}"] = ""

    return pages


def _llm_split(rhyme_data: dict, total_pages: int, agent, tasks_factory) -> dict[str, str] | None:
    """
    Ask the LLM to split rhyme lines. Returns the page dict if the
    integrity check passes, or None if lines were altered.
    """
    task = tasks_factory.plan_rhyme_pages_task(agent, rhyme_data["text"], total_pages)
    crew = Crew(agents=[agent], tasks=[task], verbose=True)
    result = str(crew.kickoff())

    # Parse JSON from result
    try:
        json_match = re.search(r"\{.*\}", result, re.DOTALL)
        raw = json.loads(json_match.group(0)) if json_match else json.loads(result)
    except Exception:
        return None

    if not isinstance(raw, dict):
        return None

    # Flatten all planned text back together and compare against original
    planned_all = " ".join(str(v) for v in raw.values())
    if not _words_match(rhyme_data["text"], planned_all):
        return None  # LLM altered words — trigger fallback

    # Normalize keys to "Page N"
    pages: dict[str, str] = {}
    for i, (k, v) in enumerate(raw.items(), 1):
        pages[f"Page {i}"] = str(v).strip()

    return pages


# ---------------------------------------------------------------------------
# Main Orchestrator
# ---------------------------------------------------------------------------

class RhymeOrchestrator:
    """
    Orchestrates the nursery rhyme book generation pipeline.

    Args:
        rhyme_data:   Dict from RHYMES_DB (title, text, stanzas, char, theme, style_palette)
        total_pages:  Number of pages to generate
        child_profile: Dict matching ChildProfile schema
        text_model:   'ollama' or 'openrouter'
    """
    def __init__(
        self,
        rhyme_data: dict,
        total_pages: int = 6,
        child_profile: dict | None = None,
        text_model: str = "ollama",
    ):
        self.rhyme_data = rhyme_data
        
        # Determine total_pages dynamically based on stanzas
        stanzas = rhyme_data.get("stanzas") or []
        if not stanzas:
            stanzas = [s.strip() for s in re.split(r"\n\s*\n", rhyme_data["text"]) if s.strip()]
        if not stanzas:
            stanzas = [line.strip() for line in rhyme_data["text"].split("\n") if line.strip()]
            
        self.total_pages = len(stanzas) if len(stanzas) > 0 else total_pages
        default_profile = ChildProfile().model_dump()
        self.child_profile = default_profile.copy()
        if child_profile:
            self.child_profile.update({k: v for k, v in child_profile.items() if v is not None})
        self.text_model = text_model

        self.agents_factory = RhymeAgents(text_model)
        self.tasks_factory = RhymeTasks(rhyme_data["title"])

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _profile_str(self) -> str:
        return "\n".join(f"  {k}: {v}" for k, v in self.child_profile.items())

    def _run_single_crew(self, agent, task):
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
    # Setup: page plan + character sheet + style guide
    # ------------------------------------------------------------------

    def _setup(self) -> tuple[dict[str, str], dict[str, str], dict, dict]:
        """
        Returns:
          page_plan:    {page_name: verbatim_rhyme_lines}
          visual_plan:  {page_name: visual_scene_summary}
          char_sheet:   character sheet dict
          style_guide:  visual style/consistency dict
        """
        profile_str = self._profile_str()

        # 1. Page plan — try LLM first, fallback to programmatic
        planner_agent = self.agents_factory.rhyme_planner_agent()
        page_plan = _llm_split(self.rhyme_data, self.total_pages, planner_agent, self.tasks_factory)
        if page_plan is None:
            page_plan = _programmatic_split(self.rhyme_data, self.total_pages)

        # 1b. Sequential Visual Plan
        full_plan_str = self._build_full_plan_str(page_plan)
        seq_task = self.tasks_factory.plan_rhyme_visual_sequence_task(planner_agent, full_plan_str, self.total_pages)
        seq_raw = self._run_single_crew(planner_agent, seq_task)
        visual_sequence = self._parse_json_list(seq_raw)
        
        # Ensure exact page count
        visual_sequence = visual_sequence[:self.total_pages]
        while len(visual_sequence) < self.total_pages:
            visual_sequence.append(f"Scene {len(visual_sequence) + 1} for {self.rhyme_data.get('title')}")
            
        sorted_keys = sorted(page_plan.keys(), key=lambda k: int(k.split()[1]) if len(k.split()) > 1 else 0)
        visual_plan = {k: visual_sequence[i] for i, k in enumerate(sorted_keys)}

        # 2. Character sheet
        char_agent = self.agents_factory.character_sheet_agent()
        char_task = self.tasks_factory.rhyme_character_sheet_task(
            char_agent, profile_str, self.rhyme_data.get("char", "")
        )
        char_raw = self._run_single_crew(char_agent, char_task)
        char_sheet = self._parse_json(char_raw, {
            "name": self.rhyme_data.get("char", "character"),
            "age_desc": "toddler-sized",
            "skin_tone": self.child_profile.get("skin_tone", ""),
            "hair": f"{self.child_profile.get('hair_color', '')} {self.child_profile.get('hair_style', '')} hair",
            "eyes": self.child_profile.get("eye_color", ""),
            "outfit": f"{self.child_profile.get('outfit_color', '')} colourful outfit, fully clothed",
            "props": self.rhyme_data.get("title", ""),
            "art_style": self.child_profile.get("style", "Pixar-style illustration"),
        })

        # 3. Style guide / consistency
        style_agent = self.agents_factory.consistency_agent()
        style_task = self.tasks_factory.rhyme_consistency_task(
            style_agent,
            profile_str,
            self.rhyme_data.get("theme", "nursery rhyme adventure"),
            self.rhyme_data.get("style_palette", "bright primary colours")
        )
        style_raw = self._run_single_crew(style_agent, style_task)
        style_guide = self._parse_json(style_raw, {
            "environment_base": f"a colourful storybook world fitting the theme of {self.rhyme_data.get('theme', 'nursery rhyme')}",
            "style": self.child_profile.get("style", "Pixar-style illustration"),
            "lighting": self.child_profile.get("lighting", "soft warm lighting"),
            "colour_palette": self.rhyme_data.get("style_palette", "bright primary colours"),
            "quality": "HD printable, 4k, ultra detailed, storybook illustration quality, vibrant colours",
            "negative_prompt": "blurry, deformed, extra fingers, bad anatomy, dark, scary, adult content, nudity, text overlay, watermark, logo",
            "guidelines": "Keep everything wholesome and toddler-safe. Vivid storybook colours. Character must remain visually consistent on every page. Soft depth-of-field backgrounds. HD printable quality."
        })

        return page_plan, visual_plan, char_sheet, style_guide

    # ------------------------------------------------------------------
    # Per-page processing
    # ------------------------------------------------------------------

    def _build_full_plan_str(self, page_plan: dict[str, str]) -> str:
        sorted_keys = sorted(page_plan.keys(), key=lambda k: int(k.split()[1]) if len(k.split()) > 1 else 0)
        return "\n".join(f"- {k}: {page_plan[k][:80]}..." if len(page_plan[k]) > 80 else f"- {k}: {page_plan[k]}" for k in sorted_keys)

    def _process_page(
        self, page_name: str, rhyme_lines: str, scene_summary: str,
        char_sheet: dict, style_guide: dict,
        full_plan_str: str, page_index: int
    ) -> tuple[str, dict]:
        char_sheet_str = json.dumps(char_sheet, indent=2)
        style_str = json.dumps(style_guide, indent=2)

        page_agent = self.agents_factory.rhyme_page_agent()
        page_task = self.tasks_factory.rhyme_page_visual_task(
            agent=page_agent,
            page_name=page_name,
            page_lines=rhyme_lines,
            char_sheet_str=char_sheet_str,
            consistency_str=style_str,
            full_page_plan=full_plan_str,
            scene_summary=scene_summary,
            page_index=page_index,
            total_pages=self.total_pages
        )

        crew = Crew(agents=[page_agent], tasks=[page_task], process=Process.sequential, verbose=False)
        crew.kickoff()

        raw = str(page_task.output.raw) if page_task.output and hasattr(page_task.output, "raw") else ""
        scene_data = self._parse_json(raw, {
            "action": f"The character performs the action described in the rhyme: {scene_summary[:60]}",
            "environment": style_guide.get("environment_base", "colourful storybook world"),
            "unique_element": "sparkles and magical glow",
            "composition": "eye-level, full body shot",
            "details": "stars, sparkles, cheerful colours"
        })

        # Pass raw dictionaries directly to the prompt builder
        consistency_data = {
            "char_sheet": char_sheet,
            "style_guide": style_guide,
        }

        # Merge unique_element into details for the prompt
        unique_el = scene_data.get("unique_element", "")
        story_data = {
            "action": scene_data.get("action", ""),
            "composition": scene_data.get("composition", "eye-level, full body"),
            "details": f"{scene_data.get('details', '')}; {unique_el}" if unique_el else scene_data.get("details", ""),
            "environment": scene_data.get("environment", ""),
        }

        prompt_text = text_to_image_prompt(consistency_data, story_data)

        return page_name, {
            "story": rhyme_lines,          # VERBATIM rhyme lines — never LLM-generated
            "engagement": "",
            "prompt": prompt_text.strip(),
            "scene_data": scene_data,       # Exposed for the Agent Review Panel
        }

    # ------------------------------------------------------------------
    # Public API: run_stream (matches HabitChartOrchestrator interface)
    # ------------------------------------------------------------------

    def run_stream(self):
        """Yields (page_name, page_data) tuples as each page completes."""
        setup_data = self._setup()
        if not setup_data:
            return
        
        page_plan, visual_plan, char_sheet, style_guide = setup_data
        
        if not page_plan:
            return

        full_plan_str = self._build_full_plan_str(page_plan)
        sorted_keys = sorted(page_plan.keys(), key=lambda k: int(k.split()[1]) if len(k.split()) > 1 else 0)

        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            future_to_page = {
                executor.submit(
                    self._process_page,
                    page_name, page_plan[page_name], visual_plan[page_name],
                    char_sheet, style_guide, full_plan_str,
                    sorted_keys.index(page_name) + 1
                ): page_name
                for page_name in sorted_keys
                if page_plan[page_name].strip()
            }
            for future in concurrent.futures.as_completed(future_to_page):
                res = future.result()
                if res and res[1] is not None:
                    yield res

    def setup_for_db(self) -> tuple[dict[str, list[str]], dict]:
        """
        Used by the /generate-core-plan endpoint to run setup and return
        pages_data + consistency_data for storage.

        Returns:
          pages_data:       {page_name: [verbatim_lines, scene_summary]}
          consistency_data: merged char_sheet + style_guide for DB storage
        """
        setup_data = self._setup()
        if not setup_data:
            return {}, {}
        
        page_plan, visual_plan, char_sheet, style_guide = setup_data
        
        pages_data = {k: [v, visual_plan[k]] for k, v in page_plan.items() if v.strip()}
        consistency_data = {
            "char_sheet": char_sheet,
            "style_guide": style_guide,
        }
        return pages_data, consistency_data

    def process_page_from_db(
        self,
        page_name: str,
        rhyme_lines: str,
        scene_summary: str,
        char_sheet: dict,
        style_guide: dict,
        full_plan_str: str,
        page_index: int
    ) -> tuple[str, dict]:
        """Called by /generate-story-pages after loading setup from DB."""
        return self._process_page(page_name, rhyme_lines, scene_summary, char_sheet, style_guide, full_plan_str, page_index)
