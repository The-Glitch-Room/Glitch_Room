import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, TrendingUp, TrendingDown, X } from "lucide-react";

let toastIdCounter = 0;

const GBitsToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((e) => {
    const { delta, title, newTotal } = e.detail || {};
    if (delta === 0 || delta === undefined) return;

    const id = ++toastIdCounter;
    setToasts((prev) => [
      ...prev.slice(-4),
      { id, delta, title, newTotal },
    ]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    window.addEventListener("gbits_transaction", addToast);
    return () => window.removeEventListener("gbits_transaction", addToast);
  }, [addToast]);

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[9999] flex flex-col-reverse gap-2.5 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => {
          const isAddition = t.delta > 0;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-2xl min-w-[240px] max-w-[300px] backdrop-blur-xl ${
                isAddition
                  ? "bg-green-950/90 border-green-500/40 shadow-green-500/10"
                  : "bg-red-950/90 border-red-500/40 shadow-red-500/10"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isAddition
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {isAddition ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              </div>

              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm font-black font-mono tracking-tight ${
                    isAddition ? "text-green-300" : "text-red-300"
                  }`}
                >
                  {isAddition ? "+" : ""}{t.delta} gBits
                </div>
                <div className="text-[11px] text-gray-300 font-sans leading-snug truncate mt-0.5">
                  {t.title || (isAddition ? "gBits Added" : "gBits Deducted")}
                </div>
                {t.newTotal !== undefined && (
                  <div className="flex items-center gap-1 mt-1">
                    <Coins size={10} className="text-amber-400 shrink-0" />
                    <span className="text-[10px] text-amber-300 font-mono font-bold">
                      Balance: {t.newTotal} gBits
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => dismiss(t.id)}
                className="text-gray-500 hover:text-gray-300 transition shrink-0 mt-0.5 cursor-pointer"
              >
                <X size={13} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default GBitsToast;
