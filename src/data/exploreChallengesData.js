// src/data/exploreChallengesData.js

/**
 * Explore Page Dynamic Challenge Engine Data & Fallback Defaults
 * Rules:
 * 1. Rewards strictly balanced by difficulty:
 *    - Easy: 25 gBits
 *    - Medium: 50 gBits
 *    - Hard: 75 gBits
 *    - Expert: 90 gBits (Capped <= 100)
 * 2. Uses single unified uptime/streak system (glitch_activity & profiles.streak).
 */

export const DAILY_WEEKLY_CHALLENGES = [
  {
    id: "daily-glitch-today",
    title: "Daily Glitch: Unhandled Promise Inversion",
    category: "Daily Challenge",
    type: "explore_daily",
    difficulty: "Medium",
    points: 50,
    language: "JavaScript / Node",
    description:
      "A rogue async handler is swallowing API error payloads and causing silent background retries on failing endpoints.",
    refreshText: "Refreshes at Midnight UTC",
    rewardText: "+50 gBits + 1 Day Uptime Boost",
    badgeColor: "#FF00C8",
    codeSnippet: `async function fetchUserData(id) {\n  try {\n    const res = await api.get('/users/' + id);\n    return res.data;\n  } catch (err) {\n    // Bug: Swallow error & return empty draft\n    return { id, status: 'UNKNOWN' };\n  }\n}`,
    solution: "Throw exception or log error explicitly instead of swallowing fallback.",
  },
  {
    id: "weekly-glitch-this-week",
    title: "Weekly Challenge: Memory Leak in Event Bus",
    category: "Weekly Challenge",
    type: "explore_weekly",
    difficulty: "Hard",
    points: 75,
    language: "TypeScript",
    description:
      "Global pub/sub listener registration without cleanup is bloating Heap memory during rapid component re-renders.",
    refreshText: "Refreshes Every Monday",
    rewardText: "+75 gBits + Uptime Multiplier",
    badgeColor: "#00F0FF",
    codeSnippet: `useEffect(() => {\n  const sub = eventBus.subscribe('USER_UPDATED', handleUpdate);\n  // Bug: Missing cleanup return function!\n}, []);`,
    solution: "Return () => sub.unsubscribe() inside useEffect cleanup handler.",
  },
  {
    id: "flash-glitch-48h",
    title: "Flash Glitch: Quantum Race Condition",
    category: "Limited-Time Flash",
    type: "explore_flash",
    difficulty: "Expert",
    points: 90,
    language: "React / State",
    description:
      "Stale state closure inside asynchronous loop causes duplicate database transaction writes under heavy network concurrency.",
    refreshText: "Ends in 18 Hours",
    rewardText: "+90 gBits + Rare Flash Badge",
    badgeColor: "#F59E0B",
    codeSnippet: `const [count, setCount] = useState(0);\nconst incrementAsync = () => {\n  setTimeout(() => setCount(count + 1), 1000);\n};`,
    solution: "Use functional state update setCount(prev => prev + 1).",
  },
];

export const LIVE_CHALLENGES = [
  {
    id: "live-ch-1",
    title: "Live Battle: CSS Grid Reflow Subpixel Bug",
    category: "Live Challenge",
    type: "explore_live",
    difficulty: "Medium",
    points: 50,
    language: "CSS / Layout",
    description:
      "Subpixel rounding errors on high-DPI retina screens cause grid items to overflow parent container boundaries.",
    endsInMinutes: 145,
    participants: 128,
    status: "live",
    badgeColor: "#EF4444",
    codeSnippet: `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));`,
    solution: "Use minmax(0, 1fr) to allow flex/grid items to shrink below minimum content size.",
  },
  {
    id: "live-ch-2",
    title: "Live Battle: Distributed Consensus Lock Drift",
    category: "Live Challenge",
    type: "explore_live",
    difficulty: "Expert",
    points: 90,
    language: "Redis / Node",
    description:
      "Redis locks expire before long-running batch data pipelines finish execution, leading to duplicate transaction processing.",
    endsInMinutes: 82,
    participants: 94,
    status: "live",
    badgeColor: "#EF4444",
    codeSnippet: `const lock = await redis.set("job_lock", "1", "PX", 5000, "NX");`,
    solution: "Implement Redlock heartbeat renewal daemon or extend TTL dynamically during processing.",
  },
];

