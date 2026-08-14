import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PageHeading from "./PageHeading";
import GlitchBackground from "./GlitchBackground";
import { supabase } from "../supabaseClient";
import { FaMedal, FaCrown, FaBolt, FaFire } from "react-icons/fa";
import { FiClock, FiZap, FiAward, FiUsers } from "react-icons/fi";

// ── helpers ──────────────────────────────────────────────────────────────────

const getRangeFilter = (filter) => {
  const now = new Date();
  if (filter === "daily") {
    return now.toISOString().split("T")[0];
  }
  if (filter === "weekly") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  }
  return null;
};

const rankColor = (rank) => {
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-gray-300";
  if (rank === 3) return "text-amber-600";
  return "text-gray-600";
};

const rankBg = (rank) => {
  if (rank === 1) return "bg-yellow-400/10 border-yellow-400/30";
  if (rank === 2) return "bg-gray-300/5 border-gray-300/20";
  if (rank === 3) return "bg-amber-600/10 border-amber-600/25";
  return "bg-[#0f0f1a] border-white/5";
};

const rankIcon = (rank) => {
  if (rank === 1) return <FaCrown className="text-yellow-400 text-base" />;
  if (rank === 2) return <FaMedal className="text-gray-300 text-base" />;
  if (rank === 3) return <FaMedal className="text-amber-600 text-base" />;
  return (
    <span className="text-gray-600 font-bold text-sm font-mono">#{rank}</span>
  );
};

