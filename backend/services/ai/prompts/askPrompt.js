function buildAskPrompt({ video, transcriptText, question }) {
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
        "You are an AI learning assistant for educational and coding videos. Answer clearly, honestly, and in a student-friendly way. Return ONLY valid JSON output."
    },
    {
      role: "user",
      content: `
Answer the user's question about this YouTube video.

Video Title: ${videoTitle}
Channel: ${channelTitle}
Duration: ${duration}
Description: ${description}

${sourceText}

User Question:
${question}

Return ONLY valid JSON in this structure:
{
  "answer": "clear answer",
  "confidence": "high/medium/low",
  "basis": "transcript or metadata"
}
      `.trim()
    }
  ];
}

module.exports = {
  buildAskPrompt
};