import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { supabase } from "../supabaseClient";
import Navbar from "./Navbar";
import Footer from "./Footer";

// JSON sources used only by the one-time migration tool below
import glitchesJson from "../data/glitches.json";
import aiJson from "../data/ai_challenges.json";
import debugJson from "../data/debug_mode_challenges.json";
import sparkJson from "../data/creative_sparks_challenges.json";

const CHALLENGE_TYPES = [
  { value: "glitch", label: "Glitches", color: "#00F0FF" },
  { value: "bug", label: "Debug Mode", color: "#FF6B00" },
  { value: "ai", label: "AI Powered", color: "#FF00C8" },
  { value: "spark", label: "Creative Sparks", color: "#A855F7" },
  { value: "explore_daily", label: "Explore: Daily Glitch", color: "#FF00C8" },
  { value: "explore_weekly", label: "Explore: Weekly Challenge", color: "#00F0FF" },
  { value: "explore_flash", label: "Explore: Flash Event", color: "#F59E0B" },
  { value: "explore_live", label: "Explore: Live Battle", color: "#EF4444" },
  { value: "explore_upcoming", label: "Explore: Upcoming Battle", color: "#38BDF8" },
  { value: "explore_featured", label: "Explore: Featured Pick", color: "#A855F7" },
  { value: "explore_archived", label: "Explore: Archived Vault", color: "#10B981" },
];

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
};

const emptyEventForm = {
  title: "",
  description: "",
  hosted_by: "",
  skills: "",
  glitch_scenario: "",
  is_live: true,
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
      points: item.points || (item.difficulty === "Easy" ? 25 : item.difficulty === "Hard" ? 75 : item.difficulty === "Expert" ? 90 : 50),
      code: item.code || "",
      hint: item.hint || "",
      solution: item.solution || "",
      prompt: item.prompt || "",
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
                          points: d === "Easy" ? 25 : d === "Hard" ? 75 : d === "Expert" ? 90 : 50,
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
                <label className={labelClass}>gBits Reward (10 to 100 gBits)</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={form.points || 50}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      points: Math.min(100, Math.max(10, parseInt(e.target.value || "0", 10))),
                    })
                  }
                  className={inputClass}
                  placeholder="Points reward (Easy: 25, Medium: 50, Hard: 75, Expert: 90)"
                />
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
                <p className="text-white text-sm font-semibold truncate">
                  {item.title}
                </p>
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

  useEffect(() => {
    fetchCounts();
  }, []);

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
    <div>
      <div className="bg-[#0f0f13] border border-white/8 rounded-2xl p-6 mb-6">
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
      <Navbar />

      <main className="max-w-5xl mx-auto w-full px-6 py-28 flex-1">
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

      <Footer />
    </div>
  );
};

export default AdminDashboard;
