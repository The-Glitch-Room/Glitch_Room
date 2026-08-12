// src/utils/pointsHelper.js
import { supabase } from "../supabaseClient";
import { checkAndAwardReferralBonus } from "./referralHelper";

export const getPointsByDifficulty = (difficulty) => {
  const d = (difficulty || "").toLowerCase();
  if (d.includes("easy") || d.includes("beginner")) return 10;
  if (d.includes("medium") || d.includes("inter")) return 25;
  if (d.includes("hard") || d.includes("advanced")) return 50;
  return 10;
};

export const fetchPoints = async () => {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return 0;

  const { data } = await supabase
    .from("user_points")
    .select("points")
    .eq("user_id", userId)
    .single();

  return data?.points ?? 0;
};

// ── Uptime streak helpers ───────────────────────────────────────────────────
// Computes the user's current consecutive-day activity streak from
// glitch_activity. Mirrors the calc already used in Dashboard/ActivityHeatmap.
export const getCurrentStreak = async (userId) => {
  if (!userId) return 0;

  const { data } = await supabase
    .from("glitch_activity")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!data || data.length === 0) return 0;

  const days = new Set(data.map((a) => new Date(a.created_at).toDateString()));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.has(d.toDateString())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
};

// Awards +150 gBits every time the user crosses a new 7-day Uptime milestone
// (day 7, day 14, day 21...). Tracks the last milestone claimed on
// user_points.last_streak_bonus_at so it can't be re-claimed on every visit.
// Requires the last_streak_bonus_at column — see migration note.
export const checkAndAwardStreakBonus = async (userId) => {
  if (!userId) return null;

  const streak = await getCurrentStreak(userId);
  if (streak < 7) return null;

  const { data: existing } = await supabase
    .from("user_points")
    .select("last_streak_bonus_at")
    .eq("user_id", userId)
    .single();

  const lastClaimed = existing?.last_streak_bonus_at || 0;
  const currentMilestone = Math.floor(streak / 7) * 7;

  if (currentMilestone <= lastClaimed) return null; // already claimed this milestone

  const { error: milestoneErr } = await supabase
    .from("user_points")
    .update({ last_streak_bonus_at: currentMilestone })
    .eq("user_id", userId);
  if (milestoneErr) {
    console.error("streak milestone update error:", milestoneErr);
    return null;
  }

  const next = await updatePoints(
    150,
    `Uptime Streak Bonus: ${currentMilestone} days`,
    "bonus",
  );

  return { awarded: true, milestone: currentMilestone, points: next };
};

export const updatePoints = async (
  delta,
  title = "Challenge completed",
  type = "glitch",
) => {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return 0;

  const { data: existing } = await supabase
    .from("user_points")
    .select("points")
    .eq("user_id", userId)
    .single();

  const currentDB = existing?.points ?? 0;
  const nextDB = Math.max(0, currentDB + delta);

  if (existing) {
    const { error } = await supabase
      .from("user_points")
      .update({ points: nextDB })
      .eq("user_id", userId);
    if (error) {
      console.error("update error:", error);
      return currentDB;
    }
  } else {
    const { error } = await supabase
      .from("user_points")
      .insert({ user_id: userId, points: nextDB });
    if (error) {
      console.error("insert error:", error);
      return 0;
    }
  }

  if (delta > 0) {
    const { error: actErr } = await supabase.from("glitch_activity").insert({
      user_id: userId,
      title,
      points: delta,
      type,
      created_at: new Date().toISOString(),
    });
    if (actErr) console.error("activity insert error:", actErr);

    // Check for a new Uptime streak milestone after any real point-earning
    // action. Skip when this award IS a bonus payout, to avoid recursion.
    if (type !== "bonus") {
      checkAndAwardStreakBonus(userId).catch((e) =>
        console.error("streak bonus check error:", e),
      );
    }
  }

  return nextDB;
};

// ── First-Try Clearance helper ──────────────────────────────────────────────
// Returns true if the user has never submitted an answer for this challenge
// before (pass or fail). Call this BEFORE saveSubmission() runs for the
// current attempt, so it reflects the state prior to this submission.
export const hasPriorSubmissions = async (challengeId, challengeType) => {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return true; // fail safe — assume prior attempts exist

  const { count } = await supabase
    .from("challenge_submissions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("challenge_id", String(challengeId))
    .eq("challenge_type", challengeType);

  return (count || 0) > 0;
};

export const checkIfSolved = async (challengeId, challengeType) => {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return null;

  const { data } = await supabase
    .from("challenge_submissions")
    .select("*")
    .eq("user_id", userId)
    .eq("challenge_id", String(challengeId))
    .eq("challenge_type", challengeType)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data || null;
};

export const getSpeedDemonThreshold = (difficulty) => {
  const d = (difficulty || "").toLowerCase();
  if (d.includes("easy") || d.includes("beginner")) return 45; // 45 sec
  if (d.includes("medium") || d.includes("inter")) return 90; // 90 sec
  if (d.includes("hard") || d.includes("advanced")) return 180; // 3 min
  return 60;
};

export const checkSpeedDemonBonus = (timeTakenSeconds, difficulty) => {
  if (!timeTakenSeconds || timeTakenSeconds <= 0) return false;
  const threshold = getSpeedDemonThreshold(difficulty);
  return timeTakenSeconds <= threshold;
};

export const saveSubmission = async (
  challengeId,
  challengeType,
  answer,
  pointsEarned,
  timeTakenSeconds = 0,
  difficulty = "easy"
) => {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return { speedBonusAwarded: false };

  const { error } = await supabase.from("challenge_submissions").insert({
    user_id: userId,
    challenge_id: String(challengeId),
    challenge_type: challengeType,
    answer,
    points_earned: pointsEarned,
    time_taken_seconds: timeTakenSeconds,
  });
  if (error) console.error("saveSubmission error:", error);

  // Check if Speed Demon criteria is met on a successful solve (pointsEarned > 0)
  let speedBonusAwarded = false;
  if (pointsEarned > 0 && checkSpeedDemonBonus(timeTakenSeconds, difficulty)) {
    try {
      await updatePoints(50, `Speed Demon Bonus (${timeTakenSeconds}s)`, "bonus");
      speedBonusAwarded = true;
    } catch (e) {
      console.error("Speed demon bonus error:", e);
    }
  }

  // Trigger referral bonus check on any successful solve
  if (pointsEarned > 0) {
    checkAndAwardReferralBonus(userId).catch((e) =>
      console.error("Referral bonus award error:", e)
    );
  }

  return { speedBonusAwarded };
};

// Level thresholds — non-linear curve, scaled 5x to match the
// 10/25/50 difficulty payout scale (was tuned for the old 2/5/10 scale).
// Exported so any UI (SharedSidebar, EarnRules, etc.) reads the same real
// curve instead of a manually-duplicated copy that can drift out of sync.
export const LEVEL_THRESHOLDS = [
  0, 250, 750, 1500, 2500, 3750, 5500, 7500, 10000, 13500, 17500,
];

export const getLevelFromXP = (xp) => {
  let level = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i;
    else break;
  }
  return level;
};

export const getNextLevelXP = (level) => {
  return (
    LEVEL_THRESHOLDS[level + 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  );
};

export const getCurrentLevelXP = (level) => {
  return LEVEL_THRESHOLDS[level] ?? 0;
};
