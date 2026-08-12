import React from "react";
import Navbar from "./Navbar";
import Hero from "./Hero";
import Category from "./Category";
import WhyChooseUs from "./WhyChooseUs";
import Process from "./Process";
import GlitchSandboxTeaser from "./GlitchSandboxTeaser";
import EarnRewardsTeaser from "./EarnRewardsTeaser";
import Footer from "./Footer";
import GlitchBackground from "./GlitchBackground";

const Home = () => {
  return (
    <div className="relative min-h-screen bg-[#070709] text-white overflow-hidden">
      {/* ── Continuous Glitch Background across the ENTIRE Home page ── */}
      <GlitchBackground />

      <div className="relative z-10">
        <Navbar />
        <Hero />
        <Category />
        <WhyChooseUs />
        <Process />
        <GlitchSandboxTeaser />
        <EarnRewardsTeaser />
        <Footer />
      </div>
    </div>
  );
};

export default Home;
