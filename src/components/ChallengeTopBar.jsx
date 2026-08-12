import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Zap } from "lucide-react";

/**
 * ChallengeTopBar — sticky navbar for challenge pages.
 * Replaces the old floating points pill with a real full-width bar:
 * back link on the left, live points pill on the right.
 */
const ChallengeTopBar = ({ color, points, backTo, backLabel = "← Back" }) => (
  <div className="sticky top-0 z-30 w-full bg-[#0B0C10]/95 backdrop-blur-md border-b border-white/5">
    <div
      className="h-[2px] w-full"
      style={{
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }}
    />
    <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-10 py-4 flex items-center justify-between gap-4">
      {backTo ? (
        <Link
          to={backTo}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition"
        >
          <ArrowLeft size={14} /> {backLabel}
        </Link>
      ) : (
        <span />
      )}

      <div
        className="flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full"
        style={{
          color,
          background: `${color}15`,
          border: `1px solid ${color}30`,
        }}
      >
        <Zap size={13} /> {points} pts
      </div>
    </div>
  </div>
);

export default ChallengeTopBar;
