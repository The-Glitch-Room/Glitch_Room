import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { getLevelProgressDetails } from "../utils/pointsHelper";
import {
  LayoutDashboard,
  User,
  BarChart3,
  Gift,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Shield,
  Layers,
} from "lucide-react";

const SharedSidebar = ({ isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [points, setPoints] = useState(0);
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      const { data: pts } = await supabase
        .from("user_points")
        .select("points")
        .eq("user_id", user.id)
        .maybeSingle();

      if (prof) setProfile(prof);
      if (pts) setPoints(pts.points);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const menuItems = [
    { name: "User Console", icon: LayoutDashboard, path: "/console" },
    { name: "Your Profile", icon: User, path: "/profile" },
    { name: "Terminal Wall", icon: BarChart3, path: "/terminal-wall" },
    { name: "Earn Rules Hub", icon: Gift, path: "/earn-rules" },
    { name: "Settings", icon: Settings, path: "/settings" },
    { name: "Help Center", icon: HelpCircle, path: "/help" },
    { name: "Log Out", icon: LogOut, danger: true },
  ];

  const username = profile?.username || profile?.full_name || "Glitcher";
  const avatarUrl = profile?.avatar_url;
  const initials = username.slice(0, 2).toUpperCase();

  // Unified Level Math via single source of truth helper
  const levelDetails = getLevelProgressDetails(points || 0);
  const level = levelDetails.level;
  const displayXp = levelDetails.currentXP;
  const nextLevelXP = levelDetails.nextLevelXP;
  const progressPercent = levelDetails.progressPercent;
  const accentColor = levelDetails.accentColor;

  return (
    <aside
      className={`fixed top-20 bottom-0 left-0 z-40 bg-[#070709]/95 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between transition-all duration-300 selection:bg-[#00F0FF]/20 ${
        isCollapsed ? "w-[72px]" : "w-64"
      }`}
    >
      {/* ── Header: Toggle Button & User Profile ── */}
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 ring-2 ring-[#00F0FF]/30 shadow-lg">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#1a1a1e] flex items-center justify-center text-xs font-black text-white">
                  {initials}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{username}</p>
              <p
                className="text-xs font-mono font-semibold truncate"
                style={{ color: accentColor }}
              >
                Lv {level} · {displayXp} gBits
              </p>
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className={`p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer ${
            isCollapsed ? "mx-auto" : ""
          }`}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* ── Collapsed User Profile Icon ── */}
      {isCollapsed && (
        <div className="px-3 pt-3">
          <div
            className="relative flex justify-center cursor-pointer"
            onMouseEnter={() => setHoveredItem("profile_user")}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => navigate("/profile")}
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-[#00F0FF]/30 shadow-lg">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#1a1a1e] flex items-center justify-center text-xs font-black text-white">
                  {initials}
                </div>
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#070709]" />

            {/* Hover Pop-out for User Profile */}
            <AnimatePresence>
              {hoveredItem === "profile_user" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: -10 }}
                  animate={{ opacity: 1, scale: 1.02, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -10 }}
                  transition={{ type: "spring", stiffness: 450, damping: 25 }}
                  className="absolute left-0 top-0 z-50 pointer-events-none px-4 py-2.5 rounded-2xl bg-[#0d0d16] border border-[#00F0FF]/50 text-white shadow-[0_0_25px_rgba(0,240,255,0.3)] whitespace-nowrap flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#1a1a1e] flex items-center justify-center text-[10px] font-black text-white">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-white text-xs leading-tight">{username}</p>
                    <p className="font-mono text-[10px] font-semibold" style={{ color: accentColor }}>
                      Level {level} · {displayXp} gBits
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Navigation Links ── */}
      <nav className="p-3 space-y-1.5 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path && location.pathname === item.path;
          const isHovered = hoveredItem === item.name;

          if (item.danger) {
            return (
              <div key="logout-wrapper" className="pt-3 border-t border-white/10 relative">
                <div
                  className="relative flex items-center"
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <motion.button
                    onClick={handleLogout}
                    animate={
                      isCollapsed && isHovered
                        ? { scale: 1.05, x: 4 }
                        : { scale: 1, x: 0 }
                    }
                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                      isCollapsed && isHovered
                        ? "absolute left-0 z-50 bg-[#160a0d] border border-red-500/50 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.3)] whitespace-nowrap pr-4"
                        : isCollapsed
                        ? "w-full justify-center text-red-400 hover:bg-red-500/10"
                        : "w-full justify-start text-red-400 hover:bg-red-500/10"
                    }`}
                  >
                    <Icon size={18} className={`shrink-0 ${isHovered ? "scale-110" : ""}`} />
                    {(!isCollapsed || (isCollapsed && isHovered)) && (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="truncate font-bold text-xs"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </motion.button>
                </div>
              </div>
            );
          }

          return (
            <div key={item.path} className="relative">
              <div
                className="relative flex items-center"
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link
                  to={item.path}
                  className="w-full"
                >
                  <motion.div
                    animate={
                      isCollapsed && isHovered
                        ? { scale: 1.04, x: 4 }
                        : { scale: 1, x: 0 }
                    }
                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                      isCollapsed && isHovered
                        ? "absolute left-0 z-50 bg-[#0d0d16] border border-[#00F0FF]/50 text-white shadow-[0_0_25px_rgba(0,240,255,0.3)] whitespace-nowrap pr-4"
                        : isCollapsed
                        ? "w-full justify-center text-gray-300 hover:text-white hover:bg-white/5"
                        : "w-full justify-between text-gray-300 hover:text-white hover:bg-white/5"
                    } ${
                      isActive
                        ? "text-white border border-[#00F0FF]/40 bg-[#00F0FF]/15 shadow-lg"
                        : ""
                    }`}
                    style={
                      isActive && !isHovered
                        ? {
                            background: `${accentColor}18`,
                            color: accentColor,
                            borderColor: `${accentColor}40`,
                            boxShadow: `0 0 16px ${accentColor}20`,
                          }
                        : {}
                    }
                  >
                    <Icon
                      size={18}
                      className={`shrink-0 transition-transform ${
                        isHovered ? "scale-110 text-[#00F0FF]" : ""
                      }`}
                      style={{ color: isActive ? accentColor : undefined }}
                    />

                    {/* Reveal Label Text when expanded OR when hovered in collapsed mode */}
                    {(!isCollapsed || (isCollapsed && isHovered)) && (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="truncate font-bold text-xs"
                      >
                        {item.name}
                      </motion.span>
                    )}

                    {!isCollapsed && isActive && (
                      <ChevronRight size={14} style={{ color: accentColor }} className="shrink-0 ml-auto" />
                    )}
                  </motion.div>
                </Link>
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Level Progress Bar at Bottom ── */}
      <div className="p-4 border-t border-white/10 bg-[#070709]">
        {!isCollapsed ? (
          <>
            <div className="flex items-center justify-between text-xs font-semibold text-gray-300 mb-1.5">
              <span className="font-mono">gBits Progress</span>
              <span className="font-mono font-bold" style={{ color: accentColor }}>
                Lv {level}
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1.5 relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  background: `linear-gradient(90deg, ${accentColor}, #00F0FF)`,
                }}
              >
                {/* Animated shimmer sweep overlay */}
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "linear", delay: 1 }}
                  className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12"
                />
              </motion.div>
            </div>
            <p className="text-xs font-mono text-gray-400 text-right font-medium">
              {(displayXp || 0).toLocaleString()} / {(nextLevelXP || 250).toLocaleString()}
            </p>
          </>
        ) : (
          <div
            className="flex flex-col items-center justify-center cursor-pointer group relative"
            onMouseEnter={() => setHoveredItem("progress")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div
              className="w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-mono font-bold transition-transform group-hover:scale-105"
              style={{
                background: `${accentColor}18`,
                borderColor: `${accentColor}40`,
                color: accentColor,
              }}
            >
              L{level}
            </div>

            {/* Hover Pop-out for Progress Widget */}
            <AnimatePresence>
              {hoveredItem === "progress" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: -10 }}
                  animate={{ opacity: 1, scale: 1.02, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -10 }}
                  transition={{ type: "spring", stiffness: 450, damping: 25 }}
                  className="absolute left-0 bottom-0 z-50 pointer-events-none px-4 py-2.5 rounded-2xl bg-[#0d0d16] border border-[#00F0FF]/50 text-white shadow-[0_0_25px_rgba(0,240,255,0.3)] whitespace-nowrap"
                >
                  <p className="font-mono font-bold text-xs" style={{ color: accentColor }}>
                    Level {level} Progress: {Math.round(progressPercent)}%
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                    {displayXp} / {nextLevelXP} gBits
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </aside>
  );
};

export default SharedSidebar;
