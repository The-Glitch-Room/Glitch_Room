import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { motion } from "framer-motion";

const Challenges = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.5 }}
    >
      <Navbar />
      <section className="bg-[#0B0C10] text-center h-[100vh] flex flex-col justify-center items-center px-6 pt-10">
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-extrabold glitch-text mt-15"
            data-text="challenges"
          >
            challenges
          </motion.h1>
        </div>
      </section>
      <Footer />
    </motion.div>
  );
};

export default Challenges;
