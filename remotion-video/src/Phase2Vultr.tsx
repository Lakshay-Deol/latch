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

export const Phase2Vultr: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, config: { damping: 14 } });
  const vmImageProgress = spring({ frame: frame - 40, fps, config: { damping: 12 } });
  const inferenceProgress = spring({ frame: frame - 90, fps, config: { damping: 12 } });
  const storageProgress = spring({ frame: frame - 140, fps, config: { damping: 12 } });

  const subtleFloat = Math.sin(frame / 20) * 4;

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
      <Audio src={staticFile("voice_phase2.mp3")} />
      <Audio src={staticFile("shield_on.wav")} volume={0.2} />

      {/* Main Title - No Eyebrow */}
      <h1
        style={{
          fontSize: 54,
          fontWeight: 850,
          margin: "20px 0 35px 0",
          textAlign: "center",
          letterSpacing: "-0.03em",
          opacity: titleProgress,
          transform: `scale(${titleProgress})`,
          color: "#fdfbf7",
        }}
      >
        Built Ground-Up on{" "}
        <span
          style={{
            background: "linear-gradient(135deg, #007bfc 0%, #38bdf8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Vultr Cloud Infrastructure
        </span>
      </h1>

      {/* 3 Unified Pillar Cards with User's Uploaded Vultr Screenshots */}
      <div
        style={{
          display: "flex",
          gap: 24,
          width: "100%",
          maxWidth: 1720,
          justifyContent: "center",
          alignItems: "stretch",
        }}
      >
        {/* Card 1: Vultr Cloud Compute */}
        <div
          style={{
            flex: 1.2,
            backgroundColor: "rgba(22, 20, 18, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderTop: "2px solid #007bfc",
            borderRadius: 22,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 45px rgba(0,0,0,0.6)",
            opacity: vmImageProgress,
            transform: `translateY(${(1 - vmImageProgress) * 40 + subtleFloat}px)`,
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
            <div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 850,
                  color: "#38bdf8",
                  letterSpacing: "0.08em",
                }}
              >
                VULTR CLOUD COMPUTE
              </span>
              <h3 style={{ fontSize: 21, margin: "4px 0 0 0", color: "#fdfbf7", fontWeight: 700 }}>
                Live Deployment Node
              </h3>
            </div>
            <span
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                backgroundColor: "rgba(34, 197, 94, 0.2)",
                color: "#4ade80",
                fontSize: 12,
                fontWeight: 750,
                border: "1px solid rgba(34, 197, 94, 0.4)",
              }}
            >
              ● Atlanta, US
            </span>
          </div>

          <div
            style={{
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              marginBottom: 14,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <Img
              src={staticFile("vultr_instance.png")}
              style={{ width: "100%", display: "block" }}
            />
          </div>

          <p style={{ fontSize: 14, color: "#a8a29e", lineHeight: 1.5, margin: 0 }}>
            Ubuntu 24.04 LTS instance running the FastAPI Control Plane and the local Docker worker daemon on an isolated private subnet.
          </p>
        </div>

        {/* Card 2: Vultr Serverless Inference */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(22, 20, 18, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderTop: "2px solid #8b5cf6",
            borderRadius: 22,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 45px rgba(0,0,0,0.6)",
            opacity: inferenceProgress,
            transform: `translateY(${(1 - inferenceProgress) * 40 - subtleFloat}px)`,
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
            <div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 850,
                  color: "#c084fc",
                  letterSpacing: "0.08em",
                }}
              >
                VULTR SERVERLESS INFERENCE
              </span>
              <h3 style={{ fontSize: 21, margin: "4px 0 0 0", color: "#fdfbf7", fontWeight: 700 }}>
                DeepSeek v4.1 Flash
              </h3>
            </div>
            <span
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                backgroundColor: "rgba(139, 92, 246, 0.2)",
                color: "#c4b5fd",
                fontSize: 12,
                fontWeight: 750,
                border: "1px solid rgba(139, 92, 246, 0.4)",
              }}
            >
              Active
            </span>
          </div>

          <div
            style={{
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              marginBottom: 14,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <Img
              src={staticFile("vultr_inference.png")}
              style={{ width: "100%", display: "block" }}
            />
          </div>

          <p style={{ fontSize: 14, color: "#a8a29e", lineHeight: 1.5, margin: 0 }}>
            Ultra-fast token synthesis for task planning, reasoning, and generating verifiable Python operations.
          </p>
        </div>

        {/* Card 3: Vultr Object Storage */}
        <div
          style={{
            flex: 1.1,
            backgroundColor: "rgba(22, 20, 18, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderTop: "2px solid #eab308",
            borderRadius: 22,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 45px rgba(0,0,0,0.6)",
            opacity: storageProgress,
            transform: `translateY(${(1 - storageProgress) * 40 + subtleFloat}px)`,
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
            <div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 850,
                  color: "#facc15",
                  letterSpacing: "0.08em",
                }}
              >
                VULTR OBJECT STORAGE
              </span>
              <h3 style={{ fontSize: 21, margin: "4px 0 0 0", color: "#fdfbf7", fontWeight: 700 }}>
                atl2.vultrobjects.com
              </h3>
            </div>
            <span
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                backgroundColor: "rgba(234, 179, 8, 0.2)",
                color: "#fde047",
                fontSize: 12,
                fontWeight: 750,
                border: "1px solid rgba(234, 179, 8, 0.4)",
              }}
            >
              58 S3 Objects
            </span>
          </div>

          <div
            style={{
              position: "relative",
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              marginBottom: 14,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <Img
              src={frame > 480 ? staticFile("vultr_storage_manage.png") : staticFile("vultr_buckets.png")}
              style={{ width: "100%", display: "block" }}
            />
          </div>

          <p style={{ fontSize: 14, color: "#a8a29e", lineHeight: 1.5, margin: 0 }}>
            Dedicated buckets: <code>latch-apis</code> (31 specs), <code>latch-receipts</code> (12 proofs), and <code>latch-skills</code> (15 lessons).
          </p>
        </div>
      </div>

      <Subtitle text="Latch is engineered ground up on Vultr: Cloud Compute for runners, Serverless Inference with DeepSeek, and S3 Storage." />
    </div>
  );
};
