import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PageHeading from "./PageHeading";
import Button from "./Button";

const CORE_FEATURES = [
  {
    title: "⚡ Glitch Challenges",
    desc: "Test your skills by fixing unique real-world glitches that challenge your logic, creativity, and problem-solving.",
  },
  {
    title: "🎮 Game Arena",
    desc: "A 3-level chaos-led competition — Find the Glitch, Twist the Cards, Pitch Wild — progress and reach the Hall of Fame!",
  },
  {
    title: "🧠 AI & Tech Categories",
    desc: "Explore glitches in AI, Web Dev, ML, Blockchain, Data Science, and more. Learn through play and experimentation.",
  },
  {
    title: "🌈 Hall of Fame",
    desc: "Showcase your achievements! Top players are featured for creativity, teamwork, and innovation — permanent recognition.",
  },
  {
    title: "🧩 Twist Cards",
    desc: "Random twists to every challenge — forcing players to adapt, remix, and think differently. No two games are the same!",
  },
  {
    title: "🎭 Meme & Pitch Mode",
    desc: "Turn your fixes into memes, comics, or short pitches. Combine humor and innovation to express your solution uniquely.",
  },
  {
    title: "🔐 Private & Public Rooms",
    desc: "Join public challenges or host private rooms for colleges, companies, and hackathons with secure entry codes.",
  },
  {
    title: "🏗️ Real-World Integration",
    desc: "Bridge between learning and application — use real datasets, APIs, and scenarios to simulate industry-level glitches.",
  },
  {
    title: "🎁 Reward System",
    desc: "Earn points, unlock badges, and win exclusive swags. Redeem your achievements or climb up the leaderboard!",
  },
];

const VIBE_TAGS = [
  "💡 Learn by Doing",
  "🤝 Collaborate with Others",
  "🏆 Compete & Win",
  "🔥 Boost Creative Thinking",
  "🎓 Build Portfolio Projects",
];

const ACCENT = "#00F0FF";
const ACCENT_RGB = "0,240,255";

const Features = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0d0d10] text-white flex flex-col">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative pt-40 pb-16 px-6 overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(0,240,255,0.2) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0,240,255,0.2) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] rounded-full blur-3xl opacity-10 z-0"
          style={{
            background: "radial-gradient(ellipse, #00F0FF, transparent)",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          <PageHeading
            eyebrow="Features"
            title="Features That Power Creativity"
            subtitle="Experience a world where glitches become opportunities, chaos turns into creativity, and innovation is gamified."
            accent="cyan"
            size="xl"
          />
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-16 z-10"
          style={{
            background: "linear-gradient(to bottom, transparent, #0d0d10)",
          }}
        />
      </section>

      {/* ── CORE FEATURES ── */}
      <section className="max-w-6xl mx-auto w-full px-6 pb-16">
        <PageHeading
          eyebrow="The Toolkit"
          title="Everything you need"
          accent="cyan"
          size="md"
          layout="inline"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CORE_FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="relative rounded-2xl p-6 bg-[#111118] border overflow-hidden transition-all duration-300"
              style={{ borderColor: `rgba(${ACCENT_RGB}, 0.15)` }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `rgba(${ACCENT_RGB}, 0.4)`;
                e.currentTarget.style.boxShadow = `0 0 22px rgba(${ACCENT_RGB}, 0.15)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `rgba(${ACCENT_RGB}, 0.15)`;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <h3 className="text-lg font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── ENGAGEMENT SECTION ── */}
      <section className="bg-[#121218] py-20 px-6 text-center border-t border-white/5">
        <PageHeading
          eyebrow="The Vibe"
          title="Why You'll Love Glitch Room"
          subtitle="Because it's not just about coding — it's about creating. Every bug you fix, every glitch you twist, and every pitch you make shapes a story that reflects your imagination and skill."
          accent="pink"
        />

        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {VIBE_TAGS.map((item, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="border px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                background: "rgba(255,0,200,0.08)",
                borderColor: "rgba(255,0,200,0.2)",
                color: "#FF00C8",
              }}
            >
              {item}
            </motion.span>
          ))}
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="text-center py-24 px-6 bg-[#0d0d10] border-t border-white/5">
        <PageHeading
          title="Ready to Dive Into the Glitch?"
          subtitle="Join the movement where tech meets creativity — where every glitch is an opportunity to innovate."
          accent="purple"
          size="md"
        />

        <div onClick={() => navigate("/game-arena")} className="inline-block">
          <Button content="Enter the Glitch Room 🚀" accent="purple" />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Features;
