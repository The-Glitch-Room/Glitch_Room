import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { fetchTotalChallengeCount } from "../utils/challengeCountHelper";
import { fetchActiveRoomsStats } from "../utils/roomCountHelper";
import StatCard from "./StatCard";
import Button from "./Button";

const formatNumber = (n) => {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K+";
  return String(n);
};

const Hero = () => {
  const [stats, setStats] = useState({
    creators: 0,
    challenges: 0,
    roomsActive: 0,
  });

  const fetchStats = async () => {
    // 1. Unique creators (distinct created_by from rooms + host_id from pro_rooms)
    const { data: creatorRooms } = await supabase.from("rooms").select("created_by");
    const { data: proRooms } = await supabase.from("pro_rooms").select("host_id");

    const creatorSet = new Set([
      ...(creatorRooms || []).map((r) => r.created_by).filter(Boolean),
      ...(proRooms || []).map((r) => r.host_id).filter(Boolean),
    ]);

    // 2. Dynamically calculate combined total challenges across Explore + Arena
    const totalChallenges = await fetchTotalChallengeCount();

    // 3. Dynamic total active rooms count across Creator Rooms + Pro Rooms combined
    const roomStats = await fetchActiveRoomsStats();

    setStats({
      creators: creatorSet.size || 1,
      challenges: totalChallenges,
      roomsActive: roomStats.totalActiveRooms,
    });
  };

  useEffect(() => {
    fetchStats();

    const roomsChannel = supabase
      .channel("hero-rooms")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => fetchStats()
      )
      .subscribe();

    const proRoomsChannel = supabase
      .channel("hero-pro-rooms")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pro_rooms" },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(proRoomsChannel);
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
  ];

  return (
    <section className="relative bg-transparent text-center min-h-screen flex flex-col justify-center items-center px-6 pt-32 pb-16 overflow-hidden">
      {/* Animated grid background */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(0,240,255,0.15) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,240,255,0.15) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glow center */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(214,0,255,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Floating orbs */}
      <motion.div
        animate={{ y: [0, -20, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-24 left-16 w-40 h-40 rounded-full blur-3xl z-0"
        style={{ background: "rgba(0,240,255,0.15)" }}
      />
      <motion.div
        animate={{ y: [0, 20, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-32 right-20 w-56 h-56 rounded-full blur-3xl z-0"
        style={{ background: "rgba(255,0,200,0.12)" }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center pt-6">
        {/* Heading */}
        <motion.h1
          className="glitchh-text text-4xl md:text-6xl text-center max-w-4xl leading-tight"
          data-text="WHERE CHAOS SPARKS CREATIVITY"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          WHERE CHAOS SPARKS CREATIVITY
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-base md:text-lg text-gray-300 max-w-xl mt-8 mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          Step into the{" "}
          <span className="text-[#FF00C8] font-bold">Glitch Room</span> — where
          imagination meets chaos. Fix bugs, spark ideas, and build with others.
        </motion.p>

        {/* Buttons */}
        <motion.div
          className="flex flex-wrap gap-6 justify-center"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.7 }}
        >
          <Link to="/join-room">
            <Button content="Join a Room" accent="pink" />
          </Link>

          <Link to="/host-room">
            <Button content="Host a Room" variant="outline" accent="purple" />
          </Link>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="relative z-10 mt-10 grid grid-cols-3 gap-2.5 sm:gap-4 w-full max-w-xl mx-auto"
        >
          {statItems.map((stat, i) => (
            <StatCard
              key={i}
              value={stat.value}
              label={stat.label}
              accent={stat.accent}
              variant="boxed"
              delay={1.3 + i * 0.1}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
