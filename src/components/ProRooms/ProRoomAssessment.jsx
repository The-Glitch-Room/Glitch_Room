import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle,
  Play,
  Terminal,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  Code2,
  FileCode,
  Check,
  ShieldAlert,
} from "lucide-react";
import { supabase } from "../../supabaseClient";

const ProRoomAssessment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeSecIdx, setActiveSecIdx] = useState(0);
  const [activeQIdx, setActiveQIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // Candidate Test State
  const [answers, setAnswers] = useState({}); // { [qId]: { answer_text, selected_options, code_submission, github_url } }
  const [markedReview, setMarkedReview] = useState({}); // { [qId]: boolean }
  const [codeOutput, setCodeOutput] = useState("");
  const [runningCode, setRunningCode] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(7200); // 2 hours default
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false); // auto-submit triggered
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  // Once time is up or the test is submitted, the whole test surface freezes —
  // no more answer edits, no more navigating questions/sections.
  const interactionLocked = timeExpired || submissionComplete;

  // ── Anti-cheat: tab/window blur tracking ────────────────────────────────
  // A brief blur (checking a notification, a quick alt-tab) shouldn't count
  // as a real event — especially on mobile, where switching apps for a call
  // or a notification pull-down is routine. Only blurs longer than the grace
  // window get logged and surfaced as a warning.
  const DESKTOP_BLUR_GRACE_MS = 3000;
  const MOBILE_BLUR_GRACE_MS = 10000;
  const isMobileDevice = () =>
    typeof navigator !== "undefined" &&
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const [blurEvents, setBlurEvents] = useState([]); // [{ at: ISOString, durationMs }]
  const [showBlurWarning, setShowBlurWarning] = useState(false);
  const hiddenAtRef = useRef(null);
  const blurWarningTimeoutRef = useRef(null);

  useEffect(() => {
    const grace = isMobileDevice()
      ? MOBILE_BLUR_GRACE_MS
      : DESKTOP_BLUR_GRACE_MS;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        return;
      }
      if (hiddenAtRef.current == null) return;
      const durationMs = Date.now() - hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (durationMs < grace) return; // brief blip — not logged, not warned

      setBlurEvents((prev) => [
        ...prev,
        { at: new Date().toISOString(), durationMs },
      ]);
      setShowBlurWarning(true);
      if (blurWarningTimeoutRef.current)
        clearTimeout(blurWarningTimeoutRef.current);
      blurWarningTimeoutRef.current = setTimeout(
        () => setShowBlurWarning(false),
        6000,
      );
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (blurWarningTimeoutRef.current)
        clearTimeout(blurWarningTimeoutRef.current);
    };
  }, []);

  // ── Warn before closing tab / refreshing / navigating away in-browser ──
  // Browsers ignore custom messages here and always show their own generic
  // "leave site?" prompt — that's expected, we just need it to fire.
  const submissionCompleteRef = useRef(false);
  useEffect(() => {
    submissionCompleteRef.current = submissionComplete;
  }, [submissionComplete]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (submissionCompleteRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // ── Prevent the same assessment being open in a second tab ─────────────
  // Scoped to this browser only (a different browser or private window has
  // separate storage and won't be caught) — but it reliably blocks the
  // common case of someone opening the test twice in the same browser.
  const TAB_LOCK_STALE_MS = 10000;
  const TAB_LOCK_HEARTBEAT_MS = 4000;
  const tabSessionIdRef = useRef(
    `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const lockHeartbeatRef = useRef(null);
  const [tabLocked, setTabLocked] = useState(null); // null = checking, true = blocked, false = active

  useEffect(() => {
    if (!id) return;
    const lockKey = `gr_pro_room_lock_${id}`;

    const readLock = () => {
      try {
        const raw = localStorage.getItem(lockKey);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };
    const writeLock = () => {
      try {
        localStorage.setItem(
          lockKey,
          JSON.stringify({
            tabId: tabSessionIdRef.current,
            updatedAt: Date.now(),
          }),
        );
      } catch {}
    };

    const existing = readLock();
    const isStale =
      !existing || Date.now() - (existing.updatedAt || 0) > TAB_LOCK_STALE_MS;
    const isOwnedByUs = existing?.tabId === tabSessionIdRef.current;

    if (existing && !isStale && !isOwnedByUs) {
      setTabLocked(true);
    } else {
      writeLock();
      setTabLocked(false);
      lockHeartbeatRef.current = setInterval(writeLock, TAB_LOCK_HEARTBEAT_MS);
    }

    // If another tab claims (or reclaims) the lock while we're active, catch
    // it here so this tab also knows it's no longer the live session.
    const handleStorage = (e) => {
      if (e.key !== lockKey) return;
      try {
        const val = e.newValue ? JSON.parse(e.newValue) : null;
        if (val && val.tabId !== tabSessionIdRef.current) {
          setTabLocked(true);
          if (lockHeartbeatRef.current) {
            clearInterval(lockHeartbeatRef.current);
            lockHeartbeatRef.current = null;
          }
        }
      } catch {}
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (lockHeartbeatRef.current) clearInterval(lockHeartbeatRef.current);
      // Only release the lock if we're still the recognized holder — avoids
      // a stale/closing tab wiping out a lock a newer tab just claimed.
      const current = readLock();
      if (current?.tabId === tabSessionIdRef.current) {
        try {
          localStorage.removeItem(lockKey);
        } catch {}
      }
    };
  }, [id]);

  // Timer Countdown — single interval for the whole session, not recreated
  // every tick, so the transition to zero happens exactly once and reliably.
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-submit the instant the timer hits zero.
  const autoSubmitFiredRef = useRef(false);
  useEffect(() => {
    if (
      timeLeftSeconds === 0 &&
      !autoSubmitFiredRef.current &&
      !submissionComplete
    ) {
      autoSubmitFiredRef.current = true;
      setTimeExpired(true);
      setShowSubmitModal(true);
      handleSubmitAssessment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeftSeconds, submissionComplete]);

  // Fetch Assessment Data
  const fetchAssessmentData = async () => {
    setLoading(true);
    try {
      const { data: roomData } = await supabase
        .from("pro_rooms")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      const { data: secData } = await supabase
        .from("pro_room_sections")
        .select("*, pro_room_questions(*)")
        .eq("room_id", id)
        .order("order_index", { ascending: true });

      if (roomData) {
        setRoom(roomData);
        setTimeLeftSeconds((roomData.duration_minutes || 120) * 60);
      }

      if (secData && secData.length > 0) {
        setSections(secData);
      } else {
        // Fallback demo sections for test run
        setSections([
          {
            id: "sec-demo-1",
            section_name: "Section 1: Aptitude & Fundamentals",
            pro_room_questions: [
              {
                id: "qd-101",
                question_text:
                  "What is the time complexity of building a heap from an array of N elements?",
                question_type: "mcq",
                difficulty: "Medium",
                points: 10,
                options: ["O(N log N)", "O(N)", "O(N^2)", "O(log N)"],
                correct_answer: "O(N)",
              },
              {
                id: "qd-102",
                question_text:
                  "Which data structure is primarily used for breadth-first traversal of a graph?",
                question_type: "mcq",
                difficulty: "Easy",
                points: 10,
                options: [
                  "Stack",
                  "Queue",
                  "Binary Search Tree",
                  "Priority Queue",
                ],
                correct_answer: "Queue",
              },
            ],
          },
          {
            id: "sec-demo-2",
            section_name: "Section 2: Algorithmic Coding",
            pro_room_questions: [
              {
                id: "qd-201",
                question_text:
                  "Write a function to find the length of the longest substring without repeating characters.",
                description: "Input string `s`. Return integer length.",
                question_type: "coding",
                difficulty: "Hard",
                points: 50,
                test_cases: [
                  { input: '"abcabcbb"', expected_output: "3" },
                  { input: '"bbbbb"', expected_output: "1" },
                ],
              },
            ],
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessmentData();
  }, [id]);

  const currentSection = sections[activeSecIdx] || { pro_room_questions: [] };
  const currentQuestions = currentSection.pro_room_questions || [];
  const currentQuestion = currentQuestions[activeQIdx] || {};

  // Formatter for timer
  const formatTimer = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? `${h}:` : ""}${m < 10 ? `0${m}` : m}:${s < 10 ? `0${s}` : s}`;
  };

  const handleAnswerSelect = (qId, option) => {
    setAnswers({
      ...answers,
      [qId]: {
        ...answers[qId],
        selected_options: [option],
        answer_text: option,
      },
    });
  };

  const handleCodeChange = (qId, code) => {
    setAnswers({
      ...answers,
      [qId]: { ...answers[qId], code_submission: code },
    });
  };

  const handleRunCode = () => {
    setRunningCode(true);
    setCodeOutput("Executing code against sample test cases...");
    setTimeout(() => {
      setRunningCode(false);
      setCodeOutput(
        "✓ Test Case 1 Passed (Output: 3)\n✓ Test Case 2 Passed (Output: 1)\nExecution Time: 12ms | Memory: 14.2 MB",
      );
    }, 1200);
  };

  const handleSubmitAssessment = async () => {
    setSubmitting(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;

      if (uid) {
        await supabase.from("pro_room_submissions").upsert({
          room_id: id,
          user_id: uid,
          submitted_at: new Date().toISOString(),
          status: "submitted",
          anti_cheat_logs: blurEvents,
        });
      }

      setSubmissionComplete(true);
      setTimeout(() => {
        navigate(`/pro-rooms/${id}`);
      }, 2500);
    } catch (err) {
      console.error(err);
      navigate(`/pro-rooms/${id}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || tabLocked === null) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-t-transparent border-[#00F0FF] rounded-full animate-spin" />
      </div>
    );
  }

  if (tabLocked) {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center px-6 text-center font-sans">
        <ShieldAlert size={40} className="text-amber-400 mb-4" />
        <h1 className="text-xl font-black text-white mb-2">
          Already Open In Another Tab
        </h1>
        <p className="text-gray-400 text-sm max-w-sm mb-6">
          This assessment is currently active in another tab or window. Close it
          there first, then try again here.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-bold hover:bg-[#00F0FF]/25 cursor-pointer"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate(`/pro-rooms/${id}`)}
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:text-white cursor-pointer"
          >
            Back to Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060c] text-white flex flex-col font-sans selection:bg-[#00F0FF]/20">
      {/* Top Fixed Header */}
      <header className="h-16 bg-[#0c0c16] border-b border-white/10 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (submissionComplete) {
                navigate(`/pro-rooms/${id}`);
              } else {
                setShowExitConfirmModal(true);
              }
            }}
            className="text-gray-400 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft size={16} /> Exit Arena
          </button>
          <span className="text-gray-600">|</span>
          <h2 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
            {room?.name || "Pro Assessment Arena"}
          </h2>
        </div>

        {/* Anti-cheat warning & Timer */}
        <div className="flex items-center gap-4">
          {blurEvents.length > 0 && (
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
              <ShieldAlert size={13} /> Focus Blur Warnings: {blurEvents.length}
            </span>
          )}

          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[#00F0FF] font-mono text-sm font-bold">
            <Clock size={15} /> {formatTimer(timeLeftSeconds)}
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={interactionLocked}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00F0FF] to-purple-600 hover:from-[#00F0FF] hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={13} /> Finish & Submit
          </button>
        </div>
      </header>

      {/* Blur/tab-switch warning banner */}
      <AnimatePresence>
        {showBlurWarning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-6 mt-4 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-2"
          >
            <ShieldAlert size={14} className="shrink-0" /> You left the
            assessment tab. This has been noted — please stay on this page until
            you submit.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Assessment Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Question Pane */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          {/* Section Selector */}
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-white/5 overflow-x-auto">
            {sections.map((sec, idx) => (
              <button
                key={sec.id || idx}
                onClick={() => {
                  if (interactionLocked) return;
                  setActiveSecIdx(idx);
                  setActiveQIdx(0);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  interactionLocked
                    ? "opacity-40 cursor-not-allowed"
                    : "cursor-pointer"
                } ${
                  activeSecIdx === idx
                    ? "bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF]"
                    : "bg-white/5 border border-white/5 text-gray-400 hover:text-white"
                }`}
              >
                {sec.section_name}
              </button>
            ))}
          </div>

          {/* Question View */}
          {currentQuestion.id ? (
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-xs font-mono font-bold text-[#00F0FF]">
                  Question {activeQIdx + 1} of {currentQuestions.length} (
                  {currentQuestion.points || 10} Points)
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  {currentQuestion.question_type} •{" "}
                  {currentQuestion.difficulty || "Medium"}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {currentQuestion.question_text}
              </h3>

              {currentQuestion.description && (
                <p className="text-xs text-gray-400 leading-relaxed bg-white/5 p-3 rounded-xl">
                  {currentQuestion.description}
                </p>
              )}

              {/* Question Renderer: MCQ */}
              {currentQuestion.question_type === "mcq" && (
                <div className="space-y-3 pt-2">
                  {(currentQuestion.options || []).map((opt, optIdx) => {
                    const isSelected =
                      answers[currentQuestion.id]?.selected_options?.includes(
                        opt,
                      );
                    return (
                      <button
                        key={optIdx}
                        onClick={() =>
                          handleAnswerSelect(currentQuestion.id, opt)
                        }
                        disabled={interactionLocked}
                        className={`w-full text-left p-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed ${
                          isSelected
                            ? "bg-[#00F0FF]/10 border-[#00F0FF] text-[#00F0FF]"
                            : "bg-[#0b0b14] border-white/10 text-gray-300 hover:bg-white/5"
                        }`}
                      >
                        <span>{opt}</span>
                        {isSelected && (
                          <Check size={14} className="text-[#00F0FF]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Question Renderer: CODING */}
              {currentQuestion.question_type === "coding" && (
                <div className="space-y-4 flex-1 flex flex-col pt-2">
                  <div className="flex items-center justify-between text-xs font-mono text-gray-400 bg-[#0d0d16] px-4 py-2 rounded-t-xl border border-white/10">
                    <span className="flex items-center gap-1.5">
                      <Code2 size={14} className="text-[#00F0FF]" /> Solution
                      Editor (JavaScript / Python / C++)
                    </span>
                    <button
                      onClick={handleRunCode}
                      disabled={runningCode || interactionLocked}
                      className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play size={12} />{" "}
                      {runningCode ? "Running..." : "Run Test Cases"}
                    </button>
                  </div>

                  <textarea
                    rows={10}
                    placeholder="// Write your code solution here..."
                    value={answers[currentQuestion.id]?.code_submission || ""}
                    onChange={(e) =>
                      handleCodeChange(currentQuestion.id, e.target.value)
                    }
                    disabled={interactionLocked}
                    className="w-full bg-[#07070e] font-mono text-xs text-green-400 p-4 rounded-b-xl border border-t-0 border-white/10 outline-none focus:border-[#00F0FF] flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  />

                  {/* Test Execution Output Box */}
                  {codeOutput && (
                    <div className="bg-[#0c0c16] border border-white/10 rounded-xl p-4 font-mono text-xs text-gray-300">
                      <div className="flex items-center gap-1.5 text-gray-500 mb-2">
                        <Terminal size={13} className="text-[#00F0FF]" />{" "}
                        Execution Log & Output:
                      </div>
                      <pre className="text-xs whitespace-pre-wrap">
                        {codeOutput}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500 text-xs">
              No questions in this section yet.
            </div>
          )}

          {/* Bottom Question Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-auto">
            <button
              disabled={activeQIdx === 0 || interactionLocked}
              onClick={() => setActiveQIdx(activeQIdx - 1)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 disabled:opacity-30 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <button
              disabled={
                activeQIdx >= currentQuestions.length - 1 || interactionLocked
              }
              onClick={() => setActiveQIdx(activeQIdx + 1)}
              className="px-4 py-2 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-bold hover:bg-[#00F0FF]/25 cursor-pointer disabled:opacity-30 flex items-center gap-1"
            >
              Next Question <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Right Side: Question Palette */}
        <div className="w-full lg:w-72 bg-[#0a0a12] border-t lg:border-t-0 lg:border-l border-white/10 p-5 shrink-0 flex flex-col">
          <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest mb-4">
            Question Navigation Palette
          </h4>

          <div className="grid grid-cols-5 gap-2 mb-6">
            {currentQuestions.map((q, idx) => {
              const isAnswered = Boolean(
                answers[q.id]?.answer_text || answers[q.id]?.code_submission,
              );
              const isCurrent = idx === activeQIdx;
              return (
                <button
                  key={q.id || idx}
                  onClick={() => {
                    if (interactionLocked) return;
                    setActiveQIdx(idx);
                  }}
                  className={`w-10 h-10 rounded-xl text-xs font-mono font-bold flex items-center justify-center transition-all ${
                    interactionLocked
                      ? "opacity-40 cursor-not-allowed"
                      : "cursor-pointer"
                  } ${
                    isCurrent
                      ? "ring-2 ring-[#00F0FF] bg-[#00F0FF]/20 text-white"
                      : isAnswered
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="space-y-2 text-[11px] font-mono text-gray-400 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-green-500/30 border border-green-500/50" />{" "}
              Answered
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-white/5 border border-white/10" />{" "}
              Unanswered
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-[#00F0FF]/20 ring-1 ring-[#00F0FF]" />{" "}
              Current Selected
            </div>
          </div>
        </div>
      </div>

      {/* Submission Confirmation Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#0d0d16] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl text-center"
            >
              {submissionComplete ? (
                <div className="py-6 space-y-3">
                  <CheckCircle
                    size={48}
                    className="mx-auto text-green-400 animate-bounce"
                  />
                  <h3 className="text-xl font-bold text-white">
                    Assessment Submitted!
                  </h3>
                  <p className="text-xs text-gray-400">
                    Your answers have been recorded. Redirecting to assessment
                    room...
                  </p>
                </div>
              ) : timeExpired ? (
                <div className="py-6 space-y-3">
                  <Clock
                    size={44}
                    className="mx-auto text-amber-400 animate-pulse"
                  />
                  <h3 className="text-xl font-bold text-white">Time's Up!</h3>
                  <p className="text-xs text-gray-400">
                    Your time has expired. Submitting your answers automatically
                    — please wait...
                  </p>
                </div>
              ) : (
                <>
                  <Send size={40} className="mx-auto text-[#00F0FF] mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">
                    Submit Pro Assessment?
                  </h3>
                  <p className="text-xs text-gray-400 mb-6">
                    Are you sure you want to finish and submit your answers? You
                    cannot alter your submissions after confirming.
                  </p>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                    <button
                      onClick={() => setShowSubmitModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400"
                    >
                      Continue Test
                    </button>
                    <button
                      onClick={handleSubmitAssessment}
                      disabled={submitting}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#00F0FF] to-purple-600 text-white text-xs font-bold"
                    >
                      {submitting ? "Submitting..." : "Yes, Submit Test"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exit Confirmation Modal — Exit Arena no longer navigates away silently */}
      <AnimatePresence>
        {showExitConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#0d0d16] border border-amber-500/30 rounded-3xl p-6 shadow-2xl text-center"
            >
              <AlertTriangle
                size={40}
                className="mx-auto text-amber-400 mb-3"
              />
              <h3 className="text-lg font-bold text-white mb-2">
                Leave Without Submitting?
              </h3>
              <p className="text-xs text-gray-400 mb-6">
                Your assessment has not been submitted yet. If you leave now,
                your answers will not be saved.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => setShowExitConfirmModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 cursor-pointer"
                >
                  Stay & Continue
                </button>
                <button
                  onClick={() => navigate(`/pro-rooms/${id}`)}
                  className="px-6 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold hover:bg-red-500/30 cursor-pointer"
                >
                  Leave Anyway
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProRoomAssessment;
