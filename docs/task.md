# Task List - Save/Cancel Controls & Robust Backend Save

- [x] Apply backend fix to `app/main.py` to prevent `save-project-assets` crash
- [x] Map `/save-project-assets` in `frontend/vite.config.js` to enable proxy routing to backend
- [x] Implement `tempStoryText` and `tempPromptText` hooks in `frontend/src/App.jsx`
- [x] Add `useEffect` sync hooks and event handlers for Save/Cancel editing actions
- [x] Bind right panel textareas to temp states and display styled "✓ Save" / "✕ Cancel" buttons when dirty
- [x] Make center canvas narration text container read-only
- [x] Run Vite production build (`npm run build`) to ensure frontend compilation succeeds
- [x] Perform backend and frontend dry run checks
- [x] Implement GET `/list-projects` and set full movie page_name to `"full_story"` in `app/main.py`
- [x] Map `/list-projects` proxy target inside `frontend/vite.config.js`
- [x] Declare projects list and vector match states inside `frontend/src/App.jsx`
- [x] Add project list fetching and project close handlers in `frontend/src/App.jsx`
- [x] Add session close and existing project loading UI blocks to left sidebar in `frontend/src/App.jsx`
- [x] Split `handleGenerateCorePlan` and show ChromaDB match confirmation modal inside `frontend/src/App.jsx`
- [x] Compile Vite frontend bundle via `npm run build`
- [x] Run dryrun validation of new endpoints

## ChromaDB Similarity Fix
- [x] Refactor `save_story_embedding` and `search_similar_story` in `app/db/chroma_client.py`
- [x] Run dryrun validation to verify similarity search resolves matches successfully

## Project Reopen & Spinner Fixes
- [x] Extend `/get-project/{project_id}` backend endpoint to return images, videos, and full video
- [x] Update frontend `loadProjectFromDb` to restore images, videos, and full video states
- [x] Reset `isGeneratingHabitPlan` state on ChromaDB match to prevent button from getting stuck on "Analyzing..."
- [x] Validate fixes through a dry run and frontend build
