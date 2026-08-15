// src/utils/badgeEngine.js
// Call checkAndAwardBadges(userId) after every challenge submission or XP award.

import { supabase } from "../supabaseClient";

// ── helpers ───────────────────────────────────────────────────────────────────

const toKey = (d) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const calcStreak = (activities) => {
  if (!activities?.length) return 0;
  const days = new Set(activities.map((a) => toKey(a.created_at)));
  let streak = 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (!days.has(toKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(toKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
};

// ── award a single badge (ignores duplicate via unique constraint) ─────────────
const award = async (userId, badgeId) => {
  const { error } = await supabase.from("user_badges").insert({
    user_id: userId,
    badge_id: badgeId,
    earned_at: new Date().toISOString(),
  });
  // ignore unique violation (code 23505) — means already awarded
  if (error && error.code !== "23505")
    console.error("badge award error:", error);
  return !error;
};

// ── main function ─────────────────────────────────────────────────────────────
export const checkAndAwardBadges = async (userId) => {
  if (!userId) return;

  // Fetch everything we need in parallel
  const [
    { data: activities },
    { data: submissions },
    { data: points },
    { data: profile },
    { data: posts },
    { data: comments },
    { data: rooms },
    { data: hostedRooms },
    { data: arenaCompletions },
    { data: earnedBadges },
  ] = await Promise.all([
    supabase
      .from("glitch_activity")
      .select("created_at, type")
      .eq("user_id", userId),
    supabase
      .from("challenge_submissions")
      .select("challenge_type, created_at")
      .eq("user_id", userId),
    supabase
      .from("user_points")
      .select("points")
      .eq("user_id", userId)
      .single(),
    supabase
      .from("profiles")
      .select("username, bio, avatar_url")
      .eq("id", userId)
      .single(),
    supabase
      .from("community_posts")
      .select("id")
      .eq("user_id", userId)
      .limit(1),
    supabase
      .from("community_comments")
      .select("id")
      .eq("user_id", userId)
      .limit(1),
    supabase.from("rooms").select("id").eq("created_by", userId).limit(1),
    supabase
      .from("rooms")
      .select("id")
      .eq("created_by", userId)
      .eq("access", "public")
      .limit(1),
    supabase.from("arena_completions").select("id").eq("user_id", userId),
    supabase.from("user_badges").select("badge_id").eq("user_id", userId),
  ]);

  const earned = new Set((earnedBadges || []).map((b) => b.badge_id));
  const xp = points?.points ?? 0;
  const streak = calcStreak(activities || []);
  const total = (submissions || []).length;

  const countByType = (type) =>
    (submissions || []).filter((s) => s.challenge_type === type).length;

  const glitchCount = countByType("glitch");
  const aiCount = countByType("ai");
  const bugCount = countByType("bug");
  const sparkCount = countByType("spark");
  const arenaCount = (arenaCompletions || []).length;

  const toAward = [];

  const check = (badgeId, condition) => {
    if (!earned.has(badgeId) && condition) toAward.push(badgeId);
  };

  // ── Streak ────────────────────────────────────────────────────────────────
  check("streak_1", streak >= 1);
  check("streak_3", streak >= 3);
  check("streak_7", streak >= 7);
  check("streak_14", streak >= 14);
  check("streak_30", streak >= 30);

  // ── Volume & Challenge Types ──────────────────────────────────────────────
  check("vol_1", total >= 1);
  check("glitch_5", glitchCount >= 5);
  check("bug_5", bugCount >= 5);
  check("ai_5", aiCount >= 5);
  check("spark_5", sparkCount >= 5);
  check("arena_3", arenaCount >= 3);
  check("vol_100", total >= 100);

  // ── XP Milestones ─────────────────────────────────────────────────────────
  check("xp_50", xp >= 50);
  check("xp_250", xp >= 250);
  check("xp_500", xp >= 500);
  check("xp_750", xp >= 750);
  check("xp_1000", xp >= 1000);
  check("xp_2000", xp >= 2000);
  check("xp_3000", xp >= 3000);
  check("xp_4000", xp >= 4000);
  check("xp_5000", xp >= 5000);

  // ── Social & Community ───────────────────────────────────────────────────
  check("social_post", (posts || []).length > 0);
  check("social_comment", (comments || []).length > 0);
  check("social_room", (rooms || []).length > 0);

  // Check referrals count
  const { count: referralCount } = await supabase
    .from("user_referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", userId)
    .eq("status", "completed");
  check("social_referral", (referralCount || 0) >= 1);

  // ── Special Achievements ──────────────────────────────────────────────────
  const profileComplete =
    profile?.username?.trim() &&
    profile?.bio?.trim() &&
    profile?.avatar_url?.trim();
  check("special_profile", profileComplete);

  // Night owl: any activity logged between midnight and 4am
  const isNightOwl = (activities || []).some((a) => {
    const h = new Date(a.created_at).getHours();
    return h >= 0 && h < 4;
  });
  check("special_night", isNightOwl);

  // Speed runner: 3+ challenges in a single calendar day
  const dayCounts = {};
  (submissions || []).forEach((s) => {
    const k = toKey(s.created_at);
    dayCounts[k] = (dayCounts[k] || 0) + 1;
  });
  check(
    "special_speed",
    Object.values(dayCounts).some((c) => c >= 3),
  );

  // ── Award all at once ─────────────────────────────────────────────────────
  await Promise.all(toAward.map((id) => award(userId, id)));

  return toAward; // returns newly awarded badge ids (useful for toast notifications)
};
