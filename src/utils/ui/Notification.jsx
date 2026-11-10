// src/utils/ui/Notification.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { NOTIFICATION_EVENT, NOTIFICATION_DISMISS_EVENT } from "./notify";

const MAX_VISIBLE = 4;

const VARIANT_STYLES = {
  success: {
    Icon: CheckCircle2,
    defaultTitle: "Success",
    container: "bg-[#0a1a14]/95 border-emerald-500/40 shadow-emerald-500/15",
    iconWrap: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    titleText: "text-emerald-300",
    accentBar: "from-transparent via-emerald-400 to-transparent",
  },
  warning: {
    Icon: AlertTriangle,
    defaultTitle: "Heads Up",
    container: "bg-[#1a1408]/95 border-amber-500/40 shadow-amber-500/15",
    iconWrap: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    titleText: "text-amber-300",
    accentBar: "from-transparent via-amber-400 to-transparent",
  },
  error: {
    Icon: XCircle,
    defaultTitle: "Action Blocked",
    container: "bg-[#1c0b10]/95 border-red-500/40 shadow-red-500/15",
    iconWrap: "bg-red-500/15 text-red-400 border border-red-500/30",
    titleText: "text-red-300",
    accentBar: "from-transparent via-red-500 to-transparent",
  },
  info: {
    Icon: Info,
    defaultTitle: "Notice",
    container: "bg-[#0d0d1a]/95 border-[#00F0FF]/35 shadow-[#00F0FF]/10",
    iconWrap: "bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30",
    titleText: "text-[#00F0FF]",
    accentBar: "from-transparent via-[#00F0FF] to-transparent",
  },
};

let notificationCounter = 0;

/**
 * Global toast notification renderer mounted at the app root.
 * Trigger via `notify(...)` from `src/utils/ui/notify.js`.
 */
const Notification = () => {
  const [items, setItems] = useState([]);
  const timersRef = useRef(new Map());

  const clearTimer = useCallback((id) => {
    const existing = timersRef.current.get(id);
    if (existing) {
      clearTimeout(existing);
      timersRef.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id) => {
      if (id === undefined) {
        timersRef.current.forEach((timerId) => clearTimeout(timerId));
        timersRef.current.clear();
        setItems([]);
        return;
      }
      clearTimer(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    },
    [clearTimer],
  );

  const scheduleTimer = useCallback(
    (id, duration) => {
      clearTimer(id);
      if (!duration || duration <= 0) return;
      const timerId = setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, timerId);
    },
    [clearTimer, dismiss],
  );

  const handleNotify = useCallback(
    (event) => {
      const detail = event?.detail || {};
      if (!detail.message) return;

      const type = VARIANT_STYLES[detail.type] ? detail.type : "info";
      const id = detail.id ?? `notif_${++notificationCounter}`;
      const duration = detail.duration ?? 4000;

      setItems((prev) => {
        const filtered = prev.filter((item) => item.id !== id);
        return [
          ...filtered.slice(-(MAX_VISIBLE - 1)),
          {
            id,
            type,
            title: detail.title || VARIANT_STYLES[type].defaultTitle,
            message: detail.message,
          },
        ];
      });

      scheduleTimer(id, duration);
    },
    [scheduleTimer],
  );

  const handleExternalDismiss = useCallback(
    (event) => {
      dismiss(event?.detail?.id);
    },
    [dismiss],
  );

  useEffect(() => {
    const timers = timersRef.current;
    window.addEventListener(NOTIFICATION_EVENT, handleNotify);
    window.addEventListener(NOTIFICATION_DISMISS_EVENT, handleExternalDismiss);

    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, handleNotify);
      window.removeEventListener(NOTIFICATION_DISMISS_EVENT, handleExternalDismiss);
      timers.forEach((timerId) => clearTimeout(timerId));
      timers.clear();
    };
  }, [handleNotify, handleExternalDismiss]);

  if (items.length === 0) return null;

  return (
    <div
      className="fixed top-20 right-4 left-4 sm:left-auto sm:right-5 sm:w-[360px] z-[9999] flex flex-col gap-2.5 pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {items.map((item) => {
          const style = VARIANT_STYLES[item.type] || VARIANT_STYLES.info;
          const IconComponent = style.Icon;
          const isUrgent = item.type === "error" || item.type === "warning";

          return (
            <motion.div
              key={item.id}
              layout
              role={isUrgent ? "alert" : "status"}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 48, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl ${style.container}`}
            >
              <div
                className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r ${style.accentBar}`}
              />

              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${style.iconWrap}`}
              >
                <IconComponent size={16} />
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-[11px] font-mono font-bold uppercase tracking-wider ${style.titleText}`}
                >
                  {item.title}
                </p>
                <p className="text-xs text-gray-200 font-sans leading-relaxed mt-0.5 break-words">
                  {item.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className="text-gray-500 hover:text-white transition shrink-0 mt-0.5 cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default Notification;
