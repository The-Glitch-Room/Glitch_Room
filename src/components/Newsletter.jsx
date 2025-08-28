import React from "react";

const Newsletter = () => {
  return (
    <section className="py-16 bg-black text-white text-center">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Join Our <span className="text-orange-500">Community</span>
        </h2>
        <p className="text-zinc-300 mb-8">
          Get updates, early access invites, and exclusive event announcements.
        </p>

        <form className="flex flex-col md:flex-row items-center justify-center gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="px-4 py-3 w-full md:w-2/3 rounded-xl text-black"
          />
          <button className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 transition">
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
};

export default Newsletter;
