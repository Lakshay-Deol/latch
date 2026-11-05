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

  const badgeScale = spring({
    frame,
    fps,
    config: { damping: 14 },
  });

  const urlProgress = spring({
    frame: frame - 40,
    fps,
    config: { damping: 14 },
  });

  const starRotation = interpolate(frame, [0, 700], [0, 180]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#160e0b",
        backgroundImage:
          "radial-gradient(circle at 50% 35%, rgba(0, 123, 252, 0.18) 0%, rgba(184, 86, 50, 0.18) 60%, transparent 100%)",
        color: "#ffffff",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        position: "relative",
        padding: "80px 100px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile("voice_phase6.wav")} />
      <Audio src={staticFile("chime.wav")} volume={0.25} />

      {/* Top Header Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 24px",
          borderRadius: 999,
          backgroundColor: "rgba(34, 197, 94, 0.15)",
          border: "1px solid rgba(34, 197, 94, 0.4)",
          marginBottom: 36,
          opacity: badgeScale,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "#22c55e",
          }}
        />
        <span
          style={{
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#86efac",
          }}
        >
          Phase 6 · Production Agent Containment
        </span>
      </div>

      {/* Metallic Star */}
      <div style={{ marginBottom: 36 }}>
        <MetallicStar size={140} rotation={starRotation} />
      </div>

      <h1
        style={{
          fontSize: 64,
          fontWeight: 850,
          margin: "0 0 16px 0",
          letterSpacing: "-0.03em",
          textAlign: "center",
        }}
      >
        Containment Isn't a Feature. It's the Product.
      </h1>

      <p
        style={{
          fontSize: 22,
          color: "#d9c6ba",
          maxWidth: 900,
          textAlign: "center",
          lineHeight: 1.5,
          margin: "0 0 44px 0",
        }}
      >
        Air-gapped sandboxes, zero plain secrets, and cryptographic execution receipts powered by Vultr Cloud.
      </p>

      {/* Big Live URL Showcase Box */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "20px 48px",
          borderRadius: 24,
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          border: "2px solid rgba(0, 123, 252, 0.6)",
          boxShadow: "0 24px 60px rgba(0, 123, 252, 0.35)",
          opacity: urlProgress,
          transform: `scale(${0.9 + 0.1 * urlProgress})`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#60a5fa", letterSpacing: "0.08em" }}>
            LIVE DEPLOYMENT ON VULTR
          </span>
          <span style={{ fontSize: 32, fontWeight: 800, fontFamily: "monospace", color: "#38bdf8" }}>
            http://155.138.217.237
          </span>
        </div>
        <div
          style={{
            padding: "10px 24px",
            borderRadius: 14,
            backgroundColor: "#007bfc",
            color: "#ffffff",
            fontWeight: 800,
            fontSize: 16,
          }}
        >
          Open App →
        </div>
      </div>

      {/* Footer Details */}
      <div
        style={{
          display: "flex",
          gap: 40,
          marginTop: 48,
          fontSize: 16,
          color: "#94a3b8",
        }}
      >
        <span>GitHub: <strong>Lakshay-Deol/latch</strong></span>
        <span>•</span>
        <span>Test Suite: <strong>13/13 Passing</strong></span>
        <span>•</span>
        <span>Infrastructure: <strong>Vultr Cloud Compute + S3 + Inference</strong></span>
      </div>

      <Subtitle text="Latch is open source and deployed live on Vultr at 155.138.217.237. Experience deterministic agent containment today." />
    </div>
  );
};

