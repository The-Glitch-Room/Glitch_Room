import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, X, ThumbsUp, ThumbsDown } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useAuth } from "./AuthContext";
import {
  awardDailyFactBonus,
  hasEarnedDailyFactToday,
} from "../utils/pointsHelper";

// ── Category styling (used inside the popup, not the button itself) ─────────
const CATEGORY_STYLE = {
  tech: { color: "#00F0FF", emoji: "💻", label: "Tech" },
  marketing: { color: "#FF00C8", emoji: "📣", label: "Marketing" },
  finance: { color: "#22c55e", emoji: "💰", label: "Finance" },
  psychology: { color: "#a855f7", emoji: "🧠", label: "Psychology" },
  design: { color: "#f59e0b", emoji: "🎨", label: "Design" },
  productivity: { color: "#38bdf8", emoji: "⚡", label: "Productivity" },
  science: { color: "#3b82f6", emoji: "🔬", label: "Science" },
  business: { color: "#ec4899", emoji: "🏢", label: "Business" },
};

const LAST_SEEN_KEY = "gr_last_seen_fact_date";
const TOOLTIP_SHOWN_KEY = "gr_fact_tooltip_shown_session";

// ── Helpers ───────────────────────────────────────────────────────────────────
const getDayOfYear = (date) => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / 86400000);
};

const getTodayStr = () => new Date().toISOString().split("T")[0];

