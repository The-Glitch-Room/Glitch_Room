# ⚡ Glitch Room — Interactive Developer Arena & Assessment Platform

![Glitch Room Banner](public/logo_GR.png)

> **Glitch Room** is a state-of-the-art competitive coding platform, interactive developer arena, and room hosting system. Master real-world debugging, tackle AI/ML challenges, host custom assessment rooms for colleges/companies, and climb the Terminal Wall leaderboard!

---

## 🌟 Highlights & Core Features

### 🎮 1. Developer Challenges & Sandbox
- **Glitches & Debug Mode**: Diagnose real-world bugs, broken logic, and code anomalies across Easy, Medium, and Hard difficulty levels.
- **Creative Sparks & AI Challenges**: Tackle generative AI, web dev, and prompt engineering challenges evaluated in real time.
- **Glitch Sandbox Workspace**: Interactive code editor with live preview, console logs, and immediate feedback.
- **gBits & Uptime Streaks**: Earn gBits for every solve, unlock speed demon bonuses, gain 7-day streak rewards (+150 gBits), and earn custom developer badges.

---

### 🏢 2. Creator & Professional Rooms
- **Host Branded Rooms**: Run custom challenge rooms for colleges, corporate hiring, hackathons, or bootcamps.
- **Professional MCQ Assessments**: Pre-assessment entry cards, 30:00 live timer countdowns, compact vertical question navigation, and personal score summaries.
- **Top 20 Performers Leaderboard**: Real-time room-scoped leaderboards with crown podiums for Top 3 contributors.
- **Room Controls**: Secure host/admin authorization with type-to-confirm Delete Room verification.

---

### 🏆 3. Terminal Wall & Rankings
- **Live Rankings**: Real-time filtering by Today, This Week, and All-Time.
- **All-Time Legends**: Hall of Fame featuring top overall contributors and Arena champions.
- **Developer Avatars & Profiles**: Customizable developer character identities (The Dev, The Glitch, The Fox, The Wizard) and public user profiles.

---

### 💬 4. Glitch Lounge Community
- **Community Feed**: Post text, markdown, code snippets, or image attachments.
- **Categories & Sorting**: Filter by General, Glitch Help, Web Dev, AI/ML, Creative, or Off-Topic.
- **Interactions**: Upvote, comment on posts, and connect with fellow developers.

---

### 🛡️ 5. Admin Dashboard
- **System Metrics**: Track total users, active rooms, community posts, and challenge submissions.
- **User & Room Management**: Admin controls for moderating content and managing room hosts.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + Custom Glassmorphism & Cyberpunk Themes |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Icons & Charts** | [Lucide React](https://lucide.dev/), [React Icons](https://react-icons.github.io/react-icons/), [Chart.js](https://www.chartjs.org/) |
| **Backend & Database** | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime) |
| **Markdown Parsing** | [React Markdown](https://github.com/remarkjs/react-markdown) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

---

### 1️⃣ Installation

Clone the repository and install project dependencies:

```bash
git clone https://github.com/The-Glitch-Room/Glitch_Room.git
cd Glitch_Room
npm install
```

---

### 2️⃣ Environment Configuration

Copy the sample environment file `.env.example` to create your local `.env` file:

```bash
cp .env.example .env
```

Open `.env` and add your Supabase credentials from your Supabase Dashboard:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-anon-key
```

> ⚠️ **Security Warning**: Never commit your `.env` file to version control. It is automatically ignored in `.gitignore`.

---

### 3️⃣ Database Setup (Supabase)

Execute the complete database provisioning script [`scratch/supabase_schema.sql`](file:///C:/Users/parul/.gemini/antigravity/brain/1e6da592-1ced-45c3-bb3e-e081e7afbb95/scratch/supabase_schema.sql) in your **Supabase SQL Editor** to create all tables, indexes, and Row Level Security (RLS) policies:

- `profiles`
- `user_points`
- `challenge_submissions`
- `rooms`
- `room_members`
- `room_checkins`
- `room_questions`
- `glitch_activity`
- `community_posts`
- `community_comments`
- `arena_completions`

---

### 4️⃣ Development Server

Start the local development server:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

### 5️⃣ Production Build

Compile and validate the production bundle:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## 📁 Repository Structure

```
Glitch_Room/
├── public/                     # Static assets & logos
├── src/
│   ├── components/             # React components
│   │   ├── CreatorRooms/       # Professional & Creator room views & modals
│   │   ├── AuthContext.jsx     # Authentication provider & session manager
│   │   ├── Console.jsx         # Main developer dashboard
│   │   ├── HostRoom.jsx        # Room creation multi-step wizard
│   │   ├── JoinRoom.jsx        # Public & private room discovery
│   │   ├── ProfessionalRoomDetail.jsx  # MCQ assessment engine
│   │   ├── TerminalWall.jsx    # Real-time leaderboard & Hall of Fame
│   │   └── Community.jsx       # Community feed & discussion lounge
│   ├── data/                   # Challenge catalogs & static assets
│   ├── utils/                  # Point helper engines & profanity filters
│   ├── App.jsx                 # App router & protected navigation
│   └── main.jsx                # Entry point
├── .env.example                # Template environment file
├── .gitignore                  # Git ignore rules
├── package.json
└── README.md
```

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 🤝 Contributing

Contributions are always welcome! Feel free to open an issue or submit a pull request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
