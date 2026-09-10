import React from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";
import PageHeading from "./PageHeading";
import Button from "./Button";
import GlitchBackground from "./GlitchBackground";
import {
  Swords,
  Trophy,
  Zap,
  Target,
  Flame,
  Award,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Users,
} from "lucide-react";

const GameArena = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-[#070709] text-white flex flex-col selection:bg-[#00F0FF]/20 overflow-hidden">
      <GlitchBackground />
      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

      {/* ── HERO ── */}
      <section className="relative pt-36 md:pt-44 pb-12 px-6 mb-8 md:mb-16 text-center">
        {/* Animated Cyber Grid */}
        <div
          className="absolute inset-0 z-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(0,240,255,0.2) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0,240,255,0.2) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <PageHeading
            eyebrow="Multi-Stage Competitive Arena"
            title="The Glitch Game Arena"
            subtitle="Compete in chaos. Solve under pressure. Rise to the top of the Terminal Wall."
            accent="pink"
            size="xl"
          />

          <div className="mt-12 md:mt-14 flex flex-wrap justify-center items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/arena-events")}
              className="px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-[#FF00C8]/85 hover:bg-[#FF00C8] flex items-center gap-2 cursor-pointer transition-all shadow-md"
            >
              <Swords size={18} /> Enter Live Arena Events →
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/terminal-wall")}
              className="px-7 py-3.5 rounded-2xl font-bold text-sm text-gray-300 bg-[#0f0f14] border border-white/10 hover:border-white/20 flex items-center gap-2 cursor-pointer"
            >
              <Trophy size={18} className="text-[#FFD700]" /> View Terminal Wall
            </motion.button>
          </div>
        </div>
      </section>

      {/* ── EVENT OVERVIEW & 3-STAGE BREAKDOWN ── */}
      <section className="max-w-6xl mx-auto px-6 pb-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-[#0f0f14] border border-white/8 rounded-3xl p-6 sm:p-10 md:p-12 shadow-2xl overflow-hidden"
        >
          {/* Glowing Top Line */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background:
                "linear-gradient(90deg, transparent, #FF00C8, #00F0FF, transparent)",
            }}
          />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 border-b border-white/5 pb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 mb-2.5 text-[10px] font-bold font-mono tracking-widest uppercase bg-[#FF00C8]/10 border border-[#FF00C8]/30 rounded-full text-[#FF00C8]">
                <Flame size={12} /> Flagship Arena Mechanics
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
                How The 3-Stage Arena Works
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-4 py-2 rounded-xl bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 shrink-0 shadow-lg">
              <Zap size={14} className="text-[#00F0FF]" /> Earn 75 – 100 gBits Per Event
            </span>
          </div>

          {/* 3 Stages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Stage 1 */}
            <motion.div
              whileHover={{ y: -5, scale: 1.01 }}
              className="bg-[#07070d] border border-[#00F0FF]/25 hover:border-[#00F0FF]/50 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 shadow-xl flex flex-col justify-between"
            >
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background: "linear-gradient(90deg, #00F0FF, transparent)",
                }}
              />
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#00F0FF]/15 border border-[#00F0FF]/35 flex items-center justify-center text-[#00F0FF] font-mono font-black text-base shadow-lg shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white tracking-tight">
                      Stage 1
                    </h3>
                    <p className="text-[11px] font-mono font-bold text-[#00F0FF] uppercase tracking-wider">
                      Find the Glitch
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans">
                  Inspect buggy code and describe the exact flaw. Graded strictly by AI up to 10 points.
                </p>
              </div>
            </motion.div>

            {/* Stage 2 */}
            <motion.div
              whileHover={{ y: -5, scale: 1.01 }}
              className="bg-[#07070d] border border-[#D600FF]/25 hover:border-[#D600FF]/50 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 shadow-xl flex flex-col justify-between"
            >
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background: "linear-gradient(90deg, #D600FF, transparent)",
                }}
              />
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#D600FF]/15 border border-[#D600FF]/35 flex items-center justify-center text-[#D600FF] font-mono font-black text-base shadow-lg shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white tracking-tight">
                      Stage 2
                    </h3>
                    <p className="text-[11px] font-mono font-bold text-[#D600FF] uppercase tracking-wider">
                      Twist Card
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans">
                  Draw a random wild modifier card (e.g. &quot;Explain in 30 words&quot; or &quot;ALL CAPS&quot;).
                </p>
              </div>
            </motion.div>

            {/* Stage 3 */}
            <motion.div
              whileHover={{ y: -5, scale: 1.01 }}
              className="bg-[#07070d] border border-[#FF00C8]/25 hover:border-[#FF00C8]/50 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 shadow-xl flex flex-col justify-between"
            >
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background: "linear-gradient(90deg, #FF00C8, transparent)",
                }}
              />
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#FF00C8]/15 border border-[#FF00C8]/35 flex items-center justify-center text-[#FF00C8] font-mono font-black text-base shadow-lg shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white tracking-tight">
                      Stage 3
                    </h3>
                    <p className="text-[11px] font-mono font-bold text-[#FF00C8] uppercase tracking-wider">
                      Pitch Wild
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans">
                  Craft your final solution pitch abiding by the Twist Card. Graded by AI + open to community voting!
                </p>
              </div>
            </motion.div>
          </div>

          {/* Rules & Rewards Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#07070d]/80 border border-white/8 p-6 rounded-2xl transition hover:border-white/15">
              <p className="text-[#FFD700] font-mono font-bold text-xs uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <Trophy size={15} /> Payout & Rewards
              </p>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans">
                Complete all 3 stages for a{" "}
                <span className="text-white font-bold">75 gBit base</span>, plus
                up to{" "}
                <span className="text-[#FF00C8] font-bold">
                  +25 quality bonus
                </span>{" "}
                based on your AI score.
              </p>
            </div>

            <div className="bg-[#07070d]/80 border border-white/8 p-6 rounded-2xl transition hover:border-white/15">
              <p className="text-[#00F0FF] font-mono font-bold text-xs uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <Target size={15} /> Terminal Wall Impact
              </p>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans">
                Arena gBits directly boost your level and weekly rank on the{" "}
                <span className="text-[#00F0FF] font-bold">Terminal Wall</span>{" "}
                leaderboard.
              </p>
            </div>

            <div className="bg-[#07070d]/80 border border-white/8 p-6 rounded-2xl transition hover:border-white/15">
              <p className="text-[#22C55E] font-mono font-bold text-xs uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <Users size={15} /> Community Feed
              </p>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans">
                After finishing, your pitch unlocks in the community feed where
                fellow Glitchers react with 🔥 emojis.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── TERMINAL WALL RANKING TEASER ── */}
      <section className="max-w-6xl mx-auto px-6 pb-24 w-full">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#0f0f14] p-8 md:p-10 shadow-2xl"
        >
          {/* Background Ambient Glow */}
          <div
            className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none"
            style={{ background: "#FFD700" }}
          />

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 text-[10px] font-bold font-mono tracking-widest uppercase bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-full text-[#FFD700]">
                <Trophy size={11} /> Global Rankings
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
                Climb The Terminal Wall
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-6">
                See where you stand against thousands of creators worldwide.
                Complete arena events, rack up gBits, and claim your spot on the
                live Terminal Wall leaderboard.
              </p>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/terminal-wall")}
                className="px-6 py-3 rounded-xl font-bold text-xs text-black bg-[#FFD700] hover:bg-[#ffe240] transition cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.3)]"
              >
                Go to Terminal Wall Leaderboard →
              </motion.button>
            </div>

            {/* Rank preview cards */}
            <div className="flex flex-col gap-2.5 w-full lg:w-72 shrink-0">
              {[
                {
                  rank: "🥇 #1",
                  title: "Overclocker Champion",
                  badge: "Legend",
                  color: "#FFD700",
                },
                {
                  rank: "🥈 #2",
                  title: "Glitch Master",
                  badge: "Pro",
                  color: "#9CA3AF",
                },
                {
                  rank: "🥉 #3",
                  title: "Code Vanguard",
                  badge: "Elite",
                  color: "#D97706",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-[#070709] border border-white/5 rounded-2xl px-4 py-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="font-mono font-black"
                      style={{ color: item.color }}
                    >
                      {item.rank}
                    </span>
                    <span className="text-gray-300 font-semibold">
                      {item.title}
                    </span>
                  </div>
                  <span
                    className="text-[9px] font-mono font-bold px-2 py-0.5 rounded"
                    style={{
                      color: item.color,
                      background: `${item.color}15`,
                      border: `1px solid ${item.color}30`,
                    }}
                  >
                    {item.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

        <Footer />
      </div>
    </div>
  );
};

export default GameArena;
