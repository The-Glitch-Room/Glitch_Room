import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import Footer from "../Footer";
import CreateRoomModal from "./CreateRoomModal";
import {
  Zap,
  Users,
  BookOpen,
  Lock,
  Globe,
  Search,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import Button from "../Button";
import PageHeading from "../PageHeading";
import StatCard from "../StatCard";
import { supabase } from "../../supabaseClient";

const formatNumber = (n) => {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
};

const RoomCard = ({ room, isMember, onJoin, onEnter, joining }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="group relative bg-[#0f0f1a] border border-white/6 hover:border-purple-500/40 rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 overflow-hidden hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]"
    >
      <div className="absolute top-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 rounded-t-2xl bg-gradient-to-r from-[#FF00C8] to-purple-500" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors leading-snug">
          {room.name}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-400">
            <Sparkles size={9} /> Creator
          </span>
          {isMember && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
              <CheckCircle size={9} /> Joined
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
        {room.description || "No description provided."}
      </p>

      {/* Meta */}
      <div className="flex flex-wrap gap-2">
        {room.category && (
          <span className="text-xs text-gray-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
            {room.category}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Users size={11} /> {room.member_count || 0} members
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          {room.access === "public" ? <Globe size={11} /> : <Lock size={11} />}
          {room.access}
        </span>
      </div>

      {/* Host */}
      <p className="text-xs text-gray-500">
        Hosted by{" "}
        <span className="text-gray-300 font-semibold">{room.host || "Glitch Room Team"}</span>
      </p>

      {/* Action */}
      {isMember ? (
        <button
          onClick={() => onEnter(room.id)}
          className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 text-purple-300"
        >
          Enter Room <ArrowRight size={14} />
        </button>
      ) : (
        <button
          onClick={() => onJoin(room)}
          disabled={joining === room.id}
          className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 bg-gradient-to-r from-[#FF00C8]/80 to-purple-600 hover:from-[#FF00C8] hover:to-purple-500 shadow-[0_0_15px_rgba(255,0,200,0.2)]"
        >
          {joining === room.id ? "Joining..." : "Join Room"}
        </button>
      )}
    </motion.div>
  );
};

const CreatorRooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [myRoomIds, setMyRoomIds] = useState(new Set());
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);
  const [search, setSearch] = useState("");

  const [userId, setUserId] = useState(null);
  const [stats, setStats] = useState({
    activeCreatorRooms: 0,
    membersLearning: 0,
    checkinsThisWeek: 0,
  });

  const fetchAll = async () => {
    setLoading(true);
    const { data: au } = await supabase.auth.getUser();
    const uid = au?.user?.id;
    setUserId(uid);

    // Fetch ONLY Creator Rooms directly from Supabase database table
    const { data: roomsData } = await supabase
      .from("rooms")
      .select("*, room_members(count)")
      .or("room_type.eq.creator,room_type.is.null")
      .order("created_at", { ascending: false });

    const enriched = (roomsData || []).map((r) => ({
      ...r,
      member_count: r.room_members?.[0]?.count || 0,
    }));
    setRooms(enriched);

    const allRoomIds = enriched.map((r) => r.id);

    // Fetch rooms the user has joined or created
    if (uid) {
      const { data: memberships } = await supabase
        .from("room_members")
        .select("room_id")
        .eq("user_id", uid);

      const joinedSet = new Set((memberships || []).map((m) => m.room_id));
      enriched.forEach((r) => {
        if (r.created_by === uid) joinedSet.add(r.id);
      });

      setMyRoomIds(joinedSet);
    }

    let memberCount = 0;
    let checkinCount = 0;

    if (allRoomIds.length > 0) {
      const { data: memberRows } = await supabase
        .from("room_members")
        .select("user_id")
        .in("room_id", allRoomIds);
      const uniqueMembers = new Set((memberRows || []).map((m) => m.user_id));
      memberCount = uniqueMembers.size;

      const now = new Date();
      const jan1 = new Date(now.getFullYear(), 0, 1);
      const week = Math.ceil(((now - jan1) / 86400000 + jan1.getDay() + 1) / 7);
      const weekLabel = `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
      const { count: cCount } = await supabase
        .from("room_checkins")
        .select("*", { count: "exact", head: true })
        .in("room_id", allRoomIds)
        .eq("week_label", weekLabel);
      checkinCount = cCount || 0;
    }

    setStats({
      activeCreatorRooms: enriched.length,
      membersLearning: memberCount || 0,
      checkinsThisWeek: checkinCount || 0,
    });

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel("creator-rooms-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => fetchAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members" },
        () => fetchAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleJoin = async (room) => {
    if (!userId) return;
    setJoining(room.id);

    try {
      await supabase
        .from("room_members")
        .upsert(
          { room_id: room.id, user_id: userId },
          { onConflict: "room_id,user_id", ignoreDuplicates: true }
        );
    } catch (err) {
      console.error("Error joining room:", err);
    }

    setMyRoomIds((prev) => new Set([...prev, room.id]));
    setJoining(null);
    navigate(`/room/${room.id}`);
  };

  const handleEnter = (roomId) => navigate(`/room/${roomId}`);

  const handleCreateRoom = async (roomData) => {
    const { data: au } = await supabase.auth.getUser();
    const uid = au?.user?.id;
    const { data, error } = await supabase
      .from("rooms")
      .insert({
        name: roomData.title,
        description: roomData.description,
        category: roomData.category,
        questions: roomData.questions,
        access: "public",
        room_type: "creator",
        created_by: uid,
        host:
          au?.user?.user_metadata?.full_name ||
          au?.user?.email?.split("@")[0] ||
          "Unknown",
      })
      .select()
      .single();

    if (!error && data) {
      try {
        await supabase
          .from("room_members")
          .upsert(
            { room_id: data.id, user_id: uid },
            { onConflict: "room_id,user_id", ignoreDuplicates: true }
          );
      } catch (err) {
        console.warn("Adding creator to room_members:", err);
      }
      setOpenModal(false);
      navigate(`/room/${data.id}`);
    }
  };

  const filtered = rooms.filter((r) => {
    return (
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.category?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const statItems = [
    {
      icon: <Sparkles size={18} />,
      label: "Active Creator Rooms",
      value: formatNumber(stats.activeCreatorRooms),
      sublabel: "Community & Accountability",
    },
    {
      icon: <Users size={18} />,
      label: "Members Learning",
      value: formatNumber(stats.membersLearning),
    },
    {
      icon: <BookOpen size={18} />,
      label: "Check-ins This Week",
      value: formatNumber(stats.checkinsThisWeek),
    },
  ];

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-36 pb-16 px-6 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(168,85,247,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.8) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <PageHeading
            eyebrow="Community Spaces"
            title="Creator Rooms"
            subtitle="Small learning communities focused on consistency, accountability, and learning together. Join a room, set your goals, check in weekly, and grow with peers."
            accent="purple"
            size="xl"
          />

          {/* Stats */}
          <div className="flex justify-center gap-10 flex-wrap mb-10">
            {statItems.map((s, i) => (
              <StatCard
                key={i}
                value={s.value}
                label={s.label}
                sublabel={s.sublabel}
                accent="purple"
                variant="bare"
                delay={0.2 + i * 0.1}
              />
            ))}
          </div>

          <div onClick={() => setOpenModal(true)}>
            <Button content="+ Create a Creator Room" accent="purple" />
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="max-w-6xl mx-auto px-6 w-full mb-8">
        <div className="relative w-full">
          <Search
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search creator rooms by name, category, or description..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#0f0f1a] border border-white/6 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/40 transition"
          />
        </div>
      </section>

      {/* Rooms Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24 w-full">
        {loading ? (
          <div className="flex justify-center py-24">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-10 h-10 border-2 border-t-transparent border-purple-500 rounded-full"
            />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 border border-dashed border-white/10 rounded-3xl"
          >
            <div className="text-5xl mb-4">🏠</div>
            <p className="text-gray-500 text-lg font-medium">No creator rooms found.</p>
            <p className="text-gray-600 text-sm mt-2 mb-6">
              Be the first to create a new Creator Room!
            </p>
            <div onClick={() => setOpenModal(true)}>
              <Button content="+ Create a Creator Room" accent="purple" />
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                isMember={myRoomIds.has(room.id)}
                onJoin={handleJoin}
                onEnter={handleEnter}
                joining={joining}
              />
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {openModal && (
          <CreateRoomModal
            close={() => setOpenModal(false)}
            create={handleCreateRoom}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default CreatorRooms;
