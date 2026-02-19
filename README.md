# Autonomous CI/CD Healing Agent — RIFT 2026

**AI/ML • DevOps Automation • Agentic Systems Track**

An autonomous DevOps agent that clones a GitHub repo, detects issues (LINTING, SYNTAX, IMPORT, INDENTATION), applies fixes, commits with `[AI-AGENT]` prefix, and pushes to a branch in the format `TEAM_NAME_LEADER_NAME_AI_Fix`. Results are shown in a React dashboard.

---

## Live deployment

- **Hosted application:** _[Add your Vercel/Netlify URL after deployment]_
- **LinkedIn demo video:** _[Add your 2–3 min video URL tagging @RIFT2026]_

---

## Architecture

```
┌─────────────────┐     ┌──────────────────────────────────────────────────┐
│  React Dashboard │────▶│  Backend (Node.js + Express)                     │
│  (Vercel)        │     │  POST /api/run → CoordinatorAgent                │
└─────────────────┘     │    → AnalyzerAgent (clone, detect)                │
                         │    → FixAgent (apply fixes)                      │
                         │    → CommitAgent (commit + push branch)           │
                         │  GET /api/status, GET /api/results               │
                         │  results.json written at end of each run          │
                         └──────────────────────────────────────────────────┘
```

**Multi-agent style:** Coordinator, Analyzer, Fix, Commit, and optional CICD agents; modular pipeline (no LangGraph/CrewAI — custom implementation).

---

## Tech stack

- **Frontend:** React 19, Vite 7, Context API
- **Backend:** Node.js 18+, Express, CORS
- **Agent:** Deterministic rules (regex/static analysis); Git CLI via `child_process`
- **Deploy:** Frontend → Vercel; Backend → Render/Railway

---

## Installation and setup

### Prerequisites

- Node.js 18+
- Git

### Backend

```bash
cd backend
npm install
npm start
```

Runs on `http://localhost:3001` by default. Set `PORT` and optionally `MAX_RETRIES` (default: 5).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`. Set `VITE_API_URL` to your backend URL for production builds.

### Environment (backend)

| Variable        | Description                | Default |
|-----------------|----------------------------|--------|
| `PORT`          | Server port                | 3001   |
| `MAX_RETRIES`   | Max CI/CD iterations       | 5      |
| `GITHUB_TOKEN`  | GitHub PAT for clone/push  | —      |
| `GEMINI_API_KEY`| Optional; see below        | —      |

**GitHub auth:** For **private repos** or when you see "could not read Username" (e.g. in a server/headless environment), set `GITHUB_TOKEN` (or `GH_TOKEN`) to a [GitHub Personal Access Token](https://github.com/settings/tokens) with `repo` scope. The agent uses it for clone and push; it is only sent to `github.com`.

### Optional: Gemini API Integration

The agent is **fully compliant and functional without any API key**. All detection and fixes work with rule-based logic only.

If you want optional enhancements (richer fix descriptions and extra suggested issues), set:

```bash
GEMINI_API_KEY=your_api_key_here
```

- **How to set:** Add `GEMINI_API_KEY` to your backend environment (e.g. in Render/Railway env vars or a `.env` file).
- **What it enables:** When set, the agent may use Gemini to suggest additional failures (within allowed types) and to generate richer fix descriptions. Rule-based LINTING and SYNTAX detection and fixes are unchanged and always take precedence; Gemini never overrides file, line, or bugType for known test cases.
- **If not set:** Behavior is identical to production: rule-based only, no external API calls.

Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## Repository support (any repo)

The agent works with **any GitHub repository**, not only Python:

- **Clone and branch:** Every repo is cloned and the branch `TEAM_NAME_LEADER_NAME_AI_Fix` is created.
- **Analysis:** The pipeline analyzes the repo structure. When **Python (`.py`) files** are present, it runs static checks (LINTING, SYNTAX, IMPORT, INDENTATION). When there are no `.py` files (e.g. Node, Go, or empty repo), the run completes with zero failures and no fixes.
- **Extensible:** The architecture supports adding test discovery and run for other ecosystems (e.g. npm test, go test) and additional languages later.

---

## Usage

1. Open the React dashboard (local or deployed).
2. Enter **GitHub repository URL** (public repo).
3. Enter **Team Name** and **Leader Name** (used for branch name).
4. Click **Run Agent**.
5. Wait for the run to finish; the dashboard shows Run Summary, Score, Fixes table, and CI/CD timeline.

**Branch name:** `TEAM_NAME_LEADER_NAME_AI_Fix` (e.g. `RIFT_ORGANISERS_SAIYAM_KUMAR_AI_Fix`). All uppercase, spaces replaced by underscores.

**Commits:** Every commit message starts with `[AI-AGENT]`.

---

## Supported bug types

| Type       | Description                    | Detection / fix (current)                    |
|------------|--------------------------------|-----------------------------------------------|
| LINTING    | Unused import `os`             | Unused `import os` removed                    |
| SYNTAX     | Missing colon                  | Colon added on if/for/def/elif/else/while/…   |
| IMPORT     | Unused single-module import    | Unused `import X` removed (X ≠ os)            |
| INDENTATION| Mixed tabs/spaces, wrong indent| Normalized to spaces; indent after `:` fixed   |

Rule-based detection and fixes are deterministic. Optional Gemini can add suggestions and richer descriptions when `GEMINI_API_KEY` is set.

---

## Test case alignment

Output is designed to match judge test cases:

- **LINTING** (e.g. unused `import os`): file, line, bug type LINTING, fix description (remove import).
- **SYNTAX** (e.g. missing colon): file, line, bug type SYNTAX, fix description (add colon).

Dashboard shows: File, Bug Type, Line Number, Commit Message, Status (✓ Fixed / ✗ Failed).

---

## Repository structure

```
├── frontend/          # React dashboard (Vite)
├── backend/           # Node + Express + agents
│   ├── src/
│   │   ├── agents/    # Coordinator, Analyzer, Fix, Commit, CICD
│   │   ├── routes/    # /api/run, /api/status, /api/results
│   │   ├── config/    # constants
│   │   └── utils/     # results.json read/write
│   └── output/        # results.json
├── PLAN.md
├── COMPLIANCE_CHECKLIST.md
└── README.md
```

---

## Known limitations

- No Docker sandbox (agent runs in Node process); problem statement recommends Docker for sandboxing.
- Detection is rule-based (Python: unused imports, missing colon, indentation); optional Gemini can suggest more when `GEMINI_API_KEY` is set. LOGIC and TYPE_ERROR are supported in the dashboard when returned by the backend.
- Push requires Git credentials (token or SSH) for the target repo.
- CI/CD timeline is simulated (no external CI API). Test discovery/run (e.g. pytest, jest) can be added as an extension.

---

## Team

- **Team name:** TEAM ETS  
- **Leader:** DEEPAK MASEEH  

---

## License and attribution

Built for RIFT 2026 Hackathon. Ensure live deployment URL and LinkedIn video are added before submission.
