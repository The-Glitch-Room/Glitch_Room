import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import {
  MessageCircle,
  Mail,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Zap,
  Bug,
  CreditCard,
  User,
  Search,
  AlertCircle,
  Users,
  Terminal,
  Send,
  CheckCircle,
  ArrowRight,
  HelpCircle,
  Compass,
  Sword,
  Star,
} from "lucide-react";
import Navbar from "./Navbar";
import SharedSidebar from "./SharedSidebar";
import { useNavigate } from "react-router-dom";

// ── FAQ DATA ──────────────────────────────────────────────────────────────────
const faqs = [
  {
    category: "Account",
    icon: User,
    color: "#FF00C8",
    questions: [
      {
        q: "How do I reset my password?",
        a: "Click 'Forgot Password' on the login screen. A reset link will be sent to your registered email within a few minutes. Check your spam folder if you don't see it.",
      },
      {
        q: "Can I change my username?",
        a: "Yes! Go to Settings → Account and update your username. Make sure it's unique — you'll see an error if it's already taken.",
      },
      {
        q: "How do I update my profile picture?",
        a: "Go to Your Profile and click the edit icon on your avatar. You can paste an image URL or upload a photo directly from your device.",
      },
      {
        q: "How do I delete my account?",
        a: "Go to Settings → Danger Zone → Delete Account. Type DELETE to confirm. This is permanent and removes all your data, points, and badges.",
      },
    ],
  },
  {
    category: "Points & gBits",
    icon: Zap,
    color: "#00F0FF",
    questions: [
      {
        q: "How do I earn points?",
        a: "Earn gBits by completing Glitch Challenges, Debug Mode, AI Challenges, Creative Sparks, and Arena events. Each challenge awards points based on difficulty.",
      },
      {
        q: "What does leveling up do?",
        a: "Every 100 gBits = 1 level. Higher levels boost your leaderboard rank and unlock exclusive badges. Your level is shown on your public profile.",
      },
      {
        q: "Can I lose points?",
        a: "Yes — using the 'Reveal Solution' hint costs 5 points per challenge. Otherwise, points are never automatically deducted.",
      },
      {
        q: "How do badges work?",
        a: "Badges are earned automatically when you hit specific milestones — like solving 10 challenges, maintaining a streak, or completing an Arena event. Check Points & Achievements to see all available badges.",
      },
    ],
  },
  {
    category: "Challenges",
    icon: Bug,
    color: "#a855f7",
    questions: [
      {
        q: "What types of challenges are there?",
        a: "Four types: Glitch Challenges (spot & fix bugs), AI Challenges (debug ML pipelines), Debug Mode (fix broken code), and Creative Sparks (open-ended design problems).",
      },
      {
        q: "Can I re-submit a challenge?",
        a: "Yes! You can re-submit any challenge as many times as you want. Points are only awarded on your first successful submission.",
      },
      {
        q: "What is the Game Arena?",
        a: "The Arena is a 3-stage live event: Stage 1 — Find the Glitch, Stage 2 — Twist Card (random constraint), Stage 3 — Pitch Wild. Completing all 3 stages earns you Arena gBits and leaderboard ranking.",
      },
      {
        q: "What if I find a wrong answer in a challenge?",
        a: "Use the email support below to report it with the challenge ID. Our team reviews reports within 48 hours.",
      },
    ],
  },
  {
    category: "Creator Rooms",
    icon: Users,
    color: "#f59e0b",
    questions: [
      {
        q: "What are Creator Rooms?",
        a: "Creator Rooms are mini accountability communities. You join a room, set a weekly goal, and check in every week to track your progress with a small group.",
      },
      {
        q: "How do I create a room?",
        a: "Go to Creator Rooms and click '+ Create a Room'. Give it a name and description. You'll automatically be the host and first member.",
      },
      {
        q: "How do weekly check-ins work?",
        a: "Each week you visit your room and submit a check-in: mark whether you completed your goal and optionally share what you worked on. Check-ins reset every Monday.",
      },
      {
        q: "Can I join multiple rooms?",
        a: "Yes, you can join as many rooms as you like. Your activity feed in each room shows what all members have been solving.",
      },
    ],
  },
  {
    category: "Billing",
    icon: CreditCard,
    color: "#22c55e",
    questions: [
      {
        q: "Is Glitch Room free?",
        a: "The entire platform is completely free right now — all challenges, Arena events, Creator Rooms, badges, and leaderboards. No credit card required.",
      },
      {
        q: "Will there be paid plans in the future?",
        a: "Potentially optional Pro features for power users, but the core experience will always remain free. You'll never be charged without explicit consent.",
      },
    ],
  },
];

