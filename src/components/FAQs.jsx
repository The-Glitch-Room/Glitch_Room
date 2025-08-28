import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaChevronDown } from "react-icons/fa";

const FAQ = () => {
  const faqs = [
    {
      q: "What is The Glitch Room?",
      a: "It's a digital hub where creators join challenges, collaborate, and showcase ideas.",
    },
    {
      q: "Is it free to join?",
      a: "Yes! You can start for free. Premium plans may unlock advanced perks.",
    },
    {
      q: "Do I need a team?",
      a: "Not at all. You can go solo or find collaborators inside the platform.",
    },
  ];

  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="relative bg-black py-20">
      <div className="max-w-[900px] mx-auto px-6">
        <h2 className="text-4xl font-bold text-cyan-300 drop-shadow-md mb-12 text-center">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          {faqs.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true }}
              className="border border-cyan-400 rounded-xl p-5 bg-zinc-900 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex justify-between w-full text-left text-cyan-200 font-semibold text-lg"
              >
                {item.q}
                <FaChevronDown
                  className={`transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <p className="text-zinc-400 mt-3">{item.a}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
