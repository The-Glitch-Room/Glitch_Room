import React from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";

const About = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.5 }}
      className="bg-[#0B0C10] text-gray-200"
    >
      <Navbar />

      {/* Hero Section */}
      <section className="min-h-[100vh] flex flex-col justify-center items-center px-6 pt-10">
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-extrabold glitch-text mt-15"
            data-text="about us"
          >
            about us
          </motion.h1>
          <motion.p
            className="mt-6 text-lg text-gray-400 max-w-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Breaking boundaries with creativity and innovation. Learn more about
            our mission, vision, and what drives us.
          </motion.p>
        </div>
      </section>

      {/* About Content */}
      <section className="bg-[#1F2833] py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-24">
          {/* Who We Are */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-cyan-400 mb-6 glitchh-text">
              Who We Are
            </h2>
            <p className="text-lg leading-relaxed max-w-3xl mx-auto text-gray-300">
              We are a passionate collective of developers, designers, and
              innovators crafting digital experiences that blend technology with
              creativity. At Glitch Room, our purpose is to empower creators and
              push the boundaries of what’s possible.
            </p>
          </motion.div>

          {/* Mission & Vision */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12"
          >
            <div className="p-8 bg-[#0B0C10] rounded-2xl border border-cyan-500/30 shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:scale-105 transition">
              <h3 className="text-2xl font-semibold text-cyan-400 mb-4">
                Our Mission
              </h3>
              <p className="text-gray-300">
                To build futuristic, scalable, and human-centered technology
                that empowers people and transforms ideas into digital reality.
              </p>
            </div>
            <div className="p-8 bg-[#0B0C10] rounded-2xl border border-red-500/30 shadow-[0_0_20px_rgba(255,0,0,0.2)] hover:scale-105 transition">
              <h3 className="text-2xl font-semibold text-red-400 mb-4">
                Our Vision
              </h3>
              <p className="text-gray-300">
                To become a global hub where creators connect, collaborate, and
                innovate — redefining the digital future with bold ideas.
              </p>
            </div>
          </motion.div>

          {/* What We Do */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-red-400 mb-6 glitchh-text">
              What We Do
            </h2>
            <p className="text-lg leading-relaxed max-w-4xl mx-auto text-gray-300">
              From immersive web and mobile apps to cutting-edge AI solutions,
              we create platforms that merge design and technology. Our goal is
              to deliver seamless, futuristic experiences that inspire and
              empower.
            </p>
          </motion.div>

          {/* Why Choose Us */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-10"
          >
            <div className="p-6 bg-[#0B0C10] rounded-2xl border border-cyan-500/40 shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.6)] hover:scale-105 transition">
              <h4 className="text-xl font-semibold text-cyan-400 mb-3">
                Innovation
              </h4>
              <p className="text-gray-400">
                Constantly experimenting with new technologies to pioneer
                futuristic solutions.
              </p>
            </div>
            <div className="p-6 bg-[#0B0C10] rounded-2xl border border-red-500/40 shadow-[0_0_15px_rgba(255,0,0,0.3)] hover:shadow-[0_0_25px_rgba(255,0,0,0.6)] hover:scale-105 transition">
              <h4 className="text-xl font-semibold text-red-400 mb-3">
                Reliability
              </h4>
              <p className="text-gray-400">
                Building secure, scalable, and future-ready platforms you can
                trust.
              </p>
            </div>
            <div className="p-6 bg-[#0B0C10] rounded-2xl border border-cyan-500/40 shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.6)] hover:scale-105 transition">
              <h4 className="text-xl font-semibold text-cyan-400 mb-3">
                Passion
              </h4>
              <p className="text-gray-400">
                We love what we do — every project is fueled with creativity and
                dedication.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </motion.div>
  );
};

export default About;
