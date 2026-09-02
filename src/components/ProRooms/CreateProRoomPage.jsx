import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlitchBackground from "../GlitchBackground";
import {
  FiCheck,
  FiUpload,
  FiPlus,
  FiTrash2,
  FiLayers,
  FiCode,
  FiCalendar,
  FiShield,
  FiAward,
  FiBriefcase,
  FiSliders,
  FiEye,
  FiSave,
  FiArrowRight,
  FiArrowLeft,
  FiAlertTriangle,
  FiX,
  FiEdit2,
} from "react-icons/fi";
import {
  Building2,
  ShieldCheck,
  Zap,
  Trophy,
  Clock,
  Users,
  Sparkles,
  HelpCircle,
  FileText,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { supabase } from "../../supabaseClient";

const EVENT_TYPES = [
  "Hackathon",
  "Hiring Assessment",
  "Coding Contest",
  "MCQ Competition",
  "Technical Assessment",
  "College Fest",
  "CTF",
  "Innovation Challenge",
  "Data Science Competition",
  "AI/ML Competition",
  "Custom Event",
];

const CATEGORIES = [
  "AI / Machine Learning",
  "Web Development",
  "Data Structures & Algorithms",
  "Cybersecurity",
  "Data Science",
  "Cloud & DevOps",
  "Aptitude",
  "Software Engineering",
  "Other",
];

const TIMEZONES = [
  "IST (UTC+5:30)",
  "PST (UTC-8:00)",
  "EST (UTC-5:00)",
  "GMT (UTC+0:00)",
  "CET (UTC+1:00)",
  "GST (UTC+4:00)",
  "SGT (UTC+8:00)",
  "AEST (UTC+10:00)",
];

const QUESTION_TYPES = [
  { id: "mcq", label: "Multiple Choice (MCQ)" },
  { id: "msq", label: "Multiple Select (MSQ)" },
  { id: "true_false", label: "True / False" },
  { id: "short_answer", label: "Short Answer" },
  { id: "coding", label: "Coding Problem (+ Test Cases)" },
  { id: "sql", label: "SQL Query Assessment" },
  { id: "debugging", label: "Debugging Challenge" },
  { id: "output_pred", label: "Output Prediction" },
  { id: "code_analysis", label: "Code Analysis" },
  { id: "file_upload", label: "File Upload / GitHub URL" },
  { id: "project", label: "Project Submission" },
  { id: "video", label: "Video Submission" },
];

// ── Reusable themed dropdown ────────────────────────────────────────────
// Replaces every native <select> in this file. Native selects render their
// OPEN option list using the browser/OS's own styling (the blue-highlight
// list you get on Chrome/Windows) — there's no reliable cross-browser way
// to restyle that from CSS alone, which is why every dropdown in this form
// looked inconsistent with the rest of the Glitch Room theme. This is a
// fully custom trigger + option list instead, so it always matches.
const GlitchSelect = ({
  value,
  onChange,
  options, // [{ value, label }] or plain strings
  placeholder = "Select...",
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = React.useRef(null);

  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  const selected = normalized.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full bg-[#06060c] border rounded-xl px-4 py-2.5 text-xs text-left flex items-center justify-between gap-2 outline-none transition cursor-pointer ${
          open
            ? "border-[#00F0FF] ring-1 ring-[#00F0FF]/30"
            : "border-white/10 hover:border-white/20"
        } ${selected ? "text-white" : "text-gray-500"}`}
      >
        <span className="truncate">
          {selected ? selected.label : placeholder}
        </span>
        <FiArrowRight
          size={12}
          className={`shrink-0 text-gray-500 transition-transform ${
            open ? "-rotate-90" : "rotate-90"
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            className="absolute z-30 mt-1.5 w-full max-h-64 overflow-y-auto bg-[#0c0c16] border border-white/10 rounded-xl shadow-2xl shadow-black/50 p-1.5"
          >
            {normalized.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition cursor-pointer flex items-center justify-between gap-2 ${
                  o.value === value
                    ? "bg-[#00F0FF]/15 text-[#00F0FF] font-bold"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="truncate">{o.label}</span>
                {o.value === value && (
                  <FiCheck size={12} className="shrink-0" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Themed gradient shown wherever a room has no cover_image — never an
// external URL, just CSS, so it can't 404/CORS-fail.
const DEFAULT_BANNER_GRADIENT =
  "bg-gradient-to-br from-purple-900/60 via-[#0c0c16] to-[#00F0FF]/20";

// Distinguishes a real Supabase row (a UUID) from a client-side temp ID
// (`sec-${Date.now()}` / `q-${Date.now()}`, from addSection/addQuestion).
// This is what makes the save logic safe: a real ID means "this row
// already exists, UPDATE it in place" — its ID never changes, so any
// pro_room_answers already pointing at it stay valid. A temp ID means
// "this is new," so it always gets a fresh INSERT, never reusing or
// colliding with a retired question's old ID.
const isRealId = (id) =>
  typeof id === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// ── Per-question-type answer-key editor ─────────────────────────────────
// Without this, a host had no way to ever set real options or a real
// correct answer — every question silently kept addQuestion's defaults.
// The grading system (grade_pro_room_submission in the SQL) is only ever
// as good as what gets set here.
const QuestionAnswerEditor = ({ question, onChange }) => {
  const type = question.question_type;

  const setOption = (idx, text) => {
    const next = [...(question.options || [])];
    next[idx] = text;
    onChange({ options: next });
  };
  const addOption = () =>
    onChange({ options: [...(question.options || []), ""] });
  const removeOption = (idx) => {
    const next = (question.options || []).filter((_, i) => i !== idx);
    onChange({ options: next });
    // Keep correct_answer/MSQ selections consistent if the removed option
    // was one of them.
    if (type === "mcq" && question.correct_answer === question.options[idx]) {
      onChange({ options: next, correct_answer: "" });
    }
    if (type === "msq") {
      let selected = [];
      try {
        selected = JSON.parse(question.correct_answer || "[]");
      } catch {
        selected = [];
      }
      onChange({
        options: next,
        correct_answer: JSON.stringify(
          selected.filter((v) => v !== question.options[idx]),
        ),
      });
    }
  };

  if (type === "mcq") {
    return (
      <div className="space-y-2 pt-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Options — select the correct answer
        </label>
        {(question.options || []).map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ correct_answer: opt })}
              className={`w-4 h-4 rounded-full border shrink-0 cursor-pointer transition ${
                opt && opt === question.correct_answer
                  ? "bg-[#00F0FF] border-[#00F0FF]"
                  : "border-white/20 hover:border-white/40"
              }`}
            />
            <input
              type="text"
              value={opt}
              placeholder={`Option ${idx + 1}`}
              onChange={(e) => setOption(idx, e.target.value)}
              className="flex-1 bg-[#12121e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
            />
            {(question.options || []).length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(idx)}
                className="text-gray-600 hover:text-red-400 cursor-pointer"
              >
                <FiTrash2 size={12} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addOption}
          className="text-[10px] font-bold text-purple-300 hover:text-purple-200 flex items-center gap-1 cursor-pointer"
        >
          <FiPlus size={10} /> Add Option
        </button>
      </div>
    );
  }

  if (type === "msq") {
    let selected = [];
    try {
      selected = JSON.parse(question.correct_answer || "[]");
    } catch {
      selected = [];
    }
    const toggle = (opt) => {
      const next = selected.includes(opt)
        ? selected.filter((v) => v !== opt)
        : [...selected, opt];
      onChange({ correct_answer: JSON.stringify(next) });
    };
    return (
      <div className="space-y-2 pt-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Options — check all correct answers
        </label>
        {(question.options || []).map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => opt && toggle(opt)}
              className={`w-4 h-4 rounded border shrink-0 cursor-pointer transition flex items-center justify-center ${
                opt && selected.includes(opt)
                  ? "bg-[#00F0FF] border-[#00F0FF]"
                  : "border-white/20 hover:border-white/40"
              }`}
            >
              {opt && selected.includes(opt) && (
                <FiCheck size={10} className="text-black" />
              )}
            </button>
            <input
              type="text"
              value={opt}
              placeholder={`Option ${idx + 1}`}
              onChange={(e) => setOption(idx, e.target.value)}
              className="flex-1 bg-[#12121e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
            />
            {(question.options || []).length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(idx)}
                className="text-gray-600 hover:text-red-400 cursor-pointer"
              >
                <FiTrash2 size={12} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addOption}
          className="text-[10px] font-bold text-purple-300 hover:text-purple-200 flex items-center gap-1 cursor-pointer"
        >
          <FiPlus size={10} /> Add Option
        </button>
      </div>
    );
  }

  if (type === "true_false") {
    return (
      <div className="space-y-2 pt-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Correct Answer
        </label>
        <div className="flex items-center gap-2">
          {["True", "False"].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ correct_answer: v })}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                question.correct_answer === v
                  ? "bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]"
                  : "bg-[#12121e] border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (type === "short_answer" || type === "output_pred") {
    return (
      <div className="space-y-1.5 pt-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Correct Answer (matched case-insensitively)
        </label>
        <input
          type="text"
          value={question.correct_answer || ""}
          placeholder="e.g., 42"
          onChange={(e) => onChange({ correct_answer: e.target.value })}
          className="w-full bg-[#12121e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
        />
      </div>
    );
  }

  if (["coding", "sql", "debugging", "code_analysis"].includes(type)) {
    const cases = question.test_cases || [];
    const setCase = (idx, field, val) => {
      const next = [...cases];
      next[idx] = { ...next[idx], [field]: val };
      onChange({ test_cases: next });
    };
    return (
      <div className="space-y-2 pt-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Test Cases (shown to the host for manual review — not auto-graded, no
          code execution sandbox exists in this app)
        </label>
        {cases.map((tc, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              value={tc.input || ""}
              placeholder="Input"
              onChange={(e) => setCase(idx, "input", e.target.value)}
              className="flex-1 bg-[#12121e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
            />
            <input
              type="text"
              value={tc.expected_output || ""}
              placeholder="Expected Output"
              onChange={(e) => setCase(idx, "expected_output", e.target.value)}
              className="flex-1 bg-[#12121e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
            />
            <button
              type="button"
              onClick={() =>
                onChange({ test_cases: cases.filter((_, i) => i !== idx) })
              }
              className="text-gray-600 hover:text-red-400 cursor-pointer"
            >
              <FiTrash2 size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange({
              test_cases: [...cases, { input: "", expected_output: "" }],
            })
          }
          className="text-[10px] font-bold text-purple-300 hover:text-purple-200 flex items-center gap-1 cursor-pointer"
        >
          <FiPlus size={10} /> Add Test Case
        </button>
      </div>
    );
  }

  // file_upload / project / video — nothing to key against; always manual.
  return (
    <p className="text-[10px] text-gray-500 pt-1">
      This question type is always graded manually by the host — there's no
      answer key to set here.
    </p>
  );
};

const CreateProRoomPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editRoomId = searchParams.get("edit");
  const initialStepParam = searchParams.get("step");

  const [currentStep, setCurrentStep] = useState(() => {
    if (initialStepParam) {
      const stepNum = Number(initialStepParam);
      if (stepNum >= 1 && stepNum <= 6) return stepNum;
    }
    return 1;
  });
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  // Tracks the room row created by "Save as Draft" so repeated draft saves
  // update that same row instead of creating a new one each time. Starts
  // as the room we're already editing, if any.
  const [draftRoomId, setDraftRoomId] = useState(editRoomId || null);
  // The room's real status as loaded from the DB when editing — lets
  // handleSaveDraft/handlePublishProRoom avoid clobbering it (previously
  // both unconditionally forced status to "draft" / "registration_open"
  // on every save, which would silently un-publish or reset the lifecycle
  // of a room that was already live, in evaluation, or had results
  // published).
  const [loadedRoomStatus, setLoadedRoomStatus] = useState(null);
  // Snapshot of sections/questions exactly as loaded from the DB at
  // edit-open time — diffed against current state at save time to detect
  // new vs. existing vs. removed questions, and to know what changed on
  // an existing one. Null for a brand-new room (nothing to diff against).
  const originalAssessmentRef = React.useRef(null);
  // Scoring-impact confirmation gate — set when a save would touch a
  // question that already has participant answers.
  const [scoringWarning, setScoringWarning] = useState({
    show: false,
    items: [],
    roomId: null,
    action: null, // 'draft' | 'publish'
  });
  const [confirmingScoringChange, setConfirmingScoringChange] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  // Only meaningful when editRoomId is present: null = not checked yet,
  // true = confirmed the signed-in user owns this room, false = blocked.
  const [editAccessAllowed, setEditAccessAllowed] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Tracks whether the currently-typed logo/banner URL failed to load, so
  // the preview box can fall back to the placeholder icon instead of
  // silently showing nothing (see the onError handlers below).
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [bannerLoadError, setBannerLoadError] = useState(false);

  // Saved Drafts panel — lets a host jump straight into resuming an
  // existing draft from the create page itself, instead of having to
  // leave and find it in the Pro Rooms list. Only relevant when starting
  // fresh (not already editing a specific room via ?edit=).
  const [myDrafts, setMyDrafts] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [showDraftsList, setShowDraftsList] = useState(false);

  const loadMyDrafts = async () => {
    setLoadingDrafts(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;
      if (!uid) {
        setMyDrafts([]);
        return;
      }
      const { data, error } = await supabase
        .from("pro_rooms")
        .select("id, name, title, event_type, cover_image, created_at")
        .eq("host_id", uid)
        .eq("status", "draft")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setMyDrafts(data || []);
    } catch (err) {
      console.error("Failed to load saved drafts:", err);
    } finally {
      setLoadingDrafts(false);
    }
  };

  useEffect(() => {
    // Only fetch the drafts list when starting a brand-new room — once
    // ?edit= is present we're already resuming a specific draft/room.
    if (!editRoomId) {
      loadMyDrafts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editRoomId]);

  // STEP 1: Basic Information State
  const [basicInfo, setBasicInfo] = useState({
    name: "",
    event_type: "",
    short_description: "",
    category: "",
    detailed_description: "",
    org_name: "",
    org_email: "",
    organizer_name: "",
    website: "",
    org_logo: "",
    cover_image: "",
  });

  // STEP 2: Schedule State
  const [schedule, setSchedule] = useState({
    reg_start_at: "",
    reg_end_at: "",
    event_start_at: "",
    event_end_at: "",
    timezone: "",
    allow_late_entry: true,
    mode: "Online",
    submission_deadline: "",
    // How long each candidate gets on the timed test once THEY start it —
    // completely separate from the event window above (which is when
    // registration/the event as a whole is open). This drives the actual
    // countdown timer in ProRoomAssessment.jsx.
    duration_minutes: "",
  });

  // STEP 3: Eligibility & Participation State
  const [eligibility, setEligibility] = useState({
    access_type: "public",
    max_participants: "",
    participation_type: "team",
    max_team_size: "",
    min_glitch_level: "",
    required_skills: "",
    target_college: "",
    target_degree: "",
    target_branch: "",
    grad_years: "",
    exp_level: "All Levels",
    require_application: true,
    custom_app_questions: [],
  });

  // Pre-load room configuration & set initial step when editing
  useEffect(() => {
    if (initialStepParam) {
      const stepNum = Number(initialStepParam);
      if (stepNum >= 1 && stepNum <= 6) {
        setCurrentStep(stepNum);
      }
    }

    if (editRoomId) {
      const fetchExistingRoom = async () => {
        try {
          const { data: authData } = await supabase.auth.getUser();
          const uid = authData?.user?.id || null;

          const { data: rData } = await supabase
            .from("pro_rooms")
            .select("*")
            .eq("id", editRoomId)
            .maybeSingle();

          // Only the room's host may load it into the edit form. Bail out
          // before populating any state with another organizer's data.
          if (!rData || !uid || rData.host_id !== uid) {
            setEditAccessAllowed(false);
            return;
          }
          setEditAccessAllowed(true);
          // Remember the room's actual current status so save/publish can
          // preserve it instead of forcing it back to "draft" or
          // "registration_open" on every edit.
          setLoadedRoomStatus(rData.status || null);

          if (rData) {
            setBasicInfo({
              name: rData.name || rData.title || "",
              event_type: rData.event_type || "",
              short_description: rData.short_description || "",
              category: rData.category || "",
              detailed_description: rData.detailed_description || "",
              org_name: rData.org_name || "",
              org_email: rData.org_email || "",
              organizer_name: rData.organizer_name || "",
              website: rData.website || "",
              org_logo: rData.org_logo || "",
              cover_image: rData.cover_image || "",
            });

            if (rData.reg_start_at && rData.event_end_at) {
              setSchedule({
                reg_start_at: rData.reg_start_at
                  ? rData.reg_start_at.slice(0, 16)
                  : "",
                reg_end_at: rData.reg_end_at
                  ? rData.reg_end_at.slice(0, 16)
                  : "",
                event_start_at: rData.event_start_at
                  ? rData.event_start_at.slice(0, 16)
                  : "",
                event_end_at: rData.event_end_at
                  ? rData.event_end_at.slice(0, 16)
                  : "",
                timezone: rData.timezone || "",
                allow_late_entry: rData.allow_late_entry ?? true,
                mode: rData.mode || "Online",
                submission_deadline: rData.event_end_at
                  ? rData.event_end_at.slice(0, 16)
                  : "",
                duration_minutes: rData.duration_minutes || "",
              });
            }

            setEligibility({
              access_type: rData.access_type || "public",
              max_participants: rData.max_participants || "",
              participation_type: rData.participation_type || "team",
              max_team_size: rData.max_team_size || "",
              min_glitch_level: rData.min_glitch_level || "",
              required_skills: rData.required_skills || "",
              target_college: rData.target_college || "",
              target_degree: rData.target_degree || "",
              target_branch: rData.target_branch || "",
              grad_years: rData.grad_years || "",
              exp_level: rData.exp_level || "All Levels",
              require_application: rData.require_application ?? true,
              custom_app_questions: Array.isArray(rData.custom_app_questions)
                ? rData.custom_app_questions
                : [],
            });

            setEvaluation({
              eval_method: rData.eval_method || "",
              passing_score: rData.passing_score || "",
              negative_marking: rData.negative_marking ?? false,
              partial_scoring: rData.partial_scoring ?? true,
              tie_breaker_rule: rData.tie_breaker_rule || "score_speed",
              gbits_prize_pool: rData.gbits_prize_pool || "",
              has_participation_certificate:
                rData.has_participation_certificate ?? true,
              has_winner_certificate: rData.has_winner_certificate ?? true,
              has_achievement_badge: rData.has_achievement_badge ?? true,
              prize_details: rData.prize_details || "",
            });
          }

          // Fetch Sections & Questions — questions come from
          // get_pro_room_questions_safe (converted from a view to a
          // SECURITY DEFINER function to close a Supabase Advisor finding —
          // same behavior, called via .rpc()), not the base
          // pro_room_questions table: correct_answer is no longer readable
          // from the base table at all (by anyone, host included — see
          // fix_3_hide_correct_answers.sql), so editing has to go through
          // this function, which re-exposes it specifically because this
          // is the room's host. Both the section fetch and the function
          // itself exclude soft-deleted rows (is_deleted = true) — a
          // previously-removed question never resurfaces in the builder.
          const { data: sRows } = await supabase
            .from("pro_room_sections")
            .select("*")
            .eq("room_id", editRoomId)
            .eq("is_deleted", false)
            .order("order_index", { ascending: true });

          let sData = [];
          if (sRows && sRows.length > 0) {
            const sectionIds = sRows.map((s) => s.id);
            const { data: qRows, error: qErr } = await supabase.rpc(
              "get_pro_room_questions_safe",
              { p_section_ids: sectionIds },
            );

            if (qErr) {
              console.error("Could not load questions for edit:", qErr);
            }

            sData = sRows.map((s) => ({
              ...s,
              pro_room_questions: (qRows || []).filter(
                (q) => q.section_id === s.id,
              ),
            }));
          }

          if (sData && sData.length > 0) {
            const loadedSections = sData.map((s) => ({
              id: s.id,
              section_name: s.section_name,
              section_type: s.section_type,
              order_index: s.order_index,
              time_limit_minutes: s.time_limit_minutes,
              total_points: s.total_points,
              questions: (s.pro_room_questions || []).map((q) => ({
                id: q.id,
                question_text: q.question_text,
                question_type: q.question_type,
                difficulty: q.difficulty,
                points: q.points,
                options: q.options || [],
                correct_answer: q.correct_answer || "",
                test_cases: q.test_cases || [],
              })),
            }));
            setSections(loadedSections);
            // Snapshot exactly what was loaded — this is what save-time
            // diffing compares against to find new/changed/removed
            // questions. Deep-cloned so later edits to `sections` state
            // can never mutate this reference.
            originalAssessmentRef.current = JSON.parse(
              JSON.stringify(loadedSections),
            );
          }
        } catch (err) {
          console.error("Error fetching room data for edit:", err);
        }
      };

      fetchExistingRoom();
    }
  }, [editRoomId, initialStepParam]);

  // STEP 4: Assessment Sections & Question Builder State
  const [sections, setSections] = useState([]);

  // STEP 5: Evaluation & Rewards State
  const [evaluation, setEvaluation] = useState({
    eval_method: "Automatic",
    passing_score: "50",
    negative_marking: false,
    partial_scoring: true,
    tie_breaker_rule: "score_speed",
    gbits_prize_pool: "",
    has_participation_certificate: true,
    has_winner_certificate: true,
    has_achievement_badge: true,
    prize_details: "",
  });

  // Event Timer duration — strictly Event Start -> Event End. Registration
  // dates must never feed into this: the Event Timer is when the assessment
  // itself is live, which is a completely separate window from when
  // registration is open. (Previously this fell back to reg_start_at
  // whenever it was set, which silently pulled the registration-open date
  // into the "event" duration shown to the host.)
  const calculateDurationHours = () => {
    try {
      const startStr = schedule.event_start_at;
      const endStr = schedule.event_end_at;
      if (!startStr || !endStr) return "Select dates above";

      const start = new Date(startStr);
      const end = new Date(endStr);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return "Select complete date & time";
      }

      const diffMs = end - start;
      if (diffMs <= 0) return "Event End must be after Start date";

      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const days = Math.floor(totalMinutes / (24 * 60));
      const hours = Math.floor((totalMinutes % (24 * 60)) / 60);

      let parts = [];
      if (days > 0) parts.push(`${days} Day${days > 1 ? "s" : ""}`);
      if (hours > 0) parts.push(`${hours} Hour${hours > 1 ? "s" : ""}`);

      const durationStr = parts.join(" ") || `${totalMinutes} Mins`;
      const totalHours = Math.round(diffMs / (1000 * 60 * 60));
      return `${durationStr} (${totalHours} Total Hours)`;
    } catch (e) {
      return "Select dates above";
    }
  };

  // Compute live event state badge
  const getComputedStatusBadge = () => {
    try {
      const now = new Date();
      const start = new Date(schedule.event_start_at);
      const end = new Date(schedule.event_end_at);
      const regStart = new Date(schedule.reg_start_at);
      const regEnd = new Date(schedule.reg_end_at);

      if (now >= start && now <= end)
        return {
          label: "🔴 LIVE ASSESSMENT",
          bg: "bg-red-500/10 text-red-400 border-red-500/30",
        };
      if (now >= regStart && now <= regEnd)
        return {
          label: "Registration Open",
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        };
      if (now < start)
        return {
          label: "Upcoming",
          bg: "bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/30",
        };
    } catch (e) {}
    return {
      label: "Upcoming",
      bg: "bg-purple-500/10 text-purple-300 border-purple-500/30",
    };
  };

  // Handlers for dynamic Host FAQ / Common Questions
  const addAppQuestion = () => {
    setEligibility({
      ...eligibility,
      custom_app_questions: [
        ...eligibility.custom_app_questions,
        { id: `q-${Date.now()}`, question: "", answer: "" },
      ],
    });
  };

  const removeAppQuestion = (qId) => {
    setEligibility({
      ...eligibility,
      custom_app_questions: eligibility.custom_app_questions.filter(
        (q) => q.id !== qId,
      ),
    });
  };

  // Handlers for Sections & Questions
  const addSection = () => {
    const newSecId = `sec-${Date.now()}`;
    setSections([
      ...sections,
      {
        id: newSecId,
        section_name: `Section ${sections.length + 1}: Custom Section`,
        section_type: "mcq",
        order_index: sections.length + 1,
        time_limit_minutes: 30,
        total_points: 50,
        questions: [],
      },
    ]);
  };

  const removeSection = (secId) => {
    setSections(sections.filter((s) => s.id !== secId));
  };

  const addQuestion = (secId) => {
    setSections(
      sections.map((s) => {
        if (s.id === secId) {
          return {
            ...s,
            questions: [
              ...s.questions,
              {
                id: `q-${Date.now()}`,
                question_text: "",
                question_type: "mcq",
                difficulty: "Medium",
                points: 25,
                options: ["", "", "", ""],
                correct_answer: "",
              },
            ],
          };
        }
        return s;
      }),
    );
  };

  const removeQuestion = (secId, qId) => {
    setSections(
      sections.map((s) => {
        if (s.id === secId) {
          return {
            ...s,
            questions: s.questions.filter((q) => q.id !== qId),
          };
        }
        return s;
      }),
    );
  };

  // Single place to patch one field on one question — every input in the
  // question card and its answer-key editor goes through this instead of
  // repeating the same three-level sections→questions→field map inline.
  const updateQuestion = (secId, qId, patch) => {
    setSections(
      sections.map((s) =>
        s.id === secId
          ? {
              ...s,
              questions: s.questions.map((qu) =>
                qu.id === qId ? { ...qu, ...patch } : qu,
              ),
            }
          : s,
      ),
    );
  };

  // Blank answer-key fields for a given question type — used when a
  // question's type changes, so switching e.g. MCQ → Coding doesn't leave
  // the old options/correct_answer sitting around unused in state (and
  // reappearing with stale data if the host switches back).
  const blankAnswerFieldsForType = (type) => {
    if (type === "mcq")
      return { options: ["", "", "", ""], correct_answer: "", test_cases: [] };
    if (type === "msq")
      return {
        options: ["", "", "", ""],
        correct_answer: "[]",
        test_cases: [],
      };
    if (type === "true_false")
      return { options: [], correct_answer: "", test_cases: [] };
    if (type === "short_answer" || type === "output_pred")
      return { options: [], correct_answer: "", test_cases: [] };
    if (["coding", "sql", "debugging", "code_analysis"].includes(type))
      return { options: [], correct_answer: "", test_cases: [] };
    // file_upload / project / video — always manual, no answer key at all.
    return { options: [], correct_answer: "", test_cases: [] };
  };

  // Final Publish Handler
  // Per-step required-field validation. Previously the only check anywhere
  // in this wizard was `name` + `org_name` at the very end — every other
  // required field (marked with a `*` in the UI, but never actually
  // enforced) could be left blank straight through to publish, where a
  // blank schedule date would throw a raw, unhelpful `Invalid Date` error
  // deep inside handlePublishProRoom.
  const validateStep = (step) => {
    if (step === 1) {
      if (!basicInfo.name.trim()) return "Event / Room Name is required.";
      if (!basicInfo.event_type) return "Please select an Event Type.";
      if (!basicInfo.short_description.trim())
        return "Short Description is required.";
      if (!basicInfo.category) return "Please select a Category.";
      if (!basicInfo.detailed_description.trim())
        return "Detailed Description is required.";
      if (!basicInfo.org_name.trim())
        return "Organization / College / Company Name is required.";
      if (!basicInfo.organizer_name.trim())
        return "Organizer Name is required.";
      if (!basicInfo.org_email.trim()) return "Organizer Email is required.";
      if (!basicInfo.org_logo.trim()) return "Organization Logo is required.";
      return null;
    }

    if (step === 2) {
      if (!schedule.reg_start_at)
        return "Registration Opens date & time are required. Please select both date and time (hours & minutes).";
      if (!schedule.reg_end_at)
        return "Registration Closes date & time are required. Please select both date and time (hours & minutes).";
      if (!schedule.event_start_at)
        return "Event Starts date & time are required. Please select both date and time (hours & minutes).";
      if (!schedule.event_end_at)
        return "Event Ends date & time are required. Please select both date and time (hours & minutes).";
      if (!schedule.timezone) return "Please select a Timezone.";
      if (!schedule.mode) return "Please select an Event Mode.";
      if (!schedule.duration_minutes)
        return "Assessment Time Limit is required.";
      if (
        Number.isNaN(Number(schedule.duration_minutes)) ||
        Number(schedule.duration_minutes) < 1
      )
        return "Assessment Time Limit must be at least 1 minute.";
      if (Number(schedule.duration_minutes) > 10080)
        return "Assessment Time Limit can't be more than a week (10080 minutes) — check the value.";

      const regStart = new Date(schedule.reg_start_at);
      const regEnd = new Date(schedule.reg_end_at);
      const evStart = new Date(schedule.event_start_at);
      const evEnd = new Date(schedule.event_end_at);
      if (
        [regStart, regEnd, evStart, evEnd].some((d) =>
          Number.isNaN(d.getTime()),
        )
      ) {
        return "One of the schedule dates is invalid.";
      }
      if (regEnd <= regStart)
        return "Registration Closes must be after Registration Opens.";
      if (evEnd <= evStart) return "Event Ends must be after Event Starts.";
      if (evStart < regStart)
        return "Event Starts can't be before Registration Opens.";
      return null;
    }

    if (step === 3) {
      if (!eligibility.access_type) return "Please select a Visibility option.";
      if (!eligibility.max_participants)
        return "Maximum Participant Limit is required.";
      if (Number(eligibility.max_participants) <= 0)
        return "Maximum Participant Limit must be greater than 0.";
      if (!eligibility.participation_type)
        return "Please select a Participation Type.";
      if (
        eligibility.participation_type !== "individual" &&
        !eligibility.max_team_size
      )
        return "Maximum Team Size is required for team participation.";
      return null;
    }

    if (step === 4) {
      if (sections.length === 0)
        return "Add at least one section before continuing.";
      for (const sec of sections) {
        if (!sec.section_name || !sec.section_name.trim())
          return "Every section needs a name.";
        if (!sec.questions || sec.questions.length === 0)
          return `"${sec.section_name}" needs at least one question.`;
        for (const q of sec.questions) {
          if (!q.question_text || !q.question_text.trim())
            return `A question in "${sec.section_name}" is missing its question text.`;

          // Objective types need a real answer key — without this the
          // grading system (fix #8/#9) has nothing to compare against and
          // every submission would sit permanently "pending review".
          if (["mcq", "msq"].includes(q.question_type)) {
            const filledOptions = (q.options || []).filter((o) => o.trim());
            if (filledOptions.length < 2)
              return `"${q.question_text || "A question"}" in "${sec.section_name}" needs at least 2 options.`;
            if (q.question_type === "mcq" && !q.correct_answer)
              return `"${q.question_text}" in "${sec.section_name}" needs a correct answer selected.`;
            if (q.question_type === "msq") {
              let selected = [];
              try {
                selected = JSON.parse(q.correct_answer || "[]");
              } catch {
                selected = [];
              }
              if (selected.length === 0)
                return `"${q.question_text}" in "${sec.section_name}" needs at least one correct answer checked.`;
            }
          }
          if (
            q.question_type === "true_false" &&
            !["True", "False"].includes(q.correct_answer)
          )
            return `"${q.question_text || "A question"}" in "${sec.section_name}" needs True or False selected.`;
          if (
            ["short_answer", "output_pred"].includes(q.question_type) &&
            !(q.correct_answer || "").trim()
          )
            return `"${q.question_text || "A question"}" in "${sec.section_name}" needs a correct answer entered.`;
        }
      }
      return null;
    }

    if (step === 5) {
      if (!evaluation.eval_method) return "Please select an Evaluation Method.";
      if (!evaluation.passing_score) return "Passing Score is required.";
      if (
        Number(evaluation.passing_score) < 0 ||
        Number(evaluation.passing_score) > 100
      )
        return "Passing Score must be between 0 and 100.";
      return null;
    }

    return null;
  };

  const handleNextStep = () => {
    const err = validateStep(currentStep);
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg("");
    setCurrentStep(currentStep + 1);
  };

  // ── Assessment save: upsert-by-id + soft-delete, never delete-and-recreate ─
  // This replaces the old approach (delete every section/question for the
  // room, then re-insert everything from scratch), which reassigned a new
  // random UUID to every question on every single save — orphaning any
  // pro_room_answers already pointing at the old IDs. Now:
  //   - a question with a real DB id (isRealId) is UPDATEd in place — its
  //     id never changes, so existing answers stay correctly linked.
  //   - a question with a temp id (freshly added in this session) is
  //     INSERTed and gets a genuinely new id.
  //   - a question that existed before but isn't in current state anymore
  //     is soft-deleted (is_deleted = true), never hard-deleted — its row,
  //     and any answers tied to it, are preserved for history/scoring.
  // If a question that already has participant answers had its text,
  // options, correct answer, type, or points changed (or was removed),
  // this returns { blocked: true, items } instead of writing anything,
  // UNLESS `force` is true (the host has explicitly confirmed via the
  // warning modal) — in which case it writes and then re-grades every
  // affected submission so scores reflect the correction.
  const persistAssessment = async (roomId, force = false) => {
    const originalSections = originalAssessmentRef.current || [];
    const originalSectionById = new Map(originalSections.map((s) => [s.id, s]));
    const originalQuestionById = new Map();
    originalSections.forEach((s) =>
      (s.questions || []).forEach((q) =>
        originalQuestionById.set(q.id, {
          ...q,
          __sectionName: s.section_name,
        }),
      ),
    );

    const currentSectionIds = new Set(
      sections.filter((s) => isRealId(s.id)).map((s) => s.id),
    );
    const currentQuestionIds = new Set();
    sections.forEach((s) =>
      (s.questions || []).forEach((q) => {
        if (isRealId(q.id)) currentQuestionIds.add(q.id);
      }),
    );

    const removedSectionIds = [...originalSectionById.keys()].filter(
      (id) => !currentSectionIds.has(id),
    );
    // Covers both individually-removed questions AND questions whose
    // parent section was removed wholesale — either way, if it's not in
    // current state, it's gone.
    const removedQuestionIds = [...originalQuestionById.keys()].filter(
      (id) => !currentQuestionIds.has(id),
    );

    // Any edit to these fields on a question that already has answers
    // needs a host confirmation — exactly the fields specified: question
    // text, options, correct answer, question type, or points.
    const warnableChangedIds = [];
    sections.forEach((s) => {
      (s.questions || []).forEach((q) => {
        if (!isRealId(q.id)) return;
        const orig = originalQuestionById.get(q.id);
        if (!orig) return;
        const changed =
          orig.question_text !== q.question_text ||
          JSON.stringify(orig.options || []) !==
            JSON.stringify(q.options || []) ||
          (orig.correct_answer || "") !== (q.correct_answer || "") ||
          orig.question_type !== q.question_type ||
          Number(orig.points) !== Number(q.points);
        if (changed) warnableChangedIds.push(q.id);
      });
    });

    const idsNeedingAnswerCheck = [
      ...new Set([...removedQuestionIds, ...warnableChangedIds]),
    ];

    let items = [];
    if (idsNeedingAnswerCheck.length > 0) {
      const { data: answerRows, error: answerCheckErr } = await supabase
        .from("pro_room_answers")
        .select("question_id")
        .in("question_id", idsNeedingAnswerCheck);

      if (answerCheckErr) throw answerCheckErr;

      const counts = {};
      (answerRows || []).forEach((r) => {
        counts[r.question_id] = (counts[r.question_id] || 0) + 1;
      });

      removedQuestionIds.forEach((qid) => {
        if (counts[qid] > 0) {
          const orig = originalQuestionById.get(qid);
          items.push({
            questionId: qid,
            questionText: orig.question_text || "(untitled question)",
            sectionName: orig.__sectionName,
            answerCount: counts[qid],
            kind: "removed",
          });
        }
      });
      warnableChangedIds.forEach((qid) => {
        if (counts[qid] > 0) {
          const orig = originalQuestionById.get(qid);
          items.push({
            questionId: qid,
            questionText: orig.question_text || "(untitled question)",
            sectionName: orig.__sectionName,
            answerCount: counts[qid],
            kind: "edited",
          });
        }
      });
    }

    if (items.length > 0 && !force) {
      return { blocked: true, items };
    }

    // ── Write ────────────────────────────────────────────────────────────
    if (removedSectionIds.length > 0) {
      const { error } = await supabase
        .from("pro_room_sections")
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .in("id", removedSectionIds);
      if (error) throw error;
    }

    if (removedQuestionIds.length > 0) {
      const { error } = await supabase
        .from("pro_room_questions")
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .in("id", removedQuestionIds);
      if (error) throw error;
    }

    const sectionIdMap = {}; // client id (temp or real) -> real DB id
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const payload = {
        room_id: roomId,
        section_name: sec.section_name || `Section ${i + 1}`,
        section_type: sec.section_type,
        order_index: i + 1,
        time_limit_minutes: Number(sec.time_limit_minutes) || 30,
        total_points: Number(sec.total_points) || 100,
      };
      if (isRealId(sec.id)) {
        const { error } = await supabase
          .from("pro_room_sections")
          .update(payload)
          .eq("id", sec.id);
        if (error) throw error;
        sectionIdMap[sec.id] = sec.id;
      } else {
        const { data: created, error } = await supabase
          .from("pro_room_sections")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        sectionIdMap[sec.id] = created.id;
      }
    }

    for (const sec of sections) {
      const realSectionId = sectionIdMap[sec.id];
      const qs = sec.questions || [];
      for (let qIdx = 0; qIdx < qs.length; qIdx++) {
        const q = qs[qIdx];
        const payload = {
          room_id: roomId,
          section_id: realSectionId,
          question_text: q.question_text || "",
          question_type: q.question_type,
          difficulty: q.difficulty || "Medium",
          points: Number(q.points) || 25,
          options: q.options || [],
          correct_answer: q.correct_answer || "",
          test_cases: q.test_cases || [],
          order_index: qIdx + 1,
        };
        if (isRealId(q.id)) {
          const { error } = await supabase
            .from("pro_room_questions")
            .update(payload)
            .eq("id", q.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("pro_room_questions")
            .insert(payload);
          if (error) throw error;
        }
      }
    }

    // Re-grade every submission affected by a confirmed answer-key change.
    // (Removed questions need no regrade — their row is only soft-deleted,
    // so the score a candidate already earned on it is untouched; see the
    // SQL migration's comments for why that's the deliberate choice here.)
    if (force) {
      for (const item of items) {
        if (item.kind !== "edited") continue;
        const { error } = await supabase.rpc(
          "regrade_submissions_for_question",
          { p_question_id: item.questionId },
        );
        if (error) {
          console.error("Regrade failed for", item.questionId, error);
        }
      }
    }

    // Update the snapshot to match what was just saved, so the next save
    // in this same session diffs against current reality, not stale data.
    originalAssessmentRef.current = JSON.parse(JSON.stringify(sections));

    return { blocked: false };
  };

  const handleConfirmScoringChange = async () => {
    const { roomId, action } = scoringWarning;
    setConfirmingScoringChange(true);
    if (action === "draft") setSavingDraft(true);
    if (action === "publish") setPublishing(true);

    try {
      await persistAssessment(roomId, true);
      setScoringWarning({ show: false, items: [], roomId: null, action: null });

      if (action === "draft") {
        showToast("💾 Pro Room configuration saved as draft!");
      } else {
        showToast(
          editRoomId
            ? "🚀 Pro Room updated successfully!"
            : "🚀 Pro Room published successfully!",
        );
        setTimeout(() => navigate(`/pro-rooms/${roomId}`), 1200);
      }
    } catch (err) {
      console.error("Failed to save after confirmation:", err);
      setErrorMsg(err.message || "Failed to save — please try again.");
      setScoringWarning({ show: false, items: [], roomId: null, action: null });
    } finally {
      setConfirmingScoringChange(false);
      setSavingDraft(false);
      setPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!basicInfo.name.trim()) {
      setErrorMsg("Give the room a name before saving it as a draft.");
      setCurrentStep(1);
      return;
    }

    setSavingDraft(true);
    setErrorMsg("");
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) throw new Error("You must be signed in to save a draft.");

      const totalPoints = sections.reduce(
        (sum, sec) =>
          sum +
          (sec.questions || []).reduce(
            (qSum, q) => qSum + Number(q.points || 0),
            0,
          ),
        0,
      );

      // Draft payload mirrors the publish payload but tolerates blanks —
      // dates that haven't been filled in yet are simply omitted rather
      // than crashing on `new Date("").toISOString()`.
      const draftPayload = {
        name: basicInfo.name,
        title: basicInfo.name,
        short_description: basicInfo.short_description || null,
        detailed_description: basicInfo.detailed_description || null,
        category: basicInfo.category || null,
        event_type: basicInfo.event_type || null,
        org_name: basicInfo.org_name || null,
        org_logo: basicInfo.org_logo || null,
        cover_image: basicInfo.cover_image || null,
        host_id: userId,
        // Only force "draft" for a genuinely new/still-draft room. If
        // we're editing a room that's already past draft (live,
        // registration_open, evaluation, results_published — anything),
        // "Save as Draft" here means "save my in-progress edits," not
        // "un-publish this room." Previously this was unconditional and
        // would silently hide an already-live room from candidates.
        status:
          loadedRoomStatus && loadedRoomStatus !== "draft"
            ? loadedRoomStatus
            : "draft",

        reg_start_at: schedule.reg_start_at
          ? new Date(schedule.reg_start_at).toISOString()
          : null,
        reg_end_at: schedule.reg_end_at
          ? new Date(schedule.reg_end_at).toISOString()
          : null,
        event_start_at: schedule.event_start_at
          ? new Date(schedule.event_start_at).toISOString()
          : null,
        event_end_at: schedule.event_end_at
          ? new Date(schedule.event_end_at).toISOString()
          : null,
        timezone: schedule.timezone || null,
        allow_late_entry: schedule.allow_late_entry,
        duration_minutes: schedule.duration_minutes
          ? Number(schedule.duration_minutes)
          : null,

        access_type: eligibility.access_type,
        max_participants: eligibility.max_participants
          ? Number(eligibility.max_participants)
          : null,
        required_skills: eligibility.required_skills || null,
        min_glitch_level: eligibility.min_glitch_level
          ? Number(eligibility.min_glitch_level)
          : null,
        participation_type: eligibility.participation_type,
        max_team_size: eligibility.max_team_size
          ? Number(eligibility.max_team_size)
          : null,
        require_application: eligibility.require_application,
        custom_app_questions: eligibility.custom_app_questions,

        passing_score: evaluation.passing_score
          ? Number(evaluation.passing_score)
          : null,
        total_possible_score: totalPoints || null,
        negative_marking: evaluation.negative_marking,
        tie_breaker_rule: evaluation.tie_breaker_rule || null,
        gbits_prize_pool: evaluation.gbits_prize_pool
          ? Number(evaluation.gbits_prize_pool)
          : null,
        has_participation_certificate: evaluation.has_participation_certificate,
        has_winner_certificate: evaluation.has_winner_certificate,
        has_achievement_badge: evaluation.has_achievement_badge,
        prize_details: evaluation.prize_details || null,
      };

      let roomId = draftRoomId;

      if (roomId) {
        const { error: updateErr } = await supabase
          .from("pro_rooms")
          .update(draftPayload)
          .eq("id", roomId);
        if (updateErr) throw updateErr;
      } else {
        const { data: created, error: createErr } = await supabase
          .from("pro_rooms")
          .insert(draftPayload)
          .select()
          .single();
        if (createErr) throw createErr;
        roomId = created.id;
        setDraftRoomId(roomId);
      }

      // Sections/questions are upserted by id and soft-deleted when
      // removed (see persistAssessment) — never a blanket delete+recreate.
      // If this touches a question that already has participant answers,
      // it returns { blocked: true } and shows a confirmation modal
      // instead of writing anything.
      const result = await persistAssessment(roomId, false);
      if (result.blocked) {
        setScoringWarning({
          show: true,
          items: result.items,
          roomId,
          action: "draft",
        });
        setSavingDraft(false);
        return;
      }

      showToast("💾 Pro Room configuration saved as draft!");
      loadMyDrafts();
    } catch (err) {
      console.error("Failed to save draft:", err);
      setErrorMsg(err.message || "Failed to save draft — please try again.");
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublishProRoom = async () => {
    const stepErrors = [1, 2, 3, 4, 5]
      .map((s) => ({ step: s, error: validateStep(s) }))
      .find((r) => r.error);

    if (stepErrors) {
      setErrorMsg(stepErrors.error);
      setCurrentStep(stepErrors.step);
      return;
    }

    setPublishing(true);
    setErrorMsg("");

    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (!userId) {
        throw new Error("You must be signed in to publish a Pro Room.");
      }

      if (editRoomId && !editAccessAllowed) {
        throw new Error("You do not have permission to edit this room.");
      }

      // Calculate total points
      const totalPoints = sections.reduce(
        (sum, sec) =>
          sum +
          sec.questions.reduce((qSum, q) => qSum + Number(q.points || 0), 0),
        0,
      );

      const roomPayload = {
        name: basicInfo.name,
        title: basicInfo.name,
        short_description: basicInfo.short_description,
        detailed_description: basicInfo.detailed_description,
        category: basicInfo.category,
        event_type: basicInfo.event_type,
        org_name: basicInfo.org_name,
        org_logo: basicInfo.org_logo || null,
        cover_image: basicInfo.cover_image || null,
        host_id: userId,

        reg_start_at: new Date(schedule.reg_start_at).toISOString(),
        reg_end_at: new Date(schedule.reg_end_at).toISOString(),
        event_start_at: new Date(schedule.event_start_at).toISOString(),
        event_end_at: new Date(schedule.event_end_at).toISOString(),
        timezone: schedule.timezone,
        duration_minutes: Number(schedule.duration_minutes) || 120,
        allow_late_entry: schedule.allow_late_entry,
        // Only force "registration_open" for a genuinely new room, or one
        // that's still a draft being published for the first time. If
        // we're editing a room that's already live, in evaluation, or has
        // results published, this must preserve that status — previously
        // it was unconditional and would silently reset an in-progress or
        // finished assessment's lifecycle back to "just opened."
        status:
          loadedRoomStatus && loadedRoomStatus !== "draft"
            ? loadedRoomStatus
            : "registration_open",

        access_type: eligibility.access_type,
        max_participants: Number(eligibility.max_participants) || 500,
        required_skills: eligibility.required_skills,
        min_glitch_level: Number(eligibility.min_glitch_level) || 1,
        participation_type: eligibility.participation_type,
        max_team_size: Number(eligibility.max_team_size) || 4,
        require_application: eligibility.require_application,
        custom_app_questions: eligibility.custom_app_questions,

        passing_score: Number(evaluation.passing_score) || 50,
        total_possible_score: totalPoints || 300,
        negative_marking: evaluation.negative_marking,
        tie_breaker_rule: evaluation.tie_breaker_rule,

        gbits_prize_pool: Number(evaluation.gbits_prize_pool) || 2500,
        has_participation_certificate: evaluation.has_participation_certificate,
        has_winner_certificate: evaluation.has_winner_certificate,
        has_achievement_badge: evaluation.has_achievement_badge,
        prize_details: evaluation.prize_details,
      };

      // Reuse whichever existing room row we already have — either arrived
      // via ?edit=, or was created moments ago by "Save as Draft" in this
      // same session. Without this, publishing right after a draft save
      // would insert a second, duplicate room instead of finishing the one
      // that already exists.
      const existingRoomId = editRoomId || draftRoomId;
      let roomId = existingRoomId;

      if (existingRoomId) {
        const { error: roomErr } = await supabase
          .from("pro_rooms")
          .update(roomPayload)
          .eq("id", existingRoomId);

        if (roomErr) throw roomErr;
      } else {
        const { data: createdRoom, error: roomErr } = await supabase
          .from("pro_rooms")
          .insert(roomPayload)
          .select()
          .single();

        if (roomErr) throw roomErr;
        roomId = createdRoom.id;
      }

      // Sections/questions are upserted by id and soft-deleted when
      // removed (see persistAssessment) — never a blanket delete+recreate.
      // If this touches a question that already has participant answers,
      // it returns { blocked: true } and shows a confirmation modal
      // instead of writing anything.
      const result = await persistAssessment(roomId, false);
      if (result.blocked) {
        setScoringWarning({
          show: true,
          items: result.items,
          roomId,
          action: "publish",
        });
        setPublishing(false);
        return;
      }

      showToast(
        editRoomId
          ? "🚀 Pro Room updated successfully!"
          : "🚀 Pro Room published successfully!",
      );
      setTimeout(() => {
        navigate(`/pro-rooms/${roomId}`);
      }, 1200);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to publish Pro Room.");
    } finally {
      setPublishing(false);
    }
  };

  const steps = [
    { num: 1, label: "Basic Info" },
    { num: 2, label: "Schedule" },
    { num: 3, label: "Eligibility" },
    { num: 4, label: "Assessment" },
    { num: 5, label: "Evaluation & Rewards" },
    { num: 6, label: "Review & Publish" },
  ];

  const statusBadge = getComputedStatusBadge();
  const durationText = calculateDurationHours();

  if (editRoomId && editAccessAllowed === false) {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center px-6 text-center font-sans">
        <ShieldCheck size={40} className="text-red-400 mb-4" />
        <h1 className="text-xl font-black text-white mb-2">
          You can't edit this room
        </h1>
        <p className="text-gray-400 text-sm max-w-sm mb-6">
          Only the organizer who created this Pro Room can open it in the
          editor.
        </p>
        <button
          onClick={() => navigate("/pro-rooms")}
          className="px-5 py-2.5 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-bold hover:bg-[#00F0FF]/25 cursor-pointer"
        >
          Back to Pro Rooms
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col font-sans selection:bg-[#00F0FF]/20 relative overflow-hidden">
      {/* Studio Header Bar (No Navbar) */}
      <div className="border-b border-white/10 bg-[#07070e]/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between z-20 relative">
        <button
          type="button"
          onClick={() => navigate("/pro-rooms")}
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer"
        >
          <FiArrowLeft size={16} /> Back to Pro Rooms
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-[#00F0FF] uppercase tracking-widest bg-[#00F0FF]/10 px-3 py-1 rounded-full border border-[#00F0FF]/30">
            PRO ROOM CREATION STUDIO
          </span>
        </div>
      </div>

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

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10">
        <GlitchBackground />

        {/* Top Header & Step Progress Bar matching Reference Image */}
        <div className="bg-[#0c0c16] border border-white/10 rounded-2xl p-4 sm:p-5 mb-8 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Numbered Step Progress Bar */}
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              {steps.map((s) => {
                const isActive = currentStep === s.num;
                const isDone = currentStep > s.num;
                return (
                  <button
                    key={s.num}
                    onClick={() => {
                      // Always allow going back to fix something already
                      // visited. Only allow jumping forward one step past
                      // the current one, and only once it validates —
                      // otherwise clicking straight to "Review & Publish"
                      // from step 1 skipped every required-field check
                      // until the very end.
                      if (s.num <= currentStep) {
                        setErrorMsg("");
                        setCurrentStep(s.num);
                        return;
                      }
                      if (s.num === currentStep + 1) {
                        handleNextStep();
                        return;
                      }
                      setErrorMsg(
                        "Please complete the current step before jumping ahead.",
                      );
                    }}
                    className="flex items-center gap-2 cursor-pointer group shrink-0"
                  >
                    <span
                      className={`w-7 h-7 rounded-full text-xs font-bold font-mono flex items-center justify-center transition-all ${
                        isActive
                          ? "bg-[#FF00C8] text-white ring-4 ring-[#FF00C8]/20 shadow-lg shadow-[#FF00C8]/30"
                          : isDone
                            ? "bg-green-500/20 text-green-400 border border-green-500/40"
                            : "bg-white/5 text-gray-500 border border-white/10 group-hover:text-gray-300"
                      }`}
                    >
                      {isDone ? "✓" : s.num}
                    </span>
                    <span
                      className={`text-xs font-bold transition-all whitespace-nowrap ${
                        isActive
                          ? "text-white font-extrabold"
                          : isDone
                            ? "text-gray-300"
                            : "text-gray-500 group-hover:text-gray-400"
                      }`}
                    >
                      {s.label}
                    </span>
                    {s.num < 6 && (
                      <span className="text-gray-700 text-xs mx-1">—</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Action Triggers at Top Right */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <FiSave size={13} />{" "}
                {savingDraft ? "Saving..." : "Save as Draft"}
              </button>
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <FiEye size={13} /> Preview
              </button>
            </div>
          </div>
        </div>

        {/* Saved Drafts Panel — only shown when starting a brand-new room
            (not while already editing one via ?edit=) and only once we
            know there's something to resume. */}
        {!editRoomId && !loadingDrafts && myDrafts.length > 0 && (
          <div className="bg-[#0c0c16] border border-amber-500/20 rounded-2xl p-4 sm:p-5 mb-8 shadow-xl">
            <button
              type="button"
              onClick={() => setShowDraftsList((v) => !v)}
              className="w-full flex items-center justify-between gap-2 cursor-pointer"
            >
              <span className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <FiSave size={14} /> Saved Drafts ({myDrafts.length})
              </span>
              <FiArrowRight
                size={12}
                className={`text-amber-300 transition-transform ${
                  showDraftsList ? "-rotate-90" : "rotate-90"
                }`}
              />
            </button>

            <AnimatePresence>
              {showDraftsList && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-2">
                    {myDrafts.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#06060c] border border-white/10"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {d.cover_image ? (
                            <img
                              src={d.cover_image}
                              alt=""
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                              className="w-9 h-9 rounded-lg object-cover border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-[#12121e] border border-white/10 flex items-center justify-center shrink-0">
                              <Building2 size={14} className="text-white/40" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {d.name || d.title || "Untitled Draft"}
                            </p>
                            <p className="text-[10px] text-gray-500 font-mono">
                              {d.event_type || "Draft"} · Saved{" "}
                              {d.created_at
                                ? new Date(d.created_at).toLocaleDateString(
                                    "en-US",
                                    { month: "short", day: "numeric" },
                                  )
                                : "recently"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/pro-rooms/create?edit=${d.id}`)
                          }
                          className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold hover:bg-amber-500/25 transition cursor-pointer shrink-0"
                        >
                          Resume Editing →
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Main 2-Column Grid Layout matching Reference Image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Form Controls (7 Columns ~60%) */}
          <div className="lg:col-span-7 bg-[#0c0c16] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* STEP 1: BASIC INFORMATION */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-white">
                    Basic Information
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Provide the essential details about your professional event.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">
                    Event Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-gray-300">
                          Event / Room Name *
                        </label>
                        <span className="text-[10px] font-mono text-gray-500">
                          {basicInfo.name.length}/100
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. AI Innovation Hackathon 2026"
                        maxLength={100}
                        value={basicInfo.name}
                        onChange={(e) =>
                          setBasicInfo({ ...basicInfo, name: e.target.value })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Event Type *
                      </label>
                      <GlitchSelect
                        value={basicInfo.event_type}
                        onChange={(v) =>
                          setBasicInfo({ ...basicInfo, event_type: v })
                        }
                        options={EVENT_TYPES}
                        placeholder="Select Event Type"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-gray-300">
                          Short Description *
                        </label>
                        <span className="text-[10px] font-mono text-gray-500">
                          {basicInfo.short_description.length}/150
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="Build innovative AI solutions for real-world problems."
                        maxLength={150}
                        value={basicInfo.short_description}
                        onChange={(e) =>
                          setBasicInfo({
                            ...basicInfo,
                            short_description: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Category *
                      </label>
                      <GlitchSelect
                        value={basicInfo.category}
                        onChange={(v) =>
                          setBasicInfo({ ...basicInfo, category: v })
                        }
                        options={CATEGORIES}
                        placeholder="Select Category"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-gray-300">
                        Detailed Description *
                      </label>
                      <span className="text-[10px] font-mono text-gray-500">
                        {basicInfo.detailed_description.length}/1000
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      placeholder="Comprehensive details, guidelines, rules, prerequisites..."
                      maxLength={1000}
                      value={basicInfo.detailed_description}
                      onChange={(e) =>
                        setBasicInfo({
                          ...basicInfo,
                          detailed_description: e.target.value,
                        })
                      }
                      className="w-full bg-[#06060c] border border-white/10 rounded-xl p-4 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                    />
                  </div>

                  {/* Organizer Details */}
                  <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest pt-4">
                    Organizer Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Organization / College / Company Name *
                      </label>
                      <input
                        type="text"
                        placeholder="TechNova University"
                        value={basicInfo.org_name}
                        onChange={(e) =>
                          setBasicInfo({
                            ...basicInfo,
                            org_name: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Organizer Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Dr. Ananya Sharma"
                        value={basicInfo.organizer_name}
                        onChange={(e) =>
                          setBasicInfo({
                            ...basicInfo,
                            organizer_name: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Organizer Email *
                      </label>
                      <input
                        type="email"
                        placeholder="ananya.sharma@technova.edu"
                        value={basicInfo.org_email}
                        onChange={(e) =>
                          setBasicInfo({
                            ...basicInfo,
                            org_email: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Website (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="https://technova.edu"
                        value={basicInfo.website}
                        onChange={(e) =>
                          setBasicInfo({
                            ...basicInfo,
                            website: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      />
                    </div>
                  </div>

                  {/* Upload Boxes matching reference layout */}
                  <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest pt-4">
                    Logos & Banner
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Logo Box — always shows a preview square (fallback
                        icon when empty/broken), matching the Banner box's
                        behavior below. Previously this only rendered an
                        <img> when org_logo was set, so an empty or invalid
                        URL left no preview at all. */}
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-2">
                        Organization Logo *
                      </label>
                      <div className="flex items-center gap-3">
                        {basicInfo.org_logo && !logoLoadError ? (
                          <img
                            key={basicInfo.org_logo}
                            src={basicInfo.org_logo}
                            alt="Logo"
                            onError={() => setLogoLoadError(true)}
                            className="w-14 h-14 rounded-2xl object-cover border border-[#FF00C8] shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl border border-white/10 shrink-0 flex items-center justify-center bg-[#12121e]">
                            <Building2 size={16} className="text-white/40" />
                          </div>
                        )}
                        <input
                          type="text"
                          placeholder="Paste Logo Image URL..."
                          value={basicInfo.org_logo}
                          onChange={(e) => {
                            setLogoLoadError(false);
                            setBasicInfo({
                              ...basicInfo,
                              org_logo: e.target.value,
                            });
                          }}
                          className="w-full bg-[#06060c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                        />
                      </div>
                    </div>

                    {/* Banner Box — optional, falls back to a themed gradient
                        banner (no external URL, nothing written to the DB)
                        anywhere this room's cover_image is rendered. Preview
                        is now a full-width horizontal strip (same width as
                        the input, stacked above it) instead of a small
                        square, so the host can actually see how a wide
                        banner will look. */}
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-2">
                        Event Banner / Cover Image (Optional)
                      </label>
                      <div className="space-y-2">
                        <div className="w-full h-20 rounded-xl border border-white/10 overflow-hidden">
                          {basicInfo.cover_image && !bannerLoadError ? (
                            <img
                              key={basicInfo.cover_image}
                              src={basicInfo.cover_image}
                              alt="Banner"
                              onError={() => setBannerLoadError(true)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className={`w-full h-full flex items-center justify-center ${DEFAULT_BANNER_GRADIENT}`}
                            >
                              <Building2 size={18} className="text-white/60" />
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Paste Cover Banner URL — leave blank for a default banner"
                          value={basicInfo.cover_image}
                          onChange={(e) => {
                            setBannerLoadError(false);
                            setBasicInfo({
                              ...basicInfo,
                              cover_image: e.target.value,
                            });
                          }}
                          className="w-full bg-[#06060c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: SCHEDULE */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-white">
                    Event Schedule
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Configure event timelines, timezone, and duration.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Registration Opens *
                      </label>
                      <input
                        type="datetime-local"
                        value={schedule.reg_start_at}
                        onChange={(e) =>
                          setSchedule((prev) => ({
                            ...prev,
                            reg_start_at: e.target.value,
                          }))
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        Select date & time (HH:MM)
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Registration Closes *
                      </label>
                      <input
                        type="datetime-local"
                        value={schedule.reg_end_at}
                        onChange={(e) =>
                          setSchedule((prev) => ({
                            ...prev,
                            reg_end_at: e.target.value,
                          }))
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        Select date & time (HH:MM)
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Event Starts *
                      </label>
                      <input
                        type="datetime-local"
                        value={schedule.event_start_at}
                        onChange={(e) =>
                          setSchedule((prev) => ({
                            ...prev,
                            event_start_at: e.target.value,
                          }))
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        Select date & time (HH:MM)
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Event Ends *
                      </label>
                      <input
                        type="datetime-local"
                        value={schedule.event_end_at}
                        onChange={(e) =>
                          setSchedule((prev) => ({
                            ...prev,
                            event_end_at: e.target.value,
                          }))
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        Select date & time (HH:MM)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Assessment Time Limit (minutes) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g., 90"
                        value={schedule.duration_minutes}
                        onChange={(e) =>
                          setSchedule({
                            ...schedule,
                            duration_minutes: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        How long each candidate's timer runs once THEY start the
                        test — not the same as the event window below.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Event Timer (Event Start → Event End)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={durationText}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-[#00F0FF] outline-none cursor-not-allowed"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        The live assessment window — candidates can start their
                        timed test any time between Event Starts and Event Ends.
                        Registration Opens/Closes is a separate timeline and
                        does not affect this.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Timezone *
                      </label>
                      <GlitchSelect
                        value={schedule.timezone}
                        onChange={(v) =>
                          setSchedule({ ...schedule, timezone: v })
                        }
                        options={TIMEZONES}
                        placeholder="Select Timezone"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Event Mode *
                      </label>
                      <GlitchSelect
                        value={schedule.mode}
                        onChange={(v) => setSchedule({ ...schedule, mode: v })}
                        options={[
                          { value: "Online", label: "Online / Virtual" },
                          { value: "Offline", label: "Offline / In-Person" },
                          { value: "Hybrid", label: "Hybrid" },
                        ]}
                        placeholder="Select Event Mode"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: ELIGIBILITY & PARTICIPATION */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-white">
                    Eligibility & Participation
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Define participation rules, team limits, and custom
                    registration questions.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Visibility *
                      </label>
                      <GlitchSelect
                        value={eligibility.access_type}
                        onChange={(v) =>
                          setEligibility({ ...eligibility, access_type: v })
                        }
                        options={[
                          { value: "public", label: "Public (Open to All)" },
                          { value: "private", label: "Private / Invite Only" },
                        ]}
                        placeholder="Select Visibility"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Maximum Participant Limit *
                      </label>
                      <input
                        type="number"
                        placeholder="e.g., 500"
                        value={eligibility.max_participants}
                        onChange={(e) =>
                          setEligibility({
                            ...eligibility,
                            max_participants: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Participation Type *
                      </label>
                      <GlitchSelect
                        value={eligibility.participation_type}
                        onChange={(v) =>
                          setEligibility({
                            ...eligibility,
                            participation_type: v,
                          })
                        }
                        options={[
                          { value: "individual", label: "Individual Only" },
                          { value: "team", label: "Team Participation" },
                          { value: "both", label: "Both Individual & Team" },
                        ]}
                        placeholder="Select Participation Type"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Maximum Team Size
                      </label>
                      <input
                        type="number"
                        placeholder="e.g., 4"
                        value={eligibility.max_team_size}
                        onChange={(e) =>
                          setEligibility({
                            ...eligibility,
                            max_team_size: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Registration Approval *
                    </label>
                    <GlitchSelect
                      value={
                        eligibility.require_application ? "manual" : "automatic"
                      }
                      onChange={(v) =>
                        setEligibility({
                          ...eligibility,
                          require_application: v === "manual",
                        })
                      }
                      options={[
                        { value: "automatic", label: "Automatic Approval" },
                        {
                          value: "manual",
                          label: "Host Approval (Manual Review)",
                        },
                      ]}
                      placeholder="Select Approval Method"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      Automatic Approval confirms every registration instantly.
                      Host Approval holds new registrations as "Pending" until
                      you review and approve them.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Required Skills & Technologies
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Python, PyTorch, Data Structures, System Design"
                      value={eligibility.required_skills}
                      onChange={(e) =>
                        setEligibility({
                          ...eligibility,
                          required_skills: e.target.value,
                        })
                      }
                      className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                    />
                  </div>

                  {/* Host-Created FAQ / Common Questions */}
                  <div className="pt-4 border-t border-white/5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-gray-300">
                          Host FAQ / Common Questions
                        </h4>
                        <p className="text-[11px] text-gray-500">
                          Create common Q&As for candidates to view on the Room
                          Overview page.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addAppQuestion}
                        className="px-3 py-1.5 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <FiPlus /> Add FAQ Question
                      </button>
                    </div>

                    {eligibility.custom_app_questions.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-4 bg-[#06060c] border border-white/5 rounded-xl">
                        No FAQ questions created yet. Click "+ Add FAQ Question"
                        to add common Q&As.
                      </p>
                    ) : (
                      eligibility.custom_app_questions.map((aq, qIdx) => (
                        <div
                          key={aq.id || qIdx}
                          className="p-3.5 rounded-xl bg-[#06060c] border border-white/10 space-y-2.5 relative"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">
                              Question #{qIdx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeAppQuestion(aq.id)}
                              className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                            >
                              <FiTrash2 size={13} />
                            </button>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">
                              Question Title
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Do I get a participation certificate?"
                              value={aq.question || ""}
                              onChange={(e) =>
                                setEligibility({
                                  ...eligibility,
                                  custom_app_questions:
                                    eligibility.custom_app_questions.map((q) =>
                                      q.id === aq.id
                                        ? { ...q, question: e.target.value }
                                        : q,
                                    ),
                                })
                              }
                              className="w-full bg-[#030308] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#00F0FF]"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">
                              Answer / Explanation
                            </label>
                            <textarea
                              rows={2}
                              placeholder="e.g. Yes, all eligible candidates who complete the assessment will receive a verified certificate."
                              value={aq.answer || ""}
                              onChange={(e) =>
                                setEligibility({
                                  ...eligibility,
                                  custom_app_questions:
                                    eligibility.custom_app_questions.map((q) =>
                                      q.id === aq.id
                                        ? { ...q, answer: e.target.value }
                                        : q,
                                    ),
                                })
                              }
                              className="w-full bg-[#030308] border border-white/10 rounded-lg p-3 text-xs text-white outline-none focus:border-[#00F0FF]"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: ASSESSMENT BUILDER */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      Assessment Builder
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Create test sections, add questions, code problems, and
                      test cases.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addSection}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00F0FF] to-purple-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer"
                  >
                    <FiPlus /> Add Section
                  </button>
                </div>

                <div className="space-y-6">
                  {sections.length === 0 && (
                    <div className="text-center py-10 px-6 bg-[#06060c] border border-dashed border-white/10 rounded-2xl">
                      <FiLayers
                        size={24}
                        className="mx-auto text-gray-600 mb-2"
                      />
                      <p className="text-xs text-gray-500">
                        No sections yet. Click "+ Add Section" to start building
                        your assessment.
                      </p>
                    </div>
                  )}
                  {sections.map((sec, secIdx) => (
                    <div
                      key={sec.id}
                      className="bg-[#06060c] border border-white/10 rounded-2xl p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <input
                          type="text"
                          value={sec.section_name}
                          onChange={(e) =>
                            setSections(
                              sections.map((s) =>
                                s.id === sec.id
                                  ? { ...s, section_name: e.target.value }
                                  : s,
                              ),
                            )
                          }
                          className="bg-transparent font-bold text-sm text-white border-b border-cyan-500/30 focus:border-[#00F0FF] outline-none px-1"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => addQuestion(sec.id)}
                            className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <FiPlus /> Add Question
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSection(sec.id)}
                            className="text-red-400 p-1 cursor-pointer"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4 pl-2 border-l-2 border-cyan-500/20">
                        {sec.questions.map((q, qIdx) => (
                          <div
                            key={q.id}
                            className="bg-[#0b0b14] border border-white/5 rounded-xl p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-mono font-bold text-[#00F0FF]">
                                Q{qIdx + 1}.
                              </span>
                              <GlitchSelect
                                value={q.question_type}
                                onChange={(v) =>
                                  updateQuestion(sec.id, q.id, {
                                    question_type: v,
                                    ...blankAnswerFieldsForType(v),
                                  })
                                }
                                options={QUESTION_TYPES.map((qt) => ({
                                  value: qt.id,
                                  label: qt.label,
                                }))}
                                placeholder="Question Type"
                                className="w-52"
                              />
                              <input
                                type="number"
                                placeholder="Points"
                                value={q.points}
                                onChange={(e) =>
                                  updateQuestion(sec.id, q.id, {
                                    points: e.target.value,
                                  })
                                }
                                className="w-20 bg-[#12121e] border border-white/10 text-xs text-white rounded-lg px-2 py-1 outline-none text-center"
                              />
                              <button
                                type="button"
                                onClick={() => removeQuestion(sec.id, q.id)}
                                className="text-red-400 p-1 cursor-pointer"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>

                            <input
                              type="text"
                              placeholder="Question Problem Statement..."
                              value={q.question_text}
                              onChange={(e) =>
                                updateQuestion(sec.id, q.id, {
                                  question_text: e.target.value,
                                })
                              }
                              className="w-full bg-[#12121e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#00F0FF]"
                            />

                            <QuestionAnswerEditor
                              question={q}
                              onChange={(patch) =>
                                updateQuestion(sec.id, q.id, patch)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: EVALUATION & REWARDS */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-white">
                    Evaluation Rules & Rewards
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Configure scoring logic, tie-breaker rules, and certificate
                    rewards.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Evaluation Method *
                      </label>
                      <GlitchSelect
                        value={evaluation.eval_method}
                        onChange={(v) =>
                          setEvaluation({ ...evaluation, eval_method: v })
                        }
                        options={[
                          {
                            value: "Automatic",
                            label: "Automatic Evaluation (Code & MCQ)",
                          },
                          {
                            value: "Automatic + Manual",
                            label: "Automatic + Manual Evaluation",
                          },
                          {
                            value: "AI-Assisted",
                            label: "AI-Assisted Rubric Evaluation",
                          },
                        ]}
                        placeholder="Select Evaluation Method"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Passing Score (%) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="e.g., 50"
                        value={evaluation.passing_score}
                        onChange={(e) =>
                          setEvaluation({
                            ...evaluation,
                            passing_score: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        Minimum percentage score required to pass.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        gBits Prize Pool Reward
                      </label>
                      <input
                        type="number"
                        placeholder="e.g., 2500"
                        value={evaluation.gbits_prize_pool}
                        onChange={(e) =>
                          setEvaluation({
                            ...evaluation,
                            gbits_prize_pool: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Prize Breakdown & Structure
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g., Winner: Certificate + Winner Badge + 1,500 gBits | Runner-Up: 1,000 gBits | All: Participation Certificate"
                      value={evaluation.prize_details}
                      onChange={(e) =>
                        setEvaluation({
                          ...evaluation,
                          prize_details: e.target.value,
                        })
                      }
                      className="w-full bg-[#06060c] border border-white/10 rounded-xl p-3.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: REVIEW & PUBLISH */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-white">
                    Review & Publish Event
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Review your complete event configuration before going live.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#06060c] border border-cyan-500/30 space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">Event Name:</span>
                    <span className="text-white font-bold">
                      {basicInfo.name}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">Organization:</span>
                    <span className="text-[#00F0FF] font-bold">
                      {basicInfo.org_name}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">Event Type:</span>
                    <span className="text-purple-300 font-bold">
                      {basicInfo.event_type}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">Assessment Sections:</span>
                    <span className="text-white font-bold">
                      {sections.length} Sections
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">Prize Pool:</span>
                    <span className="text-amber-400 font-bold">
                      {evaluation.gbits_prize_pool} gBits
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePublishProRoom}
                  disabled={publishing}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00F0FF] via-purple-600 to-[#FF00C8] hover:from-[#00F0FF] hover:to-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#00F0FF]/20 transition cursor-pointer disabled:opacity-50"
                >
                  {publishing
                    ? "Publishing Pro Room..."
                    : "Publish Pro Room Arena 🚀"}
                </button>
              </div>
            )}

            {/* Bottom Form Step Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <button
                type="button"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:text-white disabled:opacity-30 cursor-pointer flex items-center gap-2"
              >
                <FiArrowLeft /> Previous Step
              </button>

              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00F0FF] to-purple-600 hover:from-[#00F0FF] hover:to-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  Save & Continue <FiArrowRight />
                </button>
              ) : null}
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Live Pro Room Preview Panel matching Reference Image (5 Columns ~40%) */}
          <div className="lg:col-span-5 sticky top-24 space-y-6">
            <div className="bg-[#0c0c16] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl space-y-6 overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <FiEye className="text-[#00F0FF]" /> Pro Room Preview
                </h3>
                <span className="text-[10px] font-mono text-cyan-400">
                  Live Syncing
                </span>
              </div>

              {/* Preview Card Component */}
              <div className="bg-[#07070e] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                {/* Banner Header with Title */}
                <div className="h-40 w-full relative overflow-hidden bg-gradient-to-br from-purple-900/60 via-black to-[#00F0FF]/20 flex items-center justify-center p-4 text-center">
                  {basicInfo.cover_image && (
                    <img
                      key={basicInfo.cover_image}
                      src={basicInfo.cover_image}
                      alt="Banner"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      className="absolute inset-0 w-full h-full object-cover opacity-70"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07070e] via-transparent to-black/40" />

                  {/* Status Badge */}
                  <span
                    className={`absolute top-3 left-3 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${statusBadge.bg}`}
                  >
                    {statusBadge.label}
                  </span>

                  <h2 className="relative z-10 text-xl font-black text-white leading-tight drop-shadow-md uppercase tracking-wider">
                    {basicInfo.name || "AI INNOVATION HACKATHON 2026"}
                  </h2>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-4">
                  {/* Org Logo & Name */}
                  <div className="flex items-center gap-2.5">
                    {basicInfo.org_logo ? (
                      <img
                        src={basicInfo.org_logo}
                        alt="Logo"
                        className="w-8 h-8 rounded-xl object-cover border border-white/10 bg-[#161622]"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                        <Building2 size={14} className="text-[#00F0FF]" />
                      </div>
                    )}
                    <span className="text-xs font-bold text-gray-200 flex items-center gap-1">
                      By {basicInfo.org_name || "TechNova University"}
                      <ShieldCheck size={12} className="text-[#00F0FF]" />
                    </span>
                  </div>

                  {/* Date & Meta Pill Row */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-300 flex items-center gap-1.5">
                      <Calendar size={12} className="text-[#00F0FF]" /> May 18 -
                      May 20, 2026
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-300 flex items-center gap-1.5">
                      <Clock size={12} className="text-purple-400" />{" "}
                      {durationText}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-gray-400 flex items-center gap-1">
                      <Users size={12} className="text-[#00F0FF]" /> Max
                      Participants: {eligibility.max_participants}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold">
                      {basicInfo.event_type}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                    {basicInfo.short_description ||
                      "A virtual hackathon where innovators come together to build AI-powered solutions."}
                  </p>
                </div>
              </div>

              {/* Configuration Summary Table matching Reference Image */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-gray-400 mb-2">
                  <span>Configuration Summary</span>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-[#00F0FF] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Event Type</span>
                    <span className="text-white font-semibold">
                      {basicInfo.event_type}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Category</span>
                    <span className="text-white font-semibold">
                      {basicInfo.category}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Start Date</span>
                    <span className="text-white font-semibold">
                      May 18, 2026 10:00 AM
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>End Date</span>
                    <span className="text-white font-semibold">
                      May 20, 2026 10:00 AM
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Registration</span>
                    <span className="text-white font-semibold">
                      Apr 28 – May 15, 2026
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Team Participation</span>
                    <span className="text-white font-semibold">
                      Yes (2 - 4 Members)
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Max Participants</span>
                    <span className="text-white font-semibold">
                      {eligibility.max_participants}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Evaluation Method</span>
                    <span className="text-white font-semibold">
                      {evaluation.eval_method}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Rewards</span>
                    <span className="text-[#00F0FF] font-semibold">
                      Certificates, Prizes, gBits
                    </span>
                  </div>
                </div>
              </div>

              {/* Helper Footer Card */}
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs flex items-center gap-2.5">
                <Sparkles size={16} className="text-amber-400 shrink-0" />
                <span>
                  You can always edit these details later before publishing the
                  event.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Scoring-Impact Confirmation Modal — blocks a save that would edit
          or remove a question candidates have already answered, until the
          host explicitly confirms. Never silently alters existing scores. */}
      <AnimatePresence>
        {scoringWarning.show && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0c0c16] border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <FiAlertTriangle size={20} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    This Affects Already-Submitted Answers
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Candidates have already answered the question(s) below.
                  </p>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {scoringWarning.items.map((item) => (
                  <div
                    key={item.questionId}
                    className="p-3 rounded-xl bg-[#06060c] border border-white/10 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-bold ${
                          item.kind === "removed"
                            ? "text-red-400"
                            : "text-amber-300"
                        }`}
                      >
                        {item.kind === "removed" ? "Will be removed" : "Edited"}
                      </span>
                      <span className="text-gray-500 font-mono">
                        {item.answerCount} candidate
                        {item.answerCount === 1 ? "" : "s"} answered
                      </span>
                    </div>
                    <p className="text-gray-300 mt-1">{item.questionText}</p>
                    <p className="text-gray-600 text-[10px] mt-0.5">
                      {item.sectionName}
                    </p>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed bg-white/5 border border-white/10 rounded-xl p-3">
                Edited questions will be automatically re-graded against the
                corrected answer key — no one's existing score is silently
                changed without this. Removed questions keep whatever score
                candidates already earned on them; they just won't be shown to
                future candidates.
              </p>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setScoringWarning({
                      show: false,
                      items: [],
                      roomId: null,
                      action: null,
                    })
                  }
                  disabled={confirmingScoringChange}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmScoringChange}
                  disabled={confirmingScoringChange}
                  className="px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {confirmingScoringChange
                    ? "Saving..."
                    : "Confirm & Save Anyway"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateProRoomPage;
