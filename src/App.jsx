import { memo, useCallback, useEffect, useRef, useState } from "react";
import { uiadav1Quiz } from "./data/uiadav1Quiz";

const TIMED_EXAM_ID = "uiadav1-practice-exam";

const createExamTimer = (resetKey = 0) => ({
  started: false,
  running: false,
  totalSeconds: 0,
  currentQuestion: 0,
  inProgressTimes: {},
  completedTimes: {},
  answeredCount: 0,
  resetKey,
});

const formatDuration = (seconds, includeHours = false) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  const parts = [minutes, remainingSeconds];
  if (includeHours || hours > 0) parts.unshift(hours);
  return parts.map(part => String(part).padStart(2, "0")).join(":");
};

const topics = [
  {
    id: "uiadav1-practice-exam",
    icon: "✓",
    title: "UI-ADAv1 Practice Exam",
    subtitle: `${uiadav1Quiz.length} Certification Practice Questions`,
    color: "#F59E0B",
    quizLabel: "UI-ADAV1 PRACTICE EXAM",
    sections: [
      {
        heading: "About This Practice Exam",
        content: `This practice exam contains <strong>${uiadav1Quiz.length} questions</strong> from the supplied <a href="${import.meta.env.BASE_URL}uipath.pdf" target="_blank" rel="noreferrer">UiPath PDF</a>, including its answers, explanations, and exhibits.<br/><br/>
Select an answer for immediate feedback. For questions with multiple correct answers, select all your choices and click <strong>Check answers</strong>. For hotspot and drag-and-drop questions, work out your response, then click <strong>Reveal answer</strong> to review the supplied solution. Review questions do not count toward your score.<br/><br/>
Answers and explanations follow the supplied PDF. Each question links to its source page.`
      }
    ],
    quiz: uiadav1Quiz
  }
];

function ExamTimerPanel({ timer, color, totalQuestions, onReset, compact = false }) {
  const currentTime = timer.currentQuestion === null
    ? 0
    : timer.inProgressTimes[timer.currentQuestion] ?? 0;
  const averageTime = timer.answeredCount > 0
    ? Math.round(
        Object.values(timer.completedTimes).reduce((total, seconds) => total + seconds, 0)
          / timer.answeredCount
      )
    : null;

  return (
    <div style={{
      margin: compact ? "0 0 16px" : "12px",
      padding: "12px",
      background: `linear-gradient(135deg, ${color}12, var(--bg-section-header))`,
      border: `1px solid ${color}45`,
      borderRadius: 9,
    }}>
      <div style={{ fontSize: 9, color, letterSpacing: 1.5, fontWeight: 800, marginBottom: 10 }}>
        EXAM TIMER
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <div style={{ fontSize: 8, color: "var(--text-faint)", letterSpacing: 1 }}>TOTAL TIME</div>
          <div style={{ fontSize: 17, color: "var(--text-primary)", fontWeight: 800, marginTop: 3 }}>
            {formatDuration(timer.totalSeconds, true)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: "var(--text-faint)", letterSpacing: 1 }}>
            {timer.currentQuestion === null ? "STATUS" : `QUESTION ${timer.currentQuestion + 1}`}
          </div>
          <div style={{ fontSize: 17, color: timer.currentQuestion === null ? "#34D399" : color, fontWeight: 800, marginTop: 3 }}>
            {timer.currentQuestion === null ? "DONE" : formatDuration(currentTime)}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 10 }}>
        {timer.answeredCount} of {totalQuestions} answered
      </div>
      <div style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 8,
        marginTop: 8,
        paddingTop: 8,
        borderTop: "1px solid var(--border-primary)",
      }}>
        <div style={{ fontSize: 8, color: "var(--text-faint)", letterSpacing: 1 }}>
          AVERAGE / QUESTION
        </div>
        <div style={{ fontSize: 14, color, fontWeight: 800 }}>
          {averageTime === null ? "--:--" : formatDuration(averageTime)}
        </div>
      </div>
      <div style={{ height: 4, background: "var(--border-primary)", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
        <div style={{
          width: `${(timer.answeredCount / totalQuestions) * 100}%`,
          height: "100%",
          background: color,
          transition: "width 0.2s ease",
        }} />
      </div>
      <button
        type="button"
        onClick={onReset}
        disabled={!timer.started}
        style={{
          width: "100%",
          marginTop: 10,
          padding: "6px 8px",
          background: "transparent",
          border: "1px solid var(--border-primary)",
          borderRadius: 6,
          color: timer.started ? "var(--text-secondary)" : "var(--text-faint)",
          cursor: timer.started ? "pointer" : "not-allowed",
          fontFamily: "inherit",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 0.5,
        }}
      >
        RESET TEST & TIMER
      </button>
    </div>
  );
}

