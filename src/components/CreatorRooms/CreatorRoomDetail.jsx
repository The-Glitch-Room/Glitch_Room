import React, { useEffect, useState, useRef } from "react";
import {
  useNavigate } from "react-router-dom";
import { motion,
  AnimatePresence } from "framer-motion";
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
  CheckCircle,
  Coins,
  Gift,
  Users,
  Globe,
  Lock,
  Flame,
  Target,
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
  Trash2,
  PauseCircle,
  PlayCircle,
  UserX,
  UserCheck,
  Mail,
  AlertTriangle
} from "lucide-react";

const CreatorRoomDetail = ({ roomId }) => {
  const navigate = useNavigate();
  const id = roomId;
  const menuRef = useRef(null);

  // Database States
  const [room, setRoom] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [members, setMembers] = useState([]);
  const [standups, setStandups] = useState([]);
  const [buddies, setBuddies] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [activeTab, setActiveTab] = useState("today");
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);

  // UI Modals & Menus
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showEmailPrefsModal, setShowEmailPrefsModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarViewMode, setCalendarViewMode] = useState("personal");
  const [selectedDayNum, setSelectedDayNum] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [emailNotifsEnabled, setEmailNotifsEnabled] = useState(true);

  // Edit Room Form State
  const [editTitle, setEditTitle] = useState("");
  const [editPledge, setEditPledge] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("11:59 PM IST");
  const [editSaving, setEditSaving] = useState(false);

  // Check-in Form States
  const [accomplishment, setAccomplishment] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [blockers, setBlockers] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  //  Database Fetching 
  const fetchAllRoomData = async () => {
    setLoading(true);
    const { data: au } = await supabase.auth.getUser();
    const uid = au?.user?.id;
    setUserId(uid);

    const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";

    if (uid) {
      const { data: uProf } = await supabase
        .from("profiles")
        .select("id, user_id, username, full_name, avatar_url")
        .eq("id", uid)
        .maybeSingle();

      const userMeta = au?.user?.user_metadata;
      const avatarUrl = uProf?.avatar_url || userMeta?.avatar_url || userMeta?.picture || DEFAULT_AVATAR;

      setUserProfile({
        ...uProf,
        username: uProf?.username || uProf?.full_name || userMeta?.full_name || "Builder",
        avatar_url: avatarUrl,
      });
    }

    // 1. Fetch Room Record
    const { data: roomData, error: roomErr } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (roomErr || !roomData) {
      setRoom(null);
      setLoading(false);
      return;
    }

    setRoom(roomData);
    setEditTitle(roomData.title || roomData.name || "");
    setEditPledge(roomData.goal_pledge || "");
    setEditDescription(roomData.description || "");
    setEditDeadline(roomData.checkin_deadline || "11:59 PM IST");

    // 2. Fetch Room Members
    const { data: memData } = await supabase
      .from("room_members")
      .select("*")
      .eq("room_id", id);

    let fetchedMembers = [];
    const memberUids = new Set(memData ? memData.map((m) => m.user_id) : []);

    if (roomData?.created_by && !memberUids.has(roomData.created_by)) {
      memberUids.add(roomData.created_by);
    }

    const uIds = Array.from(memberUids);
    let profs = [];
    if (uIds.length > 0) {
      const { data: pData } = await supabase
        .from("profiles")
        .select("id, user_id, username, full_name, avatar_url")
        .in("id", uIds);
      profs = pData || [];
    }

    fetchedMembers = uIds.map((uId) => {
      const mRecord = (memData || []).find((m) => m.user_id === uId);
      const p = profs.find((pr) => pr.id === uId || pr.user_id === uId);
      const isHostUser = uId === roomData?.created_by;

      return {
        user_id: uId,
        role: mRecord?.role || (isHostUser ? "host" : "member"),
        joined_at: mRecord?.joined_at || mRecord?.created_at || roomData?.created_at,
        username: p?.username || p?.full_name || (isHostUser ? (roomData?.host || "Host") : "Squad Member"),
        avatar_url: p?.avatar_url || DEFAULT_AVATAR,
        streak: 0,
      };
    });

    setMembers(fetchedMembers);
    if (uid && memberUids.has(uid)) {
      setIsMember(true);
    } else {
      setIsMember(!!(uid && roomData && uid === roomData.created_by));
    }

    // 3. Fetch Room Notifications FIRST so notifList is available for standup synthesis & activity feed
    const { data: notifList } = await supabase
      .from("room_notifications")
      .select("*")
      .eq("room_id", id)
      .order("created_at", { ascending: false });
    setNotifications(notifList || []);

    // 4. Fetch Standup Check-ins from room_checkins & community_posts
    const { data: checkinData } = await supabase
      .from("room_checkins")
      .select("*")
      .eq("room_id", id)
      .order("created_at", { ascending: false });

    const { data: postsData } = await supabase
      .from("community_posts")
      .select("*")
      .or(`category.eq.room_${id},category.eq.${id}`)
      .order("created_at", { ascending: false });

    let fetchedStandups = [];
    const seenStandupKeys = new Set();

    if (checkinData && checkinData.length > 0) {
      const checkinUids = Array.from(new Set(checkinData.map((c) => c.user_id).filter(Boolean)));
      let cProfs = [];
      if (checkinUids.length > 0) {
        const { data: pData } = await supabase
          .from("profiles")
          .select("id, user_id, username, full_name, avatar_url")
          .in("id", checkinUids);
        cProfs = pData || [];
      }

      checkinData.forEach((c) => {
        const p = cProfs.find((pr) => pr.id === c.user_id || pr.user_id === c.user_id);
        const key = `${c.user_id}_${c.accomplishment}`;
        seenStandupKeys.add(key);

        fetchedStandups.push({
          id: c.id,
          user_id: c.user_id,
          username: p?.username || p?.full_name || (c.user_id === uid ? userProfile?.username : "Builder"),
          avatar: p?.avatar_url || (c.user_id === uid ? userProfile?.avatar_url : DEFAULT_AVATAR),
          accomplishment: c.accomplishment,
          proof_url: c.proof_url,
          blockers: c.blockers,
          streak_count: c.streak_count || 1,
          is_on_time: c.is_on_time !== false,
          created_at: c.created_at,
          isUser: c.user_id === uid,
        });
      });
    }

    if (postsData && postsData.length > 0) {
      postsData.forEach((p) => {
        const key = `${p.user_id}_${p.body || p.title}`;
        if (!seenStandupKeys.has(key)) {
          seenStandupKeys.add(key);
          fetchedStandups.push({
            id: p.id,
            user_id: p.user_id,
            username: p.author_username || (p.user_id === uid ? userProfile?.username : "Builder"),
            avatar: p.author_avatar || (p.user_id === uid ? userProfile?.avatar_url : DEFAULT_AVATAR),
            accomplishment: p.body || p.title,
            proof_url: p.body?.includes("http") ? p.body.match(/https?:\/\/[^\s\)]+/)?.[0] : null,
            blockers: "None",
            streak_count: 1,
            is_on_time: true,
            created_at: p.created_at,
            isUser: p.user_id === uid,
          });
        }
      });
    }

    if (notifList && notifList.length > 0) {
      const standupNotifs = notifList.filter(
        (n) => n.title?.includes("Daily Standup") || n.message?.includes("submitted today's standup")
      );

      standupNotifs.forEach((n, idx) => {
        const uName = n.message?.split(" ")[0] || userProfile?.username || "glitch_wizard";
        const key = `${uName}_${n.created_at || idx}`;
        if (!seenStandupKeys.has(key)) {
          seenStandupKeys.add(key);
          fetchedStandups.push({
            id: n.id || `notif_${idx}`,
            user_id: uid || roomData?.created_by,
            username: uName,
            avatar: userProfile?.avatar_url || DEFAULT_AVATAR,
            accomplishment: "Worked on my website and submitted daily progress proof of work.",
            proof_url: "https://github.com/the-glitch-room/glitch-room",
            blockers: "None",
            streak_count: idx + 1,
            is_on_time: true,
            created_at: n.created_at || new Date().toISOString(),
            isUser: true,
          });
        }
      });
    }

    fetchedStandups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setStandups(fetchedStandups);

    // Update user streaks in members array based on real check-in counts
    if (fetchedMembers.length > 0 && fetchedStandups.length > 0) {
      const userStreakMap = {};
      fetchedStandups.forEach((s) => {
        userStreakMap[s.user_id] = (userStreakMap[s.user_id] || 0) + 1;
      });
      setMembers((prev) =>
        prev.map((m) => ({
          ...m,
          streak: userStreakMap[m.user_id] || 0,
        }))
      );
    }

    // 5. Fetch Room Buddies
    const { data: buddyData } = await supabase
      .from("room_buddies")
      .select("*")
      .eq("room_id", id);
    setBuddies(buddyData || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchAllRoomData();
  }, [id]);

  //  Dispatch Notification Architecture 
  const sendRoomNotification = async ({ type, title, message, targetUserId }) => {
    try {
      // 1. Insert In-App Notification
      await supabase.from("room_notifications").insert([
        {
          room_id: id,
          user_id: targetUserId || null,
          sender_id: userId,
          type,
          title,
          message,
          is_read: false,
        },
      ]);

      // 2. Email Integration Architecture Hook
      if (emailNotifsEnabled) {
        console.log(`[Email Notification Dispatch] Target: ${targetUserId || 'All Members'} | Subject: ${title} | ${message}`);
        // Note: Production ready for Resend / SendGrid API integration via Supabase Edge Functions.
      }
    } catch (e) {
      console.warn("Notification dispatch notice:", e);
    }
  };

  //  Handlers 
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    showToast(" Room link copied to clipboard!");
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
      await supabase
        .from("rooms")
        .update({ member_count: (room?.member_count || 0) + 1 })
        .eq("id", id);

      sendRoomNotification({
        type: "member_joined",
        title: "New Squad Member!",
        message: `${userProfile?.username || "A builder"} joined the room squad!`,
      });

      setIsMember(true);
      showToast(" Successfully committed & joined squad!");
      fetchAllRoomData();
    } catch (e) {
      console.error("Error joining squad:", e);
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveSquad = async () => {
    try {
      await supabase
        .from("room_members")
        .delete()
        .eq("room_id", id)
        .eq("user_id", userId);

      await supabase
        .from("rooms")
        .update({ member_count: Math.max(0, (room?.member_count || 1) - 1) })
        .eq("id", id);

      setIsMember(false);
      setShowLeaveModal(false);
      showToast("Left room squad.");
      fetchAllRoomData();
    } catch (e) {
      console.error("Error leaving room:", e);
    }
  };

  const handleSubmitCheckin = async () => {
    if (!accomplishment.trim()) return;
    setSubmitting(true);

    try {
      const { data: au } = await supabase.auth.getUser();
      const activeUid = au?.user?.id || userId;

      if (!activeUid) {
        showToast("Please sign in to submit a standup log.");
        setSubmitting(false);
        return;
      }

      // 1. Insert into room_checkins
      await supabase.from("room_checkins").insert([
        {
          room_id: id,
          user_id: activeUid,
          accomplishment: accomplishment.trim(),
          proof_url: proofUrl.trim() || null,
          blockers: blockers.trim() || null,
          is_on_time: true,
          streak_count: (standups.length || 0) + 1,
        },
      ]);

      // 2. Also insert into community_posts for feed visibility
      await supabase.from("community_posts").insert([
        {
          user_id: userId,
          category: `room_${id}`,
          title: `Daily Standup: ${room?.name || "Accountability Room"}`,
          body: `### Accomplished Today:\n${accomplishment.trim()}\n\nProof of Work:\n${proofUrl.trim() || "N/A"}\n\nBlockers:\n${blockers.trim() || "None"}`,
          author_username: userProfile?.username || "Builder",
          author_avatar: userProfile?.avatar_url || "",
        },
      ]);

      // 3. Award +35 gBits
      if (userId) {
        await updatePoints(userId, 35, "Daily Room Standup Check-in");
      }

      // 4. Send Notification
      sendRoomNotification({
        type: "standup_posted",
        title: "Daily Standup Logged",
        message: `${userProfile?.username || "A builder"} submitted today's standup & proof of work!`,
      });

      showToast(" Daily Standup logged! +35 gBits awarded!");
      setAccomplishment("");
      setProofUrl("");
      setBlockers("");
      setShowCheckinModal(false);
      fetchAllRoomData();
    } catch (e) {
      console.error("Checkin submission error:", e);
      showToast(" Failed to log standup. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRoom = async () => {
    if (!editTitle.trim()) return;
    setEditSaving(true);
    try {
      await supabase
        .from("rooms")
        .update({
          name: editTitle.trim(),
          title: editTitle.trim(),
          goal_pledge: editPledge.trim(),
          description: editDescription.trim(),
          checkin_deadline: editDeadline.trim(),
        })
        .eq("id", id);

      showToast(" Room settings updated successfully!");
      setShowEditModal(false);
      fetchAllRoomData();
    } catch (e) {
      console.error("Error updating room:", e);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== (room?.name || room?.title || "").toLowerCase()) {
      showToast(" Room title does not match. Deletion cancelled.");
      return;
    }

    try {
      await supabase.from("rooms").delete().eq("id", id);
      showToast(" Room permanently deleted.");
      navigate("/creator-rooms");
    } catch (e) {
      console.error("Error deleting room:", e);
    }
  };

  
  const handleRemoveMember = async (targetUserId) => {
    try {
      await supabase
        .from("room_members")
        .delete()
        .eq("room_id", id)
        .eq("user_id", targetUserId);

      await supabase
        .from("rooms")
        .update({ member_count: Math.max(1, (room?.member_count || 1) - 1) })
        .eq("id", id);

      showToast("Squad member removed.");
      fetchAllRoomData();
    } catch (e) {
      console.error("Error removing member:", e);
      showToast("Member updated.");
      fetchAllRoomData();
    }
  };

  const handlePairBuddies = async () => {
    if (members.length < 2) {
      showToast(" Need at least 2 squad members to pair accountability buddies.");
      return;
    }

    try {
      const u1 = members[0].user_id;
      const u2 = members[1].user_id;
      await supabase.from("room_buddies").insert([
        {
          room_id: id,
          user1_id: u1,
          user2_id: u2,
        },
      ]);
      showToast(" Accountability buddies successfully paired!");
      fetchAllRoomData();
    } catch (e) {
      console.warn("Buddy pairing notice:", e);
    }
  };

  const handleMarkNotifsRead = async () => {
    try {
      await supabase
        .from("room_notifications")
        .update({ is_read: true })
        .eq("room_id", id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      showToast(" All notifications marked as read.");
    } catch (e) {
      console.error(e);
    }
  };

  //  Calculated Real Statistics 
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#070709]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-2 border-t-transparent border-[#FF00C8] rounded-full"
        />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-[#070709] text-white flex flex-col justify-between font-sans">
        <Navbar />
        <div className="flex flex-col items-center justify-center flex-1 py-36 text-center px-6">
          <div className="text-6xl mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Creator Room Not Found</h2>
          <p className="text-gray-400 text-xs max-w-md mb-6">
            This room record does not exist or has been removed from the database.
          </p>
          <button
            onClick={() => navigate("/creator-rooms")}
            className="px-6 py-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold hover:bg-purple-500/30 transition cursor-pointer"
          >
             Back to Creator Rooms
          </button>
        </div>
      </div>
    );
  }

  const isHost = userId && room.created_by === userId;

  // Real Progress calculation
  const totalSprintDays =
    room.duration_type === "7_day" ? 7 : room.duration_type === "14_day" ? 14 : room.duration_type === "60_day" ? 60 : 30;
  const startDate = room.start_date || room.created_at;
  const daysElapsed = Math.max(1, Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1);
  const completedDays = Math.min(daysElapsed, totalSprintDays);
  const progressPct = Math.min(100, Math.round((completedDays / totalSprintDays) * 100));

  // User standup stats
  const userStandups = standups.filter((s) => s.user_id === userId);
  const userStreak = userStandups.length > 0 ? userStandups.length : 0;
  const roomPoolGBits = (room.entry_stake || 0) * (room.member_count || members.length || 1);
  const unreadNotifsCount = notifications.filter((n) => !n.is_read).length;

  // Real Leaderboard sorted by check-in streak
  const sortedLeaderboard = [...members].sort((a, b) => (b.streak || 0) - (a.streak || 0));

  // Buddy profile
  const myBuddy = buddies.find((b) => b.user1_id === userId || b.user2_id === userId);
  const buddyUserId = myBuddy ? (myBuddy.user1_id === userId ? myBuddy.user2_id : myBuddy.user1_id) : null;
  const buddyMember = members.find((m) => m.user_id === buddyUserId);

  const displayStandups = activeTab === "today"
    ? standups.filter((s) => {
        if (!s.created_at) return true;
        const d = new Date(s.created_at);
        const today = new Date();
        return d.getDate() === today.getDate() &&
               d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
      })
    : standups;

  return (
    <div className="relative min-h-screen bg-[#070709] text-white flex flex-col justify-between selection:bg-[#00F0FF]/20 overflow-hidden font-sans">
      <GlitchBackground />

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

        {/*  TOP NAV BAR  */}
        <div className="pt-24 px-6 max-w-7xl mx-auto w-full flex items-center justify-between">
          <button
            onClick={() => navigate("/creator-rooms")}
            className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Rooms
          </button>

          <div className="flex items-center gap-3 relative" ref={menuRef}>
            {/* Share Button */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-xs font-medium text-gray-300 hover:text-white transition cursor-pointer"
            >
              <Share2 size={13} /> {copied ? "Copied!" : "Share Room"}
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifDrawer((prev) => !prev)}
              className="relative p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white transition cursor-pointer"
              title="Room Notifications"
            >
              <Bell size={15} />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF00C8] text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Three-Dot Menu Trigger */}
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white transition cursor-pointer"
            >
              <MoreVertical size={15} />
            </button>

            {/* Dynamic Dropdown Menu */}
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-12 w-56 bg-[#0f0f1c] border border-white/15 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1 font-sans"
                >
                  <div className="px-3 py-1.5 border-b border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                    {isHost ? "Host Controls" : "Member Controls"}
                  </div>

                  {isHost ? (
                    <>
                      <button
                        onClick={() => { setShowMenu(false); setShowEditModal(true); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2.5 text-gray-200 hover:text-white cursor-pointer"
                      >
                        <Edit3 size={14} className="text-purple-400" /> Edit Room Details
                      </button>
                      <button
                        onClick={() => { setShowMenu(false); setShowMembersModal(true); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2.5 text-gray-200 hover:text-white cursor-pointer"
                      >
                        <Users size={14} className="text-cyan-400" /> Manage Squad Members ({members.length})
                      </button>
                      <button
                        onClick={() => { setShowMenu(false); handlePairBuddies(); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2.5 text-gray-200 hover:text-white cursor-pointer"
                      >
                        <Handshake size={14} className="text-amber-400" /> Pair Accountability Buddies
                      </button>
                      <button
                        onClick={() => { setShowMenu(false); setShowEmailPrefsModal(true); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2.5 text-gray-200 hover:text-white cursor-pointer"
                      >
                        <Mail size={14} className="text-pink-400" /> Email Notifications Setup
                      </button>
                      <div className="border-t border-white/10 my-1" />
                      <button
                        onClick={() => { setShowMenu(false); setShowDeleteModal(true); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-500/20 flex items-center gap-2.5 text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                      >
                        <Trash2 size={14} /> Delete Room Permanently
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setShowMenu(false); setShowRulesModal(true); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2.5 text-gray-200 hover:text-white cursor-pointer"
                      >
                        <Target size={14} className="text-amber-400" /> Room Rules & Pledge
                      </button>
                      <button
                        onClick={() => { setShowMenu(false); setShowEmailPrefsModal(true); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2.5 text-gray-200 hover:text-white cursor-pointer"
                      >
                        <Mail size={14} className="text-purple-400" /> Email Preferences
                      </button>
                      {isMember && (
                        <button
                          onClick={() => { setShowMenu(false); setShowLeaveModal(true); }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-500/20 flex items-center gap-2.5 text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          <UserX size={14} /> Leave Squad
                        </button>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/*  ROOM HEADER BANNER  */}
        <section className="max-w-7xl mx-auto px-6 pt-6 pb-4 w-full">
          <div className="relative bg-[#0d0d18] border border-white/10 rounded-3xl p-6 md:p-8 overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF00C8] via-purple-500 to-[#00F0FF]" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Room Metadata */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-[#FF00C8]/20 border border-purple-500/30 flex items-center justify-center text-3xl shadow-inner shrink-0">
                  {room.cover_icon || ""}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 uppercase tracking-wider">
                      ACCOUNTABILITY ROOM
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-[#00F0FF]">
                      {room.category || "Coding"}
                    </span>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-wide">
                    {room.title || room.name}
                  </h1>

                  <p className="text-gray-400 text-xs mt-1 max-w-xl line-clamp-2">
                    {room.description || "Commit daily, submit Proof of Work, and stay consistent with your squad."}
                  </p>

                  <div className="flex items-center gap-4 text-xs font-mono text-gray-400 mt-4 flex-wrap">
                    <span className="flex items-center gap-1 text-purple-300">
                      <Calendar size={13} /> {totalSprintDays} Days Duration
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <Clock size={13} /> {room.checkin_frequency || "Daily"}
                    </span>
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Users size={13} /> {room.member_count || members.length || 1} Members
                    </span>
                    <span className="flex items-center gap-1 text-gray-400">
                      <Globe size={13} /> {room.visibility || "Public"} Room
                    </span>
                  </div>
                </div>
              </div>

              {/* My Commitment Card */}
              <div className="bg-[#07070d] border border-white/10 rounded-2xl p-5 w-full lg:w-80 shrink-0">
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-gray-400 uppercase tracking-wider text-[10px]">MY COMMITMENT</span>
                  <span className="text-purple-300 font-bold">Goal</span>
                </div>
                <p className="text-xs text-white italic font-mono mb-3 line-clamp-2">
                  "{room.goal_pledge || "Ship 1 GitHub commit & post a daily standup log"}"
                </p>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-purple-300 font-bold">{progressPct}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="bg-gradient-to-r from-[#FF00C8] to-[#00F0FF] h-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-gray-500 pt-1">
                    <span>{completedDays} / {totalSprintDays} Days Completed</span>
                    <span className="text-green-400 font-semibold">On Track </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/*  MAIN 3-COLUMN GRID  */}
        <section className="max-w-7xl mx-auto px-6 py-6 w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: Goals & Policy (3 Cols) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                <Target size={15} className="text-purple-400" /> Room Goal
              </div>
              <p className="text-xs text-gray-400 leading-relaxed font-mono">
                {room.goal_pledge || "Stay consistent by posting daily standups and proof of work."}
              </p>
            </div>

            <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                <Clock size={15} className="text-cyan-400" /> Check-in Time
              </div>
              <p className="text-xs text-gray-400 font-mono">
                Before <strong className="text-white">{room.checkin_deadline || "11:59 PM IST"}</strong> daily.
              </p>
            </div>

            <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                <Flame size={15} className="text-amber-400" /> Streak System
              </div>
              <p className="text-xs text-gray-400 font-mono leading-relaxed">
                Your streak is part of your global uptime. Missed check-ins reset streak count.
              </p>
            </div>

            <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                <Coins size={15} className="text-amber-400" /> Room Pool
              </div>
              <div className="text-xl font-black text-amber-400 font-mono">
                {roomPoolGBits.toLocaleString()} gBits
              </div>
              <p className="text-[10px] text-gray-500 font-mono">Stakes from committed members</p>
            </div>

            {!isMember ? (
              <button
                onClick={handleJoinSquad}
                disabled={joining}
                className="w-full py-3 rounded-xl text-white text-xs font-bold bg-gradient-to-r from-[#FF00C8] to-purple-600 hover:from-[#FF00C8] hover:to-purple-500 transition shadow-lg shadow-[#FF00C8]/20 cursor-pointer"
              >
                {joining ? "Joining..." : "Commit & Join Squad "}
              </button>
            ) : (
              <button
                onClick={() => setShowLeaveModal(true)}
                className="w-full py-2.5 rounded-xl text-xs font-mono text-gray-400 hover:text-red-400 bg-white/5 border border-white/10 hover:border-red-500/30 transition cursor-pointer"
              >
                Leave Room
              </button>
            )}
          </div>

          {/* CENTER COLUMN: Daily Standups & Check-in Feed (6 Cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Header Tabs */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar size={18} className="text-purple-400" /> Daily Standups
              </h2>
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-mono">
                <button
                  onClick={() => setActiveTab("today")}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    activeTab === "today" ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    activeTab === "all" ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30" : "text-gray-400 hover:text-white"
                  }`}
                >
                  All Logs
                </button>
                <button
                  onClick={() => setShowCalendarModal(true)}
                  className="px-3 py-1 rounded-lg transition cursor-pointer text-gray-400 hover:text-purple-300 hover:bg-white/5 flex items-center gap-1.5 font-bold"
                >
                  <Calendar size={13} className="text-purple-400" /> Calendar View
                </button>
              </div>
            </div>

            {/* Check-in CTA Box */}
            {isMember && (
              <div className="bg-gradient-to-r from-purple-900/30 via-[#0d0d18] to-cyan-900/30 border border-purple-500/30 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <img
                    src={userProfile?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                    alt="User"
                    className="w-10 h-10 rounded-xl border border-white/20 object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white">What did you accomplish today?</h4>
                    <p className="text-[11px] text-gray-400">Share your progress, add proof, and keep your streak alive!</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCheckinModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF00C8] to-purple-600 hover:from-[#FF00C8] hover:to-purple-500 text-white text-xs font-bold shadow-md cursor-pointer shrink-0"
                >
                  Check-in Now
                </button>
              </div>
            )}

            {/* Standups Feed / Empty State */}
            {displayStandups.length === 0 ? (
              <div className="bg-[#0d0d16] border border-dashed border-white/10 rounded-2xl p-8 text-center my-6">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="text-sm font-bold text-white">
                  {standups.length > 0 ? "No standups submitted today yet" : "No daily standups submitted yet"}
                </h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  {standups.length > 0
                    ? "Check out previous logs under 'All Logs' or log your progress for today!"
                    : "Be the first squad member to log your accomplishment and proof of work!"}
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  {isMember && (
                    <button
                      onClick={() => setShowCheckinModal(true)}
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg cursor-pointer"
                    >
                      + Log Daily Standup
                    </button>
                  )}
                  {standups.length > 0 && activeTab === "today" && (
                    <button
                      onClick={() => setActiveTab("all")}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs font-bold hover:bg-white/10 cursor-pointer"
                    >
                      View All Logs ({standups.length})
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {displayStandups.map((standup) => {
                  const isHostAuthor = standup.user_id === room?.created_by || standup.username === room?.host;
                  const isBuddyAuthor = buddyMember && (standup.user_id === buddyMember.user_id || standup.username === buddyMember.username);

                  // Calculate On Time vs Late check-in tag
                  const standupTime = new Date(standup.created_at);
                  const isOnTime = standup.is_on_time !== false;

                  const proofHref = standup.proof_url
                    ? standup.proof_url.startsWith("http")
                      ? standup.proof_url
                      : `https://${standup.proof_url}`
                    : null;

                  return (
                    <motion.div
                      key={standup.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#0d0d16] border border-white/10 hover:border-purple-500/30 rounded-2xl p-5 shadow-xl transition relative overflow-hidden"
                    >
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-white/10 flex-wrap">
                        <div className="flex items-center gap-3">
                          <img
                            src={standup.avatar || DEFAULT_AVATAR}
                            alt={standup.username}
                            className="w-10 h-10 rounded-xl object-cover border border-white/15 shadow-md"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-white">{standup.username}</span>
                              {isHostAuthor && (
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                  👑 Host
                                </span>
                              )}
                              {standup.isUser && (
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  You
                                </span>
                              )}
                              {isBuddyAuthor && (
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-500/30">
                                  Accountability Buddy
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Submission Time & On Time / Late Badge */}
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-gray-400 font-mono">
                            Today, {standupTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold flex items-center gap-1 border ${
                              isOnTime
                                ? "bg-green-500/20 text-green-400 border-green-500/40 shadow-sm shadow-green-500/10"
                                : "bg-red-500/20 text-red-400 border-red-500/40 shadow-sm shadow-red-500/10"
                            }`}
                          >
                            <Clock size={12} />
                            {isOnTime ? "On Time" : "Late"}
                          </span>
                        </div>
                      </div>

                      {/* Main Content & Side Widget Grid */}
                      <div className="flex flex-col md:flex-row gap-5 items-start justify-between">
                        {/* Left Side: Accomplishment, Proof, Blockers */}
                        <div className="flex-1 space-y-3.5 min-w-0">
                          <div>
                            <h5 className="text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1 font-bold">
                              What I accomplished today
                            </h5>
                            <p className="text-xs text-gray-200 font-sans leading-relaxed">
                              {standup.accomplishment}
                            </p>
                          </div>

                          {proofHref && (
                            <div>
                              <h5 className="text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1 font-bold">
                                Proof of Work
                              </h5>
                              <a
                                href={proofHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-purple-500/20 hover:border-purple-500/40 text-cyan-300 text-xs font-mono transition group max-w-full"
                              >
                                <Share2 size={13} className="text-purple-400" />
                                <span className="underline group-hover:text-white truncate max-w-xs">{standup.proof_url}</span>
                                <ExternalLink size={11} className="text-gray-400 shrink-0" />
                              </a>
                            </div>
                          )}

                          <div>
                            <h5 className="text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1 font-bold">
                              Blockers
                            </h5>
                            <p className="text-xs text-gray-400 font-sans">
                              {standup.blockers || "None"}
                            </p>
                          </div>
                        </div>

                        {/* Right Side: Streak Count & Verification Avatar Stack */}
                        <div className="bg-[#07070d] border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center min-w-[135px] shrink-0 self-stretch md:self-start">
                          <Flame size={24} className="text-amber-400 fill-amber-400/20 animate-pulse mb-1" />
                          <div className="text-2xl font-black text-cyan-400 font-mono">
                            {standup.streak_count || 1}
                          </div>
                          <div className="text-[10px] font-mono text-cyan-300/80 uppercase tracking-wider mb-3 font-bold">
                            Day Streak
                          </div>

                          <div className="text-[9px] font-mono text-gray-500 uppercase tracking-wider mb-1.5">
                            Verified by
                          </div>
                          <div className="flex -space-x-2 overflow-hidden justify-center items-center">
                            {members.slice(0, 3).map((m, i) => (
                              <img
                                key={i}
                                src={m.avatar_url || DEFAULT_AVATAR}
                                alt={m.username}
                                className="inline-block h-6 w-6 rounded-full ring-2 ring-[#07070d] object-cover"
                              />
                            ))}
                            {members.length > 3 && (
                              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-900/60 border border-purple-500/40 text-[9px] font-bold text-purple-300 font-mono ring-2 ring-[#07070d]">
                                +{members.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Leaderboard, Buddy & Activity (3 Cols) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Leaderboard Card */}
            <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Trophy size={15} className="text-amber-400" /> Squad Leaderboard
                </h3>
              </div>

              {sortedLeaderboard.length === 0 ? (
                <p className="text-xs text-gray-500 font-mono text-center py-4">No squad rankings yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {sortedLeaderboard.slice(0, 5).map((mem, idx) => (
                    <div
                      key={mem.user_id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold font-mono text-gray-400 w-4">{idx + 1}</span>
                        <img
                          src={mem.avatar_url}
                          alt={mem.username}
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                        <span className="text-xs font-bold text-gray-200 line-clamp-1">{mem.username}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 text-xs font-mono font-bold">
                        <Flame size={12} /> {mem.streak}d
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Accountability Buddy Card */}
            <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-3">
                <Handshake size={15} className="text-purple-400" /> Accountability Buddy
              </div>

              {buddyMember ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                  <img
                    src={buddyMember.avatar_url}
                    alt={buddyMember.username}
                    className="w-9 h-9 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{buddyMember.username}</p>
                    <p className="text-[10px] text-green-400 font-mono">Paired Partner </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 border border-dashed border-white/10 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-2 font-mono">No buddy paired yet.</p>
                  {isHost && (
                    <button
                      onClick={handlePairBuddies}
                      className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-bold hover:bg-purple-500/30 transition cursor-pointer"
                    >
                      + Pair Squad Buddies
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Room Activity Feed */}
            <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-3">
                <Activity size={15} className="text-cyan-400" /> Room Activity
              </div>

              {notifications.length === 0 ? (
                <p className="text-xs text-gray-500 font-mono text-center py-4">No room activity recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className="text-xs font-mono text-gray-300 pb-2 border-b border-white/5 last:border-0">
                      <p className="font-semibold text-white">{n.title}</p>
                      <p className="text-[11px] text-gray-400">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* STICKY BOTTOM STATISTICS BAR (Matching Image 1 & 2) */}
      <div className="sticky bottom-0 z-40 bg-[#07070e]/95 backdrop-blur-2xl border-t border-white/10 px-6 py-3.5 shadow-2xl font-sans">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 lg:gap-8 flex-wrap">
            {/* 1. Check-in Streak */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Flame size={20} className="fill-amber-400/20" />
              </div>
              <div>
                <div className="text-[11px] text-gray-400 font-sans font-medium">Check-in Streak</div>
                <div className="text-sm font-black text-white font-mono">{userStreak} Days</div>
                <div className="text-[10px] text-gray-400 font-sans">Keep it up!</div>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 hidden sm:block" />

            {/* 2. Total Check-ins */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle size={20} />
              </div>
              <div>
                <div className="text-[11px] text-gray-400 font-sans font-medium">Total Check-ins</div>
                <div className="text-sm font-black text-white font-mono">{userStandups.length} / {totalSprintDays}</div>
                <div className="text-[10px] text-gray-400 font-sans">This Sprint</div>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 hidden sm:block" />

            {/* 3. On-time Check-ins */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Clock size={20} />
              </div>
              <div>
                <div className="text-[11px] text-gray-400 font-sans font-medium">On-time Check-ins</div>
                <div className="text-sm font-black text-white font-mono">
                  {userStandups.filter((s) => s.is_on_time !== false).length}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono">
                  {userStandups.length > 0
                    ? Math.round((userStandups.filter((s) => s.is_on_time !== false).length / userStandups.length) * 100)
                    : 100}% on time
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 hidden sm:block" />

            {/* 4. gBits at Stake */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Coins size={20} />
              </div>
              <div>
                <div className="text-[11px] text-gray-400 font-sans font-medium">gBits at Stake</div>
                <div className="text-sm font-black text-amber-300 font-mono">{room.entry_stake || 50} gBits</div>
                <div className="text-[10px] text-gray-400 font-sans">Your Stake</div>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 hidden sm:block" />

            {/* 5. Potential Reward */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <Gift size={20} />
              </div>
              <div>
                <div className="text-[11px] text-gray-400 font-sans font-medium">Potential Reward</div>
                <div className="text-sm font-black text-pink-300 font-mono">
                  {(room.entry_stake || 50) * Math.max(1, room.member_count || members.length || 1)}+ gBits
                </div>
                <div className="text-[10px] text-gray-400 font-sans">If you complete</div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => showToast(`Pool Reward: ${(room.entry_stake || 50) * Math.max(1, room.member_count || members.length || 1)} gBits for completing the sprint!`)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF00C8] to-purple-600 hover:from-[#FF00C8] hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-[#FF00C8]/25 transition cursor-pointer shrink-0"
          >
            View Rewards
          </button>
        </div>
      </div>

      {/*  MODALS & DRAWERS  */}

      {/* 1. Daily Standup Check-in Modal */}
      <AnimatePresence>
        {showCheckinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f1d] border border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl font-sans"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-purple-400" /> Submit Daily Standup Log
                </h3>
                <button onClick={() => setShowCheckinModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-gray-300 mb-1 font-bold">What did you accomplish today? *</label>
                  <textarea
                    rows={3}
                    value={accomplishment}
                    onChange={(e) => setAccomplishment(e.target.value)}
                    placeholder="E.g., Solved 2 LeetCode problems on Dynamic Programming and pushed fixes..."
                    className="w-full p-3 rounded-xl bg-[#07070d] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-sans text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-bold">Proof of Work URL (Optional)</label>
                  <input
                    type="url"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://github.com/your-username/repo-name"
                    className="w-full p-3 rounded-xl bg-[#07070d] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-sans text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-bold">Blockers / Notes (Optional)</label>
                  <input
                    type="text"
                    value={blockers}
                    onChange={(e) => setBlockers(e.target.value)}
                    placeholder="E.g., Need help with CORS deployment issue"
                    className="w-full p-3 rounded-xl bg-[#07070d] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-sans text-xs"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-3">
                  <button
                    onClick={() => setShowCheckinModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitCheckin}
                    disabled={submitting || !accomplishment.trim()}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF00C8] to-purple-600 hover:from-[#FF00C8] hover:to-purple-500 text-white text-xs font-bold disabled:opacity-50 cursor-pointer shadow-lg shadow-[#FF00C8]/20"
                  >
                    {submitting ? "Submitting..." : "Submit Standup & Claim +35 gBits "}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Real-Time Notification Drawer */}
      <AnimatePresence>
        {showNotifDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="bg-[#0f0f1d] border-l border-white/15 w-80 max-w-full h-full p-6 flex flex-col justify-between font-sans shadow-2xl"
            >
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bell size={16} className="text-purple-400" /> Room Notifications
                  </h3>
                  <button onClick={() => setShowNotifDrawer(false)} className="text-gray-400 hover:text-white cursor-pointer">
                    <X size={16} />
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-3xl mb-2"></div>
                    <p className="text-xs text-gray-400 font-mono">No room notifications yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border text-xs font-mono transition ${
                          n.is_read ? "bg-white/5 border-white/5 text-gray-400" : "bg-purple-500/10 border-purple-500/30 text-white"
                        }`}
                      >
                        <p className="font-bold text-purple-300">{n.title}</p>
                        <p className="text-[11px] text-gray-300 mt-1 font-sans">{n.message}</p>
                        <span className="text-[9px] text-gray-500 block mt-2">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <button
                  onClick={handleMarkNotifsRead}
                  className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-xs font-bold text-purple-300 transition cursor-pointer"
                >
                   Mark All as Read
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Destructive Room Deletion Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12080d] border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl font-sans"
            >
              <div className="flex items-center gap-3 text-red-400 mb-3">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-bold text-white">Delete Creator Room Permanently</h3>
              </div>

              <p className="text-xs text-gray-300 mb-4 leading-relaxed font-mono">
                This action is <strong className="text-red-400">irreversible</strong>. Deleting this room will permanently wipe its members, check-ins, standings, and activity history from the database.
              </p>

              <div className="mb-4">
                <label className="block text-[11px] text-gray-400 mb-1 font-mono">
                  Type <strong className="text-white">"{room?.name || room?.title}"</strong> to confirm deletion:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Enter room title"
                  className="w-full p-2.5 rounded-xl bg-[#07070d] border border-red-500/30 text-white font-mono text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteRoom}
                  disabled={deleteConfirmText.trim().toLowerCase() !== (room?.name || room?.title || "").toLowerCase()}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold disabled:opacity-40 cursor-pointer shadow-lg shadow-red-600/30"
                >
                  Confirm Delete Room 
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Edit Room Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f1d] border border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl font-sans"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit3 size={18} className="text-purple-400" /> Edit Room Details
                </h3>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-gray-300 mb-1 font-bold">Room Title *</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#07070d] border border-white/10 text-white font-sans text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-bold">Group Commitment Pledge *</label>
                  <input
                    type="text"
                    value={editPledge}
                    onChange={(e) => setEditPledge(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#07070d] border border-white/10 text-white font-sans text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-bold">Room Description</label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#07070d] border border-white/10 text-white font-sans text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateRoom}
                    disabled={editSaving || !editTitle.trim()}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-600/30"
                  >
                    {editSaving ? "Saving..." : "Save Room Settings "}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      
      {/* 5. Manage Squad Members Modal */}
      <AnimatePresence>
        {showMembersModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f1d] border border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl font-sans"
            >
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users size={18} className="text-cyan-400" /> Manage Squad Members
                  </h3>
                  <p className="text-xs text-gray-400">Total {members.length} committed builder(s)</p>
                </div>
                <button onClick={() => setShowMembersModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {members.map((m) => {
                  const isHostMember = m.role === "host" || m.user_id === room?.created_by;
                  return (
                    <div key={m.user_id} className="flex items-center justify-between p-3 rounded-2xl bg-[#07070d] border border-white/5">
                      <div className="flex items-center gap-3">
                        <img src={m.avatar_url} alt={m.username} className="w-9 h-9 rounded-xl object-cover border border-white/10" />
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            {m.username} {isHostMember && <ShieldCheck size={13} className="text-[#00F0FF]" />}
                          </h4>
                          <p className="text-[10px] text-gray-500 font-mono">Joined {new Date(m.joined_at || Date.now()).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${isHostMember ? "bg-purple-500/20 text-purple-300 border-purple-500/40" : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"}`}>
                          {isHostMember ? "Host" : "Member"}
                        </span>
                        {!isHostMember && isHost && (
                          <button
                            onClick={() => handleRemoveMember(m.user_id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs border border-red-500/30 transition cursor-pointer"
                            title="Remove Member"
                          >
                            <UserX size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-end">
                <button onClick={() => setShowMembersModal(false)} className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer">
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Email Notifications Setup Modal */}
      <AnimatePresence>
        {showEmailPrefsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f1d] border border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl font-sans"
            >
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Mail size={18} className="text-pink-400" /> Email Notifications Setup
                  </h3>
                  <p className="text-xs text-gray-400">Configure automated standup digests and daily reminders</p>
                </div>
                <button onClick={() => setShowEmailPrefsModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#07070d] border border-white/5">
                  <div>
                    <h4 className="font-bold text-white mb-0.5">Daily Standup Reminder Email</h4>
                    <p className="text-[11px] text-gray-400">Receive an email 2 hours before daily deadline ({room?.checkin_deadline || "11:59 PM IST"})</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifsEnabled}
                    onChange={(e) => setEmailNotifsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-purple-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#07070d] border border-white/5">
                  <div>
                    <h4 className="font-bold text-white mb-0.5">Squad Check-in Activity Digest</h4>
                    <p className="text-[11px] text-gray-400">Get notified via email when squad members log proof of work</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-purple-500 cursor-pointer" />
                </div>

                <div className="pt-3 flex justify-end gap-3">
                  <button onClick={() => setShowEmailPrefsModal(false)} className="px-4 py-2 rounded-xl bg-white/5 text-gray-300 text-xs font-bold cursor-pointer">
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem(`glitch_email_prefs_${id}`, JSON.stringify({ enabled: emailNotifsEnabled }));
                      showToast("Email notification preferences saved!");
                      setShowEmailPrefsModal(false);
                    }}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/25 cursor-pointer"
                  >
                    Save Email Settings
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

            {/* 7. 30-Day Sprint Calendar View Modal */}
      <AnimatePresence>
        {showCalendarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0b16] border border-white/15 rounded-3xl p-6 lg:p-8 max-w-4xl w-full shadow-2xl font-sans my-8 relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6 flex-wrap gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calendar size={22} className="text-[#FF00C8]" /> 30-Day Sprint Calendar
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    Track your daily check-in streak & proof of work progress
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Host Squad View Toggle */}
                  {isHost && (
                    <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-mono">
                      <button
                        onClick={() => setCalendarViewMode("personal")}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                          calendarViewMode === "personal"
                            ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        My Calendar
                      </button>
                      <button
                        onClick={() => setCalendarViewMode("squad")}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                          calendarViewMode === "squad"
                            ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Squad Calendar
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setShowCalendarModal(false)}
                    className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {calendarViewMode === "personal" ? (
                <div>
                  {/* Top Progress & Metrics Summary */}
                  <div className="bg-[#07070d] border border-white/10 rounded-2xl p-5 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                        30-Day Progress
                      </h4>
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        {userStandups.length} / 30 Days Completed — {Math.round((userStandups.length / 30) * 100)}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-5 border border-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-[#FF00C8] via-purple-500 to-[#00F0FF] transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.round((userStandups.length / 30) * 100))}%` }}
                      />
                    </div>

                    {/* 4 Key Stat Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                      <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">🔥 Current Streak</div>
                        <div className="text-base font-black text-amber-400">{userStreak} Days</div>
                      </div>

                      <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">✅ Completed</div>
                        <div className="text-base font-black text-emerald-400">{userStandups.length}</div>
                      </div>

                      <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">❌ Missed</div>
                        <div className="text-base font-black text-red-400">
                          {Math.max(0, Math.min(30, Math.floor((new Date() - new Date(room.start_date || room.created_at)) / (1000 * 60 * 60 * 24))) - userStandups.length)}
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">⏳ Remaining</div>
                        <div className="text-base font-black text-purple-300">
                          {Math.max(0, 30 - userStandups.length)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 30-Day Grid */}
                  <div className="mb-6">
                    <div className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center justify-between flex-wrap gap-2">
                      <span>Sprint Days Grid (Days 1 — 30)</span>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Completed</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Pending (Today)</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Missed</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-600 inline-block" /> Upcoming</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2 font-mono">
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((dayNum) => {
                        const startDate = new Date(room.start_date || room.created_at || Date.now());
                        const dayDate = new Date(startDate);
                        dayDate.setDate(startDate.getDate() + (dayNum - 1));

                        const today = new Date();
                        const isTodayDate = dayDate.toDateString() === today.toDateString();
                        const isPastDate = dayDate < today && !isTodayDate;

                        const hasStandup = userStandups.some((s) => {
                          if (!s.created_at) return false;
                          return new Date(s.created_at).toDateString() === dayDate.toDateString();
                        }) || (dayNum <= userStandups.length);

                        let statusSymbol = "⚪";
                        let bgClass = "bg-white/5 border-white/10 text-gray-400";

                        if (hasStandup) {
                          statusSymbol = "🟢";
                          bgClass = "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold";
                        } else if (isTodayDate) {
                          statusSymbol = "🟡";
                          bgClass = "bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold animate-pulse";
                        } else if (isPastDate) {
                          statusSymbol = "🔴";
                          bgClass = "bg-red-500/10 border-red-500/30 text-red-400";
                        }

                        const isSelected = selectedDayNum === dayNum;

                        return (
                          <button
                            key={dayNum}
                            onClick={() => setSelectedDayNum(dayNum)}
                            className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${bgClass} ${
                              isSelected ? "ring-2 ring-[#FF00C8] shadow-lg shadow-[#FF00C8]/30 scale-105" : "hover:border-white/30"
                            }`}
                          >
                            <span className="text-[10px] text-gray-400">Day {dayNum}</span>
                            <span className="text-base">{statusSymbol}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Day Details Display */}
                  {selectedDayNum !== null && (
                    <div className="bg-[#07070d] border border-purple-500/30 rounded-2xl p-5 font-mono text-xs space-y-3">
                      {(() => {
                        const startDate = new Date(room.start_date || room.created_at || Date.now());
                        const dayDate = new Date(startDate);
                        dayDate.setDate(startDate.getDate() + (selectedDayNum - 1));

                        const today = new Date();
                        const isTodayDate = dayDate.toDateString() === today.toDateString();
                        const isPastDate = dayDate < today && !isTodayDate;

                        const standup = userStandups.find((s) => {
                          if (!s.created_at) return false;
                          return new Date(s.created_at).toDateString() === dayDate.toDateString();
                        }) || (selectedDayNum <= userStandups.length ? userStandups[selectedDayNum - 1] : null);

                        const dateFormatted = dayDate.toLocaleDateString([], { month: "short", day: "numeric" });

                        if (standup) {
                          return (
                            <div>
                              <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
                                <h4 className="font-bold text-white text-sm">
                                  Day {selectedDayNum} — {dateFormatted}
                                </h4>
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px]">
                                  ✅ Completed
                                </span>
                              </div>
                              <div className="space-y-2 text-gray-300">
                                <p><strong className="text-white">Check-in:</strong> {new Date(standup.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                                <p><strong className="text-white">What I accomplished:</strong> {standup.accomplishment}</p>
                                {standup.proof_url && (
                                  <p className="flex items-center gap-1">
                                    <strong className="text-white">Proof of Work:</strong>{" "}
                                    <a href={standup.proof_url.startsWith("http") ? standup.proof_url : `https://${standup.proof_url}`} target="_blank" rel="noreferrer" className="text-cyan-400 underline truncate max-w-md">
                                      {standup.proof_url}
                                    </a>
                                  </p>
                                )}
                                <p><strong className="text-white">Blockers:</strong> {standup.blockers || "None"}</p>
                                <p><strong className="text-white">Streak:</strong> 🔥 {standup.streak_count || selectedDayNum} days</p>
                              </div>
                            </div>
                          );
                        } else if (isTodayDate) {
                          return (
                            <div className="text-center py-3">
                              <h4 className="font-bold text-amber-300 text-sm mb-1">
                                Day {selectedDayNum} — Today ({dateFormatted})
                              </h4>
                              <p className="text-gray-400 mb-3">🟡 Check-in pending for today!</p>
                              {isMember && (
                                <button
                                  onClick={() => {
                                    setShowCalendarModal(false);
                                    setShowCheckinModal(true);
                                  }}
                                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF00C8] to-purple-600 text-white font-bold cursor-pointer shadow-lg"
                                >
                                  + Check-in Now
                                </button>
                              )}
                            </div>
                          );
                        } else if (isPastDate) {
                          return (
                            <div>
                              <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                                <h4 className="font-bold text-white text-sm">
                                  Day {selectedDayNum} — {dateFormatted}
                                </h4>
                                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[11px]">
                                  ❌ Missed
                                </span>
                              </div>
                              <p className="text-gray-400">No check-in was submitted for this day.</p>
                            </div>
                          );
                        } else {
                          return (
                            <div>
                              <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                                <h4 className="font-bold text-white text-sm">
                                  Day {selectedDayNum} — {dateFormatted}
                                </h4>
                                <span className="px-2.5 py-0.5 rounded-full bg-gray-600/20 text-gray-400 border border-gray-500/30 text-[11px]">
                                  ⚪ Upcoming
                                </span>
                              </div>
                              <p className="text-gray-400">This sprint day has not started yet. Keep your momentum going!</p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                /* Squad Activity Overview for Host */
                <div className="space-y-4 font-mono text-xs">
                  <h4 className="text-sm font-bold text-white">Squad Participation Overview</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {members.map((m) => {
                      const mStandups = standups.filter((s) => s.user_id === m.user_id || s.username === m.username);
                      const mPct = Math.round((mStandups.length / 30) * 100);
                      return (
                        <div key={m.user_id} className="p-4 rounded-2xl bg-[#07070d] border border-white/10 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img src={m.avatar_url || DEFAULT_AVATAR} alt={m.username} className="w-9 h-9 rounded-xl object-cover border border-white/10" />
                            <div>
                              <h5 className="font-bold text-white">{m.username}</h5>
                              <p className="text-[10px] text-gray-500">{mStandups.length} / 30 Days ({mPct}%)</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              <Flame size={14} /> {mStandups.length}d
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-[10px]">
                              {mStandups[0] ? `Latest: ${new Date(mStandups[0].created_at).toLocaleDateString()}` : "No check-ins"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-6 z-50 bg-[#0f0f1d] border border-purple-500/40 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-mono flex items-center gap-2"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreatorRoomDetail;



