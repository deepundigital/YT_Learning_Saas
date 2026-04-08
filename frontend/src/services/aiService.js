import api from "./api";

function withForce(url, forceRefresh = false) {
  return forceRefresh ? `${url}?forceRefresh=true` : url;
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function quizStorageKey(youtubeId) {
  const user = getStoredUser();
  const userId = user?._id || user?.id || user?.email || "guest";
  return `quizAttempts:${userId}:${youtubeId}`;
}

export async function generateSummary(videoId, forceRefresh = false) {
  const { data } = await api.post(withForce(`/ai/summary/${videoId}`, forceRefresh));
  return data;
}

export async function generateFlashcards(videoId, count = 8, forceRefresh = false) {
  const { data } = await api.post(
    withForce(`/ai/flashcards/${videoId}`, forceRefresh),
    { count }
  );
  return data;
}

export async function generateQuiz(videoId, count = 10, forceRefresh = false) {
  const { data } = await api.post(
    withForce(`/ai/quiz/${videoId}`, forceRefresh),
    { count }
  );
  return data;
}

export async function askAi(videoId, question) {
  const { data } = await api.post(`/ai/ask/${videoId}`, {
    question,
    message: question,
  });
  return data;
}

export async function chatWithAi(videoId, question) {
  const { data } = await api.post(`/ai/chat/${videoId}`, {
    question,
    message: question,
  });
  return data;
}

/*
  Temporary stable fallback:
  Quiz attempts ko localStorage me per-user + per-video scope ke saath store kar rahe hain,
  taaki app crash na kare aur fresh account me old attempts bleed na hon.
*/
export async function saveQuizAttempt({ youtubeId, title, answers }) {
  const key = quizStorageKey(youtubeId);
  const existing = JSON.parse(localStorage.getItem(key) || "[]");

  const safeAnswers = Array.isArray(answers) ? answers : [];
  const totalQuestions = safeAnswers.length;
  const correctAnswers = safeAnswers.filter((item) => item?.isCorrect).length;
  const scorePercent = totalQuestions
    ? Math.round((correctAnswers / totalQuestions) * 100)
    : 0;

  const attempt = {
    _id: `${Date.now()}`,
    youtubeId,
    title: title || "Quiz Attempt",
    answers: safeAnswers,
    totalQuestions,
    correctAnswers,
    scorePercent,
    createdAt: new Date().toISOString(),
  };

  const next = [attempt, ...existing];
  localStorage.setItem(key, JSON.stringify(next));

  return {
    ok: true,
    attempt,
  };
}

export async function getQuizAttempts(youtubeId) {
  const key = quizStorageKey(youtubeId);
  const attempts = JSON.parse(localStorage.getItem(key) || "[]");

  return {
    ok: true,
    attempts,
  };
}