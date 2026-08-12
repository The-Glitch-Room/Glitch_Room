import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaCode,
  FaBrain,
  FaPalette,
  FaGlobe,
  FaRobot,
  FaGamepad,
  FaArrowRight,
  FaArrowLeft,
  FaUsers,
  FaPlus,
  FaBolt,
  FaCheckCircle,
  FaFire,
} from "react-icons/fa";

// ─── Data ─────────────────────────────────────────────────────────────────────

const TOPICS = [
  {
    id: "coding",
    label: "Coding",
    icon: <FaCode />,
    desc: "DSA, web dev, system design",
    color: "#00F0FF",
    bg: "rgba(0,240,255,0.08)",
    border: "rgba(0,240,255,0.25)",
    glow: "0 0 24px rgba(0,240,255,0.2)",
  },
  {
    id: "ml",
    label: "Machine Learning",
    icon: <FaBrain />,
    desc: "Models, data, NLP, CV",
    color: "#FF00C8",
    bg: "rgba(255,0,200,0.08)",
    border: "rgba(255,0,200,0.25)",
    glow: "0 0 24px rgba(255,0,200,0.2)",
  },
  {
    id: "design",
    label: "Design",
    icon: <FaPalette />,
    desc: "UI/UX, Figma, visual thinking",
    color: "#D600FF",
    bg: "rgba(214,0,255,0.08)",
    border: "rgba(214,0,255,0.25)",
    glow: "0 0 24px rgba(214,0,255,0.2)",
  },
  {
    id: "english",
    label: "English",
    icon: <FaGlobe />,
    desc: "Writing, speaking, fluency",
    color: "#00F0FF",
    bg: "rgba(0,240,255,0.08)",
    border: "rgba(0,240,255,0.25)",
    glow: "0 0 24px rgba(0,240,255,0.2)",
  },
  {
    id: "ai",
    label: "AI & Prompting",
    icon: <FaRobot />,
    desc: "Prompt eng, LLMs, AI tools",
    color: "#FF00C8",
    bg: "rgba(255,0,200,0.08)",
    border: "rgba(255,0,200,0.25)",
    glow: "0 0 24px rgba(255,0,200,0.2)",
  },
  {
    id: "gamedev",
    label: "Game Dev",
    icon: <FaGamepad />,
    desc: "Unity, Godot, game design",
    color: "#D600FF",
    bg: "rgba(214,0,255,0.08)",
    border: "rgba(214,0,255,0.25)",
    glow: "0 0 24px rgba(214,0,255,0.2)",
  },
];

const SAMPLE_ROOMS = [
  {
    id: 1,
    name: "DSA Grinders",
    topic: "coding",
    members: 6,
    max: 8,
    streak: 12,
    goal: "1 problem/day",
    host: "Arjun S.",
  },
  {
    id: 2,
    name: "ML Builders Club",
    topic: "ml",
    members: 4,
    max: 8,
    streak: 7,
    goal: "Weekly model build",
    host: "Priya K.",
  },
  {
    id: 3,
    name: "UI Wizards",
    topic: "design",
    members: 5,
    max: 8,
    streak: 21,
    goal: "Daily design challenge",
    host: "Meera R.",
  },
];

// ─── Step indicator ───────────────────────────────────────────────────────────

const StepDots = ({ current, total }) => (
  <div className="flex items-center gap-2 justify-center mb-8">
    {Array.from({ length: total }).map((_, i) => (
      <motion.div
        key={i}
        animate={{
          width: i === current ? 28 : 8,
          background:
            i < current
              ? "#22c55e"
              : i === current
                ? "linear-gradient(90deg,#00F0FF,#FF00C8)"
                : "rgba(255,255,255,0.1)",
        }}
        transition={{ duration: 0.3 }}
        className="h-2 rounded-full"
        style={{
          background:
            i < current
              ? "#22c55e"
              : i === current
                ? "linear-gradient(90deg,#00F0FF,#FF00C8)"
                : "rgba(255,255,255,0.1)",
        }}
      />
    ))}
  </div>
);

// ─── Step 1: Pick Topics ──────────────────────────────────────────────────────

