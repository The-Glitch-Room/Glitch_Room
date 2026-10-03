import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Building2,
  Cpu,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  LifeBuoy,
  MessageSquare,
  Clock,
  User,
  CheckCircle,
  Inbox,
  RefreshCw,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import { supabase } from "../../supabaseClient";

export const TICKET_DELIMITER = "\n\n--- HOST RESPONSE ---\n";

export const parseTicketContent = (ticket) => {
  if (!ticket) return { userMessage: "", hostResponse: null };
  const rawMsg = ticket.message || "";
  if (ticket.host_response) {
    return {
      userMessage: rawMsg.includes(TICKET_DELIMITER)
        ? rawMsg.split(TICKET_DELIMITER)[0].trim()
        : rawMsg,
      hostResponse: ticket.host_response,
    };
  }
  if (rawMsg.includes(TICKET_DELIMITER)) {
    const [uMsg, ...rest] = rawMsg.split(TICKET_DELIMITER);
    return {
      userMessage: uMsg.trim(),
      hostResponse: rest.join(TICKET_DELIMITER).trim(),
    };
  }
  return { userMessage: rawMsg, hostResponse: null };
};

const formatTicketTime = (input) => {
  if (!input) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isSameDay(d, now)) return `Today, ${time}`;
  if (isSameDay(d, yesterday)) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
};

