import React from "react";
import { motion } from "framer-motion";
import { Hash, BarChart2, Tag, ArrowRight } from "lucide-react";

const difficultyConfig = {
  Easy: {
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  Medium: {
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  Hard: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
};

const RoomCard = ({ room }) => {
  const diff = difficultyConfig[room.difficulty] || difficultyConfig["Easy"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="group relative bg-[#0f0f1a] border border-white/6 hover:border-purple-500/30 rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-[0_0_25px_rgba(168,85,247,0.12)] overflow-hidden cursor-pointer"
    >
      {/* Top glow line on hover */}
      <div className="absolute top-0 left-0 h-[2px] w-0 group-hover:w-full bg-gradient-to-r from-[#FF00C8] to-purple-500 transition-all duration-500 rounded-t-2xl" />

      {/* Title */}
      <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
        {room.title}
      </h3>

      {/* Description */}
      <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
        {room.description}
      </p>

      {/* Meta row */}
      <div className="flex flex-wrap gap-3 mt-auto">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <Hash size={12} className="text-purple-400" />
          {room.questions} questions
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <Tag size={12} className="text-purple-400" />
          {room.category}
        </span>
        <span
          className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${diff.color} ${diff.bg} ${diff.border}`}
        >
          <BarChart2 size={11} />
          {room.difficulty}
        </span>
      </div>

      {/* Enter button */}
      <button className="w-full mt-1 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 text-purple-300 text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer">
        Enter Room <ArrowRight size={14} />
      </button>
    </motion.div>
  );
};

export default RoomCard;
