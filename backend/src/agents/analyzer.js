/**
 * AnalyzerAgent – clone repo, checkout branch, analyze repository.
 * Works with any GitHub repo: clones and creates branch regardless of language.
 * Currently runs Python static checks when .py files exist; other languages get structure-only
 * analysis (no failures). Extensible for test discovery and multi-language support.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { BRANCH_NAME } = require("../config/constants");
const { isGeminiEnabled, suggestFailures } = require("../services/gemini");

/**
 * If GITHUB_TOKEN is set and repoUrl is https://github.com/..., return URL with token for auth.
 * Avoids "could not read Username" when cloning in non-interactive environments (and for private repos).
 */
function cloneUrlWithToken(repoUrl) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token || typeof token !== "string" || !token.trim()) return repoUrl;
  const trimmed = repoUrl.trim();
  const match = trimmed.match(/^https:\/\/github\.com\/(.+)$/i);
  if (!match) return repoUrl;
  return `https://x-access-token:${token.trim()}@github.com/${match[1]}`;
}

/**
 * Clone repo into temp dir and checkout branch.
 * @param {string} repoUrl - GitHub repo URL
 * @param {string} [branchName] - Branch to create (default: BRANCH_NAME from constants)
 * @returns {string} repoPath
 */
function cloneAndCheckout(repoUrl, branchName) {
  const branch = branchName || BRANCH_NAME;
  const repoPath = fs.mkdtempSync(path.join(os.tmpdir(), "agent-run-"));
  const cloneUrl = cloneUrlWithToken(repoUrl);
  execSync("git", ["clone", "--depth", "1", cloneUrl, repoPath], {
    stdio: "pipe",
    timeout: 60000,
  });
  execSync(`git checkout -b "${branch}"`, {
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
 * Get single-module import name from line, e.g. "import foo" -> "foo". Returns null if not a simple import.
 */
function getSingleImportName(line) {
  const m = line.match(/^\s*import\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*$/);
  return m ? m[1] : null;
}

/**
 * Check if identifier is used in content (excluding excludeLineIndex).
 */
function isNameUsedInContent(content, name, excludeLineIndex) {
  const lines = content.split("\n");
  const re = new RegExp("\\b" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b");
  for (let i = 0; i < lines.length; i++) {
    if (i === excludeLineIndex) continue;
    if (re.test(lines[i])) return true;
  }
  return false;
}

/**
 * Detect unused single-module imports other than "os" (os is handled by LINTING).
 */
function detectUnusedImportGeneral(filePath, content) {
  const failures = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const name = getSingleImportName(lines[i]);
    if (!name || name === "os") continue;
    if (!isNameUsedInContent(content, name, i)) {
      failures.push({
        file: filePath,
        line: i + 1,
        bugType: "IMPORT",
        message: "Unused import: " + name,
      });
    }
  }
  return failures;
}

/**
 * Normalize leading whitespace to count of spaces (tabs = 4 spaces).
 */
function indentSpaces(line) {
  const m = line.match(/^[\t ]*/);
  if (!m) return 0;
  return m[0].replace(/\t/g, "    ").length;
}

/**
 * Detect indentation issues: mixed tabs/spaces, and wrong indent after ':'.
 */
function detectIndentation(filePath, content) {
  const failures = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const leading = line.match(/^[\t ]*/)?.[0] ?? "";
    if (/\t/.test(leading) && / /.test(leading)) {
      failures.push({
        file: filePath,
        line: i + 1,
        bugType: "INDENTATION",
        message: "Mixed tabs and spaces",
      });
    }
    const trimmed = line.trim();
    if (trimmed.endsWith(":") && !trimmed.startsWith("#")) {
      const currentIndent = indentSpaces(line);
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      if (j < lines.length) {
        const nextIndent = indentSpaces(lines[j]);
        if (nextIndent <= currentIndent) {
          failures.push({
            file: filePath,
            line: j + 1,
            bugType: "INDENTATION",
            message: "Incorrect indent after colon",
          });
        }
      }
    }
  }
  return failures;
}

/**
 * Analyze repo and return repoPath + list of failures.
 * @param {string} repoUrl - GitHub repo URL
 * @param {string} [branchName] - Branch to create (default: BRANCH_NAME)
 * @returns {Promise<{ repoPath: string, failures: Array<{ file, line, bugType, message }> }>}
 */
async function analyze(repoUrl, branchName) {
  const repoPath = cloneAndCheckout(repoUrl, branchName);
  const failures = [];
  const pyFiles = findPyFiles(repoPath);

  for (const relPath of pyFiles) {
    const absPath = path.join(repoPath, relPath);
    const content = fs.readFileSync(absPath, "utf8");
    failures.push(...detectUnusedImportOs(relPath, content));
    failures.push(...detectMissingColon(relPath, content));
    failures.push(...detectUnusedImportGeneral(relPath, content));
    failures.push(...detectIndentation(relPath, content));
  }

  if (isGeminiEnabled()) {
    const ruleKey = (f) => `${f.file}:${f.line}`;
    const ruleSet = new Set(failures.map(ruleKey));
    for (const relPath of pyFiles) {
      const absPath = path.join(repoPath, relPath);
      const content = fs.readFileSync(absPath, "utf8");
      const suggested = await suggestFailures({ filePath: relPath, content });
      for (const s of suggested) {
        if (ruleSet.has(ruleKey(s))) continue;
        ruleSet.add(ruleKey(s));
        failures.push(s);
      }
    }
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
    failures.push(...detectUnusedImportGeneral(relPath, content));
    failures.push(...detectIndentation(relPath, content));
  }

  if (isGeminiEnabled()) {
    const ruleKey = (f) => `${f.file}:${f.line}`;
    const ruleSet = new Set(failures.map(ruleKey));
    for (const relPath of pyFiles) {
      const absPath = path.join(repoPath, relPath);
      const content = fs.readFileSync(absPath, "utf8");
      const suggested = await suggestFailures({ filePath: relPath, content });
      for (const s of suggested) {
        if (ruleSet.has(ruleKey(s))) continue;
        ruleSet.add(ruleKey(s));
        failures.push(s);
      }
    }
  }

  return { repoPath, failures };
}

module.exports = { analyze, analyzeExisting };
