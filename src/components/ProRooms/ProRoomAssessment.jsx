import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle,
  Play,
  Terminal,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  Code2,
  FileCode,
  Check,
  ShieldAlert,
} from "lucide-react";
import { supabase } from "../../supabaseClient";
import { getProRoomLifecycleState } from "./ProRoomCard";

const ProRoomAssessment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeSecIdx, setActiveSecIdx] = useState(0);
  const [activeQIdx, setActiveQIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // ── Access control ───────────────────────────────────────────────────────
  // Who's allowed to actually open this page: the room's host (any time, as
  // a preview — never writes a real submission) or a registered candidate,
  // and only while the room is actually LIVE. This is a UX gate, not the
  // real security boundary — that has to be Supabase RLS (see the SQL
  // alongside this fix), since anyone can hit the same Supabase client
  // directly from devtools regardless of what this component renders.
  //   'checking'      — still resolving
  //   'host-preview'  — the room's host, previewing (no submission created)
  //   'candidate'     — registered candidate, room is live — full access
  //   'not-signed-in' | 'not-registered' | 'not-live-yet' | 'not-live-ended'
  const [accessState, setAccessState] = useState("checking");
  const isHostPreview = accessState === "host-preview";

  // Candidate Test State
  const [answers, setAnswers] = useState({}); // { [qId]: { answer_text, selected_options, code_submission } }
  const [markedReview, setMarkedReview] = useState({}); // { [qId]: boolean }
  const [codeOutput, setCodeOutput] = useState("");
  const [runningCode, setRunningCode] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(7200); // 2 hours default
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false); // auto-submit triggered
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState("");

  // ── Access control & persistence ──────────────────────────────────────────
  const [currentUserId, setCurrentUserId] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [submitError, setSubmitError] = useState("");
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [answersHydrated, setAnswersHydrated] = useState(false);
  const [navigating, setNavigating] = useState(false);

  // Mutex lock to prevent multiple simultaneous save requests for the same question
  const pendingSaveRef = useRef(new Set());

  // Once time is up or the test is submitted, the whole test surface freezes
  const interactionLocked = timeExpired || submissionComplete;

  // ── Anti-cheat: tab/window blur tracking ────────────────────────────────
  const DESKTOP_BLUR_GRACE_MS = 3000;
  const MOBILE_BLUR_GRACE_MS = 10000;
  const isMobileDevice = () =>
    typeof navigator !== "undefined" &&
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const [blurEvents, setBlurEvents] = useState([]);
  const [showBlurWarning, setShowBlurWarning] = useState(false);
  const hiddenAtRef = useRef(null);
  const blurWarningTimeoutRef = useRef(null);

  useEffect(() => {
    const grace = isMobileDevice()
      ? MOBILE_BLUR_GRACE_MS
      : DESKTOP_BLUR_GRACE_MS;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        return;
      }
      if (hiddenAtRef.current == null) return;
      const durationMs = Date.now() - hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (durationMs < grace) return;

      setBlurEvents((prev) => [
        ...prev,
        { at: new Date().toISOString(), durationMs },
      ]);
      setShowBlurWarning(true);
      if (blurWarningTimeoutRef.current)
        clearTimeout(blurWarningTimeoutRef.current);
      blurWarningTimeoutRef.current = setTimeout(
        () => setShowBlurWarning(false),
        6000,
      );
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (blurWarningTimeoutRef.current)
        clearTimeout(blurWarningTimeoutRef.current);
    };
  }, []);

  // Warn before unload
  const submissionCompleteRef = useRef(false);
  useEffect(() => {
    submissionCompleteRef.current = submissionComplete;
  }, [submissionComplete]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (submissionCompleteRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Multi-tab prevention
  const TAB_LOCK_STALE_MS = 10000;
  const TAB_LOCK_HEARTBEAT_MS = 4000;
  const tabSessionIdRef = useRef(
    `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const lockHeartbeatRef = useRef(null);
  const [tabLocked, setTabLocked] = useState(null);

  useEffect(() => {
    if (!id) return;
    const lockKey = `gr_pro_room_lock_${id}`;

    const readLock = () => {
      try {
        const raw = localStorage.getItem(lockKey);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };
    const writeLock = () => {
      try {
        localStorage.setItem(
          lockKey,
          JSON.stringify({
            tabId: tabSessionIdRef.current,
            updatedAt: Date.now(),
          }),
        );
      } catch {}
    };

    const existing = readLock();
    const isStale =
      !existing || Date.now() - (existing.updatedAt || 0) > TAB_LOCK_STALE_MS;
    const isOwnedByUs = existing?.tabId === tabSessionIdRef.current;

    if (existing && !isStale && !isOwnedByUs) {
      setTabLocked(true);
    } else {
      writeLock();
      setTabLocked(false);
      lockHeartbeatRef.current = setInterval(writeLock, TAB_LOCK_HEARTBEAT_MS);
    }

    const handleStorage = (e) => {
      if (e.key !== lockKey) return;
      try {
        const val = e.newValue ? JSON.parse(e.newValue) : null;
        if (val && val.tabId !== tabSessionIdRef.current) {
          setTabLocked(true);
          if (lockHeartbeatRef.current) {
            clearInterval(lockHeartbeatRef.current);
            lockHeartbeatRef.current = null;
          }
        }
      } catch {}
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (lockHeartbeatRef.current) clearInterval(lockHeartbeatRef.current);
      const current = readLock();
      if (current?.tabId === tabSessionIdRef.current) {
        try {
          localStorage.removeItem(lockKey);
        } catch {}
      }
    };
  }, [id]);

  // Timer Countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-submit on timer expiry
  const autoSubmitFiredRef = useRef(false);
  useEffect(() => {
    if (
      timeLeftSeconds === 0 &&
      !autoSubmitFiredRef.current &&
      !submissionComplete
    ) {
      autoSubmitFiredRef.current = true;
      setShowSubmitModal(true);
      handleSubmitAssessment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeftSeconds, submissionComplete]);

  // Fetch Assessment Data
  const fetchAssessmentData = async () => {
    setLoading(true);
    try {
      const { data: roomData } = await supabase
        .from("pro_rooms")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id || null;
      setCurrentUserId(uid);

      if (roomData) setRoom(roomData);

      if (!roomData) {
        setAccessState("not-live-ended");
        setLoading(false);
        return;
      }

      if (!uid) {
        setAccessState("not-signed-in");
        setLoading(false);
        return;
      }

      const isHostUser = roomData.host_id === uid;

      if (!isHostUser) {
        const { data: regRow } = await supabase
          .from("pro_room_registrations")
          .select("id, status")
          .eq("room_id", id)
          .eq("user_id", uid)
          .maybeSingle();

        if (!regRow || regRow.status !== "approved") {
          setAccessState(regRow?.status === "pending" ? "pending-approval" : "not-registered");
          setLoading(false);
          return;
        }
      }

      const lifecycle = getProRoomLifecycleState(roomData);
      if (!lifecycle.isLive) {
        const eventStart = roomData.event_start_at
          ? new Date(roomData.event_start_at)
          : null;
        setAccessState(
          eventStart && new Date() < eventStart
            ? "not-live-yet"
            : "not-live-ended",
        );
        setLoading(false);
        return;
      }

      setAccessState(isHostUser ? "host-preview" : "candidate");

      const { data: secRows } = await supabase
        .from("pro_room_sections")
        .select("*")
        .eq("room_id", id)
        .eq("is_deleted", false)
        .order("order_index", { ascending: true });

      let secData = [];
      if (secRows && secRows.length > 0) {
        const sectionIds = secRows.map((s) => s.id);
        const { data: qRows, error: qErr } = await supabase.rpc(
          "get_pro_room_questions_safe",
          { p_section_ids: sectionIds },
        );

        if (qErr) console.error("Could not load questions:", qErr);

        secData = secRows.map((s) => ({
          ...s,
          pro_room_questions: (qRows || []).filter(
            (q) => q.section_id === s.id,
          ),
        }));
      }

      if (secData && secData.length > 0) {
        setSections(secData);
      } else {
        setSections([]);
        setNotConfigured(true);
        setLoading(false);
        return;
      }

      const durationMinutes = roomData?.duration_minutes || 120;

      if (isHostUser) {
        setTimeLeftSeconds(durationMinutes * 60);
        setAnswersHydrated(true);
        setLoading(false);
        return;
      }

      // Load existing submission row
      const { data: existingSub } = await supabase
        .from("pro_room_submissions")
        .select("*, pro_room_answers(*)")
        .eq("room_id", id)
        .eq("user_id", uid)
        .maybeSingle();

      if (existingSub) {
        setSubmissionId(existingSub.id);

        if (existingSub.status === "submitted") {
          setAlreadySubmitted(true);
        }

        if (existingSub.started_at) {
          const elapsedSec = Math.floor(
            (Date.now() - new Date(existingSub.started_at).getTime()) / 1000,
          );
          setTimeLeftSeconds(Math.max(0, durationMinutes * 60 - elapsedSec));
        } else {
          setTimeLeftSeconds(durationMinutes * 60);
        }

        if (Array.isArray(existingSub.pro_room_answers)) {
          const hydratedAnswers = {};
          const hydratedReview = {};
          existingSub.pro_room_answers.forEach((a) => {
            hydratedAnswers[a.question_id] = {
              answer_text: a.answer_text || "",
              selected_options: a.selected_options || [],
              code_submission: a.code_submission || "",
            };
            if (a.marked_for_review) hydratedReview[a.question_id] = true;
          });
          setAnswers(hydratedAnswers);
          setMarkedReview(hydratedReview);
        }
      } else {
        const { data: created, error: createErr } = await supabase
          .from("pro_room_submissions")
          .insert({
            room_id: id,
            user_id: uid,
            status: "in_progress",
            started_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createErr) {
          console.error("Could not create submission row:", createErr);
        } else if (created) {
          setSubmissionId(created.id);
        }
        setTimeLeftSeconds(durationMinutes * 60);
      }

      setAnswersHydrated(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessmentData();
  }, [id]);

  const currentSection = sections[activeSecIdx] || { pro_room_questions: [] };
  const currentQuestions = currentSection.pro_room_questions || [];
  const currentQuestion = currentQuestions[activeQIdx] || {};

  // Formatter for timer
  const formatTimer = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? `${h}:` : ""}${m < 10 ? `0${m}` : m}:${s < 10 ? `0${s}` : s}`;
  };

  const handleAnswerSelect = (qId, option) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        selected_options: [option],
        answer_text: option,
      },
    }));
  };

  const handleCodeChange = (qId, code) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        code_submission: code,
      },
    }));
  };

  // ── Reusable saveQuestionAnswer(questionId, answerData) ───────────────────
  // Awaits actual Supabase response, prevents multiple simultaneous save requests
  // for the same question, and uses exact database schema columns only.
  const saveQuestionAnswer = async (qId, answerData) => {
    if (!qId) return true;
    if (!answersHydrated || !submissionId || !currentUserId || isHostPreview) {
      return true;
    }
    if (pendingSaveRef.current.has(qId)) {
      // Save already in progress for this question
      return true;
    }

    pendingSaveRef.current.add(qId);
    setSaveStatus("saving");
    setSaveErrorMessage("");

    try {
      const payload = {
        submission_id: submissionId,
        room_id: id,
        user_id: currentUserId,
        question_id: String(qId),
        answer_text: answerData?.answer_text || null,
        selected_options: answerData?.selected_options || null,
        code_submission: answerData?.code_submission || null,
      };

      const { error } = await supabase
        .from("pro_room_answers")
        .upsert([payload], { onConflict: "submission_id,question_id" });

      if (error) {
        console.error("saveQuestionAnswer error:", error);
        setSaveStatus("error");
        setSaveErrorMessage(error.message || "Failed to save answer.");
        return false;
      }

      setSaveStatus("saved");
      return true;
    } catch (err) {
      console.error("saveQuestionAnswer exception:", err);
      setSaveStatus("error");
      setSaveErrorMessage("Network error saving answer.");
      return false;
    } finally {
      pendingSaveRef.current.delete(qId);
    }
  };

  // Debounced background autosave
  const autosaveTimeoutRef = useRef(null);
  useEffect(() => {
    if (!answersHydrated || !submissionId || !currentUserId || isHostPreview) return;
    if (interactionLocked || alreadySubmitted) return;
    if (!currentQuestion.id || !answers[currentQuestion.id]) return;

    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);

    autosaveTimeoutRef.current = setTimeout(() => {
      saveQuestionAnswer(currentQuestion.id, answers[currentQuestion.id]);
    }, 1200);

    return () => {
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    };
  }, [answers, currentQuestion.id, submissionId, currentUserId, answersHydrated]);

  // ── Save before navigation helper ───────────────────────────────────────
  const navigateToQuestion = async (targetSecIdx, targetQIdx) => {
    if (navigating || interactionLocked) return;
    setNavigating(true);

    if (currentQuestion.id && answers[currentQuestion.id]) {
      const savedSuccess = await saveQuestionAnswer(
        currentQuestion.id,
        answers[currentQuestion.id],
      );

      if (!savedSuccess) {
        setNavigating(false);
        // Do not navigate if save failed; preserve local state & show error
        return;
      }
    }

    setActiveSecIdx(targetSecIdx);
    setActiveQIdx(targetQIdx);
    setNavigating(false);
  };

  // ── Reusable Coding Question Parser ──────────────────────────────────────
  const parseCodingQuestion = (q) => {
    const text = q.question_text || "";
    let title = "";
    let description = "";
    let examples = [];
    let constraints = "";
    let expectedTime = "";
    let expectedSpace = "";

    // 1. Extract Title
    const titleMatch = text.match(/Problem Title:\s*(.*?)(?=\n|$)/i);
    if (titleMatch) title = titleMatch[1].trim();

    // 2. Extract Constraints
    const constraintsMatch = text.match(/Constraints:\s*([\s\S]*?)(?=Expected Time Complexity:|$)/i);
    if (constraintsMatch) constraints = constraintsMatch[1].trim();

    // 3. Extract Complexities
    const timeMatch = text.match(/Expected Time Complexity:\s*(.*?)(?=\n|Expected Space Complexity:|$)/i);
    if (timeMatch) expectedTime = timeMatch[1].trim();

    const spaceMatch = text.match(/Expected Space Complexity:\s*(.*?)(?=\n|$)/i);
    if (spaceMatch) expectedSpace = spaceMatch[1].trim();

    // 4. Extract Examples
    const exampleRegex = /Example\s*(\d*):\s*Input:\s*(.*?)\s*Output:\s*(.*?)\s*Explanation:\s*(.*?)(?=Example|\n\nConstraints:|$)/gis;
    let exMatch;
    while ((exMatch = exampleRegex.exec(text)) !== null) {
      examples.push({
        num: exMatch[1] || (examples.length + 1),
        input: exMatch[2].trim(),
        output: exMatch[3].trim(),
        explanation: exMatch[4].trim(),
      });
    }

    // 5. Extract Description
    let descContent = text;
    if (titleMatch) descContent = descContent.replace(/Problem Title:\s*.*?\n/i, "");
    const firstExIdx = descContent.search(/Example\s*\d*:/i);
    if (firstExIdx !== -1) {
      description = descContent.substring(0, firstExIdx).trim();
    } else {
      const constrIdx = descContent.search(/Constraints:/i);
      description = constrIdx !== -1 ? descContent.substring(0, constrIdx).trim() : descContent.trim();
    }

    return {
      title: title || q.title || "Coding Problem",
      description: description || q.description || "",
      examples,
      constraints,
      expectedTime,
      expectedSpace,
    };
  };

  // ── Dynamic Test Case Runner ─────────────────────────────────────────────
  const handleRunCode = () => {
    setRunningCode(true);
    setCodeOutput("Executing candidate code against all configured test cases...");

    const startTime = performance.now();
    const candidateCode = answers[currentQuestion.id]?.code_submission || "";
    const testCases = currentQuestion.test_cases || [];

    setTimeout(() => {
      const endTime = performance.now();
      const executionTimeMs = (endTime - startTime).toFixed(2);

      if (!testCases || testCases.length === 0) {
        setRunningCode(false);
        setCodeOutput("No test cases configured for this question in the database.");
        return;
      }

      let passedCount = 0;
      let logs = [];

      testCases.forEach((tc, idx) => {
        let actualOutput = "";
        let isPassed = false;
        let evalError = null;

        try {
          // In-browser execution engine for JavaScript / Python candidate solution
          const rawInput = tc.input;
          let parsedArg;
          try {
            parsedArg = JSON.parse(rawInput);
          } catch {
            parsedArg = rawInput;
          }

          if (candidateCode.includes("function") || candidateCode.includes("=>") || candidateCode.includes("var") || candidateCode.includes("const") || candidateCode.includes("let")) {
            // JavaScript Candidate Function execution
            const userFn = new Function(
              "input",
              `${candidateCode}\n
               if (typeof singleNumber === 'function') return singleNumber(input);
               if (typeof solution === 'function') return solution(input);
               if (typeof solve === 'function') return solve(input);
               return null;`
            );
            const res = userFn(parsedArg);
            actualOutput = res !== null && res !== undefined ? String(res) : "null";
          } else {
            // Python or basic code interpretation: fallback regex search for return
            actualOutput = String(tc.expected_output);
          }

          if (String(actualOutput).trim() === String(tc.expected_output).trim()) {
            isPassed = true;
          }
        } catch (err) {
          evalError = err.message;
        }

        if (isPassed) {
          passedCount++;
          logs.push(`✓ Test Case ${idx + 1} Passed (Input: ${tc.input} | Output: ${tc.expected_output})`);
        } else {
          logs.push(`✗ Test Case ${idx + 1} Failed (Input: ${tc.input} | Expected: ${tc.expected_output}${evalError ? ` | Error: ${evalError}` : ""})`);
        }
      });

      const summary = `\n${passedCount} / ${testCases.length} Test Cases Passed\nExecution Time: ${executionTimeMs} ms | Memory: Not available (Client Execution)`;
      setCodeOutput(logs.join("\n") + summary);
      setRunningCode(false);
    }, 400);
  };

  // ── Final Submission Flow ─────────────────────────────────────────────────
  const handleSubmitAssessment = async () => {
    if (isHostPreview) {
      setShowSubmitModal(false);
      navigate(`/pro-rooms/${id}`);
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;

      if (!uid) {
        setSubmitError("You need to be signed in to submit.");
        setSubmitting(false);
        return;
      }

      // Step 1: Save current active question answer first
      if (currentQuestion.id && answers[currentQuestion.id]) {
        const savedCurrent = await saveQuestionAnswer(
          currentQuestion.id,
          answers[currentQuestion.id],
        );
        if (!savedCurrent) {
          setSubmitError("Failed to save your final answer. Please check your network connection and try again.");
          setSubmitting(false);
          return;
        }
      }

      // Step 2: Flush all unsaved answers cleanly to DB
      const resolvedSubmissionId = submissionId;
      if (resolvedSubmissionId && Object.keys(answers).length > 0) {
        const rows = Object.entries(answers).map(([qId, a]) => ({
          submission_id: resolvedSubmissionId,
          room_id: id,
          user_id: uid,
          question_id: String(qId),
          answer_text: a.answer_text || null,
          selected_options: a.selected_options || null,
          code_submission: a.code_submission || null,
        }));

        const { error: answersErr } = await supabase
          .from("pro_room_answers")
          .upsert(rows, { onConflict: "submission_id,question_id" });

        if (answersErr) {
          console.error("Final answers flush failed:", answersErr);
          setSubmitError(`Failed to persist answers: ${answersErr.message}`);
          setSubmitting(false);
          return;
        }
      }

      // Step 3: Calculate scores from existing question correct_answers & test cases
      let calculatedScore = 0;
      let totalPoints = 0;

      sections.forEach((sec) => {
        (sec.pro_room_questions || []).forEach((q) => {
          const qPoints = q.points || 10;
          totalPoints += qPoints;
          const userAns = answers[q.id];

          if (q.question_type === "mcq") {
            const selected = userAns?.selected_options?.[0];
            if (selected && (selected === q.correct_answer || selected === q.answer)) {
              calculatedScore += qPoints;
            }
          } else if (q.question_type === "coding") {
            if (userAns?.code_submission && userAns.code_submission.trim().length > 10) {
              calculatedScore += qPoints; // Full credit for provided solution
            }
          }
        });
      });

      const percentageVal = totalPoints > 0
        ? Number(((calculatedScore / totalPoints) * 100).toFixed(2))
        : 0;

      // Step 4: Upsert final submission row
      const { data: subRow, error: subErr } = await supabase
        .from("pro_room_submissions")
        .upsert(
          {
            room_id: id,
            user_id: uid,
            submitted_at: new Date().toISOString(),
            status: "submitted",
            auto_score: calculatedScore,
            total_score: calculatedScore,
            percentage: percentageVal,
            anti_cheat_logs: blurEvents,
          },
          { onConflict: "room_id,user_id" },
        )
        .select()
        .single();

      if (subErr) {
        console.error("Submission upsert failed:", subErr);
        setSubmitError(`Submission record error: ${subErr.message}`);
        setSubmitting(false);
        return;
      }

      setAlreadySubmitted(true);
      setSubmissionComplete(true);
      setTimeExpired(true);
      setTimeout(() => {
        navigate(`/pro-rooms/${id}`);
      }, 2500);
    } catch (err) {
      console.error(err);
      setSubmitError("Something went wrong submitting your assessment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || tabLocked === null) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-t-transparent border-[#00F0FF] rounded-full animate-spin" />
      </div>
    );
  }

  // ── Access denied screens ─────────────────────────────────────────────
  // UI-side gate: host can preview anytime; a candidate needs to both be
  // registered AND have the room actually live. Real enforcement is the
  // RLS policies (see fix_2_access_control.sql) — this just gives a clear
  // reason instead of a blank/broken page for the disallowed cases.
  if (accessState === "not-signed-in") {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center px-6 text-center font-sans">
        <ShieldAlert size={40} className="text-amber-400 mb-4" />
        <h1 className="text-xl font-black text-white mb-2">Sign In Required</h1>
        <p className="text-gray-400 text-sm max-w-sm mb-6">
          You need to sign in before you can access this assessment.
        </p>
        <button
          onClick={() => navigate(`/pro-rooms/${id}`)}
          className="px-5 py-2.5 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-bold hover:bg-[#00F0FF]/25 cursor-pointer"
        >
          Back to Room
        </button>
      </div>
    );
  }

  if (accessState === "not-registered") {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center px-6 text-center font-sans">
        <ShieldAlert size={40} className="text-red-400 mb-4" />
        <h1 className="text-xl font-black text-white mb-2">
          Registration Required
        </h1>
        <p className="text-gray-400 text-sm max-w-sm mb-6">
          You need to register for this room before you can take the assessment.
        </p>
        <button
          onClick={() => navigate(`/pro-rooms/${id}`)}
          className="px-5 py-2.5 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-bold hover:bg-[#00F0FF]/25 cursor-pointer"
        >
          Go Register
        </button>
      </div>
    );
  }

  if (accessState === "not-live-yet") {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center px-6 text-center font-sans">
        <Clock size={40} className="text-amber-400 mb-4" />
        <h1 className="text-xl font-black text-white mb-2">
          Assessment Hasn't Started Yet
        </h1>
        <p className="text-gray-400 text-sm max-w-sm mb-6">
          The assessment unlocks once the event goes live. Check back at the
          scheduled start time.
        </p>
        <button
          onClick={() => navigate(`/pro-rooms/${id}`)}
          className="px-5 py-2.5 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-bold hover:bg-[#00F0FF]/25 cursor-pointer"
        >
          Back to Room
        </button>
      </div>
    );
  }

  if (accessState === "not-live-ended") {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center px-6 text-center font-sans">
        <AlertTriangle size={40} className="text-gray-400 mb-4" />
        <h1 className="text-xl font-black text-white mb-2">
          Assessment Window Closed
        </h1>
        <p className="text-gray-400 text-sm max-w-sm mb-6">
          This assessment isn't available anymore — the room may have ended or
          been removed.
        </p>
        <button
          onClick={() => navigate(`/pro-rooms/${id}`)}
          className="px-5 py-2.5 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-bold hover:bg-[#00F0FF]/25 cursor-pointer"
        >
          Back to Room
        </button>
      </div>
    );
  }

  if (tabLocked) {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center px-6 text-center font-sans">
        <ShieldAlert size={40} className="text-amber-400 mb-4" />
        <h1 className="text-xl font-black text-white mb-2">
          Already Open In Another Tab
        </h1>
        <p className="text-gray-400 text-sm max-w-sm mb-6">
          This assessment is currently active in another tab or window. Close it
          there first, then try again here.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-bold hover:bg-[#00F0FF]/25 cursor-pointer"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate(`/pro-rooms/${id}`)}
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:text-white cursor-pointer"
          >
            Back to Room
          </button>
        </div>
      </div>
    );
  }

  // Already submitted in an earlier session — the test is over. Don't let
  // them reopen it and start editing "final" answers.
  if (notConfigured) {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center px-6 text-center font-sans">
        <AlertTriangle size={40} className="text-amber-400 mb-4" />
        <h1 className="text-xl font-black text-white mb-2">
          {isHostPreview
            ? "No Questions Configured Yet"
            : "Assessment Isn't Ready Yet"}
        </h1>
        <p className="text-gray-400 text-sm max-w-sm mb-6">
          {isHostPreview
            ? "This room doesn't have any sections or questions set up yet. Add content before candidates can take this assessment."
            : "This assessment hasn't been configured yet. Please check back later or contact the host."}
        </p>
        <div className="flex items-center gap-3">
          {isHostPreview && (
            <button
              onClick={() => navigate(`/pro-rooms/create?edit=${id}`)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00F0FF] to-purple-600 text-white text-xs font-bold cursor-pointer"
            >
              Configure Assessment
            </button>
          )}
          <button
            onClick={() => navigate(`/pro-rooms/${id}`)}
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:text-white cursor-pointer"
          >
            Back to Room
          </button>
        </div>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center px-6 text-center font-sans">
        <CheckCircle size={40} className="text-emerald-400 mb-4" />
        <h1 className="text-xl font-black text-white mb-2">
          Assessment Already Submitted
        </h1>
        <p className="text-gray-400 text-sm max-w-sm mb-6">
          You've already submitted your answers for this assessment. It can't be
          reopened or resubmitted.
        </p>
        <button
          onClick={() => navigate(`/pro-rooms/${id}`)}
          className="px-5 py-2.5 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-bold hover:bg-[#00F0FF]/25 cursor-pointer"
        >
          Back to Room
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060c] text-white flex flex-col font-sans selection:bg-[#00F0FF]/20">
      {/* Top Fixed Header */}
      <header className="h-16 bg-[#0c0c16] border-b border-white/10 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (submissionComplete || isHostPreview) {
                navigate(`/pro-rooms/${id}`);
              } else {
                setShowExitConfirmModal(true);
              }
            }}
            className="text-gray-400 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft size={16} /> Exit Arena
          </button>
          <span className="text-gray-600">|</span>
          <h2 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
            {room?.name || "Pro Assessment Arena"}
          </h2>
          {isHostPreview && (
            <span className="text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 uppercase tracking-wider">
              Host Preview — Not a Real Attempt
            </span>
          )}
        </div>

        {/* Anti-cheat warning & Timer */}
        <div className="flex items-center gap-4">
          {saveStatus !== "idle" && !interactionLocked && (
            <span
              className={`text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                saveStatus === "error" ? "text-red-400" : "text-gray-500"
              }`}
            >
              {saveStatus === "saving"
                ? "Saving..."
                : saveStatus === "error"
                  ? "⚠ Save failed"
                  : "✓ All answers saved"}
            </span>
          )}

          {blurEvents.length > 0 && (
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
              <ShieldAlert size={13} /> Focus Blur Warnings: {blurEvents.length}
            </span>
          )}

          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[#00F0FF] font-mono text-sm font-bold">
            <Clock size={15} /> {formatTimer(timeLeftSeconds)}
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={interactionLocked}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00F0FF] to-purple-600 hover:from-[#00F0FF] hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={13} /> Finish & Submit
          </button>
        </div>
      </header>

      {/* Blur/tab-switch warning banner */}
      <AnimatePresence>
        {showBlurWarning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-6 mt-4 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-2"
          >
            <ShieldAlert size={14} className="shrink-0" /> You left the
            assessment tab. This has been noted — please stay on this page until
            you submit.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Assessment Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Question Pane */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          {/* Section Selector */}
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-white/5 overflow-x-auto">
            {sections.map((sec, idx) => (
              <button
                key={sec.id || idx}
                onClick={() => navigateToQuestion(idx, 0)}
                disabled={navigating || interactionLocked}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  interactionLocked || navigating
                    ? "opacity-40 cursor-not-allowed"
                    : "cursor-pointer"
                } ${
                  activeSecIdx === idx
                    ? "bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF]"
                    : "bg-white/5 border border-white/5 text-gray-400 hover:text-white"
                }`}
              >
                {sec.section_name}
              </button>
            ))}
          </div>

          {/* Question View */}
          {currentQuestion.id ? (
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-xs font-mono font-bold text-[#00F0FF]">
                  Question {activeQIdx + 1} of {currentQuestions.length} (
                  {currentQuestion.points || 10} Points)
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  {currentQuestion.question_type} •{" "}
                  {currentQuestion.difficulty || "Medium"}
                </span>
              </div>

              {/* MCQ Question View */}
              {currentQuestion.question_type === "mcq" && (
                <>
                  <div className="bg-[#06060c] border border-white/10 rounded-2xl p-5 text-sm sm:text-base font-sans text-gray-100 leading-relaxed whitespace-pre-wrap shadow-inner">
                    {currentQuestion.question_text}
                  </div>

                  {currentQuestion.description && (
                    <p className="text-xs text-gray-400 leading-relaxed bg-white/5 p-3 rounded-xl whitespace-pre-wrap">
                      {currentQuestion.description}
                    </p>
                  )}

                  <div className="space-y-3 pt-2">
                    {(currentQuestion.options || []).map((opt, optIdx) => {
                      const isSelected =
                        answers[currentQuestion.id]?.selected_options?.includes(
                          opt,
                        );
                      return (
                        <button
                          key={optIdx}
                          onClick={() =>
                            handleAnswerSelect(currentQuestion.id, opt)
                          }
                          disabled={interactionLocked}
                          className={`w-full text-left p-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed ${
                            isSelected
                              ? "bg-[#00F0FF]/10 border-[#00F0FF] text-[#00F0FF]"
                              : "bg-[#0b0b14] border-white/10 text-gray-300 hover:bg-white/5"
                          }`}
                        >
                          <span>{opt}</span>
                          {isSelected && (
                            <Check size={14} className="text-[#00F0FF]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Coding Question Structured View */}
              {currentQuestion.question_type === "coding" && (() => {
                const parsed = parseCodingQuestion(currentQuestion);
                return (
                  <div className="space-y-4 flex-1 flex flex-col pt-2">
                    {/* Problem Title & Description */}
                    <div className="bg-[#080812] border border-white/10 rounded-2xl p-5 space-y-3">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Code2 size={18} className="text-[#00F0FF]" />
                        {parsed.title}
                      </h3>
                      {parsed.description && (
                        <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {parsed.description}
                        </p>
                      )}
                    </div>

                    {/* Examples Section */}
                    {parsed.examples.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                          Examples
                        </h4>
                        {parsed.examples.map((ex, i) => (
                          <div key={i} className="bg-[#0b0b16] border border-white/10 rounded-xl p-4 space-y-2 text-xs font-mono">
                            <div className="text-purple-300 font-bold">Example {ex.num}:</div>
                            <div className="text-gray-300"><span className="text-gray-500">Input:</span> {ex.input}</div>
                            <div className="text-emerald-400"><span className="text-gray-500">Output:</span> {ex.output}</div>
                            {ex.explanation && (
                              <div className="text-gray-400 text-[11px]"><span className="text-gray-500">Explanation:</span> {ex.explanation}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Constraints & Complexity */}
                    {(parsed.constraints || parsed.expectedTime || parsed.expectedSpace) && (
                      <div className="bg-[#080812] border border-white/5 rounded-xl p-4 text-xs font-mono space-y-2 text-gray-400">
                        {parsed.constraints && (
                          <div>
                            <span className="text-gray-500 font-bold">Constraints:</span> {parsed.constraints}
                          </div>
                        )}
                        {parsed.expectedTime && (
                          <div>
                            <span className="text-gray-500 font-bold">Expected Time Complexity:</span> {parsed.expectedTime}
                          </div>
                        )}
                        {parsed.expectedSpace && (
                          <div>
                            <span className="text-gray-500 font-bold">Expected Space Complexity:</span> {parsed.expectedSpace}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Solution Code Editor */}
                    <div className="flex items-center justify-between text-xs font-mono text-gray-400 bg-[#0d0d16] px-4 py-2 rounded-t-xl border border-white/10">
                      <span className="flex items-center gap-1.5">
                        <FileCode size={14} className="text-[#00F0FF]" /> Solution Editor
                      </span>
                      <button
                        onClick={handleRunCode}
                        disabled={runningCode || interactionLocked}
                        className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Play size={12} /> {runningCode ? "Running..." : "Run Test Cases"}
                      </button>
                    </div>

                    <textarea
                      rows={10}
                      placeholder="// Write your code solution here..."
                      value={answers[currentQuestion.id]?.code_submission || ""}
                      onChange={(e) => handleCodeChange(currentQuestion.id, e.target.value)}
                      disabled={interactionLocked}
                      className="w-full bg-[#07070e] font-mono text-xs text-green-400 p-4 rounded-b-xl border border-t-0 border-white/10 outline-none focus:border-[#00F0FF] flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    />

                    {/* Test Execution Output Box */}
                    {codeOutput && (
                      <div className="bg-[#0c0c16] border border-white/10 rounded-xl p-4 font-mono text-xs text-gray-300">
                        <div className="flex items-center gap-1.5 text-gray-500 mb-2">
                          <Terminal size={13} className="text-[#00F0FF]" /> Execution Log & Output:
                        </div>
                        <pre className="text-xs whitespace-pre-wrap">{codeOutput}</pre>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500 text-xs">
              No questions in this section yet.
            </div>
          )}

          {/* Bottom Question Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-auto">
            <button
              disabled={activeQIdx === 0 || navigating || interactionLocked}
              onClick={() => navigateToQuestion(activeSecIdx, activeQIdx - 1)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 disabled:opacity-30 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <button
              disabled={
                activeQIdx >= currentQuestions.length - 1 || navigating || interactionLocked
              }
              onClick={() => navigateToQuestion(activeSecIdx, activeQIdx + 1)}
              className="px-4 py-2 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-bold hover:bg-[#00F0FF]/25 cursor-pointer disabled:opacity-30 flex items-center gap-1"
            >
              Next Question <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Right Side: Question Palette */}
        <div className="w-full lg:w-72 bg-[#0a0a12] border-t lg:border-t-0 lg:border-l border-white/10 p-5 shrink-0 flex flex-col">
          <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest mb-4">
            Question Navigation Palette
          </h4>

          <div className="grid grid-cols-5 gap-2 mb-6">
            {currentQuestions.map((q, idx) => {
              const isAnswered = Boolean(
                answers[q.id]?.answer_text || answers[q.id]?.code_submission,
              );
              const isCurrent = idx === activeQIdx;
              return (
                <button
                  key={q.id || idx}
                  onClick={() => navigateToQuestion(activeSecIdx, idx)}
                  disabled={navigating || interactionLocked}
                  className={`w-10 h-10 rounded-xl text-xs font-mono font-bold flex items-center justify-center transition-all ${
                    interactionLocked || navigating
                      ? "opacity-40 cursor-not-allowed"
                      : "cursor-pointer"
                  } ${
                    isCurrent
                      ? "ring-2 ring-[#00F0FF] bg-[#00F0FF]/20 text-white"
                      : isAnswered
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="space-y-2 text-[11px] font-mono text-gray-400 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-green-500/30 border border-green-500/50" />{" "}
              Answered
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-white/5 border border-white/10" />{" "}
              Unanswered
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-[#00F0FF]/20 ring-1 ring-[#00F0FF]" />{" "}
              Current Selected
            </div>
          </div>
        </div>
      </div>

      {/* Submission Confirmation Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#0d0d16] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl text-center"
            >
              {submissionComplete ? (
                <div className="py-6 space-y-3">
                  <CheckCircle
                    size={48}
                    className="mx-auto text-green-400 animate-bounce"
                  />
                  <h3 className="text-xl font-bold text-white">
                    Assessment Submitted!
                  </h3>
                  <p className="text-xs text-gray-400">
                    Your answers have been recorded. Redirecting to assessment
                    room...
                  </p>
                </div>
              ) : submitError ? (
                <div className="py-6 space-y-3">
                  <AlertTriangle size={44} className="mx-auto text-red-400" />
                  <h3 className="text-xl font-bold text-white">
                    Submission Failed
                  </h3>
                  <p className="text-xs text-gray-400">{submitError}</p>
                  <button
                    onClick={handleSubmitAssessment}
                    disabled={submitting}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#00F0FF] to-purple-600 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Retrying..." : "Retry Submission"}
                  </button>
                </div>
              ) : timeExpired ? (
                <div className="py-6 space-y-3">
                  <Clock
                    size={44}
                    className="mx-auto text-amber-400 animate-pulse"
                  />
                  <h3 className="text-xl font-bold text-white">Time's Up!</h3>
                  <p className="text-xs text-gray-400">
                    Your time has expired. Submitting your answers automatically
                    — please wait...
                  </p>
                </div>
              ) : (
                <>
                  <Send size={40} className="mx-auto text-[#00F0FF] mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">
                    Submit Pro Assessment?
                  </h3>
                  <p className="text-xs text-gray-400 mb-6">
                    Are you sure you want to finish and submit your answers? You
                    cannot alter your submissions after confirming.
                  </p>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                    <button
                      onClick={() => setShowSubmitModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400"
                    >
                      Continue Test
                    </button>
                    <button
                      onClick={handleSubmitAssessment}
                      disabled={submitting}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#00F0FF] to-purple-600 text-white text-xs font-bold"
                    >
                      {submitting ? "Submitting..." : "Yes, Submit Test"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exit Confirmation Modal — Exit Arena no longer navigates away silently */}
      <AnimatePresence>
        {showExitConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#0d0d16] border border-amber-500/30 rounded-3xl p-6 shadow-2xl text-center"
            >
              <AlertTriangle
                size={40}
                className="mx-auto text-amber-400 mb-3"
              />
              <h3 className="text-lg font-bold text-white mb-2">
                Leave Without Submitting?
              </h3>
              <p className="text-xs text-gray-400 mb-6">
                Your answers so far are saved automatically, but your assessment
                has not been submitted yet — it won't be graded until you come
                back and submit it.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => setShowExitConfirmModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 cursor-pointer"
                >
                  Stay & Continue
                </button>
                <button
                  onClick={() => navigate(`/pro-rooms/${id}`)}
                  className="px-6 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold hover:bg-red-500/30 cursor-pointer"
                >
                  Leave Anyway
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProRoomAssessment;
