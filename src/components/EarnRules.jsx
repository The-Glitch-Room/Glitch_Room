import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";
import Navbar from "./Navbar";
import SharedSidebar from "./SharedSidebar";
import { LEVEL_THRESHOLDS } from "../utils/pointsHelper";
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
        <div className="flex items-center gap-2 justify-between mb-1">
          <h3 className="text-xs font-bold text-white truncate">
            {rule.title}
          </h3>
          <span
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0"
            style={{
              color: rule.color,
              background: `${rule.color}15`,
              border: `1px solid ${rule.color}30`,
            }}
          >
            {rule.reward}
          </span>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed">{rule.desc}</p>
      </div>
    </motion.div>
  );
};

const EarnRules = () => {
  const [authUser, setAuthUser] = useState(null);
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const { data: au } = await supabase.auth.getUser();
      setAuthUser(au?.user);
      const userId = au?.user?.id;
      if (userId) {
        const { data: pts } = await supabase
          .from("user_points")
          .select("points")
          .eq("user_id", userId)
          .single();
        if (pts) setXp(pts.points);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const level = Math.floor(xp / 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#070709]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-2 border-t-transparent border-[#00F0FF] rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white">
      <Navbar />
      <div className="flex pt-[18vh]">
        <SharedSidebar user={authUser} xp={xp} level={level} />

        <main className="flex-1 min-w-0 p-6 lg:p-8 overflow-y-auto pb-24 md:pb-0">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-3 text-[10px] font-bold font-mono tracking-widest uppercase bg-[#00F0FF]/10 border border-[#00F0FF]/25 rounded-full text-[#00F0FF]">
              <Gift size={11} /> gBit Economy
            </span>
            <h1 className="text-3xl font-black text-white mb-1">Earn gBits</h1>
            <p className="text-gray-500 text-sm max-w-xl">
              Here's exactly how Glitchers generate gBits across The Glitch Room
              today.
            </p>
          </motion.div>

          {/* Section 1 — Difficulty payout scale */}
          <div className="mb-8">
            <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
              01 · Core Challenge Payouts
            </p>

            <div className="bg-[#0f0f13] border border-white/5 rounded-2xl p-5 mb-4">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {DIFFICULTY_TIERS.map((tier) => (
                  <div
                    key={tier.label}
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: `${tier.color}0d`,
                      border: `1px solid ${tier.color}25`,
                    }}
                  >
                    <p
                      className="text-xl font-black"
                      style={{ color: tier.color }}
                    >
                      +{tier.reward}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                      {tier.label}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                This scale applies the same way across{" "}
                {CORE_CATEGORIES.join(", ")} — a challenge's difficulty is what
                sets the payout, not its category.
              </p>
            </div>

            {/* Arena — separate mechanic, multi-stage live event */}
            <div className="bg-[#0f0f13] border border-white/5 rounded-2xl p-4 flex items-center gap-3.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(0,240,255,0.12)",
                  border: "1px solid rgba(0,240,255,0.3)",
                }}
              >
                <Swords size={16} className="text-[#00F0FF]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-xs font-bold text-white">
                    Arena Challenge Events
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 shrink-0">
                    75 – 100 gBits
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  The flagship 3-stage challenge — Find the Glitch, Twist Card,
                  Pitch Wild. Complete all 3 stages for a 75 gBit base, plus up
                  to +25 more scaled by how well you scored across the stages.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2 — Bonuses */}
          <div className="mb-8">
            <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF00C8]" />
              02 · Uptime Streaks & Execution Bonuses
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {BONUS_RULES.map((rule, i) => (
                <BonusCard key={i} rule={rule} />
              ))}
            </div>
          </div>

          {/* Section 2.5 — Referral Hub */}
          <div className="mb-8">
            <ReferralSection />
          </div>

          {/* Section 3 — Level Clearance */}
          <div className="mb-8">
            <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7]" />
              03 · Level Clearance
            </p>

            <div className="bg-[#0f0f13] border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Layers size={13} className="text-[#a855f7]" />
                <p className="text-xs text-gray-400">
                  Your level is total gBits against this curve — not linear, so
                  later levels take meaningfully more to clear.
                </p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {LEVEL_THRESHOLDS.map((threshold, level) => (
                  <div
                    key={level}
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: "rgba(168,85,247,0.06)",
                      border: "1px solid rgba(168,85,247,0.18)",
                    }}
                  >
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                      Level {level}
                    </p>
                    <p className="text-sm font-black text-[#a855f7]">
                      {threshold.toLocaleString()}
                    </p>
                    <p className="text-[9px] text-gray-600 mt-0.5">gBits</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer note — ties gBits back into the progression system */}
          <div className="bg-[#0f0f13] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#FFD700]/10 border border-[#FFD700]/25">
              <Star size={16} className="text-[#FFD700]" />
            </div>
            <div>
              <p className="text-white text-sm font-bold">
                Top earners become Overclockers
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                Rack up gBits and climb the{" "}
                <a
                  href="/terminal-wall"
                  className="text-[#00F0FF] hover:underline"
                >
                  Terminal Wall
                </a>{" "}
                to earn Overclocker recognition each week.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EarnRules;
