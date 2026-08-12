import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiCheck,
} from "react-icons/fi";

// view: "login" | "signup" | "forgot"
const AuthModal = ({ isOpen, onClose }) => {
  const [view, setView] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const resetState = () => {
    setError("");
    setForgotEmail("");
    setForgotSent(false);
    setShowPassword(false);
    setLoading(false);
  };

  const switchView = (v) => {
    resetState();
    setView(v);
  };

  /* ── Login / Signup ── */
  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const email = e.target.email.value;
    const password = e.target.password.value;

    if (view === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (error) setError(error.message);
      else {
        resetState();
        onClose();
      }
    } else {
      const fullName = e.target.fullName.value;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      resetState();
      onClose();
    }
  };

  /* ── Forgot password — send reset email ── */
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(
      forgotEmail.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      },
    );
    setLoading(false);
    if (error) setError(error.message);
    else setForgotSent(true);
  };

  const inputRow =
    "flex items-center gap-3 bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 focus-within:border-[#00F0FF]/40 transition-colors";
  const inputCls =
    "flex-1 bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-[999] bg-black/70 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-[90%] md:w-[420px] bg-[#0a0a0c] border border-white/8 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Top accent */}
            <div
              className="h-[2px] w-full"
              style={{
                background:
                  "linear-gradient(90deg,transparent,#00F0FF,#FF00C8,transparent)",
              }}
            />

            <div className="p-7">
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 text-gray-500 hover:text-white transition text-lg cursor-pointer z-10"
              >
                ✕
              </button>

              {/* Logo */}
              <div className="flex justify-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-[#00F0FF]/8 border border-[#00F0FF]/15 flex items-center justify-center p-2">
                  <img
                    src="/logo_GR.png"
                    alt="Glitch Room"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {/* ══════════ FORGOT PASSWORD VIEW ══════════ */}
                {view === "forgot" && (
                  <motion.div
                    key="forgot"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.22 }}
                  >
                    {/* Back button */}
                    <button
                      onClick={() => switchView("login")}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#00F0FF] transition cursor-pointer mb-5"
                    >
                      <FiArrowLeft size={13} /> Back to Login
                    </button>

                    {!forgotSent ? (
                      <>
                        <h2 className="text-2xl font-black text-white text-center mb-1">
                          Forgot Password?
                        </h2>
                        <p className="text-gray-500 text-sm text-center mb-6 leading-relaxed">
                          Enter the email address linked to your account and
                          we'll send you a reset link.
                        </p>

                        {error && (
                          <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                            {error}
                          </div>
                        )}

                        <form
                          onSubmit={handleForgotSubmit}
                          className="space-y-3"
                        >
                          <div className={inputRow}>
                            <FiMail
                              size={16}
                              className="text-gray-500 shrink-0"
                            />
                            <input
                              type="email"
                              placeholder="Your email address"
                              value={forgotEmail}
                              onChange={(e) => setForgotEmail(e.target.value)}
                              required
                              className={inputCls}
                            />
                          </div>

                          <motion.button
                            whileHover={{
                              boxShadow: "0 0 16px rgba(255,0,200,0.3)",
                            }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading || !forgotEmail.trim()}
                            className="w-full py-3 rounded-xl font-bold text-sm text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            style={{
                              background:
                                "linear-gradient(90deg,#FF00C8,#00F0FF)",
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
                                Sending…
                              </span>
                            ) : (
                              "Send Reset Link →"
                            )}
                          </motion.button>
                        </form>
                      </>
                    ) : (
                      /* Success state */
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-4"
                      >
                        <div
                          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                          style={{
                            background: "rgba(0,240,255,0.1)",
                            border: "2px solid rgba(0,240,255,0.3)",
                          }}
                        >
                          <FiCheck size={28} className="text-[#00F0FF]" />
                        </div>
                        <h2 className="text-xl font-black text-white mb-2">
                          Check your inbox
                        </h2>
                        <p className="text-gray-400 text-sm leading-relaxed mb-1">
                          We've sent a password reset link to:
                        </p>
                        <p className="text-[#00F0FF] text-sm font-semibold mb-6">
                          {forgotEmail}
                        </p>
                        <p className="text-gray-600 text-xs mb-6 leading-relaxed">
                          Didn't receive it? Check your spam folder or{" "}
                          <button
                            onClick={() => {
                              setForgotSent(false);
                              setForgotEmail("");
                            }}
                            className="text-[#FF00C8] hover:text-white transition cursor-pointer"
                          >
                            try again
                          </button>
                          .
                        </p>
                        <button
                          onClick={() => switchView("login")}
                          className="text-xs text-gray-500 hover:text-white transition cursor-pointer"
                        >
                          ← Back to Login
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* ══════════ LOGIN / SIGNUP VIEW ══════════ */}
                {view !== "forgot" && (
                  <motion.div
                    key="auth"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.22 }}
                  >
                    <h2 className="text-2xl font-black text-white text-center mb-1">
                      {view === "login" ? "Welcome back" : "Join the chaos"}
                    </h2>
                    <p className="text-gray-500 text-sm text-center mb-6">
                      {view === "login"
                        ? "Sign in to your Glitch Room account"
                        : "Create your Glitch Room account"}
                    </p>

                    {/* Tab switcher */}
                    <div className="flex gap-1 p-1 bg-white/[0.04] border border-white/5 rounded-xl mb-6">
                      {["login", "signup"].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => switchView(v)}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                            view === v
                              ? "border border-[#00F0FF]/40 text-[#00F0FF] bg-[#00F0FF]/8"
                              : "text-gray-500 hover:text-gray-300 bg-transparent border border-transparent"
                          }`}
                        >
                          {v === "login" ? "Log In" : "Sign Up"}
                        </button>
                      ))}
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-3">
                      {/* Full name — signup only */}
                      <AnimatePresence>
                        {view === "signup" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className={inputRow}>
                              <FiUser
                                size={16}
                                className="text-gray-500 shrink-0"
                              />
                              <input
                                type="text"
                                name="fullName"
                                placeholder="Full Name"
                                required={view === "signup"}
                                className={inputCls}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Email */}
                      <div className={inputRow}>
                        <FiMail size={16} className="text-gray-500 shrink-0" />
                        <input
                          type="email"
                          name="email"
                          placeholder="Email address"
                          required
                          className={inputCls}
                        />
                      </div>

                      {/* Password */}
                      <div className={inputRow}>
                        <FiLock size={16} className="text-gray-500 shrink-0" />
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Password"
                          required
                          className={inputCls}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-500 hover:text-gray-300 transition cursor-pointer shrink-0"
                        >
                          {showPassword ? (
                            <FiEyeOff size={15} />
                          ) : (
                            <FiEye size={15} />
                          )}
                        </button>
                      </div>

                      {/* Forgot password link */}
                      {view === "login" && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => switchView("forgot")}
                            className="text-xs text-[#00F0FF] hover:text-white transition cursor-pointer"
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}

                      {/* Submit */}
                      <motion.button
                        whileHover={{
                          letterSpacing: "0.06em",
                          boxShadow: "0 0 14px rgba(0,240,255,0.25)",
                        }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.25 }}
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 border border-[#00F0FF] text-[#00F0FF] py-3 rounded-xl font-bold text-sm bg-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading
                          ? "Please wait…"
                          : view === "login"
                            ? "Log In →"
                            : "Create Account →"}
                      </motion.button>
                    </form>

                    {/* Switch mode */}
                    <p className="text-xs text-center mt-5 text-gray-600">
                      {view === "login"
                        ? "New to Glitch Room?"
                        : "Already have an account?"}{" "}
                      <button
                        type="button"
                        onClick={() =>
                          switchView(view === "login" ? "signup" : "login")
                        }
                        className="text-[#00F0FF] font-semibold hover:text-white transition cursor-pointer"
                      >
                        {view === "login" ? "Sign up free" : "Log in"}
                      </button>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
