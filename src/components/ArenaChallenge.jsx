import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Confetti from "react-confetti";
import { FaBolt, FaRandom, FaBullhorn, FaCheckCircle } from "react-icons/fa";
import { FiZap, FiAlertTriangle, FiTrendingUp } from "react-icons/fi";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { updatePoints } from "../utils/pointsHelper";
import TwistCardTimer from "./TwistCardTimer";
import { getFeaturedArenaEvent } from "../data/arenaEventsData";
import GlitchBackground from "./GlitchBackground";
import {
  getVerdict,
  pointsForScore,
  PASS_THRESHOLD,
} from "../utils/feedbackVerdict";

// Max XP each of Arena's two graded stages (Stage 1 + Stage 3) can
// contribute. A stage below PASS_THRESHOLD contributes 0 — there's no
// flat "you finished" base, so both stages failing means 0 total XP.
const STAGE_MAX_XP = 50;

// ─── Twist Cards ──────────────────────────────────────────────────────────────
const TWIST_CARDS = [
  "You have 60 seconds to finalize your solution. Go!",
  "You only have 3 sentences to explain your entire fix. Make them count.",
  "Explain your solution in under 30 words. Every word matters.",
  "Your solution must be described in exactly 3 bullet points.",
  "Your pitch must only use questions. No statements allowed.",
  "Describe your fix using only a numbered list of steps — no prose.",
  "Your entire pitch must be written in ALL CAPS.",
  "Structure your answer as: Problem → Root Cause → Fix → Result.",
  "Your pitch must start with 'Once upon a time...' and end with a lesson.",
  "Write your solution as a tweet thread — max 3 tweets, 280 chars each.",
  "Describe your fix as if explaining to a 10-year-old.",
  "Explain your solution as if you're pitching to a room of investors.",
  "Describe the glitch and your fix as if you're a news anchor breaking a story.",
  "Explain your fix as if you're a doctor diagnosing a patient.",
  "Pitch your solution like a late-night infomercial host.",
  "Explain the bug as if it were a crime scene and you're the detective.",
  "Describe your fix as if you're a chef explaining a recipe.",
  "Pitch your solution the way a sports commentator would describe a game-winning play.",
  "Explain the glitch as if it's a natural disaster and your fix is emergency relief.",
  "Describe your solution as a coach giving a halftime pep talk.",
  "Explain your fix using only a movie analogy.",
  "You can only use emojis to describe your approach in Stage 3.",
  "Relate your solution to something from nature.",
  "Your fix must reference at least one real-world product or company.",
  "Your pitch must include a before/after comparison.",
  "Use a sports analogy to explain the glitch and your fix.",
  "Explain your solution using a cooking metaphor — ingredients, method, and result.",
  "Your pitch must include a plot twist — something unexpected about your fix.",
  "Describe the bug as a villain and your fix as the hero. Give them names.",
  "Explain your fix using only things you can find in a classroom.",
  "You cannot use the words 'bug', 'error', 'fix', or 'problem' in your pitch.",
  "Your pitch must include at least one statistic or made-up data point.",
  "Your solution must mention a potential failure case and how you'd handle it.",
  "You must include a quote — real or made up — from a famous person to support your fix.",
  "Your pitch must end with a bold claim: 'This fix will...' Finish it.",
  "Mention exactly 2 alternative approaches you considered before choosing your fix.",
  "Your fix must be explained using an analogy from a completely different industry.",
  "Describe the worst thing that could happen if your fix was NOT applied.",
];

