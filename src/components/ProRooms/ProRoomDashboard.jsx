import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../Navbar";
import Footer from "../Footer";
import GlitchBackground from "../GlitchBackground";
import StatCard from "../StatCard";
import {
  ShieldCheck,
  Users,
  Trophy,
  CheckCircle,
  Clock,
  Send,
  Download,
  Search,
  Filter,
  ArrowRight,
  Megaphone,
  Award,
  Zap,
} from "lucide-react";
import { supabase } from "../../supabaseClient";

const ProRoomDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // This page is a host-only control center. isHost gates the render below,
  // but note: this ONLY stops the page from rendering — it is not a security
  // boundary by itself. The real boundary has to be Supabase RLS policies on
  // pro_rooms / pro_room_announcements (see the SQL provided alongside this
  // fix), since anyone can call the same supabase client directly from
  // devtools regardless of what this component renders.
  const isHost = Boolean(
    currentUserId && room && room.host_id === currentUserId,
  );

  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'candidates', 'grading', 'leaderboard', 'announcements', 'results'
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id || null;
      setCurrentUserId(uid);

      // 1. Fetch Room Metadata
      const { data: roomData } = await supabase
        .from("pro_rooms")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (roomData) setRoom(roomData);

      // Not the host — stop here. Do not fetch registrations/submissions/
      // leaderboard, so this data never even lands in memory for a non-host.
      if (!roomData || !uid || roomData.host_id !== uid) {
        setLoading(false);
        return;
      }

      // 2. Fetch Registrations
      const { data: regData } = await supabase
        .from("pro_room_registrations")
        .select("*, profiles(username, full_name, avatar_url)")
        .eq("room_id", id);
      setRegistrations(regData || []);

      // 3. Fetch Submissions
      const { data: subData } = await supabase
        .from("pro_room_submissions")
        .select("*, profiles(username, full_name, avatar_url)")
        .eq("room_id", id);
      setSubmissions(subData || []);

      // 4. Fetch Leaderboard
      const { data: lbData } = await supabase
        .from("pro_room_leaderboard")
        .select("*, profiles(username, full_name, avatar_url)")
        .eq("room_id", id)
        .order("total_score", { ascending: false });
      setLeaderboard(lbData || []);

      // 5. Fetch Announcements
      const { data: annData } = await supabase
        .from("pro_room_announcements")
        .select("*")
        .eq("room_id", id)
        .order("created_at", { ascending: false });
      setAnnouncements(annData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [id]);

  const handlePostAnnouncement = async () => {
    if (!isHost || !annTitle || !annContent) return;
    try {
      const { data: authData } = await supabase.auth.getUser();
      const { error } = await supabase.from("pro_room_announcements").insert({
        room_id: id,
        author_id: authData?.user?.id,
        title: annTitle,
        content: annContent,
      });

      if (error) {
        console.error("Failed to post announcement:", error);
        showToast("⚠️ Couldn't post the announcement — please try again.");
        return;
      }

      setAnnTitle("");
      setAnnContent("");
      showToast("📢 Announcement broadcasted to candidates!");
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      showToast("⚠️ Couldn't post the announcement — please try again.");
    }
  };

  const handlePublishResults = async () => {
    if (!isHost) return;
    setPublishing(true);
    try {
      const { error } = await supabase
        .from("pro_rooms")
        .update({ status: "results_published" })
        .eq("id", id);

      if (error) {
        console.error("Failed to publish results:", error);
        showToast("⚠️ Couldn't publish results — please try again.");
        return;
      }

      showToast("🏆 Results published successfully!");
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      showToast("⚠️ Couldn't publish results — please try again.");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-t-transparent border-[#00F0FF] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isHost) {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <ShieldCheck size={40} className="text-red-400 mb-4" />
          <h1 className="text-xl font-black text-white mb-2">
            Host Access Only
          </h1>
          <p className="text-gray-400 text-sm max-w-sm mb-6">
            This control center is only available to the organizer who created
            this room.
          </p>
          <button
            onClick={() => navigate(`/pro-rooms/${id}`)}
            className="px-5 py-2.5 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-bold hover:bg-[#00F0FF]/25 cursor-pointer"
          >
            Back to Room
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const totalRegs = registrations.length;
  const totalSubs = submissions.length;
  const avgScore =
    totalSubs > 0
      ? Math.round(
          submissions.reduce((s, b) => s + (b.total_score || 0), 0) / totalSubs,
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col font-sans selection:bg-[#00F0FF]/20 relative overflow-hidden">
      <Navbar />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl bg-[#0d0d16] border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-mono font-bold shadow-2xl shadow-[#00F0FF]/20 flex items-center gap-2"
          >
            <Zap size={14} className="text-amber-400" /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full relative z-10">
        <GlitchBackground />

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 uppercase tracking-widest">
              ORGANIZER CONTROL CENTER
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {room?.name || "Pro Room Dashboard"}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {room?.org_name} • Status:{" "}
              <span className="text-[#00F0FF] font-bold uppercase">
                {room?.status || "Live"}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/pro-rooms/${id}`)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:text-white"
            >
              View Candidate Page
            </button>
            <button
              onClick={handlePublishResults}
              disabled={publishing || room?.status === "results_published"}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00F0FF] to-purple-600 text-white text-xs font-bold shadow-lg shadow-[#00F0FF]/20 disabled:opacity-50"
            >
              {room?.status === "results_published"
                ? "✓ Results Published"
                : "Publish Results 🏆"}
            </button>
          </div>
        </div>

        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Registrations"
            value={totalRegs}
            change="Candidate Roster"
            color="cyan"
            icon={Users}
          />
          <StatCard
            label="Submissions Received"
            value={totalSubs}
            change="Test Attempts"
            color="purple"
            icon={CheckCircle}
          />
          <StatCard
            label="Average Score"
            value={`${avgScore} Pts`}
            change="Automated Benchmark"
            color="pink"
            icon={Trophy}
          />
          <StatCard
            label="Announcements"
            value={announcements.length}
            change="Broadcast Messages"
            color="cyan"
            icon={Megaphone}
          />
        </div>

        {/* Management Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto py-2 mb-8 border-b border-white/10">
          {[
            { id: "overview", label: "Overview & Analytics" },
            { id: "candidates", label: `Candidates (${totalRegs})` },
            { id: "grading", label: `Submissions (${totalSubs})` },
            { id: "leaderboard", label: "Leaderboard & Ranks" },
            { id: "announcements", label: "Broadcast Announcements" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === t.id
                  ? "bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF]"
                  : "bg-white/5 border border-white/5 text-gray-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content: Candidates */}
        {activeTab === "candidates" && (
          <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4">
              Registered Candidates
            </h3>
            {registrations.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xs">
                No candidate registrations recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {registrations.map((r, idx) => (
                  <div
                    key={r.id || idx}
                    className="py-3 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-gray-500">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="text-white font-bold block">
                          {r.profiles?.full_name ||
                            r.profiles?.username ||
                            "Candidate"}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {r.team_name
                            ? `Team: ${r.team_name}`
                            : "Individual Candidate"}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                      {r.status || "Registered"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Broadcast Announcements */}
        {activeTab === "announcements" && (
          <div className="space-y-6">
            <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone size={18} className="text-[#00F0FF]" /> Post
                Broadcast Announcement
              </h3>
              <input
                type="text"
                placeholder="Announcement Title..."
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                className="w-full bg-[#07070e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
              />
              <textarea
                rows={3}
                placeholder="Write broadcast message to all registered candidates..."
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                className="w-full bg-[#07070e] border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-[#00F0FF]"
              />
              <button
                onClick={handlePostAnnouncement}
                className="px-5 py-2.5 rounded-xl bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 text-xs font-bold hover:bg-[#00F0FF]/30 cursor-pointer"
              >
                Broadcast Announcement 📢
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProRoomDashboard;
