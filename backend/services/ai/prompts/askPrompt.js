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
        "You are an AI learning assistant for educational and coding videos. Answer clearly, honestly, and in a student-friendly way. If transcript is missing, say the answer is based on video metadata and may be limited."
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

Return output in exactly this format:

ANSWER:
<clear answer>

CONFIDENCE:
<high/medium/low>

BASIS:
<transcript or metadata>
      `.trim()
    }
  ];
}

module.exports = {
  buildAskPrompt
};