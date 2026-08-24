import React, { useEffect, useRef } from "react";

const GlitchBackground = ({ isAbsolute = false }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let animationFrameId;

    let width = (canvas.width = canvas.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.offsetHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.offsetHeight || window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Mouse tracking for subtle interactive field shift
    let mouse = { x: width / 2, y: height / 2, active: false };
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    // ── 1. Digital Nodes / Particles ──────────────────────────────────────
    const particleCount = Math.min(65, Math.floor(width / 22));
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      radius: Math.random() * 1.8 + 0.8,
      color:
        Math.random() > 0.4
          ? "#00F0FF"
          : Math.random() > 0.5
          ? "#FF00C8"
          : "#D600FF",
      baseAlpha: Math.random() * 0.5 + 0.25,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    // ── 2. Floating Code Fragments & Data Symbols ──────────────────────────
    const CODE_FRAGMENTS = [
      "0x4F",
      "///",
      "0101",
      "GLITCH",
      "NULL",
      "BUG_FIX",
      "0xEF",
      "ERR_404",
      "STACK",
      "SYNC",
    ];
    const dataStreams = Array.from({ length: 14 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vy: (Math.random() * 0.4 + 0.2) * (Math.random() > 0.5 ? 1 : -1),
      text: CODE_FRAGMENTS[Math.floor(Math.random() * CODE_FRAGMENTS.length)],
      alpha: Math.random() * 0.3 + 0.1,
      color: Math.random() > 0.5 ? "#00F0FF" : "#FF00C8",
      size: Math.floor(Math.random() * 3) + 9, // 9px - 11px
    }));

    // ── 3. Glitch Wave Controller ─────────────────────────────────────────
    let time = 0;
    let glitchActive = false;
    let glitchTimer = 0;
    let glitchSliceY = 0;
    let glitchSliceHeight = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Trigger periodic organic glitch slice (every 3-5 seconds)
      glitchTimer++;
      if (glitchTimer > 180 && Math.random() < 0.04) {
        glitchActive = true;
        glitchSliceY = Math.random() * height;
        glitchSliceHeight = Math.random() * 40 + 10;
        glitchTimer = 0;
      }
      if (glitchActive && Math.random() < 0.25) {
        glitchActive = false;
      }

      // ── Draw Data Streams ────────────────────────────────────────────────
      ctx.font = "10px monospace";
      dataStreams.forEach((stream) => {
        stream.y += stream.vy;
        if (stream.y < -20) stream.y = height + 20;
        if (stream.y > height + 20) stream.y = -20;

        ctx.fillStyle = stream.color;
        ctx.globalAlpha = stream.alpha * (0.6 + Math.sin(time + stream.x) * 0.4);
        ctx.fillText(stream.text, stream.x, stream.y);
      });
      ctx.globalAlpha = 1;

      // ── Update & Draw Particles & Connecting Lines ───────────────────────
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Bounce screen edges
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Mouse repulsion
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const force = (120 - dist) / 120;
            p.x -= (dx / dist) * force * 1.5;
            p.y -= (dy / dist) * force * 1.5;
          }
        }

        p.pulsePhase += p.pulseSpeed;
        const currentAlpha =
          p.baseAlpha + Math.sin(p.pulsePhase) * 0.2;

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0.05, Math.min(1, currentAlpha));
        ctx.fill();

        // Connect nearby nodes
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p2.x - p.x;
          const dy = p2.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const lineAlpha = (1 - dist / 130) * 0.25;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = lineAlpha;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;

      // ── Apply Glitch Slice Displacement ──────────────────────────────────
      if (glitchActive) {
        try {
          const sliceH = Math.min(glitchSliceHeight, height - glitchSliceY);
          if (sliceH > 2) {
            const imgData = ctx.getImageData(
              0,
              Math.floor(glitchSliceY),
              width,
              Math.floor(sliceH)
            );
            const offsetX = (Math.random() - 0.5) * 16;
            ctx.putImageData(
              imgData,
              offsetX,
              Math.floor(glitchSliceY)
            );

            // Glitch accent scanline overlay
            ctx.fillStyle = Math.random() > 0.5 ? "rgba(0, 240, 255, 0.15)" : "rgba(255, 0, 200, 0.15)";
            ctx.fillRect(0, glitchSliceY, width, sliceH);
          }
        } catch {
          // Fallback if image data cross-origin boundary
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`${isAbsolute ? "absolute" : "fixed"} inset-0 w-full h-full pointer-events-none z-0 opacity-60`}
    />
  );
};

export default GlitchBackground;