// ── Main Component ────────────────────────────────────────────────────────────
const DailyFactBubble = () => {
  const { user, openAuth } = useAuth();

  const [open, setOpen] = useState(false);
  const [fact, setFact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasNew, setHasNew] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [userReaction, setUserReaction] = useState(null); // "like" | "dislike" | null
  const [reacting, setReacting] = useState(false);
  const [bonusEarned, setBonusEarned] = useState(false);
  const [claimedToday, setClaimedToday] = useState(false);

  // ── Fetch today's fact (deterministic pick) ──
  const fetchTodayFact = async () => {
    setLoading(true);
    const { data: allFacts, error } = await supabase
      .from("daily_facts")
      .select("id, fact_text, category, created_at")
      .order("created_at", { ascending: true });

    if (error || !allFacts || allFacts.length === 0) {
      setLoading(false);
      return;
    }

    const dayIndex = getDayOfYear(new Date()) % allFacts.length;
    const todayFact = allFacts[dayIndex];
    setFact(todayFact);

    await fetchReactionData(todayFact.id);

    // Check if user has already seen today's fact
    const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
    setHasNew(lastSeen !== getTodayStr());

    setLoading(false);
  };

  const fetchReactionData = async (factId) => {
    const [{ count: likes }, { count: dislikes }] = await Promise.all([
      supabase
        .from("daily_fact_reactions")
        .select("*", { count: "exact", head: true })
        .eq("fact_id", factId)
        .eq("reaction", "like"),
      supabase
        .from("daily_fact_reactions")
        .select("*", { count: "exact", head: true })
        .eq("fact_id", factId)
        .eq("reaction", "dislike"),
    ]);

    setLikeCount(likes || 0);
    setDislikeCount(dislikes || 0);

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (uid) {
      const { data: existing } = await supabase
        .from("daily_fact_reactions")
        .select("reaction")
        .eq("fact_id", factId)
        .eq("user_id", uid)
        .maybeSingle();
      setUserReaction(existing?.reaction || null);

      const alreadyClaimed = await hasEarnedDailyFactToday(uid);
      setClaimedToday(alreadyClaimed);
    } else {
      setUserReaction(null);
      setClaimedToday(false);
    }
  };

  useEffect(() => {
    fetchTodayFact();
  }, []);

  // ── First-visit tooltip (once per browser session) ──
  useEffect(() => {
    if (loading || !fact) return;
    if (sessionStorage.getItem(TOOLTIP_SHOWN_KEY)) return;

    const showTimer = setTimeout(() => {
      setShowTooltip(true);
      sessionStorage.setItem(TOOLTIP_SHOWN_KEY, "true");
    }, 1400);

    const hideTimer = setTimeout(() => setShowTooltip(false), 6500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [loading, fact]);

  const handleOpen = () => {
    setOpen(true);
    setShowTooltip(false);
    localStorage.setItem(LAST_SEEN_KEY, getTodayStr());
    setHasNew(false);
  };

  const handleReact = async (type) => {
    if (!user) {
      openAuth();
      return;
    }
    if (!fact || reacting) return;
    setReacting(true);

    const uid = user.id;
    const alreadyThisReaction = userReaction === type;

    try {
      if (alreadyThisReaction) {
        // Toggle off — remove reaction
        await supabase
          .from("daily_fact_reactions")
          .delete()
          .eq("fact_id", fact.id)
          .eq("user_id", uid);
        setUserReaction(null);
        if (type === "like") setLikeCount((c) => Math.max(0, c - 1));
        else setDislikeCount((c) => Math.max(0, c - 1));
      } else {
        await supabase
          .from("daily_fact_reactions")
          .upsert(
            { fact_id: fact.id, user_id: uid, reaction: type },
            { onConflict: "fact_id,user_id" },
          );

        // If user is clicking "like", attempt atomic 1-per-day Daily Fact bonus payout
        if (type === "like") {
          const res = await awardDailyFactBonus(uid);
          if (res.awarded) {
            setBonusEarned(true);
            setClaimedToday(true);
          } else if (res.reason === "already_claimed_today") {
            setClaimedToday(true);
          }
        }

        // Adjust counts locally
        if (userReaction === "like" && type === "dislike") {
          setLikeCount((c) => Math.max(0, c - 1));
          setDislikeCount((c) => c + 1);
        } else if (userReaction === "dislike" && type === "like") {
          setDislikeCount((c) => Math.max(0, c - 1));
          setLikeCount((c) => c + 1);
        } else if (type === "like") {
          setLikeCount((c) => c + 1);
        } else {
          setDislikeCount((c) => c + 1);
        }
        setUserReaction(type);
      }
    } catch (err) {
      console.error("Reaction error:", err);
    } finally {
      setReacting(false);
    }
  };

  if (loading || !fact) return null;

  const cat = CATEGORY_STYLE[fact.category] || CATEGORY_STYLE.tech;
  const totalVotes = likeCount + dislikeCount;
  const likePct =
    totalVotes > 0 ? Math.round((likeCount / totalVotes) * 100) : 0;

  return (
    <>
      {/* Floating button + tooltip cluster */}
      <div className="fixed z-40 bottom-24 md:bottom-6 right-5 md:right-6 flex items-center gap-3">
        {/* First-visit tooltip */}
        <AnimatePresence>
          {showTooltip && !open && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.9 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={handleOpen}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
              style={{
                background: "#0d0d14",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
              }}
            >
              ✨ New: Daily Fact — tap to see today's!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            boxShadow: [
              "0 0 12px rgba(255,255,255,0.4), 0 4px 15px rgba(0,0,0,0.5)",
              "0 0 22px rgba(0,240,255,0.6), 0 4px 15px rgba(0,0,0,0.5)",
              "0 0 12px rgba(255,255,255,0.4), 0 4px 15px rgba(0,0,0,0.5)",
            ],
          }}
          transition={{
            boxShadow: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 0.3 },
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.94 }}
          onClick={handleOpen}
          className="relative w-11 h-11 rounded-full flex items-center justify-center cursor-pointer bg-white shadow-lg"
          aria-label="Daily fact"
        >
          <Lightbulb size={18} className="text-black" strokeWidth={2.4} />

          {/* "New" pulse badge */}
          {hasNew && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: "#FFD700" }}
              />
              <span
                className="relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-[#0a0a12]"
                style={{ background: "#FFD700" }}
              />
            </span>
          )}
        </motion.button>
      </div>

      {/* Popup */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop (mobile-friendly tap-away) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 md:bg-transparent"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed z-50 bottom-24 md:bottom-24 right-4 left-4 md:left-auto md:right-6 md:w-[340px] rounded-2xl overflow-hidden"
              style={{
                background: "#0d0d14",
                border: `1px solid ${cat.color}30`,
                boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 30px ${cat.color}10`,
              }}
            >
              {/* Top accent line */}
              <div
                className="h-[2px] w-full"
                style={{
                  background: `linear-gradient(90deg, transparent, ${cat.color}, transparent)`,
                }}
              />

              <div className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                    style={{
                      color: cat.color,
                      background: `${cat.color}15`,
                      border: `1px solid ${cat.color}30`,
                    }}
                  >
                    {cat.emoji} {cat.label}
                  </span>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-gray-500 hover:text-white transition cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Fact text */}
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">
                  Fact of the Day
                </p>
                <p className="text-gray-200 text-sm leading-relaxed mb-5">
                  {fact.fact_text}
                </p>

                {/* Reaction bar */}
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => handleReact("like")}
                    disabled={reacting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-60"
                    style={
                      userReaction === "like"
                        ? {
                            background: "rgba(34,197,94,0.15)",
                            border: "1px solid rgba(34,197,94,0.4)",
                            color: "#22c55e",
                          }
                        : {
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "#9ca3af",
                          }
                    }
                  >
                    <ThumbsUp
                      size={14}
                      fill={userReaction === "like" ? "#22c55e" : "none"}
                    />
                    {likeCount}
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => handleReact("dislike")}
                    disabled={reacting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-60"
                    style={
                      userReaction === "dislike"
                        ? {
                            background: "rgba(239,68,68,0.15)",
                            border: "1px solid rgba(239,68,68,0.4)",
                            color: "#ef4444",
                          }
                        : {
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "#9ca3af",
                          }
                    }
                  >
                    <ThumbsDown
                      size={14}
                      fill={userReaction === "dislike" ? "#ef4444" : "none"}
                    />
                    {dislikeCount}
                  </motion.button>
                </div>

                {/* Bonus earned confirmation */}
                <AnimatePresence>
                  {bonusEarned && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center mt-3 p-2 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/30 relative overflow-hidden"
                    >
                      <motion.span
                        initial={{ y: 0, opacity: 1 }}
                        animate={{ y: -25, opacity: [1, 1, 0] }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="absolute left-1/2 -translate-x-1/2 font-mono font-black text-sm text-[#FFD700] pointer-events-none drop-shadow-[0_0_8px_#FFD700]"
                      >
                        +10 gBits!
                      </motion.span>
                      <p className="text-xs font-bold text-[#FFD700] flex items-center justify-center gap-1.5">
                        ⚡ +10 gBits Earned for Today!
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Aggregate / Claimed line */}
                {claimedToday && !bonusEarned && (
                  <p className="text-center text-[11px] font-mono text-gray-400 mt-3 bg-white/5 py-1.5 px-3 rounded-lg border border-white/10">
                    ⚡ Today's +10 gBits Bonus Claimed (Resets at Midnight)
                  </p>
                )}

                {totalVotes > 0 && !bonusEarned && !claimedToday && (
                  <p className="text-center text-[10px] text-gray-600 mt-3">
                    {likePct}% of {totalVotes} found this useful
                  </p>
                )}

                {!user && (
                  <p className="text-center text-[10px] text-gray-600 mt-3">
                    <button
                      onClick={openAuth}
                      className="text-[#00F0FF] hover:underline cursor-pointer"
                    >
                      Sign in
                    </button>{" "}
                    to react to daily facts
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default DailyFactBubble;
