import React from "react";

const CommunityHighlights = () => {
  const highlights = [
    { title: "100+ Projects", desc: "Showcased by students and creators" },
    { title: "Global Members", desc: "Creators from 15+ countries" },
    { title: "Collab Spaces", desc: "Find your team in minutes" },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-black to-zinc-900 text-white">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-12">
          Community <span className="text-orange-500">Highlights</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {highlights.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-zinc-800 border border-orange-500/30 shadow-lg hover:scale-105 transition"
            >
              <h3 className="text-2xl font-bold text-orange-400 mb-2">
                {item.title}
              </h3>
              <p className="text-zinc-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommunityHighlights;
