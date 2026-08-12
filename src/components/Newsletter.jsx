import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "../supabaseClient";

const ACCENT = "#FF00C8";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubscribe = async (e) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      setStatus("error");
      setErrorMsg("Enter a valid email address.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: email.trim().toLowerCase() });

    if (error) {
      if (error.code === "23505") {
        setStatus("error");
        setErrorMsg("You're already subscribed!");
      } else {
        console.error("Newsletter signup error:", error);
        setStatus("error");
        setErrorMsg("Something went wrong. Please try again.");
      }
      return;
    }

    setStatus("success");
    setEmail("");
  };

  return (
    <section className="relative py-24 px-6 bg-[#080810]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-xl mx-auto text-center"
      >
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: `${ACCENT}12`,
            border: `1px solid ${ACCENT}30`,
          }}
        >
          <Mail size={22} style={{ color: ACCENT }} />
        </div>

        <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
          Stay in the <span style={{ color: ACCENT }}>Loop</span>
        </h2>

        <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-8 max-w-md mx-auto">
          New challenges, arena events, and community highlights — straight to
          your inbox. No spam, just chaos worth reading.
        </p>

        {status === "success" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl mx-auto max-w-sm"
            style={{
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.25)",
            }}
          >
            <CheckCircle2 size={18} className="text-green-400" />
            <span className="text-green-400 text-sm font-semibold">
              You're in! Watch your inbox.
            </span>
          </motion.div>
        ) : (
          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              placeholder="you@example.com"
              className="flex-1 px-4 py-3 rounded-xl bg-[#0f0f1a] border border-white/10 text-white placeholder-gray-600 text-sm outline-none transition"
              onFocus={(e) => (e.target.style.borderColor = `${ACCENT}60`)}
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.1)")
              }
            />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={status === "loading"}
              className="px-6 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
              style={{ background: ACCENT }}
            >
              {status === "loading" ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Subscribing...
                </>
              ) : (
                "Subscribe"
              )}
            </motion.button>
          </form>
        )}

        {status === "error" && (
          <p className="text-red-400 text-xs mt-3">{errorMsg}</p>
        )}

        <p className="text-gray-600 text-[11px] mt-5">
          Join the community — unsubscribe anytime.
        </p>
      </motion.div>
    </section>
  );
};

export default Newsletter;
