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
import ProRoomRegistrationModal from "./ProRoomRegistrationModal";
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
  "Completed",
  "My Drafts 📝",
];

const formatNumber = (n) => {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
};

const ProRooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("Newest");
  const [activeTab, setActiveTab] = useState("all");

  // Statistics State (Calculated Dynamically from Database & Room Lifecycle)
  const [stats, setStats] = useState({
    activeRoomsCount: 0,
    completedRoomsCount: 0,
    participantsEvaluatedCount: 0,
  });

  // Registration State
  const [userRegistrations, setUserRegistrations] = useState({});
  const [selectedRegRoom, setSelectedRegRoom] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const fetchProRoomsFromDB = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id || null;
      setCurrentUserId(uid);

      // 1. Fetch Rooms from Supabase
      const { data: dbRooms, error } = await supabase
        .from("pro_rooms")
        .select("*")
        .order("created_at", { ascending: false });

      const roomList = dbRooms || [];
      setRooms(roomList);

      // 2. Fetch User Registrations from Supabase
      if (uid) {
        const { data: regs } = await supabase
          .from("pro_room_registrations")
          .select("room_id, status")
          .eq("user_id", uid);

        if (regs) {
          const map = {};
          regs.forEach((r) => (map[r.room_id] = r.status));
          setUserRegistrations(map);
        }
      }

      // 3. Fetch Submissions Count from Supabase
      const { count: subsCount } = await supabase
        .from("pro_room_submissions")
        .select("*", { count: "exact", head: true });

      // 4. Compute Dynamic Hero Stats
      const liveCount = roomList.filter((r) => getProRoomLifecycleState(r).isLive).length;
      const completedCount = roomList.filter((r) => getProRoomLifecycleState(r).key === "completed").length;

      setStats({
        activeRoomsCount: liveCount,
        completedRoomsCount: completedCount,
        participantsEvaluatedCount: subsCount || 0,
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

      // Status & Draft protection logic
      const state = getProRoomLifecycleState(room);
      const isDraft = room.status === "draft";
      const isMyDraft = isDraft && currentUserId && room.host_id === currentUserId;

      // Drafts belong ONLY to their host in "My Drafts" tab / status
      if (activeTab === "drafts" || selectedStatus === "My Drafts 📝") {
        return isMyDraft && (
          (room.name || room.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (room.org_name || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Public discovery tabs MUST hide draft rooms
      if (isDraft) return false;

      let matchesStatus = true;
      if (selectedStatus === "Live") matchesStatus = state.isLive;
      else if (selectedStatus === "Registration Open") matchesStatus = state.key === "registration_open";
      else if (selectedStatus === "Upcoming") matchesStatus = state.key === "upcoming";
      else if (selectedStatus === "Completed") matchesStatus = state.key === "completed";

      // Tab filter
      let matchesTab = true;
      if (activeTab === "live") matchesTab = state.isLive;
      else if (activeTab === "upcoming") matchesTab = state.key === "upcoming";
      else if (activeTab === "registration_open") matchesTab = state.key === "registration_open";
      else if (activeTab === "completed") matchesTab = state.key === "completed";

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

  // Calculate Dynamic Tab Counts
  const tabCounts = {
    all: rooms.filter((r) => r.status !== "draft").length,
    live: rooms.filter((r) => r.status !== "draft" && getProRoomLifecycleState(r).isLive).length,
    upcoming: rooms.filter((r) => r.status !== "draft" && getProRoomLifecycleState(r).key === "upcoming").length,
    registration_open: rooms.filter((r) => r.status !== "draft" && getProRoomLifecycleState(r).key === "registration_open").length,
    completed: rooms.filter((r) => r.status !== "draft" && getProRoomLifecycleState(r).key === "completed").length,
    drafts: rooms.filter((r) => r.status === "draft" && currentUserId && r.host_id === currentUserId).length,
  };

  const statItems = [
    {
      value: formatNumber(stats.activeRoomsCount || 0),
      label: "ACTIVE PRO ROOMS",
      sublabel: "Live & Active",
    },
    {
      value: formatNumber(stats.participantsEvaluatedCount || 0),
      label: "PARTICIPANTS EVALUATED",
      sublabel: "Assessments Completed",
    },
    {
      value: formatNumber(stats.completedRoomsCount || 0),
      label: "COMPLETED PRO ROOMS",
      sublabel: "Assessments & Events Finished",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#070709] text-white flex flex-col justify-between selection:bg-[#00F0FF]/20 overflow-hidden font-sans">
      <GlitchBackground />

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

        {/* ── HERO HEADER ── */}
        <section className="relative pt-36 md:pt-44 pb-12 px-6 mb-8 md:mb-12 text-center">
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <PageHeading
              eyebrow="COMPETE • EVALUATE • PROVE"
              title="Pro Rooms"
              subtitle="Join professional events, hackathons, competitions, hiring assessments, and skill-based challenges hosted by verified colleges, companies, and organizations."
              accent="cyan"
              size="xl"
            />

            {/* Dynamic Hero Stats */}
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

            {/* CTA Buttons */}
            <div className="flex justify-center items-center gap-3 flex-wrap">
              <div onClick={() => navigate("/pro-rooms/create")}>
                <Button content="+ Host a Pro Room" accent="pink" />
              </div>
              {currentUserId && tabCounts.drafts > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("drafts")}
                  className="px-5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition cursor-pointer flex items-center gap-2"
                >
                  📝 My Saved Drafts ({tabCounts.drafts})
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── SEARCH & DROPDOWN FILTERS CONTAINER ── */}
        <section className="max-w-6xl mx-auto px-6 w-full mb-8">
          <div className="bg-[#0c0c16]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
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
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-t border-white/10 pt-4">
              {[
                { id: "all", label: `All Events (${tabCounts.all})` },
                { id: "live", label: `🔴 Live Now (${tabCounts.live})` },
                { id: "upcoming", label: `📅 Upcoming (${tabCounts.upcoming})` },
                { id: "registration_open", label: `📝 Registration Open (${tabCounts.registration_open})` },
                { id: "completed", label: `✓ Completed (${tabCounts.completed})` },
                ...(currentUserId ? [{ id: "drafts", label: `📝 My Drafts (${tabCounts.drafts})` }] : []),
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
          </div>
        </section>

        {/* ── PRO ROOM CARDS GRID (Directly over GlitchBackground) ── */}
        <section className="max-w-6xl mx-auto px-6 pb-24 w-full flex-1">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-2 border-t-transparent border-[#FF00C8] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-gray-400 font-mono">Fetching Pro Rooms...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="bg-[#07070e]/80 border border-white/10 rounded-2xl p-10 text-center space-y-4 my-6 backdrop-blur-md">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-300">
                <Building2 size={28} />
              </div>
              <h3 className="text-lg font-bold text-white">No Pro Rooms Found</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                No rooms match your filter criteria. Try selecting another status tab or category.
              </p>
              <div className="flex justify-center" onClick={() => navigate("/pro-rooms/create")}>
                <Button content="+ Host a Pro Room" accent="pink" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room) => {
                const regStatus = userRegistrations && room ? userRegistrations[room.id] : undefined;
                const isReg = regStatus === "approved" || regStatus === "pending" || Boolean(regStatus);

                return (
                  <ProRoomCard
                    key={room.id}
                    room={room}
                    isRegistered={isReg}
                    userRegStatus={regStatus}
                    onSelect={() => {
                      const state = getProRoomLifecycleState(room);
                      const now = new Date();
                      const regStart = room.reg_start_at ? new Date(room.reg_start_at) : null;
                      const regEnd = room.reg_end_at ? new Date(room.reg_end_at) : null;

                      if (room.status === "draft") {
                        navigate(`/pro-rooms/create?edit=${room.id}`);
                      } else if (isReg || state.key === "completed") {
                        navigate(`/pro-rooms/${room.id}`);
                      } else if (regStart && now < regStart) {
                        const dateStr = new Date(room.reg_start_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                        showToast(`Registration for this room opens on ${dateStr}`);
                        navigate(`/pro-rooms/${room.id}`);
                      } else if ((regEnd && now > regEnd) || state.isLive) {
                        showToast("Sorry, registration for this room is closed. Please check out other rooms.");
                        navigate(`/pro-rooms/${room.id}`);
                      } else {
                        setSelectedRegRoom(room);
                      }
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* BOTTOM ORGANIZATION HOST BANNER */}
          <div className="bg-[#07070e]/80 border border-purple-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 shadow-xl backdrop-blur-md">
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
        </section>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0c0c16] border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Pro Room Registration Modal */}
      <ProRoomRegistrationModal
        isOpen={Boolean(selectedRegRoom)}
        onClose={() => setSelectedRegRoom(null)}
        room={selectedRegRoom}
        showToast={showToast}
        onRegistrationSuccess={(payload) => {
          if (selectedRegRoom) {
            setUserRegistrations((prev) => ({ ...prev, [selectedRegRoom.id]: "approved" }));
            navigate(`/pro-rooms/${selectedRegRoom.id}`);
          }
        }}
      />

      <Footer />
    </div>
  );
};

export default ProRooms;
