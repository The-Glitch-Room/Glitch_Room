// src/components/HandbookPage.jsx
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PageHeading from "./PageHeading";
import GlitchBackground from "./GlitchBackground";
import DebuggingHandbook from "./DebuggingHandbook";

export default function HandbookPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative bg-[#0B0C10] text-gray-200 min-h-screen overflow-hidden"
    >
      <GlitchBackground />

      <div className="relative z-10">
        <Navbar />

        {/* ── HERO HEADER ── */}
        <section className="relative pt-36 md:pt-44 pb-10 md:pb-14 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <PageHeading
              eyebrow="DEVELOPER FIELD GUIDE"
              title="The Debugging Handbook"
              subtitle="Master the fundamental mindset, error anatomy, stack traces, and systematic workflow to investigate and solve any broken code."
              accent="cyan"
              size="xl"
            />
          </div>
        </section>

        {/* ── MAIN HANDBOOK READER ── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <DebuggingHandbook />
        </main>

        <Footer />
      </div>
    </motion.div>
  );
}