// ─── Stage configs ────────────────────────────────────────────────────────────
const STAGES = [
  {
    id: 1,
    label: "Stage 1",
    title: "Find the Glitch",
    icon: <FaBolt />,
    color: "cyan",
    gradient: "from-cyan-500 to-blue-600",
    border: "border-cyan-500/30",
    glow: "shadow-[0_0_20px_rgba(0,240,255,0.15)]",
  },
  {
    id: 2,
    label: "Stage 2",
    title: "Twist Card",
    icon: <FaRandom />,
    color: "fuchsia",
    gradient: "from-fuchsia-500 to-purple-700",
    border: "border-fuchsia-500/30",
    glow: "shadow-[0_0_20px_rgba(200,0,255,0.15)]",
  },
  {
    id: 3,
    label: "Stage 3",
    title: "Pitch Wild",
    icon: <FaBullhorn />,
    color: "pink",
    gradient: "from-pink-500 to-rose-600",
    border: "border-pink-500/30",
    glow: "shadow-[0_0_20px_rgba(255,0,120,0.15)]",
  },
];

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const StageProgress = ({ currentStage }) => (
  <div className="flex items-center justify-center gap-3 mb-12">
    {STAGES.map((stage, i) => {
      const done = currentStage > stage.id;
      const active = currentStage === stage.id;
      return (
        <React.Fragment key={stage.id}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500
                ${done ? "bg-green-500 border-green-500 text-white" : ""}
                ${active ? `bg-gradient-to-br ${stage.gradient} border-transparent text-white scale-110` : ""}
                ${!done && !active ? "bg-[#1a1a22] border-white/10 text-gray-500" : ""}
              `}
            >
              {done ? <FaCheckCircle /> : stage.id}
            </div>
            <span
              className={`text-xs font-medium ${active ? "text-white" : "text-gray-600"}`}
            >
              {stage.label}
            </span>
          </div>
          {i < STAGES.length - 1 && (
            <div
              className={`h-0.5 w-16 rounded transition-all duration-500 ${
                currentStage > stage.id ? "bg-green-500" : "bg-white/10"
              }`}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── AI Feedback Panel ────────────────────────────────────────────────────────
const AIFeedbackPanel = ({ feedback, onContinue, buttonLabel }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="mt-6"
  >
    <div className="flex items-center gap-2 mb-4">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
        style={{
          background: "rgba(0,240,255,0.1)",
          border: "1px solid rgba(0,240,255,0.25)",
        }}
      >
        🤖
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
        AI Feedback
      </p>
      <div
        className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
        style={{
          background: "rgba(0,240,255,0.1)",
          color: "#00F0FF",
          border: "1px solid rgba(0,240,255,0.2)",
        }}
      >
        Powered by Claude
      </div>
    </div>

    <div
      className="flex items-center justify-between p-3 rounded-xl mb-4"
      style={{
        background: getVerdict(feedback?.score).passed
          ? "rgba(34,197,94,0.08)"
          : "rgba(239,68,68,0.08)",
        border: `1px solid ${
          getVerdict(feedback?.score).passed
            ? "rgba(34,197,94,0.25)"
            : "rgba(239,68,68,0.25)"
        }`,
      }}
    >
      <div className="flex items-center gap-2">
        {getVerdict(feedback?.score).passed ? (
          <FaCheckCircle className="text-green-400" size={14} />
        ) : (
          <FiAlertTriangle className="text-red-400" size={14} />
        )}
        <span
          className={`text-sm font-bold ${
            getVerdict(feedback?.score).passed
              ? "text-green-400"
              : "text-red-400"
          }`}
        >
          {getVerdict(feedback?.score).label}
        </span>
      </div>
      {typeof feedback?.score === "number" && (
        <span
          className="text-sm font-black"
          style={{
            color: getVerdict(feedback?.score).passed ? "#22c55e" : "#ef4444",
          }}
        >
          {feedback.score}/10
        </span>
      )}
    </div>

    <div className="space-y-3 mb-5">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl p-4"
        style={{
          background: "rgba(34,197,94,0.06)",
          border: "1px solid rgba(34,197,94,0.2)",
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <FiZap size={12} className="text-green-400" />
          <p className="text-xs font-bold text-green-400 uppercase tracking-wider">
            What You Got Right
          </p>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">
          {feedback.strength ||
            feedback.what_you_got_right ||
            feedback.whatYouGotRight ||
            feedback.feedback ||
            "Good effort on your submission."}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl p-4"
        style={{
          background: "rgba(234,179,8,0.06)",
          border: "1px solid rgba(234,179,8,0.2)",
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <FiAlertTriangle size={12} className="text-yellow-400" />
          <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
            What Was Missed
          </p>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">
          {feedback.gap ||
            feedback.what_was_missed ||
            feedback.whatWasMissed ||
            "No critical gaps identified."}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl p-4"
        style={{
          background: "rgba(0,240,255,0.06)",
          border: "1px solid rgba(0,240,255,0.2)",
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <FiTrendingUp size={12} className="text-cyan-400" />
          <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            How to Level It Up
          </p>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">
          {feedback.suggestion ||
            feedback.upgrade ||
            feedback.how_to_level_it_up ||
            feedback.howToLevelItUp ||
            "Refine edge case validations."}
        </p>
      </motion.div>
    </div>

    {feedback.score && (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-center gap-3 mb-5 p-3 rounded-xl"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span className="text-gray-500 text-xs uppercase tracking-widest font-semibold">
          Glitch Score
        </span>
        <span
          className="text-2xl font-black"
          style={{
            background: "linear-gradient(90deg,#00F0FF,#FF00C8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {feedback.score}/10
        </span>
        <div className="flex-1 max-w-[120px] h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(feedback.score / 10) * 100}%` }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg,#00F0FF,#FF00C8)" }}
          />
        </div>
      </motion.div>
    )}

    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onContinue}
      className="w-full py-3 rounded-xl font-bold text-sm text-black cursor-pointer"
      style={{ background: "linear-gradient(90deg,#00F0FF,#FF00C8)" }}
    >
      {buttonLabel || "Got it — Move to Stage 2 →"}
    </motion.button>
  </motion.div>
);

