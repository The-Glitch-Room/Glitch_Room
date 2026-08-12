import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";

const RARITY_STYLE = {
  common: {
    label: "Common",
    color: "#9ca3af",
    glow: "rgba(156,163,175,0.15)",
    border: "rgba(156,163,175,0.2)",
  },
  rare: {
    label: "Rare",
    color: "#00F0FF",
    glow: "rgba(0,240,255,0.15)",
    border: "rgba(0,240,255,0.25)",
  },
  epic: {
    label: "Epic",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.15)",
    border: "rgba(168,85,247,0.25)",
  },
  legendary: {
    label: "Legendary",
    color: "#FFD700",
    glow: "rgba(255,215,0,0.18)",
    border: "rgba(255,215,0,0.3)",
  },
};

const CATEGORIES = [
  "all",
  "streak",
  "volume",
  "type",
  "xp",
  "social",
  "special",
];

const BadgeCard = ({ badge, earned, earnedAt, index }) => {
  const r = RARITY_STYLE[badge.rarity] || RARITY_STYLE.common;
  const date = earnedAt
    ? new Date(earnedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.35 }}
      whileHover={earned ? { y: -4, scale: 1.02 } : {}}
      className="relative rounded-2xl p-4 flex flex-col items-center text-center transition-all overflow-hidden"
      style={{
        background: earned ? `rgba(15,15,19,1)` : "rgba(10,10,14,1)",
        border: `1px solid ${earned ? r.border : "rgba(255,255,255,0.05)"}`,
        boxShadow: earned ? `0 0 20px ${r.glow}` : "none",
        opacity: earned ? 1 : 0.45,
        filter: earned ? "none" : "grayscale(1)",
      }}
    >
      {/* Rarity top line */}
      {earned && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${r.color}, transparent)`,
          }}
        />
      )}

      {/* Lock overlay */}
      {!earned && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10 rounded-2xl"
          style={{ background: "rgba(0,0,0,0.25)" }}
        >
          <span className="text-gray-600 text-lg">🔒</span>
        </div>
      )}

      {/* Icon */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-3 mt-1"
        style={{
          background: earned ? `${r.color}18` : "rgba(255,255,255,0.03)",
          border: `1px solid ${earned ? r.color + "30" : "rgba(255,255,255,0.05)"}`,
          boxShadow: earned ? `0 0 14px ${r.glow}` : "none",
        }}
      >
        {badge.icon}
      </div>

      {/* Title */}
      <p className="font-black text-sm text-white mb-1 leading-tight">
        {badge.title}
      </p>

      {/* Description */}
      <p className="text-gray-500 text-[10px] leading-relaxed mb-2">
        {badge.description}
      </p>

      {/* Rarity chip */}
      <span
        className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mt-auto"
        style={{
          color: r.color,
          background: `${r.color}18`,
          border: `1px solid ${r.color}30`,
        }}
      >
        {r.label}
      </span>

      {/* Earned date */}
      {earned && date && (
        <p className="text-[9px] text-gray-600 mt-1.5">Earned {date}</p>
      )}
    </motion.div>
  );
};

export default function BadgesSection({ userId }) {
  const [badges, setBadges] = useState([]);
  const [userMap, setUserMap] = useState({}); // badgeId → earned_at
  const [filter, setFilter] = useState("all");
  const [rarFilter, setRarFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const uid = userId || (await supabase.auth.getUser()).data?.user?.id;
      if (!uid) {
        setLoading(false);
        return;
      }

      const [{ data: all }, { data: earned }] = await Promise.all([
        supabase.from("badges").select("*").order("rarity"),
        supabase
          .from("user_badges")
          .select("badge_id, earned_at")
          .eq("user_id", uid),
      ]);

      setBadges(all || []);
      const m = {};
      (earned || []).forEach((e) => {
        m[e.badge_id] = e.earned_at;
      });
      setUserMap(m);
      setLoading(false);
    })();
  }, [userId]);

  const filtered = badges.filter((b) => {
    const catOk = filter === "all" || b.category === filter;
    const rarOk = rarFilter === "all" || b.rarity === rarFilter;
    return catOk && rarOk;
  });

  // Sort: earned first, then by rarity weight
  const rarityWeight = { legendary: 0, epic: 1, rare: 2, common: 3 };
  const sorted = [...filtered].sort((a, b) => {
    const aE = userMap[a.id] ? 0 : 1;
    const bE = userMap[b.id] ? 0 : 1;
    if (aE !== bE) return aE - bE;
    return rarityWeight[a.rarity] - rarityWeight[b.rarity];
  });

  const earnedCount = badges.filter((b) => userMap[b.id]).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Badges</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            {earnedCount} / {badges.length} unlocked
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex-1 max-w-[200px]">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: badges.length
                  ? `${(earnedCount / badges.length) * 100}%`
                  : "0%",
              }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg,#FF00C8,#00F0FF)" }}
            />
          </div>
          <p className="text-[9px] text-gray-600 mt-1 text-right">
            {badges.length
              ? Math.round((earnedCount / badges.length) * 100)
              : 0}
            % complete
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-3">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition cursor-pointer"
            style={
              filter === c
                ? {
                    background: "rgba(255,0,200,0.12)",
                    borderColor: "rgba(255,0,200,0.35)",
                    color: "#FF00C8",
                  }
                : {
                    background: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.07)",
                    color: "#6b7280",
                  }
            }
          >
            {c === "all"
              ? "All"
              : c === "xp"
                ? "gBits"
                : c === "type"
                  ? "By Type"
                  : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Rarity filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "common", "rare", "epic", "legendary"].map((r) => {
          const style = r === "all" ? { color: "#9ca3af" } : RARITY_STYLE[r];
          return (
            <button
              key={r}
              onClick={() => setRarFilter(r)}
              className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition cursor-pointer"
              style={
                rarFilter === r
                  ? {
                      background: `${style.color}18`,
                      borderColor: `${style.color}40`,
                      color: style.color,
                    }
                  : {
                      background: "transparent",
                      borderColor: "rgba(255,255,255,0.06)",
                      color: "#4b5563",
                    }
              }
            >
              {r}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-t-transparent border-[#FF00C8] rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-600 text-sm">
          No badges in this category.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {sorted.map((badge, i) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              earned={!!userMap[badge.id]}
              earnedAt={userMap[badge.id]}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
