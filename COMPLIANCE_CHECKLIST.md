# RIFT 2026 – Problem Statement Compliance Checklist

## ✅ COMPLIANT

| Requirement | Status | Notes |
|-------------|--------|--------|
| **React dashboard** | ✅ | Functional components + hooks, `/frontend` folder |
| **Input: GitHub repo URL** | ✅ | RunForm text input |
| **"Run Agent" button** | ✅ | With loading state ("Running…") |
| **Loading indicator while running** | ✅ | RunProgress card + disabled button |
| **Run Summary: repo URL, team, leader, branch** | ✅ | SummaryCard |
| **Total fixes applied** | ✅ | summary.totalFixes |
| **Final CI/CD status badge** | ✅ | PASSED (green) / FAILED (red) from results.status |
| **Total time taken** | ✅ | startedAt → completedAt |
| **Score: base 100, speed +10, penalty −2/commit over 20** | ✅ | ScorePanel + backend |
| **Final score + progress bar** | ✅ | ScorePanel |
| **Fixes table columns** | ✅ | File, Bug Type, Line Number, Commit Message, Status |
| **Status ✓ Fixed / ✗ Failed** | ✅ | Green/red; currently all Fixed (applied fixes only) |
| **CI/CD Timeline** | ✅ | Iteration X/Y, PASSED/FAILED, timestamp |
| **Branch format** | ✅ | `TEAM_NAME_LEADER_NAME_AI_Fix` (uppercase, underscores) |
| **Commits [AI-AGENT] prefix** | ✅ | commitAgent uses COMMIT_PREFIX |
| **results.json at end of run** | ✅ | backend/output/results.json |
| **API to trigger agent** | ✅ | POST /api/run |
| **Retry limit** | ✅ | maxRetries = 5 (default) |
| **State management** | ✅ | Context API (useApp) |
| **No push to main** | ✅ | Push to branch only |

---

## ✅ FIXED (implemented)

### 1. **Team Name / Leader Name editable**
- RunForm: Team Name and Leader Name are now **editable** text inputs (defaults "TEAM ETS" / "DEEPAK MASEEH"); values sent in POST body.

### 2. **Branch name from request**
- Backend computes branch as `TEAM_NAME_LEADER_NAME_AI_Fix` from request `teamName` and `leaderName` (uppercase, spaces → underscores). Used for clone, commit, push, and in `results.json`. SummaryCard shows `results.branch`, `results.teamName`, `results.leaderName`.

### 7. **Configurable retry limit**
- Coordinator uses `process.env.MAX_RETRIES || 5`.

### 6. **README expansion**
- README updated with: title, deployment/video placeholders, architecture, tech stack, installation, env setup, usage, supported bug types, test case alignment, repo structure, known limitations, team.

---

## ⚠ REMAINING GAPS (optional / later)


### 3. **Run Summary: "Total failures detected" (optional)**
- **Current:** Only "Total fixes applied" is shown.
- **Required:** "Total failures detected and total fixes applied" (two numbers).
- **Fix:** Backend can add `summary.totalFailuresDetected` (or similar) from analyzer failure count; dashboard shows both. Optional if backend doesn’t expose failures count yet.

### 4. **Fixes table: "✗ Failed" status (optional)**
- **Current:** All rows show "✓ Fixed" (only applied fixes are in `results.fixes`).
- **Required:** Status can be "✓ Fixed" or "✗ Failed".
- **Fix:** If backend ever sends attempted-but-failed fixes with a status, display it; otherwise current behavior matches “applied fixes only.”

### 5. **Supported bug types**
- **Required list:** LINTING, SYNTAX, LOGIC, TYPE_ERROR, IMPORT, INDENTATION.
- **Current:** Agent detects LINTING (unused `import os`) and SYNTAX (missing colon).
- **Note:** Document "supported bug types" in README; add more detectors later if needed.

### 6. **README**
- **Done:** README expanded with title, deployment/video placeholders, architecture, installation, env, usage, supported bug types, tech stack, limitations, team. Add your live URL and LinkedIn video URL before submission.

### 8. **Sandboxed execution**
- **Required:** "Code execution must be sandboxed (Docker recommended)."
- **Current:** No Docker; agent runs in Node process.
- **Note:** Add Docker option or document as known limitation; judges may accept non-Docker if documented.

### 9. **Multi-agent framework**
- **Required:** "Must use multi-agent architecture (LangGraph, CrewAI, AutoGen, etc.)."
- **Current:** Custom modular agents (Coordinator, Analyzer, Fix, Commit, CICD).
- **Note:** Align wording in README/architecture with “multi-agent style” or add a lightweight framework if rules require one by name.

---

## 🔴 DISQUALIFICATION AVOIDANCE

| Rule | Status |
|------|--------|
| Live deployment URL | ⚠ You must deploy and add URL to README |
| LinkedIn video (2–3 min, tag @RIFT2026) | ⚠ To do at submission |
| Complete README | ✅ Expanded; add deployment + video URLs |
| Output matches test cases | ✅ LINTING/SYNTAX format; extend if more test types |
| No human intervention during run | ✅ Fully autonomous |
| No hardcoded test file paths | ✅ No hardcoded paths |
| Commits have [AI-AGENT] prefix | ✅ |
| Correct branch name format | ✅ Computed from request team/leader |
| No push to main | ✅ |
| No plagiarism | N/A (your implementation) |

---

## Test case format (exact match)

- **Example 1:** `src/utils.py — Line 15: Unused import 'os'` → LINTING, file `src/utils.py`, line 15, fix: remove import.
- **Example 2:** `src/validator.py — Line 8: Missing colon` → SYNTAX, file `src/validator.py`, line 8, fix: add colon.

Ensure dashboard and results.json use **bug type** (e.g. LINTING, SYNTAX), **file**, **line**, and **fix description** so judge comparison is exact.

---

*Before submission: deploy frontend + backend, add Live URL and LinkedIn video URL to README, and record the demo video tagging @RIFT2026.*
