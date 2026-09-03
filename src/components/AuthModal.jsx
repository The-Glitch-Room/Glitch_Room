import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { updatePoints } from "../utils/pointsHelper";
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
  const navigate = useNavigate();
  const [view, setView] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState("");
  const [resendMsg, setResendMsg] = useState("");

    const isSubmittingRef = useRef(false);

  const formatAuthError = (msg) => {
    if (!msg) return "An error occurred. Please try again.";
    const lower = msg.toLowerCase();
    if (
      lower.includes("rate limit") ||
      lower.includes("security purposes") ||
      lower.includes("try again after") ||
      lower.includes("over_email_send_rate_limit")
    ) {
      return "Security Rate Limit: Multiple attempts detected. Please wait 1 minute before trying again or try logging in if you already have an account.";
    }
    if (
      lower.includes("already registered") ||
      lower.includes("user_already_exists")
    ) {
      return "An account with this email address already exists. Please log in.";
    }
    if (lower.includes("invalid login credentials")) {
      return "Invalid email or password. Please check your credentials.";
    }
    return msg;
  };

  useEffect(() => {
    const handleSetError = (e) => {
      if (e?.detail?.error) {
        setError(formatAuthError(e.detail.error));
      }
    };
    window.addEventListener("set_auth_modal_error", handleSetError);
    return () => window.removeEventListener("set_auth_modal_error", handleSetError);
  }, []);

  const resetState = () => {
    setError("");
    setForgotEmail("");
    setForgotSent(false);
    setConfirmedEmail("");
    setResendMsg("");
    setShowPassword(false);
    setLoading(false);
    isSubmittingRef.current = false;
  };

  const switchView = (v) => {
    resetState();
    setView(v);
  };

  /* ── Login / Signup ── */
  const handleAuth = async (e) => {
    e.preventDefault();
    if (loading || isSubmittingRef.current) return;

    setError("");
    setLoading(true);
    isSubmittingRef.current = true;

    try {
      const email = (e.target.email.value || "").trim().toLowerCase();
      const password = e.target.password.value;

      if (!email || !password) {
        setError("Please enter both email and password.");
        setLoading(false);
        isSubmittingRef.current = false;
        return;
      }

      if (view === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setError(formatAuthError(error.message));
        } else {
          resetState();
          onClose();
        }
      } else {
        const fullName = (e.target.fullName?.value || "").trim();
        if (!fullName) {
          setError("Please enter your full name.");
          setLoading(false);
          isSubmittingRef.current = false;
          return;
        }

        const redirectUrl = `${window.location.origin}`;
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          setError(formatAuthError(error.message));
          return;
        }

        // Detect if user already exists (Supabase returns empty identities array)
        if (signUpData?.user && signUpData?.user?.identities?.length === 0) {
          setError("An account with this email address already exists. Please log in.");
          return;
        }

        const newUserId = signUpData?.user?.id;
        if (newUserId) {
          const cleanName = fullName || "Glitcher";
          const baseUsername = `@${cleanName.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")}_${newUserId.slice(0, 8)}`;

          for (let attempt = 0; attempt < 3; attempt++) {
            const candidateUsername =
              attempt === 0
                ? baseUsername
                : `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;

            const { error: profileErr } = await supabase.from("profiles").upsert(
              {
                id: newUserId,
                full_name: cleanName,
                username: candidateUsername,
                points: 100,
              },
              { onConflict: "id" }
            );

            if (!profileErr) {
              await updatePoints(100, "Welcome Bonus - Joined Glitch Room", "signup", null, newUserId).catch(e => console.error("Signup points update error:", e));
              break;
            }
            if (profileErr.code !== "23505") {
              console.error("Profile creation failed:", profileErr);
              break;
            }
          }
        }

        window.dispatchEvent(new Event("profile_updated"));
        window.dispatchEvent(new Event("points_updated"));

        // If session was created immediately (auto-confirm enabled)
        if (signUpData?.session) {
          resetState();
          onClose();
          try {
            navigate("/create-profile");
          } catch (navErr) {
            window.location.href = "/create-profile";
          }
        } else {
          // Email confirmation is required — show confirm_email view
          setConfirmedEmail(email);
          setLoading(false);
          isSubmittingRef.current = false;
          setView("confirm_email");
        }
      }
    } catch (err) {
      console.error("Auth submit error:", err);
      setError(formatAuthError(err?.message));
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  /* ── Resend Signup Confirmation Email ── */
  const handleResendSignupEmail = async () => {
    if (!confirmedEmail || loading || isSubmittingRef.current) return;
    setLoading(true);
    isSubmittingRef.current = true;
    setError("");
    setResendMsg("");

    try {
      const redirectUrl = `${window.location.origin}`;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: confirmedEmail,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) {
        setError(formatAuthError(error.message));
      } else {
        setResendMsg("Confirmation link resent! Check your inbox.");
      }
    } catch (err) {
      setError(formatAuthError(err?.message));
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  /* ── Forgot password — send reset email ── */
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim() || loading || isSubmittingRef.current) return;

    setLoading(true);
    isSubmittingRef.current = true;
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        forgotEmail.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );
      if (error) {
        setError(formatAuthError(error.message));
      } else {
        setForgotSent(true);
      }
    } catch (err) {
      setError(formatAuthError(err?.message));
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const inputRow =
    "flex items-center gap-3 bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 focus-within:border-[#00F0FF]/40 transition-colors";
  const inputCls =
    "flex-1 bg-transparent text-white text-[16px] md:text-sm placeholder-gray-600 focus:outline-none";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-[999] bg-black/70 backdrop-blur-md p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-[90%] md:w-[420px] max-h-[90vh] max-h-[90dvh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-[#0a0a0c] border border-white/8 rounded-2xl shadow-2xl p-5 md:p-7"
          >
            {/* Top accent */}
            <div
              className="h-[2px] w-full absolute top-0 left-0 right-0"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #00F0FF, #FF00C8, transparent)",
              }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition cursor-pointer text-lg"
            >
              ✕
            </button>

            {/* Content area */}
            <div className="relative z-10">
              <AnimatePresence mode="wait">
                {/* ══════════ CONFIRM EMAIL PLACEHOLDER VIEW ══════════ */}
                {view === "confirm_email" && (
                  <motion.div
                    key="confirm_email"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.22 }}
                    className="text-center space-y-4 py-2"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center mx-auto text-[#00F0FF]">
                      <FiMail size={32} className="animate-pulse" />
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-white mb-1">
                        Check your inbox!
                      </h3>
                      <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                        We sent a confirmation link to{" "}
                        <span className="text-[#00F0FF] font-bold font-mono">
                          {confirmedEmail}
                        </span>
                        . Please click the link in your email to activate your account.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/8 text-[11px] text-gray-400 text-left space-y-1">
                      <p className="font-bold text-gray-300">What to do next:</p>
                      <p>1. Open your email inbox (and check spam folder).</p>
                      <p>2. Click <strong>Confirm your mail</strong> link.</p>
                      <p>3. Return here and log in with your credentials.</p>
                    </div>

                    {resendMsg && (
                      <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                        {resendMsg}
                      </div>
                    )}

                    {error && (
                      <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                        {error}
                      </div>
                    )}

                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => switchView("login")}
                        className="w-full py-3 rounded-xl bg-[#00F0FF] hover:bg-[#00d0df] text-black font-bold text-xs transition cursor-pointer"
                      >
                        ← Return to Log In
                      </button>

                      <button
                        type="button"
                        onClick={handleResendSignupEmail}
                        disabled={loading}
                        className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {loading ? "Sending..." : "Didn't get email? Resend link"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ══════════ FORGOT PASSWORD VIEW ══════════ */}
                {view === "forgot" && (
                  <motion.div
                    key="forgot"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.22 }}
                  >
                    <button
                      type="button"
                      onClick={() => switchView("login")}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#00F0FF] transition mb-4 cursor-pointer"
                    >
                      <FiArrowLeft size={13} /> Back to Log In
                    </button>

                    <h2 className="text-2xl font-black text-white text-center mb-1">
                      Reset Password
                    </h2>
                    <p className="text-gray-500 text-sm text-center mb-4">
                      Enter your email and we'll send you a link to reset your
                      password.
                    </p>

                    {!forgotSent ? (
                      <form
                        onSubmit={handleForgotSubmit}
                        className="space-y-4"
                      >
                        {error && (
                          <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                            {error}
                          </div>
                        )}
                        <div className={inputRow}>
                          <FiMail
                            size={16}
                            className="text-gray-500 shrink-0"
                          />
                          <input
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="Your email address"
                            required
                            className={inputCls}
                          />
                        </div>
                        <motion.button
                          whileHover={{
                            letterSpacing: "0.06em",
                            boxShadow: "0 0 14px rgba(0,240,255,0.25)",
                          }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.25 }}
                          type="submit"
                          disabled={loading}
                          className="w-full border border-[#00F0FF] text-[#00F0FF] py-3 rounded-xl font-bold text-sm bg-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? "Sending link…" : "Send Reset Link →"}
                        </motion.button>
                      </form>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-3 py-2"
                      >
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                          <FiCheck size={22} />
                        </div>
                        <p className="text-sm text-gray-300 font-medium">
                          Reset link sent to{" "}
                          <span className="text-[#00F0FF]">
                            {forgotEmail}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Check your inbox (and spam folder). Click the link in
                          the email to choose a new password.
                        </p>
                        <p className="text-xs text-gray-500 pt-2">
                          Didn't get it?{" "}
                          <button
                            onClick={() => {
                              setForgotSent(false);
                              setError("");
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
                {view !== "forgot" && view !== "confirm_email" && (
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
                    <div className="flex gap-1 p-1 bg-white/[0.04] border border-white/5 rounded-xl mb-4">
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
                      <div className="mb-4 px-3.5 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs space-y-2">
                        <p className="leading-relaxed">{error}</p>
                        {view === "signup" && (
                          <div className="pt-1 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => switchView("login")}
                              className="px-3 py-1.5 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] font-bold text-[11px] hover:bg-[#00F0FF]/25 transition cursor-pointer"
                            >
                              🔑 Try Logging In Instead →
                            </button>
                          </div>
                        )}
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
                                disabled={loading}
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
                          disabled={loading}
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
                          disabled={loading}
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
