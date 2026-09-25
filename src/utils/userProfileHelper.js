/**
 * userProfileHelper.js
 *
 * Canonical user profile resolver:
 * Ensures identical avatar, display name, and username across
 * all leaderboard & ranking views (Live Rankings, All-Time Legends, all filters).
 */

/**
 * Derives a consistent, clean username from a user profile or fallback values.
 * If the profile has an explicit username, cleans and returns it.
 * If not, deterministically generates a clean handle from the user's full_name
 * (e.g. "Parul Singh" -> "parul_singh") or falls back to "glitcher_" + UID prefix.
 */
export const getCanonicalUsername = (profile = {}, fallbackId = "") => {
  const rawUsername = (profile?.username || "").trim().replace(/^@+/, "");
  if (rawUsername) return rawUsername;

  const rawName = (profile?.full_name || "").trim();
  if (rawName) {
    const slug = rawName
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    if (slug) return slug;
  }

  const uid = profile?.id || profile?.user_id || fallbackId || "";
  if (uid) {
    return `glitcher_${uid.slice(0, 6)}`;
  }

  return "glitcher";
};

/**
 * Returns a deterministic fallback avatar URL using Dicebear Identicon seeded
 * with the user's canonical username.
 */
export const getFallbackAvatar = (seed = "glitcher") => {
  const cleanSeed = encodeURIComponent(String(seed || "glitcher").trim());
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanSeed}`;
};

/**
 * Resolves a full canonical profile record { user_id, full_name, username, avatar_url }
 * guaranteeing uniform identity across all ranking views and filters.
 */
export const getCanonicalUser = (profile = {}, fallbackId = "") => {
  const uid = profile?.id || profile?.user_id || fallbackId || "";
  const username = getCanonicalUsername(profile, uid);

  const rawName = (profile?.full_name || "").trim();
  const displayName = rawName || username.replace(/_/g, " ") || "Anonymous";

  const rawAvatar = (profile?.avatar_url || "").trim();
  const avatarUrl = rawAvatar || getFallbackAvatar(username);

  return {
    user_id: uid,
    full_name: displayName,
    username,
    avatar_url: avatarUrl,
  };
};
