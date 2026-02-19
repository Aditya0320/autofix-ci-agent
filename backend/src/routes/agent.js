/**
 * Agent API routes – trigger run, status, results.
 * POST /api/run calls CoordinatorAgent async; GET /api/status reflects running/completed/failed.
 */

const express = require("express");
const router = express.Router();
const { readResults } = require("../utils/results");
const { runPipeline } = require("../agents/coordinator");

let runStatus = { status: "idle", runId: null, message: null };

/**
 * POST /api/run
 * Start one agent run. Returns 202 immediately; pipeline runs asynchronously.
 */
router.post("/run", (req, res) => {
  const { repoUrl, teamName, leaderName } = req.body || {};
  runStatus = { status: "running", runId: `run-${Date.now()}`, message: null };
  runPipeline(
    { repoUrl, teamName, leaderName },
    {
      onStatusUpdate(status, message) {
        runStatus = { status, runId: runStatus.runId, message: message || null };
      },
    }
  ).catch(() => {
    if (runStatus.status === "running") {
      runStatus = { status: "failed", runId: runStatus.runId, message: "Pipeline error" };
    }
  });
  res.status(202).json({ status: "started" });
});

/**
 * GET /api/status
 * Current run status: idle | running | completed | failed
 */
router.get("/status", (req, res) => {
  res.json({
    status: runStatus.status,
    runId: runStatus.runId,
    message: runStatus.message,
  });
});

/**
 * GET /api/results
 * Return results.json at RESULTS_PATH or 404.
 */
router.get("/results", (req, res) => {
  const data = readResults();
  if (data === null) {
    return res.status(404).json({ error: "No results yet" });
  }
  res.json(data);
});

module.exports = router;
