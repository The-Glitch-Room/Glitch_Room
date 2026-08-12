import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiZap } from "react-icons/fi";
import { FaRandom, FaBullhorn } from "react-icons/fa";
import Button from "./Button";
import PageHeading from "./PageHeading";

const cards = [
  {
    stage: "Stage 01",
    icon: <FiZap className="text-xl" />,
    title: "Find the glitch.",
    subtitle: "Break the mold.",
    desc: "Jump into wild, unpredictable challenges where chaos sparks creativity. Spot hidden problems, flip the script, and unleash your boldest ideas.",
  },
  {
    stage: "Stage 02",
    icon: <FaRandom className="text-xl" />,
    title: "Twist cards.",
    subtitle: "Chaos unlocked.",
    desc: "Draw a random twist and watch your strategy flip. Adapt fast, meme harder, and keep your crew guessing with wild curveballs.",
  },
  {
    stage: "Stage 03",
    icon: <FaBullhorn className="text-xl" />,
    title: "Pitch wild.",
    subtitle: "Meme loud. Win big.",
    desc: "Show off your fix with memes, comics, or quick vids. Get live emoji reactions, instant feedback, and Terminal Wall bragging rights.",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 35 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const ACCENT = "#00F0FF";
const ACCENT_RGB = "0,240,255";

const Category = () => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);

  return (
    <section className="py-16 bg-transparent text-white overflow-hidden border-t border-white/5">
      <div className="w-full max-w-6xl mx-auto px-6">
        {/* Heading */}
        <PageHeading
          eyebrow="The Arena"
          title="Step Into the Chaos"
          subtitle="Three stages. One continuous challenge. Only the most creative make it to the end."
          accent="cyan"
          layout="inline"
        />

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid md:grid-cols-3 gap-5"
        >
          {cards.map((card, i) => (
            <motion.div
              key={i}
              variants={cardVariants}
              whileHover={{ y: -4 }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => navigate("/game-arena")}
              className="relative rounded-2xl p-5 flex flex-col gap-3 cursor-pointer overflow-hidden transition-all duration-300 bg-[#0f0f1a] border"
              style={{
                borderColor:
                  hovered === i
                    ? `rgba(${ACCENT_RGB},0.35)`
                    : "rgba(255,255,255,0.06)",
                boxShadow:
                  hovered === i ? `0 0 20px rgba(${ACCENT_RGB},0.12)` : "none",
              }}
            >
              {/* Top glow line */}
              <div
                className="absolute top-0 left-0 h-[2px] transition-all duration-500"
                style={{
                  width: hovered === i ? "100%" : "0%",
                  background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`,
                }}
              />

              {/* Stage label + icon */}
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border"
                  style={{
                    color: ACCENT,
                    background: `rgba(${ACCENT_RGB}, 0.08)`,
                    borderColor: `rgba(${ACCENT_RGB}, 0.2)`,
                  }}
                >
                  {card.stage}
                </span>

                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300"
                  style={{
                    background: `rgba(${ACCENT_RGB}, 0.1)`,
                    color: ACCENT,
                    boxShadow:
                      hovered === i
                        ? `0 0 12px rgba(${ACCENT_RGB}, 0.4)`
                        : "none",
                  }}
                >
                  {card.icon}
                </div>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-base font-bold leading-tight text-white">
                  {card.title}
                </h3>
                <h4 className="text-xs font-semibold text-gray-400 mt-0.5">
                  {card.subtitle}
                </h4>
              </div>

              {/* Desc */}
              <p className="text-gray-400 text-xs leading-relaxed flex-1">
                {card.desc}
              </p>

              {/* CTA row */}
              <div
                className="flex items-center gap-2 text-xs font-semibold mt-1 transition-all duration-300"
                style={{
                  color: hovered === i ? ACCENT : "rgba(255,255,255,0.4)",
                }}
              >
                Enter Stage
                <motion.span
                  animate={{ x: hovered === i ? 4 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiArrowRight />
                </motion.span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-10"
        >
          <p className="text-gray-500 text-xs mb-3">
            All 3 stages are part of one continuous challenge
          </p>
          <div onClick={() => navigate("/game-arena")}>
            <Button content="Enter the Arena ⚡" accent="pink" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Category;
