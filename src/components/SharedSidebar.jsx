import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  LayoutDashboard,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronLeft,
  BarChart2,
  Gift,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import {
  getLevelFromXP,
  getCurrentLevelXP,
  getNextLevelXP,
} from "../utils/pointsHelper";

const menuItems = [
  { name: "Your Profile", path: "/profile", icon: User },
  { name: "Console", path: "/console", icon: LayoutDashboard },
  { name: "Terminal Wall", path: "/terminal-wall", icon: BarChart2 },
  { name: "Earn Rules", path: "/earn-rules", icon: Gift },
  { name: "Settings", path: "/settings", icon: Settings },
  { name: "Help & Support", path: "/help", icon: HelpCircle },
  { name: "Logout", path: null, icon: LogOut, danger: true },
];

/**
 * SharedSidebar — supports Collapsing mode!
 * When collapsed, sidebar width shrinks to icon-only mode with floating hover tooltips.
 * State persists across page navigations via localStorage ('gr_sidebar_collapsed').
 */
const SharedSidebar = ({ user, xp = 0, avatarPreview = null }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("gr_sidebar_collapsed") === "true";
  });
  const [hoveredItem, setHoveredItem] = useState(null);
  const [currentXp, setCurrentXp] = useState(xp);

  useEffect(() => {
    setCurrentXp(xp);
  }, [xp]);

  useEffect(() => {
    const handleGbitsUpdate = (e) => {
      if (typeof e.detail?.points === "number") {
        setCurrentXp(e.detail.points);
      }
    };
    window.addEventListener("gbits_updated", handleGbitsUpdate);
    return () => window.removeEventListener("gbits_updated", handleGbitsUpdate);
  }, []);

  const username =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = username.slice(0, 2).toUpperCase();

  const displayXp = currentXp;
  const level = getLevelFromXP(displayXp);
  const currentLevelXP = getCurrentLevelXP(level);
  const nextLevelXP = getNextLevelXP(level);

  const xpIntoLevel = Math.max(0, displayXp - currentLevelXP);
  const xpSpanForLevel = Math.max(0, nextLevelXP - currentLevelXP);
  const progressPercent =
    xpSpanForLevel > 0
      ? Math.min((xpIntoLevel / xpSpanForLevel) * 100, 100)
      : 100;

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("gr_sidebar_collapsed", String(next));
      return next;
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <aside
      className={`sticky top-[18vh] h-[calc(100vh-18vh)] overflow-y-auto border-r border-white/10 bg-[#070709] hidden md:flex flex-col shrink-0 transition-all duration-300 ${
        isCollapsed ? "w-[76px]" : "w-[268px]"
      }`}
    >
      {/* ── Top Toggle Control Bar ── */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between gap-2">
        {!isCollapsed && (
          <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-gray-400 pl-1">
            Navigation
          </span>
        )}

        <button
          onClick={toggleCollapse}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          onMouseEnter={() => setHoveredItem("toggle_btn")}
          onMouseLeave={() => setHoveredItem(null)}
          className={`p-2 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/25 hover:border-[#00F0FF]/60 transition-all cursor-pointer shadow-md ${
            isCollapsed ? "mx-auto" : ""
          }`}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}

          {/* Hover Tooltip in Collapsed Mode */}
          {isCollapsed && hoveredItem === "toggle_btn" && (
            <div className="fixed left-[86px] top-[20vh] z-50 pointer-events-none px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0d0d14] border border-[#00F0FF]/40 text-[#00F0FF] shadow-2xl whitespace-nowrap">
              Expand Sidebar
            </div>
          )}
        </button>
      </div>

      {/* ── User Mini Card — Increased avatar (w-12 h-12), username & gBits text sizes ── */}
      <div className="p-4 border-b border-white/10">
        {!isCollapsed ? (
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-md">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1a1a1e] flex items-center justify-center text-sm font-black text-white">
                    {initials}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#070709]" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-sm sm:text-base truncate tracking-tight">
                {username}
              </p>
              <p className="text-xs font-mono text-[#00F0FF] mt-0.5 font-semibold">
                Level {level} · {displayXp} gBits
              </p>
            </div>
          </div>
        ) : (
          <div
            className="relative mx-auto cursor-pointer flex justify-center"
            onMouseEnter={() => setHoveredItem("profile_user")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="w-11 h-11 rounded-xl overflow-hidden ring-1 ring-white/15">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#1a1a1e] flex items-center justify-center text-xs font-black text-white">
                  {initials}
                </div>
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#070709]" />

            {/* Hover Tooltip for User */}
            {hoveredItem === "profile_user" && (
              <div className="fixed left-[86px] top-[26vh] z-50 pointer-events-none px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0d0d14] border border-white/15 text-white shadow-2xl whitespace-nowrap">
                <p className="font-bold text-white text-sm">{username}</p>
                <p className="text-xs text-[#00F0FF] font-mono mt-0.5">
                  Level {level} · {displayXp} gBits
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Nav links — Crisp, readable text-sm font-semibold ── */}
      <nav className="p-3 flex-1 space-y-1">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isHovered = hoveredItem === item.name;

          if (item.danger) {
            return (
              <div key={i} className="relative">
                <button
                  onClick={handleLogout}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`w-full flex items-center gap-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer ${
                    isCollapsed ? "justify-center px-0" : "px-3.5"
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </button>

                {/* Collapsed Tooltip */}
                {isCollapsed && isHovered && (
                  <div className="fixed left-[84px] z-50 pointer-events-none px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0d0d14] border border-red-500/30 text-red-400 shadow-2xl whitespace-nowrap">
                    {item.name}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={i} className="relative">
              <Link
                to={item.path}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div
                  className={`flex items-center gap-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isCollapsed ? "justify-center px-0" : "px-3.5"
                  } ${
                    isActive
                      ? "bg-white/10 text-white border border-white/10 shadow-[0_0_12px_rgba(255,0,200,0.15)]"
                      : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <Icon
                    size={18}
                    className={`shrink-0 ${isActive ? "text-[#FF00C8]" : ""}`}
                  />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 truncate">{item.name}</span>
                      {isActive && (
                        <ChevronRight size={14} className="text-gray-400 shrink-0" />
                      )}
                    </>
                  )}
                </div>
              </Link>

              {/* Collapsed Tooltip */}
              {isCollapsed && isHovered && (
                <div className="fixed left-[84px] z-50 pointer-events-none px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0d0d14] border border-white/15 text-white shadow-2xl whitespace-nowrap">
                  {item.name}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── gBits progress bar — Increased label font size to text-xs font-mono ── */}
      <div className="p-4 border-t border-white/10">
        {!isCollapsed ? (
          <>
            <div className="flex justify-between text-xs text-gray-300 mb-1.5 font-medium">
              <span className="font-mono">gBits Progress</span>
              <span className="font-mono font-bold text-[#FF00C8]">Lv {level}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                className="h-full rounded-full bg-gradient-to-r from-[#FF00C8] to-[#00F0FF]"
              />
            </div>
            <p className="text-xs font-mono text-gray-400 text-right font-medium">
              {displayXp.toLocaleString()} / {nextLevelXP.toLocaleString()}
            </p>
          </>
        ) : (
          <div
            className="flex flex-col items-center justify-center cursor-pointer group relative"
            onMouseEnter={() => setHoveredItem("progress")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="w-9 h-9 rounded-xl bg-[#FF00C8]/10 border border-[#FF00C8]/30 flex items-center justify-center text-[#FF00C8] text-xs font-mono font-bold">
              L{level}
            </div>

            {/* Hover Tooltip for Progress */}
            {hoveredItem === "progress" && (
              <div className="fixed left-[84px] bottom-6 z-50 pointer-events-none px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0d0d14] border border-white/15 text-white shadow-2xl whitespace-nowrap">
                <p className="font-bold text-white">gBits Progress</p>
                <p className="text-xs font-mono text-gray-400">
                  {xp.toLocaleString()} / {nextLevelXP.toLocaleString()} gBits ({Math.round(progressPercent)}%)
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default SharedSidebar;
