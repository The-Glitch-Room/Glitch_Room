import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

/**
 * CustomSelect — Reusable cyberpunk / dark themed select dropdown
 * Replaces native <select> elements to prevent OS blue highlight & default menus.
 */
const CustomSelect = ({
  label,
  value,
  onChange,
  options = [], // Array of strings OR objects { value, label }
  placeholder = "Select option...",
  className = "",
  buttonClassName = "",
  labelClassName = "",
  disabled = false,
  icon: Icon,
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const normalized = options.map((o) =>
    typeof o === "object" && o !== null ? o : { value: o, label: o }
  );
  const selected = normalized.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div ref={wrapRef} className={`relative font-sans ${className}`}>
      {label && (
        <label
          className={`text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1 block ${labelClassName}`}
        >
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`w-full px-4 py-2.5 rounded-xl bg-[#07070d] border text-xs text-left flex items-center justify-between gap-2 outline-none transition cursor-pointer ${
          open
            ? "border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.2)] text-white"
            : "border-white/10 hover:border-white/25 text-gray-200"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${buttonClassName}`}
      >
        <span className="flex items-center gap-2 truncate">
          {Icon && <Icon size={14} className="text-[#00F0FF] shrink-0" />}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-[#00F0FF]" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl bg-[#0d0d18] border border-white/15 p-1.5 shadow-2xl backdrop-blur-xl custom-scrollbar"
          >
            {normalized.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                    isSelected
                      ? "bg-purple-600/30 text-[#00F0FF] font-bold border-l-2 border-[#00F0FF]"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={12} className="text-[#00F0FF] shrink-0 ml-2" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
