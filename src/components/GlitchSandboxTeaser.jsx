import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Zap,
  ArrowRight,
  RefreshCw,
  Terminal,
  Code2,
} from "lucide-react";
import PageHeading from "./PageHeading";

const GlitchSandboxTeaser = () => {
  const [fixed, setFixed] = useState(false);
  const [showBonusParticle, setShowBonusParticle] = useState(false);
  const navigate = useNavigate();

  const handleFixGlitch = () => {
    if (!fixed) {
      setFixed(true);
      setShowBonusParticle(true);
      setTimeout(() => setShowBonusParticle(false), 3000);
    }
  };

  const handleReset = () => {
    setFixed(false);
  };

  return (
    <section className="relative py-20 px-6 bg-transparent border-t border-white/5 overflow-hidden">
      {/* Background Ambient Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: "#00F0FF" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Unified Page Heading */}
        <PageHeading
          eyebrow="Interactive Live Demo"
          title="Test Your Glitch Hunting Skills"
          subtitle="Can you spot the asynchronous state bug below? Click Fix Glitch to test the interactive debugger in action!"
          accent="cyan"
          size="lg"
        />

        {/* Interactive Sandbox Card */}
        <div className="relative max-w-2xl mx-auto bg-[#0d0d14] border border-white/10 rounded-3xl p-6 sm:p-8 text-left shadow-2xl overflow-hidden mt-6">
          {/* Top Window Bar */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-xs font-mono text-gray-500 ml-2">
                UserProfileComponent.jsx
              </span>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/25 font-bold">
              {fixed ? "STATUS: RESOLVED ✓" : "BUG DETECTED ⚠️"}
            </span>
          </div>

          {/* Floating Particle Text on Solve */}
          <AnimatePresence>
            {showBonusParticle && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: -40, scale: 1.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute top-12 right-8 z-30 pointer-events-none px-3.5 py-1.5 rounded-xl bg-[#FF00C8] text-white font-black text-xs shadow-[0_0_20px_rgba(255,0,200,0.6)] flex items-center gap-1.5"
              >
                <Zap size={14} /> +25 gBits! Speed Demon Clearance
              </motion.div>
            )}
          </AnimatePresence>

          {/* Code Viewer */}
          <div className="font-mono text-xs sm:text-sm leading-relaxed mb-6 bg-[#070709] p-4 sm:p-5 rounded-2xl border border-white/5 relative">
            {!fixed ? (
              <div className="space-y-1 text-gray-300">
                <p className="text-gray-500">
                  // Bug: Missing await cause state race condition
                </p>
                <p>
                  <span className="text-[#FF00C8]">const</span> [user, setUser]
                  = <span className="text-[#00F0FF]">useState</span>(null);
                </p>
                <p>
                  <span className="text-[#FF00C8]">useEffect</span>(() =&#123;
                </p>
                <p className="pl-4 bg-red-500/10 border-l-2 border-red-500 py-0.5 text-red-300">
                  <span className="text-gray-400">const</span> data =
                  fetchUserData();{" "}
                  <span className="text-red-400 font-bold">
                    // ⚠️ Promise not awaited!
                  </span>
                </p>
                <p className="pl-4">setUser(data);</p>
                <p>&#125;, []);</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-1 text-gray-300"
              >
                <p className="text-[#22c55e]">
                  // ✓ Fixed: Properly awaited async response
                </p>
                <p>
                  <span className="text-[#FF00C8]">const</span> [user, setUser]
                  = <span className="text-[#00F0FF]">useState</span>(null);
                </p>
                <p>
                  <span className="text-[#FF00C8]">useEffect</span>(() =&#123;
                </p>
                <p className="pl-4 bg-green-500/10 border-l-2 border-green-500 py-0.5 text-green-300 font-bold">
                  <span className="text-gray-400">const</span> data ={" "}
                  <span className="text-[#00F0FF]">await</span> fetchUserData();{" "}
                  <span className="text-green-400">
                    // ✓ Clean async resolution
                  </span>
                </p>
                <p className="pl-4">setUser(data);</p>
                <p>&#125;, []);</p>
              </motion.div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            {!fixed ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleFixGlitch}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#00F0FF] text-black font-black text-xs uppercase tracking-wider cursor-pointer shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                <Code2 size={16} /> Fix Glitch Live →
              </motion.button>
            ) : (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs font-bold text-[#22c55e] flex items-center gap-1.5">
                  <CheckCircle2 size={16} /> Glitch Patched!
                </span>
                <button
                  onClick={handleReset}
                  className="text-xs text-gray-500 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw size={12} /> Reset
                </button>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/explore")}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#FF00C8] text-white font-bold text-xs cursor-pointer shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              Explore All Glitches <ArrowRight size={14} />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GlitchSandboxTeaser;
