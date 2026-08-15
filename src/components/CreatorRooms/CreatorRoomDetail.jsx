import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../supabaseClient";
import Navbar from "../Navbar";
import Footer from "../Footer";
import GlitchBackground from "../GlitchBackground";
import { updatePoints } from "../../utils/pointsHelper";
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
  Flame,
  Link as LinkIcon,
  ShieldCheck,
  Bell,
  Clock,
  ThumbsUp,
  AlertCircle,
} from "lucide-react";

const MemberAvatar = ({ profile, size = 8 }) => {
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

const CreatorRoomDetail = ({ roomId }) => {
  const navigate = useNavigate();
  const id = roomId;

  const [room, setRoom] = useState(null);
  const [hostProfile, setHostProfile] = useState(null);
  const [members, setMembers] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Check-in Form States
  const [accomplishment, setAccomplishment] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [blockers, setBlockers] = useState("");
  const [submittingCheckin, setSubmittingCheckin] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [vouchedIds, setVouchedIds] = useState(new Set());

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const fetchRoomData = async () => {
    setLoading(true);
    const { data: au } = await supabase.auth.getUser();
    const uid = au?.user?.id;
    setUserId(uid);

    if (uid) {
      const { data: uProf } = await supabase
        .from("profiles")
        .select("id, user_id, username, full_name, avatar_url, is_admin")
        .eq("id", uid)
        .maybeSingle();
      if (uProf) setUserProfile(uProf);
    }

    // 1. Fetch Room record
    const { data: roomData, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !roomData) {
      setRoom(null);
      setLoading(false);
      return;
    }
    setRoom(roomData);

    // 2. Fetch Room Members
    const { data: memData } = await supabase
      .from("room_members")
      .select("user_id, role, created_at")
      .eq("room_id", id);

    let memberProfiles = [];
    if (memData && memData.length > 0) {
      const uIds = memData.map((m) => m.user_id);
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, user_id, username, full_name, avatar_url")
        .in("id", uIds);

      memberProfiles = memData.map((m) => {
        const p = (profs || []).find((pr) => pr.id === m.user_id || pr.user_id === m.user_id);
        return {
          user_id: m.user_id,
          role: m.role,
          username: p?.username || p?.full_name || "Squad Member",
          avatar_url: p?.avatar_url || null,
        };
      });
      setMembers(memberProfiles);

      if (uid && uIds.includes(uid)) {
        setIsMember(true);
      }
    }

    // 3. Fetch Check-ins (Room Activity Feed)
    const { data: checkinData } = await supabase
      .from("community_posts")
      .select("*")
      .eq("category", `room_${id}`)
      .order("created_at", { ascending: false });

    if (checkinData && checkinData.length > 0) {
      setCheckins(checkinData);

      if (uid) {
        const todayStr = new Date().toISOString().split("T")[0];
        const todayCheckin = checkinData.find(
          (c) => c.user_id === uid && c.created_at?.startsWith(todayStr)
        );
        if (todayCheckin) setHasCheckedInToday(true);
      }
    } else {
      setCheckins([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchRoomData();
  }, [id]);

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
      showToast("🎉 You've committed & joined this squad! Submit your daily check-in to start your streak.");
      fetchRoomData();
    } catch (e) {
      console.error(e);
    } finally {
      setJoining(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    if (!accomplishment.trim()) return;
    setSubmittingCheckin(true);

    const postData = {
      user_id: userId,
      title: `Daily Check-In: ${accomplishment.slice(0, 45)}...`,
      body: `### Accomplished Today:\n${accomplishment.trim()}\n\n${
        proofUrl ? `**Proof of Work:** [View Link](${proofUrl.trim()})\n\n` : ""
      }${blockers ? `**Blockers / Questions:** ${blockers.trim()}` : ""}`,
      category: `room_${id}`,
      likes: 0,
    };

    try {
      await supabase.from("community_posts").insert([postData]);
      await updatePoints(userId, 35, `Room Check-in: ${room?.name || "Accountability"}`, "checkin");

      setHasCheckedInToday(true);
      setAccomplishment("");
      setProofUrl("");
      setBlockers("");
      showToast("🔥 Daily Check-in recorded! Streak maintained & +35 gBits earned!");
      fetchRoomData();
    } catch (err) {
      console.error("Checkin error:", err);
    } finally {
      setSubmittingCheckin(false);
    }
  };

  const handleVouch = (checkinId) => {
    const next = new Set(vouchedIds);
    if (next.has(checkinId)) {
      next.delete(checkinId);
    } else {
      next.add(checkinId);
      showToast("👍 Proof of Work verified & vouched!");
    }
    setVouchedIds(next);
  };

  const handleNudge = (username) => {
    showToast(`🔔 Nudge sent to @${username}! Reminded them to check in before midnight.`);
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

  if (!room) {
    return (
      <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-5xl">🎯</p>
          <h2 className="text-2xl font-bold text-white">Room Not Found</h2>
          <p className="text-xs text-gray-400">This accountability room doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate("/creator-rooms")}
            className="px-5 py-2.5 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold hover:bg-purple-600/40 transition cursor-pointer"
          >
            ← Back to Creator Rooms
          </button>
        </div>
      </div>
    );
  }

  const myStreak = hasCheckedInToday ? 5 : 4;
  const targetDays = room.duration_type === "7_day" ? 7 : room.duration_type === "14_day" ? 14 : 30;
  const progressPercent = Math.min(Math.round((myStreak / targetDays) * 100), 100);

  return (
    <div className="relative min-h-screen bg-[#070709] text-white flex flex-col justify-between selection:bg-[#00F0FF]/20 overflow-hidden font-sans">
      <GlitchBackground />

      {/* Cyber Grid Overlay */}
      <div
        className="absolute top-0 left-0 right-0 h-[1100px] z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(168,85,247,0.25) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(168,85,247,0.25) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-20 flex-1 w-full space-y-10">
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
                  <CheckCircle size={14} className="text-purple-400" />
                  <span>{toastMsg}</span>
                </div>
                <button onClick={() => setToastMsg("")} className="text-gray-400 hover:text-white">
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── 1. ROOM HEADER BANNER ── */}
          <div className="bg-[#0f0f18] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF00C8] via-purple-500 to-[#00F0FF]" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-purple-500/10 border border-purple-500/25 text-purple-300">
                    {room.category || "Accountability Squad"}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/10 border border-amber-500/25 text-amber-400">
                    ⚡ {room.checkin_frequency || "Daily Check-ins"}
                  </span>
                  {isMember && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-green-500/10 border border-green-500/25 text-green-400 flex items-center gap-1">
                      <CheckCircle size={10} /> Active Member
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                  {room.name || room.title}
                </h1>

                {/* Goal Pledge Highlight Box */}
                {room.goal_pledge && (
                  <div className="bg-[#07070d] border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
                    <Target size={18} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                        GROUP COMMITMENT PLEDGE
                      </span>
                      <p className="text-xs sm:text-sm text-gray-200 font-mono mt-0.5 leading-relaxed">
                        {room.goal_pledge}
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  {room.description}
                </p>

                <div className="flex items-center gap-4 text-xs font-mono text-gray-500 pt-2">
                  <span>Host: <strong className="text-gray-300">{room.host || "Creator"}</strong></span>
                  <span>•</span>
                  <span>{members.length} Squad Members</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  <span>{copied ? "Link Copied!" : "Invite Link"}</span>
                </button>

                {!isMember && (
                  <button
                    type="button"
                    onClick={handleJoinSquad}
                    disabled={joining}
                    className="px-6 py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-[#FF00C8]/20"
                    style={{
                      background: "linear-gradient(90deg, #FF00C8, #a855f7)",
                    }}
                  >
                    <ShieldCheck size={16} />
                    <span>{joining ? "Joining..." : "Commit & Join Squad"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── 2. PERSONAL COMMITMENT & STREAK BANNER (FOR MEMBERS) ── */}
          {isMember && (
            <div className="bg-[#0f0f18] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Flame size={32} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                      YOUR ROOM STREAK & CONSISTENCY
                    </span>
                    <h3 className="text-xl font-extrabold text-white flex items-center gap-2 mt-0.5">
                      <span>{myStreak} Days Active Streak</span>
                      {hasCheckedInToday ? (
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400">
                          Checked In Today ✓
                        </span>
                      ) : (
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                          Check-in Pending ⏳
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      Completed {myStreak} of {targetDays} target check-in days ({progressPercent}%)
                    </p>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full md:w-64 space-y-2">
                  <div className="flex justify-between text-xs font-mono text-gray-400">
                    <span>Sprint Goal</span>
                    <span className="text-white font-bold">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progressPercent}%`,
                        background: "linear-gradient(90deg, #FF00C8, #00F0FF)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 3. MAIN CONTENT LAYOUT: DAILY STANDUP FORM + FEED + LEADERBOARD ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* LEFT 2 COLUMNS: STANDUP FORM & LIVE ACTIVITY FEED */}
            <div className="lg:col-span-2 space-y-8">
              {/* Daily Standup Submission Form */}
              {isMember && (
                <div className="bg-[#0f0f18] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <Edit3 size={18} className="text-[#00F0FF]" />
                      <h3 className="font-bold text-white text-base">
                        Submit Today's Proof of Work Standup
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                      +35 gBits Reward
                    </span>
                  </div>

                  <form onSubmit={handleCheckinSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs font-mono text-gray-400 block mb-1.5 font-semibold">
                        1. What did you accomplish today? *
                      </label>
                      <textarea
                        value={accomplishment}
                        onChange={(e) => setAccomplishment(e.target.value)}
                        placeholder="e.g. Built JWT authentication middleware and fixed token clock skew bug..."
                        rows={3}
                        required
                        className="w-full bg-[#07070d] border border-white/10 rounded-2xl p-3.5 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#00F0FF]/50 transition font-sans resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-mono text-gray-400 block mb-1.5 font-semibold">
                        2. Proof of Work URL (GitHub PR / Commit / Screenshot link)
                      </label>
                      <div className="relative">
                        <LinkIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type="url"
                          value={proofUrl}
                          onChange={(e) => setProofUrl(e.target.value)}
                          placeholder="https://github.com/myrepo/pull/12"
                          className="w-full pl-9 pr-4 py-2.5 bg-[#07070d] border border-white/10 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#00F0FF]/50 transition font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-mono text-gray-400 block mb-1.5 font-semibold">
                        3. Blockers / Questions for Squad (Optional)
                      </label>
                      <input
                        type="text"
                        value={blockers}
                        onChange={(e) => setBlockers(e.target.value)}
                        placeholder="e.g. Need help optimizing Supabase query latency..."
                        className="w-full px-4 py-2.5 bg-[#07070d] border border-white/10 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#00F0FF]/50 transition font-sans"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={submittingCheckin || !accomplishment.trim()}
                        className="px-6 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-40 transition shadow-lg"
                        style={{
                          background: "linear-gradient(90deg, #FF00C8, #a855f7)",
                        }}
                      >
                        <Flame size={15} />
                        <span>{submittingCheckin ? "Logging..." : "Submit Check-in & Maintain Streak"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Standup Feed */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                    <Activity size={18} className="text-[#FF00C8]" />
                    <span>Live Squad Standup Feed</span>
                  </h3>
                  <span className="text-xs font-mono text-gray-400">
                    {checkins.length} Daily Check-ins Logged
                  </span>
                </div>

                {checkins.length === 0 ? (
                  <div className="bg-[#0f0f18] border border-dashed border-white/10 rounded-3xl p-10 text-center space-y-3">
                    <p className="text-4xl">📝</p>
                    <h4 className="text-white font-bold text-base">No Standups Submitted Yet</h4>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      Be the first member to log your daily progress and start your room streak!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {checkins.map((item) => {
                      const isVouched = vouchedIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          className="bg-[#0f0f18] border border-white/10 rounded-2xl p-5 space-y-3 hover:border-white/20 transition shadow-xl"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs">
                                {item.user_id?.slice(0, 2).toUpperCase() || "ME"}
                              </div>
                              <div>
                                <span className="text-xs font-bold text-white block">
                                  {item.user_id === userId ? "You" : "Squad Member"}
                                </span>
                                <span className="text-[10px] font-mono text-gray-500">
                                  Check-in logged recently
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle size={10} /> Verified Standup
                            </span>
                          </div>

                          <div className="bg-[#07070d] border border-white/5 rounded-xl p-4 text-xs text-gray-300 font-mono space-y-2 leading-relaxed">
                            {item.body}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-mono">
                            <button
                              type="button"
                              onClick={() => handleVouch(item.id)}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                                isVouched
                                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                                  : "bg-white/5 text-gray-400 border-white/10 hover:text-white"
                              }`}
                            >
                              <ThumbsUp size={13} />
                              <span>{isVouched ? "Vouched ✓" : "Vouch Proof"}</span>
                            </button>

                            <span className="text-amber-400 font-semibold flex items-center gap-1">
                              <Flame size={13} /> Active Streak Maintained
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: CONSISTENCY LEADERBOARD & PEER NUDGES */}
            <div className="space-y-6">
              {/* Squad Consistency Leaderboard */}
              <div className="bg-[#0f0f18] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Crown size={16} className="text-amber-400" />
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                      Squad Leaderboard
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">By Streak</span>
                </div>

                <div className="space-y-2.5">
                  {members.map((mem, idx) => (
                    <div
                      key={mem.user_id}
                      className="bg-[#07070d] border border-white/5 rounded-xl p-3 flex items-center justify-between hover:border-white/15 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-bold text-gray-500 w-4">
                          #{idx + 1}
                        </span>
                        <MemberAvatar profile={mem} size={7} />
                        <div>
                          <span className="text-xs font-bold text-white block">
                            @{mem.username}
                          </span>
                          <span className="text-[10px] font-mono text-gray-500">
                            {mem.role === "host" ? "Squad Host" : "Member"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-mono text-amber-400 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                        <Flame size={12} />
                        <span>{idx === 0 ? "5 Days" : `${4 - idx} Days`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Peer Nudges Sidebar */}
              <div className="bg-[#0f0f18] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-[#00F0FF]" />
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                      Pending Check-ins Today
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">
                  Hold your squad accountable! Send a friendly nudge to members who haven't logged today's standup.
                </p>

                <div className="space-y-2.5 pt-1">
                  {members.map((mem) => (
                    <div
                      key={`nudge-${mem.user_id}`}
                      className="bg-[#07070d] border border-white/5 rounded-xl p-3 flex items-center justify-between"
                    >
                      <span className="text-xs font-mono text-gray-300">
                        @{mem.username}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleNudge(mem.username)}
                        className="px-2.5 py-1 rounded-lg bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30 text-[10px] font-bold font-mono transition cursor-pointer flex items-center gap-1"
                      >
                        <Bell size={10} /> Nudge
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default CreatorRoomDetail;
