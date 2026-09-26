import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { supabase } from "./supabaseClient";

// Core static components
import Home from "./components/Home";
import ScrollToHashElement from "./components/ScrollToHashElement";
import SplashScreen from "./components/SplashScreen";
import BottomNav from "./components/BottomNav";
import DailyFactBubble from "./components/DailyFactBubble";
import GBitsToast from "./components/GBitsToast";
import ErrorBoundary from "./components/ErrorBoundary";

// Code-split dynamic routes for optimal bundle performance
const About = lazy(() => import("./components/About"));
const Explore = lazy(() => import("./components/Explore"));
const Process = lazy(() => import("./components/Process"));
const Features = lazy(() => import("./components/Features"));
const HelpCenter = lazy(() => import("./components/HelpCenter"));
const GlitchesChallenges = lazy(() => import("./components/GlitchesChallenges"));
const CreativeSparksChallenges = lazy(() => import("./components/CreativeSparksChallenges"));
const AIPoweredChallenge = lazy(() => import("./components/AIPoweredChallenge"));
const DebugModeChallenges = lazy(() => import("./components/DebugModeChallenges"));
const Console = lazy(() => import("./components/Console"));
const JoinRoom = lazy(() => import("./components/JoinRoom"));
const HostRoom = lazy(() => import("./components/HostRoom"));
const FixGlitch = lazy(() => import("./components/FixGlitch"));
const GameArena = lazy(() => import("./components/GameArena"));
const ResetPassword = lazy(() => import("./components/ResetPassword"));
const YourProfile = lazy(() => import("./components/YourProfile"));
const HelpPage = lazy(() => import("./components/HelpPage"));
const Settings = lazy(() => import("./components/Settings"));
const FixBug = lazy(() => import("./components/FixBug"));
const CreatorRooms = lazy(() => import("./components/CreatorRooms/CreatorRooms"));
const ProRooms = lazy(() => import("./components/ProRooms/ProRooms"));
const CreateProRoomPage = lazy(() => import("./components/ProRooms/CreateProRoomPage"));
const ProfessionalRoomDetail = lazy(() => import("./components/ProRooms/ProfessionalRoomDetail"));
const ProRoomAssessment = lazy(() => import("./components/ProRooms/ProRoomAssessment"));
const ProRoomDashboard = lazy(() => import("./components/ProRooms/ProRoomDashboard"));
const FixCreativeSpark = lazy(() => import("./components/FixCreativeSpark"));
const FixAIChallenge = lazy(() => import("./components/FixAIChallenge"));
const ArenaEvents = lazy(() => import("./components/ArenaEvents"));
const ArenaChallenge = lazy(() => import("./components/ArenaChallenge"));
const TerminalWall = lazy(() => import("./components/TerminalWall"));
const Community = lazy(() => import("./components/Community"));
const CommunityPost = lazy(() => import("./components/CommunityPost"));
const RoomDetail = lazy(() => import("./components/CreatorRooms/RoomDetail"));
const NotFound = lazy(() => import("./components/NotFound"));
const ArenaVotingFeed = lazy(() => import("./components/ArenaVotingFeed"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const EarnRules = lazy(() => import("./components/EarnRules"));

// Route loading fallback with Glitch Room glowing spinner
const RouteLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[70vh] bg-transparent">
    <div className="w-10 h-10 border-2 border-t-transparent border-[#FF00C8] rounded-full animate-spin shadow-[0_0_25px_rgba(255,0,200,0.4)]" />
  </div>
);

// ── Protected Route wrapper ──────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, loading, openAuth } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      openAuth();
    }
  }, [loading, user]);

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

