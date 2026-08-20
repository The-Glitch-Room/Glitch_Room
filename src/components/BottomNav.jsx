import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import {
  Home,
  Compass,
  Sword,
  User,
  MoreHorizontal,
  LayoutDashboard,
  Terminal,
  Zap,
  Users,
  ShieldCheck,
  MessageSquare,
  Settings,
  HelpCircle,
  LogOut,
  X,
} from "lucide-react";

// ── Bottom Nav Items ──────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/explore", icon: Compass, label: "Explore" },
  { path: "/game-arena", icon: Sword, label: "Arena" },
  { path: "/profile", icon: User, label: "Profile" },
  { path: "__more__", icon: MoreHorizontal, label: "More" },
];

// ── More Sheet Items ──────────────────────────────────────────────────────────
const MORE_ITEMS = [
  {
    path: "/console",
    icon: LayoutDashboard,
    label: "Console",
    color: "#FF00C8",
  },
  {
    path: "/terminal-wall",
    icon: Terminal,
    label: "Terminal Wall",
    color: "#f59e0b",
  },
  {
    path: "/creator-rooms",
    icon: Users,
    label: "Creator Rooms",
    color: "#a855f7",
  },
  {
    path: "/pro-rooms",
    icon: ShieldCheck,
    label: "Pro Rooms",
    color: "#3b82f6",
  },
  {
    path: "/community",
    icon: MessageSquare,
    label: "Community",
    color: "#FF00C8",
  },
  {
    path: "/earn-rules",
    icon: Zap,
    label: "Earn Rules",
    color: "#00F0FF",
  },
  {
    path: "/settings",
    icon: Settings,
    label: "Settings",
    color: "#6b7280",
  },
  {
    path: "/help",
    icon: HelpCircle,
    label: "Help & Support",
    color: "#6b7280",
  },
];

// ── More Sheet ────────────────────────────────────────────────────────────────
const MoreSheet = ({ onClose, navigate }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
        style={{
          background: "#0d0d14",
          border: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "none",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Top glow line */}
        <div
          className="h-[2px] w-full"
          style={{
            background: "linear-gradient(90deg, #FF00C8, #a855f7, #00F0FF)",
          }}
        />

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
          <h3 className="text-white font-black text-base">More</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Grid of items */}
        <div className="px-4 py-4 grid grid-cols-4 gap-3">
          {MORE_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl cursor-pointer transition-all hover:bg-white/5"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: `${item.color}18`,
                    border: `1px solid ${item.color}30`,
                  }}
                >
                  <Icon size={18} style={{ color: item.color }} />
                </div>
                <span className="text-[10px] text-gray-400 font-semibold text-center leading-tight">
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Logout */}
        <div className="px-4 pb-6 pt-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-red-400 text-sm font-bold cursor-pointer transition-all hover:bg-red-500/15"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.15)",
            }}
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </motion.div>
    </>
  );
};

// ── Main Bottom Nav ───────────────────────────────────────────────────────────
const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Nav bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 md:hidden"
        style={{
          background: "rgba(8,8,16,0.95)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Top accent line */}
        <div
          className="h-[1px] w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(0,240,255,0.3), rgba(255,0,200,0.3), transparent)",
          }}
        />

        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.path === "__more__" ? showMore : isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => {
                  if (item.path === "__more__") {
                    setShowMore((v) => !v);
                  } else {
                    setShowMore(false);
                    navigate(item.path);
                  }
                }}
                className="relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all cursor-pointer min-w-[56px]"
                style={{
                  background: active ? "rgba(0,240,255,0.08)" : "transparent",
                }}
              >
                {/* Active glow dot */}
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full"
                    style={{
                      background: "linear-gradient(90deg,#00F0FF,#FF00C8)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <Icon
                  size={20}
                  style={{
                    color: active ? "#00F0FF" : "#6b7280",
                    filter: active
                      ? "drop-shadow(0 0 6px rgba(0,240,255,0.5))"
                      : "none",
                    transition: "all 0.2s",
                  }}
                />
                <span
                  className="text-[10px] font-semibold transition-all"
                  style={{ color: active ? "#00F0FF" : "#6b7280" }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* More sheet */}
      <AnimatePresence>
        {showMore && (
          <MoreSheet onClose={() => setShowMore(false)} navigate={navigate} />
        )}
      </AnimatePresence>
    </>
  );
};

export default BottomNav;
