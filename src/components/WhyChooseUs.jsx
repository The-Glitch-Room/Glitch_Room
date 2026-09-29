import React from "react";
import { motion } from "framer-motion";
import { Code2, Bug, Users, TrendingUp } from "lucide-react";
import PageHeading from "./PageHeading";

const features = [
  {
    id: 1,
    tag: "BUILD IN PUBLIC",
    step: "01",
    title: "Build & Show Your Work",
    description:
      "Share your projects, daily progress, and proof of work so others can see what you're building.",
    icon: Code2,
    accent: "#00F0FF",
    accentRgb: "0, 240, 255",
  },
  {
    id: 2,
    tag: "SOLVE REAL PROBLEMS",
    step: "02",
    title: "Practice Through Problems",
    description:
      "Go beyond writing code by solving broken code, debugging challenges, and practical problems.",
    icon: Bug,
    accent: "#FF00C8",
    accentRgb: "255, 0, 200",
  },
  {
    id: 3,
    tag: "LEARN TOGETHER",
    step: "03",
    title: "Connect & Collaborate",
    description:
      "Discover what other developers are working on, learn from their approach, and find people to collaborate with.",
    icon: Users,
    accent: "#a855f7",
    accentRgb: "168, 85, 247",
  },
  {
    id: 4,
    tag: "STAY CONSISTENT",
    step: "04",
    title: "Build Consistency",
    description:
      "Use Creator Rooms, daily proof of work, uptime, and recognition to keep making progress.",
    icon: TrendingUp,
    accent: "#FFD700",
    accentRgb: "255, 215, 0",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="relative bg-transparent text-white py-20 sm:py-24 overflow-hidden border-t border-white/5">
      {/* Background glow accents */}
      <div
        className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none opacity-[0.03] blur-3xl"
        style={{ background: "#00F0FF" }}
      />
      <div
        className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none opacity-[0.03] blur-3xl"
        style={{ background: "#FF00C8" }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6">
        {/* Heading */}
        <PageHeading
          eyebrow="WHY GLITCH ROOM"
          title="MORE THAN JUST CODING."
          subtitle="Build your skills, share your work, learn with others, and keep moving forward."
          accent="cyan"
          layout="stacked"
        />

        {/* 4 Connected Feature Blocks */}
        <div className="relative mt-12 sm:mt-16">
          {/* Subtle connecting horizontal track across top on desktop */}
          <div
            className="hidden lg:block absolute top-7 left-12 right-12 h-[1px] pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,240,255,0.25) 0%, rgba(255,0,200,0.25) 35%, rgba(168,85,247,0.25) 70%, rgba(255,215,0,0.25) 100%)",
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="relative group flex flex-col items-start p-5 sm:p-6 rounded-2xl transition-all duration-300 bg-white/[0.015] hover:bg-white/[0.035] border border-white/[0.04] hover:border-white/[0.12]"
                >
                  {/* Icon & Step row */}
                  <div className="flex items-center justify-between w-full mb-5">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300"
                      style={{
                        background: `rgba(${item.accentRgb}, 0.08)`,
                        border: `1px solid rgba(${item.accentRgb}, 0.2)`,
                      }}
                    >
                      <Icon
                        size={20}
                        style={{ color: item.accent }}
                        className="transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>

                    <span className="text-[11px] font-mono font-bold tracking-widest text-gray-500">
                      {item.step}
                    </span>
                  </div>

                  {/* Eyebrow tag */}
                  <div
                    className="text-[10px] font-mono font-bold tracking-wider uppercase mb-1.5"
                    style={{ color: item.accent }}
                  >
                    {item.tag}
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 tracking-tight group-hover:text-white transition-colors">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-sans">
                    {item.description}
                  </p>

                  {/* Subtle bottom accent line on hover */}
                  <div
                    className="absolute bottom-0 left-6 right-6 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${item.accent}, transparent)`,
                    }}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
