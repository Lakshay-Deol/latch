import React from "react";
import {
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Subtitle } from "./Subtitle";

export const Phase5Platform: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const landingProgress = spring({
    frame,
    fps,
    config: { damping: 15 },
  });

  const receiptProgress = spring({
    frame: frame - 100,
    fps,
    config: { damping: 15 },
  });

  const subtleZoom = interpolate(frame, [0, 730], [1, 1.05]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#160e0b",
        backgroundImage:
          "radial-gradient(circle at 50% 20%, rgba(184, 86, 50, 0.22) 0%, transparent 70%)",
        color: "#ffffff",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        position: "relative",
        padding: "60px 80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile("voice_phase5.wav")} />
      <Audio src={staticFile("chime.wav")} volume={0.25} />

      {/* Top Header Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 26px",
          borderRadius: 999,
          backgroundColor: "rgba(184, 86, 50, 0.15)",
          border: "1px solid rgba(232, 161, 123, 0.4)",
          marginBottom: 16,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "#e8a17b",
          }}
        />
        <span
          style={{
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#e8a17b",
          }}
        >
          Phase 5 · The Live Platform & Deterministic Operations
        </span>
      </div>

      <h1
        style={{
          fontSize: 50,
          fontWeight: 850,
          margin: "0 0 28px 0",
          letterSpacing: "-0.02em",
          textAlign: "center",
        }}
      >
        Live Sandboxed Operations & <span style={{ color: "#e8a17b" }}>Cryptographic Proofs</span>
      </h1>

      {/* Side-by-side view: Live UI Screenshot + Real S3 Receipt JSON */}
      <div
        style={{
          display: "flex",
          gap: 32,
          width: "100%",
          maxWidth: 1680,
          alignItems: "center",
        }}
      >
        {/* Live UI Platform */}
        <div
          style={{
            flex: 1.3,
            borderRadius: 24,
            overflow: "hidden",
            border: "2px solid rgba(232, 161, 123, 0.4)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            opacity: landingProgress,
            transform: `scale(${subtleZoom})`,
          }}
        >
          <Img
            src={staticFile("latch_landing.png")}
            style={{ width: "100%", display: "block" }}
          />
        </div>

        {/* Real S3 Receipt Panel */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(25, 16, 12, 0.95)",
            border: "1.5px solid rgba(234, 179, 8, 0.4)",
            borderRadius: 24,
            padding: 28,
            boxShadow: "0 20px 48px rgba(0,0,0,0.5)",
            opacity: receiptProgress,
            transform: `translateX(${(1 - receiptProgress) * 40}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 800, color: "#facc15" }}>
              VULTR S3 RECEIPT · CANONICAL SHA-256
            </span>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 8,
                backgroundColor: "rgba(234, 179, 8, 0.2)",
                color: "#fde047",
                fontWeight: 750,
                fontSize: 12,
              }}
            >
              Auditable Proof
            </span>
          </div>

          <pre
            style={{
              backgroundColor: "#090605",
              padding: 16,
              borderRadius: 14,
              fontFamily: "monospace",
              fontSize: 12.5,
              color: "#fef08a",
              lineHeight: 1.45,
              margin: 0,
              overflow: "hidden",
            }}
          >
            {`{
  "operation": "toscrape.com/search_books",
  "result": {
    "results": [
      { "id": "b_1", "title": "It's Only the Himalayas", "price": "£45.17" }
    ],
    "count": 1
  },
  "receipt": {
    "sandbox_id": "latch-sandbox-microvm-01",
    "worker_vm": "155.138.217.237",
    "sha256": "af0d03b56bbe0a1a278a9f9ab6a2554a571c2756db5e64ecf021745ace5556a0",
    "containment": {
      "network_mode": "none",
      "readonly_rootfs": true,
      "cap_drop": ["ALL"]
    }
  }
}`}
          </pre>
        </div>
      </div>

      <Subtitle text="Every single execution produces an immutable SHA-256 receipt persisted to Vultr S3, guaranteeing non-exfiltration." />
    </div>
  );
};

