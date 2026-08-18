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
  Plus,
  Send,
  LogOut,
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
  const [leaderboard, setLeaderboard] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [userSubmission, setUserSubmission] = useState(null);
  const [userRegistration, setUserRegistration] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userGbits, setUserGbits] = useState(0);

  const [loading, setLoading] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState("overview");
  const [isFollowingOrg, setIsFollowingOrg] = useState(false);

  // Dynamic Database Host Verification
  const isHost = Boolean(currentUserId && room && (room.host_id === currentUserId || room.created_by === currentUserId));

  // Dropdowns States
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThreeDotMenu, setShowThreeDotMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Form States for Discussion & Announcement
  const [discTitle, setDiscTitle] = useState("");
  const [discContent, setDiscContent] = useState("");
  const [postingDisc, setPostingDisc] = useState(false);

  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [postingAnn, setPostingAnn] = useState(false);

  // Toast State
  const [toastMsg, setToastMsg] = useState("");
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Live Countdown State
  const [timeLeft, setTimeLeft] = useState({ hours: "00", mins: "00", secs: "00" });

  const fetchRoomData = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;
      setCurrentUserId(uid);

      if (uid) {
        // Fetch User gBits Balance
        const { data: prof } = await supabase
          .from("profiles")
          .select("gbits")
          .eq("id", uid)
          .maybeSingle();
        setUserGbits(prof?.gbits || 0);
      }

      // 1. Fetch Room Metadata
      const { data: roomData } = await supabase
        .from("pro_rooms")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      const currentRoom = roomData || {
        id,
        name: "Pro Assessment Arena",
        title: "Pro Assessment Arena",
        short_description: "Time-bound professional evaluation arena for candidates.",
        detailed_description: "Comprehensive evaluation arena featuring timed sections, automated code execution, and leaderboards.",
        category: "Software Engineering",
        event_type: "Technical Assessment",
        org_name: "Verified Organization",
        org_logo: null,
        cover_image: null,
        reg_start_at: new Date().toISOString(),
        reg_end_at: new Date(Date.now() + 86400000).toISOString(),
        event_start_at: new Date().toISOString(),
        event_end_at: new Date(Date.now() + 172800000).toISOString(),
        timezone: "IST (UTC +05:30)",
        duration_minutes: 2880,
        status: "registration_open",
        max_participants: 500,
        participation_type: "individual",
        max_team_size: 1,
        gbits_prize_pool: 1000,
        total_possible_score: 300,
        passing_score: 50,
      };

      setRoom(currentRoom);

      // 2. Fetch Sections & Question Counts
      const { data: secData } = await supabase
        .from("pro_room_sections")
        .select("*, pro_room_questions(id, points)")
        .eq("room_id", id)
        .order("order_index", { ascending: true });

      setSections(secData || []);

      // 3. Fetch User Registration & User's OWN Submission
      if (uid) {
        const { data: reg } = await supabase
          .from("pro_room_registrations")
          .select("*")
          .eq("room_id", id)
          .eq("user_id", uid)
          .maybeSingle();
        setUserRegistration(reg);

        const { data: sub } = await supabase
          .from("pro_room_submissions")
          .select("*")
          .eq("room_id", id)
          .eq("user_id", uid)
          .maybeSingle();
        setUserSubmission(sub);
      }

      // 4. Fetch All Submissions (ONLY IF HOST / ORGANIZER)
      const isHostUser = uid && currentRoom.host_id === uid;
      if (isHostUser) {
        const { data: allSubs } = await supabase
          .from("pro_room_submissions")
          .select("*, profiles(full_name, username, avatar_url)")
          .eq("room_id", id);
        setSubmissions(allSubs || []);
      }

      // 5. Fetch Registrations Roster
      const { data: regList } = await supabase
        .from("pro_room_registrations")
        .select("*, profiles(full_name, username, avatar_url)")
        .eq("room_id", id);
      setRegistrations(regList || []);

      // 6. Fetch Leaderboard
      const { data: lbData } = await supabase
        .from("pro_room_leaderboard")
        .select("*, profiles(full_name, username, avatar_url)")
        .eq("room_id", id)
        .order("total_score", { ascending: false });
      setLeaderboard(lbData || []);

      // 7. Fetch Announcements
      const { data: annData } = await supabase
        .from("pro_room_announcements")
        .select("*")
        .eq("room_id", id)
        .order("created_at", { ascending: false });
      setAnnouncements(annData || []);

      // 8. Fetch Discussions
      const { data: discData } = await supabase
        .from("pro_room_discussions")
        .select("*, profiles(full_name, username, avatar_url)")
        .eq("room_id", id)
        .order("created_at", { ascending: false });
      setDiscussions(discData || []);

      // 9. Set Notifications
      setNotifications([
        {
          id: "n1",
          title: "Assessment Environment Live",
          subtitle: currentRoom.name,
          time: "Just now",
          read: false,
        },
        {
          id: "n2",
          title: "Official guidelines available",
          subtitle: "Check Instructions tab for rules",
          time: "10 min ago",
          read: false,
        },
      ]);
    } catch (err) {
      console.error("Error loading room data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomData();

    const timer = setInterval(() => {
      const now = new Date();
      const end = room?.event_end_at ? new Date(room.event_end_at) : new Date(Date.now() + 172800000);
      const diff = end - now;
      if (diff > 0) {
        const hrs = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
        const mins = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, "0");
        const secs = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");
        setTimeLeft({ hours: hrs, mins, secs });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [room?.event_end_at]);

  useEffect(() => {
    if (!loading && room && !isHost && activeSidebarTab.startsWith("host_")) {
      setActiveSidebarTab("overview");
    }
  }, [isHost, activeSidebarTab, loading]);

  const markNotificationRead = (notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const handleShareRoom = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast("🔗 Room link copied to clipboard!");
  };

  const handlePostDiscussion = async () => {
    if (!discTitle || !discContent) return;
    setPostingDisc(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      await supabase.from("pro_room_discussions").insert({
        room_id: id,
        user_id: authData?.user?.id,
        title: discTitle,
        content: discContent,
      });

      setDiscTitle("");
      setDiscContent("");
      showToast("💬 Question posted to discussion feed!");
      fetchRoomData();
    } catch (err) {
      console.error(err);
    } finally {
      setPostingDisc(false);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!annTitle || !annContent) return;
    setPostingAnn(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      await supabase.from("pro_room_announcements").insert({
        room_id: id,
        author_id: authData?.user?.id,
        title: annTitle,
        content: annContent,
      });

      setAnnTitle("");
      setAnnContent("");
      showToast("📢 Broadcast announcement posted!");
      fetchRoomData();
    } catch (err) {
      console.error(err);
    } finally {
      setPostingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (annId) => {
    try {
      await supabase.from("pro_room_announcements").delete().eq("id", annId);
      showToast("🗑️ Announcement deleted.");
      fetchRoomData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-t-transparent border-[#FF00C8] rounded-full animate-spin" />
      </div>
    );
  }

  const lifecycle = getProRoomLifecycleState(room);
  const isTeamEvent = room?.participation_type === "team" || room?.participation_type === "both";
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Compute User Specific Rank & Score
  const myRankItem = leaderboard.find((l) => l.user_id === currentUserId);
  const userRankDisplay = myRankItem ? `#${myRankItem.rank}` : "—";
  const userScoreDisplay = userSubmission?.total_score || myRankItem?.total_score || 0;
  const totalPossible = room?.total_possible_score || 300;

  // Format Event End Time
  const eventEndFormatted = room?.event_end_at
    ? new Date(room.event_end_at).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

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

      {/* TOP HEADER BAR */}
      <div className="relative z-30 border-b border-white/10 bg-[#07070e]/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/pro-rooms")}
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Pro Rooms
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-3 relative">
          <button
            type="button"
            onClick={handleShareRoom}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white flex items-center gap-2 transition cursor-pointer"
          >
            <Share2 size={14} /> Share Room
          </button>

          {/* 🔔 ROOM NOTIFICATION BELL */}
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

          {/* ⋮ STRICT ROLE-BASED 3-DOT MENU */}
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
                  {/* DIRECTIVE 1 & 2: RENDER EXCLUSIVELY HOST OR PARTICIPANT OPTIONS */}
                  {isHost ? (
                    /* HOST / CREATOR EXCLUSIVE ACTIONS */
                    <>
                      <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-purple-400 uppercase tracking-widest">
                        Host Management Actions
                      </div>
                      <button
                        onClick={() => {
                          setActiveSidebarTab("host_dashboard");
                          setShowThreeDotMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer"
                      >
                        <BarChart2 size={14} className="text-[#00F0FF]" /> Command Dashboard
                      </button>
                      <button
                        onClick={() => navigate(`/pro-rooms/create?edit=${id}`)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer"
                      >
                        <Edit3 size={14} className="text-purple-400" /> Edit Room Configuration
                      </button>
                      <button
                        onClick={() => {
                          setActiveSidebarTab("host_announcements");
                          setShowThreeDotMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer"
                      >
                        <Megaphone size={14} className="text-amber-400" /> Post Announcement
                      </button>
                      <button
                        onClick={() => {
                          setActiveSidebarTab("host_participants");
                          setShowThreeDotMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer"
                      >
                        <Users size={14} className="text-gray-300" /> Manage Participants
                      </button>
                      <button
                        onClick={() => {
                          setActiveSidebarTab("host_assessment");
                          setShowThreeDotMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer"
                      >
                        <Layers size={14} className="text-cyan-400" /> Manage Assessment
                      </button>
                      <button
                        onClick={() => {
                          setActiveSidebarTab("host_submissions");
                          setShowThreeDotMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle size={14} className="text-emerald-400" /> Manage Submissions & Evaluation
                      </button>
                      <button
                        onClick={handleShareRoom}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer"
                      >
                        <Share2 size={14} className="text-gray-400" /> Share Room Link
                      </button>
                      <div className="my-1 border-t border-white/10" />
                      <button
                        onClick={() => showToast("⚠️ Room settings updated.")}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-red-400 hover:text-red-300 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 size={14} /> Archive / Delete Room
                      </button>
                    </>
                  ) : (
                    /* PARTICIPANT EXCLUSIVE OPTIONS (NEVER SHOW HOST HEADER) */
                    <>
                      <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                        Participant Actions
                      </div>
                      <button
                        onClick={() => {
                          setActiveSidebarTab("overview");
                          setShowThreeDotMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer"
                      >
                        <Info size={14} className="text-gray-400" /> Event Overview
                      </button>
                      <button
                        onClick={() => {
                          setActiveSidebarTab("instructions");
                          setShowThreeDotMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer"
                      >
                        <FileText size={14} className="text-gray-400" /> View Guidelines
                      </button>
                      <button
                        onClick={handleShareRoom}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer"
                      >
                        <Share2 size={14} className="text-gray-400" /> Share Room Link
                      </button>
                      <button
                        onClick={() => showToast("⚠️ Issue report submitted to host.")}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer"
                      >
                        <AlertTriangle size={14} className="text-amber-400" /> Report an Issue
                      </button>
                      <button
                        onClick={() => showToast("🚪 Left room successfully.")}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-red-400 hover:text-red-300 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut size={14} /> Leave Room
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full relative z-10 space-y-6">
        {/* ROOM HEADER & TOP 4 STATS CARDS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Room Header Info Box */}
          <div className="lg:col-span-7 bg-[#0c0c16] border border-white/10 rounded-3xl p-6 flex flex-col justify-between shadow-2xl space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-28 sm:w-36 h-28 sm:h-32 rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-[#12121e]">
                {room.cover_image ? (
                  <img src={room.cover_image} alt={room.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-purple-900/30">
                    <Building2 size={24} className="text-[#00F0FF]" />
                  </div>
                )}
              </div>

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
                  {isHost && (
                    <span className="text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                      ★ ROOM HOST
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight truncate">
                  {room.name || room.title}
                </h1>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-300 font-bold flex items-center gap-1">
                    By {room.org_name || "Verified Organization"}
                    <ShieldCheck size={13} className="text-[#00F0FF]" />
                  </span>
                  {!isHost && (
                    <button
                      type="button"
                      onClick={() => setIsFollowingOrg(!isFollowingOrg)}
                      className="px-3 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[10px] font-bold border border-purple-500/30 transition cursor-pointer"
                    >
                      {isFollowingOrg ? "✓ Following" : "Follow"}
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {room.short_description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-3 border-t border-white/5 text-xs font-mono">
              <a href={room.website || "#"} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#00F0FF] flex items-center gap-1.5">
                <Globe size={13} /> Website
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-300 flex items-center gap-1.5">
                <MessageCircle size={13} /> Discord
              </a>
            </div>
          </div>

          {/* TOP 4 STATS CARDS GRID */}
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
              <span className="text-[10px] text-gray-500 border-t border-white/5 pt-1">Active Timeline</span>
            </div>

            {/* Card 2: Roster Progress / Your Progress */}
            <div className="bg-[#0c0c16] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1"><Zap size={13} className="text-[#00F0FF]" /> {isHost ? "Roster Progress" : "Your Progress"}</span>
              </div>
              <div className="my-2 flex items-center gap-3">
                {isHost ? (
                  registrations.length === 0 ? (
                    <div>
                      <span className="text-xs font-bold text-gray-400 block">No participants yet</span>
                      <span className="text-[10px] text-gray-500 font-mono">Waiting for registrations</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-[#00F0FF] flex items-center justify-center text-xs font-mono font-bold text-white shrink-0">
                        {Math.round((submissions.length / registrations.length) * 100)}%
                      </div>
                      <span className="text-[11px] text-gray-300 font-bold">
                        {submissions.length} / {registrations.length} Submitted
                      </span>
                    </>
                  )
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-[#00F0FF] flex items-center justify-center text-xs font-mono font-bold text-white shrink-0">
                      {userSubmission ? `${userSubmission.percentage || 100}%` : "0%"}
                    </div>
                    <span className="text-[11px] text-gray-300 font-bold">
                      {userSubmission ? "Completed" : "Not Started"}
                    </span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-gray-500 border-t border-white/5 pt-1">
                {isHost ? "Assessment Phase" : "Personal Progress"}
              </span>
            </div>

            {/* Card 3: Your Rank */}
            <div className="bg-[#0c0c16] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1"><Trophy size={13} className="text-amber-400" /> {isHost ? "Top Candidate Score" : "Your Rank"}</span>
              </div>
              <div className="my-2">
                <div className="text-xl font-black text-white font-mono">
                  {isHost ? (leaderboard[0] ? `${leaderboard[0].total_score} pts` : "—") : userRankDisplay}
                  {!isHost && <span className="text-xs text-gray-500 font-normal"> / {registrations.length || 1}</span>}
                </div>
                <span className="text-[11px] text-emerald-400 font-mono font-bold">
                  {isHost ? `Total Candidates: ${registrations.length}` : `Score: ${userScoreDisplay} / ${totalPossible}`}
                </span>
              </div>
              <span className="text-[10px] text-gray-500 border-t border-white/5 pt-1">Official Standings</span>
            </div>

            {/* Card 4: Participants */}
            <div className="bg-[#0c0c16] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1"><Users size={13} className="text-[#00F0FF]" /> Participants</span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-white font-mono">
                  {registrations.length}
                </div>
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  Capacity: {room?.max_participants || 500}
                </span>
              </div>
              <span className="text-[10px] text-gray-500 border-t border-white/5 pt-1">Registered Roster</span>
            </div>
          </div>
        </div>

        {/* 3-COLUMN MAIN BODY LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDEBAR TABS */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0c0c16] border border-white/10 rounded-2xl p-2 space-y-1 shadow-xl text-xs font-bold">
              {/* DIRECTIVE 3: SEPARATE HOST VIEW TABS FROM PARTICIPANT TABS */}
              {isHost && (
                <div className="mb-2 pb-2 border-b border-white/10 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                    Host Management
                  </div>
                  {[
                    { id: "host_dashboard", label: "Dashboard", icon: BarChart2 },
                    { id: "host_participants", label: "Participants", icon: Users, count: registrations.length },
                    { id: "host_assessment", label: "Manage Assessment", icon: Layers, count: sections.length },
                    { id: "host_submissions", label: "Submissions & Grading", icon: CheckCircle, count: submissions.length },
                    { id: "host_announcements", label: "Announcements", icon: Megaphone, count: announcements.length },
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
              )}

              <div className="px-2 py-1 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                Room Navigation
              </div>

              {[
                { id: "overview", label: "Overview", icon: Eye },
                { id: "instructions", label: "Instructions", icon: FileText },
                { id: "sections", label: "Sections", icon: Layers, count: sections.length },
                { id: "submissions", label: "Submissions", icon: CheckCircle },
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
                {room.org_name || "Verified Organization"} <ShieldCheck size={12} className="text-[#00F0FF]" />
              </h5>
              <button
                onClick={() => setActiveSidebarTab("organizers")}
                className="w-full py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-gray-300 transition cursor-pointer"
              >
                View Profile
              </button>
            </div>
          </div>

          {/* CENTER MAIN CONTENT AREA */}
          <div className="lg:col-span-7 space-y-6">
            {/* HOST TABS (HOST EXCLUSIVE) */}
            {activeSidebarTab === "host_dashboard" && isHost && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 text-xs">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                  <BarChart2 size={16} className="text-[#00F0FF]" /> Room Analytics & Host Command Center
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-[#06060c] border border-white/10 text-center">
                    <span className="text-gray-400 block text-[10px] font-mono">Registrations</span>
                    <span className="text-xl font-black text-white font-mono">{registrations.length}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#06060c] border border-white/10 text-center">
                    <span className="text-gray-400 block text-[10px] font-mono">Submissions</span>
                    <span className="text-xl font-black text-[#00F0FF] font-mono">{submissions.length}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#06060c] border border-white/10 text-center">
                    <span className="text-gray-400 block text-[10px] font-mono">Completion Rate</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      {registrations.length > 0 ? `${Math.round((submissions.length / registrations.length) * 100)}%` : "0%"}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#06060c] border border-white/10 text-center">
                    <span className="text-gray-400 block text-[10px] font-mono">Prize Pool</span>
                    <span className="text-xl font-black text-amber-400 font-mono">{room?.gbits_prize_pool || 1000} gBits</span>
                  </div>
                </div>
              </div>
            )}

            {activeSidebarTab === "host_participants" && isHost && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 text-xs">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                  <Users size={16} className="text-purple-400" /> Registered Candidate Roster ({registrations.length})
                </h3>

                {registrations.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-8">No candidates registered yet.</p>
                ) : (
                  <div className="space-y-2">
                    {registrations.map((r, idx) => (
                      <div key={r.id || idx} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <span className="text-white font-bold">{r.profiles?.full_name || r.profiles?.username || "Candidate"}</span>
                        <span className="text-[10px] font-mono text-emerald-400">Registered</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSidebarTab === "host_assessment" && isHost && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 text-xs">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                  <Layers size={16} className="text-[#00F0FF]" /> Assessment Configuration
                </h3>
                <p className="text-gray-400">Manage your timed sections and question bank.</p>
                <button onClick={() => navigate(`/pro-rooms/create?edit=${id}`)} className="px-4 py-2 rounded-xl bg-[#FF00C8] text-white font-bold cursor-pointer">
                  Open Creation Studio Editor →
                </button>
              </div>
            )}

            {activeSidebarTab === "host_submissions" && isHost && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 text-xs">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                  <CheckCircle size={16} className="text-emerald-400" /> Candidate Submissions & Evaluation
                </h3>
                <div className="space-y-3">
                  {submissions.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-8">No candidate submissions yet.</p>
                  ) : (
                    submissions.map((sub, sIdx) => (
                      <div key={sub.id || sIdx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-white font-bold block">{sub.profiles?.full_name || sub.profiles?.username || "Candidate"}</span>
                          <span className="text-[10px] text-gray-500 font-mono">Score: {sub.total_score} pts • {sub.percentage}%</span>
                        </div>
                        <button
                          onClick={() => navigate(`/pro-rooms/${id}/dashboard`)}
                          className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold hover:bg-purple-500/30 cursor-pointer"
                        >
                          Grade & Review
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* STANDARD ROOM NAVIGATION TABS */}
            {activeSidebarTab === "overview" && (
              <div className="space-y-6">
                <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Info size={16} className="text-purple-400" /> About This Event
                    </h3>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {room.detailed_description || room.short_description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
                    <div>
                      <span className="text-gray-500 block text-[10px] font-mono">Team Event</span>
                      <span className="text-white font-bold">{isTeamEvent ? `2 - ${room.max_team_size || 4} Members` : "Individual"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] font-mono">End Date</span>
                      <span className="text-white font-bold">{eventEndFormatted}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] font-mono">Registration</span>
                      <span className="text-white font-bold">Open</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] font-mono">Eligibility</span>
                      <span className="text-white font-bold">{room.target_college || "Open for all students"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] font-mono">Start Date</span>
                      <span className="text-white font-bold">Active</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] font-mono">Timezone</span>
                      <span className="text-white font-bold">{room.timezone || "IST (UTC +05:30)"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSidebarTab === "instructions" && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 text-xs">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                  <FileText size={16} className="text-[#00F0FF]" /> Official Guidelines & Rules
                </h3>

                <div className="space-y-4 text-gray-300 leading-relaxed">
                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                    <h4 className="font-bold text-purple-300 mb-1">1. Assessment Environment & Integrity</h4>
                    <p className="text-gray-400">All submissions are monitored by automated focus tracking. Switching tabs or windows during coding tasks will log warning events to your submission report.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <h4 className="font-bold text-white">2. Evaluation & Negative Marking</h4>
                    <ul className="list-disc pl-4 space-y-1 text-gray-400">
                      <li>Coding problems are evaluated against hidden unit test cases.</li>
                      <li>Passing score threshold for qualification is {room?.passing_score || 50} points.</li>
                      <li>Negative marking policy: {room?.negative_marking ? "Enabled (-5 pts on wrong MCQ)" : "Disabled"}.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <h4 className="font-bold text-white">3. Tie-Breaker Rules</h4>
                    <p className="text-gray-400">In case of equal total scores, rank is determined by shortest completion time and submission speed.</p>
                  </div>
                </div>
              </div>
            )}

            {/* HOST ANNOUNCEMENTS TAB (HOST EXCLUSIVE) */}
            {activeSidebarTab === "host_announcements" && isHost && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Megaphone size={16} className="text-amber-400" /> Broadcast Announcements ({announcements.length})
                  </h3>
                </div>

                {/* POST ANNOUNCEMENT FORM — RENDERED ONLY WHEN isHost === true */}
                {isHost && (
                  <div className="bg-[#07070e] border border-purple-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
                    <h4 className="text-xs font-bold text-purple-300">Post Broadcast Announcement</h4>
                    <input
                      type="text"
                      placeholder="Title..."
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      className="w-full bg-[#030308] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                    <textarea
                      rows={2}
                      placeholder="Broadcast message content..."
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      className="w-full bg-[#030308] border border-white/10 rounded-xl p-3 text-xs text-white outline-none"
                    />
                    <button
                      onClick={handlePostAnnouncement}
                      disabled={postingAnn}
                      className="px-4 py-2 rounded-xl bg-[#FF00C8] hover:bg-[#d600a8] text-white text-xs font-bold cursor-pointer disabled:opacity-50 transition"
                    >
                      Broadcast 📢
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  {announcements.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-8">No announcements broadcasted yet.</p>
                  ) : (
                    announcements.map((a) => (
                      <div key={a.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white">{a.title}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-gray-500">{new Date(a.created_at || Date.now()).toLocaleDateString()}</span>
                            {isHost && (
                              <button onClick={() => handleDeleteAnnouncement(a.id)} className="text-red-400 hover:text-red-300 p-1 cursor-pointer">
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">{a.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeSidebarTab === "sections" && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers size={16} className="text-[#00F0FF]" /> Assessment Sections ({sections.length})
                  </h3>
                  <button
                    onClick={() => navigate(`/pro-rooms/${id}/assessment`)}
                    className="px-4 py-2 rounded-xl bg-[#FF00C8] hover:bg-[#d600a8] text-white text-xs font-bold shadow-lg shadow-[#FF00C8]/25 cursor-pointer flex items-center gap-1.5"
                  >
                    Start Assessment <ArrowRight size={14} />
                  </button>
                </div>

                {sections.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-10">No sections configured for this assessment.</p>
                ) : (
                  <div className="space-y-4">
                    {sections.map((sec, idx) => (
                      <div key={sec.id || idx} className="p-5 rounded-2xl bg-[#06060c] border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-purple-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-white">{sec.section_name}</h4>
                              <p className="text-[11px] text-gray-400">{sec.description || `${sec.time_limit_minutes || 30} Mins • ${sec.total_points || 50} Points`}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[#00F0FF] font-bold">
                            {sec.section_type?.toUpperCase() || "MCQ / CODING"}
                          </span>
                        </div>

                        <div className="pt-2 flex items-center justify-between text-xs border-t border-white/5">
                          <span className="text-gray-400 font-mono text-[11px]">
                            {sec.pro_room_questions?.length || 5} Questions • {sec.total_points || 50} Points
                          </span>
                          <button
                            onClick={() => navigate(`/pro-rooms/${id}/assessment`)}
                            className="px-4 py-1.5 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-bold hover:bg-[#00F0FF]/25 cursor-pointer flex items-center gap-1"
                          >
                            Launch Section <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSidebarTab === "submissions" && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-400" />
                    {isHost ? "Candidate Submissions & Grading Roster" : "Your Performance & Submission Result"}
                  </h3>
                </div>

                {!isHost ? (
                  userSubmission ? (
                    <div className="p-6 rounded-2xl bg-[#06060c] border border-emerald-500/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-gray-400 block font-mono">Submission Status</span>
                          <span className="text-sm font-bold text-emerald-400 uppercase">{userSubmission.status || "Completed"}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400 block font-mono">Your Score</span>
                          <span className="text-xl font-black text-white font-mono">{userSubmission.total_score || 0} / {totalPossible}</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
                        <div className="flex justify-between text-gray-400">
                          <span>Percentage:</span>
                          <span className="text-white font-bold">{userSubmission.percentage || 100}%</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Submitted At:</span>
                          <span className="text-white font-mono">{new Date(userSubmission.submitted_at || Date.now()).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-3">
                      <CheckCircle size={32} className="text-gray-600 mx-auto" />
                      <h4 className="text-sm font-bold text-white">No Submission Recorded Yet</h4>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto">
                        Complete your assessment tasks in the sections environment to view your test score.
                      </p>
                      <button
                        onClick={() => navigate(`/pro-rooms/${id}/assessment`)}
                        className="px-5 py-2.5 rounded-xl bg-[#FF00C8] text-white text-xs font-bold cursor-pointer"
                      >
                        Start Assessment Now →
                      </button>
                    </div>
                  )
                ) : (
                  <div className="text-center py-10 space-y-3 bg-[#06060c] border border-white/10 rounded-2xl p-6">
                    <CheckCircle size={28} className="text-[#00F0FF] mx-auto" />
                    <h4 className="text-sm font-bold text-white">Host View — All Candidate Submissions</h4>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      As the room host, evaluate, grade, and review all candidate submissions under Host Management.
                    </p>
                    <button
                      onClick={() => setActiveSidebarTab("host_submissions")}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer transition"
                    >
                      Open Submissions & Grading Roster ({submissions.length}) →
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeSidebarTab === "leaderboard" && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Trophy size={16} className="text-amber-400" /> Official Standings & Leaderboard ({leaderboard.length})
                  </h3>
                </div>

                {leaderboard.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-10">Leaderboard standings will update after submissions are evaluated.</p>
                ) : (
                  <div className="divide-y divide-white/5">
                    {leaderboard.map((lb, idx) => {
                      const isMe = lb.user_id === currentUserId;
                      return (
                        <div
                          key={lb.id || idx}
                          className={`py-3 px-4 rounded-xl flex items-center justify-between text-xs transition ${
                            isMe ? "bg-[#FF00C8]/15 border border-[#FF00C8]/30 font-bold" : "hover:bg-white/[0.02]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-gray-400 w-6">#{idx + 1}</span>
                            <span className="text-white font-bold">{lb.profiles?.full_name || lb.profiles?.username || "Candidate"}</span>
                            {isMe && <span className="text-[10px] text-[#FF00C8] font-mono">(You)</span>}
                          </div>
                          <span className="font-mono font-bold text-amber-400">{lb.total_score} Pts</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeSidebarTab === "discussion" && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <MessageSquare size={16} className="text-[#00F0FF]" /> Q&A Discussion Feed ({discussions.length})
                  </h3>
                </div>

                <div className="bg-[#07070e] border border-white/10 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-gray-300">Ask a Question / Post Doubt</h4>
                  <input
                    type="text"
                    placeholder="Question Title..."
                    value={discTitle}
                    onChange={(e) => setDiscTitle(e.target.value)}
                    className="w-full bg-[#030308] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                  <textarea
                    rows={2}
                    placeholder="Describe your question..."
                    value={discContent}
                    onChange={(e) => setDiscContent(e.target.value)}
                    className="w-full bg-[#030308] border border-white/10 rounded-xl p-3 text-xs text-white outline-none"
                  />
                  <button
                    onClick={handlePostDiscussion}
                    disabled={postingDisc}
                    className="px-4 py-2 rounded-xl bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    Post Question 💬
                  </button>
                </div>

                <div className="space-y-3">
                  {discussions.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-8">Discussion feed is quiet.</p>
                  ) : (
                    discussions.map((d) => (
                      <div key={d.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{d.title}</span>
                          <span className="text-[10px] text-gray-500 font-mono">By {d.profiles?.full_name || "Candidate"}</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">{d.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeSidebarTab === "organizers" && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                  <Building2 size={16} className="text-purple-400" /> Host & Organizer Information
                </h3>

                <div className="p-6 rounded-2xl bg-[#06060c] border border-white/10 space-y-4 text-xs">
                  <div className="flex items-center gap-4">
                    {room.org_logo ? (
                      <img src={room.org_logo} alt="Logo" className="w-14 h-14 rounded-2xl object-cover border border-white/10" />
                    ) : (
                      <Building2 size={32} className="text-[#00F0FF]" />
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1">
                        {room.org_name || "Verified Organization"} <ShieldCheck size={14} className="text-[#00F0FF]" />
                      </h4>
                      <p className="text-gray-400 text-[11px]">{room.org_email || "contact@organizer.edu"}</p>
                    </div>
                  </div>

                  <p className="text-gray-300 leading-relaxed">
                    Verified organization hosting high-stakes technical assessments and competitions on Glitch Room.
                  </p>

                  <a
                    href={room.website || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30"
                  >
                    Visit Official Website <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}

            {activeSidebarTab === "resources" && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                  <Folder size={16} className="text-[#00F0FF]" /> Event Resources & Materials
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-white font-bold block">Problem Dataset & API Specifications</span>
                      <span className="text-[10px] text-gray-500 font-mono">ZIP Archive • 12 MB</span>
                    </div>
                    <button onClick={() => showToast("📥 Download started.")} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 cursor-pointer">
                      Download
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSidebarTab === "help" && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 text-xs">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                  <HelpCircle size={16} className="text-amber-400" /> Candidate Help & Support
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  If you encounter technical issues during code execution or assessment tasks, reach out to event mentors or submit a direct query.
                </p>
                <button onClick={() => showToast("🎧 Support assistant notified.")} className="px-5 py-2.5 rounded-xl bg-[#FF00C8] text-white font-bold cursor-pointer">
                  Request Support Assistant
                </button>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-3 space-y-6">
            {/* Announcements Box */}
            <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                  <Megaphone size={14} className="text-purple-400" /> Announcements
                </h4>
                <span onClick={() => setActiveSidebarTab("announcements")} className="text-[10px] font-mono text-purple-400 cursor-pointer">View All</span>
              </div>

              <div className="space-y-3">
                {announcements.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No announcements yet.</p>
                ) : (
                  announcements.slice(0, 3).map((a) => (
                    <div key={a.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                      <span className="text-xs font-bold text-white block truncate">{a.title}</span>
                      <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{a.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions Box */}
            <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-3">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest mb-2">Quick Actions</h4>

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
                onClick={() => setActiveSidebarTab("discussion")}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition cursor-pointer flex items-center justify-between px-4"
              >
                <span>Ask a Doubt</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* DIRECTIVE 5: TALLER & MORE READABLE BOTTOM FIXED FOOTER */}
      <div className="sticky bottom-0 z-40 border-t border-white/10 bg-[#07070e]/95 backdrop-blur-md px-6 py-4.5 sm:py-5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-6 sm:gap-10 overflow-x-auto w-full sm:w-auto">
            {/* User gBits Balance */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                <Zap size={18} className="text-purple-400" />
              </div>
              <div>
                <span className="text-white text-sm font-black font-mono block leading-none">{userGbits} gBits</span>
                <span className="text-[10px] text-gray-400 tracking-wider uppercase mt-1 block">Your Balance</span>
              </div>
            </div>

            {/* Target Rank */}
            <div className="flex items-center gap-3 border-l border-white/10 pl-6 sm:pl-10">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Trophy size={18} className="text-amber-400" />
              </div>
              <div>
                <span className="text-white text-sm font-black font-mono block leading-none">{userRankDisplay}</span>
                <span className="text-[10px] text-gray-400 tracking-wider uppercase mt-1 block">Target Rank</span>
              </div>
            </div>

            {/* Total Points */}
            <div className="flex items-center gap-3 border-l border-white/10 pl-6 sm:pl-10">
              <div className="w-9 h-9 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center shrink-0">
                <Award size={18} className="text-[#00F0FF]" />
              </div>
              <div>
                <span className="text-white text-sm font-black font-mono block leading-none">{totalPossible}</span>
                <span className="text-[10px] text-gray-400 tracking-wider uppercase mt-1 block">Total Points</span>
              </div>
            </div>

            {/* Event Ends Time */}
            <div className="flex items-center gap-3 border-l border-white/10 pl-6 sm:pl-10">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                <Calendar size={18} className="text-purple-400" />
              </div>
              <div>
                <span className="text-white text-sm font-black font-mono block leading-none">{eventEndFormatted}</span>
                <span className="text-[10px] text-gray-400 tracking-wider uppercase mt-1 block">Event Ends</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => showToast("🎧 Live support assistant activated.")}
            className="px-5 py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 shadow-lg"
          >
            <HelpCircle size={15} /> Need Help?
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalRoomDetail;
