/**
 * FixAgent – apply deterministic fixes: LINTING = remove line, SYNTAX = add colon.
 */

const fs = require("fs");
const path = require("path");

/**
 * Apply fixes for given failures in repo path.
 * @param {string} repoPath - Path to cloned repo
 * @param {Array<{ file, line, bugType, message }>} failures - From AnalyzerAgent
 * @returns {Promise<Array<{ file, line, bugType, fixDescription }>>}
 */
async function applyFixes(repoPath, failures) {
  const applied = [];
  const fileLines = new Map();

  const syntaxFirst = [...failures].filter((f) => f.bugType === "SYNTAX");
  const lintingReversed = [...failures]
    .filter((f) => f.bugType === "LINTING")
    .sort((a, b) => (a.file !== b.file ? 0 : b.line - a.line));

  for (const f of syntaxFirst) {
    const absPath = path.join(repoPath, f.file);
    if (!fs.existsSync(absPath)) continue;
    if (!fileLines.has(absPath)) {
      const content = fs.readFileSync(absPath, "utf8");
      fileLines.set(absPath, content.split("\n"));
    }
    const lines = fileLines.get(absPath);
    const idx = f.line - 1;
    if (idx >= 0 && idx < lines.length) {
      const line = lines[idx];
      if (line && !line.trim().endsWith(":")) {
        lines[idx] = line.trimEnd() + ":";
        applied.push({
          file: f.file,
          line: f.line,
          bugType: "SYNTAX",
          fixDescription: "Added missing colon at end of line",
        });
      }
    }
  }

  for (const f of lintingReversed) {
    const absPath = path.join(repoPath, f.file);
    if (!fs.existsSync(absPath)) continue;
    if (!fileLines.has(absPath)) {
      const content = fs.readFileSync(absPath, "utf8");
      fileLines.set(absPath, content.split("\n"));
    }
    const lines = fileLines.get(absPath);
    const idx = f.line - 1;
    if (idx >= 0 && idx < lines.length) {
      lines[idx] = null;
      applied.push({
        file: f.file,
        line: f.line,
        bugType: "LINTING",
        fixDescription: "Removed unused import line",
      });
    }
  }

  for (const [absPath, lines] of fileLines) {
    const newContent = lines.filter((l) => l !== null).join("\n");
    fs.writeFileSync(absPath, newContent, "utf8");
  }

  return applied;
}

module.exports = { applyFixes };
