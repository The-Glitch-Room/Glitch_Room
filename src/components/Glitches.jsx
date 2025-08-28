import React, { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";

const glitchesList = [
  {
    id: 1,
    title: "Broken UI Button",
    description: "The button doesn’t respond on click.",
  },
  {
    id: 2,
    title: "Data Sync Issue",
    description: "User data is not syncing properly across devices.",
  },
];

const Glitches = () => {
  const [solved, setSolved] = useState({});
  const [input, setInput] = useState("");

  const handleFix = (id) => {
    setSolved({ ...solved, [id]: input });
    setInput("");
  };

  return (
    <div className="bg-[#0B0C10] min-h-screen text-white p-10">
      <h1 className="text-3xl font-bold mb-6 glitch-text" data-text="Glitches">
        Glitches
      </h1>

      <div className="space-y-6">
        {glitchesList.map((glitch) => (
          <motion.div
            key={glitch.id}
            whileHover={{ scale: 1.02 }}
            className="bg-[#1F1F1F] p-6 rounded-xl border border-[#00F0FF] shadow-[0_0_10px_#00F0FF]"
          >
            <h2 className="text-xl font-semibold">{glitch.title}</h2>
            <p className="text-gray-400">{glitch.description}</p>

            {!solved[glitch.id] ? (
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Your fix..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="px-3 py-2 rounded-md text-black w-full"
                />
                <button
                  onClick={() => handleFix(glitch.id)}
                  className="mt-3 px-4 py-2 bg-[#00F0FF] text-black font-bold rounded-lg hover:scale-105 transition"
                >
                  Fix Now
                </button>
              </div>
            ) : (
              <div className="mt-4 bg-black p-4 rounded-lg shadow-md border border-[#00F0FF]">
                <h3 className="font-bold text-[#00F0FF]">✅ Fixed Summary</h3>
                <p className="text-gray-300">{solved[glitch.id]}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Glitches;
