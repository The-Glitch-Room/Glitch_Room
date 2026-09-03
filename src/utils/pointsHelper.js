import { getLocalDateStr } from "./dateUtils";
import { supabase } from "../supabaseClient";
import { checkAndAwardReferralBonus } from "./referralHelper";

// ── Level Config & Constants ────────────────────────────────────────────────
export const LEVEL_THRESHOLDS = [
  { level: 0, title: "Newbie Glitcher", minXP: 0, maxXP: 250 },
  { level: 1, title: "Bug Hunter", minXP: 250, maxXP: 500 },
  { level: 2, title: "Code Breaker", minXP: 500, maxXP: 1000 },
  { level: 3, title: "Cyber Phantom", minXP: 1000, maxXP: 2000 },
  { level: 4, title: "Glitch Architect", minXP: 2000, maxXP: 5000 },
  { level: 5, title: "Master Anomaly", minXP: 5000, maxXP: Infinity },
];

export const getLevelFromXP = (xp = 0) => {
  const safeXP = Math.max(0, Number(xp) || 0);
  if (safeXP >= 5000) return 5;
  if (safeXP >= 2000) return 4;
  if (safeXP >= 1000) return 3;
  if (safeXP >= 500) return 2;
  if (safeXP >= 250) return 1;
  return 0;
};

export const getLevelTitle = (level = 0) => {
  const lvl = Math.min(5, Math.max(0, Number(level) || 0));
  const found = LEVEL_THRESHOLDS.find((t) => t.level === lvl);
  return found ? found.title : "Newbie Glitcher";
};

export const getMinXPForLevel = (level = 0) => {
  const lvl = Math.min(5, Math.max(0, Number(level) || 0));
  return LEVEL_THRESHOLDS[lvl]?.minXP ?? 0;
};

export const getMaxXPForLevel = (level = 0) => {
  const lvl = Math.min(5, Math.max(0, Number(level) || 0));
  const max = LEVEL_THRESHOLDS[lvl]?.maxXP;
  return max === Infinity ? 5000 : (max ?? 250);
};

export const getLevelProgressDetails = (xp = 0) => {
  const safeXP = Math.max(0, Number(xp) || 0);
  const currentLevel = getLevelFromXP(safeXP);

  if (currentLevel >= 5) {
    return {
      currentLevel: 5,
      nextLevel: 5,
      currentLevelMinXP: 5000,
      nextLevelXP: 5000,
      xpInCurrentLevel: safeXP - 5000,
      xpNeededForNextLevel: 0,
      percentage: 100,
      displayText: `${safeXP} / 5000 gBits`,
      rawProgressText: `${safeXP} / 5000`,
      label: `Level 5 (MAX)`,
      isMaxLevel: true,
    };
  }

  const currentTier = LEVEL_THRESHOLDS[currentLevel];
  const nextTier = LEVEL_THRESHOLDS[currentLevel + 1];

  const currentLevelMinXP = currentTier.minXP;
  const nextLevelXP = nextTier.minXP;

  const levelRange = nextLevelXP - currentLevelMinXP;
  const xpInLevel = Math.max(0, safeXP - currentLevelMinXP);

  const percentage = Math.min(100, Math.max(0, (xpInLevel / levelRange) * 100));
  const roundedPct = Math.round(percentage * 10) / 10;

  return {
    currentLevel,
    nextLevel: currentLevel + 1,
    currentLevelMinXP,
    nextLevelXP,
    xpInCurrentLevel: xpInLevel,
    xpNeededForNextLevel: levelRange,
    percentage: roundedPct,
    displayText: `${safeXP} / ${nextLevelXP} gBits`,
    rawProgressText: `${safeXP} / ${nextLevelXP}`,
    label: `Level ${currentLevel} → Level ${currentLevel + 1} Progress`,
    isMaxLevel: false,
  };
};

export const getCurrentLevelXP = (xpOrLevel = 0) => {
  let xp =
    typeof xpOrLevel === "number" && xpOrLevel <= 5
      ? LEVEL_THRESHOLDS[xpOrLevel]?.minXP || 0
      : xpOrLevel;
  return getLevelProgressDetails(xp).currentLevelMinXP;
};

export const getNextLevelXP = (xpOrLevel = 0) => {
  let xp =
    typeof xpOrLevel === "number" && xpOrLevel <= 5
      ? LEVEL_THRESHOLDS[xpOrLevel]?.minXP || 0
      : xpOrLevel;
  return getLevelProgressDetails(xp).nextLevelXP;
};

