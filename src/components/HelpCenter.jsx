import React, { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PageHeading from "./PageHeading";
import {
  FaSearch,
  FaEnvelope,
  FaHeadset,
  FaUserShield,
  FaCreditCard,
  FaCogs,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

const faqs = [
  {
    question: "How do I reset my password?",
    answer:
      "Click on 'Forgot Password' at login. You'll receive an email with a secure reset link within a few minutes.",
  },
  {
    question: "How can I contact customer support?",
    answer:
      "You can reach us anytime via the 'Contact Support' section below or email us at theglitchroom.official@gmail.com.",
  },
  {
    question: "What payment methods are supported?",
    answer:
      "We support credit/debit cards, UPI, and PayPal for secure transactions.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. We use end-to-end encryption and industry-standard security practices to keep your data safe.",
  },
  {
    question: "Can I participate without a team?",
    answer:
      "Absolutely! You can go solo on any challenge or find collaborators inside the platform.",
  },
  {
    question: "Is it free to join?",
    answer:
      "Yes! You can start for free. Premium plans may unlock advanced features and perks.",
  },
];

const categories = [
  {
    icon: <FaUserShield className="text-2xl" />,
    title: "Account",
    desc: "Manage your profile, login, and security settings.",
  },
  {
    icon: <FaCogs className="text-2xl" />,
    title: "Technical Support",
    desc: "Troubleshoot errors, bugs, or glitches in the platform.",
  },
  {
    icon: <FaCreditCard className="text-2xl" />,
    title: "Payments",
    desc: "Get help with transactions, billing, and refunds.",
  },
  {
    icon: <FaHeadset className="text-2xl" />,
    title: "General Queries",
    desc: "Find answers to general questions about Glitch Room.",
  },
];

const CAT_ACCENT = "#A855F7";
const CAT_ACCENT_RGB = "168,85,247";
const FAQ_ACCENT = "#00F0FF";
const FAQ_ACCENT_RGB = "0,240,255";

const HelpCenter = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [search, setSearch] = useState("");

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#0B0C10] text-white min-h-screen flex flex-col"
    >
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(0,240,255,0.2) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0,240,255,0.2) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] rounded-full blur-3xl opacity-10"
          style={{
            background: "radial-gradient(ellipse, #00F0FF, transparent)",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          <PageHeading
            eyebrow="Support"
            title="Help Center"
            subtitle="Find answers to common questions, explore helpful articles, or reach out to us directly."
            accent="cyan"
            size="xl"
          />

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-4 max-w-lg mx-auto flex items-center gap-3 bg-[#111118] border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#00F0FF]/50 transition"
          >
            <FaSearch className="text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="Search for help..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none"
            />
          </motion.div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-16"
          style={{
            background: "linear-gradient(to bottom, transparent, #0B0C10)",
          }}
        />
      </section>

      {/* ── CATEGORIES ── */}
      <section className="py-16 px-6 max-w-6xl mx-auto w-full">
        <PageHeading
          eyebrow="Browse by Topic"
          title="What do you need help with?"
          accent="purple"
          layout="inline"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="relative p-6 bg-[#111118] rounded-2xl border overflow-hidden group cursor-pointer transition-all duration-300"
              style={{ borderColor: `rgba(${CAT_ACCENT_RGB}, 0.18)` }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `rgba(${CAT_ACCENT_RGB}, 0.4)`;
                e.currentTarget.style.boxShadow = `0 0 22px rgba(${CAT_ACCENT_RGB}, 0.15)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `rgba(${CAT_ACCENT_RGB}, 0.18)`;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                style={{
                  background: `rgba(${CAT_ACCENT_RGB}, 0.12)`,
                  color: CAT_ACCENT,
                }}
              >
                {cat.icon}
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                {cat.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {cat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 px-6 max-w-3xl mx-auto w-full">
        <PageHeading
          eyebrow="FAQ"
          title="Frequently Asked Questions"
          accent="cyan"
          layout="inline"
        />

        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <p className="text-gray-500 text-center py-10">
              No results found for "{search}"
            </p>
          ) : (
            filteredFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                className="bg-[#111118] border rounded-xl overflow-hidden transition-all"
                style={{
                  borderColor:
                    openIndex === index
                      ? `rgba(${FAQ_ACCENT_RGB}, 0.4)`
                      : "rgba(255,255,255,0.06)",
                }}
              >
                <button
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                  className="w-full flex justify-between items-center px-5 py-4 text-left gap-4 cursor-pointer"
                >
                  <span className="text-white font-semibold text-sm">
                    {faq.question}
                  </span>
                  <span className="shrink-0" style={{ color: FAQ_ACCENT }}>
                    {openIndex === index ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                </button>
                {openIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="px-5 pb-4"
                  >
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="py-16 px-6 text-center border-t border-white/5 bg-[#0d0d12]">
        <PageHeading
          eyebrow="Still Stuck?"
          title="Need More Help?"
          subtitle="Our support team is always ready to assist you — usually responds within 24 hours."
          accent="pink"
        />
        <a
          href="mailto:theglitchroom.official@gmail.com"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold cursor-pointer transition-all duration-300"
          style={{ background: "linear-gradient(90deg, #FF00C8, #a855f7)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 0 22px rgba(255,0,200,0.55)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <FaEnvelope /> Contact Support
        </a>
      </section>

      <Footer />
    </motion.div>
  );
};

export default HelpCenter;
