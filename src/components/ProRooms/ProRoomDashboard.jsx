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
  Gift,
  X,
  AlertCircle,
  Medal,
  Sparkles,
} from "lucide-react";
import { supabase } from "../../supabaseClient";
import { updatePoints } from "../../utils/pointsHelper";

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
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [customP1, setCustomP1] = useState(0);
  const [customP2, setCustomP2] = useState(0);
  const [customP3, setCustomP3] = useState(0);
  const [customPPart, setCustomPPart] = useState(0);
  const [toastMsg, setToastMsg] = useState("");
  const [alsoPublishResults, setAlsoPublishResults] = useState(true);

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
  // Answers the host has explicitly chosen to manually override, despite
  // being auto-graded. Without this, an auto-graded answer (every MCQ, and
  // now any coding-family answer with a fresh verified test run) has no
  // editable input at all — set_manual_answer_score already supports
  // overriding any answer regardless of auto_graded, the UI just never
  // exposed a way to reach it.
  const [overriddenAnswerIds, setOverriddenAnswerIds] = useState(new Set());

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
      let regList = [];
      const { data: regData, error: regError } = await supabase
        .from("pro_room_registrations")
        .select("*, profiles(username, full_name, avatar_url)")
        .eq("room_id", id);
      if (!regError && regData) {
        regList = regData;
      } else {
        const { data: rawRegs } = await supabase
          .from("pro_room_registrations")
          .select("*")
          .eq("room_id", id);
        if (rawRegs && rawRegs.length > 0) {
          const userIds = [
            ...new Set(rawRegs.map((r) => r.user_id).filter(Boolean)),
          ];
          let profileMap = {};
          if (userIds.length > 0) {
            const { data: profs } = await supabase
              .from("profiles")
              .select("id, username, full_name, avatar_url")
              .in("id", userIds);
            (profs || []).forEach((p) => {
              profileMap[p.id] = p;
            });
          }
          regList = rawRegs.map((r) => ({
            ...r,
            profiles: profileMap[r.user_id] || null,
          }));
        }
      }
      setRegistrations(regList);

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

  const startOverride = (answer) => {
    setManualScoreDrafts((prev) => ({
      ...prev,
      [answer.id]:
        answer.points_earned != null ? String(answer.points_earned) : "",
    }));
    setOverriddenAnswerIds((prev) => new Set(prev).add(answer.id));
  };

  const cancelOverride = (answerId) => {
    setOverriddenAnswerIds((prev) => {
      const next = new Set(prev);
      next.delete(answerId);
      return next;
    });
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
        (
          sub.profiles?.full_name ||
          sub.profiles?.username ||
          "Candidate"
        ).replace(/,/g, " "),
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

  const handlePublishResultsOnly = async () => {
    if (!isHost || publishing) return;
    if (room?.status === "results_published") {
      showToast("Results are already published to candidates.");
      return;
    }

    const confirmPub = window.confirm(
      "Publish Assessment Results to Candidates?\n\nThis will finalize deterministic rankings and make scores, percentages, and the official leaderboard visible to all participants."
    );
    if (!confirmPub) return;

    setPublishing(true);
    try {
      // 1. Calculate deterministic rankings
      const sortedSubs = [...submissions].sort((a, b) => {
        const scoreDiff = (b.total_score ?? 0) - (a.total_score ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        const durA =
          a.submitted_at && a.started_at
            ? new Date(a.submitted_at) - new Date(a.started_at)
            : Infinity;
        const durB =
          b.submitted_at && b.started_at
            ? new Date(b.submitted_at) - new Date(b.started_at)
            : Infinity;
        if (durA !== durB) return durA - durB;
        return new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0);
      });

      for (let idx = 0; idx < sortedSubs.length; idx++) {
        const item = sortedSubs[idx];
        const calculatedRank = idx + 1;
        try {
          await supabase
            .from("pro_room_submissions")
            .update({ rank: calculatedRank })
            .eq("id", item.id);
        } catch (e) {}

        try {
          await supabase.from("pro_room_leaderboard").upsert(
            {
              room_id: id,
              user_id: item.user_id,
              total_score: item.total_score ?? 0,
              rank: calculatedRank,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "room_id,user_id" },
          );
        } catch (e) {}
      }

      const { error: roomErr } = await supabase
        .from("pro_rooms")
        .update({ status: "results_published" })
        .eq("id", id);

      if (roomErr) throw roomErr;

      setRoom((prev) => ({ ...prev, status: "results_published" }));
      showToast("✓ Results published! Scores and leaderboard are now live.");
      await fetchDashboardData();
    } catch (err) {
      console.error("Error publishing results:", err);
      showToast("Failed to publish results. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishResults = () => {
    if (!isHost) return;
    const dist = room?.prize_distribution || {};
    const totalPool = Number(room?.gbits_prize_pool) || 0;
    let d1 = Number(dist.rank_1) || 0;
    let d2 = Number(dist.rank_2) || 0;
    let d3 = Number(dist.rank_3) || 0;
    let dPart = Number(dist.participation) || 0;

    // Intelligent default mapping from pool if not explicitly set
    if (d1 === 0 && d2 === 0 && d3 === 0 && totalPool > 0) {
      if (submissions.length <= 2) {
        d1 = Math.round(totalPool * 0.6);
        d2 = Math.round(totalPool * 0.4);
        d3 = 0;
      } else {
        d1 = Math.round(totalPool * 0.5);
        d2 = Math.round(totalPool * 0.3);
        d3 = Math.max(0, totalPool - d1 - d2);
      }
    }

    setCustomP1(d1);
    setCustomP2(d2);
    setCustomP3(d3);
    setCustomPPart(dPart);
    setAlsoPublishResults(room?.status !== "results_published");
    setShowPublishModal(true);
  };

  // Preview data computed for the confirmation modal
  const publishPreviewData = useMemo(() => {
    const sorted = [...submissions].sort((a, b) => {
      const scoreDiff = (b.total_score ?? 0) - (a.total_score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      const durA =
        a.submitted_at && a.started_at
          ? new Date(a.submitted_at) - new Date(a.started_at)
          : Infinity;
      const durB =
        b.submitted_at && b.started_at
          ? new Date(b.submitted_at) - new Date(b.started_at)
          : Infinity;
      if (durA !== durB) return durA - durB;
      return new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0);
    });

    const totalPool = Number(room?.gbits_prize_pool) || 0;
    const p1 = Number(customP1) || 0;
    const p2 = Number(customP2) || 0;
    const p3 = Number(customP3) || 0;
    const pPart = Number(customPPart) || 0;
    const passingScore = Number(room?.passing_score) || 50;

    const rank1Cand = sorted[0];
    const rank2Cand = sorted[1];
    const rank3Cand = sorted[2];

    const passingCandidates = sorted.filter(
      (s) => (s.percentage ?? 0) >= passingScore,
    );

    let totalPayout = 0;
    if (rank1Cand && p1 > 0) totalPayout += p1;
    if (rank2Cand && p2 > 0) totalPayout += p2;
    if (rank3Cand && p3 > 0) totalPayout += p3;
    if (pPart > 0) {
      const partCount = Math.max(0, passingCandidates.length - 3);
      totalPayout += partCount * pPart;
    }

    return {
      sorted,
      p1,
      p2,
      p3,
      pPart,
      rank1Cand,
      rank2Cand,
      rank3Cand,
      passingCount: passingCandidates.length,
      totalPayout,
      totalPool,
    };
  }, [submissions, room, customP1, customP2, customP3, customPPart]);

  const executePublishAndDistribute = async () => {
    if (!isHost) return;
    setPublishing(true);
    try {
      const p1 = Number(customP1) || 0;
      const p2 = Number(customP2) || 0;
      const p3 = Number(customP3) || 0;
      const pPart = Number(customPPart) || 0;
      const passingScore = Number(room?.passing_score) || 50;
      const totalPool = Number(room?.gbits_prize_pool) || (p1 + p2 + p3);

      // Save configured prize distribution back to pro_rooms
      try {
        await supabase
          .from("pro_rooms")
          .update({
            prize_distribution: {
              rank_1: p1,
              rank_2: p2,
              rank_3: p3,
              participation: pPart,
            },
          })
          .eq("id", id);
      } catch (e) {
        console.warn("Error updating room prize distribution:", e);
      }

      // 1. Deterministic ranking calculation
      const sortedSubs = [...submissions].sort((a, b) => {
        const scoreDiff = (b.total_score ?? 0) - (a.total_score ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        const durA =
          a.submitted_at && a.started_at
            ? new Date(a.submitted_at) - new Date(a.started_at)
            : Infinity;
        const durB =
          b.submitted_at && b.started_at
            ? new Date(b.submitted_at) - new Date(b.started_at)
            : Infinity;
        if (durA !== durB) return durA - durB;
        return new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0);
      });

      const rankUpdates = sortedSubs.map((sub, idx) => ({
        ...sub,
        calculatedRank: idx + 1,
      }));

      // Persist deterministic ranks
      for (const item of rankUpdates) {
        try {
          await supabase
            .from("pro_room_submissions")
            .update({ rank: item.calculatedRank })
            .eq("id", item.id);
        } catch (e) {}

        try {
          await supabase.from("pro_room_leaderboard").upsert(
            {
              room_id: id,
              user_id: item.user_id,
              total_score: item.total_score ?? 0,
              rank: item.calculatedRank,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "room_id,user_id" },
          );
        } catch (e) {}
      }

      // 2. Rewards Distribution
      let allocatedGBits = 0;

      // Rank 1 Payout
      if (rankUpdates[0] && p1 > 0) {
        const winner = rankUpdates[0];
        try {
          await supabase.from("pro_room_rewards").upsert(
            {
              room_id: id,
              user_id: winner.user_id,
              reward_type: "rank_1",
              rank: 1,
              gbits_awarded: p1,
            },
            { onConflict: "room_id,user_id,reward_type" },
          );
          try {
            await updatePoints(
              p1,
              `🏆 1st Place Prize — ${room.name || room.title || "Pro Room"}`,
              "reward",
              id,
              winner.user_id,
            );
          } catch (e) {}
          allocatedGBits += p1;
        } catch (e) {
          console.warn("Rank 1 reward err:", e);
        }
      }

      // Rank 2 Payout
      if (rankUpdates[1] && p2 > 0) {
        const runnerUp = rankUpdates[1];
        try {
          await supabase.from("pro_room_rewards").upsert(
            {
              room_id: id,
              user_id: runnerUp.user_id,
              reward_type: "rank_2",
              rank: 2,
              gbits_awarded: p2,
            },
            { onConflict: "room_id,user_id,reward_type" },
          );
          try {
            await updatePoints(
              p2,
              `🥈 2nd Place Prize — ${room.name || room.title || "Pro Room"}`,
              "reward",
              id,
              runnerUp.user_id,
            );
          } catch (e) {}
          allocatedGBits += p2;
        } catch (e) {
          console.warn("Rank 2 reward err:", e);
        }
      }

      // Rank 3 Payout
      if (rankUpdates[2] && p3 > 0) {
        const third = rankUpdates[2];
        try {
          await supabase.from("pro_room_rewards").upsert(
            {
              room_id: id,
              user_id: third.user_id,
              reward_type: "rank_3",
              rank: 3,
              gbits_awarded: p3,
            },
            { onConflict: "room_id,user_id,reward_type" },
          );
          try {
            await updatePoints(
              p3,
              `🥉 3rd Place Prize — ${room.name || room.title || "Pro Room"}`,
              "reward",
              id,
              third.user_id,
            );
          } catch (e) {}
          allocatedGBits += p3;
        } catch (e) {
          console.warn("Rank 3 reward err:", e);
        }
      }

      // Participation rewards for passing candidates (Rank 4+)
      if (pPart > 0) {
        for (let i = 3; i < rankUpdates.length; i++) {
          const cand = rankUpdates[i];
          const pct = cand.percentage ?? 0;
          if (pct >= passingScore) {
            try {
              await supabase.from("pro_room_rewards").upsert(
                {
                  room_id: id,
                  user_id: cand.user_id,
                  reward_type: "participation",
                  rank: cand.calculatedRank,
                  gbits_awarded: pPart,
                },
                { onConflict: "room_id,user_id,reward_type" },
              );
              try {
                await updatePoints(
                  pPart,
                  `🎖️ Participation Award — ${room.name || room.title || "Pro Room"}`,
                  "reward",
                  id,
                  cand.user_id,
                );
              } catch (e) {}
              allocatedGBits += pPart;
            } catch (e) {
              console.warn("Participation reward err:", e);
            }
          }
        }
      }

      // 3. Digital Certificates Generation with schema-tolerant fallback
      const roomCode = (id || "0000").slice(0, 8).toUpperCase();

      // Winner Certificates (Top 3) — issued by default unless explicitly disabled
      if (room?.has_winner_certificate !== false) {
        for (let i = 0; i < Math.min(3, rankUpdates.length); i++) {
          const cand = rankUpdates[i];
          const candProfile =
            cand.profiles ||
            registrations.find((r) => r.user_id === cand.user_id)?.profiles;
          const candName =
            candProfile?.full_name ||
            candProfile?.username ||
            "Candidate";
          // Check constraint pro_room_certificates_type_check permits: 'winner', 'runner_up', 'top_3', 'participation'
          const certType =
            i === 0 ? "winner" : i === 1 ? "runner_up" : "top_3";
          const certNumber = `GR-PRO-WIN-${roomCode}-${String(i + 1).padStart(3, "0")}`;

          const certPayload = {
            certificate_number: certNumber,
            room_id: id,
            user_id: cand.user_id,
            type: certType,
            recipient_name: candName,
            event_name: room.name || room.title || "Pro Arena Assessment",
            organization_name: room.org_name || room.organizer_name || "Glitch Room Arena",
            score: cand.total_score ?? 0,
            percentage: cand.percentage ?? 0,
            rank: cand.calculatedRank,
            issued_at: new Date().toISOString(),
          };

          try {
            // Check if certificate already exists for this room, user, and type
            const { data: existingCert } = await supabase
              .from("pro_room_certificates")
              .select("id")
              .eq("room_id", id)
              .eq("user_id", cand.user_id)
              .eq("type", certType)
              .maybeSingle();

            if (existingCert?.id) {
              const { error: updErr } = await supabase
                .from("pro_room_certificates")
                .update(certPayload)
                .eq("id", existingCert.id);
              if (updErr) {
                const { percentage, ...noPct } = certPayload;
                await supabase.from("pro_room_certificates").update(noPct).eq("id", existingCert.id);
              }
            } else {
              const { error: insErr } = await supabase
                .from("pro_room_certificates")
                .insert(certPayload);
              if (insErr) {
                const { percentage, ...noPct } = certPayload;
                await supabase.from("pro_room_certificates").insert(noPct);
              }
            }
          } catch (e) {
            console.warn("Winner certificate save err:", e);
          }
        }
      }

      // Participation Certificates for all passing candidates
      if (room?.has_participation_certificate !== false) {
        for (let i = 0; i < rankUpdates.length; i++) {
          const cand = rankUpdates[i];
          const pct = cand.percentage ?? 0;
          if (pct >= passingScore) {
            const candProfile =
              cand.profiles ||
              registrations.find((r) => r.user_id === cand.user_id)?.profiles;
            const candName =
              candProfile?.full_name ||
              candProfile?.username ||
              "Candidate";
            const certNumber = `GR-PRO-PART-${roomCode}-${String(i + 1).padStart(3, "0")}`;

            const certPayload = {
              certificate_number: certNumber,
              room_id: id,
              user_id: cand.user_id,
              type: "participation",
              recipient_name: candName,
              event_name: room.name || room.title || "Pro Arena Assessment",
              organization_name: room.org_name || room.organizer_name || "Glitch Room Arena",
              score: cand.total_score ?? 0,
              percentage: cand.percentage ?? 0,
              rank: cand.calculatedRank,
              issued_at: new Date().toISOString(),
            };

            try {
              const { data: existingPart } = await supabase
                .from("pro_room_certificates")
                .select("id")
                .eq("room_id", id)
                .eq("user_id", cand.user_id)
                .eq("type", "participation")
                .maybeSingle();

              if (existingPart?.id) {
                const { error: updErr } = await supabase
                  .from("pro_room_certificates")
                  .update(certPayload)
                  .eq("id", existingPart.id);
                if (updErr) {
                  const { percentage, ...noPct } = certPayload;
                  await supabase.from("pro_room_certificates").update(noPct).eq("id", existingPart.id);
                }
              } else {
                const { error: insErr } = await supabase
                  .from("pro_room_certificates")
                  .insert(certPayload);
                if (insErr) {
                  const { percentage, ...noPct } = certPayload;
                  await supabase.from("pro_room_certificates").insert(noPct);
                }
              }
            } catch (e) {
              console.warn("Participation certificate save err:", e);
            }
          }
        }
      }

      // 4. Award Achievement Badge to Rank 1 if enabled
      if (room?.has_achievement_badge !== false && rankUpdates[0]) {
        try {
          await supabase.from("user_badges").upsert(
            {
              user_id: rankUpdates[0].user_id,
              badge_id: "arena_3",
              earned_at: new Date().toISOString(),
            },
            { onConflict: "user_id,badge_id" },
          );
        } catch (e) {}
      }

      // 5. Update room status to published (if chosen) and set rewards distributed
      const roomUpdatePayload = {
        rewards_distributed: true,
        rewards_distributed_at: new Date().toISOString(),
      };
      if (alsoPublishResults || room?.status === "results_published") {
        roomUpdatePayload.status = "results_published";
      }

      const { error: roomUpdateErr } = await supabase
        .from("pro_rooms")
        .update(roomUpdatePayload)
        .eq("id", id);

      if (roomUpdateErr) {
        console.error("Room update error:", roomUpdateErr);
      }

      // 6. Broadcast notification
      try {
        await supabase.from("pro_room_notifications").insert({
          room_id: id,
          title: "🏆 Official Results & Awards Published!",
          message:
            "Standings, digital certificates, and gBit prizes are now live.",
        });
      } catch (notifErr) {}

      setShowPublishModal(false);
      showToast("🏆 Rewards & Certificates distributed successfully!");
      await fetchDashboardData();
    } catch (err) {
      console.error("Publish & distribute error:", err);
      showToast("⚠️ Could not finish distribution — please try again.");
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
      if (!Number.isNaN(min))
        list = list.filter((s) => (s.total_score ?? 0) >= min);
    }
    if (maxScoreFilter !== "") {
      const max = Number(maxScoreFilter);
      if (!Number.isNaN(max))
        list = list.filter((s) => (s.total_score ?? 0) <= max);
    }

    list.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0);
      }
      if (sortBy === "oldest") {
        return new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0);
      }
      if (sortBy === "score_desc")
        return (b.total_score ?? 0) - (a.total_score ?? 0);
      if (sortBy === "score_asc")
        return (a.total_score ?? 0) - (b.total_score ?? 0);
      if (sortBy === "name_asc") {
        const nameA = a.profiles?.full_name || a.profiles?.username || "";
        const nameB = b.profiles?.full_name || b.profiles?.username || "";
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

    return list;
  }, [
    submissions,
    statusFilter,
    searchQuery,
    minScoreFilter,
    maxScoreFilter,
    sortBy,
  ]);

  // Recent activity stream aggregated from real data (MUST be declared before early returns per React Rules of Hooks)
  const activityEvents = useMemo(() => {
    const events = [];

    registrations.forEach((r) => {
      events.push({
        type: "registration",
        title: `${r.profiles?.full_name || r.profiles?.username || "Candidate"} registered for assessment`,
        time: r.registered_at || r.created_at || new Date().toISOString(),
      });
    });

    submissions.forEach((s) => {
      events.push({
        type: "submission",
        title: `${s.profiles?.full_name || s.profiles?.username || "Candidate"} submitted assessment (${s.total_score ?? 0} pts)`,
        time: s.submitted_at || s.created_at || new Date().toISOString(),
      });
    });

    announcements.forEach((a) => {
      events.push({
        type: "announcement",
        title: `Announcement broadcasted: "${a.title}"`,
        time: a.created_at || new Date().toISOString(),
      });
    });

    events.sort((a, b) => new Date(b.time) - new Date(a.time));
    return events.slice(0, 10);
  }, [registrations, submissions, announcements]);

  // Derived leaderboard fallback if RPC view is empty (MUST be declared before early returns per React Rules of Hooks)
  const activeLeaderboard = useMemo(() => {
    if (leaderboard && leaderboard.length > 0) return leaderboard;
    return [...submissions]
      .filter((s) => s.status === "graded" || (s.total_score ?? 0) > 0)
      .sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0));
  }, [leaderboard, submissions]);

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
  const evaluatedSubs = submissions.filter(
    (s) => s.status === "graded" || (s.total_score && s.total_score > 0),
  );
  const avgScoreVal =
    evaluatedSubs.length > 0
      ? Math.round(
          evaluatedSubs.reduce((acc, s) => acc + (s.total_score || 0), 0) /
            evaluatedSubs.length,
        )
      : null;
  const avgScoreText =
    avgScoreVal !== null
      ? `${avgScoreVal} Pts`
      : totalSubs > 0
        ? "Pending"
        : "0 Pts";

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

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-12 w-full relative z-10 flex flex-col">
        <GlitchBackground />

        {/* Compact Dashboard Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5">
          <div>
            <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 uppercase tracking-widest">
              ORGANIZER CONTROL CENTER
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {room?.name || "Pro Room Dashboard"}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {room?.org_name || "Glitch Room"} • Status:{" "}
              <span className="text-[#00F0FF] font-bold uppercase">
                {room?.status || "Live"}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/pro-rooms/${id}`)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:text-white cursor-pointer transition-all"
            >
              View Candidate Page
            </button>

            {/* ACTION 1: Results Publication */}
            {room?.status !== "results_published" ? (
              <button
                onClick={handlePublishResultsOnly}
                disabled={publishing}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00F0FF] to-cyan-500 hover:from-[#00F0FF]/90 hover:to-cyan-400 text-black font-extrabold text-xs shadow-lg shadow-[#00F0FF]/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Eye size={14} />
                <span>Publish Results</span>
              </button>
            ) : (
              <div className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono flex items-center gap-1.5">
                <CheckCircle size={14} />
                <span>Results Published</span>
              </div>
            )}

            {/* ACTION 2: Awards & Certificates Distribution */}
            {!room?.rewards_distributed ? (
              <button
                onClick={handlePublishResults}
                disabled={publishing}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-purple-600/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trophy size={14} className="text-yellow-300" />
                <span>Distribute Awards 🏆</span>
              </button>
            ) : (
              <button
                onClick={handlePublishResults}
                className="px-3.5 py-2 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-200 hover:bg-purple-600/30 text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer transition shadow-lg shadow-purple-500/10"
                title="Click to view or adjust prize allocation"
              >
                <Trophy size={14} className="text-yellow-400" />
                <span>Awards Distributed</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Needed Banners */}
        {room?.status !== "results_published" ? (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-[#00F0FF]/10 to-transparent border border-[#00F0FF]/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/20 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] shrink-0">
                <Eye size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Results Awaiting Publication</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] font-mono font-bold">Action Needed</span>
                </h4>
                <p className="text-xs text-gray-300">
                  Submissions and automated scoring are complete. Click "Publish Results" to reveal scores, percentages, and the official leaderboard to candidates.
                </p>
              </div>
            </div>
            <button
              onClick={handlePublishResultsOnly}
              disabled={publishing}
              className="px-5 py-2.5 rounded-xl bg-[#00F0FF] hover:bg-[#00d0df] text-black font-black text-xs transition shadow-lg shadow-[#00F0FF]/20 cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0"
            >
              <Eye size={14} />
              <span>Publish Results Now</span>
            </button>
          </div>
        ) : !room?.rewards_distributed ? (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-transparent border border-yellow-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 shrink-0">
                <Gift size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Results Are Published — Rewards & Certificates Pending</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 font-mono font-bold">Action Required</span>
                </h4>
                <p className="text-xs text-gray-300">
                  Rankings are visible to candidates, but prize pool gBits and digital certificates have not been disbursed yet.
                </p>
              </div>
            </div>
            <button
              onClick={handlePublishResults}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-black text-xs transition shadow-lg shadow-yellow-500/20 cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0"
            >
              <Sparkles size={14} />
              <span>Distribute Rewards & Certs Now</span>
            </button>
          </div>
        ) : null}

        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
            value={avgScoreText}
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
        <div className="flex items-center gap-2 overflow-x-auto py-2 mb-6 border-b border-white/10 shrink-0">
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

        {/* Tab Content: Overview & Analytics */}
        {activeTab === "overview" && (
          <div className="space-y-6 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Participation Overview */}
              <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-mono font-bold text-[#00F0FF] uppercase tracking-wider flex items-center gap-2">
                  <Users size={16} /> Participation Breakdown
                </h3>
                <div className="grid grid-cols-2 gap-4 pt-2 font-mono">
                  <div className="bg-[#06060c] border border-white/5 p-4 rounded-xl">
                    <span className="text-gray-500 text-xs block">
                      Registered
                    </span>
                    <span className="text-xl font-bold text-white mt-1 block">
                      {totalRegs}
                    </span>
                  </div>
                  <div className="bg-[#06060c] border border-white/5 p-4 rounded-xl">
                    <span className="text-gray-500 text-xs block">
                      Submitted
                    </span>
                    <span className="text-xl font-bold text-emerald-400 mt-1 block">
                      {totalSubs}
                    </span>
                  </div>
                  <div className="bg-[#06060c] border border-white/5 p-4 rounded-xl">
                    <span className="text-gray-500 text-xs block">
                      Pending Review
                    </span>
                    <span className="text-xl font-bold text-amber-400 mt-1 block">
                      {
                        submissions.filter(
                          (s) =>
                            s.status === "pending_review" ||
                            s.status === "in_progress",
                        ).length
                      }
                    </span>
                  </div>
                  <div className="bg-[#06060c] border border-white/5 p-4 rounded-xl">
                    <span className="text-gray-500 text-xs block">
                      Completion Rate
                    </span>
                    <span className="text-xl font-bold text-purple-400 mt-1 block">
                      {totalRegs > 0
                        ? Math.round((totalSubs / totalRegs) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance Overview */}
              <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <Trophy size={16} /> Performance Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 pt-2 font-mono">
                  <div className="bg-[#06060c] border border-white/5 p-4 rounded-xl">
                    <span className="text-gray-500 text-xs block">
                      Average Score
                    </span>
                    <span className="text-xl font-bold text-white mt-1 block">
                      {avgScoreText}
                    </span>
                  </div>
                  <div className="bg-[#06060c] border border-white/5 p-4 rounded-xl">
                    <span className="text-gray-500 text-xs block">
                      Highest Score
                    </span>
                    <span className="text-xl font-bold text-[#00F0FF] mt-1 block">
                      {totalSubs > 0
                        ? `${Math.max(...submissions.map((s) => s.total_score || 0))} Pts`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="bg-[#06060c] border border-white/5 p-4 rounded-xl">
                    <span className="text-gray-500 text-xs block">
                      Graded Submissions
                    </span>
                    <span className="text-xl font-bold text-emerald-400 mt-1 block">
                      {submissions.filter((s) => s.status === "graded").length}{" "}
                      / {totalSubs}
                    </span>
                  </div>
                  <div className="bg-[#06060c] border border-white/5 p-4 rounded-xl">
                    <span className="text-gray-500 text-xs block">
                      Room Status
                    </span>
                    <span className="text-sm font-bold text-cyan-300 uppercase mt-2 block truncate">
                      {room?.status || "Live"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Stream */}
            <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-mono font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock size={16} className="text-[#00F0FF]" /> Recent Activity
              </h3>
              {activityEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs font-mono">
                  No activity recorded yet for this assessment room.
                </div>
              ) : (
                <div className="space-y-3 font-mono text-xs">
                  {activityEvents.map((evt, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#06060c] border border-white/5 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            evt.type === "submission"
                              ? "bg-emerald-400"
                              : evt.type === "registration"
                                ? "bg-[#00F0FF]"
                                : "bg-purple-400"
                          }`}
                        />
                        <span className="text-gray-200">{evt.title}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 shrink-0">
                        {new Date(evt.time).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Candidates */}
        {activeTab === "candidates" && (
          <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-6 flex-1">
            <h3 className="text-base font-bold text-white mb-4">
              Registered Candidates ({totalRegs})
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
          <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-6 flex-1">
            <h3 className="text-base font-bold text-white mb-1">
              Submissions & Grading ({totalSubs})
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Objective questions (MCQ, True/False, Short Answer, MSQ) are
              graded automatically. Coding questions are auto-graded too when a
              fresh, verified test run exists — otherwise they need a score
              entered here. Any auto-graded score can still be overridden
              manually before finalizing.
            </p>

            {/* Filter / Sort / Bulk toolbar */}
            <div className="flex flex-col gap-3 mb-4 p-3.5 rounded-xl bg-[#07070e] border border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "all", label: "All" },
                  { id: "pending_review", label: "Needs Grading" },
                  { id: "graded", label: "Graded" },
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
                              <ChevronUp
                                size={14}
                                className="text-gray-500 shrink-0"
                              />
                            ) : (
                              <ChevronDown
                                size={14}
                                className="text-gray-500 shrink-0"
                              />
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
                                      <p className="text-gray-200 font-semibold flex-1 whitespace-pre-wrap">
                                        {q?.question_text ||
                                          "(question unavailable)"}
                                      </p>
                                      <span className="text-[10px] font-mono text-gray-500 shrink-0">
                                        {q?.question_type}
                                      </span>
                                    </div>

                                    <AnswerContent answer={a} question={q} />

                                    {a.auto_graded &&
                                    !overriddenAnswerIds.has(a.id) ? (
                                      <div className="flex items-center gap-2 pt-1 flex-wrap">
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
                                          {a.points_earned ?? 0} /{" "}
                                          {q?.points ?? "?"} pts (auto-graded)
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => startOverride(a)}
                                          className="text-[10px] font-bold text-gray-500 hover:text-[#00F0FF] cursor-pointer underline decoration-dotted"
                                        >
                                          Override
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                                        {a.auto_graded && (
                                          <span className="w-full text-[10px] text-gray-500">
                                            Auto-graded: {a.points_earned ?? 0}{" "}
                                            / {q?.points ?? "?"} pts — enter a
                                            score below to override.
                                          </span>
                                        )}
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
                                        {a.points_earned != null &&
                                          !a.auto_graded && (
                                            <span className="text-[10px] text-gray-500">
                                              currently {a.points_earned} pts
                                            </span>
                                          )}
                                        {a.auto_graded && (
                                          <button
                                            type="button"
                                            onClick={() => cancelOverride(a.id)}
                                            className="text-[10px] font-bold text-gray-500 hover:text-gray-300 cursor-pointer"
                                          >
                                            Cancel
                                          </button>
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

        {/* Tab Content: Leaderboard & Ranks */}
        {activeTab === "leaderboard" && (
          <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-6 flex-1">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Trophy size={18} className="text-amber-400" /> Leaderboard &
              Ranks
            </h3>
            {activeLeaderboard.length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-xs space-y-2 font-mono">
                <Trophy
                  size={32}
                  className="mx-auto text-gray-600 mb-2 opacity-50"
                />
                <p className="text-gray-300 font-bold">
                  Leaderboard will appear after submissions are evaluated.
                </p>
                <p className="text-gray-500">
                  Submissions received will show scores here once graded.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 font-mono text-xs">
                {activeLeaderboard.map((lb, idx) => (
                  <div
                    key={lb.id || idx}
                    className="py-3.5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          idx === 0
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : idx === 1
                              ? "bg-gray-300/20 text-gray-200 border border-gray-400/40"
                              : idx === 2
                                ? "bg-amber-700/20 text-amber-500 border border-amber-600/40"
                                : "bg-white/5 text-gray-500"
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="text-white font-bold block">
                          {lb.profiles?.full_name ||
                            lb.profiles?.username ||
                            "Candidate"}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {lb.submitted_at
                            ? new Date(lb.submitted_at).toLocaleDateString()
                            : "Evaluated"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {lb.percentage != null && (
                        <span className="text-gray-400 text-[11px]">
                          {lb.percentage}%
                        </span>
                      )}
                      <span className="text-[#00F0FF] font-bold text-sm">
                        {lb.total_score ?? 0} Pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Broadcast Announcements */}
        {activeTab === "announcements" && (
          <div className="space-y-6 flex-1">
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

            {/* Existing Announcements Feed */}
            <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-white">
                Broadcast History ({announcements.length})
              </h4>
              {announcements.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs">
                  No announcements broadcasted yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((a) => (
                    <div
                      key={a.id}
                      className="p-4 bg-[#07070e] border border-white/5 rounded-xl space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#00F0FF]">
                          {a.title}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(a.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 whitespace-pre-wrap">
                        {a.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Publish Results & Reward Distribution Modal */}
        <AnimatePresence>
          {showPublishModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pt-20 sm:pt-8 bg-black/85 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-2xl bg-[#0c0c16] border border-[#00F0FF]/30 rounded-2xl shadow-2xl shadow-[#00F0FF]/10 overflow-hidden flex flex-col max-h-[85vh] my-auto"
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#121222]/80 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F0FF]/20 to-purple-600/30 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] shrink-0">
                      <Gift size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-white flex items-center gap-2">
                        Distribute Awards & Certificates
                      </h2>
                      <p className="text-xs text-gray-400">
                        Allocate prize-pool gBits, credit winner balances & generate official certificates.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPublishModal(false)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
                  {/* Warning / Informational Alert */}
                  {room?.rewards_distributed ? (
                    <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3">
                      <AlertCircle className="text-yellow-400 shrink-0 mt-0.5" size={16} />
                      <div className="text-yellow-200/90 leading-relaxed">
                        Rewards and certificates for this assessment were previously distributed on{" "}
                        <span className="font-bold text-white">
                          {new Date(room.rewards_distributed_at || Date.now()).toLocaleDateString()}
                        </span>
                        . Confirming will refresh official allocations and ensure all certificates are generated.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-xl flex items-start gap-3">
                      <Sparkles className="text-[#00F0FF] shrink-0 mt-0.5" size={16} />
                      <div className="text-gray-300 leading-relaxed">
                        <strong className="text-white">Platform-Sponsored Prize Distribution:</strong> gBits will be transferred to winners' account balances. Verifiable digital credentials will be issued automatically.
                      </div>
                    </div>
                  )}

                  {/* Optional Checkbox: Also Publish Results if not yet published */}
                  {room?.status !== "results_published" && (
                    <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="modalAlsoPublish"
                        checked={alsoPublishResults}
                        onChange={(e) => setAlsoPublishResults(e.target.checked)}
                        className="w-4 h-4 rounded text-[#00F0FF] focus:ring-[#00F0FF] bg-black/40 border-white/20 cursor-pointer"
                      />
                      <label htmlFor="modalAlsoPublish" className="text-xs text-cyan-200 cursor-pointer font-medium select-none">
                        <strong>Also publish results to candidates immediately</strong> (makes final scores, ranks, and leaderboard public)
                      </label>
                    </div>
                  )}

                  {/* Summary Bar */}
                  <div className="grid grid-cols-3 gap-3 p-3.5 bg-white/5 border border-white/5 rounded-xl">
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Total Prize Pool</div>
                      <div className="text-base font-black text-[#00F0FF] mt-0.5">
                        {publishPreviewData.totalPool.toLocaleString()} <span className="text-xs font-normal text-gray-400">gBits</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Projected Payout</div>
                      <div className="text-base font-black text-emerald-400 mt-0.5">
                        {publishPreviewData.totalPayout.toLocaleString()} <span className="text-xs font-normal text-gray-400">gBits</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Passing Candidates</div>
                      <div className="text-base font-black text-purple-400 mt-0.5">
                        {publishPreviewData.passingCount} <span className="text-xs font-normal text-gray-400">/{submissions.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Configurable Prize Distribution Inputs */}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Gift size={14} className="text-[#00F0FF]" />
                        Configure Prize Pool Allocation
                      </h4>
                      <span className="text-[11px] text-gray-400">
                        Pool: <strong className="text-[#00F0FF]">{publishPreviewData.totalPool.toLocaleString()} gBits</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                        <div className="text-[10px] text-yellow-300 font-semibold mb-1 flex items-center justify-between">
                          <span>🥇 Rank 1</span>
                          <span className="text-[9px] text-gray-400 font-mono">gBits</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={customP1}
                          onChange={(e) => setCustomP1(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full bg-black/40 border border-yellow-500/40 rounded-lg px-2 py-1 text-xs text-white font-mono font-bold focus:border-yellow-400 focus:outline-none"
                        />
                      </div>

                      <div className="p-2.5 bg-slate-400/10 border border-slate-400/20 rounded-xl">
                        <div className="text-[10px] text-slate-300 font-semibold mb-1 flex items-center justify-between">
                          <span>🥈 Rank 2</span>
                          <span className="text-[9px] text-gray-400 font-mono">gBits</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={customP2}
                          onChange={(e) => setCustomP2(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full bg-black/40 border border-slate-400/40 rounded-lg px-2 py-1 text-xs text-white font-mono font-bold focus:border-slate-300 focus:outline-none"
                        />
                      </div>

                      <div className="p-2.5 bg-amber-700/10 border border-amber-700/20 rounded-xl">
                        <div className="text-[10px] text-amber-300 font-semibold mb-1 flex items-center justify-between">
                          <span>🥉 Rank 3</span>
                          <span className="text-[9px] text-gray-400 font-mono">gBits</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={customP3}
                          onChange={(e) => setCustomP3(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full bg-black/40 border border-amber-700/40 rounded-lg px-2 py-1 text-xs text-white font-mono font-bold focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                        <div className="text-[10px] text-purple-300 font-semibold mb-1 flex items-center justify-between">
                          <span>🎖️ Participation</span>
                          <span className="text-[9px] text-gray-400 font-mono">each</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={customPPart}
                          onChange={(e) => setCustomPPart(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full bg-black/40 border border-purple-500/40 rounded-lg px-2 py-1 text-xs text-white font-mono font-bold focus:border-purple-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Top 3 Podium Winners */}
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Trophy size={14} className="text-yellow-400" />
                      Podium Winners Preview
                    </h4>
                    <div className="space-y-2">
                      {/* Rank 1 */}
                      <div className="p-3 bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/30 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">🥇</span>
                          <div>
                            <div className="font-bold text-white text-xs flex items-center gap-2">
                              {publishPreviewData.rank1Cand ? (
                                publishPreviewData.rank1Cand.profiles?.full_name ||
                                publishPreviewData.rank1Cand.profiles?.username ||
                                "Candidate"
                              ) : (
                                <span className="text-gray-500 italic">No submissions yet</span>
                              )}
                              {publishPreviewData.rank1Cand && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-300 font-semibold">
                                  Score: {publishPreviewData.rank1Cand.total_score ?? 0}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              Rank #1 • Winner Certificate {room?.has_achievement_badge ? "• Arena Champion Badge" : ""}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-yellow-400 text-sm">
                            +{publishPreviewData.p1.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-gray-400 ml-1">gBits</span>
                        </div>
                      </div>

                      {/* Rank 2 */}
                      <div className="p-3 bg-gradient-to-r from-slate-400/10 to-transparent border border-slate-400/20 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">🥈</span>
                          <div>
                            <div className="font-bold text-white text-xs flex items-center gap-2">
                              {publishPreviewData.rank2Cand ? (
                                publishPreviewData.rank2Cand.profiles?.full_name ||
                                publishPreviewData.rank2Cand.profiles?.username ||
                                "Candidate"
                              ) : (
                                <span className="text-gray-500 italic">No submissions yet</span>
                              )}
                              {publishPreviewData.rank2Cand && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-400/20 text-slate-300 font-semibold">
                                  Score: {publishPreviewData.rank2Cand.total_score ?? 0}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              Rank #2 • Winner Certificate
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-slate-300 text-sm">
                            +{publishPreviewData.p2.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-gray-400 ml-1">gBits</span>
                        </div>
                      </div>

                      {/* Rank 3 */}
                      <div className="p-3 bg-gradient-to-r from-amber-700/10 to-transparent border border-amber-700/20 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">🥉</span>
                          <div>
                            <div className="font-bold text-white text-xs flex items-center gap-2">
                              {publishPreviewData.rank3Cand ? (
                                publishPreviewData.rank3Cand.profiles?.full_name ||
                                publishPreviewData.rank3Cand.profiles?.username ||
                                "Candidate"
                              ) : (
                                <span className="text-gray-500 italic">No submissions yet</span>
                              )}
                              {publishPreviewData.rank3Cand && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-700/20 text-amber-300 font-semibold">
                                  Score: {publishPreviewData.rank3Cand.total_score ?? 0}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              Rank #3 • Winner Certificate
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-amber-500 text-sm">
                            +{publishPreviewData.p3.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-gray-400 ml-1">gBits</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Participation Reward & Certificates */}
                  <div className="p-3.5 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Participation Reward & Certification</div>
                      <div className="text-[11px] text-gray-400">
                        Qualifying score: &ge; {room?.passing_score || 50}% • {Math.max(0, publishPreviewData.passingCount - 3)} additional qualifying candidate(s)
                      </div>
                    </div>
                    <div className="text-right">
                      {publishPreviewData.pPart > 0 ? (
                        <div>
                          <span className="font-bold text-purple-400">+{publishPreviewData.pPart} gBits</span>
                          <div className="text-[10px] text-gray-400">per candidate</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Certificate Only</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-white/10 bg-[#121222]/80 flex items-center justify-end gap-3 shrink-0">
                  <button
                    onClick={() => setShowPublishModal(false)}
                    disabled={publishing}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executePublishAndDistribute}
                    disabled={publishing}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white text-xs font-bold shadow-lg shadow-purple-600/25 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {publishing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Transferring Prizes & Minting Certs...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Confirm & Distribute Awards</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
};

export default ProRoomDashboard;
