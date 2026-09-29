import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Code2, Bug, Users, TrendingUp } from "lucide-react";
import { supabase } from "../supabaseClient";
import { fetchTotalChallengeCount } from "../utils/challengeCountHelper";
import { fetchActiveRoomsStats } from "../utils/roomCountHelper";
import StatCard from "./StatCard";
import Button from "./Button";

const formatNumber = (n) => {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K+";
  return String(n);
};

const ECOSYSTEM_PILLARS = [
  {
    tag: "BUILD",
    title: "Projects & Proof of Work",
    subtitle: "Creator Rooms · Daily Standups",
    icon: Code2,
    color: "#00F0FF",
    border: "rgba(0,240,255,0.22)",
    bg: "rgba(0,240,255,0.03)",
  },
  {
    tag: "DEBUG",
    title: "Broken Code & Challenges",
    subtitle: "Interactive Arenas · Real Bugs",
    icon: Bug,
    color: "#FF00C8",
    border: "rgba(255,0,200,0.22)",
    bg: "rgba(255,0,200,0.03)",
  },
  {
    tag: "CONNECT",
    title: "Builder Squads & Lounge",
    subtitle: "Peer Discussions · Pair Buddies",
    icon: Users,
    color: "#a855f7",
    border: "rgba(168,85,247,0.22)",
    bg: "rgba(168,85,247,0.03)",
  },
  {
    tag: "GROW",
    title: "Daily Uptime & Credentials",
    subtitle: "Skill Badges · Verifiable Proof",
    icon: TrendingUp,
    color: "#FFD700",
    border: "rgba(255,215,0,0.22)",
    bg: "rgba(255,215,0,0.03)",
  },
];

const Hero = () => {
  const [stats, setStats] = useState({
    creators: 0,
    challenges: 0,
    roomsActive: 0,
    roomsHosted: 0,
  });

  const fetchStats = async () => {
    const { data: profileCountData, error: profileCountError } =
      await supabase.rpc("get_total_profiles_count");

    if (profileCountError) {
      console.error("get_total_profiles_count RPC failed:", profileCountError);
    }
    const actualProfilesCount = profileCountError
      ? 0
      : Number(profileCountData) || 0;

    const { data: creatorRooms } = await supabase
      .from("creator_rooms")
      .select("created_by");
    const { data: proRooms } = await supabase
      .from("pro_rooms")
      .select("host_id");

    const creatorSet = new Set([
      ...(creatorRooms || []).map((r) => r.created_by).filter(Boolean),
      ...(proRooms || []).map((r) => r.host_id).filter(Boolean),
    ]);

    const totalCreators = Math.max(actualProfilesCount, creatorSet.size, 1);
    const totalChallenges = await fetchTotalChallengeCount();
    const roomStats = await fetchActiveRoomsStats();

    setStats({
      creators: totalCreators,
      challenges: totalChallenges,
      roomsActive: roomStats.totalActiveRooms,
      roomsHosted: roomStats.totalHostedRooms,
    });
  };

  useEffect(() => {
    fetchStats();

    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    const handleFocus = () => fetchStats();
    window.addEventListener("focus", handleFocus);

    const roomsChannel = supabase
      .channel("hero-rooms")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "creator_rooms" },
        () => fetchStats(),
      )
      .subscribe();

    const proRoomsChannel = supabase
      .channel("hero-pro-rooms")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pro_rooms" },
        () => fetchStats(),
      )
      .subscribe();

    const profilesChannel = supabase
      .channel("hero-profiles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchStats(),
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(proRoomsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  const statItems = [
    { value: formatNumber(stats.creators), label: "Creators", accent: "cyan" },
    {
      value: formatNumber(stats.challenges),
      label: "Challenges",
      accent: "pink",
    },
    {
      value: formatNumber(stats.roomsActive),
      label: "Rooms Active",
      accent: "purple",
    },
    {
      value: formatNumber(stats.roomsHosted),
      label: "Rooms Hosted",
      accent: "gold",
    },
  ];

  return (
    <section className="relative bg-transparent text-center min-h-screen flex flex-col justify-center items-center px-6 pt-32 pb-20 overflow-hidden">
      {/* Animated grid background */}
      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0,240,255,0.15) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,240,255,0.15) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center pt-4">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[#00F0FF] text-[11px] font-mono font-bold tracking-widest uppercase mb-6 shadow-[0_0_20px_rgba(0,240,255,0.12)]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
          THE DEVELOPER PLATFORM
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          className="glitchh-text text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-center max-w-5xl leading-tight tracking-tight"
          data-text="BUILD. DEBUG. CONNECT. GROW."
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          BUILD. DEBUG. CONNECT. GROW.
        </motion.h1>

        {/* Supporting text */}
        <motion.p
          className="text-base sm:text-lg text-gray-300 max-w-2xl mt-6 mb-9 leading-relaxed font-sans"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          Glitch Room is a space for developers to{" "}
          <span className="text-[#FF00C8] font-semibold">solve problems</span>,{" "}
          <span className="text-[#00F0FF] font-semibold">build in public</span>, share their work,{" "}
          <span className="text-[#00F0FF] font-semibold">learn from each other</span>, and{" "}
          <span className="text-[#FF00C8] font-semibold">grow together</span>.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-wrap gap-4 sm:gap-6 justify-center items-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Link to="/join-room">
            <Button content="Explore Rooms" accent="pink" />
          </Link>

          <Link to="/host-room">
            <Button content="Host a Room" variant="outline" accent="cyan" />
          </Link>
        </motion.div>

        {/* Subtle Visual Ecosystem: 4 Platform Pillars */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="relative z-10 mt-12 mb-10 w-full max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ECOSYSTEM_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.tag}
                  whileHover={{ y: -3, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="relative rounded-2xl p-4 text-left border backdrop-blur-md transition-all duration-300 group"
                  style={{
                    backgroundColor: pillar.bg,
                    borderColor: pillar.border,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-[10px] font-mono font-bold tracking-widest uppercase flex items-center gap-1.5"
                      style={{ color: pillar.color }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: pillar.color }}
                      />
                      {pillar.tag}
                    </span>
                    <Icon
                      size={15}
                      style={{ color: pillar.color }}
                      className="opacity-70 group-hover:opacity-100 transition-opacity"
                    />
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-white mb-1 transition-colors">
                    {pillar.title}
                  </h3>

                  <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
                    {pillar.subtitle}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Dynamic platform stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 w-full max-w-2xl sm:max-w-3xl mx-auto"
        >
          {statItems.map((stat, i) => (
            <StatCard
              key={i}
              value={stat.value}
              label={stat.label}
              accent={stat.accent}
              variant="boxed"
              delay={1.0 + i * 0.1}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
