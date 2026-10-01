// src/components/Category.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Zap, Shuffle, Megaphone, ArrowRight, ChevronRight, ChevronDown } from "lucide-react";
import PageHeading from "./PageHeading";

const STAGES = [
  {
    number: "01",
    stageKey: "STAGE 01",
    tagline: "STEP 1 OF 3 · DISCOVERY",
    icon: Zap,
    title: "Find the glitch.",
    subtitle: "Break the mold.",
    desc: "Jump into wild, unpredictable challenges where chaos sparks creativity. Spot hidden problems, flip the script, and unleash your boldest ideas.",
  },
  {
    number: "02",
    stageKey: "STAGE 02",
    tagline: "STEP 2 OF 3 · ADAPTATION",
    icon: Shuffle,
    title: "Twist cards.",
    subtitle: "Chaos unlocked.",
    desc: "Draw a random twist and watch your strategy flip. Adapt fast, meme harder, and keep your crew guessing with wild curveballs.",
  },
  {
    number: "03",
    stageKey: "STAGE 03",
    tagline: "STEP 3 OF 3 · SHOWCASE",
    icon: Megaphone,
    title: "Pitch wild.",
    subtitle: "Meme loud. Win big.",
    desc: "Show off your fix with memes, comics, or quick vids. Get live emoji reactions, instant feedback, and Terminal Wall bragging rights.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const Category = () => {
  const navigate = useNavigate();
  const [hoveredStage, setHoveredStage] = useState(null);

  return (
    <section className="py-20 bg-transparent text-white overflow-hidden border-t border-white/5 relative">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── SECTION HEADER ── */}
        <PageHeading
          eyebrow="The Arena"
          title="Step Into the Chaos"
          subtitle="Three stages. One continuous challenge. Only the most creative make it to the end."
          accent="cyan"
          layout="inline"
        />

        {/* ── CONTINUOUS 3-STAGE JOURNEY (Desktop: Horizontal | Mobile: Vertical) ── */}
        <div className="relative">
          {/* Desktop Horizontal Connecting Track (visible md and up) */}
          <div className="hidden md:block absolute top-7 left-[16%] right-[16%] h-[2px] z-0 pointer-events-none">
            {/* Background line */}
            <div className="w-full h-full bg-white/10" />
            {/* Glowing animated line */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#00F0FF]/40 via-[#00F0FF] to-[#00F0FF]/40"
              style={{
                boxShadow: "0 0 10px rgba(0, 240, 255, 0.5)",
              }}
            />
          </div>

          {/* Stages Grid / Flow */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative z-10"
          >
            {STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isHovered = hoveredStage === idx;

              return (
                <div key={stage.number} className="relative flex flex-col">
                  {/* Mobile Vertical Connector Line (between stages) */}
                  {idx < STAGES.length - 1 && (
                    <div className="md:hidden absolute left-7 top-14 bottom-[-32px] w-[2px] bg-gradient-to-b from-[#00F0FF] to-[#00F0FF]/20 z-0" />
                  )}

                  {/* Stage Node Header (Numbered marker + Icon + Stage key) */}
                  <div className="flex items-center gap-3.5 mb-4 z-10">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center font-mono font-black text-sm shrink-0 transition-all duration-300 border ${
                        isHovered
                          ? "bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.4)] scale-105"
                          : "bg-[#0d0d18] border-white/15 text-white shadow-lg"
                      }`}
                    >
                      <div className="flex flex-col items-center leading-none">
                        <Icon size={16} className={isHovered ? "text-[#00F0FF]" : "text-gray-300"} />
                        <span className="text-[11px] font-mono font-bold mt-1 text-[#00F0FF]">
                          {stage.number}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold tracking-widest text-[#00F0FF] uppercase">
                          {stage.stageKey}
                        </span>
                        {idx < STAGES.length - 1 && (
                          <span className="hidden md:inline-flex text-[10px] font-mono text-gray-500 items-center">
                            ──→
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-gray-400 block truncate">
                        {stage.tagline}
                      </span>
                    </div>
                  </div>

                  {/* Stage Card */}
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                    onMouseEnter={() => setHoveredStage(idx)}
                    onMouseLeave={() => setHoveredStage(null)}
                    className={`flex-1 rounded-2xl p-6 transition-all duration-300 bg-[#0c0c16] border flex flex-col justify-between relative overflow-hidden shadow-xl ${
                      isHovered
                        ? "border-[#00F0FF]/40 shadow-[0_0_25px_rgba(0,240,255,0.12)]"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    {/* Top edge accent glow */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[2px] transition-all duration-300"
                      style={{
                        background: isHovered
                          ? "linear-gradient(90deg, transparent, #00F0FF, transparent)"
                          : "transparent",
                      }}
                    />

                    <div>
                      {/* Titles */}
                      <h3 className="text-lg font-bold text-white tracking-tight mb-1">
                        {stage.title}
                      </h3>
                      <h4 className="text-xs font-semibold text-gray-300 font-mono mb-4">
                        {stage.subtitle}
                      </h4>

                      {/* Description */}
                      <p className="text-xs text-gray-400 font-sans leading-relaxed">
                        {stage.desc}
                      </p>
                    </div>

                    {/* Integrated Stage Circuit Indicator */}
                    <div className="pt-5 mt-5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-500">
                      <span className="uppercase">Stage {stage.number} Verified</span>
                      <span className="text-[#00F0FF]/60 font-bold">● ACTIVE</span>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* ── SINGLE UNIFIED PRIMARY CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12 md:mt-16 flex flex-col items-center"
        >
          <p className="text-xs font-mono text-gray-400 mb-4 tracking-wide">
            All 3 stages are part of one continuous challenge
          </p>

          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/game-arena")}
            className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-mono font-black text-xs md:text-sm tracking-widest uppercase text-black bg-[#00F0FF] hover:bg-[#38f8ff] transition-all duration-200 shadow-[0_0_25px_rgba(0,240,255,0.35)] hover:shadow-[0_0_40px_rgba(0,240,255,0.55)] cursor-pointer"
          >
            <span>ENTER THE ARENA</span>
            <ArrowRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default Category;
