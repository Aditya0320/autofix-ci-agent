/**
 * results.js – ensure RESULTS_PATH dir exists, write/read results.json
 * Path used for I/O is backend/output/results.json (relative to backend root).
 */

const fs = require("fs");
const path = require("path");
const { RESULTS_PATH } = require("../config/constants");

// Resolve actual file path: from backend/src/utils -> backend/output/results.json
const getResultsFilePath = () =>
  path.join(__dirname, "..", "..", "output", "results.json");

/**
 * Ensure the directory for results.json exists.
 */
function ensureResultsDir() {
  const dir = path.dirname(getResultsFilePath());
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Write a valid sample results.json (PLAN.md schema).
 */
function writeSampleResults() {
  ensureResultsDir();
  const filePath = getResultsFilePath();
  const sample = {
    runId: "sample-run-1",
    status: "completed",
    branch: "TEAM_ETS_DEEPAK_MASEEH_AI_Fix",
    repoUrl: "https://github.com/example/repo",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    fixes: [
      {
        file: "src/foo.js",
        line: 42,
        bugType: "SYNTAX",
        fixDescription: "Sample fix description",
        status: "fixed",
      },
    ],
    summary: {
      totalFixes: 1,
      testsPassed: true,
    },
    error: null,
  };
  fs.writeFileSync(filePath, JSON.stringify(sample, null, 2), "utf8");
  return filePath;
}

/**
 * Read results.json. Returns parsed object or null if missing.
 */
function readResults() {
  const filePath = getResultsFilePath();
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Write result object to results.json (PLAN.md schema).
 * @param {Object} data - { runId, status, branch, repoUrl, startedAt, completedAt, fixes, summary, error }
 */
function writeResults(data) {
  ensureResultsDir();
  const filePath = getResultsFilePath();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  return filePath;
}

module.exports = {
  ensureResultsDir,
  writeSampleResults,
  readResults,
  writeResults,
  getResultsFilePath,
};
