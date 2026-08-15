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

// ── Level Thresholds ────────────────────────────────────────────────────────
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

export const calculateLevelInfo = (xp) => {
  const points = Math.max(0, Number(xp) || 0);
  const currentLevel = getLevelFromXP(points);
  const currentXP = getCurrentLevelXP(currentLevel);
  const nextXP = getNextLevelXP(currentLevel);
  const progressPercent = Math.min(
    100,
    Math.max(0, ((points - currentXP) / (nextXP - currentXP)) * 100)
  );

  return {
    currentLevel,
    currentXP: points,
    nextLevelXP: nextXP,
    xpIntoLevel: points - currentXP,
    xpNeededForNext: nextXP - currentXP,
    progressPercent,
  };
};

// ── Uptime streak helpers ───────────────────────────────────────────────────
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

export const checkAndAwardStreakBonus = async (userId) => {
  if (!userId) return { awarded: false, streak: 0 };

  const streak = await getCurrentStreak(userId);
  if (streak < 7) return { awarded: false, streak };

  const { data: userPts } = await supabase
    .from("user_points")
    .select("last_streak_bonus_at")
    .eq("user_id", userId)
    .single();

  const lastAwarded = userPts?.last_streak_bonus_at
    ? new Date(userPts.last_streak_bonus_at)
    : null;

  const daysSinceLastAward = lastAwarded
    ? (Date.now() - lastAwarded) / (1000 * 3600 * 24)
    : 999;

  if (daysSinceLastAward < 7) {
    return { awarded: false, streak, reason: "cooldown" };
  }

  const milestone = Math.floor(streak / 7) * 7;
  const { data: existingBonus } = await supabase
    .from("glitch_activity")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "bonus")
    .ilike("title", `%${milestone}-Day Uptime Streak%`)
    .maybeSingle();

  if (existingBonus) {
    return { awarded: false, streak, reason: "already_claimed" };
  }

  const { data: cur } = await supabase
    .from("user_points")
    .select("points")
    .eq("user_id", userId)
    .single();

  const current = cur?.points ?? 0;
  const next = current + 100;

  await supabase
    .from("user_points")
    .update({ points: next, last_streak_bonus_at: new Date().toISOString() })
    .eq("user_id", userId);

  await supabase
    .from("profiles")
    .update({ points: next })
    .eq("id", userId);

  await supabase.from("glitch_activity").insert({
    user_id: userId,
    title: `⚡ 7-Day Uptime Streak Milestone (${milestone} Days)`,
    points: 100,
    type: "bonus",
    created_at: new Date().toISOString(),
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("gbits_updated", { detail: { points: next } })
    );
  }

  return { awarded: true, milestone, points: next };
};

// ── Daily Fact Bubble 1-per-day enforcement ───────────────────────────────
export const hasEarnedDailyFactToday = async (userId) => {
  if (!userId) return false;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: existingToday } = await supabase
    .from("glitch_activity")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "bonus")
    .ilike("title", "%Daily Fact Bubble%")
    .gte("created_at", todayStart.toISOString())
    .maybeSingle();

  return !!existingToday;
};

export const awardDailyFactBonus = async (userId) => {
  if (!userId) return { awarded: false, reason: "no_user" };

  const alreadyEarned = await hasEarnedDailyFactToday(userId);
  if (alreadyEarned) {
    return { awarded: false, reason: "already_claimed_today" };
  }

  const nextPoints = await updatePoints(10, "Daily Fact Bubble", "bonus");
  return { awarded: true, points: nextPoints };
};

// ── Unified Atomic Points Updater ─────────────────────────────────────────────
export const updatePoints = async (
  delta,
  title = "Challenge completed",
  type = "glitch",
  roomId = null
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
      console.error("updatePoints user_points error:", error);
      return currentDB;
    }
  } else {
    const { error } = await supabase
      .from("user_points")
      .insert({ user_id: userId, points: nextDB });
    if (error) {
      console.error("updatePoints insert error:", error);
      return 0;
    }
  }

  // Keep profiles.points 100% in sync
  try {
    await supabase
      .from("profiles")
      .update({ points: nextDB })
      .eq("id", userId);
  } catch (e) {
    // optional profile update fail-safe
  }

  if (delta > 0) {
    const activityPayload = {
      user_id: userId,
      title,
      points: delta,
      type,
      created_at: new Date().toISOString(),
    };
    if (roomId) activityPayload.room_id = roomId;

    const { error: actErr } = await supabase
      .from("glitch_activity")
      .insert(activityPayload);
    if (actErr) console.error("activity insert error:", actErr);

    if (type !== "bonus") {
      checkAndAwardStreakBonus(userId).catch((e) =>
        console.error("streak bonus check error:", e)
      );
    }
  }

  // Dispatch real-time global event so Navbar, Sidebar, Profile, Console update instantly
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("gbits_updated", { detail: { points: nextDB } })
    );
  }

  return nextDB;
};

// ── Challenge Submission & Solved Helpers ─────────────────────────────────────
export const hasPriorSubmissions = async (challengeId, challengeType) => {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return true;

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
  if (d.includes("easy") || d.includes("beginner")) return 45;
  if (d.includes("medium") || d.includes("inter")) return 90;
  if (d.includes("hard") || d.includes("advanced")) return 180;
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

  let speedBonusAwarded = false;
  if (pointsEarned > 0 && checkSpeedDemonBonus(timeTakenSeconds, difficulty)) {
    try {
      await updatePoints(50, `Speed Demon Bonus (${timeTakenSeconds}s)`, "bonus");
      speedBonusAwarded = true;
    } catch (e) {
      console.error("Speed demon bonus error:", e);
    }
  }

  if (pointsEarned > 0) {
    checkAndAwardReferralBonus(userId).catch((e) =>
      console.error("Referral bonus award error:", e)
    );
  }

  return { speedBonusAwarded };
};
