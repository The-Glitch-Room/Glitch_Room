import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { Trophy, CheckCircle, Zap, ArrowRight, X } from "lucide-react";

const GlitchFixedModal = ({
  isOpen,
  onClose,
  pointsEarned = 50,
  challengeTitle = "Glitch Fixed",
  onNext = null,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
        <Confetti
          numberOfPieces={160}
          recycle={false}
          colors={["#00F0FF", "#FF00C8", "#22c55e", "#FFD700", "#a855f7"]}
        />

        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 30 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-md bg-[#0a0a12] border border-[#00F0FF]/40 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(0,240,255,0.25)] overflow-hidden"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-[#00F0FF]/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-[#FF00C8]/20 blur-3xl pointer-events-none" />

          {/* Close X */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Floating Icon Header */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#00F0FF]/10 border-2 border-[#00F0FF] flex items-center justify-center text-[#00F0FF] shadow-[0_0_25px_rgba(0,240,255,0.4)]"
          >
            <CheckCircle size={42} className="text-[#00F0FF]" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-black text-white tracking-wide uppercase font-mono mb-1"
          >
            GLITCH FIXED!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-xs text-gray-300 mb-6 truncate"
          >
            {challengeTitle}
          </motion.p>

          {/* Reward Badge Animation */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.3 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-[#00F0FF]/20 to-purple-500/20 border border-[#00F0FF]/40 text-emerald-400 font-mono font-black text-lg mb-8 shadow-inner"
          >
            <Zap size={22} className="fill-amber-400 text-amber-400 animate-pulse" />
            <span>+{pointsEarned} gBits Added!</span>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-bold text-xs hover:bg-white/10 transition cursor-pointer"
            >
              Close
            </button>
            {onNext && (
              <button
                onClick={onNext}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#a855f7] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 transition cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              >
                Next Challenge <ArrowRight size={14} />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GlitchFixedModal;
