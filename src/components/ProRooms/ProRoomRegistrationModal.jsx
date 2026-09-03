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
  const [customAnswers, setCustomAnswers] = useState({});
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
      }
    } catch (err) {
      console.error("Error loading user info for registration:", err);
    }
  };

  if (!isOpen || !room) return null;

  // Custom registration questions (Filter out Host FAQ items which have an 'answer' property)
  const customQuestions = Array.isArray(room?.custom_registration_questions)
    ? room.custom_registration_questions
    : Array.isArray(room?.custom_questions)
      ? room.custom_questions.filter((q) => !q.answer && !q.is_faq)
      : Array.isArray(room?.custom_app_questions)
        ? room.custom_app_questions.filter((q) => !q.answer && !q.is_faq)
        : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      if (showToast) showToast("⚠️ Please sign in to register for this room.");
      return;
    }

    setSubmitting(true);
    try {
      // Respect the host's require_application setting (set in
      // CreateProRoomPage.jsx) — previously every registration was
      // hardcoded to "approved" regardless of it, silently ignoring any
      // host who configured manual application review.
      const requiresReview = room.require_application === true;

      const payload = {
        room_id: room.id,
        user_id: currentUser.id,
        status: requiresReview ? "pending" : "approved",
        answers_json: customAnswers,
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
          {/* Registration Closed Notice if opened directly */}
          {room?.reg_end_at && new Date() > new Date(room.reg_end_at) ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Trophy size={24} />
              </div>
              <h3 className="text-base font-bold text-white">Registration Closed</h3>
              <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                Sorry, registration for this room is closed. Please check out other active or upcoming rooms.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition cursor-pointer"
              >
                Close & Explore Other Rooms
              </button>
            </div>
          ) : (
            <>
          {/* Top Banner */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#00F0FF] uppercase tracking-widest block mb-1">
                {room.require_application === true
                  ? "Application Review Required"
                  : "Automatic Registration"}
              </span>
              <h3 className="text-base font-bold text-white leading-snug">
                Register for {room.name || room.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

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
          <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1 no-scrollbar">
            {/* Auto-filled Profile Info */}
            <div className="space-y-2 bg-[#06060c] border border-white/5 rounded-2xl p-4">
              <h4 className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <ShieldCheck size={13} className="text-emerald-400" />{" "}
                Participant Profile Info
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

            {/* Custom Registration Questions from Host */}
            {customQuestions.length > 0 && (
              <div className="space-y-3 bg-[#06060c] border border-cyan-500/20 rounded-2xl p-4">
                <h4 className="text-[11px] font-mono font-bold text-[#00F0FF] uppercase tracking-wider">
                  Registration Eligibility Questions
                </h4>
                {customQuestions.map((q, idx) => (
                  <div key={q.id || idx} className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-200 block">
                      {q.question || q.text || `Question ${idx + 1}`} *
                    </label>
                    <input
                      type="text"
                      required
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

            {/* Terms / Confirmation notice */}
            <p className="text-[10px] text-gray-500 leading-relaxed font-mono">
              {room.require_application === true
                ? "By registering, you agree to abide by event rules. The host reviews applications manually — you'll be notified once yours is approved."
                : "By registering, you agree to abide by event rules. Registration is automatically approved instantly."}
            </p>

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
                disabled={submitting}
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
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProRoomRegistrationModal;
