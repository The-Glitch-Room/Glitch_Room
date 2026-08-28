import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Building2,
  Cpu,
  ShieldCheck,
  HelpCircle,
  Send,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  LifeBuoy,
  MessageSquare,
} from "lucide-react";
import { supabase } from "../../supabaseClient";

const ProRoomHelpModal = ({ isOpen, onClose, room, showToast }) => {
  const [activeTab, setActiveTab] = useState("host"); // 'host' | 'platform'

  // Host Support Form State
  const [hostSubject, setHostSubject] = useState("");
  const [hostMessage, setHostMessage] = useState("");
  const [submittingHost, setSubmittingHost] = useState(false);

  // Platform Support Form State
  const [platSubject, setPlatSubject] = useState("");
  const [platMessage, setPlatMessage] = useState("");
  const [submittingPlat, setSubmittingPlat] = useState(false);

  if (!isOpen) return null;

  const handleSendHostTicket = async (e) => {
    e.preventDefault();
    if (!hostSubject.trim() || !hostMessage.trim()) {
      showToast("Please enter a subject and message for the Host.");
      return;
    }
    setSubmittingHost(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;

      const payload = {
        room_id: room?.id,
        user_id: uid || null,
        target: "host",
        subject: hostSubject.trim(),
        message: hostMessage.trim(),
        status: "open",
      };

      const { error } = await supabase
        .from("pro_room_help_tickets")
        .insert([payload]);

      if (error) {
        console.error("Failed to send host ticket:", error);
        showToast("⚠️ Couldn't send your message — please try again.");
        setSubmittingHost(false);
        return;
      }

      showToast("Support ticket sent directly to the Host!");
      setHostSubject("");
      setHostMessage("");
    } catch (err) {
      console.error("Error sending host ticket:", err);
      showToast("⚠️ Couldn't send your message — please try again.");
    } finally {
      setSubmittingHost(false);
    }
  };

  const handleSendPlatformTicket = async (e) => {
    e.preventDefault();
    if (!platSubject.trim() || !platMessage.trim()) {
      showToast("Please enter a subject and message for Glitch Support.");
      return;
    }
    setSubmittingPlat(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;

      const payload = {
        room_id: room?.id,
        user_id: uid || null,
        target: "platform",
        subject: platSubject.trim(),
        message: platMessage.trim(),
        status: "open",
      };

      const { error } = await supabase
        .from("pro_room_help_tickets")
        .insert([payload]);

      if (error) {
        console.error("Failed to send platform ticket:", error);
        showToast("⚠️ Couldn't report the issue — please try again.");
        setSubmittingPlat(false);
        return;
      }

      showToast("Platform issue reported to Glitch Support!");
      setPlatSubject("");
      setPlatMessage("");
    } catch (err) {
      console.error("Error sending platform ticket:", err);
      showToast("⚠️ Couldn't report the issue — please try again.");
    } finally {
      setSubmittingPlat(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#0c0c16] border border-white/15 rounded-3xl shadow-2xl overflow-hidden font-sans text-white my-auto"
        >
          {/* STICKY MODAL HEADER */}
          <div className="relative p-5 sm:p-6 border-b border-white/10 bg-[#07070e] shrink-0 space-y-3">
            {/* Top Decorative Cyber Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00F0FF] via-purple-500 to-[#FF00C8]" />

            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#00F0FF] uppercase">
                  DUAL SUPPORT DESK
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <LifeBuoy size={20} className="text-[#00F0FF]" /> Pro Room
                  Help & Support
                </h2>
                <p className="text-xs text-gray-400">
                  Get assistance from either the event Host or the Glitch Room
                  Platform engineering team.
                </p>
              </div>

              {/* Close Button - Always visible */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer border border-white/10 shrink-0"
                title="Close Help Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* DUAL SUPPORT TABS */}
            <div className="grid grid-cols-2 gap-2 bg-[#030308] p-1.5 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab("host")}
                className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "host"
                    ? "bg-purple-600/20 border border-purple-500/40 text-purple-300 shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Building2 size={15} /> Host Support
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("platform")}
                className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "platform"
                    ? "bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Cpu size={15} /> Glitch Platform Support
              </button>
            </div>
          </div>

          {/* SCROLLABLE MODAL BODY */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
            {/* TAB 1: HOST SUPPORT */}
            {activeTab === "host" && (
              <div className="space-y-5">
                {/* Organization Info Box */}
                <div className="p-4 rounded-2xl bg-[#07070e] border border-white/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {room?.org_logo ? (
                      <img
                        src={room.org_logo}
                        alt={room.org_name}
                        className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0 bg-black/40"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-300">
                        <Building2 size={20} />
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        {room?.org_name || "Verified Organization"}{" "}
                        <ShieldCheck size={13} className="text-[#00F0FF]" />
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        Event Host for{" "}
                        {room?.name || room?.title || "this Pro Room"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold shrink-0">
                    Verified Host
                  </span>
                </div>

                {/* Host FAQ Preview */}
                {Array.isArray(room?.custom_app_questions) &&
                  room.custom_app_questions.filter(
                    (q) => q && (q.question || q.title),
                  ).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                        <HelpCircle size={14} className="text-purple-400" />{" "}
                        Host FAQ Quick Answers
                      </h4>
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {room.custom_app_questions
                          .filter((q) => q && (q.question || q.title))
                          .map((faq, idx) => (
                            <details
                              key={idx}
                              className="bg-[#07070e] border border-white/5 rounded-xl p-3 text-xs group cursor-pointer"
                            >
                              <summary className="font-bold text-gray-200 list-none flex items-center justify-between">
                                <span>Q: {faq.question || faq.title}</span>
                                <span className="text-purple-400 text-sm group-open:rotate-180 transition-transform">
                                  ▾
                                </span>
                              </summary>
                              <p className="mt-2 text-gray-400 leading-relaxed pt-2 border-t border-white/5">
                                {faq.answer ||
                                  faq.description ||
                                  "Refer to room rules or message host below."}
                              </p>
                            </details>
                          ))}
                      </div>
                    </div>
                  )}

                {/* Private Host Ticket Form */}
                <form
                  onSubmit={handleSendHostTicket}
                  className="space-y-3 pt-2 border-t border-white/10"
                >
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-purple-400" /> Send
                    Private Ticket to Host
                  </h4>
                  <input
                    type="text"
                    placeholder="Subject (e.g., Question about submission rules)..."
                    value={hostSubject}
                    onChange={(e) => setHostSubject(e.target.value)}
                    className="w-full bg-[#030308] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-purple-500"
                  />
                  <textarea
                    rows={3}
                    placeholder="Describe your issue or query for the host..."
                    value={hostMessage}
                    onChange={(e) => setHostMessage(e.target.value)}
                    className="w-full bg-[#030308] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-purple-500 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={submittingHost}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/25 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingHost
                      ? "Sending Ticket..."
                      : "Send Ticket to Host →"}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: GLITCH PLATFORM SUPPORT */}
            {activeTab === "platform" && (
              <div className="space-y-5">
                {/* Platform Operational Banner */}
                <div className="p-4 rounded-2xl bg-[#07070e] border border-[#00F0FF]/30 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center shrink-0 text-[#00F0FF]">
                      <Terminal size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        Glitch Platform Engines{" "}
                        <CheckCircle2 size={13} className="text-emerald-400" />
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        All code execution, evaluation, and realtime servers
                        active
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] font-bold shrink-0">
                    99.9% Uptime
                  </span>
                </div>

                {/* Troubleshooting Tips */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-400" />{" "}
                    Technical Troubleshooting
                  </h4>
                  <div className="p-3.5 rounded-xl bg-[#030308] border border-white/5 space-y-2 text-xs text-gray-400">
                    <p>
                      •{" "}
                      <strong className="text-white">
                        Code Runner Stalled?
                      </strong>{" "}
                      Refresh the browser page or re-select your language
                      dialect.
                    </p>
                    <p>
                      •{" "}
                      <strong className="text-white">
                        Focus Monitor Alert?
                      </strong>{" "}
                      Avoid leaving the browser tab during timed assessment
                      sections.
                    </p>
                    <p>
                      • <strong className="text-white">Session Sync?</strong>{" "}
                      Ensure your network connection remains active during code
                      submission.
                    </p>
                  </div>
                </div>

                {/* Platform Ticket Form */}
                <form
                  onSubmit={handleSendPlatformTicket}
                  className="space-y-3 pt-2 border-t border-white/10"
                >
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Send size={14} className="text-[#00F0FF]" /> Report
                    Technical Platform Issue
                  </h4>
                  <input
                    type="text"
                    placeholder="Subject (e.g., Compiler error or page crash)..."
                    value={platSubject}
                    onChange={(e) => setPlatSubject(e.target.value)}
                    className="w-full bg-[#030308] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-[#00F0FF]"
                  />
                  <textarea
                    rows={3}
                    placeholder="Explain the technical glitch or issue you encountered..."
                    value={platMessage}
                    onChange={(e) => setPlatMessage(e.target.value)}
                    className="w-full bg-[#030308] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-[#00F0FF] resize-none"
                  />
                  <button
                    type="submit"
                    disabled={submittingPlat}
                    className="w-full py-2.5 rounded-xl bg-[#00F0FF]/20 border border-[#00F0FF]/40 text-[#00F0FF] hover:bg-[#00F0FF]/30 text-xs font-bold transition shadow-lg shadow-[#00F0FF]/15 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingPlat
                      ? "Submitting Report..."
                      : "Submit Technical Ticket to Glitch Support →"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProRoomHelpModal;
