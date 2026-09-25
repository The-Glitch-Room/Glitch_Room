import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Sparkles,
  X,
  Copy,
  Printer,
  Download,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";

/**
 * High-resolution 1200x800 HTML5 Canvas certificate renderer.
 * Used for exporting crisp PNG files and print-ready document images.
 */
export const renderCertificateToCanvas = (cert, canvas) => {
  if (!canvas || !cert) return;
  const ctx = canvas.getContext("2d");
  const width = 1200;
  const height = 800;
  canvas.width = width;
  canvas.height = height;

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#060610");
  bgGrad.addColorStop(0.5, "#0b0c1e");
  bgGrad.addColorStop(1, "#070714");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  const isWinner =
    cert.type === "winner" ||
    cert.type === "runner_up" ||
    cert.type === "top_3" ||
    (cert.type && cert.type.startsWith("winner")) ||
    (cert.rank && cert.rank <= 3);

  const rankNum =
    cert.rank ||
    (cert.type === "winner" ? 1 : cert.type === "runner_up" ? 2 : cert.type === "top_3" ? 3 : 1);

  const primaryColor =
    rankNum === 1
      ? "#FFD700"
      : rankNum === 2
      ? "#E2E8F0"
      : rankNum === 3
      ? "#D97706"
      : "#00F0FF";

  const rankTitle =
    rankNum === 1
      ? "1st Place Champion"
      : rankNum === 2
      ? "2nd Place Runner-Up"
      : rankNum === 3
      ? "3rd Place Podium"
      : cert.type === "participation"
      ? "Verified Finisher"
      : `Rank #${rankNum}`;

  // Cyber Grid effect
  ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Outer Glow Border
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  // Inner Delicate Border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(46, 46, width - 92, height - 92);

  // Corner Ornaments
  const cornerSize = 40;
  ctx.fillStyle = primaryColor;
  ctx.fillRect(32, 32, cornerSize, 6);
  ctx.fillRect(32, 32, 6, cornerSize);
  ctx.fillRect(width - 32 - cornerSize, 32, cornerSize, 6);
  ctx.fillRect(width - 38, 32, 6, cornerSize);
  ctx.fillRect(32, height - 38, cornerSize, 6);
  ctx.fillRect(32, height - 32 - cornerSize, 6, cornerSize);
  ctx.fillRect(width - 32 - cornerSize, height - 38, cornerSize, 6);
  ctx.fillRect(width - 38, height - 32 - cornerSize, 6, cornerSize);

  // Header Subtitle
  ctx.fillStyle = primaryColor;
  ctx.font = "bold 13px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.letterSpacing = "3px";
  ctx.fillText("GLITCH ROOM ARENA • OFFICIAL VERIFIED CREDENTIAL", width / 2, 95);

  // Certificate Main Heading
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 38px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText(
    isWinner ? "CERTIFICATE OF EXCELLENCE" : "CERTIFICATE OF ACHIEVEMENT",
    width / 2,
    155,
  );

  // Conferred statement
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.font = "italic 16px Georgia, serif";
  ctx.fillText("This digital credential is proudly conferred upon", width / 2, 195);

  // Recipient Name
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 44px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText((cert.recipient_name || "Candidate").toUpperCase(), width / 2, 255);

  // Underline beneath candidate name
  const nameGrad = ctx.createLinearGradient(width / 2 - 180, 0, width / 2 + 180, 0);
  nameGrad.addColorStop(0, "transparent");
  nameGrad.addColorStop(0.5, primaryColor);
  nameGrad.addColorStop(1, "transparent");
  ctx.fillStyle = nameGrad;
  ctx.fillRect(width / 2 - 180, 275, 360, 3);

  // Reason
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.font = "15px sans-serif";
  ctx.fillText(
    "for demonstrating high technical proficiency and competitive placement in",
    width / 2,
    315,
  );

  ctx.fillStyle = primaryColor;
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(cert.event_name || "Pro Arena Assessment", width / 2, 352);

  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.font = "13px sans-serif";
  ctx.fillText(
    `Organized by ${cert.organization_name || "Glitch Room Arena"}`,
    width / 2,
    380,
  );

  // Performance Metric Boxes
  const boxY = 420;
  const boxW = 210;
  const boxH = 85;
  const startX = (width - (3 * boxW + 2 * 25)) / 2;

  const pct =
    cert.percentage !== undefined && cert.percentage !== null && cert.percentage > 0
      ? cert.percentage
      : 100;

  const metrics = [
    { label: "OFFICIAL STANDING", value: rankTitle },
    { label: "TOTAL SCORE", value: `${cert.score ?? 0} Pts` },
    { label: "MASTERY LEVEL", value: `${pct}%` },
  ];

  metrics.forEach((m, i) => {
    const x = startX + i * (boxW + 25);
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fillRect(x, boxY, boxW, boxH);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, boxY, boxW, boxH);

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "10px 'Courier New', monospace";
    ctx.fillText(m.label, x + boxW / 2, boxY + 28);

    ctx.fillStyle = i === 2 ? primaryColor : "#FFFFFF";
    ctx.font = "bold 21px sans-serif";
    ctx.fillText(m.value, x + boxW / 2, boxY + 62);
  });

  // Holographic Circular Verification Seal on Left
  const sealX = 140;
  const sealY = 635;
  ctx.beginPath();
  ctx.arc(sealX, sealY, 45, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 215, 0, 0.08)";
  ctx.fill();
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(sealX, sealY, 38, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = primaryColor;
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🏆", sealX, sealY + 8);

  // Verification details
  ctx.textAlign = "left";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 13px 'Courier New', monospace";
  ctx.fillText("VERIFIED ON-CHAIN CREDENTIAL", sealX + 60, sealY - 12);
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "11px 'Courier New', monospace";
  ctx.fillText(`ID: ${cert.certificate_number || "GR-PRO-VERIFIED"}`, sealX + 60, sealY + 6);
  ctx.fillText(
    `ISSUED: ${new Date(cert.issued_at || Date.now()).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} • STATUS: TAMPER-PROOF`,
    sealX + 60,
    sealY + 24,
  );

  // Signatures on Right
  const sigX = width - 260;
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "italic bold 17px Georgia, serif";
  ctx.fillText(cert.organization_name || "Event Authority", sigX, sealY - 4);
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.fillRect(sigX - 60, sealY + 4, 120, 1);
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "10px 'Courier New', monospace";
  ctx.fillText("ORGANIZER SIGNATURE", sigX, sealY + 18);

  const sig2X = width - 120;
  ctx.fillStyle = primaryColor;
  ctx.font = "italic bold 17px Georgia, serif";
  ctx.fillText("GlitchProtocol", sig2X, sealY - 4);
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.fillRect(sig2X - 50, sealY + 4, 100, 1);
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "10px 'Courier New', monospace";
  ctx.fillText("CORE ARENA", sig2X, sealY + 18);
};

