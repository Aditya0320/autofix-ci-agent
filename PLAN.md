# RIFT 2026 – Autonomous CI/CD Healing Agent  
## Planning Document (No Code – Execution Blueprint)

**Problem:** AI/ML – Build an Autonomous CI/CD Healing Agent  
**Constraints:** 24h hackathon, solo dev, working + deployed + judge-safe  
**Primary evaluation:** React dashboard + backend `results.json` + agent behavior (branch/commits)

---

## 1. HIGH-LEVEL SYSTEM ARCHITECTURE (Text Diagram)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           JUDGE / USER                                       │
│  (Opens React dashboard on Vercel, triggers run, inspects results.json)     │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  FRONTEND (Vercel)                                                            │
│  • React app (functional components, hooks, Context API)                      │
│  • Triggers agent via backend API                                            │
│  • Displays: run status, logs, results.json (bugs fixed, file, line, desc)   │
│  • Read-only view of last run / history (from backend or stored results)     │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                          HTTPS POST (trigger) / GET (status, results)
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  BACKEND (Render / Railway)                                                   │
│  • Express API: trigger run, get status, get results                          │
│  • Orchestrates “agent” pipeline; runs in process or subprocess               │
│  • Writes results.json at end of each run (path known to frontend/API)       │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  AGENT PIPELINE (same host or minimal Docker)                                │
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │ Coordinator  │───▶│   Analyzer   │───▶│    Fix      │                   │
│  │   Agent      │    │   Agent      │    │   Agent     │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│         │                    │                    │                          │
│         │                    │                    │                          │
│         ▼                    ▼                    ▼                          │
│  • Parse params       • Clone repo          • Apply regex/                   │
│  • Branch name        • Run tests /           static fixes                   │
│  • Invoke pipeline     parse logs          • Write files                    │
│         │             • Output: failures                                      │
│         ▼                    │                    │                          │
│  ┌──────────────┐    ┌──────────────┐           │                          │
│  │   Commit     │◀───│    CI/CD     │◀──────────┘                          │
│  │   Agent      │    │   Agent      │    (re-run tests if needed)           │
│  └──────────────┘    └──────────────┘                                       │
│         │                    │                                                │
│         ▼                    ▼                                                │
│  • Commit [AI-AGENT]  • Optional: run CI again                                │
│  • Push branch        • Finalize results                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  EXTERNAL                                                                     │
│  • GitHub: clone target repo, push branch TEAM_NAME_LEADER_NAME_AI_Fix        │
│  • (Optional) CI service for test runs                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data flow (summary):**  
User → Dashboard → API “start run” → Coordinator → Analyzer (clone + detect) → Fix (apply fixes) → Commit (commit + push) → Backend writes `results.json` → Dashboard fetches and displays.

---

## 2. PROJECT FOLDER STRUCTURE

```
Hackathon/
├── frontend/                    # React app (Vercel)
│   ├── public/
│   ├── src/
│   │   ├── components/          # UI components (RunTrigger, ResultsTable, Status, etc.)
│   │   ├── context/             # e.g. AppContext for API base URL, run state
│   │   ├── App.jsx (or .tsx)
│   │   └── main.jsx
│   ├── package.json
│   └── vercel.json              # optional: rewrites if needed
│
├── backend/                     # Node + Express (Render / Railway)
│   ├── src/
│   │   ├── index.js             # Express app, CORS, routes
│   │   ├── routes/
│   │   │   └── agent.js         # POST /run, GET /status, GET /results
│   │   ├── agents/
│   │   │   ├── coordinator.js   # CoordinatorAgent
│   │   │   ├── analyzer.js      # AnalyzerAgent
│   │   │   ├── fixAgent.js      # FixAgent
│   │   │   ├── commitAgent.js   # CommitAgent
│   │   │   └── cicdAgent.js     # CICDAgent (optional test runner)
│   │   └── utils/
│   │       ├── repo.js          # clone, branch, push helpers
│   │       └── results.js       # build + write results.json
│   │   └── output/              # or ./output relative to run; results.json path
│   ├── package.json
│   └── (Dockerfile optional)
│
├── results.json                 # Generated per run (path fixed for API + dashboard)
├── PLAN.md                      # This file
└── README.md                    # How to run, env vars, branch/commit rules
```

**Notes:**  
- `results.json` path: either under `backend/output/results.json` or project root; API and frontend must agree.  
- One repo for frontend + backend is fine; Vercel and Render/Railway can use subdirs or separate repos if you split later.

