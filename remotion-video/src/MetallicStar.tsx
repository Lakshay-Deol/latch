import React from "react";

export const MetallicStar: React.FC<{ size?: number; rotation?: number }> = ({
  size = 120,
  rotation = 0,
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background:
          "radial-gradient(circle at 35% 35%, #ffffff 0%, #e2e8f0 40%, #94a3b8 80%, #475569 100%)",
        border: "3px solid rgba(255, 255, 255, 0.9)",
        boxShadow:
          "0 20px 48px rgba(0, 0, 0, 0.35), inset 0 2px 8px rgba(255, 255, 255, 0.9), inset 0 -6px 12px rgba(15, 23, 42, 0.5)",
        display: "grid",
        placeItems: "center",
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        style={{
          width: size * 0.78,
          height: size * 0.78,
          filter: "drop-shadow(0 8px 16px rgba(15, 23, 42, 0.4))",
        }}
      >
        <defs>
          <radialGradient id="chromeGlow" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#e2e8f0" />
            <stop offset="65%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#334155" />
          </radialGradient>
          <linearGradient id="bevelLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#475569" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="bevelDark" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#64748b" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path
          d="M 50 4 C 50 32, 68 50, 96 50 C 68 50, 50 68, 50 96 C 50 68, 32 50, 4 50 C 32 50, 50 32, 50 4 Z"
          fill="url(#chromeGlow)"
        />
        <path
          d="M 50 4 C 50 32, 68 50, 96 50 L 50 50 Z"
          fill="url(#bevelLight)"
        />
        <path
          d="M 50 96 C 50 68, 32 50, 4 50 L 50 50 Z"
          fill="url(#bevelDark)"
        />
        <polygon
          points="50,34 66,50 50,66 34,50"
          fill="#ffffff"
          opacity="0.9"
        />
        <polygon points="50,38 62,50 50,62 38,50" fill="#0f172a" />
      </svg>
    </div>
  );
};

