# ⚡ The Glitch Room — Complete Platform Documentation & Overview

Welcome to **The Glitch Room** documentation file. This document details everything built in the platform so far, how each system and feature operates, and provides a dedicated space for recording future ideas and roadmap additions.

---

## 🚀 1. Executive Summary & Vision

**The Glitch Room** is a next-generation, interactive cyberpunk developer platform designed for real-world code debugging, AI-evaluated coding challenges, live arena battles, creator/pro rooms, and gamified skill progression.

Developers solve real-world bugs, diagnose complex software anomalies, engage in multi-stage battle events, and earn **gBits** (platform currency) to level up their status from *Newbie Glitcher* to *Master Anomaly*.

---

## 🛠️ 2. Tech Stack & Architecture

- **Frontend Framework**: React 18, Vite 7
- **Styling & UI**: TailwindCSS, Custom Cyberpunk CSS Tokens, Glassmorphism, Custom Scrollbars
- **Motion & Animations**: Framer Motion, Canvas Confetti
- **Backend & Database**: Supabase (PostgreSQL Database, Authentication, Row Level Security, Real-Time Subscriptions)
- **AI Engine**: Supabase Edge Functions (`ai-feedback-edge-function` powered by Generative AI)
- **Deployment**: Netlify Functions / Serverless SPA with custom redirect routing

---

## 💎 3. Core Mechanics & Reward Engine

### 🪙 gBits & Points Ledger
- **Single Source of Truth**: All point transactions write to `glitch_activity`.
- **Database Trigger Automation**: A Postgres database trigger (`trg_sync_points_after_activity_insert`) automatically sums points into `user_points` and syncs `profiles.points` within the same transaction.
- **Leveling Hierarchy**:
  - **Level 0**: Newbie Glitcher (0 – 249 gBits)
  - **Level 1**: Bug Hunter (250 – 499 gBits)
  - **Level 2**: Code Breaker (500 – 999 gBits)
  - **Level 3**: Cyber Phantom (1,000 – 1,999 gBits)
  - **Level 4**: Glitch Architect (2,000 – 4,999 gBits)
  - **Level 5**: Master Anomaly (5,000+ gBits - MAX)

### 🤖 AI Evaluation System
- **Edge Function Integration**: User answers are submitted to `ai-feedback-edge-function` alongside the challenge title, scenario description, buggy code snippet, and reference solution baseline.
- **Strict Scoring**: The AI evaluates the answer on a 0–10 scale based on technical accuracy.
- **Pass Threshold**: A score of **6 or higher** passes the challenge.
- **Points Formula**: `pointsForScore(score, maxPoints)` dynamically scales awarded gBits ($0$ gBits if score $< 6$).
- **Structured Feedback**:
  - `Verdict`: *"Nailed it 🎯"*, *"Correct enough"*, or *"Not quite there yet"*.
  - `Strengths`: What the developer identified correctly.
  - `Gaps`: What root cause or edge case was missed.
  - `Level-Up Upgrade`: Actionable advice to improve code quality.

### ⚡ Uptime Streaks & Daily Fact Claims
- **7-Day Uptime Streak**: Automated check tracking active coding days. Reaching a 7-day milestone grants a **+100 gBits** bonus.
- **Daily Fact Bubble**: Floating interactive widget granting **+10 gBits** once per calendar day.

### 💡 Hint & Solution System
- **Single One-Time Deduction**:
  - **Unlock Hint**: Costs **50 gBits** (-50).
  - **Unlock Reference Solution**: Costs **100 gBits** (-100).
- **Persistence**: Prior unlocks are tracked in `glitch_activity` so users are charged only once per challenge. Subsequent views are free.

---

## 🗺️ 4. Platform Hubs & Feature Pages

### 🔍 1. Explore Hub (`/explore`)
Features 5 distinct sections with real-time countdown timers and dynamic placement:
1. **Daily & Weekly Glitches**: Time-bound active challenges.
2. **Live & Upcoming Code Battles**: Active vs. scheduled challenge battles with live status indicators.
3. **Featured Picks & Editor's Choice**: Hand-selected highlight challenges.
4. **Core Problem Domains**: Gateway cards to the 4 main challenge libraries.
5. **Past Challenges & Vault Archive**: Historical challenges automatically moved upon end date.

#### 🪟 2-Column Challenge Solver Modal
- **Left Column**: Title, Category badge, Problem prompt, Syntax-highlighted code block with 1-click Copy, Diagnosis textarea, and Hint (-50 gBits) / Solution (-100 gBits) accordions.
- **Right Column**: Metadata card (Difficulty, Max gBits reward, Active status), Real-time AI Evaluation feedback card, and Submission controls.

---

