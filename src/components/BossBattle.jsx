import { GBitIcon } from "./GBitIcon";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import { supabase } from "../supabaseClient";
import { updatePoints, fetchPoints } from "../utils/pointsHelper";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PageHeading from "./PageHeading";
import {
  Skull,
  Zap,
  Bug,
  Brain,
  Sparkles,
  Shield,
  Trophy,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Timer,
  Flame,
  Star,
  ArrowLeft,
} from "lucide-react";

// ── Boss config ────────────────────────────────────────────────────────────────
const BOSS = {
  name: "SYSTEM OVERRIDE",
  subtitle: "The Final Glitch",
  hp: 100,
  description:
    "A rogue AI has corrupted all four systems simultaneously — the glitch engine, the debug core, the AI stack, and the creative layer. You must defeat each corrupted module one by one to restore the system.",
};

// ── The 4 stages ──────────────────────────────────────────────────────────────
const STAGES = [
  {
    id: 1,
    name: "Glitch Core",
    type: "glitch",
    icon: Zap,
    color: "#00F0FF",
    colorRgb: "0,240,255",
    hpDrain: 25,
    scenario:
      "A startup's real-time chat app keeps delivering messages out of order. Users are seeing replies before the original messages. The more users join, the worse it gets. The team has 10 minutes before a major demo. Identify the root cause and describe your fix.",
    prompt: "Identify the glitch and describe your exact fix. Be specific.",
    label: "Find the Glitch",
    emoji: "⚡",
  },
  {
    id: 2,
    name: "Debug Core",
    type: "bug",
    icon: Bug,
    color: "#FF6B00",
    colorRgb: "255,107,0",
    hpDrain: 25,
    code: `async function fetchUserData(userId) {
  const response = await fetch(\`/api/users/\${userId}\`);
  const data = response.json(); // line A
  
  if (data.status === 'active') {
    updateDashboard(data);
    return data;
  }
  
  const cache = localStorage.getItem('user_' + userId)
  return JSON.parse(cache) // line B
}`,
    scenario:
      "This async function is causing the dashboard to crash silently on some users. No error is thrown but the UI never updates. Find ALL bugs in this code and explain each fix.",
    prompt: "List every bug you found and how you fixed each one.",
    label: "Squash the Bug",
    emoji: "🐛",
  },
  {
    id: 3,
    name: "AI Stack",
    type: "ai",
    icon: Brain,
    color: "#FF00C8",
    colorRgb: "255,0,200",
    hpDrain: 25,
    scenario:
      "An AI recommendation system trained on 2 years of e-commerce data is now suggesting products that users already own 60% of the time. Accuracy has dropped from 94% to 41% after a data pipeline update last week. Users are churning. Diagnose what went wrong and propose a fix.",
    prompt:
      "Diagnose the AI failure — what broke in the pipeline, why accuracy collapsed, and how you'd fix it.",
    label: "Fix the AI",
    emoji: "🤖",
  },
  {
    id: 4,
    name: "Creative Core",
    type: "spark",
    icon: Sparkles,
    color: "#A855F7",
    colorRgb: "168,85,247",
    hpDrain: 25,
    scenario:
      "The company's onboarding flow has a 78% drop-off rate after step 2. Users land on a blank dashboard with no guidance. The CEO wants a fix by tomorrow's board meeting. Design a creative solution — it can be a UX concept, a gamification idea, or a completely unconventional approach.",
    prompt:
      "Pitch your creative fix. Be bold — this is your final move against the boss.",
    label: "Creative Spark",
    emoji: "✨",
  },
];

// ── AI feedback via Supabase edge function ────────────────────────────────────
async function getAIFeedback(scenario, answer) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "ai-feedback-edge-function",
      { body: { scenario, answer } },
    );
    if (error) throw error;
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch {
    return null;
  }
}

