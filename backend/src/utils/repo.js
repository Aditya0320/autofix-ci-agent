/**
 * repo.js – clone, branch, push helpers.
 * TODO: Implement clone, create/checkout branch, push (no logic yet).
 */

/**
 * Clone repo to temp directory.
 * @param {string} repoUrl - GitHub repo URL
 * @param {string} branch - Branch to clone
 * @returns {Promise<string>} - Path to cloned repo
 */
async function cloneRepo(repoUrl, branch) {
  // TODO: clone repo, return path
  return "";
}

/**
 * Create and checkout branch.
 * @param {string} repoPath - Path to repo
 * @param {string} branchName - Branch name (e.g. BRANCH_NAME)
 * @returns {Promise<void>}
 */
async function checkoutBranch(repoPath, branchName) {
  // TODO: git checkout -b branchName
}

module.exports = { cloneRepo, checkoutBranch };
