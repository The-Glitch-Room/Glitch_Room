// src/data/debuggingHandbookData.js
// Glitch Room Debugging Handbook — Phase 1: Understanding Errors & Debugging

export const HANDBOOK_PHASE_1 = {
  phase: 1,
  title: "Phase 1: Understanding Errors & Debugging",
  tagline: "The Foundational Field Guide to How Software Breaks and How to Think When It Does",
  description:
    "Before diving into framework-specific glitches, learn how to read errors, trace execution, use your browser toolkit, and hunt down root causes with a calm, systematic mindset.",
  topics: [
    {
      id: "what-is-a-bug",
      number: "01",
      title: "What Is a Bug?",
      category: "Foundations",
      readTime: "3 min read",
      summary: "Understand what bugs really are, why computers do exactly what you say instead of what you mean, and why code can run without errors and still be broken.",
      whatIsIt:
        "A bug is an unintentional flaw, mistake, or gap in computer software that causes it to produce an incorrect, unexpected, or unintended result. The term is famously linked to 1947 when computer pioneer Grace Hopper's team found an actual moth trapped between relays of the Harvard Mark II computer. In modern programming, however, bugs rarely come from insects—they come from human assumptions. Computers have no intuition: they execute instructions with mechanical precision. If you give them the wrong recipe, they will bake the wrong cake without hesitation.",
      whatDoesItLookLike: {
        type: "code",
        language: "javascript",
        title: "A silent logic bug — no error thrown!",
        code: `function calculateCartTotal(price, discountPercent) {
  // Developer intended: price - (price * (discountPercent / 100))
  // What was actually typed:
  return price - discountPercent;
}

// Expected: 20% off $100 should be $80
const total = calculateCartTotal(100, 20);
console.log(total); // Output: 80 (Wait, it looks right for 100 and 20!)

// But with a different price:
const total2 = calculateCartTotal(50, 20);
console.log(total2); // Output: 30! (20% off $50 is $40, but customer paid $30!)`,
        note: "Notice that JavaScript executed every single line without throwing any error or warning. The program ran successfully, yet lost money on every transaction.",
      },
      whyDoesItHappen: [
        "Unchecked assumptions: Assuming input will always be positive, non-empty, or formatted a certain way.",
        "Off-by-one calculations: Looping one step too far or stopping one item too early (e.g. `i <= arr.length`).",
        "Type coercion surprises: Adding numbers that are stored as strings (e.g. `100 + '10' === '10010'`).",
        "Edge case blind spots: Forgetting how the logic behaves when data is zero, null, empty, or timed out.",
        "Stale references: Modifying shared state in one part of your app that silently alters another part."
      ],
      howToInvestigate: [
        "Write down the Expected Behavior in plain English (e.g., 'Discount should be a percentage of the base price').",
        "Write down the Actual Behavior observed (e.g., 'Discount is subtracting raw dollars regardless of percentage').",
        "Test multiple input boundaries (don't just test 100, test 0, 50, and 250).",
        "Never assume code is working just because the terminal shows 0 errors."
      ],
      example: {
        title: "Expected vs. Actual Behavior",
        scenario: "A video streaming player auto-pause feature.",
        expected: "When the user switches tabs, video should pause. When returning, video remains paused until user clicks Play.",
        actual: "Video pauses on tab switch, but immediately unpauses and blasts audio the moment user switches back.",
        rootCause: "The tab visibility listener blindly toggled playback state instead of checking whether the user was playing or paused before leaving."
      },
      keyTakeaway:
        "A program can compile, run without throwing a single error, and pass all initial checks—and still be completely broken. Never confuse 'no errors thrown' with 'correct behavior.'",
      tryItYourself: {
        prompt: "Review this function: `function isEligible(age) { return age > 18; }`. The product spec says 'Users 18 and older are allowed to enter.' Does this code have a bug?",
        hint: "What happens when someone enters their age as exactly 18?",
        answer: "Yes, it has a bug! If age is 18, `18 > 18` evaluates to false, locking out an eligible 18-year-old user. The correct logic should use the greater-than-or-equal operator: `age >= 18`."
      }
    },

    {
      id: "what-is-an-error",
      number: "02",
      title: "What Is an Error?",
      category: "Foundations",
      readTime: "3 min read",
      summary: "Learn what an error is, why runtimes scream at you, and why errors are actually your most helpful allies in writing stable software.",
      whatIsIt:
        "An error is an explicit condition or signal raised by a compiler, interpreter, or runtime environment when it encounters an invalid operation, broken syntax, or impossible instruction. When you see a big red error message in your terminal or browser console, it is easy to feel frustrated or anxious. But errors are not a penalty—they are a safety mechanism. If the computer did not stop when asked to read memory that does not exist or divide by something undefined, it would silently corrupt your data, leak security secrets, or crash your operating system.",
      whatDoesItLookLike: {
        type: "terminal",
        language: "text",
        title: "Standard JavaScript Runtime Error",
        code: `Uncaught TypeError: Cannot read properties of undefined (reading 'name')
    at renderUserProfile (userCard.js:14:26)
    at loadDashboard (dashboard.js:42:5)
    at async initApp (index.js:8:3)`,
        note: "The runtime halted execution and printed this error because it cannot read a property from a nonexistent variable."
      },
      whyDoesItHappen: [
        "Violating language syntax rules (e.g. missing curly braces, illegal keywords).",
        "Attempting illegal operations on data types (e.g. calling a number like a function: `42()`).",
        "Accessing properties of `null` or `undefined`.",
        "Exceeding physical system limits (e.g. infinite recursion causing stack overflow, running out of memory).",
        "Unfulfilled asynchronous operations (e.g. network requests failing or parsing invalid JSON)."
      ],
      howToInvestigate: [
        "Take a breath and resist the reflex to close or clear the console.",
        "Read the error name: Is it a `TypeError`, `ReferenceError`, or `SyntaxError`?",
        "Read the explanation string: It tells you the exact operation that the engine refused to perform.",
        "Look at the file and line number: It tells you the exact line the engine was executing when it crashed."
      ],
      example: {
        title: "A Helpful Guardrail",
        scenario: "You accidentally typed `user.naem` instead of `user.name` in a typed language or accessed a non-existent variable `naem` in JavaScript.",
        expected: "The computer reads the user's name.",
        actual: "ReferenceError: naem is not defined.",
        rootCause: "The runtime prevents execution because referencing an unallocated variable is dangerous."
      },
      keyTakeaway:
        "Errors are not your enemy. An error is the engine's way of preventing silent data destruction and pointing you directly to the spot where execution could not safely proceed.",
      tryItYourself: {
        prompt: "Why is a loud runtime error often preferable to a silent logic bug?",
        hint: "Think about how long it takes to discover a bug that fails silently versus an error that alerts you immediately.",
        answer: "A loud error immediately alerts you during development, stops execution before bad data gets saved to the database, and provides a line number. A silent bug can sit undetected in production for months while corrupting user data."
      }
    },

    {
      id: "bug-vs-error-vs-failure",
      number: "03",
      title: "Bug vs Error vs Failure",
      category: "Anatomy",
      readTime: "4 min read",
      summary: "Understand the three distinct links in the chain of software breakdown: how a developer's mistake becomes an internal error and eventually a public failure.",
      whatIsIt:
        "In casual conversation, developers use 'bug', 'error', and 'failure' interchangeably. But in professional software engineering, they describe three distinct stages of a breakdown:\n\n1. BUG (Defect / Fault): The flaw in the source code written by the developer.\n2. ERROR (Internal State): The invalid internal state or exception triggered when the computer executes that flawed code.\n3. FAILURE (External Impact): The observable breakdown in system service experienced by the end user or external consumer.",
      whatDoesItLookLike: {
        type: "flow",
        title: "The Chain of Software Breakdown",
        diagram: `[ DEVELOPER CODE ]          [ RUNTIME ENGINE ]           [ END USER / UI ]
   ┌─────────────┐             ┌─────────────┐             ┌─────────────┐
   │     BUG     │  ────────>  │    ERROR    │  ────────>  │   FAILURE   │
   │ (The Cause) │             │(The Machine)│             │(The Impact) │
   └─────────────┘             └─────────────┘             └─────────────┘
  Forgot to check             Engine throws a             Screen turns white,
  if API data is              TypeError when              checkout button
  still loading.              reading .items.             freezes forever.`
      },
      whyDoesItHappen: [
        "A developer makes a human mistake (misunderstanding requirements or edge cases) -> this is the BUG.",
        "The software executes that mistake, producing an illegal state or uncaught exception -> this is the ERROR.",
        "The system cannot recover, so the feature ceases to deliver its required service -> this is the FAILURE."
      ],
      howToInvestigate: [
        "Work backwards from the Failure: Start with what the user observed (e.g. 'Modal did not open').",
        "Trace the Error: Check console or server logs to find the exception that occurred during that user action.",
        "Locate the Bug: Inspect the code responsible for that exception and determine what flawed assumption caused it."
      ],
      example: {
        title: "Real-World E-Commerce Scenario",
        scenario: "User tries to checkout with a promo code on black Friday.",
        bug: "Developer forgot to check if the promo code database query returned `null` when a code is expired.",
        error: "Server throws `NullPointerException: Cannot invoke 'getDiscountRate()' on null object` at line 84.",
        failure: "User sees an ugly '500 Server Error' page and their credit card is not processed."
      },
      keyTakeaway:
        "You observe the Failure, you diagnose the Error, but you must fix the Bug. Patching the failure without removing the underlying bug guarantees it will resurface in another form.",
      tryItYourself: {
        prompt: "A user reports: 'The save button was clicked, but my profile picture never updated.' Identify the Bug, the Error, and the Failure.",
        hint: "Which one did the user see? Which one did the server experience? What line of code was flawed?",
        answer: "Failure: Profile picture doesn't update for the user. Error: An HTTP 413 Payload Too Large error returned by the server. Bug: The frontend file upload component failed to validate maximum file size before sending."
      }
    },

    {
      id: "types-of-errors",
      number: "04",
      title: "Types of Errors",
      category: "Categories",
      readTime: "4 min read",
      summary: "Explore the 6 major families of software errors so you instantly recognize which realm of the stack your issue belongs to.",
      whatIsIt:
        "Not all errors are created equal. When something breaks, your first job is to categorize the error. Knowing whether you are dealing with a syntax mistake, an environmental misconfiguration, or an external network failure immediately eliminates 80% of irrelevant troubleshooting steps.",
      whatDoesItLookLike: {
        type: "table",
        title: "The 6 Core Error Categories",
        items: [
          {
            type: "Syntax Errors",
            when: "Parsing / Build Time",
            what: "Grammar violations of the language. Missing brackets, typos in keywords, unclosed quotes.",
            badge: "Parsing"
          },
          {
            type: "Runtime Errors",
            when: "Execution Time",
            what: "Illegal operations while running. Null pointer references, dividing by zero, missing functions.",
            badge: "Execution"
          },
          {
            type: "Logic Errors",
            when: "Runtime (Silent)",
            what: "Code runs perfectly without crashing, but outputs the wrong answer due to flawed algorithms.",
            badge: "Algorithm"
          },
          {
            type: "Compilation Errors",
            when: "Before Running",
            what: "Type mismatches, undeclared types, or symbol errors caught by compilers (TypeScript, C++, Rust).",
            badge: "Compiler"
          },
          {
            type: "Configuration / Env",
            when: "Startup / Load",
            what: "Missing .env variables, incorrect port bindings, incompatible Node.js or Python versions.",
            badge: "System"
          },
          {
            type: "Network / External",
            when: "I/O Execution",
            what: "Third-party API downtime, DNS resolution failure, CORS blocks, dropped Wi-Fi packets.",
            badge: "Network"
          }
        ]
      },
      whyDoesItHappen: [
        "Typing fast without linter feedback (Syntax).",
        "Assuming external API responses are always populated (Runtime).",
        "Using `<` instead of `<=` or inverted boolean conditions (Logic).",
        "Passing a string into a function expecting a number in TypeScript (Compilation).",
        "Deploying code without setting production environment variables (Configuration).",
        "Remote servers timing out or rate-limiting your requests (Network)."
      ],
      howToInvestigate: [
        "First check the clock: Did the error appear before running (Syntax/Compiler), during startup (Config), during user click (Runtime), or after waiting on an API (Network)?",
        "Match the category to the tool: Use linters for syntax, logs for runtime, unit tests for logic, and the Network tab for external APIs."
      ],
      example: {
        title: "Syntax vs. Logic Example",
        codeSnippet: `// 1. SYNTAX ERROR (Will not even run):
// const greeting = "Hello, world; // Unclosed string

// 2. LOGIC ERROR (Runs fine, gives wrong outcome):
function canDrive(age) {
  if (age < 16) {
    return true; // BUG: says kids under 16 CAN drive!
  }
  return false;
}`
      },
      keyTakeaway:
        "Identify the error category first. A network error cannot be fixed by rewriting local algorithms, and a syntax error will never be solved by tweaking your database.",
      tryItYourself: {
        prompt: "Your app works on your computer, but crashes the moment your teammate clones and runs it. What error category is the primary suspect?",
        hint: "The code itself didn't change between machines.",
        answer: "Configuration / Environment Error! Likely missing local environment variables (.env), differing Node/package versions, or uninstalled dependencies (`npm install`)."
      }
    },

    {
      id: "how-to-read-an-error-message",
      number: "05",
      title: "How to Read an Error Message",
      category: "Investigation",
      readTime: "4 min read",
      summary: "Deconstruct realistic error messages into three clear parts so you never panic or copy-paste blindly into search engines again.",
      whatIsIt:
        "When beginners see an error message, their natural instinct is often panic: the red text feels like an incomprehensible wall of doom, so they immediately copy-paste the whole blob into Google or an AI prompt. But modern error messages are structured like a formal dispatch report. Once you know how to read their anatomy, they tell you exactly: (1) WHAT rule was broken, (2) WHY it broke, and (3) WHERE the crash happened.",
      whatDoesItLookLike: {
        type: "annotated",
        title: "Anatomy of an Error Message",
        raw: `TypeError: Cannot read properties of undefined (reading 'avatar')
    at UserAvatar (src/components/UserAvatar.jsx:18:24)
    at renderWithHooks (node_modules/react-dom/cjs/react-dom.js:14985:18)`,
        breakdown: [
          {
            label: "1. The Error Type",
            value: "TypeError",
            explanation: "The category of rule violation. Here, an operation was attempted on a value of the wrong type."
          },
          {
            label: "2. The Description",
            value: "Cannot read properties of undefined (reading 'avatar')",
            explanation: "The exact action that failed: you tried to access `.avatar` on something that evaluated to `undefined`."
          },
          {
            label: "3. The Crime Scene",
            value: "src/components/UserAvatar.jsx:18:24",
            explanation: "Your file (`UserAvatar.jsx`), line 18, character 24. This is your immediate inspection point."
          },
          {
            label: "4. The Framework Noise",
            value: "node_modules/react-dom/...",
            explanation: "Internal library plumbing. 99% of the time, the bug is in YOUR code, not inside React or Node."
          }
        ]
      },
      whyDoesItHappen: [
        "Errors look intimidating because runtimes include deep internal execution layers alongside user code.",
        "Error messages use precise technical terminology ('undefined', 'dereference', 'iterable') that feels unfamiliar at first.",
        "Stack traces list newest calls at the top and oldest at the bottom, which can disorient readers who expect chronological reading."
      ],
      howToInvestigate: [
        "Step 1: Read ONLY the first line completely before looking at anything else.",
        "Step 2: Translate technical terms into plain English ('cannot read properties of undefined' means 'the object before the dot does not exist').",
        "Step 3: Scan the stack trace for the FIRST line pointing to a file in YOUR project (ignore `node_modules`).",
        "Step 4: Open that file at that line number with a calm mind."
      ],
      example: {
        title: "Translating Jargon to Plain English",
        jargon: "ReferenceError: activeUser is not defined",
        translation: "You tried to use a variable named `activeUser`, but JavaScript has never heard of it in this scope. Check for typos or missing imports!"
      },
      keyTakeaway:
        "Never paste an entire error into a search box before reading line 1 yourself. 90% of bugs are solved simply by reading the error name, description, and your file's line number.",
      tryItYourself: {
        prompt: "You see: `SyntaxError: Unexpected token '}' in src/pages/Profile.jsx:32:1`. What should you check first?",
        hint: "What does the error type and description tell you about curly braces?",
        answer: "Check line 32 of `Profile.jsx` (and the lines immediately above it) for an unmatched closing brace `}`, a missing comma, or an unclosed function or object literal."
      }
    },

    {
      id: "understanding-line-numbers",
      number: "06",
      title: "Understanding Line Numbers",
      category: "Investigation",
      readTime: "3 min read",
      summary: "Understand what line numbers tell you, why the crash site is rarely the crime scene, and how to trace backward through execution.",
      whatIsIt:
        "Every runtime error gives you a line number. But here is the most important lesson in debugging: **the line where the error exploded is not necessarily where the bug was written.** The line number is merely the place where the computer finally ran out of options and crashed. The actual root cause was often planted 20 lines earlier, or passed in from an entirely different file.",
      whatDoesItLookLike: {
        type: "code",
        language: "javascript",
        title: "The Crime Scene vs. The Origin",
        code: `// Line 4: The ORIGIN of the bug (failed to supply default or fallback)
let currentUser; // undefined!

// Line 12: Business logic proceeds normally
function showGreeting() {
  console.log("Preparing dashboard...");
}

// Line 25: THE CRASH SITE (The runtime throws here!)
function renderHeader() {
  // ERROR throws here on line 27:
  // TypeError: Cannot read properties of undefined (reading 'name')
  document.getElementById("title").innerText = "Welcome, " + currentUser.name;
}`,
        note: "Line 27 crashed, but Line 27 is innocent. The bug is that `currentUser` was left uninitialized at line 4 or not awaited from an API."
      },
      whyDoesItHappen: [
        "Values pass through multiple variables, functions, and files before being evaluated.",
        "Asynchronous operations (fetching from database) finish *after* downstream code tries to read them.",
        "Off-by-one errors trigger crashes on loop iterations long after the loop started."
      ],
      howToInvestigate: [
        "1. Open the file at the exact line number given in the error.",
        "2. Identify the variable or property that caused the problem on that line.",
        "3. Ask the detective question: 'Where was this variable created, modified, or passed in?'",
        "4. Walk backwards through the code until you find where its value deviated from expectations."
      ],
      example: {
        title: "Tracing the Null Variable",
        scenario: "Line 60 crashes: `items.length` throws `Cannot read properties of null`.",
        investigation: "Look at Line 59, Line 40, Line 15. At Line 15, `const items = response.data.items;` returned `null` because the backend API returned `{ items: null }` instead of `{ items: [] }` when a user has no orders."
      },
      keyTakeaway:
        "The line number in an error message is the crash site, not the crime scene. Always inspect the line, identify the culprit variable, and trace its history backwards.",
      tryItYourself: {
        prompt: "If line 88 says `items[0].toUpperCase()` crashed because `items[0]` is undefined, what line should you fix?",
        hint: "Is line 88 wrong to want to uppercase an item, or is the array empty?",
        answer: "Check where `items` was populated! Either handle the empty-array case before line 88 (e.g. `if (items.length === 0) return;`) or investigate why whatever populated `items` didn't include any elements."
      }
    },

    {
      id: "understanding-stack-traces",
      number: "07",
      title: "Understanding Stack Traces",
      category: "Investigation",
      readTime: "4 min read",
      summary: "Demystify the call stack breadcrumb trail and learn how to read it from top to bottom like a detective following footprints.",
      whatIsIt:
        "When a program runs, functions call other functions. The computer tracks this in a data structure called the **Call Stack** (like a stack of plates—each new function call is placed on top, and removed when it returns). When an unhandled error occurs, the runtime captures a snapshot of this entire stack. This snapshot is your **Stack Trace**. It is literally a GPS breadcrumb trail showing the exact journey your code took right up to the moment of impact.",
      whatDoesItLookLike: {
        type: "stacktrace",
        title: "Call Stack Execution Journey",
        flow: [
          { step: "1. User Clicks 'Pay'", func: "onCheckoutClick()", file: "Checkout.jsx:12", isSource: true },
          { step: "2. Calculates Subtotal", func: "processOrder()", file: "orderService.js:45", isSource: false },
          { step: "3. Formats Currency", func: "formatCurrency()", file: "currencyHelper.js:8", isSource: false },
          { step: "💥 CRASH!", func: "rate.toFixed()", file: "currencyHelper.js:9", isSource: false, isError: true }
        ],
        rawText: `Error: rate is not a number
    at formatCurrency (src/utils/currencyHelper.js:9:15)      <-- [TOP: CRASH SITE]
    at processOrder (src/services/orderService.js:45:12)     <-- [CALLER]
    at onCheckoutClick (src/components/Checkout.jsx:12:5)    <-- [ORIGINATOR]
    at HTMLButtonElement.dispatch (node_modules/...)          <-- [FRAMEWORK NOISE]`
      },
      whyDoesItHappen: [
        "A helper function deep in a utility file crashes because it received bad data from an upstream caller.",
        "Without a stack trace, you would only know that `formatCurrency` failed, with no idea who called it or which user action triggered it."
      ],
      howToInvestigate: [
        "1. Read from TOP to BOTTOM.",
        "2. The top line is the exact function and line that threw the exception.",
        "3. The line immediately below it is the function that called it.",
        "4. Filter out third-party libraries (anything in `node_modules` or vendor folders).",
        "5. Identify the highest line in the trace that is YOUR code. That is almost always where you need to begin."
      ],
      example: {
        title: "Reading Through the Noise",
        traceExplanation: "In a 20-line stack trace, 16 lines might belong to React or browser event handlers. Don't read all 20 lines! Look exclusively for lines that mention your project files like `src/...`."
      },
      keyTakeaway:
        "A stack trace is not a puzzle; it's a map. The top is where the bomb exploded, and the lines below trace the fuse back to the person who lit it.",
      tryItYourself: {
        prompt: "If line 1 of a stack trace is inside `node_modules/axios/lib/core.js`, does that mean there is a bug in Axios?",
        hint: "How likely is it that a library used by millions of developers has a fundamental bug compared to your code passing bad options?",
        answer: "Almost certainly no! It means your code passed invalid parameters (like an undefined URL or bad headers) into Axios. Look down the stack trace for the first line from your own code to see what request you attempted to send."
      }
    },

    {
      id: "the-debugging-workflow",
      number: "08",
      title: "The Debugging Workflow",
      category: "Methodology",
      readTime: "5 min read",
      summary: "Adopt the official Glitch Room 9-step debugging methodology: move from chaotic guessing to a calm, repeatable scientific process.",
      whatIsIt:
        "When code breaks, untrained developers often enter panic mode: they change random lines of code, add or delete exclamation marks, flip boolean flags, refresh frantically, and pray. This is called 'shotgun debugging,' and it rarely works—in fact, it usually introduces three new bugs for every one it masks. Professional debugging is not magic; it is the scientific method applied to software.",
      whatDoesItLookLike: {
        type: "workflow",
        title: "The Glitch Room 9-Step Debugging Workflow",
        steps: [
          { name: "1. STOP", desc: "Hands off the keyboard. Stop typing random changes. Take a breath." },
          { name: "2. READ", desc: "Read the error message, type, and line number completely." },
          { name: "3. REPRODUCE", desc: "Find the exact steps to trigger the bug reliably every time." },
          { name: "4. ISOLATE", desc: "Narrow the problem down to the smallest possible function, component, or file." },
          { name: "5. INSPECT", desc: "Examine the actual runtime values of variables right before the failure." },
          { name: "6. FORM HYPOTHESIS", desc: "State your theory: 'I think X is undefined because Y did not resolve.'" },
          { name: "7. TEST", desc: "Perform a targeted check or log to prove or disprove your hypothesis." },
          { name: "8. FIX", desc: "Apply the minimal, cleanest code change that directly solves the root cause." },
          { name: "9. VERIFY", desc: "Test the fix, test edge cases, and ensure you didn't break surrounding features." }
        ]
      },
      whyDoesItHappen: [
        "Developers skip straight from 'I see a bug' to 'Let me edit code' without understanding why it broke.",
        "Without reproducing the bug consistently, it is impossible to verify whether a change actually solved it."
      ],
      howToInvestigate: [
        "Treat yourself like a software detective. A detective doesn't arrest a random bystander; they gather physical evidence.",
        "Never commit a fix if you cannot explain in one clear sentence *why* the old code failed and *why* the new code succeeds."
      ],
      example: {
        title: "The Workflow in Action",
        scenario: "A user search filter returns 0 results when searching for 'React'.",
        stepsTaken: [
          "Reproduce: Type 'React' into search -> 0 results appear.",
          "Inspect: Log the search term and the list items. Discover search term is 'React' (uppercase R) while list items have 'react' (lowercase).",
          "Hypothesis: The filter uses strict equality `===` instead of case-insensitive comparison.",
          "Fix: Update comparison to `.toLowerCase().includes(term.toLowerCase())`.",
          "Verify: Search 'react', 'React', 'REACT', and an empty string. All pass."
        ]
      },
      keyTakeaway:
        "Debugging is a science, not a lottery. Stop guessing. Follow the 9 steps: STOP, READ, REPRODUCE, ISOLATE, INSPECT, HYPOTHESIZE, TEST, FIX, and VERIFY.",
      tryItYourself: {
        prompt: "Why is Step 3 (Reproduce) considered non-negotiable by senior engineers?",
        hint: "What happens if a bug only appears 'sometimes' and you make a code change?",
        answer: "If you cannot reliably reproduce a bug, you cannot know if your code change fixed it or if you just got lucky on that specific refresh. Reproducing turns an elusive ghost into a measurable problem."
      }
    },

    {
      id: "your-first-debugging-toolkit",
      number: "09",
      title: "Your First Debugging Toolkit",
      category: "Tools",
      readTime: "4 min read",
      summary: "Meet the essential instruments available inside every browser and editor that turn invisible execution into visible reality.",
      whatIsIt:
        "You do not need expensive commercial software or complex enterprise telemetry to debug software effectively. Modern web browsers and editors come built-in with world-class developer tools that allow you to freeze time, inspect memory, monitor network traffic, and watch values change in real time.",
      whatDoesItLookLike: {
        type: "tools",
        title: "Essential Developer Toolkit",
        tools: [
          {
            name: "Browser Console",
            icon: "Terminal",
            role: "The application's loudspeaker",
            desc: "Displays uncaught errors, warnings, and outputs from `console.log()`. Press F12 or Right Click -> Inspect -> Console."
          },
          {
            name: "console.log() / console.table()",
            icon: "Code",
            role: "The flashlight",
            desc: "Prints variable states and checkpoints at specific execution points. Tip: `console.table(users)` outputs clean tabular data!"
          },
          {
            name: "Breakpoints (debugger)",
            icon: "Pause",
            role: "The pause button for reality",
            desc: "Pauses JavaScript execution in the browser at an exact line so you can inspect every in-scope variable live."
          },
          {
            name: "Sources / Debugger Tab",
            icon: "FileCode",
            role: "The mission control",
            desc: "View your original source files inside the browser, set conditional breakpoints, and step over/into code line-by-line."
          },
          {
            name: "Network Tab",
            icon: "Activity",
            role: "The border control",
            desc: "Monitors all HTTP requests, responses, headers, payload bodies, and timing. Essential for checking API calls."
          },
          {
            name: "Elements / DOM Inspector",
            icon: "Layers",
            role: "The visual anatomy",
            desc: "Inspect live HTML elements, test CSS styles interactively, and check computed layout dimensions."
          }
        ]
      },
      whyDoesItHappen: [
        "Code happens in fractions of a millisecond. Without tools to slow down or visualize state, you are debugging in the dark."
      ],
      howToInvestigate: [
        "Use `console.log()` for quick sanity checks.",
        "Switch to the `debugger;` statement or browser breakpoints when dealing with complex loops or async race conditions.",
        "Always open the Network tab first whenever an issue involves fetching data from a server or submitting a form."
      ],
      example: {
        title: "Using the debugger keyword",
        codeSnippet: `function processPayment(user, cart) {
  // Adding this keyword tells the browser to freeze execution here:
  debugger;

  const total = calculateTotal(cart);
  return chargeCard(user.paymentMethod, total);
}`,
        note: "If DevTools is open when this runs, the browser pauses execution right on `debugger;`. You can hover over `user` and `cart` to see their exact values!"
      },
      keyTakeaway:
        "Mastering just three tools—the Console, the Network tab, and the debugger breakpoint—gives you the power to diagnose over 95% of frontend and full-stack issues.",
      tryItYourself: {
        prompt: "A login form says 'Invalid credentials', but you are 100% sure you typed the right password. Which DevTools tab should you open first?",
        hint: "Where can you see what was actually sent to the backend authentication server?",
        answer: "The Network Tab! Filter by 'Fetch/XHR', look for the login request, and inspect the Request Payload and Response JSON to see what status code and message the server actually returned."
      }
    },

    {
      id: "finding-the-root-cause",
      number: "10",
      title: "Finding the Root Cause",
      category: "Mindset",
      readTime: "4 min read",
      summary: "Master the distinction between symptoms and root causes, and learn the golden engineering rule: fix the cause, not just the symptom.",
      whatIsIt:
        "A common trap for junior developers is 'whack-a-mole' debugging: an error occurs, so they add a quick patch right where it crashed without understanding why. For example, if `user.name` crashes because `user` is undefined, they immediately write `user?.name || ''`. The error goes away, but now the user interface displays a blank greeting, notifications fail to send, and the database receives anonymous records. They treated the symptom, but the disease remains alive.",
      whatDoesItLookLike: {
        type: "comparison",
        title: "Symptom vs. Root Cause",
        symptom: {
          title: "Symptom (Surface Effect)",
          code: `// Quick superficial bandage:
if (!user) return null; // Error disappears, but why was user null?!`,
          description: "Hides the error message, but leaves the user staring at an empty white screen or broken flow."
        },
        rootCause: {
          title: "Root Cause (Underlying Origin)",
          code: `// The real fix at the origin:
const user = await fetchUserProfile(userId); // Forgot to 'await' the promise!`,
          description: "Fixing the unawaited promise populates the user object properly, making all downstream components work seamlessly."
        }
      },
      whyDoesItHappen: [
        "Pressure to make red error text disappear quickly.",
        "Stopping investigation as soon as the crash stops occurring.",
        "Failing to ask 'Why was this state invalid in the first place?'"
      ],
      howToInvestigate: [
        "Use the '5 Whys' technique:\n1. Why did the greeting fail? Because `user` is undefined.\n2. Why is `user` undefined? Because the auth listener hasn't finished.\n3. Why hasn't it finished? Because the component mounted before the auth token was verified.\n4. Why did it mount before verification? Because there is no loading gate on the protected route.\n-> ROOT CAUSE: Implement a loading spinner until auth verification resolves."
      ],
      example: {
        title: "The Golden Principle",
        quote: "Fix the cause, not just the symptom.",
        explanation: "When you eliminate the root cause, the symptom disappears automatically along with half a dozen other bugs you didn't even know existed yet."
      },
      keyTakeaway:
        "Congratulations on completing Phase 1 of the Glitch Room Debugging Handbook! Remember the golden rule: never settle for silencing an error. Trace it back, understand the origin, and fix the root cause.",
      tryItYourself: {
        prompt: "A function calculating cart total returns `NaN` (Not a Number). Your teammate suggests: `if (isNaN(total)) total = 0;`. Is this a good fix?",
        hint: "Does setting total to 0 solve why a number calculation broke, or does it give items away for free?",
        answer: "It's a dangerous symptom patch! It would let customers buy cart items for $0! The root cause is likely an item with a missing or undefined price being added to the sum (`50 + undefined === NaN`). Fix the price parsing so every item has a valid numeric price."
      }
    }
  ]
};
