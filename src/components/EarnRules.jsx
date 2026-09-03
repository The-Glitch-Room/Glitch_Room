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

// ── Shared "settings-style" building blocks ─────────────────────────────────
// Matches the clean, spacious Settings page pattern: one bordered card per
// section, a small icon-badge + label header, then full-width rows
// separated by hairline dividers — instead of a grid of separately
// bordered/hovering mini-cards, which is what made this page feel congested.

const SectionCard = ({ icon: Icon, color, label, children }) => (
  <section className="mb-12">
    <div className="bg-[#0c0c16] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
      <div className="flex items-center gap-3 px-6 sm:px-7 py-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider font-sans">
          {label}
        </h2>
      </div>
      <div className="border-t border-white/5">{children}</div>
    </div>
  </section>
);

const RewardRow = ({
  icon: Icon,
  color,
  eyebrow,
  title,
  desc,
  reward,
  isLast,
}) => (
  <div
    className={`flex items-start sm:items-center justify-between gap-4 sm:gap-6 px-6 sm:px-7 py-5 ${
      !isLast ? "border-b border-white/5" : ""
    }`}
  >
    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
      {Icon && (
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Icon size={15} style={{ color }} />
        </div>
      )}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {eyebrow && (
            <span
              className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0"
              style={{
                color,
                background: `${color}15`,
                border: `1px solid ${color}30`,
              }}
            >
              {eyebrow}
            </span>
          )}
          <h3 className="text-sm font-bold text-white font-sans">{title}</h3>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed font-sans max-w-lg">
          {desc}
        </p>
      </div>
    </div>

    <span
      className="text-base sm:text-lg font-black font-mono shrink-0 whitespace-nowrap"
      style={{ color }}
    >
      {reward}
      <span className="text-[10px] font-normal text-gray-500 ml-1">gBits</span>
    </span>
  </div>
);

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

        <main className="flex-1 min-w-0 p-4 sm:p-8 max-w-5xl mx-auto pb-20 mb-12">
          {/* Header — flat, bordered card matching the rest of the site
              (Settings, Pro Rooms, etc.) instead of a gradient wash, which
              was the biggest thing making this page look out of place. */}
          <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 sm:p-8 mb-12 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
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
                <p className="text-gray-400 text-xs sm:text-sm mt-2 max-w-xl font-sans leading-relaxed">
                  Learn how gBits are awarded across Glitches, Debug Mode, AI
                  Challenges, Creative Sparks, Room Check-ins, and Special
                  Bonuses.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-[#070709] border border-white/10 p-4 rounded-2xl shrink-0">
                <div className="w-11 h-11 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF] shrink-0">
                  <Gift size={20} />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                    Your Balance
                  </div>
                  <div className="text-lg font-black text-white font-mono">
                    {xp} gBits
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Core Challenge & Arena Payouts */}
          <SectionCard
            icon={Star}
            color="#FF00C8"
            label="Core Challenge & Arena Payouts"
          >
            <p className="text-xs text-gray-500 font-sans leading-relaxed px-6 sm:px-7 pt-5 pb-1">
              Applies across Glitches, Debug Mode, AI Challenges, Creative
              Sparks, and Game Arena events. Earned automatically upon solving.
            </p>

            {DIFFICULTY_TIERS.map((tier) => (
              <RewardRow
                key={tier.label}
                color={tier.color}
                eyebrow={tier.label}
                title={`${tier.label} Difficulty`}
                desc={`Awarded for every verified solve on ${tier.label.toLowerCase()}-level challenges.`}
                reward={`+${tier.reward}`}
              />
            ))}

            <RewardRow
              icon={Swords}
              color="#00F0FF"
              eyebrow="Arena"
              title="Game Arena Events"
              desc="Conquer 3-stage live arena challenges hosted by the community."
              reward="75–100"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 px-6 sm:px-7 py-5 text-xs text-gray-400 font-sans">
              <span className="font-semibold text-gray-300 shrink-0">
                Active Categories &amp; Arena
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  "Glitches",
                  "Debug Mode",
                  "AI Challenges",
                  "Creative Sparks",
                  "Game Arena Events",
                ].map((cat) => (
                  <span
                    key={cat}
                    className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-gray-300 font-medium font-sans"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Section 2: Bonus Mechanics */}
          <SectionCard icon={Zap} color="#00F0FF" label="Special Bonus Rewards">
            {BONUS_RULES.map((rule, i) => (
              <RewardRow
                key={rule.title}
                icon={rule.icon}
                color={rule.color}
                title={rule.title}
                desc={rule.desc}
                reward={rule.reward.replace(/\s*gBits$/i, "")}
                isLast={i === BONUS_RULES.length - 1}
              />
            ))}
          </SectionCard>

          {/* Section 3: Level Progression Curve */}
          <SectionCard
            icon={Layers}
            color="#a855f7"
            label="Level Progression Curve"
          >
            <div className="px-6 sm:px-7 py-6">
              <p className="text-xs text-gray-500 mb-5 leading-relaxed font-sans max-w-lg">
                Your Level increases automatically as you accumulate total
                gBits. XP thresholds scale progressively:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {LEVEL_THRESHOLDS.slice(0, 6).map((item) => (
                  <div
                    key={item.level}
                    className="bg-[#070709] border border-white/5 rounded-xl p-4 text-center flex flex-col gap-1.5"
                  >
                    <div className="text-[10px] font-mono text-[#a855f7] font-bold uppercase tracking-wider">
                      Level {item.level}
                    </div>
                    <div className="text-sm font-mono font-bold text-white">
                      {item.minXP} gBits
                    </div>
                    <div className="text-[10px] text-gray-500 font-sans truncate">
                      {item.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Section 4: Referral Program Card */}
          <section className="mb-12">
            <ReferralSection />
          </section>
        </main>
      </div>
    </div>
  );
};

export default EarnRules;
