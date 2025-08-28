import React from "react";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section className="bg-[#0B0C10] text-center h-[120vh] flex flex-col justify-center items-center px-6 pt-10">
      {/* Container with consistent max-width */}
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
        {/* Heading Animation */}
        <motion.h1
          className="glitchh-text text-4xl md:text-6xl text-center"
          data-text="WHERE CHAOS SPARKS CREATIVITY"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          WHERE CHAOS SPARKS CREATIVITY
        </motion.h1>

        {/* Paragraph Animation */}
        <motion.p
          className="text-lg md:text-xl text-gray-300 max-w-2xl mb-10 mt-5"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          Step into the{" "}
          <span className="text-[#FF00C8] font-bold">Glitch Room</span>, where
          imagination meets chaos. Collaborate, explore, and build with others.
        </motion.p>

        {/* Buttons Animation */}
        <motion.div
          className="flex gap-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF00C8] to-[#00F0FF] text-white font-bold shadow-lg hover:shadow-[#FF00C8]/50 transition"
          >
            Join a Room
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D600FF] to-[#FF00C8] text-white font-bold shadow-lg hover:shadow-[#00F0FF]/50 transition"
          >
            Host a Room
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
