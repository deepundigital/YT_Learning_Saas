function sanitizeVideoId(raw) {
  if (!raw) return "";
  return String(raw).trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 11);
}

function sanitizePlaylistId(raw) {
  if (!raw) return "";
  return String(raw).trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

function extractVideoIdFromUrl(url) {
  const value = String(url || "").trim();
  const match = value.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([^&\n?#]+)/);
  return match ? sanitizeVideoId(match[1]) : "";
}

function extractPlaylistIdFromUrl(url) {
  const value = String(url || "").trim();
  const match = value.match(/[?&]list=([^&]+)/);
  return match ? sanitizePlaylistId(match[1]) : "";
}

module.exports = {
  sanitizeVideoId,
  sanitizePlaylistId,
  extractVideoIdFromUrl,
  extractPlaylistIdFromUrl
};