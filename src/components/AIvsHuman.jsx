import React, { useState, useEffect, useRef } from "react";
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
  Bot,
  User,
  Swords,
  Timer,
  Zap,
  TrendingUp,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Code2,
  Trophy,
  Flame,
  Star,
  Cpu,
  ArrowLeft,
} from "lucide-react";

// ── Challenge data ─────────────────────────────────────────────────────────────
const CHALLENGES = [
  {
    id: "avh-1",
    round: 1,
    title: "The Broken Shopping Cart",
    language: "JavaScript",
    languageColor: "#f7df1e",
    difficulty: "Medium",
    timeLimit: 300,
    context:
      "An AI wrote this shopping cart total calculator for an e-commerce site. It has multiple bugs, bad practices, and performance issues. Your job: rewrite it to be correct, clean, and efficient.",
    badCode: `// AI Generated Shopping Cart Calculator
function calculateTotal(items) {
  var total = 0;
  var discount = 0;
  
  for (var i = 0; i <= items.length; i++) {
    var item = items[i];
    total = total + item.price * item.quantity;
    
    if (item.category == "electronics") {
      discount = discount + (item.price * 0.1);
    }
    if (item.category == "electronics") {
      if (item.price > 1000) {
        discount = discount + (item.price * 0.05);
      }
    }
  }
  
  var tax = total * 0.18 / 100;
  var finalTotal = total - discount + tax;
  
  return finalTotal;
}

function applyCoupon(total, coupon) {
  if (coupon == "SAVE10") {
    total = total - total * 10 / 100;
  }
  if (coupon == "SAVE20") {
    total = total - total * 20 / 100;
  }
  if (coupon == "SAVE10") {
    console.log("coupon applied");
  }
  return total;
}`,
    bugs: [
      "Off-by-one error: `i <= items.length` causes undefined access",
      "Double discount applied to electronics (category check runs twice)",
      "Tax calculation wrong: `0.18 / 100` = 0.0018 instead of 0.18",
      "Duplicate `if (coupon == 'SAVE10')` block — dead code",
      "`var` used instead of `const`/`let`",
      "No null/undefined checks on item or item.price",
    ],
    pointsBase: 50,
  },
  {
    id: "avh-2",
    round: 1,
    title: "The Async Nightmare",
    language: "JavaScript",
    languageColor: "#f7df1e",
    difficulty: "Hard",
    timeLimit: 300,
    context:
      "An AI wrote this user authentication function. It silently fails, has race conditions, and leaks sensitive data. Fix it.",
    badCode: `// AI Generated Auth Function
async function loginUser(email, password) {
  var user = await db.findUser(email);
  
  if (user.password == password) {
    var token = Math.random().toString();
    
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
    
    sendWelcomeEmail(user.email);
    
    return user;
  }
}

async function getUserData(userId) {
  var response = await fetch("/api/user/" + userId);
  var data = response.json();
  
  if (data.role == "admin") {
    return data;
  }
  
  return data;
}

function logout() {
  localStorage.removeItem("token");
}`,
    bugs: [
      "Password compared in plain text — never compare raw passwords",
      "`Math.random()` is not cryptographically secure for tokens",
      "Entire user object (with password hash) stored in localStorage",
      "`response.json()` missing `await` — returns a Promise, not data",
      "Both branches of `if (role == admin)` return the same thing — dead code",
      "logout() only removes token, leaves user data in localStorage",
      "No try/catch — any error silently returns undefined",
    ],
    pointsBase: 70,
  },
  {
    id: "avh-3",
    round: 2,
    title: "The Infinite Loop Machine",
    language: "Python",
    languageColor: "#3776ab",
    difficulty: "Medium",
    timeLimit: 300,
    context:
      "An AI wrote this data processing pipeline for a machine learning project. It has logic errors, performance disasters, and will crash on real data. Fix it.",
    badCode: `# AI Generated Data Processor
import pandas as pd
import numpy as np

def process_data(df):
    result = []
    
    for i in range(len(df)):
        row = df.iloc[i]
        result.append(row)
    
    new_df = pd.DataFrame(result)
    
    for i in range(len(new_df)):
        for j in range(len(new_df)):
            if i != j:
                if new_df.iloc[i].equals(new_df.iloc[j]):
                    new_df = new_df.drop(j)
    
    for col in new_df.columns:
        if new_df[col].dtype == "float64":
            min_val = 999999999
            max_val = -999999999
            for val in new_df[col]:
                if val < min_val:
                    min_val = val
                if val > max_val:
                    max_val = val
            for i in range(len(new_df)):
                new_df[col][i] = (new_df[col][i] - min_val) / (max_val - min_val)
    
    return new_df

def get_stats(df):
    stats = {}
    for col in df.columns:
        total = 0
        for val in df[col]:
            total = total + val
        stats[col] = total / len(df[col])
    return stats`,
    bugs: [
      "Iterating row-by-row with `.iloc[i]` then rebuilding — just use df.copy()",
      "O(n²) duplicate removal loop will crash on large datasets — use .drop_duplicates()",
      "Modifying DataFrame while iterating causes SettingWithCopyWarning and index errors",
      "Manual min/max loop instead of .min()/.max()",
      "Normalizing with magic number 999999999 instead of proper pandas methods",
      "get_stats manually sums instead of using df.mean()",
      "No handling of division by zero when max == min",
    ],
    pointsBase: 50,
  },
  {
    id: "avh-4",
    round: 2,
    title: "The Memory Leak API",
    language: "JavaScript",
    languageColor: "#f7df1e",
    difficulty: "Hard",
    timeLimit: 300,
    context:
      "An AI wrote this Express.js REST API endpoint. It has memory leaks, SQL injection vulnerabilities, and will melt under load. Fix it.",
    badCode: `// AI Generated Express API
const connections = [];

app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  
  const conn = await db.connect();
  connections.push(conn);
  
  const results = await conn.query(
    "SELECT * FROM products WHERE name LIKE '%" + query + "%'"
  );
  
  var cache = {};
  cache[query] = results;
  
  setInterval(() => {
    console.log("cache size:", Object.keys(cache).length);
  }, 1000);
  
  res.json({
    data: results,
    total: results.length,
    query: query
  });
});

app.get("/api/user/:id", (req, res) => {
  const id = req.params.id;
  db.query("SELECT * FROM users WHERE id = " + id, (err, result) => {
    res.json(result);
  });
});`,
    bugs: [
      "SQL injection: string concatenation directly into query — use parameterized queries",
      "DB connection never released — `connections` array grows forever (memory leak)",
      "`setInterval` created on every request, never cleared — timer leak",
      "`cache` object is local to request scope — useless, data lost after response",
      "Second endpoint also SQL-injectable via `id` param",
      "No error handling — if db fails, server crashes or hangs",
      "Returning full user object including password hash to client",
    ],
    pointsBase: 70,
  },
];