---

## 3. SOLO-DEVELOPER BUILD ORDER

**Phase 1 – Backend skeleton (no agent logic)**  
1. Create `backend/`, Express app, CORS, health route (`GET /health`).  
2. Define route: `POST /api/run` (body: repo URL, branch/target, team name, leader name).  
3. Define routes: `GET /api/status`, `GET /api/results` (return static or empty `results.json`).  
4. Implement “write `results.json`” helper: given a JS object, write to the chosen path.  
5. Manually create a sample `results.json` matching the schema below; confirm GET returns it.

**Phase 2 – Agent core (local, no deploy)**  
6. **CoordinatorAgent:** Parse request (repo, team name, leader name), compute branch name `TEAM_NAME_LEADER_NAME_AI_Fix`, invoke pipeline steps in order.  
7. **AnalyzerAgent:** Clone repo (temp dir), run tests or parse failure output, return list of failures (file, line, type, message).  
8. **FixAgent:** For each failure, apply rule-based fixes (regex/string replacement); output list of applied fixes (file, line, bug type, fix description).  
9. **CommitAgent:** Stage all changes, commit with message `[AI-AGENT] <description>`, push to branch `TEAM_NAME_LEADER_NAME_AI_Fix`.  
10. **CICDAgent (optional):** After fixes, run tests again; if you use it, feed pass/fail into results.  
11. Wire Coordinator to write `results.json` at end of each run (success or partial failure).  
12. Test end-to-end locally with a small public repo and a known failure pattern.

**Phase 3 – API contract and results**  
13. Lock request/response and `results.json` schema (see sections 5–6).  
14. Ensure `POST /api/run` returns run id or 202 Accepted; poll via `GET /api/status` and `GET /api/results`.  
15. Ensure `results.json` is written to the same path every time and is readable by `GET /api/results`.

**Phase 4 – Frontend**  
16. Create React app (Vite or CRA), Context for API base URL.  
17. “Start run” button → POST `/api/run`, then poll `/api/status` and `/api/results`.  
18. Display: run status, list of fixes from `results.json` (bug type, file, line, fix description).  
19. Match labels/fields exactly to what judges expect (see problem statement / rubric).

**Phase 5 – Deploy and hardening**  
20. Deploy backend to Render or Railway; set env (e.g. `GITHUB_TOKEN`, `API_ORIGIN`).  
21. Deploy frontend to Vercel; set env `VITE_API_URL` (or equivalent) to backend URL.  
22. Test from dashboard: trigger run, wait, refresh results; verify branch and commits on GitHub.  
23. Double-check branch name and commit prefix; add a single “demo” run that judges can replay.

**Phase 6 – Risk reduction**  
24. Add minimal error handling and timeouts so one bad run doesn’t hang the server.  
25. (Optional) Lightweight Docker for agent (clone + run in container) if time permits; otherwise same process is acceptable.

---

## 4. INTERNAL AGENT MODULES – RESPONSIBILITIES

| Module | Responsibility | Inputs | Outputs |
|--------|----------------|--------|--------|
| **CoordinatorAgent** | Orchestrate pipeline; enforce branch name and commit prefix; call other agents in sequence; handle errors and write `results.json`. | Request params: repo URL, team name, leader name, (optional) config. | Final `results.json`; success/failure status. |
| **AnalyzerAgent** | Clone repo into temp dir; run tests (or parse CI logs); identify failures with file, line, and failure type/message. | Repo URL, branch to clone, (optional) test command. | List of failures: `{ file, line, type, message }`. |
| **FixAgent** | For each failure, apply deterministic fixes (regex/static rules). No ML. | List of failures; path to cloned repo. | List of applied fixes: `{ file, line, bugType, fixDescription }` and modified files on disk. |
| **CommitAgent** | Stage all changes, create commit with message starting with `[AI-AGENT]`, push to the exact branch `TEAM_NAME_LEADER_NAME_AI_Fix`. | Repo path, list of changed files, fix summary for commit message. | Git push success/failure. |
| **CICDAgent** | Optionally re-run tests after fixes to verify; can append pass/fail or logs to run result. | Repo path, test command. | Pass/fail and optional log snippet. |

**Branch name:** Must be exactly `TEAM_NAME_LEADER_NAME_AI_Fix` (all caps, underscores; substitute actual team name and leader name).  
**Commits:** Every commit message must start with `[AI-AGENT]`.

---

## 5. API CONTRACT

