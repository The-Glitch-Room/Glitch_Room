import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import {
  FiEdit2,
  FiX,
  FiUpload,
  FiGrid,
  FiAward,
  FiCode,
  FiMessageSquare,
  FiImage,
} from "react-icons/fi";
import { FaGithub, FaTwitter, FaDiscord, FaLinkedin } from "react-icons/fa";
import { Zap, Trophy, Shield, Sparkles, ArrowRight } from "lucide-react";
import Navbar from "./Navbar";
import SharedSidebar from "./SharedSidebar";
import Footer from "./Footer";
import { getLevelFromXP } from "../utils/pointsHelper";

// ── Preset Banners Config ───────────────────────────────────────────────────
const PRESET_BANNERS = [
  { id: "default", name: "Default Glitch Wave", url: "" },
  {
    id: "cyberpunk",
    name: "Cyber Grid",
    url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "matrix",
    name: "Matrix Synthwave",
    url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "quantum",
    name: "Quantum Nebula",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  },
];

// ── Social Platforms Config ─────────────────────────────────────────────────
const SOCIAL_PLATFORMS = [
  {
    field: "github_url",
    label: "GitHub",
    icon: FaGithub,
    accent: "#9ca3af",
    brandBg: "#24292F",
    brandFg: "#ffffff",
  },
  {
    field: "twitter_url",
    label: "Twitter",
    icon: FaTwitter,
    accent: "#38bdf8",
    brandBg: "#1DA1F2",
    brandFg: "#ffffff",
  },
  {
    field: "linkedin_url",
    label: "LinkedIn",
    icon: FaLinkedin,
    accent: "#0A66C2",
    brandBg: "#0A66C2",
    brandFg: "#ffffff",
  },
  {
    field: "discord_url",
    label: "Discord",
    icon: FaDiscord,
    accent: "#5865F2",
    brandBg: "#5865F2",
    brandFg: "#ffffff",
  },
];

