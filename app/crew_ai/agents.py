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
