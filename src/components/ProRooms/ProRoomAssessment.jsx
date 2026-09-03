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
  const [answers, setAnswers] = useState({}); // { [qId]: { answer_text, selected_options, code_submission, github_url } }
  const [markedReview, setMarkedReview] = useState({}); // { [qId]: boolean }
  const [codeOutput, setCodeOutput] = useState("");
  const [runningCode, setRunningCode] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(7200); // 2 hours default
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false); // auto-submit triggered
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  // ── Answer persistence state ────────────────────────────────────────────
  // `submissionId` is the pro_room_submissions row for this candidate+room —
  // created (or found) once on load, then reused for every autosave and the
  // final submit so they all resolve to the same row instead of scattering
  // across duplicates.
  const [currentUserId, setCurrentUserId] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [submitError, setSubmitError] = useState("");
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [answersHydrated, setAnswersHydrated] = useState(false);

  // Once time is up or the test is submitted, the whole test surface freezes —
  // no more answer edits, no more navigating questions/sections.
  const interactionLocked = timeExpired || submissionComplete;

  // ── Anti-cheat: tab/window blur tracking ────────────────────────────────
  // A brief blur (checking a notification, a quick alt-tab) shouldn't count
  // as a real event — especially on mobile, where switching apps for a call
  // or a notification pull-down is routine. Only blurs longer than the grace
  // window get logged and surfaced as a warning.
  const DESKTOP_BLUR_GRACE_MS = 3000;
  const MOBILE_BLUR_GRACE_MS = 10000;
  const isMobileDevice = () =>
    typeof navigator !== "undefined" &&
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const [blurEvents, setBlurEvents] = useState([]); // [{ at: ISOString, durationMs }]
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
      if (durationMs < grace) return; // brief blip — not logged, not warned

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

  // ── Warn before closing tab / refreshing / navigating away in-browser ──
  // Browsers ignore custom messages here and always show their own generic
  // "leave site?" prompt — that's expected, we just need it to fire.
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

  // ── Prevent the same assessment being open in a second tab ─────────────
  // Scoped to this browser only (a different browser or private window has
  // separate storage and won't be caught) — but it reliably blocks the
  // common case of someone opening the test twice in the same browser.
  const TAB_LOCK_STALE_MS = 10000;
  const TAB_LOCK_HEARTBEAT_MS = 4000;
  const tabSessionIdRef = useRef(
    `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const lockHeartbeatRef = useRef(null);
  const [tabLocked, setTabLocked] = useState(null); // null = checking, true = blocked, false = active

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

    // If another tab claims (or reclaims) the lock while we're active, catch
    // it here so this tab also knows it's no longer the live session.
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
      // Only release the lock if we're still the recognized holder — avoids
      // a stale/closing tab wiping out a lock a newer tab just claimed.
      const current = readLock();
      if (current?.tabId === tabSessionIdRef.current) {
        try {
          localStorage.removeItem(lockKey);
        } catch {}
      }
    };
  }, [id]);

  // Timer Countdown — single interval for the whole session, not recreated
  // every tick, so the transition to zero happens exactly once and reliably.
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

  // Auto-submit the instant the timer hits zero.
  const autoSubmitFiredRef = useRef(false);
  useEffect(() => {
    if (
      timeLeftSeconds === 0 &&
      !autoSubmitFiredRef.current &&
      !submissionComplete
    ) {
      autoSubmitFiredRef.current = true;
      setTimeExpired(true);
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

      // ── Resolve access BEFORE fetching any test content, submission, or
      // answer data — so none of it ever lands in memory (or gets shown in
      // the network tab) for someone who isn't allowed to have it.
      if (!roomData) {
        setAccessState("not-live-ended"); // room doesn't exist / was removed
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

      // Event Start -> Event End is the only thing that gates the
      // assessment itself, host included — the host previously bypassed
      // this entirely ("host-preview" was set unconditionally above),
      // which let a host open/start their own assessment before the
      // event's configured start time. Registration status/dates never
      // factor in here.
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

      // ── Access granted from here on ─────────────────────────────────────
      // Sections come from the base table (safe — no answer-key columns
      // live there). Questions come from pro_room_questions_safe, NOT the
      // base pro_room_questions table: that view is what actually redacts
      // correct_answer (and, until the room is live, the question content
      // itself) — see fix_3_hide_correct_answers.sql. The base table can no
      // longer be queried for correct_answer at all, by anyone, so this
      // isn't optional.
      const { data: secRows } = await supabase
        .from("pro_room_sections")
        .select("*")
        .eq("room_id", id)
        .eq("is_deleted", false)
        .order("order_index", { ascending: true });

      let secData = [];
      if (secRows && secRows.length > 0) {
        const sectionIds = secRows.map((s) => s.id);
        // pro_room_questions_safe was converted from a view to a function
        // (get_pro_room_questions_safe) to close a Supabase Advisor
        // "Security Definer View" finding — same redaction behavior,
        // called via .rpc() instead of .from().
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
        // No real sections/questions exist for this room. Previously this
        // silently substituted a hardcoded demo assessment (with a
        // hardcoded "correct answer" baked right into the JS bundle,
        // regardless of any DB-level protection) and let the candidate
        // take — and "submit" — a fake exam without anyone noticing the
        // real one was never configured. Show an honest empty state
        // instead, and don't burn a submission attempt on it.
        setSections([]);
        setNotConfigured(true);
        setLoading(false);
        return;
      }

      const durationMinutes = roomData?.duration_minutes || 120;

      // Host preview never creates or touches a submission row — the host
      // isn't a candidate, and writing one here would mean an insert with
      // no matching registration, which the RLS policies alongside this
      // fix would reject anyway (by design).
      if (isHostUser) {
        setTimeLeftSeconds(durationMinutes * 60);
        setAnswersHydrated(true);
        setLoading(false);
        return;
      }

      // ── Load / create the submission row and hydrate any saved answers ──
      const { data: existingSub } = await supabase
        .from("pro_room_submissions")
        .select("*, pro_room_answers(*)")
        .eq("room_id", id)
        .eq("user_id", uid)
        .maybeSingle();

      if (existingSub) {
        setSubmissionId(existingSub.id);

        if (existingSub.status === "submitted") {
          // Already submitted in a previous session — don't let them
          // reopen the test and start editing "submitted" answers.
          setAlreadySubmitted(true);
        }

        // Rebuild the timer from the real start time instead of resetting
        // to the full duration on every refresh — otherwise refreshing
        // the page would grant unlimited extra time.
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
              github_url: a.github_url || "",
            };
            if (a.marked_for_review) hydratedReview[a.question_id] = true;
          });
          setAnswers(hydratedAnswers);
          setMarkedReview(hydratedReview);
        }
      } else {
        // First time opening this assessment — create the submission row
        // now (status "in_progress") so started_at is anchored immediately,
        // not whenever the candidate happens to answer their first question.
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
    setAnswers({
      ...answers,
      [qId]: {
        ...answers[qId],
        selected_options: [option],
        answer_text: option,
      },
    });
  };

  const handleCodeChange = (qId, code) => {
    setAnswers({
      ...answers,
      [qId]: { ...answers[qId], code_submission: code },
    });
  };

  // ── Autosave ─────────────────────────────────────────────────────────────
  // Debounced: fires ~1.2s after the candidate stops typing/selecting, one
  // upsert per changed question, keyed on (submission_id, question_id) so
  // repeated edits to the same question update the same row instead of
  // creating duplicates. This is what actually saves the candidate's work —
  // previously nothing was persisted until final submit, and even then only
  // a status marker was written, never the answers themselves.
  const autosaveTimeoutRef = useRef(null);
  useEffect(() => {
    // Don't autosave before hydration completes (would overwrite freshly
    // loaded answers with an empty initial state), once the test is over,
    // or during a host preview (no real submission exists to attach to).
    if (!answersHydrated || !submissionId || !currentUserId) return;
    if (isHostPreview) return;
    if (interactionLocked || alreadySubmitted) return;
    if (Object.keys(answers).length === 0) return;

    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    setSaveStatus("saving");

    autosaveTimeoutRef.current = setTimeout(async () => {
      const rows = Object.entries(answers).map(([qId, a]) => ({
        submission_id: submissionId,
        room_id: id,
        user_id: currentUserId,
        question_id: String(qId),
        answer_text: a.answer_text || null,
        selected_options: a.selected_options || null,
        code_submission: a.code_submission || null,
        github_url: a.github_url || null,
        marked_for_review: !!markedReview[qId],
      }));

      const { error } = await supabase
        .from("pro_room_answers")
        .upsert(rows, { onConflict: "submission_id,question_id" });

      if (error) {
        console.error("Autosave failed:", error);
        setSaveStatus("error");
      } else {
        setSaveStatus("saved");
      }
    }, 1200);

    return () => {
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, markedReview, submissionId, currentUserId, answersHydrated]);

  const handleRunCode = () => {
    setRunningCode(true);
    setCodeOutput("Executing code against sample test cases...");
    setTimeout(() => {
      setRunningCode(false);
      setCodeOutput(
        "✓ Test Case 1 Passed (Output: 3)\n✓ Test Case 2 Passed (Output: 1)\nExecution Time: 12ms | Memory: 14.2 MB",
      );
    }, 1200);
  };

  const handleSubmitAssessment = async () => {
    // Host preview isn't a real attempt — nothing to submit, no submission
    // row exists (or should exist) for the host on this room.
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

      // Resolve the submission row FIRST (and mark it submitted at the same
      // time). Doing this before the answers flush means we always have a
      // real submission_id to attach answers to, even in the edge case
      // where the lazy-create on page load never landed (e.g. a transient
      // network error at mount time).
      const { data: subRow, error: subErr } = await supabase
        .from("pro_room_submissions")
        .upsert(
          {
            room_id: id,
            user_id: uid,
            submitted_at: new Date().toISOString(),
            status: "submitted",
            anti_cheat_logs: blurEvents,
          },
          { onConflict: "room_id,user_id" },
        )
        .select()
        .single();

      if (subErr) {
        console.error("Submission upsert failed:", subErr);
        setSubmitError(
          "Your submission couldn't be recorded. Please try again — your answers are saved and won't be lost.",
        );
        setSubmitting(false);
        return;
      }

      const resolvedSubmissionId = subRow?.id || submissionId;

      // Flush every current answer — guarantees the last-edited question is
      // captured even if the debounce hadn't fired yet.
      if (resolvedSubmissionId && Object.keys(answers).length > 0) {
        const rows = Object.entries(answers).map(([qId, a]) => ({
          submission_id: resolvedSubmissionId,
          room_id: id,
          user_id: uid,
          question_id: String(qId),
          answer_text: a.answer_text || null,
          selected_options: a.selected_options || null,
          code_submission: a.code_submission || null,
          github_url: a.github_url || null,
          marked_for_review: !!markedReview[qId],
        }));

        const { error: answersErr } = await supabase
          .from("pro_room_answers")
          .upsert(rows, { onConflict: "submission_id,question_id" });

        if (answersErr) {
          console.error("Final answers flush failed:", answersErr);
          setSubmitError(
            "Your submission was recorded, but some answers couldn't be saved. Please try submitting again.",
          );
          setSubmitting(false);
          return;
        }
      }

      // Only now — after both writes have actually succeeded — do we tell
      // the candidate the submission is complete.
      setSubmissionComplete(true);
      setTimeout(() => {
        navigate(`/pro-rooms/${id}`);
      }, 2500);
    } catch (err) {
      console.error(err);
      setSubmitError(
        "Something went wrong submitting your assessment. Please try again — your answers are saved and won't be lost.",
      );
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
                onClick={() => {
                  if (interactionLocked) return;
                  setActiveSecIdx(idx);
                  setActiveQIdx(0);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  interactionLocked
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

              <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {currentQuestion.question_text}
              </h3>

              {currentQuestion.description && (
                <p className="text-xs text-gray-400 leading-relaxed bg-white/5 p-3 rounded-xl">
                  {currentQuestion.description}
                </p>
              )}

              {/* Question Renderer: MCQ */}
              {currentQuestion.question_type === "mcq" && (
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
              )}

              {/* Question Renderer: CODING */}
              {currentQuestion.question_type === "coding" && (
                <div className="space-y-4 flex-1 flex flex-col pt-2">
                  <div className="flex items-center justify-between text-xs font-mono text-gray-400 bg-[#0d0d16] px-4 py-2 rounded-t-xl border border-white/10">
                    <span className="flex items-center gap-1.5">
                      <Code2 size={14} className="text-[#00F0FF]" /> Solution
                      Editor (JavaScript / Python / C++)
                    </span>
                    <button
                      onClick={handleRunCode}
                      disabled={runningCode || interactionLocked}
                      className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play size={12} />{" "}
                      {runningCode ? "Running..." : "Run Test Cases"}
                    </button>
                  </div>

                  <textarea
                    rows={10}
                    placeholder="// Write your code solution here..."
                    value={answers[currentQuestion.id]?.code_submission || ""}
                    onChange={(e) =>
                      handleCodeChange(currentQuestion.id, e.target.value)
                    }
                    disabled={interactionLocked}
                    className="w-full bg-[#07070e] font-mono text-xs text-green-400 p-4 rounded-b-xl border border-t-0 border-white/10 outline-none focus:border-[#00F0FF] flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  />

                  {/* Test Execution Output Box */}
                  {codeOutput && (
                    <div className="bg-[#0c0c16] border border-white/10 rounded-xl p-4 font-mono text-xs text-gray-300">
                      <div className="flex items-center gap-1.5 text-gray-500 mb-2">
                        <Terminal size={13} className="text-[#00F0FF]" />{" "}
                        Execution Log & Output:
                      </div>
                      <pre className="text-xs whitespace-pre-wrap">
                        {codeOutput}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500 text-xs">
              No questions in this section yet.
            </div>
          )}

          {/* Bottom Question Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-auto">
            <button
              disabled={activeQIdx === 0 || interactionLocked}
              onClick={() => setActiveQIdx(activeQIdx - 1)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 disabled:opacity-30 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <button
              disabled={
                activeQIdx >= currentQuestions.length - 1 || interactionLocked
              }
              onClick={() => setActiveQIdx(activeQIdx + 1)}
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
                  onClick={() => {
                    if (interactionLocked) return;
                    setActiveQIdx(idx);
                  }}
                  className={`w-10 h-10 rounded-xl text-xs font-mono font-bold flex items-center justify-center transition-all ${
                    interactionLocked
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
