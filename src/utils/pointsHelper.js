import { getLocalDateStr } from "./dateUtils";
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
  
  // Use .limit(1) to avoid Supabase PostgREST JSON single-object errors if duplicates exist
  const { data: existingBonus } = await supabase
    .from("glitch_activity")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "bonus")
    .ilike("title", `%${milestone}-Day Uptime Streak%`)
    .limit(1);

  if (existingBonus && existingBonus.length > 0) {
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
// Read-only — safe to call on page load/refresh just to set button UI state
export const hasEarnedDailyFactToday = async (userId) => {
  if (!userId) return false;
  const todayStr = getLocalDateStr();
  try {
    const { data } = await supabase
      .from("daily_fact_claims")
      .select("id")
      .eq("user_id", userId)
      .eq("claim_date", todayStr)
      .limit(1);

    return !!(data && data.length > 0);
  } catch (e) {
    console.error("hasEarnedDailyFactToday error:", e);
    return false;
  }
};

// The ONLY path that awards points. Call this on "like" click.
export const awardDailyFactBonus = async (userId) => {
  if (!userId) return { awarded: false, reason: "no_user" };
  const todayStr = getLocalDateStr();

  // Atomic, race-proof, refresh-proof claim insertion (PostgreSQL UNIQUE(user_id, claim_date))
  const { error: claimErr } = await supabase
    .from("daily_fact_claims")
    .insert({ user_id: userId, claim_date: todayStr });

  if (claimErr) {
    if (claimErr.code === "23505" || claimErr.message?.includes("unique")) {
      // duplicate — already claimed today, by this click or a concurrent one
      return { awarded: false, reason: "already_claimed_today" };
    }
    // any other failure — don't award points, since we can no longer guarantee idempotency
    console.error("daily fact claim insert failed:", claimErr);
    return { awarded: false, reason: "claim_insert_failed" };
  }

  // We're the confirmed first insert for today — safe to award 10 gBits
  const nextPoints = await updatePoints(10, "⚡ Daily Fact Bubble", "bonus");
  return { awarded: true, points: nextPoints };
};


// ── Single Source of Truth Points Calculator with Automatic DB Self-Healing ──
export const getUserTotalPoints = async (userId) => {
  if (!userId) return 0;
  try {
    const [pointsRes, profileRes, submissionsRes, activityRes] = await Promise.all([
      supabase.from("user_points").select("points").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("points").eq("id", userId).maybeSingle(),
      supabase.from("challenge_submissions").select("points_earned").eq("user_id", userId),
      supabase.from("glitch_activity").select("points").eq("user_id", userId),
    ]);

    const dbPoints = pointsRes.data?.points || 0;
    const profilePoints = profileRes.data?.points || 0;
    const solvedPoints = (submissionsRes.data || []).reduce((sum, s) => sum + (s.points_earned || 0), 0);
    const bonusPoints = (activityRes.data || []).reduce((sum, a) => sum + (a.points || 0), 0);

    const maxPoints = Math.max(dbPoints, profilePoints, solvedPoints + bonusPoints);

    // Self-heal DB: If user_points or profiles is out of sync, update both in DB!
    if (dbPoints !== maxPoints || profilePoints !== maxPoints) {
      await Promise.all([
        supabase.from("user_points").upsert({ user_id: userId, points: maxPoints }, { onConflict: "user_id" }),
        supabase.from("profiles").update({ points: maxPoints }).eq("id", userId),
      ]);
    }

    return maxPoints;
  } catch (e) {
    console.error("getUserTotalPoints error:", e);
    return 0;
  }
};

// ── Unified Atomic Points Updater ─────────────────────────────────────────────
export const updatePoints = async (
  delta,
  title = "Challenge completed",
  type = "glitch",
  roomId = null,
  targetUserId = null
) => {
  let userId = targetUserId;
  if (!userId) {
    const { data: userData } = await supabase.auth.getUser();
    userId = userData?.user?.id;
  }
  if (!userId) return 0;

  const currentTotal = await getUserTotalPoints(userId);
  const nextDB = Math.max(0, currentTotal + delta);

  const { error: upsertErr } = await supabase
    .from("user_points")
    .upsert({ user_id: userId, points: nextDB }, { onConflict: "user_id" });

  if (upsertErr) {
    console.error("updatePoints user_points error:", upsertErr);
    return currentTotal;
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
    window.dispatchEvent(
      new CustomEvent("points_updated", { detail: { points: nextDB } })
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
    .maybeSingle();

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
      // Check if user ALREADY earned Speed Demon for this specific challenge using .limit(1)
      const { data: existingSpeed } = await supabase
        .from("glitch_activity")
        .select("id")
        .eq("user_id", userId)
        .eq("type", "bonus")
        .ilike("title", `%Speed Demon Bonus%`)
        .gte("created_at", new Date(Date.now() - 86400000).toISOString())
        .limit(1);

      if (!existingSpeed || existingSpeed.length === 0) {
        await updatePoints(50, `Speed Demon Bonus (${timeTakenSeconds}s)`, "bonus");
        speedBonusAwarded = true;
      }
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
