import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Layers, Hash, AlignLeft, Tag, Target, Calendar, ShieldCheck, Flame } from "lucide-react";

const CATEGORIES = [
  "Coding & DSA",
  "Web Development",
  "Machine Learning & AI",
  "Open Source & PRs",
  "Design & UI/UX",
  "Career & Interview Prep",
  "Daily Habits & Consistency",
];

const CreateRoomModal = ({ close, create }) => {
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [goalPledge, setGoalPledge] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [durationType, setDurationType] = useState("30_day");
  const [checkinFrequency, setCheckinFrequency] = useState("daily");
  const [checkinType, setCheckinType] = useState("proof_of_work");
  const [submitting, setSubmitting] = useState(false);

  const isValid = title.trim().length > 0 && description.trim().length > 0;

  const handleCreate = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    await create({
      title: title.trim(),
      description: description.trim(),
      goal_pledge: goalPledge.trim() || title.trim(),
      category,
      duration_type: durationType,
      checkin_frequency: checkinFrequency,
      checkin_type: checkinType,
    });
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-50 px-4 overflow-y-auto py-8"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 25 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative bg-[#0d0d14] border border-purple-500/20 rounded-3xl w-full max-w-3xl overflow-hidden shadow-[0_0_60px_rgba(168,85,247,0.15)] my-auto"
      >
        {/* Top glow bar */}
        <div className="h-[2px] w-full bg-gradient-to-r from-[#FF00C8] via-purple-500 to-[#00F0FF]" />

        {/* Close */}
        <button
          onClick={close}
          className="absolute top-5 right-5 text-gray-500 hover:text-white transition cursor-pointer z-10"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col md:flex-row min-h-[460px]">
          {/* ── Left panel ── */}
          <div className="md:w-[35%] bg-gradient-to-br from-purple-900/30 to-[#0d0d14] p-8 flex flex-col justify-between border-r border-purple-500/10">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-5 border border-purple-500/30">
                <Flame className="text-[#FF00C8]" size={24} />
              </div>
              <h2 className="text-2xl font-black text-white mb-3 leading-tight">
                Accountability
                <br />
                <span className="bg-gradient-to-r from-[#FF00C8] to-[#00F0FF] bg-clip-text text-transparent">
                  Creator Room
                </span>
              </h2>
              <p className="text-gray-400 text-xs leading-relaxed">
                Set a clear sprint pledge, track daily check-ins, require Proof-of-Work, and keep your group consistent.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {[
                "Set a specific, measurable goal pledge",
                "Require daily Proof-of-Work links",
                "Peer verification keeps check-ins real",
                "Room streaks feed into global Uptime",
              ].map((tip, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-[11px] text-gray-400 font-mono"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] shrink-0" />
                  {tip}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="flex-1 p-8 flex flex-col justify-between gap-5 max-h-[80vh] overflow-y-auto">
            <div className="space-y-4">
              {/* Room Title */}
              <div>
                <label className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1.5 block">
                  Room Title *
                </label>
                <div className="relative">
                  <Hash
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    type="text"
                    placeholder="e.g. 30 Days of WebDev & SaaS Building"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-[#00F0FF]/50 transition font-sans"
                  />
                </div>
              </div>

              {/* Goal / Pledge Statement */}
              <div>
                <label className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1.5 block">
                  Group Commitment Pledge *
                </label>
                <div className="relative">
                  <Target
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400"
                  />
                  <input
                    type="text"
                    placeholder="e.g. Ship 1 GitHub commit & post daily standup log"
                    value={goalPledge}
                    onChange={(e) => setGoalPledge(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-amber-400/50 transition font-sans"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1.5 block">
                  Room Description *
                </label>
                <div className="relative">
                  <AlignLeft
                    size={14}
                    className="absolute left-3 top-3 text-gray-500"
                  />
                  <textarea
                    placeholder="What are the room rules? What is required in daily check-ins?"
                    value={description}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={3}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-[#00F0FF]/50 transition resize-none font-sans"
                  />
                </div>
              </div>

              {/* Grid: Category & Sprint Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1.5 block">
                    Category
                  </label>
                  <div className="relative">
                    <Tag
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00F0FF]/50 transition appearance-none cursor-pointer"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1.5 block">
                    Sprint Duration
                  </label>
                  <div className="relative">
                    <Calendar
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    />
                    <select
                      value={durationType}
                      onChange={(e) => setDurationType(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00F0FF]/50 transition appearance-none cursor-pointer"
                    >
                      <option value="7_day">7-Day Sprint</option>
                      <option value="14_day">14-Day Sprint</option>
                      <option value="30_day">30-Day Bootcamp</option>
                      <option value="ongoing">Ongoing Consistency</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Grid: Frequency & Checkin Requirement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1.5 block">
                    Check-in Frequency
                  </label>
                  <select
                    value={checkinFrequency}
                    onChange={(e) => setCheckinFrequency(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00F0FF]/50 transition cursor-pointer"
                  >
                    <option value="daily">Daily Check-ins</option>
                    <option value="thrice_weekly">3x per Week</option>
                    <option value="weekly">Weekly Check-in</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1.5 block">
                    Proof Requirement
                  </label>
                  <select
                    value={checkinType}
                    onChange={(e) => setCheckinType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00F0FF]/50 transition cursor-pointer"
                  >
                    <option value="proof_of_work">Proof of Work (GitHub/PR/URL)</option>
                    <option value="standup_log">Text Standup Log</option>
                    <option value="hybrid">Hybrid (PoW + Glitch Solve)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={close}
                className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <motion.button
                type="button"
                whileHover={isValid ? { scale: 1.03 } : {}}
                whileTap={isValid ? { scale: 0.97 } : {}}
                onClick={handleCreate}
                disabled={!isValid || submitting}
                className="px-6 py-2 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg"
                style={{
                  background: isValid
                    ? "linear-gradient(90deg,#FF00C8,#a855f7)"
                    : "rgba(255,255,255,0.05)",
                }}
              >
                {submitting ? "Creating..." : "Create Accountability Room ✦"}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CreateRoomModal;
