function buildQuizPrompt({ video, transcriptText, count = 5 }) {
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
        "You are an AI quiz generator for educational and coding videos. Generate accurate multiple-choice questions in valid JSON only. No markdown, no extra text."
    },
    {
      role: "user",
      content: `
Create ${count} multiple-choice quiz questions for this YouTube video.

Video Title: ${videoTitle}
Channel: ${channelTitle}
Duration: ${duration}
Description: ${description}

${sourceText}

Return ONLY valid JSON in this exact structure:

{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "string",
      "explanation": "string"
    }
  ]
}
      `.trim()
    }
  ];
}

module.exports = {
  buildQuizPrompt
};