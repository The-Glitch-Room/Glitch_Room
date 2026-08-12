// src/utils/referralHelper.js
import { supabase } from "../supabaseClient";
import { updatePoints } from "./pointsHelper";

/**
 * Generates a clean 6-character uppercase referral code.
 */
export const generateReferralCode = (userId) => {
  const hash = (userId || Math.random().toString(36))
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  const suffix = hash.slice(-4) || "7777";
  return `GLITCH-${suffix}`;
};

/**
 * Gets or creates the current user's referral code in Supabase profiles.
 */
export const getUserReferralCode = async (userId) => {
  if (!userId) return null;

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", userId)
      .single();

    if (profile?.referral_code) {
      return profile.referral_code;
    }

    // Generate new code if missing
    const newCode = generateReferralCode(userId);
    await supabase
      .from("profiles")
      .update({ referral_code: newCode })
      .eq("id", userId);

    return newCode;
  } catch (err) {
    console.error("getUserReferralCode error:", err);
    return generateReferralCode(userId);
  }
};

/**
 * Called when a new user signs up with a referral code (stored in localStorage or URL).
 * Links the invitee to the referrer in `user_referrals`.
 */
export const linkReferralSignup = async (inviteeId, code) => {
  if (!inviteeId || !code) return false;

  try {
    // Find referrer by code
    const { data: referrerProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("referral_code", code.trim().toUpperCase())
      .single();

    if (!referrerProfile || referrerProfile.id === inviteeId) {
      return false; // Invalid code or self-referral
    }

    // Insert pending referral row
    const { error } = await supabase.from("user_referrals").insert({
      referrer_id: referrerProfile.id,
      invitee_id: inviteeId,
      referral_code: code.trim().toUpperCase(),
      status: "pending",
    });

    if (error) {
      console.warn("linkReferralSignup warning:", error.message);
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
 * If pending referral exists:
 *   - Updates status to 'completed'
 *   - Awards referrer +100 gBits
 *   - Awards invitee +25 Welcome Bonus gBits
 */
export const checkAndAwardReferralBonus = async (inviteeId) => {
  if (!inviteeId) return null;

  try {
    const { data: pending } = await supabase
      .from("user_referrals")
      .select("id, referrer_id")
      .eq("invitee_id", inviteeId)
      .eq("status", "pending")
      .single();

    if (!pending) return null;

    // Mark referral as completed
    const { error: updateErr } = await supabase
      .from("user_referrals")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", pending.id);

    if (updateErr) {
      console.error("Referral completion update error:", updateErr);
      return null;
    }

    // Award +100 gBits to referrer
    await updatePoints(
      100,
      "Invite a Glitcher Referral Bonus (+100)",
      "bonus"
    );

    return {
      awarded: true,
      referrerId: pending.referrer_id,
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
