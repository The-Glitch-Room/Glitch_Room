import React, { useState } from "react";
import { FaDiscord, FaInstagram, FaLinkedin } from "react-icons/fa";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, Zap } from "lucide-react";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const socialLinks = [
    {
      icon: <FaDiscord size={18} />,
      label: "Discord",
      url: "https://discord.gg/ECNSapzej",
    },
    {
      icon: <FaInstagram size={18} />,
      label: "Instagram",
      url: "https://www.instagram.com/glitchroom_official/",
    },
    {
      icon: <FaLinkedin size={18} />,
      label: "LinkedIn",
      url: "https://www.linkedin.com/company/glitch-room/",
    },
  ];

  return (
    <footer className="relative bg-transparent text-gray-400 border-t border-white/10 overflow-hidden">
      {/* Background Cyber Grid */}
      <div
        className="absolute inset-0 z-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0,240,255,0.2) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,240,255,0.2) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow Orbs */}
      <div
        className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: "#FF00C8" }}
      />
      <div
        className="absolute top-0 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: "#00F0FF" }}
      />

      {/* Top Glowing Gradient Line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] z-10"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(0,240,255,0.6), rgba(255,0,200,0.6), transparent)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-12">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-14 pb-12 border-b border-white/5">
          {/* Brand Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <Link to="/" className="flex items-center gap-3 group mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                  <img
                    src="/logo_GR.png"
                    alt="Glitch Room"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span
                  className="text-2xl font-black text-white tracking-wider glitch-text group-hover:text-[#00F0FF] transition-colors"
                  data-text="GLITCH ROOM"
                >
                  GLITCH ROOM
                </span>
              </Link>

              <p className="text-xs sm:text-sm text-gray-400 max-w-md leading-relaxed mb-6">
                Where chaos sparks creativity. Solve glitches, compete in 3-stage arenas, collect gBits, and climb the Terminal Wall.
              </p>

              {/* Newsletter Subscriber Box with extra space above */}
              <form onSubmit={handleSubscribe} className="mt-8 mb-8 max-w-md">
                <p className="text-xs font-bold text-gray-300 mb-2.5 flex items-center gap-1.5">
                  <Zap size={14} className="text-[#00F0FF]" /> Stay in the loop
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your dev email..."
                    required
                    className="flex-1 bg-[#0d0d14] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-[#00F0FF]/50 transition-colors"
                  />
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#00F0FF] text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-[#38bdf8] transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] shrink-0"
                  >
                    Subscribe <Send size={12} />
                  </motion.button>
                </div>
                {subscribed && (
                  <p className="text-[11px] text-[#22c55e] mt-2 font-semibold">
                    ✓ Subscribed! Welcome to the Glitch Room network.
                  </p>
                )}
              </form>
            </div>

            {/* Social Links (Discord, Instagram, LinkedIn) */}
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon, label, url }, i) => (
                <motion.a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/10 bg-[#0d0d14] text-gray-400 hover:text-[#00F0FF] hover:border-[#00F0FF]/40 hover:bg-[#00F0FF]/10 transition-all shadow-md"
                >
                  {icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Columns (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {/* Column 1: Explore & Play */}
            <div>
              <h4 className="text-xs font-bold text-[#00F0FF] uppercase tracking-wider mb-4 flex items-center gap-1">
                Explore & Play
              </h4>
              <ul className="space-y-2.5 text-xs">
                {[
                  { label: "Explore Glitches", path: "/explore" },
                  { label: "Game Arena", path: "/game-arena" },
                  { label: "Creator Rooms", path: "/creator-rooms" },
                  { label: "Community Feed", path: "/community" },
                  { label: "Terminal Wall", path: "/terminal-wall" },
                ].map((link, i) => (
                  <li key={i}>
                    <Link
                      to={link.path}
                      className="hover:text-white hover:translate-x-1 transition-all inline-block text-gray-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Rewards & Earn */}
            <div>
              <h4 className="text-xs font-bold text-[#FF00C8] uppercase tracking-wider mb-4">
                Rewards & Earn
              </h4>
              <ul className="space-y-2.5 text-xs">
                {[
                  { label: "Earn Rules Hub", path: "/earn-rules" },
                  { label: "Speed Demon (+50)", path: "/earn-rules" },
                  { label: "Referral Program (+100)", path: "/earn-rules" },
                  { label: "7-Day Uptime Streak", path: "/earn-rules" },
                  { label: "Daily Fact Reward", path: "/earn-rules" },
                ].map((link, i) => (
                  <li key={i}>
                    <Link
                      to={link.path}
                      className="hover:text-white hover:translate-x-1 transition-all inline-block text-gray-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Platform & Support */}
            <div>
              <h4 className="text-xs font-bold text-[#22c55e] uppercase tracking-wider mb-4">
                Support & Info
              </h4>
              <ul className="space-y-2.5 text-xs">
                {[
                  { label: "About Us", path: "/about" },
                  { label: "Help Center", path: "/help" },
                  { label: "Settings", path: "/settings" },
                  { label: "User Console", path: "/console" },
                  { label: "System Status", path: "/help" },
                ].map((link, i) => (
                  <li key={i}>
                    <Link
                      to={link.path}
                      className="hover:text-white hover:translate-x-1 transition-all inline-block text-gray-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} <span className="text-gray-300 font-semibold">Glitch Room</span>. All rights reserved.</p>

          <p className="text-center sm:text-right text-gray-500">
            Built with chaos &amp; creativity ⚡
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
