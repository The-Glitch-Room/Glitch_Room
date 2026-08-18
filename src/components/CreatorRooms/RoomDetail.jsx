import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../../supabaseClient";
import CreatorRoomDetail from "./CreatorRoomDetail";
import ProfessionalRoomDetail from "../ProRooms/ProfessionalRoomDetail";

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      setError(false);
      try {
        const { data, error: err } = await supabase
          .from("rooms")
          .select("id, room_type")
          .eq("id", id)
          .maybeSingle();

        if (!data) {
          const { data: proData } = await supabase
            .from("pro_rooms")
            .select("id")
            .eq("id", id)
            .maybeSingle();

          if (proData) {
            setRoom({ id: proData.id, room_type: "professional" });
          } else {
            // Default to creator room fallback so ID renders CreatorRoomDetail
            setRoom({ id, room_type: "creator" });
          }
        } else {
          setRoom(data);
        }
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080810]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-2 border-t-transparent border-cyan-500 rounded-full"
        />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080810] text-white">
        <div className="text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-400">Room not found.</p>
          <button
            onClick={() => navigate("/creator-rooms")}
            className="mt-4 text-cyan-400 text-sm hover:underline cursor-pointer"
          >
            ← Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  // Dispatch based on room_type:
  // room_type = "professional" -> ProfessionalRoomDetail
  // room_type = "creator" or NULL -> CreatorRoomDetail (backward compatibility)
  if (room.room_type === "professional") {
    return <ProfessionalRoomDetail roomId={id} />;
  }

  return <CreatorRoomDetail roomId={id} />;
};

export default RoomDetail;
