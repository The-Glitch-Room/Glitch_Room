import React, { useState, useEffect, useMemo } from "react";
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
  ChevronDown,
  ChevronUp,
  XCircle,
  ExternalLink,
  Code2,
} from "lucide-react";
import { supabase } from "../../supabaseClient";

// Shows what a candidate actually submitted for one answer, shaped by the
// question's type — a code block for coding-family questions, a link for
// file/project/video submissions, or the raw text/selection compared
// against the answer key for everything else.
const AnswerContent = ({ answer, question }) => {
  const type = question?.question_type;

  if (!answer) return null;

  if (["coding", "sql", "debugging", "code_analysis"].includes(type)) {
    return (
      <div className="space-y-1.5">
        <pre className="bg-[#020204] border border-white/10 rounded-lg p-3 text-[11px] text-gray-300 overflow-x-auto whitespace-pre-wrap">
          {answer.code_submission || "(no code submitted)"}
        </pre>
        {question?.test_cases?.length > 0 && (
          <details className="text-[10px] text-gray-500">
            <summary className="cursor-pointer hover:text-gray-300">
              Reference test cases ({question.test_cases.length})
            </summary>
            <div className="mt-1 space-y-1">
              {question.test_cases.map((tc, i) => (
                <div key={i} className="font-mono">
                  in: {tc.input} → out: {tc.expected_output}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    );
  }

  if (["file_upload", "project", "video"].includes(type)) {
    return answer.github_url ? (
      <a
        href={answer.github_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-cyan-300 hover:text-cyan-200 underline break-all"
      >
        <ExternalLink size={11} className="shrink-0" /> {answer.github_url}
      </a>
    ) : (
      <p className="text-gray-500 italic">No link submitted.</p>
    );
  }

  if (type === "msq") {
    let selected = [];
    try {
      selected = JSON.parse(
        Array.isArray(answer.selected_options)
          ? JSON.stringify(answer.selected_options)
          : answer.selected_options || "[]",
      );
    } catch {
      selected = [];
    }
    return (
      <div className="space-y-1">
        <p className="text-gray-300">
          <span className="text-gray-500">Selected: </span>
          {selected.length > 0 ? selected.join(", ") : "(none)"}
        </p>
        <p className="text-emerald-400/80">
          <span className="text-gray-500">Correct: </span>
          {(() => {
            try {
              return JSON.parse(question?.correct_answer || "[]").join(", ");
            } catch {
              return question?.correct_answer || "—";
            }
          })()}
        </p>
      </div>
    );
  }

  // mcq / true_false / short_answer / output_pred
  return (
    <div className="space-y-1">
      <p className="text-gray-300">
        <span className="text-gray-500">Answered: </span>
        {answer.answer_text || "(no answer)"}
      </p>
      {question?.correct_answer && (
        <p className="text-emerald-400/80">
          <span className="text-gray-500">Correct: </span>
          {question.correct_answer}
        </p>
      )}
    </div>
  );
};

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

  // ── Grading tab state ──────────────────────────────────────────────────
  // Question content (including correct_answer) is loaded once per room via
  // get_pro_room_questions_safe — the same RPC candidates use, except the
  // host branch of that function's redaction logic returns the real
  // correct_answer instead of null. Answers are fetched lazily per
  // submission, only when the host actually expands it.
  const [roomQuestionsById, setRoomQuestionsById] = useState({});
  const [expandedSubmissionId, setExpandedSubmissionId] = useState(null);
  const [submissionAnswers, setSubmissionAnswers] = useState({}); // { [submissionId]: answer[] }
  const [loadingSubmissionId, setLoadingSubmissionId] = useState(null);
  const [manualScoreDrafts, setManualScoreDrafts] = useState({}); // { [answerId]: string }
  const [savingAnswerId, setSavingAnswerId] = useState(null);
  const [finalizingSubmissionId, setFinalizingSubmissionId] = useState(null);

  // ── Filtering / sorting / bulk actions ──────────────────────────────────
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [minScoreFilter, setMinScoreFilter] = useState("");
  const [maxScoreFilter, setMaxScoreFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState(new Set());
  const [checkingReadiness, setCheckingReadiness] = useState(false);
  const [bulkFinalizing, setBulkFinalizing] = useState(false);

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

      // 6. Fetch question content for the grading tab — via the same
      // redaction function candidates use (get_pro_room_questions_safe);
      // the host branch of its logic returns the real correct_answer
      // instead of null, since correct_answer is revoked from the base
      // table's SELECT for everyone (see fix_3_hide_correct_answers.sql).
      const { data: secRows } = await supabase
        .from("pro_room_sections")
        .select("id")
        .eq("room_id", id)
        .eq("is_deleted", false);

      if (secRows && secRows.length > 0) {
        const { data: qRows, error: qErr } = await supabase.rpc(
          "get_pro_room_questions_safe",
          { p_section_ids: secRows.map((s) => s.id) },
        );
        if (qErr) {
          console.error("Could not load questions for grading:", qErr);
        } else {
          const byId = {};
          (qRows || []).forEach((q) => {
            byId[q.id] = q;
          });
          setRoomQuestionsById(byId);
        }
      }
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

  const handleUpdateRegistrationStatus = async (regId, newStatus) => {
    if (!isHost) return;
    try {
      const { error } = await supabase
        .from("pro_room_registrations")
        .update({ status: newStatus })
        .eq("id", regId);

      if (error) {
        console.error("Failed to update registration status:", error);
        showToast("⚠️ Couldn't update the application — please try again.");
        return;
      }

      showToast(
        newStatus === "approved"
          ? "✅ Application approved."
          : "Application rejected.",
      );
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      showToast("⚠️ Couldn't update the application — please try again.");
    }
  };

  const toggleExpandSubmission = async (submissionId) => {
    if (expandedSubmissionId === submissionId) {
      setExpandedSubmissionId(null);
      return;
    }
    setExpandedSubmissionId(submissionId);

    if (submissionAnswers[submissionId]) return; // already loaded

    setLoadingSubmissionId(submissionId);
    try {
      const { data, error } = await supabase
        .from("pro_room_answers")
        .select("*")
        .eq("submission_id", submissionId);

      if (error) {
        console.error("Failed to load answers:", error);
        showToast("⚠️ Couldn't load this submission's answers.");
        return;
      }

      setSubmissionAnswers((prev) => ({ ...prev, [submissionId]: data || [] }));

      // Pre-fill the score drafts with whatever's already saved, so the
      // input shows the real current value instead of blank.
      const drafts = {};
      (data || []).forEach((a) => {
        if (!a.auto_graded) {
          drafts[a.id] = a.points_earned != null ? String(a.points_earned) : "";
        }
      });
      setManualScoreDrafts((prev) => ({ ...prev, ...drafts }));
    } catch (err) {
      console.error(err);
      showToast("⚠️ Couldn't load this submission's answers.");
    } finally {
      setLoadingSubmissionId(null);
    }
  };

  const handleSaveManualScore = async (submissionId, answerId, maxPoints) => {
    const raw = manualScoreDrafts[answerId];
    const points = Number(raw);

    if (raw === "" || Number.isNaN(points) || points < 0) {
      showToast("⚠️ Enter a valid, non-negative score.");
      return;
    }
    if (maxPoints != null && points > maxPoints) {
      showToast(`⚠️ Score can't exceed this question's ${maxPoints} points.`);
      return;
    }

    setSavingAnswerId(answerId);
    try {
      const { error } = await supabase.rpc("set_manual_answer_score", {
        p_answer_id: answerId,
        p_points_earned: points,
      });

      if (error) {
        console.error("Failed to save score:", error);
        showToast("⚠️ Couldn't save that score — please try again.");
        return;
      }

      setSubmissionAnswers((prev) => ({
        ...prev,
        [submissionId]: (prev[submissionId] || []).map((a) =>
          a.id === answerId
            ? { ...a, points_earned: points, is_correct: points > 0 }
            : a,
        ),
      }));
      showToast("✓ Score saved.");
    } catch (err) {
      console.error(err);
      showToast("⚠️ Couldn't save that score — please try again.");
    } finally {
      setSavingAnswerId(null);
    }
  };

  const handleFinalizeGrade = async (submissionId) => {
    setFinalizingSubmissionId(submissionId);
    try {
      const { error } = await supabase.rpc("finalize_submission_grade", {
        p_submission_id: submissionId,
      });

      if (error) {
        console.error("Failed to finalize grade:", error);
        showToast("⚠️ Couldn't finalize this grade — please try again.");
        return;
      }

      showToast("🏁 Grade finalized.");
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      showToast("⚠️ Couldn't finalize this grade — please try again.");
    } finally {
      setFinalizingSubmissionId(null);
    }
  };

  // Fetches every answer for the room in ONE query and computes, per
  // submission, whether every manually-graded question already has a score
  // — this is what makes "Select All Ready" possible without having to
  // expand each submission one by one first. Also used as a safety check
  // right before a bulk finalize actually runs (see handleBulkFinalize),
  // since finalize_submission_grade sums whatever points_earned exists —
  // a null just silently contributes 0, so finalizing something with an
  // ungraded question would lock in a wrong score permanently.
  const computeReadySubmissionIds = async () => {
    const { data, error } = await supabase
      .from("pro_room_answers")
      .select("submission_id, auto_graded, points_earned")
      .eq("room_id", id);

    if (error) {
      console.error("Failed to check grading readiness:", error);
      showToast("⚠️ Couldn't check which submissions are ready.");
      return new Set();
    }

    const pendingBySubmission = {};
    (data || []).forEach((a) => {
      if (!a.auto_graded && a.points_earned == null) {
        pendingBySubmission[a.submission_id] =
          (pendingBySubmission[a.submission_id] || 0) + 1;
      }
    });

    const ready = new Set();
    submissions.forEach((sub) => {
      if (sub.status === "pending_review" && !pendingBySubmission[sub.id]) {
        ready.add(sub.id);
      }
    });
    return ready;
  };

  const handleSelectAllReady = async () => {
    setCheckingReadiness(true);
    try {
      const ready = await computeReadySubmissionIds();
      if (ready.size === 0) {
        showToast("No submissions are fully scored and ready yet.");
      } else {
        setSelectedSubmissionIds(ready);
        showToast(`Selected ${ready.size} submission(s) ready to finalize.`);
      }
    } finally {
      setCheckingReadiness(false);
    }
  };

  const toggleSelectSubmission = (subId) => {
    setSelectedSubmissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(subId)) next.delete(subId);
      else next.add(subId);
      return next;
    });
  };

  const handleBulkFinalize = async () => {
    if (selectedSubmissionIds.size === 0) return;
    setBulkFinalizing(true);
    try {
      // Re-verify readiness right now rather than trusting checkbox state —
      // covers a host manually checking a box for something that isn't
      // actually fully scored, and any grading that happened elsewhere
      // since the checkboxes were selected.
      const actuallyReady = await computeReadySubmissionIds();
      const toFinalize = [...selectedSubmissionIds].filter((id) =>
        actuallyReady.has(id),
      );
      const skipped = selectedSubmissionIds.size - toFinalize.length;

      if (toFinalize.length === 0) {
        showToast("None of the selected submissions are ready to finalize.");
        return;
      }

      const results = await Promise.allSettled(
        toFinalize.map((subId) =>
          supabase.rpc("finalize_submission_grade", {
            p_submission_id: subId,
          }),
        ),
      );

      const failed = results.filter(
        (r) => r.status === "rejected" || r.value?.error,
      ).length;
      const succeeded = toFinalize.length - failed;

      showToast(
        `🏁 Finalized ${succeeded} submission(s).` +
          (failed > 0 ? ` ${failed} failed.` : "") +
          (skipped > 0 ? ` ${skipped} skipped (not fully scored).` : ""),
      );

      setSelectedSubmissionIds(new Set());
      fetchDashboardData();
    } catch (err) {
      console.error("Bulk finalize failed:", err);
      showToast("⚠️ Bulk finalize failed — please try again.");
    } finally {
      setBulkFinalizing(false);
    }
  };

  const handleExportCsv = (rows) => {
    const header = ["Candidate", "Status", "Total Score", "Submitted At"];
    const lines = rows.map((sub) =>
      [
        (sub.profiles?.full_name || sub.profiles?.username || "Candidate").replace(
          /,/g,
          " ",
        ),
        sub.status || "in_progress",
        sub.total_score ?? 0,
        sub.submitted_at ? new Date(sub.submitted_at).toISOString() : "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `submissions-${id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  // Must run on every render (before any early return) since it's a hook —
  // filters/sorts `submissions` for display without mutating the original
  // list (bulk actions and the raw dashboard stats still need the
  // unfiltered data).
  const visibleSubmissions = useMemo(() => {
    let list = [...submissions];

    if (statusFilter !== "all") {
      list = list.filter((s) => (s.status || "in_progress") === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((s) => {
        const name = (
          s.profiles?.full_name ||
          s.profiles?.username ||
          ""
        ).toLowerCase();
        return name.includes(q);
      });
    }

    if (minScoreFilter !== "") {
      const min = Number(minScoreFilter);
      if (!Number.isNaN(min)) list = list.filter((s) => (s.total_score ?? 0) >= min);
    }
    if (maxScoreFilter !== "") {
      const max = Number(maxScoreFilter);
      if (!Number.isNaN(max)) list = list.filter((s) => (s.total_score ?? 0) <= max);
    }

    list.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0)
        );
      }
      if (sortBy === "oldest") {
        return (
          new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0)
        );
      }
      if (sortBy === "score_desc") return (b.total_score ?? 0) - (a.total_score ?? 0);
      if (sortBy === "score_asc") return (a.total_score ?? 0) - (b.total_score ?? 0);
      if (sortBy === "name_asc") {
        const nameA = a.profiles?.full_name || a.profiles?.username || "";
        const nameB = b.profiles?.full_name || b.profiles?.username || "";
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

    return list;
  }, [submissions, statusFilter, searchQuery, minScoreFilter, maxScoreFilter, sortBy]);

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
                    <div className="flex items-center gap-3">
                      {r.status === "pending" ? (
                        <>
                          <button
                            onClick={() =>
                              handleUpdateRegistrationStatus(r.id, "approved")
                            }
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold hover:bg-emerald-500/25 cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateRegistrationStatus(r.id, "rejected")
                            }
                            className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-[10px] font-bold hover:bg-red-500/25 cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span
                          className={`text-xs font-mono font-bold uppercase ${
                            r.status === "rejected"
                              ? "text-red-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {r.status || "Registered"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Grading (Submissions) */}
        {activeTab === "grading" && (
          <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">
              Submissions & Grading
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Objective questions (MCQ, True/False, Short Answer, MSQ) are
              graded automatically. Coding and other open-ended questions
              need a score entered here before you can finalize a
              submission's grade.
            </p>

            {/* Filter / Sort / Bulk toolbar */}
            <div className="flex flex-col gap-3 mb-4 p-3.5 rounded-xl bg-[#07070e] border border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "all", label: "All" },
                  { id: "pending_review", label: "Needs Grading" },
                  { id: "graded", label: "Graded" },
                  { id: "submitted", label: "Submitted" },
                  { id: "in_progress", label: "In Progress" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer whitespace-nowrap ${
                      statusFilter === f.id
                        ? "bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF]"
                        : "bg-white/5 border border-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}

                <div className="ml-auto flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-[#12121e] border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-300 outline-none cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="score_desc">Highest Score</option>
                    <option value="score_asc">Lowest Score</option>
                    <option value="name_asc">Name A–Z</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleExportCsv(visibleSubmissions)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-gray-300 hover:text-white cursor-pointer"
                  >
                    <Download size={11} /> Export CSV
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[160px]">
                  <Search
                    size={12}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    type="text"
                    placeholder="Search candidate name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#12121e] border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-[10px] text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                  />
                </div>
                <input
                  type="number"
                  placeholder="Min score"
                  value={minScoreFilter}
                  onChange={(e) => setMinScoreFilter(e.target.value)}
                  className="w-24 bg-[#12121e] border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                />
                <input
                  type="number"
                  placeholder="Max score"
                  value={maxScoreFilter}
                  onChange={(e) => setMaxScoreFilter(e.target.value)}
                  className="w-24 bg-[#12121e] border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                />
              </div>

              {/* Bulk actions */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleSelectAllReady}
                  disabled={checkingReadiness}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-gray-300 hover:text-white cursor-pointer disabled:opacity-50"
                >
                  {checkingReadiness ? "Checking..." : "Select All Ready"}
                </button>
                {selectedSubmissionIds.size > 0 && (
                  <>
                    <span className="text-[10px] text-gray-400">
                      {selectedSubmissionIds.size} selected
                    </span>
                    <button
                      type="button"
                      onClick={handleBulkFinalize}
                      disabled={bulkFinalizing}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold hover:bg-emerald-500/25 cursor-pointer disabled:opacity-50"
                    >
                      {bulkFinalizing
                        ? "Finalizing..."
                        : `Finalize ${selectedSubmissionIds.size} Selected`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSubmissionIds(new Set())}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-gray-500 hover:text-gray-300 cursor-pointer"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>

            {visibleSubmissions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xs">
                {submissions.length === 0
                  ? "No submissions yet."
                  : "No submissions match the current filters."}
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {visibleSubmissions.map((sub) => {
                  const isExpanded = expandedSubmissionId === sub.id;
                  const answers = submissionAnswers[sub.id] || [];
                  const manualAnswers = answers.filter((a) => !a.auto_graded);
                  const pendingManualCount = manualAnswers.filter(
                    (a) => a.points_earned == null,
                  ).length;
                  const isSelected = selectedSubmissionIds.has(sub.id);

                  return (
                    <div key={sub.id} className="py-3">
                      <div className="w-full flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectSubmission(sub.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-3.5 h-3.5 rounded border-white/20 bg-[#12121e] cursor-pointer shrink-0"
                        />
                        <button
                          type="button"
                          onClick={() => toggleExpandSubmission(sub.id)}
                          className="flex-1 flex items-center justify-between gap-3 text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronUp size={14} className="text-gray-500 shrink-0" />
                            ) : (
                              <ChevronDown size={14} className="text-gray-500 shrink-0" />
                            )}
                            <div>
                              <span className="text-white font-bold text-xs block">
                                {sub.profiles?.full_name ||
                                  sub.profiles?.username ||
                                "Candidate"}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {sub.submitted_at
                                ? new Date(sub.submitted_at).toLocaleString()
                                : "Not submitted"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full border ${
                              sub.status === "graded"
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                : sub.status === "pending_review"
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                  : "bg-white/5 border-white/10 text-gray-400"
                            }`}
                          >
                            {sub.status === "pending_review"
                              ? "Needs Grading"
                              : sub.status || "in progress"}
                          </span>
                          <span className="text-xs font-mono font-bold text-[#00F0FF] w-14 text-right">
                            {sub.total_score ?? 0} pts
                          </span>
                        </div>
                      </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 ml-6 space-y-3">
                          {loadingSubmissionId === sub.id ? (
                            <div className="text-xs text-gray-500 py-4">
                              Loading answers...
                            </div>
                          ) : answers.length === 0 ? (
                            <div className="text-xs text-gray-500 py-4">
                              No answers recorded for this submission.
                            </div>
                          ) : (
                            <>
                              {answers.map((a) => {
                                const q = roomQuestionsById[a.question_id];
                                return (
                                  <div
                                    key={a.id}
                                    className="bg-[#07070e] border border-white/10 rounded-xl p-4 text-xs space-y-2"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <p className="text-gray-200 font-semibold flex-1">
                                        {q?.question_text || "(question unavailable)"}
                                      </p>
                                      <span className="text-[10px] font-mono text-gray-500 shrink-0">
                                        {q?.question_type}
                                      </span>
                                    </div>

                                    <AnswerContent answer={a} question={q} />

                                    {a.auto_graded ? (
                                      <div className="flex items-center gap-2 pt-1">
                                        {a.is_correct ? (
                                          <CheckCircle
                                            size={14}
                                            className="text-emerald-400"
                                          />
                                        ) : (
                                          <XCircle
                                            size={14}
                                            className="text-red-400"
                                          />
                                        )}
                                        <span
                                          className={
                                            a.is_correct
                                              ? "text-emerald-400 font-bold"
                                              : "text-red-400 font-bold"
                                          }
                                        >
                                          {a.points_earned ?? 0} / {q?.points ?? "?"} pts
                                          (auto-graded)
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 pt-1">
                                        <input
                                          type="number"
                                          min="0"
                                          max={q?.points}
                                          placeholder={`out of ${q?.points ?? "?"}`}
                                          value={manualScoreDrafts[a.id] ?? ""}
                                          onChange={(e) =>
                                            setManualScoreDrafts((prev) => ({
                                              ...prev,
                                              [a.id]: e.target.value,
                                            }))
                                          }
                                          className="w-28 bg-[#12121e] border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-[#00F0FF]"
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleSaveManualScore(
                                              sub.id,
                                              a.id,
                                              q?.points,
                                            )
                                          }
                                          disabled={savingAnswerId === a.id}
                                          className="px-3 py-1.5 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-[10px] font-bold hover:bg-[#00F0FF]/25 cursor-pointer disabled:opacity-50"
                                        >
                                          {savingAnswerId === a.id
                                            ? "Saving..."
                                            : a.points_earned != null
                                              ? "Update Score"
                                              : "Save Score"}
                                        </button>
                                        {a.points_earned != null && (
                                          <span className="text-[10px] text-gray-500">
                                            currently {a.points_earned} pts
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              <div className="flex items-center justify-between pt-2">
                                {pendingManualCount > 0 ? (
                                  <p className="text-[10px] text-amber-400">
                                    {pendingManualCount} question
                                    {pendingManualCount === 1 ? "" : "s"} still
                                    need{pendingManualCount === 1 ? "s" : ""} a
                                    score before finalizing.
                                  </p>
                                ) : (
                                  <span />
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleFinalizeGrade(sub.id)}
                                  disabled={
                                    pendingManualCount > 0 ||
                                    finalizingSubmissionId === sub.id ||
                                    sub.status === "graded"
                                  }
                                  className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {sub.status === "graded"
                                    ? "✓ Finalized"
                                    : finalizingSubmissionId === sub.id
                                      ? "Finalizing..."
                                      : "Finalize Grade"}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
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