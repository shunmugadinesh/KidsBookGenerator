# Walkthrough - Standalone Project Setup

The `KidsBookGenerator` project is now fully standalone and decoupled from the `learn_ai` repository. All external dependencies and hardcoded paths to sibling directories have been removed.

## Changes Made

### 1. Docker Environment
- **`docker-compose.yml`**: Simplified to only include the core services: `agent-book-api` (Backend) and `frontend` (React).
- **Standalone Services**: Removed references to `../agentic-llm` and other external folders.
- **Frontend Service**: Added a new `frontend` service that runs Vite in development mode with Hot Module Replacement (HMR).

### 2. Configuration & Paths
- **Vite Proxy**: Updated the frontend proxy to point to port `8003` (the backend container's port).
- **Hot Reloading**: Enabled `usePolling: true` in `vite.config.js` to ensure changes saved on your host machine are immediately reflected inside the Docker container.
- **Backend Reload**: Confirmed that `uvicorn` is running with the `--reload` flag for instant backend updates.

### 3. File Structure
- Fixed `docker-compose.yml` build context to use the current directory (`.`) instead of `./BookGenerator`.

## How to Run

1.  **Build and Start**:
    ```bash
    docker compose up --build
    ```
2.  **Access the App**:
    - **Frontend**: [http://localhost:5173](http://localhost:5173)
    - **Backend API**: [http://localhost:8003/docs](http://localhost:8003/docs)

## Verification
- [x] Backend builds and runs on port 8003.
- [x] Frontend builds and runs on port 5173.
- [x] Proxy correctly routes `/generate-image` and other endpoints to the backend.
- [x] Hot reloading works for both frontend and backend.
