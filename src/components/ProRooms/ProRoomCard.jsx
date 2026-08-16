import React from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Users,
  Trophy,
  ArrowRight,
  Clock,
  Building2,
  Calendar,
  Zap,
  Bell,
} from "lucide-react";

export const getProRoomLifecycleState = (room) => {
  if (!room) return { label: "Upcoming", color: "cyan", isLive: false };
  const now = new Date();

  const regStart = room.reg_start_at ? new Date(room.reg_start_at) : null;
  const regEnd = room.reg_end_at ? new Date(room.reg_end_at) : null;
  const eventStart = room.event_start_at ? new Date(room.event_start_at) : null;
  const eventEnd = room.event_end_at ? new Date(room.event_end_at) : null;

  if (room.status === "results_published") {
    return { label: "Results Published", color: "purple", isLive: false };
  }
  if (room.status === "evaluation") {
    return { label: "Evaluation", color: "amber", isLive: false };
  }
  if (eventEnd && now > eventEnd) {
    return { label: "Submission Closed", color: "gray", isLive: false };
  }
  if (eventStart && now >= eventStart && (!eventEnd || now <= eventEnd)) {
    return { label: "🔴 LIVE", color: "red", isLive: true };
  }
  if (regStart && now >= regStart && (!regEnd || now <= regEnd)) {
    return { label: "REGISTRATION OPEN", color: "emerald", isLive: false };
  }
  return { label: "UPCOMING", color: "purple", isLive: false };
};

const ProRoomCard = ({ room, isRegistered, onSelect }) => {
  const lifecycle = getProRoomLifecycleState(room);

  // Formatting dates
  const formatDateRange = () => {
    try {
      if (room.event_start_at && room.event_end_at) {
        const start = new Date(room.event_start_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const end = new Date(room.event_end_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        return `${start} – ${end}`;
      }
    } catch (e) {}
    return "Dates TBA";
  };

  const getButtonText = () => {
    if (lifecycle.isLive) return "Enter Room →";
    if (lifecycle.label === "REGISTRATION OPEN") return "Register Now →";
    if (lifecycle.label === "UPCOMING") return "View Details →";
    if (lifecycle.label === "Results Published" || lifecycle.label === "Submission Closed")
      return "View Results →";
    return "View Details →";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-[#0b0b14] border border-white/10 hover:border-[#FF00C8]/50 rounded-2xl flex flex-col justify-between transition-all duration-300 overflow-hidden shadow-xl font-sans"
    >
      {/* Top Banner Image with Overlay Badges */}
      <div className="h-44 w-full relative overflow-hidden bg-[#12121e]">
        {room.cover_image ? (
          <img
            src={room.cover_image}
            alt={room.name || room.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900/40 via-black to-cyan-900/30 flex items-center justify-center p-4">
            <Building2 size={32} className="text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b14] via-transparent to-black/50" />

        {/* Top Badges: Status & Event Type */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
          <span
            className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${
              lifecycle.isLive
                ? "bg-red-500/80 border-red-400 text-white animate-pulse"
                : lifecycle.color === "emerald"
                ? "bg-emerald-500/80 border-emerald-400 text-white"
                : lifecycle.color === "purple"
                ? "bg-purple-600/80 border-purple-400 text-white"
                : "bg-cyan-500/80 border-cyan-400 text-white"
            }`}
          >
            {lifecycle.label}
          </span>

          <span className="text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-black/60 border border-white/20 text-gray-300 backdrop-blur-md">
            {room.event_type || room.category || "Hackathon"}
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Organization Info */}
          <div className="flex items-center gap-2">
            {room.org_logo ? (
              <img
                src={room.org_logo}
                alt={room.org_name}
                className="w-5 h-5 rounded-md object-cover border border-white/10 shrink-0 bg-[#161622]"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <Building2 size={14} className="text-[#00F0FF] shrink-0" />
            )}
            <span className="text-xs font-bold text-gray-300 truncate flex items-center gap-1">
              By {room.org_name || "Verified Organization"}
              <ShieldCheck size={13} className="text-[#00F0FF] shrink-0" />
            </span>
          </div>

          {/* Room Title */}
          <h3 className="text-base font-bold text-white group-hover:text-[#FF00C8] transition-colors leading-snug line-clamp-1">
            {room.name || room.title}
          </h3>

          {/* Short Description */}
          <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
            {room.short_description || room.detailed_description || "Professional assessment arena for developers."}
          </p>
        </div>

        {/* Metadata Details List matching Image 2 */}
        <div className="space-y-2 pt-2 border-t border-white/5 text-xs text-gray-300">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-gray-400">
              <Calendar size={13} className="text-purple-400" /> Date
            </span>
            <span className="font-mono text-white font-semibold">{formatDateRange()}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-gray-400">
              <Users size={13} className="text-[#00F0FF]" /> Participants
            </span>
            <span className="font-mono text-white font-semibold">
              {room.max_participants ? `${room.max_participants} Participants` : "Open Capacity"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-gray-400">
              <Trophy size={13} className="text-amber-400" /> Prize Pool
            </span>
            <span className="font-mono text-amber-400 font-bold">
              {room.gbits_prize_pool ? `${room.gbits_prize_pool} gBits` : room.prize_details || "gBits Rewards"}
            </span>
          </div>
        </div>

        {/* Solid Pink Button (User Directive: No gradient button, use only solid pink) */}
        <button
          type="button"
          onClick={onSelect}
          className="w-full py-2.5 rounded-xl bg-[#FF00C8] hover:bg-[#d600a8] text-white text-xs font-bold transition shadow-lg shadow-[#FF00C8]/25 cursor-pointer flex items-center justify-center gap-1.5 mt-2"
        >
          {getButtonText()}
        </button>
      </div>
    </motion.div>
  );
};

export default ProRoomCard;
