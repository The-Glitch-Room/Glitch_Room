import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";
import Navbar from "./Navbar";
import SharedSidebar from "./SharedSidebar";
import { fetchPoints, LEVEL_THRESHOLDS } from "../utils/pointsHelper";
import {
  Gift,
  Star,
  Calendar,
  Target,
  Swords,
  Layers,
  Lightbulb,
  Zap,
  Users,
  CheckCircle2,
} from "lucide-react";
import ReferralSection from "./ReferralSection";

// ── Core challenge payouts — a single difficulty scale, shared by Glitches,
// Debug Mode, AI Challenges, and Creative Sparks (see getPointsByDifficulty
// in pointsHelper.js). This is the real, live mechanic on the site today.
const DIFFICULTY_TIERS = [
  { label: "Easy", reward: 10, color: "#22c55e" },
  { label: "Medium", reward: 25, color: "#f59e0b" },
  { label: "Hard", reward: 50, color: "#ef4444" },
];

const CORE_CATEGORIES = [
  "Glitches",
  "Debug Mode",
  "AI Challenges",
  "Creative Sparks",
];

// ── Bonus mechanics — fully wired up and active across the site.
const BONUS_RULES = [
  {
    icon: Zap,
    color: "#00F0FF",
    title: "Speed Demon Bonus",
    reward: "+50 gBits",
    desc: "Solve a challenge under the speed threshold on your 1st attempt (Easy <45s, Med <90s, Hard <180s).",
  },
  {
    icon: Users,
    color: "#FF00C8",
    title: "Invite a Glitcher",
    reward: "+100 gBits",
    desc: "Invite a friend with your custom link. Earn +100 gBits automatically when they solve their first challenge!",
  },
  {
    icon: Calendar,
    color: "#a855f7",
    title: "7-Day Uptime Streak",
    reward: "+150 gBits",
    desc: "Keep your Uptime streak active for 7 consecutive days. Repeats every new 7-day milestone.",
  },
  {
    icon: CheckCircle2,
    color: "#3b82f6",
    title: "Weekly Room Check-in",
    reward: "+10 gBits",
    desc: "Submit your weekly progress check-in inside any Creator Room to earn +10 gBits for your weekly check-in!",
  },
  {
    icon: Target,
    color: "#22c55e",
    title: "First-Try Clearance",
    reward: "+25 gBits",
    desc: "Submit a fully correct fix the very first time you attempt a challenge.",
  },
  {
    icon: Lightbulb,
    color: "#FFD700",
    title: "Daily Fact Bubble",
    reward: "+10 gBits",
    desc: "React to today's fact for the first time. Resets every day, once per day.",
  },
];

// ── Bonus rule card ──────────────────────────────────────────────────────────
const BonusCard = ({ rule }) => {
  const Icon = rule.icon;
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="bg-[#0f0f13] border border-white/5 rounded-2xl p-4 flex items-start gap-3.5 transition-all duration-300"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${rule.color}40`;
        e.currentTarget.style.boxShadow = `0 0 20px ${rule.color}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: `${rule.color}15`,
          border: `1px solid ${rule.color}30`,
        }}
      >
        <Icon size={16} style={{ color: rule.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className="text-xs font-bold text-white truncate font-sans">
            {rule.title}
          </h4>
          <span
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0"
            style={{
              background: `${rule.color}20`,
              color: rule.color,
              border: `1px solid ${rule.color}40`,
            }}
          >
            {rule.reward}
          </span>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
          {rule.desc}
        </p>
      </div>
    </motion.div>
  );
};