// ── QUICK LINKS ───────────────────────────────────────────────────────────────
const quickLinks = [
  {
    label: "Explore Challenges",
    icon: Compass,
    path: "/explore",
    color: "#00F0FF",
  },
  { label: "Game Arena", icon: Sword, path: "/arena-events", color: "#FF00C8" },
  {
    label: "Creator Rooms",
    icon: Users,
    path: "/creator-rooms",
    color: "#a855f7",
  },
  {
    label: "Terminal Wall",
    icon: Terminal,
    path: "/terminal-wall",
    color: "#f59e0b",
  },
  { label: "Your Profile", icon: User, path: "/profile", color: "#FF00C8" },
];

// ── ACCORDION ITEM ────────────────────────────────────────────────────────────
const AccordionItem = ({ question, answer, isOpen, onToggle }) => (
  <div className="border-b border-white/5 last:border-0">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-white/[0.02] transition-all cursor-pointer"
    >
      <span
        className={`text-sm font-medium leading-snug pr-4 ${isOpen ? "text-white" : "text-gray-300"}`}
      >
        {question}
      </span>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="shrink-0"
      >
        <ChevronDown
          size={15}
          className={isOpen ? "text-[#FF00C8]" : "text-gray-600"}
        />
      </motion.div>
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ overflow: "hidden" }}
        >
          <p className="px-4 pb-4 text-sm text-gray-400 leading-relaxed">
            {answer}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// ── CONTACT FORM ──────────────────────────────────────────────────────────────
const ContactForm = ({ userEmail }) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) return;
    setLoading(true);
    // Open the user's mail client with pre-filled content
    const mailtoLink = `mailto:support@glitchroom.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`From: ${userEmail || "User"}\n\n${message}`)}`;
    window.location.href = mailtoLink;
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
          <CheckCircle size={24} className="text-green-400" />
        </div>
        <p className="text-white font-bold mb-1">Message sent!</p>
        <p className="text-gray-500 text-xs">
          We'll get back to you within 24 hours.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 text-xs text-[#FF00C8] hover:underline cursor-pointer"
        >
          Send another message
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1.5">
          Subject
        </label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Issue with my points, Challenge not loading..."
          className="w-full bg-[#0a0a14] border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-[#FF00C8]/40 transition"
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1.5">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your issue or question in detail..."
          rows={4}
          className="w-full bg-[#0a0a14] border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-[#FF00C8]/40 transition resize-none"
        />
      </div>
      {userEmail && (
        <p className="text-xs text-gray-600">
          Reply will be sent to{" "}
          <span className="text-gray-400">{userEmail}</span>
        </p>
      )}
      <motion.button
        whileHover={subject && message ? { scale: 1.02 } : {}}
        whileTap={subject && message ? { scale: 0.98 } : {}}
        onClick={handleSubmit}
        disabled={!subject.trim() || !message.trim() || loading}
        className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition"
        style={{ background: "linear-gradient(90deg,#FF00C8,#a855f7)" }}
      >
        <Send size={13} />
        {loading ? "Opening mail client..." : "Send Message"}
      </motion.button>
    </div>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
