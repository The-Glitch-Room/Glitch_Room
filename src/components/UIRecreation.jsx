import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import { supabase } from "../supabaseClient";
import { updatePoints, fetchPoints } from "../utils/pointsHelper";
import { checkAndAwardBadges } from "../utils/badgeEngine";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PageHeading from "./PageHeading";
import {
  Eye,
  Code2,
  Layers,
  Zap,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  ExternalLink,
  Maximize2,
  X,
  Star,
  Smartphone,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";

const CHALLENGES = [
  {
    id: "ui-1",
    title: "Netflix-Style Hero Card",
    category: "Streaming UI",
    difficulty: "Beginner",
    diffColor: {
      text: "text-green-400",
      bg: "bg-green-500/10",
      dot: "bg-green-400",
    },
    points: 30,
    timeLimit: 600,
    description:
      "Recreate a Netflix-style movie/show hero card with a thumbnail, title, rating badge, genre tags, and a 'Watch Now' button.",
    targetImage:
      "https://placehold.co/800x450/141414/E50914?text=Netflix+Hero+Card&font=montserrat",
    requirements: [
      "Dark background (#141414 or similar)",
      "Large thumbnail/poster area",
      "Show title in bold white typography",
      "Rating badge (e.g. 98% Match)",
      "Genre pills / tags",
      "Watch Now button in Netflix red",
      "Responsive layout",
    ],
    skills: ["CSS Layout", "Typography", "Color Theory"],
    tip: "Focus on the hierarchy — thumbnail first, then text, then CTAs.",
  },
  {
    id: "ui-2",
    title: "Spotify Now Playing Widget",
    category: "Music Player UI",
    difficulty: "Intermediate",
    diffColor: {
      text: "text-yellow-400",
      bg: "bg-yellow-500/10",
      dot: "bg-yellow-400",
    },
    points: 50,
    timeLimit: 600,
    description:
      "Build a Spotify-style 'Now Playing' widget with album art, song info, a progress bar, and playback controls.",
    targetImage:
      "https://placehold.co/800x450/121212/1DB954?text=Spotify+Now+Playing&font=montserrat",
    requirements: [
      "Dark card background (#121212)",
      "Album artwork (square, rounded corners)",
      "Track name + artist name",
      "Progress/seek bar with green fill",
      "Play/Pause, Next, Previous buttons",
      "Like/heart button",
      "Volume slider or icon",
    ],
    skills: ["CSS Flexbox", "SVG Icons", "Micro-interactions"],
    tip: "The progress bar is the hardest part — make it feel smooth and draggable.",
  },
  {
    id: "ui-3",
    title: "Analytics Dashboard Card",
    category: "Dashboard UI",
    difficulty: "Intermediate",
    diffColor: {
      text: "text-yellow-400",
      bg: "bg-yellow-500/10",
      dot: "bg-yellow-400",
    },
    points: 50,
    timeLimit: 600,
    description:
      "Recreate a modern analytics stat card with a metric, trend indicator, sparkline chart, and comparison to last period.",
    targetImage:
      "https://placehold.co/800x450/0F172A/6366F1?text=Analytics+Dashboard+Card&font=montserrat",
    requirements: [
      "Dark card with subtle border",
      "Large metric number (e.g. $48,295)",
      "Trend badge (↑ 12.5% from last month)",
      "Sparkline/mini chart",
      "Period selector tabs (7D / 30D / 90D)",
      "Clean sans-serif typography",
    ],
    skills: ["Data Visualization", "CSS Grid", "Charts"],
    tip: "The sparkline is a bonus — even a fake SVG path will score well.",
  },
  {
    id: "ui-4",
    title: "Mobile App Login Screen",
    category: "Mobile UI",
    difficulty: "Beginner",
    diffColor: {
      text: "text-green-400",
      bg: "bg-green-500/10",
      dot: "bg-green-400",
    },
    points: 30,
    timeLimit: 600,
    description:
      "Create a modern mobile login screen with email/password fields, a sign-in button, social login options, and a 'forgot password' link.",
    targetImage:
      "https://placehold.co/400x800/0A0A0A/FFFFFF?text=Login+Screen&font=montserrat",
    requirements: [
      "Centered layout (375px mobile width)",
      "App logo/brand at top",
      "Email + Password input fields",
      "Primary CTA button (Sign In)",
      "Social login row (Google, Apple, etc.)",
      "Forgot password link",
      "Sign up link at bottom",
    ],
    skills: ["Mobile Layout", "Form Design", "Spacing"],
    tip: "Mobile-first: think 375px wide. Padding and spacing matter most here.",
  },
  {
    id: "ui-5",
    title: "E-commerce Product Card",
    category: "E-commerce UI",
    difficulty: "Beginner",
    diffColor: {
      text: "text-green-400",
      bg: "bg-green-500/10",
      dot: "bg-green-400",
    },
    points: 30,
    timeLimit: 600,
    description:
      "Build a product card with image, title, price, discount badge, star rating, and an Add to Cart button.",
    targetImage:
      "https://placehold.co/800x450/FFFFFF/1a1a1a?text=Product+Card&font=montserrat",
    requirements: [
      "Product image area",
      "Product title (2 lines max)",
      "Price + strikethrough original price",
      "Discount percentage badge",
      "Star rating (out of 5) + review count",
      "Add to Cart button",
      "Wishlist/heart icon",
    ],
    skills: ["Card Design", "Badge Styling", "CTA Design"],
    tip: "The discount badge placement is key — top-left of the image works best.",
  },
  {
    id: "ui-6",
    title: "SaaS Pricing Table",
    category: "SaaS UI",
    difficulty: "Hard",
    diffColor: { text: "text-red-400", bg: "bg-red-500/10", dot: "bg-red-400" },
    points: 80,
    timeLimit: 600,
    description:
      "Build a 3-tier pricing table (Free / Pro / Enterprise) with feature lists, a highlighted recommended plan, and CTA buttons.",
    targetImage:
      "https://placehold.co/800x450/0F0F0F/a855f7?text=Pricing+Table&font=montserrat",
    requirements: [
      "3 plan cards side by side",
      "Plan name, price, billing period",
      "Feature checklist per plan",
      "Highlighted/featured middle plan",
      "'Most Popular' badge",
      "CTA buttons per plan",
      "Toggle for monthly/annual billing",
    ],
    skills: ["Grid Layout", "Visual Hierarchy", "Feature Comparison"],
    tip: "The 'featured' plan should visually pop — use a border, scale, or background difference.",
  },
];

const SUBMISSION_TYPES = [
  {
    id: "code",
    label: "Code Snippet",
    icon: Code2,
    desc: "Paste your HTML/CSS/JSX",
  },
  {
    id: "url",
    label: "Live URL",
    icon: ExternalLink,
    desc: "Link to CodePen, StackBlitz...",
  },
  {
    id: "explain",
    label: "Approach",
    icon: Layers,
    desc: "Describe your solution in detail",
  },
];

// ── helpers ───────────────────────────────────────────────────────────────────
async function getUIScore(challenge, submission, submissionType) {
  const scenario = `You are scoring a UI Recreation challenge. The challenge was: "${challenge.title}" — ${challenge.description}.
Requirements: ${challenge.requirements.join(", ")}.
The user submitted their solution as: ${submissionType === "code" ? "code" : submissionType === "url" ? "a live URL" : "a written approach"}.
Evaluate on: 1) How well they addressed requirements, 2) Creativity and attention to detail, 3) Technical quality. Give specific constructive feedback.`;
  try {
    const { data, error } = await supabase.functions.invoke(
      "ai-feedback-edge-function",
      { body: { scenario, answer: submission } },
    );
    if (error) throw error;
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch {
    return null;
  }
}

async function fetchCompletedIds(userId) {
  if (!userId) return new Set();
  const { data } = await supabase
    .from("challenge_completions")
    .select("challenge_id")
    .eq("user_id", userId)
    .eq("challenge_type", "ui_recreation");
  return new Set((data || []).map((r) => r.challenge_id));
}

async function saveCompletion(userId, challengeId, score, pointsEarned) {
  if (!userId) return;
  await supabase.from("challenge_completions").upsert(
    {
      user_id: userId,
      challenge_type: "ui_recreation",
      challenge_id: challengeId,
      score,
      points_earned: pointsEarned,
    },
    { onConflict: "user_id,challenge_type,challenge_id" },
  );
}

// ── Timer ─────────────────────────────────────────────────────────────────────
const TimerDisplay = ({ timeLeft }) => {
  const mins = Math.floor(timeLeft / 60);
  const secs = String(timeLeft % 60).padStart(2, "0");
  const color =
    timeLeft > 300 ? "#22c55e" : timeLeft > 60 ? "#f59e0b" : "#ef4444";
  const urgent = timeLeft <= 60;
  return (
    <motion.div
      animate={urgent ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.6, repeat: urgent ? Infinity : 0 }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
      style={{ background: `${color}10`, border: `1px solid ${color}30` }}
    >
      <Zap size={12} style={{ color }} />
      <span className="text-sm font-black font-mono" style={{ color }}>
        {mins}:{secs}
      </span>
    </motion.div>
  );
};

// ── Challenge Card (grid) ─────────────────────────────────────────────────────
const ChallengeCard = ({ challenge, index, onStart, completed }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.06 }}
    whileHover={{ scale: 1.02 }}
    onClick={() => onStart(challenge)}
    className="group relative bg-[#0f0f1a] border border-white/6 hover:border-[#FF00C8]/25 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,200,0.08)] overflow-hidden cursor-pointer"
  >
    <div className="absolute top-0 left-0 h-[2px] w-0 group-hover:w-full bg-gradient-to-r from-[#FF00C8] to-[#a855f7] transition-all duration-500 rounded-t-2xl" />

    {/* Target image preview */}
    <div className="relative w-full h-36 rounded-xl overflow-hidden bg-[#08080f] border border-white/5">
      <img
        src={challenge.targetImage}
        alt={challenge.title}
        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-transparent to-transparent" />
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <Eye size={11} className="text-gray-400" />
        <span className="text-[10px] text-gray-400 font-semibold">
          Target UI
        </span>
      </div>

      {/* ── SOLVED FLAG ── */}
      {completed && (
        <div
          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm"
          style={{
            background: "rgba(34,197,94,0.25)",
            border: "1px solid rgba(34,197,94,0.4)",
          }}
        >
          <CheckCircle size={11} className="text-green-400" />
          <span className="text-[10px] text-green-400 font-black uppercase tracking-wider">
            Solved
          </span>
        </div>
      )}
    </div>

    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
          {challenge.category}
        </span>
        <span
          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${challenge.diffColor.text} ${challenge.diffColor.bg}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${challenge.diffColor.dot}`}
          />
          {challenge.difficulty}
        </span>
      </div>
      <h3 className="text-sm font-bold text-white group-hover:text-[#FF00C8] transition-colors">
        {challenge.title}
      </h3>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
        {challenge.description}
      </p>
    </div>

    <div className="flex items-center justify-between mt-auto">
      <div className="flex gap-1 flex-wrap">
        {challenge.skills.slice(0, 2).map((s) => (
          <span
            key={s}
            className="text-[10px] text-gray-600 bg-white/4 px-1.5 py-0.5 rounded-md"
          >
            {s}
          </span>
        ))}
      </div>
      <span
        className="text-xs font-black px-2 py-0.5 rounded-full"
        style={{
          background: "rgba(255,0,200,0.1)",
          border: "1px solid rgba(255,0,200,0.2)",
          color: "#FF00C8",
        }}
      >
        {completed ? "✓ Done" : `+${challenge.points} pts`}
      </span>
    </div>
  </motion.div>
);

// ── Lightbox ──────────────────────────────────────────────────────────────────
const Lightbox = ({ src, title, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0.9 }}
      className="relative max-w-4xl w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute -top-10 right-0 text-gray-400 hover:text-white transition cursor-pointer"
      >
        <X size={22} />
      </button>
      <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">
        {title} — Target UI
      </p>
      <img
        src={src}
        alt={title}
        className="w-full rounded-2xl border border-white/10"
      />
    </motion.div>
  </motion.div>
);

// ── Active Challenge ──────────────────────────────────────────────────────────
const ActiveChallenge = ({
  challenge,
  onBack,
  onComplete,
  alreadyCompleted,
}) => {
  const [timeLeft, setTimeLeft] = useState(challenge.timeLimit);
  const [timerActive, setTimerActive] = useState(true);
  const [submissionType, setSubmissionType] = useState("code");
  const [submission, setSubmission] = useState("");
  const [scoring, setScoring] = useState(false);
  const [result, setResult] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!timerActive || result) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, result]);

  const handleSubmit = async () => {
    if (!submission.trim()) return;
    setTimerActive(false);
    setScoring(true);
    const feedback = await getUIScore(challenge, submission, submissionType);
    setScoring(false);
    setResult(feedback);
    if (feedback) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  };

  const finalScore = Math.min(10, result?.score || 0);

  return (
    <div className="max-w-5xl mx-auto px-6 pb-24 w-full">
      {showConfetti && <Confetti numberOfPieces={150} recycle={false} />}

      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition cursor-pointer"
        >
          <ChevronLeft size={15} /> All Challenges
        </button>
        <div className="flex items-center gap-3">
          {alreadyCompleted && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.25)",
                color: "#22c55e",
              }}
            >
              <CheckCircle size={11} /> Already Solved — no XP
            </div>
          )}
          {!result && <TimerDisplay timeLeft={timeLeft} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — target + requirements */}
        <div className="space-y-4">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: "1px solid rgba(255,0,200,0.15)",
              background: "#08080f",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Eye size={13} className="text-[#FF00C8]" />
                <span className="text-xs font-bold text-[#FF00C8] uppercase tracking-widest">
                  Target UI
                </span>
              </div>
              <button
                onClick={() => setShowLightbox(true)}
                className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-white transition cursor-pointer"
              >
                <Maximize2 size={11} /> Fullscreen
              </button>
            </div>
            <div className="p-3">
              <img
                src={challenge.targetImage}
                alt={challenge.title}
                className="w-full rounded-xl border border-white/5"
                onError={(e) => {
                  e.target.src =
                    "https://placehold.co/800x450/111/FF00C8?text=Target+UI";
                }}
              />
            </div>
          </div>

          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(255,0,200,0.04)",
              border: "1px solid rgba(255,0,200,0.12)",
            }}
          >
            <p className="text-xs font-bold text-[#FF00C8] uppercase tracking-widest mb-3">
              Requirements
            </p>
            <div className="space-y-2">
              {challenge.requirements.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#FF00C8] text-xs mt-0.5 shrink-0">
                    •
                  </span>
                  <p className="text-xs text-gray-400 leading-relaxed">{r}</p>
                </div>
              ))}
            </div>
            {challenge.tip && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-xs text-yellow-400">
                  <span className="font-bold">💡 Tip:</span> {challenge.tip}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — submission or result */}
        <div>
          {!result ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Submit As
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {SUBMISSION_TYPES.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setSubmissionType(id)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer text-center"
                      style={{
                        background:
                          submissionType === id
                            ? "rgba(255,0,200,0.1)"
                            : "rgba(255,255,255,0.03)",
                        borderColor:
                          submissionType === id
                            ? "rgba(255,0,200,0.4)"
                            : "rgba(255,255,255,0.07)",
                        color: submissionType === id ? "#FF00C8" : "#6b7280",
                      }}
                    >
                      <Icon size={14} />
                      <span className="text-[10px] font-bold">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {submissionType === "code" ? (
                <textarea
                  value={submission}
                  onChange={(e) => setSubmission(e.target.value)}
                  rows={12}
                  placeholder={
                    '<!-- Paste your HTML/CSS/JSX here -->\n<div class="card">\n  ...\n</div>'
                  }
                  className="w-full bg-[#080810] border border-white/8 rounded-xl px-4 py-3 text-green-300 text-xs placeholder-gray-700 focus:outline-none focus:border-[#FF00C8]/40 font-mono resize-none transition"
                />
              ) : submissionType === "url" ? (
                <div className="space-y-3">
                  <input
                    type="url"
                    value={submission}
                    onChange={(e) => setSubmission(e.target.value)}
                    placeholder="https://codepen.io/your-pen or https://stackblitz.com/..."
                    className="w-full bg-[#08080f] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-[#FF00C8]/40 transition"
                  />
                  <p className="text-xs text-gray-600">
                    Works with CodePen, StackBlitz, JSFiddle, Replit, or any
                    public URL.
                  </p>
                </div>
              ) : (
                <textarea
                  value={submission}
                  onChange={(e) => setSubmission(e.target.value)}
                  rows={12}
                  placeholder={
                    "Describe your approach:\n- What layout system?\n- How did you handle colors?\n- What challenges did you face?\n- What would you improve?"
                  }
                  className="w-full bg-[#08080f] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-[#FF00C8]/40 resize-none transition"
                />
              )}

              {timeLeft === 0 && (
                <div
                  className="flex items-center gap-2 p-3 rounded-xl"
                  style={{
                    background: "rgba(239,68,68,0.07)",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  <AlertTriangle size={13} className="text-red-400 shrink-0" />
                  <p className="text-xs text-red-300">
                    Time's up — submit what you have for partial credit.
                  </p>
                </div>
              )}

              <motion.button
                whileHover={
                  submission.trim() && !scoring ? { scale: 1.02 } : {}
                }
                whileTap={submission.trim() && !scoring ? { scale: 0.97 } : {}}
                onClick={handleSubmit}
                disabled={!submission.trim() || scoring}
                className="w-full py-3.5 rounded-2xl font-black text-sm text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(90deg,#FF00C8,#a855f7)",
                  boxShadow: submission.trim()
                    ? "0 0 20px rgba(255,0,200,0.3)"
                    : "none",
                }}
              >
                {scoring ? (
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
                    AI is scoring your UI...
                  </>
                ) : (
                  <>
                    <Eye size={15} /> Submit for AI Review
                  </>
                )}
              </motion.button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Score */}
              <div
                className="relative overflow-hidden rounded-2xl p-6 text-center"
                style={{
                  background:
                    "linear-gradient(135deg,rgba(255,0,200,0.1),rgba(168,85,247,0.08))",
                  border: "1px solid rgba(255,0,200,0.25)",
                }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{
                    background:
                      "linear-gradient(90deg,#FF00C8,#a855f7,#00F0FF)",
                  }}
                />
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Pixel Score
                </p>
                <p
                  className="text-6xl font-black mb-2"
                  style={{
                    background: "linear-gradient(90deg,#FF00C8,#a855f7)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {finalScore}/10
                </p>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden mx-auto max-w-[200px] mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(finalScore / 10) * 100}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                    className="h-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg,#FF00C8,#a855f7)",
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {alreadyCompleted
                    ? "⚠️ Already solved — no XP awarded again"
                    : `+${challenge.points} XP awarded`}
                </p>
              </div>

              {/* Feedback */}
              {[
                {
                  label: "What You Nailed",
                  text: result?.strength,
                  color: "#22c55e",
                  icon: "✅",
                },
                {
                  label: "What Was Missed",
                  text: result?.gap,
                  color: "#f59e0b",
                  icon: "⚠️",
                },
                {
                  label: "Level Up Your UI",
                  text: result?.suggestion,
                  color: "#FF00C8",
                  icon: "🚀",
                },
              ].map(({ label, text, color, icon }) => (
                <div
                  key={label}
                  className="rounded-2xl p-4"
                  style={{
                    background: `${color}0D`,
                    border: `1px solid ${color}30`,
                  }}
                >
                  <p
                    className="text-xs font-bold uppercase tracking-wider mb-1.5"
                    style={{ color }}
                  >
                    {icon} {label}
                  </p>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {text || "—"}
                  </p>
                </div>
              ))}

              <div className="flex gap-3">
                <button
                  onClick={onBack}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold cursor-pointer"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#9ca3af",
                  }}
                >
                  Try Another
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onComplete(challenge, finalScore)}
                  className="flex-1 py-3 rounded-2xl text-sm font-black text-white cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(90deg,#FF00C8,#a855f7)",
                  }}
                >
                  <CheckCircle size={14} /> Done <ChevronRight size={14} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showLightbox && (
          <Lightbox
            src={challenge.targetImage}
            title={challenge.title}
            onClose={() => setShowLightbox(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const UIRecreation = () => {
  const navigate = useNavigate();
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [userId, setUserId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const init = async () => {
      const { data: au } = await supabase.auth.getUser();
      const uid = au?.user?.id;
      setUserId(uid);
      if (uid) {
        const ids = await fetchCompletedIds(uid);
        setCompletedIds(ids);
      }
      const pts = await fetchPoints();
      setPoints(pts);
      setLoading(false);
    };
    init();
  }, []);

  const handleComplete = async (challenge, score) => {
    const alreadyDone = completedIds.has(challenge.id);
    if (userId && !alreadyDone) {
      const next = await updatePoints(
        challenge.points,
        `UI Recreation: ${challenge.title}`,
        "spark",
      );
      setPoints(next);
      await saveCompletion(userId, challenge.id, score, challenge.points);
      await checkAndAwardBadges(userId);
      setCompletedIds((prev) => new Set([...prev, challenge.id]));
    }
    setActiveChallenge(null);
  };

  const difficulties = ["All", "Beginner", "Intermediate", "Hard"];
  const filtered =
    filter === "All"
      ? CHALLENGES
      : CHALLENGES.filter((c) => c.difficulty === filter);

  if (activeChallenge) {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex flex-col">
        <Navbar />
        <div className="pt-32 flex-1">
          <ActiveChallenge
            challenge={activeChallenge}
            onBack={() => setActiveChallenge(null)}
            onComplete={handleComplete}
            alreadyCompleted={completedIds.has(activeChallenge.id)}
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col">
      <Navbar />

      <section className="relative pt-40 pb-16 px-6 overflow-hidden">
        <button
          onClick={() => navigate("/explore")}
          className="absolute top-24 left-6 md:left-10 z-20 flex items-center gap-2 text-gray-500 hover:text-white text-sm font-medium transition cursor-pointer"
        >
          <ArrowLeft size={15} /> Back to Explore
        </button>

        <div
          className="absolute top-24 right-6 md:right-10 z-20 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{
            color: "#FF00C8",
            background: "rgba(255,0,200,0.1)",
            border: "1px solid rgba(255,0,200,0.3)",
          }}
        >
          <Zap size={13} /> {points} pts
        </div>

        <div
          className="absolute inset-0 z-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,0,200,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,200,0.2) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] rounded-full blur-3xl opacity-10 z-0"
          style={{ background: "radial-gradient(ellipse,#FF00C8,transparent)" }}
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          <PageHeading
            eyebrow="📱 Pixel Clone Challenges"
            title="UI Recreation"
            subtitle="See a target UI. Build it from scratch. AI scores your accuracy, creativity, and code quality."
            accent="pink"
            size="xl"
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {[
              { icon: Eye, label: "Study the target" },
              { icon: Code2, label: "Build your version" },
              { icon: Zap, label: "AI scores it" },
            ].map(({ icon: Icon, label }, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-gray-500 bg-white/4 px-3 py-1.5 rounded-full border border-white/6"
              >
                <Icon size={11} className="text-[#FF00C8]" /> {label}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="flex items-center justify-between gap-4 px-6 md:px-16 mb-8 flex-wrap">
        <div className="flex gap-2">
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className="px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer"
              style={{
                background:
                  filter === d
                    ? "rgba(255,0,200,0.12)"
                    : "rgba(255,255,255,0.03)",
                borderColor:
                  filter === d
                    ? "rgba(255,0,200,0.4)"
                    : "rgba(255,255,255,0.07)",
                color: filter === d ? "#FF00C8" : "#6b7280",
              }}
            >
              {d}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-[#FF00C8]">
            {filtered.length}
          </span>{" "}
          challenges ·{" "}
          <span className="font-semibold text-green-400">
            {completedIds.size}
          </span>{" "}
          solved
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 px-6 md:px-16 pb-24">
        {filtered.map((challenge, i) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            index={i}
            onStart={setActiveChallenge}
            completed={completedIds.has(challenge.id)}
          />
        ))}
      </div>

      <Footer />
    </div>
  );
};

export default UIRecreation;
