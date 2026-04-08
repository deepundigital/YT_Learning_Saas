function cleanText(value) {
  return String(value || "").trim();
}

async function generateSummary(text) {
  const clean = cleanText(text);

  const sentences = clean
    .split(/[.!?]/)
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  return sentences.map(s => "• " + s).join("\n");
}

async function generateQuiz(text) {

  const quiz = [
    {
      question: "What is the main concept discussed?",
      options: [
        "Learning concept",
        "Cooking recipe",
        "Travel guide",
        "Movie review"
      ],
      answer: "Learning concept"
    },
    {
      question: "Why are notes useful?",
      options: [
        "They help revision",
        "They delete information",
        "They remove videos",
        "They stop learning"
      ],
      answer: "They help revision"
    },
    {
      question: "What improves understanding?",
      options: [
        "Practice",
        "Ignoring content",
        "Deleting videos",
        "Stopping study"
      ],
      answer: "Practice"
    },
    {
      question: "Why take quizzes?",
      options: [
        "Check knowledge",
        "Slow learning",
        "Delete data",
        "Disable progress"
      ],
      answer: "Check knowledge"
    },
    {
      question: "What helps memory?",
      options: [
        "Revision",
        "Skipping study",
        "Ignoring notes",
        "Deleting bookmarks"
      ],
      answer: "Revision"
    }
  ];

  return JSON.stringify(quiz);
}

async function answerDoubt(question, context) {

  return `
Your question: ${question}

Based on the context:
${context || "No context provided"}

Explanation:
This topic should be understood by focusing on the definition,
a simple example, and how it is used in practice.
`;
}

async function generateNotes(text) {

  const clean = cleanText(text);

  const points = clean
    .split(/[.!?]/)
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 5);

  return points.map((p,i)=>`${i+1}. ${p}`).join("\n");
}

module.exports = {
  generateSummary,
  generateQuiz,
  answerDoubt,
  generateNotes
};