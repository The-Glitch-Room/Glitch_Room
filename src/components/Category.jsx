import React from "react";
import { motion } from "framer-motion";

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.25, // cards appear one after another
    },
  },
};

const Category = () => {
  return (
    <section className="py-16 bg-[#0B0C10] text-white">
      {/* Container with same max width as Hero */}
      <div className="w-full max-w-7xl mx-auto px-6">
        {/* Section Heading */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-extrabold glitch-text"
            data-text="Step Into the Chaos"
          >
            Step Into the Chaos
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-4 text-lg text-zinc-400"
          >
            Dive into wild challenges where imagination meets chaos.
          </motion.p>
        </div>

        {/* Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid md:grid-cols-3 gap-10"
        >
          {/* Card 1 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.02, rotate: 0 }}
            className="relative flex flex-col items-center"
          >
            <div className="bg-white rounded-xl shadow-lg p-6 pt-10 text-center w-full">
              <h3 className="text-lg font-bold text-black">
                Find the glitch. Break the mold.
              </h3>
              <p className="text-zinc-600 mt-2 text-sm">
                Jump into wild, unpredictable challenges where chaos sparks
                creativity. Spot hidden problems, flip the script, and unleash
                your boldest ideas—no boring decks, just pure fun.
              </p>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.02, rotate: 0 }}
            className="relative flex flex-col items-center"
          >
            <div className="bg-white rounded-xl shadow-lg p-6 pt-10 text-center w-full">
              <h3 className="text-lg font-bold text-black">
                Twist cards. Chaos unlocked.
              </h3>
              <p className="text-zinc-600 mt-2 text-sm">
                Draw a random twist and watch your strategy flip. Adapt fast,
                meme harder, and keep your crew guessing. Every round, a new
                curveball.
              </p>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.02, rotate: 0 }}
            className="relative flex flex-col items-center"
          >
            <div className="bg-white rounded-xl shadow-lg p-6 pt-10 text-center w-full">
              <h3 className="text-lg font-bold text-black">
                Pitch wild. Meme loud. Win big.
              </h3>
              <p className="text-zinc-600 mt-2 text-sm">
                Show off your fix with memes, comics, or quick vids. Get live
                emoji reactions, instant feedback, and leaderboard bragging
                rights. Your style, your rules.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Category;
