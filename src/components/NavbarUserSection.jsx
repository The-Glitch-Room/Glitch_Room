import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiGrid,
  FiTerminal,
  FiGift,
  FiLogOut,
  FiSettings,
  FiHelpCircle,
} from "react-icons/fi";
import { supabase } from "../supabaseClient";

const dropdownLinks = [
  { to: "/profile", icon: FiUser, label: "Your Profile" },
  { to: "/console", icon: FiGrid, label: "Console" },
  { to: "/terminal-wall", icon: FiTerminal, label: "Terminal Wall" },
  { to: "/earn-rules", icon: FiGift, label: "Earn gBits" },
  { to: "/settings", icon: FiSettings, label: "Settings" },
  { to: "/help", icon: FiHelpCircle, label: "Help & Support" },
];

const NavbarUserSection = ({ user }) => {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const dropdownRef = useRef(null);

  const username =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = username.slice(0, 2).toUpperCase();

  useEffect(() => {
    const fetchAvatar = async () => {
      const userId = user?.id;
      if (!userId) return;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .single();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    };
    fetchAvatar();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar trigger */}
      <button
        onClick={() => setOpenDropdown(!openDropdown)}
        className="relative w-9 h-9 rounded-xl overflow-hidden ring-1 ring-white/10 hover:ring-white/25 transition-all duration-200 cursor-pointer"
      >
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
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {openDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2.5 w-52 bg-[#0a0a0c] border border-white/8 rounded-2xl shadow-2xl py-1.5 z-50 overflow-hidden"
          >
            {/* User info header */}
            <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-white/5 mb-1">
              <div className="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-white/8 shrink-0">
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
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">
                  {username}
                </p>
                <p className="text-gray-600 text-[10px] truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Links */}
            {dropdownLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpenDropdown(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all"
              >
                <item.icon size={13} />
                {item.label}
              </Link>
            ))}

            {/* Divider + logout */}
            <div className="border-t border-white/5 mt-1 pt-1">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-red-400 hover:bg-red-500/8 transition-all cursor-pointer"
              >
                <FiLogOut size={13} />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NavbarUserSection;
