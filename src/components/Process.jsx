import React from "react";
import { motion } from "framer-motion";
import {
  Search,
  CheckCircle2,
  MessageSquare,
  Flame,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import SectionEyebrow from "./SectionEyebrow";

const Process = () => {
  return (
    <section className="relative bg-transparent py-20 sm:py-28 border-t border-white/5 overflow-hidden">
      {/* Subtle ambient lighting */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full pointer-events-none opacity-[0.03] blur-[140px]"
        style={{ background: "#00F0FF" }}
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <SectionEyebrow accent="cyan" align="center" variant="label">
            THE WORKFLOW
          </SectionEyebrow>

          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white mt-3 mb-4"
            style={{
              textShadow:
                "-2px 0 0 rgba(0,240,255,0.4), 2px 0 0 rgba(255,0,200,0.4)",
            }}
          >
            HOW GLITCH ROOM WORKS
          </motion.h2>

          <p className="text-gray-400 text-sm sm:text-base leading-relaxed font-sans">
            See how developers move from finding something to work on{" "}
            <span className="text-gray-600 px-1 font-mono">→</span>{" "}
            <span className="text-gray-300">actually doing it</span>{" "}
            <span className="text-gray-600 px-1 font-mono">→</span>{" "}
            <span className="text-gray-300">sharing</span>{" "}
            <span className="text-gray-600 px-1 font-mono">→</span>{" "}
            <span className="text-[#00F0FF] font-semibold">connecting</span>.
          </p>
        </div>

        {/* Asymmetric Bento Grid (5 Connected Journey Pieces) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Block 1: EXPLORE (Large — spans 7 cols on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -3 }}
            className="relative group rounded-3xl p-6 sm:p-7 bg-[#0b0b14]/90 border border-white/[0.06] hover:border-cyan-500/30 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(0,240,255,0.07)] md:col-span-2 lg:col-span-7"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/[0.03] rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/[0.06] transition-colors" />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-400">
                  EXPLORE
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Find Your Next Room
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-md">
                Discover live creator spaces, hands-on challenges, and active developer discussions.
              </p>
            </div>

            {/* Miniature Explore UI Preview */}
            <div className="mt-6 p-4 rounded-2xl bg-black/60 border border-white/[0.06] group-hover:border-white/10 transition-colors">
              {/* Mini search bar */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-gray-400 font-mono mb-3">
                <Search size={13} className="text-gray-500" />
                <span className="text-gray-400">Search rooms, tech stacks, or bugs...</span>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-2 mb-3 font-mono text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">
                  Creator Rooms
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.03] text-gray-400 border border-white/5">
                  Pro Rooms
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.03] text-gray-400 border border-white/5">
                  Challenges
                </span>
              </div>

              {/* Sample mini room cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-1">
                    <span className="text-cyan-400 font-semibold">Creator Room</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-400" /> Live
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-white truncate">
                    Building a Distributed Key-Value Store
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-1">
                    <span className="text-purple-400 font-semibold">Pro Room</span>
                    <span className="text-gray-400">Open Access</span>
                  </div>
                  <span className="text-xs font-semibold text-white truncate">
                    Fullstack Realtime Chat Architecture
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Block 2: WORK (Medium — spans 5 cols on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -3 }}
            className="relative group rounded-3xl p-6 sm:p-7 bg-[#0b0b14]/90 border border-white/[0.06] hover:border-pink-500/30 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(255,0,200,0.07)] md:col-span-2 lg:col-span-5"
          >
            <div className="absolute top-0 right-0 w-52 h-52 bg-pink-500/[0.03] rounded-full blur-3xl pointer-events-none group-hover:bg-pink-500/[0.06] transition-colors" />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF00C8]" />
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-pink-400">
                  WORK
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Work on Something Real
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                Fix broken codebases, reproduce tricky bugs, and solve practical engineering challenges.
              </p>
            </div>

            {/* Miniature Code/Glitch Interface */}
            <div className="mt-6 p-4 rounded-2xl bg-black/60 border border-white/[0.06] font-mono text-xs text-gray-300">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[11px] text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500/80" />
                  <span className="w-2 h-2 rounded-full bg-yellow-500/80" />
                  <span className="w-2 h-2 rounded-full bg-green-500/80" />
                  <span className="ml-1 text-gray-400">runtime_debug.ts</span>
                </div>
                <span className="text-pink-400 text-[10px]">BUG FIXING</span>
              </div>

              <div className="text-[11px] leading-relaxed">
                <p className="text-gray-500 line-through">// Memory leak on uncleaned socket</p>
                <p className="text-red-400/90">- socket.on("packet", appendBuffer);</p>
                <p className="text-emerald-400">+ return () =&gt; socket.off("packet", appendBuffer);</p>
              </div>

              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Clean teardown verified
                </span>
                <span className="text-gray-400">Runtime isolate</span>
              </div>
            </div>
          </motion.div>

          {/* Block 3: SHARE (Small — spans 4 cols on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            whileHover={{ y: -3 }}
            className="relative group rounded-3xl p-6 bg-[#0b0b14]/90 border border-white/[0.06] hover:border-cyan-500/30 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(0,240,255,0.07)] md:col-span-1 lg:col-span-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-400">
                  SHARE
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Show Your Proof
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                Document daily progress and turn real building sessions into transparent proof of work.
              </p>
            </div>

            {/* Miniature Proof of Work Preview */}
            <div className="mt-5 p-3.5 rounded-2xl bg-black/60 border border-white/[0.06] font-mono text-xs">
              <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2 border-b border-white/5 pb-1.5">
                <span className="text-gray-300 font-semibold">Daily Standup</span>
                <span className="text-cyan-400">Logged</span>
              </div>
              <div className="space-y-1.5 text-[11px] text-gray-300">
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span>Rebuilt state machine parser</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span>Benchmarked cache invalidation</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Block 4: CONNECT (Medium — spans 5 cols on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -3 }}
            className="relative group rounded-3xl p-6 bg-[#0b0b14]/90 border border-white/[0.06] hover:border-purple-500/30 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(168,85,247,0.07)] md:col-span-1 lg:col-span-5"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7]" />
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-purple-400">
                  CONNECT
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Find People to Learn With
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                Discover developers through what they build, exchange feedback, and pair up on projects.
              </p>
            </div>

            {/* Miniature Developer Profile & Chat Preview */}
            <div className="mt-5 p-3.5 rounded-2xl bg-black/60 border border-white/[0.06] font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-[10px] text-purple-300 font-bold">
                    DV
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block leading-none">dev_alex</span>
                    <span className="text-[9px] text-gray-500">Systems &amp; Rust</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Peer
                </span>
              </div>

              <div className="text-[11px] text-gray-300 bg-white/[0.02] p-2 rounded-xl border border-white/5 flex items-start gap-2">
                <MessageSquare size={12} className="text-purple-400 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  "Saw your approach on consensus protocols. Let's collaborate on the next build."
                </span>
              </div>
            </div>
          </motion.div>

          {/* Block 5: GROW (Small — spans 3 cols on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            whileHover={{ y: -3 }}
            className="relative group rounded-3xl p-6 bg-[#0b0b14]/90 border border-white/[0.06] hover:border-amber-500/30 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(255,215,0,0.07)] md:col-span-2 lg:col-span-3"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-amber-400">
                  GROW
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Keep Moving
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                Maintain consistent uptime, earn credentials, and watch your progress compound.
              </p>
            </div>

            {/* Miniature Progress & Uptime Preview without fake numbers */}
            <div className="mt-5 p-3.5 rounded-2xl bg-black/60 border border-white/[0.06] font-mono">
              <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
                <span className="text-gray-300 font-semibold">Uptime Activity</span>
                <span className="text-amber-400 flex items-center gap-1">
                  <Flame size={10} /> Consistent
                </span>
              </div>

              {/* Uptime blocks heatmap */}
              <div className="grid grid-cols-7 gap-1 mb-2.5">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-3 rounded-sm ${
                      i % 5 !== 0
                        ? "bg-amber-400/70 shadow-[0_0_6px_rgba(251,191,36,0.3)]"
                        : "bg-white/10"
                    }`}
                  />
                ))}
              </div>

              <div className="text-[10px] text-gray-400 flex items-center gap-1.5 pt-1.5 border-t border-white/5">
                <Sparkles size={11} className="text-amber-400" />
                <span>Verified Skill Badges</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Process;
