import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PageHeading from "./PageHeading";
import { Flame, Users, ChevronDown, ChevronUp, Lock } from "lucide-react";

// ─── Emoji options for reactions ──────────────────────────────────────────────
const EMOJIS = ["🔥", "💡", "🤯", "👏", "⚡", "🎯", "😂", "🚀"];

// ─── helpers ──────────────────────────────────────────────────────────────────
const timeAgo = (iso) => {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// Fixed getWeekStart — does not mutate the original date object
const getWeekStart = () => {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now); // copy, don't mutate
  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ url, name }) => {
  const initials = (name || "?").slice(0, 2).toUpperCase();
  return url ? (
    <img
      src={url}
      alt={name}
      className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/10 shrink-0"
    />
  ) : (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ring-1 ring-white/10"
      style={{
        background:
          "linear-gradient(135deg,rgba(0,240,255,0.15),rgba(255,0,200,0.15))",
        color: "#00F0FF",
      }}
    >
      {initials}
    </div>
  );
};

// ─── Pitch Card ───────────────────────────────────────────────────────────────
const PitchCard = ({ submission, userId, myReaction, onReact, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reacting, setReacting] = useState(false);

  const name =
    submission.profiles?.username ||
    submission.profiles?.full_name ||
    "Anonymous";

  const pitch = submission.pitch_text || "";
  const isLong = pitch.length > 200;
  const displayPitch = expanded || !isLong ? pitch : pitch.slice(0, 200) + "…";

  // Aggregate reactions: { emoji: count }
  const reactionMap = {};
  (submission.reactions || []).forEach((r) => {
    reactionMap[r.emoji] = (reactionMap[r.emoji] || 0) + 1;
  });
  const totalReactions = Object.values(reactionMap).reduce((a, b) => a + b, 0);

  const handleEmojiClick = async (emoji) => {
    if (reacting) return;
    setShowEmojiPicker(false);
    setReacting(true);
    await onReact(submission.id, emoji);
    setReacting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="relative bg-[#0f0f13] border border-white/5 rounded-2xl p-5 overflow-hidden group hover:border-white/10 transition-all"
    >
      {/* Top glow on hover */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background:
            "linear-gradient(90deg,transparent,rgba(0,240,255,0.4),rgba(255,0,200,0.4),transparent)",
        }}
      />

      {/* Header: avatar + name + time */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar url={submission.profiles?.avatar_url} name={name} />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold truncate">{name}</p>
          <p className="text-gray-600 text-[10px]">
            {timeAgo(submission.completed_at)}
          </p>
        </div>
        {/* Score badge */}
        {submission.score > 0 && (
          <div
            className="text-xs font-black px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(0,240,255,0.08)",
              border: "1px solid rgba(0,240,255,0.2)",
              color: "#00F0FF",
            }}
          >
            {submission.score} pts
          </div>
        )}
      </div>

      {/* Pitch text */}
      <div
        className="mb-4 p-4 rounded-xl text-sm text-gray-300 leading-relaxed"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {displayPitch}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-cyan-400 mt-2 hover:text-cyan-300 transition cursor-pointer"
          >
            {expanded ? (
              <>
                <ChevronUp size={12} /> Show less
              </>
            ) : (
              <>
                <ChevronDown size={12} /> Read more
              </>
            )}
          </button>
        )}
      </div>

      {/* Reactions row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Existing reactions */}
        {Object.entries(reactionMap)
          .sort((a, b) => b[1] - a[1])
          .map(([emoji, count]) => (
            <motion.button
              key={emoji}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleEmojiClick(emoji)}
              disabled={reacting}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
              style={{
                background:
                  myReaction === emoji
                    ? "rgba(0,240,255,0.15)"
                    : "rgba(255,255,255,0.05)",
                border:
                  myReaction === emoji
                    ? "1px solid rgba(0,240,255,0.35)"
                    : "1px solid rgba(255,255,255,0.08)",
                color: myReaction === emoji ? "#00F0FF" : "#9ca3af",
              }}
            >
              <span>{emoji}</span>
              <span>{count}</span>
            </motion.button>
          ))}

        {/* Add reaction button */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={!!myReaction || reacting}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#6b7280",
            }}
          >
            {myReaction ? (
              <span className="text-[10px]">Reacted</span>
            ) : (
              <>
                <span>+</span>
                <span>React</span>
              </>
            )}
          </motion.button>

          <AnimatePresence>
            {showEmojiPicker && !myReaction && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 6 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 mb-2 flex gap-1.5 p-2 rounded-2xl z-20 flex-wrap w-48"
                style={{
                  background: "#0d0d14",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                }}
              >
                {EMOJIS.map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-xl p-1 rounded-lg hover:bg-white/8 transition cursor-pointer"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {totalReactions > 0 && (
          <span className="ml-auto text-[10px] text-gray-600">
            {totalReactions} reaction{totalReactions !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </motion.div>
  );
};

// ─── Locked Event Card ────────────────────────────────────────────────────────
const LockedEventCard = ({ event }) => (
  <div
    className="relative rounded-2xl p-5 overflow-hidden"
    style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.05)",
    }}
  >
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Lock size={16} className="text-gray-600" />
      </div>
      <div>
        <p className="text-gray-500 text-sm font-semibold">{event.title}</p>
        <p className="text-gray-700 text-xs">
          Complete this challenge to unlock community submissions
        </p>
      </div>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const ArenaVotingFeed = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [completedEventIds, setCompletedEventIds] = useState(new Set());
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [myReactions, setMyReactions] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: au } = await supabase.auth.getUser();
      const uid = au?.user?.id;
      setUserId(uid);

      // All live events
      const { data: events } = await supabase
        .from("arena_events")
        .select("id, title")
        .eq("is_live", true)
        .order("created_at", { ascending: false });
      setAllEvents(events || []);

      // Which events this user has completed
      if (uid) {
        const { data: completions } = await supabase
          .from("arena_completions")
          .select("event_id")
          .eq("user_id", uid);
        const ids = new Set((completions || []).map((c) => c.event_id));
        setCompletedEventIds(ids);

        // Auto-select first completed event
        const firstCompleted = (events || []).find((e) => ids.has(e.id));
        if (firstCompleted) setSelectedEventId(firstCompleted.id);
      }

      setLoading(false);
    };
    init();
  }, []);

  // ── Fetch submissions when event changes ───────────────────────────────────
  useEffect(() => {
    if (!selectedEventId || !completedEventIds.has(selectedEventId)) return;
    fetchSubmissions();
  }, [selectedEventId]);

  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);

    const weekStart = getWeekStart();

    // ── Step 1: fetch completions WITHOUT profile join ──────────────────────
    const { data: subs, error } = await supabase
      .from("arena_completions")
      .select("id, user_id, score, pitch_text, completed_at")
      .eq("event_id", selectedEventId)
      .not("pitch_text", "is", null)
      .gte("completed_at", weekStart)
      .order("completed_at", { ascending: false });

    if (error) {
      console.error("Submissions fetch error:", error);
      setLoadingSubmissions(false);
      return;
    }

    const subList = subs || [];

    // ── Step 2: manually fetch profiles for those user_ids ──────────────────
    const userIds = [...new Set(subList.map((s) => s.user_id))];
    let profileMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", userIds);
      (profiles || []).forEach((p) => {
        profileMap[p.id] = p;
      });
    }

    // ── Step 3: attach profiles to submissions ───────────────────────────────
    const enrichedSubs = subList.map((s) => ({
      ...s,
      profiles: profileMap[s.user_id] || null,
    }));

    // ── Step 4: fetch reactions for all submissions ──────────────────────────
    const subIds = enrichedSubs.map((s) => s.id);
    let reactionsData = [];
    if (subIds.length > 0) {
      const { data: reactions } = await supabase
        .from("arena_pitch_reactions")
        .select("submission_id, user_id, emoji")
        .in("submission_id", subIds);
      reactionsData = reactions || [];
    }

    // ── Step 5: attach reactions to submissions ──────────────────────────────
    const withReactions = enrichedSubs.map((s) => ({
      ...s,
      reactions: reactionsData.filter((r) => r.submission_id === s.id),
    }));

    setSubmissions(withReactions);

    // ── Step 6: build my reactions map ──────────────────────────────────────
    if (userId) {
      const mine = {};
      reactionsData
        .filter((r) => r.user_id === userId)
        .forEach((r) => {
          mine[r.submission_id] = r.emoji;
        });
      setMyReactions(mine);
    }

    setLoadingSubmissions(false);
  };

  // ── Handle reaction ────────────────────────────────────────────────────────
  const handleReact = async (submissionId, emoji) => {
    if (!userId) return;
    if (myReactions[submissionId]) return; // already reacted

    // Optimistic update
    setMyReactions((prev) => ({ ...prev, [submissionId]: emoji }));
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              reactions: [
                ...(s.reactions || []),
                { submission_id: submissionId, user_id: userId, emoji },
              ],
            }
          : s,
      ),
    );

    // Persist to DB
    await supabase
      .from("arena_pitch_reactions")
      .upsert(
        { submission_id: submissionId, user_id: userId, emoji },
        { onConflict: "submission_id,user_id" },
      );
  };

  const completedEvents = allEvents.filter((e) => completedEventIds.has(e.id));
  const lockedEvents = allEvents.filter((e) => !completedEventIds.has(e.id));
  const selectedEvent = allEvents.find((e) => e.id === selectedEventId);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-2 border-t-transparent border-cyan-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-36 pb-12 px-6 text-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,240,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,0.6) 1px,transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <PageHeading
            eyebrow="🗳️ Community Pitches"
            title="How Others Solved It"
            subtitle="You solved it your way. Now see how everyone else approached the same challenge. React with emojis, discover new methods, and level up your thinking."
            accent="cyan"
            size="xl"
          />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 w-full">
        {!userId ? (
          <div className="text-center py-24 border border-dashed border-white/10 rounded-3xl">
            <p className="text-4xl mb-4">🔐</p>
            <p className="text-gray-400 text-lg font-semibold mb-2">
              Sign in to access community pitches
            </p>
            <p className="text-gray-600 text-sm">
              You need an account to see and react to submissions.
            </p>
          </div>
        ) : completedEvents.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-white/10 rounded-3xl">
            <p className="text-5xl mb-5">🎯</p>
            <p className="text-white text-xl font-black mb-2">
              Complete a challenge first
            </p>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
              You haven't completed any Arena challenges yet. Solve one first —
              then you'll unlock the community submissions for that challenge.
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/arena-events")}
              className="px-6 py-3 rounded-xl font-bold text-sm text-black cursor-pointer"
              style={{ background: "linear-gradient(90deg,#00F0FF,#FF00C8)" }}
            >
              ⚡ Enter the Arena
            </motion.button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* ── Sidebar: event selector ── */}
            <aside className="lg:w-72 shrink-0">
              <div className="sticky top-28">
                {completedEvents.length > 0 && (
                  <div className="mb-6">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3 px-1">
                      ✅ Unlocked Challenges
                    </p>
                    <div className="space-y-2">
                      {completedEvents.map((event) => {
                        const isSelected = selectedEventId === event.id;
                        return (
                          <motion.button
                            key={event.id}
                            whileHover={{ x: 2 }}
                            onClick={() => setSelectedEventId(event.id)}
                            className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer border"
                            style={
                              isSelected
                                ? {
                                    background: "rgba(0,240,255,0.1)",
                                    borderColor: "rgba(0,240,255,0.3)",
                                    color: "#00F0FF",
                                  }
                                : {
                                    background: "rgba(255,255,255,0.02)",
                                    borderColor: "rgba(255,255,255,0.06)",
                                    color: "#9ca3af",
                                  }
                            }
                          >
                            {event.title}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {lockedEvents.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-3 px-1">
                      🔒 Locked
                    </p>
                    <div className="space-y-2">
                      {lockedEvents.map((event) => (
                        <LockedEventCard key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* ── Main feed ── */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-black text-white">
                    {selectedEvent?.title || "Select a challenge"}
                  </h2>
                  <p className="text-gray-600 text-xs mt-0.5">
                    This week's pitches · {submissions.length} submission
                    {submissions.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Users size={13} />
                  <span>{submissions.length} pitchers</span>
                  <Flame size={13} className="text-orange-400 ml-2" />
                  <span>
                    {submissions.reduce(
                      (acc, s) => acc + (s.reactions?.length || 0),
                      0,
                    )}{" "}
                    reactions
                  </span>
                </div>
              </div>

              {loadingSubmissions ? (
                <div className="flex justify-center py-20">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear",
                    }}
                    className="w-8 h-8 border-2 border-t-transparent border-cyan-500 rounded-full"
                  />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/8 rounded-3xl">
                  <p className="text-4xl mb-4">🫙</p>
                  <p className="text-gray-400 text-base font-semibold mb-2">
                    No pitches this week yet
                  </p>
                  <p className="text-gray-600 text-sm">
                    You're the first one here. Others are still solving it!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((sub, i) => (
                    <PitchCard
                      key={sub.id}
                      submission={sub}
                      userId={userId}
                      myReaction={myReactions[sub.id]}
                      onReact={handleReact}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default ArenaVotingFeed;
