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
  const [profileData, setProfileData] = useState({
    username: "",
    avatarUrl: avatarPreview,
  });

  const [accentColor, setAccentColor] = useState(() => {
    return (
      getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() ||
      "#FF00C8"
    );
  });

  useEffect(() => {
    const updateAccent = () => {
      const col =
        getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() ||
        "#FF00C8";
      setAccentColor(col);
    };

    updateAccent();
    window.addEventListener("accent_color_changed", updateAccent);
    const observer = new MutationObserver(updateAccent);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });

    return () => {
      window.removeEventListener("accent_color_changed", updateAccent);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    setCurrentXp(xp);
  }, [xp]);

  useEffect(() => {
    let isMounted = true;

    const fetchSidebarProfile = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;
      const userId = currentUser?.id;
      const cachedAvatar = userId ? localStorage.getItem(`glitch_avatar_${userId}`) : null;

      let name =
        user?.user_metadata?.full_name ||
        user?.email?.split("@")[0] ||
        currentUser?.user_metadata?.full_name ||
        currentUser?.email?.split("@")[0];

      let avatar =
        avatarPreview ||
        user?.user_metadata?.avatar_url ||
        currentUser?.user_metadata?.avatar_url ||
        cachedAvatar ||
        null;

      if (currentUser) {
        const { data: dbProfile } = await supabase
          .from("profiles")
          .select("full_name, username, avatar_url")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (dbProfile) {
          name = dbProfile.full_name || dbProfile.username || name;
          avatar =
            avatarPreview ||
            dbProfile.avatar_url ||
            currentUser?.user_metadata?.avatar_url ||
            cachedAvatar ||
            null;
          if (typeof dbProfile.points === "number") {
            setCurrentXp(dbProfile.points);
          }
        }
      }

      if (isMounted) {
        setProfileData({
          username: name || "Builder",
          avatarUrl: avatar,
        });
      }
    };

    fetchSidebarProfile();

    const handleUpdate = () => fetchSidebarProfile();
    window.addEventListener("profile_updated", handleUpdate);
    window.addEventListener("gbits_updated", handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("profile_updated", handleUpdate);
      window.removeEventListener("gbits_updated", handleUpdate);
    };
  }, [user, avatarPreview]);

  const username = profileData.username || "User";
  const initials = username.slice(0, 2).toUpperCase();
  const avatarUrl = profileData.avatarUrl;

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
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        {!isCollapsed && (
          <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-gray-400 pl-2">
            Navigation
          </span>
        )}
        <button
          onClick={toggleCollapse}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-all duration-200"
          style={{ color: accentColor }}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </button>
      </div>

      {/* ── User Mini Card ── */}
      <div className="p-4 border-b border-white/10">
        {!isCollapsed ? (
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-md">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
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
              <p
                className="text-xs font-mono mt-0.5 font-semibold"
                style={{ color: accentColor }}
              >
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
              {avatarUrl ? (
                <img
                  src={avatarUrl}
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
                <p
                  className="font-mono mt-0.5 text-xs font-semibold"
                  style={{ color: accentColor }}
                >
                  Level {level} · {displayXp} gBits
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Navigation Links ── */}
      <nav className="p-3 space-y-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path && location.pathname === item.path;

          if (item.danger) {
            return (
              <div key="logout-wrapper" className="pt-3 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 text-red-400 hover:text-red-300 hover:bg-red-500/10 ${
                    isCollapsed ? "justify-center" : ""
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </button>
              </div>
            );
          }

          return (
            <div key={item.path} className="relative">
              <Link
                to={item.path}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isCollapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "text-white border shadow-lg"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
                style={
                  isActive
                    ? {
                        background: `${accentColor}18`,
                        color: accentColor,
                        borderColor: `${accentColor}40`,
                        boxShadow: `0 0 16px ${accentColor}20`,
                      }
                    : {}
                }
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Icon
                    size={18}
                    className="shrink-0"
                    style={{ color: isActive ? accentColor : "#9ca3af" }}
                  />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </div>
                {!isCollapsed && isActive && (
                  <ChevronRight size={14} style={{ color: accentColor }} className="shrink-0" />
                )}
              </Link>

              {/* Hover Tooltip when Collapsed */}
              {isCollapsed && hoveredItem === item.name && (
                <div className="fixed left-[86px] z-50 pointer-events-none px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0d0d14] border border-white/15 text-white shadow-2xl whitespace-nowrap">
                  {item.name}
                </div>
              )}
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
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${accentColor}, #00F0FF)`,
                }}
              />
            </div>
            <p className="text-xs font-mono text-gray-400 text-right font-medium">
              {(displayXp || 0).toLocaleString()} / {(nextLevelXP || 100).toLocaleString()}
            </p>
          </>
        ) : (
          <div
            className="flex flex-col items-center justify-center cursor-pointer group relative"
            onMouseEnter={() => setHoveredItem("progress")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div
              className="w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-mono font-bold"
              style={{
                background: `${accentColor}18`,
                borderColor: `${accentColor}40`,
                color: accentColor,
              }}
            >
              L{level}
            </div>
            {hoveredItem === "progress" && (
              <div className="fixed left-[86px] bottom-6 z-50 pointer-events-none px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0d0d14] border border-white/15 text-white shadow-2xl whitespace-nowrap">
                <p className="font-mono" style={{ color: accentColor }}>
                  Level {level} Progress: {Math.round(progressPercent)}%
                </p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                  {displayXp} / {nextLevelXP} gBits
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
