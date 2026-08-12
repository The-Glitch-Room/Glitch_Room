import React, { useState, useEffect, useRef } from "react";
import { TbMenu2, TbX } from "react-icons/tb";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import NavbarUserSection from "./NavbarUserSection";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/explore", label: "Explore" },
  { to: "/game-arena", label: "Game Arena" },
  { to: "/creator-rooms", label: "Creator Rooms" },
  { to: "/community", label: "Community" },
];

const Navbar = () => {
  const { user, openAuth } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const menuRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => {
    setShowMenu(false);
  }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setShowMenu(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#070709]/90 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
          : "bg-transparent border-b border-white/5"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex justify-between items-center">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center p-1.5 transition-transform group-hover:scale-105 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <img
              src="/logo_GR.png"
              alt="Glitch Room"
              className="w-full h-full object-contain"
            />
          </div>
          <span
            className="text-lg md:text-xl font-black tracking-wider text-white group-hover:text-[#00F0FF] transition-colors glitch-text"
            data-text="GLITCH ROOM"
          >
            GLITCH ROOM
          </span>
        </NavLink>

        {/* Desktop Navigation */}
        <ul className="md:flex items-center gap-x-1.5 hidden bg-white/[0.03] backdrop-blur-md border border-white/10 p-1.5 rounded-2xl">
          {NAV_LINKS.map((link) => {
            const isActive =
              location.pathname === link.to ||
              (link.to !== "/" && location.pathname.startsWith(link.to));

            return (
              <li key={link.to} className="relative">
                <NavLink
                  to={link.to}
                  className={`relative px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all block cursor-pointer ${
                    isActive
                      ? "text-[#00F0FF]"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavTab"
                      className="absolute inset-0 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-xl shadow-[0_0_12px_rgba(0,240,255,0.2)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Right Section: Auth buttons (Single Cyan Color + Rounded Square Shape) */}
        <div className="flex items-center gap-x-3" ref={menuRef}>
          {user ? (
            <NavbarUserSection user={user} />
          ) : (
            <div className="flex items-center gap-2">
              {/* Log In Button — Rounded Square */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={openAuth}
                className="px-4 py-2 rounded-xl border border-[#00F0FF]/40 text-[#00F0FF] hover:bg-[#00F0FF]/10 text-xs font-bold tracking-wider cursor-pointer transition-all"
              >
                Log In
              </motion.button>

              {/* Sign Up Button — Single Cyan Color, Rounded Square */}
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 20px rgba(0,240,255,0.4)" }}
                whileTap={{ scale: 0.96 }}
                onClick={openAuth}
                className="px-4 py-2 rounded-xl bg-[#00F0FF] text-black hover:bg-[#38bdf8] font-black text-xs tracking-wider cursor-pointer shadow-md transition-all flex items-center gap-1.5"
              >
                Sign Up <ArrowRight size={13} />
              </motion.button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="text-gray-300 hover:text-white text-xl md:hidden cursor-pointer p-2 rounded-xl bg-white/5 border border-white/10"
            onClick={() => setShowMenu((v) => !v)}
            aria-label="Toggle menu"
          >
            {showMenu ? <TbX /> : <TbMenu2 />}
          </button>

          {/* Mobile Menu Dropdown */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute top-full right-4 mt-3 w-64 md:hidden rounded-2xl overflow-hidden shadow-2xl z-50"
                style={{
                  background: "#0d0d14",
                  border: "1px solid rgba(0,240,255,0.2)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
                }}
              >
                {/* Top glow line */}
                <div
                  className="h-[2px] w-full"
                  style={{
                    background:
                      "linear-gradient(90deg,transparent,#00F0FF,transparent)",
                  }}
                />

                <div className="p-3 space-y-1">
                  {NAV_LINKS.map((link) => {
                    const isActive =
                      location.pathname === link.to ||
                      (link.to !== "/" &&
                        location.pathname.startsWith(link.to));
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? "bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF]"
                            : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        {link.label}
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
                        )}
                      </Link>
                    );
                  })}

                  {!user && (
                    <div className="pt-3 border-t border-white/5 space-y-2">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          openAuth();
                        }}
                        className="w-full py-2.5 rounded-xl text-xs font-bold text-black bg-[#00F0FF] cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                      >
                        Sign Up Free
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
