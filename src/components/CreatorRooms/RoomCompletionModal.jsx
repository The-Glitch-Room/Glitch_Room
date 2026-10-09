import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  CheckCircle2,
  Award,
  Sparkles,
  Calendar,
  Flame,
  Clock,
  Coins,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  X,
  Compass,
  Archive,
  Crown,
} from "lucide-react";

/**
 * RoomCompletionModal
 * Polished, theme-matching modal shown when someone views a completed Creator Room.
 * Adapts experience for:
 * 1. Member of Staked Room (shows stake amount, verified payout outcome, participation stats)
 * 2. Member of Free Room (shows completion status, goal outcome, participation stats — NO stake info)
 * 3. Non-Member / Guest (simple completion message, public overview, "Explore Other Rooms" CTA, NO private info)
 */
const RoomCompletionModal = ({
  isOpen,
  onClose,
  room,
  userId,
  isMember,
  isHost,
  userMemberRecord,
  userStats = {},
  squadStats = {},
  onExploreOther,
  onSettleRoom,
  isSettling = false,
}) => {
  if (!isOpen || !room) return null;

  const roomName = room.name || room.title || "Creator Room";
  const category = room.category || "Sprint";
  const totalDays = userStats.totalSprintDays || 30;
  const userDays = userStats.userStandupCount || 0;
  const completionPct = userStats.completionPct ?? Math.min(100, Math.round((userDays / totalDays) * 100));
  const streak = userStats.streak || 0;
  const onTimeCount = userStats.onTimeCount || 0;
  const isGoalAchieved = completionPct >= 80;

  // Staked Room Detection
  const roomEntryStake = Number(room.entry_stake || 0);
  const userStaked = Number(userMemberRecord?.staked_amount || 0);
  const userCarryover = Number(userMemberRecord?.forfeited_carryover || 0);
  const isStakedRoom = Boolean(
    room.enable_gbits_stake &&
    (roomEntryStake > 0 || userStaked > 0 || userCarryover > 0)
  );

  const originalStake = userStaked > 0 ? userStaked : (userCarryover > 0 ? userCarryover : roomEntryStake);
  const payoutStatus = userMemberRecord?.payout_status || "pending";
  const payoutAmount = userMemberRecord?.payout_amount !== undefined && userMemberRecord?.payout_amount !== null
    ? Number(userMemberRecord.payout_amount)
    : null;
  const isSettled = Boolean(room.settled || userMemberRecord?.settled_at);
  const completionReward = Number(room.completion_reward || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 320 }}
        className="bg-[#0b0b14] border border-white/15 rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Ambient Top Glows */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#FF00C8]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-[#00F0FF]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-6 pb-4 relative z-10 flex items-start justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg ${
                !isMember
                  ? "bg-cyan-500/15 border-cyan-500/40 text-[#00F0FF]"
                  : isGoalAchieved
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                  : "bg-purple-500/15 border-purple-500/40 text-purple-300"
              }`}
            >
              {!isMember ? (
                <CheckCircle2 size={24} />
              ) : isGoalAchieved ? (
                <Trophy size={24} />
              ) : (
                <Award size={24} />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  🏁 Room Completed
                </span>
                {isHost && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Crown size={10} /> Room Host
                  </span>
                )}
                {isMember && !isHost && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Squad Member
                  </span>
                )}
              </div>

              <h2 className="text-lg font-bold text-white mt-1 leading-snug line-clamp-1">
                {roomName}
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                {category} • {totalDays} Days Sprint
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer shrink-0"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 relative z-10 font-sans text-xs flex-1">
          {/* ========================================================= */}
          {/* PERSONA 1: NON-MEMBER EXPERIENCE                          */}
          {/* ========================================================= */}
          {!isMember ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/30 via-[#0d0d18] to-cyan-900/30 border border-white/10">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Sparkles size={16} className="text-[#00F0FF]" />
                  This room has ended. Ready for your next challenge?
                </h3>
                <p className="text-gray-300 leading-relaxed font-sans text-xs">
                  This Creator Room sprint has officially reached its completion
                  date. Check-ins are now closed, but you can explore other
                  active creator rooms to commit to a daily consistency sprint
                  and earn gBits.
                </p>
              </div>

              {/* Public Safe Summary Grid */}
              <div className="grid grid-cols-3 gap-3 font-mono text-center">
                <div className="p-3 rounded-2xl bg-[#07070d] border border-white/5">
                  <span className="text-[10px] text-gray-500 uppercase block mb-1">
                    Duration
                  </span>
                  <span className="text-white font-bold text-sm">
                    {totalDays} Days
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#07070d] border border-white/5">
                  <span className="text-[10px] text-gray-500 uppercase block mb-1">
                    Builders
                  </span>
                  <span className="text-[#00F0FF] font-bold text-sm">
                    {squadStats.totalMembers || 1}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#07070d] border border-white/5">
                  <span className="text-[10px] text-gray-500 uppercase block mb-1">
                    Standup Logs
                  </span>
                  <span className="text-purple-300 font-bold text-sm">
                    {squadStats.totalStandups || 0}
                  </span>
                </div>
              </div>

              {completionReward > 0 && (
                <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-300 flex items-center gap-1.5">
                    <Trophy size={14} className="text-pink-400" /> Completion Pool
                  </span>
                  <span className="text-pink-300 font-bold">
                    +{completionReward} gBits Bonus
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* ========================================================= */
            /* PERSONA 2 & 3: MEMBER EXPERIENCE (FREE & STAKED)          */
            /* ========================================================= */
            <div className="space-y-4">
              {/* Highlight Outcome Banner */}
              <div
                className={`p-4 rounded-2xl border ${
                  isGoalAchieved
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-purple-500/10 border-purple-500/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {isGoalAchieved ? (
                    <Trophy size={16} className="text-emerald-400 shrink-0" />
                  ) : (
                    <Award size={16} className="text-purple-300 shrink-0" />
                  )}
                  <h3
                    className={`text-xs font-bold font-mono uppercase tracking-wide ${
                      isGoalAchieved ? "text-emerald-300" : "text-purple-200"
                    }`}
                  >
                    {isGoalAchieved
                      ? "Sprint Target Achieved (≥80% Consistency)"
                      : `Sprint Concluded (${completionPct}% Consistency)`}
                  </h3>
                </div>

                <p className="text-gray-300 leading-relaxed font-sans text-xs">
                  {isGoalAchieved
                    ? `Outstanding commitment! You logged ${userDays} of ${totalDays} days (${completionPct}% completion rate), successfully reaching the sprint consistency requirement.`
                    : `You completed ${userDays} of ${totalDays} sprint days (${completionPct}% completion). Keep your momentum alive in the next sprint challenge!`}
                </p>
              </div>

              {/* User Participation Stats Grid */}
              <div>
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Your Participation & Statistics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-center">
                  <div className="p-3 rounded-2xl bg-[#07070d] border border-white/5">
                    <span className="text-[9px] text-gray-500 uppercase block mb-1">
                      Days Completed
                    </span>
                    <span className="text-white font-bold text-sm">
                      {userDays} / {totalDays}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#07070d] border border-white/5">
                    <span className="text-[9px] text-gray-500 uppercase block mb-1">
                      Completion Rate
                    </span>
                    <span
                      className={`font-bold text-sm ${
                        isGoalAchieved ? "text-emerald-400" : "text-purple-300"
                      }`}
                    >
                      {completionPct}%
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#07070d] border border-white/5">
                    <span className="text-[9px] text-gray-500 uppercase block mb-1">
                      Best Streak
                    </span>
                    <span className="text-amber-400 font-bold text-sm flex items-center justify-center gap-1">
                      <Flame size={13} /> {streak}d
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#07070d] border border-white/5">
                    <span className="text-[9px] text-gray-500 uppercase block mb-1">
                      On-Time Logs
                    </span>
                    <span className="text-cyan-400 font-bold text-sm">
                      {onTimeCount}
                    </span>
                  </div>
                </div>

                {/* Progress Visual Bar with 80% Target Line */}
                <div className="mt-3 bg-[#07070d] border border-white/5 p-3 rounded-2xl space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-gray-400">Sprint Target (80%)</span>
                    <span
                      className={
                        isGoalAchieved ? "text-emerald-400 font-bold" : "text-gray-400 font-bold"
                      }
                    >
                      {completionPct}% / 80%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isGoalAchieved
                          ? "bg-gradient-to-r from-emerald-500 to-[#00F0FF]"
                          : "bg-gradient-to-r from-purple-500 to-pink-500"
                      }`}
                      style={{ width: `${Math.min(100, completionPct)}%` }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white/80"
                      style={{ left: "80%" }}
                      title="80% Target Line"
                    />
                  </div>
                </div>
              </div>

              {/* ======================================================= */}
              {/* STAKED ROOM: FINANCIAL & VERIFIED REWARD SUMMARY        */}
              {/* ======================================================= */}
              {isStakedRoom ? (
                <div className="space-y-2.5 pt-1">
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Coins size={13} className="text-amber-400" /> Stake & Reward Outcome
                  </h4>

                  <div className="p-4 rounded-2xl bg-[#07070d] border border-amber-500/20 space-y-3 font-mono">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <span className="text-gray-400 text-xs">Original Entry Stake:</span>
                      <span className="text-amber-300 font-bold text-xs flex items-center gap-1">
                        <Coins size={13} /> {originalStake} gBits
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <span className="text-gray-400 text-xs">Payout Status:</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          payoutStatus === "paid"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : payoutStatus === "refunded"
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : payoutStatus === "forfeited"
                            ? "bg-red-500/20 text-red-300 border border-red-500/40"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        }`}
                      >
                        {payoutStatus === "paid"
                          ? "✅ Paid & Settled"
                          : payoutStatus === "refunded"
                          ? "↩️ Refunded"
                          : payoutStatus === "forfeited"
                          ? "⚠️ Forfeited"
                          : "⏳ Pending Settlement"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <span className="text-gray-400 text-xs">Reward / Stake Return:</span>
                      <span className="font-bold text-xs">
                        {payoutStatus === "paid" ? (
                          <span className="text-emerald-400">
                            +{payoutAmount !== null ? payoutAmount : originalStake} gBits
                          </span>
                        ) : payoutStatus === "refunded" ? (
                          <span className="text-cyan-300">
                            {originalStake} gBits (Refunded)
                          </span>
                        ) : payoutStatus === "forfeited" ? (
                          <span className="text-red-400">0 gBits (Forfeited)</span>
                        ) : (
                          <span className="text-amber-300">
                            {isGoalAchieved
                              ? `Eligible: ${originalStake} gBits + bonus`
                              : "Pending Settlement"}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Verified Outcome Summary Narrative */}
                    <div className="pt-1 text-[11px] leading-relaxed text-gray-300 font-sans">
                      {payoutStatus === "paid" ? (
                        <span>
                          Your original stake of <strong>{originalStake} gBits</strong> was returned
                          alongside your share of the room completion pool.
                        </span>
                      ) : payoutStatus === "forfeited" ? (
                        <span>
                          Because consistency was below the 80% threshold or the squad was left early,
                          the entry stake was forfeited into the squad prize pool.
                        </span>
                      ) : payoutStatus === "refunded" ? (
                        <span>
                          Your entry stake of <strong>{originalStake} gBits</strong> was returned to
                          your account.
                        </span>
                      ) : isGoalAchieved ? (
                        <span>
                          You achieved <strong>{completionPct}% consistency</strong> (≥80% required).
                          Your stake return and reward share will be distributed upon room settlement.
                        </span>
                      ) : (
                        <span>
                          Your completion rate was <strong>{completionPct}%</strong> (target was 80%).
                          Final pool distribution will be recorded upon settlement.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* ======================================================= */
                /* FREE ROOM: SPRINT BONUS SUMMARY                         */
                /* ======================================================= */
                completionReward > 0 && (
                  <div className="p-3.5 rounded-2xl bg-[#07070d] border border-pink-500/20 flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2">
                      <Trophy size={16} className="text-pink-400" />
                      <div>
                        <span className="text-white text-xs font-bold block">
                          Sprint Completion Reward
                        </span>
                        <span className="text-[10px] text-gray-400 font-sans">
                          {isGoalAchieved
                            ? "Awarded for achieving ≥80% consistency!"
                            : "Requires ≥80% consistency"}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`font-bold text-xs ${
                        isGoalAchieved ? "text-pink-300" : "text-gray-500"
                      }`}
                    >
                      +{completionReward} gBits
                    </span>
                  </div>
                )
              )}
            </div>
          )}

          {/* Host Settlement Action Banner */}
          {isHost && !room.settled && (
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-[#FF00C8]/10 border border-amber-500/30 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <Crown size={20} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                    Host Action: Finalize & Settle Room
                  </h4>
                  <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
                    This sprint has ended. As room host, you can finalize the results to distribute stakes, completion rewards, and pool shares to eligible finishers (≥80% consistency).
                  </p>
                </div>
              </div>

              <button
                onClick={onSettleRoom}
                disabled={isSettling}
                className={`w-full py-2.5 px-4 rounded-xl font-bold font-mono text-xs transition flex items-center justify-center gap-2 shadow-lg ${
                  isSettling
                    ? "bg-amber-600/50 text-white cursor-wait opacity-80"
                    : "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-amber-500/25 cursor-pointer font-black"
                }`}
              >
                {isSettling ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full"
                    />
                    <span>Settling Room & Distributing Rewards...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>⚡ Finalize & Settle Room Payouts</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-6 pt-4 border-t border-white/10 bg-[#07070d]/60 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-bold font-mono transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Archive size={14} /> View Room Archive
          </button>

          <button
            onClick={() => {
              onClose();
              if (onExploreOther) onExploreOther();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF00C8] to-purple-600 hover:from-[#FF00C8] hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Compass size={14} /> Explore Other Rooms <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RoomCompletionModal;
