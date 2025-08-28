import React, { useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { motion } from "framer-motion";
import {
  FaBolt,
  FaMicrochip,
  FaBug,
  FaRegStar,
  FaBullhorn,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const Explore = () => {
  // ⚡ you can toggle this based on DB/Backend later
  const [hackathonActive, setHackathonActive] = useState(false);

  const features = [
    {
      icon: <FaBolt className="text-[#00F0FF] text-4xl" />,
      title: "Glitch Challenges",
      desc: "Test your skills by fixing unique coding glitches in real-world inspired problems.",
      path: "/glitches",
    },
    {
      icon: <FaMicrochip className="text-[#FF00FF] text-4xl" />,
      title: "AI Powered",
      desc: "Glitch Room leverages AI to generate creative challenges for learning & growth.",
      path: "/ai-challenges",
    },
    {
      icon: <FaBug className="text-[#00FF9F] text-4xl" />,
      title: "Debug Mode",
      desc: "Hone your debugging skills by identifying and correcting tricky glitches.",
      path: "/bug-challenges",
    },
    {
      icon: <FaRegStar className="text-[#FFD700] text-4xl" />,
      title: "Creative Sparks",
      desc: "Ignite your creativity by designing solutions that stand out from the rest.",
      path: "/twists",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.5 }}
    >
      <Navbar />

      {/* HERO */}
      <section className="bg-[#0B0C10] text-center min-h-[100vh] flex flex-col justify-center items-center px-6 pt-20">
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-extrabold glitch-text mt-10 uppercase"
            data-text="explore"
          >
            explore
          </motion.h1>
          <p className="text-gray-400 mt-4 max-w-2xl">
            Step into the Glitch Room — a space to challenge yourself with bugs,
            AI-generated puzzles, and hackathons that fuel innovation.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-[#0B0C10] py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, idx) => (
            <Link to={f.path} key={idx}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-[#1F1F1F] rounded-2xl p-6 shadow-lg hover:scale-105 transition-transform duration-300 ease-in-out"
              >
                <div className="mb-4 flex justify-center">{f.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* HACKATHON NOTICE */}
      <section className="bg-gradient-to-r from-purple-700 via-pink-600 to-red-600 text-white py-10 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <FaBullhorn className="mx-auto text-5xl mb-4 animate-pulse" />
          <h2 className="text-3xl font-bold mb-2">Glitch Room Hackathon</h2>
          <p className="mb-4">
            🚀 Join the ultimate challenge! Solve glitches, innovate, and pitch
            your groundbreaking ideas.
            <br />
            📅 Date: 10th Sept 2025 | 🕒 Time: 10 AM IST
            <br />
            🏆 Prizes worth ₹50,000
          </p>
          {!hackathonActive && (
            <p className="text-yellow-300 font-semibold">
              🔔 Hackathon starts soon! Stay tuned for pitch submissions.
            </p>
          )}

          {hackathonActive && (
            <Link
              to="/pitch"
              className="inline-block mt-4 bg-black/30 px-6 py-3 rounded-md text-white font-semibold hover:bg-black/50 transition"
            >
              Go to Pitch Submission
            </Link>
          )}
        </div>
      </section>

      <Footer />
    </motion.div>
  );
};

export default Explore;
