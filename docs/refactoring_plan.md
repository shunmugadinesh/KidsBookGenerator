# Codebase Refactoring Plan

Based on your request to simplify and organize the project without breaking functionality, here is the refactoring architecture we will implement:

## Directory Structure Changes

```text
app/
├── main.py                    # Clean FastAPI endpoints only
├── agents.py                  # Only pure CrewAI Agent definitions
├── tasks.py                   # Only pure CrewAI Task definitions
├── data.py                    # Static data (unchanged)
├── models/
│   ├── __init__.py
│   └── schemas.py             # All Pydantic models (ChildProfile, Requests)
├── modules/
│   ├── __init__.py
│   ├── book.py                # Book/Rhymes generation logic & get_letters_prompts
│   └── habit.py               # HabitChartOrchestrator (CrewAI flow orchestration)
└── utils/
    ├── __init__.py
    ├── prompts.py             # Prompt generation logic (moved from app.prompts)
    └── image_generator.py     # Image generation orchestrator (Pollinations/HF/Gemini fallback logic)
```

## Step-by-Step Refactoring Details

### 1. `app/models/schemas.py`
We will extract all Pydantic models (`ChildProfile`, `ImageGenerationRequest`, `HabitChartRequest`) from `main.py` to avoid circular dependencies and keep `main.py` clean.

### 2. `app/utils/image_generator.py`
We will move the massive `generate_image_endpoint` block (lines 35-255 in `main.py`) into a dedicated helper function `async def generate_image(...)` in this file. This isolates the HuggingFace, Pollinations, and Gemini API logic.

### 3. `app/modules/book.py`
We will move the ABC / Letter prompt logic here. We'll create a reusable function `get_letters_prompts(profile, specific_letter=None)` which handles both the single-letter `/generate-prompt/{letter}` API call and the full-book `/generate-book` call, preventing code duplication.

### 4. `app/agents.py`
We will strip this file of all orchestrator logic (`HabitChartCrew`). It will only contain `build_llm()` and an `Agents` class/functions that strictly return `Agent(...)` instances.

### 5. `app/tasks.py`
We will create this file to store the prompt strings and `Task(...)` definitions for the CrewAI workflows.

### 6. `app/modules/habit.py`
We will move the core orchestration loop (`_setup`, `_process_page`, `run_stream`) into a `HabitChartOrchestrator` class here. This class will import from `app.agents` and `app.tasks` to assemble the CrewAI flows.

### 7. `app/main.py`
The API entry point will become very clean and readable. It will look like this:

```python
from fastapi import FastAPI
from app.models.schemas import ImageGenerationRequest, ChildProfile, HabitChartRequest
from app.utils.image_generator import generate_image
from app.modules.book import get_letters_prompts
from app.modules.habit import HabitChartOrchestrator

app = FastAPI(title="Book Generator API")

@app.post("/generate-image")
async def generate_image_endpoint(request: ImageGenerationRequest):
    return await generate_image(request.prompt, request.image, request.model)

@app.post("/generate-prompt/{letter}")
def get_prompt(letter: str, profile: ChildProfile):
    return {"letter": letter.upper(), "prompt": get_letters_prompts(profile, letter)}

@app.post("/generate-book")
def get_book_prompts(profile: ChildProfile):
    return {"prompts": get_letters_prompts(profile)}

@app.post("/generate-habit-chart")
def generate_habit_chart(request: HabitChartRequest):
    # stream generator using HabitChartOrchestrator
```

---

**Next Steps**: Since this is a comprehensive change that touches many files, I have outlined the full plan here for your approval as per your rules. If you agree with this new structure, I will proceed to create the new folders and files, copy the code over, and update the imports. 

Let me know if you approve this structure!
