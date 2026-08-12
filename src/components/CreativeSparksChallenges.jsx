import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { supabase } from "../supabaseClient";
import CategoryDropdown from "./CategoryDropdown";
import PageHeading from "./PageHeading";
import { ArrowLeft } from "lucide-react";

// Page color: Violet #A855F7
const COLOR = "#A855F7";

const CreativeSparkChallenges = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [creativeChallenges, setCreativeChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChallenges = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("type", "spark")
        .order("id", { ascending: true });
      if (!error) setCreativeChallenges(data || []);
      setLoading(false);
    };
    fetchChallenges();
  }, []);

  const categories = [
    "All",
    ...new Set(creativeChallenges.map((c) => c.category)),
  ];
  const filteredChallenges =
    selectedCategory === "All"
      ? creativeChallenges
      : creativeChallenges.filter((c) => c.category === selectedCategory);

  const levelColor = (level) => {
    const l = (level || "").toLowerCase();
    if (l.includes("begin") || l.includes("easy"))
      return {
        bg: "bg-green-500/10",
        text: "text-green-400",
        dot: "bg-green-400",
      };
    if (l.includes("inter") || l.includes("medium"))
      return {
        bg: "bg-yellow-500/10",
        text: "text-yellow-400",
        dot: "bg-yellow-400",
      };
    return { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" };
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative pt-40 pb-16 px-6 overflow-hidden">
        <button
          onClick={() => navigate("/explore")}
          className="absolute top-24 left-6 md:left-10 z-20 flex items-center gap-2 text-gray-500 hover:text-white text-sm font-medium transition cursor-pointer"
        >
          <ArrowLeft size={15} /> Back to Explore
        </button>

        <div
          className="absolute inset-0 z-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(168,85,247,0.2) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(168,85,247,0.2) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] rounded-full blur-3xl opacity-10 z-0"
          style={{
            background: `radial-gradient(ellipse, ${COLOR}, transparent)`,
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          <PageHeading
            eyebrow="Creative Sparks"
            title="Creative Challenges"
            subtitle="Open-ended project ideas to stretch your design and engineering thinking. No single right answer — just your approach."
            accent="purple"
            size="xl"
          />
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-16 z-10"
          style={{
            background: "linear-gradient(to bottom, transparent, #0B0C10)",
          }}
        />
      </section>

      {/* ── FILTER BAR ── */}
      <div className="flex items-center justify-between gap-4 px-6 md:px-16 mb-10 flex-wrap">
        <CategoryDropdown
          categories={categories}
          selected={selectedCategory}
          onChange={setSelectedCategory}
          accentColor={COLOR}
          label="Category"
        />
        <p className="text-xs text-gray-500">
          Showing{" "}
          <span className="font-semibold" style={{ color: COLOR }}>
            {filteredChallenges.length}
          </span>{" "}
          idea{filteredChallenges.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── CARDS ── */}
      {loading ? (
        <div className="flex justify-center py-24">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 border-2 border-t-transparent rounded-full"
            style={{ borderColor: COLOR }}
          />
        </div>
      ) : filteredChallenges.length === 0 ? (
        <div className="text-center py-24 text-gray-500 px-6">
          No creative spark challenges yet — check back soon!
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 px-6 md:px-16 pb-20"
        >
          {filteredChallenges.map((challenge, index) => {
            const lvl = levelColor(challenge.difficulty);
            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.4 }}
                whileHover={{ y: -4 }}
                className="group relative bg-[#0f0f14] border border-white/5 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:bg-[#111118]"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = `${COLOR}33`)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)")
                }
              >
                {/* Number */}
                <div className="absolute top-4 right-4 text-xs font-bold text-white/10 transition-all">
                  #{String(challenge.id).padStart(2, "0")}
                </div>

                <div>
                  <span className="inline-block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                    {challenge.category}
                  </span>
                  <h2 className="text-white font-bold text-base leading-snug mb-3 transition-colors pr-6 group-hover:text-[#A855F7]">
                    {challenge.title}
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-5">
                    {challenge.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <span
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${lvl.bg} ${lvl.text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${lvl.dot}`} />
                    {challenge.difficulty}
                  </span>
                  <button
                    onClick={() => navigate(`/fix-spark/${challenge.id}`)}
                    className="flex items-center gap-1.5 text-xs font-bold opacity-60 group-hover:opacity-100 transition-all cursor-pointer hover:gap-2.5"
                    style={{ color: COLOR }}
                  >
                    Build it →
                  </button>
                </div>

                {/* Bottom glow on hover */}
                <div
                  className="absolute bottom-0 left-4 right-4 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${COLOR}60, transparent)`,
                  }}
                />
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <Footer />
    </div>
  );
};

export default CreativeSparkChallenges;
