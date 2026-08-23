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
    <footer className="relative bg-transparent text-gray-300 border-t border-white/10 overflow-hidden font-sans">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-14 pb-12 border-b border-white/10">
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

              <p className="text-sm sm:text-base text-gray-300 max-w-md leading-relaxed mb-6 font-normal">
                Where chaos sparks creativity. Solve glitches, compete in 3-stage arenas, collect gBits, and climb the Terminal Wall.
              </p>

              {/* Newsletter Subscriber Box */}
              <form onSubmit={handleSubscribe} className="mt-8 mb-8 max-w-md">
                <p className="text-sm font-bold text-white mb-2.5">
                  Stay in the loop
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your dev email..."
                    required
                    className="flex-1 bg-[#0d0d14] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-[#00F0FF]/60 transition-colors font-medium"
                  />
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#00F0FF] text-black font-extrabold text-sm flex items-center justify-center cursor-pointer hover:bg-[#38bdf8] transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] shrink-0"
                  >
                    Subscribe
                  </motion.button>
                </div>
                {subscribed && (
                  <p className="text-xs text-[#22c55e] mt-2 font-semibold">
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
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/15 bg-[#0d0d14] text-gray-300 hover:text-[#00F0FF] hover:border-[#00F0FF]/50 hover:bg-[#00F0FF]/10 transition-all shadow-md"
                >
                  {icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Columns (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Column 1: EXPLORE */}
            <div>
              <h4 className="text-sm font-extrabold text-[#00F0FF] uppercase tracking-wider mb-4">
                EXPLORE
              </h4>
              <ul className="space-y-3 text-sm font-medium">
                {[
                  { label: "All Challenges", path: "/explore" },
                  { label: "Game Arena", path: "/game-arena" },
                  { label: "Creator Rooms", path: "/creator-rooms" },
                  { label: "Pro Rooms", path: "/pro-rooms" },
                ].map((link, i) => (
                  <li key={i}>
                    <Link
                      to={link.path}
                      className="hover:text-white hover:translate-x-1 transition-all inline-block text-gray-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: COMMUNITY & PROGRESSION */}
            <div>
              <h4 className="text-sm font-extrabold text-[#FF00C8] uppercase tracking-wider mb-4">
                COMMUNITY &amp; PROGRESSION
              </h4>
              <ul className="space-y-3 text-sm font-medium">
                {[
                  { label: "Community", path: "/community" },
                  { label: "Terminal Wall", path: "/terminal-wall" },
                  { label: "Earn Rules Hub", path: "/earn-rules" },
                ].map((link, i) => (
                  <li key={i}>
                    <Link
                      to={link.path}
                      className="hover:text-white hover:translate-x-1 transition-all inline-block text-gray-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: SUPPORT & INFO */}
            <div>
              <h4 className="text-sm font-extrabold text-[#22c55e] uppercase tracking-wider mb-4">
                SUPPORT &amp; INFO
              </h4>
              <ul className="space-y-3 text-sm font-medium">
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
                      className="hover:text-white hover:translate-x-1 transition-all inline-block text-gray-300"
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-gray-400 font-medium">
          <p>© {new Date().getFullYear()} <span className="text-white font-bold">Glitch Room</span>. All rights reserved.</p>

          <p className="text-center sm:text-right text-gray-400">
            Built with chaos &amp; creativity ⚡
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
