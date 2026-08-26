import React from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Users,
  CheckCircle,
  Sparkles,
  Target,
  Calendar,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

// ── Per-category accent identity — every card is themed by its own category
// (banner, badges, avatar ring, title hover, pledge accent, and CTA border
// all derive from the same token) instead of every card sharing one fixed
// purple/pink brand gradient regardless of what the room is about.
const CATEGORY_ACCENTS = {
  coding: {
    hex: "#00F0FF",
    glow: "rgba(0,240,255,0.22)",
    from: "from-cyan-950/80",
    label: "Coding & DSA",
  },
  design: {
    hex: "#FF00C8",
    glow: "rgba(255,0,200,0.22)",
    from: "from-pink-950/80",
    label: "Design & Sparks",
  },
  ai: {
    hex: "#2DD4BF",
    glow: "rgba(45,212,191,0.22)",
    from: "from-teal-950/80",
    label: "AI & Debug",
  },
  default: {
    hex: "#A855F7",
    glow: "rgba(168,85,247,0.22)",
    from: "from-purple-950/80",
    label: "Accountability",
  },
};

const getCategoryAccent = (category) => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("coding") || cat.includes("dsa") || cat.includes("tech"))
    return CATEGORY_ACCENTS.coding;
  if (
    cat.includes("design") ||
    cat.includes("spark") ||
    cat.includes("creative")
  )
    return CATEGORY_ACCENTS.design;
  if (cat.includes("ai") || cat.includes("debug")) return CATEGORY_ACCENTS.ai;
  return CATEGORY_ACCENTS.default;
};

const getDurationLabel = (d) => {
  if (d === "7_day") return "7-Day Sprint";
  if (d === "14_day") return "14-Day Sprint";
  if (d === "30_day") return "30-Day Bootcamp";
  if (d === "60_day") return "60-Day Sprint";
  if (d === "100_day") return "100-Day Challenge";
  return "Ongoing Squad";
};

/**
 * RoomCard — Creator Room summary card for the room grid.
 *
 * Props:
 *  - room:     the room row from Supabase (`rooms` table). Reads
 *              category, duration_type, host, name/title, goal_pledge,
 *              description, member_count, id.
 *  - isMember: whether the current user has already joined this room.
 *  - onJoin:   (room) => void — called when a non-member commits & joins.
 *  - onEnter:  (roomId) => void — called when a member opens the room hub.
 *  - joining:  the id of the room currently being joined (for the
 *              per-card loading state), or null.
 */
const RoomCard = ({ room, isMember, onJoin, onEnter, joining }) => {
  const accent = getCategoryAccent(room.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25 }}
      style={{ "--accent": accent.hex, "--accent-glow": accent.glow }}
      className="group relative bg-[#0c0c16] border border-white/10 rounded-3xl flex flex-col justify-between transition-all duration-300 overflow-hidden shadow-xl font-sans hover:border-[color:var(--accent)]/50 hover:shadow-[0_0_35px_var(--accent-glow)]"
    >
      {/* Top Hover Accent Bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] w-full z-20 opacity-70 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, transparent, var(--accent), transparent)`,
        }}
      />

      {/* TOP BANNER SECTION */}
      <div
        className={`relative h-28 w-full bg-gradient-to-b ${accent.from} via-[#100c1e] to-[#0c0c16] overflow-hidden border-b border-white/5 p-4 flex items-start justify-between`}
      >
        {/* Cyber Pattern Texture */}
        <div
          className="absolute inset-0 opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Ambient accent glow, bottom-right */}
        <div
          className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-500"
          style={{ background: "var(--accent)" }}
        />

        {/* Top Floating Badges */}
        <span
          className="relative z-10 flex items-center gap-1.5 text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border"
          style={{ borderColor: "var(--accent-glow)", color: "var(--accent)" }}
        >
          <Sparkles size={11} /> {room.category || "Accountability"}
        </span>

        <div className="relative z-10 flex items-center gap-1.5">
          {isMember && (
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-emerald-300">
              <CheckCircle size={10} /> Joined
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-500/30 text-amber-300">
            <Calendar size={11} /> {getDurationLabel(room.duration_type)}
          </span>
        </div>
      </div>

      {/* CARD BODY CONTENT */}
      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between relative">
        {/* Host Avatar & Name */}
        <div className="flex items-center gap-2.5">
          <div
            className="relative w-9 h-9 rounded-full bg-[#141224] flex items-center justify-center text-xs font-bold shadow-md shrink-0 uppercase font-mono"
            style={{
              border: "1.5px solid var(--accent)",
              color: "var(--accent)",
            }}
          >
            {room.host ? room.host.charAt(0) : "C"}
            <ShieldCheck
              size={13}
              className="absolute -bottom-1 -right-1 bg-[#0c0c16] rounded-full text-[#00F0FF]"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs min-w-0">
            <span className="text-gray-500 font-mono">Host</span>
            <span className="font-bold text-white truncate">
              {room.host || "Glitch Creator"}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Room Title */}
          <h3
            className="text-xl font-black text-white transition-colors leading-snug tracking-tight"
            style={{ "--tw-text-opacity": 1 }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--accent)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.color = "")}
          >
            {room.name || room.title}
          </h3>

          {/* Goal Pledge Box — styled as a terminal log line to match the
              site's console/terminal voice used elsewhere (Console, Terminal Wall) */}
          {room.goal_pledge && (
            <div className="bg-[#05050b] border border-white/10 rounded-2xl overflow-hidden shadow-inner">
              <div
                className="flex items-center gap-1.5 px-3.5 py-1.5 border-b border-white/5"
                style={{ background: "var(--accent-glow)" }}
              >
                <Target size={11} style={{ color: "var(--accent)" }} />
                <span
                  className="text-[10px] font-mono font-bold uppercase tracking-wider"
                  style={{ color: "var(--accent)" }}
                >
                  $ pledge --commit
                </span>
              </div>
              <p className="text-xs text-gray-200 font-mono leading-relaxed line-clamp-2 px-3.5 py-2.5">
                {room.goal_pledge}
                <span
                  className="inline-block w-[6px] h-3 ml-1 align-middle animate-pulse"
                  style={{ background: "var(--accent)" }}
                />
              </p>
            </div>
          )}

          {/* Description */}
          <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
            {room.description ||
              "Daily check-in and consistency squad for builders."}
          </p>
        </div>

        {/* Metadata Row (Squad Members & Active Uptime) */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
            <Users size={13} className="text-gray-500 shrink-0" />
            <span className="text-white font-sans font-bold">
              {room.member_count || 1}
            </span>
            <span className="text-gray-500 truncate">Squad Members</span>
          </span>

          <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 font-bold shrink-0">
            <Zap size={13} className="fill-amber-400/30" /> Active
          </span>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          {isMember ? (
            <button
              type="button"
              onClick={() => onEnter(room.id)}
              className="w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border shadow-md"
              style={{
                background: "var(--accent-glow)",
                borderColor: "var(--accent)",
                color: "var(--accent)",
              }}
            >
              Enter Squad Hub <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onJoin(room)}
              disabled={joining === room.id}
              className="relative w-full py-3.5 rounded-2xl text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 bg-gradient-to-r from-[#FF00C8] via-purple-600 to-[#00F0FF] hover:brightness-110 shadow-lg shadow-[#FF00C8]/25 overflow-hidden"
            >
              {/* Shine sweep on hover */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
              <span className="relative">
                {joining === room.id
                  ? "Joining Squad..."
                  : "Commit & Join Squad →"}
              </span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RoomCard;
