import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import { Terminal, RefreshCw, Home, Compass, Trophy, AlertTriangle } from "lucide-react";

/**
 * Interactive Concentric Audio-Visual Ripple Canvas
 * Inspired by acoustic frequency rings and digital wave displacement.
 * Mouse movement creates dynamic soundwave ripple spikes through concentric circular rings.
 */
const Canvas404Ripples = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, radius: 180 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let animationFrameId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    let time = 0;
    const ringsCount = 28;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(canvas.width, canvas.height) * 0.45;

      for (let i = 1; i <= ringsCount; i++) {
        const baseRadius = (i / ringsCount) * maxRadius;
        ctx.beginPath();

        const segments = 120;
        for (let j = 0; j <= segments; j++) {
          const angle = (j / segments) * Math.PI * 2;
          let px = centerX + Math.cos(angle) * baseRadius;
          let py = centerY + Math.sin(angle) * baseRadius;

          // Mouse proximity displacement
          const dx = px - mouseRef.current.x;
          const dy = py - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let offset = Math.sin(angle * 6 + time + i * 0.2) * 2;

          if (dist < mouseRef.current.radius) {
            const force = (1 - dist / mouseRef.current.radius) * 18;
            offset += Math.sin(dist * 0.1 - time * 4) * force;
          }

          const r = baseRadius + offset;
          const finalX = centerX + Math.cos(angle) * r;
          const finalY = centerY + Math.sin(angle) * r;

          if (j === 0) ctx.moveTo(finalX, finalY);
          else ctx.lineTo(finalX, finalY);
        }

        ctx.closePath();

        // Color gradient based on ring index
        const alpha = Math.max(0.04, 0.25 - (i / ringsCount) * 0.15);
        if (i % 2 === 0) {
          ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
        } else {
          ctx.strokeStyle = `rgba(255, 0, 200, ${alpha})`;
        }

        ctx.lineWidth = i % 5 === 0 ? 1.8 : 1;
        ctx.setLineDash(i % 3 === 0 ? [8, 12] : []);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
    />
  );
};

const NotFound = () => {
  const navigate = useNavigate();
  const [rebooting, setRebooting] = useState(false);

  const handleReboot = () => {
    setRebooting(true);
    setTimeout(() => {
      navigate("/");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col justify-center items-center relative overflow-hidden selection:bg-[#00F0FF]/20 px-6">
      <main className="relative flex-1 flex flex-col items-center justify-center py-20 px-6 z-10 w-full">
        {/* Concentric Ripple Canvas */}
        <Canvas404Ripples />

        {/* Ambient Glow Orbs */}
        <div
          className="absolute top-1/3 left-1/4 w-[500px] h-[300px] rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ background: "#FF00C8" }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-[500px] h-[300px] rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ background: "#00F0FF" }}
        />

        {/* Main 404 Content Overlay */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-20 flex flex-col items-center text-center max-w-2xl mx-auto pointer-events-none"
        >
          {/* Giant Acoustic 404 Watermark */}
          <div className="relative mb-2 select-none">
            <h1
              className="text-[120px] sm:text-[180px] md:text-[220px] font-black leading-none tracking-tighter"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.01) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "-2px 0 0 rgba(0,240,255,0.3), 2px 0 0 rgba(255,0,200,0.3)",
              }}
            >
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="px-4 py-1.5 rounded-full bg-[#0d0d14]/90 border border-red-500/30 text-red-400 font-mono text-xs tracking-widest uppercase flex items-center gap-2 shadow-2xl backdrop-blur-md">
                <AlertTriangle size={14} className="animate-pulse" /> MATRIX_SECTOR_NOT_FOUND
              </span>
            </div>
          </div>

          {/* Error Message & Details */}
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-3">
            You've Entered a Void
          </h2>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-lg mb-8">
            The page you requested glitched into non-existence or moved to another dimension. Don't worry — your progress and gBits remain safe.
          </p>

          {/* Interactive Diagnostic Terminal Box */}
          <div className="w-full max-w-md bg-[#0f0f18]/90 border border-white/10 rounded-2xl p-4 mb-8 text-left shadow-2xl backdrop-blur-md pointer-events-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3 text-xs font-mono text-gray-500">
              <span className="flex items-center gap-2">
                <Terminal size={13} className="text-[#00F0FF]" /> SYSTEM_DIAGNOSTIC
              </span>
              <span className="text-gray-600">0x404_VOID</span>
            </div>

            <div className="space-y-1.5 text-xs font-mono text-gray-400 mb-4">
              <p>
                <span className="text-[#FF00C8]">[$]</span> locate_route --path="{window.location.pathname}"
              </p>
              <p className="text-red-400">
                [!] ERROR: 404 NULL_POINTER_EXCEPTION
              </p>
              <p className="text-gray-500">
                [*] RECOMMENDATION: Return to core network or execute auto-repair.
              </p>
            </div>

            {/* Quick Diagnostic Repair Button */}
            <button
              onClick={handleReboot}
              disabled={rebooting}
              className="w-full py-2.5 rounded-xl bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border border-[#00F0FF]/30 text-[#00F0FF] font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw size={13} className={rebooting ? "animate-spin" : ""} />
              {rebooting ? "REBOOTING MATRIX..." : "RUN AUTO-REPAIR & GO HOME"}
            </button>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center pointer-events-auto">
            <button onClick={() => navigate("/")} className="cursor-pointer">
              <Button content="← Return to Home" accent="cyan" />
            </button>
            <button onClick={() => navigate("/explore")} className="cursor-pointer">
              <Button content="Explore Challenges" accent="purple" variant="outline" />
            </button>
            <button onClick={() => navigate("/terminal-wall")} className="cursor-pointer">
              <Button content="Terminal Wall" accent="pink" variant="outline" />
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default NotFound;
