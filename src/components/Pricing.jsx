import React from "react";
import { motion } from "framer-motion";

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      perks: ["Join challenges", "Access community", "Solo projects"],
    },
    {
      name: "Pro Creator",
      price: "$9/mo",
      perks: ["Team collaboration", "Priority support", "Exclusive challenges"],
    },
    {
      name: "Elite Innovator",
      price: "$19/mo",
      perks: ["Mentorship access", "Showcase spotlight", "Special rewards"],
    },
  ];

  return (
    <section className="relative bg-black py-20">
      <div className="max-w-[1100px] mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-cyan-300 drop-shadow-md mb-14">
          Choose Your Plan
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="p-8 bg-zinc-900 border border-pink-400 rounded-2xl shadow-[0_0_25px_rgba(236,72,153,0.5)]"
            >
              <h3 className="text-2xl font-bold text-cyan-200 mb-4">
                {plan.name}
              </h3>
              <p className="text-3xl font-extrabold text-pink-400 mb-6">
                {plan.price}
              </p>
              <ul className="space-y-3 text-zinc-400">
                {plan.perks.map((perk, i) => (
                  <li key={i}>✔ {perk}</li>
                ))}
              </ul>
              <button className="mt-8 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-400 text-white font-semibold shadow-[0_0_20px_rgba(236,72,153,0.7)]">
                Get Started
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
