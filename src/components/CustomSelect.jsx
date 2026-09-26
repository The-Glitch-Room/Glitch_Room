import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

/**
 * CustomSelect — Canonical Glitch Room Cyberpunk / Dark Dropdown Component
 * Replaces native <select> elements across the entire application to prevent
 * OS-level styling (blue highlight, system font, native popup menus).
 */
const CustomSelect = ({
  label,
  value,
  onChange,
  options = [], // Array of strings OR objects { value, label }
  placeholder = "Select option...",
  className = "",
  buttonClassName = "",
  menuClassName = "",
  labelClassName = "",
  size = "md", // "sm" | "md" | "lg"
  menuAlign = "left", // "left" | "right"
  disabled = false,
  icon: Icon,
  accentColor = "#00F0FF",
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Normalize options array into { value, label } format
  const normalized = options.map((o) =>
    typeof o === "object" && o !== null ? o : { value: o, label: String(o) }
  );
  const selected = normalized.find(
    (o) => String(o.value) === (value !== undefined && value !== null ? String(value) : "")
  );

  // Close on click outside & Escape key
  useEffect(() => {
    if (!open) return undefined;

    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Size styling tokens
  const sizeStyles = {
    sm: {
      button: "px-2.5 py-1.5 rounded-lg text-xs gap-1.5",
      icon: 12,
      chevron: 12,
      option: "px-2.5 py-1.5 text-xs",
    },
    md: {
      button: "px-3.5 py-2.5 rounded-xl text-xs gap-2",
      icon: 14,
      chevron: 13,
      option: "px-3 py-2 text-xs",
    },
    lg: {
      button: "px-4 py-3 rounded-2xl text-sm gap-2.5",
      icon: 16,
      chevron: 15,
      option: "px-3.5 py-2.5 text-sm",
    },
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  return (
    <div
      ref={wrapRef}
      className={`relative font-sans select-none ${open ? "z-40" : "z-10"} ${className}`}
    >
      {label && (
        <label
          className={`text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1 block ${labelClassName}`}
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        title={selected ? selected.label : placeholder}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full bg-[#06060c] border text-left flex items-center justify-between outline-none transition-all duration-200 cursor-pointer ${
          currentSize.button
        } ${
          open
            ? "border-[#00F0FF] ring-1 ring-[#00F0FF]/30 text-white shadow-[0_0_15px_rgba(0,240,255,0.18)]"
            : "border-white/10 hover:border-white/25 text-gray-200 hover:text-white"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${buttonClassName}`}
      >
        <span className="flex items-center gap-2 truncate flex-1 min-w-0">
          {Icon && (
            <Icon
              size={currentSize.icon}
              className="text-[#00F0FF] shrink-0"
            />
          )}
          <span
            className={`truncate ${
              selected ? "text-white font-medium" : "text-gray-500"
            }`}
          >
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown
          size={currentSize.chevron}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ml-1.5 ${
            open ? "rotate-180 text-[#00F0FF]" : "group-hover:text-gray-300"
          }`}
        />
      </button>

      {/* Dropdown Menu Panel */}
      <AnimatePresence>
        {open && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            role="listbox"
            className={`absolute top-full mt-1.5 max-h-60 overflow-y-auto rounded-xl bg-[#0c0c16]/95 border border-white/15 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(0,240,255,0.08)] backdrop-blur-2xl custom-scrollbar z-50 ${
              menuAlign === "right"
                ? "right-0 min-w-full w-max max-w-[calc(100vw-32px)] sm:max-w-xs"
                : "left-0 min-w-full w-max max-w-[calc(100vw-32px)] sm:max-w-xs"
            } ${menuClassName}`}
          >
            {normalized.map((opt) => {
              const isSelected =
                selected && String(opt.value) === String(selected.value);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  role="option"
                  title={opt.label}
                  aria-selected={isSelected}
                  onClick={() => {
                    if (onChange) onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left rounded-lg font-medium flex items-center justify-between gap-2 transition-colors duration-150 cursor-pointer ${
                    currentSize.option
                  } ${
                    isSelected
                      ? "bg-[#00F0FF]/15 text-[#00F0FF] font-bold border-l-2 border-[#00F0FF]"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check
                      size={currentSize.icon}
                      className="text-[#00F0FF] shrink-0 ml-1.5"
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { CustomSelect };
export default CustomSelect;