// ── Boss Health Bar ───────────────────────────────────────────────────────────
const BossHealthBar = ({ hp, maxHp, stageIndex }) => {
  const pct = Math.max(0, (hp / maxHp) * 100);
  const barColor = pct > 60 ? "#ef4444" : pct > 30 ? "#f59e0b" : "#22c55e";

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Skull size={18} className="text-red-400" />
          <span className="text-sm font-black text-white tracking-wider">
            {BOSS.name}
          </span>
          <span className="text-xs text-gray-500">· {BOSS.subtitle}</span>
        </div>
        <span className="text-sm font-bold" style={{ color: barColor }}>
          {hp} / {maxHp} HP
        </span>
      </div>

      {/* Track */}
      <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/8">
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full relative overflow-hidden"
          style={{
            background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
          }}
        >
          {/* shimmer */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
              animation: "shimmer 2s infinite",
            }}
          />
        </motion.div>
      </div>

      {/* Stage markers */}
      <div className="flex justify-between mt-1.5 px-0.5">
        {STAGES.map((s, i) => (
          <div key={s.id} className="flex flex-col items-center gap-1">
            <div
              className="w-1 h-2 rounded-full"
              style={{
                background: i < stageIndex ? s.color : "rgba(255,255,255,0.15)",
              }}
            />
            <span
              className="text-[9px] font-bold hidden sm:block"
              style={{ color: i < stageIndex ? s.color : "#4b5563" }}
            >
              {s.emoji}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Stage Progress Stepper ────────────────────────────────────────────────────
const StageStepper = ({ currentStage }) => (
  <div className="flex items-center justify-center gap-2 mb-8">
    {STAGES.map((stage, i) => {
      const Icon = stage.icon;
      const done = currentStage > stage.id;
      const active = currentStage === stage.id;
      return (
        <React.Fragment key={stage.id}>
          <div className="flex flex-col items-center gap-1.5">
            <motion.div
              animate={{ scale: active ? 1.12 : 1 }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-500"
              style={{
                background: done
                  ? `rgba(${STAGES[i].colorRgb},0.2)`
                  : active
                    ? `rgba(${stage.colorRgb},0.15)`
                    : "rgba(255,255,255,0.03)",
                borderColor: done
                  ? STAGES[i].color
                  : active
                    ? stage.color
                    : "rgba(255,255,255,0.08)",
                boxShadow: active
                  ? `0 0 16px rgba(${stage.colorRgb},0.4)`
                  : "none",
              }}
            >
              {done ? (
                <CheckCircle size={16} style={{ color: STAGES[i].color }} />
              ) : (
                <Icon
                  size={16}
                  style={{ color: active ? stage.color : "#4b5563" }}
                />
              )}
            </motion.div>
            <span
              className="text-[10px] font-bold uppercase tracking-wider hidden sm:block"
              style={{
                color: active ? stage.color : done ? "#6b7280" : "#374151",
              }}
            >
              {stage.name}
            </span>
          </div>
          {i < STAGES.length - 1 && (
            <div
              className="flex-1 max-w-[40px] h-px"
              style={{
                background:
                  currentStage > stage.id
                    ? stage.color
                    : "rgba(255,255,255,0.06)",
              }}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ── Feedback Card ─────────────────────────────────────────────────────────────
const FeedbackCard = ({ feedback, stageColor, onContinue, isLast, score }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mt-6 space-y-3"
  >
    {/* Header */}
    <div className="flex items-center gap-2 mb-4">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
        style={{
          background: `rgba(${stageColor},0.1)`,
          border: `1px solid rgba(${stageColor},0.25)`,
        }}
      >
        🤖
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
        AI Judgment
      </p>
      <div
        className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
        style={{
          background: `rgba(${stageColor},0.1)`,
          color: `rgb(${stageColor})`,
          border: `1px solid rgba(${stageColor},0.2)`,
        }}
      >
        Powered by Claude
      </div>
    </div>

    {[
      {
        label: "What You Got Right",
        text: feedback.strength,
        color: "#22c55e",
        icon: "✅",
      },
      {
        label: "What Was Missed",
        text: feedback.gap,
        color: "#f59e0b",
        icon: "⚠️",
      },
      {
        label: "Level It Up",
        text: feedback.suggestion,
        color: `rgb(${stageColor})`,
        icon: "🚀",
      },
    ].map(({ label, text, color, icon }) => (
      <div
        key={label}
        className="rounded-xl p-4"
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
        <p className="text-gray-300 text-sm leading-relaxed">{text}</p>
      </div>
    ))}

    {/* Score pill */}
    {score && (
      <div
        className="flex items-center justify-center gap-3 p-3 rounded-xl"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span className="text-gray-500 text-xs uppercase tracking-widest font-semibold">
          Stage Score
        </span>
        <span
          className="text-2xl font-black"
          style={{
            background: `linear-gradient(90deg, rgb(${stageColor}), #FF00C8)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {score}/10
        </span>
        <div className="flex-1 max-w-[100px] h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(score / 10) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, rgb(${stageColor}), #FF00C8)`,
            }}
          />
        </div>
      </div>
    )}

    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onContinue}
      className="w-full py-3.5 rounded-2xl font-black text-sm text-white cursor-pointer flex items-center justify-center gap-2"
      style={{
        background: isLast
          ? "linear-gradient(90deg,#FFD700,#FF00C8)"
          : `linear-gradient(90deg, rgb(${stageColor}), #FF00C8)`,
        boxShadow: isLast
          ? "0 0 30px rgba(255,215,0,0.4)"
          : `0 0 20px rgba(${stageColor},0.3)`,
      }}
    >
      {isLast ? (
        <>
          <Trophy size={16} /> Claim Victory 🏆
        </>
      ) : (
        <>
          Next Stage <ChevronRight size={15} />
        </>
      )}
    </motion.button>
  </motion.div>
);

// ── Single Stage Component ────────────────────────────────────────────────────
const StageChallenge = ({ stage, onComplete }) => {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [timeLeft, setTimeLeft] = useState(180); // 3 min per stage
  const [timerActive, setTimerActive] = useState(true);
  const intervalRef = useRef(null);

  const Icon = stage.icon;

  // countdown timer
  useEffect(() => {
    if (!timerActive || feedback) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          setTimerActive(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [timerActive, feedback]);

  const timerColor =
    timeLeft > 90 ? "#22c55e" : timeLeft > 30 ? "#f59e0b" : "#ef4444";
  const mins = Math.floor(timeLeft / 60);
  const secs = String(timeLeft % 60).padStart(2, "0");

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    clearInterval(intervalRef.current);
    setTimerActive(false);
    setLoading(true);
    const fb = await getAIFeedback(stage.scenario, answer);
    setFeedback(fb);
    setLoading(false);
  };

  return (
    <motion.div
      key={`stage-${stage.id}`}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4 }}
    >
      {/* Stage header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{
              background: `rgba(${stage.colorRgb},0.12)`,
              border: `1px solid rgba(${stage.colorRgb},0.3)`,
              boxShadow: `0 0 16px rgba(${stage.colorRgb},0.2)`,
            }}
          >
            <Icon size={18} style={{ color: stage.color }} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Stage {stage.id} of 4
            </p>
            <h2 className="text-xl font-black text-white">
              {stage.emoji} {stage.label}
            </h2>
          </div>
        </div>

        {/* Timer */}
        {!feedback && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              background: `${timerColor}10`,
              border: `1px solid ${timerColor}30`,
            }}
          >
            <Timer size={13} style={{ color: timerColor }} />
            <span
              className="text-sm font-black font-mono"
              style={{ color: timerColor }}
            >
              {mins}:{secs}
            </span>
          </div>
        )}
      </div>

      {/* Time's up warning */}
      {timeLeft === 0 && !feedback && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
          }}
        >
          <AlertTriangle size={14} className="text-red-400 shrink-0" />
          <p className="text-red-300 text-xs">
            Time's up! Submit what you have — partial credit counts.
          </p>
        </motion.div>
      )}

      {/* Scenario */}
      <div
        className="rounded-xl p-5 mb-5"
        style={{
          background: `rgba(${stage.colorRgb},0.04)`,
          border: `1px solid rgba(${stage.colorRgb},0.15)`,
        }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-2"
          style={{ color: stage.color }}
        >
          🔴 System Alert — {stage.name} Corrupted
        </p>
        <p className="text-gray-300 text-sm leading-relaxed">
          {stage.scenario}
        </p>
      </div>

      {/* Code block for stage 2 */}
      {stage.code && !feedback && (
        <div className="bg-[#080810] border border-white/8 rounded-xl p-5 mb-5 overflow-x-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-2 text-xs text-gray-500 font-mono">
              buggy.js
            </span>
          </div>
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
            {stage.code}
          </pre>
        </div>
      )}

      {/* Answer textarea */}
      {!feedback && (
        <>
          <p className="text-xs text-gray-500 mb-2">{stage.prompt}</p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={5}
            placeholder={`Your answer for ${stage.label}...`}
            className="w-full bg-[#08080f] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none transition resize-none mb-4"
            style={{ "--tw-ring-color": stage.color }}
            onFocus={(e) => (e.target.style.borderColor = `${stage.color}50`)}
            onBlur={(e) =>
              (e.target.style.borderColor = "rgba(255,255,255,0.08)")
            }
          />

          <div className="flex justify-end">
            <motion.button
              whileHover={answer.trim() && !loading ? { scale: 1.04 } : {}}
              whileTap={answer.trim() && !loading ? { scale: 0.97 } : {}}
              onClick={handleSubmit}
              disabled={!answer.trim() || loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, rgb(${stage.colorRgb}), #FF00C8)`,
                boxShadow: answer.trim()
                  ? `0 0 20px rgba(${stage.colorRgb},0.3)`
                  : "none",
              }}
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
                  Analyzing...
                </>
              ) : (
                <>
                  Strike! <Zap size={14} />
                </>
              )}
            </motion.button>
          </div>
        </>
      )}

      {/* Previous answer summary */}
      {feedback && (
        <div className="bg-[#08080f] border border-white/5 rounded-xl p-4 mb-4">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">
            Your Answer
          </p>
          <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
            {answer}
          </p>
        </div>
      )}

      {/* AI Feedback */}
      {feedback && (
        <FeedbackCard
          feedback={feedback}
          stageColor={stage.colorRgb}
          onContinue={() => onComplete(feedback?.score || 5)}
          isLast={stage.id === 4}
          score={feedback?.score}
        />
      )}

      {/* Skip if no feedback (edge case) */}
      {!feedback && !loading && timeLeft === 0 && answer.trim() && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={handleSubmit}
          className="w-full py-3 rounded-xl text-sm font-bold text-white cursor-pointer mt-2"
          style={{ background: "linear-gradient(90deg,#ef4444,#FF00C8)" }}
        >
          Submit & Continue →
        </motion.button>
      )}
    </motion.div>
  );
};

