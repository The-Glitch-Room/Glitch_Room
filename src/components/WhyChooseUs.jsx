import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaTrophy, FaPalette } from "react-icons/fa";
import { IoIosPeople } from "react-icons/io";
import { RiLock2Fill } from "react-icons/ri";
import PageHeading from "./PageHeading";

const features = [
  {
    id: 1,
    title: "Trust & Safety",
    line: "Chaos, but safe chaos",
    para: "Your ideas stay yours. We just guard the madness.",
    icon: <RiLock2Fill />,
  },
  {
    id: 2,
    title: "Always Fresh & Creative",
    line: "Boring? Never heard of it.",
    para: "Every challenge = a new twist. Expect the unexpected.",
    icon: <FaPalette />,
  },
  {
    id: 3,
    title: "Community Vibes",
    line: "Meme squad, assemble.",
    para: "React, learn, grow, and vibe together. The crowd decides who wins.",
    icon: <IoIosPeople />,
  },
  {
    id: 4,
    title: "Win & Brag",
    line: "Flex like a boss.",
    para: "Rack up points, snag bragging rights, maybe even prizes.",
    icon: <FaTrophy />,
  },
];

const ACCENT = "#00F0FF";
const ACCENT_RGB = "0,240,255";

const FeatureCard = ({ item, index }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -3 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-2xl p-5 flex items-start gap-4 overflow-hidden transition-all duration-300 bg-[#0f0f1a] border"
      style={{
        borderColor: hovered
          ? `rgba(${ACCENT_RGB},0.35)`
          : "rgba(255,255,255,0.06)",
        boxShadow: hovered ? `0 0 20px rgba(${ACCENT_RGB},0.12)` : "none",
      }}
    >
      {/* Top sweep line */}
      <div
        className="absolute top-0 left-0 h-[2px] transition-all duration-500"
        style={{
          width: hovered ? "100%" : "0%",
          background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`,
        }}
      />

      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all duration-300"
        style={{
          background: `rgba(${ACCENT_RGB}, 0.1)`,
          color: ACCENT,
          boxShadow: hovered ? `0 0 12px rgba(${ACCENT_RGB}, 0.4)` : "none",
        }}
      >
        {item.icon}
      </div>

      {/* Text */}
      <div>
        <h4 className="text-base font-bold text-white transition-colors duration-300">
          {item.title}
        </h4>
        <p className="text-xs font-semibold mt-0.5" style={{ color: ACCENT }}>
          {item.line}
        </p>
        <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
          {item.para}
        </p>
      </div>
    </motion.div>
  );
};

const WhyChooseUs = () => {
  return (
    <section className="bg-transparent text-white py-16 overflow-hidden border-t border-white/5">
      <div className="w-full max-w-6xl mx-auto px-6">
        {/* Heading */}
        <PageHeading
          eyebrow="Why Us"
          title="Why Choose Us"
          subtitle="We didn't build another boring platform. We built a creative battleground."
          accent="cyan"
          layout="inline"
        />

        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((item, index) => (
            <FeatureCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
