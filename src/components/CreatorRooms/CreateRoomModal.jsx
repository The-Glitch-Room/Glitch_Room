import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Layers, Hash, AlignLeft, Tag } from "lucide-react";

const CATEGORIES = [
  "Coding",
  "Web Development",
  "Machine Learning",
  "AI & Prompting",
  "Design",
  "English",
  "Career / Interview Prep",
  "General",
];

const CreateRoomModal = ({ close, create }) => {
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [submitting, setSubmitting] = useState(false);

  const isValid = title.trim().length > 0 && description.trim().length > 0;

  const handleCreate = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    await create({
      title: title.trim(),
      description: description.trim(),
      category,
    });
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative bg-[#0d0d14] border border-purple-500/20 rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_0_60px_rgba(168,85,247,0.15)]"
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

        <div className="flex flex-col md:flex-row min-h-[360px]">
          {/* ── Left panel ── */}
          <div className="md:w-[38%] bg-gradient-to-br from-purple-900/30 to-[#0d0d14] p-8 flex flex-col justify-between border-r border-purple-500/10">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-5">
                <Layers className="text-purple-400" size={22} />
              </div>
              <h2 className="text-2xl font-black text-white mb-3 leading-tight">
                Create Your
                <br />
                <span className="bg-gradient-to-r from-[#FF00C8] to-purple-400 bg-clip-text text-transparent">
                  Creator Room
                </span>
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Set up a focused learning space for you and your people. Keep
                each other accountable and grow together.
              </p>
            </div>
            <div className="mt-8 space-y-3">
              {[
                "Pick a clear, specific title",
                "Choose the right category",
                "Keep it small and focused",
                "Invite friends after creating",
              ].map((tip, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-gray-500"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                  {tip}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="flex-1 p-8 flex flex-col gap-5 justify-between">
            <div className="flex flex-col gap-5">
              {/* Title */}
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1.5 block">
                  Room Title *
                </label>
                <div className="relative">
                  <Hash
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                  />
                  <input
                    type="text"
                    placeholder="e.g. Python DSA Grinders"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-[#111118] border border-white/6 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1.5 block">
                  Description *
                </label>
                <div className="relative">
                  <AlignLeft
                    size={14}
                    className="absolute left-3 top-3.5 text-gray-600"
                  />
                  <textarea
                    placeholder="What's this room about? What's the weekly goal?"
                    value={description}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={4}
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-[#111118] border border-white/6 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition resize-none"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1.5 block">
                  Category
                </label>
                <div className="relative">
                  <Tag
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
                  />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-[#111118] border border-white/6 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={close}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <motion.button
                whileHover={isValid ? { scale: 1.03 } : {}}
                whileTap={isValid ? { scale: 0.97 } : {}}
                onClick={handleCreate}
                disabled={!isValid || submitting}
                className="px-6 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-white"
                style={{
                  background: isValid
                    ? "linear-gradient(90deg,#FF00C8,#a855f7)"
                    : "rgba(255,255,255,0.05)",
                }}
              >
                {submitting ? "Creating..." : "Create Room ✦"}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CreateRoomModal;
