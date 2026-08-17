import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { fetchTotalChallengeCount } from "../utils/challengeCountHelper";
import { fetchActiveRoomsStats } from "../utils/roomCountHelper";
import SectionEyebrow from "./SectionEyebrow";
import StatCard from "./StatCard";
import Button from "./Button";
import GlitchBackground from "./GlitchBackground";

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

    // Realtime subscriptions on rooms and pro_rooms
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
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none z-0 opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(0,240,255,0.1) 40%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
        {/* Eyebrow */}
        <SectionEyebrow content="CODE • COLLABORATE • CONQUER" accent="cyan" />

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-none mb-6 mt-4 font-sans"
        >
          Step into the{" "}
          <span
            className="text-[#FF00C8]"
            style={{
              textShadow:
                "0 0 20px rgba(255,0,200,0.6), 0 0 40px rgba(255,0,200,0.3)",
            }}
          >
            Glitch Room
          </span>{" "}
          — where imagination meets chaos. Fix bugs, spark ideas, and build with
          others.
        </motion.h1>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mb-14"
        >
          <Link to="/join-room">
            <Button content="Join a Room" accent="pink" />
          </Link>
          <Link to="/creator-rooms">
            <Button content="Host a Room" variant="outline" accent="pink" />
          </Link>
        </motion.div>

        {/* Bare Stat Cards Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-6 sm:gap-12 w-full max-w-2xl"
        >
          {statItems.map((item, idx) => (
            <StatCard
              key={idx}
              value={item.value}
              label={item.label}
              accent={item.accent}
              delay={0.1 * idx}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