const EarnRules = () => {
  const [xp, setXp] = useState(0);

  useEffect(() => {
    const fetchXP = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;

      const { data } = await supabase
        .from("user_points")
        .select("points")
        .eq("user_id", userId)
        .single();

      if (data) setXp(data.points || 0);
    };

    fetchXP();
  }, []);

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col justify-between font-sans">
      <Navbar />

      <div className="flex pt-24 min-h-[calc(100vh-80px)]">
        <SharedSidebar xp={xp} />

        <main className="flex-1 min-w-0 p-4 sm:p-6 max-w-5xl mx-auto pb-20 mb-12">
          {/* Header Banner */}
          <div className="relative rounded-3xl p-6 sm:p-8 mb-8 overflow-hidden bg-gradient-to-r from-purple-900/30 via-[#0d0d14] to-[#00F0FF]/10 border border-white/10 shadow-2xl">
            <div className="h-[2px] w-full bg-gradient-to-r from-[#FF00C8] via-[#00F0FF] to-purple-500 absolute top-0 left-0" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#FF00C8]/10 text-[#FF00C8] border border-[#FF00C8]/30 font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider font-mono">
                    Points &amp; Rewards
                  </span>
                  <span className="bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider font-mono">
                    Official Guide
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
                  Earn Rules &amp; Payouts
                </h1>
                <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-xl font-sans">
                  Learn how gBits are awarded across Glitches, Debug Mode, AI Challenges, Creative Sparks, Room Check-ins, and Special Bonuses.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-[#070709]/80 border border-white/10 p-3.5 rounded-2xl shrink-0 backdrop-blur-md">
                <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
                  <Gift size={20} />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-mono uppercase">Your Balance</div>
                  <div className="text-lg font-black text-white font-mono">{xp} gBits</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Core Challenge & Arena Payouts */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Star size={16} className="text-[#FF00C8]" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-sans">
                1. Core Challenge &amp; Arena Payouts
              </h2>
            </div>
            <p className="text-xs text-gray-400 mb-4 font-sans">
              Applies across Glitches, Debug Mode, AI Challenges, Creative Sparks, and Game Arena events. Earned automatically upon solving.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Easy */}
              <div className="bg-[#0f0f18] border border-white/10 hover:border-green-500/40 rounded-2xl p-5 relative overflow-hidden transition-all group shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    Easy
                  </span>
                  <span className="text-xl font-black font-mono text-green-400">
                    +10 <span className="text-xs font-normal text-gray-400">gBits</span>
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Easy Difficulty</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  Awarded for every verified solve on easy-level challenges.
                </p>
              </div>

              {/* Medium */}
              <div className="bg-[#0f0f18] border border-white/10 hover:border-amber-500/40 rounded-2xl p-5 relative overflow-hidden transition-all group shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    Medium
                  </span>
                  <span className="text-xl font-black font-mono text-amber-400">
                    +25 <span className="text-xs font-normal text-gray-400">gBits</span>
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Medium Difficulty</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  Awarded for every verified solve on medium-level challenges.
                </p>
              </div>

              {/* Hard */}
              <div className="bg-[#0f0f18] border border-white/10 hover:border-red-500/40 rounded-2xl p-5 relative overflow-hidden transition-all group shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    Hard
                  </span>
                  <span className="text-xl font-black font-mono text-red-400">
                    +50 <span className="text-xs font-normal text-gray-400">gBits</span>
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Hard Difficulty</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  Awarded for every verified solve on hard-level challenges.
                </p>
              </div>

              {/* Game Arena Events */}
              <div className="bg-[#0f0f18] border border-white/10 hover:border-[#00F0FF]/40 rounded-2xl p-5 relative overflow-hidden transition-all group shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/20 px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                    <Swords size={12} /> Arena
                  </span>
                  <span className="text-xl font-black font-mono text-[#00F0FF]">
                    75–100 <span className="text-xs font-normal text-gray-400">gBits</span>
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Game Arena Events</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  Conquer 3-stage live arena challenges hosted by the community.
                </p>
              </div>
            </div>

            <div className="bg-[#0b0b10] border border-white/5 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400 font-sans">
              <span className="font-semibold text-gray-300">Active Categories &amp; Arena:</span>
              <div className="flex flex-wrap items-center gap-2">
                {["Glitches", "Debug Mode", "AI Challenges", "Creative Sparks", "Game Arena Events"].map((cat) => (
                  <span
                    key={cat}
                    className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-gray-300 font-medium"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Section 2: Bonus Mechanics */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={16} className="text-[#00F0FF]" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-sans">
                2. Special Bonus Rewards
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BONUS_RULES.map((rule) => (
                <BonusCard key={rule.title} rule={rule} />
              ))}
            </div>
          </section>

          {/* Section 3: Level Progression Curve */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Layers size={16} className="text-[#a855f7]" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-sans">
                3. Level Progression Curve
              </h2>
            </div>

            <div className="bg-[#0f0f13] border border-white/5 rounded-2xl p-5">
              <p className="text-xs text-gray-400 mb-4 leading-relaxed font-sans">
                Your Level increases automatically as you accumulate total gBits. XP thresholds scale progressively:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {LEVEL_THRESHOLDS.slice(0, 6).map((item) => (
                  <div
                    key={item.level}
                    className="bg-[#070709] border border-white/5 rounded-xl p-3 text-center flex flex-col justify-between"
                  >
                    <div className="text-[10px] font-mono text-[#00F0FF] font-bold uppercase mb-0.5">
                      Level {item.level}
                    </div>
                    <div className="text-xs font-mono font-bold text-white mb-1">
                      {item.minXP} gBits
                    </div>
                    <div className="text-[10px] text-gray-400 font-sans truncate">
                      {item.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 4: Referral Program Card */}
          <section className="mb-10">
            <ReferralSection />
          </section>
        </main>
      </div>
    </div>
  );
};

export default EarnRules;
