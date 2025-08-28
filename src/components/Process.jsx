import React from "react";
import {
  TbCircleNumber1Filled,
  TbCircleNumber2Filled,
  TbCircleNumber3Filled,
  TbCircleNumber4Filled,
} from "react-icons/tb";
import { FaUsers, FaPuzzlePiece, FaTrophy, FaRocket } from "react-icons/fa";
import { motion } from "framer-motion";

const Process = () => {
  const renderSteps = steps.map((item) => {
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: item.id * 0.2 }}
        viewport={{ once: true }}
        className={`flex-1 basis-[220px] text-center px-4`}
      >
        {/* Step Number */}
        <span
          className="flex justify-center items-center mx-auto w-14 h-14 text-4xl rounded-full 
          bg-black text-cyan-400 border border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.7)]"
        >
          {item.number}
        </span>

        {/* Icon + Content */}
        <div className="flex flex-col items-center gap-y-3 mt-6">
          <span
            className="flex justify-center items-center text-xl w-12 h-12 rounded-full
            bg-gradient-to-br from-purple-600 via-pink-500 to-cyan-400 text-white
            shadow-[0_0_15px_rgba(236,72,153,0.7)]"
          >
            {item.icon}
          </span>

          <div className="flex-1">
            <h4 className="text-xl font-bold text-cyan-300 drop-shadow-md">
              {item.title}
            </h4>
            <p className="text-zinc-400 mt-2 text-sm leading-relaxed">
              {item.para}
            </p>
          </div>
        </div>
      </motion.div>
    );
  });

  return (
    <section className="relative bg-black py-20">
      <div className="max-w-[1100px] mx-auto px-6">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2
            className="text-4xl md:text-5xl font-extrabold glitch-text text-orange-400"
            data-text="How It Works"
          >
            How It Works
          </h2>
        </div>

        {/* Steps */}
        <div className="flex flex-wrap gap-y-16 gap-x-10 justify-center">
          {renderSteps}
        </div>
      </div>
    </section>
  );
};

export default Process;

const steps = [
  {
    id: 1,
    number: <TbCircleNumber1Filled />,
    title: "Join The Room",
    para: "Sign up and step into the Glitch Room — a digital playground for creators and thinkers.",
    icon: <FaUsers />,
  },
  {
    id: 2,
    number: <TbCircleNumber2Filled />,
    title: "Pick a Challenge",
    para: "Browse exciting challenges across tech, design, and innovation that spark your creativity.",
    icon: <FaPuzzlePiece />,
  },
  {
    id: 3,
    number: <TbCircleNumber3Filled />,
    title: "Create & Compete",
    para: "Collaborate or go solo, brainstorm ideas, and showcase your skills in glitchy new ways.",
    icon: <FaTrophy />,
  },
  {
    id: 4,
    number: <TbCircleNumber4Filled />,
    title: "Level Up",
    para: "Gain recognition, rewards, and grow with the community as your ideas take off.",
    icon: <FaRocket />,
  },
];
