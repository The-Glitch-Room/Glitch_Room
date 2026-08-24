import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";
import {
  FiPlus,
  FiX,
  FiUser,
  FiAtSign,
  FiFileText,
  FiImage,
  FiChevronRight,
  FiChevronLeft,
  FiCheck,
  FiLink,
  FiGithub,
  FiLinkedin,
  FiMessageCircle,
} from "react-icons/fi";
import { FaTwitter, FaDiscord } from "react-icons/fa";

/* ── Chip ── */
const Chip = ({ label, onRemove, color = "cyan" }) => {
  const colors = {
    cyan: "bg-[#00F0FF]/10 border-[#00F0FF]/30 text-[#00F0FF]",
    pink: "bg-[#FF00C8]/10 border-[#FF00C8]/30 text-[#FF00C8]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${colors[color]}`}
    >
      {label}
      <button
        onClick={onRemove}
        className="hover:opacity-70 transition cursor-pointer"
      >
        <FiX size={10} />
      </button>
    </span>
  );
};

/* ── Tag input ── */
const TagInput = ({ value, onChange, onAdd, placeholder, color, disabled }) => (
  <div className="flex gap-2">
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onAdd())}
      placeholder={disabled ? "Limit reached (10)" : placeholder}
      disabled={disabled}
      className="flex-1 bg-[#08080f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00F0FF]/50 transition disabled:opacity-40 disabled:cursor-not-allowed"
    />
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
        color === "pink"
          ? "bg-[#FF00C8]/10 border border-[#FF00C8]/30 text-[#FF00C8] hover:bg-[#FF00C8]/20"
          : "bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/20"
      }`}
    >
      <FiPlus size={14} />
    </button>
  </div>
);

const STEPS = ["Identity", "About You", "Interests", "Social Links"];

/* ── Step dot ── */
const StepDot = ({ index, current, label }) => {
  const done = index < current;
  const active = index === current;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
          done
            ? "bg-gradient-to-br from-[#FF00C8] to-[#00F0FF] text-white shadow-[0_0_14px_rgba(0,240,255,0.4)]"
            : active
              ? "bg-[#0b0b12] border-2 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.3)]"
              : "bg-white/5 border border-white/10 text-white/25"
        }`}
      >
        {done ? <FiCheck size={14} /> : index + 1}
      </div>
      <span
        className={`text-[10px] font-semibold transition-colors whitespace-nowrap ${
          active ? "text-[#00F0FF]" : done ? "text-white/60" : "text-white/20"
        }`}
      >
        {label}
      </span>
    </div>
  );
};

/* ── Social link row ── */
const SocialRow = ({
  icon: Icon,
  label,
  placeholder,
  value,
  onChange,
  color,
  accentColor,
}) => (
  <div>
    <label
      className="text-[11px] font-semibold uppercase tracking-widest block mb-1.5"
      style={{ color: "rgba(255,255,255,0.35)" }}
    >
      {label}
    </label>
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all focus-within:border-opacity-60"
      style={{
        background: "#08080f",
        borderColor: `${accentColor}25`,
      }}
    >
      <Icon size={15} style={{ color: accentColor }} className="shrink-0" />
      <input
        type="url"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm text-white placeholder-white/20 focus:outline-none"
      />
      {value && (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] font-bold px-2 py-0.5 rounded-full transition"
          style={{
            background: `${accentColor}15`,
            color: accentColor,
            border: `1px solid ${accentColor}30`,
          }}
        >
          Preview
        </a>
      )}
    </div>
  </div>
);

