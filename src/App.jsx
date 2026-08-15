import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

import Home from "./components/Home";
import About from "./components/About";
import Explore from "./components/Explore";
import Process from "./components/Process";
import Features from "./components/Features";
import HelpCenter from "./components/HelpCenter";
import ScrollToHashElement from "./components/ScrollToHashElement";
import GlitchesChallenges from "./components/GlitchesChallenges";
import CreativeSparksChallenges from "./components/CreativeSparksChallenges";
import AIPoweredChallenge from "./components/AIPoweredChallenge";
import DebugModeChallenges from "./components/DebugModeChallenges";
import Console from "./components/Console";
import JoinRoom from "./components/JoinRoom";
import HostRoom from "./components/HostRoom";
import FixGlitch from "./components/FixGlitch";
import GameArena from "./components/GameArena";
import ResetPassword from "./components/ResetPassword";
import YourProfile from "./components/YourProfile";
import HelpPage from "./components/HelpPage";
import Settings from "./components/Settings";
import FixBug from "./components/FixBug";
import CreatorRooms from "./components/CreatorRooms/CreatorRooms";
import FixCreativeSpark from "./components/FixCreativeSpark";
import FixAIChallenge from "./components/FixAIChallenge";
import ArenaEvents from "./components/ArenaEvents";
import ArenaChallenge from "./components/ArenaChallenge";
import TerminalWall from "./components/TerminalWall";
import Community from "./components/Community";
import CommunityPost from "./components/CommunityPost";
import RoomDetail from "./components/CreatorRooms/RoomDetail";
import SplashScreen from "./components/SplashScreen";
import NotFound from "./components/NotFound";
import BottomNav from "./components/BottomNav";
import ArenaVotingFeed from "./components/ArenaVotingFeed";
import DailyFactBubble from "./components/DailyFactBubble";
import AdminDashboard from "./components/AdminDashboard";
import EarnRules from "./components/EarnRules";

// NOTE: BossBattle, UIRecreation, and AIvsHuman are on hold post-launch —
// their components still exist in /components but are intentionally
// unrouted and unimported here. Re-add one at a time when ready.

// ── Protected Route wrapper ──────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, loading, openAuth } = useAuth();

  useEffect(() => {
    // Only react once we actually know whether there's a user or not —
    // never fire this while the initial session check is still loading.
    if (!loading && !user) {
      openAuth();
    }
  }, [loading, user]);

  // While we're still checking the session, render nothing (avoids the
  // login modal flashing open on every refresh before auth resolves).
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080810]">
        <div className="w-10 h-10 border-2 border-t-transparent border-[#FF00C8] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// ── Admin Route wrapper (requires user + profiles.is_admin = true) ──────────
const AdminRoute = ({ children }) => {
  const { user, loading, openAuth } = useAuth();
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (loading) return;
      if (!user) {
        setCheckingAdmin(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      setIsAdmin(!!data?.is_admin);
      setCheckingAdmin(false);
    };
    checkAdmin();
  }, [user, loading]);

  useEffect(() => {
    if (!loading && !user) {
      openAuth();
    }
  }, [loading, user]);

  if (loading || checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080810]">
        <div className="w-10 h-10 border-2 border-t-transparent border-[#FF00C8] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// ── Animated Routes ──────────────────────────────────────────────────────────
const AnimatedRoutes = () => {
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const userId = data?.user?.id;
      const userMeta = data?.user?.user_metadata;
      const savedAccent =
        (userId ? localStorage.getItem(`glitch_accent_${userId}`) : null) ||
        userMeta?.accentColor ||
        "#FF00C8";
      document.documentElement.style.setProperty("--accent", savedAccent);
    });
  }, []);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* ── Public routes ── */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/process" element={<Process />} />
        <Route path="/helpCenter" element={<HelpCenter />} />
        <Route path="/features" element={<Features />} />
        <Route path="/glitches" element={<GlitchesChallenges />} />
        <Route path="/sparks" element={<CreativeSparksChallenges />} />
        <Route path="/ai-challenges" element={<AIPoweredChallenge />} />
        <Route path="/ai-challenge/:id" element={<FixAIChallenge />} />
        <Route path="/bug-challenges" element={<DebugModeChallenges />} />
        <Route path="/fixbug/:id" element={<FixBug />} />
        <Route path="/fix-spark/:id" element={<FixCreativeSpark />} />
        <Route path="/glitch/:id" element={<FixGlitch />} />
        <Route path="/game-arena" element={<GameArena />} />
        <Route path="/find-glitch" element={<GameArena />} />
        <Route path="/join-room" element={<JoinRoom />} />
        <Route path="/host-room" element={<HostRoom />} />
        <Route path="/arena-events" element={<ArenaEvents />} />
        <Route path="/arena/:eventId" element={<ArenaChallenge />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/:postId" element={<CommunityPost />} />
        <Route path="/room/:id" element={<RoomDetail />} />
        <Route path="/arena-voting" element={<ArenaVotingFeed />} />
        <Route path="/earn-rules" element={<EarnRules />} />

        {/* ── Legacy route redirects ── */}
        {/* Hall of Fame was merged into Terminal Wall's "All-Time Legends" tab */}
        <Route
          path="/hall-of-fame"
          element={<Navigate to="/terminal-wall" replace />}
        />
        {/* Old Leaderboard now lives as Terminal Wall's "Live Rankings" tab */}
        <Route
          path="/leaderboard"
          element={<Navigate to="/terminal-wall" replace />}
        />
        {/* Dashboard renamed to Console */}
        <Route path="/dashboard" element={<Navigate to="/console" replace />} />

        {/* ── Protected routes (require login) ── */}
        <Route
          path="/console"
          element={
            <ProtectedRoute>
              <Console />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <YourProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <HelpPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/creator-rooms"
          element={
            <ProtectedRoute>
              <CreatorRooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/terminal-wall"
          element={
            <ProtectedRoute>
              <TerminalWall />
            </ProtectedRoute>
          }
        />

        {/* ── Admin-only routes ── */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* ── 404 fallback ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

// ── App root ─────────────────────────────────────────────────────────────────
const App = () => {
  // Splash screen state
  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem("splash_shown"),
  );

  const handleSplashComplete = () => {
    sessionStorage.setItem("splash_shown", "true");
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      <Router>
        <AuthProvider>
          <ScrollToHashElement />
          <AnimatedRoutes />
          <BottomNav />
          <DailyFactBubble />
        </AuthProvider>
      </Router>
    </>
  );
};

export default App;
