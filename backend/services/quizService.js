function normalizeText(value) {
  return String(value || "").trim();
}

function createFallbackQuizFromText(text, title = "Generated Quiz") {
  const cleanText = normalizeText(text);

  const shortSource = cleanText
    ? cleanText.slice(0, 600)
    : "This video covers important learning concepts, examples, and revision points.";

  const questions = [
    {
      question: `What is the main focus of "${title}"?`,
      options: [
        "Entertainment only",
        "Learning key concepts",
        "Gaming setup",
        "Travel planning"
      ],
      correctAnswer: "Learning key concepts",
      explanation: "The platform treats the source as a learning resource."
    },
    {
      question: "What is the best use of notes while studying a video?",
      options: [
        "Ignore key points",
        "Write random text",
        "Capture important timestamps and concepts",
        "Only watch thumbnails"
      ],
      correctAnswer: "Capture important timestamps and concepts",
      explanation: "Timestamped notes help in revision and concept recall."
    },
    {
      question: "Why is quiz-based learning useful after a video?",
      options: [
        "It reduces understanding",
        "It checks comprehension",
        "It hides the video title",
        "It deletes history"
      ],
      correctAnswer: "It checks comprehension",
      explanation: "Quizzes are used to test and reinforce understanding."
    }
  ];

  return {
    title,
    sourcePreview: shortSource,
    questions
  };
}

function evaluateQuizAnswers(questions = [], submittedAnswers = []) {
  const evaluated = questions.map((q, index) => {
    const selectedAnswer = normalizeText(submittedAnswers[index]);
    const correctAnswer = normalizeText(q.correctAnswer);
    const isCorrect = selectedAnswer === correctAnswer;

    return {
      question: q.question,
      options: Array.isArray(q.options) ? q.options : [],
      selectedAnswer,
      correctAnswer,
      isCorrect,
      explanation: q.explanation || ""
    };
  });

  const totalQuestions = evaluated.length;
  const correctAnswers = evaluated.filter((item) => item.isCorrect).length;
  const scorePercent = totalQuestions
    ? Math.round((correctAnswers / totalQuestions) * 100)
    : 0;

  return {
    answers: evaluated,
    totalQuestions,
    correctAnswers,
    scorePercent,
    passed: scorePercent >= 70
  };
}

module.exports = {
  createFallbackQuizFromText,
  evaluateQuizAnswers
};