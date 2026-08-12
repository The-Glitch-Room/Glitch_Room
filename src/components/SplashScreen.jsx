import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";

// Time-aware, glitch-themed greeting words
const getTimeGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 8) return { word: "early bird", emoji: "🌅" };
  if (h >= 8 && h < 12) return { word: "morning builder", emoji: "☀️" };
  if (h >= 12 && h < 17) return { word: "afternoon fixer", emoji: "🔧" };
  if (h >= 17 && h < 21) return { word: "evening creator", emoji: "🌆" };
  if (h >= 21 && h < 24) return { word: "night owl", emoji: "🌙" };
  return { word: "midnight glitcher", emoji: "✨" };
};

const SYSTEM_MODULES = [
  "CONNECTING_NEURAL_LINK",
  "LOADING_GLITCH_ARENAS",
  "INITIALIZING_COMMUNITY_FEED",
  "SYSTEM_READY",
];

const SplashScreen = ({ onComplete }) => {
  const [phase, setPhase] = useState("enter"); // enter | glitch | exit
  const [firstName, setFirstName] = useState(null);
  const [greeting] = useState(getTimeGreeting());
  const [moduleIndex, setModuleIndex] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user) return;
        const name =
          user.user_metadata?.full_name?.split(" ")[0] ||
          user.email?.split("@")[0] ||
          null;
        if (name) setFirstName(name);
      } catch (err) {
        // fail silently
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    // Module loading progression
    const mInterval = setInterval(() => {
      setModuleIndex((prev) => (prev < SYSTEM_MODULES.length - 1 ? prev + 1 : prev));
    }, 450);

    const t1 = setTimeout(() => setPhase("glitch"), 700);
    const t2 = setTimeout(() => setPhase("exit"), 2000);
    const t3 = setTimeout(() => onComplete(), 2500);

    return () => {
      clearInterval(mInterval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === "exit" ? 0 : 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center selection:bg-[#00F0FF]/20 overflow-hidden"
          style={{ background: "#080810" }}
        >
          {/* Cyber Grid Background */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(0,240,255,0.2) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(0,240,255,0.2) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />

          {/* Ambient Radial Glow Orbs */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/3 left-1/3 w-[450px] h-[450px] rounded-full blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, #00F0FF, transparent 70%)" }}
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.12, 0.22, 0.12] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/3 right-1/3 w-[450px] h-[450px] rounded-full blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, #FF00C8, transparent 70%)" }}
          />

          {/* Scanning Beam */}
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: "200%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-x-0 h-32 pointer-events-none opacity-20"
            style={{
              background: "linear-gradient(to bottom, transparent, rgba(0,240,255,0.4), transparent)",
            }}
          />

          {/* Core Content Container */}
          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md w-full">
            {/* Time-Aware Greeting Pill */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 mb-8 backdrop-blur-md shadow-lg"
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="text-xs text-[#00F0FF]"
              >
                ✦
              </motion.span>
              <p className="text-xs sm:text-sm font-medium text-gray-300">
                {firstName ? (
                  <>
                    Welcome back, <span className="text-white font-bold">{firstName}</span> 👋
                  </>
                ) : (
                  <>
                    Hello, <span className="text-white font-bold">{greeting.emoji} {greeting.word}</span>
                  </>
                )}
              </p>
            </motion.div>

            {/* Glitch Logo & Aberration Effect */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative mb-6"
            >
              <motion.div
                animate={
                  phase === "glitch"
                    ? {
                        x: [0, -4, 5, -2, 3, 0],
                        filter: [
                          "none",
                          "drop-shadow(5px 0 0 #FF00C8) drop-shadow(-5px 0 0 #00F0FF)",
                          "none",
                          "drop-shadow(-4px 0 0 #FF00C8) drop-shadow(4px 0 0 #00F0FF)",
                          "none",
                        ],
                      }
                    : {}
                }
                transition={{ duration: 0.5 }}
                className="relative p-4 rounded-3xl bg-[#0d0d14]/80 border border-white/10 shadow-[0_0_30px_rgba(0,240,255,0.15)]"
              >
                <img
                  src="/logo_GR.png"
                  alt="Glitch Room"
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain relative z-10"
                />
              </motion.div>
            </motion.div>

            {/* Brand Title with Glitch Shimmer */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mb-8"
            >
              <motion.h1
                className="text-3xl sm:text-4xl font-black tracking-wider uppercase"
                animate={
                  phase === "glitch"
                    ? {
                        textShadow: [
                          "none",
                          "3px 0 0 #FF00C8, -3px 0 0 #00F0FF",
                          "none",
                          "-3px 0 0 #FF00C8, 3px 0 0 #00F0FF",
                          "none",
                        ],
                      }
                    : {}
                }
                transition={{ duration: 0.4 }}
                style={{
                  background: "linear-gradient(90deg, #00F0FF, #FF00C8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                GLITCH ROOM
              </motion.h1>
              <p className="text-[11px] text-gray-500 font-mono uppercase tracking-[0.25em] mt-1.5">
                Where Chaos Sparks Creativity
              </p>
            </motion.div>

            {/* Dynamic System Module Progress */}
            <div className="w-full max-w-xs space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                <span className="flex items-center gap-1.5 text-[#00F0FF]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                  {SYSTEM_MODULES[moduleIndex]}
                </span>
                <span>{Math.round(((moduleIndex + 1) / SYSTEM_MODULES.length) * 100)}%</span>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: `${((moduleIndex + 1) / SYSTEM_MODULES.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #00F0FF, #FF00C8)",
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
