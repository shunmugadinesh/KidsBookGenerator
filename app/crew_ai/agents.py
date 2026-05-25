import os
from crewai import Agent
from crewai.llm import LLM
from dotenv import load_dotenv

load_dotenv()

def build_llm(model_provider: str = 'ollama') -> LLM:
    if model_provider == 'openrouter':
        return LLM(
            model=os.getenv('OPENROUTER_MODEL', 'openrouter/google/gemma-2-9b-it:free'),
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv('OPENROUTER_API_KEY', '')
        )
    model_name = os.getenv('OLLAMA_MODEL', 'qwen3:1.7b')
    if not model_name.startswith('ollama/'):
        model_name = f"ollama/{model_name}"
        
    _in_docker = os.path.exists("/.dockerenv")
    default_base_url = 'http://host.docker.internal:11434' if _in_docker else 'http://localhost:11434'
    base_url = os.getenv('OLLAMA_BASE_URL', default_base_url)
    if not _in_docker and base_url == 'http://host.docker.internal:11434':
        base_url = 'http://localhost:11434'
        
    return LLM(
        model=model_name,
        base_url=base_url,
        api_key="NA"
    )

class HabitAgents:
    def __init__(self, text_model='ollama'):
        self.llm = build_llm(text_model)

    def planner_agent(self) -> Agent:
        return Agent(
            role='Planner Agent',
            goal='Create a clear, sequential list of scenes for a kids habit book.',
            backstory='You plan short, simple scene descriptions for toddler habit training books. Keep each scene to 1 short sentence.',
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def character_sheet_agent(self) -> Agent:
        """
        NEW — Phase 3.
        Generates a canonical character sheet ONCE per project.
        Its output is stored in PostgreSQL and reused across every page prompt,
        ensuring visual consistency without re-calling the LLM per page.
        """
        return Agent(
            role='Character Sheet Agent',
            goal=(
                'Generate a definitive, canonical JSON character sheet that describes the child '
                'protagonist visually. This single output will be reused on every book page to '
                'guarantee character consistency.'
            ),
            backstory=(
                'You are a character designer for childrens illustration books. '
                'Given a child profile you produce a precise, reusable visual identity card. '
                'You never invent details beyond what the profile provides. '
                'Your output is used verbatim by image-generation prompts on every page.'
            ),
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def consistency_agent(self) -> Agent:
        return Agent(
            role='Character and Style Consistency Agent',
            goal='Define the fixed visual identity of the character and scene style using the child profile.',
            backstory='You translate a child profile into a visual description used consistently across all pages. You do not invent — you translate the profile into visual terms.',
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def story_page_agent(self) -> Agent:
        return Agent(
            role='Story Page Agent',
            goal='Write 1-2 simple, fun sentences describing what happens on this page. Keep it short and toddler-friendly.',
            backstory='You write very short, cheerful scene text for toddler books. Maximum 2 sentences. No long paragraphs.',
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def illustration_agent(self) -> Agent:
        return Agent(
            role='Illustration Prompt Agent',
            goal='Assemble the final structured image prompt using the consistency data, scene text, and engagement details.',
            backstory='You are a prompt engineer. You assemble image prompts by filling in a fixed template using details provided to you. You do not invent — you fill in the blanks.',
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )


class RhymeAgents:
    """
    Phase 4 — Nursery Rhyme product line agents.
    These agents are responsible for scene planning and visual prompt creation
    for nursery rhymes. They NEVER re-write rhyme text — the planner only
    assigns verbatim lines to pages.
    """
    def __init__(self, text_model='ollama'):
        self.llm = build_llm(text_model)

    def rhyme_planner_agent(self) -> Agent:
        return Agent(
            role='Rhyme Planner Agent',
            goal=(
                'Divide the given nursery rhyme text into sequential page groups. '
                'You must NOT change, rewrite, add, or omit any word from the original text. '
                'Your sole job is to group the existing lines into logical page stanzas.'
            ),
            backstory=(
                'You are a structural book editor specialised in nursery rhyme picture books. '
                'You receive the complete, canonical rhyme text and distribute its existing lines '
                'across pages. You never alter words, add new lines, or summarise. '
                'Each page should have 2-4 rhyme lines forming one logical unit of the story.'
            ),
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def character_sheet_agent(self) -> Agent:
        return Agent(
            role='Rhyme Character Sheet Agent',
            goal=(
                'Generate a canonical JSON character sheet for the rhyme protagonist(s). '
                'This single output will be reused on every page to guarantee visual consistency.'
            ),
            backstory=(
                'You are a character designer for childrens illustration picture books. '
                'Given a rhyme character description and a child profile you produce a precise, '
                'reusable visual identity card with exact clothing, hair, colours and style. '
                'You do not invent details beyond what is provided.'
            ),
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def consistency_agent(self) -> Agent:
        return Agent(
            role='Rhyme Style Consistency Agent',
            goal=(
                'Define the fixed visual world of the rhyme — environment palette, art style, '
                'lighting, and quality standards — so every page feels like it belongs to the same book.'
            ),
            backstory=(
                'You are an art director for a premium childrens picture book studio. '
                'Given a rhyme theme, palette, and child profile you produce a structured visual '
                'style guide that is injected into every page image prompt. '
                'You focus on environment, atmosphere, and aesthetic cohesion. '
                'You do not invent character details — only world / environment / style rules.'
            ),
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def rhyme_page_agent(self) -> Agent:
        return Agent(
            role='Rhyme Scene Visual Agent',
            goal=(
                'Given the verbatim rhyme lines for one page, produce rich visual action '
                'descriptions so an image generator can depict exactly what is happening. '
                'Focus on body language, props, setting details and facial expressions. '
                'Do NOT rewrite or paraphrase the rhyme text itself.'
            ),
            backstory=(
                'You are a visual storyboard artist for nursery rhyme picture books. '
                'You read the exact rhyme lines for a page and translate them into a detailed '
                'visual action scene. You bring the scene alive with specific visual elements '
                '— props, gestures, expressions, depth cues — without changing one word of the poem. '
                'Your output drives the image generation step directly.'
            ),
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )


class StoryAgents:
    """
    Phase 4 — Creative Story product line agents.
    These agents generate toddler-friendly stories from a custom topic.
    Each page must feel visually unique yet part of a coherent visual world.
    """
    def __init__(self, text_model='ollama'):
        self.llm = build_llm(text_model)

    def story_planner_agent(self) -> Agent:
        return Agent(
            role='Story Planner Agent',
            goal=(
                'Create a logical, sequential list of scene summaries for a toddler story book. '
                'Scenes must form a complete narrative arc: introduction → adventure → resolution. '
                'Each scene must be distinct, visually unique, and build naturally on the previous one.'
            ),
            backstory=(
                'You plan toddler storybooks with a clear narrative structure. '
                'You ensure scenes flow logically from page to page, '
                'each introducing a new visual element, location, or emotional beat. '
                'Your outlines are vivid enough for illustrators to work from directly. '
                'You never repeat the same scene or location twice.'
            ),
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def character_sheet_agent(self) -> Agent:
        return Agent(
            role='Story Character Sheet Agent',
            goal=(
                'Generate a canonical JSON character sheet describing the story protagonist(s) visually. '
                'This output is reused across every page to guarantee character consistency.'
            ),
            backstory=(
                'You are a character designer for toddler illustration books. '
                'Given a child profile and a story topic you produce a precise, reusable visual identity card. '
                'You never invent details beyond what is provided. '
                'Your output is injected into every page image prompt verbatim.'
            ),
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def consistency_agent(self) -> Agent:
        return Agent(
            role='Story Style Consistency Agent',
            goal=(
                'Define the visual world for the story — colour palette, art style, lighting — '
                'ensuring every page shares the same aesthetic universe.'
            ),
            backstory=(
                'You are an art director for a premium toddler picture book studio. '
                'Given the story theme and child profile you produce a structured visual style guide '
                'covering environment rules, colour palettes, lighting moods, and quality standards. '
                'You ensure cohesion without restricting per-scene variety in props and settings. '
                'You focus on world-building, not character details.'
            ),
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def story_page_agent(self) -> Agent:
        return Agent(
            role='Story Page Writer Agent',
            goal=(
                'Write 1-2 cheerful, simple narrative sentences for this specific page of the story. '
                'The text must advance the plot logically from the previous page and set up the next. '
                'Keep language simple enough for a toddler to understand.'
            ),
            backstory=(
                'You write toddler storybook page text. You receive the full story outline and '
                'the current page scene, then write the exact page narration. '
                'You maintain plot continuity, use simple vocabulary, and keep a joyful encouraging tone. '
                'You do not repeat phrases or scenes from other pages.'
            ),
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def scene_detail_agent(self) -> Agent:
        return Agent(
            role='Scene Detail Agent',
            goal=(
                'Given the story page text and scene description, produce rich visual scene details: '
                'specific props, environment elements, character posture, and composition. '
                'Each page must introduce at least one unique prop or environment element '
                'not seen on previous pages to create visual variety.'
            ),
            backstory=(
                'You are a visual storyboard artist for toddler picture books. '
                'You translate a story page narrative into a rich visual breakdown '
                'that an image generator can render precisely. '
                'You introduce unique props and scene elements per page to ensure variety, '
                'while keeping the overall aesthetic consistent with the story world. '
                'You also specify camera angles, depth, and mood lighting cues per page.'
            ),
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

class AlphabetAgents:
    """
    Agents to handle alphabet and number book custom word customization.
    """
    def __init__(self, text_model='ollama'):
        self.llm = build_llm(text_model)

    def customization_agent(self) -> Agent:
        return Agent(
            role='Alphabet/Number Customization Agent',
            goal=(
                'Given a letter or number and a custom user-provided word, '
                'generate a JSON object containing a `scene` description and a `fact`. '
                'The scene must be a visually descriptive prompt for an illustrator. '
                'The fact must be a fun, 1-2 sentence toddler-friendly fact about the word.'
            ),
            backstory=(
                'You are an expert children\'s book writer and storyboard artist. '
                'When a parent requests a custom word for a letter or number, '
                'you vividly imagine a joyful, child-centric scene with that word, '
                'and you write a fun educational fact about it. '
                'You only output valid JSON with `scene` and `fact` keys.'
            ),
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )
