import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Code2,
  Bug,
  Users,
  Flame,
  Award,
  ChevronRight,
  ArrowRight,
  Terminal,
  CheckCircle2,
} from "lucide-react";
import SectionEyebrow from "./SectionEyebrow";
import Button from "./Button";

const PANELS = [
  {
    id: "01",
    tag: "BUILD IN PUBLIC",
    title: "Build & Show Your Work",
    description:
      "Share your projects, daily progress, and proof of work so others can see what you're building.",
    icon: Code2,
    accent: "#00F0FF",
    accentRgb: "0, 240, 255",
    terminalLabel: "Creator Room · Live Standup",
    headerTag: "IN PUBLIC",
    codeSnippet: 'git commit -m "feat: ship core engine updates"',
    footerText: "Daily progress and proof of work shared with developers",
  },
  {
    id: "02",
    tag: "SOLVE REAL PROBLEMS",
    title: "Practice Through Problems",
    description:
      "Go beyond tutorials by solving broken code, debugging challenges, and practical problems.",
    icon: Bug,
    accent: "#FF00C8",
    accentRgb: "255, 0, 200",
    terminalLabel: "Arena Debugger · Real Bug",
    headerTag: "RUNTIME",
    codeSnippet: "Runtime isolate fix confirmed across all test suites",
    footerText: "Hands-on problem solving with real failure cases",
  },
  {
    id: "03",
    tag: "LEARN TOGETHER",
    title: "Connect & Collaborate",
    description:
      "Discover what other developers are working on, learn from their approach, and find people to learn or build with.",
    icon: Users,
    accent: "#a855f7",
    accentRgb: "168, 85, 247",
    terminalLabel: "Builder Squad · Peer Learning",
    headerTag: "COMMUNITY",
    codeSnippet: "Live architectural review and pair problem solving",
    footerText: "Collaborative feedback and peer learning from other devs",
  },
  {
    id: "04",
    tag: "STAY ACCOUNTABLE",
    title: "Build Consistency",
    description:
      "Use Creator Rooms, daily proof of work, uptime, and progress tracking to keep moving forward.",
    icon: Flame,
    accent: "#FF6B00",
    accentRgb: "255, 107, 0",
    terminalLabel: "Consistency · Daily Proof of Work",
    headerTag: "PROGRESS",
    codeSnippet: "Daily standup logged and progress tracker updated",
    footerText: "Building consistent habits that compound over time",
  },
  {
    id: "05",
    tag: "GROW & GET RECOGNIZED",
    title: "Show Your Growth",
    description:
      "Earn badges, build your developer profile, showcase your work, and make your progress visible.",
    icon: Award,
    accent: "#00FF88",
    accentRgb: "0, 255, 136",
    terminalLabel: "Developer Profile · Skill Progress",
    headerTag: "PORTFOLIO",
    codeSnippet: "Public showcase and skill achievements displayed",
    footerText: "Showcase what you build to the entire developer community",
  },
];

