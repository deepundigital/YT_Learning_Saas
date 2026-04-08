import { useEffect, useMemo, useState } from "react";
import { AI_TABS } from "../../app/constants";
import Button from "../common/Button";

export default function AiTabs({
  loading,
  summary,
  flashcards,
  quiz,
  askResponse,
  chatMessages,
  quizAttempts = [],
  onGenerateSummary,
  onGenerateFlashcards,
  onGenerateQuiz,
  onAskAi,
  onChatAi,
  onSubmitQuiz,
}) {
  const [activeTab, setActiveTab] = useState("Summary");
  const [question, setQuestion] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [savedAttempt, setSavedAttempt] = useState(null);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [quizError, setQuizError] = useState("");

  useEffect(() => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setSavedAttempt(null);
    setQuizError("");
  }, [quiz]);

  const handleAsk = async () => {
    if (!question.trim()) return;
    await onAskAi(question);
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    await onChatAi(chatInput);
    setChatInput("");
  };

  const getCorrectAnswer = (item) => {
    return (
      item?.answer ||
      item?.correctAnswer ||
      item?.correct_option ||
      item?.correct ||
      ""
    );
  };

  const totalQuestions = quiz?.questions?.length || 0;

  const answeredCount = useMemo(() => {
    return Object.values(selectedAnswers).filter(Boolean).length;
  }, [selectedAnswers]);

  const unansweredCount = Math.max(0, totalQuestions - answeredCount);

  const score = useMemo(() => {
    if (!quiz?.questions?.length) return 0;

    let total = 0;

    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      const correct = String(getCorrectAnswer(q)).trim().toLowerCase();
      const selected = String(selectedAnswers[i] || "").trim().toLowerCase();

      if (correct && selected && correct === selected) {
        total += 1;
      }
    }

    return total;
  }, [quiz, selectedAnswers]);

  const scorePercent = totalQuestions
    ? Math.round((score / totalQuestions) * 100)
    : 0;

  const handleSubmitQuiz = async () => {
    if (!quiz?.questions?.length) return;

    setQuizError("");

    if (answeredCount === 0) {
      setQuizError("Pehle kam se kam ek answer select karo.");
      return;
    }

    setQuizSubmitted(true);
    setSavingQuiz(true);

    const answers = quiz.questions.map((item, index) => ({
      question: item.question,
      options: item.options || [],
      selectedAnswer: selectedAnswers[index] || "",
      correctAnswer: getCorrectAnswer(item),
      explanation: item.explanation || "",
      isCorrect:
        String(selectedAnswers[index] || "").trim().toLowerCase() ===
        String(getCorrectAnswer(item) || "").trim().toLowerCase(),
    }));

    const attempt = await onSubmitQuiz({ answers });
    setSavedAttempt(attempt || null);
    setSavingQuiz(false);
  };

  const normalizedHistory = useMemo(() => {
    return quizAttempts.slice(0, 5).map((attempt) => {
      const answers = Array.isArray(attempt?.answers) ? attempt.answers : [];
      const total =
        attempt?.totalQuestions ??
        answers.length;

      const correct =
        attempt?.correctAnswers ??
        answers.filter((a) => a?.isCorrect).length;

      const percent =
        attempt?.scorePercent ??
        (total ? Math.round((correct / total) * 100) : 0);

      return {
        ...attempt,
        totalQuestions: total,
        correctAnswers: correct,
        scorePercent: percent,
      };
    });
  }, [quizAttempts]);

  const askText =
    typeof askResponse === "string"
      ? askResponse
      : askResponse?.answer || askResponse?.raw || "";

  const askConfidence =
    typeof askResponse === "object" ? askResponse?.confidence : "";

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {AI_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-white/5 text-[var(--text)] hover:bg-white/10"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Summary" && (
        <div className="space-y-4">
          <Button onClick={onGenerateSummary} disabled={loading}>
            {loading ? "Generating..." : "Generate Summary"}
          </Button>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            {summary ? (
              <>
                <h3 className="font-semibold">Summary</h3>
                <p className="mt-3 text-sm text-muted">
                  {summary.summary || "No summary text available."}
                </p>

                {summary.keyConcepts?.length ? (
                  <div className="mt-4">
                    <p className="mb-2 font-medium">Key Concepts</p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                      {summary.keyConcepts.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted">No summary generated yet.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "Flashcards" && (
        <div className="space-y-4">
          <Button onClick={onGenerateFlashcards} disabled={loading}>
            {loading ? "Generating..." : "Generate Flashcards"}
          </Button>

          <div className="grid gap-3">
            {flashcards?.cards?.length ? (
              flashcards.cards.map((card, index) => (
                <div
                  key={index}
                  className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                >
                  <p className="font-medium">Q: {card.question}</p>
                  <p className="mt-2 text-sm text-muted">A: {card.answer}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-muted">No flashcards generated yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "Quiz" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={async () => {
                setSelectedAnswers({});
                setQuizSubmitted(false);
                setSavedAttempt(null);
                setQuizError("");
                await onGenerateQuiz();
              }}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Quiz"}
            </Button>

            {quiz?.questions?.length ? (
              <Button
                variant="secondary"
                onClick={handleSubmitQuiz}
                disabled={loading || savingQuiz}
              >
                {savingQuiz ? "Saving..." : "Submit Quiz"}
              </Button>
            ) : null}
          </div>

          {quiz?.questions?.length ? (
            <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="font-medium">
                  {answeredCount} / {totalQuestions} answered
                </p>
                <p className="text-muted">
                  {unansweredCount > 0
                    ? `${unansweredCount} unanswered`
                    : "All answered"}
                </p>
              </div>

              <div className="mt-3 h-2 rounded-full bg-white/5">
                <div
                  className="h-2 rounded-full bg-[linear-gradient(90deg,#4f8cff,#8b5cf6)] transition-all"
                  style={{
                    width: `${totalQuestions ? (answeredCount / totalQuestions) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ) : null}

          {quizError ? (
            <div className="rounded-[1.25rem] border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
              {quizError}
            </div>
          ) : null}

          {quizSubmitted && quiz?.questions?.length ? (
            <div className="rounded-[1.5rem] border border-blue-500/20 bg-blue-500/5 p-5">
              <p className="text-lg font-semibold">
                Score: {score} / {quiz.questions.length}
              </p>
              <p className="mt-2 text-sm text-muted">
                Accuracy: {scorePercent}% • Answers checked and highlighted below.
              </p>

              {savedAttempt ? (
                <p className="mt-3 text-sm text-emerald-300">
                  Quiz saved successfully • {savedAttempt.scorePercent ?? scorePercent}% score
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-4">
            {quiz?.questions?.length ? (
              quiz.questions.map((item, index) => {
                const correctAnswer = getCorrectAnswer(item);
                const selected = selectedAnswers[index];

                return (
                  <div
                    key={index}
                    className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                  >
                    <p className="font-medium">
                      {index + 1}. {item.question}
                    </p>

                    <div className="mt-4 grid gap-2">
                      {(item.options || []).map((option, i) => {
                        const isSelected = selected === option;
                        const isCorrect =
                          quizSubmitted &&
                          String(option).trim().toLowerCase() ===
                            String(correctAnswer).trim().toLowerCase();

                        const isWrongSelected =
                          quizSubmitted &&
                          isSelected &&
                          String(option).trim().toLowerCase() !==
                            String(correctAnswer).trim().toLowerCase();

                        return (
                          <button
                            key={i}
                            onClick={() => {
                              if (quizSubmitted) return;
                              setSelectedAnswers((prev) => ({
                                ...prev,
                                [index]: option,
                              }));
                            }}
                            className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                              isCorrect
                                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                                : isWrongSelected
                                ? "border-rose-400/40 bg-rose-500/10 text-rose-200"
                                : isSelected
                                ? "border-blue-400/40 bg-blue-500/10"
                                : "border-white/10 bg-white/5 hover:border-white/20"
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted ? (
                      <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-3">
                        <p className="text-sm">
                          <span className="font-medium text-blue-300">
                            Correct Answer:
                          </span>{" "}
                          <span className="text-muted">
                            {correctAnswer || "Not provided by AI"}
                          </span>
                        </p>

                        {item.explanation ? (
                          <p className="mt-2 text-sm text-muted">
                            {item.explanation}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : quiz?.raw ? (
              <div className="rounded-[1.5rem] border border-yellow-500/20 bg-yellow-500/5 p-5">
                <p className="text-sm font-medium text-yellow-300">
                  Quiz raw response aayi hai
                </p>
                {quiz.warning ? (
                  <p className="mt-2 text-xs text-muted">{quiz.warning}</p>
                ) : null}
                <pre className="mt-3 whitespace-pre-wrap text-sm text-muted">
                  {quiz.raw}
                </pre>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-muted">No quiz generated yet.</p>
              </div>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <h3 className="font-semibold">Recent Quiz History</h3>
            <div className="mt-4 space-y-3">
              {normalizedHistory.length ? (
                normalizedHistory.map((attempt) => (
                  <div
                    key={attempt._id}
                    className="rounded-xl border border-white/10 bg-black/10 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">
                        {attempt.title || "Quiz Attempt"}
                      </p>
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                        {attempt.scorePercent}%
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-muted">
                      Correct: {attempt.correctAnswers} / {attempt.totalQuestions}
                    </p>

                    {attempt.createdAt ? (
                      <p className="mt-1 text-xs text-muted">
                        {new Date(attempt.createdAt).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">No quiz history yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Ask AI" && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about this video..."
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 outline-none"
            />
            <Button onClick={handleAsk} disabled={loading}>
              Ask
            </Button>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            {askText ? (
              <>
                <p className="font-medium">Answer</p>
                <p className="mt-2 text-sm text-muted">{askText}</p>
                {askConfidence ? (
                  <p className="mt-3 text-xs text-muted">
                    Confidence: {askConfidence}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted">No answer yet.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "Chat" && (
        <div className="space-y-4">
          <div className="max-h-[380px] space-y-3 overflow-auto rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            {chatMessages.length ? (
              chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`rounded-2xl p-3 text-sm ${
                    msg.role === "user"
                      ? "ml-auto max-w-[85%] bg-blue-600 text-white"
                      : "max-w-[85%] bg-white/10 text-[var(--text)]"
                  }`}
                >
                  {msg.content}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">No chat messages yet.</p>
            )}
          </div>

          <div className="flex gap-3">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Chat with AI..."
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 outline-none"
            />
            <Button onClick={handleChat} disabled={loading}>
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}