import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const toKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const cellColor = (count) => {
  if (!count) return "#ffffff0d";
  if (count === 1) return "rgba(0,240,255,0.22)";
  if (count === 2) return "rgba(0,240,255,0.45)";
  if (count <= 4) return "rgba(0,240,255,0.68)";
  return "rgba(0,240,255,0.92)";
};

const buildGrid = (activityMap) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // go back 52 weeks from today
  const start = new Date(today);
  start.setDate(today.getDate() - 52 * 7 + 1);
  // align to Monday
  while (start.getDay() !== 1) start.setDate(start.getDate() - 1);

  const weeks = [];
  const cur = new Date(start);
  while (cur <= today) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      const key = toKey(cur);
      week.push({
        date: new Date(cur),
        key,
        count: activityMap[key] || 0,
        isFuture: cur > today,
      });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
};

const calcStreak = (activityMap) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  const d = new Date(today);
  // if no activity today, start from yesterday
  if (!activityMap[toKey(d)]) d.setDate(d.getDate() - 1);
  while (activityMap[toKey(d)]) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
};

// tooltip
const Tip = ({ cell, pos }) => {
  if (!cell) return null;
  const lbl = cell.date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return (
    <div
      className="pointer-events-none fixed z-50 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
      style={{
        left: pos.x + 14,
        top: pos.y - 42,
        background: "#0f0f1a",
        border: "1px solid rgba(0,240,255,0.3)",
        boxShadow: "0 0 14px rgba(0,240,255,0.15)",
        whiteSpace: "nowrap",
      }}
    >
      {cell.count > 0
        ? `${cell.count} challenge${cell.count > 1 ? "s" : ""} · `
        : "No activity · "}
      {lbl}
    </div>
  );
};

const CELL = 13;
const GAP = 3;
const DAY_W = 28;

export default function ActivityHeatmap({ userId }) {
  const [map, setMap] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoad] = useState(true);
  const [tip, setTip] = useState({ cell: null, pos: { x: 0, y: 0 } });
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      setLoad(true);
      const uid = userId || (await supabase.auth.getUser()).data?.user?.id;
      if (!uid) {
        setLoad(false);
        return;
      }
      const since = new Date();
      since.setFullYear(since.getFullYear() - 1);
      const { data } = await supabase
        .from("glitch_activity")
        .select("created_at")
        .eq("user_id", uid)
        .gte("created_at", since.toISOString());
      const m = {};
      (data || []).forEach((r) => {
        const k = toKey(new Date(r.created_at));
        m[k] = (m[k] || 0) + 1;
      });
      setMap(m);
      setTotal(Object.values(m).reduce((a, b) => a + b, 0));
      setLoad(false);
    })();
  }, [userId]);

  useEffect(() => {
    if (!loading && scrollRef.current)
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, [loading]);

  const weeks = buildGrid(map);
  const streak = calcStreak(map);

  // month labels: one label per month, placed at first week of that month
  const monthCols = [];
  let lastM = -1;
  weeks.forEach((wk, wi) => {
    const m = wk[0].date.getMonth();
    if (m !== lastM) {
      monthCols.push({ label: MONTHS[m], wi });
      lastM = m;
    }
  });

  const gridW = weeks.length * (CELL + GAP) - GAP;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-[#0f0f13] rounded-2xl border border-white/5 p-5"
    >
      {/* header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
            Activity Heatmap
          </p>
          <p className="text-white text-sm font-bold mt-0.5">
            {total} challenge{total !== 1 ? "s" : ""} in the last year
          </p>
        </div>
        <div className="text-right">
          <p
            className="text-2xl font-black"
            style={{
              background: "linear-gradient(90deg,#00F0FF,#FF00C8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {streak}
          </p>
          <p className="text-[9px] text-gray-600 uppercase tracking-widest">
            Day streak
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-[120px] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-t-transparent border-cyan-500 rounded-full animate-spin" />
        </div>
      ) : (
        /* scroll wrapper — fixed height so nothing bleeds out */
        <div
          ref={scrollRef}
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            scrollbarWidth: "none",
          }}
        >
          <div
            style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}
          >
            {/* row 1: month labels */}
            <div style={{ display: "flex", marginLeft: DAY_W + GAP }}>
              {/* We render spans spaced by column index */}
              <div style={{ position: "relative", height: 14, width: gridW }}>
                {monthCols.map((mc, i) => (
                  <span
                    key={i}
                    style={{
                      position: "absolute",
                      left: mc.wi * (CELL + GAP),
                      fontSize: 10,
                      color: "#6b7280",
                      fontWeight: 600,
                      lineHeight: 1,
                    }}
                  >
                    {mc.label}
                  </span>
                ))}
              </div>
            </div>

            {/* row 2: day labels + cells */}
            <div
              style={{ display: "flex", gap: GAP, alignItems: "flex-start" }}
            >
              {/* day-of-week column */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: GAP,
                  width: DAY_W,
                  flexShrink: 0,
                }}
              >
                {["Mon", "", "Wed", "", "Fri", "", ""].map((lbl, i) => (
                  <div
                    key={i}
                    style={{
                      height: CELL,
                      display: "flex",
                      alignItems: "center",
                      fontSize: 9,
                      color: "#6b7280",
                      fontWeight: 600,
                      opacity: lbl ? 1 : 0,
                    }}
                  >
                    {lbl}
                  </div>
                ))}
              </div>

              {/* week columns */}
              <div style={{ display: "flex", gap: GAP }}>
                {weeks.map((wk, wi) => (
                  <div
                    key={wi}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: GAP,
                    }}
                  >
                    {wk.map((cell, di) => (
                      <div
                        key={di}
                        onMouseEnter={(e) =>
                          !cell.isFuture &&
                          setTip({ cell, pos: { x: e.clientX, y: e.clientY } })
                        }
                        onMouseMove={(e) =>
                          setTip((t) => ({
                            ...t,
                            pos: { x: e.clientX, y: e.clientY },
                          }))
                        }
                        onMouseLeave={() =>
                          setTip({ cell: null, pos: { x: 0, y: 0 } })
                        }
                        onMouseOver={(e) => {
                          if (!cell.isFuture)
                            e.currentTarget.style.transform = "scale(1.4)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                        style={{
                          width: CELL,
                          height: CELL,
                          borderRadius: 3,
                          flexShrink: 0,
                          background: cell.isFuture
                            ? "transparent"
                            : cellColor(cell.count),
                          transition: "transform 0.1s",
                          cursor: cell.isFuture ? "default" : "pointer",
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* row 3: legend */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                justifyContent: "flex-end",
                marginTop: 4,
              }}
            >
              <span style={{ fontSize: 10, color: "#6b7280" }}>Less</span>
              {[0, 1, 2, 3, 5].map((n) => (
                <div
                  key={n}
                  style={{
                    width: CELL,
                    height: CELL,
                    borderRadius: 3,
                    background: cellColor(n),
                  }}
                />
              ))}
              <span style={{ fontSize: 10, color: "#6b7280" }}>More</span>
            </div>
          </div>
        </div>
      )}

      <Tip cell={tip.cell} pos={tip.pos} />
    </motion.div>
  );
}