/**
 * Official Glitch Room Digital Certificate DOM component.
 * Proportionally optimized for responsive screens, modal previews, and fullscreen display.
 */
export const GlitchCertificateDOM = ({ cert, room: roomProp, compact = false }) => {
  if (!cert) return null;

  const isWinner =
    cert.type === "winner" ||
    cert.type === "runner_up" ||
    cert.type === "top_3" ||
    (cert.type && cert.type.startsWith("winner")) ||
    (cert.rank && cert.rank <= 3);

  const rankNum =
    cert.rank ||
    (cert.type === "winner" ? 1 : cert.type === "runner_up" ? 2 : cert.type === "top_3" ? 3 : 1);

  const rankLabel =
    rankNum === 1
      ? "1st Place Champion"
      : rankNum === 2
      ? "2nd Place Runner-Up"
      : rankNum === 3
      ? "3rd Place Podium"
      : cert.type === "participation"
      ? "Verified Finisher"
      : `Rank #${rankNum}`;

  const accentColor =
    rankNum === 1
      ? "#FFD700"
      : rankNum === 2
      ? "#E2E8F0"
      : rankNum === 3
      ? "#D97706"
      : "#00F0FF";

  const accentBorder =
    rankNum === 1
      ? "border-yellow-400"
      : rankNum === 2
      ? "border-slate-300"
      : rankNum === 3
      ? "border-amber-600"
      : "border-[#00F0FF]";

  const accentGlow =
    rankNum === 1
      ? "shadow-yellow-500/20"
      : rankNum === 2
      ? "shadow-slate-300/20"
      : rankNum === 3
      ? "shadow-amber-500/20"
      : "shadow-[#00F0FF]/20";

  const totalMax = Number(roomProp?.total_possible_score) || 100;
  const pct =
    cert.percentage !== undefined && cert.percentage !== null && cert.percentage > 0
      ? cert.percentage
      : totalMax > 0
      ? Math.round(((cert.score || 0) / totalMax) * 100)
      : 100;

  return (
    <div
      className={`relative w-full max-w-3xl mx-auto rounded-3xl ${
        compact ? "p-4 sm:p-6" : "p-5 sm:p-8"
      } bg-gradient-to-b from-[#080814] via-[#0c0c20] to-[#060610] border-2 ${accentBorder} shadow-2xl ${accentGlow} overflow-hidden font-sans select-none text-white`}
    >
      {/* Subtle Cyber Grid Background */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Corner Cyber Brackets */}
      <div
        className="absolute top-3 left-3 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-l-2 pointer-events-none"
        style={{ borderColor: accentColor }}
      />
      <div
        className="absolute top-3 right-3 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-r-2 pointer-events-none"
        style={{ borderColor: accentColor }}
      />
      <div
        className="absolute bottom-3 left-3 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-l-2 pointer-events-none"
        style={{ borderColor: accentColor }}
      />
      <div
        className="absolute bottom-3 right-3 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-r-2 pointer-events-none"
        style={{ borderColor: accentColor }}
      />

      {/* Header Badge */}
      <div className="text-center relative z-10 space-y-1.5">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] sm:text-[11px] font-mono tracking-widest uppercase font-bold"
          style={{ color: accentColor }}
        >
          <Sparkles size={11} />
          <span>GLITCH ROOM ARENA • OFFICIAL VERIFIED CREDENTIAL</span>
        </div>
        <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
          {isWinner ? "Certificate of Excellence" : "Certificate of Achievement"}
        </h2>
        <p className="text-[11px] sm:text-xs text-gray-400 italic">
          This digital credential is proudly conferred upon
        </p>
      </div>

      {/* Candidate Name */}
      <div className="text-center my-3 sm:my-5 relative z-10">
        <div className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-wide uppercase drop-shadow-lg">
          {cert.recipient_name || "Candidate"}
        </div>
        <div
          className="w-36 sm:w-60 h-0.5 sm:h-1 mx-auto mt-2 rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
        />
      </div>

      {/* Achievement Context */}
      <div className="text-center max-w-xl mx-auto space-y-0.5 relative z-10 text-[11px] sm:text-xs text-gray-300">
        <p>for demonstrating verified technical proficiency and competitive placement in</p>
        <div
          className="text-sm sm:text-lg font-bold font-mono tracking-wide py-0.5"
          style={{ color: accentColor }}
        >
          {cert.event_name || roomProp?.name || roomProp?.title || "Glitch Room Assessment"}
        </div>
        <p className="text-gray-400 text-[10px] sm:text-[11px]">
          Organized by{" "}
          <strong className="text-gray-200">
            {cert.organization_name || roomProp?.org_name || roomProp?.organizer_name || "Glitch Room Arena"}
          </strong>
        </p>
      </div>

      {/* 3 Metric Performance Badges */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3.5 my-4 sm:my-6 relative z-10">
        <div className="p-2.5 sm:p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
          <div className="text-[8px] sm:text-[10px] font-mono text-gray-400 uppercase tracking-wider">
            Standing
          </div>
          <div className="text-xs sm:text-sm font-black text-white mt-1 flex items-center justify-center gap-1">
            <span>{isWinner ? (rankNum === 1 ? "🥇" : rankNum === 2 ? "🥈" : "🥉") : "🎖️"}</span>
            <span className="truncate">{rankLabel}</span>
          </div>
        </div>
        <div className="p-2.5 sm:p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
          <div className="text-[8px] sm:text-[10px] font-mono text-gray-400 uppercase tracking-wider">
            Final Score
          </div>
          <div className="text-xs sm:text-sm font-black text-white mt-1 font-mono">
            {cert.score ?? 0} Pts
          </div>
        </div>
        <div className="p-2.5 sm:p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
          <div className="text-[8px] sm:text-[10px] font-mono text-gray-400 uppercase tracking-wider">
            Mastery
          </div>
          <div
            className="text-xs sm:text-sm font-black font-mono mt-1"
            style={{ color: accentColor }}
          >
            {pct}%
          </div>
        </div>
      </div>

      {/* Footer: Seal, Verification ID & Signatures */}
      <div className="pt-3 sm:pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 relative z-10 text-[10px] sm:text-[11px]">
        {/* Holographic Verification Seal */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-lg shrink-0 shadow-lg border-2"
            style={{
              backgroundColor: `${accentColor}15`,
              borderColor: accentColor,
              color: accentColor,
            }}
          >
            🏆
          </div>
          <div>
            <div className="font-mono font-bold text-white tracking-wide text-[10px] sm:text-xs">
              VERIFIED CREDENTIAL
            </div>
            <div className="font-mono text-gray-400 text-[9px] sm:text-[10px]">
              ID: <span className="text-cyan-400 font-bold">{cert.certificate_number}</span>
            </div>
            <div className="text-[8px] sm:text-[9px] text-gray-500 font-mono">
              Issued:{" "}
              {new Date(cert.issued_at || Date.now()).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Dual Signatures */}
        <div className="flex items-center gap-6 sm:gap-8 text-right sm:text-left">
          <div className="text-center">
            <div className="font-serif italic text-sm sm:text-base text-gray-300 font-bold -mb-1 select-none font-signature">
              {cert.organization_name || roomProp?.organizer_name || "Event Authority"}
            </div>
            <div className="w-20 sm:w-24 h-px bg-white/20 mx-auto my-1" />
            <div className="text-[8px] sm:text-[9px] text-gray-400 font-mono uppercase">
              Event Organizer
            </div>
          </div>
          <div className="text-center">
            <div className="font-serif italic text-sm sm:text-base text-cyan-400 font-bold -mb-1 select-none font-signature">
              GlitchProtocol
            </div>
            <div className="w-20 sm:w-24 h-px bg-white/20 mx-auto my-1" />
            <div className="text-[8px] sm:text-[9px] text-gray-400 font-mono uppercase">
              Arena Authority
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Universal In-App Fullscreen Certificate Modal.
 * Centered with generous breathing space, proper top/bottom padding, and smooth export controls.
 */
export const GlitchCertificateModal = ({
  isOpen,
  onClose,
  certificate,
  room,
  showToast = () => {},
}) => {
  const certCanvasRef = useRef(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !certificate) return null;

  const handleDownload = () => {
    let canvas = certCanvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
    }
    renderCertificateToCanvas(certificate, canvas);
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    const safeName = (certificate.recipient_name || "candidate").replace(/[^a-zA-Z0-9]/g, "_");
    link.download = `Certificate_${safeName}_${certificate.certificate_number || "verified"}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("✓ Certificate PNG downloaded!");
  };

  const handlePrint = () => {
    let canvas = certCanvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
    }
    renderCertificateToCanvas(certificate, canvas);
    const dataUrl = canvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Certificate - ${certificate?.recipient_name || "Certificate"}</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #000; }
              img { max-width: 100%; height: auto; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
              @media print {
                body { background: #fff; }
                img { width: 100%; height: auto; }
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(certificate.certificate_number || "");
    setCopied(true);
    showToast("📋 Credential ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 md:p-8 pt-16 sm:pt-14 pb-10 bg-black/85 backdrop-blur-md overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl bg-[#0c0c16] border border-[#00F0FF]/40 rounded-3xl shadow-2xl shadow-[#00F0FF]/15 overflow-hidden flex flex-col my-auto max-h-[92vh]"
        >
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#121222]/90 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF] shrink-0">
                <Award size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 truncate">
                  Verified Cyber Credential & Certificate
                </h3>
                <p className="text-[11px] text-gray-400 font-mono truncate">
                  ID: <span className="text-cyan-300 font-bold">{certificate.certificate_number}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer shrink-0"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Certificate Preview Body */}
          <div className="p-4 sm:p-6 flex flex-col items-center overflow-y-auto max-h-[75vh]">
            <GlitchCertificateDOM cert={certificate} room={room} />

            {/* Hidden canvas for high-resolution PNG generation & printing */}
            <canvas ref={certCanvasRef} className="hidden" width={1200} height={800} />
          </div>

          {/* Modal Footer Controls */}
          <div className="p-4 sm:p-5 border-t border-white/10 bg-[#121222]/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <button
              onClick={handleCopyId}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
            >
              {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? "Copied!" : "Copy ID"}</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
              >
                <Printer size={14} />
                <span>Print / PDF</span>
              </button>
              <button
                onClick={handleDownload}
                className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-[#00F0FF] to-purple-600 hover:opacity-90 text-white text-xs font-bold shadow-lg shadow-[#00F0FF]/20 flex items-center gap-2 cursor-pointer transition"
              >
                <Download size={14} />
                <span>Download PNG</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GlitchCertificateModal;