const Step1 = ({ selected, setSelected }) => (
  <motion.div
    key="step1"
    initial={{ opacity: 0, x: 40 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -40 }}
    transition={{ duration: 0.35 }}
  >
    <div className="text-center mb-8">
      <div
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
        style={{
          background: "rgba(0,240,255,0.08)",
          border: "1px solid rgba(0,240,255,0.2)",
          color: "#00F0FF",
        }}
      >
        Step 1 of 3
      </div>
      <h2 className="text-3xl font-black text-white mb-2">
        What are you learning?
      </h2>
      <p className="text-gray-400 text-sm">
        Pick one or more topics. We'll match you with the right rooms and
        challenges.
      </p>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
      {TOPICS.map((topic) => {
        const isSelected = selected.includes(topic.id);
        return (
          <motion.button
            key={topic.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() =>
              setSelected((prev) =>
                isSelected
                  ? prev.filter((t) => t !== topic.id)
                  : [...prev, topic.id],
              )
            }
            className="relative flex flex-col items-start gap-2 p-4 rounded-2xl text-left transition-all cursor-pointer"
            style={{
              background: isSelected ? topic.bg : "rgba(255,255,255,0.03)",
              border: `1px solid ${isSelected ? topic.border : "rgba(255,255,255,0.07)"}`,
              boxShadow: isSelected ? topic.glow : "none",
            }}
          >
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 text-green-400 text-xs"
              >
                <FaCheckCircle />
              </motion.div>
            )}
            <span
              className="text-lg"
              style={{ color: isSelected ? topic.color : "#6b7280" }}
            >
              {topic.icon}
            </span>
            <div>
              <p
                className="font-bold text-sm"
                style={{ color: isSelected ? topic.color : "#e5e7eb" }}
              >
                {topic.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                {topic.desc}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>

    {selected.length > 0 && (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-xs text-gray-500"
      >
        {selected.length} topic{selected.length > 1 ? "s" : ""} selected ✓
      </motion.p>
    )}
  </motion.div>
);

// ─── Step 2: Join or Create Room ──────────────────────────────────────────────

const Step2 = ({ selectedTopics, roomChoice, setRoomChoice }) => {
  const [tab, setTab] = useState("join"); // "join" | "create"
  const [roomName, setRoomName] = useState("");
  const [roomGoal, setRoomGoal] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const filtered = SAMPLE_ROOMS.filter((r) => selectedTopics.includes(r.topic));
  const displayRooms = filtered.length > 0 ? filtered : SAMPLE_ROOMS;

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
    >
      <div className="text-center mb-6">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
          style={{
            background: "rgba(255,0,200,0.08)",
            border: "1px solid rgba(255,0,200,0.2)",
            color: "#FF00C8",
          }}
        >
          Step 2 of 3
        </div>
        <h2 className="text-3xl font-black text-white mb-2">
          Find your people
        </h2>
        <p className="text-gray-400 text-sm">
          Join an existing room or create your own. Rooms keep you accountable.
        </p>
      </div>

      {/* Tab switcher */}
      <div
        className="flex rounded-xl p-1 mb-5"
        style={{ background: "rgba(255,255,255,0.04)" }}
      >
        {["join", "create", "invite"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer capitalize"
            style={{
              background: tab === t ? "rgba(255,0,200,0.15)" : "transparent",
              color: tab === t ? "#FF00C8" : "#6b7280",
              border:
                tab === t
                  ? "1px solid rgba(255,0,200,0.3)"
                  : "1px solid transparent",
            }}
          >
            {t === "join"
              ? "🏠 Join Room"
              : t === "create"
                ? "➕ Create"
                : "🔗 Invite Code"}
          </button>
        ))}
      </div>

      {/* Join tab */}
      {tab === "join" && (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {displayRooms.map((room) => {
            const isSelected = roomChoice?.id === room.id;
            return (
              <motion.button
                key={room.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setRoomChoice(isSelected ? null : room)}
                className="w-full flex items-center justify-between p-4 rounded-xl text-left transition-all cursor-pointer"
                style={{
                  background: isSelected
                    ? "rgba(255,0,200,0.08)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isSelected ? "rgba(255,0,200,0.35)" : "rgba(255,255,255,0.07)"}`,
                  boxShadow: isSelected
                    ? "0 0 20px rgba(255,0,200,0.15)"
                    : "none",
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-bold text-sm">{room.name}</p>
                    {isSelected && (
                      <FaCheckCircle className="text-green-400 text-xs" />
                    )}
                  </div>
                  <p className="text-gray-500 text-xs">
                    Goal: {room.goal} · Host: {room.host}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 ml-4">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <FaUsers className="text-[10px]" />
                    <span>
                      {room.members}/{room.max}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-orange-400">
                    <FaFire className="text-[10px]" />
                    <span>{room.streak}d</span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Create tab */}
      {tab === "create" && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => {
                setRoomName(e.target.value);
                setRoomChoice({
                  id: "new",
                  name: e.target.value,
                  goal: roomGoal,
                });
              }}
              placeholder="e.g. ML Builders Club"
              className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-pink-500/50 transition"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">
              Weekly Goal
            </label>
            <input
              type="text"
              value={roomGoal}
              onChange={(e) => {
                setRoomGoal(e.target.value);
                setRoomChoice({
                  id: "new",
                  name: roomName,
                  goal: e.target.value,
                });
              }}
              placeholder="e.g. Complete 3 challenges per week"
              className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-pink-500/50 transition"
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Your room will be private. You'll get an invite link after setup.
          </p>
        </div>
      )}

      {/* Invite code tab */}
      {tab === "invite" && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">
              Paste Invite Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value);
                if (e.target.value.length > 4)
                  setRoomChoice({ id: "invite", code: e.target.value });
              }}
              placeholder="e.g. GLITCH-7X2K"
              className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-cyan-500/50 transition font-mono tracking-widest"
            />
          </div>
          {inviteCode.length > 4 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-green-400 text-xs"
            >
              <FaCheckCircle />
              <span>Code looks valid — you'll join on next step</span>
            </motion.div>
          )}
          <p className="text-xs text-gray-600">
            Got an invite from a friend? Paste their code here to join their
            room directly.
          </p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/5">
        <button
          onClick={() => setRoomChoice({ id: "skip" })}
          className="text-xs text-gray-600 hover:text-gray-400 transition cursor-pointer"
        >
          Skip for now — I'll join a room later →
        </button>
      </div>
    </motion.div>
  );
};

// ─── Step 3: First Challenge ──────────────────────────────────────────────────

const Step3 = ({ selectedTopics, onComplete }) => {
  const [chosen, setChosen] = useState(null);

  const challenges = [
    {
      id: "arena",
      label: "Arena Challenge",
      icon: "⚡",
      desc: "3-stage live event — find the glitch, get a twist, pitch wild",
      color: "#00F0FF",
      route: "/arena-events",
      tag: "Most Popular",
    },
    {
      id: "ai",
      label: "AI Challenge",
      icon: "🤖",
      desc: "Debug broken ML models and fix AI pipelines",
      color: "#FF00C8",
      route: "/ai-challenges",
      tag: "Great for Beginners",
    },
    {
      id: "explore",
      label: "Explore First",
      icon: "🗺️",
      desc: "Look around the platform before diving in",
      color: "#D600FF",
      route: "/",
      tag: "Take it slow",
    },
  ];

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
    >
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
          style={{
            background: "rgba(214,0,255,0.08)",
            border: "1px solid rgba(214,0,255,0.2)",
            color: "#D600FF",
          }}
        >
          Step 3 of 3
        </div>
        <h2 className="text-3xl font-black text-white mb-2">
          Ready to dive in?
        </h2>
        <p className="text-gray-400 text-sm">
          Pick where you want to start. You can always change this later.
        </p>
      </div>

      <div className="space-y-3">
        {challenges.map((ch) => {
          const isSelected = chosen === ch.id;
          return (
            <motion.button
              key={ch.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setChosen(ch.id)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all cursor-pointer"
              style={{
                background: isSelected
                  ? `${ch.color}10`
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${isSelected ? `${ch.color}40` : "rgba(255,255,255,0.07)"}`,
                boxShadow: isSelected ? `0 0 20px ${ch.color}20` : "none",
              }}
            >
              <span className="text-3xl">{ch.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-white font-bold text-sm">{ch.label}</p>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${ch.color}15`,
                      color: ch.color,
                      border: `1px solid ${ch.color}30`,
                    }}
                  >
                    {ch.tag}
                  </span>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">
                  {ch.desc}
                </p>
              </div>
              {isSelected && (
                <FaCheckCircle className="text-green-400 flex-shrink-0" />
              )}
            </motion.button>
          );
        })}
      </div>

      {chosen && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() =>
            onComplete(challenges.find((c) => c.id === chosen)?.route)
          }
          className="w-full mt-6 py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 cursor-pointer"
          style={{
            background: "linear-gradient(90deg, #00F0FF, #FF00C8)",
          }}
        >
          <FaBolt />
          Let's Go — Enter The Glitch Room
          <FaArrowRight />
        </motion.button>
      )}
    </motion.div>
  );
};

// ─── Completed Splash ─────────────────────────────────────────────────────────

const CompletedSplash = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-8"
  >
    <motion.div
      animate={{ rotate: [0, -10, 10, -10, 0] }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="text-6xl mb-5"
    >
      ⚡
    </motion.div>
    <h2 className="text-3xl font-black text-white mb-2">You're in.</h2>
    <p className="text-gray-400 text-sm max-w-xs mx-auto">
      Welcome to The Glitch Room. Your journey starts now — stay consistent,
      stay chaotic.
    </p>
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 1, delay: 0.4 }}
      className="h-0.5 mt-6 rounded-full"
      style={{ background: "linear-gradient(90deg,#00F0FF,#FF00C8)" }}
    />
  </motion.div>
);

