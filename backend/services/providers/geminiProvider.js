const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY || "";
const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const ai = new GoogleGenAI({ apiKey });

function cleanText(value) {
  return String(value || "").trim();
}

async function runPrompt(prompt) {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in backend/.env");
  }

  const response = await ai.models.generateContent({
    model,
    contents: prompt
  });

  return cleanText(response.text);
}

async function generateSummary(text) {
  const clean = cleanText(text);

  if (!clean) {
    throw new Error("Text is required for summary generation");
  }

  const prompt = `
You are an AI learning assistant.

Summarize the following learning content in:
1. short bullet points
2. simple student-friendly language
3. key takeaways at the end

Content:
${clean}
`;

  return runPrompt(prompt);
}

async function generateQuiz(text) {
  const clean = cleanText(text);

  if (!clean) {
    throw new Error("Text is required for quiz generation");
  }

  const prompt = `
You are an AI quiz generator.

Create exactly 5 multiple-choice questions from the content below.

Return ONLY valid JSON in this exact format:
[
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "answer": "string"
  }
]

Rules:
- 4 options per question
- answer must exactly match one of the options
- no markdown
- no explanation outside JSON

Content:
${clean}
`;

  return runPrompt(prompt);
}

async function answerDoubt(question, context = "") {
  const cleanQuestion = cleanText(question);
  const cleanContext = cleanText(context);

  if (!cleanQuestion) {
    throw new Error("Question is required");
  }

  const prompt = `
You are an AI tutor for students.

Answer the student's question clearly and in simple language.
If context is provided, use it.
If context is missing, still answer helpfully.

Context:
${cleanContext || "No extra context provided."}

Student Question:
${cleanQuestion}
`;

  return runPrompt(prompt);
}

async function generateNotes(text) {
  const clean = cleanText(text);

  if (!clean) {
    throw new Error("Text is required for note generation");
  }

  const prompt = `
You are an AI note-making assistant.

Convert the following learning content into revision notes.

Return:
- heading
- bullet points
- concise explanations
- exam/revision friendly format

Content:
${clean}
`;

  return runPrompt(prompt);
}

module.exports = {
  generateSummary,
  generateQuiz,
  answerDoubt,
  generateNotes
};