const QuizSection = memo(function QuizSection({
  topicId,
  questions,
  color,
  label = "CERTIFICATION TRAP QUESTIONS",
  questionTimes,
  onQuestionFocus,
  onQuestionSubmit,
}) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [savedQuestions, setSavedQuestions] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`uipath-saved-questions-${topicId}-pdf377-v1`) || "[]");
      return Array.isArray(saved) ? saved.filter(index => Number.isInteger(index) && index >= 0 && index < questions.length) : [];
    } catch {
      return [];
    }
  });
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [saveError, setSaveError] = useState("");

  const toggleSavedQuestion = (qi) => {
    const nextSaved = savedQuestions.includes(qi)
      ? savedQuestions.filter(index => index !== qi)
      : [...savedQuestions, qi];
    try {
      localStorage.setItem(`uipath-saved-questions-${topicId}-pdf377-v1`, JSON.stringify(nextSaved));
      setSavedQuestions(nextSaved);
      setSaveError("");
    } catch {
      setSaveError("Unable to save this question. Please allow browser storage and try again.");
    }
  };

  const submitQuestion = (qi) => {
    if (submitted[qi]) return;
    onQuestionFocus?.(qi);
    const nextSubmitted = { ...submitted, [qi]: true };
    const nextQuestion = questions.findIndex((_, index) => !nextSubmitted[index]);
    setSubmitted(nextSubmitted);
    onQuestionSubmit?.(qi, nextQuestion);
  };

  const handleSelect = (qi, oi) => {
    if (submitted[qi]) return;
    onQuestionFocus?.(qi);
    if (questions[qi].type === "multiple") {
      setAnswers(prev => {
        const selected = prev[qi] || [];
        return { ...prev, [qi]: selected.includes(oi) ? selected.filter(index => index !== oi) : [...selected, oi] };
      });
    } else {
      setAnswers(prev => ({ ...prev, [qi]: oi }));
      submitQuestion(qi);
    }
  };
  const isAnswerCorrect = (qi) => questions[qi].type === "multiple"
    ? answers[qi]?.length === questions[qi].answers.length && questions[qi].answers.every(index => answers[qi].includes(index))
    : answers[qi] === questions[qi].answer;
  const graded = Object.keys(submitted).filter(qi => questions[qi].type !== "review");
  const totalSubmitted = graded.length;
  const totalCorrect = graded.filter(isAnswerCorrect).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 11, color, letterSpacing: 2, fontWeight: 700 }}>
          {label}
        </div>
        {totalSubmitted > 0 && (
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: totalCorrect === totalSubmitted ? "#34D399" : totalCorrect >= totalSubmitted / 2 ? "#FBBF24" : "#F87171",
            background: "var(--bg-root)",
            border: `1px solid ${color}30`,
            borderRadius: 20,
            padding: "3px 12px"
          }}>
            {totalCorrect} / {totalSubmitted} correct
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {[false, true].map(savedOnly => (
          <button
            key={String(savedOnly)}
            type="button"
            aria-pressed={showSavedOnly === savedOnly}
            onClick={() => setShowSavedOnly(savedOnly)}
            style={{ padding: "8px 12px", borderRadius: 7, border: `1px solid ${showSavedOnly === savedOnly ? color : "var(--border-primary)"}`, background: "var(--bg-root)", color: showSavedOnly === savedOnly ? color : "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}
          >
            {savedOnly ? `Saved Questions (${savedQuestions.length})` : "All Questions"}
          </button>
        ))}
      </div>
      {saveError && <p role="alert" style={{ color: "#F87171", fontSize: 12 }}>{saveError}</p>}
      {showSavedOnly && savedQuestions.length === 0 && (
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No saved questions yet. Choose All Questions and use Save Question to bookmark one for later.</p>
      )}

      {questions.map((q, qi) => {
        if (showSavedOnly && !savedQuestions.includes(qi)) return null;
        const isSubmitted = !!submitted[qi];
        const selected = answers[qi];
        const isCorrect = isAnswerCorrect(qi);
        const isReview = q.type === "review";

        return (
          <div key={qi} style={{
            marginBottom: 16,
            border: `1px solid ${isSubmitted ? (isReview ? `${color}40` : isCorrect ? "#34D39940" : "#F8717140") : "var(--border-primary)"}`,
            borderRadius: 10,
            overflow: "hidden",
            background: "var(--bg-root)"
          }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-primary)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 1 }}>
                  {q.sourceNumber ? `SOURCE QUESTION ${q.sourceNumber} · ` : ""}QUESTION {qi + 1} OF {questions.length}
                </span>
                <button
                  type="button"
                  aria-pressed={savedQuestions.includes(qi)}
                  aria-label={`${savedQuestions.includes(qi) ? "Unsave" : "Save"} question ${qi + 1}`}
                  onClick={() => toggleSavedQuestion(qi)}
                  style={{ padding: "7px 10px", border: `1px solid ${savedQuestions.includes(qi) ? color : "var(--border-primary)"}`, borderRadius: 7, background: "var(--bg-option)", color: savedQuestions.includes(qi) ? color : "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}
                >
                  {savedQuestions.includes(qi) ? "Saved Question" : "Save Question"}
                </button>
                {isSubmitted && questionTimes?.[qi] !== undefined && (
                  <span style={{ fontSize: 10, color, letterSpacing: 1, whiteSpace: "nowrap" }}>
                    TIME {formatDuration(questionTimes[qi])}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6, fontWeight: 600 }}>
                {q.q}
              </div>
              <a href={`${import.meta.env.BASE_URL}uipath.pdf#page=${q.sourcePage}`} target="_blank" rel="noreferrer" style={{ color, fontSize: 12 }}>View source PDF ? page {q.sourcePage}</a>
              {q.exhibits?.map(src => (
                <a key={src} href={import.meta.env.BASE_URL + src} target="_blank" rel="noreferrer" aria-label={`Enlarge exhibit for question ${q.sourceNumber}`}>
                  <img src={import.meta.env.BASE_URL + src} alt={`Source exhibit for question ${q.sourceNumber}`} loading="lazy" style={{ display: "block", maxWidth: "100%", height: "auto", marginTop: 12, background: "white" }} />
                </a>
              ))}
            </div>

            <div style={{ padding: "12px 14px" }}>
              {q.type === "multiple" && <p style={{ color, fontSize: 12 }}>Select {q.answers.length} answers, then check your choices.</p>}
              {q.options.map((opt, oi) => {
                const optionCorrect = q.answers.includes(oi);
                const optionSelected = Array.isArray(selected) ? selected.includes(oi) : selected === oi;
                let bg = "var(--bg-option)";
                let borderColor = "var(--border-primary)";
                let textColor = "var(--text-secondary)";

                if (isSubmitted) {
                  if (optionCorrect) {
                    bg = "#052e16"; borderColor = "#34D399"; textColor = "#86EFAC";
                  } else if (optionSelected && !isCorrect) {
                    bg = "#2d0a0a"; borderColor = "#F87171"; textColor = "#FCA5A5";
                  }
                } else if (optionSelected) {
                  bg = `${color}15`; borderColor = color; textColor = "#fff";
                }

                const circleColor = isSubmitted && optionCorrect ? "#34D399"
                  : isSubmitted && optionSelected && !isCorrect ? "#F87171"
                  : optionSelected && !isSubmitted ? color
                  : "transparent";
                const circleText = isSubmitted && (optionCorrect || (optionSelected && !isCorrect)) ? "#000"
                  : optionSelected && !isSubmitted ? "#000"
                  : textColor;

                return (
                  <button
                    type="button"
                    key={oi}
                    onClick={() => handleSelect(qi, oi)}
                    disabled={isSubmitted}
                    aria-pressed={optionSelected}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      marginBottom: 6,
                      border: `1px solid ${borderColor}`,
                      borderRadius: 7,
                      cursor: isSubmitted ? "default" : "pointer",
                      background: bg,
                      color: textColor,
                      fontFamily: "inherit",
                      fontSize: 16,
                      textAlign: "left",
                      lineHeight: 1.5,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      transition: "all 0.15s"
                    }}
                  >
                    <span style={{
                      minWidth: 20, height: 20,
                      border: `1px solid ${borderColor}`,
                      borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, flexShrink: 0,
                      background: circleColor,
                      color: circleText
                    }}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                );
              })}

              {!isSubmitted && (q.type === "multiple" || isReview) && (
                <button type="button" onClick={() => submitQuestion(qi)} disabled={!isReview && !selected?.length}
                  style={{ padding: "10px 16px", margin: "8px 0", borderRadius: 7, border: `1px solid ${color}`, background: "var(--bg-option)", color, cursor: "pointer", fontFamily: "inherit" }}>
                  {isReview ? "Reveal answer" : "Check answers"}
                </button>
              )}
              {isSubmitted && (
                <div style={{
                  marginTop: 10,
                  padding: "12px 14px",
                  background: isReview ? "var(--bg-option)" : isCorrect ? "#052e1660" : "#2d0a0a60",
                  border: `1px solid ${isCorrect ? "#34D39930" : "#F8717130"}`,
                  borderRadius: 8
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 800, letterSpacing: 1,
                    color: isReview ? color : isCorrect ? "#34D399" : "#F87171",
                    marginBottom: 8
                  }}>
                    {isReview ? "SOURCE ANSWER - REVIEW" : isCorrect ? "CORRECT" : "INCORRECT - Correct answer: " + q.answerText}
                  </div>
                  {isReview && <div style={{ whiteSpace: "pre-line", color: "var(--text-primary)", fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>{q.answerText}</div>}
                  {q.trap && (
                    <div style={{ fontSize: 11, color: "#FBBF24", marginBottom: 8, lineHeight: 1.7 }}>
                      <strong style={{ color: "#FCD34D" }}>TRAP: </strong>{q.trap}
                    </div>
                  )}
                  {q.explanation && (
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                      <strong style={{ color: "var(--text-primary)" }}>Why: </strong>{q.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default function UiPathCourse() {
  const rootRef = useRef(null);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("uipath-theme");
    if (saved) return saved === "dark";
    return !window.matchMedia("(prefers-color-scheme: light)").matches;
  });

  const toggleTheme = () => setIsDark(prev => !prev);

  useEffect(() => {
    if (rootRef.current) {
      isDark
        ? rootRef.current.removeAttribute("data-theme")
        : rootRef.current.setAttribute("data-theme", "light");
    }
    localStorage.setItem("uipath-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const [active, setActive] = useState(TIMED_EXAM_ID);
  const [openSections, setOpenSections] = useState({});
  const [activeTab, setActiveTab] = useState("content");
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [examTimer, setExamTimer] = useState(() => createExamTimer());

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!examTimer.running) return undefined;

    const intervalId = window.setInterval(() => {
      setExamTimer(prev => {
        if (!prev.running || prev.currentQuestion === null) return prev;
        return {
          ...prev,
          totalSeconds: prev.totalSeconds + 1,
          inProgressTimes: {
            ...prev.inProgressTimes,
            [prev.currentQuestion]: (prev.inProgressTimes[prev.currentQuestion] ?? 0) + 1,
          },
        };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [examTimer.running]);

  const topic = topics.find(t => t.id === active);

  const resetExamTimer = useCallback(() => {
    const restartImmediately = active === TIMED_EXAM_ID && activeTab === "quiz";
    setExamTimer(prev => ({
      ...createExamTimer(prev.resetKey + 1),
      started: restartImmediately,
      running: restartImmediately,
      inProgressTimes: restartImmediately ? { 0: 0 } : {},
    }));
  }, [active, activeTab]);

  const startExamTimer = useCallback(() => {
    setExamTimer(prev => prev.started ? prev : {
      ...prev,
      started: true,
      running: true,
      currentQuestion: 0,
      inProgressTimes: { 0: 0 },
    });
  }, []);

  const focusTimedQuestion = useCallback((questionIndex) => {
    setExamTimer(prev => {
      if (!prev.started || Object.hasOwn(prev.completedTimes, questionIndex)) return prev;
      return {
        ...prev,
        currentQuestion: questionIndex,
        inProgressTimes: {
          ...prev.inProgressTimes,
          [questionIndex]: prev.inProgressTimes[questionIndex] ?? 0,
        },
      };
    });
  }, []);

  const submitTimedQuestion = useCallback((questionIndex, nextQuestion) => {
    setExamTimer(prev => {
      if (!prev.started || Object.hasOwn(prev.completedTimes, questionIndex)) return prev;
      const completedTimes = {
        ...prev.completedTimes,
        [questionIndex]: prev.inProgressTimes[questionIndex] ?? 0,
      };
      const answeredCount = Object.keys(completedTimes).length;
      const isComplete = answeredCount === uiadav1Quiz.length;

      return {
        ...prev,
        completedTimes,
        answeredCount,
        currentQuestion: isComplete ? null : nextQuestion,
        running: !isComplete,
        inProgressTimes: nextQuestion < 0 ? prev.inProgressTimes : {
          ...prev.inProgressTimes,
          [nextQuestion]: prev.inProgressTimes[nextQuestion] ?? 0,
        },
      };
    });
  }, []);

  const handleTopicChange = (id) => {
    if (active === TIMED_EXAM_ID && id !== TIMED_EXAM_ID) {
      setExamTimer(prev => createExamTimer(prev.resetKey + 1));
    }
    setActive(id);
    setOpenSections({});
    setActiveTab("content");
    if (isMobile) setSidebarOpen(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (active === TIMED_EXAM_ID && tab === "quiz") startExamTimer();
  };

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div ref={rootRef} style={{
      minHeight: "100vh",
      background: "var(--bg-root)",
      fontFamily: "'Courier New', Consolas, monospace",
      color: "var(--text-primary)",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, var(--bg-section-header), var(--border-primary))",
        borderBottom: "1px solid var(--border-header)",
        padding: isMobile ? "10px 14px" : "14px 24px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexShrink: 0
      }}>
        <div style={{
          width: 38, height: 38,
          background: "linear-gradient(135deg, #00C6FF, #0072FF)",
          borderRadius: 9,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 900, color: "#fff",
          boxShadow: "0 0 18px rgba(0,198,255,0.35)"
        }}>U</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: 0.5 }}>
            UiPath Studio — Certification Course
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 2, textTransform: "uppercase" }}>
            Deep Dive + Exam Trap Questions
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>🌙</span>
          <div
            onClick={toggleTheme}
            role="switch"
            aria-checked={!isDark}
            aria-label="Toggle light mode"
            style={{
              width: 40, height: 22,
              background: isDark ? "#1E293B" : "#0072FF",
              border: `1px solid ${isDark ? "#334155" : "#0060D0"}`,
              borderRadius: 11,
              position: "relative",
              cursor: "pointer",
              flexShrink: 0
            }}
          >
            <div style={{
              width: 16, height: 16,
              background: isDark ? "#60A5FA" : "#FFFFFF",
              borderRadius: "50%",
              position: "absolute",
              top: 2,
              left: isDark ? 2 : 22,
              transition: "left 0.2s ease, background-color 0.2s ease"
            }} />
          </div>
          <span style={{ fontSize: 14 }}>☀️</span>
        </div>
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(p => !p)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={sidebarOpen}
            style={{
              background: "none",
              border: "1px solid var(--text-faint)",
              borderRadius: 6,
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 18,
              padding: "4px 8px",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>
        )}
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{
          width: sidebarOpen ? 200 : 0,
          background: "var(--bg-sidebar)",
          overflowY: sidebarOpen ? "auto" : "hidden",
          overflowX: "hidden",
          flexShrink: 0,
          transition: "width 0.25s ease",
        }}>
          <div style={{ width: 200 }}>
            {topics.map(t => (
              <button
                key={t.id}
                onClick={() => handleTopicChange(t.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "11px 13px",
                  background: active === t.id ? `linear-gradient(90deg, ${t.color}15, transparent)` : "transparent",
                  border: "none",
                  borderLeft: active === t.id ? `3px solid ${t.color}` : "3px solid transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 9
                }}
              >
                <span style={{ fontSize: 15 }}>{t.icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: active === t.id ? t.color : "var(--text-secondary)", lineHeight: 1.3 }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: 9, color: "var(--text-faint)", marginTop: 1 }}>
                    {t.quiz.length} questions
                  </div>
                </div>
              </button>
            ))}
            {active === TIMED_EXAM_ID && (
              <ExamTimerPanel
                timer={examTimer}
                color={topic.color}
                totalQuestions={topic.quiz.length}
                onReset={resetExamTimer}
              />
            )}
          </div>
        </div>

        {/* Desktop chevron toggle */}
        {!isMobile && (
          <button
            onClick={() => setSidebarOpen(p => !p)}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={sidebarOpen}
            style={{
              width: 18,
              background: "var(--bg-sidebar)",
              border: "none",
              borderRight: "1px solid var(--border-primary)",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: 14,
              flexShrink: 0,
              padding: "8px 0 0 0",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
            }}
          >
            {sidebarOpen ? "‹" : "›"}
          </button>
        )}

        {/* Main content */}
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px 14px" : "18px 24px" }}>
          {/* Topic header */}
          <div style={{
            background: `linear-gradient(135deg, ${topic.color}15, var(--bg-section-header) 60%)`,
            border: `1px solid ${topic.color}35`,
            borderRadius: 11,
            padding: "14px 18px",
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <span style={{ fontSize: 28 }}>{topic.icon}</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: topic.color }}>{topic.title}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{topic.subtitle}</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {[
              { key: "content", label: "Study Content" },
              { key: "quiz", label: `Exam Questions (${topic.quiz.length})` }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                style={{
                  padding: "7px 18px",
                  background: activeTab === tab.key ? topic.color : "var(--bg-section-header)",
                  border: `1px solid ${activeTab === tab.key ? topic.color : "var(--border-primary)"}`,
                  borderRadius: 20,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  color: activeTab === tab.key ? "#000" : "var(--text-muted)",
                  textTransform: "uppercase",
                  transition: "all 0.2s"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isMobile && active === TIMED_EXAM_ID && examTimer.started && (
            <ExamTimerPanel
              timer={examTimer}
              color={topic.color}
              totalQuestions={topic.quiz.length}
              onReset={resetExamTimer}
              compact
            />
          )}

          {/* Content tab */}
          {activeTab === "content" && topic.sections.map((section, i) => {
            const key = `${topic.id}-${i}`;
            const isOpen = openSections[key] !== false;
            return (
              <div key={key} style={{
                marginBottom: 12,
                border: "1px solid var(--border-primary)",
                borderRadius: 10,
                overflow: "hidden",
                background: "var(--bg-card)"
              }}>
                <button
                  onClick={() => toggleSection(key)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "11px 15px",
                    background: "var(--bg-section-header)",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: topic.color,
                      boxShadow: `0 0 7px ${topic.color}`
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                      {section.heading}
                    </span>
                  </div>
                  <span style={{ color: topic.color, fontSize: 15, fontWeight: 700 }}>
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: "14px 16px" }}>
                    <div
                      style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-secondary)", marginBottom: 12 }}
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                    {section.code && (
                      <div style={{
                        background: "var(--bg-code)",
                        border: `1px solid ${topic.color}28`,
                        borderRadius: 8,
                        padding: "12px 14px",
                        overflow: "auto"
                      }}>
                        <div style={{
                          fontSize: 9, color: topic.color, letterSpacing: 2,
                          marginBottom: 7, textTransform: "uppercase", fontWeight: 700
                        }}>
                          CODE EXAMPLE
                        </div>
                        <pre style={{
                          margin: 0, fontSize: 11, lineHeight: 1.7,
                          whiteSpace: "pre-wrap", wordBreak: "break-word"
                        }}>
                          {section.code.split("\n").map((line, li) => {
                            const isComment = line.trim().startsWith("//") || line.trim().startsWith("'");
                            const isHighlight = line.trim().startsWith("->") || line.trim().startsWith("->");
                            return (
                              <span key={li} style={{
                                color: isComment ? "#475569" : isHighlight ? "#86EFAC" : "#7DD3FC",
                                display: "block"
                              }}>
                                {line}
                              </span>
                            );
                          })}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Quiz tab */}
          <div style={{
            display: activeTab === "quiz" ? "block" : "none",
            background: "var(--bg-card)",
            border: "1px solid var(--border-primary)",
            borderRadius: 10,
            padding: "16px"
          }}>
            <QuizSection
              key={`${topic.id}-${topic.id === TIMED_EXAM_ID ? examTimer.resetKey : 0}`}
              topicId={topic.id}
              questions={topic.quiz}
              color={topic.color}
              label={topic.quizLabel}
              questionTimes={topic.id === TIMED_EXAM_ID ? examTimer.completedTimes : undefined}
              onQuestionFocus={topic.id === TIMED_EXAM_ID ? focusTimedQuestion : undefined}
              onQuestionSubmit={topic.id === TIMED_EXAM_ID ? submitTimedQuestion : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
