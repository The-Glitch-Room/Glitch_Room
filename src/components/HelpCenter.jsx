// import React from "react";
// import { motion } from "framer-motion";
// import Navbar from "./Navbar";
// import Footer from "./Footer";
// import { FaQuestionCircle, FaEnvelope, FaBook, FaPhone } from "react-icons/fa";

// const HelpCenter = () => {
//   return (
//     <motion.div
//       initial={{ opacity: 0, x: -50 }}
//       animate={{ opacity: 1, x: 0 }}
//       exit={{ opacity: 0, x: 50 }}
//       transition={{ duration: 0.5 }}
//       className="bg-[#0B0C10] text-white min-h-screen flex flex-col"
//     >
//       {/* Navbar */}
//       <Navbar />

//       {/* Hero Section */}
//       <section className="flex flex-col items-center justify-center text-center py-20 px-6">
//         <motion.h1
//           className="glitchh-text text-4xl md:text-6xl font-bold"
//           data-text="HELP CENTER"
//           initial={{ opacity: 0, y: -50 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 1 }}
//         >
//           HELP CENTER
//         </motion.h1>
//         <p className="text-gray-400 mt-4 max-w-2xl">
//           Need assistance? We’re here to help you with FAQs, guides, and direct
//           support.
//         </p>
//       </section>

//       {/* Main Help Sections */}
//       <section className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-6 pb-20">
//         {/* FAQs */}
//         <motion.div
//           whileHover={{ scale: 1.05 }}
//           className="bg-[#1F2833] p-6 rounded-2xl shadow-lg hover:shadow-xl border border-gray-800"
//         >
//           <FaQuestionCircle className="text-orange-500 text-4xl mb-4" />
//           <h2 className="text-xl font-semibold mb-2">FAQs</h2>
//           <p className="text-gray-400 mb-4">
//             Find answers to the most commonly asked questions about Glitch Room.
//           </p>
//           <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90 transition">
//             View FAQs
//           </button>
//         </motion.div>

//         {/* Guides & Tutorials */}
//         <motion.div
//           whileHover={{ scale: 1.05 }}
//           className="bg-[#1F2833] p-6 rounded-2xl shadow-lg hover:shadow-xl border border-gray-800"
//         >
//           <FaBook className="text-orange-500 text-4xl mb-4" />
//           <h2 className="text-xl font-semibold mb-2">Guides & Tutorials</h2>
//           <p className="text-gray-400 mb-4">
//             Step-by-step resources to help you get the most out of Glitch Room.
//           </p>
//           <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90 transition">
//             Explore Guides
//           </button>
//         </motion.div>

//         {/* Contact Support */}
//         <motion.div
//           whileHover={{ scale: 1.05 }}
//           className="bg-[#1F2833] p-6 rounded-2xl shadow-lg hover:shadow-xl border border-gray-800"
//         >
//           <FaEnvelope className="text-orange-500 text-4xl mb-4" />
//           <h2 className="text-xl font-semibold mb-2">Contact Support</h2>
//           <p className="text-gray-400 mb-4">
//             Can’t find what you’re looking for? Reach out to our support team
//             directly.
//           </p>
//           <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90 transition">
//             Get in Touch
//           </button>
//         </motion.div>

//         {/* Emergency Helpline */}
//         <motion.div
//           whileHover={{ scale: 1.05 }}
//           className="bg-[#1F2833] p-6 rounded-2xl shadow-lg hover:shadow-xl border border-gray-800"
//         >
//           <FaPhone className="text-orange-500 text-4xl mb-4" />
//           <h2 className="text-xl font-semibold mb-2">Emergency Helpline</h2>
//           <p className="text-gray-400 mb-4">
//             For urgent issues, you can call us directly. Available 24/7.
//           </p>
//           <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90 transition">
//             Call Now
//           </button>
//         </motion.div>
//       </section>

//       {/* Footer */}
//       <Footer />
//     </motion.div>
//   );
// };

