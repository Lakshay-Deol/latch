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

export const Phase6Conclusion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, config: { damping: 14 } });
  const buttonProgress = spring({ frame: frame - 40, fps, config: { damping: 12 } });
  const metaProgress = spring({ frame: frame - 90, fps, config: { damping: 12 } });

  const starRotation = interpolate(frame, [0, 570], [0, 180]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#0d0c0b",
        backgroundImage:
          "radial-gradient(circle at 50% 35%, rgba(194, 85, 42, 0.16) 0%, rgba(13, 12, 11, 0.98) 75%)",
        color: "#fdfbf7",
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        position: "relative",
        padding: "60px 80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile("voice_phase6.mp3")} />
      <Audio src={staticFile("whoosh.wav")} volume={0.2} />

      {/* 3D Metallic Star */}
      <div
        style={{
          transform: `rotate(${starRotation}deg)`,
          filter: "drop-shadow(0 0 50px rgba(232, 161, 123, 0.45))",
          marginBottom: 24,
        }}
      >
        <MetallicStar size={130} />
      </div>

      {/* Main Title - No Eyebrow */}
      <h1
        style={{
          fontSize: 66,
          fontWeight: 850,
          margin: "0 0 16px 0",
          textAlign: "center",
          letterSpacing: "-0.03em",
          opacity: titleProgress,
          transform: `scale(${titleProgress})`,
          color: "#fdfbf7",
        }}
      >
        Containment Isn't a Feature. It's the Product.
      </h1>

      <p
        style={{
          fontSize: 22,
          color: "#d6cec4",
          maxWidth: 900,
          textAlign: "center",
          lineHeight: 1.5,
          margin: "0 0 36px 0",
          opacity: titleProgress,
        }}
      >
        Air-gapped sandboxes, zero plain secrets, and cryptographic execution receipts powered by Vultr Cloud.
      </p>

      {/* Live Link Call to Action Box - No raw IP spoken */}
      <div
        style={{
          backgroundColor: "rgba(22, 20, 18, 0.9)",
          backdropFilter: "blur(20px)",
          border: "1.5px solid rgba(184, 86, 50, 0.5)",
          borderRadius: 22,
          padding: "18px 40px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          boxShadow: "0 20px 50px rgba(0,0,0,0.7), 0 0 40px rgba(184, 86, 50, 0.25)",
          opacity: buttonProgress,
          transform: `translateY(${(1 - buttonProgress) * 30}px)`,
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#e8a17b", letterSpacing: "0.08em" }}>
            LIVE DEPLOYMENT ON VULTR
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "monospace", color: "#38bdf8", marginTop: 4 }}>
            Experience Live Demo
          </div>
        </div>

        <button
          style={{
            backgroundColor: "#b85632",
            border: "none",
            borderRadius: 12,
            padding: "12px 24px",
            color: "#ffffff",
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(184, 86, 50, 0.4)",
          }}
        >
          Open App →
        </button>
      </div>

      {/* Footer Metadata */}
      <div
        style={{
          marginTop: 40,
          display: "flex",
          gap: 36,
          fontSize: 15,
          color: "#a8a29e",
          opacity: metaProgress,
        }}
      >
        <div>
          GitHub: <strong style={{ color: "#fdfbf7" }}>Lakshay-Deol/latch</strong>
        </div>
        <div>•</div>
        <div>
          Test Suite: <strong style={{ color: "#4ade80" }}>13/13 Passing</strong>
        </div>
        <div>•</div>
        <div>
          Infrastructure: <strong style={{ color: "#38bdf8" }}>Vultr Cloud Compute + S3 + Inference</strong>
        </div>
      </div>

      <Subtitle text="Latch proves that autonomous AI agents can be fast, capable, and completely contained. Try it today on our live link." />
    </div>
  );
};