const CreateProfile = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    full_name: "",
    username: "",
    bio: "",
    interests: [],
    hobbies: [],
    avatar_url: "",
    github_url: "",
    linkedin_url: "",
    twitter_url: "",
    discord_url: "",
  });

  const [interestInput, setInterestInput] = useState("");
  const [hobbyInput, setHobbyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Only accept genuine http(s) URLs. Rejects javascript:/data:/other schemes
  // so a malicious link pasted here can never be saved and later rendered as
  // a live href/src on this or any other user's screen (stored XSS via a
  // profile link is a real risk otherwise — the browser executes
  // javascript: URIs on click just like a normal link).
  const sanitizeUrl = (url) => {
    const trimmed = (url || "").trim();
    if (!trimmed) return "";
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
        return "";
      return trimmed;
    } catch {
      return "";
    }
  };

  // Guarantees a non-empty username even if someone reaches Finish/Skip
  // before ever typing one (e.g. profile row genuinely doesn't exist yet).
  // Mirrors the fallback pattern already used at signup in AuthModal.jsx.
  const generateFallbackUsername = (userId) =>
    `glitcher_${(userId || "").replace(/-/g, "").slice(0, 8)}`;

  // Load whatever profile data already exists BEFORE rendering the form.
  // Without this, every field starts blank regardless of what's already
  // saved — so hitting Skip (or even Finish, without retyping every field)
  // would overwrite good existing data with empty strings.
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }

      const { data: existing } = await supabase
        .from("profiles")
        .select(
          "full_name, username, bio, interests, hobbies, avatar_url, github_url, linkedin_url, twitter_url, discord_url",
        )
        .eq("id", user.id)
        .maybeSingle();

      setProfile((p) => ({
        ...p,
        full_name: existing?.full_name || user.user_metadata?.full_name || "",
        username: existing?.username || "",
        bio: existing?.bio || "",
        interests: existing?.interests || [],
        hobbies: existing?.hobbies || [],
        avatar_url: existing?.avatar_url || "",
        github_url: existing?.github_url || "",
        linkedin_url: existing?.linkedin_url || "",
        twitter_url: existing?.twitter_url || "",
        discord_url: existing?.discord_url || "",
      }));
      setLoadingProfile(false);
    })();
  }, [navigate]);

  const MAX_TAGS = 10;

  const addInterest = () => {
    const val = interestInput.trim();
    if (!val || profile.interests.length >= MAX_TAGS) {
      setInterestInput("");
      return;
    }
    if (profile.interests.some((i) => i.toLowerCase() === val.toLowerCase())) {
      setInterestInput("");
      return;
    }
    setProfile((p) => ({
      ...p,
      interests: [...p.interests, val],
    }));
    setInterestInput("");
  };

  const addHobby = () => {
    const val = hobbyInput.trim();
    if (!val || profile.hobbies.length >= MAX_TAGS) {
      setHobbyInput("");
      return;
    }
    if (profile.hobbies.some((h) => h.toLowerCase() === val.toLowerCase())) {
      setHobbyInput("");
      return;
    }
    setProfile((p) => ({ ...p, hobbies: [...p.hobbies, val] }));
    setHobbyInput("");
  };

  const removeInterest = (i) =>
    setProfile((p) => ({
      ...p,
      interests: p.interests.filter((_, idx) => idx !== i),
    }));
  const removeHobby = (i) =>
    setProfile((p) => ({
      ...p,
      hobbies: p.hobbies.filter((_, idx) => idx !== i),
    }));

  // Shared save path — used by "Finish Profile" AND every "Skip" button, so
  // skipping can never mean "don't save what was already filled in."
  const persistProfile = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/");
        return false;
      }

      const cleanUsername = profile.username.trim();

      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: profile.full_name.trim() || "Glitcher",
          username: cleanUsername || generateFallbackUsername(user.id),
          bio: profile.bio.trim().slice(0, 500),
          interests: profile.interests.slice(0, MAX_TAGS),
          hobbies: profile.hobbies.slice(0, MAX_TAGS),
          avatar_url: sanitizeUrl(profile.avatar_url) || null,
          github_url: sanitizeUrl(profile.github_url) || null,
          linkedin_url: sanitizeUrl(profile.linkedin_url) || null,
          twitter_url: sanitizeUrl(profile.twitter_url) || null,
          discord_url: sanitizeUrl(profile.discord_url) || null,
        },
        { onConflict: "id" },
      );

      if (error) {
        console.error("Profile save error:", error);
        setSaveError(
          error.code === "23505"
            ? "That username is already taken — please choose another."
            : "Something went wrong saving your profile. Please try again.",
        );
        return false;
      }
      return true;
    } catch (err) {
      console.error("Profile save error:", err);
      setSaveError(
        "Something went wrong saving your profile. Please try again.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    const ok = await persistProfile();
    if (ok) {
      setSaved(true);
      setTimeout(() => navigate("/profile"), 1800);
    }
  };

  // Skip buttons now save whatever's been filled in so far before leaving —
  // previously they navigated away with zero save call, silently discarding
  // anything the user had already entered.
  const handleSkip = async () => {
    const ok = await persistProfile();
    if (ok) navigate("/profile");
  };

  const canNext = () => {
    if (step === 0) return profile.full_name.trim() && profile.username.trim();
    return true;
  };

  /* ─────────────────────── STEP PANELS ─────────────────────── */

  /* Left panel descriptions per step */
  const stepMeta = [
    {
      emoji: "🪪",
      heading: "Your Identity",
      desc: "Set your name, username, and avatar. This is how the Glitch Room community will know you.",
      tips: [
        "Pick a memorable username",
        "Add a real photo or avatar URL",
        "Name can be your real name or alias",
      ],
      accentColor: "#00F0FF",
    },
    {
      emoji: "✍️",
      heading: "Tell Your Story",
      desc: "Write a bio that captures who you are. The more specific, the better connections you'll make.",
      tips: [
        "Be authentic and specific",
        "Mention your skills & goals",
        "No limit on personality",
      ],
      accentColor: "#FF00C8",
    },
    {
      emoji: "🧠",
      heading: "What Drives You",
      desc: "Add your interests and hobbies so others can find you based on shared passions.",
      tips: [
        "Add up to 10 interests",
        "Hobbies humanise your profile",
        "Press Enter to add each one",
      ],
      accentColor: "#a855f7",
    },
    {
      emoji: "🔗",
      heading: "Your Links",
      desc: "Connect your social profiles. These will appear as clickable icons on your public profile.",
      tips: [
        "Paste full URLs (https://…)",
        "All fields are optional",
        "Links open in a new tab",
      ],
      accentColor: "#f59e0b",
    },
  ];

  const meta = stepMeta[step];

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-t-transparent border-[#00F0FF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080f] text-white">
      <Navbar />

      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(#00F0FF 1px, transparent 1px), linear-gradient(90deg, #00F0FF 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Ambient glow */}
      <div
        className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-[130px] pointer-events-none opacity-40"
        style={{
          background: `radial-gradient(${meta.accentColor}18, transparent)`,
        }}
      />

      <section className="relative pt-32 pb-20 px-4 flex flex-col items-center min-h-screen">
        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            Build Your{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: `linear-gradient(90deg, #FF00C8, #00F0FF)`,
              }}
            >
              Glitch Identity
            </span>
          </h1>
          <p className="text-white/35 text-sm mt-2">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {STEPS.map((label, i) => (
            <React.Fragment key={i}>
              <StepDot index={i} current={step} label={label} />
              {i < STEPS.length - 1 && (
                <div
                  className="h-px w-10 md:w-16 transition-all duration-500"
                  style={{
                    background:
                      i < step
                        ? "linear-gradient(90deg,#FF00C8,#00F0FF)"
                        : "rgba(255,255,255,0.1)",
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── MAIN CARD — Horizontal layout ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative w-full max-w-4xl"
        >
          {/* Outer glow */}
          <div
            className="absolute -inset-px rounded-3xl blur-xl pointer-events-none opacity-60"
            style={{
              background: `linear-gradient(135deg, ${meta.accentColor}20, transparent, #FF00C820)`,
            }}
          />

          <div
            className="relative rounded-3xl overflow-hidden border border-white/8"
            style={{ background: "linear-gradient(145deg, #0d0d16, #0a0a12)" }}
          >
            {/* Top accent line */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] transition-all duration-500"
              style={{
                background: `linear-gradient(90deg, transparent, ${meta.accentColor}, #FF00C8, transparent)`,
              }}
            />

            <div className="flex flex-col md:flex-row min-h-[480px]">
              {/* ── LEFT PANEL — Context ── */}
              <motion.div
                key={`left-${step}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35 }}
                className="md:w-[300px] shrink-0 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5"
                style={{
                  background: `linear-gradient(160deg, ${meta.accentColor}08, transparent 60%)`,
                }}
              >
                <div>
                  {/* Emoji icon */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6"
                    style={{
                      background: `${meta.accentColor}15`,
                      border: `1px solid ${meta.accentColor}30`,
                      boxShadow: `0 0 20px ${meta.accentColor}15`,
                    }}
                  >
                    {meta.emoji}
                  </div>

                  <h2 className="text-xl font-black text-white mb-2 leading-tight">
                    {meta.heading}
                  </h2>
                  <p className="text-white/40 text-sm leading-relaxed">
                    {meta.desc}
                  </p>
                </div>

                {/* Tips */}
                <div className="mt-8 space-y-2.5">
                  {meta.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ background: meta.accentColor }}
                      />
                      <p className="text-white/30 text-xs leading-relaxed">
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Progress mini dots */}
                <div className="flex gap-1.5 mt-8">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className="h-1 rounded-full transition-all duration-500"
                      style={{
                        width: i === step ? 20 : 6,
                        background:
                          i === step
                            ? meta.accentColor
                            : i < step
                              ? `${meta.accentColor}50`
                              : "rgba(255,255,255,0.1)",
                      }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* ── RIGHT PANEL — Form ── */}
              <div className="flex-1 p-8 flex flex-col">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.28 }}
                    className="flex-1"
                  >
                    {/* ── STEP 0: Identity ── */}
                    {step === 0 && (
                      <div className="space-y-5 h-full">
                        {/* Avatar preview + URL */}
                        <div className="flex items-center gap-4">
                          <div className="shrink-0">
                            <img
                              src={
                                profile.avatar_url ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || "G")}&background=0d1117&color=00F0FF&bold=true&size=128`
                              }
                              alt="avatar"
                              className="w-16 h-16 rounded-xl object-cover border-2 shadow-lg"
                              style={{
                                borderColor: "#00F0FF40",
                                boxShadow: "0 0 16px rgba(0,240,255,0.2)",
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest block mb-1.5">
                              Avatar URL{" "}
                              <span className="text-white/20 normal-case tracking-normal">
                                (optional)
                              </span>
                            </label>
                            <div className="relative">
                              <FiImage
                                size={13}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
                              />
                              <input
                                type="text"
                                placeholder="https://… paste an image URL"
                                value={profile.avatar_url}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    avatar_url: e.target.value,
                                  })
                                }
                                className="w-full bg-[#08080f] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00F0FF]/50 transition"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Full Name */}
                        <div>
                          <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest block mb-1.5">
                            Full Name *
                          </label>
                          <div className="relative">
                            <FiUser
                              size={13}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
                            />
                            <input
                              type="text"
                              placeholder="Your full name"
                              value={profile.full_name}
                              onChange={(e) =>
                                setProfile({
                                  ...profile,
                                  full_name: e.target.value,
                                })
                              }
                              className="w-full bg-[#08080f] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00F0FF]/50 transition"
                            />
                          </div>
                        </div>

                        {/* Username */}
                        <div>
                          <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest block mb-1.5">
                            Username *
                          </label>
                          <div className="relative">
                            <FiAtSign
                              size={13}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
                            />
                            <input
                              type="text"
                              placeholder="glitch_wizard"
                              value={profile.username}
                              onChange={(e) =>
                                setProfile({
                                  ...profile,
                                  username: e.target.value,
                                })
                              }
                              className="w-full bg-[#08080f] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF00C8]/50 transition"
                            />
                          </div>
                          <p className="text-[10px] text-white/20 mt-1 pl-1">
                            This is how you'll appear to others
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 1: Bio ── */}
                    {step === 1 && (
                      <div className="space-y-4 h-full">
                        <div
                          className="rounded-xl p-4 mb-1"
                          style={{
                            background: "rgba(255,0,200,0.05)",
                            border: "1px solid rgba(255,0,200,0.12)",
                          }}
                        >
                          <p className="text-xs text-white/40 leading-relaxed">
                            ✨ Tell the Glitch Room community who you are.
                            What's your story? What drives your creativity?
                          </p>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest block mb-1.5">
                            Bio
                          </label>
                          <div className="relative">
                            <FiFileText
                              size={13}
                              className="absolute left-3 top-3.5 text-white/25"
                            />
                            <textarea
                              placeholder="I'm a developer who loves breaking things to understand how they work…"
                              value={profile.bio}
                              onChange={(e) =>
                                setProfile({ ...profile, bio: e.target.value })
                              }
                              rows={9}
                              maxLength={500}
                              className="w-full bg-[#08080f] border border-white/10 rounded-lg pl-9 pr-3 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF00C8]/50 transition resize-none"
                            />
                          </div>
                          <p className="text-[10px] text-white/20 pl-1 text-right mt-0.5">
                            {profile.bio.length}/500
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 2: Interests & Hobbies ── */}
                    {step === 2 && (
                      <div className="space-y-6 h-full">
                        {/* Interests */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
                            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
                              Interests
                            </label>
                          </div>
                          <TagInput
                            value={interestInput}
                            onChange={setInterestInput}
                            onAdd={addInterest}
                            placeholder="e.g. Machine Learning, Web3…"
                            color="cyan"
                            disabled={profile.interests.length >= MAX_TAGS}
                          />
                          {profile.interests.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {profile.interests.map((item, i) => (
                                <Chip
                                  key={i}
                                  label={item}
                                  onRemove={() => removeInterest(i)}
                                  color="cyan"
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Hobbies */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FF00C8]" />
                            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
                              Hobbies
                            </label>
                          </div>
                          <TagInput
                            value={hobbyInput}
                            onChange={setHobbyInput}
                            onAdd={addHobby}
                            placeholder="e.g. Gaming, Photography…"
                            color="pink"
                            disabled={profile.hobbies.length >= MAX_TAGS}
                          />
                          {profile.hobbies.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {profile.hobbies.map((item, i) => (
                                <Chip
                                  key={i}
                                  label={item}
                                  onRemove={() => removeHobby(i)}
                                  color="pink"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── STEP 3: Social Links ── */}
                    {step === 3 && (
                      <div className="space-y-4 h-full">
                        <SocialRow
                          icon={FiGithub}
                          label="GitHub"
                          placeholder="https://github.com/yourusername"
                          value={profile.github_url}
                          onChange={(v) =>
                            setProfile({ ...profile, github_url: v })
                          }
                          accentColor="#e2e8f0"
                        />
                        <SocialRow
                          icon={FiLinkedin}
                          label="LinkedIn"
                          placeholder="https://linkedin.com/in/yourusername"
                          value={profile.linkedin_url}
                          onChange={(v) =>
                            setProfile({ ...profile, linkedin_url: v })
                          }
                          accentColor="#0A66C2"
                        />
                        <SocialRow
                          icon={FaTwitter}
                          label="Twitter / X"
                          placeholder="https://twitter.com/yourusername"
                          value={profile.twitter_url}
                          onChange={(v) =>
                            setProfile({ ...profile, twitter_url: v })
                          }
                          accentColor="#1DA1F2"
                        />
                        <SocialRow
                          icon={FaDiscord}
                          label="Discord"
                          placeholder="https://discord.com/users/yourid"
                          value={profile.discord_url}
                          onChange={(v) =>
                            setProfile({ ...profile, discord_url: v })
                          }
                          accentColor="#5865F2"
                        />

                        {/* Preview row */}
                        {(profile.github_url ||
                          profile.linkedin_url ||
                          profile.twitter_url ||
                          profile.discord_url) && (
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="pt-2 border-t border-white/5"
                          >
                            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">
                              Will appear on your profile as:
                            </p>
                            <div className="flex gap-3 flex-wrap">
                              {profile.github_url && (
                                <a
                                  href={profile.github_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition hover:scale-105"
                                  style={{
                                    background: "rgba(226,232,240,0.08)",
                                    border: "1px solid rgba(226,232,240,0.15)",
                                    color: "#e2e8f0",
                                  }}
                                >
                                  <FiGithub size={13} /> GitHub
                                </a>
                              )}
                              {profile.linkedin_url && (
                                <a
                                  href={profile.linkedin_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition hover:scale-105"
                                  style={{
                                    background: "rgba(10,102,194,0.12)",
                                    border: "1px solid rgba(10,102,194,0.3)",
                                    color: "#0A66C2",
                                  }}
                                >
                                  <FiLinkedin size={13} /> LinkedIn
                                </a>
                              )}
                              {profile.twitter_url && (
                                <a
                                  href={profile.twitter_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition hover:scale-105"
                                  style={{
                                    background: "rgba(29,161,242,0.1)",
                                    border: "1px solid rgba(29,161,242,0.25)",
                                    color: "#1DA1F2",
                                  }}
                                >
                                  <FaTwitter size={12} /> Twitter
                                </a>
                              )}
                              {profile.discord_url && (
                                <a
                                  href={profile.discord_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition hover:scale-105"
                                  style={{
                                    background: "rgba(88,101,242,0.12)",
                                    border: "1px solid rgba(88,101,242,0.3)",
                                    color: "#5865F2",
                                  }}
                                >
                                  <FaDiscord size={12} /> Discord
                                </a>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* ── Save error banner ── */}
                {saveError && (
                  <div className="mt-5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {saveError}
                  </div>
                )}

                {/* ── Nav buttons ── */}
                <div className="flex items-center justify-between mt-8 pt-5 border-t border-white/5">
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    disabled={step === 0}
                    className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white/70 transition disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
                  >
                    <FiChevronLeft size={15} /> Back
                  </button>

                  <div className="flex items-center gap-3">
                    {step === STEPS.length - 1 && (
                      <button
                        onClick={handleSkip}
                        disabled={saving}
                        className="text-xs text-white/25 hover:text-white/50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {saving ? "Saving…" : "Skip links"}
                      </button>
                    )}

                    {step < STEPS.length - 1 ? (
                      <motion.button
                        onClick={() => setStep((s) => s + 1)}
                        disabled={!canNext()}
                        whileHover={{ scale: canNext() ? 1.03 : 1 }}
                        whileTap={{ scale: canNext() ? 0.97 : 1 }}
                        className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        style={{
                          background: "linear-gradient(90deg,#FF00C8,#00F0FF)",
                          boxShadow: canNext()
                            ? "0 0 18px rgba(255,0,200,0.3)"
                            : "none",
                        }}
                      >
                        Continue <FiChevronRight size={15} />
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={saveProfile}
                        disabled={saving || saved}
                        whileHover={{ scale: saving || saved ? 1 : 1.03 }}
                        whileTap={{ scale: saving || saved ? 1 : 0.97 }}
                        className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 cursor-pointer"
                        style={{
                          background: "linear-gradient(90deg,#FF00C8,#00F0FF)",
                          boxShadow: "0 0 18px rgba(255,0,200,0.3)",
                        }}
                      >
                        {saved ? (
                          <>
                            <FiCheck size={14} /> Saved!
                          </>
                        ) : saving ? (
                          <>
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.8,
                                ease: "linear",
                              }}
                              className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Saving…
                          </>
                        ) : (
                          <>
                            <FiCheck size={14} /> Finish Profile
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Skip all */}
        <button
          onClick={handleSkip}
          disabled={saving}
          className="mt-5 text-xs text-white/20 hover:text-white/40 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Skip for now"}
        </button>
      </section>

      <Footer />
    </div>
  );
};

export default CreateProfile;
