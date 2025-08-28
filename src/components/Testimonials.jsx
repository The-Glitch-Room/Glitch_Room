import React from "react";
import { motion } from "framer-motion";
import { FaQuoteLeft } from "react-icons/fa";

const Testimonials = () => {
  const feedback = [
    {
      id: 1,
      text: "The Glitch Room gave me the confidence to share my ideas without fear.",
      author: "Aarav, Student Innovator",
    },
    {
      id: 2,
      text: "I found teammates for a hackathon within minutes here. Love it!",
      author: "Meera, Designer",
    },
    {
      id: 3,
      text: "A perfect place for introverts to shine creatively.",
      author: "Karan, Developer",
    },
  ];

  return (
    <section className="relative bg-black py-20">
      <div className="max-w-[1100px] mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-cyan-300 drop-shadow-md mb-14">
          Community Voices
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {feedback.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-zinc-900 border border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
            >
              <FaQuoteLeft className="text-pink-400 text-2xl mb-4 mx-auto" />
              <p className="text-zinc-300 italic">"{item.text}"</p>
              <h4 className="mt-4 font-semibold text-cyan-200">
                {item.author}
              </h4>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
