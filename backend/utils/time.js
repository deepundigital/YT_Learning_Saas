function isoDurationToSeconds(iso) {
  if (!iso || typeof iso !== "string") return 0;

  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

function secondsToHMS(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");

  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

module.exports = {
  isoDurationToSeconds,
  secondsToHMS
};