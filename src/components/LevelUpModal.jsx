import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { Trophy, Sparkles, Zap, ArrowRight, X } from "lucide-react";

const LevelUpModal = ({
  isOpen,
  onClose,
  level = 1,
  title = "Bug Hunter",
  totalXp = 250,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
        <Confetti
          numberOfPieces={200}
          recycle={false}
          colors={["#00F0FF", "#FF00C8", "#a855f7", "#FFD700", "#22c55e"]}
        />

        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.7, opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-md bg-[#0d0d16] border border-[#a855f7]/50 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_60px_rgba(168,85,247,0.3)] overflow-hidden"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-[#a855f7]/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full bg-[#00F0FF]/25 blur-3xl pointer-events-none" />

          {/* Close X */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Glowing Level Badge Circle */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
            className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-tr from-[#a855f7]/20 via-[#00F0FF]/20 to-[#FF00C8]/20 border-2 border-[#a855f7] flex flex-col items-center justify-center text-[#a855f7] shadow-[0_0_30px_rgba(168,85,247,0.5)] relative"
          >
            <Trophy size={32} className="text-[#00F0FF] mb-0.5 animate-bounce" />
            <span className="text-xs font-mono font-black text-white">LVL {level}</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-black text-white tracking-wide uppercase font-mono mb-1"
          >
            LEVEL UP!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-sm font-bold text-[#00F0FF] mb-6 font-mono"
          >
            Rank Unlocked: {title}
          </motion.p>

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.3 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-gray-300 font-mono text-xs mb-8"
          >
            <Sparkles size={16} className="text-amber-400" />
            <span>Total Balance: <strong className="text-white">{totalXp.toLocaleString()} gBits</strong></span>
          </motion.div>

          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#a855f7] via-[#FF00C8] to-[#00F0FF] text-white font-extrabold text-xs tracking-wider uppercase hover:brightness-110 transition cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.4)]"
          >
            Continue Glitching →
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LevelUpModal;
