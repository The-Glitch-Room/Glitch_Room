import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  X,
  Crown,
  Sparkles,
  Calendar,
  Zap,
  CheckCircle,
  Flame,
  Award,
  UserCheck,
} from "lucide-react";

const getWeekLabel = () => {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
};

const MemberAvatar = ({ profile, size = 10 }) => {
  const name = profile?.username || profile?.full_name || "?";
  const initials = name.slice(0, 2).toUpperCase();
  return profile?.avatar_url ? (
    <img
      src={profile.avatar_url}
      alt={name}
      className={`w-${size} h-${size} rounded-xl object-cover ring-1 ring-white/10 shrink-0`}
    />
  ) : (
    <div
      className={`w-${size} h-${size} rounded-xl flex items-center justify-center text-xs font-black ring-1 ring-white/10 shrink-0`}
      style={{
        background: "linear-gradient(135deg,#FF00C822,#00F0FF22)",
        color: "#00F0FF",
      }}
    >
      {initials}
    </div>
  );
};

const RoomLeaderboardModal = ({
  isOpen,
  onClose,
  roomName,
  members = [],
  checkins = [],
  activity = [],
  currentUserId,
}) => {
  const [timeframe, setTimeframe] = useState("week"); // 'week' or 'all'
  const currentWeek = getWeekLabel();

  if (!isOpen) return null;

  // Filter checkins by timeframe
  const filteredCheckins =
    timeframe === "week"
      ? checkins.filter((c) => c.week_label === currentWeek)
      : checkins;

  // Aggregate room points per user
  const userStatsMap = {};

  // Initialize all members
  members.forEach((m) => {
    const uId = m.user_id;
    userStatsMap[uId] = {
      user_id: uId,
      profile: m.profiles || { username: "Member" },
      gbits: 0,
      completedCheckins: 0,
      joined_at: m.joined_at,
    };
  });

  // Calculate completed check-ins count
  filteredCheckins.forEach((c) => {
    const uId = c.user_id;
    if (!userStatsMap[uId]) {
      userStatsMap[uId] = {
        user_id: uId,
        profile: c.profiles || { username: "Member" },
        gbits: 0,
        completedCheckins: 0,
        joined_at: c.created_at,
      };
    }
    if (c.did_complete) {
      userStatsMap[uId].completedCheckins += 1;
    }
  });

  if (timeframe === "all") {
    // "All-Time": Display member's canonical user_points master wallet balance
    members.forEach((m) => {
      const uId = m.user_id;
      if (userStatsMap[uId]) {
        userStatsMap[uId].gbits = m.profiles?.points || m.user_points || userStatsMap[uId].gbits || 0;
      }
    });
  } else {
    // "This Week": 10 gBits per weekly completed check-in + room activities (excluding checkin activity rows)
    filteredCheckins.forEach((c) => {
      const uId = c.user_id;
      if (c.did_complete && userStatsMap[uId]) {
        userStatsMap[uId].gbits += 10;
      }
    });

    const filteredActivities = activity.filter((a) => {
      if (!a.created_at) return true;
      const diffDays =
        (Date.now() - new Date(a.created_at)) / (1000 * 3600 * 24);
      return diffDays <= 7;
    });

    filteredActivities.forEach((act) => {
      const uId = act.user_id;
      if (userStatsMap[uId] && act.type !== "checkin") {
        userStatsMap[uId].gbits += act.points || 0;
      }
    });
  }

  // Sort descending by gBits, then completed check-ins
  const rankedList = Object.values(userStatsMap).sort((a, b) => {
    if (b.gbits !== a.gbits) return b.gbits - a.gbits;
    return b.completedCheckins - a.completedCheckins;
  });

  const top20 = rankedList.slice(0, 20);
  const top3 = top20.slice(0, 3);
  const restRanked = top20.slice(3);

  // Find current logged-in user rank
  const myRankIndex = rankedList.findIndex((u) => u.user_id === currentUserId);
  const myRankNumber = myRankIndex !== -1 ? myRankIndex + 1 : null;
  const myData = myRankIndex !== -1 ? rankedList[myRankIndex] : null;
  const cutoffScore = top20.length >= 20 ? top20[19].gbits : 0;
  const gbitsToTop20 =
    myData && myRankNumber > 20 ? Math.max(1, cutoffScore - myData.gbits + 1) : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-[#0b0b14] border border-purple-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)] flex flex-col max-h-[85vh]"
        >
          {/* Header Banner */}
          <div className="relative p-6 border-b border-white/10 bg-gradient-to-r from-purple-900/30 via-[#0d0d18] to-pink-900/20 shrink-0">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Trophy size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Room Leaderboard
                </h2>
                <p className="text-xs text-purple-300 font-medium">
                  {roomName} • Top Contributors
                </p>
              </div>
            </div>

            {/* Timeframe Toggles */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2 bg-[#06060c] p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setTimeframe("week")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    timeframe === "week"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => setTimeframe("all")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    timeframe === "all"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  All-Time
                </button>
              </div>

              <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
                Top 20 Members
              </span>
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
            {/* ── TOP 3 PODIUM ──────────────────────────────────────────────── */}
            {top3.length > 0 && (
              <div className="grid grid-cols-3 gap-3 items-end pt-2 pb-4 border-b border-white/5">
                {/* Rank #2 (Silver) */}
                {top3[1] ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center bg-[#121220] border border-gray-400/30 rounded-2xl p-4 text-center relative"
                  >
                    <div className="absolute -top-3 px-2 py-0.5 rounded-full bg-gray-500/20 border border-gray-400/40 text-gray-300 text-[10px] font-black flex items-center gap-1">
                      🥈 #2
                    </div>
                    <MemberAvatar profile={top3[1].profile} size={10} />
                    <p className="text-xs font-bold text-white mt-2 truncate w-full">
                      {top3[1].profile?.username || "Member"}
                    </p>
                    <p className="text-xs font-mono font-bold text-gray-300 mt-1">
                      {top3[1].gbits} gBits
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {top3[1].completedCheckins} check-ins
                    </p>
                  </motion.div>
                ) : (
                  <div />
                )}

                {/* Rank #1 (Gold) */}
                {top3[0] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center bg-gradient-to-b from-amber-500/20 via-[#161426] to-[#121220] border border-amber-500/40 rounded-2xl p-5 text-center relative shadow-[0_0_25px_rgba(245,158,11,0.2)] -translate-y-2"
                  >
                    <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-amber-500/30 border border-amber-400/50 text-amber-300 text-xs font-black flex items-center gap-1">
                      <Crown size={12} className="text-amber-300" /> #1 Champion
                    </div>
                    <MemberAvatar profile={top3[0].profile} size={12} />
                    <p className="text-sm font-black text-white mt-2 truncate w-full">
                      {top3[0].profile?.username || "Champion"}
                    </p>
                    <p className="text-sm font-mono font-bold text-amber-400 mt-1">
                      {top3[0].gbits} gBits
                    </p>
                    <p className="text-[10px] text-amber-300/70 mt-0.5 font-semibold">
                      {top3[0].completedCheckins} check-ins
                    </p>
                  </motion.div>
                )}

                {/* Rank #3 (Bronze) */}
                {top3[2] ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center bg-[#121220] border border-amber-700/30 rounded-2xl p-4 text-center relative"
                  >
                    <div className="absolute -top-3 px-2 py-0.5 rounded-full bg-amber-800/20 border border-amber-700/40 text-amber-400 text-[10px] font-black flex items-center gap-1">
                      🥉 #3
                    </div>
                    <MemberAvatar profile={top3[2].profile} size={10} />
                    <p className="text-xs font-bold text-white mt-2 truncate w-full">
                      {top3[2].profile?.username || "Member"}
                    </p>
                    <p className="text-xs font-mono font-bold text-amber-500 mt-1">
                      {top3[2].gbits} gBits
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {top3[2].completedCheckins} check-ins
                    </p>
                  </motion.div>
                ) : (
                  <div />
                )}
              </div>
            )}

            {/* ── RANKS #4 TO #20 LIST ───────────────────────────────────────── */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Ranked Members
              </p>

              {rankedList.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-xs border border-dashed border-white/10 rounded-2xl">
                  No activity recorded for this room yet.
                </div>
              ) : (
                restRanked.map((user, idx) => {
                  const rank = idx + 4;
                  const isMe = user.user_id === currentUserId;

                  return (
                    <motion.div
                      key={user.user_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                        isMe
                          ? "bg-purple-600/20 border-purple-500/40 shadow-sm"
                          : "bg-[#12121f] border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 text-center text-xs font-black text-gray-500 shrink-0">
                          #{rank}
                        </span>
                        <MemberAvatar profile={user.profile} size={8} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                            {user.profile?.username || "Member"}
                            {isMe && (
                              <span className="text-[9px] font-black bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded uppercase">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {user.completedCheckins} check-ins completed
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/10 px-3 py-1 rounded-xl border border-purple-500/20 shrink-0">
                        {user.gbits} gBits
                      </span>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── PINNED CURRENT USER RANK FOOTER ───────────────────────────────── */}
          {myData && (
            <div className="p-4 bg-[#080810] border-t border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <MemberAvatar profile={myData.profile} size={8} />
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    Your Room Rank:{" "}
                    <span className="text-purple-400 font-black">
                      #{myRankNumber}
                    </span>
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {myData.gbits} gBits • {myData.completedCheckins} check-ins
                  </p>
                </div>
              </div>

              {myRankNumber > 20 && gbitsToTop20 > 0 ? (
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                  +{gbitsToTop20} gBits to Top 20 🔥
                </span>
              ) : (
                <span className="text-xs font-bold text-green-400 bg-green-500/10 px-3 py-1.5 rounded-xl border border-green-500/20">
                  In Top 20! 🌟
                </span>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RoomLeaderboardModal;