const ProRoomHelpModal = ({
  isOpen,
  onClose,
  room,
  showToast,
  isHost = false,
  currentUserId = null,
  onTicketsUpdated = null,
}) => {
  const [activeTab, setActiveTab] = useState("host"); // 'host' | 'platform'

  // Candidate Sub-tab: 'new' | 'my_tickets'
  const [candidateSubTab, setCandidateSubTab] = useState("new");
  const [candidateTickets, setCandidateTickets] = useState([]);
  const [loadingCandidateTickets, setLoadingCandidateTickets] = useState(false);

  // Host Mode State
  const [hostTickets, setHostTickets] = useState([]);
  const [loadingHostTickets, setLoadingHostTickets] = useState(false);
  const [hostFilter, setHostFilter] = useState("all"); // 'all' | 'open' | 'resolved'
  const [replyInputs, setReplyInputs] = useState({});
  const [replyingTicketId, setReplyingTicketId] = useState(null);

  // Candidate Ticket Form State
  const [hostSubject, setHostSubject] = useState("");
  const [hostMessage, setHostMessage] = useState("");
  const [submittingHost, setSubmittingHost] = useState(false);

  // Platform Support Form State
  const [platSubject, setPlatSubject] = useState("");
  const [platMessage, setPlatMessage] = useState("");
  const [submittingPlat, setSubmittingPlat] = useState(false);

  // Fetch tickets for host
  const fetchHostTickets = async () => {
    if (!room?.id) return;
    setLoadingHostTickets(true);
    try {
      const { data, error } = await supabase
        .from("pro_room_help_tickets")
        .select("*")
        .eq("room_id", room.id)
        .eq("target", "host")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Error fetching host tickets:", error);
        return;
      }

      if (data && data.length > 0) {
        const uids = Array.from(
          new Set(data.map((t) => t.user_id).filter(Boolean)),
        );
        let pMap = {};
        if (uids.length > 0) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .in("id", uids);
          pMap = (profs || []).reduce(
            (acc, p) => ({ ...acc, [p.id]: p }),
            {},
          );
        }
        setHostTickets(
          data.map((t) => ({ ...t, profile: pMap[t.user_id] || null })),
        );
      } else {
        setHostTickets([]);
      }
    } catch (err) {
      console.warn("Exception fetching host tickets:", err);
    } finally {
      setLoadingHostTickets(false);
    }
  };

  // Fetch tickets for candidate
  const fetchCandidateTickets = async (uid) => {
    const targetUid = uid || currentUserId;
    if (!room?.id || !targetUid) return;
    setLoadingCandidateTickets(true);
    try {
      const { data, error } = await supabase
        .from("pro_room_help_tickets")
        .select("*")
        .eq("room_id", room.id)
        .eq("user_id", targetUid)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Error fetching candidate tickets:", error);
        return;
      }
      setCandidateTickets(data || []);
    } catch (err) {
      console.warn("Exception fetching candidate tickets:", err);
    } finally {
      setLoadingCandidateTickets(false);
    }
  };

  // Initial load when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (isHost) {
      fetchHostTickets();
    } else {
      supabase.auth.getUser().then(({ data: authData }) => {
        const uid = authData?.user?.id || currentUserId;
        if (uid) {
          fetchCandidateTickets(uid);
        }
      });
    }

    // Subscribe to realtime changes so replies reflect live instantly
    const channel = supabase
      .channel(`modal-tickets-live-${room?.id || "room"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pro_room_help_tickets",
          filter: `room_id=eq.${room?.id}`,
        },
        () => {
          if (isHost) {
            fetchHostTickets();
          } else {
            supabase.auth.getUser().then(({ data: authData }) => {
              const uid = authData?.user?.id || currentUserId;
              if (uid) fetchCandidateTickets(uid);
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, isHost, room?.id, currentUserId]);

  if (!isOpen) return null;

  // Candidate: Send ticket to Host
  const handleSendHostTicket = async (e) => {
    e.preventDefault();
    if (!hostSubject.trim() || !hostMessage.trim()) {
      showToast("Please enter a subject and message for the Host.");
      return;
    }
    setSubmittingHost(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id || currentUserId;

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
        return;
      }

      showToast("Support ticket sent directly to the Host!");
      setHostSubject("");
      setHostMessage("");
      await fetchCandidateTickets(uid);
      setCandidateSubTab("my_tickets");
      onTicketsUpdated?.();
    } catch (err) {
      console.error("Error sending host ticket:", err);
      showToast("⚠️ Couldn't send your message — please try again.");
    } finally {
      setSubmittingHost(false);
    }
  };

  // Host: Reply to candidate ticket
  const handleHostReply = async (ticketId, originalMessage, replyText) => {
    if (!replyText || !replyText.trim()) {
      showToast("Please enter your reply before sending.");
      return;
    }

    setReplyingTicketId(ticketId);
    try {
      const parsed = parseTicketContent({ message: originalMessage });
      const cleanUserMsg = parsed.userMessage;
      const combined = `${cleanUserMsg}${TICKET_DELIMITER}${replyText.trim()}`;

      let updateSuccess = false;

      // 1. Try secure SECURITY DEFINER RPC first
      const { data: rpcData, error: rpcErr } = await supabase.rpc(
        "reply_pro_room_help_ticket",
        {
          p_ticket_id: ticketId,
          p_reply: replyText.trim(),
        },
      );

      if (!rpcErr && rpcData?.success) {
        updateSuccess = true;
      } else {
        // 2. Direct table update fallback with .select() verification
        const { data: d1, error: errCol } = await supabase
          .from("pro_room_help_tickets")
          .update({
            status: "resolved",
            host_response: replyText.trim(),
            message: combined,
          })
          .eq("id", ticketId)
          .select();

        if (!errCol && d1 && d1.length > 0) {
          updateSuccess = true;
        } else if (errCol) {
          // Fallback update without host_response column if not yet added in Supabase
          const { data: d2, error: errFallback } = await supabase
            .from("pro_room_help_tickets")
            .update({
              status: "resolved",
              message: combined,
            })
            .eq("id", ticketId)
            .select();

          if (!errFallback && d2 && d2.length > 0) {
            updateSuccess = true;
          } else {
            console.error("Direct update failed:", { errCol, errFallback, d1, d2 });
          }
        } else if (!errCol && (!d1 || d1.length === 0)) {
          // RLS blocked update (0 rows updated)
          console.warn("Update affected 0 rows — RLS policy blocked the update.");
        }
      }

      if (!updateSuccess) {
        showToast("⚠️ Database blocked reply (RLS). Please run the SQL fix in Supabase SQL Editor.");
        return;
      }

      showToast("Reply sent to candidate!");
      // Update local state immediately
      setHostTickets((prev) =>
        prev.map((t) => {
          if (t.id === ticketId) {
            return {
              ...t,
              status: "resolved",
              host_response: replyText.trim(),
              message: combined,
            };
          }
          return t;
        }),
      );
      setReplyInputs((prev) => ({ ...prev, [ticketId]: "" }));
      onTicketsUpdated?.();
    } catch (err) {
      console.error("Error replying to ticket:", err);
      showToast("⚠️ An error occurred while sending your reply.");
    } finally {
      setReplyingTicketId(null);
    }
  };

  // Send ticket to Platform
  const handleSendPlatformTicket = async (e) => {
    e.preventDefault();
    if (!platSubject.trim() || !platMessage.trim()) {
      showToast("Please enter a subject and message for Glitch Support.");
      return;
    }
    setSubmittingPlat(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id || currentUserId;

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
        return;
      }

      showToast("Platform issue reported to Glitch Support!");
      setPlatSubject("");
      setPlatMessage("");
      if (!isHost && uid) {
        fetchCandidateTickets(uid);
      }
    } catch (err) {
      console.error("Error sending platform ticket:", err);
      showToast("⚠️ Couldn't report the issue — please try again.");
    } finally {
      setSubmittingPlat(false);
    }
  };

  // Host tickets filtering
  const filteredHostTickets = hostTickets.filter((t) => {
    if (hostFilter === "open") return t.status === "open";
    if (hostFilter === "resolved") return t.status === "resolved";
    return true;
  });

  const openHostTicketsCount = hostTickets.filter(
    (t) => t.status === "open",
  ).length;
  const resolvedHostTicketsCount = hostTickets.filter(
    (t) => t.status === "resolved",
  ).length;

  const candidateHostTickets = candidateTickets.filter(
    (t) => t.target === "host",
  );
  const candidateRespondedCount = candidateHostTickets.filter(
    (t) => t.status === "resolved" || parseTicketContent(t).hostResponse,
  ).length;

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
                  {isHost ? "HOST SUPPORT DESK" : "IN-APP SUPPORT DESK"}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <LifeBuoy size={20} className="text-[#00F0FF]" /> Pro Room
                  Help & Support
                </h2>
                <p className="text-xs text-gray-400">
                  {isHost
                    ? "Manage participant inquiries and technical support directly on Glitch Room."
                    : "Get direct assistance from the event Host or the Glitch Room platform team."}
                </p>
              </div>

              {/* Close Button */}
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
                <Building2 size={15} />{" "}
                {isHost
                  ? `Host Inbox (${openHostTicketsCount} open)`
                  : "Host Support"}
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
                {/* HOST VIEW: CANDIDATE TICKETS DESK */}
                {isHost ? (
                  <div className="space-y-4">
                    {/* Host Header & Stats */}
                    <div className="p-4 rounded-2xl bg-[#07070e] border border-purple-500/30 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          <Inbox size={15} className="text-purple-400" />{" "}
                          Candidate Inquiries Desk
                        </h4>
                        <p className="text-[11px] text-gray-400">
                          Questions and support tickets submitted by
                          participants.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={fetchHostTickets}
                          disabled={loadingHostTickets}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] flex items-center gap-1.5 transition border border-white/10 cursor-pointer disabled:opacity-50"
                          title="Refresh Tickets"
                        >
                          <RefreshCw
                            size={12}
                            className={loadingHostTickets ? "animate-spin" : ""}
                          />
                          <span>Refresh</span>
                        </button>
                      </div>
                    </div>

                    {/* Stats & Filters */}
                    <div className="flex items-center justify-between gap-2 flex-wrap border-b border-white/10 pb-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setHostFilter("all")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            hostFilter === "all"
                              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                              : "bg-white/5 text-gray-400 hover:text-white"
                          }`}
                        >
                          All ({hostTickets.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setHostFilter("open")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            hostFilter === "open"
                              ? "bg-amber-500 text-black shadow-md shadow-amber-500/30"
                              : "bg-white/5 text-gray-400 hover:text-white"
                          }`}
                        >
                          <span>Awaiting Reply</span>
                          {openHostTicketsCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
                              {openHostTicketsCount}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setHostFilter("resolved")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            hostFilter === "resolved"
                              ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30"
                              : "bg-white/5 text-gray-400 hover:text-white"
                          }`}
                        >
                          <span>Resolved ({resolvedHostTicketsCount})</span>
                        </button>
                      </div>
                    </div>

                    {/* Host Tickets List */}
                    {loadingHostTickets ? (
                      <div className="text-center py-10 text-gray-400 text-xs">
                        <RefreshCw
                          size={18}
                          className="animate-spin mx-auto mb-2 text-purple-400"
                        />
                        Loading candidate tickets...
                      </div>
                    ) : filteredHostTickets.length === 0 ? (
                      <div className="text-center py-12 rounded-2xl bg-[#07070e] border border-white/5 space-y-2">
                        <Inbox size={28} className="mx-auto text-gray-600" />
                        <h4 className="text-xs font-bold text-gray-300">
                          No tickets in this view
                        </h4>
                        <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                          {hostFilter === "open"
                            ? "All candidate tickets have been answered! Excellent job."
                            : "No candidate has submitted a support ticket to the host yet."}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredHostTickets.map((ticket) => {
                          const parsed = parseTicketContent(ticket);
                          const isResolved = ticket.status === "resolved";
                          const candidateName =
                            ticket.profile?.full_name ||
                            ticket.profile?.username ||
                            "Candidate";
                          const candidateHandle = ticket.profile?.username
                            ? `@${ticket.profile.username}`
                            : "";
                          const avatar = ticket.profile?.avatar_url;

                          return (
                            <div
                              key={ticket.id}
                              className="p-4 rounded-2xl bg-[#07070e] border border-white/10 space-y-3.5 transition hover:border-purple-500/40"
                            >
                              {/* Ticket Header */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                  {avatar ? (
                                    <img
                                      src={avatar}
                                      alt={candidateName}
                                      className="w-8 h-8 rounded-full object-cover border border-purple-500/30 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-300 text-xs font-bold">
                                      {candidateName.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h5 className="text-xs font-bold text-white">
                                        {candidateName}
                                      </h5>
                                      {candidateHandle && (
                                        <span className="text-[11px] text-gray-400 font-mono">
                                          {candidateHandle}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                      <Clock size={10} />{" "}
                                      {formatTicketTime(ticket.created_at)}
                                    </span>
                                  </div>
                                </div>

                                <span
                                  className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold shrink-0 flex items-center gap-1.5 ${
                                    isResolved
                                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                      : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                                  }`}
                                >
                                  {isResolved ? (
                                    <>
                                      <CheckCircle size={11} /> Resolved
                                    </>
                                  ) : (
                                    <>
                                      <Clock size={11} /> Awaiting Reply
                                    </>
                                  )}
                                </span>
                              </div>

                              {/* Ticket Subject & Message */}
                              <div className="space-y-1.5 pl-10">
                                <h4 className="text-xs font-bold text-purple-200">
                                  {ticket.subject}
                                </h4>
                                <div className="p-3 rounded-xl bg-[#030308] border border-white/5 text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                                  {parsed.userMessage}
                                </div>
                              </div>

                              {/* Prior Response if Present */}
                              {parsed.hostResponse && (
                                <div className="pl-10">
                                  <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-1">
                                    <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                                      <ShieldCheck size={12} /> Your Response
                                    </span>
                                    <p className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">
                                      {parsed.hostResponse}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Host Quick Reply Form */}
                              <div className="pl-10 space-y-2 pt-2 border-t border-white/5">
                                <textarea
                                  rows={2}
                                  placeholder={
                                    parsed.hostResponse
                                      ? "Update your reply to this candidate..."
                                      : "Type your reply to this candidate..."
                                  }
                                  value={replyInputs[ticket.id] ?? ""}
                                  onChange={(e) =>
                                    setReplyInputs((prev) => ({
                                      ...prev,
                                      [ticket.id]: e.target.value,
                                    }))
                                  }
                                  className="w-full bg-[#030308] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-purple-500 resize-none"
                                />
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleHostReply(
                                        ticket.id,
                                        ticket.message,
                                        replyInputs[ticket.id],
                                      )
                                    }
                                    disabled={
                                      replyingTicketId === ticket.id ||
                                      !replyInputs[ticket.id]?.trim()
                                    }
                                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/25 cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                                  >
                                    <Send size={12} />
                                    {replyingTicketId === ticket.id
                                      ? "Sending..."
                                      : parsed.hostResponse
                                        ? "Update Reply"
                                        : "Send Reply & Resolve"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* CANDIDATE VIEW: SUBMIT TICKET & MY TICKETS */
                  <div className="space-y-4">
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
                            <ShieldCheck
                              size={13}
                              className="text-[#00F0FF]"
                            />
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

                    {/* Candidate Sub-Tabs: [Ask Question] vs [My Tickets] */}
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCandidateSubTab("new")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            candidateSubTab === "new"
                              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                              : "bg-white/5 text-gray-400 hover:text-white"
                          }`}
                        >
                          <PlusCircle size={13} />
                          <span>Ask Host / New Ticket</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCandidateSubTab("my_tickets")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            candidateSubTab === "my_tickets"
                              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                              : "bg-white/5 text-gray-400 hover:text-white"
                          }`}
                        >
                          <Inbox size={13} />
                          <span>
                            My Tickets ({candidateHostTickets.length})
                          </span>
                          {candidateRespondedCount > 0 && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                        </button>
                      </div>

                      {candidateSubTab === "my_tickets" && (
                        <button
                          type="button"
                          onClick={() => {
                            supabase.auth.getUser().then(({ data: authData }) => {
                              const uid =
                                authData?.user?.id || currentUserId;
                              if (uid) fetchCandidateTickets(uid);
                            });
                          }}
                          disabled={loadingCandidateTickets}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] flex items-center gap-1 transition border border-white/10 cursor-pointer disabled:opacity-50"
                          title="Refresh tickets"
                        >
                          <RefreshCw
                            size={11}
                            className={
                              loadingCandidateTickets ? "animate-spin" : ""
                            }
                          />
                        </button>
                      )}
                    </div>

                    {/* SUB-VIEW 1: SUBMIT NEW TICKET */}
                    {candidateSubTab === "new" && (
                      <form
                        onSubmit={handleSendHostTicket}
                        className="space-y-3 pt-1"
                      >
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <MessageSquare
                            size={14}
                            className="text-purple-400"
                          />{" "}
                          Send In-App Ticket to Host
                        </h4>
                        <input
                          type="text"
                          placeholder="Subject (e.g., Question about submission guidelines)..."
                          value={hostSubject}
                          onChange={(e) => setHostSubject(e.target.value)}
                          className="w-full bg-[#030308] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-purple-500"
                        />
                        <textarea
                          rows={4}
                          placeholder="Describe your question or issue for the host..."
                          value={hostMessage}
                          onChange={(e) => setHostMessage(e.target.value)}
                          className="w-full bg-[#030308] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-purple-500 resize-none"
                        />
                        <button
                          type="submit"
                          disabled={submittingHost}
                          className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/25 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {submittingHost ? (
                            "Sending Ticket..."
                          ) : (
                            <>
                              <Send size={13} /> Send Ticket to Host
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    {/* SUB-VIEW 2: MY TICKETS & HOST REPLIES */}
                    {candidateSubTab === "my_tickets" && (
                      <div className="space-y-3">
                        {loadingCandidateTickets ? (
                          <div className="text-center py-8 text-gray-400 text-xs">
                            <RefreshCw
                              size={16}
                              className="animate-spin mx-auto mb-2 text-purple-400"
                            />
                            Loading your tickets...
                          </div>
                        ) : candidateHostTickets.length === 0 ? (
                          <div className="text-center py-10 rounded-2xl bg-[#07070e] border border-white/5 space-y-2">
                            <Inbox
                              size={26}
                              className="mx-auto text-gray-600"
                            />
                            <h4 className="text-xs font-bold text-gray-300">
                              No tickets submitted yet
                            </h4>
                            <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                              Have questions about rules, deadlines, or
                              assessment? Send a ticket directly to the host.
                            </p>
                            <button
                              type="button"
                              onClick={() => setCandidateSubTab("new")}
                              className="mt-2 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer"
                            >
                              Create New Ticket
                            </button>
                          </div>
                        ) : (
                          candidateHostTickets.map((t) => {
                            const parsed = parseTicketContent(t);
                            const hasReply = !!parsed.hostResponse;
                            const isResolved =
                              t.status === "resolved" || hasReply;

                            return (
                              <div
                                key={t.id}
                                className="p-4 rounded-2xl bg-[#07070e] border border-white/10 space-y-3 transition hover:border-purple-500/40"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h5 className="text-xs font-bold text-white">
                                      {t.subject}
                                    </h5>
                                    <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                      <Clock size={10} />{" "}
                                      {formatTicketTime(t.created_at)}
                                    </span>
                                  </div>

                                  <span
                                    className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold shrink-0 flex items-center gap-1.5 ${
                                      isResolved
                                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                        : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                                    }`}
                                  >
                                    {isResolved ? (
                                      <>
                                        <CheckCircle size={11} /> Host Responded
                                      </>
                                    ) : (
                                      <>
                                        <Clock size={11} /> Awaiting Host Reply
                                      </>
                                    )}
                                  </span>
                                </div>

                                {/* Original message */}
                                <div className="p-3 rounded-xl bg-[#030308] border border-white/5 text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                                  {parsed.userMessage}
                                </div>

                                {/* Host Response Display */}
                                {hasReply ? (
                                  <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-purple-300">
                                      <span className="flex items-center gap-1.5">
                                        <Building2
                                          size={13}
                                          className="text-[#00F0FF]"
                                        />{" "}
                                        Host Response
                                      </span>
                                      <span className="text-[10px] text-gray-400 font-mono">
                                        {room?.org_name || "Verified Host"}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">
                                      {parsed.hostResponse}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-gray-500 italic">
                                    The host has received your ticket and will
                                    reply here.
                                  </p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                )}
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
