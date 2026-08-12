import { createClient } from "@supabase/supabase-js";

const client = createClient(
  "https://erbefolhymmvjadqnezq.supabase.co",
  "sb_publishable_a_KtULOJJXCJ7KhF8vBqCw_4m4N0Cu-"
);

const featured = [
  {
    title: "Quantum Bug Hunters 2026",
    description:
      "Inspect a complex asynchronous React state race condition where data updates out-of-order under heavy network latency.",
    glitch_scenario:
      "A high-traffic e-commerce checkout platform uses an asynchronous state handler to sync user cart quantity updates. Under heavy network latency, rapid clicks on quantity buttons trigger out-of-order state updates. Users end up paying for items that were removed from their cart or get charged incorrect totals.",
    hosted_by: "Glitch Room Core Team",
    skills: ["React 19", "Async/Await", "State Sync"],
    is_live: true,
  },
  {
    title: "AI Code Remix Showdown",
    description:
      "An AI model generated deliberately broken TypeScript code with hidden edge-case logic traps. Find the flaw and pitch a bulletproof fix.",
    glitch_scenario:
      "An AI coding agent generated an automated prompt token counter function for an LLM chat interface. However, when users input multi-byte unicode characters (emojis, CJK text) or null values, the function throws TypeError: Cannot read properties of undefined or miscalculates token billing limits.",
    hosted_by: "AI Overlords",
    skills: ["TypeScript", "AI Code Review", "Edge Cases"],
    is_live: true,
  },
  {
    title: "Cyberpunk UI Glassmorphism Glitch",
    description:
      "A high-performance CSS backdrop filter bug is causing visual artifacting and layout shifts across mobile Safari browsers.",
    glitch_scenario:
      "A dark-mode glassmorphism navigation bar uses backdrop-filter: blur(16px) over a dynamic canvas particle grid. On mobile Safari and iOS Chrome, scrolling causes severe visual artifacting, flickering black rectangles, and heavy frame drops.",
    hosted_by: "Frontend Guild",
    skills: ["CSS Grid", "Backdrop Filter", "GPU Acceleration"],
    is_live: true,
  },
  {
    title: "The 100-Line Memory Leak Blitz",
    description:
      "Track down an uncleaned event listener causing browser tab memory bloat in a virtualized infinite scrolling list component.",
    glitch_scenario:
      "A web application dashboard features a live WebSocket price ticker component. After switching between navigation tabs 10+ times, the browser tab consumes over 2.5 GB of RAM and crashes with Out of Memory.",
    hosted_by: "Performance Lab",
    skills: ["Memory Profiling", "DOM Cleanup", "React Hooks"],
    is_live: true,
  },
  {
    title: "State Loop Nightmare",
    description:
      "A tricky recursive useEffect hook is triggering 1,000+ unnecessary component re-renders per second. Fix the dependency array.",
    glitch_scenario:
      "A user settings modal fetches user notification preferences. As soon as the modal opens, the CPU fan spins up to 100% and the browser console spams Maximum update depth exceeded.",
    hosted_by: "React Architects",
    skills: ["React Hooks", "useEffect", "Re-render Tuning"],
    is_live: true,
  },
  {
    title: "Algorithm Velocity Arena",
    description:
      "Optimize an un-indexed O(N²) array lookup algorithm down to O(N log N) time complexity under strict 2-minute twist card rules.",
    glitch_scenario:
      "A real-time gaming leaderboard calculates user rank by executing nested .filter() loops across 100,000 active player objects on every mousemove event. The UI stutters badly with 400ms frame delays.",
    hosted_by: "Algo Masters",
    skills: ["Algorithms", "Time Complexity", "Optimization"],
    is_live: true,
  },
];

async function seed() {
  const { data: existing, error: fetchErr } = await client
    .from("arena_events")
    .select("title");
  if (fetchErr) {
    console.error("Fetch error:", fetchErr);
    return;
  }
  const existingTitles = new Set((existing || []).map((e) => e.title));
  const toInsert = featured.filter((f) => !existingTitles.has(f.title));

  if (toInsert.length > 0) {
    const { error: insErr } = await client.from("arena_events").insert(toInsert);
    if (insErr) console.error("Insert error:", insErr);
    else console.log("INSERTED ARENA EVENTS:", toInsert.length);
  } else {
    console.log("ALL ARENA EVENTS ALREADY EXIST IN DB.");
  }

  const { count: finalArenaCount } = await client
    .from("arena_events")
    .select("*", { count: "exact", head: true });
  const { count: finalChallengesCount } = await client
    .from("challenges")
    .select("*", { count: "exact", head: true });
  console.log(
    "FINAL DB COUNTS -> challenges:",
    finalChallengesCount,
    "| arena_events:",
    finalArenaCount,
    "| TOTAL:",
    finalChallengesCount + finalArenaCount
  );
}

seed();
