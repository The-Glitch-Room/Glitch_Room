import { supabase } from "../supabaseClient";

/**
 * Single source of truth helper for dynamic room counting across Glitch Room.
 * - Home Page Hero: totalActiveRooms (Creator Rooms + Pro Rooms combined)
 * - Creator Rooms Page: creatorRoomsCount (Creator Rooms only)
 * - Pro Rooms Page: proRoomsCount (Pro Rooms only)
 */
export const fetchActiveRoomsStats = async () => {
  try {
    // 1. Query Creator Rooms (public.rooms) with expanded range
    const { data: creatorRooms, error: cErr } = await supabase
      .from("rooms")
      .select("id, name, title, created_at")
      .range(0, 4999);

    if (cErr) {
      console.error("fetchActiveRoomsStats: rooms query failed:", cErr);
    }

    // 2. Query Pro Rooms (public.pro_rooms) with expanded range
    const { data: proRooms, error: pErr } = await supabase
      .from("pro_rooms")
      .select("id, name, title, status, created_at")
      .range(0, 4999);

    if (pErr) {
      console.error("fetchActiveRoomsStats: pro_rooms query failed:", pErr);
    }

    const validCreatorList = creatorRooms || [];

    // Filter out cancelled, draft, or archived pro rooms
    const validProList = (proRooms || []).filter(
      (r) =>
        !r.status ||
        (r.status !== "cancelled" &&
          r.status !== "draft" &&
          r.status !== "archived")
    );

    // Filter out old deleted test titles if sitting in database without deletion permissions
    const TEST_NAMES = new Set(["ai hackathons", "mit arena battle"]);
    const filterOutTestNames = (list) =>
      list.filter((r) => {
        const name = (r.name || r.title || "").toLowerCase();
        return !TEST_NAMES.has(name);
      });

    const cleanCreatorRooms = filterOutTestNames(validCreatorList);
    const cleanProRooms = filterOutTestNames(validProList);

    // Dedupe by table-prefixed key (creator:id vs pro:id) to ensure raw integer ID collisions
    // across different tables never wrongly collapse unrelated rooms.
    const combinedIds = new Set([
      ...cleanCreatorRooms.map((r) => `creator:${r.id}`),
      ...cleanProRooms.map((r) => `pro:${r.id}`),
    ]);

    return {
      creatorCount: cleanCreatorRooms.length,
      proCount: cleanProRooms.length,
      totalActiveRooms: combinedIds.size,
      creatorRoomsList: cleanCreatorRooms,
      proRoomsList: cleanProRooms,
    };
  } catch (err) {
    console.error("Error fetching active rooms stats:", err);
    return {
      creatorCount: 0,
      proCount: 0,
      totalActiveRooms: 0,
      creatorRoomsList: [],
      proRoomsList: [],
    };
  }
};
