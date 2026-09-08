import { GBitIcon } from "./GBitIcon";
// src/components/Explore.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PageHeading from "./PageHeading";
import GlitchBackground from "./GlitchBackground";
import { supabase } from "../supabaseClient";
import { fetchDatabaseCategoryCounts } from "../utils/challengeCountHelper";
import {
  updatePoints,
  hasPassedChallenge,
  saveSubmission,
  fetchPoints,
} from "../utils/pointsHelper";
import {
  getVerdict,
  pointsForScore,
  PASS_THRESHOLD,
} from "../utils/feedbackVerdict";
import {
  Zap,
  Bug,
  Cpu,
  Sparkles,
  Swords,
  Clock,
  Flame,
  CheckCircle,
  Bell,
  ChevronRight,
  ShieldAlert,
  Award,
  Calendar,
  Layers,
  ArrowUpRight,
  X,
  Check,
  Activity,
  Archive,
  Lightbulb,
  Lock,
  Unlock,
  FileCode,
  AlertTriangle,
  Loader2,
  HelpCircle,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ── 4 Core Challenge Categories ───────────────────────────────────────────────
const CORE_CHALLENGE_TYPES = [
  {
    id: "glitches",
    icon: Zap,
    color: "#00F0FF",
    title: "Glitch Challenges",
    badge: "Core Arena",
    desc: "Test your skills by identifying and fixing unique, real-world inspired coding glitches across JavaScript, Python, SQL, and C++.",
    path: "/glitches",
    dbKey: "glitches",
  },
  {
    id: "bug-challenges",
    icon: Bug,
    color: "#D600FF",
    title: "Debug Mode",
    badge: "Diagnostics",
    desc: "Hone your diagnostics by stepping through complex stack traces, memory leaks, and broken execution logic.",
    path: "/bug-challenges",
    dbKey: "bugs",
  },
  {
    id: "ai-challenges",
    icon: Cpu,
    color: "#FF00C8",
    title: "AI Powered Puzzles",
    badge: "GenAI Evaluation",
    desc: "Engage with generative AI scenarios designed to test edge cases, prompt fixes, and automated code evaluation.",
    path: "/ai-challenges",
    dbKey: "ais",
  },
  {
    id: "sparks",
    icon: Sparkles,
    color: "#FFD700",
    title: "Creative Sparks",
    badge: "Design & Logic",
    desc: "Ignite your architectural creativity by designing solutions, UI patterns, and novel fixes that stand out.",
    path: "/sparks",
    dbKey: "sparks",
  },
];

// ── Interactive Challenge Solver Modal ────────────────────────────────────────
// ── Interactive Challenge Solver Modal (2-Column Redesign) ───────────────────
const ChallengeSolverModal = ({ challenge, user, onClose, onComplete }) => {
  const [answer, setAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evalError, setEvalError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [passed, setPassed] = useState(false);
  const [awardedPoints, setAwardedPoints] = useState(0);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  // Hint & Solution unlock states
  const [hintUnlocked, setHintUnlocked] = useState(false);
  const [solutionUnlocked, setSolutionUnlocked] = useState(false);
  const [unlockingHint, setUnlockingHint] = useState(false);
  const [unlockingSolution, setUnlockingSolution] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [showHintTab, setShowHintTab] = useState(false);
  const [showSolutionTab, setShowSolutionTab] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const realChallengeId = String(challenge.dbId ?? challenge.id);
  const realChallengeType = challenge.type || "explore";
  const maxPoints = Math.min(challenge.points || 50, 100);
  const userId = user?.id;

  useEffect(() => {
    const checkState = async () => {
      if (!userId) return;

      const pts = await fetchPoints(userId);
      setUserBalance(pts);

      const hasPassed = await hasPassedChallenge(realChallengeId, realChallengeType);
      if (hasPassed) {
        setAlreadyCompleted(true);
      }

      try {
        const { data: actData } = await supabase
          .from("glitch_activity")
          .select("title")
          .eq("user_id", userId)
          .ilike("title", `%${challenge.title}%`);

        if (actData && actData.length > 0) {
          const hasUnlockedHint = actData.some(
            (a) => a.title.includes("Hint used") || a.title.includes("Unlocked Hint")
          );
          const hasUnlockedSol = actData.some(
            (a) => a.title.includes("Solution used") || a.title.includes("Unlocked Solution")
          );
          if (hasUnlockedHint) {
            setHintUnlocked(true);
            setShowHintTab(true);
          }
          if (hasUnlockedSol) {
            setSolutionUnlocked(true);
            setShowSolutionTab(true);
          }
        }
      } catch (e) {
        console.warn("Error checking prior unlocks:", e);
      }
    };
    checkState();
  }, [userId, realChallengeId, realChallengeType, challenge.title]);

  const handleUnlockHint = async () => {
    setUnlockError("");
    if (hintUnlocked) {
      setShowHintTab((prev) => !prev);
      return;
    }
    if (userBalance < 50) {
      setUnlockError("Insufficient gBits balance! You need at least 50 gBits to unlock the hint.");
      return;
    }
    setUnlockingHint(true);
    try {
      const newBal = await updatePoints(
        -50,
        `Unlocked Hint: ${challenge.title}`,
        realChallengeType,
        null,
        userId
      );
      setUserBalance(newBal);
      setHintUnlocked(true);
      setShowHintTab(true);
    } catch (e) {
      console.error("Hint unlock error:", e);
      setUnlockError("Failed to unlock hint. Please try again.");
    }
    setUnlockingHint(false);
  };

  const handleUnlockSolution = async () => {
    setUnlockError("");
    if (solutionUnlocked) {
      setShowSolutionTab((prev) => !prev);
      return;
    }
    if (userBalance < 100) {
      setUnlockError("Insufficient gBits balance! You need at least 100 gBits to unlock the solution.");
      return;
    }
    setUnlockingSolution(true);
    try {
      const newBal = await updatePoints(
        -100,
        `Unlocked Solution: ${challenge.title}`,
        realChallengeType,
        null,
        userId
      );
      setUserBalance(newBal);
      setSolutionUnlocked(true);
      setShowSolutionTab(true);
    } catch (e) {
      console.error("Solution unlock error:", e);
      setUnlockError("Failed to unlock solution. Please try again.");
    }
    setUnlockingSolution(false);
  };

  const handleSolveSubmit = async () => {
    if (!answer.trim()) {
      setEvalError("Please write your approach or diagnosis before submitting!");
      return;
    }

    setEvaluating(true);
    setEvalError("");
    setFeedback(null);

    const scenario = `Challenge Title: ${challenge.title}
Category: ${challenge.category || "General"}
Difficulty: ${challenge.difficulty || "Medium"}
Description: ${challenge.description || "N/A"}
${challenge.codeSnippet ? `Buggy Code:\n${challenge.codeSnippet}\n\n` : ""}
${challenge.solution ? `Reference Solution (for grading baseline only, do not reveal verbatim):\n${challenge.solution}\n\n` : ""}
Evaluate whether the user correctly identified the bug/problem and provided a valid, accurate diagnosis or code fix. Score strictly from 0 to 10 based on technical accuracy.`;

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "ai-feedback-edge-function",
        { body: { scenario, answer: answer.trim() } }
      );

      if (fnError) throw fnError;

      const parsed = typeof fnData === "string" ? JSON.parse(fnData) : fnData;
      const score = typeof parsed?.score === "number" ? parsed.score : 0;
      const isPass = score >= PASS_THRESHOLD;

      setFeedback(parsed);
      setPassed(isPass);

      const pts = pointsForScore(score, maxPoints);

      if (isPass && !alreadyCompleted && userId) {
        const newBal = await updatePoints(
          pts,
          `Solved ${challenge.title} (${challenge.category || "Explore Challenge"})`,
          realChallengeType,
          null,
          userId
        );
        setUserBalance(newBal);
        setAwardedPoints(pts);
        setAlreadyCompleted(true);

        await saveSubmission(
          realChallengeId,
          realChallengeType,
          answer.trim(),
          pts,
          score,
          45,
          challenge.difficulty || "Medium"
        );

        onComplete(challenge.id, pts);
      }
    } catch (err) {
      console.error("AI Evaluation error:", err);
      setEvalError(err?.message || "Failed to evaluate answer. Please try again.");
    }
    setEvaluating(false);
  };

  const copyCodeToClipboard = () => {
    if (!challenge.codeSnippet) return;
    navigator.clipboard.writeText(challenge.codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const verdict = feedback ? getVerdict(feedback.score) : null;
  const difficulty = challenge.difficulty || "Medium";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-hidden"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        className="relative w-full max-w-5xl bg-[#090912] border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.1)] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 bg-[#06060c]">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF]">
              {challenge.category || "Explore Challenge"}
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white truncate max-w-md sm:max-w-xl">
              {challenge.title}
            </h2>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 font-mono text-xs font-bold">
              <GBitIcon className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>{userBalance} gBits</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Question, Code, Answer, Hints */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Problem Description Card */}
              <div className="bg-[#0e0e1a] border border-white/8 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-[#00F0FF] to-[#a855f7]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
                  <HelpCircle size={14} className="text-[#00F0FF]" /> Challenge Prompt
                </h3>
                <p className="text-gray-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                  {challenge.description}
                </p>
              </div>

              {/* Code Snippet (if available) */}
              {challenge.codeSnippet && (
                <div className="bg-[#05050c] border border-white/10 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/5">
                    <span className="text-[11px] font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                      <FileCode size={13} /> {challenge.language || "Code Snippet"}
                    </span>
                    <button
                      type="button"
                      onClick={copyCodeToClipboard}
                      className="flex items-center gap-1 text-[10px] font-mono text-gray-400 hover:text-white transition cursor-pointer"
                    >
                      {copiedCode ? (
                        <>
                          <Check size={12} className="text-green-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Copy Code
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-56 custom-scrollbar leading-relaxed">
                    <code>{challenge.codeSnippet}</code>
                  </pre>
                </div>
              )}

              {/* Answer Input */}
              <div className="bg-[#0e0e1a] border border-white/8 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                    <Zap size={14} className="text-[#00F0FF]" /> Your Diagnosis & Fix Solution
                  </label>
                  <span className="text-[10px] font-mono text-gray-500">
                    {answer.length} chars
                  </span>
                </div>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Explain the root cause of the bug and your step-by-step fix..."
                  rows={4}
                  className="w-full bg-[#05050c] border border-white/10 rounded-xl p-3.5 text-white text-xs font-mono placeholder-gray-600 outline-none focus:border-[#00F0FF]/50 transition resize-none leading-relaxed"
                />
              </div>

              {/* Hint & Solution Unlock Section */}
              <div className="space-y-3">
                {unlockError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-mono flex items-center gap-2">
                    <AlertTriangle size={14} /> {unlockError}
                  </div>
                )}

                {/* Hint Toggle/Unlock */}
                <div className="bg-[#0e0e1a] border border-white/8 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Lightbulb size={16} className="text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Challenge Hint</p>
                        <p className="text-[10px] text-gray-400">
                          {hintUnlocked ? "Unlocked & available" : "Costs 50 gBits to unlock"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleUnlockHint}
                      disabled={unlockingHint}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1.5"
                      style={
                        hintUnlocked
                          ? {
                              background: "rgba(245,158,11,0.12)",
                              border: "1px solid rgba(245,158,11,0.3)",
                              color: "#f59e0b",
                            }
                          : {
                              background: "linear-gradient(90deg, #f59e0b, #d97706)",
                              color: "#000",
                            }
                      }
                    >
                      {unlockingHint ? (
                        <>
                          <Loader2 size={12} className="animate-spin" /> Unlocking...
                        </>
                      ) : hintUnlocked ? (
                        <>
                          {showHintTab ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {showHintTab ? "Hide Hint" : "View Hint"}
                        </>
                      ) : (
                        <>
                          <Lock size={12} /> Unlock (-50 gBits)
                        </>
                      )}
                    </button>
                  </div>

                  <AnimatePresence>
                    {hintUnlocked && showHintTab && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 pb-4 pt-1 border-t border-white/5"
                      >
                        <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-200 text-xs font-mono leading-relaxed">
                          💡 {challenge.hint || "Analyze the logic flow and variables carefully to spot where the state or loop condition breaks."}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Solution Toggle/Unlock */}
                <div className="bg-[#0e0e1a] border border-white/8 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <FileCode size={16} className="text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Reference Solution</p>
                        <p className="text-[10px] text-gray-400">
                          {solutionUnlocked ? "Unlocked & available" : "Costs 100 gBits to unlock"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleUnlockSolution}
                      disabled={unlockingSolution}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1.5"
                      style={
                        solutionUnlocked
                          ? {
                              background: "rgba(16,185,129,0.12)",
                              border: "1px solid rgba(16,185,129,0.3)",
                              color: "#10b981",
                            }
                          : {
                              background: "linear-gradient(90deg, #10b981, #059669)",
                              color: "#000",
                            }
                      }
                    >
                      {unlockingSolution ? (
                        <>
                          <Loader2 size={12} className="animate-spin" /> Unlocking...
                        </>
                      ) : solutionUnlocked ? (
                        <>
                          {showSolutionTab ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {showSolutionTab ? "Hide Solution" : "View Solution"}
                        </>
                      ) : (
                        <>
                          <Lock size={12} /> Unlock (-100 gBits)
                        </>
                      )}
                    </button>
                  </div>

                  <AnimatePresence>
                    {solutionUnlocked && showSolutionTab && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 pb-4 pt-1 border-t border-white/5"
                      >
                        <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                          {challenge.solution || "No reference solution code provided for this challenge."}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Right Column: Challenge Meta, AI Feedback & Submit */}
            <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
              
              <div className="space-y-5">
                {/* Challenge Details Card */}
                <div className="bg-[#0e0e1a] border border-white/8 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 border-b border-white/5 pb-2">
                    Challenge Metadata
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                      <span className="text-[10px] font-mono text-gray-500 block uppercase mb-1">
                        Difficulty
                      </span>
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        {difficulty}
                      </span>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                      <span className="text-[10px] font-mono text-gray-500 block uppercase mb-1">
                        Max Reward
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                        <GBitIcon className="w-3 h-3 text-[#00F0FF]" /> +{maxPoints} gBits
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono pt-1 text-gray-400">
                    <span>Status:</span>
                    <span className="text-emerald-400 font-bold">
                      {alreadyCompleted ? "✓ Passed / Completed" : "● Active"}
                    </span>
                  </div>
                </div>

                {/* AI Feedback Card */}
                <div className="bg-[#0e0e1a] border border-white/8 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                    <Sparkles size={14} className="text-[#00F0FF]" /> AI Evaluation & Feedback
                  </h3>

                  {evaluating ? (
                    <div className="py-10 text-center space-y-3">
                      <Loader2 size={28} className="animate-spin text-[#00F0FF] mx-auto" />
                      <p className="text-xs font-mono text-cyan-400">
                        Analyzing your code & diagnosis...
                      </p>
                    </div>
                  ) : feedback ? (
                    <div className="space-y-3">
                      {/* Verdict Pill */}
                      <div
                        className="flex items-center justify-between p-3.5 rounded-xl border"
                        style={{
                          background: passed ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                          borderColor: passed ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {passed ? (
                            <CheckCircle size={16} className="text-green-400" />
                          ) : (
                            <AlertTriangle size={16} className="text-red-400" />
                          )}
                          <span
                            className="text-xs font-bold"
                            style={{ color: passed ? "#22c55e" : "#ef4444" }}
                          >
                            {verdict?.label}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-gray-300">
                          Score: {feedback.score}/10
                        </span>
                      </div>

                      {/* Points notification */}
                      {passed && (
                        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-mono flex items-center justify-between font-bold">
                          <span>
                            {awardedPoints > 0
                              ? `+${awardedPoints} gBits Added to Balance!`
                              : "Challenge Passed! (Points already claimed)"}
                          </span>
                          <Check size={14} />
                        </div>
                      )}

                      {/* Strengths */}
                      {feedback.strength && (
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                          <span className="text-[10px] font-mono font-bold uppercase text-green-400 block">
                            ✓ Strengths
                          </span>
                          <p className="text-xs text-gray-300 leading-relaxed">
                            {feedback.strength}
                          </p>
                        </div>
                      )}

                      {/* Gaps */}
                      {feedback.gap && (
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                          <span className="text-[10px] font-mono font-bold uppercase text-amber-400 block">
                            ⚠ What Was Missed
                          </span>
                          <p className="text-xs text-gray-300 leading-relaxed">
                            {feedback.gap}
                          </p>
                        </div>
                      )}

                      {/* Upgrade */}
                      {feedback.upgrade && (
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                          <span className="text-[10px] font-mono font-bold uppercase text-cyan-400 block">
                            💡 How to Level Up
                          </span>
                          <p className="text-xs text-gray-300 leading-relaxed">
                            {feedback.upgrade}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-gray-500 space-y-2">
                      <Cpu size={24} className="mx-auto text-gray-600 opacity-60" />
                      <p className="text-xs">
                        Enter your answer on the left and click <strong className="text-gray-400">Submit Solution</strong> for instant AI grading.
                      </p>
                      <p className="text-[10px] font-mono text-gray-600">
                        Score 6/10 or higher to pass & earn gBits!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action & Submission Area */}
              <div className="pt-4 border-t border-white/8 space-y-3">
                {evalError && (
                  <p className="text-red-400 text-xs font-mono bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                    {evalError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition cursor-pointer border border-white/10"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSolveSubmit}
                    disabled={evaluating || !answer.trim()}
                    className="flex-[2] py-3 rounded-xl text-white text-xs font-bold disabled:opacity-40 transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                    style={{
                      background: "linear-gradient(90deg, #00F0FF, #a855f7)",
                    }}
                  >
                    {evaluating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Evaluating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} /> Submit Solution
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Coming Soon Section Component ─────────────────────────────────────────────
const ComingSoonBanner = ({
  message = "No active challenges in this section right now. New challenges will be published soon from the Admin Panel!",
}) => (
  <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-8 text-center space-y-2">
    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400">
      <Clock size={20} />
    </div>
    <h4 className="text-base font-bold text-white">Coming Soon</h4>
    <p className="text-xs text-gray-400 max-w-md mx-auto">{message}</p>
  </div>
);

// ── Compact card used inside the Daily/Weekly columns (Section 1) ──────────
const TimeBoundChallengeCard = ({ item, isCompleted, onSolve, accent }) => (
  <div className="bg-[#07070d] border border-white/5 rounded-2xl p-6 hover:border-white/15 transition">
    <div className="flex items-center justify-between gap-3 mb-4">
      <span
        className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md shrink-0"
        style={{
          color: accent,
          background: `${accent}15`,
          border: `1px solid ${accent}30`,
        }}
      >
        {item.category}
      </span>
      <span className="text-xs font-mono text-amber-400 font-semibold shrink-0">
        <GBitIcon className="w-3.5 h-3.5 inline mr-1 text-[#00F0FF]" />+
        {Math.min(item.points, 100)} gBits
      </span>
    </div>

    <h4 className="text-base font-bold text-white mb-2">{item.title}</h4>
    <p className="text-xs text-gray-400 leading-relaxed mb-5 line-clamp-3">
      {item.description}
    </p>

    <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
      <span className="text-[11px] font-mono text-gray-500 flex items-center gap-1.5 min-w-0 truncate">
        <Clock size={12} className="shrink-0" /> {item.refreshText}
      </span>

      {isCompleted ? (
        <span className="flex items-center gap-1 text-xs font-mono text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-3.5 py-1.5 rounded-xl shrink-0">
          <Check size={14} /> Done
        </span>
      ) : (
        <button
          type="button"
          onClick={onSolve}
          className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-xl cursor-pointer transition hover:opacity-90 shadow-md shrink-0"
          style={{ background: `linear-gradient(90deg, ${accent}, #a855f7)` }}
        >
          Solve <ChevronRight size={14} />
        </button>
      )}
    </div>
  </div>
);

// ── Main Explore Page Component ───────────────────────────────────────────────
const Explore = () => {
  const [authUser, setAuthUser] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [reminders, setReminders] = useState(new Set());
  const [activeSolverChallenge, setActiveSolverChallenge] = useState(null);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  const [dailyItems, setDailyItems] = useState([]);
  const [weeklyItems, setWeeklyItems] = useState([]);
  const [liveItems, setLiveItems] = useState([]);
  const [upcomingItems, setUpcomingItems] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [archivedItems, setArchivedItems] = useState([]);
  // Matches the visibleCount pattern already used on GlitchesChallenges.jsx
  // etc. — Archive is the one Explore section that grows without bound
  // (nothing ever leaves it), so it's the one that needs this.
  const [visibleArchiveCount, setVisibleArchiveCount] = useState(12);

  // Real-time tick — every section's Upcoming/Live/Active/Past state is
  // computed fresh from each challenge's own start_time/end_time on every
  // render, so ticking this forces those computations (and the per-card
  // countdowns) to stay live. Replaces the old global liveSeconds/
  // upcomingSeconds counters, which were fixed starting numbers shared by
  // every item regardless of that item's actual dates.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds) => {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hours > 0 ? `${hours}h ` : ""}${mins
      .toString()
      .padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
  };

  // Countdown to a specific ISO timestamp, in seconds remaining (0 if
  // already passed or not set).
  const secondsUntil = (isoString) => {
    if (!isoString) return 0;
    const diff = (new Date(isoString).getTime() - nowTick) / 1000;
    return diff > 0 ? diff : 0;
  };

  const formatArchiveDate = (isoString) => {
    if (!isoString) return "Archived";
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  useEffect(() => {
    const initExplore = async () => {
      setLoading(true);
      const { data: au } = await supabase.auth.getUser();
      const user = au?.user;
      setAuthUser(user);

      if (user?.id) {
        const { data: pts } = await supabase
          .from("user_points")
          .select("points")
          .eq("user_id", user.id)
          .maybeSingle();
        if (pts) setUserPoints(pts.points);

        const { data: subs } = await supabase
          .from("challenge_submissions")
          .select("challenge_id")
          .eq("user_id", user.id);

        if (subs) {
          setCompletedIds(new Set(subs.map((s) => s.challenge_id)));
        }

        const savedReminders = localStorage.getItem(
          `glitch_reminders_${user.id}`,
        );
        if (savedReminders) {
          try {
            setReminders(new Set(JSON.parse(savedReminders)));
          } catch (e) {}
        }
      }

      // Dynamic fetching — Explore placement is independent of `type` now.
      // Any challenge (glitch/bug/ai/spark/explore_original) with
      // explore_section set and/or is_featured=true shows up here, so an
      // existing library challenge can be reused in Explore without being
      // duplicated. See fix_16_explore_scheduling.sql.
      const { data: dbItems } = await supabase
        .from("challenges")
        .select("*")
        .or("explore_section.not.is.null,is_featured.eq.true");

      if (dbItems && dbItems.length > 0) {
        const now = new Date();
        const isPast = (i) => !!i.end_time && new Date(i.end_time) < now;
        const isUpcoming = (i) =>
          !!i.start_time && new Date(i.start_time) > now;
        // "Active" = started (or no start set) AND not yet ended (or no
        // end set). A tagged challenge with no dates at all is always
        // active, so tagging one in without setting dates still works.
        const isActiveNow = (i) => !isUpcoming(i) && !isPast(i);

        const mapCommon = (x) => ({
          points:
            x.points ||
            (x.difficulty === "Easy"
              ? 25
              : x.difficulty === "Hard"
                ? 75
                : x.difficulty === "Expert"
                  ? 90
                  : 50),
          description: x.description,
          codeSnippet: x.code,
          hint: x.hint,
          solution: x.solution,
          start_time: x.start_time,
          end_time: x.end_time,
          // The real database id/type — separate from the `id` field set
          // below (which is a prefixed string like "db-3", used only as a
          // React list key so items can't collide across sections). The
          // solver modal needs the REAL id/type for challenge_submissions,
          // or a reused glitch/bug/ai/spark challenge solved here would
          // get recorded under a fake "explore" type with a non-numeric
          // id — meaning hasPriorSubmissions/checkIfSolved/
          // hasPassedChallenge on that challenge's real page would never
          // find it, and the same challenge could be "solved" twice for
          // double the gBits.
          dbId: x.id,
          type: x.type,
        });

        const daily = dbItems.filter(
          (i) => i.explore_section === "daily" && isActiveNow(i),
        );
        const weekly = dbItems.filter(
          (i) => i.explore_section === "weekly" && isActiveNow(i),
        );
        const battles = dbItems.filter((i) => i.explore_section === "battle");
        const live = battles.filter((i) => isActiveNow(i) && !isUpcoming(i));
        const upcoming = battles.filter((i) => isUpcoming(i));
        const featured = dbItems.filter((i) => i.is_featured && !isPast(i));
        const archived = dbItems.filter((i) => isPast(i));

        setDailyItems(
          daily.map((d) => ({
            id: `db-${d.id}`,
            title: d.title,
            category: d.category || "Daily Challenge",
            difficulty: d.difficulty || "Medium",
            language: d.category || "JavaScript",
            refreshText: "Active Today",
            ...mapCommon(d),
          })),
        );

        setWeeklyItems(
          weekly.map((w) => ({
            id: `db-${w.id}`,
            title: w.title,
            category: w.category || "Weekly Challenge",
            difficulty: w.difficulty || "Medium",
            language: w.category || "JavaScript",
            refreshText: "Active This Week",
            ...mapCommon(w),
          })),
        );

        setLiveItems(
          live.map((l) => ({
            id: `db-live-${l.id}`,
            title: l.title,
            category: "Live Challenge",
            difficulty: l.difficulty || "Medium",
            language: l.category || "Code Battle",
            status: "live",
            ...mapCommon(l),
          })),
        );

        setUpcomingItems(
          upcoming.map((u) => ({
            id: `db-up-${u.id}`,
            title: u.title,
            category: "Upcoming Challenge",
            difficulty: u.difficulty || "Hard",
            language: u.category || "General",
            status: "upcoming",
            ...mapCommon(u),
          })),
        );

        setFeaturedItems(
          featured.map((f) => ({
            id: `db-feat-${f.id}`,
            title: f.title,
            category: "Featured Pick",
            difficulty: f.difficulty || "Easy",
            badge: f.category || "Featured",
            language: f.category || "Fullstack",
            ...mapCommon(f),
          })),
        );

        if (archived.length > 0) {
          // Real completedBy count instead of a fabricated number.
          // ChallengeSolverModal writes challenge_type = the challenge's
          // real `type` at submit time, and type never changes once
          // created — only explore_section/dates change — so matching on
          // (challenge_id, challenge_type) reliably ties submissions back
          // to these rows regardless of what type they are.
          const archivedTypes = [...new Set(archived.map((a) => a.type))];
          const { data: subs } = await supabase
            .from("challenge_submissions")
            .select("challenge_id, challenge_type")
            .in("challenge_type", archivedTypes);

          const completionCounts = {};
          (subs || []).forEach((s) => {
            const key = `${s.challenge_type}::${s.challenge_id}`;
            completionCounts[key] = (completionCounts[key] || 0) + 1;
          });

          setArchivedItems(
            archived.map((a) => ({
              id: `db-arc-${a.id}`,
              title: a.title,
              category: a.category || "Archived Vault",
              difficulty: a.difficulty || "Medium",
              completedBy: completionCounts[`${a.type}::${a.id}`] || 0,
              ...mapCommon(a),
            })),
          );
        } else {
          setArchivedItems([]);
        }

        // completedIds was previously only ever populated client-side,
        // in-session, after a successful solve — it started empty on
        // every page load with nothing checking the database. That's
        // why the same challenge could be solved again after a refresh,
        // or from a second Explore card showing the same underlying
        // challenge (e.g. tagged into both Daily and Featured). This
        // hydrates it from challenge_completions up front, using each
        // item's REAL id/type — the same authoritative source
        // hasPassedChallenge checks at solve-time.
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData?.user?.id;
        const solvableEntries = [
          ...daily.map((d) => ({
            localId: `db-${d.id}`,
            dbId: d.id,
            type: d.type,
          })),
          ...weekly.map((w) => ({
            localId: `db-${w.id}`,
            dbId: w.id,
            type: w.type,
          })),
          ...live.map((l) => ({
            localId: `db-live-${l.id}`,
            dbId: l.id,
            type: l.type,
          })),
          ...featured.map((f) => ({
            localId: `db-feat-${f.id}`,
            dbId: f.id,
            type: f.type,
          })),
        ];

        if (uid && solvableEntries.length > 0) {
          const relevantTypes = [
            ...new Set(solvableEntries.map((e) => e.type)),
          ];
          const { data: completions } = await supabase
            .from("challenge_completions")
            .select("challenge_id, challenge_type")
            .eq("user_id", uid)
            .in("challenge_type", relevantTypes);

          const completedKeys = new Set(
            (completions || []).map(
              (c) => `${c.challenge_type}::${c.challenge_id}`,
            ),
          );

          const preCompletedLocalIds = solvableEntries
            .filter((e) => completedKeys.has(`${e.type}::${String(e.dbId)}`))
            .map((e) => e.localId);

          if (preCompletedLocalIds.length > 0) {
            setCompletedIds(
              (prev) => new Set([...prev, ...preCompletedLocalIds]),
            );
          }
        }
      }

      const counts = await fetchDatabaseCategoryCounts();
      setCategoryCounts(counts || {});

      setLoading(false);
    };

    initExplore();
  }, []);

  const handleToggleReminder = (challengeId, title) => {
    const next = new Set(reminders);
    if (next.has(challengeId)) {
      next.delete(challengeId);
      showToast(`Reminder removed for ${title}`);
    } else {
      next.add(challengeId);
      showToast(`🔔 Reminder set! We'll notify you when ${title} opens.`);
    }
    setReminders(next);
    if (authUser?.id) {
      localStorage.setItem(
        `glitch_reminders_${authUser.id}`,
        JSON.stringify(Array.from(next)),
      );
    }
  };

  const handleChallengeCompleted = (id, pointsEarned) => {
    setCompletedIds((prev) => new Set(prev).add(id));
    setUserPoints((prev) => prev + pointsEarned);
    showToast(
      `🎉 Challenge solved! +${pointsEarned} gBits added & Uptime updated.`,
    );
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  return (
    <div className="relative min-h-screen bg-[#070709] text-white flex flex-col justify-between selection:bg-[#00F0FF]/20 overflow-hidden">
      {/* Dynamic Moving Glitch Background Particles */}
      <GlitchBackground />

      {/* Smooth Seamless Top Cyber Grid with Vertical Fade Gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-[1100px] z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0,240,255,0.25) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,240,255,0.25) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Ambient Cyan Radial Glow with Smooth Radial Falloff */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[750px] rounded-full blur-3xl opacity-20 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 25%, rgba(0, 240, 255, 0.25) 0%, rgba(0, 240, 255, 0.08) 50%, transparent 80%)",
        }}
      />

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

        {/* ── HERO HEADER (Cyan Accent & Seamless Fading Glow) ── */}
        <section className="relative pt-36 md:pt-44 pb-12 px-6 mb-8 md:mb-16 text-center">
          <div className="max-w-4xl mx-auto">
            <PageHeading
              eyebrow="CHALLENGE DISCOVERY ENGINE"
              title="The Glitch Explore Hub"
              subtitle="Discover time-bounded battles, daily refreshes, featured picks, core challenge modes, and historical vaults."
              accent="cyan"
              size="xl"
            />
          </div>
        </section>

        {/* ── 5 SECTIONS CONTAINER ── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 pb-20">
          {/* Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-4 py-3 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-mono flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} />
                  <span>{toastMessage}</span>
                </div>
                <button
                  onClick={() => setToastMessage("")}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─────────────────────────────────────────────────────────────────
              SECTION 1: LIMITED-TIME & DAILY / WEEKLY GLITCHES
          ───────────────────────────────────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Flame size={20} className="text-[#00F0FF]" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">
                    1. Limited-Time & Daily / Weekly Glitches
                  </h2>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    Recurring time-bound challenges with auto-reset schedules
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-block text-xs font-mono text-gray-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                ⚡ Unified Uptime System
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Glitches Column */}
              <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Flame size={18} className="text-[#FF00C8]" />
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                      Daily Glitches
                    </h3>
                  </div>
                  {dailyItems.length > 0 && (
                    <span className="text-xs font-mono text-[#FF00C8] font-bold bg-[#FF00C8]/10 border border-[#FF00C8]/20 px-3 py-1 rounded-full">
                      Active
                    </span>
                  )}
                </div>

                {dailyItems.length === 0 ? (
                  <ComingSoonBanner message="No active Daily challenges right now. Tag one in from the Admin Panel to feature it here!" />
                ) : (
                  <div className="space-y-4">
                    {dailyItems.map((item) => (
                      <TimeBoundChallengeCard
                        key={item.id}
                        item={item}
                        isCompleted={completedIds.has(item.id)}
                        onSolve={() => setActiveSolverChallenge(item)}
                        accent="#FF00C8"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Weekly Glitches Column */}
              <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Calendar size={18} className="text-[#00F0FF]" />
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                      Weekly Glitches
                    </h3>
                  </div>
                  {weeklyItems.length > 0 && (
                    <span className="text-xs font-mono text-[#00F0FF] font-bold bg-[#00F0FF]/10 border border-[#00F0FF]/20 px-3 py-1 rounded-full">
                      Active
                    </span>
                  )}
                </div>

                {weeklyItems.length === 0 ? (
                  <ComingSoonBanner message="No active Weekly challenges right now. Tag one in from the Admin Panel to feature it here!" />
                ) : (
                  <div className="space-y-4">
                    {weeklyItems.map((item) => (
                      <TimeBoundChallengeCard
                        key={item.id}
                        item={item}
                        isCompleted={completedIds.has(item.id)}
                        onSolve={() => setActiveSolverChallenge(item)}
                        accent="#00F0FF"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          {/* ─────────────────────────────────────────────────────────────────
              SECTION 2: LIVE CHALLENGES & UPCOMING CHALLENGES
          ───────────────────────────────────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Activity size={20} className="text-[#00F0FF]" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">
                  2. Live Challenges & Upcoming Battles
                </h2>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  Active live windows & scheduled future events
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Live Challenges Column */}
              <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                    </span>
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                      Live Challenges (Active Now)
                    </h3>
                  </div>
                  {liveItems.length > 0 && (
                    <span className="text-xs font-mono text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                      {liveItems.length} Live Now
                    </span>
                  )}
                </div>

                {liveItems.length === 0 ? (
                  <ComingSoonBanner message="No active Live Battles right now. Stay tuned!" />
                ) : (
                  <div className="space-y-4">
                    {liveItems.map((ch) => {
                      const isDone = completedIds.has(ch.id);
                      const remaining = secondsUntil(ch.end_time);
                      return (
                        <div
                          key={ch.id}
                          className="bg-[#07070d] border border-white/5 rounded-2xl p-6 hover:border-white/15 transition flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-3 mb-4">
                              <span className="text-[10px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-md font-bold flex items-center gap-1.5 shrink-0">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                </span>
                                LIVE NOW
                              </span>
                              <span className="text-xs font-mono text-amber-400 font-semibold shrink-0">
                                <GBitIcon className="w-3.5 h-3.5 inline mr-1 text-[#00F0FF]" />+
                                {Math.min(ch.points, 100)} gBits
                              </span>
                            </div>

                            <h4 className="text-base font-bold text-white mb-2">{ch.title}</h4>
                            <p className="text-xs text-gray-400 leading-relaxed mb-5 line-clamp-3">
                              {ch.description}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                            <span className="text-[11px] font-mono text-red-300 flex items-center gap-1.5 min-w-0 truncate">
                              <Clock size={12} className="shrink-0" />
                              {ch.end_time ? `Ends in ${formatTimer(remaining)}` : "Active Live Battle"}
                            </span>

                            {isDone ? (
                              <span className="flex items-center gap-1 text-xs font-mono text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-3.5 py-1.5 rounded-xl shrink-0">
                                <Check size={14} /> Done
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActiveSolverChallenge(ch)}
                                className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-xl cursor-pointer transition hover:opacity-90 shadow-md shrink-0"
                                style={{ background: "linear-gradient(90deg, #ef4444, #a855f7)" }}
                              >
                                Solve <ChevronRight size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Upcoming Challenges Column */}
              <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Clock size={18} className="text-[#38BDF8]" />
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                      Upcoming Challenges (Opening Soon)
                    </h3>
                  </div>
                  {upcomingItems.length > 0 && (
                    <span className="text-xs font-mono text-[#38BDF8] font-bold bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-3 py-1 rounded-full">
                      {upcomingItems.length} Scheduled
                    </span>
                  )}
                </div>

                {upcomingItems.length === 0 ? (
                  <ComingSoonBanner message="No upcoming battles scheduled yet." />
                ) : (
                  <div className="space-y-4">
                    {upcomingItems.map((ch) => {
                      const isSet = reminders.has(ch.id);
                      const untilStart = secondsUntil(ch.start_time);
                      return (
                        <div
                          key={ch.id}
                          className="bg-[#07070d] border border-white/5 rounded-2xl p-6 hover:border-white/15 transition flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-3 mb-4">
                              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 shrink-0">
                                UPCOMING BATTLE
                              </span>
                              <span className="text-xs font-mono text-amber-400 font-semibold shrink-0">
                                <GBitIcon className="w-3.5 h-3.5 inline mr-1 text-[#00F0FF]" />+
                                {Math.min(ch.points, 100)} gBits
                              </span>
                            </div>

                            <h4 className="text-base font-bold text-white mb-2">{ch.title}</h4>
                            <p className="text-xs text-gray-400 leading-relaxed mb-5 line-clamp-3">
                              {ch.description}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                            <span className="text-[11px] font-mono text-[#38BDF8] flex items-center gap-1.5 min-w-0 truncate">
                              <Clock size={12} className="shrink-0" />
                              {ch.start_time ? `Opens in ${formatTimer(untilStart)}` : "Opening Soon"}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                handleToggleReminder(ch.id, ch.title)
                              }
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shrink-0 cursor-pointer transition border ${
                                isSet
                                  ? "bg-[#38BDF8]/20 border-[#38BDF8]/40 text-[#38BDF8]"
                                  : "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                              }`}
                            >
                              {isSet ? (
                                <>
                                  <Check size={14} /> Saved
                                </>
                              ) : (
                                <>
                                  <Bell size={14} /> Remind Me
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          {/* ─────────────────────────────────────────────────────────────────
              SECTION 3: FEATURED & EDITOR'S CHOICE
          ───────────────────────────────────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Sparkles size={20} className="text-[#A855F7]" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">
                    3. Featured & Editor's Choice
                  </h2>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    Handpicked top-tier challenges worth discovering
                  </p>
                </div>
              </div>
            </div>

            {featuredItems.length === 0 ? (
              <ComingSoonBanner message="No featured picks currently. Add challenges in Admin to feature them here!" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredItems.map((item) => {
                  const isCompleted = completedIds.has(item.id);
                  const isDupCategory =
                    item.language &&
                    item.language.toLowerCase() ===
                      (item.badge || item.category || "").toLowerCase();

                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="bg-[#07070d] border border-white/5 hover:border-white/15 rounded-2xl p-6 flex flex-col justify-between transition-all shadow-xl group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md text-[#A855F7] bg-[#A855F7]/15 border border-[#A855F7]/30 shrink-0">
                            {item.badge || item.category || "Featured"}
                          </span>
                          <span className="text-xs font-mono text-amber-400 font-semibold shrink-0">
                            <GBitIcon className="w-3.5 h-3.5 inline mr-1 text-[#00F0FF]" />+
                            {Math.min(item.points, 100)} gBits
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-white mb-2 group-hover:text-[#A855F7] transition">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-400 leading-relaxed mb-5 line-clamp-3">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                        <span className="text-[11px] font-mono text-gray-500 flex items-center gap-1.5 min-w-0 truncate">
                          <Clock size={12} className="shrink-0" />
                          {!isDupCategory && item.language
                            ? item.language
                            : "★ Editor's Choice"}
                        </span>
                        {isCompleted ? (
                          <span className="flex items-center gap-1 text-xs font-mono text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-3.5 py-1.5 rounded-xl shrink-0">
                            <Check size={14} /> Done
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveSolverChallenge(item)}
                            className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-xl cursor-pointer transition hover:opacity-90 shadow-md shrink-0"
                            style={{
                              background:
                                "linear-gradient(90deg, #A855F7, #00F0FF)",
                            }}
                          >
                            Solve <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.section>

          {/* ─────────────────────────────────────────────────────────────────
              SECTION 4: OUR 4 CORE CHALLENGE CATEGORIES
          ───────────────────────────────────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Layers size={20} className="text-[#00F0FF]" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">
                    4. Core Challenge Modes
                  </h2>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    Our 4 primary challenge platforms & problem domains
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {CORE_CHALLENGE_TYPES.map((cat) => {
                const Icon = cat.icon;
                const count =
                  categoryCounts[cat.dbKey] ||
                  categoryCounts[cat.id] ||
                  categoryCounts[cat.id.replace("-challenges", "")] ||
                  0;
                return (
                  <Link
                    key={cat.id}
                    to={cat.path}
                    className="no-underline group bg-[#0f0f18] border border-white/10 hover:border-white/25 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 shadow-xl hover:-translate-y-1"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{
                            background: `${cat.color}15`,
                            border: `1px solid ${cat.color}30`,
                          }}
                        >
                          <Icon size={24} style={{ color: cat.color }} />
                        </div>
                        <span className="text-xs font-mono text-gray-400 font-semibold bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                          {count} Puzzles
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-lg mb-2 group-hover:text-[#00F0FF] transition">
                        {cat.title}
                      </h3>
                      <p className="text-xs text-gray-400 leading-relaxed mb-6">
                        {cat.desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
                        {cat.badge}
                      </span>
                      <span className="text-xs font-bold text-gray-300 group-hover:text-white flex items-center gap-1">
                        Enter <ChevronRight size={14} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.section>

          {/* ─────────────────────────────────────────────────────────────────
              SECTION 5: PAST CHALLENGES & VAULT ARCHIVE
          ───────────────────────────────────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Archive size={20} className="text-gray-400" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">
                    5. Past Challenges & Vault Archive
                  </h2>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    Completed historical battles & hall of fame solution
                    references
                  </p>
                </div>
              </div>
            </div>

            {archivedItems.length === 0 ? (
              <ComingSoonBanner message="No archived vault entries yet." />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {archivedItems.slice(0, visibleArchiveCount).map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#0f0f18] border border-white/10 rounded-2xl p-6 flex flex-col justify-between opacity-85 hover:opacity-100 transition shadow-xl"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-mono text-gray-400 uppercase tracking-wider bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                            Ended {formatArchiveDate(item.end_time)}
                          </span>
                          <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                            <GBitIcon className="w-3.5 h-3.5 inline mr-1 text-[#00F0FF]" />
                            +{Math.min(item.points || 50, 100)} gBits
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-base mb-2">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-400">
                          Completed by {item.completedBy} developer
                          {item.completedBy === 1 ? "" : "s"}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-end text-xs font-mono text-gray-400">
                        <span className="text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          Archived ✓
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {archivedItems.length > 12 && (
                  <div className="flex justify-center pt-8">
                    <button
                      type="button"
                      onClick={() => {
                        if (visibleArchiveCount < archivedItems.length) {
                          setVisibleArchiveCount((prev) => prev + 12);
                        } else {
                          setVisibleArchiveCount(12);
                        }
                      }}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border border-white/10 hover:border-white/20 bg-[#0f0f14] hover:bg-[#14141d] text-emerald-400"
                    >
                      {visibleArchiveCount < archivedItems.length
                        ? "See More"
                        : "See Less"}
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.section>
        </main>

        <Footer />
      </div>

      {/* Interactive Challenge Solver Modal */}
      <AnimatePresence>
        {activeSolverChallenge && (
          <ChallengeSolverModal
            challenge={activeSolverChallenge}
            user={authUser}
            onClose={() => setActiveSolverChallenge(null)}
            onComplete={handleChallengeCompleted}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Explore;
