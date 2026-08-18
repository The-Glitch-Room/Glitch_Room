import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PageHeading from "./PageHeading";
import StatCard from "./StatCard";
import Button from "./Button";
import GlitchBackground from "./GlitchBackground";
import { useAuth } from "./AuthContext";
import { Heart, Users, Cpu, Globe } from "lucide-react";
import { supabase } from "../supabaseClient";
import { fetchTotalChallengeCount } from "../utils/challengeCountHelper";

// ── Four rules of the room ──────────────────────────────────────────────────
const RULES = [
  {
    icon: <Heart size={20} />,
    title: "Creativity first",
    desc: "We optimize for weird, beautiful, human-made work — not engagement metrics.",
  },
  {
    icon: <Users size={20} />,
    title: "Community-owned",
    desc: "The room is shaped by its members. You vote on the calendar, the rules, and the drops.",
  },
  {
    icon: <Cpu size={20} />,
    title: "Tech as a toy",
    desc: "Shaders, canvas, WebGL, AI — all fair game. We treat the browser like a playground.",
  },
  {
    icon: <Globe size={20} />,
    title: "Open access",
    desc: "A free tier that is actually useful. No paywalls on the core creative loop.",
  },
];

// ── Authentic Glitch Room Platform Journey Timeline ──────────────────────────
const TIMELINE = [
  {
    phase: "PHASE 01 — MAY 2025",
    title: "First External Validation — Unstop Playstorm",
    desc: "Submitted the Glitch Room idea to Unstop Playstorm and successfully cleared Level 1 of the 2-level online event. This was the first major external validation of the idea.",
    isCurrent: false,
  },
  {
    phase: "PHASE 02 — JUNE 2026",
    title: "Buddha Startup PitchFest 1.0",
    desc: "Participated in Buddha Startup PitchFest 1.0 and presented the Glitch Room idea. This experience helped refine the product vision and strengthened the startup direction.",
    isCurrent: false,
  },
  {
    phase: "PHASE 03 — 2026",
    title: "Taking Glitch Room to More Opportunities",
    desc: "After PitchFest, continued submitting and presenting the Glitch Room idea across different startup, innovation, and entrepreneurship opportunities to validate and improve the concept.",
    isCurrent: false,
  },
  {
    phase: "PHASE 04 — AUGUST 2026",
    title: "CSJMU Incubation Cell Pitch",
    desc: "Pitched Glitch Room at the CSJMU incubation cell, bringing the idea closer to an institutional startup/incubation environment.",
    isCurrent: false,
  },
  {
    phase: "PHASE 05 — PRESENT",
    title: "Actively Building Glitch Room",
    desc: "Glitch Room is now being actively developed into a functional platform, with continuous work on its product, features, rooms, assessments, community experience, and overall ecosystem.",
    isCurrent: true,
  },
];

const ACCENT_RULES = "#A855F7";
const ACCENT_RULES_RGB = "168,85,247";
const ACCENT_TIMELINE = "#00F0FF";

