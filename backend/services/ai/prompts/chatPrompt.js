function buildChatPrompt({ video, transcriptText, history, question }) {
  const videoTitle = video?.title || "";
  const description = video?.description || "";
  const channelTitle = video?.channelTitle || "";
  const duration = video?.duration || "";

  const sourceText = transcriptText?.trim()
    ? `Transcript:\n${transcriptText}`
    : `Transcript not available.\nUse the video metadata only.`;

  const historyText = Array.isArray(history) && history.length
    ? history
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n")
    : "No previous chat history.";

  return [
    {
      role: "system",
      content:
        "You are an AI tutor for educational and coding videos. Answer clearly, practically, and in a student-friendly way. Keep answers grounded in the provided transcript or metadata. If transcript is missing, say the answer is based on metadata and may be limited."
    },
    {
      role: "user",
      content: `
Video Title: ${videoTitle}
Channel: ${channelTitle}
Duration: ${duration}
Description: ${description}

${sourceText}

Previous Chat:
${historyText}

User Question:
${question}

Return output in exactly this format:

ANSWER:
<clear helpful answer>

CONFIDENCE:
<high/medium/low>

BASIS:
<transcript or metadata>
      `.trim()
    }
  ];
}

module.exports = {
  buildChatPrompt
};