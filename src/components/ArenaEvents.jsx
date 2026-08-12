import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PageHeading from "./PageHeading";
import GlitchBackground from "./GlitchBackground";
import { FEATURED_ARENA_EVENTS } from "../data/arenaEventsData";
import { supabase } from "../supabaseClient";
import {
  Swords,
  Flame,
  Zap,
  Trophy,
  Users,
  Search,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Code2,
  Bug,
  Cpu,
} from "lucide-react";

// ── Default Featured Arena Events (shown alongside DB events so page is never empty) ──

const SkillTag = ({ skill }) => (
  <span className="px-2.5 py-1 text-[10px] font-mono font-semibold rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/25 text-[#00F0FF]">
    {skill}
  </span>
);

const ArenaEvents = () => {
  const [dbEvents, setDbEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiff, setSelectedDiff] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("arena_events")
          .select("*")
          .eq("is_live", true)
          .order("created_at", { ascending: false });

        if (error)
          console.warn("Supabase arena_events warning:", error.message);
        else setDbEvents(data || []);
      } catch (err) {
        console.error("fetchEvents error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Combine database events with featured fallback events
  const allEvents = [...dbEvents, ...FEATURED_ARENA_EVENTS];

  // Filter events based on search query & difficulty
  const filteredEvents = allEvents.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.skills &&
        ev.skills.some((s) =>
          s.toLowerCase().includes(searchQuery.toLowerCase()),
        ));

    const diff = (ev.difficulty || "medium").toLowerCase();
    const matchesDiff =
      selectedDiff === "all" ||
      (selectedDiff === "easy" && diff.includes("easy")) ||
      (selectedDiff === "medium" && diff.includes("medium")) ||
      (selectedDiff === "hard" && diff.includes("hard"));

    return matchesSearch && matchesDiff;
  });

  return (
    <div className="relative min-h-screen bg-[#070709] text-white flex flex-col selection:bg-[#00F0FF]/20 overflow-hidden">
      <GlitchBackground />
      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

      {/* ── HEADER ── */}
      <section className="relative text-center pt-36 pb-16 px-6 overflow-hidden">
        {/* Cyber Grid */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF00C8]/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-4xl mx-auto"
        >
          {/* Live status badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Live Arena Challenges
          </div>

          <PageHeading
            title="Choose Your Challenge Event"
            subtitle="Live 3-stage events hosted by the Glitch Room team & community. Conquer all 3 stages to earn gBits and climb the Terminal Wall."
            accent="cyan"
            size="xl"
          />

          {/* Controls Bar: Search & Difficulty Pills */}
          <div className="mt-8 max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search arena events, skills, tech stack..."
                className="w-full bg-[#0d0d14] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#00F0FF]/50 transition-colors shadow-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 bg-[#0d0d14] border border-white/10 rounded-2xl p-1">
              {[
                { id: "all", label: "All" },
                { id: "easy", label: "Easy" },
                { id: "medium", label: "Medium" },
                { id: "hard", label: "Hard" },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDiff(d.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedDiff === d.id
                      ? "bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── EVENTS GRID ── */}
      <section className="max-w-7xl mx-auto px-6 pb-24 w-full flex-1">
        {loading ? (
          <div className="text-center py-20 text-gray-500">
            <div className="w-10 h-10 border-4 border-t-transparent border-[#00F0FF] rounded-full animate-spin mx-auto mb-4" />
            Loading live arena events...
          </div>
        ) : filteredEvents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-[#0d0d14] border border-white/5 rounded-3xl p-8"
          >
            <Flame className="text-4xl text-gray-600 mx-auto mb-3" />
            <p className="text-gray-300 text-base font-bold">
              No events match your filter
            </p>
            <p className="text-gray-500 text-xs mt-1 mb-4">
              Try adjusting your search terms or difficulty filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedDiff("all");
              }}
              className="px-4 py-2 rounded-xl bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 text-xs font-bold"
            >
              Reset Filters
            </button>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredEvents.map((event, index) => {
              const diffColor = event.difficultyColor || "#00F0FF";
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  whileHover={{ y: -6, scale: 1.01 }}
                  className="relative bg-[#0f0f14] border border-white/5 rounded-3xl p-6 flex flex-col justify-between group transition-all duration-300 shadow-xl overflow-hidden"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0,240,255,0.4)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 30px rgba(0,240,255,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.05)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Glowing Top Line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, #00F0FF, #FF00C8, transparent)",
                    }}
                  />

                  <div>
                    {/* Top Row: Live Indicator + Reward Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest">
                          Live Event
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-[#FF00C8]/15 text-[#FF00C8] border border-[#FF00C8]/30">
                        {event.reward || "100 gBits"}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-white mb-2 group-hover:text-[#00F0FF] transition-colors">
                      {event.title}
                    </h2>

                    {/* Description */}
                    <p className="text-gray-400 text-xs leading-relaxed mb-5 line-clamp-3">
                      {event.description}
                    </p>

                    {/* Hosted by */}
                    <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                      <Users size={13} className="text-[#FF00C8]" />
                      <span>
                        Hosted by{" "}
                        <span className="text-gray-300 font-semibold">
                          {event.hosted_by || "Glitch Room"}
                        </span>
                      </span>
                    </div>

                    {/* Skills Used */}
                    {event.skills && event.skills.length > 0 && (
                      <div className="mb-6">
                        <div className="flex flex-wrap gap-1.5">
                          {event.skills.map((skill, i) => (
                            <SkillTag key={i} skill={skill} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Enter Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/arena/${event.id}`)}
                    className="w-full mt-auto py-3 rounded-xl font-bold text-xs text-white bg-[#FF00C8]/85 hover:bg-[#FF00C8] flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                  >
                    <Swords size={14} /> Enter Arena Event →
                  </motion.button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      <Footer />
      </div>
    </div>
  );
};

export default ArenaEvents;