const About = () => {
  const { openAuth } = useAuth();
  const [totalChallenges, setTotalChallenges] = useState(0);

  useEffect(() => {
    const updateCount = async () => {
      const count = await fetchTotalChallengeCount();
      setTotalChallenges(count);
    };
    updateCount();

    const channel = supabase
      .channel("about-arena-events")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "arena_events" },
        () => updateCount(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = [
    {
      value: "1+",
      label: "Year of Vision",
      sublabel: "Idea born before the build",
    },
    {
      value: "1",
      label: "Solo Builder",
      sublabel: "Every line written by one person",
    },
    {
      value: String(totalChallenges),
      label: "Challenges Built",
      sublabel: "Across Explore & Arena events",
    },
    { value: "∞", label: "Ambition", sublabel: "No ceiling. Ever." },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative bg-[#0B0C10] text-gray-200 min-h-screen overflow-hidden"
    >
      <GlitchBackground />
      <div className="relative z-10">
        <Navbar />

        {/* ── HERO ── */}
        <section className="relative pt-40 pb-20 px-6 overflow-hidden">
          <div
            className="absolute inset-0 z-0 opacity-10"
            style={{
              backgroundImage: `linear-gradient(rgba(0,240,255,0.2) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(0,240,255,0.2) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
          <div
            className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-10"
            style={{ background: "rgba(0,240,255,1)" }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10"
            style={{ background: "rgba(255,0,200,1)" }}
          />

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <PageHeading
              eyebrow="About"
              title="What is The Glitch Room?"
              subtitle="A gamified engagement and creativity platform built for Gen Z — where making things is the point, and the community decides what hits."
              accent="cyan"
              size="xl"
            />
          </div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="relative z-10 mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {stats.map((s, i) => (
              <StatCard
                key={i}
                value={s.value}
                label={s.label}
                sublabel={s.sublabel}
                accent="cyan"
                variant="boxed"
                delay={0.35 + i * 0.08}
              />
            ))}
          </motion.div>
        </section>

        {/* ── MISSION & VISION ── */}
        <section className="py-16 px-6 bg-transparent">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
            {[
              {
                label: "Our Mission",
                text: "Give every young creator a low-pressure, high-signal place to make, share, and level up — without the algorithm anxiety of traditional social platforms.",
                accent: "#00F0FF",
              },
              {
                label: "Our Vision",
                text: "A generation of creators who treat the web as a canvas, who ship fast and share freely, and who learn by doing in public.",
                accent: "#FF00C8",
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="relative p-7 bg-[#111118]/85 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${card.accent}, transparent)`,
                  }}
                />
                <p className="text-lg font-bold text-white mb-3">{card.label}</p>
                <p className="text-gray-400 text-base leading-relaxed">
                  {card.text}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FOUR RULES OF THE ROOM ── */}
        <section className="py-20 px-6 bg-transparent">
          <div className="max-w-6xl mx-auto">
            <PageHeading
              eyebrow="What We Value"
              title="Four rules of the room"
              accent="purple"
              layout="inline"
            />

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {RULES.map((rule, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="relative p-6 bg-[#111118]/85 backdrop-blur-sm rounded-2xl border transition-all overflow-hidden"
                  style={{ borderColor: `rgba(${ACCENT_RULES_RGB}, 0.18)` }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      background: `rgba(${ACCENT_RULES_RGB}, 0.12)`,
                      color: ACCENT_RULES,
                    }}
                  >
                    {rule.icon}
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">
                    {rule.title}
                  </h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {rule.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── THE GLITCH TIMELINE ── */}
        <section className="py-20 px-6 bg-transparent">
          <div className="max-w-3xl mx-auto">
            <PageHeading
              eyebrow="How We Got Here"
              title="The glitch timeline"
              accent="cyan"
              layout="inline"
            />

            <div className="relative pl-8 sm:pl-10">
              {/* Vertical Glowing Line */}
              <div
                className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full"
                style={{
                  background: `linear-gradient(to bottom, rgba(0,240,255,0.6), rgba(168,85,247,0.6) 70%, rgba(255,0,200,0.9))`,
                  boxShadow: `0 0 8px rgba(0,240,255,0.3)`,
                }}
              />

              <div className="space-y-8 sm:space-y-10">
                {TIMELINE.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -25 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="relative group"
                  >
                    {/* Node Dot */}
                    {item.isCurrent ? (
                      <span
                        className="absolute -left-[38px] sm:-left-[46px] top-5 w-5 h-5 rounded-full border-2 border-[#FF00C8] bg-[#FF00C8] shadow-[0_0_16px_#FF00C8] animate-pulse z-10"
                      />
                    ) : (
                      <span
                        className="absolute -left-[36px] sm:-left-[44px] top-5 w-4 h-4 rounded-full border-2 border-[#00F0FF] bg-[#0B0C10] group-hover:bg-[#00F0FF] transition-colors shadow-[0_0_10px_rgba(0,240,255,0.6)] z-10"
                      />
                    )}

                    {/* Card Content */}
                    <div
                      className={`relative backdrop-blur-md rounded-2xl p-5 sm:p-6 transition-all duration-300 shadow-xl overflow-hidden ${
                        item.isCurrent
                          ? "bg-gradient-to-br from-[#150a24]/90 via-[#0c0c16]/90 to-[#091322]/90 border border-[#FF00C8]/50 shadow-[0_0_30px_rgba(255,0,200,0.2)]"
                          : "bg-[#0f0f14]/85 border border-white/10 hover:border-purple-500/40 hover:bg-[#13131c]/90"
                      }`}
                    >
                      {item.isCurrent && (
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#FF00C8]" />
                      )}

                      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                        <p
                          className={`text-xs font-bold uppercase tracking-widest font-mono ${
                            item.isCurrent ? "text-[#FF00C8]" : "text-[#00F0FF]"
                          }`}
                        >
                          {item.phase}
                        </p>

                        {item.isCurrent && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF00C8]/20 border border-[#FF00C8]/40 text-[#FF00C8] text-[10px] font-mono font-bold animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF00C8]" /> CURRENT STAGE
                          </span>
                        )}
                      </div>

                      <h4 className="text-lg sm:text-xl font-black text-white mb-2 leading-snug">
                        {item.title}
                      </h4>

                      <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── WANT IN? CTA ── */}
        <section className="py-24 px-6 text-center bg-transparent">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-black text-white mb-4"
            style={{
              textShadow:
                "-2px 0 0 rgba(0,240,255,0.45), 2px 0 0 rgba(255,0,200,0.45)",
            }}
          >
            Want in?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-gray-400 text-base mb-8"
          >
            The room is open. Your first challenge is one click away.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button content="Join the Room" accent="cyan" onClick={openAuth} />
          </motion.div>
        </section>

        <Footer />
      </div>
    </motion.div>
  );
};

export default About;
