import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * CategoryDropdown — reusable across all Explore pages.
 *
 * Props:
 *   categories  – string[]         list including "All"
 *   selected    – string           current value
 *   onChange    – (cat) => void    callback
 *   accentColor – string           hex, e.g. "#FF00C8"
 *   label       – string           optional prefix label
 */
const CategoryDropdown = ({
  categories,
  selected,
  onChange,
  accentColor = "#00F0FF",
  label = "Category",
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const accent20 = `${accentColor}33`; // 20% opacity
  const accent40 = `${accentColor}66`; // 40% opacity
  const accent10 = `${accentColor}1A`; // 10% opacity

  return (
    <div ref={ref} className="relative z-30">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="group relative flex items-center gap-3 px-5 py-3 rounded-2xl border text-sm font-semibold text-white transition-all duration-300 cursor-pointer select-none"
        style={{
          background: open ? accent10 : "#111118",
          borderColor: open ? accentColor : `${accentColor}40`,
          boxShadow: open ? `0 0 20px ${accentColor}30` : "none",
          minWidth: "220px",
        }}
      >
        {/* Label chip */}
        <span
          className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md shrink-0"
          style={{
            color: accentColor,
            background: accent20,
          }}
        >
          {label}
        </span>

        {/* Selected value */}
        <span className="flex-1 text-left text-white/90 truncate">
          {selected}
        </span>

        {/* Count badge */}
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ color: accentColor, background: accent20 }}
        >
          {categories.length - 1}
        </span>

        {/* Chevron */}
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="shrink-0"
          style={{ color: accentColor }}
        >
          <path
            d="M2.5 5L7 9.5L11.5 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>

        {/* Bottom accent line */}
        <motion.div
          animate={{ scaleX: open ? 1 : 0, opacity: open ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-0 left-4 right-4 h-[1.5px] rounded-full origin-left"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          }}
        />
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            role="listbox"
            className="absolute top-[calc(100%+8px)] left-0 right-0 rounded-2xl border overflow-hidden"
            style={{
              background: "#0f0f16",
              borderColor: `${accentColor}30`,
              boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px ${accentColor}15, 0 0 30px ${accentColor}10`,
              minWidth: "220px",
            }}
          >
            {/* Header row */}
            <div
              className="px-4 py-2.5 border-b flex items-center justify-between"
              style={{ borderColor: `${accentColor}15` }}
            >
              <span
                className="text-[10px] font-bold uppercase tracking-[0.15em]"
                style={{ color: accentColor }}
              >
                Filter by {label}
              </span>
              <span className="text-[10px] text-gray-600">
                {categories.length - 1} options
              </span>
            </div>

            {/* Options */}
            <div className="py-1.5 max-h-72 overflow-y-auto custom-scroll">
              {categories.map((cat, i) => {
                const isSelected = cat === selected;
                const isAll = cat === "All";
                return (
                  <motion.button
                    key={cat}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(cat);
                      setOpen(false);
                    }}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.025, duration: 0.15 }}
                    whileHover={{ x: 4 }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left cursor-pointer transition-colors duration-150 group/opt"
                    style={{
                      background: isSelected ? accent10 : "transparent",
                      color: isSelected
                        ? accentColor
                        : isAll
                          ? "rgba(255,255,255,0.7)"
                          : "rgba(255,255,255,0.55)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background = `${accentColor}0D`;
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {/* Selection indicator */}
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-200"
                      style={{
                        background: isSelected ? accentColor : "transparent",
                        boxShadow: isSelected
                          ? `0 0 6px ${accentColor}`
                          : "none",
                        border: isSelected
                          ? "none"
                          : "1px solid rgba(255,255,255,0.15)",
                      }}
                    />

                    {/* Label */}
                    <span
                      className={`flex-1 font-${isAll || isSelected ? "semibold" : "medium"}`}
                    >
                      {cat}
                    </span>

                    {/* Active checkmark */}
                    {isSelected && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        style={{ color: accentColor }}
                      >
                        <path
                          d="M2 6L4.5 8.5L10 3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </motion.svg>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Footer glow line */}
            <div
              className="h-[1px] mx-4 mb-2 rounded-full"
              style={{
                background: `linear-gradient(90deg, transparent, ${accentColor}30, transparent)`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline scrollbar style */}
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: ${accentColor}30;
          border-radius: 99px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: ${accentColor}60;
        }
      `}</style>
    </div>
  );
};

export default CategoryDropdown;
