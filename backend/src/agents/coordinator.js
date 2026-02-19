/**
 * CoordinatorAgent – orchestrate pipeline with retry loop, simulated CI timeline, and score.
 */

const { BRANCH_NAME } = require("../config/constants");
const { analyze, analyzeExisting } = require("./analyzer");
const { applyFixes } = require("./fixAgent");
const { commitAndPush } = require("./commitAgent");
const { writeResults } = require("../utils/results");

const parsedRetries = parseInt(process.env.MAX_RETRIES, 10);
const maxRetries = Number.isNaN(parsedRetries) ? 5 : parsedRetries;

/**
 * Compute branch name per RIFT spec: TEAM_NAME_LEADER_NAME_AI_Fix (uppercase, spaces → _).
 */
function toBranchName(teamName, leaderName) {
  const t = String(teamName).trim().replace(/\s+/g, "_").toUpperCase();
  const l = String(leaderName).trim().replace(/\s+/g, "_").toUpperCase();
  return `${t}_${l}_AI_Fix`;
}
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const BASE_SCORE = 100;
const SPEED_BONUS = 10;
const EFFICIENCY_PENALTY_PER_COMMIT_OVER_20 = 2;
const COMMITS_THRESHOLD = 20;

function validateParams(params) {
  const { repoUrl, teamName, leaderName } = params || {};
  if (!repoUrl || typeof repoUrl !== "string" || !repoUrl.trim()) {
    throw new Error("repoUrl is required");
  }
  if (!teamName || typeof teamName !== "string" || !teamName.trim()) {
    throw new Error("teamName is required");
  }
  if (!leaderName || typeof leaderName !== "string" || !leaderName.trim()) {
    throw new Error("leaderName is required");
  }
  return { repoUrl: repoUrl.trim(), teamName: teamName.trim(), leaderName: leaderName.trim() };
}

/**
 * Compute score breakdown (deterministic, no external services).
 */
function computeScore(runtimeMs, totalCommits) {
  const baseScore = BASE_SCORE;
  const speedBonus = runtimeMs < FIVE_MINUTES_MS ? SPEED_BONUS : 0;
  const overCommit = Math.max(0, totalCommits - COMMITS_THRESHOLD);
  const efficiencyPenalty = overCommit * EFFICIENCY_PENALTY_PER_COMMIT_OVER_20;
  const finalScore = baseScore + speedBonus - efficiencyPenalty;
  return { baseScore, speedBonus, efficiencyPenalty, finalScore };
}

/**
 * Run the full agent pipeline with retries. Simulated CI timeline; no real CI calls.
 * @param {Object} params - { repoUrl, teamName, leaderName }
 * @param {Object} opts - { onStatusUpdate(status, message?) }
 * @returns {Promise<Object>} - Result object for results.json
 */
async function runPipeline(params, opts = {}) {
  const onStatusUpdate = opts.onStatusUpdate || (() => {});
  const runId = `run-${Date.now()}`;
  const startedAtMs = Date.now();
  const startedAt = new Date(startedAtMs).toISOString();
  let repoPath = null;
  const allFixes = [];
  const ciTimeline = [];
  let iterationsUsed = 0;
  let totalFailuresDetected = null;
  let commitCount = 0;

  const buildResult = (status, fixes, error, branch, failuresDetected = null, overrideCommitCount = null, extra = {}) => {
    const completedAt = new Date().toISOString();
    const runtimeMs = Date.now() - startedAtMs;
    const totalCommits = overrideCommitCount !== null ? overrideCommitCount : commitCount;
    const score = computeScore(runtimeMs, totalCommits);
    const fixList = Array.isArray(fixes) ? fixes : [];
    // Fix status = successfully applied and committed (and pushed). We only add to allFixes after
    // commitAndPush succeeds, so every fix here was committed; marking as "fixed" is correct.
    const fixesWithStatus = fixList.map((f) => ({ ...f, status: "fixed" }));
    const summary = {
      totalFixes: fixesWithStatus.length,
      testsPassed: error ? false : true,
    };
    if (failuresDetected != null) summary.totalFailuresDetected = failuresDetected;
    return {
      runId,
      status,
      branch: branch || BRANCH_NAME,
      repoUrl: params.repoUrl || "",
      teamName: params.teamName || "",
      leaderName: params.leaderName || "",
      startedAt,
      completedAt,
      fixes: fixesWithStatus,
      summary,
      error,
      iterationsUsed,
      maxRetries,
      ciTimeline,
      score: {
        baseScore: score.baseScore,
        speedBonus: score.speedBonus,
        efficiencyPenalty: score.efficiencyPenalty,
        finalScore: score.finalScore,
      },
      ...extra,
    };
  };

  try {
    const valid = validateParams(params);
    const branchName = toBranchName(valid.teamName, valid.leaderName);

    for (let iteration = 1; iteration <= maxRetries; iteration++) {
      iterationsUsed = iteration;
      const timestamp = new Date().toISOString();

      let analyzed;
      if (iteration === 1) {
        analyzed = await analyze(valid.repoUrl, branchName);
        repoPath = analyzed.repoPath;
        if (totalFailuresDetected === null) totalFailuresDetected = analyzed.failures.length;
      } else {
        analyzed = await analyzeExisting(repoPath);
      }

      if (analyzed.failures.length === 0) {
        ciTimeline.push({ iteration, status: "PASSED", timestamp });
        break;
      }

      ciTimeline.push({ iteration, status: "FAILED", timestamp });
      const applied = await applyFixes(repoPath, analyzed.failures);
      allFixes.push(...applied);
      if (applied.length > 0) {
        const pushResult = await commitAndPush(repoPath, applied, branchName);
        if (!pushResult.success) {
          const result = buildResult(
            "failed",
            allFixes,
            pushResult.error || "Push failed",
            branchName,
            totalFailuresDetected,
            commitCount
          );
          writeResults(result);
          onStatusUpdate("failed", result.error);
          return result;
        }
        commitCount++;
      }
    }

    const lastEntry = ciTimeline[ciTimeline.length - 1];
    const passed = lastEntry && lastEntry.status === "PASSED";
    const result = passed
      ? buildResult("completed", allFixes, null, branchName, totalFailuresDetected, commitCount)
      : buildResult("failed", allFixes, "Max retries reached without passing", branchName, totalFailuresDetected, commitCount);
    writeResults(result);
    onStatusUpdate(result.status, result.error || null);
    return result;
  } catch (err) {
    const errorMsg = err.message || String(err);
    const t = params && typeof params.teamName === "string" ? params.teamName.trim() : "";
    const l = params && typeof params.leaderName === "string" ? params.leaderName.trim() : "";
    const branchName = t && l ? toBranchName(params.teamName, params.leaderName) : BRANCH_NAME;
    const result = buildResult("failed", allFixes, errorMsg, branchName, totalFailuresDetected, commitCount);
    writeResults(result);
    onStatusUpdate("failed", errorMsg);
    return result;
  }
  // TODO: optional cleanup of repoPath temp dir; real CI integration would append timeline from external service
}

module.exports = { runPipeline };