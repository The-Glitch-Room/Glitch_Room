import { supabase } from "../supabaseClient";

/**
 * Single source of truth helper for dynamic room counting across Glitch Room.
 * - Home Page Hero: totalActiveRooms (Creator Rooms + Pro Rooms combined)
 * - Creator Rooms Page: creatorRoomsCount (Creator Rooms only)
 * - Pro Rooms Page: proRoomsCount (Pro Rooms only)
 */
export const fetchActiveRoomsStats = async () => {
  try {
    // 1. Query Creator Rooms (public.rooms)
    const { data: creatorRooms, count: cCount, error: cErr } = await supabase
      .from("rooms")
      .select("id, name, title, created_at", { count: "exact" });

    // 2. Query Pro Rooms (public.pro_rooms)
    const { data: proRooms, count: pCount, error: pErr } = await supabase
      .from("pro_rooms")
      .select("id, name, title, status, created_at", { count: "exact" });

    const validCreatorList = creatorRooms || [];
    const validProList = proRooms || [];

    // Filter out old deleted test titles if sitting in database without deletion permissions
    const filterOutTestNames = (list) =>
      list.filter((r) => {
        const name = (r.name || r.title || "").toLowerCase();
        return name !== "ai hackathons" && name !== "mit arena battle";
      });

    const cleanCreatorRooms = filterOutTestNames(validCreatorList);
    const cleanProRooms = filterOutTestNames(validProList);

    // Collect unique IDs to avoid double counting any room
    const creatorIds = new Set(cleanCreatorRooms.map((r) => r.id));
    const proIds = new Set(cleanProRooms.map((r) => r.id));

    // Deduplicate IDs that exist in both tables
    const uniqueCombinedIds = new Set([...creatorIds, ...proIds]);

    return {
      creatorCount: cleanCreatorRooms.length,
      proCount: cleanProRooms.length,
      totalActiveRooms: uniqueCombinedIds.size,
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