// ── Admin-only Route wrapper ───────────────────────────────────────────────
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

  // Update browser tab document title dynamically on route navigation
  useEffect(() => {
    const titles = {
      "/": "Glitch Room | Gamified Coding Arena",
      "/explore": "Explore Challenges | Glitch Room",
      "/console": "Console | Glitch Room",
      "/community": "The Glitch Lounge | Glitch Room",
      "/profile": "Your Profile | Glitch Room",
      "/pro-rooms": "Pro Rooms | Glitch Room",
      "/pro-rooms/create": "Host a Pro Room | Glitch Room",
      "/creator-rooms": "Creator Rooms | Glitch Room",
      "/join-room": "Join Room | Glitch Room",
      "/host-room": "Host Room | Glitch Room",
      "/game-arena": "Game Arena | Glitch Room",
      "/arena-events": "Arena Events | Glitch Room",
      "/arena-voting": "Arena Voting | Glitch Room",
      "/terminal-wall": "Terminal Wall | Glitch Room",
      "/glitches": "Find the Glitch | Glitch Room",
      "/bug-challenges": "Debug Mode | Glitch Room",
      "/sparks": "Creative Sparks | Glitch Room",
      "/ai-challenges": "AI Challenges | Glitch Room",
      "/settings": "Settings | Glitch Room",
      "/about": "About | Glitch Room",
      "/features": "Features | Glitch Room",
      "/process": "How It Works | Glitch Room",
      "/helpCenter": "Help Center | Glitch Room",
      "/help": "Help & Support | Glitch Room",
      "/earn-rules": "Earn Rules | Glitch Room",
      "/admin": "Admin Dashboard | Glitch Room",
      "/reset-password": "Reset Password | Glitch Room",
    };

    let title = titles[location.pathname];
    if (!title) {
      if (location.pathname.startsWith("/community/")) title = "Discussion | Glitch Room";
      else if (location.pathname.includes("/assessment")) title = "Assessment | Glitch Room";
      else if (location.pathname.startsWith("/pro-rooms/")) title = "Pro Room | Glitch Room";
      else if (location.pathname.startsWith("/creator-rooms/") || location.pathname.startsWith("/room/")) title = "Creator Room | Glitch Room";
      else if (location.pathname.startsWith("/arena/")) title = "Arena Challenge | Glitch Room";
      else if (location.pathname.startsWith("/glitch/")) title = "Fix Glitch | Glitch Room";
      else if (location.pathname.startsWith("/fixbug/") || location.pathname.startsWith("/fix-bug/")) title = "Fix Bug | Glitch Room";
      else if (location.pathname.startsWith("/fixspark/") || location.pathname.startsWith("/fix-spark/")) title = "Creative Spark | Glitch Room";
      else if (location.pathname.startsWith("/ai-challenge/")) title = "AI Challenge | Glitch Room";
      else title = "Glitch Room | Gamified Coding Arena";
    }
    document.title = title;
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<RouteLoadingFallback />}>
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
        <Route path="/fix-bug/:id" element={<FixBug />} />
        <Route path="/fix-spark/:id" element={<FixCreativeSpark />} />
        <Route path="/fixspark/:id" element={<FixCreativeSpark />} />
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
        <Route path="/creator-rooms" element={<CreatorRooms />} />
        <Route path="/creator-rooms/:id" element={<RoomDetail />} />
        <Route path="/pro-rooms" element={<ErrorBoundary><ProRooms /></ErrorBoundary>} />
        <Route
          path="/pro-rooms/create"
          element={
            <ProtectedRoute>
              <CreateProRoomPage />
            </ProtectedRoute>
          }
        />
        <Route path="/pro-rooms/:id" element={<ErrorBoundary><ProfessionalRoomDetail /></ErrorBoundary>} />
        <Route
          path="/pro-rooms/:id/assessment"
          element={
            <ProtectedRoute>
              <ErrorBoundary><ProRoomAssessment /></ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pro-rooms/:id/dashboard"
          element={
            <ProtectedRoute>
              <ProRoomDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/room/:id" element={<RoomDetail />} />
        <Route path="/arena-voting" element={<ArenaVotingFeed />} />
        <Route path="/earn-rules" element={<EarnRules />} />

        {/* ── Legacy route redirects ── */}
        <Route
          path="/hall-of-fame"
          element={<Navigate to="/terminal-wall" replace />}
        />
        <Route
          path="/leaderboard"
          element={<Navigate to="/terminal-wall" replace />}
        />
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
          path="/create-profile"
          element={<Navigate to="/profile" replace />}
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
    </Suspense>
  </AnimatePresence>
  );
};

// ── App root ─────────────────────────────────────────────────────────────────
const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ScrollToHashElement />
        <DailyFactBubble />
        <GBitsToast />
        {showSplash ? (
          <SplashScreen onFinish={() => setShowSplash(false)} />
        ) : (
          <div className="min-h-screen bg-[#070709] text-white flex flex-col justify-between selection:bg-[#00F0FF]/20 overflow-hidden font-sans">
            <AnimatedRoutes />
            <BottomNav />
          </div>
        )}
      </AuthProvider>
    </Router>
  );
};

export default App;
