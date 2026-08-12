import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  User,
  Tag,
  Lock,
  Globe,
  Search,
  X,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Award,
} from "lucide-react";
import Button from "./Button";
import PageHeading from "./PageHeading";

const JoinRoom = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [accessCode, setAccessCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAccess, setFilterAccess] = useState("all");
  // "all" | "creator" | "professional" — shows EVERY room by default
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [joinedRoom, setJoinedRoom] = useState(null);
  const [codeError, setCodeError] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) setRooms(data || []);
      setLoading(false);
    };
    fetchRooms();
  }, []);

  const persistJoin = async (room) => {
    setJoining(true);
    try {
      const { data: au } = await supabase.auth.getUser();
      const uid = au?.user?.id;
      if (uid) {
        await supabase
          .from("room_members")
          .upsert(
            { room_id: room.id, user_id: uid },
            { onConflict: "room_id,user_id", ignoreDuplicates: true }
          );
      }
    } catch (err) {
      console.error("Error joining room:", err);
    } finally {
      setJoining(false);
    }
  };

  const handleJoinRoom = async (room) => {
    if (room.access === "public") {
      await persistJoin(room);
      setJoinedRoom(room);
    } else {
      setSelectedRoom(room);
      setAccessCode("");
      setCodeError(false);
    }
  };

  const handleValidateCode = async () => {
    if (selectedRoom && accessCode === selectedRoom.code) {
      await persistJoin(selectedRoom);
      setJoinedRoom(selectedRoom);
      setSelectedRoom(null);
      setAccessCode("");
    } else {
      setCodeError(true);
    }
  };

  const handleEnterRoom = () => {
    if (joinedRoom) navigate(`/room/${joinedRoom.id}`);
  };

  const filteredRooms = rooms.filter((room) => {
    const matchSearch =
      room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.host?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchAccess = filterAccess === "all" || room.access === filterAccess;

    const matchRoomType =
      roomTypeFilter === "all"
        ? true
        : roomTypeFilter === "professional"
          ? room.room_type === "professional"
          : room.room_type === "creator" || !room.room_type;

    return matchSearch && matchAccess && matchRoomType;
  });

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-12 px-6 text-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,240,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.8) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <PageHeading
            eyebrow="All Open Rooms"
            title="Join a Glitch Room"
            subtitle="Browse every room hosted on Glitch Room — Creator & Professional tracks. Public rooms are instant, private ones need an access code."
            accent="purple"
            size="xl"
          />

          {/* Room type filter toggle */}
          <div
            className="inline-flex gap-1 p-1.5 rounded-2xl mx-auto"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {[
              { value: "all", label: "Every Room" },
              { value: "creator", label: "Creator Rooms" },
              { value: "professional", label: "Professional Rooms" },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setRoomTypeFilter(t.value)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                style={
                  roomTypeFilter === t.value
                    ? {
                        background: "rgba(168,85,247,0.15)",
                        border: "1px solid rgba(168,85,247,0.4)",
                        color: "#a855f7",
                      }
                    : {
                        background: "transparent",
                        border: "1px solid transparent",
                        color: "#6b7280",
                      }
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Joined success state */}
      <AnimatePresence>
        {joinedRoom && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-xl mx-auto px-6 pb-24 w-full text-center"
          >
            <div className="bg-[#0f0f1a] border border-cyan-500/20 rounded-3xl p-12 shadow-[0_0_40px_rgba(0,240,255,0.1)]">
              <CheckCircle className="text-cyan-400 mx-auto mb-4" size={48} />
              <h2 className="text-2xl font-black text-white mb-2">
                You're In! 🎉
              </h2>
              <p className="text-gray-400 text-sm mb-2">Successfully joined</p>
              <p className="text-cyan-300 font-bold text-xl mb-8">
                {joinedRoom.name}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleEnterRoom}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white cursor-pointer transition-all"
                  style={{
                    background: "linear-gradient(90deg,#00F0FF,#FF00C8)",
                  }}
                >
                  Enter Room <ArrowRight size={15} />
                </motion.button>

                <button
                  onClick={() => setJoinedRoom(null)}
                  className="px-6 py-3 rounded-xl text-sm font-bold border border-white/10 text-gray-300 hover:bg-white/5 transition cursor-pointer"
                >
                  Browse More Rooms
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      {!joinedRoom && (
        <section className="max-w-6xl mx-auto px-6 pb-24 w-full">
          {/* Search + Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
              />
              <input
                type="text"
                placeholder="Search rooms by name, host, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0f0f1a] border border-white/6 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-500/40 transition"
              />
            </div>
            <div className="flex gap-2">
              {[
                { value: "all", label: "All Access" },
                { value: "public", label: "Public", icon: <Globe size={13} /> },
                {
                  value: "private",
                  label: "Private",
                  icon: <Lock size={13} />,
                },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilterAccess(f.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition cursor-pointer
                    ${
                      filterAccess === f.value
                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                        : "bg-transparent border-white/6 text-gray-500 hover:border-white/20"
                    }`}
                >
                  {f.icon} {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rooms grid */}
          {loading ? (
            <div className="text-center py-20 text-gray-500">
              <div className="w-10 h-10 border-4 border-t-transparent border-cyan-500 rounded-full animate-spin mx-auto mb-4" />
              Loading rooms...
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-white/10 rounded-3xl">
              <p className="text-gray-500 text-lg">No rooms found.</p>
              <p className="text-gray-600 text-sm mt-2">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {filteredRooms.map((room, index) => {
                const isPro = room.room_type === "professional";
                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className={`group bg-[#0f0f1a] border rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 relative overflow-hidden ${
                      isPro
                        ? "border-cyan-500/20 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.12)]"
                        : "border-white/6 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.12)]"
                    }`}
                  >
                    <div
                      className={`absolute top-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 ${
                        isPro
                          ? "bg-gradient-to-r from-cyan-400 to-blue-500"
                          : "bg-gradient-to-r from-[#FF00C8] to-purple-500"
                      }`}
                    />

                    <div className="flex items-center justify-between">
                      <span
                        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border
                        ${
                          room.access === "public"
                            ? "bg-green-500/10 border-green-500/20 text-green-400"
                            : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}
                      >
                        {room.access === "public" ? (
                          <Globe size={11} />
                        ) : (
                          <Lock size={11} />
                        )}
                        {room.access.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400 bg-white/4 px-2 py-1 rounded-lg">
                        {room.category || "General"}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest ${
                        isPro ? "text-cyan-400" : "text-purple-400"
                      }`}
                    >
                      {isPro ? "🏢 Professional Track" : "✨ Creator Room"}
                    </span>

                    <div>
                      <h2
                        className={`text-lg font-bold text-white transition-colors mb-1.5 ${
                          isPro ? "group-hover:text-cyan-300" : "group-hover:text-purple-300"
                        }`}
                      >
                        {room.name}
                      </h2>
                      <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                        {room.description || "No description provided."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <User size={12} className="text-purple-400" />
                      <span className="text-xs text-gray-500">
                        Hosted by{" "}
                        <span className="text-purple-300 font-semibold">
                          {room.host || "Glitch Room Team"}
                        </span>
                      </span>
                    </div>

                    <button
                      onClick={() => handleJoinRoom(room)}
                      disabled={joining}
                      className={`w-full mt-auto py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border transition cursor-pointer disabled:opacity-60
                        ${
                          room.access === "public"
                            ? isPro
                              ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/40"
                              : "bg-purple-500/10 border-purple-500/20 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/40"
                            : "bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/20"
                        }`}
                    >
                      {room.access === "public" ? (
                        <>
                          <Globe size={13} /> Join Room <ArrowRight size={13} />
                        </>
                      ) : (
                        <>
                          <Lock size={13} /> Enter Access Code
                        </>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </section>
      )}

      {/* Private code modal */}
      <AnimatePresence>
        {selectedRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-[#0d0d14] border border-red-500/20 rounded-3xl p-8 w-full max-w-md shadow-[0_0_40px_rgba(255,0,0,0.1)] relative overflow-hidden"
            >
              <div className="h-[2px] w-full bg-gradient-to-r from-[#FF00C8] to-red-500 absolute top-0 left-0" />

              <button
                onClick={() => setSelectedRoom(null)}
                className="absolute top-5 right-5 text-gray-600 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>

              <Lock className="text-red-400 mb-4" size={32} />
              <h2 className="text-xl font-black text-white mb-1">
                Private Room
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Enter the access code to join{" "}
                <span className="text-white font-semibold">
                  {selectedRoom.name}
                </span>
              </p>

              <input
                type="text"
                placeholder="e.g. GLITCH-1234-ABCD"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value);
                  setCodeError(false);
                }}
                className={`w-full px-4 py-3 rounded-xl bg-[#0a0a12] border text-white placeholder-gray-600 text-sm font-mono focus:outline-none transition mb-2
                  ${codeError ? "border-red-500/50 focus:ring-1 focus:ring-red-500/30" : "border-white/6 focus:border-red-500/30"}`}
              />
              {codeError && (
                <p className="text-red-400 text-xs mb-4">
                  Invalid code. Please check and try again.
                </p>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleValidateCode}
                  disabled={joining}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#FF00C8] to-red-500 text-white text-sm font-bold transition cursor-pointer hover:opacity-90 disabled:opacity-60"
                >
                  Join Room 🚀
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default JoinRoom;
