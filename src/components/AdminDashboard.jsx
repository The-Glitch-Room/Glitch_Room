import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  Database,
  Zap,
  Swords,
  AlertCircle,
  ChevronDown,
  ArrowLeft,
  Home,
} from "lucide-react";
import { supabase } from "../supabaseClient";

// JSON sources used only by the one-time migration tool below
import glitchesJson from "../data/glitches.json";
import aiJson from "../data/ai_challenges.json";
import debugJson from "../data/debug_mode_challenges.json";
import sparkJson from "../data/creative_sparks_challenges.json";
import { FEATURED_ARENA_EVENTS } from "../data/arenaEventsData";

const CHALLENGE_TYPES = [
  { value: "glitch", label: "Glitches", color: "#00F0FF" },
  { value: "bug", label: "Debug Mode", color: "#FF6B00" },
  { value: "ai", label: "AI Powered", color: "#FF00C8" },
  { value: "spark", label: "Creative Sparks", color: "#A855F7" },
  // For content that should ONLY ever exist via Explore's dynamic
  // sections, not on any of the 4 library pages above. To instead REUSE
  // an existing glitch/bug/ai/spark challenge in Explore, just edit that
  // challenge directly and set its Explore Placement below — don't
  // create a duplicate here.
  { value: "explore_original", label: "Explore Exclusive", color: "#10B981" },
];

const EXPLORE_SECTIONS = [
  { value: "", label: "Not placed in Explore" },
  { value: "daily", label: "Daily Glitches" },
  { value: "weekly", label: "Weekly Glitches" },
  { value: "battle", label: "Live / Upcoming Battles" },
];

// Local-only helpers for the datetime-local <input>, which needs
// "YYYY-MM-DDTHH:mm" and can't read/write a Postgres timestamptz string
// directly.
const toDatetimeLocal = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromDatetimeLocal = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const JSON_SOURCES = {
  glitch: glitchesJson,
  bug: debugJson,
  ai: aiJson,
  spark: sparkJson,
};

const DIFFICULTIES = ["Easy", "Medium", "Hard", "Expert"];

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a12] border border-white/8 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-500/40 transition";

const labelClass =
  "text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block";

const emptyChallengeForm = {
  title: "",
  description: "",
  category: "",
  difficulty: "Medium",
  points: 50,
  code: "",
  hint: "",
  solution: "",
  prompt: "",
  explore_section: "",
  start_time: "",
  end_time: "",
  is_featured: false,
};

const emptyEventForm = {
  title: "",
  description: "",
  hosted_by: "",
  skills: "",
  glitch_scenario: "",
  is_live: true,
};