const ROUNDS = [
  { round: 1, challenges: [CHALLENGES[0], CHALLENGES[1]] },
  { round: 2, challenges: [CHALLENGES[2], CHALLENGES[3]] },
];

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function getImprovementScore(originalCode, userCode, context, bugs) {
  const scenario = `You are scoring an "AI vs Human" code improvement challenge.
CONTEXT: ${context}
KNOWN BUGS IN ORIGINAL CODE:
${bugs.map((b, i) => `${i + 1}. ${b}`).join("\n")}
ORIGINAL (BAD) CODE:
\`\`\`
${originalCode}
\`\`\`
USER'S IMPROVED VERSION:
\`\`\`
${userCode}
\`\`\`
Evaluate the user's improvement. Score based on:
1. How many bugs they fixed (most important)
2. Code quality improvements (naming, structure, readability)
3. Performance improvements
4. Any new issues they introduced (penalize)
In your feedback:
- "strength": what they fixed well
- "gap": bugs or issues they missed
- "suggestion": what the ideal solution would include
- "score": 1-10 based on improvement quality`;
  try {
    const { data, error } = await supabase.functions.invoke(
      "ai-feedback-edge-function",
      { body: { scenario, answer: userCode } },
    );
    if (error) throw error;
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch {
    return null;
  }
}

async function fetchCompletedChallengeIds(userId) {
  if (!userId) return new Set();
  const { data } = await supabase
    .from("challenge_completions")
    .select("challenge_id")
    .eq("user_id", userId)
    .eq("challenge_type", "ai_vs_human");
  return new Set((data || []).map((r) => r.challenge_id));
}

async function saveCompletion(userId, challengeId, score, pointsEarned) {
  if (!userId) return;
  await supabase.from("challenge_completions").upsert(
    {
      user_id: userId,
      challenge_type: "ai_vs_human",
      challenge_id: challengeId,
      score,
      points_earned: pointsEarned,
    },
    { onConflict: "user_id,challenge_type,challenge_id" },
  );
}

// ── Countdown Timer ───────────────────────────────────────────────────────────
const CountdownTimer = ({ timeLeft, total }) => {
  const pct = (timeLeft / total) * 100;
  const mins = Math.floor(timeLeft / 60);
  const secs = String(timeLeft % 60).padStart(2, "0");
  const color =
    timeLeft > total * 0.5
      ? "#22c55e"
      : timeLeft > total * 0.2
        ? "#f59e0b"
        : "#ef4444";
  const urgent = timeLeft <= 60;
  return (
    <div className="flex items-center gap-3">
      <motion.div
        animate={urgent ? { scale: [1, 1.06, 1] } : {}}
        transition={{ duration: 0.5, repeat: urgent ? Infinity : 0 }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
        style={{ background: `${color}12`, border: `1px solid ${color}30` }}
      >
        <Timer size={13} style={{ color }} />
        <span className="text-sm font-black font-mono" style={{ color }}>
          {mins}:{secs}
        </span>
      </motion.div>
      <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "linear" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
};

// ── Score Delta badge ─────────────────────────────────────────────────────────
const ScoreDelta = ({ score }) => {
  const label =
    score >= 9
      ? "Legendary Fix"
      : score >= 7
        ? "Great Improvement"
        : score >= 5
          ? "Decent Fix"
          : "Needs Work";
  const color =
    score >= 9
      ? "#FFD700"
      : score >= 7
        ? "#22c55e"
        : score >= 5
          ? "#f59e0b"
          : "#ef4444";
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black"
      style={{
        background: `${color}15`,
        border: `1px solid ${color}30`,
        color,
      }}
    >
      <TrendingUp size={11} /> {label} · {score}/10
    </div>
  );
};

// ── Bug list ──────────────────────────────────────────────────────────────────
const BugList = ({ bugs, revealed }) => (
  <div
    className="rounded-xl overflow-hidden"
    style={{
      background: "rgba(239,68,68,0.04)",
      border: "1px solid rgba(239,68,68,0.15)",
    }}
  >
    <div className="flex items-center gap-2 px-4 py-3 border-b border-red-500/10">
      <AlertTriangle size={13} className="text-red-400" />
      <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
        Known Bugs ({bugs.length})
      </span>
      {!revealed && (
        <span className="ml-auto text-[10px] text-gray-600">
          Revealed after submit
        </span>
      )}
    </div>
    <div className="p-4 space-y-2">
      {bugs.map((bug, i) => (
        <motion.div
          key={i}
          initial={revealed ? { opacity: 0, x: -8 } : { opacity: 1 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
          className="flex items-start gap-2"
        >
          <span
            className="text-xs mt-0.5 shrink-0 font-bold"
            style={{ color: revealed ? "#f87171" : "#374151" }}
          >
            {revealed ? "✗" : "?"}
          </span>
          <p
            className="text-xs leading-relaxed"
            style={{ color: revealed ? "#fca5a5" : "#374151" }}
          >
            {revealed ? bug : "██████████████████████"}
          </p>
        </motion.div>
      ))}
    </div>
  </div>
);

// ── Already Solved badge (on challenge card in round intro) ───────────────────
const SolvedBadge = () => (
  <div
    className="flex items-center gap-1 px-2 py-0.5 rounded-full"
    style={{
      background: "rgba(34,197,94,0.12)",
      border: "1px solid rgba(34,197,94,0.3)",
    }}
  >
    <CheckCircle size={10} className="text-green-400" />
    <span className="text-[10px] text-green-400 font-black uppercase tracking-wider">
      Solved
    </span>
  </div>
);

// ── Single Challenge View ─────────────────────────────────────────────────────
const ChallengeView = ({
  challenge,
  onComplete,
  roundLabel,
  alreadySolved,
}) => {
  const [userCode, setUserCode] = useState(challenge.badCode);
  const [timeLeft, setTimeLeft] = useState(challenge.timeLimit);
  const [timerActive, setTimerActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [bugsRevealed, setBugsRevealed] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setUserCode(challenge.badCode);
    setTimeLeft(challenge.timeLimit);
    setTimerActive(true);
    setResult(null);
    setBugsRevealed(false);
  }, [challenge.id]);

  useEffect(() => {
    if (!timerActive || result) return;
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
  }, [timerActive, result, challenge.id]);

  const handleSubmit = async () => {
    if (userCode.trim() === challenge.badCode.trim()) {
      alert("You haven't changed anything yet! Fix the code first.");
      return;
    }
    clearInterval(intervalRef.current);
    setTimerActive(false);
    setLoading(true);
    const feedback = await getImprovementScore(
      challenge.badCode,
      userCode,
      challenge.context,
      challenge.bugs,
    );
    setBugsRevealed(true);
    setResult(feedback);
    setLoading(false);
  };

  const improvementScore = result?.score || 0;
  const pointsEarned = alreadySolved
    ? 0
    : Math.round(challenge.pointsBase * (improvementScore / 10));

  return (
    <motion.div
      key={challenge.id}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest"
              style={{
                background: `${challenge.languageColor}18`,
                color: challenge.languageColor,
                border: `1px solid ${challenge.languageColor}30`,
              }}
            >
              {challenge.language}
            </span>
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
              {roundLabel}
            </span>
            {/* ── SOLVED FLAG on challenge header ── */}
            {alreadySolved && <SolvedBadge />}
          </div>
          <h2 className="text-xl font-black text-white">{challenge.title}</h2>
          <p className="text-gray-500 text-xs mt-1 leading-relaxed max-w-lg">
            {challenge.context}
          </p>
        </div>
        {!result && (
          <CountdownTimer timeLeft={timeLeft} total={challenge.timeLimit} />
        )}
      </div>

      {/* Already solved notice */}
      {alreadySolved && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4"
          style={{
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.2)",
          }}
        >
          <CheckCircle size={13} className="text-green-400 shrink-0" />
          <p className="text-xs text-green-300">
            You've already solved this challenge — you can still practice but{" "}
            <span className="font-bold">no XP will be awarded</span>.
          </p>
        </motion.div>
      )}

      {/* Time's up */}
      {timeLeft === 0 && !result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
          }}
        >
          <AlertTriangle size={13} className="text-red-400 shrink-0" />
          <p className="text-xs text-red-300">
            Time's up! Submit what you have — partial improvements still count.
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT — AI bad code + bug list */}
        <div className="space-y-4">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: "1px solid rgba(239,68,68,0.2)",
              background: "#08080f",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-red-500/10">
              <div className="flex items-center gap-2">
                <Bot size={13} className="text-red-400" />
                <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
                  AI-Generated (Bad) Code
                </span>
              </div>
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </div>
            </div>
            <pre className="p-4 text-xs text-red-200/70 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-72 overflow-y-auto">
              {challenge.badCode}
            </pre>
          </div>
          <BugList bugs={challenge.bugs} revealed={bugsRevealed} />
        </div>

        {/* RIGHT — editor or result */}
        <div className="space-y-4">
          {!result ? (
            <>
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  border: "1px solid rgba(0,240,255,0.2)",
                  background: "#08080f",
                }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/10">
                  <div className="flex items-center gap-2">
                    <User size={13} className="text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                      Your Improved Version
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-600">
                    Edit the code below ↓
                  </span>
                </div>
                <textarea
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  rows={18}
                  spellCheck={false}
                  className="w-full bg-transparent p-4 text-xs text-cyan-100 font-mono leading-relaxed focus:outline-none resize-none"
                  style={{ minHeight: "280px" }}
                />
              </div>

              <motion.button
                whileHover={
                  !loading && userCode !== challenge.badCode
                    ? { scale: 1.02 }
                    : {}
                }
                whileTap={
                  !loading && userCode !== challenge.badCode
                    ? { scale: 0.98 }
                    : {}
                }
                onClick={handleSubmit}
                disabled={
                  loading || userCode.trim() === challenge.badCode.trim()
                }
                className="w-full py-3.5 rounded-2xl font-black text-sm text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(90deg,#00F0FF,#FF00C8)",
                  boxShadow:
                    userCode !== challenge.badCode
                      ? "0 0 20px rgba(0,240,255,0.25)"
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
                    AI is judging your improvement...
                  </>
                ) : (
                  <>
                    <Swords size={15} /> Submit vs AI
                  </>
                )}
              </motion.button>
            </>
          ) : (
            /* Result panel */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* VS score */}
              <div
                className="relative overflow-hidden rounded-2xl p-6 text-center"
                style={{
                  background:
                    "linear-gradient(135deg,rgba(0,240,255,0.08),rgba(255,0,200,0.06))",
                  border: "1px solid rgba(0,240,255,0.2)",
                }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{
                    background:
                      "linear-gradient(90deg,#00F0FF,#FF00C8,#a855f7)",
                  }}
                />
                <div className="flex items-center justify-center gap-6 mb-4">
                  <div className="text-center">
                    <Bot size={20} className="text-red-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500 mb-1">AI Code</p>
                    <p className="text-3xl font-black text-red-400">0</p>
                  </div>
                  <div
                    className="text-lg font-black px-3 py-1 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      color: "#6b7280",
                    }}
                  >
                    VS
                  </div>
                  <div className="text-center">
                    <User size={20} className="text-cyan-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500 mb-1">Your Code</p>
                    <p
                      className="text-3xl font-black"
                      style={{
                        background: "linear-gradient(90deg,#00F0FF,#FF00C8)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {improvementScore}
                    </p>
                  </div>
                </div>
                <ScoreDelta score={improvementScore} />
                <div className="flex items-center justify-center gap-4 mt-4">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">
                      XP Earned
                    </p>
                    <p className="text-lg font-black text-[#FF00C8]">
                      {alreadySolved
                        ? "+0 (already solved)"
                        : `+${pointsEarned}`}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">
                      Improvement
                    </p>
                    <p className="text-lg font-black text-[#00F0FF]">
                      +{improvementScore * 10}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Feedback cards */}
              {[
                {
                  label: "What You Fixed",
                  text: result?.strength,
                  color: "#22c55e",
                  icon: "✅",
                },
                {
                  label: "Bugs You Missed",
                  text: result?.gap,
                  color: "#f59e0b",
                  icon: "⚠️",
                },
                {
                  label: "The Ideal Fix",
                  text: result?.suggestion,
                  color: "#00F0FF",
                  icon: "🚀",
                },
              ].map(({ label, text, color, icon }) => (
                <div
                  key={label}
                  className="rounded-2xl p-4"
                  style={{
                    background: `${color}0D`,
                    border: `1px solid ${color}25`,
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

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onComplete(pointsEarned, improvementScore)}
                className="w-full py-3.5 rounded-2xl font-black text-sm text-white cursor-pointer flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(90deg,#00F0FF,#FF00C8)",
                  boxShadow: "0 0 20px rgba(0,240,255,0.2)",
                }}
              >
                Next Challenge <ChevronRight size={15} />
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ── Round Intro ───────────────────────────────────────────────────────────────
const RoundIntro = ({ round, onStart, completedIds }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-8"
  >
    <motion.div
      animate={{ rotate: [0, -5, 5, -5, 0] }}
      transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
      className="text-6xl mb-5"
    >
      {round === 1 ? "🤖" : "⚔️"}
    </motion.div>
    <div
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4"
      style={{
        background: "rgba(0,240,255,0.08)",
        border: "1px solid rgba(0,240,255,0.25)",
        color: "#00F0FF",
      }}
    >
      <Swords size={11} /> Round {round} of 2
    </div>
    <h2 className="text-3xl font-black text-white mb-2">
      {round === 1 ? "Round 1: Warm Up" : "Round 2: Final Assault"}
    </h2>
    <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed mb-2">
      {round === 1
        ? "AI wrote 2 broken pieces of code. You have 5 minutes each to out-code the machine."
        : "Harder bugs. Less time. Prove you're better than the AI."}
    </p>
    <p className="text-gray-600 text-xs mb-8">
      2 challenges in this round · 5 min each
    </p>

    <div className="grid grid-cols-2 gap-3 mb-8 max-w-sm mx-auto text-left">
      {ROUNDS[round - 1].challenges.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-2 p-3 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Code2 size={13} className="text-gray-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white leading-tight truncate">
              {c.title}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p
                className="text-[10px] font-semibold"
                style={{ color: c.languageColor }}
              >
                {c.language}
              </p>
              {/* ── SOLVED FLAG on round intro card ── */}
              {completedIds.has(c.id) && (
                <div className="flex items-center gap-0.5">
                  <CheckCircle size={9} className="text-green-400" />
                  <span className="text-[9px] text-green-400 font-bold">
                    Solved
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>

    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      onClick={onStart}
      className="px-10 py-4 rounded-2xl font-black text-base text-white cursor-pointer inline-flex items-center gap-2"
      style={{
        background: "linear-gradient(90deg,#00F0FF,#FF00C8)",
        boxShadow: "0 0 30px rgba(0,240,255,0.3)",
      }}
    >
      <Swords size={18} /> Start Round {round}
    </motion.button>
  </motion.div>
);

// ── Victory Screen ────────────────────────────────────────────────────────────
const VictoryScreen = ({ totalPoints, scores, navigate }) => {
  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;
  const rating =
    avgScore >= 9
      ? { label: "Legendary Debugger", emoji: "🏆", color: "#FFD700" }
      : avgScore >= 7
        ? { label: "Code Surgeon", emoji: "⚡", color: "#00F0FF" }
        : avgScore >= 5
          ? { label: "Bug Hunter", emoji: "🐛", color: "#a855f7" }
          : { label: "Apprentice", emoji: "🔧", color: "#6b7280" };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center py-6"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1, delay: 0.3 }}
        className="text-7xl mb-4"
      >
        {rating.emoji}
      </motion.div>
      <div
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4"
        style={{
          background: `${rating.color}15`,
          border: `1px solid ${rating.color}35`,
          color: rating.color,
        }}
      >
        <Star size={11} /> {rating.label}
      </div>
      <h2 className="text-4xl font-black text-white mb-2">You Beat the AI!</h2>
      <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed mb-6">
        You out-coded the machine across all 4 challenges. The AI's spaghetti
        code is no match for a real developer.
      </p>

      <div
        className="inline-flex items-center gap-6 px-6 py-4 rounded-2xl mb-8"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
            Total XP
          </p>
          <p
            className="text-3xl font-black"
            style={{
              background: "linear-gradient(90deg,#00F0FF,#FF00C8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            +{totalPoints}
          </p>
        </div>
        <div className="w-px h-10 bg-white/10" />
        <div className="text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
            Avg Score
          </p>
          <p className="text-3xl font-black text-white">{avgScore}/10</p>
        </div>
        <div className="w-px h-10 bg-white/10" />
        <div className="text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
            Challenges
          </p>
          <p className="text-3xl font-black text-white">4/4</p>
        </div>
      </div>

      {/* Per-challenge breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 max-w-lg mx-auto">
        {scores.map((s, i) => (
          <div
            key={i}
            className="p-3 rounded-xl text-center"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p className="text-[10px] text-gray-600 mb-1">
              {CHALLENGES[i]?.language}
            </p>
            <p
              className="text-2xl font-black"
              style={{
                color: s >= 8 ? "#22c55e" : s >= 5 ? "#f59e0b" : "#ef4444",
              }}
            >
              {s}/10
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/explore")}
          className="w-full py-3.5 rounded-2xl font-black text-sm text-white cursor-pointer"
          style={{
            background: "linear-gradient(90deg,#00F0FF,#FF00C8)",
            boxShadow: "0 0 25px rgba(0,240,255,0.25)",
          }}
        >
          More Challenges →
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate("/leaderboard")}
          className="w-full py-3 rounded-2xl text-sm font-semibold cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#9ca3af",
          }}
        >
          View Leaderboard
        </motion.button>
      </div>
    </motion.div>
  );
};

// ── Intro Screen ──────────────────────────────────────────────────────────────
const IntroScreen = ({ onStart, completedIds }) => {
  const totalSolved = completedIds.size;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-6"
    >
      <motion.div
        animate={{ rotate: [0, -8, 8, -8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
        className="text-7xl mb-5"
      >
        🤖
      </motion.div>
      <div
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4"
        style={{
          background: "rgba(255,0,200,0.08)",
          border: "1px solid rgba(255,0,200,0.25)",
          color: "#FF00C8",
        }}
      >
        <Cpu size={11} /> AI vs Human
      </div>
      <h2 className="text-3xl font-black text-white mb-2">
        Can you out-code the AI?
      </h2>
      <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed mb-4">
        An AI deliberately wrote broken, buggy, inefficient code. Your job: find
        every flaw and rewrite it better. The AI scored{" "}
        <span className="text-red-400 font-bold">0/10</span>. Beat that.
      </p>

      {/* Progress indicator if some already solved */}
      {totalSolved > 0 && (
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl mb-4 text-xs font-bold"
          style={{
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.2)",
            color: "#22c55e",
          }}
        >
          <CheckCircle size={11} /> {totalSolved}/4 challenges already solved —
          replay for free, no XP re-awarded
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-6 max-w-md mx-auto">
        {[
          { icon: Bot, label: "AI writes bad code", color: "#ef4444" },
          { icon: User, label: "You fix it", color: "#00F0FF" },
          { icon: TrendingUp, label: "AI scores delta", color: "#FF00C8" },
        ].map(({ icon: Icon, label, color }, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 p-3 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Icon size={18} style={{ color }} />
            <p className="text-[10px] text-gray-400 text-center leading-tight">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div
        className="flex items-center justify-center gap-6 px-5 py-3 rounded-xl mb-8 max-w-xs mx-auto"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {[
          { label: "Rounds", value: "2" },
          { label: "Challenges", value: "4 total" },
          { label: "Max XP", value: "240", color: "#FF00C8" },
        ].map(({ label, value, color }, i, arr) => (
          <React.Fragment key={label}>
            <div className="text-center">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider">
                {label}
              </p>
              <p
                className="text-sm font-black"
                style={{ color: color || "white" }}
              >
                {value}
              </p>
            </div>
            {i < arr.length - 1 && <div className="w-px h-6 bg-white/10" />}
          </React.Fragment>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        className="px-10 py-4 rounded-2xl font-black text-base text-white cursor-pointer inline-flex items-center gap-2"
        style={{
          background: "linear-gradient(90deg,#FF00C8,#a855f7,#00F0FF)",
          boxShadow: "0 0 30px rgba(255,0,200,0.3)",
        }}
      >
        <Swords size={18} /> Challenge the AI
      </motion.button>
    </motion.div>
  );
};

// ── Session Progress Bar ──────────────────────────────────────────────────────
const SessionProgress = ({ round, challengeIndex }) => {
  const done = (round - 1) * 2 + challengeIndex;
  const pct = (done / 4) * 100;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-gray-500 flex items-center gap-1.5">
          <Flame size={11} className="text-orange-400" />
          Round {round} · Challenge {challengeIndex + 1} of 2
        </span>
        <span className="text-gray-600">{done}/4 complete</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg,#00F0FF,#FF00C8)" }}
        />
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const AIvsHuman = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("loading"); // loading | intro | round-intro | battle | victory
  const [round, setRound] = useState(1);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [allScores, setAllScores] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [userId, setUserId] = useState(null);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [livePoints, setLivePoints] = useState(0);

  useEffect(() => {
    const init = async () => {
      const { data: au } = await supabase.auth.getUser();
      const uid = au?.user?.id;
      setUserId(uid);
      if (uid) {
        const ids = await fetchCompletedChallengeIds(uid);
        setCompletedIds(ids);
      }
      const pts = await fetchPoints();
      setLivePoints(pts);
      setPhase("intro");
    };
    init();
  }, []);

  const currentChallenge = ROUNDS[round - 1]?.challenges[challengeIndex];

  const handleChallengeComplete = async (points, score) => {
    const newScores = [...allScores, score];
    const newPoints = totalPoints + points;
    setAllScores(newScores);
    setTotalPoints(newPoints);

    // Save completion + award points only if not already solved
    if (userId && currentChallenge) {
      const alreadySolved = completedIds.has(currentChallenge.id);
      if (!alreadySolved && points > 0) {
        const next = await updatePoints(
          points,
          `AI vs Human: ${currentChallenge.title}`,
          "glitch",
        );
        setLivePoints(next);
        await saveCompletion(userId, currentChallenge.id, score, points);
        await checkAndAwardBadges(userId);
        setCompletedIds((prev) => new Set([...prev, currentChallenge.id]));
      }
    }

    const isLastChallengeInRound = challengeIndex === 1;
    const isLastRound = round === 2;

    if (isLastChallengeInRound && isLastRound) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 7000);
      setPhase("victory");
    } else if (isLastChallengeInRound) {
      setRound((r) => r + 1);
      setChallengeIndex(0);
      setPhase("round-intro");
    } else {
      setChallengeIndex((i) => i + 1);
    }
  };

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080810]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-2 border-t-transparent border-[#FF00C8] rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col">
      {showConfetti && <Confetti numberOfPieces={250} recycle={false} />}
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
            color: "#00F0FF",
            background: "rgba(0,240,255,0.1)",
            border: "1px solid rgba(0,240,255,0.3)",
          }}
        >
          <Zap size={13} /> {livePoints} pts
        </div>

        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,240,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,200,0.8) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full blur-3xl pointer-events-none opacity-15"
          style={{
            background:
              "radial-gradient(ellipse,#FF00C8 0%,#00F0FF 60%,transparent 100%)",
          }}
        />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <PageHeading
            eyebrow="⚔️ AI vs Human"
            title="Out-Code the Machine"
            subtitle="Fix AI-generated bad code · 2 rounds · 4 challenges · Scored on improvement delta"
            accent="cyan"
            size="lg"
          />
        </div>
      </section>

      {/* Main card */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-24 flex-1">
        <div
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: "#0d0d14",
            border: "1px solid rgba(0,240,255,0.12)",
          }}
        >
          <div
            className="h-[2px] w-full"
            style={{
              background:
                "linear-gradient(90deg,#00F0FF,#FF00C8,#a855f7,#00F0FF)",
            }}
          />
          <div className="p-6 md:p-8">
            {phase === "battle" && (
              <SessionProgress round={round} challengeIndex={challengeIndex} />
            )}

            <AnimatePresence mode="wait">
              {phase === "intro" && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <IntroScreen
                    onStart={() => setPhase("round-intro")}
                    completedIds={completedIds}
                  />
                </motion.div>
              )}

              {phase === "round-intro" && (
                <motion.div
                  key={`round-intro-${round}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <RoundIntro
                    round={round}
                    onStart={() => setPhase("battle")}
                    completedIds={completedIds}
                  />
                </motion.div>
              )}

              {phase === "battle" && currentChallenge && (
                <motion.div
                  key={`battle-${currentChallenge.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ChallengeView
                    challenge={currentChallenge}
                    onComplete={handleChallengeComplete}
                    roundLabel={`Round ${round} · Challenge ${challengeIndex + 1}`}
                    alreadySolved={completedIds.has(currentChallenge.id)}
                  />
                </motion.div>
              )}

              {phase === "victory" && (
                <motion.div
                  key="victory"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <VictoryScreen
                    totalPoints={totalPoints}
                    scores={allScores}
                    navigate={navigate}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AIvsHuman;
