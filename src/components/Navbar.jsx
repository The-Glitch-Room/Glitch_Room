import LevelUpModal from "./LevelUpModal";
import { getLevelTitle } from "../utils/pointsHelper";
import React, { useState, useEffect, useRef } from "react";
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
  const [levelUpData, setLevelUpData] = useState(null);

  useEffect(() => {
    const handleLevelUp = (e) => {
      const { level, xp } = e.detail || {};
      setLevelUpData({
        level: level || 1,
        title: getLevelTitle(level || 1),
        xp: xp || 250,
      });
    };
    window.addEventListener("level_up", handleLevelUp);
    return () => window.removeEventListener("level_up", handleLevelUp);
  }, []);
  const { user, openAuth } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
      className={`fixed top-0 right-0 left-0 z-[60] transition-all duration-300 ${
        isScrolled
          ? "bg-[#070709]/90 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
          : "bg-transparent border-b border-white/5"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-2.5 sm:px-6 md:px-10 h-16 sm:h-20 flex justify-between items-center gap-1.5 sm:gap-4">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center p-2 transition-transform group-hover:scale-105 shadow-[0_0_14px_rgba(0,240,255,0.25)] shrink-0">
            <img
              src="/logo_GR.png"
              alt="Glitch Room"
              className="w-full h-full object-contain"
            />
          </div>
          <span
            className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-wider glitch-text group-hover:text-[#00F0FF] transition-colors whitespace-nowrap shrink-0"
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
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {user ? (
            <NavbarUserSection user={user} />
          ) : (
            <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
              <button
                type="button"
                onClick={openAuth}
                className="px-2.5 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs md:text-sm font-extrabold text-gray-200 hover:text-white hover:bg-white/10 border border-white/20 transition cursor-pointer whitespace-nowrap"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={openAuth}
                className="px-3 py-1.5 sm:px-4.5 sm:py-2 md:px-6 md:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs md:text-sm font-extrabold bg-[#FF00C8] hover:bg-[#d600a8] text-white transition shadow-lg shadow-[#FF00C8]/30 cursor-pointer whitespace-nowrap"
              >
                Sign Up
              </button>
            </div>
          )}

        </div>
      </nav>
    </header>
      <LevelUpModal
        isOpen={!!levelUpData}
        onClose={() => setLevelUpData(null)}
        level={levelUpData?.level}
        title={levelUpData?.title}
        totalXp={levelUpData?.xp}
      />
    </>
  );
};

export default Navbar;
