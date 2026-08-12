import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../supabaseClient";
import Navbar from "../Navbar";
import Footer from "../Footer";
import RoomLeaderboardModal from "./RoomLeaderboardModal";
import DeleteRoomModal from "./DeleteRoomModal";
import {
  Users,
  Copy,
  CheckCircle,
  ArrowLeft,
  Target,
  Check,
  X,
  HelpCircle,
  Award,
  Lock,
  Globe,
  Clock,
  Building2,
  RefreshCw,
  Bookmark,
  ChevronRight,
  Sparkles,
  Share2,
  Crown,
  Flame,
  Zap,
  BarChart2,
  CheckSquare,
  Trash2,
  Play,
} from "lucide-react";

// ── Default Question Pool by Category if Room Has No Custom Questions ────────
const DEFAULT_QUESTION_POOLS = {
  AI: [
    {
      id: "ai-q1",
      question: "Which algorithm is used to minimize the cost function in Gradient Descent?",
      optionA: "Linear Regression",
      optionB: "K-Means Clustering",
      optionC: "Gradient Descent",
      optionD: "Apriori Algorithm",
      correct: "C",
    },
    {
      id: "ai-q2",
      question: "Which type of machine learning uses labeled datasets for model training?",
      optionA: "Unsupervised Learning",
      optionB: "Reinforcement Learning",
      optionC: "Supervised Learning",
      optionD: "Self-Supervised Learning",
      correct: "C",
    },
    {
      id: "ai-q3",
      question: "What is the primary function of an activation function in neural networks?",
      optionA: "To normalize input weights",
      optionB: "To introduce non-linearity into the model",
      optionC: "To prevent gradient explosion",
      optionD: "To reduce dataset dimensionality",
      correct: "B",
    },
    {
      id: "ai-q4",
      question: "Which neural network architecture is best suited for Sequential & Time-Series Data?",
      optionA: "CNN (Convolutional Neural Network)",
      optionB: "RNN / LSTM",
      optionC: "Autoencoders",
      optionD: "GANs",
      correct: "B",
    },
    {
      id: "ai-q5",
      question: "What does 'Overfitting' mean in Machine Learning?",
      optionA: "Model performs poorly on both training and test data",
      optionB: "Model performs well on training data but poorly on unseen test data",
      optionC: "Model trains too fast without learning features",
      optionD: "Model uses insufficient training features",
      correct: "B",
    },
    {
      id: "ai-q6",
      question: "Which metrics are derived from a Confusion Matrix?",
      optionA: "Precision, Recall, F1-Score",
      optionB: "Mean Squared Error & R2 Score",
      optionC: "Cosine Similarity & Jaccard Index",
      optionD: "Learning Rate & Momentum",
      correct: "A",
    },
    {
      id: "ai-q7",
      question: "What attention mechanism forms the foundation of Transformer models?",
      optionA: "Recurrent Attention",
      optionB: "Self-Attention (Scaled Dot-Product)",
      optionC: "Spatial Convolution Attention",
      optionD: "Pooling Attention",
      correct: "B",
    },
    {
      id: "ai-q8",
      question: "Which technique is commonly used to prevent Overfitting in Neural Networks?",
      optionA: "Increasing Batch Size",
      optionB: "Dropout & L2 Regularization",
      optionC: "Removing Activation Functions",
      optionD: "Increasing Learning Rate",
      correct: "B",
    },
    {
      id: "ai-q9",
      question: "What is the goal of Reinforcement Learning?",
      optionA: "To cluster data into distinct categories",
      optionB: "To maximize cumulative reward through agent actions in an environment",
      optionC: "To compress high dimensional data",
      optionD: "To generate synthetic images",
      correct: "B",
    },
    {
      id: "ai-q10",
      question: "Which loss function is standard for Binary Classification problems?",
      optionA: "Mean Squared Error (MSE)",
      optionB: "Binary Cross-Entropy Log Loss",
      optionC: "Categorical Hinge Loss",
      optionD: "Kullback-Leibler Divergence",
      correct: "B",
    },
  ],
  General: [
    {
      id: "gen-q1",
      question: "What is the time complexity of searching an element in a balanced Binary Search Tree (BST)?",
      optionA: "O(1)",
      optionB: "O(n)",
      optionC: "O(log n)",
      optionD: "O(n log n)",
      correct: "C",
    },
    {
      id: "gen-q2",
      question: "Which Data Structure operates on a First-In, First-Out (FIFO) principle?",
      optionA: "Stack",
      optionB: "Queue",
      optionC: "Tree",
      optionD: "Heap",
      correct: "B",
    },
    {
      id: "gen-q3",
      question: "In HTTP REST APIs, which method is idempotent and used to replace an existing resource?",
      optionA: "POST",
      optionB: "PUT",
      optionC: "PATCH",
      optionD: "CONNECT",
      correct: "B",
    },
    {
      id: "gen-q4",
      question: "Which SQL clause is used to filter records after grouping with GROUP BY?",
      optionA: "WHERE",
      optionB: "HAVING",
      optionC: "ORDER BY",
      optionD: "DISTINCT",
      correct: "B",
    },
    {
      id: "gen-q5",
      question: "What does Git command 'git rebase' achieve?",
      optionA: "Creates a new git branch",
      optionB: "Reapplies commits on top of another base tip for linear history",
      optionC: "Deletes remote origin commits",
      optionD: "Merges two branches with a merge commit",
      correct: "B",
    },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatTime = (totalSeconds) => {
  if (totalSeconds <= 0) return "00:00";
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const formatDurationText = (sec) => {
  const mins = Math.floor(sec / 60);
  const remainderSec = sec % 60;
  if (mins === 0) return `${remainderSec}s`;
  return `${mins}m ${remainderSec}s`;
};

const MemberAvatar = ({ profile, size = 9 }) => {
  const name = profile?.username || profile?.full_name || "?";
  const initials = name.slice(0, 2).toUpperCase();
  return profile?.avatar_url ? (
    <img
      src={profile.avatar_url}
      alt={name}
      className={`w-${size} h-${size} rounded-xl object-cover ring-1 ring-white/10 shrink-0`}
    />
  ) : (
    <div
      className={`w-${size} h-${size} rounded-xl flex items-center justify-center text-xs font-black ring-1 ring-white/10 shrink-0`}
      style={{
        background: "linear-gradient(135deg,#FF00C822,#00F0FF22)",
        color: "#00F0FF",
      }}
    >
      {initials}
    </div>
  );
};

// SVG Donut Circle Gauge for Personal Score (Compact Size)
const ScoreDonutGauge = ({ percentage = 0 }) => {
  const strokeWidth = 9;
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const isPassed = percentage >= 70;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 110 110">
        <circle
          cx="55"
          cy="55"
          r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx="55"
          cy="55"
          r={radius}
          stroke={isPassed ? "#22c55e" : "#f59e0b"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-black text-white">{percentage}%</span>
      </div>
    </div>
  );
};

// ── Main Professional Room Detail Component ───────────────────────────────────
const ProfessionalRoomDetail = ({ roomId }) => {
  const navigate = useNavigate();
  const id = roomId;

  // Real Database States
  const [room, setRoom] = useState(null);
  const [hostProfile, setHostProfile] = useState(null);
  const [members, setMembers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [openLeaderboardModal, setOpenLeaderboardModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  // Active Main Tab
  const [activeMainTab, setActiveMainTab] = useState("quiz");

  // Quiz Execution & Timer States
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [reviewSet, setReviewSet] = useState(new Set());
  const [submitted, setSubmitted] = useState(false);

  // Countdown Timer
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  // User's Real Attempt Result State
  const [myResult, setMyResult] = useState(null);

  // Real Top Performers for THIS Room
  const [topPerformers, setTopPerformers] = useState([]);

  // Fetch All Room Data & Questions from Database
  const fetchAllData = async () => {
    setLoading(true);

    const { data: au } = await supabase.auth.getUser();
    const uid = au?.user?.id;
    setUserId(uid);

    if (uid) {
      const { data: uProf } = await supabase
        .from("profiles")
        .select("id, user_id, username, full_name, avatar_url, is_admin")
        .eq("id", uid)
        .single();
      if (uProf) setUserProfile(uProf);
    }

    // 1. Fetch Room Record
    const { data: roomData, error: roomErr } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .single();

    if (roomErr || !roomData) {
      setRoom(null);
      setLoading(false);
      return;
    }
    setRoom(roomData);

    // Fetch Host Profile
    if (roomData.created_by) {
      const { data: hProf } = await supabase
        .from("profiles")
        .select("username, full_name, avatar_url")
        .eq("id", roomData.created_by)
        .single();
      if (hProf) setHostProfile(hProf);
    }

    // 2. Fetch Members
    const { data: rawMembers } = await supabase
      .from("room_members")
      .select("*")
      .eq("room_id", id);

    let memberList = rawMembers || [];
    const memberUserIds = memberList.map((m) => m.user_id);
    const isCreatorHost = uid && roomData.created_by === uid;

    if (isCreatorHost && !memberUserIds.includes(uid)) {
      try {
        await supabase
          .from("room_members")
          .upsert(
            { room_id: id, user_id: uid },
            { onConflict: "room_id,user_id", ignoreDuplicates: true }
          );

        const { data: refetched } = await supabase
          .from("room_members")
          .select("*")
          .eq("room_id", id);
        if (refetched) memberList = refetched;
      } catch (err) {
        console.warn("Auto-adding host to room_members:", err);
      }
    }

    const currentMemberUserIds = memberList.map((m) => m.user_id);
    const userIsMember = Boolean(uid && (currentMemberUserIds.includes(uid) || isCreatorHost));
    setIsMember(userIsMember);

    // Fetch Profiles for members
    let profilesMap = {};
    if (currentMemberUserIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, user_id, username, full_name, avatar_url")
        .in("id", currentMemberUserIds);

      (profs || []).forEach((p) => {
        const uId = p.id || p.user_id;
        if (uId) profilesMap[uId] = p;
      });
    }

    const enrichedMembers = memberList.map((m) => ({
      ...m,
      profiles: profilesMap[m.user_id] || { username: "Participant" },
    }));
    setMembers(enrichedMembers);

    // 3. Fetch Questions from Database
    const { data: dbQuestions } = await supabase
      .from("room_questions")
      .select("*")
      .eq("room_id", id)
      .order("created_at", { ascending: true });

    let finalQuestions = dbQuestions || [];
    if (finalQuestions.length === 0) {
      const cat = roomData.category || "General";
      finalQuestions = DEFAULT_QUESTION_POOLS[cat] || DEFAULT_QUESTION_POOLS.General;
    }
    setQuestions(finalQuestions);

    // Initialize Timer
    const initialMins = parseInt(roomData.duration || "30", 10) || 30;
    setTimeLeft(initialMins * 60);

    // 4. Load Saved Personal Quiz Result for current user
    if (uid) {
      const savedResult = localStorage.getItem(`glitch_prof_result_${id}_${uid}`);
      if (savedResult) {
        try {
          const parsed = JSON.parse(savedResult);
          setMyResult(parsed);
          setSubmitted(true);
          setQuizStarted(true);
        } catch (e) {
          console.warn("Parsing saved result:", e);
        }
      }
    }

    // 5. Compute Top Performers
    computeTopPerformers(enrichedMembers, finalQuestions, uid);

    setLoading(false);
  };

  const computeTopPerformers = (memberList, qList, currentUid) => {
    const perfList = [];

    memberList.forEach((m) => {
      const uId = m.user_id;
      const key = `glitch_prof_result_${id}_${uId}`;
      const saved = localStorage.getItem(key);

      if (saved) {
        try {
          const res = JSON.parse(saved);
          perfList.push({
            user_id: uId,
            profile: m.profiles || { username: "Participant" },
            score: res.score,
            totalQuestions: res.totalQuestions,
            accuracy: res.accuracy,
            gbits: res.score * 35,
            timeTakenSec: res.timeTakenSec || 0,
            isMe: uId === currentUid,
          });
        } catch (e) {
          console.warn("Reading result:", e);
        }
      }
    });

    perfList.sort((a, b) => {
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      if (b.score !== a.score) return b.score - a.score;
      return a.timeTakenSec - b.timeTakenSec;
    });

    setTopPerformers(perfList);
  };

  useEffect(() => {
    fetchAllData();
  }, [id]);

  // Countdown Timer Effect
  useEffect(() => {
    if (quizStarted && !submitted && timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleQuizSubmit();
            return 0;
          }
          return prev - 1;
        });
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [quizStarted, timerActive, submitted, timeLeft]);

  const startAssessmentNow = () => {
    setQuizStarted(true);
    setTimerActive(true);
  };

  const handleJoin = async () => {
    if (!userId) return;
    setJoining(true);
    setIsMember(true);
    try {
      await supabase
        .from("room_members")
        .upsert(
          { room_id: id, user_id: userId },
          { onConflict: "room_id,user_id", ignoreDuplicates: true }
        );
    } catch (err) {
      console.error("Error joining professional room:", err);
    } finally {
      setJoining(false);
      await fetchAllData();
    }
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyRoomCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleOptionSelect = (qId, optionKey) => {
    if (submitted || !quizStarted) return;
    setAnswers((prev) => ({
      ...prev,
      [qId]: optionKey,
    }));
  };

  const toggleBookmarkReview = (qId) => {
    setReviewSet((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const handleQuizSubmit = () => {
    if (submitted) return;
    setTimerActive(false);
    clearInterval(timerRef.current);

    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let currentStreak = 0;
    let maxStreak = 0;

    questions.forEach((q) => {
      const selected = answers[q.id];
      if (!selected) {
        skippedCount++;
        currentStreak = 0;
      } else if (selected === q.correct) {
        correctCount++;
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        wrongCount++;
        currentStreak = 0;
      }
    });

    const totalQ = questions.length;
    const attemptedCount = correctCount + wrongCount;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const scorePercentage = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
    const isPassed = scorePercentage >= 70;

    const resultObj = {
      user_id: userId,
      room_id: id,
      score: correctCount,
      totalQuestions: totalQ,
      correctCount,
      wrongCount,
      skippedCount,
      attemptedCount,
      accuracy,
      scorePercentage,
      isPassed,
      timeTakenSec: elapsedSeconds,
      bestStreak: maxStreak,
      submittedAt: new Date().toISOString(),
    };

    setMyResult(resultObj);
    setSubmitted(true);

    if (userId) {
      localStorage.setItem(`glitch_prof_result_${id}_${userId}`, JSON.stringify(resultObj));
      computeTopPerformers(members, questions, userId);
    }
  };

  const handleRetryQuiz = () => {
    setAnswers({});
    setReviewSet(new Set());
    setSubmitted(false);
    setQuizStarted(false);
    setMyResult(null);
    setCurrentQIndex(0);
    setElapsedSeconds(0);
    const initialMins = parseInt(room?.duration || "30", 10) || 30;
    setTimeLeft(initialMins * 60);
    setTimerActive(false);
    if (userId) {
      localStorage.removeItem(`glitch_prof_result_${id}_${userId}`);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const currentQ = questions[currentQIndex] || questions[0];
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const isHostOrAdmin = Boolean(userId && (room?.created_by === userId || userProfile?.is_admin));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#06060d]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-2 border-t-transparent border-purple-500 rounded-full"
        />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#06060d] text-white">
        <div className="text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-400">Professional room not found in database.</p>
          <button
            onClick={() => navigate("/creator-rooms")}
            className="mt-4 text-purple-400 text-sm hover:underline cursor-pointer"
          >
            ← Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  const roomTitle = room.name;
  const roomDesc = room.description || "Test your knowledge and problem solving skills in this challenge room.";
  const displayHostName = hostProfile?.username || hostProfile?.full_name || room.host || "Google Developer Club";
  const displayHostAvatar = hostProfile?.avatar_url;
  const categoryName = room.category || "AI";
  const difficultyLabel = room.difficulty || "Medium";
  const durationText = room.duration || "30 Minutes";
  const totalQuestionsCount = questions.length;
  const accessTypeLabel = room.access === "private" ? "Private Room" : "Public Room";
  const memberCount = members.length;
  const currentUserName = userProfile?.full_name || userProfile?.username || "Parul";

  return (
    <div className="min-h-screen bg-[#06060d] text-white flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-28 pb-20 flex-1">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <span
              onClick={() => navigate("/creator-rooms")}
              className="hover:text-purple-400 cursor-pointer transition"
            >
              Professional Rooms
            </span>
            <ChevronRight size={12} className="text-gray-600" />
            <span className="text-gray-200">Room Details</span>
          </div>

          <div className="flex items-center gap-3">
            {isHostOrAdmin && (
              <button
                onClick={() => setOpenDeleteModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400"
              >
                <Trash2 size={14} /> Delete Room
              </button>
            )}

            <button
              onClick={copyInvite}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all bg-white/5 hover:bg-white/10 border border-white/10 text-white"
            >
              {copied ? (
                <>
                  <CheckCircle size={14} className="text-green-400" /> Copied Link!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy Invite Link
                </>
              )}
            </button>

            {!isMember ? (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="px-6 py-2 rounded-xl text-xs font-bold text-white cursor-pointer transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-60"
                style={{
                  background: "linear-gradient(90deg,#a855f7,#FF00C8)",
                }}
              >
                {joining ? "Joining..." : "Join Room"}
              </button>
            ) : (
              <span className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-purple-600/20 border border-purple-500/40 text-purple-300">
                <CheckCircle size={14} /> Joined
              </span>
            )}
          </div>
        </div>

        {/* ── 1. HERO BANNER HEADER ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden mb-8 bg-[#0d0d16] border border-purple-500/20 p-6 md:p-8 shadow-[0_0_40px_rgba(168,85,247,0.12)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/25 via-transparent to-[#FF00C8]/10 pointer-events-none" />
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background:
                "linear-gradient(90deg,transparent,#a855f7,#FF00C8,transparent)",
            }}
          />

          <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center opacity-30 pointer-events-none gap-4">
            <div className="relative flex items-center justify-center">
              <div className="w-40 h-40 rounded-full bg-purple-500/20 blur-3xl absolute" />
              <div className="text-6xl text-purple-400 filter drop-shadow-[0_0_20px_#a855f7]">
                🏆
              </div>
            </div>
            <div className="text-6xl font-black text-purple-400 tracking-tighter filter drop-shadow-[0_0_20px_#a855f7]">
              &lt;/&gt;
            </div>
          </div>

          <div className="relative max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <MemberAvatar
                profile={{
                  username: displayHostName,
                  avatar_url: displayHostAvatar,
                }}
                size={8}
              />
              <span className="text-xs font-bold text-gray-300 flex items-center gap-1">
                {displayHostName}{" "}
                <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-black">
                  ✓
                </span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {roomTitle}
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-600/30 border border-purple-500/40 text-purple-300">
                Professional Room
              </span>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed mb-5">
              {roomDesc}
            </p>

            <div className="flex flex-wrap gap-2 sm:gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <Sparkles size={13} /> {categoryName}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">
                <Zap size={13} /> {difficultyLabel}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
                <Clock size={13} /> {durationText}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300">
                <Target size={13} /> {totalQuestionsCount} Questions
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                {accessTypeLabel}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── 2. MAIN NAVIGATION TABS ─────────────────────────────────────────── */}
        <div className="flex gap-4 border-b border-white/10 pb-3 mb-8 overflow-x-auto">
          {[
            { id: "quiz", label: "Quiz" },
            { id: "participants", label: `Participants (${memberCount})` },
            { id: "leaderboard", label: "Leaderboard" },
            { id: "activity", label: "Room Activity" },
          ].map((tab) => {
            const isActive = activeMainTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "leaderboard") {
                    setOpenLeaderboardModal(true);
                  } else {
                    setActiveMainTab(tab.id);
                  }
                }}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-purple-600/30 border border-purple-500/40 text-purple-300 shadow-sm"
                    : "bg-transparent text-gray-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── 3. MAIN 12-COLUMN GRID LAYOUT (BALANCED SHIFT TO THE LEFT) ──────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── COLUMN 1: QUESTIONS SIDEBAR (COMPACT VERTICAL 2-COLUMN SQUARE GRID - 2/12) ─── */}
          <div className="lg:col-span-2 bg-[#0b0b14] border border-white/6 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider text-gray-400">
              Questions
            </h3>

            {/* Compact 2-column Vertical Square Grid Tiles */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {questions.map((q, i) => {
                const isCurrent = i === currentQIndex;
                const isAnswered = Boolean(answers[q.id]);
                const isBookmarked = reviewSet.has(q.id);

                return (
                  <button
                    key={q.id || i}
                    onClick={() => {
                      if (!quizStarted) startAssessmentNow();
                      setCurrentQIndex(i);
                    }}
                    className={`relative aspect-square rounded-xl text-xs font-black flex flex-col items-center justify-center transition border cursor-pointer ${
                      isCurrent
                        ? "bg-purple-600/40 border-purple-500 text-white ring-2 ring-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                        : isAnswered
                          ? "bg-green-500/15 border-green-500/40 text-green-300"
                          : "bg-[#12121f] border-white/5 text-gray-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <span>{i + 1}</span>
                    {isAnswered && (
                      <span className="text-[9px] text-green-400 leading-none">✓</span>
                    )}
                    {isBookmarked && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Legend */}
            <div className="pt-3 border-t border-white/6 space-y-1.5 text-[10px] text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span>Done</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full border border-gray-500" />
                <span>Unread</span>
              </div>
            </div>
          </div>

          {/* ── COLUMN 2: CENTER MAIN CONTENT (QUIZ PLAYER & SCORE CARD - 6/12) ───── */}
          <div className="lg:col-span-6 space-y-6">
            {/* Top Cards: Progress Bar + Time Left */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 bg-[#0b0b14] border border-white/6 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-300">
                    Question Progress
                  </span>
                  <span className="text-xs font-bold text-purple-300 font-mono">
                    {answeredCount} / {totalQuestionsCount} answered
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full rounded-full"
                      style={{
                        background: "linear-gradient(90deg,#a855f7,#FF00C8)",
                      }}
                    />
                  </div>
                  <span className="text-xs font-black text-white">{progressPercent}%</span>
                </div>
              </div>

              <div className="bg-[#0b0b14] border border-purple-500/20 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Time Left
                </span>
                <div className="flex items-center gap-2 text-purple-300 font-black text-xl font-mono mt-1">
                  <Clock size={18} className="text-purple-400" />
                  <span className={timerActive ? "animate-pulse" : ""}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
            </div>

            {/* PRE-ASSESSMENT START OVERLAY CARD */}
            {!quizStarted && !submitted && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0b0b14] border border-purple-500/30 rounded-3xl p-8 text-center relative overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.15)]"
              >
                <div className="w-16 h-16 rounded-3xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto mb-4">
                  <Play size={28} className="ml-1" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">
                  Ready to Start Assessment?
                </h3>
                <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed mb-6">
                  You have <span className="font-bold text-white">{durationText}</span> to answer{" "}
                  <span className="font-bold text-white">{totalQuestionsCount} Questions</span>.
                  Clicking the button below will start your live countdown timer immediately.
                </p>

                <div className="flex justify-center gap-4 text-xs font-bold text-gray-400 mb-8">
                  <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                    <Clock size={14} className="text-purple-400" /> {durationText}
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                    <Target size={14} className="text-cyan-400" /> {totalQuestionsCount} Questions
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                    <Award size={14} className="text-amber-400" /> 70% Pass Score
                  </span>
                </div>

                <button
                  onClick={startAssessmentNow}
                  className="px-8 py-3.5 rounded-2xl font-black text-sm text-white cursor-pointer transition shadow-[0_0_25px_rgba(168,85,247,0.4)] flex items-center gap-2.5 mx-auto"
                  style={{
                    background: "linear-gradient(90deg,#a855f7,#FF00C8)",
                  }}
                >
                  <Play size={16} className="fill-white" /> Start Assessment Now
                </button>
              </motion.div>
            )}

            {/* ACTIVE MCQ QUESTION BOX */}
            {quizStarted && currentQ && (
              <div className="bg-[#0b0b14] border border-white/6 rounded-3xl p-6 shadow-lg relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300">
                    Question {currentQIndex + 1} of {totalQuestionsCount}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    Single Choice
                  </span>
                </div>

                <p className="text-white text-base font-bold leading-relaxed mb-6">
                  {currentQ.question}
                </p>

                <div className="space-y-3 mb-6">
                  {[
                    { key: "A", text: currentQ.optionA },
                    { key: "B", text: currentQ.optionB },
                    { key: "C", text: currentQ.optionC },
                    { key: "D", text: currentQ.optionD },
                  ]
                    .filter((o) => o.text)
                    .map((opt) => {
                      const isSelected = answers[currentQ.id] === opt.key;
                      return (
                        <button
                          key={opt.key}
                          disabled={submitted}
                          onClick={() => handleOptionSelect(currentQ.id, opt.key)}
                          className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-left text-xs font-semibold border transition cursor-pointer disabled:cursor-default ${
                            isSelected
                              ? "bg-purple-600/20 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                              : "bg-[#12121f] border-white/5 text-gray-300 hover:border-white/15"
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <span
                              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                                isSelected
                                  ? "bg-purple-500 text-white"
                                  : "bg-white/5 text-gray-400"
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition shrink-0 ${
                              isSelected
                                ? "border-purple-400 bg-purple-500"
                                : "border-white/20"
                            }`}
                          >
                            {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/6">
                  <button
                    onClick={() => toggleBookmarkReview(currentQ.id)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition cursor-pointer ${
                      reviewSet.has(currentQ.id)
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                        : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    <Bookmark size={14} />
                    {reviewSet.has(currentQ.id) ? "Marked for Review" : "Mark for Review"}
                  </button>

                  <div className="flex items-center gap-2">
                    {currentQIndex > 0 && (
                      <button
                        onClick={() => setCurrentQIndex((i) => i - 1)}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 transition cursor-pointer"
                      >
                        Previous
                      </button>
                    )}
                    {currentQIndex < totalQuestionsCount - 1 ? (
                      <button
                        onClick={() => {
                          setCurrentQIndex((i) => i + 1);
                        }}
                        className="px-5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer transition shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                        style={{
                          background: "linear-gradient(90deg,#a855f7,#FF00C8)",
                        }}
                      >
                        Next Question →
                      </button>
                    ) : (
                      !submitted && (
                        <button
                          onClick={handleQuizSubmit}
                          className="px-6 py-2 rounded-xl text-xs font-bold text-white cursor-pointer transition shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                          style={{
                            background: "linear-gradient(90deg,#22c55e,#00F0FF)",
                          }}
                        >
                          Submit Quiz ✦
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PERSONAL SCORE CARD (CLEAN COMPACT STACKED LAYOUT) */}
            {submitted && myResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0b0b14] border border-purple-500/30 rounded-2xl p-5 shadow-[0_0_30px_rgba(168,85,247,0.15)] relative overflow-hidden"
              >
                {/* 1. TOP HERO ROW: Compact Donut Gauge + Score & Greeting */}
                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 pb-4 border-b border-white/10 text-center sm:text-left">
                  <ScoreDonutGauge percentage={myResult.scorePercentage} />

                  <div className="min-w-0">
                    <h3 className="text-base font-black text-white flex items-center justify-center sm:justify-start gap-1.5">
                      Great Job, {currentUserName}! 🎉
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">You scored</p>
                    <div className="flex items-baseline justify-center sm:justify-start gap-2 my-1">
                      <span className="text-2xl font-black text-white font-mono tracking-tight">
                        {myResult.score} / {myResult.totalQuestions}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          myResult.isPassed
                            ? "bg-green-500/15 border-green-500/30 text-green-400"
                            : "bg-amber-500/15 border-amber-500/30 text-amber-400"
                        }`}
                      >
                        {myResult.isPassed ? "Passed" : "Needs Practice"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. PERFORMANCE SUMMARY */}
                <div className="py-4 border-b border-white/10">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                    Performance Summary
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="bg-[#121220] border border-white/5 rounded-xl p-2.5 flex items-center justify-between">
                      <span className="text-gray-400 text-[11px] flex items-center gap-1.5">
                        <Target size={12} className="text-green-400" /> Accuracy
                      </span>
                      <span className="font-bold text-white font-mono text-xs">{myResult.accuracy}%</span>
                    </div>

                    <div className="bg-[#121220] border border-white/5 rounded-xl p-2.5 flex items-center justify-between">
                      <span className="text-gray-400 text-[11px] flex items-center gap-1.5">
                        <Clock size={12} className="text-purple-400" /> Time Taken
                      </span>
                      <span className="font-bold text-white font-mono text-xs">
                        {formatDurationText(myResult.timeTakenSec)}
                      </span>
                    </div>

                    <div className="bg-[#121220] border border-white/5 rounded-xl p-2.5 flex items-center justify-between">
                      <span className="text-gray-400 text-[11px] flex items-center gap-1.5">
                        <CheckSquare size={12} className="text-cyan-400" /> Attempted
                      </span>
                      <span className="font-bold text-white font-mono text-xs">
                        {myResult.attemptedCount} / {myResult.totalQuestions}
                      </span>
                    </div>

                    <div className="bg-[#121220] border border-white/5 rounded-xl p-2.5 flex items-center justify-between">
                      <span className="text-gray-400 text-[11px] flex items-center gap-1.5">
                        <Flame size={12} className="text-amber-400" /> Best Streak
                      </span>
                      <span className="font-bold text-white font-mono text-xs">{myResult.bestStreak}</span>
                    </div>
                  </div>
                </div>

                {/* 3. BOTTOM STATS & RETRY BUTTON ROW */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[11px] font-semibold">
                    <span className="flex items-center gap-1 text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/20">
                      <CheckCircle size={12} /> {myResult.correctCount} Correct
                    </span>
                    <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
                      <X size={12} /> {myResult.wrongCount} Wrong
                    </span>
                    <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      <HelpCircle size={12} /> {myResult.skippedCount} Skipped
                    </span>
                  </div>

                  <button
                    onClick={handleRetryQuiz}
                    className="px-3.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <RefreshCw size={11} /> Retry Quiz
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── COLUMN 3: RIGHT SIDEBAR (SPACIOUS 4/12 WIDTH) ───────────────── */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0b0b14] border border-white/6 rounded-3xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">Room Info</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Host</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-semibold">{displayHostName}</span>
                    <MemberAvatar
                      profile={{
                        username: displayHostName,
                        avatar_url: displayHostAvatar,
                      }}
                      size={5}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Category</span>
                  <span className="text-white font-semibold">{categoryName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Difficulty</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-semibold">
                    {difficultyLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-white font-semibold">{durationText}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Questions</span>
                  <span className="text-white font-semibold">{totalQuestionsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Access</span>
                  <span className="text-green-400 font-semibold">{accessTypeLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Participants</span>
                  <span className="text-white font-semibold">{memberCount} / 250</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/6">
                  <span className="text-gray-400">Room Code</span>
                  <button
                    onClick={copyRoomCode}
                    className="flex items-center gap-1.5 font-mono text-purple-300 font-bold hover:underline cursor-pointer"
                  >
                    {room.code || "GLITCH-ROOM"}
                    {copiedCode ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#0b0b14] border border-purple-500/20 rounded-3xl p-5">
              <h3 className="text-sm font-bold text-white mb-1">Invite Friends</h3>
              <p className="text-xs text-gray-400 mb-3">
                Invite your friends to join this challenge!
              </p>
              <div className="flex items-center justify-between bg-[#12121f] border border-white/10 rounded-xl px-3 py-2 mb-3">
                <span className="text-xs text-gray-400 font-mono truncate mr-2">
                  {window.location.origin}/room/{id}
                </span>
                <button
                  onClick={copyInvite}
                  className="w-7 h-7 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 flex items-center justify-center text-purple-300 transition cursor-pointer shrink-0"
                >
                  <Copy size={13} />
                </button>
              </div>
              <button
                onClick={copyInvite}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-white cursor-pointer transition flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300"
              >
                <Share2 size={13} />
                {copied ? "Link Copied!" : "Share Invite Link"}
              </button>
            </div>

            <div className="bg-[#0b0b14] border border-white/6 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Top Performers</h3>
                <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                  This Challenge ▾
                </span>
              </div>

              {topPerformers.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs border border-dashed border-white/10 rounded-2xl">
                  No attempts logged yet for this room.
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  {topPerformers.slice(0, 5).map((p, idx) => {
                    const rank = idx + 1;
                    const pName = p.profile?.username || p.profile?.full_name || "Participant";

                    return (
                      <div
                        key={p.user_id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                          p.isMe
                            ? "bg-purple-600/20 border-purple-500/40"
                            : "bg-[#12121f] border-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Crown
                            size={14}
                            className={
                              rank === 1
                                ? "text-yellow-400 shrink-0"
                                : rank === 2
                                  ? "text-gray-300 shrink-0"
                                  : rank === 3
                                    ? "text-amber-600 shrink-0"
                                    : "text-gray-600 shrink-0"
                            }
                          />
                          <MemberAvatar profile={p.profile} size={7} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                              {pName}
                              {p.isMe && (
                                <span className="text-[9px] font-black text-purple-300">
                                  (You)
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {p.accuracy}% accuracy
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-amber-400 block">
                            {p.score} / {p.totalQuestions}
                          </span>
                          <span className="text-[10px] text-purple-300 font-semibold block">
                            {p.gbits} gBits
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => setOpenLeaderboardModal(true)}
                className="w-full py-2.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-xs font-bold text-purple-300 transition cursor-pointer text-center block"
              >
                View Full Leaderboard 🏆
              </button>
            </div>
          </div>
        </div>
      </main>

      <RoomLeaderboardModal
        isOpen={openLeaderboardModal}
        onClose={() => setOpenLeaderboardModal(false)}
        roomName={roomTitle}
        members={members}
        checkins={[]}
        activity={[]}
        currentUserId={userId}
      />

      <DeleteRoomModal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        room={room}
        onDeleted={() => {
          setOpenDeleteModal(false);
          navigate("/creator-rooms");
        }}
      />

      <Footer />
    </div>
  );
};

export default ProfessionalRoomDetail;
