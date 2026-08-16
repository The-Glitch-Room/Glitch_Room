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
    return { label: "Evaluation in Progress", color: "amber", isLive: false };
  }
  if (eventEnd && now > eventEnd) {
    return { label: "Submission Closed", color: "gray", isLive: false };
  }
  if (eventStart && now >= eventStart && (!eventEnd || now <= eventEnd)) {
    return { label: "🔴 LIVE ASSESSMENT", color: "red", isLive: true };
  }
  if (regStart && now >= regStart && (!regEnd || now <= regEnd)) {
    return { label: "Registration Open", color: "emerald", isLive: false };
  }
  return { label: "Upcoming", color: "cyan", isLive: false };
};

const ProRoomCard = ({ room, isRegistered, onEnter }) => {
  const lifecycle = getProRoomLifecycleState(room);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-[#0d0d16] border border-cyan-500/20 hover:border-cyan-500/50 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 overflow-hidden hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] shadow-xl font-sans"
    >
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 rounded-t-2xl bg-gradient-to-r from-[#00F0FF] via-purple-500 to-[#FF00C8]" />

      <div>
        {/* Header Badges & Organization */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {room.org_logo ? (
              <img
                src={room.org_logo}
                alt={room.org_name}
                className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0 bg-[#161622]"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Building2 size={16} className="text-[#00F0FF]" />
              </div>
            )}
            <div className="min-w-0">
              <span className="text-white text-xs font-bold truncate flex items-center gap-1">
                {room.org_name || "Verified Examiner"}
                <ShieldCheck size={12} className="text-[#00F0FF] shrink-0" />
              </span>
              <span className="text-[10px] text-gray-500 block truncate">
                {room.event_type || "Technical Competition"}
              </span>
            </div>
          </div>

          {/* Lifecycle Status Pill */}
          <span
            className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full shrink-0 border uppercase flex items-center gap-1.5 ${
              lifecycle.isLive
                ? "bg-red-500/10 border-red-500/40 text-red-400 animate-pulse"
                : lifecycle.color === "emerald"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : lifecycle.color === "purple"
                ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                : "bg-cyan-500/10 border-cyan-500/30 text-[#00F0FF]"
            }`}
          >
            {lifecycle.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white group-hover:text-[#00F0FF] transition-colors leading-snug mb-2 line-clamp-1">
          {room.name || room.title}
        </h3>

        {/* Description */}
        <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-4">
          {room.short_description || room.description || "High-stakes technical assessment arena with automated code and criteria evaluation."}
        </p>

        {/* Tags & Metadata */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300">
            {room.category || "Assessment"}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/25 text-purple-300 flex items-center gap-1">
            <Zap size={10} className="text-amber-400" /> {room.gbits_prize_pool || 500} gBits Prize
          </span>
          {isRegistered && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/30 text-green-400 font-bold">
              ✓ Registered
            </span>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-xs font-mono text-gray-500 pt-3 border-t border-white/5 mb-4">
          <span className="flex items-center gap-1.5">
            <Users size={13} className="text-[#00F0FF]" />
            {room.member_count || room.registrations_count || 12} Candidates
          </span>
          <span className="flex items-center gap-1.5 text-gray-400">
            <Clock size={13} /> {room.duration_minutes || 120} Mins
          </span>
        </div>
      </div>

      {/* Action Button */}
      <div>
        <button
          type="button"
          onClick={() => onEnter(room.id)}
          className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
            lifecycle.isLive
              ? "bg-gradient-to-r from-red-600 via-purple-600 to-[#FF00C8] hover:from-red-500 hover:to-[#FF00C8] text-white shadow-red-500/20"
              : "bg-gradient-to-r from-[#00F0FF]/80 to-purple-600 hover:from-[#00F0FF] hover:to-purple-500 text-white shadow-[#00F0FF]/20"
          }`}
        >
          {lifecycle.isLive ? "Enter Live Assessment" : "View Assessment Arena"}{" "}
          <ArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  );
};

export default ProRoomCard;
