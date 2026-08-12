import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import {
  Hash,
  AlignLeft,
  User,
  Lock,
  Globe,
  Plus,
  Trash2,
  CheckCircle,
  Copy,
  Building2,
  Zap,
  Users,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Star,
  Clock,
  Shield,
  Palette,
  Target,
  Award,
  X,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import PageHeading from "./PageHeading";

// ── Config ────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "AI", label: "AI & ML", icon: "🤖", color: "#FF00C8" },
  { value: "Web Development", label: "Web Dev", icon: "🌐", color: "#00F0FF" },
  {
    value: "Machine Learning",
    label: "Machine Learning",
    icon: "🧠",
    color: "#a855f7",
  },
  {
    value: "Cybersecurity",
    label: "Cybersecurity",
    icon: "🔐",
    color: "#f59e0b",
  },
  { value: "Programming", label: "Programming", icon: "💻", color: "#10b981" },
  {
    value: "Data Science",
    label: "Data Science",
    icon: "📊",
    color: "#3b82f6",
  },
  { value: "Design", label: "Design", icon: "🎨", color: "#ec4899" },
  { value: "Business", label: "Business", icon: "📈", color: "#f97316" },
];

const ORG_TYPES = [
  { value: "college", label: "College / University", icon: "🎓" },
  { value: "company", label: "Company / Startup", icon: "🏢" },
  { value: "hackathon", label: "Hackathon", icon: "⚡" },
  { value: "bootcamp", label: "Bootcamp / Course", icon: "📚" },
  { value: "community", label: "Community / Club", icon: "👥" },
  { value: "personal", label: "Personal / Solo", icon: "🙋" },
];

const ROOM_THEMES = [
  {
    value: "glitch",
    label: "Glitch Room",
    color: "#FF00C8",
    bg: "from-pink-900/30",
    border: "border-pink-500/30",
    desc: "Find the bug, fix the chaos",
  },
  {
    value: "arena",
    label: "Battle Arena",
    color: "#00F0FF",
    bg: "from-cyan-900/30",
    border: "border-cyan-500/30",
    desc: "3-stage competitive format",
  },
  {
    value: "sprint",
    label: "Code Sprint",
    color: "#a855f7",
    bg: "from-purple-900/30",
    border: "border-purple-500/30",
    desc: "Time-boxed coding challenge",
  },
  {
    value: "creative",
    label: "Creative Lab",
    color: "#f59e0b",
    bg: "from-amber-900/30",
    border: "border-amber-500/30",
    desc: "Design & innovation focus",
  },
  {
    value: "quiz",
    label: "Quiz Bowl",
    color: "#10b981",
    bg: "from-green-900/30",
    border: "border-green-500/30",
    desc: "MCQ + rapid-fire rounds",
  },
];

