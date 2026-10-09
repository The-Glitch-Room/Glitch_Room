import { supabase } from "../supabaseClient";
import { updatePoints } from "../utils/pointsHelper";

const IST_TIME_ZONE = "Asia/Kolkata";

/**
 * Returns "YYYY-MM-DD" calendar-date key for a timestamp, always evaluated in IST.
 */
export const getISTDateKey = (input) => {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
};

/**
 * Returns calendar day difference in IST between two timestamps (toInput - fromInput).
 */
export const diffISTCalendarDays = (fromInput, toInput) => {
  const fromKey = getISTDateKey(fromInput);
  const toKey = getISTDateKey(toInput);
  if (!fromKey || !toKey) return 0;
  const [fy, fm, fd] = fromKey.split("-").map(Number);
  const [ty, tm, td] = toKey.split("-").map(Number);
  const fromUTC = Date.UTC(fy, fm - 1, fd);
  const toUTC = Date.UTC(ty, tm - 1, td);
  return Math.round((toUTC - fromUTC) / (1000 * 60 * 60 * 24));
};

/**
 * Calculates total planned sprint duration in days.
 */
export const getRoomTotalSprintDays = (room) => {
  if (!room) return 30;
  if (room.duration_type === "ongoing") return 365;
  if (room.duration_type === "7_day") return 7;
  if (room.duration_type === "14_day") return 14;
  if (room.duration_type === "30_day") return 30;
  if (room.duration_type === "60_day") return 60;
  if (room.duration_type === "100_day") return 100;
  if (room.duration_days) return Number(room.duration_days);
  const match = String(room.duration_type || "").match(/\d+/);
  if (match) return parseInt(match[0], 10);
  if (room.end_date && room.start_date && room.end_date !== room.start_date) {
    const diff = Math.round((new Date(room.end_date) - new Date(room.start_date)) / 86400000);
    if (diff > 0) return diff;
  }
  return 30;
};

/**
 * Determines whether a Creator Room has ended or reached completion.
 */
export const checkIsCreatorRoomCompleted = (room) => {
  if (!room) return false;
  if (room.settled) return true;
  if (room.duration_type === "ongoing") return false;

  const start = room.start_date || room.created_at;
  if (!start) return false;
  const dDiff = diffISTCalendarDays(start, new Date());
  if (dDiff < 0) return false; // upcoming room

  const totDays = getRoomTotalSprintDays(room);
  if ((dDiff + 1) > totDays) return true;
  if (room.end_date && room.start_date && room.end_date !== room.start_date && new Date(room.end_date) < new Date()) {
    return true;
  }
  return false;
};

/**
 * Pure calculation helper to evaluate room settlement figures.
 * Computes eligibility (>=80% consistency), forfeited pool, and payouts per member.
 */
export const calculateRoomSettlement = ({ room, members = [], checkins = [] }) => {
  if (!room) {
    return {
      isStakedRoom: false,
      entryStake: 0,
      completionReward: 0,
      totalSprintDays: 30,
      totalForfeitedPool: 0,
      forfeitedBonusPerWinner: 0,
      winners: [],
      ineligibles: [],
      payouts: [],
    };
  }

  const totalSprintDays = getRoomTotalSprintDays(room);
  const entryStake = Number(room.entry_stake || 0);
  const completionReward = Number(room.completion_reward || 0);
  const isStakedRoom = Boolean(room.enable_gbits_stake && entryStake > 0);

  // Group unique IST check-in dates by user
  const userDateKeySets = new Map();
  (checkins || []).forEach((c) => {
    if (!c.user_id || !c.created_at) return;
    const key = getISTDateKey(c.created_at);
    if (!key) return;
    if (!userDateKeySets.has(c.user_id)) {
      userDateKeySets.set(c.user_id, new Set());
    }
    userDateKeySets.get(c.user_id).add(key);
  });

  // Calculate consistency and eligibility for all members
  const memberEvaluations = (members || []).map((m) => {
    const dateKeys = userDateKeySets.get(m.user_id) || new Set();
    const loggedDaysCount = dateKeys.size;
    const consistencyPct = totalSprintDays > 0
      ? Math.min(100, Math.round((loggedDaysCount / totalSprintDays) * 100))
      : 0;

    const hasLeft = Boolean(m.left_at);
    // Eligibility threshold: at least 80% consistency and didn't abandon the room
    const isEligible = !hasLeft && consistencyPct >= 80;

    return {
      ...m,
      loggedDaysCount,
      consistencyPct,
      hasLeft,
      isEligible,
    };
  });

  const winners = memberEvaluations.filter((m) => m.isEligible);
  const ineligibles = memberEvaluations.filter((m) => !m.isEligible);

  // Pool calculation:
  // Forfeited stakes include carryovers from previous leaves + stakes of members who did not reach 80%
  let totalForfeitedPool = 0;
  memberEvaluations.forEach((m) => {
    totalForfeitedPool += Number(m.forfeited_carryover || 0);
    if (!m.isEligible) {
      totalForfeitedPool += Number(m.staked_amount || 0);
    }
  });

  const forfeitedBonusPerWinner = winners.length > 0 && isStakedRoom
    ? Math.floor(totalForfeitedPool / winners.length)
    : 0;

  const payouts = [];

  winners.forEach((w) => {
    const originalStake = Number(w.staked_amount || 0);
    const totalPayout = isStakedRoom
      ? originalStake + completionReward + forfeitedBonusPerWinner
      : completionReward;

    payouts.push({
      userId: w.user_id,
      memberRecordId: w.id,
      status: "paid",
      originalStake,
      completionReward,
      forfeitedBonus: forfeitedBonusPerWinner,
      totalPayout,
      loggedDaysCount: w.loggedDaysCount,
      consistencyPct: w.consistencyPct,
    });
  });

  ineligibles.forEach((ineligible) => {
    const originalStake = Number(ineligible.staked_amount || 0);
    const currentCarryover = Number(ineligible.forfeited_carryover || 0);
    payouts.push({
      userId: ineligible.user_id,
      memberRecordId: ineligible.id,
      status: "forfeited",
      originalStake,
      newCarryover: currentCarryover + originalStake,
      completionReward: 0,
      forfeitedBonus: 0,
      totalPayout: 0,
      loggedDaysCount: ineligible.loggedDaysCount,
      consistencyPct: ineligible.consistencyPct,
    });
  });

  return {
    isStakedRoom,
    entryStake,
    completionReward,
    totalSprintDays,
    totalForfeitedPool,
    forfeitedBonusPerWinner,
    winners,
    ineligibles,
    payouts,
  };
};

