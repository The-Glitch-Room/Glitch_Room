import React from "react";
import { motion } from "framer-motion";

const RoomIntro = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto text-center space-y-4 bg-gray-900/50 p-6 rounded-xl backdrop-blur-md border border-gray-700"
    >
      <h2 className="text-2xl font-bold glitch-txt">
        Welcome to Creator Rooms
      </h2>
      <p className="text-gray-300 leading-relaxed">
        Creator Rooms are mini communities designed for small, focused learning
        groups. Whether you're practicing coding, learning ML, improving
        English, or working on creative ideas — these rooms give you your own
        space inside The Glitch Room.
      </p>
      <p className="text-gray-300">
        Set your goals, choose questions, add difficulty levels, and invite
        friends. Stay consistent, stay inspired, and grow together.
      </p>
    </motion.div>
  );
};

export default RoomIntro;
