// src/components/DebuggingHandbook.jsx
import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Search,
  Check,
  ChevronRight,
  ChevronLeft,
  Terminal,
  Code2,
  AlertCircle,
  Lightbulb,
  Copy,
  Layers,
  ArrowRight,
  Clock,
  HelpCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Filter,
  Sparkles
} from "lucide-react";
import { HANDBOOK_PHASE_1 } from "../data/debuggingHandbookData";

export default function DebuggingHandbook() {
  const [activeTopicId, setActiveTopicId] = useState(HANDBOOK_PHASE_1.topics[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [copiedCode, setCopiedCode] = useState(false);
  const [readTopics, setReadTopics] = useState(() => {
    try {
      const saved = localStorage.getItem("glitch_handbook_phase1_read");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const readerTopRef = useRef(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set(HANDBOOK_PHASE_1.topics.map((t) => t.category));
    return ["All", ...Array.from(set)];
  }, []);

  // Filter topics based on search & category
  const filteredTopics = useMemo(() => {
    return HANDBOOK_PHASE_1.topics.filter((topic) => {
      const matchesCategory =
        selectedCategory === "All" || topic.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.whatIsIt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  // Current active topic
  const activeIndex = HANDBOOK_PHASE_1.topics.findIndex(
    (t) => t.id === activeTopicId
  );
  const currentTopic =
    HANDBOOK_PHASE_1.topics[activeIndex] || HANDBOOK_PHASE_1.topics[0];

  const handleSelectTopic = (id) => {
    setActiveTopicId(id);
    if (readerTopRef.current) {
      readerTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleNextTopic = () => {
    if (activeIndex < HANDBOOK_PHASE_1.topics.length - 1) {
      handleSelectTopic(HANDBOOK_PHASE_1.topics[activeIndex + 1].id);
    }
  };

  const handlePrevTopic = () => {
    if (activeIndex > 0) {
      handleSelectTopic(HANDBOOK_PHASE_1.topics[activeIndex - 1].id);
    }
  };

  const toggleAnswer = (topicId) => {
    setRevealedAnswers((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  const toggleReadTopic = (topicId) => {
    setReadTopics((prev) => {
      const updated = { ...prev, [topicId]: !prev[topicId] };
      try {
        localStorage.setItem("glitch_handbook_phase1_read", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const completedCount = Object.values(readTopics).filter(Boolean).length;
  const progressPercent = Math.round(
    (completedCount / HANDBOOK_PHASE_1.topics.length) * 100
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* ── SECTION HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-5 gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center shrink-0 mt-0.5">
            <BookOpen size={22} className="text-[#00F0FF]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/20 px-2.5 py-0.5 rounded-md">
                Field Guide · Phase 1
              </span>
              <span className="text-[11px] font-mono text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                10 Foundations
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Debugging Handbook: Understanding Errors & Debugging
            </h2>
            <p className="text-xs md:text-sm text-gray-400 font-mono mt-1 max-w-2xl leading-relaxed">
              Master the foundational mindset before jumping into code: how errors arise,
              how to read stack traces without panic, and how to isolate the true root cause.
            </p>
          </div>
        </div>

        {/* Reading Progress Indicator */}
        <div className="flex items-center gap-3 bg-[#0f0f18] border border-white/10 px-4 py-2 rounded-xl shrink-0 self-start md:self-auto">
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase text-gray-400">
              Phase 1 Progress
            </div>
            <div className="text-xs font-mono font-bold text-white">
              {completedCount} of {HANDBOOK_PHASE_1.topics.length} read ({progressPercent}%)
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative">
            <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/10"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#00F0FF] transition-all duration-500 ease-out"
                strokeDasharray={`${progressPercent}, 100`}
                strokeWidth="3"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[10px] font-mono font-bold text-[#00F0FF]">
              {progressPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN HANDBOOK CONTAINER: SIDEBAR + READER ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN: TOPIC DIRECTORY (lg:col-span-4) ── */}
        <div className="lg:col-span-4 bg-[#0a0a12] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
          {/* Search Bar */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search topics, terms, errors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121220] border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/50 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-mono">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#00F0FF]/15 border-[#00F0FF]/40 text-[#00F0FF] font-semibold"
                    : "bg-white/5 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Topic List */}
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filteredTopics.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs font-mono">
                No handbook topics match "{searchQuery}"
              </div>
            ) : (
              filteredTopics.map((topic) => {
                const isActive = topic.id === activeTopicId;
                const isRead = !!readTopics[topic.id];
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleSelectTopic(topic.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 group cursor-pointer ${
                      isActive
                        ? "bg-[#141424] border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.08)]"
                        : "bg-[#0d0d16] border-white/5 hover:border-white/15 hover:bg-[#11111d]"
                    }`}
                  >
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md shrink-0 transition ${
                        isActive
                          ? "bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30"
                          : "bg-white/5 text-gray-400 group-hover:text-gray-300"
                      }`}
                    >
                      {topic.number}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                          {topic.category}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                          <Clock size={10} />
                          {topic.readTime}
                        </span>
                      </div>
                      <h4
                        className={`text-xs font-bold truncate transition ${
                          isActive ? "text-white" : "text-gray-300 group-hover:text-white"
                        }`}
                      >
                        {topic.title}
                      </h4>
                    </div>

                    <div className="shrink-0 self-center">
                      {isRead ? (
                        <CheckCircle2 size={15} className="text-[#00F0FF]" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-white/20 group-hover:border-white/40" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Notice */}
          <div className="pt-3 border-t border-white/5 text-[11px] font-mono text-gray-400 flex items-center justify-between">
            <span>Phase 1 of 1 active</span>
            <span className="text-gray-400">Roadmap: React & API Handbooks coming soon</span>
          </div>
        </div>

        {/* ── RIGHT COLUMN: READING AREA (lg:col-span-8) ── */}
        <div
          ref={readerTopRef}
          className="lg:col-span-8 bg-[#0a0a12] border border-white/10 rounded-2xl p-5 sm:p-8 flex flex-col justify-between shadow-2xl space-y-8"
        >
          {/* Article Header */}
          <div className="border-b border-white/10 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/25 px-2.5 py-1 rounded-md">
                  TOPIC {currentTopic.number} / {HANDBOOK_PHASE_1.topics.length}
                </span>
                <span className="text-xs font-mono text-gray-400 bg-white/5 border border-white/5 px-2.5 py-1 rounded-md">
                  {currentTopic.category}
                </span>
                <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                  <Clock size={12} /> {currentTopic.readTime}
                </span>
              </div>

              {/* Mark as Read Toggle */}
              <button
                type="button"
                onClick={() => toggleReadTopic(currentTopic.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition border cursor-pointer ${
                  readTopics[currentTopic.id]
                    ? "bg-[#00F0FF]/15 border-[#00F0FF]/30 text-[#00F0FF]"
                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {readTopics[currentTopic.id] ? (
                  <>
                    <Check size={14} /> Marked as Read
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} /> Mark as Read
                  </>
                )}
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {currentTopic.title}
            </h1>
            <p className="text-sm text-gray-300 font-mono mt-2 leading-relaxed">
              {currentTopic.summary}
            </p>
          </div>

          {/* 1. What Is It? */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#00F0FF]">
              <HelpCircle size={15} />
              <span>What is it?</span>
            </div>
            <div className="text-sm text-gray-300 leading-relaxed font-sans space-y-3 whitespace-pre-line">
              {currentTopic.whatIsIt}
            </div>
          </div>

          {/* 2. What Does It Look Like? (Dynamic Code/Terminal/Flow/Table) */}
          {currentTopic.whatDoesItLookLike && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-purple-300">
                  <Code2 size={15} />
                  <span>{currentTopic.whatDoesItLookLike.title || "What does it look like?"}</span>
                </div>
                {currentTopic.whatDoesItLookLike.code && (
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(currentTopic.whatDoesItLookLike.code)
                    }
                    className="flex items-center gap-1 text-[11px] font-mono text-gray-400 hover:text-[#00F0FF] transition cursor-pointer"
                  >
                    {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                    {copiedCode ? "Copied" : "Copy"}
                  </button>
                )}
              </div>

              {/* Code / Terminal Block */}
              {currentTopic.whatDoesItLookLike.code && (
                <div className="rounded-xl overflow-hidden border border-white/10 bg-[#07070d]">
                  <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02] flex items-center justify-between text-[11px] font-mono text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span>{currentTopic.whatDoesItLookLike.language || "code"}</span>
                  </div>
                  <pre className="p-4 text-xs font-mono text-gray-200 overflow-x-auto leading-relaxed">
                    <code>{currentTopic.whatDoesItLookLike.code}</code>
                  </pre>
                  {currentTopic.whatDoesItLookLike.note && (
                    <div className="px-4 py-2.5 bg-white/[0.02] border-t border-white/5 text-[11px] font-mono text-gray-400">
                      💡 {currentTopic.whatDoesItLookLike.note}
                    </div>
                  )}
                </div>
              )}

              {/* Diagram / Flow representation */}
              {currentTopic.whatDoesItLookLike.diagram && (
                <div className="p-4 rounded-xl border border-white/10 bg-[#07070d] overflow-x-auto font-mono text-xs text-[#00F0FF]/90 leading-relaxed whitespace-pre">
                  {currentTopic.whatDoesItLookLike.diagram}
                </div>
              )}

              {/* Table representation for Types of Errors */}
              {currentTopic.whatDoesItLookLike.items && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentTopic.whatDoesItLookLike.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-white/10 bg-[#0d0d16] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h5 className="font-bold text-xs text-white">
                            {item.type}
                          </h5>
                          <span className="text-[10px] font-mono text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/20 px-2 py-0.5 rounded">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-300 font-sans leading-relaxed mb-2">
                          {item.what}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">
                        When: {item.when}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Annotated Error Breakdown */}
              {currentTopic.whatDoesItLookLike.breakdown && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/[0.04] font-mono text-xs text-red-200 whitespace-pre-wrap leading-relaxed">
                    {currentTopic.whatDoesItLookLike.raw}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentTopic.whatDoesItLookLike.breakdown.map((part, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-white/10 bg-[#0d0d16]"
                      >
                        <span className="text-[10px] font-mono font-bold text-[#00F0FF] uppercase block mb-1">
                          {part.label}
                        </span>
                        <code className="text-xs font-mono text-white bg-black/40 px-1.5 py-0.5 rounded block mb-1.5 truncate">
                          {part.value}
                        </code>
                        <p className="text-[11px] text-gray-300 leading-snug">
                          {part.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stack Trace Visualization */}
              {currentTopic.whatDoesItLookLike.flow && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-white/10 bg-[#07070d] space-y-2">
                    <div className="text-[11px] font-mono text-gray-400 mb-2">
                      Execution Call Sequence (Bottom to Top Moment of Crash):
                    </div>
                    {currentTopic.whatDoesItLookLike.flow.map((step, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-mono ${
                          step.isError
                            ? "bg-red-500/10 border-red-500/30 text-red-300 font-bold"
                            : step.isSource
                            ? "bg-[#00F0FF]/10 border-[#00F0FF]/30 text-[#00F0FF]"
                            : "bg-white/5 border-white/5 text-gray-300"
                        }`}
                      >
                        <span>{step.step}: <span className="text-white">{step.func}</span></span>
                        <span className="text-[10px] text-gray-400 font-mono">{step.file}</span>
                      </div>
                    ))}
                  </div>
                  {currentTopic.whatDoesItLookLike.rawText && (
                    <div className="p-3.5 rounded-xl border border-white/10 bg-black/60 font-mono text-[11px] text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {currentTopic.whatDoesItLookLike.rawText}
                    </div>
                  )}
                </div>
              )}

              {/* Workflow 9 Steps Visualization */}
              {currentTopic.whatDoesItLookLike.steps && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {currentTopic.whatDoesItLookLike.steps.map((st, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-white/10 bg-[#0d0d16] flex flex-col justify-between"
                    >
                      <span className="text-xs font-mono font-bold text-[#00F0FF] mb-1">
                        {st.name}
                      </span>
                      <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
                        {st.desc}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tools List */}
              {currentTopic.whatDoesItLookLike.tools && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentTopic.whatDoesItLookLike.tools.map((tl, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-white/10 bg-[#0d0d16] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-bold text-xs text-white font-mono">
                            {tl.name}
                          </h5>
                        </div>
                        <div className="text-[10px] font-mono text-[#00F0FF] mb-1.5">
                          {tl.role}
                        </div>
                        <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
                          {tl.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Symptom vs Root Cause Comparison */}
              {currentTopic.whatDoesItLookLike.symptom && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/[0.03]">
                    <span className="text-xs font-mono font-bold text-red-400 block mb-2">
                      ⚠️ {currentTopic.whatDoesItLookLike.symptom.title}
                    </span>
                    <pre className="p-2.5 rounded bg-black/40 text-[11px] font-mono text-red-200 overflow-x-auto mb-2">
                      <code>{currentTopic.whatDoesItLookLike.symptom.code}</code>
                    </pre>
                    <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                      {currentTopic.whatDoesItLookLike.symptom.description}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03]">
                    <span className="text-xs font-mono font-bold text-emerald-400 block mb-2">
                      ✅ {currentTopic.whatDoesItLookLike.rootCause.title}
                    </span>
                    <pre className="p-2.5 rounded bg-black/40 text-[11px] font-mono text-emerald-200 overflow-x-auto mb-2">
                      <code>{currentTopic.whatDoesItLookLike.rootCause.code}</code>
                    </pre>
                    <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                      {currentTopic.whatDoesItLookLike.rootCause.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Why Does It Happen? & How to Investigate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Why does it happen */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                <AlertCircle size={15} />
                <span>Why does it happen?</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-300 font-sans leading-relaxed">
                {currentTopic.whyDoesItHappen.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#00F0FF] mt-1 shrink-0">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* How to Investigate */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                <Lightbulb size={15} />
                <span>How to investigate it</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-300 font-sans leading-relaxed">
                {currentTopic.howToInvestigate.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-mono font-bold shrink-0">
                      {idx + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 4. Practical Example */}
          {currentTopic.example && (
            <div className="p-4 sm:p-5 rounded-xl border border-white/10 bg-[#0d0d16] space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-white">
                <Layers size={14} className="text-[#00F0FF]" />
                <span>Practical Example: {currentTopic.example.title}</span>
              </div>
              {currentTopic.example.scenario && (
                <p className="text-xs text-gray-300 leading-relaxed">
                  <strong className="text-white">Scenario:</strong>{" "}
                  {currentTopic.example.scenario}
                </p>
              )}
              {currentTopic.example.expected && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                    <strong>Expected:</strong> {currentTopic.example.expected}
                  </div>
                  <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-300">
                    <strong>Actual:</strong> {currentTopic.example.actual}
                  </div>
                </div>
              )}
              {currentTopic.example.rootCause && (
                <p className="text-xs text-gray-300 font-mono pt-1">
                  🔍 <strong className="text-white">Root Cause:</strong>{" "}
                  {currentTopic.example.rootCause}
                </p>
              )}
              {currentTopic.example.bug && (
                <div className="space-y-1.5 text-xs font-mono pt-1">
                  <div className="text-amber-300"><strong>Bug (Code):</strong> {currentTopic.example.bug}</div>
                  <div className="text-red-300"><strong>Error (Runtime):</strong> {currentTopic.example.error}</div>
                  <div className="text-purple-300"><strong>Failure (User):</strong> {currentTopic.example.failure}</div>
                </div>
              )}
              {currentTopic.example.codeSnippet && (
                <pre className="p-3 rounded bg-black/50 text-xs font-mono text-gray-200 overflow-x-auto">
                  <code>{currentTopic.example.codeSnippet}</code>
                </pre>
              )}
              {currentTopic.example.stepsTaken && (
                <ol className="space-y-1 text-xs text-gray-300 font-mono pl-4 list-decimal">
                  {currentTopic.example.stepsTaken.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ol>
              )}
              {currentTopic.example.quote && (
                <blockquote className="p-3 border-l-2 border-[#00F0FF] bg-[#00F0FF]/5 text-sm font-semibold text-white italic">
                  "{currentTopic.example.quote}"
                  <span className="block text-xs font-mono text-gray-400 not-italic mt-1">
                    {currentTopic.example.explanation}
                  </span>
                </blockquote>
              )}
            </div>
          )}

          {/* 5. Key Takeaway */}
          <div className="p-4 sm:p-5 rounded-xl border border-[#00F0FF]/30 bg-gradient-to-r from-[#00F0FF]/10 via-[#00F0FF]/5 to-transparent flex items-start gap-3.5 shadow-lg">
            <Sparkles size={20} className="text-[#00F0FF] shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#00F0FF] block mb-1">
                Key Takeaway
              </span>
              <p className="text-sm font-medium text-white leading-relaxed">
                {currentTopic.keyTakeaway}
              </p>
            </div>
          </div>

          {/* 6. Try It Yourself (Interactive Thought Exercise) */}
          {currentTopic.tryItYourself && (
            <div className="p-4 sm:p-5 rounded-xl border border-white/10 bg-[#0d0d16] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Terminal size={14} />
                  <span>Try It Yourself (Mental Exercise)</span>
                </span>
                <button
                  type="button"
                  onClick={() => toggleAnswer(currentTopic.id)}
                  className="text-xs font-mono text-[#00F0FF] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {revealedAnswers[currentTopic.id] ? (
                    <>
                      <EyeOff size={13} /> Hide Analysis
                    </>
                  ) : (
                    <>
                      <Eye size={13} /> Reveal Analysis
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-sans">
                {currentTopic.tryItYourself.prompt}
              </p>

              {currentTopic.tryItYourself.hint && (
                <p className="text-[11px] text-gray-400 font-mono italic">
                  💡 Hint: {currentTopic.tryItYourself.hint}
                </p>
              )}

              <AnimatePresence>
                {revealedAnswers[currentTopic.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 border-t border-white/10 text-xs font-mono text-emerald-300 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/20 leading-relaxed">
                      <strong>Analysis:</strong> {currentTopic.tryItYourself.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ── FOOTER NAVIGATION: PREVIOUS / NEXT TOPIC ── */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrevTopic}
              disabled={activeIndex === 0}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-mono text-xs font-bold transition cursor-pointer ${
                activeIndex === 0
                  ? "opacity-40 cursor-not-allowed bg-white/5 border-white/5 text-gray-500"
                  : "bg-white/5 border-white/10 text-gray-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <ChevronLeft size={16} />
              Previous Topic
            </button>

            <span className="text-xs font-mono text-gray-500">
              Topic {activeIndex + 1} of {HANDBOOK_PHASE_1.topics.length}
            </span>

            <button
              type="button"
              onClick={handleNextTopic}
              disabled={activeIndex === HANDBOOK_PHASE_1.topics.length - 1}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer ${
                activeIndex === HANDBOOK_PHASE_1.topics.length - 1
                  ? "bg-white/5 border border-white/5 text-gray-500 cursor-not-allowed opacity-40"
                  : "bg-[#00F0FF] text-black hover:bg-[#00F0FF]/90 shadow-[0_0_20px_rgba(0,240,255,0.2)]"
              }`}
            >
              {activeIndex === HANDBOOK_PHASE_1.topics.length - 1 ? (
                "End of Phase 1"
              ) : (
                <>
                  Next: {HANDBOOK_PHASE_1.topics[activeIndex + 1]?.title}
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
