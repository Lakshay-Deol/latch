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
    frame: frame - 60,
    fps,
    config: { damping: 15 },
  });
  const card2Progress = spring({
    frame: frame - 120,
    fps,
    config: { damping: 15 },
  });
  const card3Progress = spring({
    frame: frame - 180,
    fps,
    config: { damping: 15 },
  });

  const starRotation = interpolate(frame, [0, 810], [0, 180]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#160e0b",
        backgroundImage:
          "radial-gradient(circle at 50% 30%, rgba(184, 86, 50, 0.18) 0%, transparent 70%)",
        color: "#fff6ed",
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
      <Audio src={staticFile("voice_phase1.wav")} />
      <Audio src={staticFile("whoosh.wav")} volume={0.15} />

      {/* Top Header Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 24px",
          borderRadius: 999,
          backgroundColor: "rgba(184, 86, 50, 0.15)",
          border: "1px solid rgba(232, 161, 123, 0.3)",
          marginBottom: 32,
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
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#e8a17b",
          }}
        >
          Phase 1 · The Agent Containment Crisis
        </span>
      </div>

      {/* Hero Headline */}
      <div
        style={{
          transform: `scale(${titleScale})`,
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        <h1
          style={{
            fontSize: 72,
            fontWeight: 850,
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
          }}
        >
          Containment isn't a feature.
        </h1>
        <h1
          style={{
            fontSize: 72,
            fontWeight: 850,
            margin: 0,
            lineHeight: 1.1,
            color: "#e8a17b",
            fontStyle: "italic",
          }}
        >
          It's the product.
        </h1>
      </div>

      {/* Visual Center with Metallic Star */}
      <div style={{ marginBottom: 44 }}>
        <MetallicStar size={130} rotation={starRotation} />
      </div>

      {/* 3 Vulnerability Cards showing why uncontained agents fail */}
      <div
        style={{
          display: "flex",
          gap: 32,
          width: "100%",
          maxWidth: 1400,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            flex: 1,
            padding: 32,
            borderRadius: 24,
            backgroundColor: "rgba(25, 16, 12, 0.9)",
            border: "1.5px solid rgba(239, 68, 68, 0.4)",
            boxShadow: "0 16px 32px rgba(0,0,0,0.4)",
            opacity: card1Progress,
            transform: `translateY(${(1 - card1Progress) * 40}px)`,
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: 8,
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              color: "#f87171",
              fontSize: 13,
              fontWeight: 800,
              marginBottom: 12,
            }}
          >
            CRITICAL RISK #1
          </div>
          <h3 style={{ fontSize: 24, margin: "0 0 10px 0" }}>Secret Exfiltration</h3>
          <p style={{ fontSize: 16, color: "#d9c6ba", lineHeight: 1.5, margin: 0 }}>
            Unconstrained agents access <code>/proc/1/environ</code>, leaking cloud credentials, API keys, and internal secrets.
          </p>
        </div>

        <div
          style={{
            flex: 1,
            padding: 32,
            borderRadius: 24,
            backgroundColor: "rgba(25, 16, 12, 0.9)",
            border: "1.5px solid rgba(239, 68, 68, 0.4)",
            boxShadow: "0 16px 32px rgba(0,0,0,0.4)",
            opacity: card2Progress,
            transform: `translateY(${(1 - card2Progress) * 40}px)`,
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: 8,
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              color: "#f87171",
              fontSize: 13,
              fontWeight: 800,
              marginBottom: 12,
            }}
          >
            CRITICAL RISK #2
          </div>
          <h3 style={{ fontSize: 24, margin: "0 0 10px 0" }}>Runaway Fork Bombs</h3>
          <p style={{ fontSize: 16, color: "#d9c6ba", lineHeight: 1.5, margin: 0 }}>
            Without kernel cgroup PID ceilings, infinite loops spawn subshell cascades that crash the host operating system.
          </p>
        </div>

        <div
          style={{
            flex: 1,
            padding: 32,
            borderRadius: 24,
            backgroundColor: "rgba(25, 16, 12, 0.9)",
            border: "1.5px solid rgba(239, 68, 68, 0.4)",
            boxShadow: "0 16px 32px rgba(0,0,0,0.4)",
            opacity: card3Progress,
            transform: `translateY(${(1 - card3Progress) * 40}px)`,
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: 8,
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              color: "#f87171",
              fontSize: 13,
              fontWeight: 800,
              marginBottom: 12,
            }}
          >
            CRITICAL RISK #3
          </div>
          <h3 style={{ fontSize: 24, margin: "0 0 10px 0" }}>Fragile DOM Bots</h3>
          <p style={{ fontSize: 16, color: "#d9c6ba", lineHeight: 1.5, margin: 0 }}>
            Visual clicking fails on minor UI shifts and trips anti-bot challenges. Latch replaces bots with typed Python APIs.
          </p>
        </div>
      </div>

      <Subtitle text="As AI agents transition to executing real commands, uncontained access is dangerous. At Latch, containment is the product." />
    </div>
  );
};

