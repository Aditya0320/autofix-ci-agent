/**
 * AnalyzerAgent – clone repo, checkout branch, detect Python issues (unused import, missing colon).
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { BRANCH_NAME } = require("../config/constants");

/**
 * Clone repo into temp dir and checkout BRANCH_NAME.
 * @param {string} repoUrl - GitHub repo URL
 * @returns {string} repoPath
 */
function cloneAndCheckout(repoUrl) {
  const repoPath = fs.mkdtempSync(path.join(os.tmpdir(), "agent-run-"));
  execSync(`git clone --depth 1 "${repoUrl}" "${repoPath}"`, {
    stdio: "pipe",
    timeout: 60000,
  });
  execSync(`git checkout -b "${BRANCH_NAME}"`, {
    cwd: repoPath,
    stdio: "pipe",
  });
  return repoPath;
}

/**
 * Find all .py files under dir (relative paths from repo root).
 * @param {string} dir - absolute path
 * @param {string} base - base path for relative names
 * @returns {string[]}
 */
function findPyFiles(dir, base = dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== ".git") {
      out.push(...findPyFiles(full, base));
    } else if (e.isFile() && e.name.endsWith(".py")) {
      out.push(path.relative(base, full).replace(/\\/g, "/"));
    }
  }
  return out;
}

/**
 * Check if "os" is used in file content (excluding the import line).
 */
function isOsUsed(content, excludeLineIndex) {
  const lines = content.split("\n");
  const re = /\bos\b/;
  for (let i = 0; i < lines.length; i++) {
    if (i === excludeLineIndex) continue;
    if (re.test(lines[i])) return true;
  }
  return false;
}

/**
 * Detect unused import os: line contains "import os" and os not used elsewhere.
 */
function detectUnusedImportOs(filePath, content) {
  const failures = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*import\s+os\s*$/.test(line) || /^\s*import\s+os\s*,\s*/.test(line)) {
      if (!isOsUsed(content, i)) {
        failures.push({
          file: filePath,
          line: i + 1,
          bugType: "LINTING",
          message: "Unused import: os",
        });
      }
    }
  }
  return failures;
}

/**
 * Detect missing colon at end of if/for/def/elif/else/while/with/class lines.
 */
function detectMissingColon(filePath, content) {
  const failures = [];
  const lines = content.split("\n");
  const re = /^\s*(if|for|def|elif|else|while|with|class)\b/;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (re.test(trimmed) && !trimmed.endsWith(":")) {
      failures.push({
        file: filePath,
        line: i + 1,
        bugType: "SYNTAX",
        message: "Missing colon at end of line",
      });
    }
  }
  return failures;
}

/**
 * Analyze repo and return repoPath + list of failures.
 * @param {string} repoUrl - GitHub repo URL
 * @returns {Promise<{ repoPath: string, failures: Array<{ file, line, bugType, message }> }>}
 */
async function analyze(repoUrl) {
  const repoPath = cloneAndCheckout(repoUrl);
  const failures = [];
  const pyFiles = findPyFiles(repoPath);

  for (const relPath of pyFiles) {
    const absPath = path.join(repoPath, relPath);
    const content = fs.readFileSync(absPath, "utf8");
    failures.push(...detectUnusedImportOs(relPath, content));
    failures.push(...detectMissingColon(relPath, content));
  }

  return { repoPath, failures };
}

/**
 * Analyze existing repo path (no clone). Used for retry iterations.
 * TODO: Replace with re-clone from remote when real CI integration is used.
 * @param {string} repoPath - Path to already-cloned repo
 * @returns {Promise<{ repoPath: string, failures: Array<{ file, line, bugType, message }> }>}
 */
async function analyzeExisting(repoPath) {
  const failures = [];
  const pyFiles = findPyFiles(repoPath);
  for (const relPath of pyFiles) {
    const absPath = path.join(repoPath, relPath);
    const content = fs.readFileSync(absPath, "utf8");
    failures.push(...detectUnusedImportOs(relPath, content));
    failures.push(...detectMissingColon(relPath, content));
  }
  return { repoPath, failures };
}

module.exports = { analyze, analyzeExisting };