// export default HelpCenter;

import React, { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";
import {
  FaSearch,
  FaEnvelope,
  FaHeadset,
  FaUserShield,
  FaCreditCard,
  FaCogs,
} from "react-icons/fa";

const faqs = [
  {
    question: "How do I reset my password?",
    answer:
      "Click on 'Forgot Password' at login. You’ll get an email with a reset link.",
  },
  {
    question: "How can I contact customer support?",
    answer: "You can reach us anytime via the 'Contact Support' section below.",
  },
  {
    question: "What payment methods are supported?",
    answer:
      "We support credit/debit cards, UPI, and PayPal for secure transactions.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. We use end-to-end encryption and industry-standard security practices.",
  },
];

const HelpCenter = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.5 }}
      className="bg-[#0B0C10] text-white min-h-screen flex flex-col"
    >
      <Navbar />

      {/* Hero Section */}
      <section className="text-center py-20 px-6">
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-4xl md:text-5xl font-extrabold glitch-text mt-15"
          data-text="HELP CENTER"
        >
          HELP CENTER
        </motion.h1>
        <p className="text-gray-400 mt-4 text-lg max-w-2xl mx-auto">
          Find answers to common questions, explore helpful articles, or reach
          out to us for support.
        </p>

        {/* Search Bar */}
        <div className="mt-8 max-w-xl mx-auto flex items-center bg-[#1F2833] rounded-full shadow-lg px-4">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search for help..."
            className="flex-1 bg-transparent text-white px-3 py-3 focus:outline-none"
          />
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
        <div className="bg-[#1F2833] rounded-2xl p-6 shadow-lg hover:scale-105 transition">
          <FaUserShield className="text-cyan-400 text-3xl mx-auto mb-3" />
          <h3 className="text-xl font-bold">Account</h3>
          <p className="text-gray-400 text-sm">
            Manage your profile, login, and security.
          </p>
        </div>
        <div className="bg-[#1F2833] rounded-2xl p-6 shadow-lg hover:scale-105 transition">
          <FaCogs className="text-pink-500 text-3xl mx-auto mb-3" />
          <h3 className="text-xl font-bold">Technical Support</h3>
          <p className="text-gray-400 text-sm">
            Troubleshoot errors, bugs, or glitches.
          </p>
        </div>
        <div className="bg-[#1F2833] rounded-2xl p-6 shadow-lg hover:scale-105 transition">
          <FaCreditCard className="text-green-400 text-3xl mx-auto mb-3" />
          <h3 className="text-xl font-bold">Payments</h3>
          <p className="text-gray-400 text-sm">
            Get help with transactions and billing.
          </p>
        </div>
        <div className="bg-[#1F2833] rounded-2xl p-6 shadow-lg hover:scale-105 transition">
          <FaHeadset className="text-yellow-400 text-3xl mx-auto mb-3" />
          <h3 className="text-xl font-bold">General Queries</h3>
          <p className="text-gray-400 text-sm">
            Find answers to general questions.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 px-6 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-[#1F2833] rounded-lg p-5 shadow-lg cursor-pointer"
              onClick={() => toggleFAQ(index)}
            >
              <h3 className="flex justify-between items-center font-semibold text-lg">
                {faq.question}
                <span className="text-cyan-400">
                  {openIndex === index ? "-" : "+"}
                </span>
              </h3>
              {openIndex === index && (
                <p className="text-gray-400 mt-2">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-[#1F2833] py-16 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Need More Help?</h2>
        <p className="text-gray-400 mb-6">
          Our support team is always ready to assist you.
        </p>
        <a
          href="mailto:support@glitchroom.com"
          className="bg-cyan-500 hover:bg-cyan-600 px-6 py-3 rounded-full font-semibold flex items-center gap-2 justify-center w-fit mx-auto shadow-lg"
        >
          <FaEnvelope /> Contact Support
        </a>
      </section>

      <Footer />
    </motion.div>
  );
};

export default HelpCenter;
