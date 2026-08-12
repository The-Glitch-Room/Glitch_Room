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
 * StatCard — compact, sleek stat display for mobile and desktop screens.
 */
const StatCard = ({
  value,
  label,
  sublabel,
  accent = "cyan",
  variant = "bare",
  delay = 0,
}) => {
  const color = ACCENTS[accent] || ACCENTS.cyan;

  if (variant === "boxed") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        whileHover={{ y: -2 }}
        className="rounded-xl sm:rounded-2xl px-2.5 py-3 sm:px-4 sm:py-4 text-center border bg-[#0d0d14]/70 backdrop-blur-sm transition-all"
        style={{
          borderColor: `${color}30`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${color}60`;
          e.currentTarget.style.boxShadow = `0 0 16px ${color}20`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = `${color}30`;
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <p
          className="text-lg sm:text-2xl font-black text-white leading-tight"
          style={{ textShadow: "0 0 10px rgba(255,255,255,0.2)" }}
        >
          {value}
        </p>
        <p className="text-[9px] sm:text-xs text-gray-400 uppercase tracking-wider font-bold mt-1 truncate">
          {label}
        </p>
        {sublabel && (
          <p className="text-[9px] text-gray-500 mt-0.5 italic truncate">{sublabel}</p>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex flex-col items-center gap-0.5 text-center px-2 py-1"
    >
      <span
        className="text-base sm:text-xl font-black text-white"
        style={{ textShadow: "0 0 10px rgba(255,255,255,0.2)" }}
      >
        {value}
      </span>
      <span className="text-[9px] sm:text-xs font-semibold text-gray-300 uppercase tracking-wider truncate">
        {label}
      </span>
      {sublabel && (
        <span className="text-[9px] text-gray-500 italic truncate">{sublabel}</span>
      )}
    </motion.div>
  );
};

export default StatCard;
