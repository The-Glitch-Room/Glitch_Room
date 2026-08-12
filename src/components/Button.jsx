import React from "react";
import { motion } from "framer-motion";

const ACCENT_SOLID = {
  pink: "#FF00C8",
  cyan: "#00F0FF",
  gold: "#FFD700",
};

const ACCENT_TEXT_COLOR = {
  pink: "#FFFFFF",
  cyan: "#000000",
  gold: "#000000",
};

/**
 * Button — standard solid button using single color without gradients across the website.
 */
const Button = ({
  content,
  variant = "solid",
  accent = "pink",
  onClick,
  type = "button",
  disabled = false,
  className = "",
}) => {
  const solid = ACCENT_SOLID[accent] || ACCENT_SOLID.pink;
  const textColor = ACCENT_TEXT_COLOR[accent] || "#FFFFFF";

  if (variant === "outline") {
    return (
      <motion.button
        type={type}
        onClick={onClick}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.03 } : {}}
        whileTap={!disabled ? { scale: 0.97 } : {}}
        className={`px-5 py-2.5 rounded-xl border font-bold bg-transparent transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
        style={{ borderColor: solid, color: solid }}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.03 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      className={`px-6 py-2.5 rounded-xl font-bold transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ background: solid, color: textColor }}
    >
      {content}
    </motion.button>
  );
};

export default Button;
