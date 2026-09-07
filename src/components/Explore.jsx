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
import { updatePoints } from "../utils/pointsHelper";
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
    const pointsToEarn = Math.min(challenge.points || 40, 100);

    if (userId) {
      try {
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

        await updatePoints(
          userId,
          pointsToEarn,
          `Solved ${challenge.title} (${challenge.category || "Explore Challenge"})`,
          challenge.type || "explore",
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
        initial={{ opacity: 0, y: 25, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15, scale: 0.96 }}
        className="relative w-full max-w-xl bg-[#0d0d16] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300 mb-2 inline-block">
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
              <GBitIcon className="w-3.5 h-3.5 inline mr-1 text-[#00F0FF]" />+
              {Math.min(challenge.points || 40, 100)} gBits added to your
              balance & Uptime Streak updated!
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
                className="w-full bg-[#05050a] border border-white/10 rounded-xl p-3 text-white text-xs placeholder-gray-600 outline-none focus:border-[#00F0FF]/50 transition font-mono resize-none"
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
                <span>
                  Reward:{" "}
                  <GBitIcon className="w-3.5 h-3.5 inline mr-1 text-[#00F0FF]" />
                  +{Math.min(challenge.points || 40, 100)} gBits
                </span>
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
                    background: "linear-gradient(90deg, #00F0FF, #a855f7)",
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
  <div className="bg-[#07070d] border border-white/5 rounded-xl p-5 flex items-center justify-between hover:border-white/15 transition">
    <div className="min-w-0 mr-4">
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <span
          className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md"
          style={{
            color: accent,
            background: `${accent}15`,
            border: `1px solid ${accent}30`,
          }}
        >
          {item.category}
        </span>
        <span className="text-xs font-mono text-amber-400 font-semibold">
          <GBitIcon className="w-3.5 h-3.5 inline mr-1 text-[#00F0FF]" />+
          {Math.min(item.points, 100)} gBits
        </span>
      </div>
      <h4 className="text-base font-bold text-white truncate mb-1">
        {item.title}
      </h4>
      <p className="text-xs text-gray-400 mb-1.5">{item.description}</p>
      <span className="text-[11px] font-mono text-gray-500 flex items-center gap-1.5">
        <Clock size={12} /> {item.refreshText}
      </span>
    </div>

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
          solution: x.solution,
          start_time: x.start_time,
          end_time: x.end_time,
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
                          className="bg-[#07070d] border border-white/5 rounded-xl p-5 flex items-center justify-between hover:border-white/15 transition"
                        >
                          <div className="min-w-0 mr-4">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-[10px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-md font-bold">
                                LIVE NOW
                              </span>
                              <span className="text-xs font-mono text-amber-400 font-semibold">
                                <GBitIcon className="w-3.5 h-3.5 inline mr-1 text-[#00F0FF]" />
                                +{Math.min(ch.points, 100)} gBits
                              </span>
                              {ch.end_time && (
                                <span className="text-[10px] font-mono text-red-300">
                                  Ends in {formatTimer(remaining)}
                                </span>
                              )}
                            </div>
                            <h4 className="text-base font-bold text-white truncate mb-1">
                              {ch.title}
                            </h4>
                            <p className="text-xs text-gray-400">
                              {ch.description}
                            </p>
                          </div>

                          {isDone ? (
                            <span className="text-xs font-mono text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl shrink-0">
                              Done ✓
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveSolverChallenge(ch)}
                              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shrink-0 cursor-pointer transition shadow-lg"
                            >
                              Attempt
                            </button>
                          )}
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
                          className="bg-[#07070d] border border-white/5 rounded-xl p-5 flex items-center justify-between hover:border-white/15 transition"
                        >
                          <div className="min-w-0 mr-4">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-[10px] font-mono text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-2.5 py-0.5 rounded-md font-bold">
                                UPCOMING
                              </span>
                              <span className="text-xs font-mono text-amber-400 font-semibold">
                                <GBitIcon className="w-3.5 h-3.5 inline mr-1 text-[#00F0FF]" />
                                +{Math.min(ch.points, 100)} gBits
                              </span>
                              {ch.start_time && (
                                <span className="text-[10px] font-mono text-[#38BDF8]">
                                  Opens in {formatTimer(untilStart)}
                                </span>
                              )}
                            </div>
                            <h4 className="text-base font-bold text-white truncate mb-1">
                              {ch.title}
                            </h4>
                            <p className="text-xs text-gray-400">
                              {ch.description}
                            </p>
                          </div>

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
                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="bg-[#0f0f18] border border-white/10 hover:border-white/25 rounded-2xl p-6 flex flex-col justify-between transition-all shadow-xl group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-mono font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
                            {item.badge}
                          </span>
                          <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                            <GBitIcon className="w-3.5 h-3.5 inline mr-1 text-[#00F0FF]" />
                            +{Math.min(item.points, 100)} gBits
                          </span>
                        </div>

                        <h3 className="font-bold text-white text-base mb-2 group-hover:text-[#A855F7] transition">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-xs font-mono text-gray-400">
                          {item.language}
                        </span>
                        {isCompleted ? (
                          <span className="flex items-center gap-1 text-xs font-mono text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-3.5 py-1.5 rounded-xl">
                            <Check size={14} /> Completed
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveSolverChallenge(item)}
                            className="flex items-center gap-1.5 text-xs font-bold text-[#A855F7] hover:underline cursor-pointer"
                          >
                            Solve <ArrowUpRight size={14} />
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {archivedItems.map((item) => (
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
