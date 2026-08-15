import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../supabaseClient";
import Navbar from "../Navbar";
import GlitchBackground from "../GlitchBackground";
import { updatePoints } from "../../utils/pointsHelper";
import {
  ArrowLeft,
  Share2,
  Bell,
  MoreVertical,
  Edit3,
  Calendar,
  Clock,
  Users,
  Globe,
  Lock,
  Flame,
  Target,
  Coins,
  CheckCircle2,
  Send,
  Upload,
  Trophy,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  Heart,
  MessageSquare,
  Award,
  Sparkles,
  Zap,
  Activity,
  Handshake,
} from "lucide-react";

const CreatorRoomDetail = ({ roomId }) => {
  const navigate = useNavigate();
  const id = roomId;

  // Real Database States
  const [room, setRoom] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [members, setMembers] = useState([]);
  const [standups, setStandups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [activeTab, setActiveTab] = useState("today");
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);

  // Check-in Form States
  const [accomplishment, setAccomplishment] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [blockers, setBlockers] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const fetchAllRoomData = async () => {
    setLoading(true);
    const { data: au } = await supabase.auth.getUser();
    const uid = au?.user?.id;
    setUserId(uid);

    if (uid) {
      const { data: uProf } = await supabase
        .from("profiles")
        .select("id, user_id, username, full_name, avatar_url")
        .eq("id", uid)
        .maybeSingle();
      if (uProf) setUserProfile(uProf);
    }

    // 1. Fetch Room record from database
    const { data: roomData, error: roomErr } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (roomData) {
      setRoom(roomData);
    } else {
      // Fallback room object if matching ID not in DB yet
      setRoom({
        id: id || "room-1",
        name: "30 Days of Code & Uptime Sprint ⚡",
        description: "Commit. Show up. Build daily. Protect your streak.",
        goal_pledge: "Solve 1 Glitch & push code daily",
        category: "Coding & DSA",
        duration_type: "30_day",
        checkin_frequency: "Daily Check-in",
        member_count: 42,
        access: "public",
        host: "parulsingh",
      });
    }

    // 2. Fetch Room Members
    const { data: memData } = await supabase
      .from("room_members")
      .select("user_id, role, created_at")
      .eq("room_id", id);

    let fetchedMembers = [];
    if (memData && memData.length > 0) {
      const uIds = memData.map((m) => m.user_id);
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, user_id, username, full_name, avatar_url")
        .in("id", uIds);

      fetchedMembers = memData.map((m) => {
        const p = (profs || []).find((pr) => pr.id === m.user_id || pr.user_id === m.user_id);
        return {
          user_id: m.user_id,
          role: m.role,
          username: p?.username || p?.full_name || "Squad Member",
          avatar_url: p?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
          streak: 10 + Math.floor(Math.random() * 10),
        };
      });
      setMembers(fetchedMembers);

      if (uid && uIds.includes(uid)) {
        setIsMember(true);
      }
    } else {
      // Default initial squad list
      setMembers([
        { user_id: uid || "u1", username: userProfile?.username || "parulsingh", streak: 20, avatar_url: userProfile?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", role: "host" },
        { user_id: "u2", username: "code_ninja", streak: 18, avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", role: "member" },
        { user_id: "u3", username: "glitch_coder", streak: 14, avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", role: "member" },
        { user_id: "u4", username: "dev_warrior", streak: 12, avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", role: "member" },
        { user_id: "u5", username: "bug_buster", streak: 11, avatar_url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150", role: "member" },
      ]);
    }

    // 3. Fetch Standup Posts for this Room
    const { data: postsData } = await supabase
      .from("community_posts")
      .select("*")
      .or(`category.eq.room_${id},category.eq.${id}`)
      .order("created_at", { ascending: false });

    if (postsData && postsData.length > 0) {
      const formattedPosts = postsData.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        username: p.author_username || p.user_id?.slice(0, 8) || "Builder",
        avatar: p.author_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        accomplishment: p.body?.split("Proof of Work:")[0]?.replace("### Accomplished Today:", "")?.trim() || p.title || p.body,
        proof_url: p.body?.includes("http") ? p.body.match(/https?:\/\/[^\s\)]+/)?.[0] : null,
        blockers: p.body?.includes("Blockers:") ? p.body.split("Blockers:")[1]?.trim() : "None",
        streak: 15,
        created_at: p.created_at,
        isUser: p.user_id === uid,
      }));
      setStandups(formattedPosts);
    } else {
      // Default active standup list
      setStandups([
        {
          id: "s1",
          user_id: uid || "u1",
          username: userProfile?.username || "parulsingh",
          avatar: userProfile?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
          isUser: true,
          badge: "👑 You",
          time: "Today, 9:15 PM",
          onTime: true,
          accomplishment: "Solved a tough Glitch on async recursion and optimized the solution.",
          proof_url: "https://github.com/parulsingh/async-glitch",
          blockers: "Understanding edge cases in large inputs.",
          streak: 20,
          verifiers: [
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
          ],
          verifiersCount: "+2",
        },
        {
          id: "s2",
          user_id: "u3",
          username: "glitch_coder",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
          isUser: false,
          badge: "Accountability Buddy",
          time: "Today, 8:40 PM",
          onTime: true,
          accomplishment: "Added authentication to the project and fixed deployment bug.",
          proof_url: "https://github.com/glitchcoder/auth-fix",
          blockers: "Getting CORS issue on production.",
          streak: 14,
          verifiers: [
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
          ],
          verifiersCount: "+3",
        },
        {
          id: "s3",
          user_id: "u4",
          username: "dev_warrior",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
          isUser: false,
          badge: null,
          time: "Today, 10:05 PM",
          onTime: true,
          accomplishment: "Refactored Redis caching layer and implemented automatic token refresh retries.",
          proof_url: "https://github.com/devwarrior/redis-cache",
          blockers: "Cache eviction policy testing.",
          streak: 12,
          verifiers: [],
          verifiersCount: "+1",
        },
      ]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAllRoomData();
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    showToast("🔗 Room link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinSquad = async () => {
    if (!userId) {
      navigate("/");
      return;
    }
    setJoining(true);
    try {
      await supabase.from("room_members").insert([
        {
          room_id: id,
          user_id: userId,
          role: "member",
        },
      ]);
      setIsMember(true);
      showToast("🎉 You've joined this accountability squad! Submit your daily standup.");
      fetchAllRoomData();
    } catch (e) {
      console.error("Join room error:", e);
    } finally {
      setJoining(false);
    }
  };

  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    if (!accomplishment.trim()) return;
    setSubmitting(true);

    const newPost = {
      user_id: userId || "guest",
      title: `Daily Check-In: ${accomplishment.slice(0, 40)}...`,
      body: `### Accomplished Today:\n${accomplishment.trim()}\n\n${
        proofUrl ? `**Proof of Work:** [View Repository](${proofUrl.trim()})\n\n` : ""
      }${blockers ? `**Blockers:** ${blockers.trim()}` : ""}`,
      category: `room_${id}`,
      likes: 0,
    };

    try {
      await supabase.from("community_posts").insert([newPost]);
      if (userId) {
        await updatePoints(userId, 35, `Daily Check-in: ${room?.name || "Accountability"}`, "checkin");
      }
      showToast("🔥 Daily Standup logged! Your streak is active & +35 gBits earned!");
      setShowCheckinModal(false);
      setAccomplishment("");
      setProofUrl("");
      setBlockers("");
      fetchAllRoomData();
    } catch (err) {
      console.error("Checkin submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] text-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-2 border-t-transparent border-purple-500 rounded-full"
        />
      </div>
    );
  }

  // Dynamic user calculations
  const myStandupsCount = standups.filter((s) => s.user_id === userId || s.isUser).length || 20;
  const targetDays = room?.duration_type === "7_day" ? 7 : room?.duration_type === "14_day" ? 14 : 30;
  const progressPercent = Math.min(Math.round((myStandupsCount / targetDays) * 100), 100);
  const userStreakDays = Math.max(myStandupsCount, 20);

  // Dynamic Leaderboard sorting
  const leaderboard = [...members].sort((a, b) => b.streak - a.streak);

  // Accountability Buddy selection (takes second member or glitch_coder)
  const buddy = members.find((m) => m.user_id !== userId) || {
    username: "glitch_coder",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
  };

  return (
    <div className="relative min-h-screen bg-[#070709] text-white flex flex-col justify-between selection:bg-[#00F0FF]/20 overflow-hidden font-sans pb-28">
      {/* Cyberpunk Particles Background */}
      <GlitchBackground />

      {/* Cyber Grid & Gradient Overlay */}
      <div
        className="absolute top-0 left-0 right-0 h-[1200px] z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0,240,255,0.2) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,240,255,0.2) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 space-y-6 flex-1 w-full">
          {/* Toast Notification */}
          <AnimatePresence>
            {toastMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-purple-400" />
                  <span>{toastMsg}</span>
                </div>
                <button onClick={() => setToastMsg("")} className="text-gray-400 hover:text-white">
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── TOP NAV ACTION BAR ── */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/creator-rooms")}
              className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to Rooms</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-xs font-mono font-semibold transition cursor-pointer"
              >
                <Share2 size={13} />
                <span>Share Room</span>
              </button>
              <button
                onClick={() => showToast("Notifications enabled for this room!")}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 transition cursor-pointer relative"
              >
                <Bell size={15} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF00C8]" />
              </button>
              <button className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 transition cursor-pointer">
                <MoreVertical size={15} />
              </button>
            </div>
          </div>

          {/* ── MAIN ROOM HEADER SECTION (GRID 2 COLS) ── */}
          <div className="bg-[#0b0b14] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF00C8] via-purple-500 to-[#00F0FF]" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Column: Room Info & Meta */}
              <div className="lg:col-span-8 flex flex-col sm:flex-row items-start gap-6">
                {/* Shield Icon Card & Edit Room Button */}
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#FF00C8]/20 to-[#00F0FF]/20 border border-purple-500/30 p-1 flex items-center justify-center shadow-[0_0_30px_rgba(255,0,200,0.15)] relative">
                    <div className="w-full h-full rounded-2xl bg-[#080810] border border-white/10 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-[#FF00C8]">
                        <Users size={24} />
                      </div>
                    </div>
                  </div>

                  <button className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-[11px] font-mono font-bold flex items-center gap-1 transition cursor-pointer">
                    <Edit3 size={11} /> Edit Room
                  </button>
                </div>

                {/* Title & Metadata */}
                <div className="space-y-3">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-purple-500/20 border border-purple-500/30 text-purple-300 inline-block">
                    Accountability Room
                  </span>

                  <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight flex items-center gap-2">
                    <span>{room?.name || room?.title || "30 Days of Code & Uptime Sprint"}</span>
                    <span className="text-amber-400">⚡</span>
                  </h1>

                  <p className="text-xs text-gray-400 font-mono">
                    {room?.description || "Commit. Show up. Build daily. Protect your streak."}
                  </p>

                  {/* 4 Metadata Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#12121e] border border-white/8 text-gray-300 text-xs font-mono">
                      <Calendar size={12} className="text-purple-400" />
                      <span>{targetDays} Days Duration</span>
                    </span>

                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#12121e] border border-white/8 text-gray-300 text-xs font-mono">
                      <Clock size={12} className="text-[#00F0FF]" />
                      <span>{room?.checkin_frequency || "Daily Check-in"}</span>
                    </span>

                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#12121e] border border-white/8 text-gray-300 text-xs font-mono">
                      <Users size={12} className="text-amber-400" />
                      <span>{room?.member_count || members.length || 42} Members</span>
                    </span>

                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#12121e] border border-white/8 text-gray-300 text-xs font-mono">
                      <Globe size={12} className="text-green-400" />
                      <span>Public Room Anyone can join</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: My Commitment Card */}
              <div className="lg:col-span-4">
                <div className="bg-[#0c0c18] border border-[#00F0FF]/30 rounded-2xl p-5 shadow-xl space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold text-[#00F0FF] uppercase tracking-wider">
                      My Commitment
                    </h3>
                    <span className="text-xs font-mono text-gray-500 font-bold">Goal</span>
                  </div>

                  <p className="text-xs text-gray-200 font-mono italic leading-relaxed">
                    "{room?.goal_pledge || "Solve 1 Glitch & push code daily"}"
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-[#00F0FF] font-bold">{progressPercent}%</span>
                    </div>

                    <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progressPercent}%`,
                          background: "linear-gradient(90deg, #00F0FF, #a855f7)",
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 pt-1">
                    <span>{myStandupsCount} / {targetDays} Days Completed</span>
                    <span className="text-green-400 font-bold">On Track ✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── MAIN CONTENT — 3 COLUMNS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ── LEFT COLUMN (ROOM GOAL & POOL INFO) ── */}
            <div className="lg:col-span-3 space-y-4">
              {/* Room Goal Card */}
              <div className="bg-[#0c0c16] border border-white/10 rounded-2xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Target size={16} />
                  </div>
                  <h4 className="text-sm font-bold text-white">Room Goal</h4>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  Stay consistent for {targetDays} days by posting daily standups and proof of work.
                </p>
              </div>

              {/* Check-in Time Card */}
              <div className="bg-[#0c0c16] border border-white/10 rounded-2xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
                    <Clock size={16} />
                  </div>
                  <h4 className="text-sm font-bold text-white">Check-in Time</h4>
                </div>
                <p className="text-xs font-mono text-gray-300 font-semibold">
                  Before 11:59 PM IST
                </p>
              </div>

              {/* Streak System Card */}
              <div className="bg-[#0c0c16] border border-white/10 rounded-2xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Flame size={16} />
                  </div>
                  <h4 className="text-sm font-bold text-white">Streak System</h4>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  Your streak is part of your global uptime.
                </p>
              </div>

              {/* Room Pool Card */}
              <div className="bg-[#0c0c16] border border-white/10 rounded-2xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
                    <Coins size={16} />
                  </div>
                  <h4 className="text-sm font-bold text-white">Room Pool</h4>
                </div>
                <div>
                  <span className="text-lg font-black text-amber-400 font-mono block">
                    1,250 gBits
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono">Stakes from members</span>
                </div>
              </div>

              {/* Links & Leave Room Action */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => showToast("Daily Check-in rules: Post accomplishment log + GitHub PoW URL before midnight!")}
                  className="text-xs font-mono text-[#00F0FF] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>How it works?</span>
                  <ExternalLink size={12} />
                </button>

                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to leave this accountability squad?")) {
                      navigate("/creator-rooms");
                    }
                  }}
                  className="w-full py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold font-mono transition cursor-pointer"
                >
                  Leave Room
                </button>
              </div>
            </div>

            {/* ── CENTER COLUMN (PRIMARY DAILY STANDUPS) ── */}
            <div className="lg:col-span-6 space-y-6">
              {/* Header Row: Standup Title & View Switcher */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-[#FF00C8]" />
                  <h2 className="text-lg font-extrabold text-white">Daily Standups</h2>
                </div>

                <div className="flex items-center gap-1 bg-[#10101a] border border-white/10 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab("today")}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                      activeTab === "today"
                        ? "bg-purple-900/50 text-purple-200 border border-purple-500/40 shadow-sm"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setActiveTab("calendar")}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                      activeTab === "calendar"
                        ? "bg-purple-900/50 text-purple-200 border border-purple-500/40 shadow-sm"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Calendar View
                  </button>
                </div>
              </div>

              {/* Prominent Check-in CTA Card */}
              <div className="bg-gradient-to-r from-purple-950/40 via-[#0d0d18] to-purple-950/20 border border-purple-500/30 rounded-2xl p-5 shadow-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={userProfile?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                    alt="avatar"
                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-purple-500/40 shrink-0"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">What did you accomplish today?</h4>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      Share your progress, add proof, and keep your streak alive!
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowCheckinModal(true)}
                  className="px-4 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition shadow-lg hover:opacity-90"
                  style={{
                    background: "linear-gradient(90deg, #FF00C8, #a855f7)",
                  }}
                >
                  <Upload size={14} />
                  <span>Check-in Now</span>
                </button>
              </div>

              {/* ── MEMBER STANDUP CARDS ── */}
              <div className="space-y-4">
                {standups.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#0b0b14] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                          alt={item.username}
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-500/40"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{item.username}</span>
                            {item.badge && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-gray-500">{item.time || "Today, 9:15 PM"}</span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-green-500/10 border border-green-500/30 text-green-400">
                        On Time
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className="md:col-span-8 space-y-3">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-gray-500 uppercase block">
                            What I accomplished today
                          </span>
                          <p className="text-xs text-gray-200 font-sans mt-0.5 leading-relaxed">
                            {item.accomplishment}
                          </p>
                        </div>

                        {item.proof_url && (
                          <div>
                            <span className="text-[10px] font-mono font-bold text-gray-500 uppercase block">
                              Proof of Work
                            </span>
                            <a
                              href={item.proof_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12121e] border border-white/10 text-xs font-mono text-[#00F0FF] hover:underline mt-1"
                            >
                              <span>{item.proof_url.replace("https://", "")}</span>
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        )}

                        {item.blockers && (
                          <div>
                            <span className="text-[10px] font-mono font-bold text-gray-500 uppercase block">
                              Blockers
                            </span>
                            <p className="text-xs text-gray-400 font-mono mt-0.5">
                              {item.blockers}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Dedicated Right-Side Streak Panel */}
                      <div className="md:col-span-4 bg-[#07070d] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <Flame size={22} />
                        </div>
                        <div>
                          <span className="text-2xl font-black text-[#00F0FF] font-mono block">
                            {item.streak || 15}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Day Streak</span>
                        </div>

                        {item.verifiers && item.verifiers.length > 0 && (
                          <div className="pt-2 border-t border-white/5 w-full flex items-center justify-center gap-1.5">
                            <span className="text-[9px] font-mono text-gray-500 mr-1">Verified by</span>
                            <div className="flex -space-x-2">
                              {item.verifiers.map((v, idx) => (
                                <img key={idx} src={v} className="w-5 h-5 rounded-full ring-1 ring-black object-cover" alt="v" />
                              ))}
                            </div>
                            {item.verifiersCount && (
                              <span className="text-[9px] font-mono text-purple-300 font-bold bg-purple-500/20 px-1.5 py-0.5 rounded-full">
                                {item.verifiersCount}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT COLUMN (LEADERBOARD, BUDDY, ROOM ACTIVITY) ── */}
            <div className="lg:col-span-3 space-y-6">
              {/* 1. Leaderboard Card */}
              <div className="bg-[#0b0b14] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-amber-400" />
                    <h3 className="font-bold text-white text-sm">Leaderboard</h3>
                  </div>
                  <button
                    onClick={() => showToast("Squad leaderboard updated!")}
                    className="text-xs font-mono text-purple-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>View All</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {leaderboard.map((item, idx) => (
                    <div
                      key={item.user_id || idx}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                        item.user_id === userId
                          ? "bg-purple-500/10 border-purple-500/30"
                          : "bg-[#07070d] border-white/5 hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-bold text-gray-500 w-3">
                          {idx + 1}
                        </span>
                        <img
                          src={item.avatar_url}
                          alt={item.username}
                          className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/10"
                        />
                        <span className="text-xs font-bold text-white truncate max-w-[100px]">
                          {item.username}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400">
                        <Flame size={13} />
                        <span>{item.streak}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Accountability Buddy Card */}
              <div className="bg-[#0b0b14] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4 text-center">
                <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider text-left">
                  Accountability Buddy
                </h3>

                <div className="flex items-center justify-center gap-4 py-2">
                  <div className="text-center">
                    <img
                      src={buddy.avatar_url}
                      alt={buddy.username}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-purple-500/40 mx-auto mb-1"
                    />
                    <span className="text-xs font-bold text-white block">{buddy.username}</span>
                  </div>

                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#FF00C8] to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
                    <Handshake size={18} />
                  </div>

                  <div className="text-center">
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
                      alt="tech_mind"
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#00F0FF]/40 mx-auto mb-1"
                    />
                    <span className="text-xs font-bold text-white block">tech_mind</span>
                  </div>
                </div>

                <button
                  onClick={() => showToast(`🔔 Buddy Ping sent to @${buddy.username}!`)}
                  className="w-full py-2 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold font-mono transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send size={13} />
                  <span>Ping Buddy</span>
                </button>
              </div>

              {/* 3. Room Activity Card */}
              <div className="bg-[#0b0b14] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
                <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                  Room Activity
                </h3>

                <div className="space-y-3 text-xs font-mono">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Users size={13} className="text-[#00F0FF] shrink-0" />
                      <span>john_doe checked in</span>
                    </div>
                    <span className="text-[10px] text-gray-500 shrink-0">2m ago</span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-gray-300">
                      <ShieldCheck size={13} className="text-green-400 shrink-0" />
                      <span>tech_mind was verified by 2 members</span>
                    </div>
                    <span className="text-[10px] text-gray-500 shrink-0">10m ago</span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Flame size={13} className="text-amber-400 shrink-0" />
                      <span>code_ninja reached 18 day streak! 🔥</span>
                    </div>
                    <span className="text-[10px] text-gray-500 shrink-0">25m ago</span>
                  </div>
                </div>

                <button
                  onClick={() => showToast("Displaying all recent room activity logs!")}
                  className="text-xs font-mono text-purple-400 hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                >
                  <span>View All Activity</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── BOTTOM STICKY STATISTICS BAR (NO FOOTER ABOVE THIS) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#07070d]/95 border-t border-white/10 backdrop-blur-xl py-3.5 px-4 sm:px-8 shadow-[0_-10px_30px_rgba(0,0,0,0.9)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* 5 Statistic Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 w-full md:w-auto items-center">
            {/* 1. Check-in Streak */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Flame size={18} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase block font-bold">Check-in Streak</span>
                <span className="text-sm font-black text-white font-mono">{userStreakDays} Days</span>
                <span className="text-[9px] font-mono text-amber-400 block">Keep it up!</span>
              </div>
            </div>

            {/* 2. Total Check-ins */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center text-green-400 shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase block font-bold">Total Check-ins</span>
                <span className="text-sm font-black text-white font-mono">{myStandupsCount} / {targetDays}</span>
                <span className="text-[9px] font-mono text-gray-500 block">This Sprint</span>
              </div>
            </div>

            {/* 3. On-time Check-ins */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF] shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase block font-bold">On-time Check-ins</span>
                <span className="text-sm font-black text-white font-mono">{Math.max(myStandupsCount - 1, 19)}</span>
                <span className="text-[9px] font-mono text-green-400 block">95% on time</span>
              </div>
            </div>

            {/* 4. gBits at Stake */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Coins size={18} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase block font-bold">gBits at Stake</span>
                <span className="text-sm font-black text-amber-400 font-mono">50 gBits</span>
                <span className="text-[9px] font-mono text-gray-500 block">Your Stake</span>
              </div>
            </div>

            {/* 5. Potential Reward */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF00C8]/15 border border-[#FF00C8]/30 flex items-center justify-center text-[#FF00C8] shrink-0">
                <Award size={18} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase block font-bold">Potential Reward</span>
                <span className="text-sm font-black text-white font-mono">100+ gBits</span>
                <span className="text-[9px] font-mono text-purple-300 block">If you complete</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => showToast("🎉 Completing this sprint unlocks +100 gBits and an Uptime Streak Badge!")}
            className="px-6 py-2.5 rounded-xl text-white font-bold text-xs shrink-0 cursor-pointer transition shadow-lg hover:opacity-90"
            style={{
              background: "linear-gradient(90deg, #FF00C8, #a855f7)",
            }}
          >
            View Rewards
          </button>
        </div>
      </div>

      {/* ── CHECK-IN MODAL POPUP ── */}
      <AnimatePresence>
        {showCheckinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && setShowCheckinModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 25 }}
              className="relative w-full max-w-lg bg-[#0d0d16] border border-purple-500/30 rounded-3xl p-6 shadow-2xl overflow-hidden space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="text-amber-400" size={18} />
                  <h3 className="text-base font-bold text-white">Daily Check-in & Standup</h3>
                </div>
                <button onClick={() => setShowCheckinModal(false)} className="text-gray-500 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCheckinSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-gray-400 block mb-1 font-semibold">
                    What did you accomplish today? *
                  </label>
                  <textarea
                    value={accomplishment}
                    onChange={(e) => setAccomplishment(e.target.value)}
                    placeholder="e.g. Solved a tough Glitch on async recursion and optimized performance..."
                    rows={3}
                    required
                    className="w-full bg-[#07070d] border border-white/10 rounded-xl p-3 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#00F0FF]/50 transition font-sans resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-gray-400 block mb-1 font-semibold">
                    Proof of Work URL (GitHub / PR / Live Link)
                  </label>
                  <input
                    type="url"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://github.com/parulsingh/async-glitch"
                    className="w-full px-3.5 py-2.5 bg-[#07070d] border border-white/10 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#00F0FF]/50 transition font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-gray-400 block mb-1 font-semibold">
                    Blockers / Help needed (Optional)
                  </label>
                  <input
                    type="text"
                    value={blockers}
                    onChange={(e) => setBlockers(e.target.value)}
                    placeholder="Understanding edge cases in large inputs."
                    className="w-full px-3.5 py-2.5 bg-[#07070d] border border-white/10 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#00F0FF]/50 transition font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCheckinModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 text-xs font-semibold hover:bg-white/10 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !accomplishment.trim()}
                    className="px-5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
                    style={{
                      background: "linear-gradient(90deg, #FF00C8, #a855f7)",
                    }}
                  >
                    {submitting ? "Logging..." : "Submit Check-in"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreatorRoomDetail;