// ── Custom Cyberpunk Select Dropdown Component ─────────────────────────────
const CustomSelect = ({ options, value, onChange, placeholder = "Select option" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={ref} className="relative z-30 mb-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a12] border border-white/10 hover:border-cyan-500/40 text-white text-sm flex items-center justify-between transition cursor-pointer select-none"
        style={{
          borderColor: open ? "#00F0FF" : undefined,
          boxShadow: open ? "0 0 15px rgba(0, 240, 255, 0.2)" : "none",
        }}
      >
        <span className={selectedOption?.value ? "text-white font-medium" : "text-gray-400"}>
          {selectedOption?.label || placeholder}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-cyan-400 opacity-80" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl bg-[#0d0d16] border border-cyan-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_15px_rgba(0,240,255,0.1)] overflow-hidden py-1"
          >
            <div className="max-h-56 overflow-y-auto custom-scrollbar">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition cursor-pointer"
                    style={{
                      background: isSelected ? "rgba(0, 240, 255, 0.12)" : "transparent",
                      color: isSelected ? "#00F0FF" : "rgba(255, 255, 255, 0.8)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span className="font-semibold">{opt.label}</span>
                    {isSelected && <Check size={14} className="text-[#00F0FF]" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Small shared bits ──────────────────────────────────────────────────────
const Banner = ({ type, message }) => {
  if (!message) return null;
  const isError = type === "error";
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm mb-4"
      style={{
        background: isError ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
        border: `1px solid ${isError ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.25)"}`,
        color: isError ? "#ef4444" : "#22c55e",
      }}
    >
      {isError ? <AlertCircle size={14} /> : <Check size={14} />}
      {message}
    </motion.div>
  );
};

// ── Challenges tab ────────────────────────────────────────────────────────
const ChallengesTab = () => {
  const [type, setType] = useState("glitch");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyChallengeForm);
  const [editingId, setEditingId] = useState(null); // null = not editing, "new" = creating
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState({ type: "", message: "" });

  const activeType = CHALLENGE_TYPES.find((t) => t.value === type);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("type", type)
      .order("id", { ascending: true });
    if (!error) setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
    setEditingId(null);
    setForm(emptyChallengeForm);
  }, [type]);

  const openNew = () => {
    setForm(emptyChallengeForm);
    setEditingId("new");
  };

  const openEdit = (item) => {
    setForm({
      title: item.title || "",
      description: item.description || "",
      category: item.category || "",
      difficulty: item.difficulty || "Medium",
      points:
        item.points ||
        (item.difficulty === "Easy"
          ? 25
          : item.difficulty === "Hard"
            ? 75
            : item.difficulty === "Expert"
              ? 90
              : 50),
      code: item.code || "",
      hint: item.hint || "",
      solution: item.solution || "",
      prompt: item.prompt || "",
      explore_section: item.explore_section || "",
      start_time: toDatetimeLocal(item.start_time),
      end_time: toDatetimeLocal(item.end_time),
      is_featured: !!item.is_featured,
    });
    setEditingId(item.id);
  };

  const closeForm = () => {
    setEditingId(null);
    setForm(emptyChallengeForm);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setBanner({ type: "error", message: "Title is required." });
      return;
    }

    const startIso = fromDatetimeLocal(form.start_time);
    const endIso = fromDatetimeLocal(form.end_time);

    if (startIso && endIso && new Date(endIso) <= new Date(startIso)) {
      setBanner({
        type: "error",
        message: "End time must be after start time.",
      });
      return;
    }

    setSaving(true);
    setBanner({ type: "", message: "" });

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      difficulty: form.difficulty,
      points: Math.min(Math.max(parseInt(form.points || 50, 10), 10), 100),
      code: form.code ? form.code.trim() : null,
      hint: form.hint ? form.hint.trim() : null,
      solution: form.solution ? form.solution.trim() : null,
      prompt: form.prompt ? form.prompt.trim() : null,
      explore_section: form.explore_section || null,
      start_time: startIso,
      end_time: endIso,
      is_featured: !!form.is_featured,
    };

    if (editingId === "new") {
      // Compute next id scoped to this type
      const { data: maxRow } = await supabase
        .from("challenges")
        .select("id")
        .eq("type", type)
        .order("id", { ascending: false })
        .limit(1);
      const nextId = maxRow && maxRow.length ? maxRow[0].id + 1 : 1;

      const { error } = await supabase
        .from("challenges")
        .insert({ id: nextId, type, ...payload });

      if (error) {
        setBanner({ type: "error", message: error.message });
      } else {
        setBanner({
          type: "success",
          message: `Created challenge #${nextId}.`,
        });
        closeForm();
        fetchItems();
      }
    } else {
      const { error } = await supabase
        .from("challenges")
        .update(payload)
        .eq("type", type)
        .eq("id", editingId);

      if (error) {
        setBanner({ type: "error", message: error.message });
      } else {
        setBanner({ type: "success", message: "Challenge updated." });
        closeForm();
        fetchItems();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm(`Delete challenge #${id}? This can't be undone.`)) return;
    const { error } = await supabase
      .from("challenges")
      .delete()
      .eq("type", type)
      .eq("id", id);
    if (error) {
      setBanner({ type: "error", message: error.message });
    } else {
      setBanner({ type: "success", message: `Deleted challenge #${id}.` });
      fetchItems();
    }
  };

  return (
    <div>
      {/* Type switcher */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CHALLENGE_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className="px-4 py-2 rounded-xl text-sm font-semibold border transition cursor-pointer"
            style={
              type === t.value
                ? {
                    background: `${t.color}18`,
                    borderColor: `${t.color}45`,
                    color: t.color,
                  }
                : {
                    background: "transparent",
                    borderColor: "rgba(255,255,255,0.08)",
                    color: "#6b7280",
                  }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <Banner type={banner.type} message={banner.message} />

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {items.length} {activeType.label.toLowerCase()} challenge
          {items.length !== 1 ? "s" : ""}
        </p>
        {editingId === null && (
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white cursor-pointer"
            style={{ background: "linear-gradient(90deg,#00F0FF,#FF00C8)" }}
          >
            <Plus size={14} /> New Challenge
          </button>
        )}
      </div>

      {/* Form */}
      <AnimatePresence>
        {editingId !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-[#0f0f13] border border-white/8 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-white">
                  {editingId === "new"
                    ? `New ${activeType.label} Challenge`
                    : `Edit Challenge #${editingId}`}
                </p>
                <button
                  onClick={closeForm}
                  className="text-gray-500 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={labelClass}>Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className={inputClass}
                    placeholder="e.g. Broken CSS Layout"
                  />
                </div>
                <div>
                  <label className={labelClass}>Category</label>
                  <input
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className={inputClass}
                    placeholder="e.g. Web Dev, Machine Learning..."
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className={labelClass}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  className={`${inputClass} resize-none`}
                  placeholder="What's the scenario or problem?"
                />
              </div>

              <div className="mb-4">
                <label className={labelClass}>Difficulty</label>
                <div className="flex gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          difficulty: d,
                          points:
                            d === "Easy"
                              ? 25
                              : d === "Hard"
                                ? 75
                                : d === "Expert"
                                  ? 90
                                  : 50,
                        })
                      }
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer"
                      style={
                        form.difficulty === d
                          ? {
                              background: "rgba(0,240,255,0.12)",
                              borderColor: "rgba(0,240,255,0.35)",
                              color: "#00F0FF",
                            }
                          : {
                              background: "transparent",
                              borderColor: "rgba(255,255,255,0.08)",
                              color: "#6b7280",
                            }
                      }
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className={labelClass}>
                  gBits Reward (10 to 100 gBits)
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={form.points || 50}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      points: Math.min(
                        100,
                        Math.max(10, parseInt(e.target.value || "0", 10)),
                      ),
                    })
                  }
                  className={inputClass}
                  placeholder="Points reward (Easy: 25, Medium: 50, Hard: 75, Expert: 90)"
                />
              </div>

              <div className="mb-4 p-4 rounded-xl bg-white/[0.03] border border-white/8">
                <p className="text-xs font-bold text-gray-300 mb-1">
                  Explore Placement
                </p>
                <p className="text-[10px] text-gray-600 mb-3">
                  Optional — shows this exact challenge (not a copy) in one of
                  Explore's dynamic sections too, in addition to its normal{" "}
                  {CHALLENGE_TYPES.find((t) => t.value === type)?.label ||
                    "page"}{" "}
                  listing.
                </p>

                <label className={labelClass}>Section</label>
                <CustomSelect
                  options={EXPLORE_SECTIONS}
                  value={form.explore_section}
                  onChange={(val) =>
                    setForm({ ...form, explore_section: val })
                  }
                />

                {form.explore_section && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className={labelClass}>Start Time</label>
                        <input
                          type="datetime-local"
                          value={form.start_time}
                          onChange={(e) =>
                            setForm({ ...form, start_time: e.target.value })
                          }
                          className={inputClass}
                        />
                        <p className="text-[10px] text-gray-600 mt-1">
                          {form.explore_section === "battle"
                            ? "Before this time it shows under Upcoming."
                            : "When this active window opens."}{" "}
                          Leave blank to make it active immediately.
                        </p>
                      </div>
                      <div>
                        <label className={labelClass}>End Time</label>
                        <input
                          type="datetime-local"
                          value={form.end_time}
                          onChange={(e) =>
                            setForm({ ...form, end_time: e.target.value })
                          }
                          className={inputClass}
                        />
                        <p className="text-[10px] text-gray-600 mt-1">
                          {form.explore_section === "battle"
                            ? "Between Start and End it shows under Live. "
                            : ""}
                          Once this passes, it automatically moves to Past
                          Challenges & Vault Archive. Leave blank to never
                          expire.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) =>
                      setForm({ ...form, is_featured: e.target.checked })
                    }
                    className="w-4 h-4 rounded accent-purple-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-gray-300">
                    Mark as Featured / Editor's Choice
                  </span>
                </label>
                <p className="text-[10px] text-gray-600 mt-1 ml-6">
                  Independent of Section above — can be featured with or without
                  also being placed in Daily/Weekly/Battle. Won't show as
                  Featured once its End Time (if any) has passed.
                </p>
              </div>

              {type !== "spark" && (
                <div className="mb-4">
                  <label className={labelClass}>Code (optional)</label>
                  <textarea
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    rows={5}
                    className={`${inputClass} resize-none font-mono text-xs`}
                    placeholder="Paste the buggy / example code here..."
                  />
                </div>
              )}

              {type === "spark" && (
                <div className="mb-4">
                  <label className={labelClass}>Prompt (optional)</label>
                  <textarea
                    value={form.prompt}
                    onChange={(e) =>
                      setForm({ ...form, prompt: e.target.value })
                    }
                    rows={3}
                    className={`${inputClass} resize-none`}
                    placeholder="Extra creative direction shown below the description..."
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className={labelClass}>Hint (optional)</label>
                  <textarea
                    value={form.hint}
                    onChange={(e) => setForm({ ...form, hint: e.target.value })}
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Solution (optional)</label>
                  <textarea
                    value={form.solution}
                    onChange={(e) =>
                      setForm({ ...form, solution: e.target.value })
                    }
                    rows={3}
                    className={`${inputClass} resize-none font-mono text-xs`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeForm}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 cursor-pointer"
                  style={{
                    background: "linear-gradient(90deg,#00F0FF,#FF00C8)",
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving...
                    </>
                  ) : editingId === "new" ? (
                    "Create Challenge"
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <p className="text-gray-500 text-sm">
            No {activeType.label.toLowerCase()} challenges yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-[#0f0f13] border border-white/5"
            >
              <span className="text-xs font-bold text-gray-600 w-8 shrink-0">
                #{item.id}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white text-sm font-semibold truncate">
                    {item.title}
                  </p>
                  {item.explore_section &&
                    (() => {
                      const now = new Date();
                      const start = item.start_time
                        ? new Date(item.start_time)
                        : null;
                      const end = item.end_time
                        ? new Date(item.end_time)
                        : null;
                      const isPast = end && end < now;
                      const isUpcoming = start && start > now;
                      const label = isPast
                        ? "Ended"
                        : isUpcoming
                          ? "Upcoming"
                          : "Active";
                      const color = isPast
                        ? "#6b7280"
                        : isUpcoming
                          ? "#38BDF8"
                          : "#22c55e";
                      const sectionLabel = EXPLORE_SECTIONS.find(
                        (s) => s.value === item.explore_section,
                      )?.label;
                      return (
                        <span
                          className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0"
                          style={{
                            color,
                            borderColor: `${color}40`,
                            background: `${color}15`,
                          }}
                          title={sectionLabel}
                        >
                          {label} · {sectionLabel}
                        </span>
                      );
                    })()}
                  {item.is_featured && (
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-purple-500/40 bg-purple-500/15 text-purple-300 shrink-0">
                      ★ Featured
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-xs truncate">
                  {item.category || "Uncategorized"} · {item.difficulty}
                </p>
              </div>
              <button
                onClick={() => openEdit(item)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition cursor-pointer shrink-0"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="w-8 h-8 rounded-lg bg-red-500/8 hover:bg-red-500/15 flex items-center justify-center text-red-400 transition cursor-pointer shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Arena Events tab ──────────────────────────────────────────────────────
const ArenaEventsTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyEventForm);
  const [editingId, setEditingId] = useState(null); // null | "new" | uuid
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState({ type: "", message: "" });

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("arena_events")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openNew = () => {
    setForm(emptyEventForm);
    setEditingId("new");
  };

  const openEdit = (item) => {
    setForm({
      title: item.title || "",
      description: item.description || "",
      hosted_by: item.hosted_by || "",
      skills: (item.skills || []).join(", "),
      glitch_scenario: item.glitch_scenario || "",
      is_live: item.is_live ?? true,
    });
    setEditingId(item.id);
  };

  const closeForm = () => {
    setEditingId(null);
    setForm(emptyEventForm);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setBanner({ type: "error", message: "Title is required." });
      return;
    }
    setSaving(true);
    setBanner({ type: "", message: "" });

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      hosted_by: form.hosted_by.trim(),
      skills: form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      glitch_scenario: form.glitch_scenario.trim() || null,
      is_live: form.is_live,
    };

    if (editingId === "new") {
      const { error } = await supabase.from("arena_events").insert(payload);
      if (error) {
        setBanner({ type: "error", message: error.message });
      } else {
        setBanner({ type: "success", message: "Arena event created." });
        closeForm();
        fetchItems();
      }
    } else {
      const { error } = await supabase
        .from("arena_events")
        .update(payload)
        .eq("id", editingId);
      if (error) {
        setBanner({ type: "error", message: error.message });
      } else {
        setBanner({ type: "success", message: "Arena event updated." });
        closeForm();
        fetchItems();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this arena event? This can't be undone.")) return;
    const { error } = await supabase.from("arena_events").delete().eq("id", id);
    if (error) {
      setBanner({ type: "error", message: error.message });
    } else {
      setBanner({ type: "success", message: "Arena event deleted." });
      fetchItems();
    }
  };

  const toggleLive = async (item) => {
    await supabase
      .from("arena_events")
      .update({ is_live: !item.is_live })
      .eq("id", item.id);
    fetchItems();
  };

  return (
    <div>
      <Banner type={banner.type} message={banner.message} />

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {items.length} arena event{items.length !== 1 ? "s" : ""}
        </p>
        {editingId === null && (
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white cursor-pointer"
            style={{ background: "linear-gradient(90deg,#00F0FF,#FF00C8)" }}
          >
            <Plus size={14} /> New Arena Event
          </button>
        )}
      </div>

      <AnimatePresence>
        {editingId !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-[#0f0f13] border border-white/8 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-white">
                  {editingId === "new" ? "New Arena Event" : "Edit Arena Event"}
                </p>
                <button
                  onClick={closeForm}
                  className="text-gray-500 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={labelClass}>Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className={inputClass}
                    placeholder="e.g. Recommendation Engine Meltdown"
                  />
                </div>
                <div>
                  <label className={labelClass}>Hosted By</label>
                  <input
                    value={form.hosted_by}
                    onChange={(e) =>
                      setForm({ ...form, hosted_by: e.target.value })
                    }
                    className={inputClass}
                    placeholder="e.g. Glitch Room Team"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className={labelClass}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  className={`${inputClass} resize-none`}
                  placeholder="Shown on the event card"
                />
              </div>

              <div className="mb-4">
                <label className={labelClass}>
                  Stage 1 Scenario (Find the Glitch)
                </label>
                <textarea
                  value={form.glitch_scenario}
                  onChange={(e) =>
                    setForm({ ...form, glitch_scenario: e.target.value })
                  }
                  rows={3}
                  className={`${inputClass} resize-none`}
                  placeholder="The scenario shown to players in Stage 1..."
                />
              </div>

              <div className="mb-5">
                <label className={labelClass}>Skills (comma-separated)</label>
                <input
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  className={inputClass}
                  placeholder="React, Debugging, System Design"
                />
              </div>

              <label className="flex items-center gap-2.5 mb-5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_live}
                  onChange={(e) =>
                    setForm({ ...form, is_live: e.target.checked })
                  }
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
                <span className="text-sm text-gray-300">
                  Live (visible on Arena Events page)
                </span>
              </label>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeForm}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 cursor-pointer"
                  style={{
                    background: "linear-gradient(90deg,#00F0FF,#FF00C8)",
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving...
                    </>
                  ) : editingId === "new" ? (
                    "Create Event"
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <p className="text-gray-500 text-sm">No arena events yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-[#0f0f13] border border-white/5"
            >
              <button
                onClick={() => toggleLive(item)}
                className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full border cursor-pointer transition"
                style={
                  item.is_live
                    ? {
                        background: "rgba(34,197,94,0.1)",
                        borderColor: "rgba(34,197,94,0.3)",
                        color: "#22c55e",
                      }
                    : {
                        background: "rgba(255,255,255,0.04)",
                        borderColor: "rgba(255,255,255,0.1)",
                        color: "#6b7280",
                      }
                }
              >
                {item.is_live ? "● LIVE" : "○ DRAFT"}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {item.title}
                </p>
                <p className="text-gray-600 text-xs truncate">
                  Hosted by {item.hosted_by || "Unknown"}
                </p>
              </div>
              <button
                onClick={() => openEdit(item)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition cursor-pointer shrink-0"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="w-8 h-8 rounded-lg bg-red-500/8 hover:bg-red-500/15 flex items-center justify-center text-red-400 transition cursor-pointer shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Migration tab ─────────────────────────────────────────────────────────
const MigrationTab = () => {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState([]);
  const [counts, setCounts] = useState(null);

  const fetchCounts = async () => {
    const results = {};
    for (const type of Object.keys(JSON_SOURCES)) {
      const { count } = await supabase
        .from("challenges")
        .select("*", { count: "exact", head: true })
        .eq("type", type);
      results[type] = count || 0;
    }
    setCounts(results);
  };

  const [arenaSyncing, setArenaSyncing] = useState(false);
  const [arenaCount, setArenaCount] = useState(0);

  const fetchArenaCount = async () => {
    const { count } = await supabase
      .from("arena_events")
      .select("*", { count: "exact", head: true });
    setArenaCount(count || 0);
  };

  useEffect(() => {
    fetchCounts();
    fetchArenaCount();
  }, []);

  const syncArenaEvents = async () => {
    setArenaSyncing(true);
    const rows = FEATURED_ARENA_EVENTS.map((ev) => ({
      title: ev.title,
      description: ev.description,
      hosted_by: "Glitch Room Team",
      skills: ev.skills,
      glitch_scenario: ev.glitch_scenario,
      is_live: true,
    }));

    const { error } = await supabase
      .from("arena_events")
      .upsert(rows, { onConflict: "title" });
    if (error) {
      alert("Failed to sync arena events: " + error.message);
    } else {
      alert(`Successfully synced ${rows.length} Arena Events to Database!`);
    }
    await fetchArenaCount();
    setArenaSyncing(false);
  };

  const runMigration = async () => {
    setRunning(true);
    const entries = [];

    for (const [type, items] of Object.entries(JSON_SOURCES)) {
      const { count } = await supabase
        .from("challenges")
        .select("*", { count: "exact", head: true })
        .eq("type", type);

      if (count > 0) {
        entries.push({
          type,
          status: "skipped",
          message: `Already has ${count} rows in the database — skipped.`,
        });
        continue;
      }

      const rows = items.map((item) => ({
        id: item.id,
        type,
        title: item.title,
        description: item.description || "",
        category: item.category || "",
        difficulty: item.difficulty || item.level || "Easy",
        code: item.code || null,
        hint: item.hint || null,
        solution: item.solution || null,
        prompt: item.prompt || null,
      }));

      const { error } = await supabase.from("challenges").insert(rows);

      entries.push({
        type,
        status: error ? "error" : "success",
        message: error
          ? `Failed: ${error.message}`
          : `Migrated ${rows.length} challenges.`,
      });
    }

    setLog(entries);
    await fetchCounts();
    setRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* ── Arena Events Sync Card ── */}
      <div className="bg-[#0f0f13] border border-cyan-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center">
            <Swords size={16} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">
              Sync 25 Arena Events to Database (`arena_events` Table)
            </p>
            <p className="text-gray-500 text-xs">
              Uploads all 25 challenges directly into Supabase so database counts & hero stats track all challenges.
            </p>
          </div>
        </div>

        <div className="my-4 p-3 rounded-xl bg-white/[0.03] border border-white/8 inline-block">
          <p className="text-xs text-gray-400">
            Current DB Arena Events Count:{" "}
            <span className="text-[#00F0FF] font-black text-sm">{arenaCount}</span>
          </p>
        </div>

        <div>
          <button
            onClick={syncArenaEvents}
            disabled={arenaSyncing}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-black disabled:opacity-60 cursor-pointer"
            style={{ background: "linear-gradient(90deg,#00F0FF,#FF00C8)" }}
          >
            {arenaSyncing ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Syncing Arena Events...
              </>
            ) : (
              <>
                <Swords size={14} /> Sync 25 Arena Events to Database
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-[#0f0f13] border border-white/8 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center">
            <Database size={16} className="text-purple-400" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">
              Migrate JSON Challenges to Supabase
            </p>
            <p className="text-gray-500 text-xs">
              One-time import of your existing glitches, debug, AI, and creative
              spark challenge files into the database.
            </p>
          </div>
        </div>

        {counts && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
            {CHALLENGE_TYPES.map((t) => (
              <div
                key={t.value}
                className="rounded-xl p-3 text-center"
                style={{
                  background: `${t.color}0d`,
                  border: `1px solid ${t.color}25`,
                }}
              >
                <p className="text-xl font-black" style={{ color: t.color }}>
                  {counts[t.value]}
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                  {t.label}
                </p>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={runMigration}
          disabled={running}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 cursor-pointer"
          style={{ background: "linear-gradient(90deg,#a855f7,#FF00C8)" }}
        >
          {running ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Migrating...
            </>
          ) : (
            <>
              <Database size={14} /> Run Migration
            </>
          )}
        </button>

        <p className="text-gray-600 text-[11px] mt-3">
          Safe to click multiple times — any type that already has rows in the
          database is automatically skipped.
        </p>
      </div>

      {log.length > 0 && (
        <div className="bg-[#0f0f13] border border-white/8 rounded-2xl p-5 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Migration Log
          </p>
          {log.map((entry, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 text-sm px-3 py-2 rounded-lg"
              style={{
                background:
                  entry.status === "error"
                    ? "rgba(239,68,68,0.06)"
                    : entry.status === "skipped"
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(34,197,94,0.06)",
              }}
            >
              <span
                className="font-bold uppercase text-[10px] tracking-wider mt-0.5"
                style={{
                  color:
                    entry.status === "error"
                      ? "#ef4444"
                      : entry.status === "skipped"
                        ? "#6b7280"
                        : "#22c55e",
                }}
              >
                {entry.type}
              </span>
              <span className="text-gray-400">{entry.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Admin Dashboard ──────────────────────────────────────────────────
const AdminDashboard = () => {
  const [tab, setTab] = useState("challenges"); // challenges | arena | migrate

  const tabs = [
    { id: "challenges", label: "Challenges", icon: <Zap size={14} /> },
    { id: "arena", label: "Arena Events", icon: <Swords size={14} /> },
    { id: "migrate", label: "Migration", icon: <Database size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col">
      <main className="max-w-5xl mx-auto w-full px-6 py-8 md:py-12 flex-1">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 text-gray-300 hover:text-white text-sm font-semibold transition cursor-pointer group shadow-lg"
          >
            <ArrowLeft size={16} className="text-cyan-400 transition-transform group-hover:-translate-x-1" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ADMIN PORTAL</span>
          </div>
        </div>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 mb-3 text-[10px] font-bold tracking-widest uppercase bg-purple-500/10 border border-purple-500/25 rounded-full text-purple-400">
            🔐 Admin Only
          </span>
          <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage challenges and arena events for The Glitch Room.
          </p>
        </div>

        <div className="flex gap-2 mb-8 border-b border-white/5 pb-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer"
              style={
                tab === t.id
                  ? {
                      background: "rgba(0,240,255,0.1)",
                      border: "1px solid rgba(0,240,255,0.3)",
                      color: "#00F0FF",
                    }
                  : {
                      background: "transparent",
                      border: "1px solid transparent",
                      color: "#6b7280",
                    }
              }
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === "challenges" && <ChallengesTab />}
        {tab === "arena" && <ArenaEventsTab />}
        {tab === "migrate" && <MigrationTab />}
      </main>
    </div>
  );
};

export default AdminDashboard;
