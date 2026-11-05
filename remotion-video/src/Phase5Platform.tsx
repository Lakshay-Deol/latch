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

  const titleProgress = spring({ frame, fps, config: { damping: 14 } });
  const platformProgress = spring({ frame: frame - 25, fps, config: { damping: 12 } });
  const receiptProgress = spring({ frame: frame - 70, fps, config: { damping: 12 } });

  const subtleZoom = interpolate(frame, [0, 780], [1, 1.04]);

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
        padding: "50px 80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile("voice_phase5.mp3")} />
      <Audio src={staticFile("chime.wav")} volume={0.15} />

      {/* Main Title - No Eyebrow */}
      <h1
        style={{
          fontSize: 52,
          fontWeight: 850,
          margin: "15px 0 30px 0",
          textAlign: "center",
          letterSpacing: "-0.03em",
          opacity: titleProgress,
          transform: `scale(${titleProgress})`,
          color: "#fdfbf7",
        }}
      >
        Live Sandboxed Operations &{" "}
        <span
          style={{
            background: "linear-gradient(135deg, #e8a17b 0%, #b85632 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Cryptographic Proofs
        </span>
      </h1>

      {/* Side-by-Side: Live UI Platform and Vultr S3 Canonical Receipt */}
      <div
        style={{
          display: "flex",
          gap: 24,
          width: "100%",
          maxWidth: 1700,
          alignItems: "stretch",
        }}
      >
        {/* Left: Platform Preview */}
        <div
          style={{
            flex: 1.25,
            borderRadius: 22,
            overflow: "hidden",
            boxShadow: "0 24px 50px rgba(0,0,0,0.7)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderTop: "2px solid #b85632",
            backgroundColor: "rgba(22, 20, 18, 0.85)",
            opacity: platformProgress,
            transform: `translateY(${(1 - platformProgress) * 40}px) scale(${subtleZoom})`,
          }}
        >
          <Img
            src={staticFile("latch_landing.png")}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>

        {/* Right: Vultr S3 Signed Receipt */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(22, 20, 18, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderTop: "2px solid #eab308",
            borderRadius: 22,
            padding: 28,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 24px 50px rgba(0,0,0,0.7)",
            opacity: receiptProgress,
            transform: `translateY(${(1 - receiptProgress) * 40}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 850, color: "#facc15", letterSpacing: "0.08em" }}>
              VULTR S3 RECEIPT · CANONICAL SHA-256
            </span>
            <span
              style={{
                padding: "4px 12px",
                borderRadius: 999,
                backgroundColor: "rgba(234, 179, 8, 0.2)",
                color: "#fde047",
                fontSize: 12,
                fontWeight: 750,
                border: "1px solid rgba(234, 179, 8, 0.4)",
              }}
            >
              Auditable Proof
            </span>
          </div>

          <pre
            style={{
              flex: 1,
              margin: 0,
              backgroundColor: "#09090b",
              borderRadius: 14,
              padding: 18,
              color: "#f5f5f5",
              fontSize: 13,
              lineHeight: 1.5,
              fontFamily: "monospace",
              border: "1px solid rgba(255,255,255,0.08)",
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
    "deployment": "Vultr Cloud Compute",
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
