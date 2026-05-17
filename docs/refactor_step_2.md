# Refactoring Plan: Phase 2

Based on your request, we will restructure the directories further:

## 1. Move CrewAI Files
We will create an `app/crew_ai/` directory and move the following files into it:
* `app/agents.py` -> `app/crew_ai/agents.py`
* `app/tasks.py` -> `app/crew_ai/tasks.py`

## 2. Move Static Resources
We will create an `app/resources/` directory and move the following static files into it:
* `app/data.py` -> `app/resources/data.py`
* `app/habit_prompt_template.txt` -> `app/resources/habit_prompt_template.txt`

## 3. Update Imports
We will update the references in the codebase to match the new locations:
* **`app/modules/habit.py`**: Update imports to point to `app.crew_ai.agents` and `app.crew_ai.tasks`
* **`app/utils/prompts.py`**: Update import to point to `app.resources.data`
* **`app/modules/book.py`**: Update import to point to `app.resources.data`

This will neatly separate AI models from static resources.