// ─── Stage 1: Find the Glitch ─────────────────────────────────────────────────
const Stage1 = ({ event, onComplete }) => {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState("");

  const scenario =
    event?.glitch_scenario ||
    "A startup's recommendation engine keeps suggesting products that users already bought. The more they buy, the worse the suggestions get. Users are leaving. What's the glitch, and how would you fix it?";

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "ai-feedback-edge-function",
        { body: { scenario, answer } },
      );
      if (fnError) throw fnError;
      const parsed = typeof fnData === "string" ? JSON.parse(fnData) : fnData;
      setFeedback(parsed);
    } catch (err) {
      console.error("AI feedback error:", err);
      setError("Couldn't load AI feedback right now. You can still continue.");
      setTimeout(() => onComplete(0), 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="stage1"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-cyan-400 mb-2">
          ⚡ Find the Glitch
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Read the scenario below. Identify what's broken and describe how you'd
          fix it. Be creative — the best fixes aren't always the most obvious
          ones.
        </p>
      </div>

      <div className="bg-[#0a0a14] border border-cyan-500/20 rounded-xl p-6 mb-6">
        <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-3">
          The Glitch Scenario
        </p>
        <div>
          {scenario.split(/(```[\s\S]*?```)/g).map((part, i) => {
            if (part.startsWith("```")) {
              const firstLineEnd = part.indexOf("\n");
              const lang = part.slice(3, firstLineEnd).trim();
              const code = part.slice(firstLineEnd + 1, -3);
              return (
                <div
                  key={i}
                  className="my-4 bg-[#070709] border border-white/10 rounded-xl p-4 font-mono text-xs text-[#00F0FF] overflow-x-auto shadow-inner"
                >
                  {lang && (
                    <div className="text-[10px] uppercase font-bold text-gray-500 mb-2 border-b border-white/5 pb-1">
                      {lang} snippet
                    </div>
                  )}
                  <pre className="whitespace-pre-wrap">{code}</pre>
                </div>
              );
            }
            return (
              <p
                key={i}
                className="text-gray-300 text-sm leading-relaxed whitespace-pre-line mb-2"
              >
                {part}
              </p>
            );
          })}
        </div>
      </div>

      {!feedback && (
        <>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Describe the glitch and your fix here..."
            disabled={loading}
            className="w-full h-36 bg-[#0a0a14] border border-cyan-500/20 rounded-xl p-4 text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none transition resize-none text-sm disabled:opacity-50"
          />
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          <div className="flex justify-end mt-4">
            <motion.button
              whileHover={!loading && answer.trim() ? { scale: 1.04 } : {}}
              whileTap={!loading && answer.trim() ? { scale: 0.97 } : {}}
              onClick={handleSubmit}
              disabled={loading || !answer.trim()}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl text-sm disabled:opacity-60 transition-all cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.8,
                      ease: "linear",
                    }}
                    className="w-4 h-4 border-2 border-t-transparent border-white rounded-full"
                  />
                  Analyzing your answer…
                </>
              ) : (
                "Submit Fix →"
              )}
            </motion.button>
          </div>
        </>
      )}

      {feedback && (
        <>
          <div className="bg-[#0a0a14] border border-white/5 rounded-xl p-4 mb-4">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">
              Your Answer
            </p>
            <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
              {answer}
            </p>
          </div>
          <AIFeedbackPanel
            feedback={feedback}
            onContinue={() => onComplete(feedback?.score || 0)}
            buttonLabel="Got it — Move to Stage 2 →"
          />
        </>
      )}
    </motion.div>
  );
};