// ── THE Single Read Path for gBits ──────────────────────────────────────────
export const fetchPoints = async (userId) => {
  if (!userId) {
    const { data: userData } = await supabase.auth.getUser();
    userId = userData?.user?.id;
  }
  if (!userId) return 0;

  try {
    const [ptsRes, profRes] = await Promise.all([
      supabase.from("user_points").select("points").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("points").eq("id", userId).maybeSingle(),
    ]);

    const userPts = ptsRes.data?.points ?? 0;
    const profPts = profRes.data?.points ?? 0;
    return Math.max(userPts, profPts);
  } catch (error) {
    console.error("fetchPoints error:", error);
    return 0;
  }
};

// Legacy alias for backwards compatibility across any un-updated references
export const getUserTotalPoints = fetchPoints;

// ── THE Single Write Path for gBits (Appends to glitch_activity Ledger) ─────
//
// IMPORTANT: points are incremented by a DATABASE TRIGGER
// (trg_sync_points_after_activity_insert / fn_sync_points_from_ledger —
// see fix_sync_points_trigger.sql), which fires automatically whenever a
// row is inserted into glitch_activity, atomically incrementing
// user_points.points (and syncing profiles.points) within the SAME
// transaction as the insert.
//
// We deliberately do NOT also call an RPC to increment points here. This
// codebase used to have two competing point-increment mechanisms — this
// trigger, and a separately-called `increment_user_points` RPC — which
// silently double-counted every single award once a user's row existed.
// The trigger is now the single source of truth; we just insert the
// ledger row and re-read the resulting total.
export const updatePoints = async (
  delta,
  title = "Challenge completed",
  type = "glitch",
  roomId = null,
  targetUserId = null,
) => {
  let userId = targetUserId;
  if (!userId) {
    const { data: userData } = await supabase.auth.getUser();
    userId = userData?.user?.id;
  }
  if (!userId) return 0;

  const activityPayload = {
    user_id: userId,
    title,
    points: delta,
    type,
    created_at: new Date().toISOString(),
  };
  if (roomId) activityPayload.room_id = roomId;

  // Insert into glitch_activity. By the time this resolves successfully,
  // the trigger has already run (same transaction) and user_points is
  // already updated — so a fresh fetchPoints() right after is accurate,
  // not a race.
  const { error: actErr } = await supabase
    .from("glitch_activity")
    .insert(activityPayload);
  if (actErr) {
    console.error("glitch_activity insert warning:", actErr);
    // The insert (and therefore the trigger's increment) never happened —
    // return the real, unchanged total instead of pretending it worked.
    return await fetchPoints(userId);
  }

  const newTotal = await fetchPoints(userId);

  if (delta > 0 && type !== "bonus") {
    checkAndAwardStreakBonus(userId).catch((e) =>
      console.error("streak bonus check error:", e),
    );
  }

  // Dispatch real-time events for UI components
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("gbits_updated", { detail: { points: newTotal } }),
    );
    window.dispatchEvent(
      new CustomEvent("points_updated", { detail: { points: newTotal } }),
    );
  }

  return newTotal;
};

