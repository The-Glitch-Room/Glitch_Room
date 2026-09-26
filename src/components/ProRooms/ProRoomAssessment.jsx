import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle,
  XCircle,
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
import CustomSelect from "../CustomSelect";

// Real code editor — replaces the plain <textarea>. Requires:
//   npm install @uiw/react-codemirror @uiw/codemirror-theme-vscode
//              @codemirror/lang-javascript @codemirror/lang-python
//              @codemirror/lang-cpp @codemirror/lang-java
//              @codemirror/lint @codemirror/language
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { linter, lintGutter } from "@codemirror/lint";
import { syntaxTree } from "@codemirror/language";

// Human-readable labels for the type badge — matches CreateProRoomPage.jsx's
// QUESTION_TYPES list exactly, so what the host picked is what the
// candidate sees (not the raw internal type string like "file_upload").
const QUESTION_TYPE_LABELS = {
  mcq: "Multiple Choice",
  msq: "Multiple Select",
  true_false: "True / False",
  short_answer: "Short Answer",
  coding: "Coding Problem",
  sql: "SQL Query",
  debugging: "Debugging Challenge",
  output_pred: "Output Prediction",
  code_analysis: "Code Analysis",
  file_upload: "File Upload / GitHub URL",
  project: "Project Submission",
  video: "Video Submission",
};

const LANGUAGE_EXTENSIONS = {
  javascript: javascript(),
  python: python(),
  cpp: cpp(),
  java: java(),
};

