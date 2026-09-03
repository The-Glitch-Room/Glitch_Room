import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShieldCheck,
  Building2,
  Trophy,
  CheckCircle2,
  User,
  Mail,
  AtSign,
  Lock,
  Globe,
  Briefcase,
  Check,
} from "lucide-react";
import { supabase } from "../../supabaseClient";

const ProRoomRegistrationModal = ({
  isOpen,
  onClose,
  room,
  onRegistrationSuccess,
  showToast,
}) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [orgCollege, setOrgCollege] = useState("");
  const [currentRole, setCurrentRole] = useState("Student");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [customAnswers, setCustomAnswers] = useState({});
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUserInfo();
    }
  }, [isOpen]);

  const loadUserInfo = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (user) {
        setCurrentUser(user);
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        setUserProfile(prof);
        if (prof?.college) setOrgCollege(prof.college);
      }
    } catch (err) {
      console.error("Error loading user info for registration:", err);
    }
  };

  if (!isOpen || !room) return null;

  const isClosed = room?.reg_end_at && new Date() > new Date(room.reg_end_at);

  // Read explicitly defined candidate registration questions (fallback to questions without answer)
  const customQuestions = Array.isArray(room?.custom_registration_questions) && room.custom_registration_questions.length > 0
    ? room.custom_registration_questions
    : Array.isArray(room?.custom_questions)
      ? room.custom_questions.filter((q) => !q.answer && !q.is_faq)
      : Array.isArray(room?.custom_app_questions)
        ? room.custom_app_questions.filter((q) => !q.answer && !q.is_faq)
        : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isClosed) {
      if (showToast) showToast("⚠️ Registration for this room is closed.");
      onClose();
      return;
    }

    if (!agreedToRules) {
      if (showToast) showToast("⚠️ Please confirm that your information is accurate and accept event rules.");
      return;
    }

    if (!currentUser) {
      if (showToast) showToast("⚠️ Please sign in to register for this room.");
      return;
    }

    setSubmitting(true);
    try {
      const requiresReview = room.require_application === true;

      const payload = {
        room_id: room.id,
        user_id: currentUser.id,
        status: requiresReview ? "pending" : "approved",
        answers_json: {
          ...customAnswers,
          _organization_college: orgCollege,
          _current_role: currentRole,
          _portfolio_url: portfolioUrl,
        },
        registered_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("pro_room_registrations")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Registration insert failed:", error);
        if (showToast) {
          showToast(
            "⚠️ Registration couldn't be completed — please try again.",
          );
        }
        setSubmitting(false);
        return;
      }

      if (showToast) {
        showToast(
          requiresReview
            ? `📝 Application submitted for ${room.name || room.title} — the host will review it.`
            : `🎉 Registration approved! Welcome to ${room.name || room.title}`,
        );
      }
      if (onRegistrationSuccess) onRegistrationSuccess(data);
      onClose();
    } catch (err) {
      console.error("Error submitting registration:", err);
      if (showToast) showToast("⚠️ Failed to submit registration.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#0c0c16] border border-[#00F0FF]/30 rounded-3xl max-w-lg w-full max-h-[85vh] max-h-[85dvh] flex flex-col p-6 shadow-2xl shadow-[#00F0FF]/10 text-left relative my-auto overflow-hidden"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#00F0FF] uppercase tracking-widest block mb-1">
                {isClosed
                  ? "Registration Closed"
                  : room.require_application === true
                    ? "Application Review Required"
                    : "Automatic Registration"}
              </span>
              <h3 className="text-base font-bold text-white leading-snug">
                {room.name || room.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {isClosed ? (
            <div className="text-center py-8 space-y-4 flex-1 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Lock size={28} />
              </div>
              <h3 className="text-base font-bold text-white">Registration Closed</h3>
              <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                Sorry, registration for this room is closed. Please check out other active or upcoming rooms.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition cursor-pointer"
              >
                Close & Explore Other Rooms
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-4 pt-4">
              {/* Event Quick Info Pill */}
              <div className="bg-[#06060c] border border-white/5 rounded-2xl p-4 flex items-center justify-between text-xs font-mono text-gray-300">
                <div className="flex items-center gap-2">
                  <Building2 size={15} className="text-[#00F0FF]" />
                  <span className="truncate max-w-[150px]">
                    {room.org_name || "Verified Org"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Trophy size={14} />
                  <span>
                    {room.gbits_prize_pool
                      ? `${room.gbits_prize_pool} gBits`
                      : "Rewards Pool"}
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* 1. Account Information (Read-Only) */}
                <div className="space-y-2.5 bg-[#06060c] border border-white/5 rounded-2xl p-4">
                  <h4 className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <ShieldCheck size={13} className="text-emerald-400" />{" "}
                    1. Profile Verification (Read-Only)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-mono block mb-1">
                        Full Name
                      </label>
                      <div className="bg-[#030308] border border-white/10 rounded-xl px-3 py-2 text-white font-semibold flex items-center gap-2">
                        <User size={13} className="text-gray-500" />
                        <span className="truncate">
                          {userProfile?.full_name ||
                            currentUser?.user_metadata?.full_name ||
                            "Candidate"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-mono block mb-1">
                        Username
                      </label>
                      <div className="bg-[#030308] border border-white/10 rounded-xl px-3 py-2 text-cyan-300 font-mono font-bold flex items-center gap-2">
                        <AtSign size={13} className="text-gray-500" />
                        <span className="truncate">
                          {userProfile?.username || "candidate"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="text-[10px] text-gray-400 font-mono block mb-1">
                      Email Address
                    </label>
                    <div className="bg-[#030308] border border-white/10 rounded-xl px-3 py-2 text-gray-300 font-mono flex items-center gap-2">
                      <Mail size={13} className="text-gray-500" />
                      <span className="truncate">
                        {currentUser?.email || "candidate@glitchroom.com"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Additional Information & Portfolio Links */}
                <div className="space-y-3 bg-[#06060c] border border-white/5 rounded-2xl p-4">
                  <h4 className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Briefcase size={13} className="text-purple-400" />{" "}
                    2. Additional Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-mono block mb-1">
                        College / Organization
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Stanford University / TechCorp"
                        value={orgCollege}
                        onChange={(e) => setOrgCollege(e.target.value)}
                        className="w-full bg-[#030308] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-mono block mb-1">
                        Current Status
                      </label>
                      <select
                        value={currentRole}
                        onChange={(e) => setCurrentRole(e.target.value)}
                        className="w-full bg-[#030308] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00F0FF]"
                      >
                        <option value="Student">Student</option>
                        <option value="Professional">Professional</option>
                        <option value="Freelancer">Freelancer</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-mono block mb-1">
                      GitHub / Portfolio Link (Optional)
                    </label>
                    <div className="flex items-center gap-2 bg-[#030308] border border-white/10 rounded-xl px-3 py-2 focus-within:border-[#00F0FF]">
                      <Globe size={13} className="text-gray-500 shrink-0" />
                      <input
                        type="url"
                        placeholder="https://github.com/yourusername"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        className="w-full bg-transparent text-xs text-white placeholder-gray-600 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Custom Registration Questions from Host */}
                {customQuestions.length > 0 && (
                  <div className="space-y-3 bg-[#06060c] border border-cyan-500/20 rounded-2xl p-4">
                    <h4 className="text-[11px] font-mono font-bold text-[#00F0FF] uppercase tracking-wider">
                      3. Eligibility & Application Questions
                    </h4>
                    {customQuestions.map((q, idx) => (
                      <div key={q.id || idx} className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-200 block">
                          {q.question || q.text || `Question ${idx + 1}`} {q.required !== false ? "*" : "(Optional)"}
                        </label>
                        <input
                          type="text"
                          required={q.required !== false}
                          placeholder="Enter your response..."
                          value={customAnswers[q.id || idx] || ""}
                          onChange={(e) =>
                            setCustomAnswers({
                              ...customAnswers,
                              [q.id || idx]: e.target.value,
                            })
                          }
                          className="w-full bg-[#030308] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. Agreement Checkbox & Approval Notice */}
                <div className="space-y-3 bg-[#06060c] border border-white/5 rounded-2xl p-4">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-300 leading-relaxed">
                    <input
                      type="checkbox"
                      checked={agreedToRules}
                      onChange={(e) => setAgreedToRules(e.target.checked)}
                      className="mt-0.5 rounded border-white/20 bg-black text-[#FF00C8] focus:ring-0 cursor-pointer"
                    />
                    <span>
                      I confirm that the information provided is accurate and I agree to follow the rules and guidelines of this Pro Room.
                    </span>
                  </label>

                  <p className="text-[11px] text-gray-400 font-mono pt-1 border-t border-white/5">
                    {room.require_application === true
                      ? "📝 Host Approval: Your application will be reviewed by the host. You can enter the room once approved."
                      : "⚡ Automatic Approval: Your registration will be approved automatically after submission."}
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !agreedToRules}
                    className="px-6 py-2.5 rounded-xl bg-[#FF00C8] hover:bg-[#d600a8] text-white text-xs font-bold transition shadow-lg shadow-[#FF00C8]/25 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? (
                      room.require_application === true ? (
                        <>Submitting...</>
                      ) : (
                        <>Registering...</>
                      )
                    ) : (
                      <>
                        <CheckCircle2 size={15} />{" "}
                        {room.require_application === true
                          ? "Submit Application"
                          : "Complete Registration"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProRoomRegistrationModal;
