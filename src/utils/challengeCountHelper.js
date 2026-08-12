import { supabase } from "../supabaseClient";

/**
 * DATABASE AS THE SINGLE SOURCE OF TRUTH
 * Calculates the total challenge count directly from Supabase database tables:
 * - 'challenges' table (Glitch, Debug Mode, AI Powered, Creative Sparks)
 * - 'arena_events' table (Arena Challenges)
 *
 * NO JSON files are used for counting or displaying totals.
 */
export const fetchTotalChallengeCount = async () => {
  try {
    const [{ count: challengesCount, error: cErr }, { count: arenaCount, error: aErr }] =
      await Promise.all([
        supabase.from("challenges").select("*", { count: "exact", head: true }),
        supabase.from("arena_events").select("*", { count: "exact", head: true }),
      ]);

    if (cErr) console.warn("Supabase challenges count warning:", cErr);
    if (aErr) console.warn("Supabase arena_events count warning:", aErr);

    const total = (challengesCount || 0) + (arenaCount || 0);
    return total;
  } catch (e) {
    console.error("Error fetching total challenge count from DB:", e);
    return 0;
  }
};

/**
 * Returns dynamic category breakdowns directly from Supabase 'challenges' and 'arena_events' tables.
 */
export const fetchDatabaseCategoryCounts = async () => {
  try {
    const [
      { count: glitchCount },
      { count: bugCount },
      { count: aiCount },
      { count: sparkCount },
      { count: arenaCount },
    ] = await Promise.all([
      supabase.from("challenges").select("*", { count: "exact", head: true }).eq("type", "glitch"),
      supabase.from("challenges").select("*", { count: "exact", head: true }).eq("type", "bug"),
      supabase.from("challenges").select("*", { count: "exact", head: true }).eq("type", "ai"),
      supabase.from("challenges").select("*", { count: "exact", head: true }).eq("type", "spark"),
      supabase.from("arena_events").select("*", { count: "exact", head: true }),
    ]);

    const glitch = glitchCount || 0;
    const bug = bugCount || 0;
    const ai = aiCount || 0;
    const spark = sparkCount || 0;
    const arena = arenaCount || 0;
    const grandTotal = glitch + bug + ai + spark + arena;

    return {
      glitch,
      bug,
      ai,
      spark,
      arena,
      grandTotal,
    };
  } catch (e) {
    console.error("Error fetching category counts from DB:", e);
    return { glitch: 0, bug: 0, ai: 0, spark: 0, arena: 0, grandTotal: 0 };
  }
};

/**
 * Calculates exact room counts directly from Supabase 'rooms' database table:
 * - total: all active rooms (Creator + Professional)
 * - creator: creator rooms (room_type = 'creator' or NULL)
 * - professional: professional rooms (room_type = 'professional')
 */
export const fetchTotalRoomCounts = async () => {
  try {
    const { data: rooms, error } = await supabase
      .from("rooms")
      .select("id, room_type");

    if (error) {
      console.warn("Error fetching rooms count from DB:", error);
      return { total: 0, creator: 0, professional: 0 };
    }

    let creator = 0;
    let professional = 0;

    (rooms || []).forEach((r) => {
      if (r.room_type === "professional") {
        professional++;
      } else {
        creator++;
      }
    });

    return {
      total: (rooms || []).length,
      creator,
      professional,
    };
  } catch (e) {
    console.error("Error fetching total room counts from DB:", e);
    return { total: 0, creator: 0, professional: 0 };
  }
};