// Generic full-program starter skeletons (stdin -> stdout), since no
// per-problem starter code is stored in the DB — this is a per-language
// template, not a per-problem one. If you want real per-problem starters
// later, that needs a `starter_code jsonb` column on pro_room_questions and
// a host-side field to author it; this is the honest version of "if
// possible" without that.
const STARTER_CODE = {
  javascript: `// Read input from stdin, write your answer to stdout.
const readline = require('readline').createInterface({ input: process.stdin });
let inputLines = [];
readline.on('line', (line) => inputLines.push(line));
readline.on('close', () => {
  const input = inputLines.join('\\n');
  // TODO: parse \`input\` and compute your answer
  console.log(/* your answer */);
});
`,
  python: `import sys

def main():
    data = sys.stdin.read()
    # TODO: parse \`data\` and compute your answer
    print()  # your answer

if __name__ == "__main__":
    main()
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // TODO: read input with cin, compute your answer
    // cout << answer << endl;
    return 0;
}
`,
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // TODO: read input with sc, compute your answer
        // System.out.println(answer);
    }
}
`,
};

// Generic, language-agnostic syntax-error detection. Works off the CodeMirror
// language extension's own parser (lezer) rather than a per-language linter
// (ESLint et al. would mean a much heavier, per-language dependency set) —
// it flags nodes the grammar itself couldn't parse. This catches real
// structural mistakes (unmatched brackets, malformed statements) but is not
// a semantic linter — it won't catch a misspelled variable name, only
// things that don't parse as valid syntax at all.
const syntaxErrorLinter = linter((view) => {
  const diagnostics = [];
  const tree = syntaxTree(view.state);
  tree.iterate({
    enter: (node) => {
      if (node.type.isError) {
        diagnostics.push({
          from: node.from,
          to: node.to === node.from ? node.from + 1 : node.to,
          severity: "error",
          message: "Syntax error",
        });
      }
    },
  });
  return diagnostics;
});

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
  const [runResults, setRunResults] = useState(null);
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

  // Auto-submit on timer expiry.
  // dataLoadedRef guards against the race where fetchAssessmentData sets
  // timeLeftSeconds = 0 (because the candidate's time already ran out in a
  // previous session) BEFORE the effect has had a chance to check the DB
  // status. Without this guard, reopening a timed-out in_progress attempt
  // would immediately trigger another submission attempt the instant the
  // page loaded, showing the "Submitting…" modal with no way out.
  const autoSubmitFiredRef = useRef(false);
  const dataLoadedRef = useRef(false);
  useEffect(() => {
    if (
      timeLeftSeconds === 0 &&
      !autoSubmitFiredRef.current &&
      !submissionComplete &&
      dataLoadedRef.current   // only after DB data is fully loaded
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
          setAccessState(
            regRow?.status === "pending"
              ? "pending-approval"
              : "not-registered",
          );
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

        if (existingSub.status === "submitted" || existingSub.status === "graded" || existingSub.status === "pending_review") {
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

        if (Array.isArray(existingSub.pro_room_answers) && existingSub.pro_room_answers.length > 0) {
          const hydratedAnswers = {};
          const hydratedReview = {};
          existingSub.pro_room_answers.forEach((a) => {
            hydratedAnswers[a.question_id] = {
              answer_text: a.answer_text || "",
              selected_options: a.selected_options || [],
              code_submission: a.code_submission || "",
              code_language: a.code_language || "javascript",
              last_run_passed_count: a.last_run_passed_count,
              last_run_results: a.last_run_results,
              last_run_at: a.last_run_at,
            };
            if (a.marked_for_review) hydratedReview[a.question_id] = true;
          });
          setAnswers(hydratedAnswers);
          setMarkedReview(hydratedReview);
        } else {
          // If DB has no answers saved yet, recover from local storage backup
          try {
            const cached = localStorage.getItem(`glitch_assessment_answers_${id}_${uid}`);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
                console.log("[Assessment] Restored answers from local cache backup");
                setAnswers(parsed);
              }
            }
          } catch (e) {
            console.warn("Could not read local answer cache:", e);
          }
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

        // Check local storage backup for newly initialized submission
        try {
          const cached = localStorage.getItem(`glitch_assessment_answers_${id}_${uid}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
              setAnswers(parsed);
            }
          }
        } catch (e) {}

        setTimeLeftSeconds(durationMinutes * 60);
      }

      setAnswersHydrated(true);
    } catch (err) {
      console.error(err);
    } finally {
      // Signal to the auto-submit effect that real DB data is now loaded.
      // This prevents the timer effect from firing a submission the instant
      // the page mounts (before we know the real time remaining from the DB).
      dataLoadedRef.current = true;
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

  // MSQ: toggles one option in/out of a multi-value selection, instead of
  // replacing the whole selection like single-select MCQ/True-False does.
  // Stored as a JSON array of the selected option strings — matches exactly
  // what grade_pro_room_submission's msq auto-grade block expects
  // (jsonb_array_elements_text(a.selected_options)).
  const handleMultiSelectToggle = (qId, option) => {
    setAnswers((prev) => {
      const current = prev[qId]?.selected_options || [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return {
        ...prev,
        [qId]: {
          ...prev[qId],
          selected_options: next,
          answer_text: next.join(", "),
        },
      };
    });
  };

  // short_answer / output_pred / file_upload / project / video: all just
  // need a free-text value saved to answer_text. grade_pro_room_submission
  // auto-grades short_answer/output_pred by comparing this (case/whitespace
  // -insensitive) against correct_answer; file_upload/project/video are
  // intentionally never auto-graded (no correct_answer concept for a URL or
  // video submission) and always fall to manual host review.
  const handleTextAnswerChange = (qId, text) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        answer_text: text,
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

  const handleLanguageChange = (qId, code_language) => {
    setAnswers((prev) => {
      const current = prev[qId] || {};
      const currentCode = current.code_submission || "";
      const prevLang = current.code_language || "javascript";
      // Only auto-swap in the new starter if the candidate hasn't actually
      // written anything of their own yet (still empty, or still exactly the
      // previous language's unmodified starter) — never overwrite real code.
      const isUntouched =
        !currentCode.trim() || currentCode === STARTER_CODE[prevLang];
      return {
        ...prev,
        [qId]: {
          ...current,
          code_language,
          code_submission: isUntouched
            ? STARTER_CODE[code_language] || ""
            : currentCode,
        },
      };
    });
  };

  // Auto-fill a starter skeleton the first time a coding question is opened
  // with no code written yet, for whatever language is currently selected
  // (default javascript). Never touches a question that already has code.
  // Clear stale run results whenever the candidate navigates to a different
  // question — otherwise the previous question's pass/fail results would
  // still show under a different problem entirely.
  useEffect(() => {
    setRunResults(null);
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (!currentQuestion || !currentQuestion.id) return;
    const isCodingType = [
      "coding",
      "sql",
      "debugging",
      "code_analysis",
    ].includes(currentQuestion.question_type);
    if (!isCodingType) return;
    const existing = answers[currentQuestion.id]?.code_submission;
    if (existing && existing.trim()) return;
    const lang = answers[currentQuestion.id]?.code_language || "javascript";
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        code_language: lang,
        code_submission: STARTER_CODE[lang] || "",
      },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id]);

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
        code_language: answerData?.code_language || null,
        last_run_passed_count: answerData?.last_run_passed_count != null ? answerData.last_run_passed_count : null,
        last_run_results: answerData?.last_run_results || null,
        last_run_at: answerData?.last_run_at || null,
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

  // Sync answers continuously to localStorage for instant recovery across reloads
  useEffect(() => {
    if (!answersHydrated || !id || !currentUserId) return;
    if (Object.keys(answers).length === 0) return;
    try {
      localStorage.setItem(`glitch_assessment_answers_${id}_${currentUserId}`, JSON.stringify(answers));
    } catch (e) {}
  }, [answers, answersHydrated, id, currentUserId]);

  // Debounced background autosave
  const autosaveTimeoutRef = useRef(null);
  useEffect(() => {
    if (!answersHydrated || !submissionId || !currentUserId || isHostPreview)
      return;
    if (interactionLocked || alreadySubmitted) return;
    if (!currentQuestion.id || !answers[currentQuestion.id]) return;

    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);

    autosaveTimeoutRef.current = setTimeout(() => {
      saveQuestionAnswer(currentQuestion.id, answers[currentQuestion.id]);
    }, 1200);

    return () => {
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    };
  }, [
    answers,
    currentQuestion.id,
    submissionId,
    currentUserId,
    answersHydrated,
  ]);

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
    const constraintsMatch = text.match(
      /Constraints:\s*([\s\S]*?)(?=Expected Time Complexity:|$)/i,
    );
    if (constraintsMatch) constraints = constraintsMatch[1].trim();

    // 3. Extract Complexities
    const timeMatch = text.match(
      /Expected Time Complexity:\s*(.*?)(?=\n|Expected Space Complexity:|$)/i,
    );
    if (timeMatch) expectedTime = timeMatch[1].trim();

    const spaceMatch = text.match(
      /Expected Space Complexity:\s*(.*?)(?=\n|$)/i,
    );
    if (spaceMatch) expectedSpace = spaceMatch[1].trim();

    // 4. Extract Examples
    const exampleRegex =
      /Example\s*(\d*):\s*Input:\s*(.*?)\s*Output:\s*(.*?)\s*Explanation:\s*(.*?)(?=Example|\n\nConstraints:|$)/gis;
    let exMatch;
    while ((exMatch = exampleRegex.exec(text)) !== null) {
      examples.push({
        num: exMatch[1] || examples.length + 1,
        input: exMatch[2].trim(),
        output: exMatch[3].trim(),
        explanation: exMatch[4].trim(),
      });
    }

    // 5. Extract Description
    let descContent = text;
    if (titleMatch)
      descContent = descContent.replace(/Problem Title:\s*.*?\n/i, "");
    const firstExIdx = descContent.search(/Example\s*\d*:/i);
    if (firstExIdx !== -1) {
      description = descContent.substring(0, firstExIdx).trim();
    } else {
      const constrIdx = descContent.search(/Constraints:/i);
      description =
        constrIdx !== -1
          ? descContent.substring(0, constrIdx).trim()
          : descContent.trim();
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

  // ── Test Case Runner (browser → Wandbox directly) ─────────────────────────
  // Calls Wandbox directly from the browser — completely free, open, and
  // does not require any API keys or whitelisting (Piston public API became
  // whitelist-only with 401 errors as of Feb 2026).
  //
  // Security: this path is for real-time candidate feedback.
  // Results are saved to pro_room_answers after each run, and the latest
  // run's passed count is used by the database trigger for final grading.
  const handleRunCode = async () => {
    const candidateCode = answers[currentQuestion.id]?.code_submission || "";
    const language = answers[currentQuestion.id]?.code_language || "javascript";

    if (!candidateCode.trim()) {
      setRunResults({ error: "Write some code before running the test cases." });
      return;
    }

    setRunningCode(true);
    setRunResults(null);

    try {
      // Fetch test cases from DB if not already loaded in state.
      let testCases = Array.isArray(currentQuestion.test_cases)
        ? currentQuestion.test_cases
        : [];

      if (testCases.length === 0) {
        const { data: qData } = await supabase
          .from("pro_room_questions")
          .select("test_cases")
          .eq("id", currentQuestion.id)
          .single();
        testCases = qData?.test_cases || [];
      }

      if (testCases.length === 0) {
        setRunResults({ error: "No test cases configured for this question." });
        setRunningCode(false);
        return;
      }

      // Wandbox compilers (free, open, no auth/whitelist required, CORS enabled)
      const WANDBOX_COMPILERS = {
        python:     "cpython-3.13.8",
        javascript: "nodejs-20.17.0",
        cpp:        "gcc-13.2.0",
        java:       "openjdk-jdk-21+35",
      };
      const compiler = WANDBOX_COMPILERS[language] || WANDBOX_COMPILERS.python;

      // In Java on Wandbox, file is saved as prog.java, so replace "public class" with "class"
      let preparedCode = candidateCode;
      if (language === "java") {
        preparedCode = preparedCode.replace(/public\s+class\s+/g, "class ");
      }

      // Prepare stdin: if the configured test case input is a JSON or bracketed array
      // like "[4, 2, 4, 3, 2, 4, 2]", format it as space-separated values "4 2 4 3 2 4 2"
      // so standard stdin readers (sys.stdin.read().split(), cin >> x, Scanner.nextInt())
      // can parse integers cleanly without throwing ValueError on "[" or ",".
      const formatStdin = (raw) => {
        if (raw == null) return "";
        const s = String(raw).trim();
        try {
          const parsed = JSON.parse(s);
          if (
            Array.isArray(parsed) &&
            parsed.every(
              (x) =>
                typeof x === "number" ||
                (typeof x === "string" && !isNaN(Number(x))),
            )
          ) {
            return parsed.join(" ");
          }
        } catch {
          if (/^\s*\[[\s\d,.-]+\]\s*$/.test(s)) {
            return s.replace(/[\[\],]/g, " ").replace(/\s+/g, " ").trim();
          }
        }
        return s;
      };

      const results = [];
      let passedCount = 0;

      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const t0 = performance.now();
        let actual_output = "";
        let stderr = "";
        let passed = false;
        let execError = null;

        try {
          const res = await fetch("https://wandbox.org/api/compile.json", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              compiler,
              code:  preparedCode,
              stdin: formatStdin(tc.input),
            }),
          });

          if (!res.ok) {
            execError = `Code runner error: HTTP ${res.status}. Please try again.`;
          } else {
            const json = await res.json();
            const stdout = (json.program_output ?? "").trim();
            const errorOutput = (json.compiler_error || json.program_error || "").trim();
            actual_output = stdout;
            stderr        = errorOutput;

            const expected = String(tc.expected_output ?? "").replace(/\s+/g, " ").trim();
            const actual   = actual_output.replace(/\s+/g, " ").trim();
            const isSuccess = (json.status === 0 || json.status === "0") && !json.signal;
            passed = isSuccess && actual === expected;
          }
        } catch (fetchErr) {
          execError = `Network error: ${fetchErr.message}`;
        }

        const execution_time_ms = Math.round(performance.now() - t0);
        if (passed) passedCount++;

        results.push({
          index:           i + 1,
          input:           tc.input,
          expected_output: tc.expected_output,
          actual_output,
          stderr:          execError ?? stderr,
          passed,
          execution_time_ms,
        });
      }

      console.log("[Code Execution]", {
        questionId:    currentQuestion.id,
        language,
        testCaseCount: testCases.length,
        passedCount,
        failedCount:   testCases.length - passedCount,
      });

      const avgTimeMs =
        results.reduce((s, r) => s + (r.execution_time_ms || 0), 0) /
        results.length;

      // Keep currentQuestion.test_cases populated in memory
      if (testCases.length > 0) {
        currentQuestion.test_cases = testCases;
      }

      // Update React answers state immediately with test run metrics
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          ...prev[currentQuestion.id],
          code_submission: candidateCode,
          code_language: language,
          last_run_passed_count: passedCount,
          last_run_results: results,
          last_run_at: new Date().toISOString(),
        },
      }));

      // Persist this run to the DB so the grading trigger has a trusted
      // result at submit time. This upserts into pro_room_answers, so the
      // 5th run overwrites the 4th — only the most recent result is stored.
      // Errors here are non-fatal: the display results are shown regardless.
      if (submissionId) {
        supabase
          .from("pro_room_answers")
          .upsert(
            {
              submission_id: submissionId,
              room_id:       id,
              user_id:       (await supabase.auth.getUser()).data?.user?.id,
              question_id:   String(currentQuestion.id),
              last_run_passed_count: passedCount,
              last_run_results:      results,
              last_run_at:           new Date().toISOString(),
            },
            { onConflict: "submission_id,question_id" },
          )
          .then(({ error: saveErr }) => {
            if (saveErr) {
              console.warn("[Code Execution] Could not save run results to DB:", saveErr.message);
            } else {
              console.log("[Code Execution] Run results saved →", {
                passedCount,
                totalCount: testCases.length,
              });
            }
          });
      }

      setRunResults({
        passedCount,
        totalCount: testCases.length,
        results,
        avgTimeMs,
      });

    } catch (err) {
      console.error("[Code Execution] exception:", err);
      setRunResults({ error: `Failed to run your code: ${err.message}` });
    } finally {
      setRunningCode(false);
    }
  };

  // ── Final Submission Flow ─────────────────────────────────────────────────
  const handleSubmitAssessment = async () => {
    const findQuestionById = (qId) => {
      for (const sec of sections) {
        const q = (sec.pro_room_questions || []).find(
          (qq) => String(qq.id) === String(qId),
        );
        if (q) return q;
      }
      return null;
    };

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

      // Step 0: Ensure we have a valid, guaranteed submissionId row
      let resolvedSubmissionId = submissionId;
      if (!resolvedSubmissionId) {
        const { data: existingSub } = await supabase
          .from("pro_room_submissions")
          .select("id")
          .eq("room_id", id)
          .eq("user_id", uid)
          .maybeSingle();

        if (existingSub?.id) {
          resolvedSubmissionId = existingSub.id;
          setSubmissionId(existingSub.id);
        } else {
          const { data: createdSub, error: createErr } = await supabase
            .from("pro_room_submissions")
            .insert({
              room_id: id,
              user_id: uid,
              status: "in_progress",
              started_at: new Date().toISOString(),
            })
            .select("id")
            .single();

          if (createErr || !createdSub?.id) {
            setSubmitError(`Could not initialize submission record: ${createErr?.message || "Unknown DB error"}`);
            setSubmitting(false);
            return;
          }
          resolvedSubmissionId = createdSub.id;
          setSubmissionId(createdSub.id);
        }
      }

      // Step 1: Consolidate all answers (React state + localStorage cache backup)
      let consolidatedAnswers = { ...answers };
      try {
        const cached = localStorage.getItem(`glitch_assessment_answers_${id}_${uid}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === "object") {
            consolidatedAnswers = { ...parsed, ...consolidatedAnswers };
          }
        }
      } catch (e) {}

      // Ensure active question answer is included
      if (currentQuestion.id && answers[currentQuestion.id]) {
        consolidatedAnswers[currentQuestion.id] = {
          ...consolidatedAnswers[currentQuestion.id],
          ...answers[currentQuestion.id],
        };
      }
      if (currentQuestion.id && runResults?.passedCount != null) {
        consolidatedAnswers[currentQuestion.id] = {
          ...consolidatedAnswers[currentQuestion.id],
          last_run_passed_count: runResults.passedCount,
          last_run_results: runResults.results,
          last_run_at: new Date().toISOString(),
        };
      }

      // Fetch fresh question metadata (test_cases, points, correct_answer) directly from DB
      // so grading is NEVER dependent on client-side state omissions or RPC exclusions.
      const allQuestionIds = sections.flatMap((sec) => (sec.pro_room_questions || []).map((q) => q.id));
      const { data: dbQuestions } = await supabase
        .from("pro_room_questions")
        .select("id, points, test_cases, correct_answer, question_type")
        .in("id", allQuestionIds);

      const dbQuestionsMap = {};
      (dbQuestions || []).forEach((dq) => {
        dbQuestionsMap[dq.id] = dq;
      });

      // Step 2: Format and persist answers to pro_room_answers with auto-grading fields
      const answerEntries = Object.entries(consolidatedAnswers).filter(([qId, a]) => {
        return (
          a?.answer_text?.trim() ||
          (Array.isArray(a?.selected_options) && a.selected_options.length > 0) ||
          a?.code_submission?.trim() ||
          a?.last_run_passed_count != null
        );
      });

      if (answerEntries.length > 0) {
        const rows = answerEntries.map(([qId, a]) => {
          const q = findQuestionById(qId);
          const dq = dbQuestionsMap[qId] || q;
          let is_correct = null;
          let points_earned = null;
          let auto_graded = false;

          if (q || dq) {
            const qType = dq?.question_type || q?.question_type;
            const qPoints = dq?.points ?? q?.points ?? 0;
            const qCorrectAnswer = dq?.correct_answer ?? q?.correct_answer;

            if (["mcq", "true_false"].includes(qType)) {
              if (qCorrectAnswer) {
                const userOpt = a.selected_options?.[0] || a.answer_text;
                is_correct = String(userOpt ?? "").trim().toLowerCase() === String(qCorrectAnswer ?? "").trim().toLowerCase();
                points_earned = is_correct ? qPoints : 0;
                auto_graded = true;
              }
            } else if (qType === "msq") {
              if (qCorrectAnswer) {
                const userOpts = Array.isArray(a.selected_options) ? a.selected_options.map(x => String(x).trim().toLowerCase()).sort() : [];
                let correctOpts = [];
                try {
                  const parsed = JSON.parse(qCorrectAnswer);
                  if (Array.isArray(parsed)) correctOpts = parsed.map(x => String(x).trim().toLowerCase()).sort();
                } catch {
                  correctOpts = String(qCorrectAnswer).split(",").map(x => x.trim().toLowerCase()).sort();
                }
                is_correct = JSON.stringify(userOpts) === JSON.stringify(correctOpts);
                points_earned = is_correct ? qPoints : 0;
                auto_graded = true;
              }
            } else if (["short_answer", "output_pred"].includes(qType)) {
              if (qCorrectAnswer) {
                is_correct = String(a.answer_text ?? "").trim().toLowerCase() === String(qCorrectAnswer ?? "").trim().toLowerCase();
                points_earned = is_correct ? qPoints : 0;
                auto_graded = true;
              }
            } else if (["coding", "sql", "debugging", "code_analysis"].includes(qType)) {
              const testCases = Array.isArray(dq?.test_cases) ? dq.test_cases : (Array.isArray(q?.test_cases) ? q.test_cases : []);
              const totalTC = testCases.length || (Array.isArray(a.last_run_results) ? a.last_run_results.length : (a.last_run_passed_count != null ? 3 : 0));
              const passed = a.last_run_passed_count ?? (currentQuestion.id === qId ? runResults?.passedCount : 0) ?? 0;

              if (totalTC > 0) {
                points_earned = Math.round((passed / totalTC) * qPoints);
                is_correct = passed === totalTC;
                auto_graded = true;
              }
            }
          }

          const passedVal = a.last_run_passed_count != null ? a.last_run_passed_count : (currentQuestion.id === qId ? runResults?.passedCount : null);
          const resultsVal = a.last_run_results || (currentQuestion.id === qId ? runResults?.results : null);

          return {
            submission_id: resolvedSubmissionId,
            room_id: id,
            user_id: uid,
            question_id: String(qId),
            answer_text: a.answer_text || null,
            selected_options: a.selected_options || null,
            code_submission: a.code_submission || null,
            code_language: a.code_language || null,
            last_run_passed_count: passedVal != null ? passedVal : null,
            last_run_results: resultsVal || null,
            last_run_at: a.last_run_at || new Date().toISOString(),
            is_correct,
            points_earned,
            auto_graded,
          };
        });

        const { error: answersErr } = await supabase
          .from("pro_room_answers")
          .upsert(rows, { onConflict: "submission_id,question_id" });

        if (answersErr) {
          console.error("Final answers flush failed:", answersErr);
          setSubmitError(`Could not save your answers: ${answersErr.message}. Submission aborted to protect your work.`);
          setSubmitting(false);
          return;
        }

        // VERIFY that answers were successfully written into pro_room_answers
        const { data: verifiedRows, error: verifyErr } = await supabase
          .from("pro_room_answers")
          .select("id")
          .eq("submission_id", resolvedSubmissionId);

        if (verifyErr || !verifiedRows || verifiedRows.length === 0) {
          console.error("Answer verification failed:", verifyErr);
          setSubmitError("Answers could not be verified in the database. Submission stopped to prevent submitting an empty test.");
          setSubmitting(false);
          return;
        }
      }

      // Step 3: Compute grading totals
      let autoScore = 0;
      let totalPossible = 0;
      let hasManualReview = false;

      for (const sec of sections) {
        for (const q of (sec.pro_room_questions || [])) {
          const dq = dbQuestionsMap[q.id] || q;
          const qPoints = dq?.points ?? q?.points ?? 0;
          totalPossible += qPoints;
          const a = consolidatedAnswers[q.id];
          const qType = dq?.question_type || q?.question_type;
          const qCorrectAnswer = dq?.correct_answer ?? q?.correct_answer;

          if (["file_upload", "project", "video"].includes(qType)) {
            hasManualReview = true;
          } else if (["coding", "sql", "debugging", "code_analysis"].includes(qType)) {
            const testCases = Array.isArray(dq?.test_cases) ? dq.test_cases : (Array.isArray(q?.test_cases) ? q.test_cases : []);
            const totalTC = testCases.length || (Array.isArray(a?.last_run_results) ? a.last_run_results.length : (a?.last_run_passed_count != null ? 3 : 0));
            const passed = a?.last_run_passed_count ?? (currentQuestion.id === q.id ? runResults?.passedCount : 0) ?? 0;

            if (totalTC > 0) {
              const earned = Math.round((passed / totalTC) * qPoints);
              autoScore += earned;
            } else if (a?.code_submission?.trim()) {
              hasManualReview = true;
            }
          } else if (["mcq", "true_false"].includes(qType)) {
            const userOpt = a?.selected_options?.[0] || a?.answer_text;
            if (qCorrectAnswer && String(userOpt ?? "").trim().toLowerCase() === String(qCorrectAnswer ?? "").trim().toLowerCase()) {
              autoScore += qPoints;
            }
          } else if (qType === "msq") {
            const userOpts = Array.isArray(a?.selected_options) ? a.selected_options.map(x => String(x).trim().toLowerCase()).sort() : [];
            let correctOpts = [];
            try {
              const parsed = JSON.parse(qCorrectAnswer);
              if (Array.isArray(parsed)) correctOpts = parsed.map(x => String(x).trim().toLowerCase()).sort();
            } catch {
              correctOpts = String(qCorrectAnswer || "").split(",").map(x => x.trim().toLowerCase()).sort();
            }
            if (qCorrectAnswer && JSON.stringify(userOpts) === JSON.stringify(correctOpts)) {
              autoScore += qPoints;
            }
          } else if (["short_answer", "output_pred"].includes(qType)) {
            if (qCorrectAnswer && String(a?.answer_text ?? "").trim().toLowerCase() === String(qCorrectAnswer ?? "").trim().toLowerCase()) {
              autoScore += qPoints;
            }
          }
        }
      }

      const totalScore = autoScore;
      const percentage = totalPossible > 0 ? Number(((totalScore / totalPossible) * 100).toFixed(2)) : 0;
      const finalStatus = hasManualReview ? "pending_review" : "graded";

      // Step 4: Upsert final submission row with score, status, and anti-cheat logs
      const { data: subRow, error: subErr } = await supabase
        .from("pro_room_submissions")
        .upsert(
          {
            id: resolvedSubmissionId,
            room_id: id,
            user_id: uid,
            submitted_at: new Date().toISOString(),
            status: finalStatus,
            total_score: totalScore,
            auto_score: autoScore,
            manual_score: 0,
            percentage: percentage,
            needs_manual_review: hasManualReview,
            auto_graded_at: new Date().toISOString(),
            graded_at: hasManualReview ? null : new Date().toISOString(),
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

      // Clear local storage cache after guaranteed successful submission
      try {
        localStorage.removeItem(`glitch_assessment_answers_${id}_${uid}`);
      } catch (e) {}

      // Server-side fallback RPC (non-blocking)
      try {
        await supabase.rpc("grade_pro_room_submission", { p_submission_id: resolvedSubmissionId });
      } catch (rpcErr) {
        console.warn("Server trigger grade call note:", rpcErr);
      }

      setAlreadySubmitted(true);
      setSubmissionComplete(true);
      setTimeExpired(true);
      setTimeout(() => {
        navigate(`/pro-rooms/${id}`);
      }, 2500);
    } catch (err) {
      console.error(err);
      setSubmitError(
        "Something went wrong submitting your assessment. Please try again.",
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
                  {QUESTION_TYPE_LABELS[currentQuestion.question_type] ||
                    currentQuestion.question_type}{" "}
                  • {currentQuestion.difficulty || "Medium"}
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

              {/* True / False — same single-select interaction as MCQ, just
                  with the two options fixed instead of host-authored.
                  Auto-graded server-side by the same block as MCQ
                  (grade_pro_room_submission: mcq/true_false share one
                  exact-match rule). */}
              {currentQuestion.question_type === "true_false" && (
                <>
                  <div className="bg-[#06060c] border border-white/10 rounded-2xl p-5 text-sm sm:text-base font-sans text-gray-100 leading-relaxed whitespace-pre-wrap shadow-inner">
                    {currentQuestion.question_text}
                  </div>
                  <div className="space-y-3 pt-2">
                    {["True", "False"].map((opt) => {
                      const isSelected =
                        answers[currentQuestion.id]?.selected_options?.includes(
                          opt,
                        );
                      return (
                        <button
                          key={opt}
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

              {/* Multiple Select (MSQ) — checkboxes, several options can be
                  selected at once. Auto-graded server-side by comparing the
                  full selected set against q.correct_answer's set, not one
                  value at a time. */}
              {currentQuestion.question_type === "msq" && (
                <>
                  <div className="bg-[#06060c] border border-white/10 rounded-2xl p-5 text-sm sm:text-base font-sans text-gray-100 leading-relaxed whitespace-pre-wrap shadow-inner">
                    {currentQuestion.question_text}
                  </div>
                  {currentQuestion.description && (
                    <p className="text-xs text-gray-400 leading-relaxed bg-white/5 p-3 rounded-xl whitespace-pre-wrap">
                      {currentQuestion.description}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                    Select all that apply
                  </p>
                  <div className="space-y-3 pt-1">
                    {(currentQuestion.options || []).map((opt, optIdx) => {
                      const isSelected =
                        answers[currentQuestion.id]?.selected_options?.includes(
                          opt,
                        );
                      return (
                        <button
                          key={optIdx}
                          onClick={() =>
                            handleMultiSelectToggle(currentQuestion.id, opt)
                          }
                          disabled={interactionLocked}
                          className={`w-full text-left p-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed ${
                            isSelected
                              ? "bg-[#00F0FF]/10 border-[#00F0FF] text-[#00F0FF]"
                              : "bg-[#0b0b14] border-white/10 text-gray-300 hover:bg-white/5"
                          }`}
                        >
                          <span>{opt}</span>
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "bg-[#00F0FF] border-[#00F0FF]"
                                : "border-white/20"
                            }`}
                          >
                            {isSelected && (
                              <Check size={11} className="text-[#07070e]" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Short Answer / Output Prediction — free text, saved to
                  answer_text. grade_pro_room_submission auto-grades both by
                  comparing (case-insensitive, whitespace-trimmed) against
                  correct_answer. Output Prediction shows question_text as a
                  monospace code block since it's normally "what does this
                  code print", not prose. */}
              {["short_answer", "output_pred"].includes(
                currentQuestion.question_type,
              ) && (
                <>
                  <div
                    className={`bg-[#06060c] border border-white/10 rounded-2xl p-5 text-sm text-gray-100 leading-relaxed whitespace-pre-wrap shadow-inner ${
                      currentQuestion.question_type === "output_pred"
                        ? "font-mono text-xs"
                        : "font-sans sm:text-base"
                    }`}
                  >
                    {currentQuestion.question_text}
                  </div>
                  {currentQuestion.description && (
                    <p className="text-xs text-gray-400 leading-relaxed bg-white/5 p-3 rounded-xl whitespace-pre-wrap">
                      {currentQuestion.description}
                    </p>
                  )}
                  <textarea
                    rows={
                      currentQuestion.question_type === "output_pred" ? 3 : 5
                    }
                    placeholder="Type your answer..."
                    value={answers[currentQuestion.id]?.answer_text || ""}
                    onChange={(e) =>
                      handleTextAnswerChange(currentQuestion.id, e.target.value)
                    }
                    disabled={interactionLocked}
                    className="w-full bg-[#0b0b14] border border-white/10 rounded-xl p-4 text-sm text-gray-100 outline-none focus:border-[#00F0FF] disabled:opacity-50 disabled:cursor-not-allowed resize-y"
                  />
                </>
              )}

              {/* File Upload / GitHub URL, Project Submission, Video
                  Submission — all just a URL field saved to answer_text.
                  None of these are ever auto-graded (no correct_answer
                  concept for a link) — they intentionally always land in the
                  host's "Needs Grading" queue, same as an unsupported type
                  would, which grade_pro_room_submission already handles
                  correctly with no changes needed there. */}
              {["file_upload", "project", "video"].includes(
                currentQuestion.question_type,
              ) && (
                <>
                  <div className="bg-[#06060c] border border-white/10 rounded-2xl p-5 text-sm sm:text-base font-sans text-gray-100 leading-relaxed whitespace-pre-wrap shadow-inner">
                    {currentQuestion.question_text}
                  </div>
                  {currentQuestion.description && (
                    <p className="text-xs text-gray-400 leading-relaxed bg-white/5 p-3 rounded-xl whitespace-pre-wrap">
                      {currentQuestion.description}
                    </p>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {currentQuestion.question_type === "file_upload"
                        ? "GitHub / File URL"
                        : currentQuestion.question_type === "project"
                          ? "Project Repository / Deployed URL"
                          : "Video URL"}
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={answers[currentQuestion.id]?.answer_text || ""}
                      onChange={(e) =>
                        handleTextAnswerChange(
                          currentQuestion.id,
                          e.target.value,
                        )
                      }
                      disabled={interactionLocked}
                      className="w-full bg-[#0b0b14] border border-white/10 rounded-xl p-3.5 text-sm text-gray-100 outline-none focus:border-[#00F0FF] disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                    />
                    <p className="text-[10px] text-gray-500">
                      This will be reviewed manually by the host — it isn't
                      auto-graded.
                    </p>
                  </div>
                </>
              )}

              {/* Coding Question Structured View */}
              {["coding", "sql", "debugging", "code_analysis"].includes(
                currentQuestion.question_type,
              ) &&
                (() => {
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
                            <div
                              key={i}
                              className="bg-[#0b0b16] border border-white/10 rounded-xl p-4 space-y-2 text-xs font-mono"
                            >
                              <div className="text-purple-300 font-bold">
                                Example {ex.num}:
                              </div>
                              <div className="text-gray-300">
                                <span className="text-gray-500">Input:</span>{" "}
                                {ex.input}
                              </div>
                              <div className="text-emerald-400">
                                <span className="text-gray-500">Output:</span>{" "}
                                {ex.output}
                              </div>
                              {ex.explanation && (
                                <div className="text-gray-400 text-[11px]">
                                  <span className="text-gray-500">
                                    Explanation:
                                  </span>{" "}
                                  {ex.explanation}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Constraints & Complexity */}
                      {(parsed.constraints ||
                        parsed.expectedTime ||
                        parsed.expectedSpace) && (
                        <div className="bg-[#080812] border border-white/5 rounded-xl p-4 text-xs font-mono space-y-2 text-gray-400">
                          {parsed.constraints && (
                            <div>
                              <span className="text-gray-500 font-bold">
                                Constraints:
                              </span>{" "}
                              {parsed.constraints}
                            </div>
                          )}
                          {parsed.expectedTime && (
                            <div>
                              <span className="text-gray-500 font-bold">
                                Expected Time Complexity:
                              </span>{" "}
                              {parsed.expectedTime}
                            </div>
                          )}
                          {parsed.expectedSpace && (
                            <div>
                              <span className="text-gray-500 font-bold">
                                Expected Space Complexity:
                              </span>{" "}
                              {parsed.expectedSpace}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Solution Code Editor */}
                      <div className="flex items-center justify-between text-xs font-mono text-gray-400 bg-[#0d0d16] px-4 py-2 rounded-t-xl border border-white/10">
                        <span className="flex items-center gap-1.5">
                          <FileCode size={14} className="text-[#00F0FF]" />{" "}
                          Solution Editor
                        </span>
                        <div className="flex items-center gap-2">
                          <CustomSelect
                            value={
                              answers[currentQuestion.id]?.code_language ||
                              "javascript"
                            }
                            onChange={(lang) =>
                              handleLanguageChange(
                                currentQuestion.id,
                                lang,
                              )
                            }
                            disabled={interactionLocked}
                            size="sm"
                            options={[
                              { value: "javascript", label: "JavaScript" },
                              { value: "python", label: "Python" },
                              { value: "cpp", label: "C++" },
                              { value: "java", label: "Java" },
                            ]}
                            className="min-w-[125px]"
                          />
                          <button
                            onClick={handleRunCode}
                            disabled={runningCode || interactionLocked}
                            className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Play size={12} />{" "}
                            {runningCode ? "Running..." : "Run Test Cases"}
                          </button>
                        </div>
                      </div>

                      {/* Real code editor: syntax highlighting, line numbers,
                        auto-closing brackets/quotes, bracket matching, and
                        basic parse-level syntax-error detection (red
                        underline via lintGutter) — all per the language
                        selected above. This never submits anything; it's
                        purely local editing. Only "Run Test Cases" above and
                        "Finish & Submit" at the bottom of the page do
                        anything server-side, and they remain two fully
                        separate actions — running never marks the
                        assessment as submitted. */}
                      <CodeMirror
                        value={
                          answers[currentQuestion.id]?.code_submission || ""
                        }
                        height="320px"
                        theme={vscodeDark}
                        basicSetup={{
                          lineNumbers: true,
                          highlightActiveLine: true,
                          highlightActiveLineGutter: true,
                          foldGutter: true,
                          bracketMatching: true,
                          closeBrackets: true,
                          autocompletion: true,
                          history: true,
                        }}
                        extensions={[
                          LANGUAGE_EXTENSIONS[
                            answers[currentQuestion.id]?.code_language ||
                              "javascript"
                          ],
                          lintGutter(),
                          syntaxErrorLinter,
                        ]}
                        editable={!interactionLocked}
                        onChange={(value) =>
                          handleCodeChange(currentQuestion.id, value)
                        }
                        className="rounded-b-xl overflow-hidden border border-t-0 border-white/10"
                      />

                      {/* Test Execution Output — structured per-test-case
                        cards instead of a single text blob, so pass/fail,
                        input, expected, and actual output are each clearly
                        their own line rather than run together. */}
                      {runResults && (
                        <div className="bg-[#0c0c16] border border-white/10 rounded-xl p-4 font-mono text-xs text-gray-300 space-y-3">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Terminal size={13} className="text-[#00F0FF]" />{" "}
                            Execution Log & Output
                          </div>

                          {runResults.error ? (
                            <p className="text-amber-400">
                              ⚠ {runResults.error}
                            </p>
                          ) : (
                            <>
                              <div className="space-y-2">
                                {runResults.results.map((r) => (
                                  <div
                                    key={r.index}
                                    className={`rounded-lg border p-3 space-y-1 ${
                                      r.passed
                                        ? "border-emerald-500/30 bg-emerald-500/5"
                                        : "border-red-500/30 bg-red-500/5"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 font-bold">
                                      {r.passed ? (
                                        <CheckCircle
                                          size={13}
                                          className="text-emerald-400"
                                        />
                                      ) : (
                                        <XCircle
                                          size={13}
                                          className="text-red-400"
                                        />
                                      )}
                                      <span
                                        className={
                                          r.passed
                                            ? "text-emerald-400"
                                            : "text-red-400"
                                        }
                                      >
                                        Test Case {r.index}{" "}
                                        {r.passed ? "Passed" : "Failed"}
                                      </span>
                                    </div>
                                    <div className="text-gray-400 pl-4">
                                      <span className="text-gray-500">
                                        Input:
                                      </span>{" "}
                                      {r.input}
                                    </div>
                                    <div className="text-gray-400 pl-4">
                                      <span className="text-gray-500">
                                        Expected:
                                      </span>{" "}
                                      {r.expected_output}
                                    </div>
                                    {!r.passed && (
                                      <div className="text-red-300 pl-4">
                                        <span className="text-gray-500">
                                          Got:
                                        </span>{" "}
                                        {r.actual_output || "(no output)"}
                                        {r.stderr && (
                                          <div className="text-red-400 mt-0.5">
                                            Error: {r.stderr}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                                <span
                                  className={
                                    runResults.passedCount ===
                                    runResults.totalCount
                                      ? "text-emerald-400 font-bold"
                                      : "text-amber-400 font-bold"
                                  }
                                >
                                  {runResults.passedCount} /{" "}
                                  {runResults.totalCount} Test Cases Passed
                                </span>
                                <span className="text-gray-500">
                                  {runResults.avgTimeMs.toFixed(0)} ms avg
                                  (real, per-test) · memory not reported
                                </span>
                              </div>
                            </>
                          )}
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

            {(() => {
              // FIXED: previously this button just went disabled at the last
              // question of a section — as if the assessment had ended —
              // even when more sections existed after it. navigateToQuestion
              // already takes an explicit section index, it just was never
              // called with the next one. Now: at the last question of a
              // non-final section, "Next" advances to question 1 of the next
              // section instead of doing nothing; it's only truly disabled
              // at the last question of the last section.
              const isLastQuestionInSection =
                activeQIdx >= currentQuestions.length - 1;
              const isLastSection = activeSecIdx >= sections.length - 1;
              const goToNextSection = isLastQuestionInSection && !isLastSection;

              return (
                <button
                  disabled={
                    (isLastQuestionInSection && isLastSection) ||
                    navigating ||
                    interactionLocked
                  }
                  onClick={() =>
                    goToNextSection
                      ? navigateToQuestion(activeSecIdx + 1, 0)
                      : navigateToQuestion(activeSecIdx, activeQIdx + 1)
                  }
                  className="px-4 py-2 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-bold hover:bg-[#00F0FF]/25 cursor-pointer disabled:opacity-30 flex items-center gap-1"
                >
                  {goToNextSection ? "Next Section" : "Next Question"}{" "}
                  <ChevronRight size={14} />
                </button>
              );
            })()}
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
