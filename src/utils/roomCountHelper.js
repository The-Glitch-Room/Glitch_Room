import { supabase } from "../supabaseClient";

/**
 * Duration days mapping for Creator Rooms.
 * Matches CreatorRooms.jsx and CreatorRoomDetail.jsx.
 */
export const DURATION_DAYS = {
  "7_day": 7,
  "14_day": 14,
  "30_day": 30,
  "60_day": 60,
  "100_day": 100,
  ongoing: null,
};

/**
 * Determines whether a Creator Room has completed its scheduled sprint.
 */
export const isCreatorRoomCompleted = (room) => {
  if (!room) return false;
  const status = (room.status || "").toLowerCase();
  if (["completed", "ended", "archived", "closed"].includes(status)) {
    return true;
  }
  if (room.duration_type === "ongoing") return false;

  const days = DURATION_DAYS[room.duration_type] ?? null;
  const anchor = room.start_date || room.created_at;

  if (days && anchor) {
    const endDate = new Date(anchor);
    endDate.setDate(endDate.getDate() + days);
    return endDate < new Date();
  }

  if (room.end_date) {
    return new Date(room.end_date) < new Date();
  }

  return false;
};

/**
 * Checks if a creator room has a valid published/hosted status (not draft or cancelled).
 */
export const isValidCreatorRoom = (room) => {
  if (!room) return false;
  const status = (room.status || "").toLowerCase();
  return status !== "draft" && status !== "cancelled" && status !== "archived";
};

/**
 * A creator room is active if it is a valid hosted room and not completed.
 */
export const isCreatorRoomActive = (room) => {
  if (!isValidCreatorRoom(room)) return false;
  return !isCreatorRoomCompleted(room);
};

/**
 * Determines whether a Pro Room is completed (finished assessment, results published, or evaluation).
 */
export const isProRoomCompleted = (room) => {
  if (!room) return false;
  const status = (room.status || "").toLowerCase();
  if (status === "draft") return false;

  const now = new Date();
  const eventEnd = room.event_end_at ? new Date(room.event_end_at) : null;

  return Boolean(
    (eventEnd && now > eventEnd) ||
      ["completed", "results_published", "evaluation"].includes(status)
  );
};

/**
 * Checks if a pro room is valid (not draft, cancelled, or archived).
 */
export const isValidProRoom = (room) => {
  if (!room) return false;
  const status = (room.status || "").toLowerCase();
  return status !== "draft" && status !== "cancelled" && status !== "archived";
};

/**
 * A pro room is active if it is currently live or in progress and not completed.
 */
export const isProRoomActive = (room) => {
  if (!isValidProRoom(room)) return false;
  if (isProRoomCompleted(room)) return false;

  const now = new Date();
  const eventStart = room.event_start_at ? new Date(room.event_start_at) : null;
  const eventEnd = room.event_end_at ? new Date(room.event_end_at) : null;

  const isLive = Boolean(eventStart && now >= eventStart && (!eventEnd || now <= eventEnd));
  const status = (room.status || "").toLowerCase();

  return isLive || status === "active" || status === "live" || status === "in_progress";
};

/**
 * Single source of truth helper for dynamic room counting across Glitch Room.
 * - Home Page Hero: totalActiveRooms & totalHostedRooms (Creator Rooms + Pro Rooms combined)
 * - Creator Rooms Page: creatorRoomsCount (Creator Rooms only)
 * - Pro Rooms Page: proRoomsCount (Pro Rooms only)
 */
export const fetchActiveRoomsStats = async () => {
  try {
    // 1. Query Creator Rooms (public.creator_rooms)
    const { data: creatorRooms, error: cErr } = await supabase
      .from("creator_rooms")
      .select("*")
      .range(0, 4999);

    if (cErr) {
      console.error("fetchActiveRoomsStats: creator_rooms query failed:", cErr);
    }

    // 2. Query Pro Rooms (public.pro_rooms)
    const { data: proRooms, error: pErr } = await supabase
      .from("pro_rooms")
      .select("*")
      .range(0, 4999);

    if (pErr) {
      console.error("fetchActiveRoomsStats: pro_rooms query failed:", pErr);
    }

    // Filter valid rooms (exclude draft, cancelled, archived)
    const cleanCreatorRooms = (creatorRooms || []).filter(isValidCreatorRoom);
    const cleanProRooms = (proRooms || []).filter(isValidProRoom);

    // Calculate Active Rooms
    const activeCreatorRooms = cleanCreatorRooms.filter(isCreatorRoomActive);
    const activeProRooms = cleanProRooms.filter(isProRoomActive);

    // Calculate Completed Rooms
    const completedCreatorRooms = cleanCreatorRooms.filter(isCreatorRoomCompleted);
    const completedProRooms = cleanProRooms.filter(isProRoomCompleted);

    // Unique table-prefixed IDs to prevent collision across tables
    const hostedIds = new Set([
      ...cleanCreatorRooms.map((r) => `creator:${r.id}`),
      ...cleanProRooms.map((r) => `pro:${r.id}`),
    ]);

    const activeIds = new Set([
      ...activeCreatorRooms.map((r) => `creator:${r.id}`),
      ...activeProRooms.map((r) => `pro:${r.id}`),
    ]);

    const completedIds = new Set([
      ...completedCreatorRooms.map((r) => `creator:${r.id}`),
      ...completedProRooms.map((r) => `pro:${r.id}`),
    ]);

    return {
      creatorCount: cleanCreatorRooms.length,
      proCount: cleanProRooms.length,
      totalHostedRooms: hostedIds.size,
      totalActiveRooms: activeIds.size,
      totalCompletedRooms: completedIds.size,
      activeCreatorCount: activeCreatorRooms.length,
      activeProCount: activeProRooms.length,
      creatorRoomsList: cleanCreatorRooms,
      proRoomsList: cleanProRooms,
    };
  } catch (err) {
    console.error("Error fetching active rooms stats:", err);
    return {
      creatorCount: 0,
      proCount: 0,
      totalHostedRooms: 0,
      totalActiveRooms: 0,
      totalCompletedRooms: 0,
      activeCreatorCount: 0,
      activeProCount: 0,
      creatorRoomsList: [],
      proRoomsList: [],
    };
  }
};

/**
 * Normalizes user-facing room status badge text across Creator Rooms and Pro Rooms.
 */
export const formatRoomBadgeStatus = (status) => {
  const s = (status || "").toLowerCase().trim();
  if (["active", "ongoing", "open", "in_progress"].includes(s)) return "Active";
  if (["evaluating", "reviewing", "grading"].includes(s)) return "Evaluating";
  if (["completed", "ended", "closed"].includes(s)) return "Completed";
  if (["archived"].includes(s)) return "Archived";
  if (["draft"].includes(s)) return "Draft";
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Active";
};
