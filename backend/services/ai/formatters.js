function cleanLine(line) {
  return String(line || "").replace(/^\s*-\s*/, "").trim();
}

function parseSectionList(text) {
  return String(text || "")
    .split("\n")
    .map((line) => cleanLine(line))
    .filter(Boolean);
}

function extractSection(raw, startLabel, endLabel = null) {
  const text = String(raw || "");
  const start = text.indexOf(startLabel);

  if (start === -1) return "";

  const from = start + startLabel.length;
  const sliced = text.slice(from);

  if (!endLabel) return sliced.trim();

  const end = sliced.indexOf(endLabel);
  if (end === -1) return sliced.trim();

  return sliced.slice(0, end).trim();
}

function normalizeSummary(raw) {
  const summary = extractSection(raw, "SUMMARY:", "KEY CONCEPTS:");
  const keyConcepts = parseSectionList(
    extractSection(raw, "KEY CONCEPTS:", "IMPORTANT POINTS:")
  );
  const importantPoints = parseSectionList(
    extractSection(raw, "IMPORTANT POINTS:", "REVISION POINTS:")
  );
  const revisionPoints = parseSectionList(
    extractSection(raw, "REVISION POINTS:")
  );

  return {
    summary,
    keyConcepts,
    importantPoints,
    revisionPoints,
    raw
  };
}

function normalizeAsk(raw) {
  const answer = extractSection(raw, "ANSWER:", "CONFIDENCE:");
  const confidence = extractSection(raw, "CONFIDENCE:", "BASIS:");
  const basis = extractSection(raw, "BASIS:");

  return {
    answer: answer.trim(),
    confidence: confidence.trim().toLowerCase(),
    basis: basis.trim().toLowerCase(),
    raw
  };
}

module.exports = {
  normalizeSummary,
  normalizeAsk
};