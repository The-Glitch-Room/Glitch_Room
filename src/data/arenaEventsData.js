// ── Featured Arena Challenges Dataset ───────────────────────────────────────
export const FEATURED_ARENA_EVENTS = [
  {
    id: "featured-1",
    title: "Quantum Bug Hunters 2026",
    description:
      "Inspect a complex asynchronous React state race condition where data updates out-of-order under heavy network latency.",
    glitch_scenario:
      "A high-traffic e-commerce checkout platform uses an asynchronous state handler to sync user cart quantity updates. Under heavy network latency, rapid clicks on quantity buttons trigger out-of-order state updates. Users end up paying for items that were removed from their cart or get charged incorrect totals.\n\n```javascript\n// CartManager.jsx\nconst [cart, setCart] = useState([]);\n\nconst updateQuantity = async (itemId, delta) => {\n  const res = await api.post('/cart/update', { itemId, delta });\n  // ❌ Bug: res returns stale snapshot if previous request finishes last\n  setCart(res.data.cart);\n};\n```\n\nIdentify how to prevent race conditions and ensure transactional cart consistency.",
    hosted_by: "Glitch Room Core Team",
    skills: ["React 19", "Async/Await", "State Sync"],
    reward: "100 gBits",
    reward_xp: 100,
    difficulty: "Hard",
    difficultyColor: "#ef4444",
    participants: 142,
    is_live: true,
  },
  {
    id: "featured-2",
    title: "AI Code Remix Showdown",
    description:
      "An AI model generated deliberately broken TypeScript code with hidden edge-case logic traps. Find the flaw and pitch a bulletproof fix.",
    glitch_scenario:
      "An AI coding agent generated an automated prompt token counter function for an LLM chat interface. However, when users input multi-byte unicode characters (emojis, CJK text) or null values, the function throws TypeError: Cannot read properties of undefined or miscalculates token billing limits.\n\n```typescript\nfunction calculatePromptCost(prompt: string, modelRate: number): number {\n  // ❌ Bug: Fails on null/undefined, and .length breaks on multi-byte unicode emojis\n  const tokenCount = Math.ceil(prompt.length / 4);\n  return tokenCount * modelRate;\n}\n```\n\nDiagnose the input validation bug and rewrite the function to handle unicode grapheme clusters and invalid inputs safely.",
    hosted_by: "AI Overlords",
    skills: ["TypeScript", "AI Code Review", "Edge Cases"],
    reward: "90 gBits",
    reward_xp: 90,
    difficulty: "Medium",
    difficultyColor: "#f59e0b",
    participants: 98,
    is_live: true,
  },
  {
    id: "featured-3",
    title: "Cyberpunk UI Glassmorphism Glitch",
    description:
      "A high-performance CSS backdrop filter bug is causing visual artifacting and layout shifts across mobile Safari browsers.",
    glitch_scenario:
      "A dark-mode glassmorphism navigation bar uses backdrop-filter: blur(16px) over a dynamic canvas particle grid. On mobile Safari and iOS Chrome, scrolling causes severe visual artifacting, flickering black rectangles, and heavy frame drops.\n\n```css\n.glass-navbar {\n  position: fixed;\n  top: 0;\n  backdrop-filter: blur(16px);\n  /* ❌ Bug: Missing Webkit prefix & GPU acceleration layer creation */\n  background: rgba(13, 13, 20, 0.7);\n}\n```\n\nIdentify why mobile WebKit engine drops hardware acceleration and specify the exact CSS layer promotion fix.",
    hosted_by: "Frontend Guild",
    skills: ["CSS Grid", "Backdrop Filter", "GPU Acceleration"],
    reward: "85 gBits",
    reward_xp: 85,
    difficulty: "Medium",
    difficultyColor: "#f59e0b",
    participants: 210,
    is_live: true,
  },
  {
    id: "featured-4",
    title: "The 100-Line Memory Leak Blitz",
    description:
      "Track down an uncleaned event listener causing browser tab memory bloat in a virtualized infinite scrolling list component.",
    glitch_scenario:
      "A web application dashboard features a live WebSocket price ticker component. After switching between navigation tabs 10+ times, the browser tab consumes over 2.5 GB of RAM and crashes with Out of Memory.\n\n```javascript\nuseEffect(() => {\n  const socket = connectWebSocket();\n  socket.on('ticker_update', (data) => {\n    setPrices((prev) => ({ ...prev, [data.symbol]: data.price }));\n  });\n  // ❌ Bug: Missing cleanup function! Every re-render attaches a duplicate socket listener\n}, [socket]);\n```\n\nSpot the uncleaned event listener leak and describe how to structure proper hook cleanup.",
    hosted_by: "Performance Lab",
    skills: ["Memory Profiling", "DOM Cleanup", "React Hooks"],
    reward: "95 gBits",
    reward_xp: 95,
    difficulty: "Hard",
    difficultyColor: "#ef4444",
    participants: 175,
    is_live: true,
  },
  {
    id: "featured-5",
    title: "State Loop Nightmare",
    description:
      "A tricky recursive useEffect hook is triggering 1,000+ unnecessary component re-renders per second. Fix the dependency array.",
    glitch_scenario:
      "A user settings modal fetches user notification preferences. As soon as the modal opens, the CPU fan spins up to 100% and the browser console spams Maximum update depth exceeded.\n\n```javascript\nconst [settings, setSettings] = useState({ theme: 'dark', notifications: true });\n\nuseEffect(() => {\n  fetchSettings().then((data) => {\n    setSettings(data); // ❌ Bug: Triggering state update that mutates object reference in dependency array\n  });\n}, [settings]);\n```\n\nExplain why settings in the dependency array causes an infinite loop and provide the correct dependency array setup.",
    hosted_by: "React Architects",
    skills: ["React Hooks", "useEffect", "Re-render Tuning"],
    reward: "75 gBits",
    reward_xp: 75,
    difficulty: "Easy",
    difficultyColor: "#22c55e",
    participants: 312,
    is_live: true,
  },
  {
    id: "featured-6",
    title: "Algorithm Velocity Arena",
    description:
      "Optimize an un-indexed O(N²) array lookup algorithm down to O(N log N) time complexity under strict 2-minute twist card rules.",
    glitch_scenario:
      "A real-time gaming leaderboard calculates user rank by executing nested .filter() loops across 100,000 active player objects on every mousemove event. The UI stutters badly with 400ms frame delays.\n\n```javascript\n// ❌ Bug: O(N²) nested lookup inside render loop\nconst getUserRank = (userId, allPlayers) => {\n  return allPlayers.filter(p => p.score > allPlayers.find(x => x.id === userId).score).length + 1;\n};\n```\n\nRedesign the rank lookup algorithm using pre-sorted binary search or Hash Maps to achieve O(1) or O(log N) lookup time.",
    hosted_by: "Algo Masters",
    skills: ["Algorithms", "Time Complexity", "Optimization"],
    reward: "100 gBits",
    reward_xp: 100,
    difficulty: "Hard",
    difficultyColor: "#ef4444",
    participants: 88,
    is_live: true,
  },
];

export const getFeaturedArenaEvent = (id) => {
  if (!id) return null;
  return FEATURED_ARENA_EVENTS.find((e) => e.id === id) || null;
};
