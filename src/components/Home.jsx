import React from "react";
import Navbar from "./Navbar";
import Hero from "./Hero";
import Category from "./Category";
import Features from "./Features";
import Process from "./Process";
import CallToAction from "./CallToAction";
import Footer from "./Footer";

const Home = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <Category />
      <Features />
      <Process />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Home;
