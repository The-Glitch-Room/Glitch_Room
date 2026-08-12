import React from "react";
import { motion } from "framer-motion";
import SectionEyebrow from "./SectionEyebrow";

const ACCENTS = {
  cyan: "#00F0FF",
  pink: "#FF00C8",
  purple: "#a855f7",
  gold: "#FFD700",
  orange: "#FF6B00",
  green: "#22c55e",
};

/**
 * PageHeading — perfectly tuned section heading with chromatic drop text effect and scroll animations.
 */
const PageHeading = ({
  eyebrow,
  title,
  subtitle,
  align = "center",
  layout = "stacked",
  accent = "cyan",
  size = "lg",
  underline = true,
}) => {
  const color = ACCENTS[accent] || ACCENTS.cyan;
  const alignClass =
    align === "left" ? "items-start text-left" : "items-center text-center";

  // Tuned sizes: balanced between old huge sizes and recent tiny sizes
  const sizeClass = {
    md: "text-2xl md:text-3xl",
    lg: "text-3xl md:text-4xl",
    xl: "text-4xl md:text-5xl",
  }[size];

  const titleEl = (
    <motion.h1
      initial={{ opacity: 0, y: -12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`${sizeClass} font-black tracking-tight leading-tight text-white`}
      style={{
        textShadow:
          "-2px 0 0 rgba(0,240,255,0.45), 2px 0 0 rgba(255,0,200,0.45)",
      }}
    >
      {title}
    </motion.h1>
  );

  const underlineEl = underline && (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      whileInView={{ scaleX: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className={`mt-3 h-[2px] w-14 rounded-full origin-left ${
        align === "center" ? "mx-auto origin-center" : ""
      }`}
      style={{ background: color }}
    />
  );

  const subtitleEl = subtitle && (
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mt-4 text-gray-400 text-xs md:text-sm max-w-xl leading-relaxed"
    >
      {subtitle}
    </motion.p>
  );

  if (layout === "inline" && eyebrow) {
    return (
      <div className={`flex flex-col ${alignClass} mb-10`}>
        <div className="flex flex-col md:flex-row md:items-baseline gap-1.5 md:gap-3">
          <SectionEyebrow accent={accent} align={align} variant="label">
            {eyebrow}
          </SectionEyebrow>
          {titleEl}
        </div>
        {underlineEl}
        {subtitleEl}
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${alignClass} mb-10`}>
      {eyebrow && (
        <SectionEyebrow accent={accent} align={align} variant="label">
          {eyebrow}
        </SectionEyebrow>
      )}
      {titleEl}
      {underlineEl}
      {subtitleEl}
    </div>
  );
};

export default PageHeading;
