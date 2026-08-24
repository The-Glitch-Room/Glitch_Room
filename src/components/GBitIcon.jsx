import React from "react";

/**
 * Official Glitch Room gBits Currency Icon
 * Renders an octagonal cyber-token with gradient glow and stencil 'G'
 */
export const GBitIcon = ({ className = "w-4 h-4 inline-block", size, style = {}, glow = true }) => {
  const customStyle = size ? { width: `${size}px`, height: `${size}px`, ...style } : style;

  return (
    <svg
      viewBox="-4 -4 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 align-middle ${className}`}
      style={{ overflow: "visible", ...customStyle }}
    >
      <defs>
        <linearGradient id="gBitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="50%" stopColor="#7000FF" />
          <stop offset="100%" stopColor="#FF00C8" />
        </linearGradient>

        {glow && (
          <filter id="gBitGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}
      </defs>

      {/* Outer Octagonal Ring */}
      <polygon
        points="20,4 44,4 60,20 60,44 44,60 20,60 4,44 4,20"
        fill="#0A0A14"
        stroke="url(#gBitGradient)"
        strokeWidth="3.5"
        filter={glow ? "url(#gBitGlowFilter)" : undefined}
      />

      {/* Inner Octagonal Bezel */}
      <polygon
        points="22,8 42,8 56,22 56,42 42,56 22,56 8,42 8,22"
        fill="#121324"
        stroke="url(#gBitGradient)"
        strokeWidth="1.2"
        strokeOpacity="0.6"
      />

      {/* Circuit Nodes */}
      <circle cx="32" cy="9.5" r="1.8" fill="#00F0FF" />
      <circle cx="54.5" cy="32" r="1.8" fill="#FF00C8" />
      <circle cx="32" cy="54.5" r="1.8" fill="#7000FF" />
      <circle cx="9.5" cy="32" r="1.8" fill="#00F0FF" />

      {/* Geometric Stencil Monogram 'G' */}
      <path
        d="M 40 22 H 24 A 10 10 0 0 0 24 42 H 38 V 32 H 30"
        stroke="url(#gBitGradient)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Center Glitch Node Dot */}
      <circle cx="38" cy="32" r="2.2" fill="#00F0FF" />
    </svg>
  );
};

export default GBitIcon;
