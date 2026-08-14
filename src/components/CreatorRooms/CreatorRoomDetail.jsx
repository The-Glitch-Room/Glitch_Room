import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../supabaseClient";
import Navbar from "../Navbar";
import Footer from "../Footer";
import RoomLeaderboardModal from "./RoomLeaderboardModal";
import DeleteRoomModal from "./DeleteRoomModal";
import {
  Users,
  Copy,
  CheckCircle,
  Calendar,
  Zap,
  Target,
  Check,
  X,
  Lock,
  Globe,
  Award,
  Heart,
  Share2,
  Info,
  Edit3,
  Activity,
  ChevronRight,
  Crown,
  Sparkles,
  Trash2,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const getWeekLabel = () => {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
};

const getWeekRange = () => {
  const curr = new Date();
  const first = curr.getDate() - curr.getDay() + 1;
  const last = first + 6;
  const startDate = new Date(curr.setDate(first));
  const endDate = new Date(curr.setDate(last));
  const format = (date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${format(startDate)} – ${format(endDate)}`;
};

const timeAgo = (iso) => {
  if (!iso) return "just now";
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const formatDate = (iso) => {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const MemberAvatar = ({ profile, size = 9 }) => {
  const name = profile?.username || profile?.full_name || "?";
  const initials = name.slice(0, 2).toUpperCase();
  return profile?.avatar_url ? (
    <img
      src={profile.avatar_url}
      alt={name}
      className={`w-${size} h-${size} rounded-xl object-cover ring-1 ring-white/10 shrink-0`}
    />
  ) : (
    <div
      className={`w-${size} h-${size} rounded-xl flex items-center justify-center text-xs font-black ring-1 ring-white/10 shrink-0`}
      style={{
        background: "linear-gradient(135deg,#FF00C822,#00F0FF22)",
        color: "#00F0FF",
      }}
    >
      {initials}
    </div>
  );
};

// SVG Circular Progress Donut Chart calculated dynamically from real percentage
const DonutProgress = ({ percentage = 0 }) => {
  const strokeWidth = 10;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          stroke="url(#donutGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
          fill="transparent"
        />
        <defs>
          <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#00F0FF" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-black text-white">{percentage}%</span>
      </div>
    </div>
  );
};

// ── Main Creator Room Detail Component ────────────────────────────────────────
const CreatorRoomDetail = ({ roomId }) => {
  const navigate = useNavigate();
  const id = roomId;

  // Real Database States
  const [room, setRoom] = useState(null);
  const [hostProfile, setHostProfile] = useState(null);
  const [members, setMembers] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [activity, setActivity] = useState([]);
  const [topContributors, setTopContributors] = useState([]);

  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("checkins");
  const [copied, setCopied] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [openLeaderboardModal, setOpenLeaderboardModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  // Check-in Form States
  const [checkinMsg, setCheckinMsg] = useState("");
  const [didComplete, setDidComplete] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myCheckin, setMyCheckin] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [likesState, setLikesState] = useState({});

  const weekLabel = getWeekLabel();
  const weekRange = getWeekRange();
  const weekNum = weekLabel.split("-W")[1] || "01";

  // Fetch all real database records for this room safely without foreign-key dependency
  const fetchAllData = async () => {
    setLoading(true);

    const { data: au } = await supabase.auth.getUser();
    const uid = au?.user?.id;
    setUserId(uid);

    if (uid) {
      const { data: uProf } = await supabase
        .from("profiles")
        .select("id, user_id, username, full_name, avatar_url, is_admin")
        .eq("id", uid)
        .single();
      if (uProf) setUserProfile(uProf);
    }

    // 1. Fetch Room record
    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .single();

    if (roomError || !roomData) {
      setRoom(null);
      setLoading(false);
      return;
    }
    setRoom(roomData);

    // Fetch host profile if created_by exists
    if (roomData.created_by) {
      const { data: hostProf } = await supabase
        .from("profiles")
        .select("username, full_name, avatar_url")
        .eq("id", roomData.created_by)
        .single();
      if (hostProf) setHostProfile(hostProf);
    }

    // 2. Fetch Room Members directly from room_members
    const { data: rawMembers } = await supabase
      .from("room_members")
      .select("*")
      .eq("room_id", id);

    let memberList = rawMembers || [];
    const memberUserIds = memberList.map((m) => m.user_id);
    const isCreatorHost = uid && roomData.created_by === uid;

    // If current logged-in user is host/creator but not yet in room_members DB table, auto-insert them
    if (isCreatorHost && !memberUserIds.includes(uid)) {
      try {
        await supabase
          .from("room_members")
          .upsert(
            { room_id: id, user_id: uid },
            { onConflict: "room_id,user_id", ignoreDuplicates: true }
          );

        // Re-fetch members
        const { data: refetched } = await supabase
          .from("room_members")
          .select("*")
          .eq("room_id", id);
        if (refetched) memberList = refetched;
      } catch (err) {
        console.warn("Auto-adding host to room_members:", err);
      }
    }

    const currentMemberUserIds = memberList.map((m) => m.user_id);
    const userIsMember = Boolean(uid && (currentMemberUserIds.includes(uid) || isCreatorHost));
    setIsMember(userIsMember);

    // 3. Fetch Check-ins for this room directly from room_checkins
    const { data: rawCheckins } = await supabase
      .from("room_checkins")
      .select("*")
      .eq("room_id", id)
      .order("created_at", { ascending: false });

    const checkinList = rawCheckins || [];

    // 4. Fetch Activity Feed for Room Members directly from glitch_activity
    let activityList = [];
    if (currentMemberUserIds.length > 0) {
      const { data: rawActivity } = await supabase
        .from("glitch_activity")
        .select("*")
        .in("user_id", currentMemberUserIds)
        .order("created_at", { ascending: false })
        .limit(30);

      activityList = rawActivity || [];
    }

    // 5. Gather ALL unique user_ids from members, checkins, and activities to fetch profiles in 1 clean query
    const allUserIds = Array.from(
      new Set([
        ...currentMemberUserIds,
        ...checkinList.map((c) => c.user_id),
        ...activityList.map((a) => a.user_id),
      ])
    ).filter(Boolean);

    let profilesMap = {};
    if (allUserIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, user_id, username, full_name, avatar_url")
        .in("id", allUserIds);

      (profs || []).forEach((p) => {
        const uId = p.id || p.user_id;
        if (uId) profilesMap[uId] = p;
      });
    }

    // Attach profiles to members, checkins, and activities
    const enrichedMembers = memberList.map((m) => ({
      ...m,
      profiles: profilesMap[m.user_id] || { username: "Member" },
    }));
    setMembers(enrichedMembers);

    const enrichedCheckins = checkinList.map((c) => ({
      ...c,
      profiles: profilesMap[c.user_id] || { username: "Member" },
    }));
    setCheckins(enrichedCheckins);

    const enrichedActivity = activityList.map((a) => ({
      ...a,
      profiles: profilesMap[a.user_id] || { username: "Member" },
    }));
    setActivity(enrichedActivity);

    // Find current user's check-in for the current week
    const currentWeekCheckins = enrichedCheckins.filter(
      (c) => c.week_label === weekLabel
    );

    const userCheckin = uid
      ? currentWeekCheckins.find((c) => c.user_id === uid)
      : null;

    if (userCheckin) {
      setMyCheckin(userCheckin);
      setCheckinMsg(userCheckin.message || "");
      setDidComplete(userCheckin.did_complete);
    } else {
      setMyCheckin(null);
      setCheckinMsg("");
      setDidComplete(true);
    }

    // Compute Top Contributors (This Week)
    const pointsMap = {};
    enrichedActivity.forEach((act) => {
      const uId = act.user_id;
      if (act.type !== "checkin") {
        pointsMap[uId] = (pointsMap[uId] || 0) + (act.points || 0);
      }
    });

    currentWeekCheckins.forEach((c) => {
      if (c.did_complete) {
        const uId = c.user_id;
        pointsMap[uId] = (pointsMap[uId] || 0) + 10;
      }
    });

    const sortedContributors = Object.keys(pointsMap)
      .map((uId) => ({
        user_id: uId,
        gbits: pointsMap[uId],
        profile: profilesMap[uId] || { username: "Member" },
      }))
      .sort((a, b) => b.gbits - a.gbits)
      .slice(0, 5);

    setTopContributors(sortedContributors);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();

    // Real-time Subscriptions
    const channel = supabase
      .channel(`room-detail-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${id}` },
        () => fetchAllData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_checkins", filter: `room_id=eq.${id}` },
        () => fetchAllData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Handle Join Room CTA with fallback & immediate state updates
  const handleJoin = async () => {
    if (!userId) return;
    setJoining(true);
    setIsMember(true); // Optimistic UI update

    try {
      const { error: upsertErr } = await supabase
        .from("room_members")
        .upsert(
          { room_id: id, user_id: userId },
          { onConflict: "room_id,user_id", ignoreDuplicates: true }
        );

      if (upsertErr) {
        await supabase
          .from("room_members")
          .insert({ room_id: id, user_id: userId });
      }
    } catch (err) {
      console.error("Error joining room:", err);
    } finally {
      setJoining(false);
      await fetchAllData();
    }
  };

  // Handle Submit or Edit Check-in Form
  const handleCheckinSubmit = async () => {
    if (!userId) return;
    setSubmitting(true);

    try {
      if (myCheckin) {
        // Update existing check-in
        await supabase
          .from("room_checkins")
          .update({
            message: checkinMsg.trim() || null,
            did_complete: didComplete,
          })
          .eq("id", myCheckin.id);
      } else {
        // Insert new check-in
        await supabase.from("room_checkins").insert({
          room_id: id,
          user_id: userId,
          week_label: weekLabel,
          message: checkinMsg.trim() || null,
          did_complete: didComplete,
        });
      }
    } catch (err) {
      console.error("Error submitting check-in:", err);
    }

    setIsEditing(false);
    setSubmitting(false);
    await fetchAllData();
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleLike = (checkinId) => {
    setLikesState((prev) => ({
      ...prev,
      [checkinId]: !prev[checkinId],
    }));
  };

  // ── Dynamic Pure Real Data Calculations ─────────────────────────────────────
  const memberCount = members.length;
  const thisWeekCheckins = checkins.filter((c) => c.week_label === weekLabel);
  const checkinsThisWeekCount = thisWeekCheckins.length;
  const completedCheckinsCount = thisWeekCheckins.filter(
    (c) => c.did_complete
  ).length;

  const weeklyProgressPercentage =
    memberCount > 0
      ? Math.round((completedCheckinsCount / memberCount) * 100)
      : 0;

  // Active users this week: unique user_ids who checked in or logged activity in current week
  const activeUserIdsThisWeek = new Set([
    ...thisWeekCheckins.map((c) => c.user_id),
    ...activity.map((a) => a.user_id),
  ]);
  const activeThisWeekCount = activeUserIdsThisWeek.size;
  const isHostOrAdmin = Boolean(userId && (room?.created_by === userId || userProfile?.is_admin));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#06060c]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-2 border-t-transparent border-purple-500 rounded-full"
        />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#06060c] text-white">
        <div className="text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-400">Creator Room not found in database.</p>
          <button
            onClick={() => navigate("/creator-rooms")}
            className="mt-4 text-purple-400 text-sm hover:underline cursor-pointer"
          >
            ← Back to Creator Rooms
          </button>
        </div>
      </div>
    );
  }

  // Room Metadata
  const roomTitle = room.name;
  const roomDesc = room.description || "No description provided for this room.";
  const displayHostName =
    hostProfile?.username ||
    hostProfile?.full_name ||
    room.host ||
    "Unknown Host";

  const displayHostAvatar = hostProfile?.avatar_url;
  const categoryName = room.category || "General";
  const accessTypeLabel =
    room.access === "private" ? "Private Room" : "Public Room";
  const createdDateFormatted = formatDate(room.created_at);

  return (
    <div className="min-h-screen bg-[#06060d] text-white flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-28 pb-20 flex-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 font-medium">
          <span
            onClick={() => navigate("/creator-rooms")}
            className="hover:text-purple-400 cursor-pointer transition"
          >
            Creator Rooms
          </span>
          <ChevronRight size={12} className="text-gray-600" />
          <span className="text-gray-200">Room Details</span>
        </div>

        {/* ── 1. HERO BANNER HEADER (100% REAL DATA) ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden mb-8 bg-[#0d0d16] border border-purple-500/20 p-6 md:p-8 shadow-[0_0_40px_rgba(168,85,247,0.12)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-[#FF00C8]/10 pointer-events-none" />
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background:
                "linear-gradient(90deg,transparent,#a855f7,#FF00C8,transparent)",
            }}
          />

          {/* Glowing Code Symbol Graphic */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center opacity-25 pointer-events-none">
            <div className="relative flex items-center justify-center">
              <div className="w-48 h-48 rounded-full bg-purple-500/20 blur-3xl absolute" />
              <div className="text-7xl font-black text-purple-400 tracking-tighter filter drop-shadow-[0_0_20px_#a855f7]">
                &lt;/&gt;
              </div>
            </div>
          </div>

          <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {roomTitle}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-600/30 border border-purple-500/40 text-purple-300">
                  Creator Room
                </span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-5">
                {roomDesc}
              </p>

              {/* Real Sub-badges row */}
              <div className="flex flex-wrap gap-2 sm:gap-3 text-xs">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold">
                  <Sparkles size={13} />
                  {categoryName}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 font-medium">
                  <MemberAvatar
                    profile={{
                      username: displayHostName,
                      avatar_url: displayHostAvatar,
                    }}
                    size={5}
                  />
                  Hosted by {displayHostName}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  {accessTypeLabel}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                  <Calendar size={13} className="text-purple-400" />
                  Created on {createdDateFormatted}
                </span>
              </div>
            </div>

            {/* Top Right Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {/* Delete Room Button for Host / Admin */}
              {isHostOrAdmin && (
                <button
                  onClick={() => setOpenDeleteModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400"
                >
                  <Trash2 size={14} /> Delete Room
                </button>
              )}

              <button
                onClick={copyInvite}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all bg-white/5 hover:bg-white/10 border border-white/10 text-white"
              >
                {copied ? (
                  <>
                    <CheckCircle size={14} className="text-green-400" /> Copied Link!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy Invite Link
                  </>
                )}
              </button>

              {!isMember ? (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-60"
                  style={{
                    background: "linear-gradient(90deg,#a855f7,#FF00C8)",
                  }}
                >
                  {joining ? "Joining..." : "Join Room"}
                </button>
              ) : (
                <span className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-green-500/15 border border-green-500/30 text-green-300">
                  <CheckCircle size={14} /> Joined Room
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── 2. METRICS BAR (DYNAMIC DATABASE VALUES ONLY) ───────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0c0c14] border border-white/6 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Users size={22} />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{memberCount}</p>
              <p className="text-xs text-gray-400 font-medium">Members</p>
            </div>
          </div>

          <div className="bg-[#0c0c14] border border-white/6 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Target size={22} />
            </div>
            <div>
              <p className="text-2xl font-black text-white">
                {weeklyProgressPercentage}%
              </p>
              <p className="text-xs text-gray-400 font-medium">Weekly Progress</p>
            </div>
          </div>

          <div className="bg-[#0c0c14] border border-white/6 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 shrink-0">
              <CheckCircle size={22} />
            </div>
            <div>
              <p className="text-2xl font-black text-white">
                {checkinsThisWeekCount}
              </p>
              <p className="text-xs text-gray-400 font-medium">Check-ins This Week</p>
            </div>
          </div>

          <div className="bg-[#0c0c14] border border-white/6 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
              <Activity size={22} />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{activeThisWeekCount}</p>
              <p className="text-xs text-gray-400 font-medium">Active This Week</p>
            </div>
          </div>
        </div>

        {/* ── 3. MAIN BODY (2 COLUMN GRID) ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── LEFT COLUMN ──────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-3 border-b border-white/10 pb-3">
              {[
                { id: "checkins", label: "Check-ins", icon: CheckCircle },
                { id: "activity", label: "Activity Feed", icon: Zap },
                { id: "members", label: "Members", icon: Users },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      isActive
                        ? "bg-white/10 border-white/20 text-white shadow-sm"
                        : "bg-transparent border-transparent text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <Icon size={14} className={isActive ? "text-purple-400" : ""} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "checkins" && (
                <motion.div
                  key="tab-checkins"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* ── WEEKLY CHECK-IN HERO BOX ──────────────────────────────── */}
                  <div className="relative bg-[#0b0b14] border border-purple-500/20 rounded-3xl p-6 overflow-hidden shadow-lg">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white">
                          Weekly Check-in
                        </h3>
                        <Info size={15} className="text-gray-500" />
                      </div>
                      {myCheckin && (
                        <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-green-500/10 border border-green-500/25 text-green-400">
                          <Check size={13} /> You've already checked in
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-4">
                      Have you worked on your goals this week? Let your community know!
                    </p>

                    <div className="flex items-center gap-2 mb-5">
                      <span className="text-xs text-gray-300 font-semibold">
                        Week {weekNum} ({weekRange})
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                        Current Week
                      </span>
                    </div>

                    {/* ── MEMBERSHIP LOGIC: IF NON-MEMBER → SHOW LOCK CARD ──── */}
                    {!isMember ? (
                      <div className="bg-[#12121f] border border-white/10 rounded-2xl p-6 text-center">
                        <Lock className="mx-auto mb-2 text-purple-400" size={24} />
                        <p className="text-white font-bold text-sm mb-1">
                          Join Room to Submit Weekly Check-in
                        </p>
                        <p className="text-xs text-gray-400 mb-4 max-w-sm mx-auto">
                          Check in weekly to build consistent coding habits and track accountability with this community.
                        </p>
                        <button
                          onClick={handleJoin}
                          disabled={joining}
                          className="px-6 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-60"
                          style={{
                            background: "linear-gradient(90deg,#a855f7,#FF00C8)",
                          }}
                        >
                          {joining ? "Joining..." : "Join Room Now"}
                        </button>
                      </div>
                    ) : myCheckin && !isEditing ? (
                      /* ── MEMBER HAS CHECKED IN → SHOW SUBMITTED CHECK-IN ────── */
                      <div className="bg-[#12121f] border border-white/8 rounded-2xl p-5 relative overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                              My Check-in
                            </p>
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                                  myCheckin.did_complete
                                    ? "bg-green-500/20 border-green-500/30 text-green-400"
                                    : "bg-red-500/20 border-red-500/30 text-red-400"
                                }`}
                              >
                                {myCheckin.did_complete ? (
                                  <Check size={20} />
                                ) : (
                                  <X size={20} />
                                )}
                              </div>
                              <div>
                                <p
                                  className={`text-base font-black ${
                                    myCheckin.did_complete
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {myCheckin.did_complete ? "Completed" : "Missed"}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  Checked in on {formatDate(myCheckin.created_at)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                              My Note
                            </p>
                            <p className="text-xs text-gray-200 leading-relaxed mb-4">
                              {myCheckin.message || "No check-in note added."}
                            </p>
                            <button
                              onClick={() => setIsEditing(true)}
                              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-purple-300 transition flex items-center gap-1.5 cursor-pointer ml-auto"
                            >
                              <Edit3 size={12} /> Edit Check-in
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ── MEMBER HAS NOT CHECKED IN YET (OR EDITING) → SHOW FORM ── */
                      <div className="bg-[#12121f] border border-purple-500/20 rounded-2xl p-5">
                        <p className="text-xs font-bold text-gray-300 mb-3">
                          What is your status for this week?
                        </p>
                        <div className="flex gap-3 mb-4">
                          <button
                            type="button"
                            onClick={() => setDidComplete(true)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-2 ${
                              didComplete
                                ? "bg-green-500/15 border-green-500/40 text-green-300"
                                : "bg-white/5 border-white/10 text-gray-400"
                            }`}
                          >
                            <Check size={14} /> Completed Goal
                          </button>
                          <button
                            type="button"
                            onClick={() => setDidComplete(false)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-2 ${
                              !didComplete
                                ? "bg-red-500/15 border-red-500/40 text-red-300"
                                : "bg-white/5 border-white/10 text-gray-400"
                            }`}
                          >
                            <X size={14} /> Missed Goal
                          </button>
                        </div>

                        <textarea
                          value={checkinMsg}
                          onChange={(e) => setCheckinMsg(e.target.value)}
                          placeholder="Share what you built, learned, or solved this week..."
                          rows={3}
                          className="w-full bg-[#08080f] border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition resize-none mb-4"
                        />

                        <div className="flex gap-2 justify-end">
                          {isEditing && (
                            <button
                              onClick={() => setIsEditing(false)}
                              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 bg-white/5 hover:bg-white/10 transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCheckinSubmit}
                            disabled={submitting}
                            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white cursor-pointer disabled:opacity-60 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                            style={{
                              background:
                                "linear-gradient(90deg,#a855f7,#FF00C8)",
                            }}
                          >
                            {submitting
                              ? "Saving Check-in..."
                              : isEditing
                                ? "Save Changes ✦"
                                : "Submit Check-in ✦"}
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── THIS WEEK'S CHECK-INS LIST (REAL DATABASE RECORDS ONLY) ── */}
                  <div className="bg-[#0b0b14] border border-white/6 rounded-3xl p-6">
                    <h3 className="text-base font-black text-white mb-5">
                      This Week's Check-ins ({thisWeekCheckins.length})
                    </h3>

                    {thisWeekCheckins.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                        <p className="text-3xl mb-2">🗓️</p>
                        <p className="text-gray-300 text-sm font-semibold">
                          No check-ins logged yet for this week.
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {isMember
                            ? "Be the first to submit a check-in!"
                            : "Join the room to submit your check-in."}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {thisWeekCheckins.map((item) => {
                          const name =
                            item.profiles?.username ||
                            item.profiles?.full_name ||
                            "Anonymous Member";
                          const isLiked = likesState[item.id];

                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#12121f] border border-white/5 hover:border-white/10 transition"
                            >
                              <MemberAvatar profile={item.profiles} size={9} />
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                  <span className="text-white text-xs font-bold">
                                    {name}
                                  </span>
                                  <span
                                    className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      item.did_complete
                                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                                    }`}
                                  >
                                    {item.did_complete ? (
                                      <>
                                        <Check size={10} /> Completed
                                      </>
                                    ) : (
                                      <>
                                        <X size={10} /> Missed
                                      </>
                                    )}
                                  </span>
                                </div>
                                {item.message && (
                                  <p className="text-xs text-gray-300 leading-relaxed mb-1">
                                    {item.message}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] text-gray-500">
                                  {timeAgo(item.created_at)}
                                </span>
                                <button
                                  onClick={() => toggleLike(item.id)}
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition cursor-pointer ${
                                    isLiked
                                      ? "bg-purple-500/20 text-purple-400"
                                      : "bg-white/5 text-gray-500 hover:text-white"
                                  }`}
                                >
                                  <Heart
                                    size={13}
                                    className={isLiked ? "fill-purple-400" : ""}
                                  />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "activity" && (
                <motion.div
                  key="tab-activity"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-[#0b0b14] border border-white/6 rounded-3xl p-6"
                >
                  <h3 className="text-base font-black text-white mb-5 flex items-center gap-2">
                    <Zap size={16} className="text-[#00F0FF]" /> Activity Feed ({activity.length})
                  </h3>
                  {activity.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                      <p className="text-3xl mb-2">⚡</p>
                      <p className="text-gray-300 text-sm font-semibold">
                        No activity logged yet.
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        When members complete challenges, their achievements will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activity.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-xl bg-[#12121f] border border-white/5"
                        >
                          <MemberAvatar profile={item.profiles} size={8} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-200">
                              <span className="font-bold text-white">
                                {item.profiles?.username || "Member"}
                              </span>{" "}
                              completed <span className="text-gray-400">{item.title}</span>
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              {timeAgo(item.created_at)}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded-full border border-[#00F0FF]/20">
                            +{item.points} gBits
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "members" && (
                <motion.div
                  key="tab-members"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-[#0b0b14] border border-white/6 rounded-3xl p-6"
                >
                  <h3 className="text-base font-black text-white mb-5 flex items-center gap-2">
                    <Users size={16} className="text-purple-400" /> Members ({members.length})
                  </h3>
                  {members.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                      <p className="text-3xl mb-2">👥</p>
                      <p className="text-gray-300 text-sm font-semibold">
                        No members in this room yet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {members.map((m, i) => {
                        const name =
                          m.profiles?.username ||
                          m.profiles?.full_name ||
                          "Member";
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-xl bg-[#12121f] border border-white/5"
                          >
                            <MemberAvatar profile={m.profiles} size={8} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white truncate">
                                {name}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                Joined {formatDate(m.joined_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── RIGHT SIDEBAR (1/3) ───────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* 1. Weekly Progress Donut Card */}
            <div className="bg-[#0b0b14] border border-white/6 rounded-3xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Weekly Progress</h3>
              <div className="flex items-center gap-5">
                <DonutProgress percentage={weeklyProgressPercentage} />
                <div className="flex-1">
                  <p className="text-xs text-gray-300 leading-relaxed">
                    <span className="font-bold text-white">
                      {completedCheckinsCount} of {memberCount} members
                    </span>{" "}
                    completed their goals this week!
                  </p>
                  {weeklyProgressPercentage > 0 ? (
                    <p className="text-xs text-green-400 font-bold mt-2">
                      Keep it up, team! 🔥
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">
                      Awaiting weekly check-ins.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Room Info Card */}
            <div className="bg-[#0b0b14] border border-white/6 rounded-3xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Room Info</h3>
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Host</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-semibold">{displayHostName}</span>
                    <MemberAvatar
                      profile={{
                        username: displayHostName,
                        avatar_url: displayHostAvatar,
                      }}
                      size={5}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Category</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold">
                    {categoryName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Access</span>
                  <span className="flex items-center gap-1 text-green-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    {accessTypeLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Members</span>
                  <span className="text-white font-semibold">{memberCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Created On</span>
                  <span className="text-white font-semibold">{createdDateFormatted}</span>
                </div>
              </div>
            </div>

            {/* 3. Invite Friends Card */}
            <div className="bg-[#0b0b14] border border-purple-500/20 rounded-3xl p-6">
              <h3 className="text-sm font-bold text-white mb-1">Invite Friends</h3>
              <p className="text-xs text-gray-400 mb-4">
                Grow your community by inviting your friends!
              </p>

              <div className="flex items-center justify-between bg-[#12121f] border border-white/10 rounded-xl px-3 py-2 mb-3">
                <span className="text-xs text-gray-400 font-mono truncate mr-2">
                  {window.location.origin}/room/{id}
                </span>
                <button
                  onClick={copyInvite}
                  className="w-7 h-7 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 flex items-center justify-center text-purple-300 transition cursor-pointer shrink-0"
                >
                  <Copy size={13} />
                </button>
              </div>

              <button
                onClick={copyInvite}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-white cursor-pointer transition flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300"
              >
                <Share2 size={13} />
                {copied ? "Link Copied!" : "Share Invite Link"}
              </button>
            </div>

            {/* 4. Top Contributors (This Week) Card */}
            <div className="bg-[#0b0b14] border border-white/6 rounded-3xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">
                Top Contributors <span className="text-xs text-gray-400 font-normal">(This Week)</span>
              </h3>

              {topContributors.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs border border-dashed border-white/10 rounded-xl">
                  No active contributors yet this week.
                </div>
              ) : (
                <div className="space-y-3 mb-5">
                  {topContributors.map((c, index) => {
                    const rank = index + 1;
                    const cName =
                      c.profile?.username || c.profile?.full_name || "Contributor";

                    return (
                      <div
                        key={c.user_id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#12121f] border border-white/5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Crown
                            size={14}
                            className={
                              rank === 1
                                ? "text-yellow-400 shrink-0"
                                : rank === 2
                                  ? "text-gray-300 shrink-0"
                                  : "text-amber-600 shrink-0"
                            }
                          />
                          <MemberAvatar profile={c.profile} size={7} />
                          <span className="text-xs font-bold text-white truncate">
                            {cName}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-400 shrink-0">
                          {c.gbits} gBits
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => setOpenLeaderboardModal(true)}
                className="w-full py-2.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-xs font-bold text-purple-300 transition cursor-pointer text-center block"
              >
                View Room Leaderboard 🏆
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── ROOM LEADERBOARD MODAL ─────────────────────────────────────────── */}
      <RoomLeaderboardModal
        isOpen={openLeaderboardModal}
        onClose={() => setOpenLeaderboardModal(false)}
        roomName={roomTitle}
        members={members}
        checkins={checkins}
        activity={activity}
        currentUserId={userId}
      />

      {/* ── DELETE ROOM MODAL FOR HOST / ADMIN ─────────────────────────────── */}
      <DeleteRoomModal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        room={room}
        onDeleted={() => {
          setOpenDeleteModal(false);
          navigate("/creator-rooms");
        }}
      />

      <Footer />
    </div>
  );
};

export default CreatorRoomDetail;
