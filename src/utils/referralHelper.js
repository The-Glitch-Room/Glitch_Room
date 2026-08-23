// src/utils/referralHelper.js
import { supabase } from "../supabaseClient";
import { updatePoints } from "./pointsHelper";

/**
 * Generates a clean, high-entropy 8-character uppercase referral code.
 */
export const generateReferralCode = (userId) => {
  if (userId && typeof userId === "string") {
    const clean = userId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (clean.length >= 8) {
      return `GLITCH-${clean.slice(-8)}`;
    }
  }
  const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `GLITCH-${rand}`;
};

/**
 * Gets or creates the current user's referral code in Supabase profiles.
 * Includes collision retry logic if candidate code already exists in DB.
 */
export const getUserReferralCode = async (userId) => {
  if (!userId) return null;

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.referral_code) {
      return profile.referral_code;
    }

    // Try generating candidate code with collision retry loop
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate =
        attempt === 0
          ? generateReferralCode(userId)
          : `GLITCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const { error } = await supabase
        .from("profiles")
        .update({ referral_code: candidate })
        .eq("id", userId);

      if (!error) return candidate;
      if (error.code !== "23505") {
        console.error("getUserReferralCode update error:", error);
        return candidate;
      }
      // Code 23505 collision: loop and try a fresh candidate
    }
    return null;
  } catch (err) {
    console.error("getUserReferralCode error:", err);
    return generateReferralCode(userId);
  }
};

/**
 * Called when a new user signs up with a referral code (stored in localStorage or URL).
 * Links the invitee to the referrer in `user_referrals`.
 * Prevents double-referring via pre-check and PostgreSQL UNIQUE(invitee_id) handling.
 */
export const linkReferralSignup = async (inviteeId, code) => {
  if (!inviteeId || !code) return false;

  try {
    // 1. Check if invitee already has a referral record
    const { data: existingRef } = await supabase
      .from("user_referrals")
      .select("id")
      .eq("invitee_id", inviteeId)
      .limit(1);

    if (existingRef && existingRef.length > 0) {
      console.warn("User already has a referral record, skipping.");
      return false;
    }

    // 2. Find referrer profile by code
    const { data: referrerProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("referral_code", code.trim().toUpperCase())
      .maybeSingle();

    if (!referrerProfile || referrerProfile.id === inviteeId) {
      return false; // Invalid code or self-referral
    }

    // 3. Insert pending referral row
    const { error } = await supabase.from("user_referrals").insert({
      referrer_id: referrerProfile.id,
      invitee_id: inviteeId,
      referral_code: code.trim().toUpperCase(),
      status: "pending",
    });

    if (error) {
      if (error.code === "23505") {
        console.warn("User already has a referral record, skipping.");
      } else {
        console.warn("linkReferralSignup warning:", error.message);
      }
      return false;
    }

    return true;
  } catch (err) {
    console.error("linkReferralSignup error:", err);
    return false;
  }
};

/**
 * Checks if the invitee has any pending referral to complete.
 * Called upon solving any challenge.
 * ATOMIC & RACE-PROOF:
 *   Performs an atomic UPDATE on status = 'pending'.
 *   Only awards points if the UPDATE actually matches & modifies the pending row.
 */
export const checkAndAwardReferralBonus = async (inviteeId) => {
  if (!inviteeId) return null;

  try {
    // Atomic UPDATE gate: only succeeds for whichever caller wins the race.
    // WHERE status = 'pending' means a second concurrent caller gets 0 rows back.
    const { data: updated, error: updateErr } = await supabase
      .from("user_referrals")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("invitee_id", inviteeId)
      .eq("status", "pending")
      .select("id, referrer_id");

    if (updateErr) {
      console.error("Referral completion update error:", updateErr);
      return null;
    }

    if (!updated || updated.length === 0) {
      // No pending referral, or another concurrent call already claimed it
      return null;
    }

    const referral = updated[0];

    // Award +100 gBits to referrer
    if (referral.referrer_id) {
      await updatePoints(
        100,
        "Invite a Glitcher Referral Bonus (+100)",
        "bonus",
        null,
        referral.referrer_id
      );
    }

    // Award +25 gBits welcome bonus to invitee
    await updatePoints(
      25,
      "Welcome Referral Bonus (+25)",
      "bonus",
      null,
      inviteeId
    );

    return {
      awarded: true,
      referrerId: referral.referrer_id,
      bonus: 100,
    };
  } catch (err) {
    console.error("checkAndAwardReferralBonus error:", err);
    return null;
  }
};

/**
 * Fetches referral statistics and friends list for a referrer user.
 */
export const fetchUserReferralStats = async (userId) => {
  if (!userId) {
    return { totalInvites: 0, completedInvites: 0, earnedBits: 0, referrals: [] };
  }

  try {
    const { data: referrals } = await supabase
      .from("user_referrals")
      .select("id, status, created_at, completed_at, invitee_id")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false });

    if (!referrals) {
      return { totalInvites: 0, completedInvites: 0, earnedBits: 0, referrals: [] };
    }

    const completed = referrals.filter((r) => r.status === "completed").length;

    return {
      totalInvites: referrals.length,
      completedInvites: completed,
      earnedBits: completed * 100,
      referrals,
    };
  } catch (err) {
    console.error("fetchUserReferralStats error:", err);
    return { totalInvites: 0, completedInvites: 0, earnedBits: 0, referrals: [] };
  }
};
