/**
 * Optional Gemini API integration.
 * All functions return null/empty when GEMINI_API_KEY is missing or on error (no throw).
 */

function isGeminiEnabled() {
  const key = process.env.GEMINI_API_KEY;
  return typeof key === "string" && key.trim().length > 0;
}

/**
 * Call Gemini generateContent with prompt. Returns response text or null on error.
 * @param {string} prompt
 * @returns {Promise<string|null>}
 */
async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (typeof key !== "string" || !key.trim()) return null;
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key.trim(),
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 512, temperature: 0.2 },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" ? text.trim() : null;
  } catch (_) {
    return null;
  }
}

/**
 * Get a richer fix description from Gemini (optional). Returns null if disabled or on error.
 * @param {{ file: string, line: number, bugType: string, snippet: string }} opts
 * @returns {Promise<string|null>}
 */
async function getFixDescription(opts) {
  if (!isGeminiEnabled()) return null;
  const { file, line, bugType, snippet } = opts;
  const prompt = `You are a code fix summarizer. In one short sentence (under 15 words), describe the fix applied.
File: ${file}, Line: ${line}, Bug type: ${bugType}
Code snippet:\n${snippet || "(none)"}
Reply with only the sentence, no quotes or prefix.`;
  try {
    const text = await callGemini(prompt);
    return text && text.length > 0 ? text : null;
  } catch (_) {
    return null;
  }
}

const ALLOWED_BUG_TYPES = new Set(["LINTING", "SYNTAX", "LOGIC", "TYPE_ERROR", "IMPORT", "INDENTATION"]);

/**
 * Ask Gemini to suggest failures. Returns array of { file, line, bugType, message } or [].
 * Only allowed bug types are included; invalid or duplicate entries are dropped by the caller.
 * @param {{ filePath: string, content: string }} opts
 * @returns {Promise<Array<{ file: string, line: number, bugType: string, message: string }>>}
 */
async function suggestFailures(opts) {
  if (!isGeminiEnabled()) return [];
  const { filePath, content } = opts;
  const prompt = `You are a Python static analyzer. For the following file, list any issues that match these types only: LINTING (unused import), SYNTAX (missing colon), LOGIC (wrong logic, off-by-one, wrong condition), TYPE_ERROR (wrong type usage, type mismatch), IMPORT (unused import other than os), INDENTATION (mixed tabs/spaces or wrong indent after colon).
For each issue reply with exactly one line: LINE:<1-based line number> TYPE:<LINTING|SYNTAX|LOGIC|TYPE_ERROR|IMPORT|INDENTATION> MSG:<short message>
File path: ${filePath}

\`\`\`
${content.slice(0, 12000)}
\`\`\`

If there are no issues, reply with only: NONE
Otherwise list one line per issue.`;
  try {
    const text = await callGemini(prompt);
    if (!text || text.trim().toUpperCase() === "NONE") return [];
    const out = [];
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const lineMatch = line.match(/LINE:(\d+)/i);
      const typeMatch = line.match(/TYPE:(LINTING|SYNTAX|LOGIC|TYPE_ERROR|IMPORT|INDENTATION)/i);
      const msgMatch = line.match(/MSG:(.+)/i);
      if (!lineMatch || !typeMatch || !ALLOWED_BUG_TYPES.has(typeMatch[1].toUpperCase())) continue;
      const lineNum = parseInt(lineMatch[1], 10);
      const bugType = typeMatch[1].toUpperCase();
      const message = (msgMatch ? msgMatch[1].trim() : bugType) || bugType;
      out.push({ file: filePath, line: lineNum, bugType, message });
    }
    return out;
  } catch (_) {
    return [];
  }
}

/**
 * Ask Gemini to suggest the fixed line for a LOGIC or TYPE_ERROR bug. Used to apply fixes.
 * @param {{ file: string, line: number, bugType: string, message: string, snippet: string, contextBefore?: string, contextAfter?: string }} opts
 * @returns {Promise<string|null>} - Replacement line text, or null
 */
async function getSuggestedFix(opts) {
  if (!isGeminiEnabled()) return null;
  const { file, line, bugType, message, snippet, contextBefore = "", contextAfter = "" } = opts;
  const prompt = `You are a Python code fixer. Fix the bug on this single line.

File: ${file}, Line: ${line}
Bug type: ${bugType}
Issue: ${message}

Context before (previous lines):
${contextBefore}

Line to fix (return ONLY this line corrected, no other text):
${snippet || "(empty)"}

Context after (following lines):
${contextAfter}

Reply with ONLY the corrected line of code, nothing else. No explanation, no markdown, no line number.`;
  try {
    const text = await callGemini(prompt);
    return text && text.length > 0 ? text.trim() : null;
  } catch (_) {
    return null;
  }
}

module.exports = { isGeminiEnabled, getFixDescription, suggestFailures, getSuggestedFix };