// ─── Stage 2: Twist Card ──────────────────────────────────────────────────────
const Stage2 = ({ onComplete }) => {
  const [twist, setTwist] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const revealTwist = () => {
    const random = TWIST_CARDS[Math.floor(Math.random() * TWIST_CARDS.length)];
    setTwist(random);
    setRevealed(true);
  };

  const handleAccept = () => {
    setAccepted(true);
    setTimeout(() => onComplete(twist), 1200);
  };

  return (
    <motion.div
      key="stage2"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-fuchsia-400 mb-2">
          🎲 Twist Card
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          A random constraint will now be applied to your solution. This is the
          chaos part. Embrace it — your Stage 3 pitch must respect this twist.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-10">
        {!revealed ? (
          <motion.button
            whileHover={{ scale: 1.05, rotate: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={revealTwist}
            className="w-48 h-64 bg-gradient-to-br from-fuchsia-600 to-purple-800 rounded-2xl border border-fuchsia-400/30 shadow-[0_0_30px_rgba(200,0,255,0.3)] flex flex-col items-center justify-center gap-4 cursor-pointer"
          >
            <span className="text-5xl">🃏</span>
            <span className="text-white font-bold text-sm">Reveal Twist</span>
          </motion.button>
        ) : (
          <motion.div
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md bg-[#1a1a22] border border-fuchsia-500/30 rounded-2xl p-8 text-center shadow-[0_0_30px_rgba(200,0,255,0.2)]"
          >
            <span className="text-4xl mb-4 block">🎴</span>
            <p className="text-xs text-fuchsia-400 font-bold uppercase tracking-widest mb-3">
              Your Twist
            </p>
            <p className="text-white text-lg font-semibold leading-relaxed">
              {twist}
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAccept}
              disabled={accepted}
              className="mt-8 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-700 text-white font-semibold rounded-xl text-sm disabled:opacity-60 transition-all cursor-pointer"
            >
              {accepted
                ? "✅ Got it! Loading Stage 3..."
                : "Accept & Continue →"}
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Stage 3: Pitch Wild ──────────────────────────────────────────────────────
const Stage3 = ({ twist, onComplete }) => {
  const [pitch, setPitch] = useState("");
  const [pitchType, setPitchType] = useState("text");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!pitch.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "ai-feedback-edge-function",
        {
          body: {
            scenario: `The user submitted a creative pitch for a glitch fix challenge. Their twist card constraint was: "${twist || "No twist"}". Evaluate their pitch based on creativity, how well they respected the twist constraint, and the quality of their solution presentation.`,
            answer: pitch,
          },
        },
      );
      if (fnError) throw fnError;
      const parsed = typeof fnData === "string" ? JSON.parse(fnData) : fnData;
      setFeedback(parsed);
    } catch (err) {
      console.error("Pitch feedback error:", err);
      setError("Couldn't load AI feedback right now.");
      setTimeout(() => onComplete(pitch, 0), 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="stage3"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-pink-400 mb-2">📣 Pitch Wild</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Present your solution. Remember — your pitch must respect your twist
          card constraint. Be creative, be bold, be you.
        </p>
        {twist && (
          <div className="mt-4 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-lg px-4 py-3 text-sm text-fuchsia-300">
            <span className="font-bold">Your Twist: </span>
            {twist}
          </div>
        )}
        <TwistCardTimer
          twist={twist}
          onTimeUp={() => {
            const btn = document.querySelector("[data-submit-pitch]");
            if (btn) btn.classList.add("animate-pulse");
          }}
        />
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        {["text", "meme", "comic", "video"].map((type) => (
          <button
            key={type}
            onClick={() => setPitchType(type)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all capitalize cursor-pointer
              ${
                pitchType === type
                  ? "bg-pink-500/20 border-pink-500/50 text-pink-300"
                  : "bg-transparent border-white/10 text-gray-500 hover:border-white/20"
              }`}
          >
            {type === "text" && "📝 "}
            {type === "meme" && "😂 "}
            {type === "comic" && "🎨 "}
            {type === "video" && "🎬 "}
            {type}
          </button>
        ))}
      </div>

      {pitchType === "text" || pitchType === "meme" || pitchType === "comic" ? (
        <textarea
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          placeholder={
            pitchType === "text"
              ? "Write your pitch here..."
              : pitchType === "meme"
                ? "Describe your meme or paste a meme link..."
                : "Describe your comic strip concept or paste an image URL..."
          }
          className="w-full h-40 bg-[#0a0a14] border border-pink-500/20 rounded-xl p-4 text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-pink-500 outline-none transition resize-none text-sm"
        />
      ) : (
        <input
          type="text"
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          placeholder="Paste your video URL (YouTube, Loom, etc.)..."
          className="w-full bg-[#0a0a14] border border-pink-500/20 rounded-xl p-4 text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-pink-500 outline-none transition text-sm"
        />
      )}

      {!feedback && (
        <div className="flex justify-end mt-4">
          <motion.button
            whileHover={!loading && pitch.trim() ? { scale: 1.04 } : {}}
            whileTap={!loading && pitch.trim() ? { scale: 0.97 } : {}}
            data-submit-pitch
            onClick={handleSubmit}
            disabled={loading || !pitch.trim()}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-semibold rounded-xl text-sm disabled:opacity-60 transition-all cursor-pointer flex items-center gap-2"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.8,
                    ease: "linear",
                  }}
                  className="w-4 h-4 border-2 border-t-transparent border-white rounded-full"
                />
                Analyzing your pitch…
              </>
            ) : (
              "Submit Pitch 🚀"
            )}
          </motion.button>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

      {feedback && (
        <>
          <div className="bg-[#0a0a14] border border-white/5 rounded-xl p-4 mb-4 mt-4">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">
              Your Pitch
            </p>
            <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
              {pitch}
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-2"
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                style={{
                  background: "rgba(236,72,153,0.1)",
                  border: "1px solid rgba(236,72,153,0.25)",
                }}
              >
                🤖
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-pink-400">
                AI Pitch Feedback
              </p>
              <div
                className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: "rgba(236,72,153,0.1)",
                  color: "#ec4899",
                  border: "1px solid rgba(236,72,153,0.2)",
                }}
              >
                Powered by Claude
              </div>
            </div>

            <div
              className="flex items-center justify-between p-3 rounded-xl mb-4"
              style={{
                background: getVerdict(feedback?.score).passed
                  ? "rgba(34,197,94,0.08)"
                  : "rgba(239,68,68,0.08)",
                border: `1px solid ${
                  getVerdict(feedback?.score).passed
                    ? "rgba(34,197,94,0.25)"
                    : "rgba(239,68,68,0.25)"
                }`,
              }}
            >
              <div className="flex items-center gap-2">
                {getVerdict(feedback?.score).passed ? (
                  <FaCheckCircle className="text-green-400" size={14} />
                ) : (
                  <FiAlertTriangle className="text-red-400" size={14} />
                )}
                <span
                  className={`text-sm font-bold ${
                    getVerdict(feedback?.score).passed
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {getVerdict(feedback?.score).label}
                </span>
              </div>
              {typeof feedback?.score === "number" && (
                <span
                  className="text-sm font-black"
                  style={{
                    color: getVerdict(feedback?.score).passed
                      ? "#22c55e"
                      : "#ef4444",
                  }}
                >
                  {feedback.score}/10
                </span>
              )}
            </div>

            <div className="space-y-3 mb-5">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl p-4"
                style={{
                  background: "rgba(34,197,94,0.06)",
                  border: "1px solid rgba(34,197,94,0.2)",
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <FiZap size={12} className="text-green-400" />
                  <p className="text-xs font-bold text-green-400 uppercase tracking-wider">
                    What You Got Right
                  </p>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {feedback.strength}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl p-4"
                style={{
                  background: "rgba(234,179,8,0.06)",
                  border: "1px solid rgba(234,179,8,0.2)",
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <FiAlertTriangle size={12} className="text-yellow-400" />
                  <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                    What Was Missed
                  </p>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {feedback.gap}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl p-4"
                style={{
                  background: "rgba(236,72,153,0.06)",
                  border: "1px solid rgba(236,72,153,0.2)",
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <FiTrendingUp size={12} className="text-pink-400" />
                  <p className="text-xs font-bold text-pink-400 uppercase tracking-wider">
                    How to Level It Up
                  </p>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {feedback.suggestion}
                </p>
              </motion.div>
            </div>

            {feedback.score && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-3 mb-5 p-3 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span className="text-gray-500 text-xs uppercase tracking-widest font-semibold">
                  Pitch Score
                </span>
                <span
                  className="text-2xl font-black"
                  style={{
                    background: "linear-gradient(90deg,#ec4899,#FF00C8)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {feedback.score}/10
                </span>
                <div className="flex-1 max-w-[120px] h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(feedback.score / 10) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg,#ec4899,#FF00C8)",
                    }}
                  />
                </div>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onComplete(pitch, feedback?.score || 0)}
              className="w-full py-3 rounded-xl font-bold text-sm text-white cursor-pointer"
              style={{ background: "linear-gradient(90deg,#ec4899,#FF00C8)" }}
            >
              🎉 Complete the Arena!
            </motion.button>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

// ─── Completed Screen ─────────────────────────────────────────────────────────
const CompletedScreen = ({ navigate, totalScore, arenaXP }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-16"
  >
    <div className="text-6xl mb-6">🏆</div>
    <h2 className="text-3xl font-black text-white mb-3">
      You Survived the Arena!
    </h2>
    <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed mb-4">
      You fixed the glitch, survived the twist, and pitched your solution. Your
      entry has been recorded. Now you can see how others solved the same
      challenge!
    </p>

    {arenaXP > 0 && (
      <div
        className="flex items-center justify-center gap-3 mb-4 p-3 rounded-xl max-w-xs mx-auto"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span className="text-gray-500 text-xs uppercase tracking-widest font-semibold">
          gBits Earned
        </span>
        <span
          className="text-2xl font-black"
          style={{
            background: "linear-gradient(90deg,#00F0FF,#FF00C8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          +{arenaXP}
        </span>
      </div>
    )}

    {totalScore > 0 && (
      <div
        className="flex items-center justify-center gap-3 mb-4 p-3 rounded-xl max-w-xs mx-auto"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span className="text-gray-500 text-xs uppercase tracking-widest font-semibold">
          Total Score
        </span>
        <span
          className="text-2xl font-black"
          style={{
            background: "linear-gradient(90deg,#00F0FF,#FF00C8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {totalScore}/20
        </span>
      </div>
    )}

    {/* Highlight: go see other submissions */}
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-8 mx-auto max-w-sm p-4 rounded-2xl"
      style={{
        background: "rgba(0,240,255,0.06)",
        border: "1px solid rgba(0,240,255,0.2)",
      }}
    >
      <p className="text-cyan-300 text-sm font-semibold mb-1">
        🧠 See how others approached it
      </p>
      <p className="text-gray-400 text-xs leading-relaxed">
        You've unlocked the community submissions for this challenge. See
        different approaches and react with emojis!
      </p>
    </motion.div>

    <div className="flex gap-4 justify-center flex-wrap">
      <motion.button
        whileHover={{ scale: 1.05 }}
        onClick={() => navigate("/arena-voting")}
        className="px-6 py-3 font-bold text-sm text-white bg-[#FF00C8] hover:bg-[#e000b0] rounded-xl cursor-pointer shadow-[0_0_15px_rgba(255,0,200,0.3)] transition-all"
      >
        🗳️ See Community Pitches
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        onClick={() => navigate("/arena-events")}
        className="px-6 py-3 bg-[#1a1a22] border border-white/10 text-white font-semibold rounded-xl text-sm cursor-pointer"
      >
        Try Another Event
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        onClick={() => navigate("/terminal-wall")}
        className="px-6 py-3 bg-[#1a1a22] border border-white/10 text-white font-semibold rounded-xl text-sm cursor-pointer"
      >
        Terminal Wall 🏅
      </motion.button>
    </div>
  </motion.div>
);

// ─── Previously Completed Screen ──────────────────────────────────────────────
const PreviouslyCompletedScreen = ({
  event,
  completedAt,
  onRetry,
  navigate,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className="text-center py-12"
  >
    <motion.div
      animate={{ rotate: [0, -5, 5, -5, 0] }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="text-6xl mb-5"
    >
      🏆
    </motion.div>

    <div
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
      style={{
        background: "rgba(34,197,94,0.1)",
        border: "1px solid rgba(34,197,94,0.3)",
        color: "#22c55e",
      }}
    >
      ✓ Already Completed
    </div>

    <h2 className="text-3xl font-black text-white mb-2">
      You've done this one!
    </h2>
    <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed mb-2">
      You already completed{" "}
      <span className="text-white font-semibold">{event?.title}</span>.
    </p>
    {completedAt && (
      <p className="text-gray-600 text-xs mb-6">
        Completed on{" "}
        {new Date(completedAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
    )}

    <div className="h-px bg-white/5 mb-6 mx-auto max-w-xs" />

    <div className="flex flex-col gap-3 items-center">
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/arena-voting")}
        className="w-full max-w-xs py-3 rounded-xl font-bold text-sm text-black cursor-pointer"
        style={{ background: "linear-gradient(90deg,#00F0FF,#FF00C8)" }}
      >
        🗳️ See Community Pitches
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onRetry}
        className="w-full max-w-xs py-3 rounded-xl font-bold text-sm cursor-pointer"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#9ca3af",
        }}
      >
        🔁 Try Again
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/arena-events")}
        className="w-full max-w-xs py-3 rounded-xl font-bold text-sm cursor-pointer"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#9ca3af",
        }}
      >
        Try Another Event
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/hall-of-fame")}
        className="w-full max-w-xs py-3 rounded-xl font-bold text-sm cursor-pointer"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#9ca3af",
        }}
      >
        Hall of Fame 🏅
      </motion.button>
    </div>
  </motion.div>
);

const isUUID = (str) =>
  typeof str === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const getFallbackEvent = (id) => {
  const formattedTitle = id
    ? id
        .replace(/^featured-/, "Arena Glitch ")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())
    : "Arena Glitch Showdown";

  return {
    id: id || "featured-1",
    title: formattedTitle,
    description: "Survive all 3 stages of this Glitch Room Arena Challenge.",
    glitch_scenario: `A critical logic bug has been detected in component module [${id}]. Inspect the state dependencies, find the race condition, and pitch a bulletproof fix.`,
    skills: ["React", "State Management", "Logic Debugging"],
    reward: "100 gBits",
    reward_xp: 100,
    difficulty: "Medium",
  };
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ArenaChallenge = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState(1);
  const [twist, setTwist] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [previouslyCompleted, setPreviouslyCompleted] = useState(false);
  const [completedAt, setCompletedAt] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [stage1Score, setStage1Score] = useState(0);
  const [stage3Score, setStage3Score] = useState(0);
  const [earnedArenaXP, setEarnedArenaXP] = useState(0);

  useEffect(() => {
    const fetchEvent = async () => {
      // 1. Check featured dataset
      const featured = getFeaturedArenaEvent(eventId);
      if (featured) {
        setEvent(featured);
      } else if (isUUID(eventId)) {
        // 2. Query Supabase if valid UUID format
        const { data, error } = await supabase
          .from("arena_events")
          .select("*")
          .eq("id", eventId)
          .maybeSingle();
        if (!error && data) {
          setEvent(data);
        } else {
          setEvent(getFallbackEvent(eventId));
        }
      } else {
        // 3. Fallback dynamic event for custom slug IDs
        setEvent(getFallbackEvent(eventId));
      }

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (userId && isUUID(eventId)) {
        const { data: completion } = await supabase
          .from("arena_completions")
          .select("*")
          .eq("event_id", eventId)
          .eq("user_id", userId)
          .maybeSingle();
        if (completion) {
          setPreviouslyCompleted(true);
          setCompletedAt(completion.completed_at);
        }
      }
      setLoading(false);
    };
    fetchEvent();
  }, [eventId]);

  const handleStage1Complete = (score = 0) => {
    setStage1Score(score);
    setCurrentStage(2);
  };

  const handleStage2Complete = (selectedTwist) => {
    setTwist(selectedTwist);
    setCurrentStage(3);
  };

  const handleStage3Complete = async (pitchText = "", score = 0) => {
    setStage3Score(score);
    setCompleted(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 6000);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (userId) {
      const totalScore = stage1Score + score;

      if (isUUID(eventId)) {
        try {
          await supabase.from("arena_completions").upsert(
            {
              user_id: userId,
              event_id: eventId,
              completed_at: new Date().toISOString(),
              completed_date: new Date().toISOString().split("T")[0],
              score: totalScore,
              pitch_text: pitchText.trim() || null,
            },
            { onConflict: "user_id,event_id" },
          );
        } catch (e) {
          console.warn("DB completion save warning:", e);
        }
      }

      const stage1XP = pointsForScore(stage1Score, STAGE_MAX_XP);
      const stage3XP = pointsForScore(score, STAGE_MAX_XP);
      const arenaXP = stage1XP + stage3XP;
      setEarnedArenaXP(arenaXP);
      if (arenaXP > 0) {
        await updatePoints(
          arenaXP,
          `Arena: ${event?.title || "Challenge"}`,
          "arena",
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080810] text-white">
        <div className="w-10 h-10 border-4 border-t-transparent border-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080810] text-white">
        <p className="text-gray-400">Event not found.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#080810] text-white flex flex-col overflow-hidden">
      {showConfetti && <Confetti />}
      <GlitchBackground />
      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

        <section className="max-w-3xl mx-auto w-full px-6 py-24 mt-10 flex-1">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <span className="text-xs text-gray-500 uppercase tracking-widest">
              Arena Challenge
            </span>
            <h1 className="text-3xl font-black text-white mt-1">
              {event.title}
            </h1>
          </motion.div>

          {!completed && !previouslyCompleted && (
            <StageProgress currentStage={currentStage} />
          )}

          <div className="bg-[#0f0f1a] border border-white/5 rounded-3xl p-8 shadow-xl">
            <AnimatePresence mode="wait">
              {previouslyCompleted && !retrying ? (
                <PreviouslyCompletedScreen
                  key="prev"
                  event={event}
                  completedAt={completedAt}
                  onRetry={() => setRetrying(true)}
                  navigate={navigate}
                />
              ) : completed ? (
                <CompletedScreen
                  key="done"
                  navigate={navigate}
                  totalScore={stage1Score + stage3Score}
                  arenaXP={earnedArenaXP}
                />
              ) : currentStage === 1 ? (
                <Stage1
                  key="s1"
                  event={event}
                  onComplete={handleStage1Complete}
                />
              ) : currentStage === 2 ? (
                <Stage2 key="s2" onComplete={handleStage2Complete} />
              ) : (
                <Stage3
                  key="s3"
                  twist={twist}
                  onComplete={handleStage3Complete}
                />
              )}
            </AnimatePresence>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default ArenaChallenge;
