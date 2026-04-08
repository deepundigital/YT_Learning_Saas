function buildFlashcardPrompt({ video, transcriptText, count = 8 }) {
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
        "You are an AI flashcard generator for educational videos. Return only valid JSON. No markdown, no extra text."
    },
    {
      role: "user",
      content: `
Create ${count} study flashcards for this YouTube video.

Video Title: ${videoTitle}
Channel: ${channelTitle}
Duration: ${duration}
Description: ${description}

${sourceText}

Return ONLY valid JSON in this exact structure:

{
  "cards": [
    {
      "question": "string",
      "answer": "string"
    }
  ]
}
      `.trim()
    }
  ];
}

module.exports = {
  buildFlashcardPrompt
};