// ── Streak Bonus Helper ─────────────────────────────────────────────────────
export const checkAndAwardStreakBonus = async (userId) => {
  if (!userId) return { awarded: false };

  const { data: activities } = await supabase
    .from("glitch_activity")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!activities || activities.length === 0) return { awarded: false };

  const dates = new Set();
  activities.forEach((act) => {
    if (act.created_at) {
      const dStr = act.created_at.split("T")[0];
      dates.add(dStr);
    }
  });

  const sortedDates = Array.from(dates).sort().reverse();

  let streak = 0;
  let checkDate = new Date();

  for (let i = 0; i < 30; i++) {
    const dStr = checkDate.toISOString().split("T")[0];
    if (sortedDates.includes(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      if (i === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        const yStr = checkDate.toISOString().split("T")[0];
        if (sortedDates.includes(yStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }

  if (streak < 7) return { awarded: false, streak };

  const milestone = Math.floor(streak / 7) * 7;

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

  const nextPoints = await updatePoints(
    100,
    `⚡ 7-Day Uptime Streak Milestone (${milestone} Days)`,
    "bonus",
    null,
    userId,
  );

  // last_streak_bonus_at is an integer column (epoch seconds), not a
  // timestamp — an ISO string here would fail with a type error every
  // time a streak bonus actually fires.
  await supabase
    .from("user_points")
    .update({ last_streak_bonus_at: Math.floor(Date.now() / 1000) })
    .eq("user_id", userId);

  return { awarded: true, milestone, points: nextPoints };
};

// ── Daily Fact Bubble 1-per-day enforcement ───────────────────────────────
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

export const awardDailyFactBonus = async (userId) => {
  if (!userId) return { awarded: false, reason: "no_user" };
  const todayStr = getLocalDateStr();

  const { error: claimErr } = await supabase
    .from("daily_fact_claims")
    .insert({ user_id: userId, claim_date: todayStr });

  if (claimErr) {
    if (claimErr.code === "23505" || claimErr.message?.includes("unique")) {
      return { awarded: false, reason: "already_claimed_today" };
    }
    console.error("daily fact claim insert failed:", claimErr);
    return { awarded: false, reason: "claim_insert_failed" };
  }

  const nextPoints = await updatePoints(10, "⚡ Daily Fact Bubble", "bonus");
  return { awarded: true, points: nextPoints };
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

// The authoritative "has this user ever PASSED this challenge" check —
// backed by challenge_completions, which only ever gets a row written
// when pointsEarned > 0 in saveSubmission(). Unlike checkIfSolved (which
// returns the latest attempt regardless of pass/fail), this can't be
// tripped up by a prior failed attempt.
export const hasPassedChallenge = async (challengeId, challengeType) => {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return false;

  const { data } = await supabase
    .from("challenge_completions")
    .select("id")
    .eq("user_id", userId)
    .eq("challenge_id", String(challengeId))
    .eq("challenge_type", challengeType)
    .limit(1)
    .maybeSingle();

  return !!data;
};

export const getPointsByDifficulty = (difficulty) => {
  const d = (difficulty || "").toLowerCase();
  if (d.includes("easy") || d.includes("beginner")) return 10;
  if (d.includes("medium") || d.includes("inter")) return 25;
  if (d.includes("hard") || d.includes("advanced")) return 50;
  return 10;
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
  score = null,
  timeTakenSeconds = 0,
  difficulty = "easy",
  isFirstTryClearance = false,
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
    score,
    time_taken_seconds: timeTakenSeconds,
  });
  if (error) console.error("saveSubmission error:", error);

  // If passing, record/refresh completion state — including the actual
  // score and points earned. Previously this upsert only wrote
  // user_id/challenge_id/challenge_type/completed_at, silently leaving
  // score and points_earned at their column defaults (0/null) forever,
  // even though the real values were sitting right there in
  // challenge_submissions the whole time.
  if (pointsEarned > 0) {
    try {
      await supabase.from("challenge_completions").upsert(
        {
          user_id: userId,
          challenge_id: String(challengeId),
          challenge_type: challengeType,
          score,
          points_earned: pointsEarned,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,challenge_id,challenge_type" },
      );
    } catch (e) {
      console.warn("challenge_completions upsert warning:", e);
    }

    // Record the first-try clearance, if this genuinely was one.
    // challenge_first_tries previously existed as a table but nothing
    // ever wrote to it — first-try bonuses were being awarded (via
    // hasPriorSubmissions()) without ever leaving a record of it here.
    if (isFirstTryClearance) {
      try {
        const { error: ftErr } = await supabase
          .from("challenge_first_tries")
          .insert({
            user_id: userId,
            challenge_id: String(challengeId),
            challenge_type: challengeType,
          });
        if (ftErr && ftErr.code !== "23505") {
          console.warn("challenge_first_tries insert warning:", ftErr);
        }
      } catch (e) {
        console.warn("challenge_first_tries insert warning:", e);
      }
    }
  }

  let speedBonusAwarded = false;
  if (pointsEarned > 0 && checkSpeedDemonBonus(timeTakenSeconds, difficulty)) {
    try {
      const { data: existingSpeed } = await supabase
        .from("glitch_activity")
        .select("id")
        .eq("user_id", userId)
        .eq("type", "bonus")
        .ilike("title", `%Speed Demon Bonus%`)
        .gte("created_at", new Date(Date.now() - 86400000).toISOString())
        .limit(1);

      if (!existingSpeed || existingSpeed.length === 0) {
        await updatePoints(
          50,
          `Speed Demon Bonus (${timeTakenSeconds}s)`,
          "bonus",
        );
        speedBonusAwarded = true;
      }
    } catch (e) {
      console.error("Speed demon bonus error:", e);
    }
  }

  if (pointsEarned > 0) {
    checkAndAwardReferralBonus(userId).catch((e) =>
      console.error("Referral bonus award error:", e),
    );
  }

  return { speedBonusAwarded };
};


// ── Ensure Signup Bonus Helper ─────────────────────────────────────────────
// ── Ensure Signup Bonus Helper ─────────────────────────────────────────────
export const ensureSignupBonus = async (userId) => {
  if (!userId) return;
  const storageKey = `signup_bonus_granted_${userId}`;
  if (typeof window !== "undefined" && localStorage.getItem(storageKey)) {
    return; // Already granted in this browser session
  }

  try {
    const { data: prof } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", userId)
      .maybeSingle();

    const currentPts = prof?.points ?? 0;

    // Mark as checked to prevent loop
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, "true");
    }

    if (currentPts < 100) {
      console.log("Awarding missing 100 gBits signup bonus to user:", userId);
      const newTotal = currentPts + 100;
      await supabase.from("profiles").update({ points: newTotal }).eq("id", userId);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("points_updated", { detail: { points: newTotal } }));
      }
    }
  } catch (err) {
    console.error("Error ensuring signup bonus:", err);
  }
};