import React, { useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { motion } from "framer-motion";
import {
  FaBug,
  FaRobot,
  FaPuzzlePiece,
  FaBolt,
  FaMagic,
  FaBullhorn,
  FaTachometerAlt,
  FaMedal,
} from "react-icons/fa";

const challengesData = {
  Glitches: [
    { title: "Broken CSS Layout", difficulty: "Easy", deadline: "2025-09-05" },
    { title: "Async API Issue", difficulty: "Medium", deadline: "2025-09-10" },
    {
      title: "Database Locking Bug",
      difficulty: "Hard",
      deadline: "2025-09-15",
    },
  ],
  "AI Challenges": [
    { title: "Chatbot Memory Fix", difficulty: "Easy", deadline: "2025-09-06" },
    {
      title: "Image Classifier Debug",
      difficulty: "Medium",
      deadline: "2025-09-12",
    },
    {
      title: "Reinforcement Agent Glitch",
      difficulty: "Hard",
      deadline: "2025-09-18",
    },
  ],
  "Bug Challenges": [
    {
      title: "Navbar Not Responsive",
      difficulty: "Easy",
      deadline: "2025-09-08",
    },
    {
      title: "Infinite Loop in Code",
      difficulty: "Medium",
      deadline: "2025-09-11",
    },
    { title: "Memory Leak", difficulty: "Hard", deadline: "2025-09-20" },
  ],
  "Creativity Sparks": [
    {
      title: "Redesign Dashboard UI",
      difficulty: "Easy",
      deadline: "2025-09-09",
    },
    {
      title: "Gamify Leaderboard",
      difficulty: "Medium",
      deadline: "2025-09-13",
    },
    { title: "VR/AR Concept Hack", difficulty: "Hard", deadline: "2025-09-21" },
  ],
  "Twist Cards": [
    { title: "Dark Mode Fix", difficulty: "Easy", deadline: "2025-09-07" },
    {
      title: "Accessibility Challenge",
      difficulty: "Medium",
      deadline: "2025-09-14",
    },
    { title: "Cross-Platform Bug", difficulty: "Hard", deadline: "2025-09-22" },
  ],
};

const announcements = [
  {
    title: "New AI Challenge Incoming 🚀",
    date: "2025-09-25",
    detail: "Build an AI agent that adapts in real-time to user glitches.",
  },
  {
    title: "Glitch Marathon ⚡",
    date: "2025-10-01",
    detail: "24-hour hackathon to fix as many glitches as possible!",
  },
];

const Challenges = () => {
  const [selectedCategory, setSelectedCategory] = useState("Glitches");

  const categoryIcons = {
    Glitches: <FaBolt className="text-yellow-400" />,
    "AI Challenges": <FaRobot className="text-blue-400" />,
    "Bug Challenges": <FaBug className="text-red-400" />,
    "Creativity Sparks": <FaMagic className="text-pink-400" />,
    "Twist Cards": <FaPuzzlePiece className="text-green-400" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.5 }}
      className="bg-[#0B0C10] min-h-screen text-white"
    >
      <Navbar />

      {/* Page Title */}
      <section className="text-center py-30">
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-4xl md:text-5xl font-extrabold glitch-text"
          data-text="Challenges"
        >
          Challenges
        </motion.h1>
        <div className="flex gap-4 mt-6 justify-center">
          <button className="px-4 py-2 bg-[#1F2833] rounded-xl flex items-center gap-2 hover:bg-[#45A29E] cursor-pointer">
            <FaTachometerAlt /> Dashboard
          </button>
          <button className="px-4 py-2 bg-[#1F2833] rounded-xl flex items-center gap-2 hover:bg-[#45A29E] cursor-pointer">
            <FaMedal /> Leaderboard
          </button>
        </div>
      </section>

      {/* Announcements */}
      <section className="max-w-6xl mx-auto px-6 py-3">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FaBullhorn className="text-yellow-400" /> Announcements
        </h2>
        <div className="space-y-4">
          {announcements.map((a, index) => (
            <div
              key={index}
              className="bg-[#1F2833] p-4 rounded-xl border border-[#45A29E] shadow-lg"
            >
              <h3 className="text-xl font-semibold">{a.title}</h3>
              <p className="text-sm text-gray-400">Date: {a.date}</p>
              <p className="mt-2">{a.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Challenge Categories */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {Object.keys(challengesData).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-3 rounded-xl flex items-center gap-2 transition-all ${
                selectedCategory === category
                  ? "bg-[#66FCF1] text-black"
                  : "bg-[#1F2833] hover:bg-[#45A29E]"
              }`}
            >
              {categoryIcons[category]}
              {category}
            </button>
          ))}
        </div>

        {/* Challenges List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challengesData[selectedCategory].map((challenge, index) => (
            <div
              key={index}
              className="bg-[#1F2833] p-6 rounded-xl border border-[#66FCF1] hover:scale-105 transition-transform shadow-lg"
            >
              <h3 className="text-xl font-bold">{challenge.title}</h3>
              <p className="text-sm text-gray-400">
                Deadline: {challenge.deadline}
              </p>
              <span
                className={`inline-block mt-3 px-3 py-1 rounded-full text-sm font-semibold ${
                  challenge.difficulty === "Easy"
                    ? "bg-green-500/20 text-green-400"
                    : challenge.difficulty === "Medium"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {challenge.difficulty}
              </span>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </motion.div>
  );
};

export default Challenges;