### 🧩 2. Core Challenge Libraries
1. **Glitches Challenges (`/glitches` & `/glitch/:id`)**:
   - Focus: Web dev, JavaScript, Python, SQL, C++ bugs.
2. **Debug Mode (`/bug-challenges` & `/fixbug/:id`)**:
   - Focus: Deep stack traces, memory leaks, async concurrency errors.
3. **AI Powered Puzzles (`/ai-challenges` & `/ai-challenge/:id`)**:
   - Focus: GenAI edge cases, prompt injection, model output hallucinations.
4. **Creative Sparks (`/sparks` & `/fix-spark/:id`)**:
   - Focus: System design, UI patterns, architectural trade-offs.

---

### ⚔️ 3. Game Arena & Arena Events (`/game-arena`, `/arena-events`, `/arena/:eventId`)
- **3-Stage Arena Battles**:
  - **Stage 1**: Find the Glitch (Identify root cause).
  - **Stage 2**: Twist Card Modifier (Applies constraints, e.g., *"Explain in under 30 words"* or *"Pitch as investor presentation"*).
  - **Stage 3**: Pitch & Fix Solution.
- **Arena Voting Feed (`/arena-voting`)**: Community voting on submitted battle solutions.
- **Room Multiplayer (`/host-room`, `/join-room`)**: Host and join custom battle rooms with code passcodes.

---

### 🏢 4. Creator & Pro Rooms
- **Creator Rooms (`/creator-rooms` & `/creator-rooms/:id`)**: User-generated custom rooms and challenge packs.
- **Pro Rooms (`/pro-rooms`, `/pro-rooms/create`, `/pro-rooms/:id`)**: Enterprise/Professional rooms for candidate evaluations and team assessments.
  - **Assessment Module (`/pro-rooms/:id/assessment`)**: Timed candidate technical assessment.
  - **Author Dashboard (`/pro-rooms/:id/dashboard`)**: Analytics, candidate submissions, pass/fail rates.

---

### 💬 5. Community Forum (`/community` & `/community/:postId`)
- Community discussion board with post creation, code snippet formatting, upvoting, tag filtering, and comment threads.

---

### 🏆 6. Terminal Wall (`/terminal-wall`)
- Cyberpunk global leaderboard displaying top developers, ranks, gBits, solved counts, and badges.

---

### 🔐 7. Admin Dashboard (`/admin`)
- Accessible only to authorized admin users (`is_admin: true`).
- Clean Back-to-Home top bar.
- **Challenges Manager**: Full CRUD for all challenge types, difficulty settings, gBits rewards, Explore section placement (`daily`, `weekly`, `battle`), start/end schedule dates, and featured flags.
- **Arena Events Manager**: Create, edit, and toggle live/draft status for arena events.
- **Database Migration Tool**: 1-click import tool transferring local JSON challenge files into Supabase tables.

---

### 👤 8. User Profile & Settings (`/profile`, `/console`, `/settings`)
- **Profile (`/profile`)**: Custom avatar uploader, accent color customization (`glitch_accent_*`), Uptime Streak tracker, badge showcase, activity heatmap, and total stats.
- **Console (`/console`)**: Dashboard overview of user's active challenges, recent activity, and earned rewards.
- **Settings (`/settings`)**: Account details, sound effects toggle, notification preferences, and security options.
- **Earn Rules (`/earn-rules`)**: Comprehensive breakdown of how gBits and XP are awarded across the platform.

---

## 🎨 5. Design System & Styling Guidelines

- **Primary Colors**:
  - Background: Dark Cyberpunk `#070709` / `#080810`
  - Neon Accents: Cyan `#00F0FF`, Magenta `#FF00C8`, Purple `#A855F7`, Amber `#F59E0B`, Emerald `#10B981`
- **Typography**: Clean sans-serif UI typography with monospace code snippets.
- **Navigation**: Top Desktop `<Navbar />`, Mobile `<BottomNav />`, and standalone page header options.

---

## 💡 6. Future Ideas & Feature Wishlist

Use this section to record new ideas, features, or enhancements for **The Glitch Room**:

- [ ] **AI Pair Programming Assistant**: In-editor AI chat assistant that gives progressive hints without revealing full solutions.
- [ ] **Live 1v1 Code Duel Mode**: Real-time WebSocket matchmaking for head-to-head speed debugging battles.
- [ ] **Custom Badge Creator for Admins**: Interface to design and publish new dynamic achievement badges.
- [ ] **GitHub Activity Integration**: Sync daily Glitch Room streak with GitHub commit activity.
- [ ] **Audio Soundscape Engine**: Background ambient cyberpunk audio tracks and sound effects for code execution and level ups.
- [ ] *(Add your new ideas here...)*

---

*Last Updated: September 2026*
