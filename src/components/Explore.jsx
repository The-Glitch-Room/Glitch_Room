import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PageHeading from "./PageHeading";
import { supabase } from "../supabaseClient";
import { fetchDatabaseCategoryCounts } from "../utils/challengeCountHelper";
import {
  Zap,
  Bug,
  Cpu,
  Sparkles,
  Swords,
  Users,
  Trophy,
  MessageSquare,
  Gift,
  Search,
  Compass,
  ArrowRight,
} from "lucide-react";

// ── Explore Destinations (9 Cards, grouped by categories) ─────────────────────
const EXPLORE_ITEMS = [
  {
    id: "glitches",
    category: "challenges",
    icon: Zap,
    color: "#00F0FF",
    title: "Glitch Challenges",
    badge: "Core Arena",
    badgeColor: "#00F0FF",
    desc: "Test your skills by identifying and fixing unique, real-world inspired coding glitches across multiple languages.",
    path: "/glitches",
    stat: "50+ Glitches",
  },
  {
    id: "bug-challenges",
    category: "challenges",
    icon: Bug,
    color: "#D600FF",
    title: "Debug Mode",
    badge: "High Skill",
    badgeColor: "#D600FF",
    desc: "Hone your diagnostics by stepping through complex stack traces, memory leaks, and broken execution logic.",
    path: "/bug-challenges",
    stat: "Tricky Codebases",
  },
  {
    id: "ai-challenges",
    category: "challenges",
    icon: Cpu,
    color: "#FF00C8",
    title: "AI Powered Puzzles",
    badge: "AI Graded",
    badgeColor: "#FF00C8",
    desc: "Engage with generative AI scenarios designed to test edge cases, prompt fixes, and automated code evaluation.",
    path: "/ai-challenges",
    stat: "AI Evaluation",
  },
  {
    id: "sparks",
    category: "challenges",
    icon: Sparkles,
    color: "#FFD700",
    title: "Creative Sparks",
    badge: "Design & Logic",
    badgeColor: "#FFD700",
    desc: "Ignite your architectural creativity by designing solutions, UI patterns, and novel fixes that stand out.",
    path: "/sparks",
    stat: "Creative Prompts",
  },
  {
    id: "arena-events",
    category: "arena",
    icon: Swords,
    color: "#38BDF8",
    title: "Arena Challenge Events",
    badge: "Flagship 3-Stage",
    badgeColor: "#38BDF8",
    desc: "Battle through multi-stage live challenges — Find the Glitch, Twist Card, and Pitch Wild for big gBit rewards.",
    path: "/arena-events",
    stat: "Up to 100 gBits",
  },
  {
    id: "creator-rooms",
    category: "arena",
    icon: Users,
    color: "#22C55E",
    title: "Creator Rooms",
    badge: "Community Host",
    badgeColor: "#22C55E",
    desc: "Join private or public custom challenge rooms hosted by fellow Glitchers, or create your own custom room.",
    path: "/creator-rooms",
    stat: "Live Multiplayer",
  },
  {
    id: "terminal-wall",
    category: "community",
    icon: Trophy,
    color: "#A855F7",
    title: "Terminal Wall & Legends",
    badge: "Leaderboard",
    badgeColor: "#A855F7",
    desc: "Climb the global live rankings, view weekly top Overclockers, and inspect all-time hall of fame champions.",
    path: "/terminal-wall",
    stat: "Live Rankings",
  },
  {
    id: "community",
    category: "community",
    icon: MessageSquare,
    color: "#F59E0B",
    title: "Community Feed",
    badge: "Discussions",
    badgeColor: "#F59E0B",
    desc: "Share your solution approaches, upvote top fixes, ask questions, and collaborate with the Glitcher community.",
    path: "/community",
    stat: "Active Discussions",
  },
  {
    id: "earn-rules",
    category: "community",
    icon: Gift,
    color: "#FF00C8",
    title: "gBit Economy & Referrals",
    badge: "+100 Referral",
    badgeColor: "#FF00C8",
    desc: "Learn how to rack up gBits through Speed Demon bonuses, 7-day uptime streaks, and inviting your coder friends.",
    path: "/earn-rules",
    stat: "Instant Rewards",
  },
];

