import React from "react";
import { motion } from "framer-motion";
import { FaRocket } from "react-icons/fa";

const CallToAction = () => {
  return (
    <section className="relative bg-gradient-to-br from-black via-zinc-900 to-black py-20 overflow-hidden">
      {/* Glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.15),transparent_70%)]"></div>

      <div className="relative max-w-4xl mx-auto text-center px-6">
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-white leading-tight"
        >
          Ready to Enter{" "}
          <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
            The Glitch Room?
          </span>
        </motion.h2>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed"
        >
          Join thousands of creators and innovators already building the future.
          Level up your skills, showcase your ideas, and make your mark.
        </motion.p>

        {/* Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-10 flex justify-center"
        >
          <button
            className="flex items-center gap-2 px-7 py-3 rounded-2xl font-semibold text-lg 
            bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-[0_0_25px_rgba(34,211,238,0.7)]
            hover:shadow-[0_0_40px_rgba(236,72,153,0.8)] transition-all duration-300 cursor-pointer"
          >
            <FaRocket className="text-xl" /> Get Started
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;
