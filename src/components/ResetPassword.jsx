import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";
import Navbar from "./Navbar";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking] = useState(true);

  // Supabase puts the access token in the URL hash when user
  // clicks the reset link — we need to detect the session
  useEffect(() => {
    const checkSession = async () => {
      // Give Supabase a moment to process the hash tokens
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setValidSession(true);
      }
      setChecking(false);
    };

    // Listen for the PASSWORD_RECOVERY event fired by Supabase
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setValidSession(true);
        setChecking(false);
      }
    });

    checkSession();
    return () => listener.subscription.unsubscribe();
  }, []);

  const strength = (() => {
    if (!password) return null;
    if (password.length < 6)
      return { label: "Too short", color: "#ef4444", pct: 20 };
    if (password.length < 8)
      return { label: "Weak", color: "#f59e0b", pct: 45 };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password))
      return { label: "Fair", color: "#eab308", pct: 65 };
    if (password.length < 12)
      return { label: "Good", color: "#22c55e", pct: 82 };
    return { label: "Strong", color: "#00F0FF", pct: 100 };
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setDone(true);
      // Auto-redirect to home after 3 seconds
      setTimeout(() => navigate("/"), 3000);
    }
  };

  const inputRow = (focused) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${
      focused
        ? "bg-white/[0.04] border-[#00F0FF]/50"
        : "bg-white/[0.03] border-white/8"
    }`;

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col">
      <Navbar />

      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,240,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,0.5) 1px,transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Ambient glow */}
      <div
        className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ background: "radial-gradient(#FF00C8, transparent)" }}
      />

      <div className="flex-1 flex items-center justify-center px-4 py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div
            className="relative rounded-3xl overflow-hidden border border-white/8"
            style={{ background: "linear-gradient(150deg,#0f0f18,#0a0a12)" }}
          >
            {/* Top accent */}
            <div
              className="h-[2px] w-full"
              style={{
                background:
                  "linear-gradient(90deg,transparent,#FF00C8,#00F0FF,transparent)",
              }}
            />

            <div className="p-8">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#FF00C8]/8 border border-[#FF00C8]/20 flex items-center justify-center p-2">
                  <img
                    src="/logo_GR.png"
                    alt="Glitch Room"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {/* ── Checking session ── */}
                {checking && (
                  <motion.div
                    key="checking"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-6"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: "linear",
                      }}
                      className="w-10 h-10 border-2 border-t-transparent border-[#FF00C8] rounded-full mx-auto mb-4"
                    />
                    <p className="text-gray-500 text-sm">
                      Verifying your reset link…
                    </p>
                  </motion.div>
                )}

                {/* ── Invalid / expired link ── */}
                {!checking && !validSession && (
                  <motion.div
                    key="invalid"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4"
                  >
                    <div
                      className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{
                        background: "rgba(239,68,68,0.1)",
                        border: "2px solid rgba(239,68,68,0.3)",
                      }}
                    >
                      <FiAlertCircle size={28} className="text-red-400" />
                    </div>
                    <h2 className="text-xl font-black text-white mb-2">
                      Link Expired
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                      This password reset link has expired or already been used.
                      Request a new one from the login page.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate("/")}
                      className="px-6 py-2.5 rounded-xl font-bold text-sm text-white cursor-pointer"
                      style={{
                        background: "linear-gradient(90deg,#FF00C8,#00F0FF)",
                      }}
                    >
                      Back to Home
                    </motion.button>
                  </motion.div>
                )}

                {/* ── Success state ── */}
                {done && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                        delay: 0.1,
                      }}
                      className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{
                        background: "rgba(0,240,255,0.1)",
                        border: "2px solid rgba(0,240,255,0.35)",
                      }}
                    >
                      <FiCheck size={28} className="text-[#00F0FF]" />
                    </motion.div>
                    <h2 className="text-xl font-black text-white mb-2">
                      Password Updated!
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-2">
                      Your password has been changed successfully.
                    </p>
                    <p className="text-gray-600 text-xs mb-6">
                      Redirecting you to the home page…
                    </p>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden mx-auto max-w-[200px]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 3, ease: "linear" }}
                        className="h-full rounded-full"
                        style={{
                          background: "linear-gradient(90deg,#FF00C8,#00F0FF)",
                        }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* ── Reset form ── */}
                {!checking && validSession && !done && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h2 className="text-2xl font-black text-white text-center mb-1">
                      Set New Password
                    </h2>
                    <p className="text-gray-500 text-sm text-center mb-7">
                      Choose a strong password for your Glitch Room account.
                    </p>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2"
                      >
                        <FiAlertCircle size={13} className="shrink-0" /> {error}
                      </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* New password */}
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest block mb-1.5">
                          New Password
                        </label>
                        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 focus-within:border-[#FF00C8]/50 transition-colors">
                          <FiLock
                            size={15}
                            className="text-gray-500 shrink-0"
                          />
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Min. 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-500 hover:text-gray-300 transition cursor-pointer shrink-0"
                          >
                            {showPassword ? (
                              <FiEyeOff size={14} />
                            ) : (
                              <FiEye size={14} />
                            )}
                          </button>
                        </div>

                        {/* Strength bar */}
                        {strength && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-2"
                          >
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="text-gray-600">
                                Password strength
                              </span>
                              <span style={{ color: strength.color }}>
                                {strength.label}
                              </span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${strength.pct}%` }}
                                transition={{ duration: 0.4 }}
                                className="h-full rounded-full"
                                style={{ background: strength.color }}
                              />
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Confirm password */}
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest block mb-1.5">
                          Confirm Password
                        </label>
                        <div
                          className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-colors ${
                            confirmPassword && confirmPassword !== password
                              ? "bg-red-500/5 border-red-500/30"
                              : confirmPassword && confirmPassword === password
                                ? "bg-green-500/5 border-green-500/25"
                                : "bg-white/[0.03] border-white/8 focus-within:border-[#FF00C8]/50"
                          }`}
                        >
                          <FiLock
                            size={15}
                            className="text-gray-500 shrink-0"
                          />
                          <input
                            type={showConfirm ? "text" : "password"}
                            placeholder="Repeat your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none"
                          />
                          <div className="flex items-center gap-2 shrink-0">
                            {confirmPassword && (
                              <span>
                                {confirmPassword === password ? (
                                  <FiCheck
                                    size={14}
                                    className="text-green-400"
                                  />
                                ) : (
                                  <FiAlertCircle
                                    size={14}
                                    className="text-red-400"
                                  />
                                )}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setShowConfirm(!showConfirm)}
                              className="text-gray-500 hover:text-gray-300 transition cursor-pointer"
                            >
                              {showConfirm ? (
                                <FiEyeOff size={14} />
                              ) : (
                                <FiEye size={14} />
                              )}
                            </button>
                          </div>
                        </div>
                        {confirmPassword && confirmPassword !== password && (
                          <p className="text-red-400 text-[10px] mt-1 pl-1">
                            Passwords don't match
                          </p>
                        )}
                      </div>

                      {/* Submit */}
                      <motion.button
                        whileHover={{
                          scale: 1.02,
                          boxShadow: "0 0 20px rgba(255,0,200,0.35)",
                        }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={
                          loading ||
                          !password ||
                          !confirmPassword ||
                          password !== confirmPassword
                        }
                        className="w-full py-3.5 rounded-xl font-bold text-sm text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all mt-2"
                        style={{
                          background: "linear-gradient(90deg,#FF00C8,#00F0FF)",
                        }}
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.8,
                                ease: "linear",
                              }}
                              className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Updating password…
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <FiCheck size={15} /> Update Password
                          </span>
                        )}
                      </motion.button>
                    </form>

                    {/* Tips */}
                    <div className="mt-6 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                      <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-2">
                        Tips for a strong password
                      </p>
                      {[
                        "At least 8 characters long",
                        "Mix of uppercase and lowercase letters",
                        "Include numbers and special characters",
                        "Don't reuse old passwords",
                      ].map((tip, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-[11px] text-gray-600 mt-1.5"
                        >
                          <span className="w-1 h-1 rounded-full bg-gray-600 shrink-0" />
                          {tip}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Back link */}
          {!done && !checking && (
            <p className="text-center text-xs text-gray-600 mt-4">
              Remember your password?{" "}
              <button
                onClick={() => navigate("/")}
                className="text-[#00F0FF] hover:text-white transition cursor-pointer font-semibold"
              >
                Back to Home
              </button>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