export const UPCOMING_CHALLENGES = [
  {
    id: "upcoming-ch-1",
    title: "Upcoming: WebAssembly SIMD Matrix Multiplier",
    category: "Upcoming Challenge",
    type: "explore_upcoming",
    difficulty: "Hard",
    points: 80,
    language: "C++ / Rust / WASM",
    description:
      "High-performance SIMD vector instruction alignment crash on mobile WebAssembly runtime engines.",
    startsInMinutes: 210,
    participants: 210,
    status: "upcoming",
    badgeColor: "#38BDF8",
    codeSnippet: `v128_t a = wasm_v128_load(ptr); // Unaligned memory access fault`,
    solution: "Align memory buffers to 16-byte boundaries using alignas(16) before WASM SIMD loads.",
  },
  {
    id: "upcoming-ch-2",
    title: "Upcoming: GenAI Prompt Injection Guardrail Bypass",
    category: "Upcoming Challenge",
    type: "explore_upcoming",
    difficulty: "Hard",
    points: 75,
    language: "GenAI / TypeScript",
    description:
      "Adversarial system prompt overrides bypass text safety filters in LLM API routing layer.",
    startsInMinutes: 420,
    participants: 175,
    status: "upcoming",
    badgeColor: "#38BDF8",
    codeSnippet: `const fullPrompt = \`System: Follow guidelines.\\nUser: \${req.body.prompt}\`;`,
    solution: "Use structured message objects array format with separate system role and user role properties.",
  },
];

export const FEATURED_CHALLENGES = [
  {
    id: "feat-1",
    title: "Infinite Loop in Custom Hook",
    category: "Featured Pick",
    type: "explore_featured",
    difficulty: "Easy",
    badge: "React 19 / Next.js",
    points: 25,
    language: "React / Custom Hooks",
    description:
      "Object references passed as useEffect dependencies cause infinite re-render loops.",
    badgeColor: "#A855F7",
    path: "/glitches",
    codeSnippet: `useEffect(() => {\n  fetchData(options);\n}, [options]);`,
    solution: "Memoize options with useMemo or list primitive properties (options.id) in dependency array.",
  },
  {
    id: "feat-2",
    title: "PostgreSQL Connection Pool Starvation",
    category: "Featured Pick",
    type: "explore_featured",
    difficulty: "Medium",
    badge: "PostgreSQL / SQL",
    points: 50,
    language: "PostgreSQL / Express",
    description:
      "Unclosed database client connections in HTTP error paths exhaust available connection pool slots.",
    badgeColor: "#00F0FF",
    path: "/bug-challenges",
    codeSnippet: `const client = await pool.connect();\nconst data = await client.query(sql);\nreturn res.json(data);`,
    solution: "Wrap query execution in try...finally block ensuring client.release() is always called.",
  },
  {
    id: "feat-3",
    title: "JWT Expiration Clock Skew Tolerance",
    category: "Featured Pick",
    type: "explore_featured",
    difficulty: "Hard",
    badge: "Security / Auth",
    points: 75,
    language: "Auth / Node.js",
    description:
      "Client-side clock skew causes valid authentication tokens to be prematurely rejected as expired.",
    badgeColor: "#FF00C8",
    path: "/ai-challenges",
    codeSnippet: `if (decoded.exp < Date.now() / 1000) throw new Error("Expired");`,
    solution: "Include a 30-60 second clock skew tolerance window when evaluating token expiration timestamps.",
  },
];

export const ARCHIVED_VAULT_CHALLENGES = [
  {
    id: "vault-1",
    title: "GraphQL N+1 Query Cascade",
    category: "Archived Vault",
    type: "explore_archived",
    difficulty: "Hard",
    points: 75,
    date: "Aug 2026",
    winner: "byte_ninja",
    completedBy: 142,
    rewardClaimed: 75,
  },
  {
    id: "vault-2",
    title: "Hydration Mismatch in SSR",
    category: "Archived Vault",
    type: "explore_archived",
    difficulty: "Medium",
    points: 50,
    date: "Jul 2026",
    winner: "cyber_ghost",
    completedBy: 98,
    rewardClaimed: 50,
  },
  {
    id: "vault-3",
    title: "Docker Image Layer Bloat",
    category: "Archived Vault",
    type: "explore_archived",
    difficulty: "Easy",
    points: 25,
    date: "Jun 2026",
    winner: "algo_queen",
    completedBy: 215,
    rewardClaimed: 25,
  },
];
