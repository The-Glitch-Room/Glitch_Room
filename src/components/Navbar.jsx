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
  { to: "/pro-rooms", label: "Pro Rooms" },
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
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center p-1.5 transition-transform group-hover:scale-105 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <img
              src="/logo_GR.png"
              alt="Glitch Room"
              className="w-full h-full object-contain"
            />
          </div>
          <span
            className="text-xl md:text-2xl font-black text-white tracking-wider glitch-text group-hover:text-[#00F0FF] transition-colors"
            data-text="GLITCH ROOM"
          >
            GLITCH ROOM
          </span>
        </NavLink>

        {/* Desktop Navigation */}
        <ul className="md:flex items-center gap-x-1 hidden bg-white/[0.03] backdrop-blur-md border border-white/10 p-1.5 rounded-2xl">
          {NAV_LINKS.map((link) => {
            const isActive =
              location.pathname === link.to ||
              (link.to !== "/" && location.pathname.startsWith(link.to));

            return (
              <li key={link.to} className="relative">
                <NavLink
                  to={link.to}
                  className={`relative px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold tracking-wide transition-all block cursor-pointer ${
                    isActive
                      ? "text-[#00F0FF]"
                      : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavTab"
                      className="absolute inset-0 bg-[#00F0FF]/10 rounded-xl border border-[#00F0FF]/30"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* User profile / login button */}
        <div className="flex items-center gap-4">
          <NavbarUserSection />

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            aria-label="Toggle menu"
            className="md:hidden text-gray-300 hover:text-white p-2 rounded-xl bg-white/5 border border-white/10 transition cursor-pointer"
          >
            {showMenu ? <TbX size={22} /> : <TbMenu2 size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile navigation drawer */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-[#070709]/95 backdrop-blur-2xl border-b border-white/10 px-6 py-6 shadow-2xl space-y-3"
          >
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setShowMenu(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-xl text-base font-bold transition ${
                    isActive
                      ? "bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
