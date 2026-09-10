// ── Featured Arena Challenges Dataset ───────────────────────────────────────
export const FEATURED_ARENA_EVENTS = [
  {
    id: "featured-1",
    title: "Quantum Bug Hunters 2026",
    description:
      "Inspect a complex asynchronous React state race condition where data updates out-of-order under heavy network latency.",
    glitch_scenario:
      "A high-traffic e-commerce checkout platform uses an asynchronous state handler to sync user cart quantity updates. Under heavy network latency, rapid clicks on quantity buttons trigger out-of-order state updates. Users end up paying for items that were removed from their cart or get charged incorrect totals.\n\n```javascript\n// CartManager.jsx\nconst [cart, setCart] = useState([]);\n\nconst updateQuantity = async (itemId, delta) => {\n  const res = await api.post('/cart/update', { itemId, delta });\n  // ❌ Bug: res returns stale snapshot if previous request finishes last\n  setCart(res.data.cart);\n};\n```\n\nIdentify how to prevent race conditions and ensure transactional cart consistency.",
    hosted_by: "Glitch Room Team",
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
    hosted_by: "Glitch Room Team",
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
    hosted_by: "Glitch Room Team",
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
    hosted_by: "Glitch Room Team",
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
    hosted_by: "Glitch Room Team",
    skills: ["React Hooks", "useEffect", "Re-render Tuning"],
    reward: "75 gBits",
    reward_xp: 75,
    difficulty: "Medium",
    difficultyColor: "#f59e0b",
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
    hosted_by: "Glitch Room Team",
    skills: ["Algorithms", "Time Complexity", "Optimization"],
    reward: "100 gBits",
    reward_xp: 100,
    difficulty: "Hard",
    difficultyColor: "#ef4444",
    participants: 88,
    is_live: true,
  },
  {
    id: "featured-7",
    title: "Distributed Lock Deadlock",
    description:
      "Diagnose a distributed lock race condition in Redis Redlock where concurrent inventory reservations lock up microservice pods.",
    glitch_scenario:
      "During a flash sale event, two microservices attempt to acquire a Redis lock for key `inventory:item_99`. Due to clock drift across nodes and missing lock renewal heartbeats, process A's lock expires while it is still processing. Process B acquires the lock, leading to double-allocation and a deadlock on release.\n\n```javascript\n// InventoryLock.js\nconst lock = await redis.set(`lock:${itemId}`, processId, 'NX', 'PX', 5000);\nif (!lock) throw new Error('Could not acquire lock');\nawait processOrder(itemId);\n// ❌ Bug: Deletes lock without verifying ownership, releasing Process B's newly acquired lock!\nawait redis.del(`lock:${itemId}`);\n```\n\nDetail how to safely release distributed locks using Lua script atomic evaluation and automatic lease extension.",
    hosted_by: "Glitch Room Team",
    skills: ["Redis", "Distributed Locks", "Concurrency"],
    reward: "120 gBits",
    reward_xp: 120,
    difficulty: "Hard",
    difficultyColor: "#ef4444",
    participants: 134,
    is_live: true,
  },
  {
    id: "featured-8",
    title: "Micro-Frontend CSS Scope Bleed",
    description:
      "Fix global style collision where legacy global CSS resets leak into isolated Web Component Shadow DOM containers.",
    glitch_scenario:
      "A banking dashboard embeds a third-party payment widget inside a Web Component. A legacy global `* { box-sizing: content-box !important; }` rule overrides internal Shadow DOM calculations, breaking button alignment and truncating security inputs.\n\n```css\n/* global.css */\n* {\n  box-sizing: content-box !important; /* ❌ Bug: Bleeds into custom elements */\n}\n```\n\nFormulate the strategy using `@layer` CSS cascading rules or shadow root isolation to shield micro-frontend styles.",
    hosted_by: "Glitch Room Team",
    skills: ["Shadow DOM", "Web Components", "CSS Cascade"],
    reward: "85 gBits",
    reward_xp: 85,
    difficulty: "Medium",
    difficultyColor: "#f59e0b",
    participants: 167,
    is_live: true,
  },
  {
    id: "featured-9",
    title: "Token Bucket Rate Limiter Exploit",
    description:
      "Spot a concurrency flaw in an API rate limiter where parallel HTTP requests bypass per-ip request quotas.",
    glitch_scenario:
      "An API gateway implements a Token Bucket algorithm stored in Node.js memory. When an attacker fires 50 simultaneous HTTP requests in parallel using `Promise.all()`, asynchronous read-before-write operations evaluate before bucket tokens decrement, granting 50 requests for 1 token cost.\n\n```javascript\n// rateLimiter.js\nasync function checkRateLimit(ip) {\n  const tokens = await getTokens(ip);\n  if (tokens > 0) {\n    // ❌ Bug: Async delay allows concurrent requests to pass before token is subtracted\n    await saveTokens(ip, tokens - 1);\n    return true;\n  }\n  return false;\n}\n```\n\nExplain how atomic Redis transactions (`INCR`/`DECR` or Lua scripts) enforce strict rate limits under concurrency.",
    hosted_by: "Glitch Room Team",
    skills: ["API Security", "Rate Limiting", "Race Conditions"],
    reward: "110 gBits",
    reward_xp: 110,
    difficulty: "Hard",
    difficultyColor: "#ef4444",
    participants: 149,
    is_live: true,
  },
  {
    id: "featured-10",
    title: "Hydration Mismatch Apocalypse",
    description:
      "Solve a React Next.js SSR hydration crash caused by non-deterministic date formatting and local browser timezone rendering.",
    glitch_scenario:
      "A Next.js server-rendered blog component renders post publication dates using `new Date().toLocaleTimeString()`. On the server (UTC), it produces `02:00:00 AM`, but on the client browser (PST), it renders `06:00:00 PM`, causing React Error #418 Hydration failed.\n\n```jsx\n// PostDate.jsx\nexport default function PostDate({ timestamp }) {\n  // ❌ Bug: Direct client-side date formatting during initial SSR render\n  return <span>{new Date(timestamp).toLocaleTimeString()}</span>;\n}\n```\n\nDescribe the patterns (`useEffect` mounting guards or ISO string suppression) to ensure deterministic hydration.",
    hosted_by: "Glitch Room Team",
    skills: ["Next.js", "SSR Hydration", "React 19"],
    reward: "90 gBits",
    reward_xp: 90,
    difficulty: "Medium",
    difficultyColor: "#f59e0b",
    participants: 280,
    is_live: true,
  },
  {
    id: "featured-11",
    title: "Database N+1 Query Cascade",
    description:
      "Optimize a GraphQL API resolver pipeline that executes 1,000+ SQL database queries for a single user feed request.",
    glitch_scenario:
      "A GraphQL server resolves `posts` and nested `author` records for each post. Querying 50 posts triggers 1 initial query plus 50 separate SQL SELECT queries for authors, causing backend database CPU spikes up to 99% under light load.\n\n```javascript\n// resolvers.js\nPost: {\n  author: async (post) => {\n    // ❌ Bug: N+1 query execution inside loop\n    return await db.query('SELECT * FROM users WHERE id = $1', [post.author_id]);\n  }\n}\n```\n\nDesign a batch loading solution using DataLoader or SQL JOIN aggregation to batch requests into a single query.",
    hosted_by: "Glitch Room Team",
    skills: ["GraphQL", "DataLoader", "SQL Optimization"],
    reward: "115 gBits",
    reward_xp: 115,
    difficulty: "Hard",
    difficultyColor: "#ef4444",
    participants: 162,
    is_live: true,
  },
  {
    id: "featured-12",
    title: "Web Worker Serialization Meltdown",
    description:
      "Troubleshoot a main-thread UI freeze during heavy data processing due to improper ArrayBuffer transfer execution.",
    glitch_scenario:
      "A web audio editor passes 50MB audio buffer chunks to a Web Worker for processing. Instead of using Transferable Objects, data is passed via standard structured cloning, duplicating 50MB in memory on every frame and blocking UI rendering for 300ms.\n\n```javascript\n// main.js\nconst buffer = new Float32Array(12500000);\n// ❌ Bug: Missing transfer list parameter in postMessage\nworker.postMessage({ audioData: buffer.buffer });\n```\n\nSpecify how zero-copy Transferable Objects and SharedArrayBuffer memory transfer work in modern Web Workers.",
    hosted_by: "Glitch Room Team",
    skills: ["Web Workers", "ArrayBuffer", "Performance"],
    reward: "130 gBits",
    reward_xp: 130,
    difficulty: "Hard",
    difficultyColor: "#ef4444",
    participants: 94,
    is_live: true,
  },
  {
    id: "featured-13",
    title: "Infinite Re-Render Context Cascade",
    description:
      "Prevent an application-wide render cascade caused by passing un-memoized object literals in a React Context Provider.",
    glitch_scenario:
      "A global Theme and User Preferences Context passes an inline object value to `<ThemeContext.Provider value={{ theme, user, setTheme }}>`. Every time any state change occurs, every component consuming the context re-renders, dropping FPS from 60 down to 12.\n\n```jsx\n// ThemeProvider.jsx\nexport function ThemeProvider({ children }) {\n  const [theme, setTheme] = useState('dark');\n  const [user, setUser] = useState(null);\n\n  // ❌ Bug: Object reference created inline on every render\n  return <ThemeContext.Provider value={{ theme, user, setTheme }}>{children}</ThemeContext.Provider>;\n}\n```\n\nFormulate the solution using `useMemo` and context splitting to isolate re-render triggers.",
    hosted_by: "Glitch Room Team",
    skills: ["React Context", "useMemo", "Re-render Tuning"],
    reward: "85 gBits",
    reward_xp: 85,
    difficulty: "Medium",
    difficultyColor: "#f59e0b",
    participants: 245,
    is_live: true,
  },
  {
    id: "featured-14",
    title: "JWT Algorithm Confusion Security Breach",
    description:
      "Expose a critical JWT authentication vulnerability where an attacker bypasses signature checks by switching RS256 to HS256.",
    glitch_scenario:
      "An API gateway verifies user JWT access tokens. An attacker modifies the JWT header to `alg: \"HS256\"` and signs the payload using the server's public RSA key as the secret key. The JWT library blindly trusts the header algorithm and validates the forged admin token.\n\n```javascript\n// authMiddleware.js\nfunction verifyToken(token) {\n  const decoded = jwt.decode(token, { complete: true });\n  // ❌ Bug: Uses header algorithm instead of enforcing RS256 explicitly!\n  return jwt.verify(token, publicKey, { algorithms: [decoded.header.alg] });\n}\n```\n\nExplain how algorithm confusion attacks occur and demonstrate secure JWT algorithm whitelisting.",
    hosted_by: "Glitch Room Team",
    skills: ["JWT Security", "Cryptography", "API Auth"],
    reward: "150 gBits",
    reward_xp: 150,
    difficulty: "Expert",
    difficultyColor: "#a855f7",
    participants: 76,
    is_live: true,
  },
  {
    id: "featured-15",
    title: "Virtualized Infinite Scroll Jank",
    description:
      "Fix severe DOM layout thrashing and scroll position jumps in a virtualized 100,000-item feed with dynamic card heights.",
    glitch_scenario:
      "A social feed uses a virtual list to render 100,000 posts. As posts load dynamic user images, measured row heights change after initial render, causing scrollbar jumps, infinite layout recalculations, and blank white screens.\n\n```javascript\n// VirtualFeed.jsx\nconst getItemHeight = (index) => {\n  // ❌ Bug: Returns static estimate for dynamic height cards\n  return 120; \n};\n```\n\nSpecify how ResizeObserver dynamic measurement and scroll position adjustment algorithms prevent layout shifts.",
    hosted_by: "Glitch Room Team",
    skills: ["Virtualization", "DOM ResizeObserver", "Layout Shifts"],
    reward: "105 gBits",
    reward_xp: 105,
    difficulty: "Hard",
    difficultyColor: "#ef4444",
    participants: 188,
    is_live: true,
  },
  {
    id: "featured-16",
    title: "Optimistic UI Rollback Disaster",
    description:
      "Debug an optimistic UI update handler that leaves local app state out of sync when a server network mutation fails.",
    glitch_scenario:
      "A task management app optimistically adds a new task to the UI list before sending an API request. When the API request fails due to a network timeout, the rollback handler fails to restore previous state, resulting in duplicate task entries and corrupted local cache.\n\n```javascript\n// taskStore.js\nconst addTask = async (task) => {\n  setTasks(prev => [...prev, task]);\n  try {\n    await api.post('/tasks', task);\n  } catch (err) {\n    // ❌ Bug: Rollback relies on task identity without unique temporary IDs\n    setTasks(prev => prev.filter(t => t.title !== task.title));\n  }\n};\n```\n\nDesign robust optimistic UI rollback using temporary IDs and immutable transaction snapshots.",
    hosted_by: "Glitch Room Team",
    skills: ["Optimistic UI", "State Reconcile", "Error Recovery"],
    reward: "95 gBits",
    reward_xp: 95,
    difficulty: "Hard",
    difficultyColor: "#ef4444",
    participants: 130,
    is_live: true,
  },
  {
    id: "featured-17",
    title: "WASM Memory Out-of-Bounds Fault",
    description:
      "Identify a WebAssembly buffer overflow condition when passing dynamic string data across the JS-WASM FFI boundary.",
    glitch_scenario:
      "A high-speed cryptography module written in C/C++ compiled to WebAssembly throws `RuntimeError: memory access out of bounds`. The JavaScript host writes a string into WASM linear memory without checking heap growth reallocation, corrupting WASM stack pointers.\n\n```javascript\n// wasmBridge.js\nfunction passStringToWasm(str) {\n  const bytes = new TextEncoder().encode(str);\n  const ptr = wasmModule._malloc(bytes.length);\n  // ❌ Bug: Views WASM memory buffer directly without handling memory.grow reallocation\n  new Uint8Array(wasmModule.HEAPU8.buffer, ptr, bytes.length).set(bytes);\n  return ptr;\n}\n```\n\nExplain how WebAssembly linear memory allocation and buffer view invalidation should be handled safely.",
    hosted_by: "Glitch Room Team",
    skills: ["WebAssembly", "C/C++ Interop", "Memory Safety"],
    reward: "140 gBits",
    reward_xp: 140,
    difficulty: "Expert",
    difficultyColor: "#a855f7",
    participants: 62,
    is_live: true,
  },
  {
    id: "featured-18",
    title: "SSE Connection Pool Exhaustion",
    description:
      "Resolve browser connection hangup caused by hitting max HTTP/1.1 6-connection domain limit with Server-Sent Events.",
    glitch_scenario:
      "A real-time financial trading platform opens an SSE (Server-Sent Events) connection per dashboard widget. After opening 6 widgets in separate tabs, all subsequent HTTP fetches to the domain stall indefinitely.\n\n```javascript\n// widget.js\nconst eventSource = new EventSource('/api/stream/ticker');\n// ❌ Bug: Opens independent HTTP connection per widget without HTTP/2 or SharedWorker pooling\n```\n\nDetail how to multiplex SSE streams through a single SharedWorker connection or HTTP/2 connection pooling.",
    hosted_by: "Glitch Room Team",
    skills: ["WebSockets", "SSE", "SharedWorker"],
    reward: "100 gBits",
    reward_xp: 100,
    difficulty: "Hard",
    difficultyColor: "#ef4444",
    participants: 115,
    is_live: true,
  },
  {
    id: "featured-19",
    title: "Canvas 2D Frame Drop Benchmark",
    description:
      "Optimize a 2D HTML5 Canvas chart rendering 50,000 data points to run smoothly at 60 FPS without main-thread jank.",
    glitch_scenario:
      "A telemetry dashboard draws 50,000 real-time data points onto a 2D Canvas inside `requestAnimationFrame`. Clearing and redrawing the entire canvas on every frame causes 45ms script execution delays, dropping frame rate to 15 FPS.\n\n```javascript\nfunction renderChart(ctx, data) {\n  ctx.clearRect(0, 0, width, height);\n  // ❌ Bug: Synchronous path rendering of 50,000 points on main UI thread\n  data.forEach(pt => {\n    ctx.lineTo(pt.x, pt.y);\n    ctx.stroke();\n  });\n}\n```\n\nDemonstrate how OffscreenCanvas worker rendering and path batching restore 60 FPS performance.",
    hosted_by: "Glitch Room Team",
    skills: ["Canvas 2D", "OffscreenCanvas", "FPS Tuning"],
    reward: "90 gBits",
    reward_xp: 90,
    difficulty: "Medium",
    difficultyColor: "#f59e0b",
    participants: 198,
    is_live: true,
  },
  {
    id: "featured-20",
    title: "Service Worker Cache Poisoning",
    description:
      "Diagnose a Service Worker caching routing loop where stale HTML responses prevent app deployment updates from loading.",
    glitch_scenario:
      "A Progressive Web App (PWA) implements a Cache-First strategy for all GET requests. When a new production release updates `index.html`, users remain stuck on old cached JavaScript assets that point to non-existent chunk hashes.\n\n```javascript\n// sw.js\nself.addEventListener('fetch', (e) => {\n  // ❌ Bug: Cache-first strategy applied to index.html without version invalidation\n  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));\n});\n```\n\nFormulate the correct Network-First strategy for HTML documents and automated cache version cleanup on Service Worker activation.",
    hosted_by: "Glitch Room Team",
    skills: ["Service Worker", "PWA Caching", "Cache Invalidation"],
    reward: "105 gBits",
    reward_xp: 105,
    difficulty: "Hard",
    difficultyColor: "#ef4444",
    participants: 172,
    is_live: true,
  },
  {
    id: "featured-21",
    title: "Distributed Saga Transaction Rollback",
    description:
      "Handle partial failure in an e-commerce microservices Saga orchestration workflow without corrupting database state.",
    glitch_scenario:
      "An order workflow executes 3 microservices sequentially: Payment -> Inventory -> Shipping. When the Shipping service fails, compensating transactions fail to trigger, leaving user credit cards charged without items being shipped or refunded.\n\n```javascript\n// SagaOrchestrator.js\nawait paymentService.charge();\nawait inventoryService.reserve();\n// ❌ Bug: Unhandled exception in step 3 omits compensating rollback step\nawait shippingService.createShipment();\n```\n\nExplain how Saga pattern compensating steps and idempotency keys ensure eventual consistency across microservices.",
    hosted_by: "Glitch Room Team",
    skills: ["Saga Pattern", "Microservices", "System Design"],
    reward: "145 gBits",
    reward_xp: 145,
    difficulty: "Expert",
    difficultyColor: "#a855f7",
    participants: 81,
    is_live: true,
  },
  {
    id: "featured-22",
    title: "IndexedDB Key Collision & Schema Lock",
    description:
      "Fix an IndexedDB schema migration deadlock where multiple browser tabs block database version upgrades.",
    glitch_scenario:
      "An offline web app upgrades its IndexedDB schema from version 2 to 3. If a user has 3 browser tabs open, the `onupgradeneeded` event blocks indefinitely because other open tabs hold active read transactions on old schema version 2.\n\n```javascript\n// db.js\nconst req = indexedDB.open('AppDB', 3);\nreq.onupgradeneeded = (e) => {\n  // ❌ Bug: Missing versionchange listener on existing connections to close old tabs\n  const db = e.target.result;\n  db.createObjectStore('new_store');\n};\n```\n\nSpecify how `onversionchange` handlers and connection closing prevent IndexedDB upgrade deadlocks.",
    hosted_by: "Glitch Room Team",
    skills: ["IndexedDB", "Offline Storage", "Concurrency"],
    reward: "100 gBits",
    reward_xp: 100,
    difficulty: "Hard",
    difficultyColor: "#ef4444",
    participants: 109,
    is_live: true,
  },
  {
    id: "featured-23",
    title: "Debounce vs Throttle Form Data Loss",
    description:
      "Prevent user input data loss on page navigation caused by un-flushed debounced form autosave handlers.",
    glitch_scenario:
      "A rich text editor uses a 2,000ms debounced autosave function. When a user types their final paragraph and immediately clicks 'Save & Close', the unmounted component cancels the pending debounced timer, losing the last paragraph.\n\n```javascript\n// Editor.jsx\nconst autosave = useCallback(debounce((content) => saveApi(content), 2000), []);\n// ❌ Bug: Component unmount cancels debounced timer without flushing pending data\nuseEffect(() => () => autosave.cancel(), []);\n```\n\nFormulate the solution using `debounce.flush()` and `beforeunload` event listeners to guarantee data persistence.",
    hosted_by: "Glitch Room Team",
    skills: ["Debounce/Throttle", "Event Loop", "Form Autosave"],
    reward: "85 gBits",
    reward_xp: 85,
    difficulty: "Medium",
    difficultyColor: "#f59e0b",
    participants: 230,
    is_live: true,
  },
  {
    id: "featured-24",
    title: "Dynamic Module Loading Memory Leak",
    description:
      "Track down a memory leak in a dynamic module loader that retains unreferenced JS modules in global Webpack runtime memory.",
    glitch_scenario:
      "A plugin-based web application dynamically imports plugin modules on demand using `import('./plugins/' + pluginName)`. After opening and closing 50 plugins, the V8 JavaScript engine heap grows continuously because dynamic module registries retain module exports in global scope.\n\n```javascript\n// PluginLoader.js\nasync function loadPlugin(name) {\n  const module = await import(`./plugins/${name}.js`);\n  // ❌ Bug: Stores module reference in global window object registry without cleanup\n  window.loadedPlugins[name] = module;\n}\n```\n\nExplain how WeakRef and proper module lifecycle management prevent memory bloat in dynamic import architectures.",
    hosted_by: "Glitch Room Team",
    skills: ["Dynamic Imports", "Memory Management", "Module Bundling"],
    reward: "110 gBits",
    reward_xp: 110,
    difficulty: "Hard",
    difficultyColor: "#ef4444",
    participants: 124,
    is_live: true,
  },
  {
    id: "featured-25",
    title: "WebRTC ICE Candidate Drop & NAT Traversal",
    description:
      "Troubleshoot a peer-to-peer video streaming connection drop where WebRTC fails to establish TURN relay fallback across strict firewalls.",
    glitch_scenario:
      "A real-time pairing app connects two developers via WebRTC. When one user is behind a strict symmetric NAT corporate firewall, STUN candidates fail to connect, and the peer connection times out because TURN credentials are misconfigured or candidates are gathered asynchronously out of sequence.\n\n```javascript\n// rtc.js\nconst pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });\n// ❌ Bug: Missing TURN server relay fallback configuration for symmetric NAT traversal\npc.onicecandidate = (e) => sendCandidateToPeer(e.candidate);\n```\n\nDetail the WebRTC signaling lifecycle, ICE candidate trickling, and TURN relay setup for zero-drop peer connectivity.",
    hosted_by: "Glitch Room Team",
    skills: ["WebRTC", "Network Security", "STUN/TURN Protocols"],
    reward: "150 gBits",
    reward_xp: 150,
    difficulty: "Expert",
    difficultyColor: "#a855f7",
    participants: 89,
    is_live: true,
  },
];

export const getFeaturedArenaEvent = (id) => {
  if (!id) return null;
  return FEATURED_ARENA_EVENTS.find((e) => e.id === id) || null;
};
