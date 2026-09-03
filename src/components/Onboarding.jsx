import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Gamepad2,
  Rocket,
  Trophy,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const slides = [
  {
    id: "welcome",
    title: "Welcome to Glitch Room ⚡",
    subtitle: "Your ultimate playground for solving code glitches, competing in hackathons, and earning rewards.",
    icon: Zap,
    color: "#00F0FF",
    badge: "Level Up Your Code",
    highlights: [
      "100 gBits Welcome Bonus Credited to your profile",
      "Daily Fact Bubble bonuses (+10 gBits every 24h)",
      "Real-time XP, Level progression & Uptime Streaks",
    ],
  },
  {
    id: "arena",
    title: "Game Arena 🎮",
    subtitle: "Sharpen your real-world engineering skills across 4 interactive challenge modes.",
    icon: Gamepad2,
    color: "#FF00C8",
    badge: "4 Solvable Modes",
    highlights: [
      "Daily Glitch Solves (Debug real code snippet bugs)",
      "AI Challenges & Prompt Engineering Tests",
      "Creative Sparks & Speed Demon Performance Badges",
    ],
  },
  {
    id: "creator_rooms",
    title: "Creator Rooms 🎨",
    subtitle: "Join community hubs or build your own custom coding rooms for friends and teams.",
    icon: Rocket,
    color: "#a855f7",
    badge: "Community Hubs",
    highlights: [
      "Host custom problem sets & quizzes",
      "Live Room Leaderboards & Discussions",
      "Share rooms with your university or community",
    ],
  },
  {
    id: "pro_rooms",
    title: "Pro Rooms 🏆",
    subtitle: "Compete in verified organization hackathons, assessments, and gBits prize pools.",
    icon: Trophy,
    color: "#f59e0b",
    badge: "Verified Competitions",
    highlights: [
      "Official University & Industry Competitions",
      "gBits & Cash Prize Pools for top performers",
      "Strict 5-phase timeline & live timed assessments",
    ],
  },
];

const Onboarding = ({ onFinish }) => {
  const navigate = useNavigate();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const markCompleted = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (user) {
        localStorage.setItem(`onboarding_done_${user.id}`, "true");
      }
    } catch (e) {
      console.error("Error setting onboarding completed flag:", e);
    }
    if (onFinish) onFinish();
  };

  const handleSkip = () => {
    markCompleted();
  };

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    } else {
      markCompleted();
      navigate("/explore");
    }
  };

  const handleBack = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const currentSlide = slides[currentSlideIndex];
  const Icon = currentSlide.icon;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 sm:p-10 bg-[#05050c]/95 backdrop-blur-2xl font-sans overflow-y-auto">
      {/* Background Orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ background: currentSlide.color }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ background: "#FF00C8" }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg rounded-3xl p-6 sm:p-8 bg-[#0c0c16] border border-white/12 shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col justify-between my-auto max-h-[85vh]"
      >
        {/* Top Gradient Accent Line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] transition-all duration-500"
          style={{
            background: `linear-gradient(90deg, transparent, ${currentSlide.color}, #FF00C8, transparent)`,
          }}
        />

        {/* Top Header Controls */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white">
              <Sparkles size={14} className="text-[#00F0FF]" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-gray-300">
              Feature Catalog
            </span>
          </div>

          <button
            onClick={handleSkip}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
          >
            Skip Tour <X size={13} />
          </button>
        </div>

        {/* Slide Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.25 }}
            className="flex-1 py-2"
          >
            {/* Visual Icon Badge */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 border shadow-lg transition-colors duration-300"
              style={{
                background: `${currentSlide.color}15`,
                borderColor: `${currentSlide.color}40`,
                color: currentSlide.color,
                boxShadow: `0 0 25px ${currentSlide.color}20`,
              }}
            >
              <Icon size={32} />
            </div>

            <span
              className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3"
              style={{
                background: `${currentSlide.color}15`,
                color: currentSlide.color,
                border: `1px solid ${currentSlide.color}30`,
              }}
            >
              {currentSlide.badge}
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-white mb-2 leading-tight">
              {currentSlide.title}
            </h2>

            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-5">
              {currentSlide.subtitle}
            </p>

            {/* Highlights List */}
            <div className="space-y-2.5 bg-[#06060c] border border-white/5 rounded-2xl p-4 mb-6">
              {currentSlide.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-gray-300">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom Pagination & Nav */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between shrink-0">
          {/* Step Dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentSlideIndex
                    ? "w-6 bg-[#00F0FF]"
                    : "w-1.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {currentSlideIndex > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer shadow-lg"
              style={{
                background: currentSlideIndex === slides.length - 1 ? "#FF00C8" : "#00F0FF",
                color: "#000",
              }}
            >
              {currentSlideIndex === slides.length - 1 ? (
                <>
                  Get Started <ShieldCheck size={15} />
                </>
              ) : (
                <>
                  Next <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
