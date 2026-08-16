import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlitchBackground from "../GlitchBackground";
import {
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  Users,
  Trophy,
  Award,
  ArrowRight,
  Zap,
  CheckCircle,
  FileText,
  AlertTriangle,
  Play,
  Share2,
  ExternalLink,
  ChevronRight,
  Info,
  Bell,
  MoreVertical,
  ArrowLeft,
  Megaphone,
  Layers,
  MessageSquare,
  Folder,
  HelpCircle,
  Eye,
  Lock,
  UserPlus,
  UserCheck,
  Edit3,
  BarChart2,
  Settings,
  Trash2,
  X,
  Check,
  Globe,
  MessageCircle,
} from "lucide-react";
import { getProRoomLifecycleState } from "./ProRoomCard";
import { supabase } from "../../supabaseClient";

const ProfessionalRoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Database States
  const [room, setRoom] = useState(null);
  const [sections, setSections] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [userSubmission, setUserSubmission] = useState(null);
  const [userRegistration, setUserRegistration] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState("overview");
  const [isFollowingOrg, setIsFollowingOrg] = useState(false);
  const [showMoreDesc, setShowMoreDesc] = useState(false);

  // Dropdowns States
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThreeDotMenu, setShowThreeDotMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Toast State
  const [toastMsg, setToastMsg] = useState("");
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Live Timer State
  const [timeLeft, setTimeLeft] = useState({ hours: "04", mins: "32", secs: "18" });

  const fetchRoomData = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;
      setCurrentUserId(uid);

      // 1. Fetch Room Metadata
      const { data: roomData } = await supabase
        .from("pro_rooms")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      const currentRoom = roomData || {
        id,
        name: "AI Innovation Hackathon 2026",
        title: "AI Innovation Hackathon 2026",
        short_description: "Build innovative AI solutions that solve real-world problems. Showcase your creativity, technical skills, and problem-solving abilities.",
        detailed_description: "A 48-hour virtual hackathon where innovators, developers, and dreamers come together to build AI-powered solutions for industries such as healthcare, education, sustainability, and more.",
        category: "AI / Machine Learning",
        event_type: "Hackathon",
        org_name: "TechNova University",
        org_logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120",
        cover_image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
        reg_start_at: "2026-04-28T10:00:00Z",
        reg_end_at: "2026-05-15T10:00:00Z",
        event_start_at: "2026-05-18T10:00:00Z",
        event_end_at: "2026-05-20T18:00:00Z",
        timezone: "IST (UTC +05:30)",
        duration_minutes: 2880,
        status: "registration_open",
        max_participants: 500,
        participation_type: "team",
        max_team_size: 4,
        gbits_prize_pool: 2500,
        total_possible_score: 1200,
        passing_score: 50,
      };

      setRoom(currentRoom);

      // 2. Fetch Sections
      const { data: secData } = await supabase
        .from("pro_room_sections")
        .select("*, pro_room_questions(id)")
        .eq("room_id", id)
        .order("order_index", { ascending: true });

      setSections(secData && secData.length > 0 ? secData : [
        { id: "sec-1", section_name: "Problem Statement & Guidelines", description: "Read the problem statement and event guidelines carefully.", status: "completed", order_index: 1 },
        { id: "sec-2", section_name: "Idea Submission", description: "Submit your team idea and problem approach.", status: "completed", order_index: 2 },
        { id: "sec-3", section_name: "Development Phase", description: "Build your solution and implement your idea.", status: "in_progress", progress: 60, order_index: 3 },
        { id: "sec-4", section_name: "Final Submission", description: "Submit your final solution with all required deliverables.", status: "locked", order_index: 4 },
        { id: "sec-5", section_name: "Presentation & Demo", description: "Present your solution to the judges.", status: "locked", order_index: 5 },
        { id: "sec-6", section_name: "FAQ & Clarifications", description: "Get your doubts clarified by the organizers.", status: "upcoming", order_index: 6 },
      ]);

      // 3. Fetch User Registration
      if (uid) {
        const { data: reg } = await supabase
          .from("pro_room_registrations")
          .select("*")
          .eq("room_id", id)
          .eq("user_id", uid)
          .maybeSingle();
        setUserRegistration(reg);

        // Fetch User Submission
        const { data: sub } = await supabase
          .from("pro_room_submissions")
          .select("*")
          .eq("room_id", id)
          .eq("user_id", uid)
          .maybeSingle();
        setUserSubmission(sub);
      }

      // 4. Fetch Registrations Count
      const { data: regList } = await supabase
        .from("pro_room_registrations")
        .select("id")
        .eq("room_id", id);
      setRegistrations(regList || []);

      // 5. Fetch Announcements
      const { data: annData } = await supabase
        .from("pro_room_announcements")
        .select("*")
        .eq("room_id", id)
        .order("created_at", { ascending: false });

      setAnnouncements(
        annData && annData.length > 0
          ? annData
          : [
              {
                id: "a1",
                title: "Hackathon has officially begun! 🚀",
                content: "All the best to everyone. Build, innovate, and have fun!",
                created_at: "May 18, 10:00 AM",
              },
              {
                id: "a2",
                title: "Clarification on Submission",
                content: "Final submission must include GitHub repo and demo video.",
                created_at: "May 18, 11:15 AM",
              },
              {
                id: "a3",
                title: "Mentor Office Hours",
                content: "Join our mentors on Discord between 2PM - 4PM for any help.",
                created_at: "May 18, 01:30 PM",
              },
            ]
      );

      // 6. Set Room-Specific Dynamic Notifications
      setNotifications([
        {
          id: "n1",
          title: "Assessment starts in 30 minutes",
          subtitle: currentRoom.name,
          time: "5 min ago",
          read: false,
          type: "alert",
        },
        {
          id: "n2",
          title: "New announcement from organizer",
          subtitle: "Final submission guidelines updated",
          time: "20 min ago",
          read: false,
          type: "announcement",
        },
        {
          id: "n3",
          title: "Your submission was received",
          subtitle: "Section 2 — Idea Submission",
          time: "1 hr ago",
          read: false,
          type: "submission",
        },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomData();

    // Timer Countdown logic
    const timer = setInterval(() => {
      const now = new Date();
      const end = room?.event_end_at ? new Date(room.event_end_at) : new Date(Date.now() + 16338000);
      const diff = end - now;
      if (diff > 0) {
        const hrs = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
        const mins = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, "0");
        const secs = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");
        setTimeLeft({ hours: hrs, mins, secs });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [id]);

  const markNotificationRead = (notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const handleShareRoom = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast("🔗 Room link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-t-transparent border-[#FF00C8] rounded-full animate-spin" />
      </div>
    );
  }

  const lifecycle = getProRoomLifecycleState(room);
  const isHost = currentUserId && room?.host_id === currentUserId;
  const isTeamEvent = room?.participation_type === "team" || room?.participation_type === "both";
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col justify-between selection:bg-[#00F0FF]/20 overflow-hidden font-sans relative">
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
            <Zap size={14} className="text-amber-400" /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER BAR matching Reference Image */}
      <div className="relative z-30 border-b border-white/10 bg-[#07070e]/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/pro-rooms")}
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Pro Rooms
        </button>

        {/* Right Actions: Share, Bell, 3-Dot Menu */}
        <div className="flex items-center gap-3 relative">
          <button
            type="button"
            onClick={handleShareRoom}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white flex items-center gap-2 transition cursor-pointer"
          >
            <Share2 size={14} /> Share Room
          </button>

          {/* 🔔 ROOM-SPECIFIC NOTIFICATION BELL DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowThreeDotMenu(false);
              }}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition cursor-pointer relative"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF00C8] text-[9px] font-mono font-bold text-white flex items-center justify-center border border-black animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0d0d16] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 font-sans"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <Bell size={14} className="text-[#FF00C8]" /> Room Notifications
                    </h4>
                    <span className="text-[10px] font-mono text-gray-400">{unreadCount} Unread</span>
                  </div>

                  <div className="space-y-2.5 max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-6">No notifications yet.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-3 rounded-xl border transition cursor-pointer ${
                            n.read
                              ? "bg-white/[0.02] border-white/5 text-gray-400 opacity-60"
                              : "bg-[#12121e] border-purple-500/30 text-white hover:border-[#00F0FF]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold block">{n.title}</span>
                            <span className="text-[9px] font-mono text-gray-500 shrink-0">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{n.subtitle}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ⋮ ROLE-BASED 3-DOT MENU DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowThreeDotMenu(!showThreeDotMenu);
                setShowNotifications(false);
              }}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition cursor-pointer"
            >
              <MoreVertical size={16} />
            </button>

            {/* 3-Dot Options Dropdown */}
            <AnimatePresence>
              {showThreeDotMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-64 bg-[#0d0d16] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 text-xs font-sans space-y-1"
                >
                  {/* ORGANIZER / HOST ACTIONS */}
                  {isHost && (
                    <>
                      <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-purple-400 uppercase tracking-widest">
                        Organizer / Host Actions
                      </div>
                      <button
                        onClick={() => navigate(`/pro-rooms/${id}/dashboard`)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2"
                      >
                        <BarChart2 size={14} className="text-[#00F0FF]" /> Organizer Command Dashboard
                      </button>
                      <button
                        onClick={() => navigate(`/pro-rooms/create?edit=${id}`)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2"
                      >
                        <Edit3 size={14} className="text-purple-400" /> Edit Room Configuration
                      </button>
                      <button
                        onClick={() => showToast("📢 Broadcast announcement modal launched!")}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2"
                      >
                        <Megaphone size={14} className="text-amber-400" /> Post Broadcast Announcement
                      </button>
                      <div className="my-1 border-t border-white/10" />
                    </>
                  )}

                  {/* TEAM ACTIONS */}
                  {isTeamEvent && (
                    <>
                      <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                        Team Management
                      </div>
                      <button
                        onClick={() => showToast("👥 Team member invite modal opened!")}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2"
                      >
                        <UserPlus size={14} className="text-[#00F0FF]" /> Invite Team Member
                      </button>
                      <button
                        onClick={() => showToast("⚙️ Manage team roster")}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2"
                      >
                        <Users size={14} className="text-gray-300" /> Manage Team Roster
                      </button>
                      <div className="my-1 border-t border-white/10" />
                    </>
                  )}

                  {/* PARTICIPANT ACTIONS */}
                  <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                    Participant Options
                  </div>
                  <button
                    onClick={() => {
                      setActiveSidebarTab("overview");
                      setShowThreeDotMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2"
                  >
                    <Info size={14} className="text-gray-400" /> Event Details & Overview
                  </button>
                  <button
                    onClick={() => {
                      setActiveSidebarTab("instructions");
                      setShowThreeDotMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2"
                  >
                    <FileText size={14} className="text-gray-400" /> View Official Guidelines
                  </button>
                  <button
                    onClick={handleShareRoom}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2"
                  >
                    <Share2 size={14} className="text-gray-400" /> Share Room Link
                  </button>
                  <button
                    onClick={() => showToast("⚠️ Issue report submitted to host.")}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-red-400 hover:text-red-300 flex items-center gap-2"
                  >
                    <AlertTriangle size={14} /> Report an Issue
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full relative z-10 space-y-6">
        {/* ROOM HEADER & TOP 4 STATS CARDS GRID matching Reference Image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Room Header Info Box (7 Columns ~60%) */}
          <div className="lg:col-span-7 bg-[#0c0c16] border border-white/10 rounded-3xl p-6 flex flex-col justify-between shadow-2xl space-y-4">
            <div className="flex items-start gap-4">
              {/* Cover Banner Thumbnail */}
              <div className="w-28 sm:w-36 h-28 sm:h-32 rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-[#12121e]">
                {room.cover_image ? (
                  <img src={room.cover_image} alt={room.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-purple-900/30">
                    <Building2 size={24} className="text-[#00F0FF]" />
                  </div>
                )}
              </div>

              {/* Title & Badges */}
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                      lifecycle.isLive
                        ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse"
                        : "bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/30"
                    }`}
                  >
                    {lifecycle.label}
                  </span>
                  <span className="text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300">
                    {room.event_type || "Hackathon"}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight truncate">
                  {room.name || room.title}
                </h1>

                {/* Organizer & Follow */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-300 font-bold flex items-center gap-1">
                    By {room.org_name || "TechNova University"}
                    <ShieldCheck size={13} className="text-[#00F0FF]" />
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFollowingOrg(!isFollowingOrg)}
                    className="px-3 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[10px] font-bold border border-purple-500/30 transition cursor-pointer"
                  >
                    {isFollowingOrg ? "✓ Following" : "Follow"}
                  </button>
                </div>

                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {room.short_description}
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex items-center gap-4 pt-3 border-t border-white/5 text-xs font-mono">
              <a href={room.website || "#"} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#00F0FF] flex items-center gap-1.5">
                <Globe size={13} /> Website
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-300 flex items-center gap-1.5">
                <MessageCircle size={13} /> Discord
              </a>
              <button onClick={() => setActiveSidebarTab("announcements")} className="text-gray-400 hover:text-amber-400 flex items-center gap-1.5 cursor-pointer">
                <Megaphone size={13} /> Announcements
              </button>
            </div>
          </div>

          {/* TOP 4 STATS CARDS GRID matching Reference Image (5 Columns ~40%) */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            {/* Card 1: Time Remaining */}
            <div className="bg-[#0c0c16] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1"><Clock size={13} className="text-purple-400" /> Time Remaining</span>
              </div>
              <div className="my-2">
                <div className="text-xl font-black font-mono text-white flex items-center gap-1">
                  <span>{timeLeft.hours}</span>:<span className="text-[#00F0FF]">{timeLeft.mins}</span>:<span className="text-[#FF00C8]">{timeLeft.secs}</span>
                </div>
                <div className="text-[9px] font-mono text-gray-500 flex gap-3 mt-0.5">
                  <span>HRS</span><span>MINS</span><span>SECS</span>
                </div>
              </div>
              <span className="text-[10px] text-gray-500 border-t border-white/5 pt-1">Ends May 20, 2026 06:00 PM</span>
            </div>

            {/* Card 2: Your Progress */}
            <div className="bg-[#0c0c16] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1"><Zap size={13} className="text-[#00F0FF]" /> Your Progress</span>
              </div>
              <div className="my-2 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-[#00F0FF] flex items-center justify-center text-xs font-mono font-bold text-white">
                  66%
                </div>
                <span className="text-[11px] text-gray-300 font-bold">4 / 6 Sections Completed</span>
              </div>
              <span className="text-[10px] text-gray-500 border-t border-white/5 pt-1">Active Submission Phase</span>
            </div>

            {/* Card 3: Your Rank & Score */}
            <div className="bg-[#0c0c16] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1"><Trophy size={13} className="text-amber-400" /> Your Rank</span>
              </div>
              <div className="my-2">
                <div className="text-xl font-black text-white font-mono">
                  17 <span className="text-xs text-gray-500 font-normal">/ 432</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono font-bold">Score: 842 / 1200</span>
              </div>
              <span className="text-[10px] text-gray-500 border-t border-white/5 pt-1">Top 5% Standing</span>
            </div>

            {/* Card 4: Participants */}
            <div className="bg-[#0c0c16] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1"><Users size={13} className="text-[#00F0FF]" /> Participants</span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-white font-mono">
                  {registrations.length || 432}
                </div>
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  Online: 128 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </span>
              </div>
              <span className="text-[10px] text-gray-500 border-t border-white/5 pt-1">Active Candidates</span>
            </div>
          </div>
        </div>

        {/* 3-COLUMN MAIN BODY LAYOUT matching Reference Image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDEBAR TABS & ORGANIZER CARD (2 Columns ~18%) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0c0c16] border border-white/10 rounded-2xl p-2 space-y-1 shadow-xl text-xs font-bold">
              {[
                { id: "overview", label: "Overview", icon: Eye },
                { id: "instructions", label: "Instructions", icon: FileText },
                { id: "announcements", label: "Announcements", icon: Megaphone, count: announcements.length },
                { id: "sections", label: "Sections", icon: Layers, count: sections.length },
                { id: "submissions", label: "Submissions", icon: CheckCircle },
                { id: "leaderboard", label: "Leaderboard", icon: Trophy },
                { id: "discussion", label: "Discussion", icon: MessageSquare, count: 12 },
                { id: "organizers", label: "Organizers", icon: Building2 },
                { id: "resources", label: "Resources", icon: Folder },
                { id: "help", label: "Help & Support", icon: HelpCircle },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeSidebarTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSidebarTab(item.id)}
                    className={`w-full px-3 py-2.5 rounded-xl transition flex items-center justify-between cursor-pointer ${
                      isActive
                        ? "bg-[#FF00C8]/15 border border-[#FF00C8]/40 text-[#FF00C8]"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={14} /> {item.label}
                    </span>
                    {item.count !== undefined && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${isActive ? "bg-[#FF00C8] text-white" : "bg-white/10 text-gray-400"}`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Organizer Card in Left Sidebar */}
            <div className="bg-[#0c0c16] border border-white/10 rounded-2xl p-4 text-center space-y-3 shadow-xl">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Event by</span>
              {room.org_logo ? (
                <img src={room.org_logo} alt="Org Logo" className="w-12 h-12 rounded-2xl mx-auto object-cover border border-white/10" />
              ) : (
                <Building2 size={28} className="text-[#00F0FF] mx-auto" />
              )}
              <h5 className="text-xs font-bold text-white flex items-center justify-center gap-1">
                {room.org_name || "TechNova University"} <ShieldCheck size={12} className="text-[#00F0FF]" />
              </h5>
              <button
                onClick={() => showToast("Organizer Profile Modal launched!")}
                className="w-full py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-gray-300 transition cursor-pointer"
              >
                View Profile
              </button>
            </div>
          </div>

          {/* CENTER MAIN CONTENT AREA (7 Columns ~58%) */}
          <div className="lg:col-span-7 space-y-6">
            {/* About This Event Card */}
            <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Info size={16} className="text-purple-400" /> About This Event
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {room.detailed_description || room.short_description}
                </p>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
                <div>
                  <span className="text-gray-500 block text-[10px] font-mono">Team Event</span>
                  <span className="text-white font-bold">{isTeamEvent ? `2 - ${room.max_team_size || 4} Members` : "Individual"}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] font-mono">End Date</span>
                  <span className="text-white font-bold">May 20, 2026 06:00 PM</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] font-mono">Registration</span>
                  <span className="text-white font-bold">May 1 – May 15, 2026</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] font-mono">Eligibility</span>
                  <span className="text-white font-bold">{room.target_college || "Open for all students"}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] font-mono">Start Date</span>
                  <span className="text-white font-bold">May 18, 2026 10:00 AM</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] font-mono">Timezone</span>
                  <span className="text-white font-bold">{room.timezone || "IST (UTC +05:30)"}</span>
                </div>
              </div>
            </div>

            {/* Assessment / Competition Sections List Card matching Reference Image */}
            <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers size={16} className="text-[#00F0FF]" /> Assessment Sections
                </h3>
                <span className="text-xs font-mono text-purple-400 font-bold hover:underline cursor-pointer">
                  View All Sections ›
                </span>
              </div>

              <div className="space-y-3">
                {sections.map((sec, idx) => {
                  const isCompleted = sec.status === "completed";
                  const isInProgress = sec.status === "in_progress";
                  const isLocked = sec.status === "locked";

                  return (
                    <div
                      key={sec.id || idx}
                      onClick={() => !isLocked && navigate(`/pro-rooms/${id}/assessment`)}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                        isInProgress
                          ? "bg-[#121222] border-purple-500/50 shadow-lg shadow-purple-500/10"
                          : isCompleted
                          ? "bg-white/[0.02] border-emerald-500/30"
                          : "bg-white/[0.02] border-white/5 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-xl font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                            isCompleted
                              ? "bg-emerald-500 text-black"
                              : isInProgress
                              ? "bg-purple-600 text-white"
                              : "bg-white/10 text-gray-400"
                          }`}
                        >
                          {idx + 1}
                        </span>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{sec.section_name}</h4>
                          <p className="text-[11px] text-gray-400 truncate">{sec.description || "Read guidelines and complete assessment tasks."}</p>
                        </div>
                      </div>

                      {/* Status Pills */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isCompleted && (
                          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                            COMPLETED <Check size={12} />
                          </span>
                        )}

                        {isInProgress && (
                          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center gap-1">
                            IN PROGRESS (60% Submitted)
                          </span>
                        )}

                        {isLocked && (
                          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-gray-500/10 border border-gray-500/30 text-gray-400 flex items-center gap-1">
                            LOCKED <Lock size={12} />
                          </span>
                        )}

                        <ChevronRight size={16} className="text-gray-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR (3 Columns ~24%) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Announcements Box matching Reference Image */}
            <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                  <Megaphone size={14} className="text-purple-400" /> Announcements
                </h4>
                <span className="text-[10px] font-mono text-purple-400 cursor-pointer">View All</span>
              </div>

              <div className="space-y-3">
                {announcements.map((a) => (
                  <div key={a.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span className="truncate">{a.title}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{a.content}</p>
                    <span className="text-[9px] font-mono text-gray-500 block pt-1">{a.created_at || "Recent Update"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Your Team Box (for Team Events) matching Reference Image */}
            {isTeamEvent && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest">Your Team</h4>
                  <span onClick={() => showToast("Team roster manager launched!")} className="text-[10px] font-mono text-purple-400 cursor-pointer">
                    Manage
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="w-9 h-9 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                    <Users size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Neural Ninjas</span>
                    <span className="text-[10px] text-gray-400">4 Members</span>
                  </div>
                </div>

                {/* Team Avatars Stack */}
                <div className="flex items-center gap-1.5 pt-2">
                  {["N", "A", "R"].map((initial, i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 border border-black text-[10px] font-bold flex items-center justify-center text-white">
                      {initial}
                    </div>
                  ))}
                  <div className="w-7 h-7 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold flex items-center justify-center text-gray-300">
                    +1
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions Box matching Reference Image */}
            <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-3">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest mb-2">Quick Actions</h4>

              {/* Solid Pink Primary Action Button (User Directive) */}
              <button
                type="button"
                onClick={() => navigate(`/pro-rooms/${id}/assessment`)}
                className="w-full py-3 rounded-xl bg-[#FF00C8] hover:bg-[#d600a8] text-white text-xs font-bold transition shadow-lg shadow-[#FF00C8]/25 cursor-pointer flex items-center justify-between px-4"
              >
                <span>Go to Current Section</span>
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => setActiveSidebarTab("leaderboard")}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition cursor-pointer flex items-center justify-between px-4"
              >
                <span>View Leaderboard</span>
                <ChevronRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => showToast("💬 Question submitted to host mentors.")}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition cursor-pointer flex items-center justify-between px-4"
              >
                <span>Ask a Doubt</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* BOTTOM STICKY BAR matching Reference Image (No Footer on this page) */}
      <div className="sticky bottom-0 z-40 border-t border-white/10 bg-[#07070e]/95 backdrop-blur-md px-6 py-3 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-6 overflow-x-auto w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-purple-400" />
              <div>
                <span className="text-white font-bold block">338 gBits</span>
                <span className="text-[9px] text-gray-500">Your Balance</span>
              </div>
            </div>

            <div className="flex items-center gap-2 border-l border-white/10 pl-6">
              <Trophy size={16} className="text-amber-400" />
              <div>
                <span className="text-white font-bold block">Top 10</span>
                <span className="text-[9px] text-gray-500">Target Rank</span>
              </div>
            </div>

            <div className="flex items-center gap-2 border-l border-white/10 pl-6">
              <Award size={16} className="text-[#00F0FF]" />
              <div>
                <span className="text-white font-bold block">{room?.total_possible_score || 1200}</span>
                <span className="text-[9px] text-gray-500">Total Points</span>
              </div>
            </div>

            <div className="flex items-center gap-2 border-l border-white/10 pl-6">
              <Calendar size={16} className="text-purple-400" />
              <div>
                <span className="text-white font-bold block">May 20, 06:00 PM</span>
                <span className="text-[9px] text-gray-500">Event Ends</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => showToast("🎧 Live support assistant activated.")}
            className="px-4 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0"
          >
            <HelpCircle size={14} /> Need Help?
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalRoomDetail;