// ── Social Icon Slot Component ──────────────────────────────────────────────
const SocialIconSlot = ({
  Icon,
  label,
  accent,
  brandBg,
  brandFg,
  value,
  onSave,
}) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef(null);
  const hasValue = !!value;

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openEditor = () => {
    setError("");
    setOpen((v) => !v);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const result = await onSave(draft.trim());
    setSaving(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative group">
      {hasValue ? (
        <motion.a
          href={value}
          target="_blank"
          rel="noreferrer"
          whileHover={{ scale: 1.08, y: -1 }}
          whileTap={{ scale: 0.95 }}
          className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer shadow-sm transition-all"
          style={{
            background: brandBg,
            color: brandFg,
            boxShadow: `0 0 10px ${brandBg}33`,
          }}
        >
          <Icon size={14} />
        </motion.a>
      ) : (
        <button
          onClick={openEditor}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer bg-white/[0.03] border border-dashed border-white/10 text-gray-500 hover:text-white hover:border-[#00F0FF]/40 hover:bg-[#00F0FF]/10"
        >
          <Icon size={14} />
        </button>
      )}

      {hasValue && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openEditor();
          }}
          className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer bg-[#0f0f16] border border-white/20 p-0.5"
        >
          <FiEdit2 size={8} className="text-gray-300" />
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-10 left-1/2 -translate-x-1/2 z-30 w-56 rounded-xl p-3 bg-[#0d0d14] border border-white/10 shadow-2xl"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              {label} URL
            </p>
            <input
              autoFocus
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder={`https://${label.toLowerCase()}.com/username`}
              className="w-full bg-[#070709] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]/50 transition mb-2"
            />
            {error && (
              <p className="text-red-400 text-[10px] leading-relaxed mb-2">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => setOpen(false)}
                className="px-2.5 py-1 rounded text-[11px] text-gray-500 hover:text-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1 rounded text-[11px] font-bold text-white cursor-pointer disabled:opacity-50"
                style={{ background: accent }}
              >
                {saving ? "…" : "Save"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main Profile Component ──────────────────────────────────────────────────
export default function YourProfile() {
  const [profile, setProfile] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("creations");

  const [userPosts, setUserPosts] = useState([]);
  const [solvedGlitches, setSolvedGlitches] = useState([]);
  const [inspectModalItem, setInspectModalItem] = useState(null);

  const [showEditPanel, setShowEditPanel] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    username: "",
    bio: "",
    avatar_url: "",
    banner_url: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editSaved, setEditSaved] = useState(false);
  const [editError, setEditError] = useState("");

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const formatSolvedTime = (dateStr) => {
    if (!dateStr) return "Recently";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Recently";

    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      setAuthUser(userData?.user);
      if (!userId) return;

      const [profileRes, pointsRes, postsRes, commentsRes, submissionsRes, activityRes] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).single(),
          supabase
            .from("user_points")
            .select("points")
            .eq("user_id", userId)
            .single(),
          supabase
            .from("community_posts")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
          supabase
            .from("community_comments")
            .select("*, community_posts(title)")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
          supabase
            .from("challenge_submissions")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
          supabase
            .from("glitch_activity")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
        ]);

      const pd = profileRes.data;
      const userMeta = userData?.user?.user_metadata;
      const cachedBanner = userId
        ? localStorage.getItem(`glitch_banner_${userId}`)
        : null;
      const bannerUrl =
        pd?.banner_url || userMeta?.banner_url || cachedBanner || "";

      setProfile({
        ...pd,
        banner_url: bannerUrl,
        points: pointsRes.data?.points || 0,
      });

      // Combine user's real posts and comments into userDiscussions list
      const rawPosts = postsRes.data || [];
      const rawComments = commentsRes.data || [];

      const discussions = [
        ...rawPosts.map((p) => ({
          id: p.id,
          type: "post",
          title: p.title || "Untitled Discussion",
          content: p.content || "",
          category: p.category || "Discussion",
          created_at: p.created_at,
          upvotes: p.upvotes || 0,
        })),
        ...rawComments.map((c) => ({
          id: c.id,
          postId: c.post_id,
          type: "comment",
          title: `Commented on: ${c.community_posts?.title || "Discussion"}`,
          content: c.content || "",
          category: "Comment",
          created_at: c.created_at,
          upvotes: 0,
        })),
      ];

      discussions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setUserPosts(discussions);

      // Build real solved glitches directly from database records
      const submissions = submissionsRes.data || [];
      const activities = (activityRes.data || []).filter(
        (a) =>
          a.type !== "bonus" &&
          a.type !== "referral" &&
          a.type !== "checkin"
      );

      const items = [];
      const seenKeys = new Set();

      // Process challenge_submissions
      submissions.forEach((sub) => {
        const subDate = sub.created_at;
        const key = `${sub.challenge_id}_${sub.challenge_type}`;
        seenKeys.add(key);

        const matchedAct = activities.find(
          (a) =>
            a.type === sub.challenge_type &&
            Math.abs(new Date(a.created_at) - new Date(subDate)) < 600000
        );

        let category = "Glitches";
        let accent = "#00F0FF";
        if (sub.challenge_type === "debug") {
          category = "Debug Mode";
          accent = "#FF00C8";
        } else if (sub.challenge_type === "ai") {
          category = "AI Challenge";
          accent = "#a855f7";
        } else if (sub.challenge_type === "spark") {
          category = "Creative Spark";
          accent = "#f59e0b";
        } else if (sub.challenge_type === "arena") {
          category = "Game Arena";
          accent = "#22c55e";
        }

        items.push({
          id: sub.id,
          title: matchedAct?.title || `Challenge #${sub.challenge_id}`,
          category,
          time: subDate,
          codeSnippet: sub.answer || "// Solved & Verified in Database",
          status: "SOLVED ✓",
          points: sub.points_earned || matchedAct?.points || 10,
          accent,
        });
      });

      // Process remaining glitch_activity items
      activities.forEach((act) => {
        let category = "Glitches";
        let accent = "#00F0FF";
        if (act.type === "debug") {
          category = "Debug Mode";
          accent = "#FF00C8";
        } else if (act.type === "ai") {
          category = "AI Challenge";
          accent = "#a855f7";
        } else if (act.type === "spark") {
          category = "Creative Spark";
          accent = "#f59e0b";
        } else if (act.type === "arena") {
          category = "Game Arena";
          accent = "#22c55e";
        }

        const key = `${act.title}_${act.created_at}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          items.push({
            id: act.id,
            title: act.title || "Glitch Solved",
            category,
            time: act.created_at,
            codeSnippet: `// Solved for +${act.points || 10} gBits`,
            status: "SOLVED ✓",
            points: act.points || 10,
            accent,
          });
        }
      });

      items.sort((a, b) => new Date(b.time) - new Date(a.time));
      setSolvedGlitches(items);
      setAvatarPreview(pd?.avatar_url || null);
      setEditForm({
        full_name: pd?.full_name || "",
        username: pd?.username || "",
        bio: pd?.bio || "",
        avatar_url: pd?.avatar_url || "",
        banner_url: bannerUrl,
      });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const uploadAvatar = async (file) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!file || !userId) return;
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const publicUrl = supabase.storage.from("avatars").getPublicUrl(fileName);
      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl.data.publicUrl })
        .eq("id", userId);
      setAvatarPreview(publicUrl.data.publicUrl);
      setEditForm((prev) => ({
        ...prev,
        avatar_url: publicUrl.data.publicUrl,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleModalAvatarUpload = async (file) => {
    if (!file) return;
    setAvatarUploading(true);
    setEditError("");
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error("Not signed in.");

      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      setAvatarLoadError(false);
      setEditForm((prev) => ({ ...prev, avatar_url: urlData.publicUrl }));
    } catch (err) {
      console.error(err);
      setEditError("Couldn't upload image.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleModalBannerUpload = async (file) => {
    if (!file) return;
    setBannerUploading(true);
    setEditError("");
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error("Not signed in.");

      const fileExt = file.name.split(".").pop();
      const fileName = `banners/${userId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      setEditForm((prev) => ({ ...prev, banner_url: urlData.publicUrl }));
    } catch (err) {
      console.error(err);
      setEditError("Couldn't upload banner image.");
    } finally {
      setBannerUploading(false);
    }
  };

  const handleSaveSocial = async (field, value) => {
    const userId = authUser?.id;
    if (!userId) return { error: "Not signed in." };
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: value || null })
      .eq("id", userId);

    if (error) return { error: error.message };
    setProfile((prev) => ({ ...prev, [field]: value || null }));
    return { error: null };
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [editForm.avatar_url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#070709]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-t-transparent border-[#FF00C8] rounded-full"
        />
      </div>
    );
  }

  const xp = profile?.points || 0;
  const level = getLevelFromXP(xp);
  const username = profile?.username || profile?.full_name || "Anonymous Glitcher";
  const roleTitle = "Full-Stack Glitch Developer";
  const initials = username.slice(0, 2).toUpperCase();

  const openEditPanel = () => {
    setEditError("");
    setEditSaved(false);
    setAvatarLoadError(false);
    setShowEditPanel(true);
  };

  const saveEditProfile = async () => {
    if (!editForm.username.trim()) {
      setEditError("Username is required.");
      return;
    }
    setSavingEdit(true);
    setEditError("");

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      setSavingEdit(false);
      setEditError("You're not signed in.");
      return;
    }

    // Save in Auth metadata + localStorage for guaranteed client persistence
    await supabase.auth.updateUser({
      data: {
        banner_url: editForm.banner_url || null,
      },
    });

    if (editForm.banner_url) {
      localStorage.setItem(`glitch_banner_${userId}`, editForm.banner_url);
    } else {
      localStorage.removeItem(`glitch_banner_${userId}`);
    }

    // Attempt profile table update
    let updatePayload = {
      full_name: editForm.full_name,
      username: editForm.username,
      bio: editForm.bio,
      avatar_url: editForm.avatar_url,
    };

    let { error } = await supabase
      .from("profiles")
      .update({ ...updatePayload, banner_url: editForm.banner_url || null })
      .eq("id", userId);

    if (error && error.message?.includes("banner_url")) {
      // Fallback if banner_url column doesn't exist yet on profiles table
      const fallback = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", userId);
      error = fallback.error;
    }

    setSavingEdit(false);

    if (error) {
      setEditError(
        error.message?.toLowerCase().includes("duplicate")
          ? "Username is taken."
          : error.message || "Error saving profile."
      );
      return;
    }

    setEditSaved(true);
    await fetchProfile();
    setTimeout(() => {
      setEditSaved(false);
      setShowEditPanel(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col justify-between">
      <Navbar />

      {/* ── Edit Profile Modal (Horizontal 2-Column + Banner Customizer) ── */}
      <AnimatePresence>
        {showEditPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && setShowEditPanel(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-3xl rounded-3xl p-6 sm:p-7 bg-[#0d0d14] border border-white/10 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
            >
              <div className="h-[2px] w-full bg-gradient-to-r from-[#FF00C8] via-[#00F0FF] to-purple-500 absolute top-0 left-0" />

              <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4 shrink-0">
                <div>
                  <h2 className="text-xl font-black text-white">Edit Profile</h2>
                  <p className="text-xs text-gray-500">Customize your profile avatar, banner, and identity details</p>
                </div>
                <button
                  onClick={() => setShowEditPanel(false)}
                  className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition cursor-pointer"
                >
                  <FiX size={16} />
                </button>
              </div>

              <div className="overflow-y-auto pr-1 space-y-6 flex-1">
                {/* Horizontal 2-column Grid for Avatar & Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Avatar & Full Name */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                        Profile Avatar
                      </label>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-16 h-16 rounded-2xl border border-white/10 overflow-hidden bg-[#181824] shrink-0 flex items-center justify-center">
                          {editForm.avatar_url && !avatarLoadError ? (
                            <img
                              src={editForm.avatar_url}
                              alt="preview"
                              className="w-full h-full object-cover"
                              onError={() => setAvatarLoadError(true)}
                            />
                          ) : (
                            <span className="text-xl font-black text-[#FF00C8]">
                              {initials}
                            </span>
                          )}
                        </div>
                        <label className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/20">
                          <FiUpload size={14} />
                          {avatarUploading ? "Uploading…" : "Upload Avatar"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              e.target.files?.[0] && handleModalAvatarUpload(e.target.files[0])
                            }
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="…or paste avatar URL"
                        value={editForm.avatar_url}
                        onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                        className="w-full bg-[#070709] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs placeholder-gray-600 outline-none focus:border-[#FF00C8]/40 transition"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Alison Danis"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        className="w-full bg-[#070709] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs placeholder-gray-600 outline-none focus:border-[#00F0FF]/40 transition"
                      />
                    </div>
                  </div>

                  {/* Right Column: Username & Bio */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                        Username *
                      </label>
                      <input
                        type="text"
                        placeholder="glitcher_pro"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        className="w-full bg-[#070709] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs placeholder-gray-600 outline-none focus:border-[#FF00C8]/40 transition"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                        Bio / Headline
                      </label>
                      <textarea
                        rows={3.5}
                        placeholder="Full-Stack Developer & Glitch Hunter…"
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        maxLength={300}
                        className="w-full bg-[#070709] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs placeholder-gray-600 outline-none focus:border-[#00F0FF]/40 transition resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Banner Customization Section ── */}
                <div className="pt-5 border-t border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FiImage className="text-[#00F0FF]" /> Profile Banner Image
                    </label>
                    {editForm.banner_url && (
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, banner_url: "" })}
                        className="text-[11px] text-gray-400 hover:text-white font-semibold underline cursor-pointer"
                      >
                        Reset to Default Banner
                      </button>
                    )}
                  </div>

                  {/* Banner Preview */}
                  <div className="relative h-24 w-full rounded-2xl overflow-hidden border border-white/10 bg-[#07070d] mb-3">
                    {editForm.banner_url ? (
                      <img
                        src={editForm.banner_url}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                        onError={() => setEditForm((prev) => ({ ...prev, banner_url: "" }))}
                      />
                    ) : (
                      <div
                        className="w-full h-full opacity-60"
                        style={{
                          backgroundImage: `radial-gradient(ellipse at 30% 20%, rgba(255,0,200,0.45) 0%, transparent 70%),
                                            radial-gradient(ellipse at 85% 70%, rgba(0,240,255,0.4) 0%, transparent 65%),
                                            linear-gradient(135deg, rgba(255,0,200,0.2) 0%, rgba(0,240,255,0.15) 100%)`,
                        }}
                      />
                    )}
                    <span className="absolute bottom-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/60 border border-white/20 text-gray-300 backdrop-blur-md">
                      {editForm.banner_url ? "Custom Banner Selected" : "Default Glitch Wave Banner"}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
                    <label className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/20 flex items-center justify-center gap-2 shrink-0">
                      <FiUpload size={13} />
                      {bannerUploading ? "Uploading Banner…" : "Upload Banner Image"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files?.[0] && handleModalBannerUpload(e.target.files[0])
                        }
                      />
                    </label>

                    <input
                      type="text"
                      placeholder="…or paste banner image URL"
                      value={editForm.banner_url}
                      onChange={(e) => setEditForm({ ...editForm, banner_url: e.target.value })}
                      className="w-full bg-[#070709] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs placeholder-gray-600 outline-none focus:border-[#FF00C8]/40 transition"
                    />
                  </div>

                  {/* Preset Banner Selector */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase shrink-0 mr-1">
                      Presets:
                    </span>
                    {PRESET_BANNERS.map((preset) => {
                      const isSelected =
                        (editForm.banner_url === preset.url) ||
                        (!editForm.banner_url && !preset.url);

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, banner_url: preset.url })}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition border ${
                            isSelected
                              ? "bg-[#FF00C8]/20 border-[#FF00C8] text-[#FF00C8] shadow-[0_0_10px_rgba(255,0,200,0.3)]"
                              : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                          }`}
                        >
                          {preset.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {editError && <p className="text-red-400 text-xs mt-3">{editError}</p>}

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5 shrink-0 mt-4">
                <button
                  onClick={() => setShowEditPanel(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 text-gray-400 text-xs font-semibold hover:bg-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={saveEditProfile}
                  disabled={savingEdit || editSaved}
                  className="px-7 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#FF00C8] hover:bg-[#e000b0] cursor-pointer shadow-[0_0_15px_rgba(255,0,200,0.3)] transition-all"
                >
                  {editSaved ? "✓ Saved!" : savingEdit ? "Saving…" : "Save Changes"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex pt-24 min-h-[calc(100vh-80px)]">
        <SharedSidebar user={authUser} xp={xp} avatarPreview={avatarPreview} />

        <main className="flex-1 min-w-0 p-4 sm:p-6 max-w-4xl mx-auto pb-20 mb-12">
          {/* ── COMPACT REFERENCE PROFILE CARD ── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative rounded-2xl bg-[#0d0d14] border border-white/10 shadow-xl overflow-hidden mb-8"
          >
            {/* 1. Sleek Banner Container */}
            <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-[#07070d]">
              {profile?.banner_url ? (
                <img
                  src={profile.banner_url}
                  alt="Profile Banner"
                  className="absolute inset-0 w-full h-full object-cover opacity-90"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <>
                  <div
                    className="absolute inset-0 opacity-40 pointer-events-none"
                    style={{
                      backgroundImage: `radial-gradient(ellipse at 30% 20%, rgba(255,0,200,0.45) 0%, transparent 70%),
                                        radial-gradient(ellipse at 85% 70%, rgba(0,240,255,0.4) 0%, transparent 65%),
                                        linear-gradient(135deg, rgba(255,0,200,0.2) 0%, rgba(0,240,255,0.15) 100%)`,
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-15"
                    style={{
                      backgroundImage: `linear-gradient(rgba(0,240,255,0.25) 1px, transparent 1px),
                                        linear-gradient(90deg, rgba(0,240,255,0.25) 1px, transparent 1px)`,
                      backgroundSize: "30px 30px",
                    }}
                  />
                </>
              )}

              <svg
                className="absolute bottom-0 left-0 right-0 w-full h-16 text-[#0d0d14] z-10 pointer-events-none"
                viewBox="0 0 1440 320"
                preserveAspectRatio="none"
                fill="currentColor"
              >
                <path d="M0,192L48,197.3C96,203,192,213,288,197.3C384,181,480,139,576,144C672,149,768,203,864,218.7C960,235,1056,213,1152,186.7C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
              </svg>
            </div>

            {/* 2. Compact Avatar & Header Info */}
            <div className="relative px-5 sm:px-6 pb-6 -mt-14 sm:-mt-16 z-20">
              <div className="flex items-end justify-between gap-3 mb-5">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-[#0d0d14] overflow-hidden bg-[#181824] shadow-lg">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt={username}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-black text-[#FF00C8] bg-gradient-to-br from-[#FF00C8]/20 to-[#00F0FF]/20">
                        {initials}
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-6 h-6 rounded-lg bg-[#FF00C8] hover:bg-[#e000b0] flex items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-110">
                    <FiEdit2 size={10} className="text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files?.[0] && uploadAvatar(e.target.files[0])
                      }
                    />
                  </label>
                </div>

                {/* Edit Profile Action Button */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={openEditPanel}
                  className="px-3.5 py-1.5 rounded-lg bg-[#FF00C8] text-white font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(255,0,200,0.3)] transition-all"
                >
                  <FiEdit2 size={11} /> Edit Profile
                </motion.button>
              </div>

              {/* 3. PRO Pill Badge + Name + Tagline with clear spacing below avatar */}
              <div className="mt-4 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#FF00C8] text-white font-black text-[9px] px-2.5 py-0.5 rounded uppercase tracking-wider shadow-sm">
                    PRO
                  </span>
                  <span className="bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] font-bold text-[9px] px-2.5 py-0.5 rounded uppercase tracking-wider">
                    LEVEL {level}
                  </span>
                  <span className="bg-white/5 text-gray-400 font-bold text-[9px] px-2.5 py-0.5 rounded flex items-center gap-1">
                    <Zap size={9} className="text-[#00F0FF]" /> {xp} gBits
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {username}
                </h1>
                <p className="text-[#00F0FF] text-xs font-semibold mt-1">
                  {roleTitle}
                </p>
                {profile?.bio && (
                  <p className="text-gray-300 text-sm sm:text-base mt-2.5 leading-relaxed max-w-2xl font-normal">
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* 4. Social Links Row */}
              <div className="flex items-center gap-2.5 pt-3 border-t border-white/5">
                {SOCIAL_PLATFORMS.map((p) => (
                  <SocialIconSlot
                    key={p.field}
                    Icon={p.icon}
                    label={p.label}
                    accent={p.accent}
                    brandBg={p.brandBg}
                    brandFg={p.brandFg}
                    value={profile?.[p.field]}
                    onSave={(val) => handleSaveSocial(p.field, val)}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* 5. Interactive Tabbed Content Section (Portfolio Showcase & Forum Activity) */}
          <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              {[
                { id: "creations", label: "My Solved Glitches & Showcase", icon: FiCode },
                { id: "community", label: "Forum Discussions", icon: FiMessageSquare },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                      active
                        ? "bg-[#FF00C8] text-white border-[#FF00C8] shadow-[0_0_12px_rgba(255,0,200,0.3)]"
                        : "bg-white/[0.03] text-gray-400 border-white/5 hover:text-white"
                    }`}
                  >
                    <Icon size={13} /> {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="hidden sm:flex items-center text-gray-500 text-xs font-mono">
              <FiGrid size={13} />
            </div>
          </div>

          {/* Tab 1: My Creations & Solved Glitches */}
          {activeTab === "creations" && (
            <div>
              {solvedGlitches.length === 0 ? (
                <div className="p-8 text-center bg-[#0d0d14] border border-white/10 rounded-2xl">
                  <FiCode className="mx-auto text-gray-500 mb-3" size={28} />
                  <h3 className="text-sm font-bold text-white mb-1">
                    No Solved Glitches Yet
                  </h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4 leading-relaxed font-sans">
                    You haven't solved any challenges yet. Solve Glitches, Debug Mode, or AI Challenges to display your verified solutions here!
                  </p>
                  <a
                    href="/glitches"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#FF00C8] text-white hover:bg-[#e000b0] transition shadow-md"
                  >
                    Explore Glitches <ArrowRight size={13} />
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {solvedGlitches.map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -3 }}
                      className="bg-[#0d0d14] border border-white/10 rounded-xl p-4 flex flex-col justify-between group transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded border"
                            style={{
                              color: item.accent,
                              background: `${item.accent}15`,
                              borderColor: `${item.accent}30`,
                            }}
                          >
                            {item.category}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            {formatSolvedTime(item.time)}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-white mb-2 group-hover:text-[#00F0FF] transition-colors">
                          {item.title}
                        </h3>

                        <div className="bg-[#07070d] border border-white/5 rounded-lg p-2.5 mb-3 font-mono text-xs text-green-400 truncate">
                          <code>{item.codeSnippet}</code>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-xs font-bold text-[#22c55e]">
                          {item.status} (+{item.points} gBits)
                        </span>
                        <button
                          onClick={() => setInspectModalItem(item)}
                          className="text-xs font-bold text-[#FF00C8] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          Inspect Solution <ArrowRight size={11} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Forum Activity */}
          {activeTab === "community" && (
            <div className="space-y-3">
              {userPosts.length === 0 ? (
                <div className="p-8 text-center bg-[#0d0d14] border border-white/10 rounded-2xl">
                  <FiMessageSquare className="mx-auto text-gray-500 mb-3" size={28} />
                  <h3 className="text-sm font-bold text-white mb-1">
                    No Forum Discussions Yet
                  </h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4 leading-relaxed font-sans">
                    You haven't posted any topics or comments in the forum yet. Visit the Community Feed to join developer discussions!
                  </p>
                  <a
                    href="/community"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#FF00C8] text-white hover:bg-[#e000b0] transition shadow-md"
                  >
                    Visit Community Feed <ArrowRight size={13} />
                  </a>
                </div>
              ) : (
                userPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    whileHover={{ y: -2 }}
                    className="p-4 bg-[#0d0d14] border border-white/10 rounded-xl flex flex-col gap-2 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded border border-[#FF00C8]/30 bg-[#FF00C8]/10 text-[#FF00C8] shrink-0 font-mono">
                          {post.category}
                        </span>
                        <a
                          href={`/community`}
                          className="text-xs sm:text-sm font-bold text-white hover:text-[#00F0FF] transition truncate"
                        >
                          {post.title}
                        </a>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400 shrink-0">
                        {formatSolvedTime(post.created_at)}
                      </span>
                    </div>
                    {post.content && (
                      <p className="text-xs text-gray-300 font-sans line-clamp-2 leading-relaxed bg-[#070709] p-2.5 rounded-lg border border-white/5">
                        {post.content}
                      </p>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {/* Solution Inspection Modal */}
      <AnimatePresence>
        {inspectModalItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setInspectModalItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0d0d14] border border-white/15 rounded-2xl p-6 max-w-xl w-full shadow-2xl relative"
            >
              <button
                onClick={() => setInspectModalItem(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg bg-white/5 hover:bg-white/10 transition"
              >
                <FiX size={16} />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase font-mono"
                  style={{
                    color: inspectModalItem.accent,
                    background: `${inspectModalItem.accent}15`,
                    borderColor: `${inspectModalItem.accent}30`,
                  }}
                >
                  {inspectModalItem.category}
                </span>
                <span className="text-xs font-mono text-gray-400">
                  {new Date(inspectModalItem.time).toLocaleString()}
                </span>
              </div>

              <h2 className="text-lg font-bold text-white mb-2">
                {inspectModalItem.title}
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Status: <span className="text-green-400 font-bold">{inspectModalItem.status}</span> · Reward: <span className="text-[#00F0FF] font-bold">+{inspectModalItem.points} gBits</span>
              </p>

              <div className="text-xs font-mono text-gray-300 bg-[#070709] border border-white/10 rounded-xl p-4 overflow-x-auto max-h-60">
                <pre className="text-green-400 whitespace-pre-wrap">{inspectModalItem.codeSnippet}</pre>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setInspectModalItem(null)}
                  className="px-5 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition cursor-pointer"
                >
                  Close Inspection
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
