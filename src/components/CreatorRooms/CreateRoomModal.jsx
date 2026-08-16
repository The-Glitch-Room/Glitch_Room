import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Layers,
  Hash,
  AlignLeft,
  Tag,
  Target,
  Calendar,
  ShieldCheck,
  Flame,
  Clock,
  Link as LinkIcon,
  Users,
  Lock,
  Globe,
  Coins,
  Award,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Eye,
  Check,
  AlertCircle,
  Bell,
  Sparkles,
  HelpCircle,
  FileCode,
  Image as ImageIcon,
  CheckSquare,
  Handshake,
  Heart,
  Save,
} from "lucide-react";

const CATEGORIES = [
  "Coding & DSA",
  "Web Development",
  "AI/ML",
  "Projects",
  "Learning",
  "Fitness/Personal Goals",
  "Other",
];

const PROOF_TYPE_OPTIONS = [
  "GitHub Commit",
  "GitHub PR",
  "Project/Demo Link",
  "Screenshot",
  "Code Snippet",
  "Progress Log",
  "File Upload",
  "Custom Proof",
];

const CreateRoomModal = ({ close, create }) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // ── Step 1: Basic & Commitment ──
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [coverIcon, setCoverIcon] = useState("⚡");
  const [visibility, setVisibility] = useState("Public");
  const [goalPledge, setGoalPledge] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [successCriteria, setSuccessCriteria] = useState("");

  // ── Step 2: Duration, Proof & Standup ──
  const [durationType, setDurationType] = useState("30_day");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [customEndDate, setCustomEndDate] = useState("");
  const [checkinFrequency, setCheckinFrequency] = useState("daily");
  const [checkinDeadline, setCheckinDeadline] = useState("11:59 PM IST");
  const [gracePeriod, setGracePeriod] = useState("2 Hours");

  const [selectedProofTypes, setSelectedProofTypes] = useState([
    "GitHub Commit",
    "GitHub PR",
    "Project/Demo Link",
  ]);
  const [minProofReq, setMinProofReq] = useState("1");
  const [isProofMandatory, setIsProofMandatory] = useState(true);
  const [allowMultipleProofs, setAllowMultipleProofs] = useState(true);

  // Standup fields toggles
  const [accomplishmentRequired, setAccomplishmentRequired] = useState(true);
  const [proofRequired, setProofRequired] = useState(true);
  const [blockersRequired, setBlockersRequired] = useState(false);
  const [tomorrowGoalRequired, setTomorrowGoalRequired] = useState(false);

  // ── Step 3: Verification, Buddy & Uptime ──
  const [verificationRequired, setVerificationRequired] = useState(true);
  const [whoCanVerify, setWhoCanVerify] = useState("Any Room Member");
  const [minVerifications, setMinVerifications] = useState("1");
  const [verificationReward, setVerificationReward] = useState("gBits amount");

  const [enableBuddy, setEnableBuddy] = useState(true);
  const [buddyPairing, setBuddyPairing] = useState("Automatic");
  const [allowBuddyChange, setAllowBuddyChange] = useState(true);
  const [buddyReminderTime, setBuddyReminderTime] = useState("8:00 PM IST");
  const [allowBuddyNudges, setAllowBuddyNudges] = useState(true);

  const [contributesToUptime, setContributesToUptime] = useState(true);
  const [roomStreakEnabled, setRoomStreakEnabled] = useState(true);

  // ── Step 4: Stakes, Rules & Membership ──
  const [enableGbitsStake, setEnableGbitsStake] = useState(false);
  const [entryStake, setEntryStake] = useState(50);
  const [rewardPoolRules, setRewardPoolRules] = useState("Return stake on successful completion");
  const [missedCheckinPolicy, setMissedCheckinPolicy] = useState("Lose stake after 3 missed check-ins");
  const [freezeAllowance, setFreezeAllowance] = useState(2);

  const [roomRules, setRoomRules] = useState("1. Submit daily standup with proof.\n2. Be respectful and verify peer standups.");
  const [codeOfConduct, setCodeOfConduct] = useState("Keep check-ins honest and support fellow builders.");

  const [maxMembers, setMaxMembers] = useState(25);
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [allowInvites, setAllowInvites] = useState(true);
  const [requirePledgeToJoin, setRequirePledgeToJoin] = useState(true);

  const toggleProofType = (type) => {
    if (selectedProofTypes.includes(type)) {
      if (selectedProofTypes.length > 1) {
        setSelectedProofTypes(selectedProofTypes.filter((t) => t !== type));
      }
    } else {
      setSelectedProofTypes([...selectedProofTypes, type]);
    }
  };

  const isStep1Valid = title.trim().length > 0 && description.trim().length > 0 && goalPledge.trim().length > 0;
  const isStep2Valid = selectedProofTypes.length > 0;

  const handlePublish = async (isDraft = false) => {
    if (!isStep1Valid || submitting) return;
    setSubmitting(true);

    const roomPayload = {
      title: title.trim(),
      name: title.trim(),
      description: description.trim(),
      category,
      cover_icon: coverIcon,
      visibility,
      goal_pledge: goalPledge.trim(),
      expected_outcome: expectedOutcome.trim(),
      success_criteria: successCriteria.trim(),
      duration_type: durationType,
      start_date: startDate,
      end_date: customEndDate || startDate,
      checkin_frequency: checkinFrequency,
      checkin_deadline: checkinDeadline,
      grace_period: gracePeriod,
      proof_types: selectedProofTypes,
      min_proof_req: parseInt(minProofReq) || 1,
      is_proof_mandatory: isProofMandatory,
      allow_multiple_proofs: allowMultipleProofs,
      standup_rules: {
        accomplishment_required: accomplishmentRequired,
        proof_required: proofRequired,
        blockers_required: blockersRequired,
        tomorrow_goal_required: tomorrowGoalRequired,
      },
      verification_system: {
        required: verificationRequired,
        who_can_verify: whoCanVerify,
        min_verifications: parseInt(minVerifications) || 1,
        reward: verificationReward,
      },
      buddy_system: {
        enabled: enableBuddy,
        pairing: buddyPairing,
        allow_change: allowBuddyChange,
        reminder_time: buddyReminderTime,
        allow_nudges: allowBuddyNudges,
      },
      uptime_integration: {
        contributes_to_uptime: contributesToUptime,
        room_streak_enabled: roomStreakEnabled,
      },
      gbits_stake: {
        enabled: enableGbitsStake,
        entry_stake: enableGbitsStake ? entryStake : 0,
        reward_rules: rewardPoolRules,
        missed_policy: missedCheckinPolicy,
        freezes: freezeAllowance,
      },
      rules: {
        room_rules: roomRules,
        code_of_conduct: codeOfConduct,
      },
      membership: {
        max_members: maxMembers,
        approval_required: approvalRequired,
        allow_invites: allowInvites,
        require_pledge_to_join: requirePledgeToJoin,
      },
      is_draft: isDraft,
    };

    await create(roomPayload);
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex justify-center items-center z-50 px-4 overflow-y-auto py-6"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 25 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative bg-[#0d0d16] border border-purple-500/25 rounded-3xl w-full max-w-4xl overflow-hidden shadow-[0_0_80px_rgba(168,85,247,0.2)] my-auto font-sans"
      >
        {/* Top Glow Bar */}
        <div className="h-[2px] w-full bg-gradient-to-r from-[#FF00C8] via-purple-500 to-[#00F0FF]" />

        {/* Close Button */}
        <button
          onClick={close}
          className="absolute top-5 right-5 text-gray-500 hover:text-white transition cursor-pointer z-20"
        >
          <X size={20} />
        </button>

        {/* ── STEP PROGRESS BAR HEADER ── */}
        <div className="bg-[#080810] border-b border-white/10 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[#FF00C8]">
              <Flame size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-none">Create Accountability Room</h3>
              <span className="text-[10px] font-mono text-gray-400">Step {step} of 5</span>
            </div>
          </div>

          {/* Wizard Step Pills */}
          <div className="hidden sm:flex items-center gap-2">
            {[
              { id: 1, label: "Basics & Pledge" },
              { id: 2, label: "Schedule & Proof" },
              { id: 3, label: "Verification & Uptime" },
              { id: 4, label: "Stakes & Rules" },
              { id: 5, label: "Preview & Publish" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => (s.id < step || isStep1Valid) && setStep(s.id)}
                className={`px-3 py-1 rounded-xl text-[11px] font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  step === s.id
                    ? "bg-gradient-to-r from-[#FF00C8] to-purple-600 text-white shadow-lg"
                    : step > s.id
                    ? "bg-green-500/10 text-green-400 border border-green-500/30"
                    : "bg-white/5 text-gray-500"
                }`}
              >
                {step > s.id ? <Check size={12} /> : <span>{s.id}.</span>}
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── STEP CONTENT AREA ── */}
        <div className="p-6 sm:p-8 max-h-[72vh] overflow-y-auto space-y-6">
          {/* STEP 1: BASICS & COMMITMENT PLEDGE */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="border-b border-white/10 pb-3">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Target size={18} className="text-[#FF00C8]" />
                  <span>1. Basic Room Info & Group Commitment</span>
                </h4>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  Define the core purpose, pledge statement, and visibility of your accountability room.
                </p>
              </div>

              {/* Title & Cover Icon */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-9">
                  <label className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1 block">
                    Room Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 30 Days of Code & Uptime Sprint"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#07070d] border border-white/10 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-[#00F0FF]/50 transition font-sans"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1 block">
                    Icon / Emoji
                  </label>
                  <select
                    value={coverIcon}
                    onChange={(e) => setCoverIcon(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#07070d] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00F0FF]/50 transition cursor-pointer"
                  >
                    <option value="⚡">⚡ Lightning</option>
                    <option value="🔥">🔥 Fire Streak</option>
                    <option value="🎯">🎯 Target Goal</option>
                    <option value="🚀">🚀 Rocket Sprint</option>
                    <option value="💻">💻 Code Builder</option>
                    <option value="🧠">🧠 Learning Mind</option>
                  </select>
                </div>
              </div>

              {/* Group Commitment Pledge */}
              <div>
                <label className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider mb-1 block flex items-center gap-1">
                  <Flame size={13} />
                  <span>Group Commitment Pledge *</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ship 1 GitHub commit & post a daily standup before 11:59 PM"
                  value={goalPledge}
                  onChange={(e) => setGoalPledge(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#07070d] border border-amber-500/30 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-amber-400 transition font-sans"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1 block">
                  Room Description *
                </label>
                <textarea
                  placeholder="What is this room about? What are the daily consistency requirements?"
                  value={description}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#07070d] border border-white/10 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-[#00F0FF]/50 transition font-sans resize-none"
                />
              </div>

              {/* Category & Visibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1 block">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#07070d] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00F0FF]/50 transition cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1 block">
                    Room Visibility *
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#07070d] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00F0FF]/50 transition cursor-pointer"
                  >
                    <option value="Public">Public (Anyone can discover & join)</option>
                    <option value="Private">Private (Requires password / link)</option>
                    <option value="Invite Only">Invite Only (Host approval needed)</option>
                  </select>
                </div>
              </div>

              {/* Expected Outcome & Success Criteria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1 block">
                    Expected Outcome
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Build 1 full-stack app & master DSA recursion"
                    value={expectedOutcome}
                    onChange={(e) => setExpectedOutcome(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#07070d] border border-white/10 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-[#00F0FF]/50 transition font-sans"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1 block">
                    Success Criteria
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Complete >= 80% of daily check-ins on time"
                    value={successCriteria}
                    onChange={(e) => setSuccessCriteria(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#07070d] border border-white/10 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-[#00F0FF]/50 transition font-sans"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: DURATION, PROOF OF WORK & STANDUP SETTINGS */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="border-b border-white/10 pb-3">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar size={18} className="text-[#00F0FF]" />
                  <span>2. Schedule, Proof Requirements & Standup Rules</span>
                </h4>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  Configure sprint duration, daily deadlines, and required Proof of Work types.
                </p>
              </div>

              {/* Schedule Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1 block">
                    Sprint Duration *
                  </label>
                  <select
                    value={durationType}
                    onChange={(e) => setDurationType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#07070d] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00F0FF]/50 transition cursor-pointer"
                  >
                    <option value="7_day">7 Days Sprint</option>
                    <option value="14_day">14 Days Sprint</option>
                    <option value="30_day">30 Days Bootcamp</option>
                    <option value="60_day">60 Days Challenge</option>
                    <option value="100_day">100 Days Challenge</option>
                    <option value="ongoing">Ongoing Consistency</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1 block">
                    Check-in Frequency *
                  </label>
                  <select
                    value={checkinFrequency}
                    onChange={(e) => setCheckinFrequency(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#07070d] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00F0FF]/50 transition cursor-pointer"
                  >
                    <option value="daily">Daily Check-ins</option>
                    <option value="thrice_weekly">3× per Week</option>
                    <option value="weekly">Weekly Check-in</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1 block">
                    Daily Deadline *
                  </label>
                  <input
                    type="text"
                    value={checkinDeadline}
                    onChange={(e) => setCheckinDeadline(e.target.value)}
                    placeholder="11:59 PM IST"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#07070d] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00F0FF]/50 transition font-mono"
                  />
                </div>
              </div>

              {/* Proof Types Selection (Multi-select) */}
              <div>
                <label className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-2 block">
                  Accepted Proof of Work Types (Select Multiple) *
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROOF_TYPE_OPTIONS.map((type) => {
                    const isSelected = selectedProofTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleProofType(type)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer border ${
                          isSelected
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm"
                            : "bg-[#07070d] text-gray-400 border-white/10 hover:text-white"
                        }`}
                      >
                        {isSelected ? <CheckSquare size={13} className="text-purple-400" /> : <div className="w-3 h-3 rounded-sm border border-gray-600" />}
                        <span>{type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mandatory Proof & Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#07070d] border border-white/10">
                  <span className="text-xs text-gray-300 font-mono font-semibold">Is Proof Mandatory?</span>
                  <button
                    type="button"
                    onClick={() => setIsProofMandatory(!isProofMandatory)}
                    className={`w-11 h-6 rounded-full transition p-1 cursor-pointer ${
                      isProofMandatory ? "bg-purple-600" : "bg-gray-700"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition transform ${
                        isProofMandatory ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#07070d] border border-white/10">
                  <span className="text-xs text-gray-300 font-mono font-semibold">Allow Multiple Proofs?</span>
                  <button
                    type="button"
                    onClick={() => setAllowMultipleProofs(!allowMultipleProofs)}
                    className={`w-11 h-6 rounded-full transition p-1 cursor-pointer ${
                      allowMultipleProofs ? "bg-purple-600" : "bg-gray-700"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition transform ${
                        allowMultipleProofs ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Standup Form Required Fields Toggles */}
              <div>
                <label className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-2 block">
                  Daily Standup Form Fields
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[#07070d] border border-white/10 text-xs font-mono flex items-center justify-between">
                    <span className="text-gray-300">Accomplishment</span>
                    <span className="text-green-400 font-bold">Required</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setProofRequired(!proofRequired)}
                    className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between cursor-pointer transition ${
                      proofRequired ? "bg-purple-500/10 border-purple-500/30 text-purple-300" : "bg-[#07070d] border-white/10 text-gray-400"
                    }`}
                  >
                    <span>Proof Link</span>
                    <span className="font-bold">{proofRequired ? "Required" : "Optional"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBlockersRequired(!blockersRequired)}
                    className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between cursor-pointer transition ${
                      blockersRequired ? "bg-purple-500/10 border-purple-500/30 text-purple-300" : "bg-[#07070d] border-white/10 text-gray-400"
                    }`}
                  >
                    <span>Blockers</span>
                    <span className="font-bold">{blockersRequired ? "Required" : "Optional"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTomorrowGoalRequired(!tomorrowGoalRequired)}
                    className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between cursor-pointer transition ${
                      tomorrowGoalRequired ? "bg-purple-500/10 border-purple-500/30 text-purple-300" : "bg-[#07070d] border-white/10 text-gray-400"
                    }`}
                  >
                    <span>Tomorrow's Goal</span>
                    <span className="font-bold">{tomorrowGoalRequired ? "Required" : "Optional"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: VERIFICATION, BUDDY & UPTIME INTEGRATION */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="border-b border-white/10 pb-3">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck size={18} className="text-purple-400" />
                  <span>3. Peer Verification, Accountability Buddies & Global Uptime</span>
                </h4>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  Set rules for peer vouches, buddy pairing, and global uptime system integration.
                </p>
              </div>

              {/* Peer Verification Settings */}
              <div className="space-y-3 bg-[#07070d] border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono">Enable Peer Verification?</span>
                  <button
                    type="button"
                    onClick={() => setVerificationRequired(!verificationRequired)}
                    className={`w-11 h-6 rounded-full transition p-1 cursor-pointer ${
                      verificationRequired ? "bg-purple-600" : "bg-gray-700"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition transform ${
                        verificationRequired ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {verificationRequired && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="text-[10px] text-gray-400 font-mono block mb-1">Who Can Verify?</label>
                      <select
                        value={whoCanVerify}
                        onChange={(e) => setWhoCanVerify(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0d0d16] border border-white/10 text-white text-xs focus:outline-none"
                      >
                        <option value="Any Room Member">Any Room Member</option>
                        <option value="Accountability Buddy">Accountability Buddy</option>
                        <option value="Room Host">Room Host</option>
                        <option value="Host + Members">Host + Members</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-mono block mb-1">Min Verifications</label>
                      <select
                        value={minVerifications}
                        onChange={(e) => setMinVerifications(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0d0d16] border border-white/10 text-white text-xs focus:outline-none"
                      >
                        <option value="1">1 Vouch</option>
                        <option value="2">2 Vouches</option>
                        <option value="3">3 Vouches</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-mono block mb-1">Verification Reward</label>
                      <select
                        value={verificationReward}
                        onChange={(e) => setVerificationReward(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0d0d16] border border-white/10 text-white text-xs focus:outline-none"
                      >
                        <option value="gBits amount">+35 gBits Reward</option>
                        <option value="Uptime contribution">Uptime Streak Boost</option>
                        <option value="No additional reward">Standard Verification</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Accountability Buddy Settings */}
              <div className="space-y-3 bg-[#07070d] border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                    <Handshake size={15} className="text-[#00F0FF]" />
                    <span>Enable Accountability Buddies?</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setEnableBuddy(!enableBuddy)}
                    className={`w-11 h-6 rounded-full transition p-1 cursor-pointer ${
                      enableBuddy ? "bg-purple-600" : "bg-gray-700"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition transform ${
                        enableBuddy ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {enableBuddy && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[10px] text-gray-400 font-mono block mb-1">Pairing Method</label>
                      <select
                        value={buddyPairing}
                        onChange={(e) => setBuddyPairing(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0d0d16] border border-white/10 text-white text-xs focus:outline-none"
                      >
                        <option value="Automatic">Automatic Pair-up on Join</option>
                        <option value="Manual">Manual Selection by Members</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-mono block mb-1">Buddy Reminder Time</label>
                      <input
                        type="text"
                        value={buddyReminderTime}
                        onChange={(e) => setBuddyReminderTime(e.target.value)}
                        placeholder="8:00 PM IST"
                        className="w-full px-3 py-2 rounded-xl bg-[#0d0d16] border border-white/10 text-white text-xs focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Website Global Uptime Integration */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 to-[#07070d] border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame size={16} className="text-amber-400" />
                    <span className="text-xs font-bold text-white font-mono">Website Global Uptime System Integration</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                    Single Source of Truth
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  On-time room standups feed directly into your website profile's global uptime streak. No duplicate streak calculations!
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP 4: GBITS STAKES, RULES & MEMBERSHIP SETTINGS */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="border-b border-white/10 pb-3">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Coins size={18} className="text-amber-400" />
                  <span>4. gBits Commitment Stakes, Room Rules & Membership</span>
                </h4>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  (Optional) Add gBits commitment stakes, room guidelines, and membership limits.
                </p>
              </div>

              {/* gBits Commitment Stakes (Optional) */}
              <div className="space-y-3 bg-[#07070d] border border-amber-500/30 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 font-mono flex items-center gap-1.5">
                    <Coins size={15} />
                    <span>Enable gBits Commitment Stake? (Optional)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setEnableGbitsStake(!enableGbitsStake)}
                    className={`w-11 h-6 rounded-full transition p-1 cursor-pointer ${
                      enableGbitsStake ? "bg-amber-500" : "bg-gray-700"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition transform ${
                        enableGbitsStake ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {enableGbitsStake && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="text-[10px] text-gray-400 font-mono block mb-1">Entry Stake Amount</label>
                      <input
                        type="number"
                        value={entryStake}
                        onChange={(e) => setEntryStake(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0d0d16] border border-white/10 text-white text-xs focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-mono block mb-1">Reward Pool Rules</label>
                      <select
                        value={rewardPoolRules}
                        onChange={(e) => setRewardPoolRules(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0d0d16] border border-white/10 text-white text-xs focus:outline-none"
                      >
                        <option value="Return stake on successful completion">Return stake on completion</option>
                        <option value="Share bonus pool">Share bonus pool</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-mono block mb-1">Missed Policy</label>
                      <select
                        value={missedCheckinPolicy}
                        onChange={(e) => setMissedCheckinPolicy(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0d0d16] border border-white/10 text-white text-xs focus:outline-none"
                      >
                        <option value="Lose stake after 3 missed check-ins">Lose stake after 3 misses</option>
                        <option value="No penalty">No penalty</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Room Guidelines & Rules */}
              <div>
                <label className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1 block">
                  Room Rules & Guidelines *
                </label>
                <textarea
                  value={roomRules}
                  onChange={(e) => setRoomRules(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 rounded-xl bg-[#07070d] border border-white/10 text-white text-xs focus:outline-none resize-none font-sans"
                />
              </div>

              {/* Membership Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1 block">
                    Max Members Limit
                  </label>
                  <input
                    type="number"
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#07070d] border border-white/10 text-white text-xs focus:outline-none font-mono"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#07070d] border border-white/10">
                  <span className="text-xs text-gray-300 font-mono">Require Pledge to Join?</span>
                  <button
                    type="button"
                    onClick={() => setRequirePledgeToJoin(!requirePledgeToJoin)}
                    className={`w-9 h-5 rounded-full transition p-0.5 cursor-pointer ${
                      requirePledgeToJoin ? "bg-purple-600" : "bg-gray-700"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition transform ${
                        requirePledgeToJoin ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#07070d] border border-white/10">
                  <span className="text-xs text-gray-300 font-mono">Allow Member Invites?</span>
                  <button
                    type="button"
                    onClick={() => setAllowInvites(!allowInvites)}
                    className={`w-9 h-5 rounded-full transition p-0.5 cursor-pointer ${
                      allowInvites ? "bg-purple-600" : "bg-gray-700"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition transform ${
                        allowInvites ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: ROOM PREVIEW & PUBLISH */}
          {step === 5 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="border-b border-white/10 pb-3">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Eye size={18} className="text-[#00F0FF]" />
                  <span>5. Live Room Preview & Publish Confirmation</span>
                </h4>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  Review your configured Accountability Room details before publishing.
                </p>
              </div>

              {/* High-Fidelity Room Preview Card */}
              <div className="bg-[#0b0b14] border border-purple-500/40 rounded-3xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF00C8] via-purple-500 to-[#00F0FF]" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{coverIcon}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {durationType.replace("_", "-")}
                      </span>
                    </div>

                    <h2 className="text-xl font-extrabold text-white">{title || "Untitled Room"}</h2>
                    <p className="text-xs text-gray-400 font-mono">{description}</p>
                  </div>

                  <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-green-500/10 border border-green-500/30 text-green-400 shrink-0">
                    {visibility} Room
                  </span>
                </div>

                {/* Goal Pledge Box */}
                <div className="bg-[#07070d] border border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-3">
                  <Target size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                      GROUP COMMITMENT PLEDGE
                    </span>
                    <p className="text-xs text-gray-200 font-mono mt-0.5 leading-relaxed">
                      {goalPledge}
                    </p>
                  </div>
                </div>

                {/* Grid Summary Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2">
                  <div className="bg-[#07070d] p-3 rounded-xl border border-white/5">
                    <span className="text-gray-500 text-[10px] block font-bold">FREQUENCY</span>
                    <span className="text-white capitalize">{checkinFrequency}</span>
                  </div>

                  <div className="bg-[#07070d] p-3 rounded-xl border border-white/5">
                    <span className="text-gray-500 text-[10px] block font-bold">DEADLINE</span>
                    <span className="text-[#00F0FF]">{checkinDeadline}</span>
                  </div>

                  <div className="bg-[#07070d] p-3 rounded-xl border border-white/5">
                    <span className="text-gray-500 text-[10px] block font-bold">PROOFS REQUIRED</span>
                    <span className="text-purple-300">{selectedProofTypes.length} Types</span>
                  </div>

                  <div className="bg-[#07070d] p-3 rounded-xl border border-white/5">
                    <span className="text-gray-500 text-[10px] block font-bold">ENTRY STAKE</span>
                    <span className="text-amber-400 font-bold">{enableGbitsStake ? `${entryStake} gBits` : "Free"}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* ── FOOTER NAVIGATION ACTIONS ── */}
        <div className="bg-[#080810] border-t border-white/10 px-6 py-4 flex items-center justify-between">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Previous Step</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={close}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-mono font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step === 5 && (
              <button
                type="button"
                onClick={() => handlePublish(true)}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Save size={14} />
                <span>Save as Draft</span>
              </button>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !isStep1Valid}
                className="px-6 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition shadow-lg"
                style={{
                  background: isStep1Valid
                    ? "linear-gradient(90deg, #FF00C8, #a855f7)"
                    : "rgba(255,255,255,0.05)",
                }}
              >
                <span>Next Step</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePublish(false)}
                disabled={!isStep1Valid || submitting}
                className="px-6 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition shadow-lg"
                style={{
                  background: "linear-gradient(90deg, #FF00C8, #a855f7)",
                }}
              >
                <Flame size={15} />
                <span>{submitting ? "Publishing..." : "Create Accountability Room ✦"}</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CreateRoomModal;
