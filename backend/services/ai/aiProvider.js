const { chatCompletion } = require("./aiClient");
const { buildSummaryPrompt } = require("./prompts/summaryPrompt");
const { buildAskPrompt } = require("./prompts/askPrompt");
const { buildQuizPrompt } = require("./prompts/quizPrompt");
const { buildChatPrompt } = require("./prompts/chatPrompt");
const { buildFlashcardPrompt } = require("./prompts/flashcardPrompt");
const { buildAssignmentPrompt } = require("./prompts/assignmentPrompt");
const { buildCodingPrompt } = require("./prompts/codingPrompt");

const MAX_TRANSCRIPT_LENGTH = 35000;

function truncateText(text) {
  if (!text) return "";
  if (text.length <= MAX_TRANSCRIPT_LENGTH) return text;
  return text.substring(0, MAX_TRANSCRIPT_LENGTH) + "... [Truncated for length]";
}

async function generateVideoSummary({ video, transcriptText }) {
  const messages = buildSummaryPrompt({ video, transcriptText: truncateText(transcriptText) });
  const text = await chatCompletion(messages);
  return { raw: text };
}

async function askVideoQuestion({ video, transcriptText, question }) {
  const messages = buildAskPrompt({ video, transcriptText: truncateText(transcriptText), question });
  const text = await chatCompletion(messages);
  return { raw: text };
}

async function generateVideoQuiz({ video, transcriptText, count = 5 }) {
  const messages = buildQuizPrompt({ video, transcriptText: truncateText(transcriptText), count });
  const text = await chatCompletion(messages);
  return { raw: text };
}

async function chatWithVideo({ video, transcriptText, history, question }) {
  const messages = buildChatPrompt({
    video,
    transcriptText: truncateText(transcriptText),
    history,
    question
  });
  const text = await chatCompletion(messages);
  return { raw: text };
}

async function generateFlashcards({ video, transcriptText, count = 8 }) {
  const messages = buildFlashcardPrompt({ video, transcriptText: truncateText(transcriptText), count });
  const text = await chatCompletion(messages);
  return { raw: text };
}

async function solveAssignment({ content, instructions }) {
  const messages = buildAssignmentPrompt({ content: truncateText(content), instructions });
  const text = await chatCompletion(messages);
  return { raw: text };
}

async function analyzeCodingStats({ platform, stats }) {
  const messages = buildCodingPrompt({ platform, stats });
  const text = await chatCompletion(messages);
  return { raw: text };
}

module.exports = {
  generateVideoSummary,
  askVideoQuestion,
  generateVideoQuiz,
  chatWithVideo,
  generateFlashcards,
  solveAssignment,
  analyzeCodingStats
};