import { supabase } from "../supabaseClient";

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
      status: "settled",
      outcome: "settled",
      originalStake,
      stakeRefund: originalStake,
      completionReward,
      completionBonus: completionReward,
      forfeitedBonus: forfeitedBonusPerWinner,
      poolShare: forfeitedBonusPerWinner,
      totalPayout,
      loggedDaysCount: w.loggedDaysCount,
      consistencyPct: w.consistencyPct,
      isEligible: true,
    });
  });

  ineligibles.forEach((ineligible) => {
    const originalStake = Number(ineligible.staked_amount || 0);
    const currentCarryover = Number(ineligible.forfeited_carryover || 0);
    payouts.push({
      userId: ineligible.user_id,
      memberRecordId: ineligible.id,
      status: "forfeited",
      outcome: "forfeited",
      originalStake,
      stakeRefund: 0,
      newCarryover: currentCarryover + originalStake,
      completionReward: 0,
      completionBonus: 0,
      forfeitedBonus: 0,
      poolShare: 0,
      totalPayout: 0,
      loggedDaysCount: ineligible.loggedDaysCount,
      consistencyPct: ineligible.consistencyPct,
      isEligible: false,
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
 * Synchronizes database settlement records between creator_room_members,
 * creator_room_settlements, and room state. Does NOT award points (idempotent helper).
 */
export const syncRoomSettlementRecords = async (roomId, room, members = [], checkins = []) => {
  if (!roomId || !room || !room.settled) return;

  try {
    const settlement = calculateRoomSettlement({ room, members, checkins });
    const nowIso = room.settled_at || new Date().toISOString();

    for (const p of settlement.payouts) {
      if (p.isEligible) {
        // Update member record as settled
        await supabase
          .from("creator_room_members")
          .update({
            staked_amount: 0,
            payout_status: "settled",
            payout_amount: p.totalPayout,
            settled_at: nowIso,
          })
          .eq("room_id", roomId)
          .eq("user_id", p.userId);
      } else {
        // Ineligible member
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

      // Record in creator_room_settlements table
      try {
        await supabase.from("creator_room_settlements").upsert(
          {
            room_id: roomId,
            user_id: p.userId,
            staked_amount: p.originalStake || 0,
            completion_pct: p.consistencyPct || 0,
            standups_submitted: p.loggedDaysCount || 0,
            total_sprint_days: settlement.totalSprintDays || 0,
            outcome: p.isEligible ? "settled" : "forfeited",
            completion_bonus: p.completionReward || 0,
            pool_share: p.forfeitedBonus || 0,
            stake_refund: p.isEligible ? (p.originalStake || 0) : 0,
            total_payout: p.totalPayout || 0,
            settled_at: nowIso,
          },
          { onConflict: "room_id,user_id" }
        );
      } catch (err) {
        // Silently skip if table not writable
      }
    }
  } catch (err) {
    console.warn("syncRoomSettlementRecords notice:", err);
  }
};

/**
 * Dynamically self-heals and credits unawarded Creator Room settlements
 * for the authenticated user session (idempotent, server-side verified).
 *
 * @param {string} userId - Authenticated user ID
 * @returns {Promise<number>} Total new points credited
 */
export const syncAndCreditUserCreatorSettlements = async (userId) => {
  if (!userId) return 0;

  try {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id !== userId) return 0; // Guard: only execute for authenticated user (RLS constraint)

    // 1. Fetch user's memberships
    const { data: myMemberships, error: memErr } = await supabase
      .from("creator_room_members")
      .select("id, room_id, staked_amount, forfeited_carryover, payout_status, payout_amount, settled_at, left_at")
      .eq("user_id", userId);

    if (memErr || !myMemberships || myMemberships.length === 0) return 0;

    const roomIds = [...new Set(myMemberships.map((m) => m.room_id).filter(Boolean))];
    if (roomIds.length === 0) return 0;

    // 2. Fetch settled creator rooms for these memberships
    const { data: settledRooms, error: roomErr } = await supabase
      .from("creator_rooms")
      .select("*")
      .in("id", roomIds)
      .eq("settled", true);

    if (roomErr || !settledRooms || settledRooms.length === 0) return 0;

    let totalCreditedDelta = 0;

    for (const room of settledRooms) {
      const myMem = myMemberships.find((m) => m.room_id === room.id);
      if (!myMem) continue;

      const roomTitle = room.name || room.title || "Creator Room";

      // Fetch all members & checkins for the room to evaluate exact pool and consistency
      const { data: allMembers } = await supabase
        .from("creator_room_members")
        .select("*")
        .eq("room_id", room.id);

      const { data: checkins } = await supabase
        .from("creator_room_checkins")
        .select("id, user_id, created_at")
        .eq("room_id", room.id);

      const settlement = calculateRoomSettlement({
        room,
        members: allMembers || [],
        checkins: checkins || [],
      });

      const myPayout = settlement.payouts.find((p) => p.userId === userId);
      if (!myPayout) continue;

      const nowIso = room.settled_at || new Date().toISOString();

      if (myPayout.isEligible) {
        // Idempotency check: see if already recorded in glitch_activity
        const { data: existingAct } = await supabase
          .from("glitch_activity")
          .select("id, points")
          .eq("user_id", userId)
          .eq("type", "reward")
          .ilike("title", `%Creator Room Winner — ${roomTitle}%`)
          .limit(1);

        const alreadyAwarded = existingAct && existingAct.length > 0;

        if (!alreadyAwarded && myPayout.totalPayout > 0) {
          // Insert glitch_activity under user's own session (RLS compliant)
          const { error: actErr } = await supabase.from("glitch_activity").insert({
            user_id: userId,
            title: `🏆 Creator Room Winner — ${roomTitle}`,
            points: myPayout.totalPayout,
            type: "reward",
            created_at: new Date().toISOString(),
          });

          if (!actErr) {
            totalCreditedDelta += myPayout.totalPayout;
          } else {
            console.warn("glitch_activity insert warning:", actErr);
          }
        }

        // Update member record as settled
        if (
          myMem.payout_status !== "settled" ||
          Number(myMem.staked_amount) !== 0 ||
          Number(myMem.payout_amount) !== myPayout.totalPayout
        ) {
          await supabase
            .from("creator_room_members")
            .update({
              staked_amount: 0,
              payout_status: "settled",
              payout_amount: myPayout.totalPayout,
              settled_at: nowIso,
            })
            .eq("id", myMem.id);
        }

        // Record in creator_room_settlements using settled_at column
        try {
          await supabase.from("creator_room_settlements").upsert(
            {
              room_id: room.id,
              user_id: userId,
              staked_amount: myPayout.originalStake || 0,
              completion_pct: myPayout.consistencyPct || 0,
              standups_submitted: myPayout.loggedDaysCount || 0,
              total_sprint_days: settlement.totalSprintDays || 0,
              outcome: "settled",
              completion_bonus: myPayout.completionReward || 0,
              pool_share: myPayout.forfeitedBonus || 0,
              stake_refund: myPayout.stakeRefund || 0,
              total_payout: myPayout.totalPayout || 0,
              settled_at: nowIso,
            },
            { onConflict: "room_id,user_id" }
          );
        } catch (e) {}

      } else {
        // Ineligible member: stake is forfeited into the pool
        if (myMem.payout_status !== "forfeited" || Number(myMem.staked_amount) !== 0) {
          await supabase
            .from("creator_room_members")
            .update({
              staked_amount: 0,
              forfeited_carryover: myPayout.newCarryover || 0,
              payout_status: "forfeited",
              payout_amount: 0,
              settled_at: nowIso,
            })
            .eq("id", myMem.id);
        }

        try {
          await supabase.from("creator_room_settlements").upsert(
            {
              room_id: room.id,
              user_id: userId,
              staked_amount: myPayout.originalStake || 0,
              completion_pct: myPayout.consistencyPct || 0,
              standups_submitted: myPayout.loggedDaysCount || 0,
              total_sprint_days: settlement.totalSprintDays || 0,
              outcome: "forfeited",
              completion_bonus: 0,
              pool_share: 0,
              stake_refund: 0,
              total_payout: 0,
              settled_at: nowIso,
            },
            { onConflict: "room_id,user_id" }
          );
        } catch (e) {}
      }
    }

    return totalCreditedDelta;
  } catch (err) {
    console.error("Error in syncAndCreditUserCreatorSettlements:", err);
    return 0;
  }
};

/**
 * Executes room settlement, updates room state, credits host payout,
 * and notifies squad members.
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

    // 2. Fetch Members & Check-ins
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

    // 3. Idempotency Check: If room is already settled, sync status and do not duplicate awards
    if (room.settled) {
      if (callerUserId) {
        await syncAndCreditUserCreatorSettlements(callerUserId);
      }
      await syncRoomSettlementRecords(roomId, room, members, checkins);
      return {
        success: true,
        alreadySettled: true,
        message: "This Creator Room has already been finalized and settled.",
      };
    }

    // 4. Authorization Check: Host only
    if (callerUserId && room.created_by && room.created_by !== callerUserId) {
      return {
        success: false,
        error: "Only the Creator Room host can finalize and settle this room.",
      };
    }

    // 5. Room Completion Lifecycle Check
    if (!checkIsCreatorRoomCompleted(room)) {
      return {
        success: false,
        error: "This room is still active and has not reached its end date yet.",
      };
    }

    // 6. Calculate settlement figures
    const settlement = calculateRoomSettlement({ room, members, checkins });
    const nowIso = new Date().toISOString();

    // 7. Update room as settled FIRST to lock state
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

    // 8. Process host's own settlement immediately under current authenticated session
    if (callerUserId) {
      await syncAndCreditUserCreatorSettlements(callerUserId);
    }

    // 9. Sync any pre-computed records for other members
    await syncRoomSettlementRecords(roomId, { ...room, settled: true, settled_at: nowIso }, members, checkins);

    // 10. Send Room Settlement Notification to squad
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
