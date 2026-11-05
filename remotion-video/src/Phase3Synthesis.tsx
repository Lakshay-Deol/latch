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

  const titleProgress = spring({ frame, fps, config: { damping: 14 } });
  const terminalProgress = spring({ frame: frame - 30, fps, config: { damping: 12 } });
  const codeProgress = spring({ frame: frame - 120, fps, config: { damping: 12 } });
  const executionProgress = spring({ frame: frame - 280, fps, config: { damping: 12 } });

  // Code typing effect simulation
  const codeSnippet = `def run(session, category="travel"):
    """Synthesized by DeepSeek v4.1 on Vultr"""
    url = f"https://books.toscrape.com/catalogue/category/books/{category}_2/index.html"
    resp = session.get(url, timeout=8.0)
    return parse_catalog(resp.text) # 20 verified items`;

  const charsToShow = Math.floor(
    interpolate(frame, [120, 320], [0, codeSnippet.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

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
      <Audio src={staticFile("voice_phase3.mp3")} />
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
        Live Interactive Demo:{" "}
        <span
          style={{
            background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Autonomous Sandboxed Execution
        </span>
      </h1>

      {/* Interactive Demo Split Layout */}
      <div
        style={{
          display: "flex",
          gap: 24,
          width: "100%",
          maxWidth: 1680,
          alignItems: "stretch",
        }}
      >
        {/* Left Side: Goal Input & Sandboxed Pipeline Status */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(22, 20, 18, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderTop: "2px solid #b85632",
            borderRadius: 22,
            padding: 28,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            boxShadow: "0 20px 45px rgba(0,0,0,0.6)",
            opacity: terminalProgress,
            transform: `translateY(${(1 - terminalProgress) * 30}px)`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#e8a17b", letterSpacing: "0.06em" }}>
              STEP 1 · USER PROMPT & TARGET
            </span>
            <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 999, backgroundColor: "rgba(184, 86, 50, 0.2)", color: "#e8a17b", fontWeight: 700 }}>
              books.toscrape.com
            </span>
          </div>

          {/* Simulated Input Field */}
          <div
            style={{
              padding: "14px 20px",
              borderRadius: 14,
              backgroundColor: "rgba(15, 13, 12, 0.9)",
              border: "1px solid rgba(232, 161, 123, 0.3)",
              fontSize: 16,
              color: "#fcf8f5",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ color: "#38bdf8", fontWeight: 700 }}>POST</span>
            <span style={{ fontFamily: "monospace" }}>/v1/toscrape.com/search_books(category="travel")</span>
          </div>

          {/* DeepSeek Synthesis Step */}
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#c084fc", letterSpacing: "0.06em" }}>
                STEP 2 · VULTR INFERENCE (DEEPSEEK v4.1)
              </span>
              <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>
                Synthesized in 380ms
              </span>
            </div>

            {/* Code Box with typing animation */}
            <div
              style={{
                borderRadius: 14,
                backgroundColor: "#09090b",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                padding: 18,
                fontFamily: "monospace",
                fontSize: 14,
                lineHeight: 1.6,
                color: "#e2e8f0",
                minHeight: 130,
                opacity: codeProgress,
              }}
            >
              <pre style={{ margin: 0 }}>
                <code>{codeSnippet.slice(0, charsToShow)}</code>
                {charsToShow < codeSnippet.length && (
                  <span style={{ backgroundColor: "#38bdf8", display: "inline-block", width: 8, height: 16 }} />
                )}
              </pre>
            </div>
          </div>

          {/* Human-in-the-Loop Operator Gate */}
          <div
            style={{
              marginTop: "auto",
              padding: "12px 18px",
              borderRadius: 14,
              backgroundColor: "rgba(22, 20, 18, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fdfbf7" }}>Operator Approval Gate</div>
              <div style={{ fontSize: 12, color: "#a8a29e" }}>Irreversible mutations require human sign-off</div>
            </div>
            <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 8, backgroundColor: "rgba(34, 197, 94, 0.2)", color: "#4ade80", fontWeight: 700 }}>
              AUTO-GATED
            </span>
          </div>
        </div>

        {/* Right Side: Air-Gapped MicroVM Execution & Real Results */}
        <div
          style={{
            flex: 1.1,
            backgroundColor: "rgba(22, 20, 18, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderTop: "2px solid #22c55e",
            borderRadius: 22,
            padding: 28,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            boxShadow: "0 20px 45px rgba(0,0,0,0.6)",
            opacity: executionProgress,
            transform: `translateY(${(1 - executionProgress) * 30}px)`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#4ade80", letterSpacing: "0.06em" }}>
              STEP 3 · DISPOSABLE VULTR RUNNER EXECUTION
            </span>
            <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 999, backgroundColor: "rgba(34, 197, 94, 0.2)", color: "#4ade80", fontWeight: 700 }}>
              CONTAINMENT ACTIVE
            </span>
          </div>

          {/* Sandbox Kernel Badges */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span style={{ padding: "4px 10px", borderRadius: 8, backgroundColor: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, color: "#38bdf8", fontFamily: "monospace" }}>
              network: none
            </span>
            <span style={{ padding: "4px 10px", borderRadius: 8, backgroundColor: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, color: "#facc15", fontFamily: "monospace" }}>
              memory: 512MB
            </span>
            <span style={{ padding: "4px 10px", borderRadius: 8, backgroundColor: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, color: "#4ade80", fontFamily: "monospace" }}>
              pids_limit: 128
            </span>
            <span style={{ padding: "4px 10px", borderRadius: 8, backgroundColor: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, color: "#f87171", fontFamily: "monospace" }}>
              env: {} (0 secrets)
            </span>
          </div>

          {/* Real JSON Output Box */}
          <div
            style={{
              borderRadius: 14,
              backgroundColor: "#09090b",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              padding: 16,
              fontFamily: "monospace",
              fontSize: 13,
              lineHeight: 1.5,
              color: "#4ade80",
              overflow: "hidden",
            }}
          >
            <div style={{ color: "#94a3b8", marginBottom: 6 }}>// HTTP 200 OK · Execution Time: 410ms</div>
            <pre style={{ margin: 0 }}>
{`{
  "status": "success",
  "category": "travel",
  "count": 20,
  "books": [
    { "id": "b_1", "title": "It's Only the Himalayas", "price": "£45.17", "in_stock": true },
    { "id": "b_2", "title": "Full Moon over Noah's Ark", "price": "£49.43", "in_stock": true }
  ]
}`}
            </pre>
          </div>

          {/* Cryptographic Proof Output */}
          <div
            style={{
              marginTop: "auto",
              padding: "12px 18px",
              borderRadius: 14,
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#38bdf8" }}>VULTR S3 SIGNED RECEIPT</div>
              <div style={{ fontSize: 11, fontFamily: "monospace", color: "#cbd5e1" }}>
                SHA-256: af0d03b56bbe0a1a278a9f9ab6a2554a...
              </div>
            </div>
            <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, backgroundColor: "rgba(56, 189, 248, 0.2)", color: "#38bdf8", fontWeight: 700 }}>
              STORED IN S3
            </span>
          </div>
        </div>
      </div>

      <Subtitle text="DeepSeek v4.1 synthesizes typed Python operations. The agent extracts verified data inside an air-gapped sandbox without exposed secrets." />
    </div>
  );
};
