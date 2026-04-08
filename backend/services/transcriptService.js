const { YoutubeTranscript } = require("youtube-transcript");

function cleanText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

async function getTranscript(videoId) {
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoId);

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Transcript not available");
    }

    const chunks = items
      .map((item) => ({
        text: cleanText(item.text),
        start: Number(item.offset || item.start || 0),
        duration: Number(item.duration || 0),
      }))
      .filter((item) => item.text);

    const rawText = chunks.map((chunk) => chunk.text).join(" ").trim();

    if (!rawText) {
      throw new Error("Transcript not available");
    }

    return {
      youtubeId: videoId,
      language: "unknown",
      chunks,
      rawText,
      source: "youtube-transcript",
    };
  } catch (err) {
    throw new Error(err.message || "Failed to fetch transcript");
  }
}

module.exports = {
  getTranscript,
};