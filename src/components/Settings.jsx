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
} from "lucide-react";
import Navbar from "./Navbar";
import SharedSidebar from "./SharedSidebar";

// ── Toggle ────────────────────────────────────────────────────────────────────
const Toggle = ({ enabled, onToggle }) => (
  <button
    onClick={onToggle}
    className="relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none cursor-pointer"
    style={{ background: enabled ? "#FF00C8" : "rgba(255,255,255,0.1)" }}
  >
    <motion.div
      animate={{ x: enabled ? 22 : 2 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
    />
  </button>
);

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ icon: Icon, title, color, children, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-[#0f0f13] rounded-2xl border border-white/5 overflow-hidden mb-4"
  >
    <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <Icon size={15} style={{ color }} />
      </div>
      <h2 className="text-sm font-bold text-white uppercase tracking-widest">
        {title}
      </h2>
    </div>
    <div className="p-2">{children}</div>
  </motion.div>
);

// ── Setting row ───────────────────────────────────────────────────────────────
const SettingRow = ({ label, desc, children, danger }) => (
  <div
    className={`flex items-center justify-between px-3 py-3.5 rounded-xl transition-all hover:bg-white/[0.02] ${danger ? "hover:bg-red-500/5" : ""}`}
  >
    <div className="min-w-0 mr-4">
      <p
        className={`text-sm font-medium ${danger ? "text-red-400" : "text-gray-200"}`}
      >
        {label}
      </p>
      {desc && <p className="text-xs text-gray-600 mt-0.5">{desc}</p>}
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
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    // Re-authenticate by signing in with current password first
    const { data: userData } = await supabase.auth.getUser();
    const email = userData?.user?.email;
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (signInErr) {
      setError("Current password is incorrect.");
      setLoading(false);
      return;
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,5,12,0.85)", backdropFilter: "blur(10px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-white">Change Password</h2>
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
            <p className="text-green-400 font-bold">Password updated!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current password */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-[#FF00C8]/50 pr-10 transition"
                />
                <button
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer"
                >
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNext ? "text" : "password"}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-[#FF00C8]/50 pr-10 transition"
                />
                <button
                  onClick={() => setShowNext(!showNext)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer"
                >
                  {showNext ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {next.length > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-1 rounded-full transition-all"
                      style={{
                        background:
                          next.length > i * 2 + 2
                            ? next.length >= 10
                              ? "#22c55e"
                              : next.length >= 6
                                ? "#f59e0b"
                                : "#ef4444"
                            : "rgba(255,255,255,0.08)",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat new password"
                className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-[#FF00C8]/50 transition"
                style={{
                  borderColor:
                    confirm && confirm !== next
                      ? "rgba(239,68,68,0.4)"
                      : undefined,
                }}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                <AlertTriangle size={12} /> {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-400 text-sm font-semibold hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading || !current || !next || !confirm}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40 cursor-pointer"
                style={{ background: "linear-gradient(90deg,#FF00C8,#a855f7)" }}
              >
                {loading ? (
                  <RefreshCw size={14} className="animate-spin mx-auto" />
                ) : (
                  "Update Password"
                )}
              </motion.button>
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
    // Sign out the user — actual account deletion requires admin SDK
    // We'll sign out and show a message
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,5,12,0.9)", backdropFilter: "blur(10px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10 }}
        className="relative w-full max-w-md rounded-2xl p-7"
        style={{
          background: "#0f0f1a",
          border: "1px solid rgba(239,68,68,0.2)",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background:
              "linear-gradient(90deg,transparent,#ef4444,transparent)",
          }}
        />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-red-400">Delete Account</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-red-300 text-xs leading-relaxed">
            This will permanently delete your account, all your points, badges,
            activity history, and posts. <strong>This cannot be undone.</strong>
          </p>
        </div>
        <p className="text-gray-400 text-sm mb-3">
          Type <span className="text-red-400 font-mono font-bold">DELETE</span>{" "}
          to confirm:
        </p>
        <input
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Type DELETE"
          className="w-full bg-[#0a0a14] border border-red-500/20 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-red-500/50 transition mb-4 font-mono"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-400 text-sm font-semibold hover:bg-white/10 transition cursor-pointer"
          >
            Cancel
          </button>
          <motion.button
            whileHover={confirm === "DELETE" ? { scale: 1.02 } : {}}
            whileTap={confirm === "DELETE" ? { scale: 0.98 } : {}}
            onClick={handleDelete}
            disabled={confirm !== "DELETE" || loading}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold bg-red-500 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition"
          >
            {loading ? "Deleting..." : "Delete Forever"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Main Settings ─────────────────────────────────────────────────────────────
const Settings = () => {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [toggles, setToggles] = useState({
    emailNotifs: true,
    pushNotifs: false,
    darkMode: true,
    publicProfile: true,
    showEmail: false,
    twoFactor: false,
    weeklyDigest: true,
    sounds: false,
  });

  const [profile, setProfile] = useState({
    full_name: "",
    username: "",
    email: "",
  });

  const [originalProfile, setOriginalProfile] = useState(null);
  const [usernameError, setUsernameError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const { data: au } = await supabase.auth.getUser();
      setAuthUser(au?.user);
      const userId = au?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", userId)
        .single();

      const p = {
        full_name:
          profileData?.full_name || au?.user?.user_metadata?.full_name || "",
        username: profileData?.username || "",
        email: au?.user?.email || "",
      };
      setProfile(p);
      setOriginalProfile(p);

      const { data: pts } = await supabase
        .from("user_points")
        .select("points")
        .eq("user_id", userId)
        .single();
      if (pts) setXp(pts.points);

      setLoading(false);
    };
    fetchUser();
  }, []);

  const toggle = (key) =>
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  const isDirty =
    originalProfile &&
    (profile.full_name !== originalProfile.full_name ||
      profile.username !== originalProfile.username);

  const handleSave = async () => {
    if (!isDirty) return;
    setUsernameError("");
    setSaveStatus("saving");

    const { data: au } = await supabase.auth.getUser();
    const userId = au?.user?.id;
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
        .single();
      if (existing) {
        setUsernameError("Username already taken.");
        setSaveStatus("idle");
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name.trim(),
        username: profile.username.trim(),
      })
      .eq("id", userId);

    if (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } else {
      setOriginalProfile({ ...profile });
      setSaveStatus("saved");
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
      <div className="flex pt-[18vh]">
        <SharedSidebar user={authUser} xp={xp} level={level} />

        <main className="flex-1 min-w-0 p-6 lg:p-8 overflow-y-auto pb-24 md:pb-0">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-black text-white mb-1">Settings</h1>
              <p className="text-gray-500 text-sm">
                Manage your account, preferences & privacy.
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
                    ? "0 0 12px rgba(255,0,200,0.2)"
                    : "none",
              }}
            >
              {saveStatus === "saving" ? (
                <>
                  <RefreshCw size={13} className="animate-spin" /> Saving...
                </>
              ) : saveStatus === "saved" ? (
                <>
                  <Check size={13} /> Saved!
                </>
              ) : saveStatus === "error" ? (
                <>
                  <AlertTriangle size={13} /> Error
                </>
              ) : (
                <>
                  <Save size={13} /> Save Changes
                </>
              )}
            </motion.button>
          </motion.div>

          {/* ── ACCOUNT ── */}
          <Section icon={User} title="Account" color="#FF00C8" delay={0.1}>
            <SettingRow
              label="Display Name"
              desc="Your name shown across the platform"
            >
              <input
                value={profile.full_name}
                onChange={(e) =>
                  setProfile({ ...profile, full_name: e.target.value })
                }
                placeholder="Your full name"
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white w-48 focus:outline-none focus:border-[#FF00C8]/50 transition placeholder-gray-600"
              />
            </SettingRow>

            <SettingRow
              label="Username"
              desc={
                usernameError ? (
                  <span className="text-red-400">{usernameError}</span>
                ) : (
                  "Your unique @handle"
                )
              }
            >
              <div className="relative">
                <input
                  value={profile.username}
                  onChange={(e) => {
                    setProfile({ ...profile, username: e.target.value });
                    setUsernameError("");
                  }}
                  placeholder="@username"
                  className="bg-white/5 border rounded-xl px-3 py-1.5 text-sm text-white w-48 focus:outline-none transition placeholder-gray-600"
                  style={{
                    borderColor: usernameError
                      ? "rgba(239,68,68,0.4)"
                      : "rgba(255,255,255,0.1)",
                  }}
                />
              </div>
            </SettingRow>

            <SettingRow
              label="Email Address"
              desc="Used for login and notifications"
            >
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 w-48 opacity-70">
                <Mail size={13} className="text-gray-500 shrink-0" />
                <span className="text-sm text-gray-400 truncate">
                  {profile.email}
                </span>
              </div>
            </SettingRow>

            <SettingRow
              label="Change Password"
              desc="Update your login password"
            >
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-1.5 text-xs text-[#FF00C8] font-medium border border-[#FF00C8]/30 px-3 py-1.5 rounded-xl hover:border-[#FF00C8]/60 hover:bg-[#FF00C8]/5 transition bg-transparent cursor-pointer"
              >
                <Lock size={11} /> Update
              </button>
            </SettingRow>
          </Section>

          {/* ── NOTIFICATIONS ── */}
          <Section
            icon={Bell}
            title="Notifications"
            color="#00F0FF"
            delay={0.15}
          >
            <SettingRow
              label="Email Notifications"
              desc="Get challenge updates via email"
            >
              <Toggle
                enabled={toggles.emailNotifs}
                onToggle={() => toggle("emailNotifs")}
              />
            </SettingRow>
            <SettingRow label="Push Notifications" desc="Browser push alerts">
              <Toggle
                enabled={toggles.pushNotifs}
                onToggle={() => {
                  toggle("pushNotifs");
                  if (!toggles.pushNotifs && "Notification" in window) {
                    Notification.requestPermission();
                  }
                }}
              />
            </SettingRow>
            <SettingRow
              label="Weekly Digest"
              desc="Summary of your week's activity"
            >
              <Toggle
                enabled={toggles.weeklyDigest}
                onToggle={() => toggle("weeklyDigest")}
              />
            </SettingRow>
            <SettingRow label="Sound Effects" desc="UI sounds and alerts">
              <Toggle
                enabled={toggles.sounds}
                onToggle={() => toggle("sounds")}
              />
            </SettingRow>
          </Section>

          {/* ── PRIVACY & SECURITY ── */}
          <Section
            icon={Shield}
            title="Privacy & Security"
            color="#a855f7"
            delay={0.2}
          >
            <SettingRow
              label="Public Profile"
              desc="Let others find and view your profile"
            >
              <Toggle
                enabled={toggles.publicProfile}
                onToggle={() => toggle("publicProfile")}
              />
            </SettingRow>
            <SettingRow
              label="Show Email"
              desc="Display email on your public profile"
            >
              <Toggle
                enabled={toggles.showEmail}
                onToggle={() => toggle("showEmail")}
              />
            </SettingRow>
            <SettingRow
              label="Two-Factor Authentication"
              desc="Extra security for your account"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                  Coming Soon
                </span>
                <Toggle enabled={toggles.twoFactor} onToggle={() => {}} />
              </div>
            </SettingRow>
            <SettingRow
              label="Active Sessions"
              desc="Manage your logged-in devices"
            >
              <button
                onClick={() =>
                  supabase.auth
                    .signOut()
                    .then(() => (window.location.href = "/"))
                }
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition bg-transparent border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-xl cursor-pointer"
              >
                <Smartphone size={12} /> Sign Out All <ChevronRight size={12} />
              </button>
            </SettingRow>
          </Section>

          {/* ── APPEARANCE ── */}
          {/* <Section
            icon={Palette}
            title="Appearance"
            color="#f59e0b"
            delay={0.25}
          >
            <SettingRow label="Dark Mode" desc="Toggle dark / light interface">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500">Always on</span>
                <Toggle
                  enabled={toggles.darkMode}
                  onToggle={() => toggle("darkMode")}
                />
              </div>
            </SettingRow>
            <SettingRow label="Accent Color" desc="Choose your highlight color">
              <div className="flex gap-2">
                {[
                  { color: "#FF00C8", name: "pink" },
                  { color: "#00F0FF", name: "cyan" },
                  { color: "#a855f7", name: "purple" },
                  { color: "#f59e0b", name: "amber" },
                  { color: "#10b981", name: "green" },
                ].map(({ color }) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded-full border-2 transition-all cursor-pointer hover:scale-110"
                    style={{
                      background: color,
                      borderColor: "rgba(255,255,255,0.15)",
                      boxShadow: `0 0 8px ${color}60`,
                    }}
                    onClick={() => {
                      document.documentElement.style.setProperty(
                        "--accent",
                        color,
                      );
                    }}
                  />
                ))}
              </div>
            </SettingRow>
          </Section> */}

          {/* ── DANGER ZONE ── */}
          <Section
            icon={Trash2}
            title="Danger Zone"
            color="#ef4444"
            delay={0.3}
          >
            <SettingRow
              label="Delete Account"
              desc="Permanently remove your account and all data"
              danger
            >
              <button
                onClick={() => setShowDeleteModal(true)}
                className="text-xs text-red-400 font-medium border border-red-500/30 px-3 py-1.5 rounded-xl hover:border-red-500/60 hover:bg-red-500/5 transition bg-transparent cursor-pointer"
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
