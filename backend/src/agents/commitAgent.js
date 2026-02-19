/**
 * CommitAgent – stage all, commit with [AI-AGENT] prefix, push to BRANCH_NAME (git CLI).
 */

const { execSync, execFileSync } = require("child_process");
const { COMMIT_PREFIX, BRANCH_NAME } = require("../config/constants");

/**
 * Commit and push changes. Uses first fix for message if provided.
 * @param {string} repoPath - Path to repo
 * @param {Array<{ file, line, bugType, fixDescription }>} fixes - Applied fixes (for message)
 * @param {string} [branchName] - Branch to push (default: BRANCH_NAME from constants)
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
async function commitAndPush(repoPath, fixes, branchName) {
  const branch = branchName || BRANCH_NAME;
  try {
    execSync("git add -A", { cwd: repoPath, stdio: "pipe" });
    const status = execSync("git status --short", {
      cwd: repoPath,
      encoding: "utf8",
    });
    if (!status.trim()) {
      return { success: true };
    }
    const msg =
      fixes.length > 0
        ? `${COMMIT_PREFIX} Fix ${fixes[0].bugType} in ${fixes[0].file}`
        : `${COMMIT_PREFIX} Fix applied`;
    execFileSync("git", ["commit", "-m", msg], { cwd: repoPath, stdio: "pipe" });
    execFileSync("git", ["push", "-u", "origin", branch], {
      cwd: repoPath,
      stdio: "pipe",
      timeout: 60000,
    });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err.message || String(err),
    };
  }
}

module.exports = { commitAndPush };