const CATEGORY_TABS = [
  { id: "all", label: "All Destinations" },
  { id: "challenges", label: "Core Challenges" },
  { id: "arena", label: "Arena & Rooms" },
  { id: "community", label: "Community & Rewards" },
];

const Explore = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dbCounts, setDbCounts] = useState({
    glitch: 0,
    bug: 0,
    ai: 0,
    spark: 0,
    arena: 0,
    grandTotal: 0,
  });

  useEffect(() => {
    const loadCounts = async () => {
      const counts = await fetchDatabaseCategoryCounts();
      setDbCounts(counts);
    };
    loadCounts();

    const c1 = supabase
      .channel("explore-challenges")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "challenges" },
        () => loadCounts(),
      )
      .subscribe();

    const c2 = supabase
      .channel("explore-arena")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "arena_events" },
        () => loadCounts(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(c1);
      supabase.removeChannel(c2);
    };
  }, []);

  const exploreItems = [
    {
      id: "glitches",
      category: "challenges",
      icon: Zap,
      color: "#00F0FF",
      title: "Glitch Challenges",
      badge: "Core Arena",
      badgeColor: "#00F0FF",
      desc: "Test your skills by identifying and fixing unique, real-world inspired coding glitches across multiple languages.",
      path: "/glitches",
      stat: `${dbCounts.glitch} Glitches`,
    },
    {
      id: "bug-challenges",
      category: "challenges",
      icon: Bug,
      color: "#D600FF",
      title: "Debug Mode",
      badge: "High Skill",
      badgeColor: "#D600FF",
      desc: "Hone your diagnostics by stepping through complex stack traces, memory leaks, and broken execution logic.",
      path: "/bug-challenges",
      stat: `${dbCounts.bug} Codebases`,
    },
    {
      id: "ai-challenges",
      category: "challenges",
      icon: Cpu,
      color: "#FF00C8",
      title: "AI Powered Puzzles",
      badge: "AI Graded",
      badgeColor: "#FF00C8",
      desc: "Engage with generative AI scenarios designed to test edge cases, prompt fixes, and automated code evaluation.",
      path: "/ai-challenges",
      stat: `${dbCounts.ai} AI Scenarios`,
    },
    {
      id: "sparks",
      category: "challenges",
      icon: Sparkles,
      color: "#FFD700",
      title: "Creative Sparks",
      badge: "Design & Logic",
      badgeColor: "#FFD700",
      desc: "Ignite your architectural creativity by designing solutions, UI patterns, and novel fixes that stand out.",
      path: "/sparks",
      stat: `${dbCounts.spark} Creative Prompts`,
    },
    {
      id: "arena-events",
      category: "arena",
      icon: Swords,
      color: "#38BDF8",
      title: "Arena Challenge Events",
      badge: "Flagship 3-Stage",
      badgeColor: "#38BDF8",
      desc: "Battle through multi-stage live challenges — Find the Glitch, Twist Card, and Pitch Wild for big gBit rewards.",
      path: "/arena-events",
      stat: `${dbCounts.arena} Arena Events`,
    },
    {
      id: "creator-rooms",
      category: "arena",
      icon: Users,
      color: "#22C55E",
      title: "Creator Rooms",
      badge: "Community Host",
      badgeColor: "#22C55E",
      desc: "Join private or public custom challenge rooms hosted by fellow Glitchers, or create your own custom room.",
      path: "/creator-rooms",
      stat: "Live Multiplayer",
    },
    {
      id: "terminal-wall",
      category: "community",
      icon: Trophy,
      color: "#A855F7",
      title: "Terminal Wall & Legends",
      badge: "Leaderboard",
      badgeColor: "#A855F7",
      desc: "Climb the global live rankings, view weekly top Overclockers, and inspect all-time hall of fame champions.",
      path: "/terminal-wall",
      stat: "Live Rankings",
    },
    {
      id: "community",
      category: "community",
      icon: MessageSquare,
      color: "#F59E0B",
      title: "Community Feed",
      badge: "Discussions",
      badgeColor: "#F59E0B",
      desc: "Share your solution approaches, upvote top fixes, ask questions, and collaborate with the Glitcher community.",
      path: "/community",
      stat: "Active Discussions",
    },
    {
      id: "earn-rules",
      category: "community",
      icon: Gift,
      color: "#FF00C8",
      title: "gBit Economy & Referrals",
      badge: "+100 Referral",
      badgeColor: "#FF00C8",
      desc: "Learn how to rack up gBits through Speed Demon bonuses, 7-day uptime streaks, and inviting your coder friends.",
      path: "/earn-rules",
      stat: "Instant Rewards",
    },
  ];

  const filteredItems = exploreItems.filter((item) => {
    const matchesTab = activeTab === "all" || item.category === activeTab;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#070709] text-white min-h-screen flex flex-col selection:bg-[#00F0FF]/20"
    >
      <Navbar />

      {/* ── HERO HEADER ── */}
      <section className="relative pt-36 pb-16 px-6 overflow-hidden">
        {/* Animated Cyber Grid */}
        <div
          className="absolute inset-0 z-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(0,240,255,0.2) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0,240,255,0.2) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Ambient Glow Orbs */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, #00F0FF, #FF00C8, transparent)",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <PageHeading
            eyebrow="Glitch Hub"
            title="Explore The Glitch Room"
            subtitle="Discover coding challenges, live multiplayer arenas, community rank leaderboards, and gBit reward hubs."
            accent="cyan"
            size="xl"
          />

          {/* Search & Filter Bar */}
          <div className="mt-10 max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search challenges, arenas, leaderboards..."
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
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                    : "bg-[#0f0f13] text-gray-400 hover:text-white border border-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 CARDS PER ROW GRID SECTION ── */}
      <section className="pb-24 px-6 flex-1">
        <div className="max-w-7xl mx-auto">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-[#0d0d14] border border-white/5 rounded-3xl p-8">
              <Compass size={40} className="text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">
                No destinations found
              </h3>
              <p className="text-gray-500 text-xs mb-4">
                No explore cards match "{searchQuery}". Try a different search
                term.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("all");
                }}
                className="px-4 py-2 rounded-xl bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 text-xs font-bold"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Link to={item.path} key={item.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 25 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.05 }}
                      whileHover={{ y: -6, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative p-7 bg-[#0f0f14] rounded-3xl border border-white/5 overflow-hidden group h-full flex flex-col transition-all duration-300 shadow-xl"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `${item.color}50`;
                        e.currentTarget.style.boxShadow = `0 10px 30px ${item.color}15`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor =
                          "rgba(255,255,255,0.05)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {/* Top Glowing Shimmer Line */}
                      <div
                        className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${item.color}, transparent)`,
                        }}
                      />

                      {/* Header Row: Icon + Badge */}
                      <div className="flex items-center justify-between mb-5">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg"
                          style={{
                            background: `${item.color}15`,
                            border: `1px solid ${item.color}35`,
                            color: item.color,
                          }}
                        >
                          <Icon size={22} />
                        </div>

                        <span
                          className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg"
                          style={{
                            color: item.badgeColor,
                            background: `${item.badgeColor}15`,
                            border: `1px solid ${item.badgeColor}30`,
                          }}
                        >
                          {item.badge}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-xl font-black text-white mb-2 group-hover:text-white transition-colors flex items-center justify-between">
                        {item.title}
                      </h3>
                      <p className="text-gray-400 text-xs leading-relaxed mb-6 flex-1">
                        {item.desc}
                      </p>

                      {/* Footer Row: Stat Pill + Arrow Action */}
                      <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs mt-auto">
                        <span className="text-[11px] font-mono text-gray-500">
                          {item.stat}
                        </span>
                        <div
                          className="flex items-center gap-1.5 font-bold transition-all group-hover:translate-x-1"
                          style={{ color: item.color }}
                        >
                          Explore <ArrowRight size={14} />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </motion.div>
  );
};

export default Explore;