const HelpPage = () => {
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState(null);
  const [gBits, setGBits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openItem, setOpenItem] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const { data: au } = await supabase.auth.getUser();
      setAuthUser(au?.user);
      const userId = au?.user?.id;
      if (userId) {
        const { data: pts } = await supabase
          .from("user_points")
          .select("points")
          .eq("user_id", userId)
          .single();
        if (pts) setGBits(pts.points);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const level = Math.floor(gBits / 100);

  const filteredFaqs = faqs
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (q) =>
          (activeCategory === "all" || activeCategory === cat.category) &&
          (search === "" ||
            q.q.toLowerCase().includes(search.toLowerCase()) ||
            q.a.toLowerCase().includes(search.toLowerCase())),
      ),
    }))
    .filter((cat) => cat.questions.length > 0);

  const totalFAQs = faqs.reduce((acc, cat) => acc + cat.questions.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#070709]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-2 border-t-transparent border-[#FF00C8] rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white">
      <Navbar />
      <div className="flex pt-[18vh]">
        <SharedSidebar user={authUser} xp={gBits} level={level} />

        <main className="flex-1 min-w-0 p-6 lg:p-8 overflow-y-auto pb-24 md:pb-0">
          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-black text-white mb-1">
              Help & Support
            </h1>
            <p className="text-gray-500 text-sm">
              {totalFAQs} answers ready — or contact us directly.
            </p>
          </motion.div>

          {/* ── Contact Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Email support */}
            <motion.a
              href="mailto:support@glitchroom.com"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              whileHover={{ y: -3 }}
              className="relative overflow-hidden bg-[#0f0f13] rounded-2xl p-5 border border-white/5 group no-underline cursor-pointer"
            >
              <div
                className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-15 transition-opacity duration-500"
                style={{
                  background: "#FF00C8",
                  transform: "translate(30%,-30%)",
                }}
              />
              <div
                className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background:
                    "linear-gradient(90deg,transparent,#FF00C8,transparent)",
                }}
              />
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{
                  background: "#FF00C818",
                  border: "1px solid #FF00C830",
                }}
              >
                <Mail size={16} style={{ color: "#FF00C8" }} />
              </div>
              <h3 className="font-bold text-white text-sm mb-1">
                Email Support
              </h3>
              <p className="text-gray-500 text-xs mb-3">
                support@glitchroom.com
              </p>
              <span className="flex items-center gap-1 text-xs font-medium text-[#FF00C8]">
                Send Email <ChevronRight size={11} />
              </span>
            </motion.a>

            {/* Contact form */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -3 }}
              onClick={() => setShowContactForm(true)}
              className="relative overflow-hidden bg-[#0f0f13] rounded-2xl p-5 border border-white/5 group text-left cursor-pointer"
            >
              <div
                className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-15 transition-opacity duration-500"
                style={{
                  background: "#00F0FF",
                  transform: "translate(30%,-30%)",
                }}
              />
              <div
                className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background:
                    "linear-gradient(90deg,transparent,#00F0FF,transparent)",
                }}
              />
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{
                  background: "#00F0FF18",
                  border: "1px solid #00F0FF30",
                }}
              >
                <MessageCircle size={16} style={{ color: "#00F0FF" }} />
              </div>
              <h3 className="font-bold text-white text-sm mb-1">
                Contact Form
              </h3>
              <p className="text-gray-500 text-xs mb-3">
                Fill out a quick message
              </p>
              <span className="flex items-center gap-1 text-xs font-medium text-[#00F0FF]">
                Open Form <ChevronRight size={11} />
              </span>
            </motion.button>

            {/* Help Center */}
            <motion.a
              href="/helpCenter"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              whileHover={{ y: -3 }}
              className="relative overflow-hidden bg-[#0f0f13] rounded-2xl p-5 border border-white/5 group no-underline cursor-pointer"
            >
              <div
                className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-15 transition-opacity duration-500"
                style={{
                  background: "#a855f7",
                  transform: "translate(30%,-30%)",
                }}
              />
              <div
                className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background:
                    "linear-gradient(90deg,transparent,#a855f7,transparent)",
                }}
              />
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{
                  background: "#a855f718",
                  border: "1px solid #a855f730",
                }}
              >
                <BookOpen size={16} style={{ color: "#a855f7" }} />
              </div>
              <h3 className="font-bold text-white text-sm mb-1">Help Center</h3>
              <p className="text-gray-500 text-xs mb-3">
                Full guides & tutorials
              </p>
              <span className="flex items-center gap-1 text-xs font-medium text-[#a855f7]">
                Browse Articles <ChevronRight size={11} />
              </span>
            </motion.a>
          </div>

          {/* ── Contact Form Modal ── */}
          <AnimatePresence>
            {showContactForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{
                  background: "rgba(5,5,12,0.88)",
                  backdropFilter: "blur(10px)",
                }}
                onClick={(e) =>
                  e.target === e.currentTarget && setShowContactForm(false)
                }
              >
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="relative w-full max-w-md rounded-2xl p-7 overflow-hidden"
                  style={{
                    background: "#0f0f1a",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{
                      background:
                        "linear-gradient(90deg,transparent,#FF00C8,#00F0FF,transparent)",
                    }}
                  />
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-black text-white">
                        Send us a message
                      </h2>
                      <p className="text-gray-500 text-xs mt-0.5">
                        We reply within 24 hours
                      </p>
                    </div>
                    <button
                      onClick={() => setShowContactForm(false)}
                      className="text-gray-500 hover:text-white transition cursor-pointer w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                  <ContactForm userEmail={authUser?.email} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Quick Links ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0f0f13] rounded-2xl border border-white/5 p-5 mb-6"
          >
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <HelpCircle size={12} className="text-[#FF00C8]" /> Quick
              Navigation
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {quickLinks.map((link, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(link.path)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/5 hover:border-white/15 transition-all cursor-pointer group"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: `${link.color}15`,
                      border: `1px solid ${link.color}25`,
                    }}
                  >
                    <link.icon size={14} style={{ color: link.color }} />
                  </div>
                  <span className="text-[10px] text-gray-500 group-hover:text-gray-300 transition text-center leading-tight font-medium">
                    {link.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* ── FAQ Section ── */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              Frequently Asked Questions
            </h2>
            <span className="text-xs text-gray-600 bg-white/5 px-2.5 py-1 rounded-full">
              {totalFAQs} answers
            </span>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full bg-[#0f0f13] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FF00C8]/30 transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-5">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                activeCategory === "all"
                  ? "bg-[#FF00C8]/15 text-[#FF00C8] border-[#FF00C8]/25"
                  : "bg-white/5 text-gray-400 border-white/5 hover:text-white"
              }`}
            >
              All ({totalFAQs})
            </button>
            {faqs.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(cat.category)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border"
                style={
                  activeCategory === cat.category
                    ? {
                        background: `${cat.color}18`,
                        borderColor: `${cat.color}30`,
                        color: cat.color,
                      }
                    : {
                        background: "rgba(255,255,255,0.05)",
                        borderColor: "rgba(255,255,255,0.05)",
                        color: "#9ca3af",
                      }
                }
              >
                <cat.icon size={11} />
                {cat.category}
                <span className="ml-0.5 opacity-60">
                  ({cat.questions.length})
                </span>
              </button>
            ))}
          </div>

          {/* FAQ Accordions */}
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="bg-[#0f0f13] rounded-2xl p-10 border border-white/5 text-center">
                <AlertCircle size={28} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium mb-1">
                  No results found
                </p>
                <p className="text-gray-600 text-xs">
                  No questions match "{search}" — try different keywords or{" "}
                  <button
                    onClick={() => {
                      setSearch("");
                      setActiveCategory("all");
                    }}
                    className="text-[#FF00C8] hover:underline cursor-pointer"
                  >
                    clear filters
                  </button>
                </p>
              </div>
            ) : (
              filteredFaqs.map((cat) => (
                <motion.div
                  key={cat.category}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0f0f13] rounded-2xl border border-white/5 overflow-hidden"
                >
                  {/* Category header */}
                  <div
                    className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5"
                    style={{ background: `${cat.color}06` }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{
                        background: `${cat.color}18`,
                        border: `1px solid ${cat.color}30`,
                      }}
                    >
                      <cat.icon size={13} style={{ color: cat.color }} />
                    </div>
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                      {cat.category}
                    </span>
                    <span className="ml-auto text-[10px] text-gray-600">
                      {cat.questions.length} question
                      {cat.questions.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {cat.questions.map((item, qi) => {
                    const key = `${cat.category}-${qi}`;
                    return (
                      <AccordionItem
                        key={qi}
                        question={item.q}
                        answer={item.a}
                        isOpen={openItem === key}
                        onToggle={() =>
                          setOpenItem(openItem === key ? null : key)
                        }
                      />
                    );
                  })}
                </motion.div>
              ))
            )}
          </div>

          {/* ── Still need help ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 relative overflow-hidden bg-[#0f0f13] rounded-2xl border border-white/5 p-7 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF00C8]/5 via-transparent to-[#00F0FF]/5" />
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background:
                  "linear-gradient(90deg,transparent,#FF00C8,#00F0FF,transparent)",
              }}
            />
            <div className="relative">
              <div className="text-3xl mb-3">🤔</div>
              <p className="text-white font-bold text-lg mb-1">
                Didn't find your answer?
              </p>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                Our support team typically responds within 24 hours. Don't
                hesitate to reach out.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <motion.a
                  href="mailto:support@glitchroom.com"
                  whileHover={{
                    scale: 1.03,
                    boxShadow: "0 0 16px rgba(255,0,200,0.3)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#FF00C8] text-[#FF00C8] font-bold bg-transparent text-sm cursor-pointer transition"
                >
                  <Mail size={14} /> Email Support
                </motion.a>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowContactForm(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer"
                  style={{
                    background: "linear-gradient(90deg,#FF00C8,#a855f7)",
                  }}
                >
                  <Send size={14} /> Send a Message
                </motion.button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default HelpPage;
