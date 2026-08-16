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
  Trophy,
  Plus,
  Building2,
  Calendar,
  Filter,
} from "lucide-react";
import Button from "../Button";
import PageHeading from "../PageHeading";
import StatCard from "../StatCard";
import ProRoomCard, { getProRoomLifecycleState } from "./ProRoomCard";
import CreateProRoomModal from "./CreateProRoomModal";
import { supabase } from "../../supabaseClient";

const formatNumber = (n) => {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
};

const defaultSeedProRooms = [
  {
    id: "pro-mit-arena",
    name: "MIT Arena Battle — AI Systems & Algorithmic Design",
    title: "MIT Arena Battle — AI Systems & Algorithmic Design",
    short_description: "Pro assessment testing real-time neural network optimization, system latency reduction, and concurrent data pipelines.",
    org_name: "MIT CSAIL & Glitch Engine",
    category: "AI & Algorithms",
    event_type: "Hiring Assessment",
    gbits_prize_pool: 2500,
    duration_minutes: 180,
    status: "registration_open",
    member_count: 48,
  },
  {
    id: "pro-hackathon-2026",
    name: "Global Glitch AI Hackathon 2026",
    title: "Global Glitch AI Hackathon 2026",
    short_description: "48-Hour innovation challenge to build autonomous agentic workflows and multi-agent web applications.",
    org_name: "Glitch AI Labs",
    category: "Hackathon",
    event_type: "Hackathon",
    gbits_prize_pool: 5000,
    duration_minutes: 2880,
    status: "live",
    member_count: 124,
  },
  {
    id: "pro-cyber-ctf",
    name: "CyberShield CTF — Offensive Security & Zero-Day",
    title: "CyberShield CTF — Offensive Security & Zero-Day",
    short_description: "High-octane cybersecurity assessment with binary exploitation, web security, and cryptographic reverse engineering.",
    org_name: "ZeroDay Security Guild",
    category: "Cybersecurity",
    event_type: "CTF",
    gbits_prize_pool: 1500,
    duration_minutes: 240,
    status: "upcoming",
    member_count: 82,
  },
];

const ProRooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [userMemberships, setUserMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Live Stats
  const [stats, setStats] = useState({
    activeArenas: 0,
    totalCandidates: 0,
    rewardPool: 0,
  });

  const fetchProRoomsData = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;
      setCurrentUserId(uid);

      // Fetch Pro Rooms from database
      const { data: dbRooms } = await supabase
        .from("pro_rooms")
        .select("*")
        .order("created_at", { ascending: false });

      const finalRooms = dbRooms && dbRooms.length > 0 ? dbRooms : defaultSeedProRooms;
      setRooms(finalRooms);

      // Fetch candidate registrations for user
      if (uid) {
        const { data: regData } = await supabase
          .from("pro_room_registrations")
          .select("room_id")
          .eq("user_id", uid);

        setUserMemberships((regData || []).map((r) => r.room_id));
      }

      // Calculate stats
      const activeCount = finalRooms.filter((r) => r.status !== "archived").length;
      const totalCandidates = finalRooms.reduce((acc, r) => acc + (r.member_count || r.registrations_count || 12), 0);
      const totalPrize = finalRooms.reduce((acc, r) => acc + (r.gbits_prize_pool || 500), 0);

      setStats({
        activeArenas: activeCount,
        totalCandidates,
        rewardPool: totalPrize,
      });
    } catch (err) {
      console.error(err);
      setRooms(defaultSeedProRooms);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProRoomsData();
  }, []);

  // Filter logic
  const filteredRooms = rooms.filter((room) => {
    const lifecycle = getProRoomLifecycleState(room);

    // Search filter
    const matchesSearch =
      (room.name || room.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (room.org_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (room.category || "").toLowerCase().includes(search.toLowerCase());

    // Type filter
    const matchesType =
      selectedType === "All" ||
      (room.event_type || "").toLowerCase() === selectedType.toLowerCase() ||
      (room.category || "").toLowerCase() === selectedType.toLowerCase();

    // Status filter
    let matchesStatus = true;
    if (selectedStatus === "Live") matchesStatus = lifecycle.isLive;
    else if (selectedStatus === "Registration Open") matchesStatus = lifecycle.label === "Registration Open";
    else if (selectedStatus === "Upcoming") matchesStatus = lifecycle.label === "Upcoming";
    else if (selectedStatus === "Evaluation") matchesStatus = lifecycle.label === "Evaluation in Progress";
    else if (selectedStatus === "Results") matchesStatus = lifecycle.label === "Results Published";

    return matchesSearch && matchesType && matchesStatus;
  });

  const eventTypes = [
    "All",
    "Hackathon",
    "Hiring Assessment",
    "Coding Contest",
    "MCQ Competition",
    "Technical Assessment",
    "College Fest",
    "CTF",
    "AI/ML",
  ];

  const statusFilters = [
    "All",
    "Live",
    "Registration Open",
    "Upcoming",
    "Evaluation",
    "Results",
  ];

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col font-sans selection:bg-[#00F0FF]/20 relative overflow-hidden">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full relative z-10">
        <GlitchBackground />

        {/* Hero Header */}
        <div className="text-center mb-12 relative">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[#00F0FF] text-xs font-mono font-bold uppercase tracking-widest mb-4 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
          >
            <ShieldCheck size={14} /> PRO ARENAS & ASSESSMENT ENGINE
          </motion.div>

          <PageHeading
            title="Compete, Get Evaluated & Prove Your Skills"
            subtitle="Professional time-bound assessment arenas, hackathons, hiring drives, and college fest competitions hosted by verified universities, companies, and organizers."
            center
          />

          {/* Action Trigger for Creating Pro Room */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate("/pro-rooms/create")}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] via-purple-600 to-[#FF00C8] hover:from-[#00F0FF] hover:to-purple-500 text-white font-bold text-sm flex items-center gap-2 shadow-xl shadow-[#00F0FF]/20 transition-all cursor-pointer hover:scale-105"
            >
              <Plus size={18} /> Create Pro Room / Host Assessment
            </button>
          </motion.div>
        </div>

        {/* Live KPI Statistics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <StatCard
            label="Active Assessment Arenas"
            value={formatNumber(stats.activeArenas)}
            change="100% Verified Hosts"
            color="cyan"
            icon={ShieldCheck}
          />
          <StatCard
            label="Candidates Evaluated"
            value={formatNumber(stats.totalCandidates)}
            change="Real-time Evaluation"
            color="purple"
            icon={Users}
          />
          <StatCard
            label="Total Rewards & Prize Pool"
            value={`${formatNumber(stats.rewardPool)} gBits`}
            change="Certificates & Badges"
            color="pink"
            icon={Trophy}
          />
        </div>

        {/* Search & Filters Controls */}
        <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-5 mb-8 space-y-4 backdrop-blur-md shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search Pro Rooms by title, organization, or skill..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#07070e] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/50 transition"
              />
            </div>

            {/* Event Type Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {eventTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedType === type
                      ? "bg-[#00F0FF]/20 border border-[#00F0FF]/50 text-[#00F0FF]"
                      : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Status Lifecycle Filter Bar */}
          <div className="pt-3 border-t border-white/5 flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="text-gray-500 flex items-center gap-1 shrink-0 mr-2">
              <Filter size={12} /> Lifecycle Status:
            </span>
            {statusFilters.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedStatus === st
                    ? "bg-purple-500/20 border border-purple-500/50 text-purple-300"
                    : "bg-white/5 border border-white/5 text-gray-500 hover:text-gray-300"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Pro Rooms List Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-t-transparent border-[#00F0FF] rounded-full animate-spin" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-16 bg-[#0d0d16] border border-white/10 rounded-2xl p-8">
            <ShieldCheck size={48} className="mx-auto text-gray-600 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No Pro Rooms Found</h3>
            <p className="text-gray-400 text-xs mb-4 max-w-sm mx-auto">
              No professional assessment arenas match your search query or filter selection. Be the first to host an assessment!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-[#00F0FF] text-xs font-bold transition hover:bg-cyan-500/30 cursor-pointer"
            >
              + Create Pro Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <ProRoomCard
                key={room.id}
                room={room}
                isRegistered={userMemberships.includes(room.id)}
                onEnter={(id) => navigate(`/pro-rooms/${id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Pro Room Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateProRoomModal
            onClose={() => setShowCreateModal(false)}
            onRoomCreated={() => {
              setShowCreateModal(false);
              fetchProRoomsData();
            }}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default ProRooms;