/**
 * Executes room settlement, updates members' payout status, credits rewards to winners,
 * and marks the room as settled.
 *
 * @param {string} roomId
 * @param {string} callerUserId - Current user ID attempting settlement
 * @returns {Promise<{ success: boolean, alreadySettled?: boolean, error?: string, message?: string, summary?: object }>}
 */
export const settleCreatorRoom = async (roomId, callerUserId) => {
  if (!roomId) {
    return { success: false, error: "Missing room ID." };
  }

  try {
    // 1. Fetch Room record
    const { data: room, error: roomErr } = await supabase
      .from("creator_rooms")
      .select("*")
      .eq("id", roomId)
      .maybeSingle();

    if (roomErr || !room) {
      return { success: false, error: "Creator Room not found in database." };
    }

    // 2. Idempotency Check: Don't process twice
    if (room.settled) {
      return {
        success: true,
        alreadySettled: true,
        message: "This Creator Room has already been finalized and settled.",
      };
    }

    // 3. Authorization Check: Host only
    if (callerUserId && room.created_by && room.created_by !== callerUserId) {
      return {
        success: false,
        error: "Only the Creator Room host can finalize and settle this room.",
      };
    }

    // 4. Room Completion Lifecycle Check
    if (!checkIsCreatorRoomCompleted(room)) {
      return {
        success: false,
        error: "This room is still active and has not reached its end date yet.",
      };
    }

    // 5. Fetch Members & Check-ins
    const { data: members, error: memErr } = await supabase
      .from("creator_room_members")
      .select("*")
      .eq("room_id", roomId);

    if (memErr) {
      return { success: false, error: "Failed to fetch room members." };
    }

    const { data: checkins, error: checkinErr } = await supabase
      .from("creator_room_checkins")
      .select("id, user_id, created_at")
      .eq("room_id", roomId);

    if (checkinErr) {
      return { success: false, error: "Failed to fetch room check-ins." };
    }

    // 6. Calculate settlement figures
    const settlement = calculateRoomSettlement({ room, members, checkins });
    const nowIso = new Date().toISOString();
    const roomTitle = room.name || room.title || "Creator Room";

    // 7. Process member updates & payouts
    for (const p of settlement.payouts) {
      if (p.status === "paid") {
        // Update member record as paid
        await supabase
          .from("creator_room_members")
          .update({
            payout_status: "paid",
            payout_amount: p.totalPayout,
            settled_at: nowIso,
          })
          .eq("room_id", roomId)
          .eq("user_id", p.userId);

        // Credit points to winner if payout > 0
        if (p.totalPayout > 0) {
          await updatePoints(
            p.totalPayout,
            `🏆 Creator Room Winner — ${roomTitle}`,
            "reward",
            null,
            p.userId
          );
        }
      } else {
        // Ineligible member: stake is forfeited into the pool
        await supabase
          .from("creator_room_members")
          .update({
            staked_amount: 0,
            forfeited_carryover: p.newCarryover,
            payout_status: "forfeited",
            payout_amount: 0,
            settled_at: nowIso,
          })
          .eq("room_id", roomId)
          .eq("user_id", p.userId);
      }
    }

    // 8. Update room as settled
    const { error: updateRoomErr } = await supabase
      .from("creator_rooms")
      .update({
        settled: true,
        settled_at: nowIso,
      })
      .eq("id", roomId);

    if (updateRoomErr) {
      console.warn("Error updating room settled status:", updateRoomErr);
    }

    // 9. Send Room Settlement Notification to squad
    try {
      await supabase.from("creator_room_notifications").insert([
        {
          room_id: roomId,
          user_id: null, // Room-wide
          sender_id: callerUserId || null,
          type: "room_settled",
          title: "🏆 Creator Room Finalized & Settled!",
          message: settlement.winners.length > 0
            ? `Room sprint finalized! ${settlement.winners.length} consistent builder(s) (≥80%) received rewards and pool payouts.`
            : `Room sprint has ended and been settled.`,
          is_read: false,
        },
      ]);
    } catch (notifErr) {
      console.warn("Room settlement notification notice:", notifErr);
    }

    return {
      success: true,
      winnersCount: settlement.winners.length,
      totalWinners: settlement.winners.length,
      totalForfeitedPool: settlement.totalForfeitedPool,
      summary: settlement,
      message: `🎉 Room settled! ${settlement.winners.length} winner(s) received payouts.`,
    };
  } catch (err) {
    console.error("Error settling creator room:", err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred during room settlement.",
    };
  }
};
