/**
 * FixAgent – apply deterministic fixes: LINTING/IMPORT = remove line, SYNTAX = add colon, INDENTATION = normalize spaces.
 */

const fs = require("fs");
const path = require("path");
const { isGeminiEnabled, getFixDescription } = require("../services/gemini");

/**
 * Normalize leading whitespace to space count (tabs = 4 spaces).
 */
function indentSpaces(line) {
  const m = line.match(/^[\t ]*/);
  if (!m) return 0;
  return m[0].replace(/\t/g, "    ").length;
}

/**
 * Resolve fix description: use Gemini if enabled and returns non-empty, else static.
 */
async function resolveFixDescription(file, line, bugType, snippet, staticDesc) {
  if (!isGeminiEnabled()) return staticDesc;
  try {
    const rich = await getFixDescription({ file, line, bugType, snippet: snippet || "" });
    return rich && rich.length > 0 ? rich : staticDesc;
  } catch (_) {
    return staticDesc;
  }
}

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
  const importReversed = [...failures]
    .filter((f) => f.bugType === "IMPORT")
    .sort((a, b) => (a.file !== b.file ? 0 : b.line - a.line));
  const indentationFailures = [...failures].filter((f) => f.bugType === "INDENTATION");

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
        const snippet = line;
        lines[idx] = line.trimEnd() + ":";
        const fixDescription = await resolveFixDescription(f.file, f.line, "SYNTAX", snippet, "Added missing colon at end of line");
        applied.push({
          file: f.file,
          line: f.line,
          bugType: "SYNTAX",
          fixDescription,
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
      const snippet = lines[idx];
      lines[idx] = null;
      const fixDescription = await resolveFixDescription(f.file, f.line, "LINTING", snippet, "Removed unused import line");
      applied.push({
        file: f.file,
        line: f.line,
        bugType: "LINTING",
        fixDescription,
      });
    }
  }

  for (const f of importReversed) {
    const absPath = path.join(repoPath, f.file);
    if (!fs.existsSync(absPath)) continue;
    if (!fileLines.has(absPath)) {
      const content = fs.readFileSync(absPath, "utf8");
      fileLines.set(absPath, content.split("\n"));
    }
    const lines = fileLines.get(absPath);
    const idx = f.line - 1;
    if (idx >= 0 && idx < lines.length) {
      const snippet = lines[idx];
      lines[idx] = null;
      const fixDescription = await resolveFixDescription(f.file, f.line, "IMPORT", snippet, "Removed unused import");
      applied.push({
        file: f.file,
        line: f.line,
        bugType: "IMPORT",
        fixDescription,
      });
    }
  }

  for (const f of indentationFailures) {
    const absPath = path.join(repoPath, f.file);
    if (!fs.existsSync(absPath)) continue;
    if (!fileLines.has(absPath)) {
      const content = fs.readFileSync(absPath, "utf8");
      fileLines.set(absPath, content.split("\n"));
    }
    const lines = fileLines.get(absPath);
    const idx = f.line - 1;
    if (idx < 0 || idx >= lines.length) continue;
    const line = lines[idx];
    if (line === null) continue;
    const leading = line.match(/^[\t ]*/)?.[0] ?? "";
    const rest = line.slice(leading.length);
    if (f.message === "Mixed tabs and spaces") {
      const spaceCount = leading.replace(/\t/g, "    ").length;
      lines[idx] = " ".repeat(spaceCount) + rest;
      const fixDescription = await resolveFixDescription(f.file, f.line, "INDENTATION", line, "Normalized indentation to spaces");
      applied.push({
        file: f.file,
        line: f.line,
        bugType: "INDENTATION",
        fixDescription,
      });
    } else if (f.message === "Incorrect indent after colon") {
      const prevIdx = idx - 1;
      const prevLine = prevIdx >= 0 ? (lines[prevIdx] ?? "") : "";
      const expectedIndent = indentSpaces(prevLine) + 4;
      lines[idx] = " ".repeat(expectedIndent) + rest;
      const fixDescription = await resolveFixDescription(f.file, f.line, "INDENTATION", line, "Corrected indent after colon");
      applied.push({
        file: f.file,
        line: f.line,
        bugType: "INDENTATION",
        fixDescription,
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