**Base URL:** Backend root (e.g. `https://your-app.onrender.com`).

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/health` | Liveness; returns 200. |
| POST | `/api/run` | Start one agent run. |
| GET | `/api/status` | Current run status (e.g. running, completed, failed). |
| GET | `/api/results` | Return current `results.json` (for dashboard). |

**POST /api/run**  
- **Body (JSON):**  
  `{ "repoUrl": "https://github.com/org/repo", "teamName": "MyTeam", "leaderName": "Jane" }`  
- **Response:**  
  - 202 Accepted + `{ "runId": "...", "status": "started" }` or  
  - 200 OK with same if run is synchronous and quick.  
- Backend starts the agent pipeline (async or sync); when done, it writes `results.json`.

**GET /api/status**  
- **Response:**  
  `{ "status": "idle" | "running" | "completed" | "failed", "runId": "...", "message": "optional" }`

**GET /api/results**  
- **Response:**  
  Raw JSON matching the `results.json` schema (see section 6), or 404 if no run has completed yet.

**CORS:** Allow frontend origin (Vercel URL) so the React app can call the API.

---

## 6. DATA STRUCTURE FOR results.json (Dashboard-Aligned)

Schema below is what the backend should write and the dashboard should consume. Field names should match evaluation rubric (e.g. “bug type”, “file”, “line”, “fix description”).

```json
{
  "runId": "uuid-or-timestamp",
  "status": "completed | failed | partial",
  "branch": "TEAM_NAME_LEADER_NAME_AI_Fix",
  "repoUrl": "https://github.com/...",
  "startedAt": "ISO8601",
  "completedAt": "ISO8601",
  "fixes": [
    {
      "file": "src/foo.js",
      "line": 42,
      "bugType": "SyntaxError | LogicError | AssertionFailure | ...",
      "fixDescription": "Short human-readable description of the change"
    }
  ],
  "summary": {
    "totalFixes": 1,
    "testsPassed": true
  },
  "error": null
}
```

- **fixes:** Array of applied fixes; each must have `file`, `line`, `bugType`, `fixDescription` so the dashboard and judges can match test cases exactly.  
- **bugType / fixDescription:** Use the exact strings from the problem’s test cases if provided; otherwise keep naming consistent.  
- **error:** If run failed, put a short message here; frontend can show it.

---

## 7. COMMON DISQUALIFICATION TRAPS – HOW TO AVOID

| Trap | How to avoid |
|------|-------------------------------|
| **Wrong branch name** | Build branch string in one place: `TEAM_NAME_LEADER_NAME_AI_Fix` with team/leader from request; no extra chars, no lowercase; validate before push. |
| **Commit message missing prefix** | Every commit message must start with `[AI-AGENT]`; format in CommitAgent only; no manual commits. |
| **results.json missing or wrong path** | Write `results.json` in a fixed path at end of every run; `GET /api/results` must serve that file; test with a real run before submission. |
| **Dashboard not showing fixes** | Dashboard must read the same schema (file, line, bugType, fixDescription); align keys with rubric and test with sample `results.json`. |
| **Agent not fully autonomous** | No “click to approve” or manual steps; one “Start run” from dashboard must trigger clone → detect → fix → commit → push. |
| **Output doesn’t match test cases** | If problem gives exact bug types/descriptions, use those strings; otherwise keep format consistent and document it. |
| **CORS / frontend can’t call API** | Allow frontend origin in Express; use env for API URL in React; test from deployed Vercel URL. |
| **Backend crashes on run** | Timeouts for clone and test runs; try/catch in Coordinator; on failure still write `results.json` with status `failed` and `error` message. |
| **Git auth failure in cloud** | Use `GITHUB_TOKEN` (or deploy key) in env; never log the token; test push from Render/Railway. |
| **Repo not cloneable by judges** | Use a public repo for demo; document in README how to trigger one run and what branch to expect. |

---

## QUICK REFERENCE

- **Branch:** `TEAM_NAME_LEADER_NAME_AI_Fix` (exact, caps, underscores).  
- **Commit:** All messages start with `[AI-AGENT]`.  
- **Output:** `results.json` at end of each run; API exposes it; dashboard displays it.  
- **Intelligence:** Rule-based (regex/static) is sufficient; no advanced ML required.  
- **Deploy:** Frontend on Vercel, backend on Render or Railway; one “Start run” = full autonomous pipeline.

You can start coding in this order: backend skeleton → agent pipeline → API + results → frontend → deploy → hardening.
