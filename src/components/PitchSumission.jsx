import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

const PitchSubmission = () => {
  return (
    <div className="bg-[#0B0C10] min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow py-20 px-6">
        <div className="max-w-3xl mx-auto bg-[#1F1F1F] rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            Pitch Submission
          </h3>
          <form className="flex flex-col gap-4">
            {/* Team/Name */}
            <input
              type="text"
              placeholder="Team / Your Name"
              className="p-3 rounded-md bg-[#0B0C10] border border-gray-600 text-white focus:outline-none"
            />

            {/* Title */}
            <input
              type="text"
              placeholder="Pitch Title"
              className="p-3 rounded-md bg-[#0B0C10] border border-gray-600 text-white focus:outline-none"
            />

            {/* Basic Idea */}
            <textarea
              placeholder="Briefly describe your idea"
              rows="5"
              className="p-3 rounded-md bg-[#0B0C10] border border-gray-600 text-white focus:outline-none"
            />

            {/* File Upload */}
            <input
              type="file"
              accept=".pdf,.ppt,.pptx,.mp4,.mov,.avi"
              className="p-3 rounded-md bg-[#0B0C10] border border-gray-600 text-white focus:outline-none file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
            />

            {/* Submit Button */}
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-md hover:opacity-90 transition cursor-pointer"
            >
              Submit Pitch
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PitchSubmission;
