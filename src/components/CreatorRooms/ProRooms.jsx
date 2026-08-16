import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import Footer from "../Footer";
import GlitchBackground from "../GlitchBackground";
import {
  Zap,
  Users,
  ShieldCheck,
  Search,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Award,
  BookOpen,
  Code,
  Trophy,
  Brain,
} from "lucide-react";
import Button from "../Button";
import PageHeading from "../PageHeading";
import StatCard from "../StatCard";
import { supabase } from "../../supabaseClient";

const formatNumber = (n) => {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
};

const ProRoomCard = ({ room, isMember, onJoin, onEnter, joining }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-[#0d0d16] border border-cyan-500/20 hover:border-cyan-500/50 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 overflow-hidden hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] shadow-xl font-sans"
    >
      <div className="absolute top-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 rounded-t-2xl bg-gradient-to-r from-[#00F0FF] via-purple-500 to-[#FF00C8]" />

      <div>
        {/* Badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[#00F0FF]">
              <ShieldCheck size={10} /> PRO ARENA
            </span>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300">
              {room.category || "AI & Algorithms"}
            </span>
          </div>

          {isMember && (
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 shrink-0">
              <CheckCircle size={10} /> Enrolled
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white group-hover:text-[#00F0FF] transition-colors leading-snug mb-2">
          {room.name || room.title}
        </h3>

        {/* Description */}
        <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-4">
          {room.description || "High-stakes technical assessment room with automated code evaluation."}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs font-mono text-gray-500 mb-4 pt-3 border-t border-white/5">
          <span className="flex items-center gap-1">
            <Users size={12} className="text-[#00F0FF]" /> {room.member_count || 1} Pro Candidates
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <Trophy size={12} /> Ranked Arena
          </span>
        </div>
      </div>

      {/* Host & Actions */}
      <div className="pt-3 border-t border-white/5">
        <p className="text-[11px] text-gray-500 mb-3">
          Evaluator: <span className="text-gray-300 font-semibold">{room.host || "Glitch Examiner"}</span>
        </p>

        <button
          type="button"
          onClick={() => onEnter(room.id)}
          className="w-full py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer bg-gradient-to-r from-[#00F0FF]/80 to-purple-600 hover:from-[#00F0FF] hover:to-purple-500 shadow-lg shadow-[#00F0FF]/20"
        >
          Enter Assessment Arena <ArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  );
};

const defaultProRooms = [
  {
    id: "pro-1",
    name: "MIT Arena Battle",
    description: "This is a three-stage Arena Battle evaluating algorithms & speed.",
    category: "AI & Algorithms",
    room_type: "professional",
    host: "Samar",
    member_count: 24,
  },
  {
    id: "pro-2",
    name: "AI Hackathons",
    description: "Solve AI challenges, prompt injection defense, and LLM optimization.",
    category: "AI/ML",
    room_type: "professional",
    host: "Parul Singh",
    member_count: 18,
  },
];

const ProRooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [myRoomIds, setMyRoomIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);
  const [search, setSearch] = useState("");

  const fetchProRooms = async () => {
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;

    const { data: dbRooms } = await supabase
      .from("rooms")
      .select("*")
      .order("created_at", { ascending: false });

    if (dbRooms && dbRooms.length > 0) {
      const proOnly = dbRooms.filter((r) => {
        const title = (r.name || r.title || "").toLowerCase();
        return (
          r.room_type === "professional" ||
          title.includes("mit arena") ||
          title.includes("ai hackathon")
        );
      });

      if (proOnly.length > 0) {
        setRooms(proOnly);
      } else {
        setRooms(defaultProRooms);
      }
    } else {
      setRooms(defaultProRooms);
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
    fetchProRooms();
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
      navigate(`/pro-rooms/${room.id}`);
    } catch (e) {
      console.error("Error joining pro room:", e);
    } finally {
      setJoining(null);
    }
  };

  const handleEnter = (roomId) => {
    navigate(`/pro-rooms/${roomId}`);
  };

  const filtered = rooms.filter(
    (r) =>
      (r.name || r.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.category || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalCandidates = filtered.reduce((acc, r) => acc + (r.member_count || 1), 0);

  const statItems = [
    {
      value: formatNumber(filtered.length),
      label: "PRO ARENAS",
      sublabel: "Active evaluation hubs",
    },
    {
      value: formatNumber(totalCandidates),
      label: "CANDIDATES ENROLLED",
      sublabel: "Real-time assessments",
    },
    {
      value: "98%",
      label: "EVALUATION ACCURACY",
      sublabel: "Automated test suites",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#070709] text-white flex flex-col justify-between selection:bg-[#00F0FF]/20 overflow-hidden font-sans">
      <GlitchBackground />

      {/* Cyber Grid Overlay */}
      <div
        className="absolute top-0 left-0 right-0 h-[1100px] z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0,240,255,0.25) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,240,255,0.25) 1px, transparent 1px)`,
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
              eyebrow="TECHNICAL EVALUATION & ARENAS"
              title="Pro Rooms"
              subtitle="High-stakes technical assessment arenas, automated code challenge evaluation, and live competitive pro arenas."
              accent="cyan"
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
                  accent="cyan"
                  variant="bare"
                  delay={0.2 + i * 0.1}
                />
              ))}
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
              placeholder="Search pro assessment rooms by title, category, or evaluator..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#0d0d16] border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#00F0FF]/40 transition font-sans"
            />
          </div>
        </section>

        {/* Pro Rooms Grid */}
        <section className="max-w-6xl mx-auto px-6 pb-24 w-full flex-1">
          {loading ? (
            <div className="flex justify-center py-24">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-10 h-10 border-2 border-t-transparent border-[#00F0FF] rounded-full"
              />
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 border border-dashed border-white/10 rounded-3xl bg-[#0d0d16]/60 p-8"
            >
              <div className="text-5xl mb-4">🏆</div>
              <p className="text-white text-lg font-bold">No Pro Rooms found.</p>
              <p className="text-gray-400 text-xs mt-2 mb-6 max-w-md mx-auto">
                Check back soon for new technical assessment arenas!
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((room) => (
                <ProRoomCard
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

      <Footer />
    </div>
  );
};

export default ProRooms;
