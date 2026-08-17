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
  Trash2,
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
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [joinedRoom, setJoinedRoom] = useState(null);
  const [codeError, setCodeError] = useState(false);
  const [joining, setJoining] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  useEffect(() => {
    const fetchRooms = async () => {
      const { data: authData } = await supabase.auth.getUser();
      setCurrentUserId(authData?.user?.id || null);

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

  const handleDeleteRoom = async (e, roomId, roomName) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${roomName}"?`)) return;

    try {
      const { error } = await supabase.from("rooms").delete().eq("id", roomId);
      if (error) {
        console.error("Error deleting room:", error);
        showToast("❌ Failed to delete room");
      } else {
        setRooms((prev) => prev.filter((r) => r.id !== roomId));
        showToast(`🗑️ Room "${roomName}" deleted successfully!`);
      }
    } catch (err) {
      console.error(err);
      showToast("❌ Error deleting room");
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
    return matchSearch && matchAccess;
  });

  return (
    <div className="relative min-h-screen bg-[#070709] text-white flex flex-col justify-between selection:bg-[#00F0FF]/20 overflow-hidden font-sans">
      <GlitchBackground />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl bg-[#0d0d16] border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-mono font-bold shadow-2xl shadow-[#00F0FF]/20 flex items-center gap-2"
          >
            <Sparkles size={14} className="text-amber-400" /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

        {/* Hero Section */}
        <section className="relative pt-36 md:pt-44 pb-12 px-6 mb-8 md:mb-16 text-center">
          <div className="max-w-4xl mx-auto text-center">
            <PageHeading
              eyebrow="JOIN A ROOM • SQUAD UP"
              title="Browse Rooms"
              subtitle="Find active accountability rooms or enter a room code to join your squad."
              accent="pink"
              size="xl"
            />
          </div>
        </section>

        {/* Private Room Modal */}
        <AnimatePresence>
          {selectedRoom && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setSelectedRoom(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0f0f1a] border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
              >
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="absolute top-5 right-5 text-gray-500 hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>

                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-400">
                  <Lock size={22} />
                </div>

                <h3 className="text-xl font-bold text-white mb-1">
                  Private Room
                </h3>
                <p className="text-xs text-gray-400 mb-6">
                  <strong className="text-white">{selectedRoom.name}</strong>{" "}
                  requires a passcode to join.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 font-mono block mb-2">
                      ENTER ACCESS CODE
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 123456"
                      value={accessCode}
                      onChange={(e) => {
                        setAccessCode(e.target.value);
                        setCodeError(false);
                      }}
                      className={`w-full bg-[#07070d] border rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-gray-600 outline-none transition ${
                        codeError
                          ? "border-red-500 text-red-400"
                          : "border-white/10 focus:border-red-500/50"
                      }`}
                    />
                    {codeError && (
                      <p className="text-xs text-red-400 mt-1 font-mono">
                        Invalid access code. Please try again.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setSelectedRoom(null)}
                      className="flex-1 py-3 rounded-xl border border-white/10 text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleValidateCode}
                      disabled={joining}
                      className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      Verify & Join →
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Joined Success Card */}
        <AnimatePresence>
          {joinedRoom && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-6xl mx-auto px-6 w-full mb-8"
            >
              <div className="bg-[#0f0f1a] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl relative overflow-hidden">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                  <CheckCircle size={28} />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Successfully Joined {joinedRoom.name}!
                </h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  You are now an active member of this room squad. Ready to check in?
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={handleEnterRoom}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white cursor-pointer transition-all bg-gradient-to-r from-[#00F0FF] to-[#FF00C8]"
                  >
                    Enter Room <ArrowRight size={15} />
                  </button>
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
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition cursor-pointer ${
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
                  const isOwner =
                    currentUserId &&
                    (room.host_id === currentUserId ||
                      room.created_by === currentUserId ||
                      room.user_id === currentUserId);

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
                          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
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
                          {(room.access || "public").toUpperCase()}
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
                            isPro
                              ? "group-hover:text-cyan-300"
                              : "group-hover:text-purple-300"
                          }`}
                        >
                          {room.name || room.title}
                        </h2>
                        <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                          {room.description || "No description provided."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <User size={13} className="text-purple-400 shrink-0" />
                          <span className="text-xs text-gray-500 truncate">
                            Hosted by{" "}
                            <span className="text-purple-300 font-semibold">
                              {room.host || "Glitch Room Team"}
                            </span>
                          </span>
                        </div>

                        {/* DELETE ROOM BUTTON FOR ROOM OWNER / CREATOR */}
                        {isOwner && (
                          <button
                            onClick={(e) => handleDeleteRoom(e, room.id, room.name || room.title)}
                            title="Delete Room"
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 transition cursor-pointer shrink-0"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleJoinRoom(room)}
                        disabled={joining}
                        className={`w-full mt-auto py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border transition cursor-pointer disabled:opacity-60 ${
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
      </div>

      <Footer />
    </div>
  );
};

export default JoinRoom;
