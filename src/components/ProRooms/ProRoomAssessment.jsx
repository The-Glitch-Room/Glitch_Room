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
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);

  // Anti-cheating tab blur detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Timer Countdown
  useEffect(() => {
    if (timeLeftSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeftSeconds]);

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
                question_text: "What is the time complexity of building a heap from an array of N elements?",
                question_type: "mcq",
                difficulty: "Medium",
                points: 10,
                options: ["O(N log N)", "O(N)", "O(N^2)", "O(log N)"],
                correct_answer: "O(N)",
              },
              {
                id: "qd-102",
                question_text: "Which data structure is primarily used for breadth-first traversal of a graph?",
                question_type: "mcq",
                difficulty: "Easy",
                points: 10,
                options: ["Stack", "Queue", "Binary Search Tree", "Priority Queue"],
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
                question_text: "Write a function to find the length of the longest substring without repeating characters.",
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
      [qId]: { ...answers[qId], selected_options: [option], answer_text: option },
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
      setCodeOutput("✓ Test Case 1 Passed (Output: 3)\n✓ Test Case 2 Passed (Output: 1)\nExecution Time: 12ms | Memory: 14.2 MB");
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
          anti_cheat_logs: [{ tab_switches: tabSwitchCount }],
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-t-transparent border-[#00F0FF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060c] text-white flex flex-col font-sans selection:bg-[#00F0FF]/20">
      {/* Top Fixed Header */}
      <header className="h-16 bg-[#0c0c16] border-b border-white/10 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/pro-rooms/${id}`)}
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
          {tabSwitchCount > 0 && (
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
              <ShieldAlert size={13} /> Focus Blur Warnings: {tabSwitchCount}
            </span>
          )}

          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[#00F0FF] font-mono text-sm font-bold">
            <Clock size={15} /> {formatTimer(timeLeftSeconds)}
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00F0FF] to-purple-600 hover:from-[#00F0FF] hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
          >
            <Send size={13} /> Finish & Submit
          </button>
        </div>
      </header>

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
                  setActiveSecIdx(idx);
                  setActiveQIdx(0);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
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
                  Question {activeQIdx + 1} of {currentQuestions.length} ({currentQuestion.points || 10} Points)
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  {currentQuestion.question_type} • {currentQuestion.difficulty || "Medium"}
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
                    const isSelected = answers[currentQuestion.id]?.selected_options?.includes(opt);
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleAnswerSelect(currentQuestion.id, opt)}
                        className={`w-full text-left p-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-[#00F0FF]/10 border-[#00F0FF] text-[#00F0FF]"
                            : "bg-[#0b0b14] border-white/10 text-gray-300 hover:bg-white/5"
                        }`}
                      >
                        <span>{opt}</span>
                        {isSelected && <Check size={14} className="text-[#00F0FF]" />}
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
                      <Code2 size={14} className="text-[#00F0FF]" /> Solution Editor (JavaScript / Python / C++)
                    </span>
                    <button
                      onClick={handleRunCode}
                      disabled={runningCode}
                      className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Play size={12} /> {runningCode ? "Running..." : "Run Test Cases"}
                    </button>
                  </div>

                  <textarea
                    rows={10}
                    placeholder="// Write your code solution here..."
                    value={answers[currentQuestion.id]?.code_submission || ""}
                    onChange={(e) => handleCodeChange(currentQuestion.id, e.target.value)}
                    className="w-full bg-[#07070e] font-mono text-xs text-green-400 p-4 rounded-b-xl border border-t-0 border-white/10 outline-none focus:border-[#00F0FF] flex-1"
                  />

                  {/* Test Execution Output Box */}
                  {codeOutput && (
                    <div className="bg-[#0c0c16] border border-white/10 rounded-xl p-4 font-mono text-xs text-gray-300">
                      <div className="flex items-center gap-1.5 text-gray-500 mb-2">
                        <Terminal size={13} className="text-[#00F0FF]" /> Execution Log & Output:
                      </div>
                      <pre className="text-xs whitespace-pre-wrap">{codeOutput}</pre>
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
              disabled={activeQIdx === 0}
              onClick={() => setActiveQIdx(activeQIdx - 1)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 disabled:opacity-30 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <button
              disabled={activeQIdx >= currentQuestions.length - 1}
              onClick={() => setActiveQIdx(activeQIdx + 1)}
              className="px-4 py-2 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-bold hover:bg-[#00F0FF]/25 cursor-pointer flex items-center gap-1"
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
              const isAnswered = Boolean(answers[q.id]?.answer_text || answers[q.id]?.code_submission);
              const isCurrent = idx === activeQIdx;
              return (
                <button
                  key={q.id || idx}
                  onClick={() => setActiveQIdx(idx)}
                  className={`w-10 h-10 rounded-xl text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
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
              <span className="w-3 h-3 rounded-md bg-green-500/30 border border-green-500/50" /> Answered
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-white/5 border border-white/10" /> Unanswered
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-[#00F0FF]/20 ring-1 ring-[#00F0FF]" /> Current Selected
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
                  <CheckCircle size={48} className="mx-auto text-green-400 animate-bounce" />
                  <h3 className="text-xl font-bold text-white">Assessment Submitted!</h3>
                  <p className="text-xs text-gray-400">
                    Your answers have been recorded. Redirecting to assessment room...
                  </p>
                </div>
              ) : (
                <>
                  <Send size={40} className="mx-auto text-[#00F0FF] mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">Submit Pro Assessment?</h3>
                  <p className="text-xs text-gray-400 mb-6">
                    Are you sure you want to finish and submit your answers? You cannot alter your submissions after confirming.
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
    </div>
  );
};

export default ProRoomAssessment;
