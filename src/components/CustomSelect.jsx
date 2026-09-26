import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

/**
 * CustomSelect — Canonical Glitch Room Floating Dropdown Component
 *
 * Features:
 * 1. Portalled to document.body (position: fixed) so it NEVER gets cut off or clipped
 *    by parent containers, modals, overflow:hidden, or stacking contexts.
 * 2. Intelligent direction detection: opens downward if space permits, or flips
 *    upward if near the bottom of the viewport.
 * 3. Hidden native scrollbars (both Webkit and Firefox) while maintaining full native
 *    scrolling capability (wheel, trackpad, touch, keyboard).
 * 4. Responsive viewport clamping to prevent clipping at screen edges.
 * 5. Dynamic tracking on window resize and scroll events.
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
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const [direction, setDirection] = useState("down"); // "down" | "up"

  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // Normalize options array into { value, label } format
  const normalized = options.map((o) =>
    typeof o === "object" && o !== null ? o : { value: o, label: String(o) }
  );
  const selected = normalized.find(
    (o) => String(o.value) === (value !== undefined && value !== null ? String(value) : "")
  );

  // Calculate fixed viewport coordinates and flip direction
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();

    // If trigger button is completely scrolled off screen, close
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setOpen(false);
      return;
    }

    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;

    // Intelligently open upward if space below is tight and space above is larger
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
    setDirection(openUp ? "up" : "down");

    const availableSpace = openUp ? spaceAbove : spaceBelow;
    const maxHeight = Math.min(260, Math.max(140, availableSpace));

    // Calculate left/right and width bounds
    const minWidth = rect.width;
    const maxWidth = Math.min(320, window.innerWidth - 32);

    let left = rect.left;
    let right = "auto";

    if (menuAlign === "right") {
      right = Math.max(16, window.innerWidth - rect.right);
      left = "auto";
    } else {
      // Ensure left doesn't push menu beyond right viewport edge
      if (left + minWidth > window.innerWidth - 16) {
        left = Math.max(16, window.innerWidth - minWidth - 16);
      }
    }

    setCoords({
      top: openUp ? "auto" : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : "auto",
      left,
      right,
      minWidth,
      maxWidth,
      maxHeight,
    });
  }, [menuAlign]);

  // Recalculate position when opened or when window events fire
  useLayoutEffect(() => {
    if (open) {
      updatePosition();
    }
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return undefined;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open, updatePosition]);

  // Close on outside click or Escape key
  useEffect(() => {
    if (!open) return undefined;

    const onDocClick = (e) => {
      if (
        (wrapRef.current && wrapRef.current.contains(e.target)) ||
        (menuRef.current && menuRef.current.contains(e.target))
      ) {
        return;
      }
      setOpen(false);
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
        ref={buttonRef}
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

      {/* Portalled Floating Dropdown Menu */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && !disabled && coords && (
              <motion.div
                ref={menuRef}
                role="listbox"
                initial={{
                  opacity: 0,
                  y: direction === "up" ? 6 : -6,
                  scale: 0.98,
                }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: direction === "up" ? 6 : -6,
                  scale: 0.98,
                }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{
                  position: "fixed",
                  top: coords.top !== "auto" ? `${coords.top}px` : "auto",
                  bottom: coords.bottom !== "auto" ? `${coords.bottom}px` : "auto",
                  left: coords.left !== "auto" ? `${coords.left}px` : "auto",
                  right: coords.right !== "auto" ? `${coords.right}px` : "auto",
                  minWidth: `${coords.minWidth}px`,
                  maxWidth: `${coords.maxWidth}px`,
                  maxHeight: `${coords.maxHeight}px`,
                  zIndex: 99999,
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
                className={`overflow-y-auto rounded-xl bg-[#0c0c16]/98 border border-white/15 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_25px_rgba(0,240,255,0.12)] backdrop-blur-3xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${menuClassName}`}
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
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

export { CustomSelect };
export default CustomSelect;
