import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Home from "./components/Home";
import About from "./components/About";
import Explore from "./components/Explore";
import Challenges from "./components/Challenges";
import Process from "./components/Process";
import Features from "./components/Features";
import HelpCenter from "./components/HelpCenter";
import ScrollToHashElement from "./components/ScrollToHashElement";
import Glitches from "./components/Glitches";
import Twist from "./components/Twist";
import AIChallenge from "./components/AIChallenge";
import BugChallenge from "./components/BugChallenge";
import PitchSumission from "./components/PitchSumission";
import Dashboard from "./components/Dashboard";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/process" element={<Process />} />
        <Route path="/helpCenter" element={<HelpCenter />} />
        <Route path="/glitches" element={<Glitches />} />
        <Route path="/twists" element={<Twist />} />
        <Route path="/ai-challenges" element={<AIChallenge />} />
        <Route path="/bug-challenges" element={<BugChallenge />} />
        <Route path="/pitch" element={<PitchSumission />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <Router>
      <ScrollToHashElement />
      <AnimatedRoutes />
    </Router>
  );
};

export default App;
