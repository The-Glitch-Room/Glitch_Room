// src/components/Settings.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import {
  User,
  Bell,
  Shield,
  Palette,
  Trash2,
  ChevronRight,
  Mail,
  Lock,
  Smartphone,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  Save,
  RefreshCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import Navbar from "./Navbar";
import SharedSidebar from "./SharedSidebar";

// ── Toggle Switch Component ───────────────────────────────────────────────────
const Toggle = ({ enabled, onToggle, disabled }) => (
  <button
    type="button"
    onClick={disabled ? undefined : onToggle}
    disabled={disabled}
    className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none ${
      disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
    }`}
    style={{ background: enabled ? "#FF00C8" : "rgba(255,255,255,0.1)" }}
  >
    <motion.div
      animate={{ x: enabled ? 22 : 2 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
    />
  </button>
);

// ── Section Card Wrapper ──────────────────────────────────────────────────────
const Section = ({ icon: Icon, title, color, children, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-[#0f0f13] rounded-2xl border border-white/5 overflow-hidden mb-5 shadow-xl"
  >
    <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 bg-white/[0.01]">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <h2 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
        {title}
      </h2>
    </div>
    <div className="p-3 divide-y divide-white/5">{children}</div>
  </motion.div>
);

// ── Setting Row Item ──────────────────────────────────────────────────────────
const SettingRow = ({ label, desc, children, danger }) => (
  <div
    className={`flex items-center justify-between px-3 py-3.5 rounded-xl transition-all ${
      danger ? "hover:bg-red-500/5" : "hover:bg-white/[0.02]"
    }`}
  >
    <div className="min-w-0 mr-4">
      <p
        className={`text-sm font-medium ${
          danger ? "text-red-400 font-bold" : "text-gray-200"
        }`}
      >
        {label}
      </p>
      {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

// ── Password Change Modal ─────────────────────────────────────────────────────
const PasswordModal = ({ onClose }) => {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (next.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (next !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const email = userData?.user?.email;

    if (email) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (signInErr) {
        setError("Current password is incorrect.");
        setLoading(false);
        return;
      }
    }

    const { error: updateErr } = await supabase.auth.updateUser({
      password: next,
    });
    setLoading(false);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => onClose(), 1800);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        className="relative w-full max-w-md bg-[#0f0f1a] border border-white/10 rounded-2xl p-7 shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF00C8] to-transparent" />

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">Change Password</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
              <Check size={24} className="text-green-400" />
            </div>
            <p className="text-green-400 font-bold">Password updated successfully!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1.5 font-mono">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-[#FF00C8]/50 pr-10 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer"
                >
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1.5 font-mono">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNext ? "text" : "password"}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-[#FF00C8]/50 pr-10 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNext(!showNext)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer"
                >
                  {showNext ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1.5 font-mono">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat new password"
                className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-[#FF00C8]/50 transition font-mono"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                <AlertTriangle size={12} /> {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-400 text-sm font-semibold hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !current || !next || !confirm}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40 cursor-pointer transition"
                style={{ background: "linear-gradient(90deg,#FF00C8,#a855f7)" }}
              >
                {loading ? (
                  <RefreshCw size={14} className="animate-spin mx-auto" />
                ) : (
                  "Update Password"
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// ── Delete Account Modal ──────────────────────────────────────────────────────
const DeleteModal = ({ onClose }) => {
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (userId) {
      // Clear all local storage caches
      localStorage.clear();
      // Remove profile row if allowed
      await supabase.from("profiles").delete().eq("id", userId).catch(() => {});
    }

    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10 }}
        className="relative w-full max-w-md bg-[#0f0f1a] border border-red-500/30 rounded-2xl p-7 shadow-2xl"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-black text-red-400">Delete Account</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-5 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-red-300 text-xs leading-relaxed">
            This will permanently delete your account, all your gBits, earned badges,
            and platform activity history. <strong>This action cannot be undone.</strong>
          </p>
        </div>

        <p className="text-gray-400 text-xs mb-3 font-mono">
          Type <span className="text-red-400 font-bold">DELETE</span> to confirm:
        </p>

        <input
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Type DELETE"
          className="w-full bg-[#0a0a14] border border-red-500/30 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-red-500 mb-5 font-mono"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-400 text-sm font-semibold hover:bg-white/10 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={confirm !== "DELETE" || loading}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold bg-red-600 hover:bg-red-500 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition"
          >
            {loading ? "Deleting..." : "Delete Forever"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Main Settings Component ────────────────────────────────────────────────────
const Settings = () => {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [accentColor, setAccentColor] = useState("#FF00C8");

  const [toggles, setToggles] = useState({
    emailNotifs: true,
    pushNotifs: false,
    weeklyDigest: true,
    sounds: true,
    publicProfile: true,
    showEmail: false,
    twoFactor: false,
  });

  const [originalToggles, setOriginalToggles] = useState({ ...toggles });

  const [profile, setProfile] = useState({
    full_name: "",
    username: "",
    email: "",
  });

  const [originalProfile, setOriginalProfile] = useState(null);
  const [usernameError, setUsernameError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data: au } = await supabase.auth.getUser();
      const user = au?.user;
      setAuthUser(user);
      const userId = user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      // Load profile & points
      const [{ data: profileData }, { data: pts }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_points").select("points").eq("user_id", userId).maybeSingle(),
      ]);

      const userMeta = user?.user_metadata || {};
      const cachedTogglesStr = localStorage.getItem(`glitch_toggles_${userId}`);
      let cachedToggles = null;
      if (cachedTogglesStr) {
        try { cachedToggles = JSON.parse(cachedTogglesStr); } catch (e) {}
      }

      const initialToggles = {
        emailNotifs: userMeta?.emailNotifs ?? cachedToggles?.emailNotifs ?? true,
        pushNotifs: userMeta?.pushNotifs ?? cachedToggles?.pushNotifs ?? (Notification?.permission === "granted"),
        weeklyDigest: userMeta?.weeklyDigest ?? cachedToggles?.weeklyDigest ?? true,
        sounds: userMeta?.sounds ?? cachedToggles?.sounds ?? (localStorage.getItem("gr_sound_enabled") !== "false"),
        publicProfile: userMeta?.publicProfile ?? cachedToggles?.publicProfile ?? profileData?.public_profile ?? true,
        showEmail: userMeta?.showEmail ?? cachedToggles?.showEmail ?? profileData?.show_email ?? false,
        twoFactor: false, // Explicitly false & disabled (Coming Soon)
      };

      setToggles(initialToggles);
      setOriginalToggles(initialToggles);

      const cachedAccent = localStorage.getItem(`glitch_accent_${userId}`) || userMeta?.accentColor || "#FF00C8";
      setAccentColor(cachedAccent);
      document.documentElement.style.setProperty("--accent", cachedAccent);

      const p = {
        full_name: profileData?.full_name || userMeta?.full_name || "",
        username: profileData?.username || userMeta?.username || "",
        email: user?.email || "",
      };
      setProfile(p);
      setOriginalProfile(p);

      const calculatedXP = Math.max(pts?.points || 0, profileData?.points || 0);
      setXp(calculatedXP);

      setLoading(false);
    };

    fetchSettings();
  }, []);

  const toggleSetting = (key) => {
    if (key === "pushNotifs" && !toggles.pushNotifs && "Notification" in window) {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          setToggles((prev) => ({ ...prev, pushNotifs: true }));
          showToast("Push notifications permission granted!");
        } else {
          showToast("Push notification permission denied in browser.");
        }
      });
    } else {
      setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const isDirty =
    (originalProfile &&
      (profile.full_name !== originalProfile.full_name ||
        profile.username !== originalProfile.username)) ||
    (originalToggles &&
      JSON.stringify(toggles) !== JSON.stringify(originalToggles)) ||
    accentColor !== (localStorage.getItem(`glitch_accent_${authUser?.id}`) || "#FF00C8");

  const handleSave = async () => {
    setSaveStatus("saving");
    setUsernameError("");

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      setSaveStatus("error");
      return;
    }

    // Check username uniqueness if changed
    if (
      profile.username !== originalProfile.username &&
      profile.username.trim()
    ) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", profile.username.trim())
        .neq("id", userId)
        .maybeSingle();

      if (existing) {
        setUsernameError("Username is already taken.");
        setSaveStatus("idle");
        return;
      }
    }

    // Save in LocalStorage & system settings
    localStorage.setItem(`glitch_toggles_${userId}`, JSON.stringify(toggles));
    localStorage.setItem(`glitch_accent_${userId}`, accentColor);
    localStorage.setItem("gr_sound_enabled", toggles.sounds ? "true" : "false");
    document.documentElement.style.setProperty("--accent", accentColor);

    // Save in Auth Metadata for cross-device persistence
    await supabase.auth.updateUser({
      data: {
        full_name: profile.full_name.trim(),
        username: profile.username.trim(),
        emailNotifs: toggles.emailNotifs,
        pushNotifs: toggles.pushNotifs,
        weeklyDigest: toggles.weeklyDigest,
        sounds: toggles.sounds,
        publicProfile: toggles.publicProfile,
        showEmail: toggles.showEmail,
        accentColor: accentColor,
      },
    });

    // Update profiles table in Supabase
    let { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name.trim(),
        username: profile.username.trim(),
        public_profile: toggles.publicProfile,
        show_email: toggles.showEmail,
      })
      .eq("id", userId);

    if (error && (error.message?.includes("public_profile") || error.message?.includes("show_email"))) {
      const fallback = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name.trim(),
          username: profile.username.trim(),
        })
        .eq("id", userId);
      error = fallback.error;
    }

    if (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } else {
      setOriginalProfile({ ...profile });
      setOriginalToggles({ ...toggles });
      setSaveStatus("saved");
      showToast("All settings saved successfully!");
      setTimeout(() => setSaveStatus("idle"), 2500);
    }
  };

  const level = Math.floor(xp / 100);

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
      <div className="flex pt-24 min-h-[calc(100vh-80px)]">
        <SharedSidebar user={authUser} xp={xp} level={level} />

        <main className="flex-1 min-w-0 p-6 lg:p-8 overflow-y-auto pb-24 md:pb-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-black text-white mb-1">Settings</h1>
              <p className="text-gray-500 text-sm">
                Manage your account preferences, privacy, and system controls.
              </p>
            </div>

            <motion.button
              onClick={handleSave}
              disabled={!isDirty || saveStatus === "saving"}
              whileHover={isDirty ? { scale: 1.03 } : {}}
              whileTap={isDirty ? { scale: 0.97 } : {}}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border font-bold text-sm bg-transparent cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                borderColor:
                  saveStatus === "saved"
                    ? "#22c55e"
                    : saveStatus === "error"
                    ? "#ef4444"
                    : "#FF00C8",
                color:
                  saveStatus === "saved"
                    ? "#22c55e"
                    : saveStatus === "error"
                    ? "#ef4444"
                    : "#FF00C8",
                boxShadow:
                  isDirty && saveStatus === "idle"
                    ? "0 0 16px rgba(255,0,200,0.3)"
                    : "none",
              }}
            >
              {saveStatus === "saving" ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Saving...
                </>
              ) : saveStatus === "saved" ? (
                <>
                  <Check size={14} /> Saved!
                </>
              ) : saveStatus === "error" ? (
                <>
                  <AlertTriangle size={14} /> Error
                </>
              ) : (
                <>
                  <Save size={14} /> Save Changes
                </>
              )}
            </motion.button>
          </motion.div>

          {/* Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 px-4 py-3 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs font-mono flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <Check size={14} />
                  <span>{toastMessage}</span>
                </div>
                <button
                  onClick={() => setToastMessage("")}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── 1. ACCOUNT ── */}
          <Section icon={User} title="Account" color="#FF00C8" delay={0.1}>
            <SettingRow
              label="Display Name"
              desc="Your public name displayed across the platform"
            >
              <input
                value={profile.full_name}
                onChange={(e) =>
                  setProfile({ ...profile, full_name: e.target.value })
                }
                placeholder="Your full name"
                className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-1.5 text-sm text-white w-52 focus:outline-none focus:border-[#FF00C8]/50 transition placeholder-gray-600 font-sans"
              />
            </SettingRow>

            <SettingRow
              label="Username"
              desc={
                usernameError ? (
                  <span className="text-red-400 font-semibold">{usernameError}</span>
                ) : (
                  "Your unique handle"
                )
              }
            >
              <input
                value={profile.username}
                onChange={(e) => {
                  setProfile({ ...profile, username: e.target.value });
                  setUsernameError("");
                }}
                placeholder="@username"
                className="bg-white/5 border rounded-xl px-3.5 py-1.5 text-sm text-white w-52 focus:outline-none transition placeholder-gray-600 font-mono"
                style={{
                  borderColor: usernameError
                    ? "rgba(239,68,68,0.5)"
                    : "rgba(255,255,255,0.1)",
                }}
              />
            </SettingRow>

            <SettingRow
              label="Email Address"
              desc="Primary login and account recovery email"
            >
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3.5 py-1.5 w-52 opacity-70">
                <Mail size={13} className="text-gray-500 shrink-0" />
                <span className="text-xs text-gray-400 font-mono truncate">
                  {profile.email}
                </span>
              </div>
            </SettingRow>

            <SettingRow
              label="Change Password"
              desc="Update your current login password"
            >
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-1.5 text-xs text-[#FF00C8] font-bold border border-[#FF00C8]/30 px-3.5 py-1.5 rounded-xl hover:border-[#FF00C8]/60 hover:bg-[#FF00C8]/10 transition bg-transparent cursor-pointer"
              >
                <Lock size={12} /> Update Password
              </button>
            </SettingRow>
          </Section>

          {/* ── 2. NOTIFICATIONS ── */}
          <Section
            icon={Bell}
            title="Notifications"
            color="#00F0FF"
            delay={0.15}
          >
            <SettingRow
              label="Email Notifications"
              desc="Receive activity updates and challenge news via email"
            >
              <Toggle
                enabled={toggles.emailNotifs}
                onToggle={() => toggleSetting("emailNotifs")}
              />
            </SettingRow>

            <SettingRow
              label="Push Notifications"
              desc="Receive real-time browser push alerts for rewards and events"
            >
              <Toggle
                enabled={toggles.pushNotifs}
                onToggle={() => toggleSetting("pushNotifs")}
              />
            </SettingRow>

            <SettingRow
              label="Weekly Digest"
              desc="Receive a weekly summary of your gBits, streaks & badges"
            >
              <Toggle
                enabled={toggles.weeklyDigest}
                onToggle={() => toggleSetting("weeklyDigest")}
              />
            </SettingRow>

            <SettingRow
              label="Sound Effects"
              desc="Enable audio feedback for challenges, level ups & floating particles"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                  {toggles.sounds ? <Volume2 size={13} className="text-[#00F0FF]" /> : <VolumeX size={13} />}
                </span>
                <Toggle
                  enabled={toggles.sounds}
                  onToggle={() => toggleSetting("sounds")}
                />
              </div>
            </SettingRow>
          </Section>

          {/* ── 3. PRIVACY & SECURITY ── */}
          <Section
            icon={Shield}
            title="Privacy & Security"
            color="#a855f7"
            delay={0.2}
          >
            <SettingRow
              label="Public Profile"
              desc="Allow other developers to view your profile and terminal wall rank"
            >
              <Toggle
                enabled={toggles.publicProfile}
                onToggle={() => toggleSetting("publicProfile")}
              />
            </SettingRow>

            <SettingRow
              label="Show Email on Profile"
              desc="Display your email address publicly on your user profile card"
            >
              <Toggle
                enabled={toggles.showEmail}
                onToggle={() => toggleSetting("showEmail")}
              />
            </SettingRow>

            <SettingRow
              label="Two-Factor Authentication"
              desc="Add an extra layer of security using TOTP / Authenticator apps"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                  Coming Soon
                </span>
                <Toggle enabled={false} onToggle={() => {}} disabled />
              </div>
            </SettingRow>

            <SettingRow
              label="Active Sessions"
              desc="Sign out from all devices across all web sessions"
            >
              <button
                type="button"
                onClick={() =>
                  supabase.auth
                    .signOut()
                    .then(() => (window.location.href = "/"))
                }
                className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white transition bg-transparent border border-white/10 hover:border-white/20 px-3.5 py-1.5 rounded-xl cursor-pointer font-mono"
              >
                <Smartphone size={13} /> Sign Out All <ChevronRight size={13} />
              </button>
            </SettingRow>
          </Section>

          {/* ── 4. APPEARANCE ── */}
          <Section
            icon={Palette}
            title="Appearance & Theme"
            color="#f59e0b"
            delay={0.25}
          >
            <SettingRow
              label="Theme Mode"
              desc="Default high-contrast cyberpunk dark environment"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-400 font-mono bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  Cyber Dark (Default)
                </span>
              </div>
            </SettingRow>

            <SettingRow
              label="Accent Color"
              desc="Choose your custom highlight color across the user interface"
            >
              <div className="flex items-center gap-2.5">
                {[
                  { color: "#FF00C8", name: "Neon Pink" },
                  { color: "#00F0FF", name: "Electric Cyan" },
                  { color: "#a855f7", name: "Cyber Purple" },
                  { color: "#f59e0b", name: "Amber" },
                  { color: "#22c55e", name: "Emerald Green" },
                ].map(({ color, name }) => (
                  <button
                    key={color}
                    type="button"
                    title={name}
                    className="w-7 h-7 rounded-full border-2 transition-all cursor-pointer hover:scale-110 flex items-center justify-center"
                    style={{
                      background: color,
                      borderColor: accentColor === color ? "#ffffff" : "rgba(255,255,255,0.15)",
                      boxShadow: accentColor === color ? `0 0 14px ${color}` : "none",
                    }}
                    onClick={() => {
                      setAccentColor(color);
                      document.documentElement.style.setProperty("--accent", color);
                      window.dispatchEvent(new Event("accent_color_changed"));
                    }}
                  >
                    {accentColor === color && <Check size={12} className="text-black font-bold" />}
                  </button>
                ))}
              </div>
            </SettingRow>
          </Section>

          {/* ── 5. DANGER ZONE ── */}
          <Section
            icon={Trash2}
            title="Danger Zone"
            color="#ef4444"
            delay={0.3}
          >
            <SettingRow
              label="Delete Account"
              desc="Permanently remove your account, gBits balance, and data history"
              danger
            >
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="text-xs text-red-400 font-bold border border-red-500/30 px-3.5 py-1.5 rounded-xl hover:border-red-500/60 hover:bg-red-500/10 transition bg-transparent cursor-pointer"
              >
                Delete Account
              </button>
            </SettingRow>
          </Section>
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showPasswordModal && (
          <PasswordModal onClose={() => setShowPasswordModal(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showDeleteModal && (
          <DeleteModal onClose={() => setShowDeleteModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
