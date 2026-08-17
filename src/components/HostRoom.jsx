import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import GlitchBackground from "./GlitchBackground";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Trophy,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import PageHeading from "./PageHeading";

const HostRoom = () => {
  const navigate = useNavigate();

  const handleCreateCreatorRoom = () => {
    navigate("/creator-rooms?create=true", { state: { openCreateModal: true } });
  };

  const handleCreateProRoom = () => {
    navigate("/pro-rooms/create");
  };

  const creatorFeatures = [
    "Custom goals & commitments",
    "Daily check-ins & Proof of Work",
    "Participant accountability",
    "Streaks, verification & rewards",
  ];

  const proFeatures = [
    "Hackathons & competitions",
    "MCQ, text & coding assessments",
    "Timed sections & evaluation",
    "Rankings, results & rewards",
  ];

  return (
    <div className="relative min-h-screen bg-[#070709] text-white flex flex-col justify-between selection:bg-[#00F0FF]/20 overflow-hidden font-sans">
      <GlitchBackground />

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

        {/* Hero Section */}
        <section className="relative pt-36 md:pt-44 pb-12 px-6 text-center">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <PageHeading
              eyebrow="CREATE • INNOVATE • INSPIRE"
              title="Host Your Room"
              subtitle="Choose the type of room you want to create and set the stage for an amazing experience."
              accent="purple"
              size="xl"
            />
          </div>
        </section>

        {/* Two Room-Type Cards Section */}
        <section className="max-w-5xl mx-auto px-6 pb-24 w-full flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* CREATOR ROOM CARD */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-[#0b0b14] border border-purple-500/20 hover:border-purple-500/50 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group shadow-xl hover:shadow-[0_0_30px_rgba(255,0,200,0.15)]"
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 bg-gradient-to-r from-[#FF00C8] to-purple-500" />

              <div>
                {/* Icon Container */}
                <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto mb-6 shadow-md">
                  <Users size={26} />
                </div>

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl font-black text-center text-white mb-3 tracking-tight">
                  Create <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF00C8] to-purple-400">Creator Room</span>
                </h2>

                {/* Description */}
                <p className="text-gray-400 text-sm text-center leading-relaxed mb-8 max-w-md mx-auto">
                  Build your own accountability or creative challenge room. Set goals, manage participants, and keep your community engaged.
                </p>

                {/* Features Checklist */}
                <div className="space-y-3.5 mb-8 max-w-sm mx-auto">
                  {creatorFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-400">
                        <CheckCircle size={12} />
                      </div>
                      <span className="text-xs text-gray-300 font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button & Footer Note */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateCreatorRoom}
                  className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF00C8]/90 to-purple-600 hover:from-[#FF00C8] hover:to-purple-500 shadow-lg shadow-[#FF00C8]/20 transition-all cursor-pointer"
                >
                  <Sparkles size={16} /> Create Creator Room <ArrowRight size={16} />
                </motion.button>
                <p className="text-[11px] text-center text-gray-500 font-mono">
                  Perfect for creators, educators & communities
                </p>
              </div>
            </motion.div>

            {/* PRO ROOM CARD */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -4 }}
              className="bg-[#0b0b14] border border-cyan-500/20 hover:border-cyan-500/50 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group shadow-xl hover:shadow-[0_0_30px_rgba(0,240,255,0.15)]"
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 bg-gradient-to-r from-[#00F0FF] to-blue-500" />

              <div>
                {/* Icon Container */}
                <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-6 shadow-md">
                  <Trophy size={26} />
                </div>

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl font-black text-center text-white mb-3 tracking-tight">
                  Create <span className="text-cyan-400">Pro Room</span>
                </h2>

                {/* Description */}
                <p className="text-gray-400 text-sm text-center leading-relaxed mb-8 max-w-md mx-auto">
                  Host professional competitions, hackathons, hiring assessments, and skill-based evaluations.
                </p>

                {/* Features Checklist */}
                <div className="space-y-3.5 mb-8 max-w-sm mx-auto">
                  {proFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
                        <CheckCircle size={12} />
                      </div>
                      <span className="text-xs text-gray-300 font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button & Footer Note */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateProRoom}
                  className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-cyan-300 flex items-center justify-center gap-2 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 hover:border-cyan-500/70 shadow-lg shadow-cyan-500/10 transition-all cursor-pointer"
                >
                  <Trophy size={16} /> Create Pro Room <ArrowRight size={16} />
                </motion.button>
                <p className="text-[11px] text-center text-gray-500 font-mono">
                  Ideal for competitions, assessments & hackathons
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default HostRoom;
