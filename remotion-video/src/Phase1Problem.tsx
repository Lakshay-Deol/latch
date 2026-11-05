import React from "react";
import {
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { MetallicStar } from "./MetallicStar";
import { Subtitle } from "./Subtitle";

export const Phase1Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const card1Progress = spring({
    frame: frame - 50,
    fps,
    config: { damping: 12 },
  });
  const card2Progress = spring({
    frame: frame - 100,
    fps,
    config: { damping: 12 },
  });
  const card3Progress = spring({
    frame: frame - 150,
    fps,
    config: { damping: 12 },
  });

  const starRotation = interpolate(frame, [0, 820], [0, 180]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#0d0c0b",
        backgroundImage:
          "radial-gradient(circle at 50% 28%, rgba(194, 85, 42, 0.14) 0%, rgba(13, 12, 11, 0.98) 75%)",
        color: "#fdfbf7",
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        position: "relative",
        padding: "60px 80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile("voice_phase1.mp3")} />
      <Audio src={staticFile("whoosh.wav")} volume={0.2} />

      {/* Main Title - No Eyebrow */}
      <h1
        style={{
          fontSize: 66,
          fontWeight: 850,
          margin: "30px 0 0 0",
          textAlign: "center",
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
          transform: `scale(${titleScale})`,
          opacity: titleScale,
          color: "#fdfbf7",
        }}
      >
        Containment isn't a feature.
        <br />
        <span
          style={{
            fontStyle: "italic",
            background: "linear-gradient(135deg, #e8a17b 0%, #b85632 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          It's the product.
        </span>
      </h1>

      {/* 3D Metallic Star Centerpiece */}
      <div
        style={{
          margin: "24px 0",
          transform: `rotate(${starRotation}deg)`,
          filter: "drop-shadow(0 0 45px rgba(232, 161, 123, 0.35))",
        }}
      >
        <MetallicStar size={110} />
      </div>

      {/* 3 Risk Pillar Cards */}
      <div
        style={{
          display: "flex",
          gap: 24,
          width: "100%",
          maxWidth: 1560,
          marginTop: 10,
        }}
      >
        {/* Card 1 */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(22, 20, 18, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderTop: "2px solid #ef4444",
            borderRadius: 22,
            padding: 32,
            boxShadow: "0 20px 45px rgba(0, 0, 0, 0.6)",
            opacity: card1Progress,
            transform: `translateY(${(1 - card1Progress) * 40}px)`,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 850,
              color: "#ef4444",
              letterSpacing: "0.08em",
            }}
          >
            CRITICAL RISK 1
          </span>
          <h3 style={{ fontSize: 24, margin: "10px 0 10px 0", color: "#fdfbf7", fontWeight: 700 }}>
            Secret Exfiltration
          </h3>
          <p style={{ fontSize: 16, color: "#a8a29e", lineHeight: 1.55, margin: 0 }}>
            Unconstrained agents access <code>/proc/1/environ</code>, leaking cloud credentials, API keys, and sensitive session tokens to untrusted prompts.
          </p>
        </div>

        {/* Card 2 */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(22, 20, 18, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderTop: "2px solid #f97316",
            borderRadius: 22,
            padding: 32,
            boxShadow: "0 20px 45px rgba(0, 0, 0, 0.6)",
            opacity: card2Progress,
            transform: `translateY(${(1 - card2Progress) * 40}px)`,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 850,
              color: "#f97316",
              letterSpacing: "0.08em",
            }}
          >
            CRITICAL RISK 2
          </span>
          <h3 style={{ fontSize: 24, margin: "10px 0 10px 0", color: "#fdfbf7", fontWeight: 700 }}>
            Runaway Fork Bombs
          </h3>
          <p style={{ fontSize: 16, color: "#a8a29e", lineHeight: 1.55, margin: 0 }}>
            Without kernel cgroup PID ceilings, recursive tool-use loops spawn subshell cascades that crash the host compute node.
          </p>
        </div>

        {/* Card 3 */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(22, 20, 18, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderTop: "2px solid #eab308",
            borderRadius: 22,
            padding: 32,
            boxShadow: "0 20px 45px rgba(0, 0, 0, 0.6)",
            opacity: card3Progress,
            transform: `translateY(${(1 - card3Progress) * 40}px)`,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 850,
              color: "#eab308",
              letterSpacing: "0.08em",
            }}
          >
            CRITICAL RISK 3
          </span>
          <h3 style={{ fontSize: 24, margin: "10px 0 10px 0", color: "#fdfbf7", fontWeight: 700 }}>
            Fragile DOM Bots
          </h3>
          <p style={{ fontSize: 16, color: "#a8a29e", lineHeight: 1.55, margin: 0 }}>
            Visual clicking fails on minor UI shifts and trips anti-bot challenges. Latch replaces fragile bots with deterministic, sandboxed Python APIs.
          </p>
        </div>
      </div>

      <Subtitle text="Autonomous agents are executing real actions on the web. At Latch, containment isn't a feature — it is the product." />
    </div>
  );
};
