function buildSummaryPrompt({ video, transcriptText }) {
  const videoTitle = video?.title || "";
  const description = video?.description || "";
  const channelTitle = video?.channelTitle || "";
  const duration = video?.duration || "";

  const sourceText = transcriptText?.trim()
    ? `Transcript:\n${transcriptText}`
    : `Transcript not available.\nUse the video metadata only.`;

  return [
    {
      role: "system",
      content:
        "You are an AI learning assistant for coding and educational videos. Return concise structured study notes in clear English. Keep output practical and student-friendly."
    },
    {
      role: "user",
      content: `
Create a structured learning summary for this YouTube video.

Video Title: ${videoTitle}
Channel: ${channelTitle}
Duration: ${duration}
Description: ${description}

${sourceText}

Return output in exactly this format:

SUMMARY:
<short paragraph>

KEY CONCEPTS:
- ...
- ...
- ...

IMPORTANT POINTS:
- ...
- ...
- ...

REVISION POINTS:
- ...
- ...
- ...
      `.trim()
    }
  ];
}

module.exports = {
  buildSummaryPrompt
};