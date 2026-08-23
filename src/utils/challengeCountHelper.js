import { supabase } from "../supabaseClient";

/**
 * DATABASE AS THE SINGLE SOURCE OF TRUTH
 * Calculates the total challenge count directly from Supabase database tables:
 * - 'challenges' table (all challenge categories)
 * - 'arena_events' table (Arena Challenges)
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

    return (challengesCount || 0) + (arenaCount || 0);
  } catch (e) {
    console.error("Error fetching total challenge count from DB:", e);
    return 0;
  }
};

/**
 * Returns dynamic category breakdowns for ALL `type` values existing in the
 * `challenges` table, ensuring future new categories (e.g. "puzzle", "security")
 * are automatically counted and included in grandTotal.
 */
export const fetchDatabaseCategoryCounts = async () => {
  try {
    const [
      { data: rows, error: cErr },
      { count: arenaCount, error: aErr },
    ] = await Promise.all([
      supabase.from("challenges").select("type"),
      supabase.from("arena_events").select("*", { count: "exact", head: true }),
    ]);

    if (cErr) console.warn("Supabase challenges type fetch warning:", cErr);
    if (aErr) console.warn("Supabase arena_events count warning:", aErr);

    const byType = {};
    (rows || []).forEach((r) => {
      const key = (r.type || "uncategorized").toLowerCase();
      byType[key] = (byType[key] || 0) + 1;
    });

    const arena = arenaCount || 0;
    const glitch = byType.glitch || 0;
    const bug = byType.bug || 0;
    const ai = byType.ai || 0;
    const spark = byType.spark || 0;

    const grandTotal =
      Object.values(byType).reduce((sum, n) => sum + n, 0) + arena;

    return {
      // Dynamic category counts (e.g. { glitch: 12, bug: 8, ai: 5, spark: 3, puzzle: 4 })
      ...byType,
      glitch,
      bug,
      ai,
      spark,
      // Plural aliases for components expecting `cat.dbKey` (e.g. glitches, bugs, sparks)
      glitches: glitch,
      bugs: bug,
      ais: ai,
      sparks: spark,
      arena,
      grandTotal,
    };
  } catch (e) {
    console.error("Error fetching category counts from DB:", e);
    return {
      glitch: 0,
      bug: 0,
      ai: 0,
      spark: 0,
      glitches: 0,
      bugs: 0,
      ais: 0,
      sparks: 0,
      arena: 0,
      grandTotal: 0,
    };
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
