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
  Layers,
} from "lucide-react";
import ProRoomCard, { getProRoomLifecycleState } from "./ProRoomCard";
import { supabase } from "../../supabaseClient";

const CATEGORIES = [
  "All Categories",
  "AI / Machine Learning",
  "Web Development",
  "Data Structures & Algorithms",
  "Cybersecurity",
  "Data Science",
  "Cloud & DevOps",
  "Aptitude",
  "Software Engineering",
  "Other",
];

const EVENT_TYPES = [
  "All Types",
  "Hackathon",
  "Hiring Assessment",
  "Coding Contest",
  "MCQ Competition",
  "Technical Assessment",
  "College Fest",
  "CTF",
  "Innovation Challenge",
];

const STATUSES = [
  "All Status",
  "Live",
  "Registration Open",
  "Upcoming",
  "Submission Closed",
  "Evaluation",
  "Results Published",
];

const ProRooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("Newest");
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'live', 'upcoming', 'registration_open', 'completed'

  // Statistics State (Calculated from Real Database Data)
  const [stats, setStats] = useState({
    activeRoomsCount: 0,
    participantsEvaluatedCount: 0,
    totalRewardsVal: "0 gBits",
  });

  const fetchProRoomsFromDB = async () => {
    setLoading(true);
    try {
      // 1. Fetch Rooms from Supabase
      const { data: dbRooms, error } = await supabase
        .from("pro_rooms")
        .select("*")
        .order("created_at", { ascending: false });

      const roomList = dbRooms || [];
      setRooms(roomList);

      // 2. Fetch Submissions Count from Supabase
      const { count: subsCount } = await supabase
        .from("pro_room_submissions")
        .select("*", { count: "exact", head: true });

      // 3. Compute Stats
      const liveCount = roomList.filter((r) => {
        const state = getProRoomLifecycleState(r);
        return state.isLive;
      }).length;

      const totalRewards = roomList.reduce(
        (sum, r) => sum + Number(r.gbits_prize_pool || 0),
        0
      );

      const formattedRewards =
        totalRewards > 0
          ? totalRewards >= 1000
            ? `${(totalRewards / 1000).toFixed(1).replace(/\.0$/, "")}k gBits`
            : `${totalRewards} gBits`
          : "0 gBits";

      setStats({
        activeRoomsCount: liveCount,
        participantsEvaluatedCount: subsCount || 0,
        totalRewardsVal: formattedRewards,
      });
    } catch (err) {
      console.error("Error fetching pro rooms data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProRoomsFromDB();
  }, []);

  // Filtering Logic
  const filteredRooms = rooms
    .filter((room) => {
      // Search
      const search = searchQuery.toLowerCase();
      const matchesSearch =
        (room.name || room.title || "").toLowerCase().includes(search) ||
        (room.org_name || "").toLowerCase().includes(search) ||
        (room.category || "").toLowerCase().includes(search) ||
        (room.required_skills || "").toLowerCase().includes(search);

      // Category
      const matchesCategory =
        selectedCategory === "All Categories" ||
        (room.category || "").toLowerCase() === selectedCategory.toLowerCase();

      // Type
      const matchesType =
        selectedType === "All Types" ||
        (room.event_type || "").toLowerCase() === selectedType.toLowerCase();

      // Status
      const state = getProRoomLifecycleState(room);
      let matchesStatus = true;
      if (selectedStatus === "Live") matchesStatus = state.isLive;
      else if (selectedStatus === "Registration Open")
        matchesStatus = state.label === "REGISTRATION OPEN";
      else if (selectedStatus === "Upcoming") matchesStatus = state.label === "UPCOMING";
      else if (selectedStatus === "Evaluation") matchesStatus = state.label === "Evaluation";
      else if (selectedStatus === "Results Published")
        matchesStatus = state.label === "Results Published";

      // Tab filter
      let matchesTab = true;
      if (activeTab === "live") matchesTab = state.isLive;
      else if (activeTab === "upcoming") matchesTab = state.label === "UPCOMING";
      else if (activeTab === "registration_open")
        matchesTab = state.label === "REGISTRATION OPEN";
      else if (activeTab === "completed")
        matchesTab =
          state.label === "Results Published" || state.label === "Submission Closed";

      return (
        matchesSearch &&
        matchesCategory &&
        matchesType &&
        matchesStatus &&
        matchesTab
      );
    })
    .sort((a, b) => {
      if (sortBy === "Starting Soon") {
        return new Date(a.event_start_at || 0) - new Date(b.event_start_at || 0);
      }
      if (sortBy === "Highest Reward") {
        return (b.gbits_prize_pool || 0) - (a.gbits_prize_pool || 0);
      }
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

  // Calculate Tab Counts
  const tabCounts = {
    all: rooms.length,
    live: rooms.filter((r) => getProRoomLifecycleState(r).isLive).length,
    upcoming: rooms.filter((r) => getProRoomLifecycleState(r).label === "UPCOMING").length,
    registration_open: rooms.filter((r) => getProRoomLifecycleState(r).label === "REGISTRATION OPEN").length,
    completed: rooms.filter(
      (r) =>
        getProRoomLifecycleState(r).label === "Results Published" ||
        getProRoomLifecycleState(r).label === "Submission Closed"
    ).length,
  };

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col font-sans selection:bg-[#00F0FF]/20 relative overflow-hidden">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full relative z-10">
        <GlitchBackground />

        {/* HERO SECTION — Matching Image 3 Creator Rooms Page */}
        <div className="text-center mb-12 relative max-w-3xl mx-auto">
          {/* Eyebrow Pill */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block text-[11px] font-mono font-bold uppercase tracking-widest text-[#FF00C8] mb-3"
          >
            COMPETE • EVALUATE • PROVE
          </motion.div>

          {/* Main Title with Glitch Style */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-4"
          >
            Pro Rooms
          </motion.h1>

          <div className="w-16 h-1 bg-[#FF00C8] mx-auto rounded-full mb-4 shadow-[0_0_10px_#FF00C8]" />

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-2xl mx-auto"
          >
            Join professional events, hackathons, competitions, hiring assessments, and skill-based challenges hosted by verified colleges, companies, and organizations.
          </motion.p>

          {/* THREE CENTERED STATISTICS — Matching Image 3 Layout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-8 py-4 border-y border-white/10 max-w-2xl mx-auto"
          >
            <div>
              <div className="text-3xl font-black text-white font-mono">
                {stats.activeRoomsCount}
              </div>
              <div className="text-xs font-bold text-gray-300 uppercase tracking-wider mt-1">
                Active Pro Rooms
              </div>
              <div className="text-[10px] text-gray-500 italic">Live & Active</div>
            </div>

            <div>
              <div className="text-3xl font-black text-white font-mono">
                {stats.participantsEvaluatedCount}
              </div>
              <div className="text-xs font-bold text-gray-300 uppercase tracking-wider mt-1">
                Participants Evaluated
              </div>
              <div className="text-[10px] text-gray-500 italic">Assessments Completed</div>
            </div>

            <div>
              <div className="text-3xl font-black text-[#00F0FF] font-mono">
                {stats.totalRewardsVal}
              </div>
              <div className="text-xs font-bold text-gray-300 uppercase tracking-wider mt-1">
                Total Rewards & Prizes
              </div>
              <div className="text-[10px] text-gray-500 italic">gBits & Prize Pools</div>
            </div>
          </motion.div>

          {/* HOST CTA BUTTON (Solid Pink Button — User Directive: No gradient, solid pink only) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex justify-center"
          >
            <button
              onClick={() => navigate("/pro-rooms/create")}
              className="px-8 py-3.5 rounded-xl bg-[#FF00C8] hover:bg-[#d600a8] text-white font-bold text-sm shadow-xl shadow-[#FF00C8]/25 transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
            >
              <Plus size={18} /> Host a Pro Room
            </button>
          </motion.div>
        </div>

        {/* MAIN LISTING CONTAINER — Matching Image 2 Design */}
        <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* SEARCH & DROPDOWN FILTERS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Pro Rooms by title, organization, or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#06060c] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-[#00F0FF]"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#06060c] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-[#06060c] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[#06060c] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#06060c] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
              >
                <option value="Newest">Newest</option>
                <option value="Starting Soon">Starting Soon</option>
                <option value="Highest Reward">Highest Reward</option>
              </select>
            </div>
          </div>

          {/* EVENT STATUS TABS matching Image 2 */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10">
            {[
              { id: "all", label: `All Events (${tabCounts.all})` },
              { id: "live", label: `🔴 Live Now (${tabCounts.live})` },
              { id: "upcoming", label: `📅 Upcoming (${tabCounts.upcoming})` },
              { id: "registration_open", label: `📝 Registration Open (${tabCounts.registration_open})` },
              { id: "completed", label: `✓ Completed (${tabCounts.completed})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF]"
                    : "bg-white/5 border border-white/5 text-gray-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* PRO ROOM CARDS GRID — Exactly 3 cards per row on Desktop (User Directive: 3 rooms cards per row) */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-2 border-t-transparent border-[#FF00C8] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-gray-400 font-mono">Fetching Pro Rooms...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            /* POLISHED EMPTY STATE */
            <div className="bg-[#07070e] border border-white/10 rounded-2xl p-10 text-center space-y-4 my-6">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-300">
                <Building2 size={28} />
              </div>
              <h3 className="text-lg font-bold text-white">No Pro Rooms Yet</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                Professional assessments, hackathons, competitions, and hiring events will appear here when organizations start hosting them.
              </p>
              <button
                type="button"
                onClick={() => navigate("/pro-rooms/create")}
                className="px-6 py-2.5 rounded-xl bg-[#FF00C8] hover:bg-[#d600a8] text-white text-xs font-bold shadow-lg shadow-[#FF00C8]/20 transition cursor-pointer inline-flex items-center gap-2"
              >
                <Plus size={16} /> Host a Pro Room
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {filteredRooms.map((room) => (
                <ProRoomCard
                  key={room.id}
                  room={room}
                  onSelect={() => navigate(`/pro-rooms/${room.id}`)}
                />
              ))}
            </div>
          )}

          {/* BOTTOM ORGANIZATION HOST BANNER — Matching Image 2 Bottom Card */}
          <div className="bg-[#07070e] border border-purple-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                <Building2 size={24} className="text-purple-300" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Are you an organization or college?</h4>
                <p className="text-xs text-gray-400">Host your hackathons, assessments, and competitions on Glitch Room.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/pro-rooms/create")}
              className="px-6 py-2.5 rounded-xl bg-[#FF00C8] hover:bg-[#d600a8] text-white text-xs font-bold shadow-lg shadow-[#FF00C8]/25 transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0"
            >
              Host a Pro Room <Plus size={16} />
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProRooms;