// ── Terminal window chrome ───────────────────────────────────────────────────
const TerminalWindow = ({
  title,
  accent = "#00F0FF",
  children,
  className = "",
}) => (
  <div
    className={`rounded-2xl overflow-hidden bg-[#0f0f13] border border-white/5 ${className}`}
  >
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-[#0a0a0d]">
      <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
      <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
      <span
        className="ml-2 text-[10px] font-mono tracking-wide"
        style={{ color: accent }}
      >
        {title}
      </span>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const PromptLabel = ({ icon: Icon, children, color = "#00F0FF" }) => (
  <div className="flex items-center gap-2 mb-4">
    {Icon && <Icon size={12} style={{ color }} />}
    <p
      className="text-[10px] font-mono uppercase tracking-widest font-semibold"
      style={{ color }}
    >
      <span className="text-gray-600">$ </span>
      {children}
    </p>
  </div>
);

// ── Top 3 Podium (Live Rankings tab) ──────────────────────────────────────────
const Podium = ({ top3 }) => {
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heights = ["h-24", "h-32", "h-20"];
  const labels = ["2nd", "1st", "3rd"];
  const colors = [
    "from-gray-400 to-gray-500",
    "from-yellow-400 to-amber-500",
    "from-amber-600 to-orange-700",
  ];
  const glows = [
    "shadow-[0_0_20px_rgba(180,180,180,0.2)]",
    "shadow-[0_0_30px_rgba(255,210,0,0.3)]",
    "shadow-[0_0_20px_rgba(200,100,50,0.2)]",
  ];

  return (
    <div className="flex items-end justify-center gap-4 mb-16">
      {order.map((entry, i) => (
        <div key={entry.user_id} className="flex flex-col items-center gap-3">
          <div className="relative">
            <img
              src={
                entry.avatar_url ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${entry.username}`
              }
              alt={entry.username}
              className={`w-14 h-14 rounded-full border-2 object-cover ${
                i === 1
                  ? "border-yellow-400 ring-2 ring-yellow-400/30"
                  : "border-white/20"
              }`}
            />
            {i === 1 && (
              <FaCrown className="absolute -top-4 left-1/2 -translate-x-1/2 text-yellow-400 text-xl" />
            )}
          </div>

          <div className="text-center">
            <p className="text-white text-xs font-bold truncate max-w-[80px] font-mono">
              {entry.username}
            </p>
            <p className="text-cyan-400 text-xs font-semibold mt-0.5 font-mono">
              {entry.total_score} gBits
            </p>
          </div>

          <div
            className={`w-20 ${heights[i]} bg-gradient-to-t ${colors[i]} rounded-t-xl flex items-start justify-center pt-2 ${glows[i]}`}
          >
            <span className="text-white/80 text-xs font-bold font-mono">
              {labels[i]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Rank Badge (Legends tab) ──────────────────────────────────────────────────
const RankBadge = ({ rank }) => {
  if (rank === 1)
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
        style={{
          background: "linear-gradient(135deg,#FFD700,#FFA500)",
          boxShadow: "0 0 12px rgba(255,215,0,0.4)",
        }}
      >
        <FaCrown style={{ color: "#7a4a00" }} />
      </div>
    );
  if (rank === 2)
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
        style={{
          background: "linear-gradient(135deg,#C0C0C0,#A8A8A8)",
          boxShadow: "0 0 10px rgba(192,192,192,0.3)",
        }}
      >
        <FaMedal style={{ color: "#4a4a4a" }} />
      </div>
    );
  if (rank === 3)
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
        style={{
          background: "linear-gradient(135deg,#CD7F32,#A0522D)",
          boxShadow: "0 0 10px rgba(205,127,50,0.3)",
        }}
      >
        <FaMedal style={{ color: "#3a1a00" }} />
      </div>
    );
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-gray-500 font-mono"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {rank}
    </div>
  );
};

const Avatar = ({ url, name, size = 10 }) => {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return url ? (
    <img
      src={url}
      alt={name}
      className={`w-${size} h-${size} rounded-full object-cover`}
      style={{ border: "2px solid rgba(255,255,255,0.08)" }}
    />
  ) : (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-xs font-black`}
      style={{
        background: "linear-gradient(135deg,#00F0FF22,#FF00C822)",
        border: "2px solid rgba(255,255,255,0.08)",
        color: "#00F0FF",
      }}
    >
      {initials}
    </div>
  );
};

const LegendsPodium = ({ entries }) => {
  if (!entries || entries.length < 1) return null;
  const [first, second, third] = entries;

  const PodiumCard = ({ entry, rank, height, delay }) => {
    if (!entry) return <div className="flex-1" />;
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="flex-1 flex flex-col items-center"
      >
        <Avatar
          url={entry.avatar_url}
          name={entry.full_name || entry.username}
          size={rank === 1 ? 14 : 10}
        />
        <p className="text-white font-bold text-sm mt-2 text-center truncate w-full px-1">
          {entry.full_name || entry.username || "Anonymous"}
        </p>
        <p className="text-gray-500 text-xs mb-3 font-mono">
          {entry.username ? `@${entry.username}` : ""}
        </p>

        <div
          className={`w-full rounded-t-2xl flex flex-col items-center justify-center p-4`}
          style={{
            height,
            background:
              rank === 1
                ? "linear-gradient(180deg,rgba(255,215,0,0.15),rgba(255,165,0,0.05))"
                : rank === 2
                  ? "linear-gradient(180deg,rgba(192,192,192,0.12),rgba(192,192,192,0.03))"
                  : "linear-gradient(180deg,rgba(205,127,50,0.12),rgba(205,127,50,0.03))",
            border: "1px solid",
            borderColor:
              rank === 1
                ? "rgba(255,215,0,0.25)"
                : rank === 2
                  ? "rgba(192,192,192,0.2)"
                  : "rgba(205,127,50,0.2)",
            borderBottom: "none",
          }}
        >
          <RankBadge rank={rank} />
          <span
            className="text-lg font-black mt-1 font-mono"
            style={{
              background:
                rank === 1
                  ? "linear-gradient(90deg,#FFD700,#FFA500)"
                  : rank === 2
                    ? "linear-gradient(90deg,#C0C0C0,#A8A8A8)"
                    : "linear-gradient(90deg,#CD7F32,#A0522D)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {entry.total_score || entry.completions || 0}
          </span>
          <span className="text-[10px] text-gray-600 uppercase tracking-wider font-mono">
            gBits
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex items-end gap-2 mb-12 px-4 max-w-lg mx-auto">
      <PodiumCard entry={second} rank={2} height="100px" delay={0.2} />
      <PodiumCard entry={first} rank={1} height="140px" delay={0.1} />
      <PodiumCard entry={third} rank={3} height="80px" delay={0.3} />
    </div>
  );
};

const LegendRow = ({ entry, rank, index, metric, metricLabel }) => {
  const isTop3 = rank <= 3;
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="flex items-center gap-4 p-4 rounded-2xl transition-all group"
      style={{
        background: isTop3
          ? "rgba(255,255,255,0.04)"
          : "rgba(255,255,255,0.02)",
        border: `1px solid ${isTop3 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`,
      }}
    >
      <RankBadge rank={rank} />
      <Avatar
        url={entry.avatar_url}
        name={entry.full_name || entry.username}
        size={9}
      />
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm truncate">
          {entry.full_name || entry.username || "Anonymous"}
        </p>
        {entry.username && (
          <p className="text-gray-600 text-xs font-mono">@{entry.username}</p>
        )}
      </div>

      <div className="text-right shrink-0">
        <p
          className="text-base font-black font-mono"
          style={{
            background: "linear-gradient(90deg,#00F0FF,#FF00C8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {entry[metric] || 0}
        </p>
        <p className="text-gray-600 text-[10px] uppercase tracking-wider font-mono">
          {metricLabel}
        </p>
      </div>
    </motion.div>
  );
};

const EmptyState = ({ message }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="text-center py-16"
  >
    <div className="text-5xl mb-4">🏜️</div>
    <p className="text-gray-500 text-sm font-mono">{message}</p>
    <p className="text-gray-700 text-xs mt-1 font-mono">
      Be the first to make it here.
    </p>
  </motion.div>
);

const SkeletonRow = ({ i }) => (
  <div
    key={i}
    className="flex items-center gap-4 p-4 rounded-2xl animate-pulse"
    style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.04)",
    }}
  >
    <div className="w-8 h-8 rounded-full bg-white/5" />
    <div className="w-9 h-9 rounded-full bg-white/5" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-white/5 rounded w-1/3" />
      <div className="h-2 bg-white/5 rounded w-1/4" />
    </div>
    <div className="h-4 w-12 bg-white/5 rounded" />
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const TerminalWall = () => {
  const navigate = useNavigate();
  const [view, setView] = useState("live");

  // ── Live Rankings state ──
  const [filter, setFilter] = useState("all");
  const [entries, setEntries] = useState([]);
  const [loadingLive, setLoadingLive] = useState(true);

  // ── All-Time Legends state ──
  const [legendsTab, setLegendsTab] = useState("arena");
  const [timeFilter, setTimeFilter] = useState("alltime");
  const [arenaData, setArenaData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [loadingLegends, setLoadingLegends] = useState(true);

  // ── Fetch Live Rankings (Fail-Safe 2-Step Query Pattern) ──
  useEffect(() => {
    if (view !== "live") return;
    fetchLiveRankings();
  }, [filter, view]);

  const fetchLiveRankings = async () => {
    setLoadingLive(true);

    try {
      let isoStart = null;
      if (filter === "daily") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        isoStart = today.toISOString();
      } else if (filter === "weekly") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        isoStart = weekAgo.toISOString();
      }

      const map = {};

      // 1. Query glitch_activity and arena_completions
      let actQuery = supabase
        .from("glitch_activity")
        .select("user_id, points, created_at");
      let arenaQuery = supabase
        .from("arena_completions")
        .select("user_id, score, completed_at");

      if (isoStart) {
        actQuery = actQuery.gte("created_at", isoStart);
        arenaQuery = arenaQuery.gte("completed_at", isoStart);
      }

      const [actRes, arenaRes] = await Promise.all([actQuery, arenaQuery]);

      const rawActs = actRes.data || [];
      const rawArena = arenaRes.data || [];

      rawActs.forEach((row) => {
        const uid = row.user_id;
        if (!uid) return;
        if (!map[uid]) {
          map[uid] = { user_id: uid, total_score: 0, events_completed: 0 };
        }
        map[uid].total_score += row.points || 0;
        map[uid].events_completed += 1;
      });

      rawArena.forEach((row) => {
        const uid = row.user_id;
        if (!uid) return;
        if (!map[uid]) {
          map[uid] = { user_id: uid, total_score: 0, events_completed: 0 };
        }
        map[uid].total_score += row.score || 0;
        map[uid].events_completed += 1;
      });

      // 2. For "All Time", also cross-reference user_points table to capture total points
      if (!isoStart) {
        const { data: userPts } = await supabase
          .from("user_points")
          .select("user_id, points");

        (userPts || []).forEach((row) => {
          const uid = row.user_id;
          if (!uid || (row.points || 0) <= 0) return;
          if (!map[uid]) {
            map[uid] = {
              user_id: uid,
              total_score: row.points || 0,
              events_completed: 1,
            };
          } else {
            map[uid].total_score = Math.max(
              map[uid].total_score,
              row.points || 0
            );
          }
        });
      }

      // 3. Batch fetch profiles for all user IDs in map
      const userIds = Object.keys(map);
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, user_id, username, full_name, avatar_url")
          .in("id", userIds);

        (profs || []).forEach((p) => {
          const uId = p.id || p.user_id;
          if (uId && map[uId]) {
            map[uId].username = p.username || p.full_name || "Anonymous";
            map[uId].full_name = p.full_name || "";
            map[uId].avatar_url = p.avatar_url || null;
          }
        });
      }

      const sorted = Object.values(map)
        .sort((a, b) => b.total_score - a.total_score)
        .slice(0, 50);

      setEntries(sorted);
    } catch (err) {
      console.error("fetchLiveRankings error:", err);
      setEntries([]);
    } finally {
      setLoadingLive(false);
    }
  };

  // ── Fetch All-Time Legends (Fail-Safe 2-Step Query Pattern) ──
  useEffect(() => {
    if (view !== "legends") return;
    fetchLegends();
  }, [timeFilter, view]);

  const fetchLegends = async () => {
    setLoadingLegends(true);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoISO = weekAgo.toISOString();

    let arenaQuery = supabase.from("arena_completions").select("*");
    if (timeFilter === "weekly") {
      arenaQuery = arenaQuery.gte("completed_at", weekAgoISO);
    }

    const { data: arenaRaw } = await arenaQuery;
    const userIds = Array.from(
      new Set((arenaRaw || []).map((r) => r.user_id))
    ).filter(Boolean);

    let profilesMap = {};
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, user_id, username, full_name, avatar_url")
        .in("id", userIds);

      (profs || []).forEach((p) => {
        const uId = p.id || p.user_id;
        if (uId) profilesMap[uId] = p;
      });
    }

    const arenaMap = {};
    (arenaRaw || []).forEach((row) => {
      const uid = row.user_id;
      const prof = profilesMap[uid];
      if (!arenaMap[uid]) {
        arenaMap[uid] = {
          user_id: uid,
          full_name: prof?.full_name,
          username: prof?.username,
          avatar_url: prof?.avatar_url,
          total_score: 0,
          completions: 0,
        };
      }
      arenaMap[uid].total_score += row.score || 0;
      arenaMap[uid].completions += 1;
    });

    const arenaList = Object.values(arenaMap)
      .sort(
        (a, b) =>
          b.total_score - a.total_score || b.completions - a.completions
      )
      .slice(0, 20);

    setArenaData(arenaList);

    const { data: usersRaw } = await supabase
      .from("profiles")
      .select("full_name, username, avatar_url, points")
      .order("points", { ascending: false })
      .limit(20);

    setUsersData(usersRaw || []);
    setLoadingLegends(false);
  };

  const activeLegendsData = legendsTab === "arena" ? arenaData : usersData;
  const legendsMetric = legendsTab === "arena" ? "total_score" : "points";
  const legendsMetricLabel =
    legendsTab === "arena" ? "Arena gBits" : "Total gBits";

  return (
    <div className="min-h-screen bg-[#06060c] text-white flex flex-col font-sans relative overflow-hidden">
      <GlitchBackground />
      <Navbar />

      <div className="relative z-10 flex-1 flex flex-col">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16 flex-1 w-full">
          {/* Header */}
          <div className="mb-10 text-center">
            <PageHeading
              badge="Terminal Wall"
              title="Rankings & Legends"
              description="Real-time leaderboard & all-time hall of fame of top Glitch Room contributors."
            />
          </div>

          {/* Sub-nav switcher: Live Rankings vs All-Time Legends */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <button
              onClick={() => setView("live")}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-mono font-bold transition cursor-pointer border ${
                view === "live"
                  ? "bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/40 shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                  : "bg-[#0c0c14] text-gray-500 border-white/5 hover:text-gray-300"
              }`}
            >
              <FaBolt className={view === "live" ? "text-[#00F0FF]" : ""} />
              <span>Live Rankings</span>
            </button>

            <button
              onClick={() => setView("legends")}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-mono font-bold transition cursor-pointer border ${
                view === "legends"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                  : "bg-[#0c0c14] text-gray-500 border-white/5 hover:text-gray-300"
              }`}
            >
              <FaCrown className={view === "legends" ? "text-amber-400" : ""} />
              <span>All-Time Legends</span>
            </button>
          </div>
        </main>

        <AnimatePresence mode="wait">
          {view === "live" ? (
            <motion.section
              key="live"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 w-full"
            >
              {/* Filter pills */}
              <div className="flex justify-center gap-2 mb-8">
                {[
                  { id: "all", label: "All Time", icon: FiAward },
                  { id: "weekly", label: "This Week", icon: FiClock },
                  { id: "daily", label: "Today", icon: FiZap },
                ].map((f) => {
                  const Icon = f.icon;
                  const active = filter === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer border ${
                        active
                          ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_12px_rgba(0,240,255,0.15)]"
                          : "bg-[#0f0f13] text-gray-500 border-white/5 hover:text-gray-300"
                      }`}
                    >
                      <Icon size={12} />
                      <span>{f.label}</span>
                    </button>
                  );
                })}
              </div>

              <TerminalWindow title="terminal.rankings --live" accent="#00F0FF">
                <PromptLabel icon={FiUsers} color="#00F0FF">
                  active_leaderboard --top-50
                </PromptLabel>

                {loadingLive ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <SkeletonRow key={i} i={i} />
                    ))}
                  </div>
                ) : entries.length === 0 ? (
                  <EmptyState message="No scores logged for this time range." />
                ) : (
                  <>
                    {entries.length >= 3 && (
                      <Podium top3={entries.slice(0, 3)} />
                    )}

                    <div className="space-y-2">
                      {entries.map((entry, index) => {
                        const rank = index + 1;
                        return (
                          <motion.div
                            key={entry.user_id}
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={`flex items-center justify-between p-4 rounded-xl border ${rankBg(rank)} transition-all`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-8 flex items-center justify-center shrink-0">
                                {rankIcon(rank)}
                              </div>

                              <img
                                src={
                                  entry.avatar_url ||
                                  `https://api.dicebear.com/7.x/identicon/svg?seed=${entry.username}`
                                }
                                alt={entry.username}
                                className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                              />

                              <div className="min-w-0">
                                <p className="text-white text-xs font-bold font-mono truncate">
                                  {entry.full_name || entry.username}
                                </p>
                                <p className="text-gray-600 text-[10px] font-mono">
                                  @{entry.username}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-cyan-400 font-mono font-bold text-sm block">
                                {entry.total_score} gBits
                              </span>
                              <span className="text-gray-600 font-mono text-[10px] block">
                                {entry.events_completed} events
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                )}
              </TerminalWindow>
            </motion.section>
          ) : (
            <motion.section
              key="legends"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 w-full"
            >
              {/* Category tabs */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div className="flex gap-2">
                  {[
                    { id: "arena", label: "Arena Champions", icon: FaBolt },
                    { id: "users", label: "Top Contributors", icon: FaFire },
                  ].map((t) => {
                    const Icon = t.icon;
                    const active = legendsTab === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setLegendsTab(t.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer border ${
                          active
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-[#0f0f13] text-gray-500 border-white/5 hover:text-gray-300"
                        }`}
                      >
                        <Icon />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-1.5 bg-[#0f0f13] p-1 rounded-xl border border-white/5">
                  {[
                    { id: "alltime", label: "All-Time" },
                    { id: "weekly", label: "This Week" },
                  ].map((tf) => (
                    <button
                      key={tf.id}
                      onClick={() => setTimeFilter(tf.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                        timeFilter === tf.id
                          ? "bg-white/10 text-white"
                          : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>

              <TerminalWindow title="terminal.hall-of-fame --legends" accent="#f59e0b">
                <PromptLabel icon={FaCrown} color="#f59e0b">
                  legends_rankings --top-20
                </PromptLabel>

                {loadingLegends ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <SkeletonRow key={i} i={i} />
                    ))}
                  </div>
                ) : activeLegendsData.length === 0 ? (
                  <EmptyState message="No legends recorded for this filter yet." />
                ) : (
                  <>
                    <LegendsPodium entries={activeLegendsData.slice(0, 3)} />

                    <div className="space-y-3">
                      {activeLegendsData.map((entry, index) => (
                        <LegendRow
                          key={entry.user_id || index}
                          entry={entry}
                          rank={index + 1}
                          index={index}
                          metric={legendsMetric}
                          metricLabel={legendsMetricLabel}
                        />
                      ))}
                    </div>
                  </>
                )}

                {!loadingLegends && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 text-center"
                  >
                    <p className="text-gray-600 text-xs mb-4 font-mono">
                      Think you can make it here?
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate("/arena-events")}
                      className="px-8 py-3 rounded-2xl font-bold text-sm text-black cursor-pointer"
                      style={{
                        background: "linear-gradient(90deg,#FFD700,#FF00C8)",
                      }}
                    >
                      ⚡ Enter the Arena
                    </motion.button>
                  </motion.div>
                )}
              </TerminalWindow>
            </motion.section>
          )}
        </AnimatePresence>

        <Footer />
      </div>
    </div>
  );
};

export default TerminalWall;