const STEPS = [
  { id: 1, label: "Organization", icon: Building2 },
  { id: 2, label: "Room Setup", icon: Sparkles },
  { id: 3, label: "Challenge", icon: Target },
  { id: 4, label: "Review", icon: CheckCircle },
];

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-[#08080f] border border-white/8 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#FF00C8]/50 focus:ring-1 focus:ring-[#FF00C8]/20 transition";

const generateRoomCode = () => {
  const uuid = uuidv4().split("-")[0].toUpperCase();
  return `GLITCH-${Math.floor(1000 + Math.random() * 9000)}-${uuid}`;
};

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
const DeleteRoomModal = ({ room, onClose, onDeleted }) => {
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm !== room.name) return;
    setDeleting(true);
    await supabase.from("room_checkins").delete().eq("room_id", room.id);
    await supabase.from("room_members").delete().eq("room_id", room.id);
    await supabase.from("room_questions").delete().eq("room_id", room.id);
    await supabase.from("rooms").delete().eq("id", room.id);
    setDeleting(false);
    onDeleted(room.id);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(12px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: "#0d0d14",
          border: "1px solid rgba(239,68,68,0.25)",
        }}
      >
        {/* Top red line */}
        <div
          className="h-[2px] w-full"
          style={{
            background:
              "linear-gradient(90deg,transparent,#ef4444,transparent)",
          }}
        />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition cursor-pointer z-10"
        >
          <X size={15} />
        </button>

        <div className="p-7">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
            >
              <Trash2 size={18} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Delete Room</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                This action cannot be undone
              </p>
            </div>
          </div>

          {/* Warning */}
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3 mb-5"
            style={{
              background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-300 leading-relaxed">
              Deleting{" "}
              <span className="font-bold text-white">"{room.name}"</span> will
              permanently remove all members, questions, and data. Everyone
              loses access instantly.
            </p>
          </div>

          {/* Type to confirm */}
          <p className="text-xs text-gray-500 mb-2">
            Type{" "}
            <span className="font-mono font-bold text-white">{room.name}</span>{" "}
            to confirm
          </p>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={`Type "${room.name}" here...`}
            className="w-full bg-[#08080f] border border-red-500/20 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-red-500/50 transition mb-4"
          />

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#9ca3af",
              }}
            >
              Cancel
            </button>
            <motion.button
              whileHover={confirm === room.name ? { scale: 1.02 } : {}}
              whileTap={confirm === room.name ? { scale: 0.97 } : {}}
              onClick={handleDelete}
              disabled={confirm !== room.name || deleting}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              style={{
                background:
                  confirm === room.name
                    ? "linear-gradient(90deg,#ef4444,#dc2626)"
                    : "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                boxShadow:
                  confirm === room.name
                    ? "0 0 18px rgba(239,68,68,0.3)"
                    : "none",
              }}
            >
              {deleting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.8,
                      ease: "linear",
                    }}
                    className="w-4 h-4 border-2 border-t-transparent border-white rounded-full"
                  />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={13} /> Delete Room
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── My Professional Rooms Section ─────────────────────────────────────────────
const MyProfessionalRooms = ({ userId, onDeleted }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomToDelete, setRoomToDelete] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from("rooms")
        .select("*, room_members(count)")
        .eq("created_by", userId)
        .eq("room_type", "professional")
        .order("created_at", { ascending: false });

      setRooms(
        (data || []).map((r) => ({
          ...r,
          member_count: r.room_members?.[0]?.count || 0,
        })),
      );
      setLoading(false);
    };
    fetch();
  }, [userId]);

  const handleDeleted = (id) => {
    setRooms((prev) => prev.filter((r) => r.id !== id));
    if (onDeleted) onDeleted();
  };

  if (loading) return null;
  if (rooms.length === 0) return null;

  return (
    <section className="max-w-5xl mx-auto px-6 pb-10 w-full">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-black text-white">
            My Professional Rooms
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Rooms you've hosted — only visible to you
          </p>
        </div>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full"
          style={{
            background: "rgba(255,0,200,0.1)",
            border: "1px solid rgba(255,0,200,0.25)",
            color: "#FF00C8",
          }}
        >
          {rooms.length} room{rooms.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => {
          const diffColor =
            room.difficulty === "easy"
              ? {
                  color: "text-green-400",
                  bg: "bg-green-500/10",
                  border: "border-green-500/20",
                }
              : room.difficulty === "hard"
                ? {
                    color: "text-red-400",
                    bg: "bg-red-500/10",
                    border: "border-red-500/20",
                  }
                : {
                    color: "text-yellow-400",
                    bg: "bg-yellow-500/10",
                    border: "border-yellow-500/20",
                  };

          return (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-[#0f0f1a] border border-white/6 hover:border-[#FF00C8]/25 rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,200,0.08)] overflow-hidden"
            >
              {/* Top sweep on hover */}
              <div className="absolute top-0 left-0 h-[2px] w-0 group-hover:w-full bg-gradient-to-r from-[#FF00C8] to-[#a855f7] transition-all duration-500 rounded-t-2xl" />

              {/* Professional badge + delete */}
              <div className="flex items-center justify-between">
                <span
                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(0,240,255,0.08)",
                    border: "1px solid rgba(0,240,255,0.2)",
                    color: "#00F0FF",
                  }}
                >
                  🏢 Professional
                </span>

                {/* DELETE BUTTON */}
                <button
                  onClick={() => setRoomToDelete(room)}
                  title="Delete this room"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Room name */}
              <h3 className="text-sm font-bold text-white group-hover:text-[#FF00C8] transition-colors leading-snug">
                {room.name}
              </h3>

              {/* Description */}
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                {room.description || "No description provided."}
              </p>

              {/* Meta tags */}
              <div className="flex flex-wrap gap-1.5">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${diffColor.color} ${diffColor.bg} ${diffColor.border}`}
                >
                  {room.difficulty}
                </span>
                <span className="text-[10px] text-gray-500 bg-white/4 px-2 py-0.5 rounded-full">
                  {room.category}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-gray-500">
                  <Users size={9} /> {room.member_count} members
                </span>
                <span className="flex items-center gap-1 text-[10px] text-gray-500">
                  {room.access === "private" ? (
                    <Lock size={9} />
                  ) : (
                    <Globe size={9} />
                  )}
                  {room.access}
                </span>
              </div>

              {/* Code if private */}
              {room.code && room.access === "private" && (
                <div
                  className="flex items-center justify-between bg-[#08080f] rounded-lg px-3 py-2"
                  style={{ border: "1px solid rgba(255,0,200,0.15)" }}
                >
                  <span className="text-[10px] text-gray-500">Access Code</span>
                  <code className="text-[10px] font-mono font-bold text-[#FF00C8] tracking-wider">
                    {room.code}
                  </code>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Delete modal */}
      <AnimatePresence>
        {roomToDelete && (
          <DeleteRoomModal
            room={roomToDelete}
            onClose={() => setRoomToDelete(null)}
            onDeleted={handleDeleted}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

// ── Step Indicator ────────────────────────────────────────────────────────────
const StepIndicator = ({ currentStep }) => (
  <div className="flex items-center justify-center gap-2 mb-10">
    {STEPS.map((step, i) => {
      const Icon = step.icon;
      const done = currentStep > step.id;
      const active = currentStep === step.id;
      return (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center gap-1.5">
            <motion.div
              animate={{
                scale: active ? 1.1 : 1,
                background: done
                  ? "linear-gradient(135deg,#FF00C8,#a855f7)"
                  : active
                    ? "rgba(255,0,200,0.15)"
                    : "rgba(255,255,255,0.04)",
              }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center border transition-all"
              style={{
                borderColor: done
                  ? "transparent"
                  : active
                    ? "rgba(255,0,200,0.5)"
                    : "rgba(255,255,255,0.08)",
                boxShadow: active ? "0 0 20px rgba(255,0,200,0.3)" : "none",
              }}
            >
              {done ? (
                <CheckCircle size={16} className="text-white" />
              ) : (
                <Icon
                  size={16}
                  style={{ color: active ? "#FF00C8" : "#4b5563" }}
                />
              )}
            </motion.div>
            <span
              className="text-[10px] font-bold uppercase tracking-wider hidden sm:block"
              style={{
                color: active ? "#FF00C8" : done ? "#9ca3af" : "#374151",
              }}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className="flex-1 max-w-[60px] h-px mb-5"
              style={{
                background:
                  currentStep > step.id
                    ? "linear-gradient(90deg,#FF00C8,#a855f7)"
                    : "rgba(255,255,255,0.06)",
              }}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ── Step 1: Organization Info ─────────────────────────────────────────────────
const Step1 = ({ data, setData }) => (
  <motion.div
    key="step1"
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -30 }}
    transition={{ duration: 0.3 }}
    className="space-y-6"
  >
    <div className="text-center mb-8">
      <span
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
        style={{
          background: "rgba(255,0,200,0.08)",
          border: "1px solid rgba(255,0,200,0.2)",
          color: "#FF00C8",
        }}
      >
        <Building2 size={11} /> Step 1 of 4
      </span>
      <h2 className="text-2xl font-black text-white mb-2">Who's hosting?</h2>
      <p className="text-gray-500 text-sm">
        Tell us about your organization so we can personalize your room.
      </p>
    </div>

    <div>
      <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-3">
        Organization Type
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ORG_TYPES.map((type) => (
          <motion.button
            key={type.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setData({ ...data, orgType: type.value })}
            className="flex items-center gap-3 p-3.5 rounded-xl text-left border transition-all cursor-pointer"
            style={{
              background:
                data.orgType === type.value
                  ? "rgba(255,0,200,0.1)"
                  : "rgba(255,255,255,0.03)",
              borderColor:
                data.orgType === type.value
                  ? "rgba(255,0,200,0.4)"
                  : "rgba(255,255,255,0.07)",
              boxShadow:
                data.orgType === type.value
                  ? "0 0 16px rgba(255,0,200,0.15)"
                  : "none",
            }}
          >
            <span className="text-xl">{type.icon}</span>
            <span
              className="text-sm font-semibold"
              style={{
                color: data.orgType === type.value ? "#FF00C8" : "#9ca3af",
              }}
            >
              {type.label}
            </span>
            {data.orgType === type.value && (
              <CheckCircle size={14} className="ml-auto text-pink-400" />
            )}
          </motion.button>
        ))}
      </div>
    </div>

    <div>
      <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">
        {data.orgType === "personal" ? "Your Name" : "Organization Name"} *
      </label>
      <div className="relative">
        <Building2
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600"
        />
        <input
          type="text"
          placeholder={
            data.orgType === "college"
              ? "e.g. MIT, IIT Bombay..."
              : data.orgType === "company"
                ? "e.g. Google, Acme Inc..."
                : "Your organization name"
          }
          value={data.orgName}
          onChange={(e) => setData({ ...data, orgName: e.target.value })}
          className={`${inputClass} pl-10`}
        />
      </div>
    </div>

    <div>
      <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">
        Host / Point of Contact *
      </label>
      <div className="relative">
        <User
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600"
        />
        <input
          type="text"
          placeholder="Your name or team lead"
          value={data.hostName}
          onChange={(e) => setData({ ...data, hostName: e.target.value })}
          className={`${inputClass} pl-10`}
        />
      </div>
    </div>

    <div>
      <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">
        Contact Email
      </label>
      <input
        type="email"
        placeholder="host@organization.com"
        value={data.contactEmail}
        onChange={(e) => setData({ ...data, contactEmail: e.target.value })}
        className={inputClass}
      />
    </div>
  </motion.div>
);

// ── Step 2: Room Setup ────────────────────────────────────────────────────────
const Step2 = ({ data, setData }) => (
  <motion.div
    key="step2"
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -30 }}
    transition={{ duration: 0.3 }}
    className="space-y-6"
  >
    <div className="text-center mb-8">
      <span
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
        style={{
          background: "rgba(168,85,247,0.08)",
          border: "1px solid rgba(168,85,247,0.2)",
          color: "#a855f7",
        }}
      >
        <Sparkles size={11} /> Step 2 of 4
      </span>
      <h2 className="text-2xl font-black text-white mb-2">Set up your room</h2>
      <p className="text-gray-500 text-sm">
        Name it, brand it, theme it. Make it yours.
      </p>
    </div>

    <div>
      <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">
        Room Name *
      </label>
      <div className="relative">
        <Hash
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600"
        />
        <input
          type="text"
          placeholder="e.g. MIT Hack Week 2025, AI Sprint Round 1..."
          value={data.roomName}
          onChange={(e) => setData({ ...data, roomName: e.target.value })}
          className={`${inputClass} pl-10`}
        />
      </div>
    </div>

    <div>
      <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">
        Room Description
      </label>
      <div className="relative">
        <AlignLeft
          size={14}
          className="absolute left-3.5 top-3.5 text-gray-600"
        />
        <textarea
          rows={3}
          placeholder="What's this room about? What will participants experience?"
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          className={`${inputClass} pl-10 resize-none`}
        />
      </div>
    </div>

    <div>
      <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-3">
        Room Theme
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ROOM_THEMES.map((theme) => (
          <motion.button
            key={theme.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setData({ ...data, theme: theme.value })}
            className={`flex items-center gap-3 p-4 rounded-xl text-left border transition-all cursor-pointer bg-gradient-to-r to-[#08080f] ${theme.bg}`}
            style={{
              borderColor:
                data.theme === theme.value
                  ? theme.color + "60"
                  : "rgba(255,255,255,0.07)",
              boxShadow:
                data.theme === theme.value
                  ? `0 0 20px ${theme.color}20`
                  : "none",
            }}
          >
            <div className="flex-1">
              <p className="font-bold text-sm text-white">{theme.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{theme.desc}</p>
            </div>
            <div
              className="w-3 h-3 rounded-full shrink-0 transition-all"
              style={{
                background:
                  data.theme === theme.value ? theme.color : "transparent",
                border: `2px solid ${theme.color}`,
              }}
            />
          </motion.button>
        ))}
      </div>
    </div>

    <div>
      <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-3">
        Access Control
      </label>
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            value: "public",
            icon: Globe,
            label: "Public",
            desc: "Anyone can join",
            color: "#10b981",
          },
          {
            value: "private",
            icon: Lock,
            label: "Private",
            desc: "Invite code required",
            color: "#FF00C8",
          },
        ].map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => setData({ ...data, access: opt.value })}
              className="flex flex-col items-start gap-2 p-4 rounded-xl border transition-all cursor-pointer"
              style={{
                background:
                  data.access === opt.value
                    ? `${opt.color}10`
                    : "rgba(255,255,255,0.03)",
                borderColor:
                  data.access === opt.value
                    ? `${opt.color}40`
                    : "rgba(255,255,255,0.07)",
              }}
            >
              <Icon
                size={16}
                style={{
                  color: data.access === opt.value ? opt.color : "#4b5563",
                }}
              />
              <div>
                <p
                  className="font-bold text-sm"
                  style={{
                    color: data.access === opt.value ? opt.color : "#e5e7eb",
                  }}
                >
                  {opt.label}
                </p>
                <p className="text-xs text-gray-600">{opt.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>

    <div>
      <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">
        Max Participants
      </label>
      <div className="flex gap-2">
        {[10, 25, 50, 100, 250, "Unlimited"].map((num) => (
          <button
            key={num}
            onClick={() => setData({ ...data, maxParticipants: num })}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer"
            style={{
              background:
                data.maxParticipants === num
                  ? "rgba(255,0,200,0.12)"
                  : "rgba(255,255,255,0.03)",
              borderColor:
                data.maxParticipants === num
                  ? "rgba(255,0,200,0.4)"
                  : "rgba(255,255,255,0.07)",
              color: data.maxParticipants === num ? "#FF00C8" : "#6b7280",
            }}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  </motion.div>
);

// ── Step 3: Challenge Config ──────────────────────────────────────────────────
const Step3 = ({ data, setData }) => {
  const [customQ, setCustomQ] = useState({
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correct: "",
  });

  const addQuestion = () => {
    if (!customQ.question.trim()) return;
    setData({
      ...data,
      customQuestions: [...(data.customQuestions || []), customQ],
    });
    setCustomQ({
      question: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correct: "",
    });
  };

  const removeQuestion = (i) => {
    setData({
      ...data,
      customQuestions: data.customQuestions.filter((_, idx) => idx !== i),
    });
  };

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <span
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
          style={{
            background: "rgba(0,240,255,0.08)",
            border: "1px solid rgba(0,240,255,0.2)",
            color: "#00F0FF",
          }}
        >
          <Target size={11} /> Step 3 of 4
        </span>
        <h2 className="text-2xl font-black text-white mb-2">
          Design the challenge
        </h2>
        <p className="text-gray-500 text-sm">
          Set the category, difficulty, and optionally add custom questions.
        </p>
      </div>

      <div>
        <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-3">
          Challenge Category *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setData({ ...data, category: cat.value })}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer"
              style={{
                background:
                  data.category === cat.value
                    ? `${cat.color}10`
                    : "rgba(255,255,255,0.03)",
                borderColor:
                  data.category === cat.value
                    ? `${cat.color}40`
                    : "rgba(255,255,255,0.07)",
              }}
            >
              <span className="text-lg">{cat.icon}</span>
              <span
                className="text-xs font-semibold"
                style={{
                  color: data.category === cat.value ? cat.color : "#9ca3af",
                }}
              >
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-3">
          Difficulty Level
        </label>
        <div className="flex gap-3">
          {[
            {
              value: "easy",
              label: "Easy",
              color: "#10b981",
              desc: "Beginner friendly",
            },
            {
              value: "medium",
              label: "Medium",
              color: "#f59e0b",
              desc: "Intermediate",
            },
            {
              value: "hard",
              label: "Hard",
              color: "#ef4444",
              desc: "Expert level",
            },
          ].map((d) => (
            <button
              key={d.value}
              onClick={() => setData({ ...data, difficulty: d.value })}
              className="flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border transition-all cursor-pointer"
              style={{
                background:
                  data.difficulty === d.value
                    ? `${d.color}10`
                    : "rgba(255,255,255,0.03)",
                borderColor:
                  data.difficulty === d.value
                    ? `${d.color}40`
                    : "rgba(255,255,255,0.07)",
              }}
            >
              <span
                className="text-sm font-bold"
                style={{
                  color: data.difficulty === d.value ? d.color : "#9ca3af",
                }}
              >
                {d.label}
              </span>
              <span className="text-[10px] text-gray-600">{d.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">
          Duration
        </label>
        <div className="flex gap-2">
          {["30 min", "1 hour", "2 hours", "3 hours", "1 day", "Custom"].map(
            (d) => (
              <button
                key={d}
                onClick={() => setData({ ...data, duration: d })}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer"
                style={{
                  background:
                    data.duration === d
                      ? "rgba(0,240,255,0.1)"
                      : "rgba(255,255,255,0.03)",
                  borderColor:
                    data.duration === d
                      ? "rgba(0,240,255,0.35)"
                      : "rgba(255,255,255,0.07)",
                  color: data.duration === d ? "#00F0FF" : "#6b7280",
                }}
              >
                {d}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Custom Questions */}
      <div className="border border-white/5 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-white/[0.02] border-b border-white/5">
          <div>
            <p className="text-sm font-bold text-white">Custom MCQ Questions</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Optional — add your own questions
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/5 text-gray-400">
            {(data.customQuestions || []).length} added
          </span>
        </div>
        <div className="p-5 space-y-4">
          {(data.customQuestions || []).length > 0 && (
            <div className="space-y-2 mb-4">
              {(data.customQuestions || []).map((q, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5"
                >
                  <span className="text-xs font-bold text-gray-600 shrink-0">
                    Q{i + 1}
                  </span>
                  <p className="text-sm text-gray-300 flex-1 truncate">
                    {q.question}
                  </p>
                  <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full shrink-0">
                    Ans: {q.correct}
                  </span>
                  <button
                    onClick={() => removeQuestion(i)}
                    className="text-gray-600 hover:text-red-400 transition cursor-pointer shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            type="text"
            placeholder="Type your question..."
            value={customQ.question}
            onChange={(e) =>
              setCustomQ({ ...customQ, question: e.target.value })
            }
            className={inputClass}
          />
          <div className="grid grid-cols-2 gap-2">
            {["optionA", "optionB", "optionC", "optionD"].map((opt, i) => (
              <input
                key={opt}
                type="text"
                placeholder={`Option ${["A", "B", "C", "D"][i]}`}
                value={customQ[opt]}
                onChange={(e) =>
                  setCustomQ({ ...customQ, [opt]: e.target.value })
                }
                className={inputClass}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2 flex-1">
              {["A", "B", "C", "D"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setCustomQ({ ...customQ, correct: opt })}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer"
                  style={{
                    background:
                      customQ.correct === opt
                        ? "rgba(34,197,94,0.15)"
                        : "rgba(255,255,255,0.03)",
                    borderColor:
                      customQ.correct === opt
                        ? "rgba(34,197,94,0.4)"
                        : "rgba(255,255,255,0.07)",
                    color: customQ.correct === opt ? "#22c55e" : "#6b7280",
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
            <button
              onClick={addQuestion}
              disabled={!customQ.question.trim()}
              className="px-4 py-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
              style={{
                background: "rgba(255,0,200,0.1)",
                borderColor: "rgba(255,0,200,0.3)",
                color: "#FF00C8",
              }}
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ── Step 4: Review ────────────────────────────────────────────────────────────
const Step4 = ({ data }) => {
  const selectedTheme =
    ROOM_THEMES.find((t) => t.value === data.theme) || ROOM_THEMES[0];
  const selectedCat = CATEGORIES.find((c) => c.value === data.category);
  const selectedOrg = ORG_TYPES.find((o) => o.value === data.orgType);

  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="text-center mb-8">
        <span
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
          style={{
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.2)",
            color: "#22c55e",
          }}
        >
          <CheckCircle size={11} /> Final Review
        </span>
        <h2 className="text-2xl font-black text-white mb-2">
          Everything looks good?
        </h2>
        <p className="text-gray-500 text-sm">
          Review your room before launching it.
        </p>
      </div>

      <div
        className={`relative rounded-2xl overflow-hidden border bg-gradient-to-br to-[#08080f] ${selectedTheme.bg} ${selectedTheme.border}`}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg,transparent,${selectedTheme.color},transparent)`,
          }}
        />
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-widest mb-1"
                style={{ color: selectedTheme.color }}
              >
                {selectedTheme.label}
              </p>
              <h3 className="text-xl font-black text-white">
                {data.roomName || "Untitled Room"}
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                {data.description || "No description"}
              </p>
            </div>
            <span className="text-2xl">{selectedOrg?.icon}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: data.orgName, icon: "🏢" },
              { label: data.hostName, icon: "👤" },
              { label: selectedCat?.label, icon: selectedCat?.icon },
              {
                label: data.difficulty,
                icon:
                  data.difficulty === "easy"
                    ? "🟢"
                    : data.difficulty === "medium"
                      ? "🟡"
                      : "🔴",
              },
              {
                label: data.access === "private" ? "Private 🔒" : "Public 🌐",
                icon: "",
              },
              { label: data.duration, icon: "⏱️" },
              { label: `${data.maxParticipants} participants`, icon: "👥" },
            ]
              .filter((i) => i.label)
              .map((item, i) => (
                <span
                  key={i}
                  className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 text-gray-400 border border-white/8"
                >
                  {item.icon} {item.label}
                </span>
              ))}
          </div>
          {(data.customQuestions || []).length > 0 && (
            <p className="text-xs text-gray-500 mt-3">
              + {data.customQuestions.length} custom questions added
            </p>
          )}
        </div>
      </div>

      <div className="bg-[#0f0f13] border border-white/5 rounded-2xl p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
          What happens after launch
        </p>
        <div className="space-y-3">
          {[
            {
              icon: Zap,
              text: "Your room goes live instantly",
              color: "#FF00C8",
            },
            {
              icon: data.access === "private" ? Lock : Globe,
              text:
                data.access === "private"
                  ? "You'll get a private access code to share"
                  : "Anyone can discover and join your room",
              color: "#00F0FF",
            },
            {
              icon: Users,
              text: "Track participant activity from this page",
              color: "#a855f7",
            },
            {
              icon: Award,
              text: "Top performers will appear on the Leaderboard",
              color: "#f59e0b",
            },
          ].map(({ icon: Icon, text, color }, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: `${color}15`,
                  border: `1px solid ${color}30`,
                }}
              >
                <Icon size={13} style={{ color }} />
              </div>
              <p className="text-sm text-gray-400">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ── Success Screen ────────────────────────────────────────────────────────────
const SuccessScreen = ({ data, roomCode, onReset }) => {
  const [copied, setCopied] = useState(false);

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="text-5xl mb-5">🚀</div>
      <h2 className="text-3xl font-black text-white mb-2">Room is live!</h2>
      <p className="text-gray-400 text-sm mb-8">
        <span className="text-white font-semibold">{data.roomName}</span> is
        ready for challengers.
      </p>

      {data.access === "private" && roomCode && (
        <div className="bg-[#0f0f13] border border-[#FF00C8]/20 rounded-2xl p-6 mb-6 text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-[#FF00C8] mb-3 flex items-center gap-2">
            <Lock size={11} /> Private Access Code
          </p>
          <div className="flex items-center justify-between gap-3 bg-[#08080f] border border-white/8 rounded-xl px-4 py-3">
            <code className="text-[#FF00C8] font-mono font-bold text-lg tracking-widest">
              {roomCode}
            </code>
            <button
              onClick={() => copy(roomCode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all"
              style={{
                background: "rgba(255,0,200,0.1)",
                borderColor: "rgba(255,0,200,0.3)",
                color: "#FF00C8",
              }}
            >
              {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Share this code with your participants to let them join.
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Category", value: data.category },
          { label: "Difficulty", value: data.difficulty },
          {
            label: "Access",
            value: data.access === "private" ? "Private" : "Public",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-[#0f0f13] border border-white/5 rounded-xl py-3 px-2"
          >
            <p className="text-xs text-gray-600 mb-1 capitalize">{s.label}</p>
            <p className="text-sm font-bold text-white capitalize">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.reload()}
          className="w-full py-3.5 rounded-2xl font-bold text-sm text-white cursor-pointer"
          style={{ background: "linear-gradient(90deg,#FF00C8,#a855f7)" }}
        >
          View My Rooms ↓
        </motion.button>
        <button
          onClick={onReset}
          className="w-full py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-all"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#9ca3af",
          }}
        >
          Host Another Room
        </button>
      </div>
    </motion.div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const HostRoom = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [userId, setUserId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [data, setData] = useState({
    orgType: "college",
    orgName: "",
    hostName: "",
    contactEmail: "",
    roomName: "",
    description: "",
    theme: "glitch",
    access: "public",
    maxParticipants: 50,
    category: "AI",
    difficulty: "medium",
    duration: "1 hour",
    customQuestions: [],
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: au }) => setUserId(au?.user?.id));
  }, []);

  const canNext = () => {
    if (step === 1) return data.orgName.trim() && data.hostName.trim();
    if (step === 2) return data.roomName.trim();
    if (step === 3) return data.category;
    return true;
  };

  const handleLaunch = async () => {
    setLoading(true);
    const { data: au } = await supabase.auth.getUser();
    const uid = au?.user?.id;
    const code = generateRoomCode();
    setRoomCode(code);

    const { data: room, error } = await supabase
      .from("rooms")
      .insert([
        {
          name: data.roomName,
          host: data.hostName,
          description: data.description,
          category: data.category,
          access: data.access,
          code,
          total_questions: 10,
          difficulty: data.difficulty,
          created_by: uid,
          room_type: "professional",
        },
      ])
      .select()
      .single();

    if (!error && room) {
      if (data.customQuestions.length > 0) {
        await supabase.from("room_questions").insert(
          data.customQuestions.map((q) => ({
            room_id: room.id,
            is_custom: true,
            question: q.question,
            option_a: q.optionA,
            option_b: q.optionB,
            option_c: q.optionC,
            option_d: q.optionD,
            correct: q.correct,
          })),
        );
      }
      if (uid) {
        await supabase
          .from("room_members")
          .insert({ room_id: room.id, user_id: uid });
      }
    }

    setLoading(false);
    setSuccess(true);
    setRefreshKey((k) => k + 1);
  };

  const reset = () => {
    setStep(1);
    setSuccess(false);
    setRoomCode("");
    setData({
      orgType: "college",
      orgName: "",
      hostName: "",
      contactEmail: "",
      roomName: "",
      description: "",
      theme: "glitch",
      access: "public",
      maxParticipants: 50,
      category: "AI",
      difficulty: "medium",
      duration: "1 hour",
      customQuestions: [],
    });
  };

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col">
      <Navbar />

      {/* ── HERO ── */}
      {!success && (
        <section className="relative pt-32 pb-10 px-6 text-center overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,0,200,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,200,0.8) 1px, transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          />
          <div
            className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full blur-3xl pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse,rgba(255,0,200,0.12),transparent)",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10"
          >
            <div className="flex items-center justify-center gap-3 mb-5 flex-wrap">
              <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold tracking-widest uppercase bg-[#FF00C8]/10 border border-[#FF00C8]/30 rounded-full text-[#FF00C8]">
                🏢 For Colleges & Companies
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold tracking-widest uppercase bg-white/5 border border-white/10 rounded-full text-gray-400">
                ⚡ Hackathons Welcome
              </span>
            </div>
            <PageHeading
              title="Host Your Own Glitch Room"
              subtitle="Run branded challenge rooms for your college, company, or event. Customizable themes, private access codes, and live participant tracking."
              accent="pink"
              size="xl"
              underline={false}
            />
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              {[
                { icon: Shield, label: "Private Rooms" },
                { icon: Palette, label: "Custom Themes" },
                { icon: Users, label: "Team Tracking" },
                { icon: Star, label: "Leaderboards" },
                { icon: Clock, label: "Timed Events" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-gray-400"
                >
                  <Icon size={11} /> {label}
                </span>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* ── MY PROFESSIONAL ROOMS (shown when not in success state) ── */}
      {!success && (
        <MyProfessionalRooms
          key={refreshKey}
          userId={userId}
          onDeleted={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {/* ── MAIN FORM / SUCCESS ── */}
      <section className="max-w-2xl mx-auto px-6 pb-24 w-full flex-1">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0d0d14] border border-white/5 rounded-3xl p-8 shadow-2xl"
            >
              <div
                className="h-[2px] w-full mb-8"
                style={{
                  background: "linear-gradient(90deg,#FF00C8,#a855f7,#00F0FF)",
                }}
              />
              <SuccessScreen data={data} roomCode={roomCode} onReset={reset} />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0d0d14] border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div
                className="h-[2px] w-full"
                style={{
                  background: "linear-gradient(90deg,#FF00C8,#a855f7,#00F0FF)",
                }}
              />
              <div className="p-8">
                <StepIndicator currentStep={step} />
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <Step1 key="s1" data={data} setData={setData} />
                  )}
                  {step === 2 && (
                    <Step2 key="s2" data={data} setData={setData} />
                  )}
                  {step === 3 && (
                    <Step3 key="s3" data={data} setData={setData} />
                  )}
                  {step === 4 && <Step4 key="s4" data={data} />}
                </AnimatePresence>

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    disabled={step === 1}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition disabled:opacity-0 cursor-pointer"
                  >
                    <ChevronLeft size={15} /> Back
                  </button>

                  {step < 4 ? (
                    <motion.button
                      whileHover={canNext() ? { scale: 1.03 } : {}}
                      whileTap={canNext() ? { scale: 0.97 } : {}}
                      onClick={() => setStep((s) => s + 1)}
                      disabled={!canNext()}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-white"
                      style={{
                        background: canNext()
                          ? "linear-gradient(90deg,#FF00C8,#a855f7)"
                          : "rgba(255,255,255,0.05)",
                        boxShadow: canNext()
                          ? "0 0 20px rgba(255,0,200,0.3)"
                          : "none",
                      }}
                    >
                      Continue <ChevronRight size={15} />
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleLaunch}
                      disabled={loading}
                      className="flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold text-white cursor-pointer disabled:opacity-60"
                      style={{
                        background: "linear-gradient(90deg,#FF00C8,#a855f7)",
                        boxShadow: "0 0 24px rgba(255,0,200,0.35)",
                      }}
                    >
                      {loading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              repeat: Infinity,
                              duration: 0.8,
                              ease: "linear",
                            }}
                            className="w-4 h-4 border-2 border-t-transparent border-white rounded-full"
                          />
                          Launching...
                        </>
                      ) : (
                        <>
                          <Zap size={15} /> Launch Room
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <Footer />
    </div>
  );
};

export default HostRoom;