// ── Victory Screen ────────────────────────────────────────────────────────────
const VictoryScreen = ({ totalScore, navigate }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.6 }}
    className="text-center py-8"
  >
    {/* Badge */}
    <motion.div
      animate={{ rotate: [0, -5, 5, -5, 5, 0], scale: [1, 1.1, 1] }}
      transition={{ duration: 1, delay: 0.3 }}
      className="text-7xl mb-4"
    >
      🏆
    </motion.div>

    <div
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4"
      style={{
        background:
          "linear-gradient(90deg,rgba(255,215,0,0.15),rgba(255,0,200,0.15))",
        border: "1px solid rgba(255,215,0,0.4)",
        color: "#FFD700",
      }}
    >
      <Star size={11} /> LEGENDARY BADGE UNLOCKED
    </div>

    <h2 className="text-4xl font-black text-white mb-2">System Restored!</h2>
    <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed mb-2">
      You defeated <span className="text-white font-bold">SYSTEM OVERRIDE</span>{" "}
      — all four corrupted cores are neutralised. You are a Glitch Room legend.
    </p>

    {/* Score */}
    <div
      className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl my-6"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="text-center">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
          Total Score
        </p>
        <p
          className="text-4xl font-black"
          style={{
            background: "linear-gradient(90deg,#FFD700,#FF00C8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {totalScore}/40
        </p>
      </div>
      <div className="w-px h-12 bg-white/10" />
      <div className="text-center">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
          XP Earned
        </p>
        <p className="text-4xl font-black text-[#00F0FF]">+100</p>
      </div>
    </div>

    {/* Rare badge display */}
    <div
      className="flex items-center gap-4 p-5 rounded-2xl mb-8 text-left"
      style={{
        background:
          "linear-gradient(135deg,rgba(255,215,0,0.08),rgba(255,0,200,0.05))",
        border: "1px solid rgba(255,215,0,0.25)",
      }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
        style={{
          background:
            "linear-gradient(135deg,rgba(255,215,0,0.2),rgba(255,0,200,0.1))",
          border: "2px solid rgba(255,215,0,0.4)",
          boxShadow: "0 0 24px rgba(255,215,0,0.25)",
        }}
      >
        ☠️
      </div>
      <div>
        <p
          className="text-xs font-black uppercase tracking-widest mb-1"
          style={{ color: "#FFD700" }}
        >
          Legendary Badge
        </p>
        <p className="text-white font-black text-lg">System Override Slayer</p>
        <p className="text-gray-500 text-xs mt-0.5">
          Defeated all 4 corrupted cores in a single Boss Battle session
        </p>
      </div>
    </div>

    {/* CTA buttons */}
    <div className="flex flex-col gap-3">
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/hall-of-fame")}
        className="w-full py-3.5 rounded-2xl font-black text-sm text-black cursor-pointer"
        style={{
          background: "linear-gradient(90deg,#FFD700,#FF00C8)",
          boxShadow: "0 0 30px rgba(255,215,0,0.35)",
        }}
      >
        🏅 View Hall of Fame
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.02 }}
        onClick={() => navigate("/explore")}
        className="w-full py-3 rounded-2xl text-sm font-semibold cursor-pointer"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#9ca3af",
        }}
      >
        Back to Challenges
      </motion.button>
    </div>
  </motion.div>
);

