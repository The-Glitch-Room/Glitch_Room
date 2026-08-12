import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Zap, Users, Lightbulb, Flame, ArrowRight, Gift, Trophy } from "lucide-react";
import PageHeading from "./PageHeading";

const REWARD_CARDS = [
  {
    icon: Zap,
    title: "Speed Demon Clearance",
    reward: "+50 gBits",
    description: "Solve challenges under target elapsed time thresholds to unlock the Speed Demon bonus pill.",
    accent: "#00F0FF",
  },
  {
    icon: Users,
    title: "Invite a Glitcher",
    reward: "+100 gBits",
    description: "Share your custom referral link. Get 100 gBits instantly when your friends sign up.",
    accent: "#FF00C8",
  },
  {
    icon: Lightbulb,
    title: "Daily Fact Reactor",
    reward: "+10 gBits",
    description: "Inspect today's developer trivia on your console and react to claim daily floating particles.",
    accent: "#FFD700",
  },
  {
    icon: Flame,
    title: "7-Day Uptime Streak",
    reward: "+150 gBits",
    description: "Log in continuously for 7 days to maintain your uptime streak and claim bonus payout multipliers.",
    accent: "#22c55e",
  },
];

const EarnRewardsTeaser = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-20 px-6 bg-transparent border-t border-white/5 overflow-hidden">
      {/* Background Grid */}
      <div
        className="absolute inset-0 z-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,0,200,0.2) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,0,200,0.2) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div
        className="absolute bottom-0 right-10 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: "#FF00C8" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Unified Page Heading */}
        <PageHeading
          eyebrow="Creator Economy & Perks"
          title="Multiply Your gBits — 4 Ways To Earn"
          subtitle="Level up your account, unlock exclusive badges, and climb the Terminal Wall by earning gBits across all platform activities."
          accent="pink"
          size="lg"
        />

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 mt-6">
          {REWARD_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                viewport={{ once: true }}
                whileHover={{ y: -6 }}
                className="bg-[#0d0d14] border border-white/5 rounded-3xl p-6 flex flex-col justify-between group transition-all duration-300 relative overflow-hidden"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${card.accent}40`;
                  e.currentTarget.style.boxShadow = `0 10px 30px ${card.accent}15`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div>
                  {/* Top Row: Icon + Reward Pill */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center"
                      style={{
                        background: `${card.accent}15`,
                        border: `1px solid ${card.accent}30`,
                        color: card.accent,
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <span
                      className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl"
                      style={{
                        background: `${card.accent}15`,
                        border: `1px solid ${card.accent}30`,
                        color: card.accent,
                      }}
                    >
                      {card.reward}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-gray-200 transition-colors">
                    {card.title}
                  </h3>

                  <p className="text-gray-400 text-xs leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Solid CTA Button */}
        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/earn-rules")}
            className="px-7 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-[#FF00C8] hover:bg-[#e000b0] cursor-pointer shadow-sm inline-flex items-center gap-2 transition-all"
          >
            <Trophy size={16} /> Explore All Earn Rules &amp; Referral Hub <ArrowRight size={14} />
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default EarnRewardsTeaser;
