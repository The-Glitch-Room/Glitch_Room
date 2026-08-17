import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import Footer from "../Footer";
import GlitchBackground from "../GlitchBackground";
import PageHeading from "../PageHeading";
import StatCard from "../StatCard";
import Button from "../Button";
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

const formatNumber = (n) => {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
};

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
  const [activeTab, setActiveTab] = useState("all");

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
      const liveCount = roomList.length;

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

  const statItems = [
    {
      value: formatNumber(stats.activeRoomsCount),
      label: "ACTIVE PRO ROOMS",
      sublabel: "Live & Active",
    },
    {
      value: stats.participantsEvaluatedCount > 0 ? formatNumber(stats.participantsEvaluatedCount) : "0",
      label: "PARTICIPANTS EVALUATED",
      sublabel: "Assessments Completed",
    },
    {
      value: stats.totalRewardsVal,
      label: "TOTAL REWARDS & PRIZES",
      sublabel: "gBits & Prize Pools",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#070709] text-white flex flex-col justify-between selection:bg-[#00F0FF]/20 overflow-hidden font-sans">
      <GlitchBackground />

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

        {/* ── HERO HEADER (EXACT CREATOR ROOMS TEMPLATE) ── */}
        <section className="relative pt-36 md:pt-44 pb-12 px-6 mb-8 md:mb-16 text-center">
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <PageHeading
              eyebrow="COMPETE • EVALUATE • PROVE"
              title="Pro Rooms"
              subtitle="Join professional events, hackathons, competitions, hiring assessments, and skill-based challenges hosted by verified colleges, companies, and organizations."
              accent="cyan"
              size="xl"
            />

            {/* Bare Real Stats without Horizontal Border Lines */}
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

            {/* CTA Button matching Creator Rooms Pill Button */}
            <div className="flex justify-center" onClick={() => navigate("/pro-rooms/create")}>
              <Button content="+ Host a Pro Room" accent="pink" />
            </div>
          </div>
        </section>

        {/* ── MAIN LISTING CONTAINER ── */}
        <section className="max-w-6xl mx-auto px-6 w-full mb-16">
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

            {/* EVENT STATUS TABS */}
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

            {/* PRO ROOM CARDS GRID — 3 Cards per Row */}
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
                <div className="flex justify-center" onClick={() => navigate("/pro-rooms/create")}>
                  <Button content="+ Host a Pro Room" accent="pink" />
                </div>
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

            {/* BOTTOM ORGANIZATION HOST BANNER */}
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

              <div onClick={() => navigate("/pro-rooms/create")}>
                <Button content="Host a Pro Room +" accent="pink" />
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default ProRooms;
