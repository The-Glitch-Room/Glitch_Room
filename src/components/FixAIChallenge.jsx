import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import aiChallenges from "../data/ai_challenges.json";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Sparkles,
  Send,
  Trophy,
  Zap,
  AlertTriangle,
  TrendingUp,
  FileText,
  Lightbulb,
  Unlock,
  Loader2,
} from "lucide-react";
import {
  fetchPoints,
  updatePoints,
  getPointsByDifficulty,
  checkIfSolved,
  hasPassedChallenge,
  saveSubmission,
  hasPriorSubmissions,
} from "../utils/pointsHelper";
import { checkAndAwardBadges } from "../utils/badgeEngine";
import { supabase } from "../supabaseClient";
import {
  getVerdict,
  pointsForScore,
  PASS_THRESHOLD,
} from "../utils/feedbackVerdict";
import { GBitIcon } from "./GBitIcon";

const COLOR = "#FF00C8";

const difficultyStyle = (difficulty) => {
  const d = (difficulty || "").toLowerCase();
  if (d.includes("easy") || d.includes("beginner"))
    return {
      text: "text-green-400",
      bg: "bg-green-500/10",
      dot: "bg-green-400",
    };
  if (d.includes("medium") || d.includes("inter"))
    return {
      text: "text-yellow-400",
      bg: "bg-yellow-500/10",
      dot: "bg-yellow-400",
    };
  return { text: "text-red-400", bg: "bg-red-500/10", dot: "bg-red-400" };
};

