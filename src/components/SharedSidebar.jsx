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
  BarChart2,
  Gift,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import {
  getLevelProgressDetails,
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
      getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim() || "#FF00C8"
    );
  });

  useEffect(() => {
    const updateAccent = () => {
      const col =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--accent")
          .trim() || "#FF00C8";
      setAccentColor(col);
    };

    updateAccent();
    window.addEventListener("accent_color_changed", updateAccent);
    const observer = new MutationObserver(updateAccent);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });

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
      const cachedAvatar = userId
        ? localStorage.getItem(`glitch_avatar_${userId}`)
        : null;

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
        }

        const { data: pts } = await supabase
          .from("user_points")
          .select("points")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (pts && typeof pts.points === "number") {
          setCurrentXp(pts.points);
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
    window.addEventListener("points_updated", handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("profile_updated", handleUpdate);
      window.removeEventListener("gbits_updated", handleUpdate);
      window.removeEventListener("points_updated", handleUpdate);
    };
  }, [user, avatarPreview]);

  const username = profileData.username || "User";
  const initials = username.slice(0, 2).toUpperCase();
  const avatarUrl = profileData.avatarUrl;

  const displayXp = currentXp;
  const progressDetails = getLevelProgressDetails(displayXp);
  const level = progressDetails.currentLevel;
  const nextLevelXP = progressDetails.nextLevelXP;
  const progressPercent = progressDetails.percentage;

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
      className={`sticky top-20 h-[calc(100vh-5.5rem)] overflow-hidden border-r border-white/10 bg-[#070709] hidden md:flex flex-col justify-between shrink-0 transition-all duration-300 z-30 ${
        isCollapsed ? "w-[76px]" : "w-[268px]"
      }`}
    >
      {/* ── Top Section (Header + Profile + Nav) ── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top Control Bar */}
        <div className="px-3.5 py-2.5 border-b border-white/10 flex items-center justify-between shrink-0">
          {!isCollapsed && (
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-gray-400 pl-1">
              Navigation
            </span>
          )}
          <button
            onClick={toggleCollapse}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer ml-auto"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronRight
              size={15}
              className={`transition-transform duration-300 ${
                isCollapsed ? "" : "rotate-180"
              }`}
            />
          </button>
        </div>

        {/* Profile Card Banner */}
        <div className="p-3.5 border-b border-white/10 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-white/15 relative bg-[#0d0d14]">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username}
                className="w-full h-full object-cover"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-xs text-[#FF00C8]">
                {initials}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-black" />
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white truncate leading-tight">
                {username}
              </h4>
              <p
                className="text-[11px] font-mono font-semibold truncate"
                style={{ color: accentColor }}
              >
                Level {level} · {displayXp} gBits
              </p>
            </div>
          )}
        </div>

        {/* Navigation Links with Spacious Spacing */}
        <nav className="px-3 py-3 space-y-1.5 flex-1 flex flex-col justify-between overflow-hidden">
          <div className="space-y-1.5">
            {menuItems.filter(i => !i.danger).map((item) => {
              const Icon = item.icon;
              const isActive = item.path && location.pathname === item.path;

              return (
                <div key={item.path} className="relative">
                  <Link
                    to={item.path}
                    onMouseEnter={() => setHoveredItem(item.name)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
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
                      {!isCollapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </div>
                    {!isCollapsed && isActive && (
                      <ChevronRight
                        size={14}
                        style={{ color: accentColor }}
                        className="shrink-0"
                      />
                    )}
                  </Link>

                  {/* Hover Tooltip when Collapsed */}
                  <AnimatePresence>
                    {isCollapsed && hoveredItem === item.name && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.85, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.85, x: -10 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="absolute left-full top-1/2 -translate-y-1/2 ml-3.5 z-50 pointer-events-none px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0d0d14]/95 backdrop-blur-md border border-white/15 text-white shadow-2xl whitespace-nowrap"
                      >
                        {item.name}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Logout Option */}
          {menuItems.filter(i => i.danger).map((item) => {
            const Icon = item.icon;
            return (
              <div key="logout-wrapper" className="pt-2.5 border-t border-white/10 shrink-0">
                <div className="relative">
                  <button
                    onClick={handleLogout}
                    onMouseEnter={() => setHoveredItem(item.name)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 text-red-400 hover:text-red-300 hover:bg-red-500/10 ${
                      isCollapsed ? "justify-center" : ""
                    }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </button>
                  <AnimatePresence>
                    {isCollapsed && hoveredItem === item.name && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.85, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.85, x: -10 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="absolute left-full top-1/2 -translate-y-1/2 ml-3.5 z-50 pointer-events-none px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0d0d14]/95 backdrop-blur-md border border-red-500/30 text-red-400 shadow-2xl whitespace-nowrap"
                      >
                        {item.name}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* ── Level Progress Bar at Bottom (Visually Separated) ── */}
      <div className="p-3.5 border-t border-white/10 bg-[#070709] shrink-0">
        {!isCollapsed ? (
          <>
            <div className="flex items-center justify-between text-xs font-semibold text-gray-300 mb-1.5">
              <span className="font-mono">gBits Progress</span>
              <span
                className="font-mono font-bold"
                style={{ color: accentColor }}
              >
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
              {(displayXp || 0).toLocaleString()} /{" "}
              {(nextLevelXP || 250).toLocaleString()}
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
            <AnimatePresence>
              {hoveredItem === "progress" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.85, x: -10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="absolute left-full top-1/2 -translate-y-1/2 ml-3.5 z-50 pointer-events-none px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0d0d14]/95 backdrop-blur-md border border-white/15 text-white shadow-2xl whitespace-nowrap"
                >
                  <p className="font-mono" style={{ color: accentColor }}>
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
