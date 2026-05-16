# Implementation Plan - Make Project Standalone

The goal is to decouple `KidsBookGenerator` from the `learn_ai` repository and external sibling directories, ensuring it can run independently using Docker or local development tools.

## User Review Required

> [!IMPORTANT]
> The current `docker-compose.yml` contains services (`agent-api`, etc.) that point to external directories (`../agentic-llm`). These will be removed to keep the project standalone.
> The backend port will be standardized to `8003` (or we can change to `8000` if preferred).

## Proposed Changes

### Configuration

#### [MODIFY] [docker-compose.yml](file:///c:/D-Drive/GitHub/KidsBookGenerator/docker-compose.yml)
- Remove all commented-out external services.
- Update `agent-book-api` build context to `.` (the current root).
- Update volumes and env file paths to reflect the new standalone structure.
- Add a `frontend` service for development.

#### [MODIFY] [vite.config.js](file:///c:/D-Drive/GitHub/KidsBookGenerator/frontend/vite.config.js)
- Update proxy target port from `8000` to `8003` to match the backend.

### Backend

#### [MODIFY] [main.py](file:///c:/D-Drive/GitHub/KidsBookGenerator/app/main.py)
- Ensure static file mounting paths are robust.

## Verification Plan

### Automated Tests
- Run `docker compose build` to ensure the image builds without external dependencies.
- Run `docker compose up` and verify the frontend can communicate with the backend via the proxy.

### Manual Verification
- Test image generation from the UI to ensure the proxy and backend endpoints are working correctly.
