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
import { Zap } from "lucide-react";
import { supabase } from "../supabaseClient";
import { getLevelFromXP } from "../utils/pointsHelper";

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";

const dropdownLinks = [
  { to: "/profile", icon: FiUser, label: "Your Profile" },
  { to: "/console", icon: FiGrid, label: "Console" },
  { to: "/terminal-wall", icon: FiTerminal, label: "Terminal Wall" },
  { to: "/earn-rules", icon: FiGift, label: "Earn gBits" },
  { to: "/settings", icon: FiSettings, label: "Settings" },
  { to: "/help", icon: FiHelpCircle, label: "Help & Support" },
];

const NavbarUserSection = ({ user: propUser }) => {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "",
    username: "",
    email: "",
    avatarUrl: DEFAULT_AVATAR,
    points: 0,
    level: 1,
  });
  const dropdownRef = useRef(null);

  const fetchFullUserProfile = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData?.user || propUser;
    if (!currentUser) return;

    const userId = currentUser.id;
    const userMeta = currentUser.user_metadata;

    // 1. Fetch Profile record from Supabase
    const { data: dbProfile } = await supabase
      .from("profiles")
      .select("full_name, username, avatar_url, points")
      .eq("id", userId)
      .maybeSingle();

    // 2. Fetch User Points from Supabase
    const { data: ptsData } = await supabase
      .from("user_points")
      .select("points")
      .eq("user_id", userId)
      .maybeSingle();

    const points = ptsData?.points ?? dbProfile?.points ?? 0;
    const level = getLevelFromXP(points);

    const name =
      dbProfile?.full_name ||
      userMeta?.full_name ||
      userMeta?.name ||
      dbProfile?.username ||
      currentUser?.email?.split("@")[0] ||
      "Glitch Builder";

    const rawUsername =
      dbProfile?.username ||
      userMeta?.username ||
      (name ? `@${name.toLowerCase().replace(/\s+/g, "")}` : "@glitcher");

    const username = rawUsername.startsWith("@") ? rawUsername : `@${rawUsername}`;

    // Single source of truth avatar resolution matching Profile page
    const avatarUrl =
      dbProfile?.avatar_url ||
      userMeta?.avatar_url ||
      userMeta?.picture ||
      DEFAULT_AVATAR;

    setUserProfile({
      name,
      username,
      email: currentUser?.email || "",
      avatarUrl,
      points,
      level,
    });
  };

  useEffect(() => {
    fetchFullUserProfile();

    // Listen for profile updates & points changes anywhere on the site
    const handleProfileUpdate = () => fetchFullUserProfile();
    window.addEventListener("profile_updated", handleProfileUpdate);
    window.addEventListener("points_updated", handleProfileUpdate);
    window.addEventListener("gbits_updated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profile_updated", handleProfileUpdate);
      window.removeEventListener("points_updated", handleProfileUpdate);
      window.removeEventListener("gbits_updated", handleProfileUpdate);
    };
  }, [propUser]);

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

  const initials = (userProfile.name || "GB").slice(0, 2).toUpperCase();

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      {/* Avatar trigger button */}
      <button
        onClick={() => setOpenDropdown(!openDropdown)}
        className="relative w-10 h-10 rounded-xl overflow-hidden ring-1 ring-white/15 hover:ring-[#00F0FF]/50 transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center bg-[#101018]"
        title={userProfile.name}
      >
        {userProfile.avatarUrl ? (
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to DEFAULT_AVATAR if custom image fails
              e.currentTarget.src = DEFAULT_AVATAR;
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600/40 to-[#00F0FF]/40 flex items-center justify-center text-xs font-black text-white">
            {initials}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {openDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2.5 w-64 bg-[#0a0a0c] border border-white/15 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden"
          >
            {/* User Info Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 mb-1 bg-white/[0.02]">
              <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-purple-500/40 shrink-0 bg-[#101018] flex items-center justify-center">
                {userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_AVATAR;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600/40 to-[#00F0FF]/40 flex items-center justify-center text-xs font-black text-white">
                    {initials}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-bold truncate leading-snug">
                  {userProfile.name}
                </p>
                <p className="text-[#00F0FF] text-[11px] font-mono truncate">
                  {userProfile.username}
                </p>

                {/* Level & gBits Badges */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[#00F0FF]">
                    Level {userProfile.level}
                  </span>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center gap-1">
                    <Zap size={9} className="text-amber-400" /> {userProfile.points} gBits
                  </span>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="py-1">
              {dropdownLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpenDropdown(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/[0.06] font-semibold transition-all"
                >
                  <item.icon size={15} className="shrink-0 text-gray-400" />
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Logout Divider */}
            <div className="border-t border-white/10 mt-1 pt-1">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-red-400 font-bold hover:bg-red-500/10 transition-all cursor-pointer"
              >
                <FiLogOut size={15} className="shrink-0" />
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