const WhyChooseUs = () => {
  const [activeId, setActiveId] = useState("01");

  return (
    <section className="relative bg-transparent text-white py-20 sm:py-28 overflow-hidden border-t border-white/5">
      {/* Background glow effects */}
      <div
        className="absolute top-1/3 left-10 w-[450px] h-[450px] rounded-full pointer-events-none opacity-[0.035] blur-[120px]"
        style={{ background: "#00F0FF" }}
      />
      <div
        className="absolute bottom-10 right-10 w-[450px] h-[450px] rounded-full pointer-events-none opacity-[0.035] blur-[120px]"
        style={{ background: "#FF00C8" }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col lg:flex-row lg:items-stretch gap-10 xl:gap-14">
          {/* Left Column: Heading, Pitch & CTA */}
          <div className="lg:w-[320px] xl:w-[360px] shrink-0 flex flex-col justify-between">
            <div>
              {/* Eyebrow */}
              <SectionEyebrow accent="cyan" align="left" variant="label">
                WHY GLITCH ROOM
              </SectionEyebrow>

              {/* Main Heading */}
              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-3xl sm:text-4xl lg:text-4xl xl:text-[42px] font-black tracking-tight leading-[1.15] text-white mt-4 mb-4"
                style={{
                  textShadow:
                    "-2px 0 0 rgba(0,240,255,0.4), 2px 0 0 rgba(255,0,200,0.4)",
                }}
              >
                MORE THAN JUST CODING.
              </motion.h2>

              {/* Underline accent */}
              <div className="h-[2px] w-14 rounded-full bg-[#00F0FF] mb-5 shadow-[0_0_10px_rgba(0,240,255,0.6)]" />

              {/* Subtitle */}
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-sans mb-8">
                Build your skills, share your work, learn with others, and keep
                moving forward.
              </p>

              {/* Mini quick-select pills for accessibility / navigation */}
              <div className="space-y-1.5 hidden lg:block mb-8">
                <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase block mb-2">
                  EXPLORE PLATFORM PILLARS
                </span>
                {PANELS.map((p) => {
                  const isActive = p.id === activeId;
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setActiveId(p.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-mono text-xs transition-all duration-200 ${
                        isActive
                          ? "bg-white/10 text-white border border-white/15"
                          : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: isActive ? p.accent : "#4b5563",
                          }}
                        />
                        <span className="font-bold opacity-60">{p.id}</span>
                        <span className="truncate">{p.tag}</span>
                      </span>
                      <Icon
                        size={13}
                        style={{ color: isActive ? p.accent : "#6b7280" }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <Link to="/join-room">
                <Button content="Explore Rooms" accent="pink" />
              </Link>
            </div>
          </div>

          {/* Right Column: 5 Interactive Expanding Panels */}
          <div className="flex-1 w-full min-w-0">
            {/* Desktop: Horizontal Expanding Showcase */}
            <div className="hidden lg:flex flex-row gap-3 h-[520px]">
              {PANELS.map((panel) => {
                const isActive = panel.id === activeId;
                const Icon = panel.icon;

                return (
                  <motion.div
                    layout
                    key={panel.id}
                    onClick={() => setActiveId(panel.id)}
                    onMouseEnter={() => setActiveId(panel.id)}
                    transition={{
                      type: "spring",
                      stiffness: 320,
                      damping: 32,
                    }}
                    className={`relative rounded-3xl overflow-hidden cursor-pointer border transition-colors duration-300 flex flex-col justify-between ${
                      isActive
                        ? "flex-[3.8] bg-[#0c0c16] shadow-2xl"
                        : "flex-1 bg-[#090911]/90 hover:bg-[#0c0c16]/90"
                    }`}
                    style={{
                      borderColor: isActive
                        ? `${panel.accent}55`
                        : "rgba(255,255,255,0.06)",
                      boxShadow: isActive
                        ? `0 0 35px ${panel.accent}20`
                        : "none",
                    }}
                  >
                    {/* Background subtle mesh / grid */}
                    <div
                      className="absolute inset-0 opacity-[0.04] pointer-events-none"
                      style={{
                        backgroundImage: `radial-gradient(${panel.accent} 1px, transparent 1px)`,
                        backgroundSize: "20px 20px",
                      }}
                    />

                    {/* Top ambient glow blob */}
                    <div
                      className="absolute -top-20 -right-20 w-52 h-52 rounded-full pointer-events-none transition-opacity duration-500 blur-3xl"
                      style={{
                        background: panel.accent,
                        opacity: isActive ? 0.12 : 0.03,
                      }}
                    />

                    {/* Header bar / Number */}
                    <div className="relative z-10 p-5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="font-mono text-sm font-bold tracking-widest px-2 py-0.5 rounded-md"
                          style={{
                            color: panel.accent,
                            backgroundColor: `${panel.accent}15`,
                            border: `1px solid ${panel.accent}30`,
                          }}
                        >
                          {panel.id}
                        </span>

                        {isActive && (
                          <motion.span
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-[11px] font-mono font-bold tracking-wider uppercase text-gray-400"
                          >
                            {panel.tag}
                          </motion.span>
                        )}
                      </div>

                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300"
                        style={{
                          backgroundColor: `${panel.accent}15`,
                          color: panel.accent,
                        }}
                      >
                        <Icon size={16} />
                      </div>
                    </div>

                    {/* Content Body: Active vs Collapsed */}
                    {isActive ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, delay: 0.1 }}
                        className="relative z-10 px-6 pb-6 pt-2 flex flex-col justify-end h-full"
                      >
                        {/* Main Title & Description */}
                        <div>
                          <h3 className="text-2xl xl:text-3xl font-black text-white tracking-tight leading-snug">
                            {panel.title}
                          </h3>
                          <p className="text-gray-300 text-sm leading-relaxed font-sans mt-3 max-w-lg">
                            {panel.description}
                          </p>
                        </div>

                        {/* Interactive Glitch Room Terminal / Feature Visual */}
                        <div
                          className="mt-6 p-4 rounded-2xl bg-black/50 border backdrop-blur-md font-mono"
                          style={{ borderColor: `${panel.accent}30` }}
                        >
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[11px]">
                            <span className="flex items-center gap-2 text-gray-300">
                              <span
                                className="w-1.5 h-1.5 rounded-full animate-pulse"
                                style={{ backgroundColor: panel.accent }}
                              />
                              {panel.terminalLabel}
                            </span>
                            <span
                              className="text-[10px] font-bold tracking-wider uppercase opacity-80"
                              style={{ color: panel.accent }}
                            >
                              {panel.headerTag}
                            </span>
                          </div>

                          <div className="text-xs text-gray-200 flex items-center gap-2 py-0.5">
                            <span className="text-gray-500 font-bold">$</span>
                            <span className="text-white">
                              {panel.codeSnippet}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5 text-[11px] text-gray-400">
                            <CheckCircle2 size={13} style={{ color: panel.accent }} />
                            <span>{panel.footerText}</span>
                          </div>
                        </div>

                        {/* Bottom accent line */}
                        <div
                          className="mt-5 h-[2px] w-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${panel.accent}, transparent)`,
                          }}
                        />
                      </motion.div>
                    ) : (
                      /* Collapsed View on Desktop: Vertical Title Strip */
                      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
                        <div
                          className="[writing-mode:vertical-rl] rotate-180 font-mono text-xs font-bold tracking-widest uppercase text-gray-400 group-hover:text-white transition-colors duration-200 select-none whitespace-nowrap"
                        >
                          {panel.tag}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Mobile & Tablet: Stacked Accordion with Vertical Expansion */}
            <div className="flex lg:hidden flex-col gap-3">
              {PANELS.map((panel) => {
                const isActive = panel.id === activeId;
                const Icon = panel.icon;

                return (
                  <motion.div
                    layout
                    key={panel.id}
                    onClick={() => setActiveId(panel.id)}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                    className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
                      isActive
                        ? "bg-[#0c0c16] shadow-xl"
                        : "bg-[#090911]/90 hover:bg-[#0c0c16]/70"
                    }`}
                    style={{
                      borderColor: isActive
                        ? `${panel.accent}55`
                        : "rgba(255,255,255,0.06)",
                    }}
                  >
                    {/* Collapsed Header / Trigger bar */}
                    <div className="p-4 flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span
                          className="font-mono text-xs font-bold px-2 py-0.5 rounded"
                          style={{
                            color: panel.accent,
                            backgroundColor: `${panel.accent}15`,
                          }}
                        >
                          {panel.id}
                        </span>

                        <span className="font-bold text-sm text-white">
                          {panel.tag}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                          style={{
                            backgroundColor: `${panel.accent}15`,
                            color: panel.accent,
                          }}
                        >
                          <Icon size={14} />
                        </div>
                        <ChevronRight
                          size={16}
                          className={`text-gray-500 transition-transform duration-200 ${
                            isActive ? "rotate-90 text-white" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {/* Expanded Mobile Content */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="px-4 pb-5 pt-1 border-t border-white/5"
                        >
                          <h4 className="text-lg font-bold text-white mt-2">
                            {panel.title}
                          </h4>
                          <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                            {panel.description}
                          </p>

                          {/* Terminal preview for mobile */}
                          <div
                            className="mt-4 p-3 rounded-xl bg-black/50 border font-mono text-[11px]"
                            style={{ borderColor: `${panel.accent}25` }}
                          >
                            <div className="text-gray-400 mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: panel.accent }}
                                />
                                {panel.terminalLabel}
                              </span>
                              <span
                                className="text-[9px] font-bold tracking-wider uppercase opacity-80"
                                style={{ color: panel.accent }}
                              >
                                {panel.headerTag}
                              </span>
                            </div>
                            <div className="text-white text-xs py-0.5">
                              $ {panel.codeSnippet}
                            </div>
                            <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-1.5 pt-1.5 border-t border-white/5">
                              <CheckCircle2 size={11} style={{ color: panel.accent }} />
                              <span>{panel.footerText}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
