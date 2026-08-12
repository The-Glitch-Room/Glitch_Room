import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaUsers, FaPuzzlePiece, FaTrophy, FaRocket } from "react-icons/fa";
import PageHeading from "./PageHeading";

const steps = [
  {
    id: 1,
    title: "Join The Room",
    para: "Sign up and step into the Glitch Room — a digital playground for creators.",
    icon: <FaUsers />,
  },
  {
    id: 2,
    title: "Pick a Challenge",
    para: "Browse exciting challenges across tech, design, and innovation.",
    icon: <FaPuzzlePiece />,
  },
  {
    id: 3,
    title: "Create & Compete",
    para: "Brainstorm ideas and showcase your skills in glitchy new ways.",
    icon: <FaTrophy />,
  },
  {
    id: 4,
    title: "Level Up",
    para: "Gain recognition, rewards, and grow as your ideas take off.",
    icon: <FaRocket />,
  },
];

const ACCENT = "#A855F7";
const ACCENT_RGB = "168,85,247";

const Process = () => {
  const [hovered, setHovered] = useState(null);

  return (
    <section className="relative bg-transparent py-16 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Heading */}
        <PageHeading
          eyebrow="Getting Started"
          title="How It Works"
          subtitle="Four steps to go from zero to Glitch Room legend."
          accent="purple"
          layout="inline"
        />

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -3 }}
              onMouseEnter={() => setHovered(step.id)}
              onMouseLeave={() => setHovered(null)}
              className="relative rounded-2xl p-5 flex flex-col gap-4 overflow-hidden transition-all duration-300 bg-[#0f0f1a] border"
              style={{
                borderColor:
                  hovered === step.id
                    ? `rgba(${ACCENT_RGB},0.35)`
                    : "rgba(255,255,255,0.06)",
                boxShadow:
                  hovered === step.id
                    ? `0 0 20px rgba(${ACCENT_RGB},0.15)`
                    : "none",
              }}
            >
              {/* Top sweep */}
              <div
                className="absolute top-0 left-0 h-[2px] transition-all duration-500"
                style={{
                  width: hovered === step.id ? "100%" : "0%",
                  background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`,
                }}
              />

              {/* Step number + icon row */}
              <div className="flex items-center justify-between">
                {/* Step number */}
                <span
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black border transition-all duration-300"
                  style={{
                    color: ACCENT,
                    borderColor: `rgba(${ACCENT_RGB}, 0.3)`,
                    background: `rgba(${ACCENT_RGB}, 0.08)`,
                    boxShadow:
                      hovered === step.id
                        ? `0 0 10px rgba(${ACCENT_RGB}, 0.4)`
                        : "none",
                  }}
                >
                  0{step.id}
                </span>

                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all duration-300"
                  style={{
                    background: `rgba(${ACCENT_RGB}, 0.12)`,
                    color: ACCENT,
                    boxShadow:
                      hovered === step.id
                        ? `0 0 14px rgba(${ACCENT_RGB}, 0.45)`
                        : "none",
                  }}
                >
                  {step.icon}
                </div>
              </div>

              {/* Text */}
              <div>
                <h4 className="text-base font-bold text-white transition-colors duration-300">
                  {step.title}
                </h4>
                <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                  {step.para}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Process;
