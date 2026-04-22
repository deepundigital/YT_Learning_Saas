/**
 * Robustly parse JSON from AI response text, handling potential markdown fencing
 * or leading/trailing text.
 * @param {string} text - The raw text from AI
 * @returns {object|null} - Parsed JSON object or null
 */
function safeJsonParse(text) {
  if (!text) return null;

  const raw = String(text).trim();

  // 1. Try direct parse
  try {
    return JSON.parse(raw);
  } catch (e) {
    // 2. Try extraction from markdown blocks
    const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fencedMatch?.[1]) {
      try {
        return JSON.parse(fencedMatch[1].trim());
      } catch (e2) {}
    }

    // 3. Try finding the first '{' and last '}'
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = raw.slice(firstBrace, lastBrace + 1).trim();
      try {
        return JSON.parse(candidate);
      } catch (e3) {}
    }
  }

  return null;
}

function normalizeSummary(raw) {
  const parsed = safeJsonParse(raw);

  if (parsed) {
    return {
      summary: parsed.summary || "",
      keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : [],
      importantPoints: Array.isArray(parsed.importantPoints) ? parsed.importantPoints : [],
      revisionPoints: Array.isArray(parsed.revisionPoints) ? parsed.revisionPoints : [],
      raw
    };
  }

  // Fallback if parsing fails (could be old format or non-JSON)
  return {
    summary: "Could not parse AI response",
    keyConcepts: [],
    importantPoints: [],
    revisionPoints: [],
    raw
  };
}

function normalizeAsk(raw) {
  const parsed = safeJsonParse(raw);

  if (parsed) {
    return {
      answer: String(parsed.answer || "").trim(),
      confidence: String(parsed.confidence || "").trim().toLowerCase(),
      basis: String(parsed.basis || "").trim().toLowerCase(),
      raw
    };
  }

  return {
    answer: "Could not parse AI response",
    confidence: "low",
    basis: "unknown",
    raw
  };
}

module.exports = {
  safeJsonParse,
  normalizeSummary,
  normalizeAsk
};