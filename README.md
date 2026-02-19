# RIFT 2026 – Autonomous CI/CD Healing Agent

Solo-developer project: backend skeleton + (future) React dashboard. Agent clones a repo, detects failures, applies fixes, commits with `[AI-AGENT]`, and pushes to branch `TEAM_ETS_DEEPAK_MASEEH_AI_Fix`.

## Quick start

- **Backend:** `cd backend && npm install && npm start` — runs on port 3001; `GET /health`, `GET /api/results`, `POST /api/run`, `GET /api/status`.
- **Frontend:** (not implemented yet; see `frontend/` when added.)
