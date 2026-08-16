import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiX,
  FiPlus,
  FiTrash2,
  FiLayers,
  FiHelpCircle,
  FiCode,
  FiCalendar,
  FiShield,
  FiAward,
  FiBriefcase,
  FiSliders,
  FiCheck,
} from "react-icons/fi";
import { Building2, Sparkles, Trophy, Zap, ShieldCheck } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";

const EVENT_TYPES = [
  "Hackathon",
  "Hiring Assessment",
  "Coding Contest",
  "MCQ Competition",
  "Technical Assessment",
  "College Fest",
  "CTF",
  "Innovation Challenge",
  "Data/AI Competition",
  "Custom Event",
];

const QUESTION_TYPES = [
  { id: "mcq", label: "Multiple Choice (MCQ)" },
  { id: "msq", label: "Multiple Select (MSQ)" },
  { id: "true_false", label: "True / False" },
  { id: "short_answer", label: "Short Answer" },
  { id: "coding", label: "Coding Problem (+ Test Cases)" },
  { id: "sql", label: "SQL Query Assessment" },
  { id: "debugging", label: "Debugging Challenge" },
  { id: "file_upload", label: "File Upload / GitHub URL" },
  { id: "project", label: "Project Submission" },
];

const CreateProRoomModal = ({ onClose, onRoomCreated }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("basic"); // 'basic', 'schedule', 'eligibility', 'sections', 'evaluation', 'hiring_hackathon', 'rewards'
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Basic Info State
  const [basicInfo, setBasicInfo] = useState({
    name: "",
    title: "",
    short_description: "",
    detailed_description: "",
    category: "Coding",
    event_type: "Coding Contest",
    org_name: "",
    org_logo: "",
    cover_image: "",
  });

  // 2. Event Schedule State
  const [schedule, setSchedule] = useState({
    reg_start_at: new Date().toISOString().slice(0, 16),
    reg_end_at: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
    event_start_at: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
    event_end_at: new Date(Date.now() + 86400000 * 2 + 10800000).toISOString().slice(0, 16),
    timezone: "IST (UTC+5:30)",
    duration_minutes: 180,
    allow_late_entry: true,
  });

  // 3. Eligibility State
  const [eligibility, setEligibility] = useState({
    access_type: "public",
    max_participants: 500,
    min_age: 18,
    max_age: 40,
    target_college: "",
    target_degree: "B.Tech / B.E / M.Tech / MCA / B.Sc CS",
    target_branch: "CS, IT, ECE, AI/ML, Data Science",
    grad_years: "2024, 2025, 2026, 2027",
    exp_level: "All Levels",
    required_skills: "Data Structures, Algorithms, Problem Solving",
    min_glitch_level: 1,
    participation_type: "individual",
    require_application: false,
    custom_app_questions: [
      { id: "q1", question: "Why do you want to join this assessment?", type: "text" },
      { id: "q2", question: "Provide your GitHub / Portfolio URL", type: "url" },
    ],
  });

  // 4. Assessment Sections & Questions Builder State
  const [sections, setSections] = useState([
    {
      id: "sec-1",
      section_name: "Section 1: Aptitude & Fundamentals",
      section_type: "mcq",
      order_index: 1,
      time_limit_minutes: 30,
      total_points: 20,
      questions: [
        {
          id: "q-101",
          question_text: "What is the time complexity of building a heap from an array of N elements?",
          question_type: "mcq",
          difficulty: "Medium",
          points: 10,
          options: ["O(N log N)", "O(N)", "O(N^2)", "O(log N)"],
          correct_answer: "O(N)",
          evaluation_method: "auto",
        },
      ],
    },
    {
      id: "sec-2",
      section_name: "Section 2: Algorithmic Coding Challenge",
      section_type: "coding",
      order_index: 2,
      time_limit_minutes: 60,
      total_points: 50,
      questions: [
        {
          id: "q-102",
          question_text: "Write a function to find the length of the longest substring without repeating characters.",
          question_type: "coding",
          difficulty: "Hard",
          points: 50,
          test_cases: [
            { input: '"abcabcbb"', expected_output: "3" },
            { input: '"bbbbb"', expected_output: "1" },
            { input: '"pwwkew"', expected_output: "3" },
          ],
          evaluation_method: "auto",
        },
      ],
    },
  ]);

  // 5. Evaluation Rules State
  const [evaluation, setEvaluation] = useState({
    passing_score: 40,
    total_possible_score: 100,
    negative_marking: false,
    tie_breaker_rule: "score_speed",
  });

  // 6. Hiring & Hackathon State
  const [hiringHackathon, setHiringHackathon] = useState({
    is_hiring_drive: false,
    hiring_stages: ["Assessment", "Shortlist", "Technical Interview", "Final Interview"],
    is_hackathon: false,
    max_team_size: 4,
    hackathon_rubrics: [
      { name: "Innovation & Originality", weight: 25 },
      { name: "Technical Complexity", weight: 30 },
      { name: "Design & UX", weight: 20 },
      { name: "Real-world Impact", weight: 15 },
      { name: "Execution & Demo", weight: 10 },
    ],
  });

  // 7. Rewards & Certificates State
  const [rewards, setRewards] = useState({
    gbits_prize_pool: 1000,
    has_participation_certificate: true,
    has_winner_certificate: true,
    has_achievement_badge: true,
    prize_details: "Winner: Certificate + Winner Badge + 500 gBits | Top 10: Achievement Badge | All: Participation Certificate",
  });

  // Handler helpers for Sections & Questions
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
        total_points: 20,
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
                question_text: "New Question Statement",
                question_type: "mcq",
                difficulty: "Medium",
                points: 10,
                options: ["Option A", "Option B", "Option C", "Option D"],
                correct_answer: "Option A",
                evaluation_method: "auto",
              },
            ],
          };
        }
        return s;
      })
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
      })
    );
  };

  const updateQuestion = (secId, qId, updatedFields) => {
    setSections(
      sections.map((s) => {
        if (s.id === secId) {
          return {
            ...s,
            questions: s.questions.map((q) => (q.id === qId ? { ...q, ...updatedFields } : q)),
          };
        }
        return s;
      })
    );
  };

  const handleSaveProRoom = async () => {
    if (!basicInfo.name || !basicInfo.org_name) {
      setErrorMsg("Please fill in Room Name and Organization Name.");
      setActiveTab("basic");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (!userId) {
        throw new Error("You must be logged in to create a Pro Room.");
      }

      // Calculate total points
      const totalPoints = sections.reduce(
        (sum, sec) => sum + sec.questions.reduce((qSum, q) => qSum + Number(q.points || 0), 0),
        0
      );

      // 1. Insert into `pro_rooms`
      const roomPayload = {
        name: basicInfo.name,
        title: basicInfo.title || basicInfo.name,
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
        status: "registration_open",

        access_type: eligibility.access_type,
        max_participants: Number(eligibility.max_participants) || 500,
        min_age: Number(eligibility.min_age) || 18,
        max_age: Number(eligibility.max_age) || 40,
        target_college: eligibility.target_college,
        target_degree: eligibility.target_degree,
        target_branch: eligibility.target_branch,
        grad_years: eligibility.grad_years,
        exp_level: eligibility.exp_level,
        required_skills: eligibility.required_skills,
        min_glitch_level: Number(eligibility.min_glitch_level) || 1,
        participation_type: eligibility.participation_type,
        require_application: eligibility.require_application,
        custom_app_questions: eligibility.custom_app_questions,

        passing_score: Number(evaluation.passing_score) || 40,
        total_possible_score: totalPoints || 100,
        negative_marking: evaluation.negative_marking,
        tie_breaker_rule: evaluation.tie_breaker_rule,

        is_hiring_drive: hiringHackathon.is_hiring_drive,
        hiring_stages: hiringHackathon.hiring_stages,
        is_hackathon: hiringHackathon.is_hackathon,
        max_team_size: Number(hiringHackathon.max_team_size) || 4,
        hackathon_rubrics: hiringHackathon.hackathon_rubrics,

        gbits_prize_pool: Number(rewards.gbits_prize_pool) || 500,
        has_participation_certificate: rewards.has_participation_certificate,
        has_winner_certificate: rewards.has_winner_certificate,
        has_achievement_badge: rewards.has_achievement_badge,
        prize_details: rewards.prize_details,
      };

      const { data: createdRoom, error: roomErr } = await supabase
        .from("pro_rooms")
        .insert(roomPayload)
        .select()
        .single();

      if (roomErr) throw roomErr;

      const roomId = createdRoom.id;

      // 2. Insert Sections & Questions
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
            total_points: Number(sec.total_points) || 20,
          })
          .select()
          .single();

        if (createdSec && sec.questions && sec.questions.length > 0) {
          const qPayloads = sec.questions.map((q, qIdx) => ({
            room_id: roomId,
            section_id: createdSec.id,
            question_text: q.question_text,
            description: q.description || "",
            question_type: q.question_type,
            difficulty: q.difficulty || "Medium",
            points: Number(q.points) || 10,
            options: q.options || [],
            correct_answer: q.correct_answer || "",
            test_cases: q.test_cases || [],
            evaluation_method: q.evaluation_method || "auto",
            order_index: qIdx + 1,
          }));

          await supabase.from("pro_room_questions").insert(qPayloads);
        }
      }

      onRoomCreated();
      navigate(`/pro-rooms/${roomId}`);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to create Pro Room.");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: Building2 },
    { id: "schedule", label: "Schedule", icon: FiCalendar },
    { id: "eligibility", label: "Eligibility", icon: FiShield },
    { id: "sections", label: "Assessment Builder", icon: FiCode },
    { id: "evaluation", label: "Evaluation Rules", icon: FiSliders },
    { id: "hiring_hackathon", label: "Hiring / Hackathon", icon: FiBriefcase },
    { id: "rewards", label: "Rewards & Certs", icon: FiAward },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-4xl bg-[#0d0d16] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
      >
        {/* Neon Gradient Header Bar */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#00F0FF] via-purple-500 to-[#FF00C8] absolute top-0 left-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck size={20} className="text-[#00F0FF]" /> Configure New Pro Room Arena
            </h2>
            <p className="text-xs text-gray-400">
              Set up competitions, hiring assessments, hackathons, and technical screening events
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition cursor-pointer"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto py-3 border-b border-white/5 shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === t.id
                  ? "bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF]"
                  : "bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="my-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Tab Body Content */}
        <div className="overflow-y-auto py-6 pr-1 space-y-6 flex-1">
          {/* TAB 1: BASIC INFO */}
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Event / Room Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. MIT Arena Battle — AI Systems & Algorithmic Design"
                  value={basicInfo.name}
                  onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                  className="w-full bg-[#07070e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Organization / University / Company *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MIT CSAIL, Google, Glitch Labs"
                    value={basicInfo.org_name}
                    onChange={(e) => setBasicInfo({ ...basicInfo, org_name: e.target.value })}
                    className="w-full bg-[#07070e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Event Type *
                  </label>
                  <select
                    value={basicInfo.event_type}
                    onChange={(e) => setBasicInfo({ ...basicInfo, event_type: e.target.value })}
                    className="w-full bg-[#07070e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Short Description *
                </label>
                <input
                  type="text"
                  placeholder="Brief 1-line overview of the assessment or competition"
                  value={basicInfo.short_description}
                  onChange={(e) => setBasicInfo({ ...basicInfo, short_description: e.target.value })}
                  className="w-full bg-[#07070e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Detailed Description & Guidelines
                </label>
                <textarea
                  rows={4}
                  placeholder="Comprehensive event details, format, prerequisites, code execution guidelines..."
                  value={basicInfo.detailed_description}
                  onChange={(e) => setBasicInfo({ ...basicInfo, detailed_description: e.target.value })}
                  className="w-full bg-[#07070e] border border-white/10 rounded-xl p-4 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Organization Logo URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={basicInfo.org_logo}
                    onChange={(e) => setBasicInfo({ ...basicInfo, org_logo: e.target.value })}
                    className="w-full bg-[#07070e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Cover Banner Image URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={basicInfo.cover_image}
                    onChange={(e) => setBasicInfo({ ...basicInfo, cover_image: e.target.value })}
                    className="w-full bg-[#07070e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCHEDULE */}
          {activeTab === "schedule" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Registration Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={schedule.reg_start_at}
                    onChange={(e) => setSchedule({ ...schedule, reg_start_at: e.target.value })}
                    className="w-full bg-[#07070e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Registration End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={schedule.reg_end_at}
                    onChange={(e) => setSchedule({ ...schedule, reg_end_at: e.target.value })}
                    className="w-full bg-[#07070e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Event Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={schedule.event_start_at}
                    onChange={(e) => setSchedule({ ...schedule, event_start_at: e.target.value })}
                    className="w-full bg-[#07070e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Event End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={schedule.event_end_at}
                    onChange={(e) => setSchedule({ ...schedule, event_end_at: e.target.value })}
                    className="w-full bg-[#07070e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Time Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={schedule.duration_minutes}
                    onChange={(e) => setSchedule({ ...schedule, duration_minutes: e.target.value })}
                    className="w-full bg-[#07070e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Time Zone
                  </label>
                  <input
                    type="text"
                    value={schedule.timezone}
                    onChange={(e) => setSchedule({ ...schedule, timezone: e.target.value })}
                    className="w-full bg-[#07070e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ELIGIBILITY */}
          {activeTab === "eligibility" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Access Permission
                  </label>
                  <select
                    value={eligibility.access_type}
                    onChange={(e) => setEligibility({ ...eligibility, access_type: e.target.value })}
                    className="w-full bg-[#07070e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                  >
                    <option value="public">Public (Open to All)</option>
                    <option value="private">Private / Invite Only</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Max Participant Capacity
                  </label>
                  <input
                    type="number"
                    value={eligibility.max_participants}
                    onChange={(e) => setEligibility({ ...eligibility, max_participants: e.target.value })}
                    className="w-full bg-[#07070e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Required Target Skills & Experience Level
                </label>
                <input
                  type="text"
                  placeholder="e.g. Python, SQL, DSA, Deep Learning, React"
                  value={eligibility.required_skills}
                  onChange={(e) => setEligibility({ ...eligibility, required_skills: e.target.value })}
                  className="w-full bg-[#07070e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                />
              </div>
            </div>
          )}

          {/* TAB 4: ASSESSMENT BUILDER */}
          {activeTab === "sections" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FiLayers className="text-[#00F0FF]" /> Test Sections ({sections.length})
                </h3>
                <button
                  type="button"
                  onClick={addSection}
                  className="px-3 py-1.5 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-bold flex items-center gap-1 hover:bg-[#00F0FF]/25 cursor-pointer"
                >
                  <FiPlus /> Add Section
                </button>
              </div>

              {sections.map((sec, secIdx) => (
                <div
                  key={sec.id}
                  className="bg-[#07070e] border border-white/10 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <input
                      type="text"
                      value={sec.section_name}
                      onChange={(e) =>
                        setSections(
                          sections.map((s) => (s.id === sec.id ? { ...s, section_name: e.target.value } : s))
                        )
                      }
                      className="bg-transparent font-bold text-sm text-white border-b border-cyan-500/30 focus:border-[#00F0FF] outline-none px-1"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => addQuestion(sec.id)}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold flex items-center gap-1 hover:bg-purple-500/30 cursor-pointer"
                      >
                        <FiPlus /> Add Question
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(sec.id)}
                        className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Section Questions */}
                  <div className="space-y-4 pl-2 border-l-2 border-cyan-500/20">
                    {sec.questions.map((q, qIdx) => (
                      <div key={q.id} className="bg-[#0d0d16] border border-white/5 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-mono text-[#00F0FF] font-bold">
                            Q{qIdx + 1}.
                          </span>
                          <select
                            value={q.question_type}
                            onChange={(e) =>
                              updateQuestion(sec.id, q.id, { question_type: e.target.value })
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
                              updateQuestion(sec.id, q.id, { points: e.target.value })
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

                        {/* Question Text */}
                        <input
                          type="text"
                          placeholder="Question Statement..."
                          value={q.question_text}
                          onChange={(e) =>
                            updateQuestion(sec.id, q.id, { question_text: e.target.value })
                          }
                          className="w-full bg-[#12121e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#00F0FF]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: EVALUATION RULES */}
          {activeTab === "evaluation" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Passing Score (Points)
                  </label>
                  <input
                    type="number"
                    value={evaluation.passing_score}
                    onChange={(e) => setEvaluation({ ...evaluation, passing_score: e.target.value })}
                    className="w-full bg-[#07070e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Tie-Breaker Rule
                  </label>
                  <select
                    value={evaluation.tie_breaker_rule}
                    onChange={(e) => setEvaluation({ ...evaluation, tie_breaker_rule: e.target.value })}
                    className="w-full bg-[#07070e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                  >
                    <option value="score_speed">1. Higher Score → 2. Faster Completion</option>
                    <option value="score_coding_speed">1. Higher Score → 2. Higher Coding Score</option>
                    <option value="early_submission">1. Higher Score → 2. Earlier Registration</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: HIRING / HACKATHON */}
          {activeTab === "hiring_hackathon" && (
            <div className="space-y-6">
              <div className="p-4 bg-[#07070e] border border-white/10 rounded-2xl space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                  <input
                    type="checkbox"
                    checked={hiringHackathon.is_hiring_drive}
                    onChange={(e) =>
                      setHiringHackathon({ ...hiringHackathon, is_hiring_drive: e.target.checked })
                    }
                    className="rounded text-[#00F0FF]"
                  />
                  Configure as Company Hiring Drive / Recruitment Screening
                </label>
              </div>

              <div className="p-4 bg-[#07070e] border border-white/10 rounded-2xl space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                  <input
                    type="checkbox"
                    checked={hiringHackathon.is_hackathon}
                    onChange={(e) =>
                      setHiringHackathon({ ...hiringHackathon, is_hackathon: e.target.checked })
                    }
                    className="rounded text-[#00F0FF]"
                  />
                  Configure as Team Hackathon / Innovation Challenge
                </label>
              </div>
            </div>
          )}

          {/* TAB 7: REWARDS & CERTIFICATES */}
          {activeTab === "rewards" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  gBits Prize Pool Amount
                </label>
                <input
                  type="number"
                  value={rewards.gbits_prize_pool}
                  onChange={(e) => setRewards({ ...rewards, gbits_prize_pool: e.target.value })}
                  className="w-full bg-[#07070e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Prize Details & Winner Structure
                </label>
                <textarea
                  rows={3}
                  value={rewards.prize_details}
                  onChange={(e) => setRewards({ ...rewards, prize_details: e.target.value })}
                  className="w-full bg-[#07070e] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-[#00F0FF]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveProRoom}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00F0FF] to-purple-600 hover:from-[#00F0FF] hover:to-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#00F0FF]/20 transition cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving Pro Room Arena..." : "Publish Pro Room Arena"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateProRoomModal;
