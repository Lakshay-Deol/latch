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

export const Phase3Synthesis: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const flowStep1 = spring({ frame: frame - 10, fps, config: { damping: 14 } });
  const flowStep2 = spring({ frame: frame - 70, fps, config: { damping: 14 } });
  const flowStep3 = spring({ frame: frame - 130, fps, config: { damping: 14 } });
  const approvalProgress = spring({ frame: frame - 190, fps, config: { damping: 14 } });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#130f1d",
        backgroundImage:
          "radial-gradient(circle at 50% 30%, rgba(139, 92, 246, 0.22) 0%, transparent 70%)",
        color: "#ffffff",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        position: "relative",
        padding: "70px 90px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile("voice_phase3.wav")} />
      <Audio src={staticFile("click.wav")} volume={0.2} />

      {/* Top Header Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 24px",
          borderRadius: 999,
          backgroundColor: "rgba(139, 92, 246, 0.15)",
          border: "1px solid rgba(139, 92, 246, 0.4)",
          marginBottom: 24,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "#a78bfa",
          }}
        />
        <span
          style={{
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#c4b5fd",
          }}
        >
          Phase 3 · DeepSeek v4.1 & Autonomous Synthesis
        </span>
      </div>

      <h1
        style={{
          fontSize: 54,
          fontWeight: 850,
          margin: "0 0 40px 0",
          letterSpacing: "-0.02em",
          textAlign: "center",
        }}
      >
        From Fragile DOM Bots to <span style={{ color: "#a78bfa" }}>Deterministic APIs</span>
      </h1>

      {/* Synthesis Flow Architecture */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          width: "100%",
          maxWidth: 1450,
          marginBottom: 44,
        }}
      >
        {/* Step 1 */}
        <div
          style={{
            flex: 1,
            padding: 28,
            borderRadius: 20,
            backgroundColor: "rgba(25, 20, 38, 0.9)",
            border: "1.5px solid rgba(255,255,255,0.12)",
            opacity: flowStep1,
            transform: `scale(${0.9 + 0.1 * flowStep1})`,
          }}
        >
          <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 700 }}>STEP 1</span>
          <h3 style={{ fontSize: 22, margin: "6px 0 10px 0" }}>Web Exploration</h3>
          <p style={{ fontSize: 15, color: "#cbd5e1", lineHeight: 1.5, margin: 0 }}>
            DeepSeek explores the target app once in an isolated sandbox, analyzing HTTP traces and auth structures.
          </p>
        </div>

        <div style={{ fontSize: 32, color: "#a78bfa", opacity: flowStep2 }}>→</div>

        {/* Step 2 */}
        <div
          style={{
            flex: 1.2,
            padding: 28,
            borderRadius: 20,
            backgroundColor: "rgba(35, 25, 58, 0.95)",
            border: "1.5px solid rgba(139, 92, 246, 0.5)",
            boxShadow: "0 12px 30px rgba(139, 92, 246, 0.25)",
            opacity: flowStep2,
            transform: `scale(${0.9 + 0.1 * flowStep2})`,
          }}
        >
          <span style={{ fontSize: 13, color: "#c4b5fd", fontWeight: 800 }}>STEP 2 · VULTR INFERENCE</span>
          <h3 style={{ fontSize: 22, margin: "6px 0 10px 0" }}>Synthesized Python Code</h3>
          <pre
            style={{
              backgroundColor: "rgba(0,0,0,0.5)",
              padding: 14,
              borderRadius: 12,
              fontFamily: "monospace",
              fontSize: 13,
              color: "#a7f3d0",
              margin: 0,
            }}
          >
            {`def run(session, query="travel"):
    return runtime.request("GET", url,
        params={"q": query})`}
          </pre>
        </div>

        <div style={{ fontSize: 32, color: "#a78bfa", opacity: flowStep3 }}>→</div>

        {/* Step 3 */}
        <div
          style={{
            flex: 1,
            padding: 28,
            borderRadius: 20,
            backgroundColor: "rgba(25, 20, 38, 0.9)",
            border: "1.5px solid rgba(255,255,255,0.12)",
            opacity: flowStep3,
            transform: `scale(${0.9 + 0.1 * flowStep3})`,
          }}
        >
          <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 700 }}>STEP 3</span>
          <h3 style={{ fontSize: 22, margin: "6px 0 10px 0" }}>OpenAPI 3.1 & MCP</h3>
          <p style={{ fontSize: 15, color: "#cbd5e1", lineHeight: 1.5, margin: 0 }}>
            Verified tools published to Vultr S3, instantly ready for Claude Code, Cursor, and any MCP agent.
          </p>
        </div>
      </div>

      {/* Operator Approval Queue Banner */}
      <div
        style={{
          width: "100%",
          maxWidth: 1450,
          padding: "20px 32px",
          borderRadius: 20,
          backgroundColor: "rgba(184, 86, 50, 0.15)",
          border: "1.5px solid rgba(232, 161, 123, 0.4)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: approvalProgress,
          transform: `translateY(${(1 - approvalProgress) * 20}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: "#b85632",
              display: "grid",
              placeItems: "center",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            !
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 18 }}>Human-in-the-Loop Operator Gate</h4>
            <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#fed7aa" }}>
              Irreversible destructive writes (payments, reservations, deletions) halt for explicit human approval before execution.
            </p>
          </div>
        </div>
        <div
          style={{
            padding: "8px 20px",
            borderRadius: 12,
            backgroundColor: "#22c55e",
            color: "#052e16",
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          Approve & Sign
        </div>
      </div>

      <Subtitle text="DeepSeek v4.1 synthesizes typed Python operations. Session cookies never touch LLM prompts—agents only receive scoped Bearer keys." />
    </div>
  );
};

