import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Zap,
  Trophy,
  Flame,
  CheckCircle,
  TrendingUp,
  Clock,
  X,
  Award,
  TerminalSquare,
  ArrowRight,
  Play,
  Gift,
  Medal,
} from "lucide-react";
import Navbar from "./Navbar";
import SharedSidebar from "./SharedSidebar";
import GlitchBackground from "./GlitchBackground";
import Footer from "./Footer";
import ActivityHeatmap from "./ActivityHeatmap";
import BadgesSection from "./BadgesSection";
import { getLevelFromXP, getLevelProgressDetails } from "../utils/pointsHelper";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const CHARACTERS = [
  { id: 1, emoji: "🧑‍💻", name: "The Dev", vibe: "Built different" },
  { id: 2, emoji: "🦊", name: "The Fox", vibe: "Sly & clever" },
  { id: 3, emoji: "🤖", name: "The Bot", vibe: "NPC escaped" },
  { id: 4, emoji: "👾", name: "The Glitch", vibe: "Main character" },
  { id: 5, emoji: "🧙", name: "The Wizard", vibe: "No cap, magic" },
  { id: 6, emoji: "🐉", name: "The Dragon", vibe: "Breathing fire" },
  { id: 7, emoji: "🦄", name: "The Unicorn", vibe: "Rare drop" },
  { id: 8, emoji: "👻", name: "The Ghost", vibe: "U got ghosted" },
  { id: 9, emoji: "🦋", name: "The Butterfly", vibe: "Glowup arc" },
  { id: 10, emoji: "🐸", name: "The Frog", vibe: "Feels this" },
  { id: 11, emoji: "🧊", name: "The Ice", vibe: "Chilly fr fr" },
  { id: 12, emoji: "⚡", name: "The Bolt", vibe: "No hesitation" },
];

const TerminalWindow = ({
  title,
  accent = "#FF00C8",
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
        style={{ color: `${accent}` }}
      >
        {title}
      </span>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const PromptLabel = ({ icon: Icon, children, color = "#a855f7" }) => (
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

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ y: -3 }}
    className="relative overflow-hidden rounded-2xl p-5 bg-[#0f0f13] border border-white/5"
  >
    <div
      className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-10"
      style={{ background: color, transform: "translate(30%,-30%)" }}
    />
    <Icon size={15} style={{ color }} className="mb-3" />
    <p className="text-gray-600 text-[10px] font-mono uppercase tracking-widest mb-1">
      {label}
    </p>
    <p className="text-2xl font-black text-white font-mono">{value}</p>
  </motion.div>
);

