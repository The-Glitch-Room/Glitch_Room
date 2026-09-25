import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../Navbar";
import Footer from "../Footer";
import CreateRoomModal from "./CreateRoomModal";
import RoomCard from "./RoomCard";
import GlitchBackground from "../GlitchBackground";
import { Search, Archive, CheckCircle, Users, ArrowRight, Clock, Trophy } from "lucide-react";
import Button from "../Button";
import PageHeading from "../PageHeading";
import StatCard from "../StatCard";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../AuthContext";

const formatNumber = (n) => {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
};

const CreatorRooms = () => {
  const navigate = useNavigate();
  const { user, openAuth } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [myRoomIds, setMyRoomIds] = useState(new Set());
  const [totalCommittedBuilders, setTotalCommittedBuilders] = useState(0);
  const [totalStandups, setTotalStandups] = useState("0");
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);
  const [search, setSearch] = useState("");

  const handleOpenCreateModal = () => {
    if (!user) {
      openAuth();
      return;
    }
    setOpenModal(true);
  };

  const fetchRooms = async () => {
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;

    const { data: dbRooms, error } = await supabase
      .from("creator_rooms")
      .select("*")
      .order("created_at", { ascending: false });

    const creatorRooms = dbRooms || [];

    if (error) {
      console.error("Error fetching creator rooms:", error);
      setRooms([]);
    } else {
      setRooms(creatorRooms);
    }

    if (creatorRooms.length > 0) {
      const creatorRoomIds = creatorRooms.map((r) => r.id);

      // 1. Calculate Real Committed Builders Count & Dynamic Per-Room Member Counts
      const { data: membersData } = await supabase
        .from("creator_room_members")
        .select("room_id, user_id, left_at")
        .in("room_id", creatorRoomIds);

      // Members who left or were removed keep their row (left_at set) so
      // their forfeited stake stays in the room pool — but they're no
      // longer an active squad member, so exclude them here the same way
      // CreatorRoomDetail.jsx's activeMembers does.
      const activeMembersData = (membersData || []).filter((m) => !m.left_at);

      if (activeMembersData.length > 0) {
        const uniqueUsers = new Set(activeMembersData.map((m) => m.user_id));
        setTotalCommittedBuilders(uniqueUsers.size);

        // Group members by room_id
        const roomMembersMap = {};
        activeMembersData.forEach((m) => {
          if (!roomMembersMap[m.room_id]) roomMembersMap[m.room_id] = new Set();
          roomMembersMap[m.room_id].add(m.user_id);
        });

        const updatedRooms = creatorRooms.map((r) => {
          const uSet = roomMembersMap[r.id] || new Set();
          if (r.created_by && !uSet.has(r.created_by)) {
            uSet.add(r.created_by);
          }
          const actualCount = Math.max(1, uSet.size || r.member_count || 1);
          return { ...r, member_count: actualCount };
        });

        setRooms(updatedRooms);
      } else {
        setTotalCommittedBuilders(0);
        setRooms(creatorRooms);
      }

      // 2. Calculate Total Standups Shipped from Database Check-ins
      const { data: checkinData } = await supabase
        .from("creator_room_checkins")
        .select("id")
        .in("room_id", creatorRoomIds);

      if (checkinData && checkinData.length > 0) {
        setTotalStandups(checkinData.length);
      } else {
        setTotalStandups(0);
      }
    } else {
      setTotalCommittedBuilders(0);
      setTotalStandups(0);
      setRooms([]);
    }

    if (user) {
      const { data: myMemberships } = await supabase
        .from("creator_room_members")
        .select("room_id")
        .eq("user_id", user.id);

      if (myMemberships) {
        setMyRoomIds(new Set(myMemberships.map((m) => m.room_id)));
      }
    }
    setLoading(false);
  };

  const location = useLocation();

  useEffect(() => {
    fetchRooms();
    if (
      location.state?.openCreateModal ||
      location.search.includes("create=true")
    ) {
      if (!user) {
        openAuth();
      } else {
        setOpenModal(true);
      }
    }
  }, [location, user]);

  const handleJoin = async (room) => {
    const { data: userRes } = await supabase.auth.getUser();
    const currentUser = userRes?.user || user;
    if (!currentUser) {
      openAuth();
      return;
    }

    const roomEntryStake = Number(room?.entry_stake || 0);

    // Staked rooms must show the "you're about to stake gBits"
    // confirmation before any transaction happens — a member clicking
    // this card may not realize joining requires staking. That
    // confirmation modal lives on the room detail page, so for a
    // staked room, just navigate there unjoined rather than staking
    // immediately from this card with no confirmation at all. Free
    // rooms have nothing to confirm, so they keep the previous
    // immediate-join-then-navigate behavior.
    if (roomEntryStake > 0) {
      navigate(`/creator-rooms/${room.id}`);
      return;
    }

    setJoining(room.id);
    try {
      // Route through the SAME atomic RPC the room-detail page uses
      // (join_creator_room_with_stake) instead of inserting a bare
      // member row here. The old direct insert never checked
      // room.entry_stake and never deducted anything — so joining a
      // staked room from this list page silently skipped staking
      // entirely: 0 gBits deducted, 0 added to staked_amount, room pool
      // stuck at 0 regardless of what the room actually required.
      const { error: joinError } = await supabase.rpc(
        "join_creator_room_with_stake",
        { p_room_id: room.id, p_stake: roomEntryStake },
      );

      if (joinError) {
        console.error("Error joining creator room:", joinError);
        const msg = joinError.message || "";
        if (msg.includes("INSUFFICIENT_GBITS")) {
          alert(`You need ${roomEntryStake} gBits to stake & join this room.`);
        } else if (msg.includes("ROOM_ALREADY_SETTLED")) {
          alert(
            "This room's sprint has already ended and been settled — it's no longer accepting new members.",
          );
        } else if (!msg.includes("ALREADY_MEMBER")) {
          alert("Couldn't join the room — please try again.");
        }
        setJoining(null);
        return;
      }

      setMyRoomIds((prev) => new Set(prev).add(room.id));
      await fetchRooms();
      navigate(`/creator-rooms/${room.id}`);
    } catch (e) {
      console.error("Error joining room:", e);
    } finally {
      setJoining(null);
    }
  };

  const handleEnter = (roomId) => {
    navigate(`/creator-rooms/${roomId}`);
  };

  const handleCreateRoom = async (roomData) => {
    const { data: userRes } = await supabase.auth.getUser();
    const currentUser = userRes?.user || user;
    if (!currentUser) {
      openAuth();
      return;
    }

    try {
      // NOTE: CreateRoomModal builds its payload as nested objects
      // (gbits_stake, verification_system, buddy_system,
      // uptime_integration, rules, membership) but creator_rooms only has
      // FLAT columns for these — there is no gbits_stake/verification_system/
      // etc. column on the table. Previously this insert only forwarded a
      // handful of top-level fields and silently dropped everything else,
      // including the whole stake configuration, so no room ever actually
      // got created with a stake even when the host enabled one in the
      // modal. Map every nested field onto its real flat column here.
      const roomPayload = {
        name: roomData.title || roomData.name,
        description: roomData.description,
        category: roomData.category || "General",
        cover_icon: roomData.cover_icon || "⚡",
        visibility: roomData.visibility || "Public",
        created_by: currentUser.id,
        host:
          currentUser.user_metadata?.full_name ||
          currentUser.email?.split("@")[0] ||
          "Creator",
        goal_pledge: roomData.goal_pledge,
        duration_type: roomData.duration_type,
        start_date: roomData.start_date || null,
        end_date: roomData.end_date || null,
        checkin_deadline: roomData.checkin_deadline || "11:59 PM IST",
        proof_types: roomData.proof_types || undefined,

        who_can_verify: roomData.verification_system?.who_can_verify,

        enable_buddy: roomData.buddy_system?.enabled,

        enable_gbits_stake: !!roomData.gbits_stake?.enabled,
        entry_stake: roomData.gbits_stake?.enabled
          ? Number(roomData.gbits_stake?.entry_stake || 0)
          : 0,
        completion_reward: Number(roomData.gbits_stake?.completion_reward || 0),
        reward_pool_rules: roomData.gbits_stake?.reward_rules || null,
        missed_checkin_policy: roomData.gbits_stake?.missed_policy || null,

        room_rules: roomData.rules?.room_rules || null,
        code_of_conduct: roomData.rules?.code_of_conduct || null,

        max_members: roomData.membership?.max_members ?? 25,
        approval_required: !!roomData.membership?.approval_required,

        is_draft: !!roomData.is_draft,
      };

      // Strip undefined keys so we don't overwrite a column's DB default
      // with `undefined` when the modal didn't set that field.
      Object.keys(roomPayload).forEach((k) => {
        if (roomPayload[k] === undefined) delete roomPayload[k];
      });

      const { data: newRoom, error } = await supabase
        .from("creator_rooms")
        .insert([roomPayload])
        .select()
        .single();

      if (error) {
        console.error(
          "Primary creator_rooms insert failed, falling back to reduced payload:",
          error,
        );
        const { data: fallbackRoom, error: fallbackError } = await supabase
          .from("creator_rooms")
          .insert([
            {
              name: roomData.title,
              description: roomData.description,
              category: roomData.category,
              access: "public",
              created_by: user.id,
              host:
                user.user_metadata?.full_name ||
                user.email?.split("@")[0] ||
                "Creator",
              room_type: "creator",
            },
          ])
          .select()
          .single();

        if (fallbackError) {
          console.error(
            "Fallback creator_rooms insert also failed:",
            fallbackError,
          );
          return;
        }

        if (fallbackRoom) {
          const { error: memberError } = await supabase
            .from("creator_room_members")
            .insert([
              { room_id: fallbackRoom.id, user_id: user.id, role: "host" },
            ]);
          if (memberError) {
            console.error("Failed to add host as member:", memberError);
          }
          setOpenModal(false);
          await fetchRooms();
          navigate(`/creator-rooms/${fallbackRoom.id}`);
          return;
        }
      }

      if (newRoom) {
        // For staked rooms the host stakes gBits atomically via the same
        // RPC every other member uses — this deducts their balance and sets
        // staked_amount on the membership row so the room pool is accurate
        // from the moment the room is created.
        if (roomPayload.enable_gbits_stake && roomPayload.entry_stake > 0) {
          const { error: stakeErr } = await supabase.rpc(
            "join_creator_room_with_stake",
            { p_room_id: newRoom.id, p_stake: roomPayload.entry_stake },
          );
          if (stakeErr) {
            console.error("Host stake RPC failed:", stakeErr);
            // Fallback: plain insert so the room isn't left host-less
            await supabase
              .from("creator_room_members")
              .insert([{ room_id: newRoom.id, user_id: user.id, role: "host", staked_amount: roomPayload.entry_stake }]);
          } else {
            // RPC inserts role='member'; promote to 'host'
            await supabase
              .from("creator_room_members")
              .update({ role: "host" })
              .eq("room_id", newRoom.id)
              .eq("user_id", user.id);
          }
        } else {
          // Free room — plain insert, no gBits touched
          const { error: memberError } = await supabase
            .from("creator_room_members")
            .insert([{ room_id: newRoom.id, user_id: user.id, role: "host" }]);
          if (memberError) {
            console.error("Failed to add host as member:", memberError);
          }
        }
        setOpenModal(false);
        await fetchRooms();
        navigate(`/creator-rooms/${newRoom.id}`);
      }
    } catch (e) {
      console.error("Create room error:", e);
    }
  };

  const filtered = rooms.filter((r) => {
    const title = (r.name || r.title || "").toLowerCase();
    return (
      title.includes(search.toLowerCase()) ||
      (r.category || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.goal_pledge || "").toLowerCase().includes(search.toLowerCase())
    );
  });

  // Maps duration_type enum values (stored in DB) to days —
  // mirrors the exact same mapping used in CreatorRoomDetail.jsx so
  // a room is considered completed on both the list page and the detail
  // page at the same logical moment.
  const DURATION_DAYS = {
    "7_day": 7,
    "14_day": 14,
    "30_day": 30,
    "60_day": 60,
    "100_day": 100,
    "ongoing": null, // ongoing rooms never auto-complete
  };

  const isRoomCompleted = (room) => {
    // ongoing rooms never expire
    if (room.duration_type === "ongoing") return false;

    const days = DURATION_DAYS[room.duration_type] ?? null;
    const anchor = room.start_date || room.created_at;

    if (days && anchor) {
      const endDate = new Date(anchor);
      endDate.setDate(endDate.getDate() + days);
      return endDate < new Date();
    }

    // Fallback: explicit end_date stored on the row
    if (room.end_date) {
      return new Date(room.end_date) < new Date();
    }

    return false;
  };

  const activeFiltered = filtered.filter((r) => !isRoomCompleted(r));
  const completedFiltered = filtered.filter((r) => isRoomCompleted(r));


  // REAL CALCULATED HERO STATS FROM DATABASE
  const statItems = [
    {
      value: formatNumber(activeFiltered.length),
      label: "ACTIVE SQUADS",
      sublabel: "Accountability hubs",
    },
    {
      value:
        totalCommittedBuilders > 0 ? formatNumber(totalCommittedBuilders) : "0",
      label: "BUILDERS COMMITTED",
      sublabel: "Daily check-ins",
    },
    {
      value: totalStandups > 0 ? formatNumber(totalStandups) : "0",
      label: "STANDUPS SHIPPED",
      sublabel: "Proof of Work submitted",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#070709] text-white flex flex-col justify-between selection:bg-[#00F0FF]/20 overflow-hidden font-sans">
      <GlitchBackground />

      {/* Cyber Grid & Gradient Mask */}
      <div
        className="absolute top-0 left-0 right-0 h-[1100px] z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(168,85,247,0.25) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(168,85,247,0.25) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

        {/* ── HERO HEADER ── */}
        <section className="relative pt-36 md:pt-44 pb-12 px-6 mb-8 md:mb-16 text-center">
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <PageHeading
              eyebrow="CONSISTENCY & GOAL TRACKING"
              title="Creator Rooms"
              subtitle="Join accountability squads, set goal pledges, submit daily Proof of Work, track consistency streaks, and hold each other accountable."
              accent="purple"
              size="xl"
            />

            {/* Real Stats */}
            <div className="flex justify-center gap-10 flex-wrap my-8">
              {statItems.map((s, i) => (
                <StatCard
                  key={i}
                  value={s.value}
                  label={s.label}
                  sublabel={s.sublabel}
                  accent="purple"
                  variant="bare"
                  delay={0.2 + i * 0.1}
                />
              ))}
            </div>

            <div
              className="flex justify-center"
              onClick={handleOpenCreateModal}
            >
              <Button
                content="+ Start an Accountability Room"
                accent="purple"
              />
            </div>
          </div>
        </section>

        {/* Search Bar */}
        <section className="max-w-6xl mx-auto px-6 w-full mb-8">
          <div className="relative w-full">
            <Search
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rooms by title, goal pledge, category..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#0f0f18] border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-purple-500/40 transition font-sans"
            />
          </div>
        </section>

        {/* Rooms Grid */}
        <section className="max-w-6xl mx-auto px-6 pb-24 w-full flex-1">
          {loading ? (
            <div className="flex justify-center py-24">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-10 h-10 border-2 border-t-transparent border-purple-500 rounded-full"
              />
            </div>
          ) : activeFiltered.length === 0 && completedFiltered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 border border-dashed border-white/10 rounded-3xl bg-[#0f0f18]/60 p-8"
            >
              <div className="text-5xl mb-4">🎯</div>
              <p className="text-white text-lg font-bold">
                No creator rooms found.
              </p>
              <p className="text-gray-400 text-xs mt-2 mb-6 max-w-md mx-auto">
                Be the first to create a goal-driven squad and invite peers to
                stay consistent together!
              </p>
              <div className="inline-block" onClick={handleOpenCreateModal}>
                <Button
                  content="+ Create an Accountability Room"
                  accent="purple"
                />
              </div>
            </motion.div>
          ) : (
            <>
              {/* Active Rooms Grid */}
              {activeFiltered.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeFiltered.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      isMember={myRoomIds.has(room.id)}
                      onJoin={handleJoin}
                      onEnter={handleEnter}
                      joining={joining}
                    />
                  ))}
                </div>
              )}

              {/* ── Past Vault ── */}
              {completedFiltered.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-14"
                >
                  {/* Vault header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <Archive size={15} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-white tracking-wide">Past Vault</h2>
                      <p className="text-[10px] text-gray-500 font-mono">{completedFiltered.length} completed sprint{completedFiltered.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/20 to-transparent ml-2" />
                  </div>

                  {/* Compact vault cards */}
                  <div className="flex flex-col gap-2">
                    {completedFiltered.map((room) => {
                      const endDate = room.end_date
                        ? new Date(room.end_date)
                        : room.start_date && room.duration_days
                        ? (() => { const s = new Date(room.start_date); s.setDate(s.getDate() + Number(room.duration_days)); return s; })()
                        : null;
                      const endLabel = endDate
                        ? endDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Sprint Ended';
                      const durationLabel = room.duration_type
                        || (room.duration_days ? `${room.duration_days} Days` : null)
                        || (room.end_date && room.start_date
                            ? `${Math.round((new Date(room.end_date) - new Date(room.start_date)) / 86400000)} Days`
                            : null)
                        || 'Sprint';

                      return (
                        <motion.button
                          key={room.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          whileHover={{ x: 4 }}
                          onClick={() => handleEnter(room.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0c0c16] border border-white/[0.06] hover:border-emerald-500/25 hover:bg-emerald-500/5 transition-all group text-left cursor-pointer"
                        >
                          {/* Icon */}
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg shrink-0">
                            {room.cover_icon || '⚡'}
                          </div>

                          {/* Name + meta */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white truncate">{room.name || room.title}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono shrink-0">{durationLabel}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                                <Users size={9} /> {room.member_count || 1} members
                              </span>
                              <span className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                                <Clock size={9} /> Ended {endLabel}
                              </span>
                            </div>
                          </div>

                          {/* Completed badge */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="hidden sm:flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                              <CheckCircle size={10} /> Completed
                            </span>
                            <ArrowRight size={13} className="text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </section>
      </div>

      <AnimatePresence>
        {openModal && (
          <CreateRoomModal
            close={() => setOpenModal(false)}
            create={handleCreateRoom}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default CreatorRooms;