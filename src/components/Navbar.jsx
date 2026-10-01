import { GBitIcon } from "./GBitIcon";
import LevelUpModal from "./LevelUpModal";
import { getLevelTitle } from "../utils/pointsHelper";
import React, { useState, useEffect, useRef } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import NavbarUserSection from "./NavbarUserSection";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X, Users, ShieldCheck, BookOpen } from "lucide-react";

const ROOM_OPTIONS = [
  { to: "/creator-rooms", label: "Creator Rooms", icon: Users },
  { to: "/pro-rooms", label: "Pro Rooms", icon: ShieldCheck },
];

const Navbar = () => {
  const [levelUpData, setLevelUpData] = useState(null);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileRoomsOpen, setMobileRoomsOpen] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  const roomsRef = useRef(null);
  const { user, openAuth } = useAuth();
  const location = useLocation();

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

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setRoomsOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Click outside listener for Rooms dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roomsRef.current && !roomsRef.current.contains(e.target)) {
        setRoomsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const isRoomsActive =
    location.pathname.startsWith("/creator-rooms") ||
    location.pathname.startsWith("/pro-rooms") ||
    location.pathname.startsWith("/room/");

  const isHomeActive = location.pathname === "/";
  const isExploreActive = location.pathname.startsWith("/explore");
  const isArenaActive = location.pathname.startsWith("/game-arena");
  const isHandbookActive = location.pathname.startsWith("/handbook");
  const isCommunityActive = location.pathname.startsWith("/community");

  return (
    <>
      <header
        className={`fixed top-0 right-0 left-0 z-[100] transition-all duration-300 ${
          isScrolled
            ? "bg-[#070709]/90 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
            : "bg-transparent border-b border-white/5"
        }`}
      >
        <nav className="max-w-7xl mx-auto px-2.5 sm:px-6 md:px-10 h-16 sm:h-20 flex justify-between items-center gap-1.5 sm:gap-4 relative">
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
            {/* Home */}
            <li className="relative">
              <NavLink
                to="/"
                className={`relative px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold tracking-wide transition-all block cursor-pointer ${
                  isHomeActive
                    ? "text-[#00F0FF]"
                    : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {isHomeActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-[#00F0FF]/10 rounded-xl border border-[#00F0FF]/30"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Home</span>
              </NavLink>
            </li>

            {/* Explore */}
            <li className="relative">
              <NavLink
                to="/explore"
                className={`relative px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold tracking-wide transition-all block cursor-pointer ${
                  isExploreActive
                    ? "text-[#00F0FF]"
                    : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {isExploreActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-[#00F0FF]/10 rounded-xl border border-[#00F0FF]/30"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Explore</span>
              </NavLink>
            </li>

            {/* Game Arena */}
            <li className="relative">
              <NavLink
                to="/game-arena"
                className={`relative px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold tracking-wide transition-all block cursor-pointer ${
                  isArenaActive
                    ? "text-[#00F0FF]"
                    : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {isArenaActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-[#00F0FF]/10 rounded-xl border border-[#00F0FF]/30"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Game Arena</span>
              </NavLink>
            </li>

            {/* Rooms Dropdown */}
            <li
              ref={roomsRef}
              className="relative"
              onMouseEnter={() => setRoomsOpen(true)}
              onMouseLeave={() => setRoomsOpen(false)}
            >
              <button
                type="button"
                onClick={() => setRoomsOpen((prev) => !prev)}
                className={`relative px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
                  isRoomsActive
                    ? "text-[#00F0FF]"
                    : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                }`}
                aria-expanded={roomsOpen}
              >
                {isRoomsActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-[#00F0FF]/10 rounded-xl border border-[#00F0FF]/30"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1">
                  Rooms
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                      roomsOpen ? "rotate-180" : ""
                    }`}
                  />
                </span>
              </button>

              <AnimatePresence>
                {roomsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-48 rounded-2xl bg-[#0e0e18]/95 backdrop-blur-xl border border-white/10 p-1.5 shadow-[0_15px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(0,240,255,0.08)] z-50 overflow-hidden"
                  >
                    {ROOM_OPTIONS.map((room) => {
                      const isCurrent =
                        location.pathname === room.to ||
                        (room.to !== "/" && location.pathname.startsWith(room.to));
                      const Icon = room.icon;
                      return (
                        <Link
                          key={room.to}
                          to={room.to}
                          onClick={() => setRoomsOpen(false)}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all group ${
                            isCurrent
                              ? "bg-[#00F0FF]/15 text-[#00F0FF]"
                              : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              size={15}
                              className={
                                isCurrent
                                  ? "text-[#00F0FF]"
                                  : "text-gray-400 group-hover:text-white transition"
                              }
                            />
                            <span>{room.label}</span>
                          </div>
                          {isCurrent && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
                          )}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </li>

            {/* Handbook */}
            <li className="relative">
              <NavLink
                to="/handbook"
                className={`relative px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold tracking-wide transition-all block cursor-pointer ${
                  isHandbookActive
                    ? "text-[#00F0FF]"
                    : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {isHandbookActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-[#00F0FF]/10 rounded-xl border border-[#00F0FF]/30"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <BookOpen size={14} className="shrink-0" />
                  <span>Handbook</span>
                </span>
              </NavLink>
            </li>

            {/* Community */}
            <li className="relative">
              <NavLink
                to="/community"
                className={`relative px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold tracking-wide transition-all block cursor-pointer ${
                  isCommunityActive
                    ? "text-[#00F0FF]"
                    : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {isCommunityActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-[#00F0FF]/10 rounded-xl border border-[#00F0FF]/30"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Community</span>
              </NavLink>
            </li>
          </ul>

          {/* Right Section: User profile / login button + Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <NavbarUserSection user={user} />
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
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

            {/* Mobile Menu Button (< md) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Menu (< md) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-[#070709]/95 backdrop-blur-2xl border-b border-white/10 px-4 py-4 shadow-2xl space-y-1.5"
            >
              <NavLink
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-sm font-semibold transition ${
                  isHomeActive
                    ? "bg-[#00F0FF]/15 text-[#00F0FF]"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                Home
              </NavLink>

              <NavLink
                to="/explore"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-sm font-semibold transition ${
                  isExploreActive
                    ? "bg-[#00F0FF]/15 text-[#00F0FF]"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                Explore
              </NavLink>

              <NavLink
                to="/game-arena"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-sm font-semibold transition ${
                  isArenaActive
                    ? "bg-[#00F0FF]/15 text-[#00F0FF]"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                Game Arena
              </NavLink>

              {/* Mobile Rooms Accordion */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2 space-y-1">
                <button
                  type="button"
                  onClick={() => setMobileRoomsOpen(!mobileRoomsOpen)}
                  className="w-full flex items-center justify-between px-2 py-1 text-xs font-mono font-bold uppercase tracking-wider text-gray-400"
                >
                  <span className="flex items-center gap-1.5">
                    <Users size={13} className="text-[#00F0FF]" />
                    <span>Rooms</span>
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                      mobileRoomsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {mobileRoomsOpen && (
                  <div className="space-y-1 pt-1">
                    <NavLink
                      to="/creator-rooms"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                        location.pathname.startsWith("/creator-rooms")
                          ? "bg-[#00F0FF]/15 text-[#00F0FF]"
                          : "text-gray-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Users size={14} />
                      <span>Creator Rooms</span>
                    </NavLink>
                    <NavLink
                      to="/pro-rooms"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                        location.pathname.startsWith("/pro-rooms")
                          ? "bg-[#00F0FF]/15 text-[#00F0FF]"
                          : "text-gray-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <ShieldCheck size={14} />
                      <span>Pro Rooms</span>
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Handbook */}
              <NavLink
                to="/handbook"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition ${
                  isHandbookActive
                    ? "bg-[#00F0FF]/15 text-[#00F0FF]"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <BookOpen size={15} />
                <span>Handbook</span>
              </NavLink>

              {/* Community */}
              <NavLink
                to="/community"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-sm font-semibold transition ${
                  isCommunityActive
                    ? "bg-[#00F0FF]/15 text-[#00F0FF]"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                Community
              </NavLink>
            </motion.div>
          )}
        </AnimatePresence>
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