// ─── Main Onboarding Component ────────────────────────────────────────────────

const Onboarding = ({ onFinish }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  // Step 1
  const [selectedTopics, setSelectedTopics] = useState([]);
  // Step 2
  const [roomChoice, setRoomChoice] = useState(null);

  const canProceed = () => {
    if (step === 0) return selectedTopics.length > 0;
    if (step === 1) return true; // room is optional (can skip)
    return false;
  };

  const handleNext = () => {
    if (step < 2) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleComplete = (route) => {
    setDone(true);
    setTimeout(() => {
      if (onFinish) onFinish();
      navigate(route || "/");
    }, 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,5,12,0.95)", backdropFilter: "blur(12px)" }}
    >
      {/* Glow orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: "rgba(0,240,255,0.05)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: "rgba(255,0,200,0.05)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-lg rounded-3xl p-8 overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #0f0f1a 0%, #0a0a14 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 0 80px rgba(0,0,0,0.8), 0 0 40px rgba(0,240,255,0.05)",
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background:
              "linear-gradient(90deg, transparent, #00F0FF, #FF00C8, transparent)",
          }}
        />

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-lg">⚡</span>
          <span
            className="text-sm font-black uppercase tracking-widest"
            style={{
              background: "linear-gradient(90deg,#00F0FF,#FF00C8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            The Glitch Room
          </span>
        </div>

        {!done && <StepDots current={step} total={3} />}

        <AnimatePresence mode="wait">
          {done ? (
            <CompletedSplash key="done" />
          ) : step === 0 ? (
            <Step1
              key="s1"
              selected={selectedTopics}
              setSelected={setSelectedTopics}
            />
          ) : step === 1 ? (
            <Step2
              key="s2"
              selectedTopics={selectedTopics}
              roomChoice={roomChoice}
              setRoomChoice={setRoomChoice}
            />
          ) : (
            <Step3
              key="s3"
              selectedTopics={selectedTopics}
              onComplete={handleComplete}
            />
          )}
        </AnimatePresence>

        {/* Nav buttons (steps 0 & 1) */}
        {!done && step < 2 && (
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/5">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition disabled:opacity-0 cursor-pointer"
            >
              <FaArrowLeft />
              Back
            </button>

            <motion.button
              whileHover={canProceed() ? { scale: 1.04 } : {}}
              whileTap={canProceed() ? { scale: 0.97 } : {}}
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer"
              style={{
                background: canProceed()
                  ? "linear-gradient(90deg,#00F0FF,#FF00C8)"
                  : "rgba(255,255,255,0.05)",
                color: canProceed() ? "#000" : "#4b5563",
                cursor: canProceed() ? "pointer" : "not-allowed",
              }}
            >
              {step === 1 ? "Almost there" : "Continue"}
              <FaArrowRight />
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Onboarding;
