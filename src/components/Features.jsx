import React from "react";
import { motion } from "framer-motion";
import { FaTrophy } from "react-icons/fa";
import { IoIosPeople } from "react-icons/io";
import { FaPalette } from "react-icons/fa";
import { RiLock2Fill } from "react-icons/ri";

const Features = () => {
  const LeftFeatures = features.slice(0, 2).map((item, index) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      whileHover={{ scale: 1.03 }}
      className="flex md:flex-row-reverse items-center gap-6 p-3 rounded-xl transition-all duration-300"
    >
      <motion.div
        whileHover={{ scale: 1.2, rotate: 10 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <span className="flex justify-center items-center text-2xl text-white bg-gradient-to-r from-[#FF00C8] to-[#00F0FF] w-14 h-14 rounded-full shadow-lg">
          {item.icon}
        </span>
      </motion.div>
      <div className="md:text-right">
        <h4 className="bg-gradient-to-r from-[#FF00C8] to-[#00F0FF] bg-clip-text text-transparent text-xl font-bold">
          {item.title}
        </h4>
        <h6 className="text-white text-lg font-semibold">{item.line}</h6>
        <p className="text-gray-400 text-sm">{item.para}</p>
      </div>
    </motion.div>
  ));

  const RightFeatures = features.slice(2).map((item, index) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      whileHover={{ scale: 1.03 }}
      className="flex flex-row items-center gap-6 p-3 rounded-xl transition-all duration-300"
    >
      <motion.div
        whileHover={{ scale: 1.2, rotate: -10 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <span className="flex justify-center items-center text-2xl text-white bg-gradient-to-r from-[#FF00C8] to-[#00F0FF] w-14 h-14 rounded-full shadow-lg">
          {item.icon}
        </span>
      </motion.div>
      <div className="text-left">
        <h4 className="bg-gradient-to-r from-[#FF00C8] to-[#00F0FF] bg-clip-text text-transparent text-xl font-bold">
          {item.title}
        </h4>
        <h6 className="text-white text-lg font-semibold">{item.line}</h6>
        <p className="text-gray-400 text-sm">{item.para}</p>
      </div>
    </motion.div>
  ));

  return (
    <section className="bg-[#0B0C10] text-white py-20 overflow-hidden">
      {/* Section Heading */}
      <div className="w-full max-w-7xl mx-auto px-6 text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-4xl md:text-5xl font-extrabold glitch-text text-orange-400"
          data-text="Why Choose Us"
        >
          Why Choose Us
        </motion.h2>
      </div>

      {/* Features Grid */}
      <div className="w-full max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-16">
        {/* Left Side */}
        <div className="flex flex-col gap-10 md:w-1/2">{LeftFeatures}</div>

        {/* Right Side */}
        <div className="flex flex-col gap-10 md:w-1/2">{RightFeatures}</div>
      </div>
    </section>
  );
};

export default Features;

const features = [
  {
    id: 1,
    title: "Trust & Safety",
    line: "Chaos, but safe chaos",
    para: "Your ideas stay yours. We just guard the madness.",
    icon: <RiLock2Fill />,
  },
  {
    id: 2,
    title: "Always Fresh & Creative",
    line: "Boring? Never heard of it.",
    para: "Every challenge = a new twist. Expect the unexpected.",
    icon: <FaPalette />,
  },
  {
    id: 3,
    title: "Community Vibes",
    line: "Meme squad, assemble.",
    para: "React, learn, grow, and vibe together. The crowd decides who wins",
    icon: <IoIosPeople />,
  },
  {
    id: 4,
    title: "Win & Brag",
    line: "Flex like a boss.",
    para: "Rack up points, snag bragging rights, maybe even prizes",
    icon: <FaTrophy />,
  },
];
