import React from "react";
import { motion } from "framer-motion";

const ACCENTS = {
  cyan: "#00F0FF",
  pink: "#FF00C8",
  purple: "#a855f7",
  gold: "#FFD700",
  orange: "#FF6B00",
  green: "#22c55e",
};

/**
 * SectionEyebrow — small label that sits above a heading or on its own,
 * used to give every section a consistent "signal" before the main text.
 *
 * variant="label"  -> plain uppercase tracking-widest text (e.g. "ABOUT", "THE ECONOMY")
 * variant="pill"   -> bordered glowing badge (e.g. "🚀 Community Spaces", "SEASON 03 · NOW LIVE")
 *
 * Props:
 *  - children   (string, required)
 *  - accent     "cyan" | "pink" | "purple" | "gold" | "orange" | "green" (default "pink")
 *  - variant    "label" | "pill" (default "label")
 *  - align      "center" | "left" (default "center")
 */
const SectionEyebrow = ({
  children,
  accent = "pink",
  variant = "label",
  align = "center",
}) => {
  const color = ACCENTS[accent] || ACCENTS.pink;
  const alignClass = align === "left" ? "text-left" : "text-center mx-auto";

  if (variant === "pill") {
    return (
      <motion.span
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase border ${align === "left" ? "" : "mx-auto"}`}
        style={{
          color,
          background: `${color}12`,
          borderColor: `${color}40`,
          boxShadow: `0 0 16px ${color}20`,
        }}
      >
        {children}
      </motion.span>
    );
  }

  return (
    <motion.p
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`text-xs font-bold uppercase tracking-[0.25em] mb-3 ${alignClass}`}
      style={{ color }}
    >
      {children}
    </motion.p>
  );
};

export default SectionEyebrow;
