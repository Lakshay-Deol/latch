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

  const headerProgress = spring({
    frame,
    fps,
    config: { damping: 14 },
  });

  // 3 sequential zooms/transitions for the Vultr assets
  const vmImageProgress = spring({
    frame: frame - 20,
    fps,
    config: { damping: 15 },
  });

  const storageProgress = spring({
    frame: frame - 160,
    fps,
    config: { damping: 15 },
  });

  const inferenceProgress = spring({
    frame: frame - 300,
    fps,
    config: { damping: 15 },
  });

  const subtleFloat = Math.sin(frame / 20) * 6;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#0d131f",
        backgroundImage:
          "radial-gradient(circle at 50% 25%, rgba(0, 123, 252, 0.22) 0%, transparent 70%)",
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
      <Audio src={staticFile("voice_phase2.wav")} />
      <Audio src={staticFile("shield_on.wav")} volume={0.2} />

      {/* Top Vultr Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 26px",
          borderRadius: 999,
          backgroundColor: "rgba(0, 123, 252, 0.15)",
          border: "1px solid rgba(0, 123, 252, 0.4)",
          marginBottom: 20,
          opacity: headerProgress,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#007bfc",
            boxShadow: "0 0 10px #007bfc",
          }}
        />
        <span
          style={{
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#60a5fa",
          }}
        >
          Phase 2 · Built Ground-Up on Vultr Cloud Infrastructure
        </span>
      </div>

      <h1
        style={{
          fontSize: 52,
          fontWeight: 850,
          margin: "0 0 32px 0",
          letterSpacing: "-0.02em",
          textAlign: "center",
          opacity: headerProgress,
        }}
      >
        Powering Agent Containment with <span style={{ color: "#38bdf8" }}>Vultr</span>
      </h1>

      {/* Central 3-Column Showcase of User's Actual Vultr Dashboard Assets */}
      <div
        style={{
          display: "flex",
          gap: 28,
          width: "100%",
          maxWidth: 1720,
          justifyContent: "center",
          alignItems: "stretch",
        }}
      >
        {/* Card 1: Vultr Cloud Compute Instance */}
        <div
          style={{
            flex: 1.2,
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            border: "1.5px solid rgba(0, 123, 252, 0.4)",
            borderRadius: 24,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            opacity: vmImageProgress,
            transform: `translateY(${(1 - vmImageProgress) * 50 + subtleFloat}px)`,
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
            <div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#38bdf8",
                  letterSpacing: "0.06em",
                }}
              >
                VULTR CLOUD COMPUTE
              </span>
              <h3 style={{ fontSize: 22, margin: "4px 0 0 0" }}>Live VM: 155.138.217.237</h3>
            </div>
            <span
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                backgroundColor: "rgba(34, 197, 94, 0.2)",
                color: "#4ade80",
                fontSize: 13,
                fontWeight: 750,
                border: "1px solid rgba(34, 197, 94, 0.4)",
              }}
            >
              ● Running
            </span>
          </div>

          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              marginBottom: 16,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <Img
              src={staticFile("vultr_instance.png")}
              style={{ width: "100%", display: "block" }}
            />
          </div>

          <p style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
            Ubuntu 24.04 LTS instance running the FastAPI Control Plane and the local Docker worker daemon on a private subnet.
          </p>
        </div>

        {/* Card 2: Vultr Serverless Inference */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            border: "1.5px solid rgba(139, 92, 246, 0.4)",
            borderRadius: 24,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            opacity: inferenceProgress,
            transform: `translateY(${(1 - inferenceProgress) * 50 - subtleFloat}px)`,
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
            <div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#a78bfa",
                  letterSpacing: "0.06em",
                }}
              >
                VULTR SERVERLESS INFERENCE
              </span>
              <h3 style={{ fontSize: 22, margin: "4px 0 0 0" }}>DeepSeek v4.1 Flash</h3>
            </div>
            <span
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                backgroundColor: "rgba(139, 92, 246, 0.2)",
                color: "#c4b5fd",
                fontSize: 13,
                fontWeight: 750,
                border: "1px solid rgba(139, 92, 246, 0.4)",
              }}
            >
              Active
            </span>
          </div>

          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              marginBottom: 16,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <Img
              src={staticFile("vultr_inference.png")}
              style={{ width: "100%", display: "block" }}
            />
          </div>

          <p style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
            Ultra-fast token synthesis for task planning, reasoning, and generating verifiable Python operations.
          </p>
        </div>

        {/* Card 3: Vultr Object Storage */}
        <div
          style={{
            flex: 1.1,
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            border: "1.5px solid rgba(234, 179, 8, 0.4)",
            borderRadius: 24,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            opacity: storageProgress,
            transform: `translateY(${(1 - storageProgress) * 50 + subtleFloat}px)`,
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
            <div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#facc15",
                  letterSpacing: "0.06em",
                }}
              >
                VULTR OBJECT STORAGE
              </span>
              <h3 style={{ fontSize: 22, margin: "4px 0 0 0" }}>atl2.vultrobjects.com</h3>
            </div>
            <span
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                backgroundColor: "rgba(234, 179, 8, 0.2)",
                color: "#fde047",
                fontSize: 13,
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
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              marginBottom: 16,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <Img
              src={frame > 520 ? staticFile("vultr_storage_manage.png") : staticFile("vultr_buckets.png")}
              style={{
                width: "100%",
                display: "block",
                transition: "opacity 0.4s ease-in-out",
              }}
            />
          </div>

          <p style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
            Dedicated buckets: <code>latch-apis</code> (31 specs), <code>latch-receipts</code> (12 proofs), and <code>latch-skills</code> (15 lessons).
          </p>
        </div>
      </div>

      <Subtitle text="Latch is built ground up on Vultr: Cloud Compute at 155.138.217.237, Serverless Inference with DeepSeek, and S3 Storage." />
    </div>
  );
};

