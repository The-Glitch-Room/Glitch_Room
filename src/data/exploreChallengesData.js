// src/data/exploreChallengesData.js

/**
 * Explore Page Dynamic Challenge Engine Data
 * Rules:
 * 1. All gBit rewards MUST be <= 100 gBits.
 * 2. Uses single unified uptime/streak system (glitch_activity & profiles.streak).
 */

export const DAILY_WEEKLY_CHALLENGES = [
  {
    id: "daily-glitch-today",
    title: "Daily Glitch: Unhandled Promise Inversion",
    category: "Daily Challenge",
    type: "daily",
    difficulty: "Medium",
    points: 40, // Capped <= 100
    language: "JavaScript / Node",
    description:
      "A rogue async handler is swallowing API error payloads and causing silent background retries.",
    refreshText: "Refreshes at Midnight UTC",
    rewardText: "+40 gBits + 1 Day Uptime Boost",
    badgeColor: "#FF00C8",
    codeSnippet: `async function fetchUserData(id) {\n  try {\n    const res = await api.get('/users/' + id);\n    return res.data;\n  } catch (err) {\n    // Bug: Swallow error & return empty draft\n    return { id, status: 'UNKNOWN' };\n  }\n}`,
    correctAnswer: "Throw exception or log error explicitly instead of swallowing fallback.",
  },
  {
    id: "weekly-glitch-this-week",
    title: "Weekly Challenge: Memory Leak in Event Bus",
    category: "Weekly Challenge",
    type: "weekly",
    difficulty: "Hard",
    points: 75, // Capped <= 100
    language: "TypeScript",
    description:
      "Global pub/sub listener registration without cleanup is bloating Heap memory during rapid component re-renders.",
    refreshText: "Refreshes Every Monday",
    rewardText: "+75 gBits + Uptime Multiplier",
    badgeColor: "#00F0FF",
    codeSnippet: `useEffect(() => {\n  const sub = eventBus.subscribe('USER_UPDATED', handleUpdate);\n  // Bug: Missing cleanup return function!\n}, []);`,
    correctAnswer: "Return () => sub.unsubscribe() inside useEffect cleanup handler.",
  },
  {
    id: "flash-glitch-48h",
    title: "Flash Glitch: Quantum Race Condition",
    category: "Limited-Time Flash",
    type: "flash",
    difficulty: "Hard",
    points: 90, // Capped <= 100
    language: "React / State",
    description:
      "Stale state closure inside asynchronous loop causes duplicate database transaction writes.",
    refreshText: "Ends in 18 Hours",
    rewardText: "+90 gBits + Rare Flash Badge",
    badgeColor: "#F59E0B",
    codeSnippet: `const [count, setCount] = useState(0);\nconst incrementAsync = () => {\n  setTimeout(() => setCount(count + 1), 1000);\n};`,
    correctAnswer: "Use functional state update setCount(prev => prev + 1).",
  },
];

export const LIVE_CHALLENGES = [
  {
    id: "live-ch-1",
    title: "Live Battle: CSS Grid Reflow Overflow",
    category: "Live Challenge",
    difficulty: "Medium",
    points: 60, // Capped <= 100
    language: "CSS / Layout",
    description:
      "Dynamic content container breaks responsive breakpoints under viewport widths under 360px.",
    endsInMinutes: 145, // Ticking countdown
    participants: 128,
    status: "live",
    badgeColor: "#EF4444",
  },
  {
    id: "live-ch-2",
    title: "Live Battle: JWT Signature Timestamp Verification",
    category: "Live Challenge",
    difficulty: "Hard",
    points: 85, // Capped <= 100
    language: "Security / Auth",
    description:
      "Clock drift between token issuer and microservice validator causes premature session terminations.",
    endsInMinutes: 82, // Ticking countdown
    participants: 94,
    status: "live",
    badgeColor: "#EF4444",
  },
];

export const UPCOMING_CHALLENGES = [
  {
    id: "upcoming-ch-1",
    title: "Upcoming: WebAssembly SIMD Matrix Multiplier",
    category: "Upcoming Challenge",
    difficulty: "Hard",
    points: 95, // Capped <= 100
    language: "C++ / Rust / WASM",
    description:
      "Optimize heavy matrix computations using browser SIMD instructions for 40x speedups.",
    startsInMinutes: 210, // Opens in ~3.5 hours
    badgeColor: "#38BDF8",
  },
  {
    id: "upcoming-ch-2",
    title: "Upcoming: Redis Stream Backpressure Tuning",
    category: "Upcoming Challenge",
    difficulty: "Medium",
    points: 70, // Capped <= 100
    language: "Backend / Redis",
    description:
      "Handle high-throughput consumer group lag without dropping messages under network spikes.",
    startsInMinutes: 480, // Opens in 8 hours
    badgeColor: "#38BDF8",
  },
];

export const FEATURED_CHALLENGES = [
  {
    id: "feat-1",
    title: "React Server Components Hydration Mismatch",
    category: "Featured",
    difficulty: "Medium",
    points: 50, // Capped <= 100
    language: "React 19 / Next.js",
    description:
      "Detect non-deterministic date formatting causing server/client DOM hydration mismatches.",
    badge: "Editor's Pick",
    badgeColor: "#A855F7",
    path: "/glitch/g-01",
  },
  {
    id: "feat-2",
    title: "SQL N+1 Query Cascade Optimization",
    category: "Featured",
    difficulty: "Hard",
    points: 80, // Capped <= 100
    language: "PostgreSQL / SQL",
    description:
      "Refactor nested relational queries using JOIN LATERAL to cut response times from 3.2s to 45ms.",
    badge: "High Performance",
    badgeColor: "#10B981",
    path: "/bug-challenges",
  },
  {
    id: "feat-3",
    title: "AI Prompt Inversion Security Bypass",
    category: "Featured",
    difficulty: "Hard",
    points: 85, // Capped <= 100
    language: "AI / GenAI Guardrails",
    description:
      "Harden system prompts against indirect prompt injection and context window leakage.",
    badge: "AI Guardrails",
    badgeColor: "#FF00C8",
    path: "/ai-challenges",
  },
];

export const ARCHIVED_VAULT_CHALLENGES = [
  {
    id: "vault-1",
    title: "Past Battle: WebSocket Heartbeat Deadlock",
    category: "Archived Vault",
    completedBy: 412,
    rewardClaimed: 75,
    date: "August 10, 2026",
    winner: "byte_ninja",
    badgeColor: "#64748B",
  },
  {
    id: "vault-2",
    title: "Past Battle: Docker Multi-Stage Layer Cache Invalidation",
    category: "Archived Vault",
    completedBy: 368,
    rewardClaimed: 60,
    date: "August 04, 2026",
    winner: "cyber_ghost",
    badgeColor: "#64748B",
  },
  {
    id: "vault-3",
    title: "Past Battle: CSS Backdrop Blur GPU Compositing Glitch",
    category: "Archived Vault",
    completedBy: 520,
    rewardClaimed: 50,
    date: "July 28, 2026",
    winner: "glitch_wizard",
    badgeColor: "#64748B",
  },
];
