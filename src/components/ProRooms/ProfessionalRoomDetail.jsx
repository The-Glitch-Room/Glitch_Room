import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlitchBackground from "../GlitchBackground";
import {
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  Users,
  Trophy,
  Award,
  ArrowRight,
  Zap,
  CheckCircle,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Play,
  Share2,
  ExternalLink,
  ChevronRight,
  Info,
  Bell,
  MoreVertical,
  ArrowLeft,
  Search,
  Megaphone,
  Layers,
  MessageSquare,
  Folder,
  FolderOpen,
  Upload,
  Download,
  HelpCircle,
  Eye,
  Lock,
  UserPlus,
  UserCheck,
  Edit3,
  BarChart2,
  Settings,
  Trash2,
  X,
  Check,
  Globe,
  MessageCircle,
  Plus,
  Send,
  LogOut,
  Sparkles,
  Gift,
  Medal,
  Copy,
  Printer,
} from "lucide-react";
import ProRoomRegistrationModal from "./ProRoomRegistrationModal";
import ProRoomHelpModal from "./ProRoomHelpModal";
import { GlitchCertificateModal, GlitchCertificateDOM, renderCertificateToCanvas } from "./GlitchCertificateModal";
import { getProRoomLifecycleState } from "./ProRoomCard";
import { supabase } from "../../supabaseClient";
import { fetchPoints } from "../../utils/pointsHelper";

// Shared date+time formatter for notifications — previously each entry
// only showed "07:11 PM" with no date at all, so anything more than a few
// hours old was ambiguous about which day it happened. Shows a relative
// "Today"/"Yesterday" label where it helps, otherwise the actual date.
const formatNotificationTimestamp = (input) => {
  const d = input instanceof Date ? input : new Date(input || Date.now());
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
  return `${d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}, ${time}`;
};

const ProfessionalRoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Database States
  const [room, setRoom] = useState(null);
  const [roomNotFound, setRoomNotFound] = useState(false);
  const [sections, setSections] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [userSubmission, setUserSubmission] = useState(null);
  const [userRegistration, setUserRegistration] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userGbits, setUserGbits] = useState(0);

  const [loading, setLoading] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState("overview");

  // Dynamic Database Host & Registration Verification
  // pro_rooms only ever sets host_id at creation (both CreateProRoomPage.jsx
  // and the orphaned CreateProRoomModal.jsx write host_id, never
  // created_by) — that column belongs to the separate Creator Rooms
  // feature's `rooms` table. Checking it here was dead code implying a
  // second valid ownership path that doesn't actually exist for pro_rooms.
  const isHost = Boolean(
    currentUserId && room && room.host_id === currentUserId,
  );
  const isRegistered =
    isHost ||
    Boolean(userRegistration && userRegistration.status === "approved");
  // A registration exists but is awaiting the host's manual review
  // (require_application: true rooms) — distinct from isRegistered so this
  // person sees "application pending" instead of the register button again,
  // and can't submit a second application.
  const isPendingApproval = Boolean(
    !isHost && userRegistration && userRegistration.status === "pending",
  );

  // Dropdowns & Modal States
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThreeDotMenu, setShowThreeDotMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Form States for Discussion & Announcement
  const [discTitle, setDiscTitle] = useState("");
  const [discContent, setDiscContent] = useState("");
  const [postingDisc, setPostingDisc] = useState(false);
  const [replyTextMap, setReplyTextMap] = useState({});
  const [expandedDiscIds, setExpandedDiscIds] = useState({});

  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [postingAnn, setPostingAnn] = useState(false);

  // Resources States
  const [resources, setResources] = useState([]);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [resTitle, setResTitle] = useState("");
  const [resDesc, setResDesc] = useState("");
  const [resUrl, setResUrl] = useState("");
  const [resFileName, setResFileName] = useState("");
  const [resFileType, setResFileType] = useState("ZIP");
  const [resFileSize, setResFileSize] = useState("");
  const [savingResource, setSavingResource] = useState(false);

  // Rewards & Certificates States
  const [userRewards, setUserRewards] = useState([]);
  const [userCertificates, setUserCertificates] = useState([]);
  const [roomRewards, setRoomRewards] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);

  const handleOpenCertificate = (cert) => {
    setSelectedCertificate(cert);
    setShowCertModal(true);
  };

  const handleDownloadCertificate = (certToDownload) => {
    const cert = certToDownload || selectedCertificate;
    if (!cert) return;
    const canvas = document.createElement("canvas");
    renderCertificateToCanvas(cert, canvas);
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    const safeName = (cert.recipient_name || "candidate").replace(/[^a-zA-Z0-9]/g, "_");
    link.download = `Certificate_${safeName}_${cert.certificate_number || "verified"}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("✓ Certificate PNG downloaded!");
  };

  const [generatingCert, setGeneratingCert] = useState(false);
  const handleClaimOrGenerateCertificate = async () => {
    if (!currentUserId || !room) return;
    setGeneratingCert(true);
    try {
      const userRank = userSubmission?.rank || (myRankItem?.rank ? Number(myRankItem.rank) : 1);
      const userScore = Number(userSubmission?.total_score != null ? userSubmission.total_score : (myRankItem?.total_score ?? 0));
      const maxScore = Number(room.total_possible_score) || 100;
      const userPct = Number(userSubmission?.percentage) || (maxScore > 0 ? Math.round((userScore / maxScore) * 100) : 0);
      const isWinner = userRank <= 3;
      const roomCode = (id || "0000").slice(0, 8).toUpperCase();
      const certType = isWinner
        ? (userRank === 1 ? "winner" : userRank === 2 ? "runner_up" : "top_3")
        : "participation";
      const certNumber = isWinner
        ? `GR-PRO-WIN-${roomCode}-${String(userRank).padStart(3, "0")}`
        : `GR-PRO-PART-${roomCode}-${String(userRank).padStart(3, "0")}`;

      const { data: pData } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", currentUserId)
        .maybeSingle();

      const candName = pData?.full_name || pData?.username || "Candidate";

      const newCert = {
        id: `cert_${id}_${currentUserId}`,
        certificate_number: certNumber,
        room_id: id,
        user_id: currentUserId,
        type: certType,
        recipient_name: candName,
        event_name: room.title || room.name || "Pro Arena Assessment",
        organization_name: room.org_name || room.organizer_name || "Glitch Room Arena",
        score: userScore,
        percentage: userPct,
        rank: userRank,
        issued_at: new Date().toISOString(),
      };

      // Set immediately into state
      setUserCertificates([newCert]);
      setSelectedCertificate(newCert);
      setShowCertModal(true);

      // Persist to DB using check-then-insert/update
      const { data: existing } = await supabase
        .from("pro_room_certificates")
        .select("id")
        .eq("room_id", id)
        .eq("user_id", currentUserId)
        .eq("type", certType)
        .maybeSingle();

      if (existing?.id) {
        const { error: uErr } = await supabase
          .from("pro_room_certificates")
          .update(newCert)
          .eq("id", existing.id);
        if (uErr) {
          const { percentage, ...noPct } = newCert;
          await supabase.from("pro_room_certificates").update(noPct).eq("id", existing.id);
        }
      } else {
        const { error: iErr } = await supabase
          .from("pro_room_certificates")
          .insert(newCert);
        if (iErr) {
          const { percentage, ...noPct } = newCert;
          await supabase.from("pro_room_certificates").insert(noPct);
        }
      }

      showToast("🏆 Official certificate generated successfully!");
    } catch (err) {
      console.warn("Claim certificate err:", err);
      showToast("Could not generate certificate. Please try again.");
    } finally {
      setGeneratingCert(false);
    }
  };

  // Toast State
  const [toastMsg, setToastMsg] = useState("");
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Live Countdown State
  const [timeLeft, setTimeLeft] = useState({
    hours: "00",
    mins: "00",
    secs: "00",
  });

  const fetchRoomData = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;
      setCurrentUserId(uid);

      if (uid) {
        // Fetch User gBits Balance using unified helper (single source of truth)
        const bal = await fetchPoints(uid);
        setUserGbits(bal);
      }

      // 1. Fetch Room Metadata
      const { data: roomData } = await supabase
        .from("pro_rooms")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!roomData) {
        // Previously fabricated a complete fake room here (fake dates, fake
        // prize pool, fake description) and rendered it as if real — a bad
        // link, a deleted room, or an RLS-blocked fetch would show a fully
        // functional-looking fake event instead of an error. Show the real
        // state instead.
        setRoom(null);
        setRoomNotFound(true);
        setLoading(false);
        return;
      }

      const currentRoom = roomData;
      setRoom(currentRoom);

      // 2. Fetch Sections & Question Counts
      const { data: secData } = await supabase
        .from("pro_room_sections")
        .select("*, pro_room_questions(id, points)")
        .eq("room_id", id)
        .order("order_index", { ascending: true });

      setSections(secData || []);

      // 3. Fetch User Registration & User's OWN Submission
      // `reg`/`sub` are declared here (not just inside the `if`) so the
      // notification-synthesis step below can read these freshly-fetched
      // values directly — using the `userRegistration`/`userSubmission`
      // state instead (as this used to) reads whatever was left over from
      // the PREVIOUS render, since React state setters don't apply
      // synchronously within the same function call. That meant a
      // brand-new registration/submission wouldn't show its "Registration
      // Approved" / "Submission Recorded" notification until some later,
      // unrelated re-render happened to pick up the update.
      let reg = null;
      let sub = null;
      if (uid) {
        const { data: regData } = await supabase
          .from("pro_room_registrations")
          .select("*")
          .eq("room_id", id)
          .eq("user_id", uid)
          .maybeSingle();
        reg = regData;
        setUserRegistration(reg);

        const { data: subData } = await supabase
          .from("pro_room_submissions")
          .select("*")
          .eq("room_id", id)
          .eq("user_id", uid)
          .maybeSingle();
        sub = subData;
        setUserSubmission(sub);
      }

      // 4. Fetch All Submissions (ONLY IF HOST / ORGANIZER)
      const isHostUser = uid && currentRoom.host_id === uid;
      if (isHostUser) {
        const { data: allSubs } = await supabase
          .from("pro_room_submissions")
          .select("*, profiles(full_name, username, avatar_url)")
          .eq("room_id", id);
        setSubmissions(allSubs || []);
      }

      // 5. Fetch Registrations Roster with fallback profile lookup
      const { data: regList, error: regErr } = await supabase
        .from("pro_room_registrations")
        .select("*, profiles(full_name, username, avatar_url)")
        .eq("room_id", id);

      if (!regErr && regList) {
        setRegistrations(regList);
      } else {
        const { data: rawRegs } = await supabase
          .from("pro_room_registrations")
          .select("*")
          .eq("room_id", id);
        if (rawRegs && rawRegs.length > 0) {
          const uids = Array.from(
            new Set(rawRegs.map((r) => r.user_id).filter(Boolean)),
          );
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .in("id", uids);
          const pMap = (profs || []).reduce(
            (acc, p) => ({ ...acc, [p.id]: p }),
            {},
          );
          setRegistrations(
            rawRegs.map((r) => ({ ...r, profiles: pMap[r.user_id] || null })),
          );
        } else {
          setRegistrations([]);
        }
      }

      // 6. Fetch Leaderboard (Gated: Only host or after results are published)
      const isResultsPublished = currentRoom?.status === "results_published";
      if (isHostUser || isResultsPublished) {
        const { data: lbData } = await supabase
          .from("pro_room_leaderboard")
          .select("*, profiles(full_name, username, avatar_url)")
          .eq("room_id", id)
          .order("total_score", { ascending: false });
        setLeaderboard(lbData || []);
      } else {
        setLeaderboard([]);
      }

      // 7. Fetch Announcements
      const { data: annData } = await supabase
        .from("pro_room_announcements")
        .select("*")
        .eq("room_id", id)
        .order("created_at", { ascending: false });
      setAnnouncements(annData || []);

      // 8. Fetch Discussions & Replies with fallback
      let rawD = null;
      try {
        const { data: dData, error: dErr } = await supabase
          .from("pro_room_discussions")
          .select("*")
          .eq("room_id", id)
          .order("created_at", { ascending: false });
        if (!dErr && dData) {
          rawD = dData;
        }
      } catch (err) {
        console.warn("Error fetching pro_room_discussions:", err);
      }

      let finalDiscs = [];
      if (rawD && rawD.length > 0) {
        const uids = Array.from(
          new Set(rawD.map((d) => d.user_id).filter(Boolean)),
        );
        let pMap = {};
        if (uids.length > 0) {
          try {
            const { data: profs } = await supabase
              .from("profiles")
              .select("id, full_name, username, avatar_url")
              .in("id", uids);
            pMap = (profs || []).reduce(
              (acc, p) => ({ ...acc, [p.id]: p }),
              {},
            );
          } catch (pe) {
            console.warn("Error fetching discussion profiles:", pe);
          }
        }

        finalDiscs = rawD.map((d) => {
          let t = d.title;
          let c = d.content || "";
          if (!t && c) {
            const parts = c.split("\n\n");
            if (parts.length > 1) {
              t = parts[0];
              c = parts.slice(1).join("\n\n");
            } else {
              t = c.split("\n")[0];
            }
          }
          return {
            ...d,
            title: t || "Question",
            content: c,
            profiles: pMap[d.user_id] || null,
          };
        });
      }

      if (finalDiscs && finalDiscs.length > 0) {
        const discIds = finalDiscs.map((d) => d.id);
        const { data: replyData } = await supabase
          .from("pro_room_discussion_replies")
          .select("*")
          .in("discussion_id", discIds)
          .order("created_at", { ascending: true });

        let replyPMap = {};
        if (replyData && replyData.length > 0) {
          const replyUids = Array.from(
            new Set(replyData.map((r) => r.user_id).filter(Boolean)),
          );
          if (replyUids.length > 0) {
            try {
              const { data: rProfs } = await supabase
                .from("profiles")
                .select("id, full_name, username, avatar_url")
                .in("id", replyUids);
              replyPMap = (rProfs || []).reduce(
                (acc, p) => ({ ...acc, [p.id]: p }),
                {},
              );
            } catch (rpe) {
              console.warn("Error fetching reply profiles:", rpe);
            }
          }
        }

        const repliesByDiscId = {};
        if (replyData) {
          replyData.forEach((r) => {
            if (!repliesByDiscId[r.discussion_id])
              repliesByDiscId[r.discussion_id] = [];
            repliesByDiscId[r.discussion_id].push({
              ...r,
              profiles: replyPMap[r.user_id] || null,
            });
          });
        }

        const mergedDiscussions = finalDiscs.map((d) => ({
          ...d,
          replies: repliesByDiscId[d.id] || d.replies || [],
        }));
        setDiscussions(mergedDiscussions);
      } else {
        setDiscussions(finalDiscs || []);
      }

      // 9. Fetch Dynamic Room Notifications
      let dynamicNotifs = [];
      try {
        const { data: dbNotifs } = await supabase
          .from("pro_room_notifications")
          .select("*")
          .eq("room_id", id)
          .order("created_at", { ascending: false });

        if (dbNotifs && dbNotifs.length > 0) {
          dynamicNotifs = dbNotifs.map((n) => ({
            id: n.id,
            title: n.title,
            subtitle: n.message || n.subtitle || "Room Update",
            time: formatNotificationTimestamp(n.created_at),
            read: n.read || false,
            // Backed by a real pro_room_notifications row — "mark as read"
            // can persist this one to the database.
            persistable: true,
          }));
        }
      } catch (err) {
        console.warn("Error fetching pro_room_notifications:", err);
      }

      // Synthesize activity notifications if DB table is empty
      if (dynamicNotifs.length === 0) {
        if (annData && annData.length > 0) {
          annData.forEach((a, idx) => {
            dynamicNotifs.push({
              id: `ann-${a.id || idx}`,
              title: `Announcement: ${a.title}`,
              subtitle: a.content,
              time: formatNotificationTimestamp(a.created_at),
              read: false,
              // Synthesized from pro_room_announcements, not a real
              // pro_room_notifications row — "read" only lives in local
              // state for these, nothing to persist to.
              persistable: false,
            });
          });
        }

        if (reg && reg.status === "approved") {
          dynamicNotifs.push({
            id: `reg-${reg.id || "ok"}`,
            title: "Registration Approved",
            subtitle: `You are registered for ${currentRoom.name || currentRoom.title}`,
            time: formatNotificationTimestamp(reg.registered_at),
            read: false,
            persistable: false,
          });
        } else if (reg && reg.status === "pending") {
          dynamicNotifs.push({
            id: `reg-${reg.id || "pending"}`,
            title: "Application Pending Review",
            subtitle: `Your application for ${currentRoom.name || currentRoom.title} is awaiting host approval`,
            time: formatNotificationTimestamp(reg.registered_at),
            read: false,
            persistable: false,
          });
        } else if (reg && reg.status === "rejected") {
          dynamicNotifs.push({
            id: `reg-${reg.id || "rejected"}`,
            title: "Application Not Approved",
            subtitle: `Your application for ${currentRoom.name || currentRoom.title} was not approved`,
            time: formatNotificationTimestamp(reg.registered_at),
            read: false,
            persistable: false,
          });
        }

        if (sub) {
          dynamicNotifs.push({
            id: `sub-${sub.id || "ok"}`,
            title: "Assessment Submission Recorded",
            subtitle: `Total Score: ${sub.total_score || 0} pts`,
            time: formatNotificationTimestamp(sub.submitted_at),
            read: false,
            persistable: false,
          });
        }
      }

      // 10. Fetch Resources
      try {
        const { data: resData, error: resErr } = await supabase
          .from("pro_room_resources")
          .select("*")
          .eq("room_id", id)
          .order("created_at", { ascending: true });

        if (!resErr && resData) {
          setResources(resData);
        } else {
          const cached = localStorage.getItem(`glitch_pro_room_resources_${id}`);
          if (cached) {
            try {
              setResources(JSON.parse(cached));
            } catch (e) {
              setResources([]);
            }
          } else {
            setResources([]);
          }
        }
      } catch (rErr) {
        console.warn("Error fetching pro_room_resources:", rErr);
        const cached = localStorage.getItem(`glitch_pro_room_resources_${id}`);
        if (cached) {
          try {
            setResources(JSON.parse(cached));
          } catch (e) {
            setResources([]);
          }
        } else {
          setResources([]);
        }
      }

      // 11. Fetch User Rewards & Certificates, and Room Rewards
      if (uid) {
        try {
          const { data: uRewards } = await supabase
            .from("pro_room_rewards")
            .select("*")
            .eq("room_id", id)
            .eq("user_id", uid);
          setUserRewards(uRewards || []);

          const { data: uCerts } = await supabase
            .from("pro_room_certificates")
            .select("*")
            .eq("room_id", id)
            .eq("user_id", uid);

          let finalCerts = uCerts || [];

          // Synthesize / fallback certificate if results are published or rewards distributed, but DB cert row is missing
          const isPub = currentRoom?.status === "results_published" || Boolean(currentRoom?.rewards_distributed) || isResultsPublished;
          if (finalCerts.length === 0 && sub && isPub) {
            let userRank = sub.rank;
            if (!userRank && leaderboardData && leaderboardData.length > 0) {
              const lbEntry = leaderboardData.find((l) => l.user_id === uid);
              if (lbEntry?.rank) userRank = lbEntry.rank;
            }
            if (!userRank) userRank = 1;

            const userScore = Number(sub.total_score) || 0;
            const maxScore = Number(currentRoom.total_possible_score) || 100;
            const userPct = Number(sub.percentage) || Math.round((userScore / maxScore) * 100);
            const passScore = Number(currentRoom.passing_score) || 50;
            const isWinner = userRank <= 3;
            const isEligible = isWinner || userPct >= passScore;

            if (isEligible) {
              const roomCode = (id || "0000").slice(0, 8).toUpperCase();
              // Postgres check constraint pro_room_certificates_type_check: 'winner', 'runner_up', 'top_3', 'participation'
              const certType = isWinner
                ? (userRank === 1 ? "winner" : userRank === 2 ? "runner_up" : "top_3")
                : "participation";
              const certNumber = isWinner
                ? `GR-PRO-WIN-${roomCode}-${String(userRank).padStart(3, "0")}`
                : `GR-PRO-PART-${roomCode}-${String(userRank).padStart(3, "0")}`;

              let candName =
                reg?.profiles?.full_name ||
                reg?.profiles?.username;

              if (!candName) {
                const { data: pData } = await supabase
                  .from("profiles")
                  .select("full_name, username")
                  .eq("id", uid)
                  .maybeSingle();
                candName = pData?.full_name || pData?.username || "Candidate";
              }

              const fallbackCert = {
                id: `cert_${id}_${uid}`,
                certificate_number: certNumber,
                room_id: id,
                user_id: uid,
                type: certType,
                recipient_name: candName,
                event_name: currentRoom.title || currentRoom.name || "Pro Arena Assessment",
                organization_name: currentRoom.org_name || currentRoom.organizer_name || "Glitch Room Arena",
                score: userScore,
                percentage: userPct,
                rank: userRank,
                issued_at: sub.submitted_at || new Date().toISOString(),
              };

              finalCerts = [fallbackCert];

              // Save to DB in background using check-then-insert/update
              (async () => {
                try {
                  const { data: existing } = await supabase
                    .from("pro_room_certificates")
                    .select("id")
                    .eq("room_id", id)
                    .eq("user_id", uid)
                    .eq("type", certType)
                    .maybeSingle();

                  const dbPayload = {
                    certificate_number: certNumber,
                    room_id: id,
                    user_id: uid,
                    type: certType,
                    recipient_name: candName,
                    event_name: currentRoom.title || currentRoom.name || "Pro Arena Assessment",
                    organization_name: currentRoom.org_name || currentRoom.organizer_name || "Glitch Room Arena",
                    score: userScore,
                    percentage: userPct,
                    rank: userRank,
                    issued_at: sub.submitted_at || new Date().toISOString(),
                  };

                  if (existing?.id) {
                    const { error: uErr } = await supabase
                      .from("pro_room_certificates")
                      .update(dbPayload)
                      .eq("id", existing.id);
                    if (uErr) {
                      const { percentage, ...noPct } = dbPayload;
                      await supabase.from("pro_room_certificates").update(noPct).eq("id", existing.id);
                    }
                  } else {
                    const { error: iErr } = await supabase
                      .from("pro_room_certificates")
                      .insert(dbPayload);
                    if (iErr) {
                      const { percentage, ...noPct } = dbPayload;
                      await supabase.from("pro_room_certificates").insert(noPct);
                    }
                  }
                } catch (saveErr) {
                  console.warn("Could not persist synthesized certificate to DB:", saveErr);
                }
              })();
            }
          }

          setUserCertificates(finalCerts);
        } catch (e) {
          console.warn("Error fetching user rewards/certificates:", e);
        }
      }

      try {
        const { data: allRewards } = await supabase
          .from("pro_room_rewards")
          .select("*")
          .eq("room_id", id);
        setRoomRewards(allRewards || []);
      } catch (e) {
        console.warn("Error fetching all room rewards:", e);
      }

      setNotifications(dynamicNotifs);
    } catch (err) {
      console.error("Error loading room data:", err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Fetch Room Data once on mount or when URL ID changes
  useEffect(() => {
    fetchRoomData();
  }, [id]);

  // 2. Separate countdown timer (does not re-trigger fetchRoomData).
  // Registration dates never enter this calculation. Three phases only:
  //  - before Event Start: counts down TO Event Start ("Starts In")
  //  - Event Start <= now <= Event End: counts down TO Event End
  //    ("Time Remaining")
  //  - after Event End: pinned at 00:00:00
  const [timerPhase, setTimerPhase] = useState("upcoming");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const start = room?.event_start_at ? new Date(room.event_start_at) : null;
      const end = room?.event_end_at ? new Date(room.event_end_at) : null;

      let target = null;
      let phase = "upcoming";
      if (start && now < start) {
        target = start;
        phase = "upcoming";
      } else if (end && now <= end) {
        target = end;
        phase = "live";
      } else {
        phase = "ended";
      }
      setTimerPhase(phase);

      const diff = target ? target - now : 0;
      if (diff > 0) {
        const hrs = String(Math.floor(diff / (1000 * 60 * 60))).padStart(
          2,
          "0",
        );
        const mins = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(
          2,
          "0",
        );
        const secs = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");
        setTimeLeft({ hours: hrs, mins, secs });
      } else {
        setTimeLeft({ hours: "00", mins: "00", secs: "00" });
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [room?.event_start_at, room?.event_end_at]);

  // 2b. While an application is pending host approval, poll periodically
  // so approval is picked up without the visitor needing to manually
  // refresh the page.
  useEffect(() => {
    if (!isPendingApproval) return;
    const poll = setInterval(() => {
      fetchRoomData();
    }, 20000);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPendingApproval]);

  // Poll if candidate has submitted but results or rewards are pending
  useEffect(() => {
    if (isHost || (room?.status === "results_published" && room?.rewards_distributed) || !userSubmission) return;
    const poll = setInterval(() => {
      fetchRoomData();
    }, 12000);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, room?.status, room?.rewards_distributed, userSubmission]);

  // Synchronize gBits balance in real-time whenever points are updated anywhere on site
  useEffect(() => {
    if (!currentUserId) return;
    const handleBalUpdate = (e) => {
      if (typeof e?.detail?.points === "number") {
        setUserGbits(e.detail.points);
      } else {
        fetchPoints(currentUserId).then(setUserGbits);
      }
    };
    window.addEventListener("points_updated", handleBalUpdate);
    window.addEventListener("gbits_updated", handleBalUpdate);
    return () => {
      window.removeEventListener("points_updated", handleBalUpdate);
      window.removeEventListener("gbits_updated", handleBalUpdate);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!loading && room && !isHost && activeSidebarTab.startsWith("host_")) {
      setActiveSidebarTab("overview");
    }
  }, [isHost, activeSidebarTab, loading]);

  const markNotificationRead = async (notifId) => {
    const notif = notifications.find((n) => n.id === notifId);
    if (!notif || notif.read) return;

    // Optimistic — update immediately so the click feels instant.
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)),
    );

    if (!notif.persistable) return; // synthesized entry, nothing to save

    const { error } = await supabase
      .from("pro_room_notifications")
      .update({ read: true })
      .eq("id", notifId);

    if (error) {
      console.error("Failed to mark notification as read:", error);
      // Revert the optimistic update so the UI matches reality.
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: false } : n)),
      );
    }
  };

  const markAllNotificationsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    const persistableIds = unread.filter((n) => n.persistable).map((n) => n.id);
    if (persistableIds.length === 0) return;

    const { error } = await supabase
      .from("pro_room_notifications")
      .update({ read: true })
      .in("id", persistableIds);

    if (error) {
      console.error("Failed to mark all notifications as read:", error);
      showToast("⚠️ Couldn't mark all as read — please try again.");
      // Revert only the ones that were actually persistable and failed.
      setNotifications((prev) =>
        prev.map((n) =>
          persistableIds.includes(n.id) ? { ...n, read: false } : n,
        ),
      );
    }
  };

  const handleShareRoom = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast("🔗 Room link copied to clipboard!");
  };

  const toggleExpandDisc = (discId) => {
    setExpandedDiscIds((prev) => ({ ...prev, [discId]: !prev[discId] }));
  };

  const handlePostDiscussion = async () => {
    const titleText = discTitle.trim();
    const contentText = discContent.trim();

    if (!titleText || !contentText) {
      showToast("⚠️ Please enter both a question title and details.");
      return;
    }

    setPostingDisc(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) {
        showToast("⚠️ You must be signed in to post.");
        return;
      }

      let insertedDisc = null;

      // 1. Attempt insert with title column
      const { data: withTitleData, error: withTitleErr } = await supabase
        .from("pro_room_discussions")
        .insert({
          room_id: id,
          user_id: userId,
          title: titleText,
          content: contentText,
        })
        .select()
        .single();

      if (!withTitleErr && withTitleData) {
        insertedDisc = withTitleData;
      } else {
        // Fallback: If title column does not exist in schema, store title inside content
        console.warn("Posting with title failed, attempting fallback:", withTitleErr);
        const { data: fallbackData, error: fallbackErr } = await supabase
          .from("pro_room_discussions")
          .insert({
            room_id: id,
            user_id: userId,
            content: `${titleText}\n\n${contentText}`,
          })
          .select()
          .single();

        if (fallbackErr) {
          console.error("Failed to post discussion fallback:", fallbackErr);
          showToast("⚠️ Couldn't post your question — please try again.");
          return;
        }

        insertedDisc = {
          ...fallbackData,
          title: titleText,
          content: contentText,
        };
      }

      // 2. Fetch author profile details for immediate rendering
      let authorProf = null;
      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url")
          .eq("id", userId)
          .maybeSingle();
        authorProf = prof;
      } catch (profErr) {
        console.warn("Could not fetch profile for new discussion:", profErr);
      }

      const completeDisc = {
        ...insertedDisc,
        title: insertedDisc.title || titleText,
        content: insertedDisc.content || contentText,
        profiles: authorProf || {
          id: userId,
          full_name: currentUserProfile?.full_name || "You",
          username: currentUserProfile?.username || "You",
        },
        replies: [],
      };

      setDiscussions((prev) => [completeDisc, ...prev]);
      setDiscTitle("");
      setDiscContent("");
      showToast("💬 Question posted successfully!");
      setShowDiscussionModal(true);
    } catch (err) {
      console.error("Error in handlePostDiscussion:", err);
      showToast("⚠️ Error posting question.");
    } finally {
      setPostingDisc(false);
    }
  };

  const handlePostReply = async (discussionId) => {
    const text = replyTextMap[discussionId];
    if (!text || !text.trim()) return;

    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) {
        showToast("⚠️ Please sign in to reply.");
        return;
      }

      const { error: repErr } = await supabase
        .from("pro_room_discussion_replies")
        .insert({
          discussion_id: discussionId,
          user_id: userId,
          content: text.trim(),
        });

      if (repErr) {
        console.error("Failed to post reply:", repErr);
        showToast("⚠️ Couldn't post your reply — please try again.");
        return;
      }

      fetchRoomData();
      setReplyTextMap((prev) => ({ ...prev, [discussionId]: "" }));
      showToast("💬 Reply posted successfully!");
    } catch (err) {
      console.error("Error posting reply:", err);
      showToast("⚠️ Failed to post reply.");
    }
  };

  const handleDeleteDiscussion = async (discId) => {
    const disc = discussions.find((d) => d.id === discId);
    if (!disc || !(disc.user_id === currentUserId || isHost)) return;
    try {
      const { error } = await supabase
        .from("pro_room_discussions")
        .delete()
        .eq("id", discId);

      if (error) {
        console.error("Failed to delete discussion:", error);
        showToast("⚠️ Couldn't delete — please try again.");
        return;
      }

      setDiscussions((prev) => prev.filter((d) => d.id !== discId));
      showToast("🗑️ Question deleted.");
    } catch (err) {
      console.error(err);
      showToast("⚠️ Couldn't delete — please try again.");
    }
  };

  const handleDeleteReply = async (discId, replyId) => {
    const disc = discussions.find((d) => d.id === discId);
    const reply = disc?.replies?.find((r) => r.id === replyId);
    if (!reply || !(reply.user_id === currentUserId || isHost)) return;
    try {
      const { error } = await supabase
        .from("pro_room_discussion_replies")
        .delete()
        .eq("id", replyId);

      if (error) {
        console.error("Failed to delete reply:", error);
        showToast("⚠️ Couldn't delete — please try again.");
        return;
      }

      setDiscussions((prev) =>
        prev.map((d) => {
          if (d.id === discId) {
            return {
              ...d,
              replies: (d.replies || []).filter((r) => r.id !== replyId),
            };
          }
          return d;
        }),
      );
      showToast("🗑️ Reply deleted.");
    } catch (err) {
      console.error(err);
      showToast("⚠️ Couldn't delete — please try again.");
    }
  };

  const handleDeleteRoom = async () => {
    if (!isHost) return;
    try {
      // Clean up every table that references this room BEFORE deleting the
      // room itself — previously this went straight to deleting pro_rooms,
      // which either left orphaned rows behind forever (registrations,
      // submissions, answers, sections, questions, announcements,
      // discussions, leaderboard, help tickets) or failed outright on an FK
      // constraint depending on the schema, with the failure invisible to
      // the host either way. Order matters: children that reference other
      // children (answers→submissions, replies→discussions) go first.
      // Any single failure here aborts before touching pro_rooms, so we
      // never delete the parent while children still exist.
      const { data: discRows } = await supabase
        .from("pro_room_discussions")
        .select("id")
        .eq("room_id", id);
      const discussionIds = (discRows || []).map((d) => d.id);

      const cleanupSteps = [
        () => supabase.from("pro_room_answers").delete().eq("room_id", id),
        () =>
          discussionIds.length > 0
            ? supabase
                .from("pro_room_discussion_replies")
                .delete()
                .in("discussion_id", discussionIds)
            : Promise.resolve({ error: null }),
        () => supabase.from("pro_room_discussions").delete().eq("room_id", id),
        () => supabase.from("pro_room_help_tickets").delete().eq("room_id", id),
        () => supabase.from("pro_room_leaderboard").delete().eq("room_id", id),
        () => supabase.from("pro_room_submissions").delete().eq("room_id", id),
        () =>
          supabase.from("pro_room_registrations").delete().eq("room_id", id),
        () =>
          supabase.from("pro_room_announcements").delete().eq("room_id", id),
        () => supabase.from("pro_room_notifications").delete().eq("room_id", id),
        () => supabase.from("pro_room_rewards").delete().eq("room_id", id),
        () => supabase.from("pro_room_certificates").delete().eq("room_id", id),
        () => supabase.from("pro_room_resources").delete().eq("room_id", id),
        () => supabase.from("pro_room_questions").delete().eq("room_id", id),
        () => supabase.from("pro_room_sections").delete().eq("room_id", id),
      ];

      for (const step of cleanupSteps) {
        const { error: stepErr } = await step();
        if (stepErr) {
          console.error("Failed to clean up related room data:", stepErr);
          showToast(
            "⚠️ Couldn't delete this room — failed clearing related data. Nothing was deleted.",
          );
          return;
        }
      }

      const { error } = await supabase.from("pro_rooms").delete().eq("id", id);

      if (error) {
        console.error("Failed to delete room:", error);
        showToast(
          "⚠️ Related data was cleared, but the room itself couldn't be deleted — please try again.",
        );
        return;
      }

      showToast("🗑️ Room and all related data deleted.");
      setTimeout(() => navigate("/pro-rooms"), 1200);
    } catch (err) {
      console.error(err);
      showToast("⚠️ Failed to delete room.");
    }
  };

  const handlePostAnnouncement = async () => {
    if (!isHost || !annTitle || !annContent) return;
    setPostingAnn(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const { error } = await supabase.from("pro_room_announcements").insert({
        room_id: id,
        author_id: authData?.user?.id,
        title: annTitle,
        content: annContent,
      });

      if (error) {
        console.error("Failed to post announcement:", error);
        showToast("⚠️ Couldn't post the announcement — please try again.");
        return;
      }

      setAnnTitle("");
      setAnnContent("");
      showToast("📢 Broadcast announcement posted!");
      fetchRoomData();
    } catch (err) {
      console.error(err);
      showToast("⚠️ Couldn't post the announcement — please try again.");
    } finally {
      setPostingAnn(false);
    }
  };

  // Resources Handlers
  const handleOpenAddResource = () => {
    setEditingResource(null);
    setResTitle("");
    setResDesc("");
    setResUrl("");
    setResFileName("");
    setResFileType("ZIP");
    setResFileSize("");
    setShowResourceModal(true);
  };

  const handleOpenEditResource = (item) => {
    setEditingResource(item);
    setResTitle(item.title || "");
    setResDesc(item.description || "");
    setResUrl(item.file_url || "");
    setResFileName(item.file_name || "");
    setResFileType(item.file_type || "ZIP");
    setResFileSize(item.file_size || "");
    setShowResourceModal(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResFileName(file.name);
    if (!resTitle.trim()) {
      const nameWithoutExt =
        file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
      setResTitle(nameWithoutExt);
    }

    let formattedSize = "";
    if (file.size >= 1024 * 1024) {
      formattedSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      formattedSize = `${Math.max(1, Math.round(file.size / 1024))} KB`;
    }
    setResFileSize(formattedSize);

    const ext = file.name.split(".").pop()?.toUpperCase() || "";
    if (["ZIP", "TAR", "GZ", "7Z", "RAR"].includes(ext)) {
      setResFileType("ZIP");
    } else if (ext === "PDF") {
      setResFileType("PDF");
    } else if (["CSV", "JSON", "XLSX", "SQL"].includes(ext)) {
      setResFileType("DATASET");
    } else if (
      ["JS", "TS", "PY", "CPP", "C", "JAVA", "HTML", "CSS"].includes(ext)
    ) {
      setResFileType("CODE");
    } else if (["DOC", "DOCX", "TXT", "MD"].includes(ext)) {
      setResFileType("DOC");
    } else {
      setResFileType(ext || "FILE");
    }

    if (file.size <= 10 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        setResUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      showToast(
        "⚠️ File is larger than 10MB. For large files, providing an external link (Google Drive, GitHub, etc.) is recommended.",
      );
    }
  };

  const handleSaveResource = async (e) => {
    if (e) e.preventDefault();
    if (!resTitle.trim()) {
      showToast("⚠️ Please provide a resource title.");
      return;
    }

    setSavingResource(true);
    try {
      const payload = {
        room_id: id,
        title: resTitle.trim(),
        description: resDesc.trim(),
        file_url: resUrl.trim(),
        file_name: resFileName.trim() || resTitle.trim(),
        file_type: resFileType || "FILE",
        file_size: resFileSize.trim() || "Link",
      };

      if (editingResource?.id) {
        try {
          const { error } = await supabase
            .from("pro_room_resources")
            .update(payload)
            .eq("id", editingResource.id);
          if (error) console.warn("Supabase update error:", error);
        } catch (dbErr) {
          console.warn("DB update exception:", dbErr);
        }

        const updated = resources.map((r) =>
          r.id === editingResource.id ? { ...r, ...payload } : r,
        );
        setResources(updated);
        localStorage.setItem(
          `glitch_pro_room_resources_${id}`,
          JSON.stringify(updated),
        );
        showToast("✅ Resource updated successfully.");
      } else {
        let newRecord = {
          id:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `res_${Date.now()}`,
          ...payload,
          created_at: new Date().toISOString(),
        };

        try {
          const { data, error } = await supabase
            .from("pro_room_resources")
            .insert([payload])
            .select()
            .maybeSingle();

          if (!error && data) {
            newRecord = data;
          } else if (error) {
            console.warn("Supabase insert error:", error);
          }
        } catch (dbErr) {
          console.warn("DB insert exception:", dbErr);
        }

        const updated = [...resources, newRecord];
        setResources(updated);
        localStorage.setItem(
          `glitch_pro_room_resources_${id}`,
          JSON.stringify(updated),
        );
        showToast("✅ Resource added successfully.");
      }
      setShowResourceModal(false);
    } catch (err) {
      console.error("Save resource error:", err);
      showToast("❌ Failed to save resource.");
    } finally {
      setSavingResource(false);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm("Are you sure you want to delete this resource?"))
      return;
    try {
      try {
        const { error } = await supabase
          .from("pro_room_resources")
          .delete()
          .eq("id", resourceId);
        if (error) console.warn("Supabase delete error:", error);
      } catch (dbErr) {
        console.warn("DB delete exception:", dbErr);
      }

      const updated = resources.filter((r) => r.id !== resourceId);
      setResources(updated);
      localStorage.setItem(
        `glitch_pro_room_resources_${id}`,
        JSON.stringify(updated),
      );
      showToast("🗑️ Resource deleted.");
    } catch (err) {
      console.error("Delete resource error:", err);
      showToast("❌ Failed to delete resource.");
    }
  };

  const handleDownloadResource = (resource) => {
    if (!resource.file_url) {
      showToast("ℹ️ No download file or link attached.");
      return;
    }
    const link = document.createElement("a");
    link.href = resource.file_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    if (resource.file_name) {
      link.download = resource.file_name;
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("📥 Accessing resource...");
  };

  const handleUpdateRegistrationStatus = async (regId, newStatus) => {
    if (!isHost) return;
    try {
      const { error } = await supabase
        .from("pro_room_registrations")
        .update({ status: newStatus })
        .eq("id", regId);

      if (error) {
        console.error("Failed to update registration status:", error);
        showToast("⚠️ Couldn't update application status — please try again.");
        return;
      }

      showToast(
        newStatus === "approved"
          ? "🎉 Candidate application approved!"
          : "Application rejected.",
      );
      fetchRoomData();
    } catch (err) {
      console.error(err);
      showToast("⚠️ Couldn't update application status — please try again.");
    }
  };

  const handleDeleteAnnouncement = async (annId) => {
    if (!isHost) return;
    try {
      const { error } = await supabase
        .from("pro_room_announcements")
        .delete()
        .eq("id", annId);

      if (error) {
        console.error("Failed to delete announcement:", error);
        showToast("⚠️ Couldn't delete — please try again.");
        return;
      }

      showToast("🗑️ Announcement deleted.");
      fetchRoomData();
    } catch (err) {
      console.error(err);
      showToast("⚠️ Couldn't delete — please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-t-transparent border-[#FF00C8] rounded-full animate-spin" />
      </div>
    );
  }

  if (roomNotFound) {
    return (
      <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center justify-center px-6 text-center font-sans">
        <Search size={40} className="mx-auto mb-4 text-gray-500" />
        <h1 className="text-xl font-black text-white mb-2">Room Not Found</h1>
        <p className="text-gray-400 text-sm max-w-sm mb-6">
          This Pro Room doesn't exist, may have been removed, or the link is
          incorrect.
        </p>
        <button
          onClick={() => navigate("/pro-rooms")}
          className="px-5 py-2.5 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-bold hover:bg-[#00F0FF]/25 cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft size={14} /> Back to Pro Rooms
        </button>
      </div>
    );
  }

  const lifecycle = getProRoomLifecycleState(room);
  const isTeamEvent =
    room?.participation_type === "team" || room?.participation_type === "both";
  const unreadCount = (notifications || []).filter((n) => n && !n.read).length;

  // ACCESS GATE — a host always has access; everyone else needs an
  // "approved" registration. This runs for every visitor to this route,
  // regardless of how they got here (shared/direct link, or navigating
  // in from the room list). The normal list flow already registers the
  // user (or opens the registration modal) before ever landing on this
  // page, so isRegistered is already true by the time they arrive here —
  // this gate is a no-op for that flow. It only actually engages for
  // someone who reaches this URL without a registration yet (a shared
  // link) or whose application is still pending host review, and it
  // replaces whatever previously rendered/crashed for those visitors
  // with an explicit, correct state instead of guessing.
  if (!isHost && !isRegistered) {
    return (
      <div className="min-h-screen bg-[#070709] text-white flex flex-col font-sans relative overflow-hidden">
        <GlitchBackground />

        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl bg-[#0d0d16] border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-mono font-bold shadow-2xl shadow-[#00F0FF]/20 flex items-center gap-2"
            >
              <Zap size={14} className="text-amber-400" /> {toastMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-30 border-b border-white/10 bg-[#07070e]/90 backdrop-blur-md px-6 py-3.5">
          <button
            type="button"
            onClick={() => navigate("/pro-rooms")}
            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to Pro Rooms
          </button>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-16">
          <div className="max-w-md w-full bg-[#0c0c16] border border-white/10 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
            <div className="flex items-center justify-center gap-2">
              {room.org_logo ? (
                <img
                  src={room.org_logo}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                  className="w-10 h-10 rounded-xl object-cover border border-white/10"
                />
              ) : (
                <Building2 size={18} className="text-purple-300" />
              )}
              <span className="text-[11px] font-mono font-bold text-gray-400">
                By {room.org_name || "Verified Organization"}
              </span>
            </div>

            <h1 className="text-lg font-bold text-white leading-snug">
              {room.name || room.title}
            </h1>

            {isPendingApproval ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto">
                  <Clock size={26} className="text-amber-400" />
                </div>
                <h2 className="text-base font-bold text-white">
                  Waiting for Host Approval
                </h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Your application has been submitted. The host reviews these
                  manually — you'll get access as soon as it's approved. This
                  page checks automatically, or you can check now.
                </p>
                <button
                  type="button"
                  onClick={fetchRoomData}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition cursor-pointer"
                >
                  Check Status Now
                </button>
              </>
            ) : room?.reg_start_at &&
              new Date() < new Date(room.reg_start_at) ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mx-auto">
                  <Clock size={26} className="text-purple-300" />
                </div>
                <h2 className="text-base font-bold text-white">
                  Registration Not Open Yet
                </h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Registration for this room opens on{" "}
                  <span className="text-[#00F0FF] font-bold">
                    {new Date(room.reg_start_at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  . Please check back when registration opens!
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/pro-rooms")}
                  className="w-full px-6 py-3 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 text-xs font-bold hover:bg-purple-500/25 transition cursor-pointer"
                >
                  Back to Pro Rooms →
                </button>
              </>
            ) : (room?.reg_end_at && new Date() > new Date(room.reg_end_at)) ||
              lifecycle.isLive ||
              (room?.event_end_at &&
                new Date() > new Date(room.event_end_at)) ||
              room?.status === "completed" ||
              room?.status === "results_published" ||
              room?.status === "evaluation" ? (
              (() => {
                const now = new Date();
                const eventStart = room?.event_start_at
                  ? new Date(room.event_start_at)
                  : null;
                const eventEnd = room?.event_end_at
                  ? new Date(room.event_end_at)
                  : null;

                const isEventEnded =
                  (eventEnd && now > eventEnd) ||
                  room?.status === "results_published" ||
                  room?.status === "evaluation" ||
                  room?.status === "completed";
                const isEventLive =
                  lifecycle.isLive ||
                  (eventStart &&
                    now >= eventStart &&
                    (!eventEnd || now <= eventEnd));

                if (isEventEnded) {
                  return (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mx-auto">
                        <Trophy size={26} className="text-purple-300" />
                      </div>
                      <h2 className="text-base font-bold text-white">
                        Event Completed
                      </h2>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        This event has ended and submissions are closed. Results
                        and leaderboards are available for participants.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/pro-rooms")}
                        className="w-full px-6 py-3 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 text-xs font-bold hover:bg-purple-500/25 transition cursor-pointer"
                      >
                        Explore Other Rooms →
                      </button>
                    </>
                  );
                }

                if (isEventLive) {
                  return (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto">
                        <Zap size={26} className="text-red-400 animate-pulse" />
                      </div>
                      <h2 className="text-base font-bold text-white">
                        Event in Progress
                      </h2>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        This event is currently live and in progress.
                        Registration is closed and only registered participants
                        can access the live room.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/pro-rooms")}
                        className="w-full px-6 py-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-bold hover:bg-red-500/25 transition cursor-pointer"
                      >
                        Explore Other Rooms →
                      </button>
                    </>
                  );
                }

                return (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto">
                      <Lock size={26} className="text-amber-400" />
                    </div>
                    <h2 className="text-base font-bold text-white">
                      Registration Closed
                    </h2>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Sorry, registration for this room is closed. Please check
                      out other active or upcoming rooms.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/pro-rooms")}
                      className="w-full px-6 py-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition cursor-pointer"
                    >
                      Explore Other Rooms →
                    </button>
                  </>
                );
              })()
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center mx-auto">
                  <Sparkles size={26} className="text-[#00F0FF]" />
                </div>
                <h2 className="text-base font-bold text-white">
                  Register to Enter This Room
                </h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {room.require_application === true
                    ? "This room requires host approval. Submit an application to request access."
                    : "Registration is instant — you'll get access right away."}
                </p>
                <button
                  type="button"
                  onClick={() => setShowRegModal(true)}
                  className="w-full px-6 py-3 rounded-xl bg-[#FF00C8] hover:bg-[#d600a8] text-white text-xs font-bold transition shadow-lg shadow-[#FF00C8]/25 cursor-pointer"
                >
                  {room.require_application === true
                    ? "Apply Now →"
                    : "Register Now →"}
                </button>
              </>
            )}
          </div>
        </div>

        <ProRoomRegistrationModal
          isOpen={showRegModal}
          onClose={() => setShowRegModal(false)}
          room={room}
          showToast={showToast}
          onRegistrationSuccess={(payload) => {
            // Automatic Approval -> payload.status === "approved" ->
            // isRegistered flips true on the next render -> this gate
            // stops matching and the full room renders normally, with no
            // separate navigate() call needed since we're already on
            // this route. Host Approval -> "pending" -> the gate above
            // re-renders into the Waiting screen instead.
            setUserRegistration(payload);
            fetchRoomData();
          }}
        />
      </div>
    );
  }

  // ── Results Publication Gate & Candidate Status ───────────────────────
  const areResultsPublished = room?.status === "results_published";
  const canViewResults = isHost || areResultsPublished;

  // Compute User Specific Rank & Score
  const myRankItem = (leaderboard || []).find(
    (l) => l.user_id === currentUserId,
  );

  const actualRank = userSubmission?.rank != null ? `#${userSubmission.rank}` : (myRankItem?.rank ? `#${myRankItem.rank}` : "—");
  const actualScore = userSubmission?.total_score != null ? userSubmission.total_score : (myRankItem?.total_score ?? 0);
  const actualPercentage = userSubmission?.percentage != null ? `${userSubmission.percentage}%` : "0%";
  const totalPossible = room?.total_possible_score || 300;
  const candidateScoreNum = Number(userSubmission?.total_score != null ? userSubmission.total_score : (myRankItem?.total_score ?? 0));
  const candidateMaxScore = Number(room?.total_possible_score) || 100;
  const candidatePctNum = Number(userSubmission?.percentage) || (candidateMaxScore > 0 ? Math.round((candidateScoreNum / candidateMaxScore) * 100) : 0);
  const candidateRankNum = userSubmission?.rank || (myRankItem?.rank ? Number(myRankItem.rank) : null);
  const isEligibleForCert = Boolean(
    (candidateRankNum && candidateRankNum <= 3) ||
    candidatePctNum >= (Number(room?.passing_score) || 50)
  );

  // Candidate evaluation states:
  const isSubmissionPendingReview = Boolean(
    userSubmission && (userSubmission.status === "pending_review" || userSubmission.needs_manual_review)
  );
  const isSubmissionGraded = Boolean(
    userSubmission && (userSubmission.status === "graded" || (!userSubmission.needs_manual_review && userSubmission.total_score != null))
  );

  // Status message & badge for candidates before publication
  let candidateResultStatusBadge = "Not Started";
  let candidateResultStatusDesc = "Complete your assessment tasks to receive a score.";
  if (userSubmission) {
    if (areResultsPublished) {
      candidateResultStatusBadge = "Results Published";
      candidateResultStatusDesc = "Official final results and standings have been published by the organizer.";
    } else if (isSubmissionPendingReview) {
      candidateResultStatusBadge = "Submitted — Awaiting Review";
      candidateResultStatusDesc = "Assessment submitted — evaluation in progress. Standings will be published once host review is complete.";
    } else if (isSubmissionGraded) {
      candidateResultStatusBadge = "Assessment Graded — Results Awaiting Publication";
      candidateResultStatusDesc = "Assessment graded — results awaiting publication. The host will release official scores and ranks shortly.";
    } else {
      candidateResultStatusBadge = "Submitted — Awaiting Results";
      candidateResultStatusDesc = "Assessment submitted — awaiting results publication.";
    }
  }

  // Display strings based on publication gate:
  const userRankDisplay = canViewResults ? actualRank : (userSubmission ? "—" : "—");
  const userScoreDisplay = canViewResults ? actualScore : "—";

  // Format Event Start / End Time
  const eventStartFormatted = room?.event_start_at
    ? new Date(room.event_start_at).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
  const eventEndFormatted = room?.event_end_at
    ? new Date(room?.event_end_at || Date.now()).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  // Shared 12-hour, always-AM/PM date formatter for the timeline block below.
  const formatEventDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Registration and Event are two completely independent timelines — each
  // gets its own status computed only from its own two dates. Neither
  // reads the other's dates. Recomputed on every render (the 1s countdown
  // tick already forces a re-render), so these labels update live without
  // any extra polling.
  const getRegistrationStatus = () => {
    const now = new Date();
    const regStart = room?.reg_start_at ? new Date(room.reg_start_at) : null;
    const regEnd = room?.reg_end_at ? new Date(room.reg_end_at) : null;
    if (regStart && now < regStart)
      return {
        label: "Upcoming",
        color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
      };
    if (regEnd && now > regEnd)
      return {
        label: "Closed",
        color: "text-gray-400 bg-white/5 border-white/10",
      };
    if (regStart || regEnd)
      return {
        label: "Open",
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      };
    return { label: "—", color: "text-gray-400 bg-white/5 border-white/10" };
  };

  const getEventStatus = () => {
    const now = new Date();
    const eventStart = room?.event_start_at
      ? new Date(room.event_start_at)
      : null;
    const eventEnd = room?.event_end_at ? new Date(room.event_end_at) : null;
    if (eventStart && now < eventStart)
      return {
        label: "Upcoming",
        color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
      };
    if (eventEnd && now > eventEnd)
      return {
        label: "Ended",
        color: "text-gray-400 bg-white/5 border-white/10",
      };
    if (eventStart)
      return {
        label: "Active",
        color: "text-red-400 bg-red-500/10 border-red-500/30",
      };
    return { label: "—", color: "text-gray-400 bg-white/5 border-white/10" };
  };

  const registrationStatus = getRegistrationStatus();
  const eventStatus = getEventStatus();

  // The assessment is only ever available inside the Event Start -> Event
  // End window — lifecycle.isLive already encodes exactly that (and
  // nothing about registration dates), so it's the single source of truth
  // reused here, in the sections tab, and in ProRoomAssessment.jsx's own
  // access gate.
  const canStartAssessment = isRegistered && lifecycle.isLive;

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col justify-between selection:bg-[#00F0FF]/20 overflow-hidden font-sans relative">
      <GlitchBackground />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl bg-[#0d0d16] border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-mono font-bold shadow-2xl shadow-[#00F0FF]/20 flex items-center gap-2"
          >
            <Zap size={14} className="text-amber-400" /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER BAR */}
      <div className="relative z-30 border-b border-white/10 bg-[#07070e]/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/pro-rooms")}
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Pro Rooms
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-3 relative">
          <button
            type="button"
            onClick={handleShareRoom}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white flex items-center gap-2 transition cursor-pointer"
          >
            <Share2 size={14} /> Share Room
          </button>

          {/* 🔔 ROOM NOTIFICATION BELL */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowThreeDotMenu(false);
              }}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition cursor-pointer relative"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF00C8] text-[9px] font-mono font-bold text-white flex items-center justify-center border border-black animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 sm:w-[420px] bg-[#0d0d16] border border-white/10 rounded-2xl shadow-2xl z-50 font-sans flex flex-col max-h-[75vh] overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <Bell size={18} className="text-[#FF00C8]" /> Room
                      Notifications
                    </h4>
                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-mono text-gray-400">
                          {unreadCount} Unread
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowNotifications(false)}
                        className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* List */}
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-10">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`relative p-4 pl-5 rounded-xl border transition cursor-pointer ${
                            n.read
                              ? "bg-white/[0.02] border-white/5"
                              : "bg-[#12121e] border-purple-500/30 hover:border-[#00F0FF]/50"
                          }`}
                        >
                          {/* Unread accent bar */}
                          {!n.read && (
                            <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gradient-to-b from-[#FF00C8] to-purple-500" />
                          )}

                          <div className="flex items-start justify-between gap-3">
                            <span
                              className={`text-sm font-bold ${
                                n.read ? "text-gray-400" : "text-white"
                              }`}
                            >
                              {n.title}
                            </span>
                            <span className="text-[10px] font-mono text-gray-500 shrink-0 whitespace-nowrap">
                              {n.time}
                            </span>
                          </div>
                          <p
                            className={`text-xs mt-1.5 leading-relaxed ${
                              n.read ? "text-gray-500" : "text-gray-300"
                            }`}
                          >
                            {n.subtitle}
                          </p>

                          {!n.read && (
                            <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-[#00F0FF]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
                              Mark as read
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-3 border-t border-white/10 shrink-0">
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        disabled={unreadCount === 0}
                        className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#FF00C8] text-xs font-bold hover:bg-white/10 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Mark All as Read
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ⋮ STRICT ROLE-BASED 3-DOT MENU */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowThreeDotMenu(!showThreeDotMenu);
                setShowNotifications(false);
              }}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition cursor-pointer"
            >
              <MoreVertical size={16} />
            </button>

            {/* 3-Dot Options Dropdown */}
            <AnimatePresence>
              {showThreeDotMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-64 bg-[#0d0d16] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 text-xs font-sans space-y-1"
                >
                  {/* QUICK SHORTCUTS 3-DOT MENU */}
                  {isHost ? (
                    /* HOST QUICK SHORTCUTS */
                    <>
                      <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-[#00F0FF] uppercase tracking-widest border-b border-white/10 mb-1">
                        Host Controls
                      </div>
                      <button
                        onClick={() => {
                          setActiveSidebarTab("host_dashboard");
                          setShowThreeDotMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer transition"
                      >
                        <BarChart2 size={14} className="text-[#00F0FF]" /> Host
                        Dashboard
                      </button>
                      <button
                        onClick={() => {
                          navigate(`/pro-rooms/create?edit=${id}`);
                          setShowThreeDotMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer transition"
                      >
                        <Edit3 size={14} className="text-purple-400" /> Edit
                        Room Configuration
                      </button>
                      <button
                        onClick={() => {
                          setActiveSidebarTab("host_participants");
                          setShowThreeDotMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer transition"
                      >
                        <Users size={14} className="text-gray-300" /> Manage
                        Participants
                      </button>
                      <button
                        onClick={() => {
                          setActiveSidebarTab("host_assessment");
                          setShowThreeDotMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer transition"
                      >
                        <Layers size={14} className="text-cyan-400" /> Manage
                        Assessment
                      </button>
                      <button
                        onClick={() => {
                          setActiveSidebarTab("host_submissions");
                          setShowThreeDotMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer transition"
                      >
                        <CheckCircle size={14} className="text-emerald-400" />{" "}
                        Manage Submissions & Evaluation
                      </button>
                      <button
                        onClick={() => {
                          setActiveSidebarTab("host_announcements");
                          setShowThreeDotMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer transition"
                      >
                        <Megaphone size={14} className="text-amber-400" /> Post
                        Announcement
                      </button>
                      <button
                        onClick={() => {
                          handleShareRoom();
                          setShowThreeDotMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer transition"
                      >
                        <Share2 size={14} className="text-gray-400" /> Share
                        Room Link
                      </button>
                      <div className="my-1 border-t border-white/10" />
                      <button
                        onClick={() => {
                          setShowDeleteConfirmModal(true);
                          setShowThreeDotMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-red-400 hover:text-red-300 flex items-center gap-2 cursor-pointer transition"
                      >
                        <Trash2 size={14} /> Archive / Delete Room
                      </button>
                    </>
                  ) : (
                    /* PARTICIPANT QUICK SHORTCUTS */
                    <>
                      <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest border-b border-white/10 mb-1">
                        Quick Shortcuts
                      </div>
                      <button
                        onClick={() => {
                          setActiveSidebarTab("overview");
                          setShowThreeDotMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer transition"
                      >
                        <Info size={14} className="text-gray-400" /> Event
                        Overview
                      </button>
                      <button
                        onClick={() => {
                          setActiveSidebarTab("instructions");
                          setShowThreeDotMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer transition"
                      >
                        <FileText size={14} className="text-gray-400" /> View
                        Guidelines
                      </button>
                      <button
                        onClick={() => {
                          handleShareRoom();
                          setShowThreeDotMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer transition"
                      >
                        <Share2 size={14} className="text-gray-400" /> Share
                        Room Link
                      </button>
                      <button
                        onClick={() => {
                          setActiveSidebarTab("help");
                          setShowThreeDotMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer transition"
                      >
                        <AlertTriangle size={14} className="text-amber-400" />{" "}
                        Report an Issue
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full relative z-10 space-y-6">
        {/* ROOM HEADER & TOP 4 STATS CARDS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Room Header Info Box */}
          <div className="lg:col-span-7 bg-[#0c0c16] border border-white/10 rounded-3xl p-6 flex flex-col justify-between shadow-2xl space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-28 sm:w-36 h-28 sm:h-32 rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-[#12121e]">
                {room.cover_image ? (
                  <img
                    src={room.cover_image}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-purple-900/30">
                    <Building2 size={24} className="text-[#00F0FF]" />
                  </div>
                )}
              </div>

              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                      lifecycle.isLive
                        ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse"
                        : "bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/30"
                    }`}
                  >
                    {lifecycle.label}
                  </span>
                  <span className="text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300">
                    {room.event_type || "Hackathon"}
                  </span>
                  {isHost && (
                    <span className="text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                      ★ ROOM HOST
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight truncate">
                  {room.name || room.title}
                </h1>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-300 font-bold flex items-center gap-1">
                    By {room.org_name || "Verified Organization"}
                    <ShieldCheck size={13} className="text-[#00F0FF]" />
                  </span>
                </div>

                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {room.short_description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-3 border-t border-white/5 text-xs font-mono">
              <a
                href={room.website || "#"}
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-[#00F0FF] flex items-center gap-1.5"
              >
                <Globe size={13} /> Website
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-purple-300 flex items-center gap-1.5"
              >
                <MessageCircle size={13} /> Discord
              </a>
            </div>
          </div>

          {/* TOP 4 STATS CARDS GRID */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            {/* Card 1: Time Remaining */}
            <div className="bg-[#0c0c16] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-purple-400" />{" "}
                  {timerPhase === "upcoming"
                    ? "Event Starts In"
                    : timerPhase === "ended"
                      ? "Event Ended"
                      : "Time Remaining"}
                </span>
              </div>
              <div className="my-2">
                <div className="text-xl font-black font-mono text-white flex items-center gap-1">
                  <span>{timeLeft.hours}</span>:
                  <span className="text-[#00F0FF]">{timeLeft.mins}</span>:
                  <span className="text-[#FF00C8]">{timeLeft.secs}</span>
                </div>
                <div className="text-[9px] font-mono text-gray-500 flex gap-3 mt-0.5">
                  <span>HRS</span>
                  <span>MINS</span>
                  <span>SECS</span>
                </div>
              </div>
              <span className="text-[10px] text-gray-500 border-t border-white/5 pt-1">
                {timerPhase === "upcoming"
                  ? "Counting down to Event Start"
                  : timerPhase === "ended"
                    ? "Assessment window closed"
                    : "Counting down to Event End"}
              </span>
            </div>

            {/* Card 2: Roster Progress / Your Progress */}
            <div className="bg-[#0c0c16] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Zap size={13} className="text-[#00F0FF]" />{" "}
                  {isHost ? "Roster Progress" : "Your Progress"}
                </span>
              </div>
              <div className="my-2 flex items-center gap-3">
                {isHost ? (
                  registrations.length === 0 ? (
                    <div>
                      <span className="text-xs font-bold text-gray-400 block">
                        No participants yet
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        Waiting for registrations
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-[#00F0FF] flex items-center justify-center text-xs font-mono font-bold text-white shrink-0">
                        {Math.round(
                          (submissions.length / registrations.length) * 100,
                        )}
                        %
                      </div>
                      <span className="text-[11px] text-gray-300 font-bold">
                        {submissions.length} / {registrations.length} Submitted
                      </span>
                    </>
                  )
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-[#00F0FF] flex items-center justify-center text-xs font-mono font-bold text-white shrink-0">
                      {canViewResults
                        ? `${userSubmission ? (userSubmission.percentage ?? 0) : 0}%`
                        : userSubmission
                          ? "✓"
                          : "0%"}
                    </div>
                    <span className="text-[11px] text-gray-300 font-bold">
                      {canViewResults
                        ? (userSubmission ? "Completed" : "Not Started")
                        : (userSubmission
                            ? (isSubmissionPendingReview ? "Submitted" : "Graded")
                            : "Not Started")}
                    </span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-gray-500 border-t border-white/5 pt-1">
                {isHost ? "Assessment Phase" : canViewResults ? "Score %" : "Personal Progress"}
              </span>
            </div>

            {/* Card 3: Your Rank */}
            <div className="bg-[#0c0c16] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Trophy size={13} className="text-amber-400" />{" "}
                  {isHost ? "Top Candidate Score" : "Your Rank"}
                </span>
                {!isHost && !canViewResults && userSubmission && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                    <Lock size={9} /> Hidden
                  </span>
                )}
              </div>
              <div className="my-2">
                <div className="text-xl font-black text-white font-mono">
                  {isHost
                    ? leaderboard[0]
                      ? `${leaderboard[0].total_score} pts`
                      : "—"
                    : canViewResults
                      ? userRankDisplay
                      : "—"}
                  {!isHost && canViewResults && myRankItem && (
                    <span className="text-xs text-gray-500 font-normal">
                      {" "}
                      / {registrations.length || 1}
                    </span>
                  )}
                </div>
                <span className={`text-[11px] font-mono font-bold ${canViewResults ? "text-emerald-400" : "text-amber-400"}`}>
                  {isHost
                    ? `Total Candidates: ${registrations.length}`
                    : canViewResults
                      ? `Score: ${userScoreDisplay} / ${totalPossible}`
                      : userSubmission
                        ? (isSubmissionPendingReview
                            ? "Submitted — awaiting results"
                            : "Assessment graded — results awaiting publication")
                        : "Assessment not started"}
                </span>
              </div>
              <span className="text-[10px] text-gray-500 border-t border-white/5 pt-1">
                {isHost ? "Organizer Overview" : canViewResults ? "Official Standings" : "Results Pending Publication"}
              </span>
            </div>

            {/* Card 4: Participants */}
            <div className="bg-[#0c0c16] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Users size={13} className="text-[#00F0FF]" /> Participants
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-white font-mono">
                  {registrations.length}
                </div>
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  Capacity: {room?.max_participants || 500}
                </span>
              </div>
              <span className="text-[10px] text-gray-500 border-t border-white/5 pt-1">
                Registered Roster
              </span>
            </div>
          </div>
        </div>

        {/* MOBILE HORIZONTAL NAVIGATION SLIDER (lg:hidden) */}
        <div className="lg:hidden sticky top-0 z-20 bg-[#070709]/95 backdrop-blur-md border-b border-white/10 py-2.5 -mx-4 px-4 overflow-x-auto no-scrollbar [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex items-center gap-2 shadow-2xl max-w-full">
          {[
            { id: "overview", label: "Overview", icon: Eye },
            {
              id: "announcements",
              label: "Announcements",
              icon: Megaphone,
              count: announcements.length,
            },
            { id: "instructions", label: "Instructions", icon: FileText },
            {
              id: "sections",
              label: "Sections",
              icon: Layers,
              count: sections.length,
            },
            { id: "submissions", label: "Submissions", icon: CheckCircle },
            {
              id: "leaderboard",
              label: canViewResults ? "Leaderboard" : "Leaderboard 🔒",
              icon: Trophy,
              count: canViewResults ? leaderboard.length : undefined,
            },
            {
              id: "certificates",
              label: "Certificates & Awards",
              icon: Award,
              count: userCertificates.length > 0 ? userCertificates.length : undefined,
            },
            {
              id: "discussion",
              label: "Discussion",
              icon: MessageSquare,
              count: discussions.length,
            },
            { id: "ask_doubt", label: "Ask a Doubt", icon: HelpCircle },
            { id: "organizers", label: "Organizers", icon: Building2 },
            {
              id: "resources",
              label: "Resources",
              icon: Folder,
              count: resources.length > 0 ? resources.length : undefined,
            },
            { id: "help", label: "Help & Support", icon: HelpCircle },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSidebarTab === item.id;
            return (
              <button
                key={item.id}
                onClick={(e) => {
                  setActiveSidebarTab(item.id);
                  e.currentTarget.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "center",
                  });
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#FF00C8] text-white shadow-lg shadow-[#FF00C8]/25"
                    : "bg-[#0c0c16] border border-white/10 text-gray-400 hover:text-white"
                }`}
              >
                <Icon size={13} />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-white/10 text-gray-400"}`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3-COLUMN MAIN BODY LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-28 lg:pb-0">
          {/* LEFT SIDEBAR TABS */}
          <div className="hidden lg:block lg:col-span-2 space-y-4">
            <div className="bg-[#0c0c16] border border-white/10 rounded-2xl p-2 space-y-1 shadow-xl text-xs font-bold">
              {/* DIRECTIVE 3: SEPARATE HOST VIEW TABS FROM PARTICIPANT TABS */}
              {isHost && (
                <div className="mb-2 pb-2 border-b border-white/10 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                    Host Management
                  </div>
                  {[
                    {
                      id: "host_dashboard",
                      label: "Dashboard",
                      icon: BarChart2,
                    },
                    {
                      id: "host_participants",
                      label: "Participants",
                      icon: Users,
                      count: registrations.length,
                    },
                    {
                      id: "host_assessment",
                      label: "Manage Assessment",
                      icon: Layers,
                      count: sections.length,
                    },
                    {
                      id: "host_submissions",
                      label: "Submissions & Grading",
                      icon: CheckCircle,
                      count: submissions.length,
                    },
                    {
                      id: "host_announcements",
                      label: "Broadcast Announcement",
                      icon: Megaphone,
                      count: announcements.length,
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSidebarTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSidebarTab(item.id)}
                        className={`w-full px-3 py-2.5 rounded-xl transition flex items-center justify-between cursor-pointer ${
                          isActive
                            ? "bg-[#FF00C8]/15 border border-[#FF00C8]/40 text-[#FF00C8]"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Icon size={14} /> {item.label}
                        </span>
                        {item.count !== undefined && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${isActive ? "bg-[#FF00C8] text-white" : "bg-white/10 text-gray-400"}`}
                          >
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="px-2 py-1 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                Room Navigation
              </div>

              {[
                { id: "overview", label: "Overview", icon: Eye },
                { id: "instructions", label: "Instructions", icon: FileText },
                {
                  id: "sections",
                  label: "Sections",
                  icon: Layers,
                  count: sections.length,
                },
                { id: "submissions", label: "Submissions", icon: CheckCircle },
                {
                  id: "leaderboard",
                  label: canViewResults ? "Leaderboard" : "Leaderboard 🔒",
                  icon: Trophy,
                  count: canViewResults ? leaderboard.length : undefined,
                },
                {
                  id: "certificates",
                  label: "Certificates & Awards",
                  icon: Award,
                  count: userCertificates.length > 0 ? userCertificates.length : undefined,
                },
                { id: "ask_doubt", label: "Ask a Doubt", icon: HelpCircle },
                { id: "organizers", label: "Organizers", icon: Building2 },
                {
                  id: "resources",
                  label: "Resources",
                  icon: Folder,
                  count: resources.length > 0 ? resources.length : undefined,
                },
                { id: "help", label: "Help & Support", icon: HelpCircle },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeSidebarTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSidebarTab(item.id)}
                    className={`w-full px-3 py-2.5 rounded-xl transition flex items-center justify-between cursor-pointer ${
                      isActive
                        ? "bg-[#FF00C8]/15 border border-[#FF00C8]/40 text-[#FF00C8]"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={14} /> {item.label}
                    </span>
                    {item.count !== undefined && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${isActive ? "bg-[#FF00C8] text-white" : "bg-white/10 text-gray-400"}`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Organizer Card in Left Sidebar */}
            <div className="bg-[#0c0c16] border border-white/10 rounded-2xl p-4 text-center space-y-3 shadow-xl">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">
                Event by
              </span>
              {room.org_logo ? (
                <img
                  src={room.org_logo}
                  alt="Org Logo"
                  className="w-12 h-12 rounded-2xl mx-auto object-cover border border-white/10"
                />
              ) : (
                <Building2 size={28} className="text-[#00F0FF] mx-auto" />
              )}
              <h5 className="text-xs font-bold text-white flex items-center justify-center gap-1">
                {room.org_name || "Verified Organization"}{" "}
                <ShieldCheck size={12} className="text-[#00F0FF]" />
              </h5>
              <button
                onClick={() => setActiveSidebarTab("organizers")}
                className="w-full py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-gray-300 transition cursor-pointer"
              >
                View Profile
              </button>
            </div>
          </div>

          {/* CENTER MAIN CONTENT AREA */}
          <div className="col-span-1 lg:col-span-7 space-y-6">
            {/* HOST TABS (HOST EXCLUSIVE) */}
            {activeSidebarTab === "host_dashboard" && isHost && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 text-xs">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                  <BarChart2 size={16} className="text-[#00F0FF]" /> Room
                  Analytics & Host Command Center
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-[#06060c] border border-white/10 text-center">
                    <span className="text-gray-400 block text-[10px] font-mono">
                      Registrations
                    </span>
                    <span className="text-xl font-black text-white font-mono">
                      {registrations.length}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#06060c] border border-white/10 text-center">
                    <span className="text-gray-400 block text-[10px] font-mono">
                      Submissions
                    </span>
                    <span className="text-xl font-black text-[#00F0FF] font-mono">
                      {submissions.length}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#06060c] border border-white/10 text-center">
                    <span className="text-gray-400 block text-[10px] font-mono">
                      Completion Rate
                    </span>
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      {registrations.length > 0
                        ? `${Math.round((submissions.length / registrations.length) * 100)}%`
                        : "0%"}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#06060c] border border-white/10 text-center">
                    <span className="text-gray-400 block text-[10px] font-mono">
                      Prize Pool
                    </span>
                    <span className="text-xl font-black text-amber-400 font-mono">
                      {room?.gbits_prize_pool || 1000} gBits
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeSidebarTab === "host_participants" && isHost && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 text-xs font-sans">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Users size={16} className="text-purple-400" /> Candidate
                      Management & Roster
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Review pending candidate applications and manage approved
                      room participants.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                      {
                        registrations.filter((r) => r.status === "pending")
                          .length
                      }{" "}
                      Pending
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                      {
                        registrations.filter(
                          (r) => r.status === "approved" || !r.status,
                        ).length
                      }{" "}
                      Approved
                    </span>
                  </div>
                </div>

                {/* 1. Pending Applications Section */}
                {registrations.filter((r) => r.status === "pending").length >
                  0 && (
                  <div className="space-y-3 bg-[#06060c] border border-amber-500/20 rounded-2xl p-4">
                    <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Clock size={14} /> Pending Applications (
                      {
                        registrations.filter((r) => r.status === "pending")
                          .length
                      }
                      )
                    </h4>

                    <div className="space-y-3">
                      {registrations
                        .filter((r) => r.status === "pending")
                        .map((r, idx) => (
                          <div
                            key={r.id || idx}
                            className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h5 className="text-sm font-bold text-white flex items-center gap-2">
                                  {r.profiles?.full_name || "Candidate"}
                                  <span className="text-xs font-mono text-cyan-300 font-normal">
                                    @{r.profiles?.username || "candidate"}
                                  </span>
                                </h5>
                                <div className="text-[11px] text-gray-400 font-mono mt-1 flex flex-wrap gap-3">
                                  {(() => {
                                    const resp =
                                      r.app_responses || r.answers_json || {};
                                    return (
                                      <>
                                        {resp._organization_college && (
                                          <span>
                                            🏫 {resp._organization_college}
                                          </span>
                                        )}
                                        {resp._current_role && (
                                          <span>💼 {resp._current_role}</span>
                                        )}
                                        {resp._portfolio_url && (
                                          <a
                                            href={resp._portfolio_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[#00F0FF] hover:underline"
                                          >
                                            🔗 Portfolio / GitHub
                                          </a>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateRegistrationStatus(
                                      r.id,
                                      "approved",
                                    )
                                  }
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition cursor-pointer flex items-center gap-1"
                                >
                                  <CheckCircle2 size={13} /> Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateRegistrationStatus(
                                      r.id,
                                      "rejected",
                                    )
                                  }
                                  className="px-3.5 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold hover:bg-red-500/30 transition cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* 2. Registered / Approved Roster Section — now shows each
                    participant's ACTUAL progress/status (their real
                    submission row, cross-referenced by user_id) instead of
                    a static "Approved Participant" badge every row got
                    regardless of where they actually were in the
                    assessment. `submissions` is already fetched for the
                    host above; this just uses it here too. */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                    Approved Roster (
                    {
                      registrations.filter(
                        (r) => r.status === "approved" || !r.status,
                      ).length
                    }
                    )
                  </h4>

                  {registrations.filter(
                    (r) => r.status === "approved" || !r.status,
                  ).length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-6 bg-[#06060c] border border-white/5 rounded-2xl">
                      No approved candidates yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {registrations
                        .filter((r) => r.status === "approved" || !r.status)
                        .map((r, idx) => {
                          const sub = submissions.find(
                            (s) => s.user_id === r.user_id,
                          );
                          const statusInfo = !sub
                            ? { label: "Not Started", color: "gray" }
                            : sub.status === "in_progress"
                              ? { label: "In Progress", color: "amber" }
                              : sub.status === "pending_review"
                                ? { label: "Needs Grading", color: "purple" }
                                : sub.status === "graded"
                                  ? { label: "Graded", color: "emerald" }
                                  : {
                                      label: sub.status || "Unknown",
                                      color: "gray",
                                    };

                          const colorClasses = {
                            gray: "text-gray-400 bg-white/5 border-white/10",
                            amber:
                              "text-amber-300 bg-amber-500/10 border-amber-500/20",
                            purple:
                              "text-purple-300 bg-purple-500/10 border-purple-500/20",
                            emerald:
                              "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                          }[statusInfo.color];

                          return (
                            <div
                              key={r.id || idx}
                              className="p-3 rounded-2xl bg-[#06060c] border border-white/5 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs shrink-0">
                                  {(r.profiles?.full_name || "C")[0]}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-white font-bold block truncate">
                                    {r.profiles?.full_name || "Candidate"}
                                  </span>
                                  <span className="text-[10px] text-cyan-300 font-mono">
                                    @{r.profiles?.username || "candidate"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {sub && (
                                  <span className="text-[10px] font-mono text-gray-400">
                                    {sub.total_score ?? 0}/{totalPossible} pts
                                    {sub.rank ? ` · #${sub.rank}` : ""}
                                  </span>
                                )}
                                <span
                                  className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border ${colorClasses}`}
                                >
                                  {statusInfo.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSidebarTab === "host_assessment" && isHost && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 text-xs">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                  <Layers size={16} className="text-[#00F0FF]" /> Assessment
                  Configuration
                </h3>
                <p className="text-gray-400">
                  Manage your timed sections and question bank.
                </p>
                <button
                  onClick={() =>
                    navigate(`/pro-rooms/create?edit=${id}&step=4`)
                  }
                  className="px-4 py-2 rounded-xl bg-[#FF00C8] text-white font-bold cursor-pointer"
                >
                  Open Creation Studio Editor →
                </button>
              </div>
            )}

            {activeSidebarTab === "host_submissions" && isHost && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 text-xs">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                  <CheckCircle size={16} className="text-emerald-400" />{" "}
                  Candidate Submissions & Evaluation
                </h3>
                <div className="space-y-3">
                  {submissions.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-8">
                      No candidate submissions yet.
                    </p>
                  ) : (
                    submissions.map((sub, sIdx) => (
                      <div
                        key={sub.id || sIdx}
                        className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="text-white font-bold block">
                            {sub.profiles?.full_name ||
                              sub.profiles?.username ||
                              "Candidate"}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            Score: {sub.total_score} pts • {sub.percentage}%
                          </span>
                        </div>
                        <button
                          onClick={() => navigate(`/pro-rooms/${id}/dashboard`)}
                          className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold hover:bg-purple-500/30 cursor-pointer"
                        >
                          Grade & Review
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* STANDARD ROOM NAVIGATION TABS */}
            {activeSidebarTab === "overview" && (
              <div className="space-y-6">
                {isPendingApproval ? (
                  <div className="bg-[#07070e] border border-amber-500/30 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <Clock size={20} className="text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Application Pending Review
                        </h4>
                        <p className="text-xs text-gray-400">
                          Your application has been submitted — the host reviews
                          these manually. You'll get access once it's approved.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  !isRegistered && (
                    <div className="bg-[#07070e] border border-[#00F0FF]/30 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center shrink-0">
                          <Sparkles size={20} className="text-[#00F0FF]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">
                            Registration Open for this Pro Room
                          </h4>
                          <p className="text-xs text-gray-400">
                            {room?.require_application === true
                              ? "Apply now — the host reviews applications manually before granting access."
                              : "Register now for automatic approval and instant access to assessment sections."}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowRegModal(true)}
                        className="px-6 py-2.5 rounded-xl bg-[#FF00C8] hover:bg-[#d600a8] text-white text-xs font-bold transition shadow-lg shadow-[#FF00C8]/25 cursor-pointer whitespace-nowrap"
                      >
                        {room?.require_application === true
                          ? "Apply Now →"
                          : "Register Now →"}
                      </button>
                    </div>
                  )
                )}

                {/* CANDIDATE WINNER / REWARDS / CERTIFICATION BANNER */}
                {userSubmission && canViewResults && (
                  <div className="space-y-4">
                    {userRewards && userRewards.length > 0 ? (
                      <div className="bg-gradient-to-r from-yellow-500/15 via-purple-900/20 to-black/40 border border-yellow-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-yellow-400/20 border border-yellow-400/50 flex items-center justify-center text-2xl shadow-lg shadow-yellow-500/20 shrink-0">
                              {userRewards[0].rank === 1 ? "🥇" : userRewards[0].rank === 2 ? "🥈" : userRewards[0].rank === 3 ? "🥉" : "🎖️"}
                            </div>
                            <div>
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                                <Sparkles size={11} /> Official Award Winner
                              </div>
                              <h3 className="text-base sm:text-lg font-black text-white">
                                Congratulations! You Placed Rank #{userRewards[0].rank || actualRank}
                              </h3>
                              <p className="text-xs text-gray-300 mt-0.5">
                                You earned <strong className="text-yellow-400 font-mono">+{userRewards[0].gbits_awarded.toLocaleString()} gBits</strong> in platform prizes for this assessment.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                            {userCertificates.length > 0 && (
                              <button
                                onClick={() => handleOpenCertificate(userCertificates[0])}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-black text-xs transition shadow-lg shadow-yellow-500/20 cursor-pointer flex items-center gap-2"
                              >
                                <Award size={15} />
                                <span>View Certificate</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : userCertificates && userCertificates.length > 0 ? (
                      <div className="bg-gradient-to-r from-[#00F0FF]/15 via-purple-900/20 to-black/40 border border-[#00F0FF]/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-[#00F0FF]/20 border border-[#00F0FF]/50 flex items-center justify-center text-[#00F0FF] shadow-lg shadow-[#00F0FF]/20 shrink-0">
                              <Award size={28} />
                            </div>
                            <div>
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF]/40 text-[#00F0FF] text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                                <CheckCircle size={11} /> Verified Credential
                              </div>
                              <h3 className="text-base sm:text-lg font-black text-white">
                                Official Certificate of Completion Issued
                              </h3>
                              <p className="text-xs text-gray-300 mt-0.5">
                                Your assessment performance ({actualPercentage} • Score: {actualScore} pts) has been verified.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleOpenCertificate(userCertificates[0])}
                            className="px-5 py-2.5 rounded-xl bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-black font-black text-xs transition shadow-lg shadow-[#00F0FF]/20 cursor-pointer flex items-center gap-2 self-start md:self-auto shrink-0"
                          >
                            <Award size={15} />
                            <span>View Certificate</span>
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Info size={16} className="text-purple-400" /> About This
                      Event
                    </h3>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {room.detailed_description || room.short_description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
                    <div>
                      <span className="text-gray-500 block text-[10px] font-mono">
                        Team Event
                      </span>
                      <span className="text-white font-bold">
                        {isTeamEvent
                          ? `2 - ${room.max_team_size || 4} Members`
                          : "Individual"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] font-mono">
                        Eligibility
                      </span>
                      <span className="text-white font-bold">
                        {room.target_college || "Open for all students"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] font-mono">
                        Timezone
                      </span>
                      <span className="text-white font-bold">
                        {room.timezone || "IST (UTC+5:30)"}
                      </span>
                    </div>
                  </div>

                  {/* Registration and Event are two independent timelines —
                      each with its own two dates and its own status,
                      computed only from its own dates (see
                      getRegistrationStatus / getEventStatus above). Neither
                      badge nor date pair here is derived from the other
                      timeline. */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                          Registration Window
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${registrationStatus.color}`}
                        >
                          {registrationStatus.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Opens</span>
                        <span className="text-white font-bold font-mono">
                          {formatEventDateTime(room.reg_start_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Closes</span>
                        <span className="text-white font-bold font-mono">
                          {formatEventDateTime(room.reg_end_at)}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                          Event Window
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${eventStatus.color}`}
                        >
                          {eventStatus.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Starts</span>
                        <span className="text-white font-bold font-mono">
                          {formatEventDateTime(room.event_start_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Ends</span>
                        <span className="text-white font-bold font-mono">
                          {formatEventDateTime(room.event_end_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MOBILE ORGANIZER & QUICK ACTIONS CARD (lg:hidden) */}
                <div className="lg:hidden bg-[#0c0c16] border border-white/10 rounded-3xl p-5 text-center space-y-3 shadow-xl">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">
                    Event by
                  </span>
                  {room.org_logo ? (
                    <img
                      src={room.org_logo}
                      alt="Org Logo"
                      className="w-12 h-12 rounded-2xl mx-auto object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-purple-900/40 border border-purple-500/30 mx-auto flex items-center justify-center">
                      <Building2 size={24} className="text-[#00F0FF]" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                      {room.org_name || "TechNova University"}
                      <ShieldCheck size={14} className="text-[#00F0FF]" />
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (room.org_website)
                        window.open(room.org_website, "_blank");
                      else
                        showToast(
                          "Org Profile: " +
                            (room.org_name || "Verified Organization"),
                        );
                    }}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 transition cursor-pointer"
                  >
                    View Profile
                  </button>
                </div>

                {/* MOBILE QUICK ACTIONS (lg:hidden) */}
                <div className="lg:hidden bg-[#0c0c16] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-3">
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest mb-2">
                    Quick Actions
                  </h4>
                  <button
                    type="button"
                    onClick={() => navigate(`/pro-rooms/${id}/assessment`)}
                    className="w-full py-3 rounded-xl bg-[#FF00C8] hover:bg-[#d600a8] text-white text-xs font-bold transition shadow-lg shadow-[#FF00C8]/25 cursor-pointer flex items-center justify-between px-4"
                  >
                    <span>Start Assessment</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSidebarTab("leaderboard")}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-bold transition cursor-pointer flex items-center justify-between px-4"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>View Leaderboard</span>
                      {!canViewResults && <Lock size={11} className="text-amber-400" />}
                    </span>
                    <ChevronRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSidebarTab("discussion")}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-bold transition cursor-pointer flex items-center justify-between px-4"
                  >
                    <span>Discussion</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                {/* DYNAMIC HOST FAQ / COMMON QUESTIONS ACCORDION — only show
                    entries with a real host-written answer, matching the
                    same guard the Need Help modal uses. Same underlying
                    custom_app_questions data, same rule, in both places. */}
                {Array.isArray(room?.custom_app_questions) &&
                  room.custom_app_questions.filter(
                    (q) =>
                      q &&
                      (q.question || q.title) &&
                      (q.answer || q.description),
                  ).length > 0 && (
                    <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
                      <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                        <HelpCircle size={16} className="text-[#00F0FF]" />{" "}
                        Frequently Asked Questions (FAQ)
                      </h3>

                      <div className="space-y-3">
                        {room.custom_app_questions
                          .filter(
                            (q) =>
                              q &&
                              (q.question || q.title) &&
                              (q.answer || q.description),
                          )
                          .map((faq, idx) => (
                            <details
                              key={faq.id || idx}
                              className="group p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition text-xs cursor-pointer"
                            >
                              <summary className="font-bold text-white flex items-center justify-between gap-3 list-none">
                                <span className="flex items-center gap-2">
                                  <span className="text-purple-400 font-mono font-bold">
                                    Q:
                                  </span>{" "}
                                  {faq.question || faq.title}
                                </span>
                                <ChevronRight
                                  size={14}
                                  className="text-gray-500 group-open:rotate-90 transition-transform"
                                />
                              </summary>
                              <div className="mt-3 pt-3 border-t border-white/5 text-gray-300 leading-relaxed pl-6">
                                <span className="text-emerald-400 font-mono font-bold">
                                  A:
                                </span>{" "}
                                {faq.answer || faq.description}
                              </div>
                            </details>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {activeSidebarTab === "instructions" && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 text-xs">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                  <FileText size={16} className="text-[#00F0FF]" /> Official
                  Guidelines & Rules
                </h3>

                <div className="space-y-4 text-gray-300 leading-relaxed">
                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                    <h4 className="font-bold text-purple-300 mb-1">
                      1. Assessment Environment & Integrity
                    </h4>
                    <p className="text-gray-400">
                      All submissions are monitored by automated focus tracking.
                      Switching tabs or windows during coding tasks will log
                      warning events to your submission report.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <h4 className="font-bold text-white">
                      2. Evaluation & Negative Marking
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 text-gray-400">
                      <li>
                        Coding problems are evaluated against hidden unit test
                        cases.
                      </li>
                      <li>
                        Passing score threshold for qualification is{" "}
                        {room?.passing_score || 50} points.
                      </li>
                      <li>
                        Negative marking policy:{" "}
                        {room?.negative_marking
                          ? "Enabled (-5 pts on wrong MCQ)"
                          : "Disabled"}
                        .
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <h4 className="font-bold text-white">
                      3. Tie-Breaker Rules
                    </h4>
                    <p className="text-gray-400">
                      In case of equal total scores, rank is determined by
                      shortest completion time and submission speed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* HOST ANNOUNCEMENTS TAB (HOST EXCLUSIVE) */}
            {/* ROOM NAVIGATION ANNOUNCEMENTS TAB (VIEW ONLY FOR EVERYONE) */}
            {activeSidebarTab === "announcements" && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Megaphone size={16} className="text-[#00F0FF]" />{" "}
                    Announcements ({announcements.length})
                  </h3>
                </div>

                <div className="space-y-4">
                  {announcements.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-8">
                      No announcements posted yet.
                    </p>
                  ) : (
                    announcements.map((a) => (
                      <div
                        key={a.id}
                        className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 relative"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white">
                            {a.title}
                          </h4>
                          <span className="text-[10px] font-mono text-gray-500">
                            {new Date(
                              a.created_at || Date.now(),
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          {a.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* HOST MANAGEMENT: BROADCAST ANNOUNCEMENT TAB (HOST ONLY) */}
            {activeSidebarTab === "host_announcements" && isHost && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Megaphone size={16} className="text-amber-400" /> Broadcast
                    Announcements ({announcements.length})
                  </h3>
                </div>

                {/* POST ANNOUNCEMENT FORM */}
                <div className="bg-[#07070e] border border-purple-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
                  <h4 className="text-xs font-bold text-purple-300">
                    Post Broadcast Announcement
                  </h4>
                  <input
                    type="text"
                    placeholder="Title..."
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    className="w-full bg-[#030308] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF00C8]"
                  />
                  <textarea
                    rows={3}
                    placeholder="Broadcast message content..."
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    className="w-full bg-[#030308] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-[#FF00C8]"
                  />
                  <button
                    onClick={handlePostAnnouncement}
                    disabled={postingAnn}
                    className="px-5 py-2.5 rounded-xl bg-[#FF00C8] hover:bg-[#d600a8] text-white text-xs font-bold cursor-pointer disabled:opacity-50 transition shadow-lg shadow-[#FF00C8]/25 flex items-center gap-2"
                  >
                    <span>Broadcast</span>
                    <Megaphone size={13} />
                  </button>
                </div>

                {/* ANNOUNCEMENTS LIST WITH DELETE */}
                <div className="space-y-4">
                  {announcements.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-8">
                      No announcements broadcasted yet.
                    </p>
                  ) : (
                    announcements.map((a) => (
                      <div
                        key={a.id}
                        className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 relative"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white">
                            {a.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-gray-500">
                              {new Date(
                                a.created_at || Date.now(),
                              ).toLocaleDateString()}
                            </span>
                            <button
                              onClick={() => handleDeleteAnnouncement(a.id)}
                              className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                              title="Delete Announcement"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          {a.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeSidebarTab === "sections" && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers size={16} className="text-[#00F0FF]" /> Assessment
                    Sections ({sections.length})
                  </h3>
                  {canStartAssessment && (
                    <button
                      onClick={() => navigate(`/pro-rooms/${id}/assessment`)}
                      className="px-4 py-2 rounded-xl bg-[#FF00C8] hover:bg-[#d600a8] text-white text-xs font-bold shadow-lg shadow-[#FF00C8]/25 cursor-pointer flex items-center gap-1.5"
                    >
                      Start Assessment <ArrowRight size={14} />
                    </button>
                  )}
                </div>

                {isPendingApproval ? (
                  <div className="bg-[#07070e] border border-amber-500/30 rounded-2xl p-10 text-center space-y-4 my-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                      <Clock size={28} />
                    </div>
                    <h3 className="text-base font-bold text-white">
                      Application Pending Review
                    </h3>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                      The host reviews applications manually — you'll be able to
                      view sections and start the assessment once yours is
                      approved.
                    </p>
                  </div>
                ) : !isRegistered ? (
                  <div className="bg-[#07070e] border border-cyan-500/30 rounded-2xl p-10 text-center space-y-4 my-4">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-[#00F0FF]">
                      <Lock size={28} />
                    </div>
                    <h3 className="text-base font-bold text-white">
                      Registration Required
                    </h3>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                      You must register for this Pro Room before you can view
                      assessment questions, launch timed sections, or submit
                      solutions.
                    </p>
                    <button
                      onClick={() => setShowRegModal(true)}
                      className="px-6 py-2.5 rounded-xl bg-[#FF00C8] hover:bg-[#d600a8] text-white text-xs font-bold transition shadow-lg shadow-[#FF00C8]/25 cursor-pointer"
                    >
                      {room?.require_application === true
                        ? "Apply Now"
                        : "Register Now to Unlock"}
                    </button>
                  </div>
                ) : !lifecycle.isLive ? (
                  // Registered, but outside the Event Start -> Event End
                  // window — registration being open/closed has no bearing
                  // here; this is purely the event timeline.
                  <div className="bg-[#07070e] border border-purple-500/30 rounded-2xl p-10 text-center space-y-4 my-4">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-300">
                      <Clock size={28} />
                    </div>
                    <h3 className="text-base font-bold text-white">
                      {timerPhase === "ended"
                        ? "Assessment Window Closed"
                        : "Assessment Not Started Yet"}
                    </h3>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                      {timerPhase === "ended"
                        ? "This room's Event window has ended and the assessment is no longer accepting attempts."
                        : `You're registered — the assessment unlocks automatically at Event Start (${formatEventDateTime(room.event_start_at)}).`}
                    </p>
                  </div>
                ) : sections.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-10">
                    No sections configured for this assessment.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* ── Total assessment duration banner ── */}
                    {(() => {
                      const totalMins = room?.duration_minutes;
                      const totalPoints = sections.reduce((sum, s) => {
                        const qs = s.pro_room_questions || [];
                        return sum + qs.reduce((ps, q) => ps + (q.points || 0), 0);
                      }, 0);
                      const totalQuestions = sections.reduce(
                        (sum, s) => sum + (s.pro_room_questions?.length || 0), 0
                      );
                      return (
                        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl bg-[#07070e] border border-white/8 text-[11px] font-mono text-gray-400">
                          {totalMins && (
                            <span className="flex items-center gap-1.5">
                              <Clock size={12} className="text-[#00F0FF]" />
                              <span className="text-white font-bold">{totalMins} Min{totalMins !== 1 ? "s" : ""}</span>
                              <span className="text-gray-500">— Total Assessment Duration</span>
                            </span>
                          )}
                          {totalMins && totalPoints > 0 && <span className="text-white/20">·</span>}
                          {totalPoints > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="text-white font-bold">{totalPoints} pts</span>
                              <span className="text-gray-500">total</span>
                            </span>
                          )}
                          {totalQuestions > 0 && (
                            <>
                              <span className="text-white/20">·</span>
                              <span className="flex items-center gap-1">
                                <span className="text-white font-bold">{totalQuestions}</span>
                                <span className="text-gray-500">question{totalQuestions !== 1 ? "s" : ""}</span>
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })()}

                    {/* ── Individual section cards ── */}
                    {sections.map((sec, idx) => {
                      const qList = sec.pro_room_questions || [];
                      const sectionPoints = qList.reduce((sum, q) => sum + (q.points || 0), 0);
                      const questionCount = qList.length;

                      return (
                        <div
                          key={sec.id || idx}
                          className="p-5 rounded-2xl bg-[#06060c] border border-white/10 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-xl bg-purple-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-white">
                                  {sec.section_name}
                                </h4>
                                {sec.description && (
                                  <p className="text-[11px] text-gray-400">{sec.description}</p>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[#00F0FF] font-bold shrink-0">
                              {sec.section_type?.toUpperCase() || "MCQ / CODING"}
                            </span>
                          </div>

                          <div className="pt-2 text-xs border-t border-white/5">
                            <span className="text-gray-400 font-mono text-[11px]">
                              {questionCount} Question{questionCount !== 1 ? "s" : ""}
                              {sectionPoints > 0 ? ` • ${sectionPoints} Points` : ""}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeSidebarTab === "submissions" && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-400" />
                    {isHost
                      ? "Candidate Submissions & Grading Roster"
                      : "Your Performance & Submission Result"}
                  </h3>
                </div>

                {!isHost ? (
                  userSubmission ? (
                    <div className="p-6 rounded-2xl bg-[#06060c] border border-emerald-500/30 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <span className="text-xs text-gray-400 block font-mono">
                            Submission Status
                          </span>
                          <span className={`text-sm font-bold uppercase ${canViewResults ? "text-emerald-400" : "text-amber-400"}`}>
                            {canViewResults
                              ? (userSubmission.status || "Graded")
                              : (isSubmissionPendingReview
                                  ? "Submitted — Awaiting Review"
                                  : "Assessment Graded — Awaiting Publication")}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400 block font-mono">
                            Your Score
                          </span>
                          <span className="text-xl font-black text-white font-mono">
                            {canViewResults ? `${actualScore} / ${totalPossible}` : "🔒 Awaiting Publication"}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
                        <div className="flex justify-between text-gray-400">
                          <span>Percentage:</span>
                          <span className="text-white font-bold font-mono">
                            {canViewResults ? actualPercentage : "🔒 Hidden until published"}
                          </span>
                        </div>
                        {canViewResults && (
                          <div className="flex justify-between text-gray-400">
                            <span>Official Rank:</span>
                            <span className="text-white font-bold font-mono">
                              {actualRank} {myRankItem && `of ${registrations.length}`}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-gray-400">
                          <span>Submitted At:</span>
                          <span className="text-white font-mono">
                            {new Date(
                              userSubmission?.submitted_at || Date.now(),
                            ).toLocaleString()}
                          </span>
                        </div>

                        {canViewResults && userRewards.length > 0 && (
                          <div className="flex justify-between text-gray-400 border-t border-white/5 pt-2">
                            <span className="text-yellow-400 font-bold flex items-center gap-1">
                              <Gift size={13} /> Prize Won:
                            </span>
                            <span className="text-yellow-400 font-mono font-bold">
                              +{userRewards[0].gbits_awarded.toLocaleString()} gBits
                            </span>
                          </div>
                        )}
                      </div>

                      {canViewResults && userCertificates.length > 0 && (
                        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Award size={16} className="text-purple-400" />
                            <span className="text-xs text-purple-200">
                              Official Certificate Available
                            </span>
                          </div>
                          <button
                            onClick={() => handleOpenCertificate(userCertificates[0])}
                            className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
                          >
                            <Award size={13} />
                            <span>View Certificate</span>
                          </button>
                        </div>
                      )}

                      {!canViewResults && (
                        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
                          <Lock size={15} className="shrink-0 mt-0.5" />
                          <span>
                            {isSubmissionPendingReview
                              ? "Your answers have been securely recorded. The organizer will review submissions before publishing final scores and official rankings."
                              : "Your assessment has been evaluated! Final scores, percentage, and official rankings will be released once the organizer publishes results."}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-3">
                      <CheckCircle
                        size={32}
                        className="text-gray-600 mx-auto"
                      />
                      <h4 className="text-sm font-bold text-white">
                        No Submission Recorded Yet
                      </h4>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto">
                        Complete your assessment tasks in the sections
                        environment to view your test score.
                      </p>
                      {lifecycle.isLive ? (
                        <button
                          onClick={() =>
                            navigate(`/pro-rooms/${id}/assessment`)
                          }
                          className="px-5 py-2.5 rounded-xl bg-[#FF00C8] text-white text-xs font-bold cursor-pointer"
                        >
                          Start Assessment Now →
                        </button>
                      ) : (
                        <p className="text-[10px] text-purple-300 font-mono">
                          {timerPhase === "ended"
                            ? "Event window has ended."
                            : `Unlocks at Event Start (${formatEventDateTime(room.event_start_at)})`}
                        </p>
                      )}
                    </div>
                  )
                ) : (
                  <div className="text-center py-10 space-y-3 bg-[#06060c] border border-white/10 rounded-2xl p-6">
                    <CheckCircle size={28} className="text-[#00F0FF] mx-auto" />
                    <h4 className="text-sm font-bold text-white">
                      Host View — All Candidate Submissions
                    </h4>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      As the room host, evaluate, grade, and review all
                      candidate submissions under Host Management.
                    </p>
                    <button
                      onClick={() => setActiveSidebarTab("host_submissions")}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer transition"
                    >
                      Open Submissions & Grading Roster ({submissions.length}) →
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeSidebarTab === "leaderboard" && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Trophy size={16} className="text-amber-400" /> Official
                    Standings & Leaderboard {canViewResults ? `(${leaderboard.length})` : ""}
                  </h3>
                  {!canViewResults && (
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
                      <Lock size={12} /> Awaiting Publication
                    </span>
                  )}
                </div>

                {!canViewResults ? (
                  <div className="text-center py-12 space-y-4 bg-[#06060c] border border-white/5 rounded-2xl p-6">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                      <Lock size={28} />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-base font-bold text-white">
                        Official Leaderboard Locked
                      </h4>
                      <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                        {userSubmission
                          ? isSubmissionPendingReview
                            ? "Assessment Submitted — Results Awaiting Review. Your submission is currently undergoing evaluation. Standings and rankings will unlock once results are officially published by the organizer."
                            : "Assessment Graded — Results Awaiting Publication. Your assessment has been evaluated. Standings, scores, and rankings will unlock once the organizer officially publishes results."
                          : "Leaderboard standings are hidden while the assessment is underway. Results will be published by the organizer after the evaluation phase."}
                      </p>
                    </div>
                    {userSubmission && (
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
                        <Clock size={13} /> {candidateResultStatusBadge}
                      </div>
                    )}
                  </div>
                ) : leaderboard.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-10">
                    Leaderboard standings will update after submissions are
                    evaluated.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* User Certificate Quick Action */}
                    {userCertificates && userCertificates.length > 0 && (
                      <div className="p-3.5 bg-gradient-to-r from-purple-500/10 to-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Award size={18} className="text-[#00F0FF]" />
                          <span className="text-xs text-white">
                            You have an official verified credential available for this assessment!
                          </span>
                        </div>
                        <button
                          onClick={() => handleOpenCertificate(userCertificates[0])}
                          className="px-3 py-1.5 rounded-xl bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Award size={13} /> View Certificate
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {leaderboard.map((lb, idx) => {
                        const isMe = lb.user_id === currentUserId;
                        const rankNum = lb.rank ?? (idx + 1);
                        const candReward = roomRewards.find((r) => r.user_id === lb.user_id);
                        const isTop3 = rankNum <= 3;

                        return (
                          <div
                            key={lb.id || idx}
                            className={`py-3 px-4 rounded-xl flex items-center justify-between text-xs transition border ${
                              isMe
                                ? "bg-[#FF00C8]/15 border-[#FF00C8]/40 font-bold"
                                : rankNum === 1
                                ? "bg-gradient-to-r from-yellow-500/15 to-transparent border-yellow-500/30"
                                : rankNum === 2
                                ? "bg-gradient-to-r from-slate-400/10 to-transparent border-slate-400/20"
                                : rankNum === 3
                                ? "bg-gradient-to-r from-amber-700/10 to-transparent border-amber-700/20"
                                : "bg-white/[0.01] border-white/5 hover:bg-white/[0.03]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-gray-400 w-7 flex items-center">
                                {rankNum === 1 ? (
                                  <span className="text-base">🥇</span>
                                ) : rankNum === 2 ? (
                                  <span className="text-base">🥈</span>
                                ) : rankNum === 3 ? (
                                  <span className="text-base">🥉</span>
                                ) : (
                                  `#${rankNum}`
                                )}
                              </span>
                              <span className="text-white font-bold">
                                {lb.profiles?.full_name ||
                                  lb.profiles?.username ||
                                  "Candidate"}
                              </span>
                              {isMe && (
                                <span className="text-[10px] text-[#FF00C8] font-mono">
                                  (You)
                                </span>
                              )}
                              {candReward && candReward.reward_type && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-300 font-mono font-semibold">
                                  +{candReward.gbits_awarded.toLocaleString()} gBits
                                </span>
                              )}
                            </div>
                            <span className="font-mono font-bold text-amber-400">
                              {lb.total_score} Pts
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CERTIFICATES & AWARDS TAB */}
            {activeSidebarTab === "certificates" && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Award size={18} className="text-[#00F0FF]" /> Official Certificates & Awards
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Verifiable digital credentials and achievements earned in this Pro Arena.
                    </p>
                  </div>
                  {userCertificates.length > 0 && (
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1.5">
                      <CheckCircle size={11} /> {userCertificates.length} Verified Credential{userCertificates.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {userCertificates.length > 0 ? (
                  <div className="space-y-6">
                    {userCertificates.map((cert) => {
                      const isWinner = cert.type && cert.type.startsWith("winner");
                      return (
                        <div
                          key={cert.id}
                          className={`p-6 rounded-2xl border transition shadow-xl space-y-5 ${
                            isWinner
                              ? "bg-gradient-to-r from-yellow-500/10 via-purple-900/10 to-transparent border-yellow-500/30"
                              : "bg-white/[0.02] border-white/10"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                                  isWinner
                                    ? "bg-yellow-400/20 border border-yellow-400/40 text-yellow-300"
                                    : "bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF]"
                                }`}
                              >
                                {isWinner ? "🏆" : "🎓"}
                              </div>
                              <div>
                                <span
                                  className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1 ${
                                    isWinner
                                      ? "bg-yellow-400/20 text-yellow-300"
                                      : "bg-[#00F0FF]/20 text-[#00F0FF]"
                                  }`}
                                >
                                  {isWinner
                                    ? `Official ${cert.type === "winner" || cert.type === "winner_1" ? "1st Place" : cert.type === "runner_up" || cert.type === "winner_2" ? "2nd Place" : "3rd Place"} Award`
                                    : "Certificate of Achievement"}
                                </span>
                                <h4 className="text-base font-bold text-white">
                                  {isWinner ? "Certificate of Excellence" : "Certificate of Achievement"}
                                </h4>
                                <p className="text-xs text-gray-400">
                                  Awarded to <strong className="text-white">{cert.recipient_name}</strong> • Placement:{" "}
                                  <strong className="text-white">Rank #{cert.rank ?? "—"}</strong>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
                              <button
                                onClick={() => handleOpenCertificate(cert)}
                                className={`px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition flex items-center gap-2 shadow-lg ${
                                  isWinner
                                    ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-yellow-500/20 hover:opacity-90"
                                    : "bg-[#00F0FF] text-black shadow-[#00F0FF]/20 hover:opacity-90"
                                }`}
                              >
                                <Award size={15} />
                                <span>Fullscreen View</span>
                              </button>
                              <button
                                onClick={() => handleDownloadCertificate(cert)}
                                className="px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                              >
                                <Download size={14} />
                                <span>Download PNG</span>
                              </button>
                            </div>
                          </div>

                          {/* Official Glitch Room Certificate Design */}
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <GlitchCertificateDOM cert={cert} room={room} />
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-black/40 rounded-xl border border-white/5 text-xs">
                            <div>
                              <span className="text-[10px] text-gray-500 block font-mono">Score</span>
                              <span className="text-white font-bold font-mono">{cert.score ?? 0} Pts</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 block font-mono">Percentage</span>
                              <span className="text-white font-bold font-mono">{cert.percentage ?? 0}%</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 block font-mono">Credential ID</span>
                              <span className="text-cyan-400 font-bold font-mono text-[11px] truncate block">
                                {cert.certificate_number}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 block font-mono">Issued Date</span>
                              <span className="text-gray-300 font-mono text-[11px]">
                                {new Date(cert.issued_at || Date.now()).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4 bg-[#06060c] border border-white/5 rounded-2xl p-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400">
                      <Award size={28} />
                    </div>
                    <div className="space-y-3 max-w-md mx-auto">
                      <h4 className="text-base font-bold text-white">
                        {canViewResults
                          ? isEligibleForCert
                            ? "Official Credential Ready to Claim"
                            : "No Certificate Issued"
                          : "Certificates Awaiting Publication"}
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {userSubmission
                          ? canViewResults
                            ? isEligibleForCert
                              ? `Congratulations! You placed Rank ${actualRank} with a score of ${actualScore} pts (${actualPercentage})! You qualify for an official verified credential in this arena.`
                              : `You completed this assessment with a score of ${actualScore} pts (${actualPercentage}). A minimum score of ${room?.passing_score || 50}% is required for certification.`
                            : "Your submission has been recorded. Official digital certificates and awards will be generated and made available here once the organizer publishes results."
                          : "Complete your assessment and meet the qualification benchmark to receive an official verified cyber certificate."}
                      </p>
                      {canViewResults && isEligibleForCert && (
                        <button
                          onClick={handleClaimOrGenerateCertificate}
                          disabled={generatingCert}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00F0FF] to-purple-600 hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-[#00F0FF]/20 transition cursor-pointer flex items-center gap-2 mx-auto disabled:opacity-50"
                        >
                          <Award size={15} />
                          <span>{generatingCert ? "Generating Certificate..." : "Claim & View Official Certificate"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSidebarTab === "ask_doubt" && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <HelpCircle size={16} className="text-[#00F0FF]" /> Ask a
                      Question / Post Doubt
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Submit your query or doubt to the room discussion feed.
                    </p>
                  </div>
                </div>

                <div className="bg-[#07070e] border border-[#00F0FF]/25 rounded-2xl p-5 space-y-4 shadow-xl">
                  <h4 className="text-xs font-bold text-[#00F0FF] flex items-center gap-1.5">
                    <Plus size={14} /> New Question Details
                  </h4>
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1.5">
                      Question Title *
                    </label>
                    <input
                      type="text"
                      placeholder="Question Title (e.g., How to handle API rate limiting in Section 2?)..."
                      value={discTitle}
                      onChange={(e) => setDiscTitle(e.target.value)}
                      className="w-full bg-[#030308] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1.5">
                      Detailed Description / Context *
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Provide detailed information, code snippets, or error tracebacks..."
                      value={discContent}
                      onChange={(e) => setDiscContent(e.target.value)}
                      className="w-full bg-[#030308] border border-white/10 rounded-xl p-4 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[11px] text-gray-500 font-mono">
                      Visible to all room candidates & hosts
                    </span>
                    <button
                      onClick={handlePostDiscussion}
                      disabled={
                        postingDisc || !discTitle.trim() || !discContent.trim()
                      }
                      className="px-6 py-2.5 rounded-xl bg-[#00F0FF] hover:bg-[#00d0df] text-black text-xs font-bold cursor-pointer disabled:opacity-50 transition shadow-lg shadow-[#00F0FF]/20 flex items-center gap-2"
                    >
                      <Send size={14} /> Post Question
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSidebarTab === "discussion" && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-8 shadow-2xl text-center space-y-4">
                <MessageSquare size={40} className="text-[#00F0FF] mx-auto" />
                <h3 className="text-base font-bold text-white">
                  Q&A Discussion Feed
                </h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  View all room questions, solutions, and community discussions
                  in the dedicated Discussion Modal.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setShowDiscussionModal(true)}
                    className="px-6 py-2.5 rounded-xl bg-[#00F0FF] hover:bg-[#00d0df] text-black text-xs font-bold cursor-pointer transition shadow-lg shadow-[#00F0FF]/20 flex items-center gap-2"
                  >
                    <MessageSquare size={15} /> Open Discussion Feed (
                    {discussions.length})
                  </button>
                  <button
                    onClick={() => setActiveSidebarTab("ask_doubt")}
                    className="px-5 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold cursor-pointer transition flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Ask a Doubt
                  </button>
                </div>
              </div>
            )}

            {activeSidebarTab === "organizers" && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                  <Building2 size={16} className="text-purple-400" /> Host &
                  Organizer Information
                </h3>

                <div className="p-6 rounded-2xl bg-[#06060c] border border-white/10 space-y-4 text-xs">
                  <div className="flex items-center gap-4">
                    {room.org_logo ? (
                      <img
                        src={room.org_logo}
                        alt="Logo"
                        className="w-14 h-14 rounded-2xl object-cover border border-white/10"
                      />
                    ) : (
                      <Building2 size={32} className="text-[#00F0FF]" />
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1">
                        {room.org_name || "Verified Organization"}{" "}
                        <ShieldCheck size={14} className="text-[#00F0FF]" />
                      </h4>
                      <p className="text-gray-400 text-[11px]">
                        {room.org_email || "contact@organizer.edu"}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-300 leading-relaxed">
                    Verified organization hosting high-stakes technical
                    assessments and competitions on Glitch Room.
                  </p>

                  <a
                    href={room.website || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30"
                  >
                    Visit Official Website <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}

            {activeSidebarTab === "resources" && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Folder size={16} className="text-[#00F0FF]" /> Event
                    Resources & Materials
                    {resources.length > 0 && (
                      <span className="text-xs font-mono font-normal text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                        {resources.length}
                      </span>
                    )}
                  </h3>
                  {isHost && (
                    <button
                      onClick={handleOpenAddResource}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#0080FF] hover:opacity-90 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#00F0FF]/15 transition"
                    >
                      <Plus size={14} /> Add Resource
                    </button>
                  )}
                </div>

                {resources.length === 0 ? (
                  <div className="text-center py-16 space-y-3 bg-[#06060c] border border-white/5 rounded-2xl p-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-500">
                      <FolderOpen size={24} className="text-[#00F0FF]/60" />
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      No resources available yet
                    </h4>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                      {isHost
                        ? "Upload or link reference materials, problem datasets, or guides for participants."
                        : "The host has not added any files or study materials for this event."}
                    </p>
                    {isHost && (
                      <button
                        onClick={handleOpenAddResource}
                        className="mt-2 px-4 py-2 rounded-xl bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-black text-xs font-bold cursor-pointer transition inline-flex items-center gap-1.5"
                      >
                        <Plus size={13} /> Add First Resource
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {resources.map((res) => (
                      <div
                        key={res.id}
                        className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-bold text-xs sm:text-sm">
                              {res.title}
                            </span>
                            {res.file_type && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase font-bold">
                                {res.file_type}
                              </span>
                            )}
                          </div>
                          {res.description && (
                            <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                              {res.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                            {res.file_name && <span>{res.file_name}</span>}
                            {res.file_name && res.file_size && <span>•</span>}
                            {res.file_size && <span>{res.file_size}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {res.file_url ? (
                            <button
                              onClick={() => handleDownloadResource(res)}
                              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-200 hover:text-white cursor-pointer transition flex items-center gap-1.5 border border-white/10"
                            >
                              <Download size={13} className="text-[#00F0FF]" />
                              {res.file_url.startsWith("http") &&
                              !res.file_url.includes("data:")
                                ? "Open Link"
                                : "Download"}
                            </button>
                          ) : (
                            <span className="text-[10px] font-mono text-gray-500 px-2 py-1">
                              View Only
                            </span>
                          )}

                          {isHost && (
                            <>
                              <button
                                onClick={() => handleOpenEditResource(res)}
                                title="Edit Resource"
                                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-[#00F0FF] transition cursor-pointer border border-white/10"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteResource(res.id)}
                                title="Delete Resource"
                                className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition cursor-pointer border border-red-500/20"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSidebarTab === "help" && (
              <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 text-xs">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                  <HelpCircle size={16} className="text-amber-400" /> Candidate
                  Help & Support
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  If you encounter technical issues during code execution or
                  assessment tasks, reach out to event mentors or submit a
                  direct query.
                </p>
                <button
                  onClick={() => showToast("🎧 Support assistant notified.")}
                  className="px-5 py-2.5 rounded-xl bg-[#FF00C8] text-white font-bold cursor-pointer"
                >
                  Request Support Assistant
                </button>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="hidden lg:block lg:col-span-3 space-y-6">
            {/* Announcements Box */}
            <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                  <Megaphone size={14} className="text-purple-400" />{" "}
                  Announcements
                </h4>
                <span
                  onClick={() => setActiveSidebarTab("announcements")}
                  className="text-[10px] font-mono text-purple-400 cursor-pointer"
                >
                  View All
                </span>
              </div>

              <div className="space-y-3">
                {announcements.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">
                    No announcements yet.
                  </p>
                ) : (
                  announcements.slice(0, 3).map((a) => (
                    <div
                      key={a.id}
                      className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1"
                    >
                      <span className="text-xs font-bold text-white block truncate">
                        {a.title}
                      </span>
                      <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                        {a.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions Box */}
            <div className="bg-[#0c0c16] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-3">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest mb-2">
                Quick Actions
              </h4>

              <button
                type="button"
                onClick={() => navigate(`/pro-rooms/${id}/assessment`)}
                className="w-full py-3 rounded-xl bg-[#FF00C8] hover:bg-[#d600a8] text-white text-xs font-bold transition shadow-lg shadow-[#FF00C8]/25 cursor-pointer flex items-center justify-between px-4"
              >
                <span>Start Assessment</span>
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => setActiveSidebarTab("leaderboard")}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition cursor-pointer flex items-center justify-between px-4"
              >
                <span className="flex items-center gap-1.5">
                  <span>View Leaderboard</span>
                  {!canViewResults && <Lock size={11} className="text-amber-400" />}
                </span>
                <ChevronRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => setActiveSidebarTab("discussion")}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition cursor-pointer flex items-center justify-between px-4"
              >
                <span className="flex items-center gap-2">
                  <span>Discussion</span>
                  {discussions.length > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00F0FF]/20 text-[#00F0FF]">
                      {discussions.length}
                    </span>
                  )}
                </span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* DIRECTIVE 5: TALLER & MORE READABLE BOTTOM FIXED FOOTER */}
      <div className="sticky bottom-0 z-40 border-t border-white/10 bg-[#07070e]/95 backdrop-blur-md px-4 py-3 sm:py-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-8 overflow-x-auto w-full sm:w-auto no-scrollbar [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
            {/* User gBits Balance */}
            <div className="flex flex-col items-center text-center gap-1 shrink-0 px-1 sm:px-0">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                <Zap size={16} className="text-purple-400" />
              </div>
              <div>
                <span className="text-white text-xs sm:text-sm font-black font-mono block leading-none">
                  {userGbits} gBits
                </span>
                <span className="text-[9px] text-gray-400 tracking-wider uppercase mt-0.5 block">
                  Your Balance
                </span>
              </div>
            </div>

            {/* Target Rank */}
            <div className="flex flex-col items-center text-center gap-1 shrink-0 border-l border-white/10 pl-3 sm:pl-8">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Trophy size={16} className="text-amber-400" />
              </div>
              <div>
                <span className="text-white text-xs sm:text-sm font-black font-mono block leading-none">
                  {canViewResults ? userRankDisplay : (userSubmission ? "🔒 Pending" : "—")}
                </span>
                <span className="text-[9px] text-gray-400 tracking-wider uppercase mt-0.5 block">
                  {canViewResults ? "Target Rank" : "Official Rank"}
                </span>
              </div>
            </div>

            {/* Your Score (earned in this room) */}
            <div className="flex flex-col items-center text-center gap-1 shrink-0 border-l border-white/10 pl-3 sm:pl-8">
              <div className="w-8 h-8 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center shrink-0">
                <Award size={16} className="text-[#00F0FF]" />
              </div>
              <div>
                <span className="text-white text-xs sm:text-sm font-black font-mono block leading-none">
                  {canViewResults ? `${actualScore} / ${totalPossible}` : (userSubmission ? "🔒 Pending" : `— / ${totalPossible}`)}
                </span>
                <span className="text-[9px] text-gray-400 tracking-wider uppercase mt-0.5 block">
                  Total Points
                </span>
              </div>
            </div>

            {/* Event Starts Time */}
            <div className="flex flex-col items-center text-center gap-1 shrink-0 border-l border-white/10 pl-3 sm:pl-8">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Play size={16} className="text-emerald-400" />
              </div>
              <div>
                <span className="text-white text-xs sm:text-sm font-black font-mono block leading-none">
                  {eventStartFormatted}
                </span>
                <span className="text-[9px] text-gray-400 tracking-wider uppercase mt-0.5 block">
                  Event Starts
                </span>
              </div>
            </div>

            {/* Event Ends Time */}
            <div className="flex flex-col items-center text-center gap-1 shrink-0 border-l border-white/10 pl-3 sm:pl-8">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                <Calendar size={16} className="text-purple-400" />
              </div>
              <div>
                <span className="text-white text-xs sm:text-sm font-black font-mono block leading-none">
                  {eventEndFormatted}
                </span>
                <span className="text-[9px] text-gray-400 tracking-wider uppercase mt-0.5 block">
                  Event Ends
                </span>
              </div>
            </div>

            {/* FIXED: was "hidden sm:flex" — completely unreachable below the
                sm breakpoint since it sat outside this scroll container,
                competing for space with a w-full stats block that left it
                nowhere to go. Moved inside the same horizontally-scrollable
                row as the other stat items so it scrolls into view on
                mobile instead of disappearing. */}
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="flex sm:hidden flex-col items-center text-center gap-1 shrink-0 border-l border-white/10 pl-3 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                <HelpCircle size={16} className="text-purple-400" />
              </div>
              <div>
                <span className="text-white text-xs font-black font-mono block leading-none">
                  Help
                </span>
                <span className="text-[9px] text-gray-400 tracking-wider uppercase mt-0.5 block">
                  Support
                </span>
              </div>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="hidden sm:flex px-4 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold transition cursor-pointer items-center gap-2 shrink-0 shadow-lg"
          >
            <HelpCircle size={15} /> Need Help?
          </button>
        </div>
      </div>

      {/* ARCHIVE / DELETE ROOM CONFIRMATION MODAL */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c0c16] border border-red-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} />
              <h3 className="text-base font-bold text-white">
                Archive / Delete Pro Room
              </h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-white">
                "{room?.name || room?.title}"
              </strong>
              ? This action cannot be undone. All sections, questions, and
              candidate submissions will be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-gray-300 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRoom}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-red-600/30"
              >
                Delete Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISCUSSION FEED MODAL */}
      {showDiscussionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-[#0c0c16] border border-white/15 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#07070e]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MessageSquare size={18} className="text-[#00F0FF]" /> Q&A
                  Discussion Feed ({discussions.length})
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  View questions, solutions, and community discussions.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowDiscussionModal(false);
                    setActiveSidebarTab("ask_doubt");
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-bold cursor-pointer transition flex items-center gap-1.5"
                >
                  <Plus size={13} /> Ask a Doubt
                </button>
                <button
                  onClick={() => setShowDiscussionModal(false)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Feed List ONLY (No Question-Posting Form) */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {discussions.length === 0 ? (
                <div className="text-center py-16 space-y-3 bg-[#06060c] border border-white/5 rounded-2xl p-6">
                  <MessageSquare size={36} className="text-gray-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">
                    No Discussions Posted Yet
                  </h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Be the first to post a question or doubt in this room!
                  </p>
                  <button
                    onClick={() => {
                      setShowDiscussionModal(false);
                      setActiveSidebarTab("ask_doubt");
                    }}
                    className="mt-2 px-5 py-2 rounded-xl bg-[#00F0FF] text-black text-xs font-bold cursor-pointer"
                  >
                    Ask a Doubt Now
                  </button>
                </div>
              ) : (
                discussions.map((d) => {
                  const isMyDisc = d.user_id === currentUserId;
                  const canDeleteDisc = isMyDisc || isHost;
                  const repliesList = d.replies || [];
                  const isExpanded = expandedDiscIds[d.id] ?? true;

                  return (
                    <div
                      key={d.id}
                      className="p-5 rounded-2xl bg-[#06060c] border border-white/10 space-y-3 shadow-lg hover:border-white/20 transition"
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-full bg-purple-900/50 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-300 shrink-0 uppercase">
                            {d.profiles?.full_name?.charAt(0) ||
                              d.profiles?.username?.charAt(0) ||
                              "U"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-white leading-tight flex items-center gap-2 flex-wrap">
                              {d.title || d.content?.split("\n")[0] || "Question"}
                              {d.user_id === room?.host_id && (
                                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                                  HOST
                                </span>
                              )}
                              {isMyDisc && (
                                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[#00F0FF]">
                                  YOU
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mt-1">
                              <span>
                                {d.profiles?.full_name ||
                                  d.profiles?.username ||
                                  "Candidate"}
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(
                                  d.created_at || Date.now(),
                                ).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(
                                  d.created_at || Date.now(),
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Moderation / Delete Controls */}
                        {canDeleteDisc && (
                          <button
                            onClick={() => handleDeleteDiscussion(d.id)}
                            title={
                              isHost && !isMyDisc
                                ? "Host Moderate / Delete"
                                : "Delete your post"
                            }
                            className="text-gray-500 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition cursor-pointer shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* Question Content */}
                      <p className="text-xs text-gray-300 leading-relaxed pl-11 whitespace-pre-wrap">
                        {d.content}
                      </p>

                      {/* Thread Footer & Reply Toggle */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs pl-11">
                        <button
                          onClick={() => toggleExpandDisc(d.id)}
                          className="text-gray-400 hover:text-[#00F0FF] text-[11px] font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageCircle size={13} className="text-[#00F0FF]" />
                          <span>
                            {repliesList.length}{" "}
                            {repliesList.length === 1 ? "Reply" : "Replies"}
                          </span>
                        </button>
                      </div>

                      {/* Replies Thread Section */}
                      {isExpanded && (
                        <div className="pl-11 pt-2 space-y-3">
                          {repliesList.map((r) => {
                            const isMyReply = r.user_id === currentUserId;
                            const canDeleteReply = isMyReply || isHost;
                            return (
                              <div
                                key={r.id}
                                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 relative"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-purple-300">
                                      {r.profiles?.full_name ||
                                        r.profiles?.username ||
                                        "Participant"}
                                    </span>
                                    {r.user_id === room?.host_id && (
                                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                                        HOST
                                      </span>
                                    )}
                                    {isMyReply && (
                                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-[#00F0FF]">
                                        YOU
                                      </span>
                                    )}
                                    <span className="text-[10px] text-gray-500 font-mono">
                                      {new Date(
                                        r.created_at || Date.now(),
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                  {canDeleteReply && (
                                    <button
                                      onClick={() =>
                                        handleDeleteReply(d.id, r.id)
                                      }
                                      className="text-gray-500 hover:text-red-400 p-0.5 cursor-pointer"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                  {r.content}
                                </p>
                              </div>
                            );
                          })}

                          {/* Reply Input Box */}
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              placeholder="Write a reply..."
                              value={replyTextMap[d.id] || ""}
                              onChange={(e) =>
                                setReplyTextMap({
                                  ...replyTextMap,
                                  [d.id]: e.target.value,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handlePostReply(d.id);
                                }
                              }}
                              className="flex-1 bg-[#030308] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                            />
                            <button
                              onClick={() => handlePostReply(d.id)}
                              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer transition shrink-0 flex items-center gap-1"
                            >
                              Reply <Send size={11} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT RESOURCE MODAL (HOST ONLY) */}
      {showResourceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-[#0c0c16] border border-white/15 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#07070e]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Folder size={18} className="text-[#00F0FF]" />
                  {editingResource ? "Edit Resource" : "Add Event Resource"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Share reference files, problem datasets, or guides with participants.
                </p>
              </div>
              <button
                onClick={() => setShowResourceModal(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveResource} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-gray-300 mb-1.5">
                  Resource Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Problem Dataset & API Documentation"
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  className="w-full bg-[#030308] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-gray-300 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Short note or instruction about this resource..."
                  value={resDesc}
                  onChange={(e) => setResDesc(e.target.value)}
                  className="w-full bg-[#030308] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-gray-300 mb-1.5">
                    Resource Type
                  </label>
                  <select
                    value={resFileType}
                    onChange={(e) => setResFileType(e.target.value)}
                    className="w-full bg-[#030308] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#00F0FF]"
                  >
                    <option value="ZIP">ZIP Archive</option>
                    <option value="PDF">PDF Document</option>
                    <option value="DATASET">Dataset (CSV/JSON)</option>
                    <option value="CODE">Code Starter</option>
                    <option value="DOC">Document / Guide</option>
                    <option value="LINK">External Link</option>
                    <option value="FILE">Other File</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-gray-300 mb-1.5">
                    File Size / Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 12 MB or Online Link"
                    value={resFileSize}
                    onChange={(e) => setResFileSize(e.target.value)}
                    className="w-full bg-[#030308] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                  />
                </div>
              </div>

              {/* Direct File Upload */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-gray-300">
                  Upload File
                </label>
                <label className="border border-dashed border-white/20 hover:border-[#00F0FF]/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-white/[0.01] hover:bg-[#00F0FF]/5 transition group">
                  <Upload
                    size={20}
                    className="text-gray-500 group-hover:text-[#00F0FF] transition mb-1"
                  />
                  <span className="text-xs text-gray-300 font-medium text-center truncate max-w-full">
                    {resFileName ? resFileName : "Choose a file to attach"}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono mt-0.5">
                    ZIP, PDF, JSON, CSV, TXT (up to 10MB)
                  </span>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Or Direct URL / Web Link */}
              <div>
                <label className="block text-xs font-mono font-bold text-gray-300 mb-1.5">
                  Or External URL / Link
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or https://github.com/..."
                  value={resUrl && !resUrl.startsWith("data:") ? resUrl : ""}
                  onChange={(e) => {
                    setResUrl(e.target.value);
                    if (!resFileName && e.target.value) {
                      setResFileName("External Link");
                    }
                  }}
                  className="w-full bg-[#030308] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00F0FF]"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowResourceModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingResource}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#0080FF] text-black font-bold text-xs cursor-pointer hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingResource
                    ? "Saving..."
                    : editingResource
                    ? "Update Resource"
                    : "Add Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRO ROOM REGISTRATION MODAL */}
      <ProRoomRegistrationModal
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
        room={room}
        showToast={showToast}
        onRegistrationSuccess={(payload) => {
          setUserRegistration(payload);
          fetchRoomData();
        }}
      />

      {/* DUAL SUPPORT HELP MODAL */}
      <ProRoomHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        room={room}
        showToast={showToast}
      />

      {/* IN-APP DIGITAL CERTIFICATE MODAL */}
      <GlitchCertificateModal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        certificate={selectedCertificate}
        room={room}
        showToast={showToast}
      />
    </div>
  );
};

export default ProfessionalRoomDetail;
