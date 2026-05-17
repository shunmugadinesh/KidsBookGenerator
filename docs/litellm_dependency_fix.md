# Fix: CrewAI ImportError: Fallback to LiteLLM is not available

## Problem Description
When initiating the `/generate-habit-chart` API endpoint, the application threw a `500 Internal Server Error` with the following exception:
```
  File "/app/app/crew_ai/agents.py", line 15, in build_llm
    return LLM(
  File "/usr/local/lib/python3.10/site-packages/crewai/llm.py", line 402, in __new__
    raise ImportError("Fallback to LiteLLM is not available") from None
ImportError: Fallback to LiteLLM is not available
```
This is because `crewai` relies on `litellm` as an underlying translation layer when creating `LLM` objects, but `litellm` was not installed in the Docker environment since it was omitted from `requirements.txt`.

## Proposed Solution
1. Add `litellm` to `requirements.txt`.
2. Rebuild the API container (`create-book-api`) to incorporate the updated dependencies.

## Dry-Run and Verification Plan
1. **Dry-Run Package Installation:** Install `litellm` directly into the running container to verify the fix immediately:
   ```bash
   docker exec create-book-api pip install litellm
   ```
2. **Endpoint Validation:** Invoke the `/generate-habit-chart` endpoint (or dry-run via python script) to verify the exception is resolved and CrewAI executes agents successfully.
3. **Permanent Fix:** Rebuild the docker image to ensure the change is permanent.
