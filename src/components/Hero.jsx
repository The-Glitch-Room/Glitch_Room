import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Code2, Bug, Users, TrendingUp } from "lucide-react";
import { supabase } from "../supabaseClient";
import { fetchTotalChallengeCount } from "../utils/challengeCountHelper";
import { fetchActiveRoomsStats } from "../utils/roomCountHelper";
import Button from "./Button";

const formatNumber = (n) => {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K+";
  return String(n);
};

const FLOW_STEPS = [
  {
    label: "BUILD",
    icon: Code2,
    color: "#00F0FF",
  },
  {
    label: "DEBUG",
    icon: Bug,
    color: "#FF00C8",
  },
  {
    label: "CONNECT",
    icon: Users,
    color: "#a855f7",
  },
  {
    label: "GROW",
    icon: TrendingUp,
    color: "#FFD700",
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
    { value: formatNumber(stats.creators), label: "Creators" },
    { value: formatNumber(stats.challenges), label: "Challenges" },
    { value: formatNumber(stats.roomsActive), label: "Active Rooms" },
    { value: formatNumber(stats.roomsHosted), label: "Rooms Hosted" },
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

        {/* Main Heading - reduced font size as requested */}
        <motion.h1
          className="glitchh-text text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-black text-center max-w-4xl leading-tight tracking-tight"
          data-text="BUILD. DEBUG. CONNECT. GROW."
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          BUILD. DEBUG. CONNECT. GROW.
        </motion.h1>

        {/* Supporting text */}
        <motion.p
          className="text-base sm:text-lg text-gray-300 max-w-2xl mt-5 mb-8 leading-relaxed font-sans"
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
          className="flex flex-wrap gap-4 sm:gap-6 justify-center items-center mb-10 sm:mb-12"
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

        {/* Lightweight Horizontal Visual Flow */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 select-none mb-6 sm:mb-7"
        >
          {FLOW_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.label}>
                <div className="inline-flex items-center gap-2 group cursor-default">
                  <Icon
                    size={14}
                    style={{ color: step.color }}
                    className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                  />
                  <span
                    className="text-xs sm:text-sm font-mono font-bold tracking-widest transition-colors duration-200"
                    style={{ color: step.color }}
                  >
                    {step.label}
                  </span>
                </div>

                {idx < FLOW_STEPS.length - 1 && (
                  <div className="flex items-center text-gray-600/70 select-none">
                    <span className="hidden sm:inline-block w-4 md:w-6 h-[1px] bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700" />
                    <span className="text-xs sm:text-sm text-gray-500 font-mono">→</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </motion.div>

        {/* Minimal Statistics Strip */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 md:gap-x-8 gap-y-2.5 font-mono"
        >
          {statItems.map((stat, i) => (
            <React.Fragment key={stat.label}>
              <span className="inline-flex items-center gap-2">
                <span className="font-bold text-white text-base sm:text-lg md:text-xl tracking-tight">
                  {stat.value}
                </span>
                <span className="text-gray-300 text-sm sm:text-base font-medium">
                  {stat.label}
                </span>
              </span>
              {i < statItems.length - 1 && (
                <span className="text-gray-600 select-none text-sm sm:text-base md:text-lg">•</span>
              )}
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
