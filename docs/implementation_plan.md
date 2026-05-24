# Implementation Plan - Project Asset Restoration & Spinner State Fix

This plan details the implementation of two key fixes:
1. **Saved Assets Restoration**: Extending `/get-project/{project_id}` to fetch and return the project's saved images and videos, and updating `loadProjectFromDb` in the frontend to populate `habitGeneratedImages`, `generatedVideos`, and `fullBookVideoUrl`.
2. **"Analyzing..." Spinner Fix**: Properly resetting the loading state when a vector DB similarity match is found so the generator button does not remain stuck on "Analyzing...", and ensuring the spinner is active if the user chooses to proceed with generation.

## Proposed Changes

### Backend Components

#### [MODIFY] [main.py](file:///c:/D-Drive/GitHub/KidsBookGenerator/app/main.py)
- In the `@app.get("/get-project/{project_id}")` endpoint:
  - Query all `Image` and `Video` records associated with `project_id` sorted by ID ascending.
  - Construct a dictionary mapping page names to image paths.
  - Construct a dictionary mapping page names to video paths (excluding `"full_story"`).
  - Extract the full book video path (where page name is `"full_story"` or `None`).
  - Return `images`, `videos`, and `full_video` in the response JSON.

---

### Frontend Components

#### [MODIFY] [App.jsx](file:///c:/D-Drive/GitHub/KidsBookGenerator/frontend/src/App.jsx)
- In the `loadProjectFromDb` function:
  - Extract `images`, `videos`, and `full_video` from the JSON response.
  - Set the state variables `habitGeneratedImages`, `generatedVideos`, and `fullBookVideoUrl` with the retrieved values.
- In the `proceedWithCorePlanGeneration` function:
  - Set `setIsGeneratingHabitPlan(true)` at the start of the function to ensure the loading spinner turns on if triggered.
- In the `handleGenerateCorePlan` function:
  - If a similarity match is found in ChromaDB, call `setIsGeneratingHabitPlan(false)` before returning to reset the spinner state.

## Verification Plan

### Automated/Build Verification
- Execute `npm run build` inside `frontend/` to ensure the compilation succeeds with no syntax or React errors.

### Manual Verification
- Start a new Habit project (e.g., "Wash Hands") and generate some page images and videos.
- Click "Save Project to DB" to persist the assets to PostgreSQL.
- Click "Close" in the Project Session manager to reset the state.
- Select the project from the "Open Existing Project" dropdown and verify that the stories, page images, page videos, and full video are successfully restored and display correctly.
- Start another project with the same title ("Wash Hands"). Verify the confirmation pop-up modal is displayed and the main button immediately resets from "Analyzing..." to "Generate Core Plan".
