import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../Navbar";
import Footer from "../Footer";
import GlitchBackground from "../GlitchBackground";
import {
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  Users,
  Trophy,
  Award,
  ArrowRight,
  Zap,
  CheckCircle,
  FileText,
  AlertTriangle,
  Play,
  Share2,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import Button from "../Button";
import { getProRoomLifecycleState } from "./ProRoomCard";
import { supabase } from "../../supabaseClient";

const ProfessionalRoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [sections, setSections] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'format', 'eligibility', 'prizes', 'leaderboard'
  const [showRegModal, setShowRegModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [appAnswers, setAppAnswers] = useState({});
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const fetchProRoomDetail = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;

      // 1. Fetch Room Metadata
      const { data: roomData, error: roomErr } = await supabase
        .from("pro_rooms")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (roomErr || !roomData) {
        // Fallback for seed demo room if database table doesn't exist yet
        setRoom({
          id,
          name: "MIT Arena Battle — AI Systems & Algorithmic Design",
          title: "MIT Arena Battle — AI Systems & Algorithmic Design",
          short_description: "Pro assessment testing real-time neural network optimization, system latency reduction, and concurrent data pipelines.",
          detailed_description: "Welcome to the MIT Arena Battle hosted in collaboration with Glitch Room. This high-stakes technical assessment tests advanced algorithms, concurrent system design, and AI model performance metrics. Candidates will navigate timed MCQ and coding sections with automated test case evaluation.",
          category: "AI & Algorithms",
          event_type: "Hiring Assessment",
          org_name: "MIT CSAIL & Glitch Engine",
          gbits_prize_pool: 2500,
          duration_minutes: 180,
          status: "registration_open",
          member_count: 48,
          passing_score: 40,
          total_possible_score: 100,
          prize_details: "Winner: Certificate + Winner Badge + 1,000 gBits | Top 10: Achievement Badge | All: Participation Certificate",
        });
        setLoading(false);
        return;
      }

      setRoom(roomData);
      if (uid && roomData.host_id === uid) setIsHost(true);

      // 2. Fetch Sections & Questions Count
      const { data: secData } = await supabase
        .from("pro_room_sections")
        .select("*, pro_room_questions(id)")
        .eq("room_id", id)
        .order("order_index", { ascending: true });

      setSections(secData || []);

      // 3. Fetch Candidate Registrations
      const { data: regData } = await supabase
        .from("pro_room_registrations")
        .select("*, profiles(username, full_name, avatar_url)")
        .eq("room_id", id);

      setRegistrations(regData || []);
      if (uid && regData?.some((r) => r.user_id === uid)) {
        setIsRegistered(true);
      }

      // 4. Fetch Leaderboard
      const { data: lbData } = await supabase
        .from("pro_room_leaderboard")
        .select("*, profiles(username, full_name, avatar_url)")
        .eq("room_id", id)
        .order("total_score", { ascending: false });

      setLeaderboard(lbData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProRoomDetail();
  }, [id]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;

      if (!uid) {
        showToast("Please sign in to register for this Pro Room.");
        setRegistering(false);
        return;
      }

      const { error } = await supabase.from("pro_room_registrations").insert({
        room_id: id,
        user_id: uid,
        team_name: teamName || null,
        app_responses: appAnswers,
        status: "registered",
      });

      if (error && !error.message?.includes("duplicate")) {
        throw error;
      }

      setIsRegistered(true);
      setShowRegModal(false);
      showToast("🎉 Successfully registered for Pro Assessment Arena!");
      fetchProRoomDetail();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Registration failed.");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-t-transparent border-[#00F0FF] rounded-full animate-spin" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <ShieldCheck size={48} className="text-gray-600 mb-3" />
          <h2 className="text-xl font-bold">Pro Room Arena Not Found</h2>
          <p className="text-gray-400 text-xs mt-1 mb-4">The requested assessment room does not exist or has been removed.</p>
          <button
            onClick={() => navigate("/pro-rooms")}
            className="px-5 py-2.5 rounded-xl bg-[#00F0FF]/20 text-[#00F0FF] text-xs font-bold"
          >
            Return to Pro Rooms Hub
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const lifecycle = getProRoomLifecycleState(room);

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

        {/* Hero Header Card */}
        <div className="relative bg-[#0d0d16] border border-cyan-500/30 rounded-3xl overflow-hidden shadow-2xl mb-8">
          <div className="h-44 sm:h-56 w-full relative overflow-hidden bg-gradient-to-r from-purple-900/40 via-[#00F0FF]/20 to-black">
            {room.cover_image && (
              <img
                src={room.cover_image}
                alt="Cover"
                className="w-full h-full object-cover opacity-60"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d16] via-[#0d0d16]/60 to-transparent" />
          </div>

          <div className="px-6 sm:px-10 pb-8 -mt-20 relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {room.org_logo ? (
                <img
                  src={room.org_logo}
                  alt={room.org_name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-[#00F0FF]/50 shadow-2xl bg-[#161622] shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00F0FF]/30 to-purple-600/30 border-2 border-[#00F0FF]/50 flex items-center justify-center shrink-0 shadow-2xl">
                  <Building2 size={32} className="text-[#00F0FF]" />
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[11px] font-mono font-bold px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[#00F0FF] flex items-center gap-1">
                    <ShieldCheck size={12} /> {room.org_name || "Verified Examiner"}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                      lifecycle.isLive
                        ? "bg-red-500/10 border-red-500/40 text-red-400 animate-pulse"
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    }`}
                  >
                    {lifecycle.label}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {room.name || room.title}
                </h1>
              </div>
            </div>

            {/* Main CTA Actions */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
              {isHost && (
                <button
                  onClick={() => navigate(`/pro-rooms/${id}/dashboard`)}
                  className="px-5 py-3 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 font-bold text-xs hover:bg-purple-600/30 transition cursor-pointer"
                >
                  Host Control Dashboard ⚙️
                </button>
              )}

              {lifecycle.isLive ? (
                <button
                  onClick={() => navigate(`/pro-rooms/${id}/assessment`)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 via-purple-600 to-[#FF00C8] text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-red-500/20 hover:scale-105 transition cursor-pointer animate-pulse"
                >
                  <Play size={15} /> Enter Live Assessment
                </button>
              ) : isRegistered ? (
                <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 font-bold text-xs">
                  <CheckCircle size={15} /> Registered Candidate
                </div>
              ) : (
                <button
                  onClick={() => setShowRegModal(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] to-purple-600 hover:from-[#00F0FF] hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-[#00F0FF]/20 hover:scale-105 transition cursor-pointer"
                >
                  Register Now <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto py-2 mb-8 border-b border-white/10">
          {[
            { id: "overview", label: "Overview & Guidelines" },
            { id: "format", label: `Test Sections (${sections.length})` },
            { id: "eligibility", label: "Eligibility & Rules" },
            { id: "prizes", label: "Prizes & Rewards" },
            { id: "leaderboard", label: `Leaderboard (${leaderboard.length})` },
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

        {/* Tab Contents */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText size={18} className="text-[#00F0FF]" /> About Assessment Arena
                </h3>
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {room.detailed_description || room.short_description}
                </p>
              </div>

              {/* Sections Quick Preview */}
              <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Trophy size={18} className="text-purple-400" /> Assessment Structure
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sections.map((sec, idx) => (
                    <div
                      key={sec.id || idx}
                      className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        0{idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{sec.section_name}</h4>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {sec.pro_room_questions?.length || 2} Questions • {sec.time_limit_minutes || 30} Mins
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Details */}
            <div className="space-y-6">
              <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">
                  Event Parameters
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400">Duration</span>
                    <span className="text-white font-bold">{room.duration_minutes || 120} Mins</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400">Total Score</span>
                    <span className="text-[#00F0FF] font-bold">{room.total_possible_score || 100} Points</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400">Passing Threshold</span>
                    <span className="text-emerald-400 font-bold">{room.passing_score || 40} Points</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400">Prize Pool</span>
                    <span className="text-amber-400 font-bold">{room.gbits_prize_pool || 500} gBits</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: LEADERBOARD */}
        {activeTab === "leaderboard" && (
          <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4">Official Candidate Standings</h3>
            {leaderboard.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xs">
                Leaderboard will appear once participants submit their assessments.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {leaderboard.map((lb, idx) => (
                  <div key={lb.id || idx} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-[#00F0FF] w-6">#{idx + 1}</span>
                      <span className="text-white font-bold">{lb.profiles?.full_name || lb.profiles?.username || "Candidate"}</span>
                    </div>
                    <span className="font-mono text-purple-300 font-bold">{lb.total_score} Points</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Registration Modal */}
      <AnimatePresence>
        {showRegModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#0d0d16] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-2">Register for Pro Assessment</h3>
              <p className="text-xs text-gray-400 mb-4">
                Confirm your registration to enter the live assessment arena when the event starts.
              </p>

              {room.participation_type === "team" && (
                <div className="mb-4">
                  <label className="text-xs text-gray-300 font-bold block mb-1">Team Name</label>
                  <input
                    type="text"
                    placeholder="Enter your team name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full bg-[#07070e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00F0FF]"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  onClick={() => setShowRegModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00F0FF] to-purple-600 text-white text-xs font-bold"
                >
                  {registering ? "Registering..." : "Confirm Registration"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default ProfessionalRoomDetail;