// ── Intro Screen ──────────────────────────────────────────────────────────────
const IntroScreen = ({ onStart }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-4"
  >
    {/* Boss icon */}
    <motion.div
      animate={{ scale: [1, 1.04, 1], opacity: [1, 0.85, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="text-7xl mb-5"
    >
      ☠️
    </motion.div>

    <div
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4"
      style={{
        background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.3)",
        color: "#ef4444",
      }}
    >
      <Flame size={11} /> Boss Battle
    </div>

    <h2 className="text-3xl font-black text-white mb-1">{BOSS.name}</h2>
    <p className="text-red-400 font-bold text-sm mb-4">{BOSS.subtitle}</p>
    <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed mb-6">
      {BOSS.description}
    </p>

    {/* Stage preview */}
    <div className="grid grid-cols-2 gap-3 mb-8 text-left">
      {STAGES.map((stage) => {
        const Icon = stage.icon;
        return (
          <div
            key={stage.id}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{
              background: `rgba(${stage.colorRgb},0.06)`,
              border: `1px solid rgba(${stage.colorRgb},0.15)`,
            }}
          >
            <Icon size={16} style={{ color: stage.color }} />
            <div>
              <p className="text-xs font-bold text-white">{stage.label}</p>
              <p className="text-[10px] text-gray-600">{stage.name}</p>
            </div>
          </div>
        );
      })}
    </div>

    {/* Warnings */}
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl mb-6 text-left"
      style={{
        background: "rgba(239,68,68,0.06)",
        border: "1px solid rgba(239,68,68,0.2)",
      }}
    >
      <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
      <p className="text-xs text-red-300 leading-relaxed">
        Each stage has a{" "}
        <span className="font-bold text-white">3-minute timer</span>. All 4
        stages must be completed in one session. Earning a legendary badge
        requires completing all stages.
      </p>
    </div>

    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      onClick={onStart}
      className="w-full py-4 rounded-2xl font-black text-base text-white cursor-pointer flex items-center justify-center gap-2"
      style={{
        background: "linear-gradient(90deg,#ef4444,#FF00C8,#a855f7)",
        boxShadow: "0 0 30px rgba(239,68,68,0.35)",
      }}
    >
      <Skull size={18} /> Enter Boss Battle
    </motion.button>
  </motion.div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const BossBattle = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("intro"); // intro | battle | victory
  const [currentStage, setCurrentStage] = useState(1);
  const [bossHp, setBossHp] = useState(BOSS.hp);
  const [totalScore, setTotalScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    fetchPoints().then(setPoints);
  }, []);

  const handleStageComplete = async (score) => {
    const newScore = totalScore + (score || 5);
    setTotalScore(newScore);

    // damage the boss
    const newHp = Math.max(0, bossHp - STAGES[currentStage - 1].hpDrain);
    setBossHp(newHp);

    if (currentStage < STAGES.length) {
      setCurrentStage((s) => s + 1);
    } else {
      // All stages done — award points + badge
      const { data: au } = await supabase.auth.getUser();
      const uid = au?.user?.id;
      if (uid) {
        const next = await updatePoints(
          100,
          "Boss Battle: System Override Slayer",
          "glitch",
        );
        setPoints(next);
        // Award legendary badge if exists in your badges table
        try {
          const { data: badge } = await supabase
            .from("badges")
            .select("id")
            .eq("title", "System Override Slayer")
            .single();
          if (badge) {
            await supabase.from("user_badges").upsert(
              {
                user_id: uid,
                badge_id: badge.id,
                earned_at: new Date().toISOString(),
              },
              { onConflict: "user_id,badge_id" },
            );
          }
        } catch {}
      }
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 7000);
      setPhase("victory");
    }
  };

  const stageIndex = currentStage - 1;

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col">
      {showConfetti && <Confetti numberOfPieces={300} />}
      <Navbar />

      {/* Hero banner */}
      <section className="relative pt-40 pb-8 px-6 overflow-hidden">
        <button
          onClick={() => navigate("/explore")}
          className="absolute top-24 left-6 md:left-10 z-20 flex items-center gap-2 text-gray-500 hover:text-white text-sm font-medium transition cursor-pointer"
        >
          <ArrowLeft size={15} /> Back to Explore
        </button>

        <div
          className="absolute top-24 right-6 md:right-10 z-20 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{
            color: "#ef4444",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
          }}
        >
          <Zap size={13} /> {points} pts
        </div>

        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(239,68,68,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.8) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ background: "radial-gradient(ellipse,#ef4444,transparent)" }}
        />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <PageHeading
            eyebrow="💀 Boss Battle Mode"
            title="System Override"
            subtitle="4 corrupted cores · 1 legendary badge · No retries"
            accent="pink"
            size="lg"
          />
        </div>
      </section>

      {/* Main card */}
      <section className="max-w-2xl mx-auto w-full px-6 pb-24 flex-1">
        <div
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: "#0d0d14",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          {/* Top gradient bar */}
          <div
            className="h-[2px] w-full"
            style={{
              background:
                "linear-gradient(90deg,#ef4444,#FF00C8,#a855f7,#00F0FF)",
            }}
          />

          <div className="p-7">
            <AnimatePresence mode="wait">
              {phase === "intro" && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <IntroScreen onStart={() => setPhase("battle")} />
                </motion.div>
              )}

              {phase === "battle" && (
                <motion.div
                  key="battle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Boss HP bar */}
                  <BossHealthBar
                    hp={bossHp}
                    maxHp={BOSS.hp}
                    stageIndex={stageIndex}
                  />

                  {/* Stage stepper */}
                  <StageStepper currentStage={currentStage} />

                  {/* Stage challenge */}
                  <AnimatePresence mode="wait">
                    <StageChallenge
                      key={currentStage}
                      stage={STAGES[stageIndex]}
                      onComplete={handleStageComplete}
                    />
                  </AnimatePresence>
                </motion.div>
              )}

              {phase === "victory" && (
                <motion.div
                  key="victory"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <VictoryScreen totalScore={totalScore} navigate={navigate} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <Footer />

      {/* Shimmer CSS */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default BossBattle;