const CharacterPicker = ({ current, onSelect, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md"
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <motion.div
      initial={{ scale: 0.92, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="bg-[#0a0a0c] border border-white/8 rounded-2xl p-6 w-[90%] max-w-md shadow-2xl"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-white font-black text-lg">Pick your character</h2>
          <p className="text-gray-600 text-xs mt-0.5">
            Select your developer avatar identity
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-600 hover:text-white transition cursor-pointer"
        >
          <X size={17} />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {CHARACTERS.map((char) => (
          <motion.button
            key={char.id}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onSelect(char);
              onClose();
            }}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all cursor-pointer ${
              current?.id === char.id
                ? "border-[#FF00C8]/50 bg-[#FF00C8]/8"
                : "border-white/5 bg-white/[0.02] hover:border-white/12"
            }`}
          >
            <span className="text-3xl leading-none">{char.emoji}</span>
            <span className="text-[10px] text-gray-400 font-semibold leading-none mt-1">
              {char.name}
            </span>
            <span className="text-[9px] text-gray-600 leading-none">
              {char.vibe}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  </motion.div>
);

const calcStreak = (activities) => {
  if (!activities || activities.length === 0) return 0;
  const days = new Set(
    activities.map((a) => new Date(a.created_at).toDateString()),
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.has(d.toDateString())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
};

const getCurrentWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
};

const formatDDMMYYYY = (d) => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const Console = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [weekChartMap, setWeekChartMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [rank, setRank] = useState("—");
  const [streak, setStreak] = useState(0);
  const [earnedBadgesCount, setEarnedBadgesCount] = useState(0);
  const [character, setCharacter] = useState(() => {
    try {
      const saved = localStorage.getItem("gr_character");
      return saved ? JSON.parse(saved) : CHARACTERS[3];
    } catch {
      return CHARACTERS[3];
    }
  });

  const saveCharacter = (char) => {
    setCharacter(char);
    localStorage.setItem("gr_character", JSON.stringify(char));
  };

  const fetchAll = async () => {
    setLoading(true);
    const { data: au } = await supabase.auth.getUser();
    setAuthUser(au?.user);
    const userId = au?.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    const [profRes, progRes, recentRes, allUsersRes, badgesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("user_points").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("glitch_activity")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("user_points")
        .select("user_id, points")
        .order("points", { ascending: false }),
      supabase
        .from("user_badges")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

    const { monday, sunday } = getCurrentWeekRange();
    const endOfSunday = new Date(sunday);
    endOfSunday.setHours(23, 59, 59, 999);
    const { data: weekData } = await supabase
      .from("glitch_activity")
      .select("points, created_at")
      .eq("user_id", userId)
      .gte("created_at", monday.toISOString())
      .lte("created_at", endOfSunday.toISOString());

    const dayTotals = {};
    (weekData || []).forEach((row) => {
      const key = new Date(row.created_at).toDateString();
      dayTotals[key] = (dayTotals[key] || 0) + (row.points || 0);
    });
    setWeekChartMap(dayTotals);

    setProfile(profRes.data);
    if (progRes.data) setUserData(progRes.data);
    setEarnedBadgesCount(badgesRes?.count || 0);

    const recentActivities = recentRes.data || [];
    setActivities(recentActivities);
    setStreak(calcStreak(recentActivities));

    if (allUsersRes.data) {
      const idx = allUsersRes.data.findIndex((u) => u.user_id === userId);
      setRank(idx >= 0 ? `#${idx + 1}` : "—");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();

    let channel;
    supabase.auth.getUser().then(({ data: au }) => {
      const userId = au?.user?.id;
      if (!userId) return;
      channel = supabase
        .channel("console-points")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_points",
            filter: `user_id=eq.${userId}`,
          },
          () => fetchAll(),
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "glitch_activity",
            filter: `user_id=eq.${userId}`,
          },
          () => fetchAll(),
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const displayName =
    profile?.username ||
    profile?.full_name ||
    authUser?.user_metadata?.full_name ||
    authUser?.email?.split("@")[0] ||
    "Creator";

  const xp = userData?.points || 0;
  const progressDetails = getLevelProgressDetails(xp);
  const level = progressDetails.currentLevel;
  const nextLevelTarget = progressDetails.nextLevelXP;
  const progressPct = progressDetails.percentage;
  const progressLabel = progressDetails.label;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "gm ☀️";
    if (h < 17) return "hey 👋";
    return "gn 🌙";
  })();

  const { monday: weekMonday, sunday: weekSunday } = getCurrentWeekRange();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekMonday);
    d.setDate(weekMonday.getDate() + i);
    return d;
  });

  const dailyValues = weekDays.map((d) => weekChartMap[d.toDateString()] || 0);
  const maxVal = Math.max(...dailyValues, 10);
  const suggestedTopMax = Math.ceil((maxVal * 1.2) / 10) * 10;

  const chartData = {
    labels: weekDays.map((d) =>
      d.toLocaleDateString("en-US", { weekday: "short" }),
    ),
    datasets: [
      {
        label: "gBits",
        data: dailyValues,
        backgroundColor: "rgba(255,0,200,0.25)",
        borderColor: "#FF00C8",
        borderWidth: 1.5,
        borderRadius: 6,
        hoverBackgroundColor: "rgba(0,240,255,0.4)",
        hoverBorderColor: "#00F0FF",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0d0d14",
        borderColor: "rgba(255,0,200,0.3)",
        borderWidth: 1,
        titleColor: "#ffffff",
        bodyColor: "#00F0FF",
        bodyFont: { family: "monospace", weight: "bold" },
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context) => ` +${context.parsed.y} gBits`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.03)" },
        ticks: { color: "#9ca3af", font: { family: "monospace", size: 10 } },
      },
      y: {
        beginAtZero: true,
        suggestedMax: suggestedTopMax,
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: {
          color: "#9ca3af",
          font: { family: "monospace", size: 10 },
          callback: (value) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
            return value;
          },
        },
      },
    },
  };

  return (
    <div className="relative min-h-screen bg-[#070709] text-white flex flex-col justify-between overflow-hidden">
      <GlitchBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
      <div className="flex pt-24 min-h-[calc(100vh-80px)]">
        <SharedSidebar user={authUser} xp={xp} level={level} />

        <main className="flex-1 min-w-0 p-6 lg:p-10 overflow-y-auto pb-24 md:pb-12">
          {/* ── Terminal Prompt Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <p className="text-gray-600 text-xs font-mono mb-1">
              <span className="text-green-400">user@glitchroom</span>
              <span className="text-gray-600">:~$ </span>
              <span className="text-gray-400">whoami</span>
            </p>
            <div className="flex items-center gap-3">
              <TerminalSquare size={22} className="text-[#FF00C8]" />
              <h1 className="text-3xl font-black text-white font-mono tracking-tight">
                Console
              </h1>
            </div>
            <p className="text-gray-500 text-sm mt-1 font-mono">
              {"// "}
              {greeting} — Developer Command Center &amp; Analytics
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-24">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-10 h-10 border-2 border-t-transparent border-[#FF00C8] rounded-full"
              />
            </div>
          ) : (
            <>
              {/* ── Quick Action Shortcuts Toolbar ($ ./quick_launch.sh) ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex flex-wrap items-center gap-2.5 p-3 rounded-2xl bg-[#0f0f13] border border-white/5"
              >
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest px-2 font-bold">
                  $ ./quick_launch.sh:
                </span>
                {[
                  { label: "launch_arena.sh", path: "/game-arena", color: "#00F0FF", icon: Play },
                  { label: "terminal_wall.sh", path: "/terminal-wall", color: "#FF00C8", icon: Medal },
                  { label: "earn_rules.sh", path: "/earn-rules", color: "#22c55e", icon: Gift },
                ].map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => navigate(action.path)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border hover:scale-105"
                      style={{
                        color: action.color,
                        background: `${action.color}10`,
                        borderColor: `${action.color}25`,
                      }}
                    >
                      <Icon size={12} /> ./{action.label}
                    </button>
                  );
                })}
              </motion.div>

              {/* ── Hero Card — Terminal Window Chrome ── */}
              <TerminalWindow
                title="user_profile.sh"
                accent="#FF00C8"
                className="mb-5"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
                  <button
                    onClick={() => setShowPicker(true)}
                    className="relative shrink-0 cursor-pointer group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[#1a1a22] border border-white/10 flex items-center justify-center text-4xl group-hover:border-[#FF00C8]/40 transition-all">
                      {character.emoji}
                    </div>
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] bg-[#FF00C8] text-white px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                      {character.vibe}
                    </span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-xl font-black text-white">
                        {displayName}
                      </h2>
                      <span className="text-[10px] bg-[#FF00C8]/10 border border-[#FF00C8]/20 text-[#FF00C8] px-2 py-0.5 rounded-full font-semibold">
                        LEVEL {level}
                      </span>
                      <span className="text-[10px] bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full font-semibold font-mono uppercase tracking-wider">
                        {character.name}
                      </span>
                    </div>

                    {/* Level XP Progress Bar Widget */}
                    <div className="mt-3 max-w-md">
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                        <span className="text-[#00F0FF]">{progressLabel}</span>
                        <span className="text-gray-400">{xp} / {nextLevelTarget} gBits ({progressPct}%)</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-[#FF00C8] to-[#00F0FF]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[9px] text-gray-600 font-mono uppercase tracking-widest mb-1">
                      total_gbits
                    </p>
                    <p className="text-5xl font-black text-white tabular-nums font-mono">
                      {(xp || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </TerminalWindow>

              {/* ── Stat Cards ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <StatCard
                  icon={CheckCircle}
                  label="solved"
                  value={activities.length}
                  color="#FF00C8"
                  delay={0.1}
                />
                <StatCard
                  icon={Trophy}
                  label="rank"
                  value={rank}
                  color="#f59e0b"
                  delay={0.13}
                />
                <StatCard
                  icon={Flame}
                  label="uptime"
                  value={`${streak}d`}
                  color="#00F0FF"
                  delay={0.16}
                />
                <StatCard
                  icon={Award}
                  label="badges"
                  value={earnedBadgesCount}
                  color="#a855f7"
                  delay={0.19}
                />
              </div>

              {/* ── Weekly Progress Chart ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26 }}
                className="mb-5"
              >
                <TerminalWindow title="weekly_progress.log" accent="#FF00C8">
                  <PromptLabel icon={TrendingUp} color="#FF00C8">
                    ./progress --chart
                  </PromptLabel>
                  <p className="text-[10px] text-gray-600 mb-4 font-mono">
                    range: {formatDDMMYYYY(weekMonday)} →{" "}
                    {formatDDMMYYYY(weekSunday)}
                  </p>
                  <div className="h-64 sm:h-72 w-full pt-2">
                    <Bar data={chartData} options={chartOptions} />
                  </div>
                </TerminalWindow>
              </motion.div>

              {/* ── Mastery Badges System (badges.sh) ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.33 }}
                className="mb-5"
              >
                <TerminalWindow title="badges.sh" accent="#FFD700">
                  <PromptLabel icon={Award} color="#FFD700">
                    ./badges --list
                  </PromptLabel>
                  <BadgesSection userId={authUser?.id} />
                </TerminalWindow>
              </motion.div>

              {/* ── 365-Day Contribution Heatmap ── */}
              <div className="mb-5">
                <TerminalWindow title="activity_heatmap.sh" accent="#00F0FF">
                  <ActivityHeatmap userId={authUser?.id} />
                </TerminalWindow>
              </div>

              {/* ── Real-Time Live Activity Stream (activity.log) ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.36 }}
              >
                <TerminalWindow title="activity.log" accent="#a855f7">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={12} className="text-[#a855f7]" />
                    <p className="text-[10px] text-[#a855f7] font-mono uppercase tracking-widest font-semibold">
                      <span className="text-gray-600">$ </span>
                      tail -f activity.log
                    </p>
                    <span className="ml-auto text-[10px] text-gray-600 bg-white/5 px-2 py-0.5 rounded-lg font-mono">
                      last {activities.length} entries
                    </span>
                  </div>

                  {activities.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-4xl mb-2">🫙</p>
                      <p className="text-gray-600 text-sm font-mono">
                        log empty — go fix some glitches!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {activities.map((a, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(i * 0.03, 0.6) + 0.4 }}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/8 transition-all font-mono"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-gray-700 text-xs shrink-0">
                              &gt;
                            </span>
                            <div className="w-6 h-6 rounded-lg bg-[#FF00C8]/8 border border-[#FF00C8]/15 flex items-center justify-center shrink-0">
                              <Zap size={10} className="text-[#FF00C8]" />
                            </div>
                            <span className="text-sm text-gray-300 truncate">
                              {a.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-[#00F0FF] bg-[#00F0FF]/8 border border-[#00F0FF]/12 px-2 py-0.5 rounded-lg shrink-0">
                            +{a.points} gBits
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TerminalWindow>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center text-gray-700 text-[11px] italic mt-6 font-mono"
              >
                every bug u fix is ur villain arc becoming main character arc ⚡
              </motion.p>
            </>
          )}
        </main>
      </div>

      <AnimatePresence>
        {showPicker && (
          <CharacterPicker
            current={character}
            onSelect={saveCharacter}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>
      <Footer />
      </div>
    </div>
  );
};

export default Console;