const FeedbackBlock = ({ feedback, passed }) => {
  const strength =
    feedback?.strength ||
    feedback?.what_you_got_right ||
    feedback?.whatYouGotRight ||
    feedback?.feedback ||
    "";
  const gap =
    feedback?.gap || feedback?.what_was_missed || feedback?.whatWasMissed || "";
  const upgrade =
    feedback?.suggestion ||
    feedback?.upgrade ||
    feedback?.how_to_level_it_up ||
    feedback?.howToLevelItUp ||
    "";

  const hasAnyText = Boolean(strength || gap || upgrade);

  return (
    <div className="space-y-3">
      {/* Verdict pill */}
      <div
        className="flex items-center justify-between p-3 rounded-xl"
        style={{
          background: passed ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${passed ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
        }}
      >
        <div className="flex items-center gap-2">
          {passed ? (
            <CheckCircle2 size={15} className="text-green-400" />
          ) : (
            <AlertTriangle size={15} className="text-red-400" />
          )}
          <span
            className={`text-sm font-bold ${passed ? "text-green-400" : "text-red-400"}`}
          >
            {getVerdict(feedback?.score).label}
          </span>
        </div>
        {typeof feedback?.score === "number" && (
          <span
            className="text-sm font-black"
            style={{ color: passed ? "#22c55e" : "#ef4444" }}
          >
            {feedback.score}/10
          </span>
        )}
      </div>

      {!hasAnyText && (
        <div className="rounded-xl p-3.5 bg-amber-500/[0.08] border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
          ⚡ <strong>AI Evaluation Notice:</strong> The AI grader assigned a
          score of <strong>{feedback?.score || 0}/10</strong>. Make sure your
          Supabase Edge Function secret <code>GROQ_API_KEY</code> is set to get
          full text breakdowns.
        </div>
      )}

      {strength && (
        <div className="rounded-xl p-3.5 bg-green-500/[0.05] border border-green-500/15">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap size={11} className="text-green-400" />
            <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider">
              What you got right
            </p>
          </div>
          <p className="text-gray-300 text-xs leading-relaxed">{strength}</p>
        </div>
      )}

      {gap && (
        <div className="rounded-xl p-3.5 bg-yellow-500/[0.05] border border-yellow-500/15">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={11} className="text-yellow-400" />
            <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">
              What was missed
            </p>
          </div>
          <p className="text-gray-300 text-xs leading-relaxed">{gap}</p>
        </div>
      )}

      {upgrade && (
        <div className="rounded-xl p-3.5 bg-cyan-500/[0.05] border border-cyan-500/15">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={11} className="text-cyan-400" />
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
              How to level it up
            </p>
          </div>
          <p className="text-gray-300 text-xs leading-relaxed">{upgrade}</p>
        </div>
      )}
    </div>
  );
};

const FixAIChallenge = () => {
  const { id } = useParams();
  const challenge = aiChallenges.find((item) => String(item.id) === id);

  const [leftTab, setLeftTab] = useState("description");
  const [rightTab, setRightTab] = useState("answer");

  const [solutionVisible, setSolutionVisible] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [points, setPoints] = useState(0);
  const [userId, setUserId] = useState(null);

  const [showCongrats, setShowCongrats] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [firstTryBonus, setFirstTryBonus] = useState(false);

  const [evaluating, setEvaluating] = useState(false);
  const [evalError, setEvalError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [lastPassed, setLastPassed] = useState(false);
  const [lastAwardedPoints, setLastAwardedPoints] = useState(0);

  const [previousSubmission, setPreviousSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileIconRef = useRef(null);

  const difficulty = challenge?.difficulty || "Easy";
  const earnablePoints = challenge ? getPointsByDifficulty(difficulty) : 0;
  const diffStyle = difficultyStyle(difficulty);

  useEffect(() => {
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUserId(userData?.user?.id);
      const [pts, prev] = await Promise.all([
        fetchPoints(),
        challenge ? checkIfSolved(challenge.id, "ai") : null,
      ]);
      setPoints(pts);
      if (prev) setPreviousSubmission(prev);
      setLoading(false);
    };
    init();
  }, []);

  if (!challenge)
    return (
      <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center text-white text-xl">
        ⚠️ Challenge not found!
      </div>
    );

  if (loading)
    return (
      <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center">
        <div
          className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: COLOR }}
        />
      </div>
    );

  const handleShowSolution = async () => {
    if (points < 5) {
      alert("Not enough points to reveal 💪");
      return;
    }
    const next = await updatePoints(-5, `Hint used: ${challenge.title}`, "ai");
    setPoints(next);
    setSolutionVisible(true);
    setLeftTab("solution");
  };

  const handleSubmit = async () => {
    if (!userAnswer.trim()) {
      alert("Please write your approach before submitting!");
      return;
    }

    setEvaluating(true);
    setEvalError("");
    setFeedback(null);
    setRightTab("feedback");

    // Snapshot whether this is genuinely the first-ever attempt (pass or
    // fail) on this challenge — must be checked before saveSubmission()
    // writes the row for the current attempt.
    const hadNoPriorAttempts = !(await hasPriorSubmissions(challenge.id, "ai"));

    const scenario = `Challenge: ${challenge.title}

Description: ${challenge.description || "N/A"}

${challenge.code ? `Challenge code given to the user:\n${challenge.code}\n\n` : ""}${
      challenge.solution
        ? `Reference correct solution (for grading only, do not reveal it verbatim in feedback):\n${challenge.solution}\n\n`
        : ""
    }Evaluate whether the user correctly diagnosed the AI/ML issue and proposed a valid fix or approach. Score strictly — a vague, empty, or off-topic answer should score low even if something was typed.`;

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "ai-feedback-edge-function",
        { body: { scenario, answer: userAnswer } },
      );

      if (fnError) throw fnError;

      const parsed = typeof fnData === "string" ? JSON.parse(fnData) : fnData;
      const score = typeof parsed?.score === "number" ? parsed.score : 0;
      const passed = score >= PASS_THRESHOLD;

      setFeedback(parsed);
      setLastPassed(passed);

      const alreadyPassedBefore = await hasPassedChallenge(challenge.id, "ai");
      const isFirstPass = passed && !alreadyPassedBefore;
      const awardedPoints = pointsForScore(score, earnablePoints);

      if (isFirstPass) {
        let next = await updatePoints(
          awardedPoints,
          `Solved AI: ${challenge.title}`,
          "ai",
        );

        let earnedBonus = false;
        if (hadNoPriorAttempts) {
          next = await updatePoints(
            25,
            `First-Try Clearance: ${challenge.title}`,
            "bonus",
          );
          earnedBonus = true;
        }

        setFirstTryBonus(earnedBonus);
        setLastAwardedPoints(awardedPoints);
        setPoints(next);
        await checkAndAwardBadges(userId);
        await saveSubmission(
          challenge.id,
          "ai",
          userAnswer,
          awardedPoints,
          score,
          0,
          difficulty,
          earnedBonus,
        );
        setPreviousSubmission({
          answer: userAnswer,
          points_earned: awardedPoints,
        });
        setShowCongrats(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        setTimeout(() => setShowCongrats(false), 4000);
      } else {
        setFirstTryBonus(false);
        await saveSubmission(challenge.id, "ai", userAnswer, 0, score);
        if (passed && alreadyPassedBefore) {
          setPreviousSubmission({ answer: userAnswer, points_earned: 0 });
        }
      }
    } catch (err) {
      console.error("AI evaluation error:", err);
      setEvalError(
        "Couldn't reach the AI grader right now. Your answer wasn't scored — please try submitting again.",
      );
    } finally {
      setEvaluating(false);
    }
  };

  const alreadySolved = !!previousSubmission;

  return (
    <div className="min-h-screen w-full bg-[#0B0C10] text-gray-100 flex flex-col lg:h-screen lg:w-screen lg:overflow-hidden overflow-y-auto pb-28 lg:pb-0">
      {showConfetti && <Confetti />}

      <div className="sticky top-0 z-40 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-3 border-b border-white/10 bg-[#0d0d12]/95 backdrop-blur-md shrink-0 shadow-md">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            to="/ai-challenges"
            className="flex items-center gap-1.5 text-gray-500 transition text-sm shrink-0"
            onMouseEnter={(e) => (e.currentTarget.style.color = COLOR)}
            onMouseLeave={(e) => (e.currentTarget.style.color = "")}
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="h-5 w-px bg-white/10 hidden sm:block" />
          <h1 className="text-xs sm:text-base font-bold text-white truncate max-w-[48vw] sm:max-w-none">
            {challenge.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span
            className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${diffStyle.bg} ${diffStyle.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${diffStyle.dot}`} />
            {difficulty}
          </span>
          {alreadySolved && (
            <span className="hidden sm:flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
              <CheckCircle2 size={11} /> Solved
            </span>
          )}
          <div
            ref={profileIconRef}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full shrink-0"
            style={{
              color: COLOR,
              background: `${COLOR}15`,
              border: `1px solid ${COLOR}30`,
            }}
          >
            <GBitIcon size={12} /> {points} pts
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/5">
        {/* LEFT PANEL */}
        <div className="bg-[#0B0C10] flex flex-col min-h-0">
          <div className="shrink-0 flex items-center gap-1 px-2.5 sm:px-3 pt-2.5 sm:pt-3 border-b border-white/6 overflow-x-auto no-scrollbar">
            {[
              { id: "description", label: "Problem", icon: FileText },
              {
                id: "hint",
                label: "Hint",
                icon: Lightbulb,
                disabled: !challenge.hint,
              },
              {
                id: "solution",
                label: solutionVisible ? "Solution" : "Solution 🔒",
                icon: solutionVisible ? Unlock : Lock,
              },
            ].map((t) => (
              <button
                key={t.id}
                disabled={t.disabled}
                onClick={() => setLeftTab(t.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                style={
                  leftTab === t.id
                    ? {
                        color: COLOR,
                        borderBottom: `2px solid ${COLOR}`,
                        background: `${COLOR}0D`,
                      }
                    : {
                        color: "#6b7280",
                        borderBottom: "2px solid transparent",
                      }
                }
              >
                <t.icon size={12} />
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 lg:overflow-y-auto p-3.5 sm:p-5">
            <AnimatePresence mode="wait">
              {leftTab === "description" && (
                <motion.div
                  key="desc"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center gap-2 mb-4 flex-wrap sm:hidden">
                    <span
                      className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${diffStyle.bg} ${diffStyle.text}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${diffStyle.dot}`}
                      />
                      {difficulty}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                    {challenge.category}
                  </span>
                  <p className="text-gray-300 text-sm leading-relaxed mt-3 mb-6">
                    {challenge.description}
                  </p>

                  {challenge.code && (
                    <div>
                      <p
                        className="text-xs font-bold uppercase tracking-widest mb-2"
                        style={{ color: COLOR }}
                      >
                        Challenge Code
                      </p>
                      <div className="bg-[#080810] border border-white/5 rounded-xl p-4 overflow-x-auto">
                        <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                          {challenge.code}
                        </pre>
                      </div>
                    </div>
                  )}

                  {alreadySolved && (
                    <div className="mt-6 flex items-center gap-2 text-green-400 text-xs bg-green-500/5 border border-green-500/15 rounded-xl px-3.5 py-2.5">
                      <CheckCircle2 size={13} />
                      You've already solved this one — resubmitting won't earn
                      additional points.
                    </div>
                  )}
                </motion.div>
              )}

              {leftTab === "hint" && (
                <motion.div
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {challenge.hint ? (
                    <div className="flex items-start gap-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                      <Lightbulb
                        size={16}
                        className="text-yellow-400 mt-0.5 shrink-0"
                      />
                      <p className="text-yellow-300 text-sm leading-relaxed">
                        {challenge.hint}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">
                      No hint available for this challenge.
                    </p>
                  )}
                </motion.div>
              )}

              {leftTab === "solution" && (
                <motion.div
                  key="solution"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {solutionVisible ? (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-green-400 mb-2">
                        ✅ Correct Solution
                      </p>
                      <div className="bg-[#080810] border border-green-500/20 rounded-xl p-4 overflow-x-auto">
                        <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                          {challenge.solution || "No solution provided yet."}
                        </pre>
                      </div>
                      <p className="text-gray-600 text-xs mt-3">
                        Heads up — the AI grader can see this reference
                        solution, so copy-pasting it will be scored accordingly.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <Lock size={28} className="text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm mb-4">
                        Reveal the solution for{" "}
                        <span className="text-white font-semibold">
                          5 points
                        </span>
                        .
                      </p>
                      <button
                        onClick={handleShowSolution}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer bg-[#1a1a22] border border-white/10 text-gray-300 hover:text-white hover:border-white/20"
                      >
                        🔓 Reveal Solution (-5 pts)
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="bg-[#0B0C10] flex flex-col min-h-0">
          <div className="flex-1 min-h-0 flex flex-col p-4">
            <div className="flex items-center justify-between mb-2">
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: COLOR }}
              >
                Your Approach
              </p>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-1"
                style={{
                  background: `${COLOR}15`,
                  color: COLOR,
                  border: `1px solid ${COLOR}30`,
                }}
              >
                up to +{earnablePoints} <GBitIcon size={11} /> pts on pass
              </span>
            </div>
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={evaluating}
              className="flex-1 w-full bg-[#080810] border border-white/8 rounded-xl p-4 text-gray-200 placeholder-gray-600 outline-none transition text-sm font-mono resize-none disabled:opacity-50 focus:ring-2"
              style={{ "--tw-ring-color": COLOR }}
              placeholder="Write your approach, solution, or explanation — you can include code inline. Be specific: a vague answer will score low."
            />
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 mt-3">
              <p className="text-[10px] text-gray-600">
                {userAnswer.trim().length} characters
              </p>
              <motion.button
                whileHover={
                  !evaluating && userAnswer.trim() ? { scale: 1.03 } : {}
                }
                whileTap={
                  !evaluating && userAnswer.trim() ? { scale: 0.97 } : {}
                }
                onClick={handleSubmit}
                disabled={evaluating || !userAnswer.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${COLOR}, #D600FF)`,
                }}
              >
                {evaluating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Grading with AI…
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Submit
                  </>
                )}
              </motion.button>
            </div>
          </div>

          <div className="shrink-0 border-t border-white/6 lg:max-h-[46%] flex flex-col min-h-[140px]">
            <div className="shrink-0 flex items-center gap-1 px-3 pt-2.5 border-b border-white/6">
              {[
                { id: "answer", label: "Instructions" },
                {
                  id: "feedback",
                  label: "AI Feedback",
                  disabled: !feedback && !evaluating && !evalError,
                },
              ].map((t) => (
                <button
                  key={t.id}
                  disabled={t.disabled}
                  onClick={() => setRightTab(t.id)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  style={
                    rightTab === t.id
                      ? {
                          color: COLOR,
                          borderBottom: `2px solid ${COLOR}`,
                          background: `${COLOR}0D`,
                        }
                      : {
                          color: "#6b7280",
                          borderBottom: "2px solid transparent",
                        }
                  }
                >
                  {t.id === "feedback" && <Sparkles size={12} />}
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {rightTab === "answer" && (
                <div className="text-xs text-gray-500 leading-relaxed space-y-2">
                  <p>
                    Write your answer as plain text — you can paste code inline,
                    no separate format needed.
                  </p>
                  <p>
                    Submissions are graded by AI against the reference solution.
                    You need a score of{" "}
                    <span className="text-white font-semibold">
                      {PASS_THRESHOLD}/10
                    </span>{" "}
                    or higher to earn points.
                  </p>
                </div>
              )}

              {rightTab === "feedback" && (
                <>
                  {evaluating && (
                    <div className="flex flex-col items-center justify-center py-6 gap-2 text-gray-500 text-xs">
                      <Loader2
                        size={20}
                        className="animate-spin"
                        style={{ color: COLOR }}
                      />
                      Analyzing your answer…
                    </div>
                  )}
                  {!evaluating && evalError && (
                    <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                      <AlertTriangle
                        size={14}
                        className="text-red-400 shrink-0 mt-0.5"
                      />
                      <p className="text-red-300 text-xs leading-relaxed">
                        {evalError}
                      </p>
                    </div>
                  )}
                  {!evaluating && !evalError && feedback && (
                    <FeedbackBlock feedback={feedback} passed={lastPassed} />
                  )}
                  {!evaluating && !evalError && !feedback && (
                    <p className="text-gray-600 text-xs">
                      Submit your answer to see AI feedback here.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCongrats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex justify-center items-center bg-black/60 backdrop-blur-sm z-50"
          >
            <motion.div
              initial={{ scale: 0.85, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#0f0f14] text-center px-10 py-8 rounded-2xl shadow-2xl"
              style={{ border: `1px solid ${COLOR}40` }}
            >
              <Trophy
                size={36}
                className="mx-auto mb-3"
                style={{ color: COLOR }}
              />
              <h2 className="text-2xl font-black text-white mb-2">
                Brilliant Work!
              </h2>
              <p className="text-gray-400 text-sm mb-3">
                The AI grader confirmed your approach checks out.
              </p>
              <p
                className="font-bold flex items-center justify-center gap-1.5"
                style={{ color: COLOR }}
              >
                +{lastAwardedPoints} Points <GBitIcon size={14} />
              </p>
              {firstTryBonus && (
                <p className="text-xs text-yellow-400 font-semibold mt-1 flex items-center justify-center gap-1">
                  <GBitIcon size={11} /> +25 Bonus — First-Try Clearance
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FixAIChallenge;
