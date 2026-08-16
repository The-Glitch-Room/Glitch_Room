import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import Footer from "../Footer";
import CreateRoomModal from "./CreateRoomModal";
import GlitchBackground from "../GlitchBackground";
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
  Flame,
  Target,
  Calendar,
  ShieldCheck,
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
  const getDurationLabel = (d) => {
    if (d === "7_day") return "7-Day Sprint";
    if (d === "14_day") return "14-Day Sprint";
    if (d === "30_day") return "30-Day Bootcamp";
    if (d === "60_day") return "60-Day Sprint";
    if (d === "100_day") return "100-Day Challenge";
    return "Ongoing Sprint";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-[#0f0f1a] border border-white/10 hover:border-purple-500/40 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 overflow-hidden hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] shadow-xl font-sans"
    >
      <div className="absolute top-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 rounded-t-2xl bg-gradient-to-r from-[#FF00C8] via-purple-500 to-[#00F0FF]" />

      <div>
        {/* Header Badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300">
              <Sparkles size={9} /> {room.category || "Accountability"}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400">
              <Calendar size={9} /> {getDurationLabel(room.duration_type)}
            </span>
          </div>

          {isMember && (
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 shrink-0">
              <CheckCircle size={9} /> Committed
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors leading-snug mb-2">
          {room.name || room.title}
        </h3>

        {/* Goal Pledge Box */}
        {room.goal_pledge && (
          <div className="bg-[#07070d] border border-white/5 rounded-xl p-3 mb-3 flex items-start gap-2">
            <Target size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-300 font-mono line-clamp-2">
              <strong className="text-amber-400">Pledge:</strong> {room.goal_pledge}
            </p>
          </div>
        )}

        {/* Description */}
        <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-4">
          {room.description || "Daily check-in and consistency squad for builders."}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs font-mono text-gray-500 mb-4 pt-3 border-t border-white/5">
          <span className="flex items-center gap-1">
            <Users size={12} className="text-purple-400" /> {room.member_count || 1} Squad Members
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <Flame size={12} /> Active Streaks
          </span>
        </div>
      </div>

      {/* Host & Actions */}
      <div className="pt-3 border-t border-white/5">
        <p className="text-[11px] text-gray-500 mb-3">
          Host: <span className="text-gray-300 font-semibold">{room.host || "Glitch Creator"}</span>
        </p>

        {isMember ? (
          <button
            type="button"
            onClick={() => onEnter(room.id)}
            className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-300 shadow-md"
          >
            Enter Accountability Hub <ArrowRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onJoin(room)}
            disabled={joining === room.id}
            className="w-full py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 bg-gradient-to-r from-[#FF00C8]/80 to-purple-600 hover:from-[#FF00C8] hover:to-purple-500 shadow-lg shadow-[#FF00C8]/20"
          >
            {joining === room.id ? "Joining..." : "Commit & Join Squad →"}
          </button>
        )}
      </div>
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

  const fetchRooms = async () => {
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;

    const { data: dbRooms, error } = await supabase
      .from("rooms")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching rooms:", error);
      setRooms([]);
    } else {
      setRooms(dbRooms || []);
    }

    if (user) {
      const { data: myMemberships } = await supabase
        .from("room_members")
        .select("room_id")
        .eq("user_id", user.id);

      if (myMemberships) {
        setMyRoomIds(new Set(myMemberships.map((m) => m.room_id)));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleJoin = async (room) => {
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      navigate("/");
      return;
    }

    setJoining(room.id);
    try {
      await supabase.from("room_members").insert([
        {
          room_id: room.id,
          user_id: user.id,
          role: "member",
        },
      ]);
      setMyRoomIds((prev) => new Set(prev).add(room.id));
      navigate(`/creator-rooms/${room.id}`);
    } catch (e) {
      console.error("Error joining room:", e);
    } finally {
      setJoining(null);
    }
  };

  const handleEnter = (roomId) => {
    navigate(`/creator-rooms/${roomId}`);
  };

  const handleCreateRoom = async (roomData) => {
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) return;

    try {
      const roomPayload = {
        name: roomData.title || roomData.name,
        title: roomData.title || roomData.name,
        description: roomData.description,
        category: roomData.category || "General",
        access: roomData.visibility === "Public" ? "public" : "private",
        created_by: user.id,
        host: user.user_metadata?.full_name || user.email?.split("@")[0] || "Creator",
        member_count: 1,
        goal_pledge: roomData.goal_pledge,
        duration_type: roomData.duration_type,
        checkin_frequency: roomData.checkin_frequency,
        room_type: "creator",
      };

      const { data: newRoom, error } = await supabase
        .from("rooms")
        .insert([roomPayload])
        .select()
        .single();

      if (error) {
        console.warn("Retrying insert payload...", error);
        const { data: fallbackRoom } = await supabase
          .from("rooms")
          .insert([
            {
              name: roomData.title,
              description: roomData.description,
              category: roomData.category,
              access: "public",
              created_by: user.id,
              host: user.user_metadata?.full_name || user.email?.split("@")[0] || "Creator",
              room_type: "creator",
            },
          ])
          .select()
          .single();

        if (fallbackRoom) {
          await supabase.from("room_members").insert([
            { room_id: fallbackRoom.id, user_id: user.id, role: "host" },
          ]);
          setOpenModal(false);
          await fetchRooms();
          navigate(`/creator-rooms/${fallbackRoom.id}`);
          return;
        }
      }

      if (newRoom) {
        await supabase.from("room_members").insert([
          { room_id: newRoom.id, user_id: user.id, role: "host" },
        ]);
        setOpenModal(false);
        await fetchRooms();
        navigate(`/creator-rooms/${newRoom.id}`);
      }
    } catch (e) {
      console.error("Create room error:", e);
    }
  };

  // EXCLUDE ALL PROFESSIONAL ROOMS & PRO ARENA TITLES (MIT Arena Battle & AI Hackathons)
  const filtered = rooms.filter((r) => {
    const title = (r.name || r.title || "").toLowerCase();
    const isPro =
      r.room_type === "professional" ||
      title.includes("mit arena") ||
      title.includes("ai hackathon");

    if (isPro) return false;

    return (
      title.includes(search.toLowerCase()) ||
      (r.category || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.goal_pledge || "").toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalMembers = filtered.reduce((acc, r) => acc + (r.member_count || 1), 0);

  const statItems = [
    {
      value: formatNumber(filtered.length),
      label: "ACTIVE SQUADS",
      sublabel: "Accountability hubs",
    },
    {
      value: formatNumber(totalMembers),
      label: "BUILDERS COMMITTED",
      sublabel: "Daily check-ins",
    },
    {
      value: "94%",
      label: "CONSISTENCY RATE",
      sublabel: "Streak completions",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#070709] text-white flex flex-col justify-between selection:bg-[#00F0FF]/20 overflow-hidden font-sans">
      <GlitchBackground />

      {/* Cyber Grid & Gradient Mask */}
      <div
        className="absolute top-0 left-0 right-0 h-[1100px] z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(168,85,247,0.25) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(168,85,247,0.25) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

        {/* ── HERO HEADER ── */}
        <section className="relative pt-36 md:pt-44 pb-12 px-6 mb-8 md:mb-16 text-center">
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <PageHeading
              eyebrow="CONSISTENCY & GOAL TRACKING"
              title="Creator Rooms"
              subtitle="Join accountability squads, set goal pledges, submit daily Proof of Work, track consistency streaks, and hold each other accountable."
              accent="purple"
              size="xl"
            />

            {/* Stats */}
            <div className="flex justify-center gap-10 flex-wrap my-8">
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

            <div className="flex justify-center" onClick={() => setOpenModal(true)}>
              <Button content="+ Start an Accountability Room" accent="purple" />
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
              placeholder="Search rooms by title, goal pledge, category..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#0f0f18] border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-purple-500/40 transition font-sans"
            />
          </div>
        </section>

        {/* Rooms Grid */}
        <section className="max-w-6xl mx-auto px-6 pb-24 w-full flex-1">
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
              className="text-center py-24 border border-dashed border-white/10 rounded-3xl bg-[#0f0f18]/60 p-8"
            >
              <div className="text-5xl mb-4">🎯</div>
              <p className="text-white text-lg font-bold">No creator rooms found.</p>
              <p className="text-gray-400 text-xs mt-2 mb-6 max-w-md mx-auto">
                Be the first to create a goal-driven squad and invite peers to stay consistent together!
              </p>
              <div className="inline-block" onClick={() => setOpenModal(true)}>
                <Button content="+ Create an Accountability Room" accent="purple" />
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
      </div>

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
