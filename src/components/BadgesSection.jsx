// src/components/BadgesSection.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { MASTER_BADGES, RARITY_THEMES } from "../data/badgesMaster";
import { checkAndAwardBadges } from "../utils/badgeEngine";
import { X, Lock, CheckCircle2, Trophy, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";

export default function BadgesSection({ userId }) {
  const [earnedMap, setEarnedMap] = useState({}); // badgeId -> earned_at
  const [userStats, setUserStats] = useState({
    xp: 0,
    streak: 0,
    totalSubmissions: 0,
    glitchCount: 0,
    bugCount: 0,
    aiCount: 0,
    sparkCount: 0,
    arenaCount: 0,
    postCount: 0,
    commentCount: 0,
    roomCount: 0,
    referralCount: 0,
    profileComplete: false,
    nightOwl: false,
    speedDemon: false,
    dailyFact: false,
  });

  const [rarityFilter, setRarityFilter] = useState("all");
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBadgeData = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userId || userData?.user?.id;
    if (!uid) {
      setLoading(false);
      return;
    }

    // Run automatic badge check first so newly met conditions unlock!
    await checkAndAwardBadges(uid).catch(() => {});

    // Fetch earned badges & user activity metrics in parallel
    const [
      { data: earned },
      { data: pts },
      { data: activities },
      { data: submissions },
      { data: profile },
      { data: posts },
      { data: comments },
      { data: rooms },
      { data: referrals },
    ] = await Promise.all([
      supabase.from("user_badges").select("badge_id, earned_at").eq("user_id", uid),
      supabase.from("user_points").select("points").eq("user_id", uid).maybeSingle(),
      supabase.from("glitch_activity").select("created_at, title, type, points").eq("user_id", uid),
      supabase.from("challenge_submissions").select("challenge_type, created_at").eq("user_id", uid),
      supabase.from("profiles").select("username, bio, avatar_url, points").eq("id", uid).maybeSingle(),
      supabase.from("community_posts").select("id", { count: "exact", head: true }).eq("user_id", uid),
      supabase.from("community_comments").select("id", { count: "exact", head: true }).eq("user_id", uid),
      supabase.from("rooms").select("id", { count: "exact", head: true }).eq("created_by", uid),
      supabase.from("user_referrals").select("id", { count: "exact", head: true }).eq("referrer_id", uid).eq("status", "completed"),
    ]);

    // Build earned map
    const map = {};
    (earned || []).forEach((e) => {
      map[e.badge_id] = e.earned_at;
    });

    // Calculate metrics for live progress bars
    const subs = submissions || [];
    const acts = activities || [];

    const actSubmissions = acts.filter(
      (a) =>
        a.type === "submission" ||
        a.type === "glitch" ||
        (a.title || "").includes("Solved") ||
        (a.title || "").includes("Challenge") ||
        (a.points || 0) > 0
    );

    const totalSubmissions = Math.max(subs.length, actSubmissions.length);

    const glitchCount = Math.max(
      subs.filter((s) => s.challenge_type === "glitch").length,
      acts.filter((a) => (a.title || "").toLowerCase().includes("glitch")).length,
      totalSubmissions > 0 ? 1 : 0
    );
    const bugCount = Math.max(
      subs.filter((s) => s.challenge_type === "bug").length,
      acts.filter((a) => (a.title || "").toLowerCase().includes("bug")).length
    );
    const aiCount = Math.max(
      subs.filter((s) => s.challenge_type === "ai").length,
      acts.filter((a) => (a.title || "").toLowerCase().includes("ai")).length
    );
    const sparkCount = Math.max(
      subs.filter((s) => s.challenge_type === "spark").length,
      acts.filter((a) => (a.title || "").toLowerCase().includes("spark")).length
    );
    const arenaCount = acts.filter((a) => (a.title || "").includes("Arena")).length;

    const isNightOwl = acts.some((a) => {
      const h = new Date(a.created_at).getHours();
      return h >= 0 && h < 4;
    });
    const hasSpeedDemon = acts.some((a) => (a.title || "").includes("Speed Demon"));
    const hasDailyFact = acts.some((a) => (a.title || "").includes("Daily Fact"));

    // Calculate Uptime Streak
    const toKey = (d) => {
      const date = new Date(d);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    };
    const days = new Set(acts.map((a) => toKey(a.created_at)));
    let streak = 0;
    const curDate = new Date();
    curDate.setHours(0, 0, 0, 0);
    if (!days.has(toKey(curDate))) curDate.setDate(curDate.getDate() - 1);
    while (days.has(toKey(curDate))) {
      streak++;
      curDate.setDate(curDate.getDate() - 1);
    }

    const calculatedXP = Math.max(pts?.points || 0, profile?.points || 0);

    setUserStats({
      xp: calculatedXP,
      streak,
      totalSubmissions,
      glitchCount,
      bugCount,
      aiCount,
      sparkCount,
      arenaCount,
      postCount: posts?.count || 0,
      commentCount: comments?.count || 0,
      roomCount: rooms?.count || 0,
      referralCount: referrals?.count || 0,
      profileComplete: !!(profile?.username?.trim() && profile?.bio?.trim() && profile?.avatar_url?.trim()),
      nightOwl: isNightOwl,
      speedDemon: hasSpeedDemon,
      dailyFact: hasDailyFact,
    });

    setEarnedMap(map);
    setLoading(false);
  };

  useEffect(() => {
    fetchBadgeData();
  }, [userId]);

  // Helper to calculate numerical progress for any badge
  const getBadgeProgress = (badge) => {
    if (!badge.metricKey) return { current: 0, target: badge.target || 1, percent: 0 };

    let current = 0;
    if (badge.metricKey === "profileComplete") current = userStats.profileComplete ? 1 : 0;
    else if (badge.metricKey === "nightOwl") current = userStats.nightOwl ? 1 : 0;
    else if (badge.metricKey === "speedDemon") current = userStats.speedDemon ? 1 : 0;
    else if (badge.metricKey === "dailyFact") current = userStats.dailyFact ? 1 : 0;
    else current = userStats[badge.metricKey] || 0;

    const target = badge.target || 1;
    const percent = Math.min(100, Math.round((current / target) * 100));
    return { current, target, percent };
  };

  const isBadgeUnlocked = (b) => {
    if (earnedMap[b.id]) return true;
    const prog = getBadgeProgress(b);
    return prog.percent >= 100;
  };

  // Filter badges by Rarity
  const filteredBadges = MASTER_BADGES.filter((b) => {
    if (rarityFilter !== "all" && b.rarity !== rarityFilter) return false;
    return true;
  });

  const earnedBadgesList = filteredBadges.filter(isBadgeUnlocked);
  const lockedBadgesList = filteredBadges.filter((b) => !isBadgeUnlocked(b));

  const totalUnlockedCount = MASTER_BADGES.filter(isBadgeUnlocked).length;
  const totalBadgesCount = MASTER_BADGES.length;
  const overallPercent = Math.round((totalUnlockedCount / totalBadgesCount) * 100);

  if (loading) {
    return (
      <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-t-transparent border-[#FF00C8] rounded-full animate-spin" />
        <p className="text-xs font-mono text-gray-500">Scanning neural badges system...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Top Overview Bar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#07070c] border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-[#FFD700]" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Badges Progress
            </h3>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            {totalUnlockedCount} of {totalBadgesCount} Unlocked ({overallPercent}%)
          </p>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full sm:w-64">
          <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-[#FF00C8] via-[#00F0FF] to-[#22c55e]"
            />
          </div>
        </div>
      </div>

      {/* ── Rarity Filter Bar (ALL, COMMON, RARE, EPIC, LEGENDARY) ── */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setRarityFilter("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border ${
            rarityFilter === "all"
              ? "bg-[#FF00C8] text-white border-[#FF00C8] shadow-[0_0_12px_rgba(255,0,200,0.3)]"
              : "bg-white/5 text-gray-400 border-white/10 hover:text-white"
          }`}
        >
          ALL ({MASTER_BADGES.length})
        </button>

        {Object.entries(RARITY_THEMES).map(([key, theme]) => {
          const count = MASTER_BADGES.filter((b) => b.rarity === key).length;
          const active = rarityFilter === key;

          return (
            <button
              key={key}
              onClick={() => setRarityFilter(key)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border"
              style={{
                background: active ? theme.bg : "rgba(255,255,255,0.03)",
                borderColor: active ? theme.color : "rgba(255,255,255,0.08)",
                color: active ? theme.color : "#9ca3af",
                boxShadow: active ? `0 0 12px ${theme.glow}` : "none",
              }}
            >
              {theme.label} ({count})
            </button>
          );
        })}
      </div>

      {/* ── SECTION 1: EARNED BADGES SHOWCASE (TOP) ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} className="text-[#22c55e]" />
          <h4 className="text-xs font-bold text-white uppercase tracking-widest">
            Earned Badges ({earnedBadgesList.length})
          </h4>
        </div>

        {earnedBadgesList.length === 0 ? (
          <div className="p-6 text-center bg-[#0d0d14] border border-white/10 rounded-2xl">
            <AlertCircle className="mx-auto text-gray-500 mb-2" size={24} />
            <p className="text-xs text-gray-400 font-mono">No badges earned in this category yet.</p>
            <p className="text-[11px] text-gray-600 mt-1">Complete glitch challenges and daily streaks to earn badges!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {earnedBadgesList.map((badge) => {
              const theme = RARITY_THEMES[badge.rarity] || RARITY_THEMES.common;
              const Icon = badge.icon || Zap;
              const earnedAt = earnedMap[badge.id];

              return (
                <motion.div
                  key={badge.id}
                  whileHover={{ y: -4, scale: 1.02 }}
                  onClick={() => setSelectedBadge(badge)}
                  className="relative p-4 rounded-2xl bg-[#0d0d14] border flex flex-col items-center text-center cursor-pointer transition-all shadow-lg overflow-hidden group"
                  style={{
                    borderColor: theme.border,
                    boxShadow: `0 0 18px ${theme.glow}`,
                  }}
                >
                  {/* Top neon indicator line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ background: theme.color }}
                  />

                  {/* Icon Ring */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 mt-1 transition-transform group-hover:scale-110"
                    style={{
                      background: theme.bg,
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <Icon size={22} style={{ color: theme.color }} />
                  </div>

                  <p className="text-xs font-bold text-white mb-1 line-clamp-1">
                    {badge.title}
                  </p>

                  <span
                    className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 font-mono"
                    style={{
                      color: theme.color,
                      background: theme.bg,
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    {theme.label}
                  </span>

                  <span className="text-[9px] font-mono text-[#22c55e] flex items-center gap-1 mt-auto">
                    <CheckCircle2 size={10} /> UNLOCKED
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SECTION 2: ALL AVAILABLE COLLECTION (LOCKED BELOW) ── */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Lock size={16} className="text-gray-500" />
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Locked Badges Collection ({lockedBadgesList.length})
          </h4>
        </div>

        {lockedBadgesList.length === 0 ? (
          <div className="p-6 text-center bg-[#0d0d14] border border-white/10 rounded-2xl">
            <Sparkles className="mx-auto text-[#FFD700] mb-2" size={24} />
            <p className="text-xs text-white font-bold">Incredible! All badges in this tier unlocked!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {lockedBadgesList.map((badge) => {
              const theme = RARITY_THEMES[badge.rarity] || RARITY_THEMES.common;
              const Icon = badge.icon || Zap;
              const prog = getBadgeProgress(badge);

              return (
                <motion.div
                  key={badge.id}
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedBadge(badge)}
                  className="relative p-4 rounded-2xl bg-[#09090d]/80 border border-white/5 flex flex-col items-center text-center cursor-pointer transition-all opacity-70 hover:opacity-100 hover:border-white/20 overflow-hidden"
                >
                  {/* Lock Overlay Badge */}
                  <div className="absolute top-2.5 right-2.5 text-gray-500">
                    <Lock size={12} />
                  </div>

                  {/* Monochromatic Icon */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 mb-3 mt-1 text-gray-400">
                    <Icon size={20} />
                  </div>

                  <p className="text-xs font-bold text-gray-300 mb-1 line-clamp-1">
                    {badge.title}
                  </p>

                  <span
                    className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-3 font-mono opacity-80"
                    style={{
                      color: theme.color,
                      background: theme.bg,
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    {theme.label}
                  </span>

                  {/* Progress bar inside card */}
                  <div className="w-full mt-auto">
                    <div className="flex justify-between items-center text-[9px] font-mono text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>
                        {prog.current}/{prog.target}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gray-500"
                        style={{ width: `${prog.percent}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── INTERACTIVE BADGE INSPECTION MODAL ── */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0d0d14] border rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
              style={{
                borderColor: (RARITY_THEMES[selectedBadge.rarity] || RARITY_THEMES.common).border,
                boxShadow: `0 0 30px ${(RARITY_THEMES[selectedBadge.rarity] || RARITY_THEMES.common).glow}`,
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer"
              >
                <X size={16} />
              </button>

              {/* Rarity Aura Seal Header */}
              {(() => {
                const theme = RARITY_THEMES[selectedBadge.rarity] || RARITY_THEMES.common;
                const Icon = selectedBadge.icon || Zap;
                const isEarned = !!earnedMap[selectedBadge.id];
                const prog = getBadgeProgress(selectedBadge);
                const dateStr = earnedMap[selectedBadge.id]
                  ? new Date(earnedMap[selectedBadge.id]).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : null;

                return (
                  <div className="flex flex-col items-center text-center">
                    {/* Glowing Vector Badge Emblem */}
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 relative shadow-xl"
                      style={{
                        background: theme.bg,
                        border: `2px solid ${theme.color}`,
                        boxShadow: `0 0 25px ${theme.glow}`,
                      }}
                    >
                      <Icon size={38} style={{ color: theme.color }} />
                    </div>

                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full font-mono"
                        style={{
                          color: theme.color,
                          background: theme.bg,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        {theme.label}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                        {selectedBadge.category}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-white mb-2">
                      {selectedBadge.title}
                    </h3>

                    <p className="text-xs text-gray-300 mb-4 leading-relaxed font-sans px-2">
                      {selectedBadge.description}
                    </p>

                    {/* Exact Unlock Condition / Rule */}
                    <div className="w-full bg-[#07070c] border border-white/10 rounded-2xl p-4 mb-4 text-left">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1.5 font-mono">
                        <Sparkles size={11} className="text-[#00F0FF]" /> Exact Unlock Rule
                      </p>
                      <p className="text-xs font-mono text-[#00F0FF]">
                        {selectedBadge.rule}
                      </p>
                    </div>

                    {/* Progress Bar & Status */}
                    <div className="w-full bg-[#07070c] border border-white/10 rounded-2xl p-4 text-left space-y-2 mb-5">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-gray-400">Unlock Progress</span>
                        <span className="text-white font-bold">
                          {isEarned ? `${selectedBadge.target}/${selectedBadge.target}` : `${prog.current}/${prog.target}`} ({isEarned ? 100 : prog.percent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${isEarned ? 100 : prog.percent}%`,
                            background: isEarned ? "#22c55e" : theme.color,
                          }}
                        />
                      </div>
                      {isEarned ? (
                        <p className="text-[10px] font-mono text-[#22c55e] flex items-center gap-1 pt-1">
                          <CheckCircle2 size={11} /> Unlocked on {dateStr || "Record"}
                        </p>
                      ) : (
                        <p className="text-[10px] font-mono text-gray-500 flex items-center gap-1 pt-1">
                          <Lock size={11} /> Locked — Complete rule above to unlock automatically.
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedBadge(null)}
                      className="w-full py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition cursor-pointer"
                    >
                      Close Inspection
                    </button>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
