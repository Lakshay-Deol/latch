import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export const Subtitle: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 48,
        left: "50%",
        transform: "translateX(-50%)",
        width: "85%",
        maxWidth: 1300,
        backgroundColor: "rgba(15, 10, 8, 0.88)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(232, 161, 123, 0.35)",
        borderRadius: 24,
        padding: "16px 36px",
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.5)",
        opacity,
        display: "flex",
        alignItems: "center",
        gap: 18,
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: "#b85632",
          boxShadow: "0 0 12px #e8a17b",
          flexShrink: 0,
        }}
      />
      <div
        style={{
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          fontSize: 24,
          fontWeight: 500,
          color: "#fcf8f5",
          lineHeight: 1.4,
          letterSpacing: "-0.01em",
        }}
      >
        {text}
      </div>
    </div>
  );
};

