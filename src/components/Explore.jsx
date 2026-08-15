// src/components/Explore.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import SharedSidebar from "./SharedSidebar";
import { supabase } from "../supabaseClient";
import { fetchDatabaseCategoryCounts } from "../utils/challengeCountHelper";
import { updatePoints } from "../utils/pointsHelper";
import {
  DAILY_WEEKLY_CHALLENGES,
  LIVE_CHALLENGES,
  UPCOMING_CHALLENGES,
  FEATURED_CHALLENGES,
  ARCHIVED_VAULT_CHALLENGES,
} from "../data/exploreChallengesData";
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
  Play,
  Check,
  HelpCircle,
  Activity,
  Archive,
} from "lucide-react";

// ── 4 Existing Core Challenge Categories ──────────────────────────────────────
const CORE_CHALLENGE_TYPES = [
  {
    id: "glitches",
    icon: Zap,
    color: "#00F0FF",
    title: "Code Glitch Challenges",
    badge: "Core Arena",
    badgeColor: "#00F0FF",
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
    badgeColor: "#D600FF",
    desc: "Hone your diagnostics by stepping through complex stack traces, memory leaks, and broken execution logic.",
    path: "/bug-challenges",
    dbKey: "bug-challenges",
  },
  {
    id: "ai-challenges",
    icon: Cpu,
    color: "#FF00C8",
    title: "AI Powered Puzzles",
    badge: "GenAI Evaluation",
    badgeColor: "#FF00C8",
    desc: "Engage with generative AI scenarios designed to test edge cases, prompt fixes, and automated code evaluation.",
    path: "/ai-challenges",
    dbKey: "ai-challenges",
  },
  {
    id: "sparks",
    icon: Sparkles,
    color: "#FFD700",
    title: "Creative Sparks",
    badge: "Design & Logic",
    badgeColor: "#FFD700",
    desc: "Ignite your architectural creativity by designing solutions, UI patterns, and novel fixes that stand out.",
    path: "/sparks",
    dbKey: "sparks",
  },
];

