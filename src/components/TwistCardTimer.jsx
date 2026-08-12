import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TIMER_TWIST = "You have 60 seconds to finalize your solution. Go!";

const TwistCardTimer = ({ twist, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef(null);

  const isTimerTwist = twist === TIMER_TWIST;

  useEffect(() => {
    if (!isTimerTwist) return;
    // Auto-start when this twist is active
    setIsActive(true);
  }, [isTimerTwist]);

  useEffect(() => {
    if (!isActive || !isTimerTwist) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsExpired(true);
          setIsActive(false);
          if (onTimeUp) onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isActive, isTimerTwist]);

  if (!isTimerTwist) return null;

  const pct = (timeLeft / 60) * 100;
  const isUrgent = timeLeft <= 10;
  const isMid = timeLeft <= 30 && timeLeft > 10;

  const color = isUrgent ? "#ef4444" : isMid ? "#f59e0b" : "#00F0FF";
  const circumference = 2 * Math.PI * 28; // radius 28

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center mt-6"
      >
        {/* Circular timer */}
        <div className="relative w-24 h-24 flex items-center justify-center mb-3">
          {/* Pulsing ring when urgent */}
          {isUrgent && !isExpired && (
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="absolute inset-0 rounded-full"
              style={{ border: `2px solid ${color}` }}
            />
          )}

          {/* SVG circle progress */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 64 64"
          >
            {/* Track */}
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="4"
            />
            {/* Progress */}
            <motion.circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (pct / 100) * circumference}
              animate={{ stroke: color }}
              transition={{ duration: 0.3 }}
            />
          </svg>

          {/* Number */}
          <motion.span
            key={timeLeft}
            initial={{ scale: isUrgent ? 1.3 : 1, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-2xl font-black z-10"
            style={{ color: isExpired ? "#ef4444" : color }}
          >
            {isExpired ? "✕" : timeLeft}
          </motion.span>
        </div>

        {/* Status label */}
        <motion.p
          animate={{ opacity: isUrgent && !isExpired ? [1, 0.5, 1] : 1 }}
          transition={{
            duration: 0.5,
            repeat: isUrgent && !isExpired ? Infinity : 0,
          }}
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: isExpired ? "#ef4444" : color }}
        >
          {isExpired
            ? "Time's Up! Submit Now →"
            : isUrgent
              ? "Hurry!"
              : isMid
                ? "Keep going..."
                : "Seconds left"}
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
};

export default TwistCardTimer;
