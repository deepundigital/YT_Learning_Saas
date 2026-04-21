const { chatCompletion } = require("./aiClient");
const { buildSummaryPrompt } = require("./prompts/summaryPrompt");
const { buildAskPrompt } = require("./prompts/askPrompt");
const { buildQuizPrompt } = require("./prompts/quizPrompt");
const { buildChatPrompt } = require("./prompts/chatPrompt");
const { buildFlashcardPrompt } = require("./prompts/flashcardPrompt");
const { buildAssignmentPrompt } = require("./prompts/assignmentPrompt");

async function generateVideoSummary({ video, transcriptText }) {
  const messages = buildSummaryPrompt({ video, transcriptText });
  const text = await chatCompletion(messages);
  return { raw: text };
}

async function askVideoQuestion({ video, transcriptText, question }) {
  const messages = buildAskPrompt({ video, transcriptText, question });
  const text = await chatCompletion(messages);
  return { raw: text };
}

async function generateVideoQuiz({ video, transcriptText, count = 5 }) {
  const messages = buildQuizPrompt({ video, transcriptText, count });
  const text = await chatCompletion(messages);
  return { raw: text };
}

async function chatWithVideo({ video, transcriptText, history, question }) {
  const messages = buildChatPrompt({
    video,
    transcriptText,
    history,
    question
  });
  const text = await chatCompletion(messages);
  return { raw: text };
}

async function generateFlashcards({ video, transcriptText, count = 8 }) {
  const messages = buildFlashcardPrompt({ video, transcriptText, count });
  const text = await chatCompletion(messages);
  return { raw: text };
}

async function solveAssignment({ content, instructions }) {
  const messages = buildAssignmentPrompt({ content, instructions });
  const text = await chatCompletion(messages);
  return { raw: text };
}

module.exports = {
  generateVideoSummary,
  askVideoQuestion,
  generateVideoQuiz,
  chatWithVideo,
  generateFlashcards,
  solveAssignment
};