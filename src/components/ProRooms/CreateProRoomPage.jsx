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

  // STEP 1: Basic Information State
  const [basicInfo, setBasicInfo] = useState({
    name: "AI Innovation Hackathon 2026",
    event_type: "Hackathon",
    short_description:
      "Build innovative AI solutions for real-world industry problems.",
    category: "AI / Machine Learning",
    detailed_description:
      "A 48-hour virtual hackathon where innovators, developers, and dreamers come together to build AI-powered solutions for industries such as healthcare, education, sustainability, and more.",
    org_name: "TechNova University",
    org_email: "ananya.sharma@technova.edu",
    organizer_name: "Dr. Ananya Sharma",
    website: "https://technova.edu",
    org_logo:
      "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120",
    cover_image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
  });

  // STEP 2: Schedule State
  const [schedule, setSchedule] = useState({
    reg_start_at: "2026-04-28T10:00",
    reg_end_at: "2026-05-15T10:00",
    event_start_at: "2026-05-18T10:00",
    event_end_at: "2026-05-20T10:00",
    timezone: "IST (UTC+5:30)",
    allow_late_entry: true,
    mode: "Online",
    submission_deadline: "2026-05-20T10:00",
  });

  // STEP 3: Eligibility & Participation State
  const [eligibility, setEligibility] = useState({
    access_type: "public",
    max_participants: 500,
    participation_type: "team",
    max_team_size: 4,
    min_glitch_level: 1,
    required_skills: "Python, PyTorch, React, REST APIs",
    target_college: "All Universities / Colleges",
    target_degree: "B.Tech / B.E / M.Tech / MCA / B.Sc",
    target_branch: "CS, IT, AI/ML, ECE",
    grad_years: "2024, 2025, 2026, 2027",
    exp_level: "All Levels",
    require_application: true,
    custom_app_questions: [
      {
        id: "q1",
        question: "Do I get a participation certificate?",
        answer:
          "Yes, all eligible candidates who complete the assessment will receive a verified certificate.",
      },
      {
        id: "q2",
        question: "Where do I submit my code?",
        answer:
          "Submit your solution directly inside the timed assessment section environment.",
      },
    ],
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

          if (rData) {
            setBasicInfo({
              name: rData.name || rData.title || "",
              event_type: rData.event_type || "Hackathon",
              short_description: rData.short_description || "",
              category: rData.category || "AI / Machine Learning",
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
                timezone: rData.timezone || "IST (UTC+5:30)",
                allow_late_entry: rData.allow_late_entry ?? true,
                mode: rData.mode || "Online",
                submission_deadline: rData.event_end_at
                  ? rData.event_end_at.slice(0, 16)
                  : "",
              });
            }

            setEligibility({
              access_type: rData.access_type || "public",
              max_participants: rData.max_participants || 500,
              participation_type: rData.participation_type || "team",
              max_team_size: rData.max_team_size || 4,
              min_glitch_level: rData.min_glitch_level || 1,
              required_skills: rData.required_skills || "",
              target_college: rData.target_college || "All Universities",
              target_degree: rData.target_degree || "All Degrees",
              target_branch: rData.target_branch || "All Branches",
              grad_years: rData.grad_years || "All",
              exp_level: rData.exp_level || "All Levels",
              require_application: rData.require_application ?? true,
              custom_app_questions: Array.isArray(rData.custom_app_questions)
                ? rData.custom_app_questions
                : [],
            });

            setEvaluation({
              eval_method: rData.eval_method || "Automatic + Manual",
              passing_score: rData.passing_score || 50,
              negative_marking: rData.negative_marking ?? false,
              partial_scoring: rData.partial_scoring ?? true,
              tie_breaker_rule: rData.tie_breaker_rule || "score_speed",
              gbits_prize_pool: rData.gbits_prize_pool || 2500,
              has_participation_certificate:
                rData.has_participation_certificate ?? true,
              has_winner_certificate: rData.has_winner_certificate ?? true,
              has_achievement_badge: rData.has_achievement_badge ?? true,
              prize_details: rData.prize_details || "",
            });
          }

          // Fetch Sections & Questions — questions come from
          // pro_room_questions_safe, not the base pro_room_questions table:
          // correct_answer is no longer readable from the base table at
          // all (by anyone, host included — see
          // fix_3_hide_correct_answers.sql), so editing has to go through
          // the view, which re-exposes it specifically because this is the
          // room's host.
          const { data: sRows } = await supabase
            .from("pro_room_sections")
            .select("*")
            .eq("room_id", editRoomId)
            .order("order_index", { ascending: true });

          let sData = [];
          if (sRows && sRows.length > 0) {
            const sectionIds = sRows.map((s) => s.id);
            const { data: qRows, error: qErr } = await supabase
              .from("pro_room_questions_safe")
              .select("*")
              .in("section_id", sectionIds);

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
            setSections(
              sData.map((s) => ({
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
              })),
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
  const [sections, setSections] = useState([
    {
      id: "sec-1",
      section_name: "Section 1: Aptitude & AI Fundamentals",
      section_type: "mcq",
      order_index: 1,
      time_limit_minutes: 30,
      total_points: 100,
      questions: [
        {
          id: "q-1",
          question_text:
            "What is the primary function of self-attention mechanisms in Transformer architectures?",
          question_type: "mcq",
          difficulty: "Medium",
          points: 50,
          options: [
            "Compute weights dynamically between sequence tokens regardless of distance",
            "Perform spatial convolutions on 2D images",
            "Compress embeddings into binary trees",
            "Calculate learning rate decay",
          ],
          correct_answer:
            "Compute weights dynamically between sequence tokens regardless of distance",
        },
      ],
    },
    {
      id: "sec-2",
      section_name: "Section 2: Algorithmic Coding Challenge",
      section_type: "coding",
      order_index: 2,
      time_limit_minutes: 60,
      total_points: 200,
      questions: [
        {
          id: "q-2",
          question_text:
            "Implement an optimal real-time token bucket rate limiter for API requests.",
          question_type: "coding",
          difficulty: "Hard",
          points: 100,
          test_cases: [
            {
              input: '{"capacity": 10, "refill_rate": 2}',
              expected_output: "true",
            },
          ],
        },
      ],
    },
  ]);

  // STEP 5: Evaluation & Rewards State
  const [evaluation, setEvaluation] = useState({
    eval_method: "Automatic + Manual",
    passing_score: 50,
    negative_marking: false,
    partial_scoring: true,
    tie_breaker_rule: "score_speed",
    gbits_prize_pool: 2500,
    has_participation_certificate: true,
    has_winner_certificate: true,
    has_achievement_badge: true,
    prize_details:
      "Winner: Certificate + Winner Badge + 1,500 gBits | Runner-Up: 1,000 gBits | All: Participation Certificate",
  });

  // Calculate duration in hours
  const calculateDurationHours = () => {
    try {
      const start = new Date(schedule.event_start_at);
      const end = new Date(schedule.event_end_at);
      const diffMs = end - start;
      if (diffMs > 0) {
        const hours = Math.round(diffMs / (1000 * 60 * 60));
        return `${hours} Hours`;
      }
    } catch (e) {}
    return "48 Hours";
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
                question_text: "New Assessment Question",
                question_type: "mcq",
                difficulty: "Medium",
                points: 25,
                options: ["Option A", "Option B", "Option C", "Option D"],
                correct_answer: "Option A",
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

  // Final Publish Handler
  const handlePublishProRoom = async () => {
    if (!basicInfo.name || !basicInfo.org_name) {
      setErrorMsg("Please provide Event Name and Organization Name.");
      setCurrentStep(1);
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
        duration_minutes: 2880,
        allow_late_entry: schedule.allow_late_entry,
        status: "registration_open",

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

      let roomId = editRoomId;

      if (editRoomId) {
        const { error: roomErr } = await supabase
          .from("pro_rooms")
          .update(roomPayload)
          .eq("id", editRoomId);

        if (roomErr) throw roomErr;

        // Clean up old sections and questions for this room
        await supabase
          .from("pro_room_questions")
          .delete()
          .eq("room_id", editRoomId);
        await supabase
          .from("pro_room_sections")
          .delete()
          .eq("room_id", editRoomId);
      } else {
        const { data: createdRoom, error: roomErr } = await supabase
          .from("pro_rooms")
          .insert(roomPayload)
          .select()
          .single();

        if (roomErr) throw roomErr;
        roomId = createdRoom.id;
      }

      // Insert Sections & Questions
      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        const { data: createdSec } = await supabase
          .from("pro_room_sections")
          .insert({
            room_id: roomId,
            section_name: sec.section_name,
            section_type: sec.section_type,
            order_index: i + 1,
            time_limit_minutes: Number(sec.time_limit_minutes) || 30,
            total_points: Number(sec.total_points) || 100,
          })
          .select()
          .single();

        if (createdSec && sec.questions && sec.questions.length > 0) {
          const qPayloads = sec.questions.map((q, qIdx) => ({
            room_id: roomId,
            section_id: createdSec.id,
            question_text: q.question_text,
            question_type: q.question_type,
            difficulty: q.difficulty || "Medium",
            points: Number(q.points) || 25,
            options: q.options || [],
            correct_answer: q.correct_answer || "",
            test_cases: q.test_cases || [],
            order_index: qIdx + 1,
          }));

          await supabase.from("pro_room_questions").insert(qPayloads);
        }
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
                    onClick={() => setCurrentStep(s.num)}
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
                onClick={() =>
                  showToast("💾 Pro Room configuration saved as draft!")
                }
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <FiSave size={13} /> Save as Draft
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
                      <select
                        value={basicInfo.event_type}
                        onChange={(e) =>
                          setBasicInfo({
                            ...basicInfo,
                            event_type: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      >
                        {EVENT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
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
                      <select
                        value={basicInfo.category}
                        onChange={(e) =>
                          setBasicInfo({
                            ...basicInfo,
                            category: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
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
                    {/* Logo Box */}
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-2">
                        Organization Logo *
                      </label>
                      <div className="flex items-center gap-3">
                        {basicInfo.org_logo && (
                          <img
                            src={basicInfo.org_logo}
                            alt="Logo"
                            className="w-14 h-14 rounded-2xl object-cover border border-[#FF00C8] shrink-0"
                          />
                        )}
                        <input
                          type="text"
                          placeholder="Paste Logo Image URL..."
                          value={basicInfo.org_logo}
                          onChange={(e) =>
                            setBasicInfo({
                              ...basicInfo,
                              org_logo: e.target.value,
                            })
                          }
                          className="w-full bg-[#06060c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                        />
                      </div>
                    </div>

                    {/* Banner Box */}
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-2">
                        Event Banner / Cover Image *
                      </label>
                      <input
                        type="text"
                        placeholder="Paste Cover Banner URL..."
                        value={basicInfo.cover_image}
                        onChange={(e) =>
                          setBasicInfo({
                            ...basicInfo,
                            cover_image: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                      />
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
                          setSchedule({
                            ...schedule,
                            reg_start_at: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Registration Closes *
                      </label>
                      <input
                        type="datetime-local"
                        value={schedule.reg_end_at}
                        onChange={(e) =>
                          setSchedule({
                            ...schedule,
                            reg_end_at: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Event Starts *
                      </label>
                      <input
                        type="datetime-local"
                        value={schedule.event_start_at}
                        onChange={(e) =>
                          setSchedule({
                            ...schedule,
                            event_start_at: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Event Ends *
                      </label>
                      <input
                        type="datetime-local"
                        value={schedule.event_end_at}
                        onChange={(e) =>
                          setSchedule({
                            ...schedule,
                            event_end_at: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Timezone *
                      </label>
                      <input
                        type="text"
                        value={schedule.timezone}
                        onChange={(e) =>
                          setSchedule({ ...schedule, timezone: e.target.value })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Event Mode *
                      </label>
                      <select
                        value={schedule.mode}
                        onChange={(e) =>
                          setSchedule({ ...schedule, mode: e.target.value })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      >
                        <option value="Online">Online / Virtual</option>
                        <option value="Offline">Offline / In-Person</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Calculated Duration
                      </label>
                      <input
                        type="text"
                        disabled
                        value={durationText}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-[#00F0FF] outline-none cursor-not-allowed"
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
                      <select
                        value={eligibility.access_type}
                        onChange={(e) =>
                          setEligibility({
                            ...eligibility,
                            access_type: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      >
                        <option value="public">Public (Open to All)</option>
                        <option value="private">Private / Invite Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Maximum Participant Limit *
                      </label>
                      <input
                        type="number"
                        value={eligibility.max_participants}
                        onChange={(e) =>
                          setEligibility({
                            ...eligibility,
                            max_participants: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Participation Type *
                      </label>
                      <select
                        value={eligibility.participation_type}
                        onChange={(e) =>
                          setEligibility({
                            ...eligibility,
                            participation_type: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      >
                        <option value="individual">Individual Only</option>
                        <option value="team">Team Participation</option>
                        <option value="both">Both Individual & Team</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Maximum Team Size
                      </label>
                      <input
                        type="number"
                        value={eligibility.max_team_size}
                        onChange={(e) =>
                          setEligibility({
                            ...eligibility,
                            max_team_size: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      />
                    </div>
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
                              <select
                                value={q.question_type}
                                onChange={(e) =>
                                  setSections(
                                    sections.map((s) =>
                                      s.id === sec.id
                                        ? {
                                            ...s,
                                            questions: s.questions.map((qu) =>
                                              qu.id === q.id
                                                ? {
                                                    ...qu,
                                                    question_type:
                                                      e.target.value,
                                                  }
                                                : qu,
                                            ),
                                          }
                                        : s,
                                    ),
                                  )
                                }
                                className="bg-[#12121e] border border-white/10 text-xs text-gray-300 rounded-lg px-2.5 py-1 outline-none"
                              >
                                {QUESTION_TYPES.map((qt) => (
                                  <option key={qt.id} value={qt.id}>
                                    {qt.label}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                placeholder="Points"
                                value={q.points}
                                onChange={(e) =>
                                  setSections(
                                    sections.map((s) =>
                                      s.id === sec.id
                                        ? {
                                            ...s,
                                            questions: s.questions.map((qu) =>
                                              qu.id === q.id
                                                ? {
                                                    ...qu,
                                                    points: e.target.value,
                                                  }
                                                : qu,
                                            ),
                                          }
                                        : s,
                                    ),
                                  )
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
                                setSections(
                                  sections.map((s) =>
                                    s.id === sec.id
                                      ? {
                                          ...s,
                                          questions: s.questions.map((qu) =>
                                            qu.id === q.id
                                              ? {
                                                  ...qu,
                                                  question_text: e.target.value,
                                                }
                                              : qu,
                                          ),
                                        }
                                      : s,
                                  ),
                                )
                              }
                              className="w-full bg-[#12121e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#00F0FF]"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Evaluation Method *
                      </label>
                      <select
                        value={evaluation.eval_method}
                        onChange={(e) =>
                          setEvaluation({
                            ...evaluation,
                            eval_method: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      >
                        <option value="Automatic">
                          Automatic Evaluation (Code & MCQ)
                        </option>
                        <option value="Automatic + Manual">
                          Automatic + Manual Evaluation
                        </option>
                        <option value="AI-Assisted">
                          AI-Assisted Rubric Evaluation
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        gBits Prize Pool Reward
                      </label>
                      <input
                        type="number"
                        value={evaluation.gbits_prize_pool}
                        onChange={(e) =>
                          setEvaluation({
                            ...evaluation,
                            gbits_prize_pool: e.target.value,
                          })
                        }
                        className="w-full bg-[#06060c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Prize Breakdown & Structure
                    </label>
                    <textarea
                      rows={3}
                      value={evaluation.prize_details}
                      onChange={(e) =>
                        setEvaluation({
                          ...evaluation,
                          prize_details: e.target.value,
                        })
                      }
                      className="w-full bg-[#06060c] border border-white/10 rounded-xl p-3.5 text-xs text-white outline-none focus:border-[#00F0FF]"
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
                  onClick={() => setCurrentStep(currentStep + 1)}
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
                      src={basicInfo.cover_image}
                      alt="Banner"
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
    </div>
  );
};

export default CreateProRoomPage;