// ── Challenge Solver Modal Component ──────────────────────────────────────────
const ChallengeSolverModal = ({ challenge, user, onClose, onComplete }) => {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSolve = async () => {
    if (!answer.trim()) {
      setError("Please enter your solution or diagnosis.");
      return;
    }
    setSubmitting(true);
    setError("");

    const userId = user?.id;
    const pointsToEarn = Math.min(challenge.points || 40, 100); // Strict <= 100 cap

    if (userId) {
      try {
        // Record in challenge_submissions
        await supabase.from("challenge_submissions").insert([
          {
            user_id: userId,
            challenge_id: challenge.id,
            challenge_type: challenge.type || "explore",
            answer: answer.trim(),
            points_earned: pointsToEarn,
            time_taken_seconds: 45,
          },
        ]);

        // Record points & update unified Uptime streak
        await updatePoints(
          userId,
          pointsToEarn,
          `Solved ${challenge.title} (${challenge.category || "Explore Challenge"})`,
          challenge.type || "explore"
        );
      } catch (e) {
        console.error("Submission error:", e);
      }
    }

    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => {
      onComplete(challenge.id, pointsToEarn);
      onClose();
    }, 1800);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.96 }}
        className="relative w-full max-w-xl bg-[#0d0d16] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden"
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${
              challenge.badgeColor || "#FF00C8"
            }, transparent)`,
          }}
        />

        <div className="flex items-start justify-between mb-4">
          <div>
            <span
              className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border mb-2 inline-block"
              style={{
                background: `${challenge.badgeColor || "#FF00C8"}15`,
                borderColor: `${challenge.badgeColor || "#FF00C8"}30`,
                color: challenge.badgeColor || "#FF00C8",
              }}
            >
              {challenge.category || "Challenge"}
            </span>
            <h2 className="text-lg font-black text-white">{challenge.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={28} className="text-green-400" />
            </div>
            <p className="text-green-400 font-bold text-base mb-1">
              Challenge Completed!
            </p>
            <p className="text-gray-400 text-xs font-mono">
              +{Math.min(challenge.points || 40, 100)} gBits added to your balance & Uptime Streak updated!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-300 text-xs leading-relaxed">
              {challenge.description}
            </p>

            {challenge.codeSnippet && (
              <div className="bg-[#05050a] border border-white/10 rounded-xl p-3.5 font-mono text-xs text-emerald-400 overflow-x-auto">
                <pre>{challenge.codeSnippet}</pre>
              </div>
            )}

            <div>
              <label className="text-xs font-mono text-gray-400 block mb-1.5 font-semibold">
                Your Diagnosis & Fix Solution:
              </label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Explain the bug root cause and your fix..."
                rows={3}
                className="w-full bg-[#05050a] border border-white/10 rounded-xl p-3 text-white text-xs placeholder-gray-600 outline-none focus:border-[#FF00C8]/50 transition font-mono resize-none"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs font-mono bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
                <Award size={13} />
                <span>Reward: +{Math.min(challenge.points || 40, 100)} gBits</span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 text-xs font-semibold hover:bg-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSolve}
                  disabled={submitting || !answer.trim()}
                  className="px-5 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-40 cursor-pointer transition flex items-center gap-1.5"
                  style={{
                    background: "linear-gradient(90deg, #FF00C8, #a855f7)",
                  }}
                >
                  {submitting ? "Submitting..." : "Submit Solution"}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

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

  // Live ticking countdown state (in seconds)
  const [liveSeconds, setLiveSeconds] = useState(145 * 60);
  const [upcomingSeconds, setUpcomingSeconds] = useState(210 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      setUpcomingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours > 0 ? `${hours}h ` : ""}${mins
      .toString()
      .padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
  };

  useEffect(() => {
    const initExplore = async () => {
      setLoading(true);
      const { data: au } = await supabase.auth.getUser();
      const user = au?.user;
      setAuthUser(user);

      if (user?.id) {
        // Fetch user points
        const { data: pts } = await supabase
          .from("user_points")
          .select("points")
          .eq("user_id", user.id)
          .maybeSingle();
        if (pts) setUserPoints(pts.points);

        // Fetch user completions
        const { data: subs } = await supabase
          .from("challenge_submissions")
          .select("challenge_id")
          .eq("user_id", user.id);

        if (subs) {
          setCompletedIds(new Set(subs.map((s) => s.challenge_id)));
        }

        // Fetch reminder preferences from local storage / metadata
        const savedReminders = localStorage.getItem(`glitch_reminders_${user.id}`);
        if (savedReminders) {
          try {
            setReminders(new Set(JSON.parse(savedReminders)));
          } catch (e) {}
        }
      }

      // Fetch dynamic database counts for our 4 core challenge types
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
        JSON.stringify(Array.from(next))
      );
    }
  };

  const handleChallengeCompleted = (id, pointsEarned) => {
    setCompletedIds((prev) => new Set(prev).add(id));
    setUserPoints((prev) => prev + pointsEarned);
    showToast(`🎉 Challenge solved! +${pointsEarned} gBits added & Uptime updated.`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const level = Math.floor(userPoints / 100);

  return (
    <div className="min-h-screen bg-[#070709] text-white">
      <Navbar />
      <div className="flex pt-[18vh]">
        <SharedSidebar user={authUser} xp={userPoints} level={level} />

        <main className="flex-1 min-w-0 p-6 lg:p-8 overflow-y-auto pb-24 md:pb-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF00C8]/10 text-[#FF00C8] border border-[#FF00C8]/30">
                Challenge Discovery Engine
              </span>
            </div>
            <h1 className="text-3xl font-black text-white mb-1">Explore Hub</h1>
            <p className="text-gray-400 text-sm">
              Discover time-bounded battles, daily refreshes, featured picks & core challenges.
            </p>
          </motion.div>

          {/* Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 px-4 py-3 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-mono flex items-center justify-between shadow-lg"
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
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-[#FF00C8]" />
                <h2 className="text-lg font-extrabold text-white">
                  1. Limited-Time & Daily / Weekly Glitches
                </h2>
              </div>
              <span className="text-xs font-mono text-gray-500">
                Single Unified Uptime System ⚡
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DAILY_WEEKLY_CHALLENGES.map((item) => {
                const isCompleted = completedIds.has(item.id);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden bg-[#0f0f18] border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-white/20 transition-all shadow-xl group"
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-[2px]"
                      style={{ background: item.badgeColor }}
                    />

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border"
                          style={{
                            background: `${item.badgeColor}15`,
                            borderColor: `${item.badgeColor}30`,
                            color: item.badgeColor,
                          }}
                        >
                          {item.category}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 font-bold">
                          <Award size={12} />
                          <span>+{Math.min(item.points, 100)} gBits</span>
                        </div>
                      </div>

                      <h3 className="font-bold text-white text-sm mb-1.5 group-hover:text-[#00F0FF] transition">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-400 mb-4 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-gray-500 flex items-center gap-1">
                        <Clock size={12} /> {item.refreshText}
                      </span>

                      {isCompleted ? (
                        <span className="flex items-center gap-1 text-xs font-mono text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-xl">
                          <Check size={13} /> Completed
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveSolverChallenge(item)}
                          className="flex items-center gap-1 text-xs font-bold text-white px-3.5 py-1.5 rounded-xl cursor-pointer transition hover:scale-105"
                          style={{
                            background: `linear-gradient(90deg, ${item.badgeColor}, #a855f7)`,
                          }}
                        >
                          Solve <ChevronRight size={13} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────────
              SECTION 2: LIVE CHALLENGES & UPCOMING CHALLENGES
          ───────────────────────────────────────────────────────────────── */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={18} className="text-[#00F0FF]" />
              <h2 className="text-lg font-extrabold text-white">
                2. Live Challenges & Upcoming Battles
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Live Challenges Column */}
              <div className="bg-[#0b0b12] border border-red-500/20 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4 border-b border-red-500/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                    </span>
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                      Live Challenges (Active Now)
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-red-400 font-bold">
                    {formatTimer(liveSeconds)}
                  </span>
                </div>

                <div className="space-y-3">
                  {LIVE_CHALLENGES.map((ch) => {
                    const isDone = completedIds.has(ch.id);
                    return (
                      <div
                        key={ch.id}
                        className="bg-[#12121e] border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-red-500/30 transition"
                      >
                        <div className="min-w-0 mr-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md font-bold">
                              LIVE NOW
                            </span>
                            <span className="text-xs font-mono text-amber-400 font-semibold">
                              +{Math.min(ch.points, 100)} gBits
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white truncate">
                            {ch.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {ch.participants} participants battling
                          </p>
                        </div>

                        {isDone ? (
                          <span className="text-xs font-mono text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-xl shrink-0">
                            Done ✓
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveSolverChallenge(ch)}
                            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shrink-0 cursor-pointer transition shadow-lg shadow-red-500/20"
                          >
                            Attempt
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming Challenges Column */}
              <div className="bg-[#0b0b12] border border-[#38BDF8]/20 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4 border-b border-[#38BDF8]/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[#38BDF8]" />
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                      Upcoming Challenges (Opening Soon)
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-[#38BDF8] font-bold">
                    Opens in {formatTimer(upcomingSeconds)}
                  </span>
                </div>

                <div className="space-y-3">
                  {UPCOMING_CHALLENGES.map((ch) => {
                    const isSet = reminders.has(ch.id);
                    return (
                      <div
                        key={ch.id}
                        className="bg-[#12121e] border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-[#38BDF8]/30 transition"
                      >
                        <div className="min-w-0 mr-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-2 py-0.5 rounded-md font-bold">
                              UPCOMING
                            </span>
                            <span className="text-xs font-mono text-amber-400 font-semibold">
                              +{Math.min(ch.points, 100)} gBits
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white truncate">
                            {ch.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {ch.language} · Difficulty: {ch.difficulty}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleReminder(ch.id, ch.title)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 cursor-pointer transition border ${
                            isSet
                              ? "bg-[#38BDF8]/20 border-[#38BDF8]/40 text-[#38BDF8]"
                              : "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          {isSet ? (
                            <>
                              <Check size={13} /> Saved
                            </>
                          ) : (
                            <>
                              <Bell size={13} /> Remind Me
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────────
              SECTION 3: FEATURED & EDITOR'S CHOICE
          ───────────────────────────────────────────────────────────────── */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#A855F7]" />
                <h2 className="text-lg font-extrabold text-white">
                  3. Featured & Editor's Choice
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {FEATURED_CHALLENGES.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#0f0f18] border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-[#A855F7]/40 transition-all shadow-xl group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border"
                        style={{
                          background: `${item.badgeColor}15`,
                          borderColor: `${item.badgeColor}30`,
                          color: item.badgeColor,
                        }}
                      >
                        {item.badge}
                      </span>
                      <span className="text-xs font-mono text-amber-400 font-bold">
                        +{Math.min(item.points, 100)} gBits
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-sm mb-1.5 group-hover:text-[#A855F7] transition">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-gray-500">
                      {item.language}
                    </span>
                    <Link
                      to={item.path || "/glitches"}
                      className="flex items-center gap-1 text-xs font-bold text-[#A855F7] hover:underline"
                    >
                      Solve <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────────
              SECTION 4: OUR 4 EXISTING CHALLENGE TYPES
          ───────────────────────────────────────────────────────────────── */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-[#00F0FF]" />
                <h2 className="text-lg font-extrabold text-white">
                  4. Core Challenge Categories
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CORE_CHALLENGE_TYPES.map((cat) => {
                const Icon = cat.icon;
                const count = categoryCounts[cat.dbKey] || "20+";
                return (
                  <Link
                    key={cat.id}
                    to={cat.path}
                    className="no-underline group bg-[#0f0f18] border border-white/10 hover:border-white/20 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 shadow-xl"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{
                            background: `${cat.color}15`,
                            border: `1px solid ${cat.color}30`,
                          }}
                        >
                          <Icon size={20} style={{ color: cat.color }} />
                        </div>
                        <span className="text-xs font-mono text-gray-500 font-semibold">
                          {count} Puzzles
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-base mb-1 group-hover:text-[#00F0FF] transition">
                        {cat.title}
                      </h3>
                      <p className="text-xs text-gray-400 leading-relaxed mb-4">
                        {cat.desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
                        style={{
                          background: `${cat.color}10`,
                          borderColor: `${cat.color}25`,
                          color: cat.color,
                        }}
                      >
                        {cat.badge}
                      </span>
                      <span className="text-xs font-bold text-gray-300 group-hover:text-white flex items-center gap-1">
                        Enter <ChevronRight size={13} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────────
              SECTION 5: PAST CHALLENGES / VAULT (ARCHIVED)
          ───────────────────────────────────────────────────────────────── */}
          <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Archive size={18} className="text-gray-400" />
                <h2 className="text-lg font-extrabold text-white">
                  5. Past Challenges & Vault Archive
                </h2>
              </div>
              <span className="text-xs font-mono text-gray-500">
                Reference & Hall of Fame Solutions
              </span>
            </div>

            <div className="bg-[#0b0b12] border border-white/10 rounded-2xl p-5 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ARCHIVED_VAULT_CHALLENGES.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#12121e] border border-white/5 rounded-xl p-4 flex flex-col justify-between opacity-80 hover:opacity-100 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-md">
                          {item.date}
                        </span>
                        <span className="text-xs font-mono text-emerald-400 font-semibold">
                          +{Math.min(item.rewardClaimed, 100)} gBits
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Completed by {item.completedBy} developers
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/5 mt-3 flex items-center justify-between text-xs font-mono text-gray-400">
                      <span>Top Fix: @{item.winner}</span>
                      <span className="text-gray-500">Archived ✓</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
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
