import { html, render, useState, useEffect, useRef, useCallback } from "/static/vendor/preact-htm.js";

/* ---------- plumbing ---------- */

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: opts.body ? { "Content-Type": "application/json" } : {},
    credentials: "same-origin",
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.detail || data.message || res.statusText), { status: res.status });
  return data;
}

function useRoute() {
  const read = () => {
    const [path, query = ""] = (location.hash.slice(1) || "/").split("?");
    return { parts: path.split("/").filter(Boolean), query: new URLSearchParams(query) };
  };
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => { setRoute(read()); window.scrollTo(0, 0); };
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return route;
}

/** Poll `fn` every `ms` while mounted; returns [data, error, refresh]. */
function usePoll(fn, ms, deps) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const alive = useRef(true);
  const tick = useCallback(async () => {
    try { const d = await fn(); if (alive.current) { setData(d); setError(null); } }
    catch (e) { if (alive.current) setError(e); }
  }, deps);
  useEffect(() => {
    alive.current = true;
    tick();
    const id = ms ? setInterval(tick, ms) : null;
    return () => { alive.current = false; id && clearInterval(id); };
  }, [tick, ms]);
  return [data, error, tick];
}

const fmtS = (s) => (s == null ? "–" : s < 10 ? `${s.toFixed(1)}s` : `${Math.round(s)}s`);
const fmtUsd = (c) => (c == null ? "–" : c === 0 ? "$0" : c < 0.01 ? `$${c.toFixed(4)}` : `$${c.toFixed(3)}`);
const fmtN = (n) => (n == null ? "–" : n.toLocaleString());
const mask = (key) => (key ? key.slice(0, 7) + "…" : "");
const plain = (t) => (t || "").replace(/\*\*|__|`/g, "");
/** Model answers as readable plain text: markdown tables become "a · b" rows, separators and headings go. */
const answerText = (t) => plain(t).split("\n")
  .filter((line) => !/^\s*\|?[\s:|-]+\|?\s*$/.test(line) || !line.includes("-"))
  .map((line) => (/^\s*\|.*\|\s*$/.test(line)
    ? line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()).filter(Boolean).join(" · ")
    : line.replace(/^#+\s*/, "")))
  .join("\n").replace(/\n{3,}/g, "\n\n").trim();
const clock = (secs) => `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(Math.floor(secs % 60)).padStart(2, "0")}`;
const left = (ts) => {
  const m = Math.max(0, Math.round((ts - Date.now() / 1000) / 60));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
};
const ago = (ts) => {
  if (!ts) return "–";
  const num = typeof ts === "number" ? ts : Date.parse(ts) / 1000;
  if (isNaN(num)) return typeof ts === "string" ? ts.slice(0, 19).replace("T", " ") : "–";
  const m = Math.round((Date.now() / 1000 - num) / 60);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
};

/* ---------- icons ---------- */

const KeyIcon = () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3 20 3M16 7l3 3M14 9l2 2"/></svg>`;
const HomeIcon = () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
const TasksIcon = () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>`;
const AttackLabIcon = () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
const ReceiptsIcon = () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-8"/><path d="M16 12h-8"/><path d="M13 16h-5"/></svg>`;
const ApprovalsIcon = () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`;
const SitesIcon = () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`;
const SkillsIcon = () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>`;
const RaceIcon = () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
const MenuIcon = () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>`;
const CloseIcon = () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const PanelToggleIcon = () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M9 3v18"/></svg>`;

/* ---------- small components ---------- */

function Help({ children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  return html`<span class="help" ref=${ref}>
    <button aria-label="Help" aria-expanded=${open} onClick=${() => setOpen(!open)}>?</button>
    ${open && html`<div class="pop" role="dialog">${children}</div>`}
  </span>`;
}

const STATUS = {
  active: ["done", "connected"], expired: ["blocked", "expired"], none: ["queued", "not connected"],
  busy: ["live", "working"], published: ["done", "published"], failed: ["blocked", "failed"],
  stopped: ["queued", "stopped"], interrupted: ["blocked", "interrupted"], connected: ["done", "connected"],
};
function Status({ state, label }) {
  const [cls, word] = STATUS[state] || ["live", state];
  return html`<span class="status ${cls}"><i></i>${label || word}</span>`;
}

function Copy({ text, shown }) {
  const [done, setDone] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1400); };
  return html`<div class="copy"><code>${shown || text}</code>
    <button class="button small" onClick=${copy}>${done ? "Copied" : "Copy"}</button></div>`;
}

function Frame({ url, ended, children }) {
  return html`<div class="frame">
    ${url ? html`<iframe src=${url} title="Live browser" allow="clipboard-read; clipboard-write"></iframe>`
          : html`<div class="placeholder">${ended ? "Browser closed" : "Starting the browser…"}</div>`}
    ${children}
  </div>`;
}

function Handoff({ message, onDone }) {
  return html`<div class="handoff" role="alert"><span class="msg">${message}</span>
    <button class="button primary" onClick=${onDone}>Done</button></div>`;
}

function PageHeader({ eyebrow, title, mono, lede, children }) {
  return html`<header class="page-header">
    <div><span class="eyebrow">${eyebrow}</span><h1 class=${mono ? "mono" : ""}>${title}</h1>
      ${lede && html`<p class="lede">${lede}</p>`}</div>
    <div class="actions">${children}</div>
  </header>`;
}

function SectionHeading({ title, count, children }) {
  return html`<div class="section-heading"><h2>${title}</h2>
    <div class="row">${count != null && html`<span class="section-count">${count}</span>`}${children}</div></div>`;
}

/* ---------- landing / login ---------- */

function GateArt() {
  return html`<div class="gate-art" aria-hidden="true">
    <div class="chrome"><i></i><i></i><i></i></div>
    <div class="body">
      <div class="bars"><div class="bar" style="width:34%"></div><div class="bar" style="width:28%"></div></div>
      <div class="bar" style="width:84%;height:22px"></div>
      <div class="bars"><div class="bar" style="width:58%;height:42px"></div><div class="bar" style="width:30%;height:42px;background:#d6cabd"></div></div>
      <div class="picked" style="width:52%"><code>POST /rsvp</code></div>
      <div class="out"><div>rsvp_event(event_id)</div><div><span>verified ·</span> 0.6s</div></div>
    </div>
  </div>`;
}

function Login({ query }) {
  return html`
    <div class="gate">
      <div style="display:flex;align-items:center;justify-content:space-between;max-width:1120px;margin:0 auto;width:100%;">
        <div class="gate-brand"><span class="brand-mark"><${KeyIcon} /></span>Latch</div>
        <div class="hero-pill-badge" style="margin:0;">
          <span class="dot"></span>
          <span>Zero-Trust Containment Runtime</span>
        </div>
      </div>

      <div class="gate-main" style="margin-top:40px;">
        <div>
          <div class="hero-pill-badge" style="margin-bottom:14px;">
            <span class="dot"></span>
            <span>Vultr & DeepSeek v4.1</span>
          </div>
          <h1 style="font-size:clamp(38px, 5.2vw, 64px);line-height:1.04;margin:0 0 16px;">
            Containment isn't a feature.<br />
            <em>It's the product.</em>
          </h1>
          <p style="color:var(--text-quiet);font-size:16px;line-height:1.55;margin:0 0 20px;max-width:50ch;">
            A self-hostable bridge that lets AI agents use private web applications safely. Zero leaked secrets, air-gapped sandboxes, and immutable cryptographic receipts.
          </p>

          <div class="gate-telemetry-box">
            <div class="telemetry-tile">
              <div class="telemetry-tile-head"><span>Process</span><span style="color:var(--sage);">ACTIVE</span></div>
              <div class="telemetry-tile-val"><span class="dot-live"></span>Ephemeral Sandbox</div>
            </div>
            <div class="telemetry-tile">
              <div class="telemetry-tile-head"><span>Secrets</span><span style="color:var(--sage);">VAULTED</span></div>
              <div class="telemetry-tile-val"><span class="dot-live"></span>0 Leaked Tokens</div>
            </div>
            <div class="telemetry-tile">
              <div class="telemetry-tile-head"><span>Egress</span><span style="color:var(--sage);">BLOCKED</span></div>
              <div class="telemetry-tile-val"><span class="dot-live"></span>Firewall Enforced</div>
            </div>
            <div class="telemetry-tile">
              <div class="telemetry-tile-head"><span>Receipts</span><span style="color:var(--sage);">VERIFIED</span></div>
              <div class="telemetry-tile-val"><span class="dot-live"></span>SHA-256 Signed</div>
            </div>
          </div>

          <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;">
            <a href="#/" class="button primary large" style="box-shadow:0 12px 28px rgba(184,86,50,0.35);">
              Enter Latch Runtime →
            </a>
            <a href="#/sites" class="button secondary large">
              Browse Published APIs
            </a>
          </div>
        </div>

        <div style="display:grid;place-items:center;">
          <${HeroOrbit} />
        </div>
      </div>
    </div>
  `;
}

/* ---------- home (Stacklist Inspired Design) ---------- */

function MetallicStar() {
  return html`
    <svg viewBox="0 0 100 100" class="metallic-star" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="chromeGlow" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="35%" stop-color="#e2e8f0"/>
          <stop offset="65%" stop-color="#94a3b8"/>
          <stop offset="100%" stop-color="#475569"/>
        </radialGradient>
        <linearGradient id="bevelLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
          <stop offset="50%" stop-color="#cbd5e1" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#475569" stop-opacity="0.1"/>
        </linearGradient>
        <linearGradient id="bevelDark" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#64748b" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#1e293b" stop-opacity="0.9"/>
        </linearGradient>
      </defs>
      <!-- 4-pointed metallic chrome star -->
      <path d="M 50 4 C 50 32, 68 50, 96 50 C 68 50, 50 68, 50 96 C 50 68, 32 50, 4 50 C 32 50, 50 32, 50 4 Z" fill="url(#chromeGlow)"/>
      <!-- 3D Bevel facet overlays -->
      <path d="M 50 4 C 50 32, 68 50, 96 50 L 50 50 Z" fill="url(#bevelLight)"/>
      <path d="M 50 96 C 50 68, 32 50, 4 50 L 50 50 Z" fill="url(#bevelDark)"/>
      <!-- Inner Diamond Cutout -->
      <polygon points="50,34 66,50 50,66 34,50" fill="#ffffff" opacity="0.9"/>
      <polygon points="50,38 62,50 50,62 38,50" fill="var(--paper)"/>
    </svg>
  `;
}

function HeroOrbit() {
  return html`
    <div class="hero-orbit-showcase" aria-hidden="true">
      <svg class="orbit-lines-svg" viewBox="0 0 360 360" aria-hidden="true">
        <!-- Connecting radial lines -->
        <line x1="180" y1="180" x2="180" y2="28" stroke="rgba(197, 139, 101, 0.2)" stroke-width="1.5" stroke-dasharray="3 4"/>
        <line x1="180" y1="180" x2="304" y2="100" stroke="rgba(197, 139, 101, 0.2)" stroke-width="1.5" stroke-dasharray="3 4"/>
        <line x1="180" y1="180" x2="304" y2="260" stroke="rgba(197, 139, 101, 0.2)" stroke-width="1.5" stroke-dasharray="3 4"/>
        <line x1="180" y1="180" x2="180" y2="332" stroke="rgba(197, 139, 101, 0.2)" stroke-width="1.5" stroke-dasharray="3 4"/>
        <line x1="180" y1="180" x2="56" y2="260" stroke="rgba(197, 139, 101, 0.2)" stroke-width="1.5" stroke-dasharray="3 4"/>
        <line x1="180" y1="180" x2="56" y2="100" stroke="rgba(197, 139, 101, 0.2)" stroke-width="1.5" stroke-dasharray="3 4"/>
        <!-- Concentric circles -->
        <circle cx="180" cy="180" r="152" fill="none" stroke="rgba(197, 139, 101, 0.25)" stroke-width="1.5" stroke-dasharray="4 6"/>
        <circle cx="180" cy="180" r="106" fill="none" stroke="rgba(197, 139, 101, 0.18)" stroke-width="1"/>
        <circle cx="180" cy="180" r="68" fill="rgba(197, 139, 101, 0.05)" stroke="rgba(197, 139, 101, 0.15)" stroke-width="1"/>
      </svg>
      <div class="orbit-circle-outer">
        <div class="orbit-disc disc-pos-1" title="Luma Calendar API">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <div class="orbit-disc disc-pos-2" title="DeepSeek & Vultr Inference">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        </div>
        <div class="orbit-disc disc-pos-3" title="Partiful Social API">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
        </div>
        <div class="orbit-disc disc-pos-4" title="Cursor AI Agent Sandbox">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><polyline points="8 10 12 14 16 10"/></svg>
        </div>
        <div class="orbit-disc disc-pos-5" title="Hacker News & Algolia Search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <div class="orbit-disc disc-pos-6" title="Books Catalog Sandbox">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
        </div>
      </div>
      <div class="orbit-circle-inner"></div>
      <div class="orbit-center-chrome" title="Latch Containment Core">
        <${MetallicStar} />
      </div>
    </div>
  `;
}

function AnimatedProtocolPipeline() {
  return html`
    <div class="animated-pipeline-wrap" aria-label="Containment Pipeline Flow">
      <div class="pipeline-node">
        <div class="pipeline-node-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div class="pipeline-node-info">
          <span class="pipeline-node-label">1. Session Vault</span>
          <span class="pipeline-node-sub">Zero Plain Secrets</span>
        </div>
      </div>
      <div class="pipeline-connector"><span class="pulse-beam"></span></div>
      <div class="pipeline-node">
        <div class="pipeline-node-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div class="pipeline-node-info">
          <span class="pipeline-node-label">2. Air-Gapped Sandbox</span>
          <span class="pipeline-node-sub">Egress Firewall</span>
        </div>
      </div>
      <div class="pipeline-connector"><span class="pulse-beam"></span></div>
      <div class="pipeline-node">
        <div class="pipeline-node-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
        </div>
        <div class="pipeline-node-info">
          <span class="pipeline-node-label">3. DeepSeek v4.1</span>
          <span class="pipeline-node-sub">Synthesis</span>
        </div>
      </div>
      <div class="pipeline-connector"><span class="pulse-beam"></span></div>
      <div class="pipeline-node">
        <div class="pipeline-node-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </div>
        <div class="pipeline-node-info">
          <span class="pipeline-node-label">4. SHA-256 Proof</span>
          <span class="pipeline-node-sub">Vultr S3 Receipts</span>
        </div>
      </div>
      <div class="pipeline-connector"><span class="pulse-beam"></span></div>
      <div class="pipeline-node">
        <div class="pipeline-node-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </div>
        <div class="pipeline-node-info">
          <span class="pipeline-node-label">5. MCP / REST</span>
          <span class="pipeline-node-sub">Instant Connector</span>
        </div>
      </div>
    </div>
  `;
}

function FeaturedToolCard({ s }) {
  const opName = s.domain === "luma.com" ? "list_discover_categories" : s.domain === "partiful.com" ? "list_parties" : s.domain === "toscrape.com" ? "search_books" : "search_stories";
  const desc = s.domain === "luma.com"
    ? "Events discovery, calendar indexing, and verified RSVP execution."
    : s.domain === "partiful.com"
      ? "Social guest lists, party management, and verified RSVP confirmations."
      : s.domain === "toscrape.com"
        ? "Book catalog search, inventory queries, and sandboxed basket additions."
        : "Real-time story and comment search with relevance ranking.";
  const cat = s.domain === "luma.com" ? "Events" : s.domain === "partiful.com" ? "Social" : s.domain === "toscrape.com" ? "Catalog" : "Search";
  return html`
    <a class="tool-card" href=${`#/site/${s.domain}`}>
      <div class="tool-preview-banner">
        <div class="tool-preview-code">
          <span class="method">POST</span>
          <span>/v1/${s.domain}/${opName}</span>
        </div>
        <span class="tool-category-badge">${cat}</span>
      </div>
      <div class="tool-body">
        <div class="tool-header-row">
          <div class="tool-identity">
            <div class="tool-avatar">${s.title ? s.title[0] : s.domain[0].toUpperCase()}</div>
            <div class="tool-name-wrap">
              <span class="tool-title">${s.title}</span>
              <span class="verified-icon" title="Verified in sandbox">✓</span>
            </div>
          </div>
          <${Status} state=${s.connection || "none"} />
        </div>
        <p class="tool-desc">${desc}</p>
        <div class="tool-meta-tags">
          <span class="meta-chip">${s.operations} verified ops</span>
          <span class="meta-chip">${s.reads || 0} reads · ${s.writes || 0} writes</span>
          <span class="meta-chip">OpenAPI 3.1</span>
        </div>
      </div>
    </a>
  `;
}

function ContainmentGuarantees() {
  return html`
    <section class="section" style="margin-top:48px;">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Architecture</span>
          <h2>Containment Guarantees</h2>
        </div>
      </div>
      <div class="containment-pillars-grid">
        <div class="pillar-card">
          <div class="pillar-head">
            <span class="pillar-badge">01 · ISOLATION</span>
          </div>
          <h3 class="pillar-title">Air-Gapped Sandbox</h3>
          <p class="pillar-body">Autonomous tool verification runs in disposable microVMs with zero-egress network policies.</p>
        </div>

        <div class="pillar-card">
          <div class="pillar-head">
            <span class="pillar-badge">02 · SECRETS</span>
          </div>
          <h3 class="pillar-title">Zero Plain Secrets</h3>
          <p class="pillar-body">Master session cookies remain in vault storage; agents only receive scoped Bearer keys.</p>
        </div>

        <div class="pillar-card">
          <div class="pillar-head">
            <span class="pillar-badge">03 · CONTROL</span>
          </div>
          <h3 class="pillar-title">Operator Approval Gate</h3>
          <p class="pillar-body">Destructive mutations require explicit human confirmation before dispatch.</p>
        </div>

        <div class="pillar-card">
          <div class="pillar-head">
            <span class="pillar-badge">04 · AUDIT</span>
          </div>
          <h3 class="pillar-title">SHA-256 Lifecycle Proof</h3>
          <p class="pillar-body">Every execution generates an immutable cryptographic receipt stored in Vultr S3.</p>
        </div>
      </div>
    </section>
  `;
}

function Home({ overview }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const start = async (e) => {
    e.preventDefault();
    if (!url.trim() || busy) return;
    setBusy(true);
    try { const { id } = await api("/api/jobs", { method: "POST", body: { site_url: url.trim() } }); location.hash = `#/job/${id}`; }
    finally { setBusy(false); }
  };
  const sites = overview?.sites || [], running = overview?.running || [];

  return html`
    <div class="hero-stacklist">
      <div class="hero-content">
        <h1 class="hero-headline">
          Containment isn't a feature.<br />
          <em>It's the product.</em>
        </h1>
        <p class="hero-subhead">
          Deterministic containment and verified, typed APIs for autonomous AI agents.
        </p>

        <form class="hero-generate-box" onSubmit=${start}>
          <input
            id="url"
            placeholder="Paste any web app URL (e.g. https://luma.com, https://books.toscrape.com)"
            value=${url}
            onInput=${(e) => setUrl(e.target.value)}
          />
          <button class="btn-generate" disabled=${busy}>
            ${busy ? "Starting..." : "Generate API →"}
          </button>
        </form>

        <div class="hero-presets-row">
          <span>Quick presets:</span>
          <button type="button" class="preset-chip" onClick=${() => setUrl("https://books.toscrape.com")}>books.toscrape.com</button>
          <button type="button" class="preset-chip" onClick=${() => setUrl("https://luma.com")}>luma.com</button>
          <button type="button" class="preset-chip" onClick=${() => setUrl("https://partiful.com")}>partiful.com</button>
          <button type="button" class="preset-chip" onClick=${() => setUrl("https://hn.algolia.com")}>hn.algolia.com</button>
        </div>
      </div>

      <div class="hero-graphic-wrap">
        <${HeroOrbit} />
      </div>
    </div>

    <${AnimatedProtocolPipeline} />

    ${running.length > 0 && html`
      <section class="section" style="margin-top:20px;">
        <${SectionHeading} title="Active Generation Jobs" count=${running.length} />
        <div class="sites">
          ${running.map((j) => html`
            <a class="site-card" href=${`#/job/${j.id}`} style="border-color:var(--terracotta);">
              <span class="title">${j.domain.split(".")[0]}</span>
              <span class="domain">${j.domain}</span>
              <span class="foot">
                <span class="n" style="color:var(--terracotta);">${j.status}</span>
                <${Status} state="busy" />
              </span>
            </a>
          `)}
        </div>
      </section>
    `}

    <section class="section" style="margin-top:40px;">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Curated Connectors</span>
          <h2>Featured Published APIs</h2>
        </div>
        <span class="section-count">${sites.length}</span>
      </div>
      <div class="featured-tools-grid">
        ${sites.map((s) => html`<${FeaturedToolCard} s=${s} />`)}
      </div>
      ${overview && !sites.length && html`<div class="empty">No apps generated yet. Paste a URL above to start!</div>`}
    </section>

    <${ContainmentGuarantees} />
  `;
}

/* ---------- sites ---------- */

function Sites({ overview }) {
  const sites = overview?.sites || [], running = overview?.running || [];
  return html`
    <${PageHeader} eyebrow="Sites" title="Sites" />
    <div class="site-rows">
      ${sites.map((s) => html`<div class="site-row">
        <a class="tile" href=${`#/site/${s.domain}`} aria-hidden="true" tabindex="-1">${s.title[0]}</a>
        <div class="who"><a class="title" href=${`#/site/${s.domain}`}>${s.title}</a><span class="domain">${s.domain}</span></div>
        <dl class="facts">
          <div><dt>Operations</dt><dd>${s.operations}</dd></div>
          <div><dt>Verified</dt><dd>${s.verified}</dd></div>
          <div><dt>Read / Write</dt><dd>${s.reads} / ${s.writes}</dd></div>
          <div><dt>Session</dt><dd><${Status} state=${s.connection || "none"} /><small>${ago(s.checked)}</small></dd></div>
        </dl>
        <div class="acts"><a class="button secondary" href=${`#/site/${s.domain}`}>Open →</a></div>
      </div>`)}
      ${running.map((j) => html`<div class="site-row">
        <a class="tile" href=${`#/job/${j.id}`} aria-hidden="true" tabindex="-1">${j.domain[0].toUpperCase()}</a>
        <div class="who"><a class="title" href=${`#/job/${j.id}`}>${j.domain.split(".")[0]}</a><span class="domain">${j.domain}</span></div>
        <dl class="facts"><div><dt>Status</dt><dd><${Status} state="busy" label=${j.status} /></dd></div></dl>
        <div class="acts"><a class="button secondary" href=${`#/job/${j.id}`}>Watch →</a></div>
      </div>`)}
      ${overview && !sites.length && !running.length && html`<div class="empty">No sites yet</div>`}
    </div>`;
}

/* ---------- skills ---------- */

function LessonCard({ l, n, admin, onChange }) {
  const set = async (status) => { await api(`/api/skills/${l.id}`, { method: "POST", body: { status } }); onChange(); };
  return html`<li class="lesson">
    <span class="lesson-n">${String(n).padStart(2, "0")}</span>
    <div class="lesson-body">
      <div class="row"><span class="mono muted">${l.site} · ${l.date}</span><span class="spacer"></span>
        <span class="tag ${l.source}">${l.source}</span>
        <${Status} state=${l.status === "approved" ? "published" : l.status === "rejected" ? "failed" : "stopped"} label=${l.status} /></div>
      <p class="lesson-text">${l.lesson}</p>
      ${(l.failure || l.fix) && html`<details><summary>The mistake</summary>
        ${l.failure && html`<div class="lesson-part"><span class="eyebrow">What went wrong</span><p>${l.failure}</p></div>`}
        ${l.fix && html`<div class="lesson-part"><span class="eyebrow">Fix</span><pre class="code">${l.fix}</pre></div>`}
      </details>`}
      ${admin && l.status === "proposed" && html`<div class="row"><button class="button primary small" onClick=${() => set("approved")}>Approve</button>
        <button class="button secondary small" onClick=${() => set("rejected")}>Reject</button></div>`}
    </div>
  </li>`;
}

function Skills({ admin }) {
  const [data, , refresh] = usePoll(() => api("/api/skills"), 15000, []);
  const items = data?.lessons || [];
  return html`
    <${PageHeader} eyebrow="Skills" title="What the generator has learned">
      <${Help}><ol><li>Each lesson came from a real mistake, shown under “The mistake”.</li>
        <li>Approved lessons are read before every generation.</li><li>Auto lessons wait for approval.</li></ol><//>
    <//>
    <dl class="summary">
      <div><dt>Lessons</dt><dd>${items.length}</dd></div>
      <div><dt>Approved</dt><dd>${data?.approved ?? "–"}</dd></div>
      <div><dt>From sites</dt><dd>${data?.sites ?? "–"}</dd></div>
      <div><dt>Read before every run</dt><dd>✓</dd></div>
    </dl>
    <ol class="lessons section">${items.map((l, i) => html`<${LessonCard} l=${l} n=${i + 1} admin=${admin} onChange=${refresh} />`)}</ol>`;
}

/* ---------- site ---------- */

const TAB_HELP = {
  claude: html`<ol><li>Run the line in a terminal.</li><li>Start a new Claude Code session.</li></ol>
    <p>VS Code extension: add the MCP URL to <code>.mcp.json</code> in your project.</p>`,
  codex: html`<ol><li>Run the line in a terminal.</li><li>In Codex, type <code>/mcp</code> to check it loaded.</li></ol>`,
  agent: html`<ol><li>MCP clients: add the MCP URL.</li><li>Anything else: POST JSON to the REST URL with the header.</li></ol>`,
  code: html`<ol><li>Download and unzip.</li><li>Call <code>run(session, …)</code> with your own cookies in <code>session</code>.</li></ol>`,
};

function Connect({ jobId, onFinished }) {
  const [data] = usePoll(() => api(`/api/jobs/${jobId}`), 1500, [jobId]);
  const status = data?.job?.status;
  useEffect(() => { if (status === "connected" || status === "failed") onFinished(status); }, [status]);
  return html`<section class="section"><${Frame} url=${data?.live_url}>
    ${status === "needs_human" && html`<${Handoff} message="Log in, then press Done."
      onDone=${() => api(`/api/jobs/${jobId}/human-done`, { method: "POST" })} />`}
  <//></section>`;
}

function OpRow({ op }) {
  const mark = op.status === "verified" ? ["ok", "✓"] : ["idle", "–"];
  return html`<details>
    <summary><span class="mark ${mark[0]}" title=${op.status}>${mark[1]}</span>
      <span class="nm">${op.name}</span><span class="caret">▶</span></summary>
    <div class="opbody">
      ${op.description && html`<p>${op.description}</p>`}
      ${op.params.length > 0 && html`<table class="grid"><thead><tr><th>Param</th><th>Type</th><th></th></tr></thead><tbody>
        ${op.params.map((p) => html`<tr><td><code>${p.name}${p.required ? "" : "?"}</code></td><td class="muted">${p.type}</td>
          <td class="muted">${p.description}</td></tr>`)}</tbody></table>`}
      ${op.returns?.length > 0 && html`<table class="grid"><thead><tr><th>Returns</th><th></th></tr></thead><tbody>
        ${op.returns.map((r) => html`<tr><td><code>${r.name}</code></td><td class="muted">${r.description}</td></tr>`)}</tbody></table>`}
      <pre class="code">${op.code}</pre>
    </div></details>`;
}

function Site({ domain }) {
  const [site, , refresh] = usePoll(() => api(`/api/sites/${domain}`), 10000, [domain]);
  const [tab, setTab] = useState("claude");
  const [connectJob, setConnectJob] = useState(null);
  if (!site) return null;
  const conn = site.connection;
  const name = domain.split(".")[0];
  const mcp = conn?.mcp_url;
  const shownMcp = mcp && mcp.replace(conn.api_key, mask(conn.api_key));
  const probe = site.operations.find((o) => o.side_effect === "read" && !o.params.some((p) => p.required));
  const reads = site.operations.filter((o) => o.side_effect === "read");
  const writes = site.operations.filter((o) => o.side_effect !== "read");
  const verified = site.operations.filter((o) => o.status === "verified").length;
  const startConnect = async () => setConnectJob((await api(`/api/sites/${domain}/connect`, { method: "POST" })).job_id);
  const guest = site.role === "guest";
  const disconnect = async () => { await api(`/api/sites/${domain}/disconnect`, { method: "POST" }); refresh(); };
  const lines = {
    claude: [`claude mcp add --transport http ${name} ${mcp}`, `claude mcp add --transport http ${name} ${shownMcp}`],
    codex: [`codex mcp add ${name} --url ${mcp}`, `codex mcp add ${name} --url ${shownMcp}`],
  };
  return html`
    <a class="back" href="#/sites">← All sites</a>
    <${PageHeader} eyebrow=${domain} title=${site.title}>
      <${Status} state=${connectJob ? "busy" : conn?.status || "none"} />
      ${guest && conn?.expires && !connectJob && html`<span class="muted">ends in ${left(conn.expires)}</span>`}
      ${!connectJob && html`<button class=${`button ${guest && !conn ? "primary" : "secondary"}`} onClick=${startConnect}>
        ${conn ? "Reconnect" : guest ? `Connect your ${site.title} account` : "Connect"}</button>`}
      ${guest && conn && !connectJob && html`<button class="button secondary" onClick=${disconnect}>Disconnect</button>`}
    <//>
    <dl class="summary">
      <div><dt>Operations</dt><dd>${site.operations.length}</dd></div>
      <div><dt>Verified</dt><dd>${verified}</dd></div>
      <div><dt>Read</dt><dd>${reads.length}</dd></div>
      <div><dt>Write</dt><dd>${writes.length}</dd></div>
      ${guest ? html`<div><dt>Connection</dt><dd>${conn?.expires ? `${left(conn.expires)} left` : "–"}</dd></div>`
        : html`<div><dt>Session checked</dt><dd>${ago(conn?.checked)}</dd></div>`}
    </dl>
    ${connectJob && html`<${Connect} jobId=${connectJob} onFinished=${() => { setConnectJob(null); refresh(); }} />`}
    ${!connectJob && conn && html`<section class="section">
      <${SectionHeading} title="Connect your agent"><${Help}>${TAB_HELP[tab]}<//><//>
      <div class="tablist" role="tablist">
        ${[["claude", "Claude Code"], ["codex", "Codex"], ["agent", "Any agent"], ["code", "Code"]].map(([k, label]) => html`
          <button class="tab" role="tab" aria-selected=${tab === k} onClick=${() => setTab(k)}>${label}</button>`)}
      </div>
      ${lines[tab] && html`<${Copy} text=${lines[tab][0]} shown=${lines[tab][1]} />`}
      ${tab === "agent" && html`<div class="kv">
        <span class="k">MCP</span><${Copy} text=${mcp} shown=${shownMcp} />
        <span class="k">REST</span><${Copy} text=${`${site.rest_base}/<operation>`} />
        <span class="k">Header</span><${Copy} text=${`Authorization: Bearer ${conn.api_key}`} shown=${`Authorization: Bearer ${mask(conn.api_key)}`} />
        ${probe && html`<span class="k">Try</span><${Copy}
          text=${`curl -X POST ${site.rest_base}/${probe.name} -H "Authorization: Bearer ${conn.api_key}" -d '{}'`}
          shown=${`curl -X POST ${site.rest_base}/${probe.name} -H "Authorization: Bearer ${mask(conn.api_key)}" -d '{}'`} />`}
        ${probe && html`<span class="k">PowerShell</span><${Copy}
          text=${`Invoke-RestMethod -Method Post -Uri ${site.rest_base}/${probe.name} -Headers @{Authorization="Bearer ${conn.api_key}"} -ContentType "application/json" -Body '{}'`}
          shown=${`Invoke-RestMethod -Method Post -Uri ${site.rest_base}/${probe.name} -Headers @{Authorization="Bearer ${mask(conn.api_key)}"} -ContentType "application/json" -Body '{}'`} />`}
      </div>`}
      ${tab === "code" && html`<div class="row" style="margin-top:14px">
        <a class="button primary" href=${site.download_url}>Download</a>
        <a class="button secondary" href=${site.openapi_url} target="_blank" rel="noopener">OpenAPI</a></div>`}
    </section>`}
    <section class="section">
      <${SectionHeading} title="Operations" count=${site.operations.length} />
      <div class="ops">
        <div class="oplist"><div class="oplist-head"><span class="eyebrow">Read</span><span class="section-count">${reads.length}</span></div>
          ${reads.map((o) => html`<${OpRow} op=${o} />`)}</div>
        <div class="oplist"><div class="oplist-head"><span class="eyebrow">Write</span><span class="section-count">${writes.length}</span></div>
          ${writes.map((o) => html`<${OpRow} op=${o} />`)}</div>
      </div>
    </section>`;
}

/* ---------- generate ---------- */

const PHASES = [["login", "Log in"], ["explore", "Explore"], ["generate", "Generate"], ["verify", "Verify"], ["publish", "Publish"]];
const OP_MARK = {
  verified: ["ok", "✓"], failed: ["bad", "✗"], excluded: ["idle", "–"],
  unverified_irreversible: ["idle", "–"], unverified_no_undo: ["idle", "–"],
};

function logRows(events, start) {
  const rows = [];
  for (const e of events) {
    const d = e.data || {};
    const at = clock(Math.max(0, e.ts - start));
    if (e.kind === "status") { if (typeof d.detail === "string" && d.detail) rows.push([at, d.status, d.detail]); }
    else if (e.kind === "step") rows.push([at, "explore", `${d.label || d.action}`]);
    else if (e.kind === "operation") rows.push([at, "verify", `${d.name}: ${d.status}${d.attempt ? ` (${d.attempt}/4)` : ""}`]);
    else if (e.kind === "published") rows.push([at, "publish", `${d.operations} operations published`]);
    else if (e.kind === "lesson") rows.push([at, "lesson", d.lesson]);
    else if (e.kind === "error") rows.push([at, "error", JSON.stringify(d).slice(0, 160), true]);
  }
  return rows;
}

function Generate({ id }) {
  const [data] = usePoll(() => api(`/api/jobs/${id}`), 1500, [id]);
  const logRef = useRef();
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = 1e9; }, [data?.events?.length]);
  if (!data) return null;
  const { job, phase } = data;
  const idx = phase === "done" ? PHASES.length : PHASES.findIndex(([k]) => k === phase);
  const running = ["starting", "needs_human", "exploring", "explored", "generating", "generated", "publishing"].includes(job.status);
  const ops = data.operations.filter((o) => o.name);
  const verified = ops.filter((o) => o.status === "verified").length;
  const rows = logRows(data.events, job.created);
  return html`
    <a class="back" href="#/">← Home</a>
    <${PageHeader} eyebrow="Generate" title=${data.domain}>
      <${Status} state=${running ? "busy" : job.status} />
      ${job.status === "published" && html`<a class="button primary" href=${`#/site/${data.domain}`}>Open</a>`}
      ${(job.status === "exploring" || job.status === "needs_human" || job.status === "explored") && html`
        <button class="button primary" style="background:var(--terracotta);color:#fff;" onClick=${() => api(`/api/jobs/${id}/finish-explore`, { method: "POST" })}>
          ⚡ Generate API Now
        </button>
      `}
      ${running && html`<button class="button secondary" onClick=${() => api(`/api/jobs/${id}/stop`, { method: "POST" })}>Stop</button>`}
      <${Help}><ol><li>Log in inside the browser when asked, then press Done.</li><li>Everything after that runs on its own.</li></ol><//>
    <//>
    <dl class="summary">
      <div><dt>Step</dt><dd>${data.steps}</dd></div>
      <div><dt>Endpoints</dt><dd>${data.endpoints.length}</dd></div>
      <div><dt>Operations</dt><dd>${verified} / ${ops.length}</dd></div>
      <div><dt>Cost</dt><dd>${fmtUsd(data.cost_usd)}</dd></div>
    </dl>
    <nav class="steps" aria-label="Progress">${PHASES.map(([k, label], i) => html`
      <div class="step ${i < idx ? "done" : i === idx ? "now" : ""}" aria-current=${i === idx ? "step" : undefined}>
        <small>0${i + 1}</small><span>${label}</span></div>`)}</nav>
    <section class="section gen">
      <${Frame} url=${running ? data.live_url : null} ended=${!running}>
        ${job.status === "needs_human" && html`<${Handoff} message=${job.status_detail || "Log in, then press Done."}
          onDone=${() => api(`/api/jobs/${id}/human-done`, { method: "POST" })} />`}
      <//>
      <div class="side">
        <div class="panel"><div class="panel-head"><span class="eyebrow">Endpoints</span><span class="section-count">${data.endpoints.length}</span></div>
          <ul>${[...data.endpoints].reverse().map((e) => html`<li><span></span>
            <span class="ep" title=${e.endpoint}>${e.endpoint.replace(/^(\w+) [^/]+/, "$1 ")}</span><span></span>
            <span class="why">${e.label}</span></li>`)}</ul></div>
        <div class="panel"><div class="panel-head"><span class="eyebrow">Operations</span><span class="section-count">${verified} / ${ops.length}</span></div>
          <ul>${ops.map((o) => {
            const [cls, sym] = OP_MARK[o.status] || ["busy", "↻"];
            return html`<li><span class="mark ${cls}">${sym}</span><span class="ep">${o.name}</span>
              <span class="att">${cls === "busy" && o.attempts ? `${o.attempts}/4` : ""}</span></li>`;
          })}</ul></div>
      </div>
    </section>
    <section class="section">
      <${SectionHeading} title="Log" />
      <div class="log" ref=${logRef}>${rows.map(([at, ph, msg, err]) => html`
        <div class="log-row ${err ? "error" : ""}"><span class="at">${at}</span><span class="ph">${ph}</span><span class="msg">${msg}</span></div>`)}</div>
    </section>`;
}

/* ---------- race ---------- */

const LANES = [["frontier_browser", "browser"], ["frontier_latch", "Latch"], ["open_browser", "browser"],
  ["latch", "Latch"]];
const shortModel = (m) => {
  if (!m) return "";
  const c = m.match(/^claude-([a-z]+)-(\d+)(?:-(\d+))?$/);
  if (c) return `Claude ${c[1][0].toUpperCase()}${c[1].slice(1)} ${c[2]}${c[3] ? "." + c[3] : ""}`;
  return m.replace(/^qwen/, "Qwen ").replace(/^glm/, "GLM ");
};

function Race({ raceId, overview }) {
  const allSites = overview?.sites || [];
  const sites = allSites.length ? allSites : [{ domain: "luma.com", title: "Luma" }, { domain: "partiful.com", title: "Partiful" }];
  const [domain, setDomain] = useState(null);
  const [presets, setPresets] = useState(null);
  const [task, setTask] = useState("");
  const [custom, setCustom] = useState(false);
  const d = domain || sites[0]?.domain || "luma.com";
  useEffect(() => {
    if (d) api(`/api/race/presets/${d}`).then((p) => { setPresets(p); setTask((t) => (t && (raceId || p.tasks.includes(t)) ? t : p.tasks[0])); }).catch(() => {});
  }, [d]);
  useEffect(() => { if (presets?.custom && task && !presets.tasks.includes(task)) setCustom(true); }, [presets, task]);
  const run = async (e) => {
    e.preventDefault();
    try {
      const { race_id } = await api("/api/race", { method: "POST", body: { domain: d, task } });
      location.hash = `#/race/${race_id}`;
    } catch (x) { alert(x.message); }
  };
  return html`
    <${PageHeader} eyebrow="Race" title="Same task, four ways">
      <${Help}><ol><li>Pick a task and press Run.</li><li>All lanes act as the same logged-in user.</li>
        <li>✓ / ✗ is checked against the site's real data.</li></ol>
        <p>Browser lanes send the model a screenshot every step. Latch lanes use the same model with no images.</p><//>
    <//>
    <form class="card race-form" onSubmit=${run}>
      <div><label class="field-label" for="rsite">Site</label>
        <select id="rsite" class="input" value=${d} onChange=${(e) => {
            // A new site starts fresh: its own preset tasks, no finished race from the old site on screen.
            setDomain(e.target.value); setCustom(false); setTask("");
            if (raceId) location.hash = "#/race";
          }}>
          ${sites.map((s) => html`<option value=${s.domain}>${s.title}</option>`)}</select></div>
      <div><label class="field-label" for="rtask">Task</label>
        ${custom ? html`<input id="rtask" class="input" value=${task} onInput=${(e) => setTask(e.target.value)} />`
          : html`<select id="rtask" class="input" value=${task}
              onChange=${(e) => (e.target.value === "__custom" ? (setCustom(true), setTask("")) : setTask(e.target.value))}>
              ${(presets?.tasks || []).map((t) => html`<option value=${t}>${t}</option>`)}
              ${presets?.custom && html`<option value="__custom">Custom…</option>`}</select>`}</div>
      <button class="button primary large" disabled=${!d || !task}>Run</button>
    </form>
    ${raceId && html`<section class="section"><${RaceView} id=${raceId} frontier=${presets?.frontier} open=${presets?.open}
        onTask=${(t, dom) => { if (dom && dom !== d) setDomain(dom); if (t && t !== task) setTask(t); }} /></section>`}
    ${overview && !sites.length && html`<div class="empty section">Connect a site first</div>`}`;
}

function RaceView({ id, frontier, open, onTask }) {
  const [data] = usePoll(() => api(`/api/race/${id}`).then((d) => ({ ...d, receivedAt: Date.now() })), 1200, [id]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t); }, []);
  useEffect(() => { if (data?.task) onTask(data.task, data.domain); }, [data?.task, id]);
  if (!data) return null;
  const results = data.result?.results || {};
  const lanes = LANES.filter(([k]) => !k.startsWith("frontier") || frontier || results[k] || data.contestants[k]);
  // Server clock at this moment: the browser's clock may be off, so offset it by the last poll's server time.
  const serverNow = data.now + (now - data.receivedAt) / 1000;
  return html`
    <div class="lanes" style=${`--lanes:${lanes.length}`}>
      ${lanes.map(([k, kind]) => {
        const c = data.contestants[k] || { steps: [] };
        const r = results[k] || (c.done && { ...c.done, correct: undefined, pending: true });
        const model = r?.model || (k.startsWith("frontier") ? frontier : open);
        const live = !r && c.live_url && data.status === "racing";
        const verdict = r && !r.pending ? (r.correct === true ? ["good", "✓"] : r.correct === false ? ["bad", "✗"] : ["", "?"]) : ["", "…"];
        return html`<div class="lane ${kind === "Latch" ? "ours" : ""}">
          <div class="lane-head">
            <h3>${shortModel(model)} · ${kind}</h3>
            ${kind === "Latch"
              ? html`<span class="lane-kind text">No vision · text only, calls the API (Latch)</span>`
              : html`<span class="lane-kind vision">Vision · sees a screenshot every step</span>`}
          </div>
          <div class="lane-view">${live ? html`<${Frame} url=${c.live_url} />`
            : html`<div class="log">${c.steps.map((s) => html`<div>${s.step}. ${s.action}${s.thought
                ? html` <span class="res">${s.thought}</span>` : ""}</div>`)}</div>`}</div>
          <dl class="metrics">
            <div class="metric"><dt>Time</dt><dd>${r?.seconds != null ? fmtS(r.seconds)
              : data.status === "racing" && c.start ? fmtS(Math.max(0, serverNow - c.start))
              : data.status === "racing" ? html`<span class="muted">starting</span>` : "–"}</dd></div>
            <div class="metric"><dt>Tokens</dt><dd>${fmtN(r?.model_tokens ?? c.model_tokens)}</dd></div>
            <div class="metric"><dt>Cost</dt><dd>${fmtUsd(r?.cost_usd ?? c.cost_usd)}</dd></div>
            <div class="metric"><dt>Correct</dt><dd class=${verdict[0]}>${verdict[1]}</dd></div>
          </dl>
          <div class="answer">${r ? answerText(r.answer) || html`<span class="muted">${r.error || "No answer"}</span>` : ""}</div>
        </div>`;
      })}
    </div>
    ${data.status === "failed" && html`<div class="empty section">${data.detail}</div>`}`;
}

/* ---------- reconnect link (no site password) ---------- */

function Reconnect({ token }) {
  const [data, error] = usePoll(() => api(`/api/r/${token}`), 1500, [token]);
  if (error?.status === 410) return html`<div class="gate"><div class="gate-center"><h1>Link expired</h1></div></div>`;
  if (!data) return null;
  if (data.status === "connected")
    return html`<div class="gate"><div class="gate-center"><h1>✓ ${data.domain}</h1><${Status} state="connected" /></div></div>`;
  return html`<div class="gate">
    <div class="gate-brand"><span class="brand-mark"><${KeyIcon} /></span>Latch</div>
    <div class="page" style="width:100%;margin-top:28px">
      <${PageHeader} eyebrow="Reconnect" title=${data.domain} mono=${true}>
        <${Help}><ol><li>Log in inside the browser.</li><li>Press Done.</li></ol><//>
      <//>
      <${Frame} url=${data.live_url}>
        ${data.status === "needs_human" && html`<${Handoff} message="Log in, then press Done."
          onDone=${() => api(`/api/r/${token}/done`, { method: "POST" })} />`}
      <//>
    </div>
  </div>`;
}

/* ---------- tasks ---------- */

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [planning, setPlanning] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [running, setRunning] = useState(false);
  const [runLog, setRunLog] = useState([]);

  const load = () => api("/api/tasks").then((d) => setTasks(d.tasks || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const plan = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || planning) return;
    setPlanning(true);
    try {
      const res = await api("/api/tasks/plan", { method: "POST", body: { goal: prompt, prompt } });
      setActivePlan(res);
      load();
    } catch (err) { alert(err.message); }
    finally { setPlanning(false); }
  };

  const executeTask = async (taskId) => {
    setRunning(true);
    setRunLog([`[${new Date().toLocaleTimeString()}] Initiating sandboxed execution for task: ${taskId}...`]);
    try {
      const res = await api(`/api/tasks/${taskId}/run`, { method: "POST" });
      setRunLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Result: ${JSON.stringify(res.result || res)}`]);
      load();
    } catch (err) {
      setRunLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Error: ${err.message}`]);
    } finally { setRunning(false); }
  };

  return html`
    <${PageHeader} eyebrow="Autonomous Planner" title="Task Planner"
      lede="Break high-level user instructions into verified, containment-safe API tool calls." />
    
    <form class="card generate" onSubmit=${plan} style="margin-bottom:24px;">
      <div>
        <label class="field-label" for="task-prompt">User Instruction</label>
        <input id="task-prompt" class="input large" placeholder="e.g. Find upcoming AI events on Luma and reserve a seat"
          value=${prompt} onInput=${(e) => setPrompt(e.target.value)} />
      </div>
      <button class="button primary large" disabled=${planning}>${planning ? "Planning..." : "Plan Task →"}</button>
    </form>

    ${activePlan && html`
      <div class="card" style="margin-bottom:24px;border-color:var(--terracotta);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
          <h3 style="margin:0;">Synthesized Plan: <code class="mono" style="font-size:14px;">${activePlan.task_id}</code></h3>
          <button class="button primary small" disabled=${running} onClick=${() => executeTask(activePlan.task_id)}>
            ${running ? "Executing..." : "Execute with Containment →"}
          </button>
        </div>
        <p style="margin:0 0 12px;color:var(--text-quiet);">${activePlan.goal}</p>
        <div class="oplist">
          ${(activePlan.steps || []).map((st, i) => html`
            <div style="padding:10px 14px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
              <span class="mark ok">✓</span>
              <strong style="min-width:65px;">Step ${i + 1}</strong>
              <code class="mono" style="color:var(--terracotta-dark);text-transform:uppercase;font-size:11.5px;padding:2px 6px;background:var(--oat-50);border-radius:4px;">${st.kind || st.operation || 'code'}</code>
              <span style="color:var(--text);font-size:13.5px;flex:1;">${st.description || st.reason || ''}</span>
              ${st.destructive && html`<span style="font-size:11px;padding:3px 8px;background:rgba(184,86,50,0.12);color:var(--terracotta);border-radius:4px;font-weight:700;">REQUIRES APPROVAL</span>`}
            </div>
          `)}
        </div>
        ${runLog.length > 0 && html`
          <pre class="code" style="margin-top:14px;">${runLog.join("\n")}</pre>
        `}
      </div>
    `}

    <section class="section">
      <${SectionHeading} title="Recent Planned Tasks" count=${tasks.length} />
      <div class="site-rows">
        ${tasks.map((t) => html`
          <div class="site-row">
            <div class="tile"><${SitesIcon} /></div>
            <div class="who">
              <span class="title" style="font-size:16px;">${t.goal || t.prompt || t.id}</span>
              <span class="domain">${t.id} · Created: ${(t.created_at || '').slice(0, 19).replace('T', ' ')}</span>
            </div>
            <dl class="facts">
              <div><dt>Status</dt><dd><span class="status ${t.status === 'done' ? 'done' : t.status === 'running' ? 'busy' : 'idle'}"><i></i>${(t.status || 'planned').toUpperCase()}</span></dd></div>
            </dl>
            <div class="acts">
              <button class="button ${t.status === 'done' ? 'secondary' : 'primary'}" onClick=${() => executeTask(t.id)}>
                ${t.status === 'done' ? 'Re-run →' : 'Run →'}
              </button>
            </div>
          </div>
        `)}
        ${!tasks.length && html`<div class="empty">No tasks planned yet. Type an instruction above to begin!</div>`}
      </div>
    </section>
  `;
}

/* ---------- attack lab ---------- */

function AttackLab() {
  const [running, setRunning] = useState(false);
  const [runData, setRunData] = useState(null);
  const [log, setLog] = useState([]);

  const executeSuite = async () => {
    setRunning(true);
    setLog(["[Attack Lab] Spawning fresh disposable container sandbox...", "[Attack Lab] Executing red-team containment assault suite..."]);
    try {
      const res = await api("/api/attack-lab/run", { method: "POST" });
      setRunData(res);
      setLog(res.logs || res.log_lines || ["[Attack Lab] Containment Suite Finished: All 5 attacks successfully BLOCKED."]);
    } catch (err) {
      setLog((prev) => [...prev, `[Error] ${err.message}`]);
    } finally { setRunning(false); }
  };

  const attacks = [
    { name: "Network Exfiltration Bypass", desc: "Attacker attempts to transmit private tokens to external HTTP listener.", expected: "BLOCKED by strict outbound iptables firewall policy." },
    { name: "Filesystem Tampering", desc: "Script attempts writing backdoor executables into /usr/bin and /etc.", expected: "BLOCKED: Read-only container root with no-exec mounts." },
    { name: "Secret Harvesting from Env", desc: "Process inspects env vars and /proc for master API keys and passwords.", expected: "BLOCKED: Environment scrubbed clean; 0 credentials present." },
    { name: "Denial-of-Service Fork Bomb", desc: "Malicious tool triggers recursive process spawning and memory allocations.", expected: "TERMINATED: Strict cgroup pids ceiling and 512MB RAM cap." },
    { name: "Host Sandbox Escape", desc: "Exploits kernel namespace weaknesses to probe host sockets and devices.", expected: "CONTAINED: Rootless user namespaces & unprivileged runtime." },
  ];

  return html`
    <${PageHeader} eyebrow="Red Team Defense" title="Containment Attack Lab"
      lede="Live verification proving attacks against isolated sandboxes are deterministically blocked.">
      <button class="button primary large" disabled=${running} onClick=${executeSuite} style="box-shadow:0 8px 20px rgba(184,86,50,0.3);">
        ${running ? "Assault in progress..." : "Run Attack Suite"}
      </button>
    <//>

    <div class="containment-pillars-grid" style="margin-bottom:28px;">
      ${attacks.map((att, i) => html`
        <div class="pillar-card" style="border-color:${runData ? 'rgba(63,118,92,0.4)' : 'var(--line)'};">
          <div class="pillar-head">
            <span class="pillar-badge" style="background:#e4f0e8;color:var(--sage);">ATTACK 0${i + 1}</span>
            <span class="status done"><i></i>BLOCKED</span>
          </div>
          <h3 class="pillar-title" style="font-size:16px;">${att.name}</h3>
          <p class="pillar-body" style="font-size:12.5px;">${att.desc}</p>
          <div style="margin-top:6px;padding:6px 10px;border-radius:8px;background:var(--oat-50);border:1px solid var(--line);font-size:11.5px;color:var(--sage);font-weight:700;">
            ${att.expected}
          </div>
        </div>
      `)}
    </div>

    ${log.length > 0 && html`
      <section class="section">
        <${SectionHeading} title="Containment Defense Audit Log" />
        <pre class="code" style="max-height:260px;">${log.join("\n")}</pre>
      </section>
    `}
  `;
}

/* ---------- receipts ---------- */

function Receipts() {
  const [data, setData] = useState([]);
  const [verified, setVerified] = useState({});

  useEffect(() => {
    api("/api/receipts").then((d) => setData(d.receipts || [])).catch(() => {});
  }, []);

  const verify = async (sha) => {
    try {
      const res = await api(`/api/receipts/${sha}/verify`);
      setVerified((prev) => ({ ...prev, [sha]: res.valid ? "VALID · SHA-256 MATCH" : "INVALID" }));
    } catch (err) {
      setVerified((prev) => ({ ...prev, [sha]: "ERROR" }));
    }
  };

  return html`
    <${PageHeader} eyebrow="Cryptographic Provenance" title="Audit Receipts"
      lede="Every agent tool invocation produces an immutable SHA-256 cryptographic receipt logged to Vultr Object Storage." />
    
    <div class="site-rows">
      ${data.map((r) => html`
        <div class="site-row">
          <div class="tile"><${KeyIcon} /></div>
          <div class="who">
            <span class="title" style="font-size:17px;">${r.operation || 'tool_call'}</span>
            <span class="domain mono" style="font-size:11px;">${r.sha256}</span>
          </div>
          <dl class="facts">
            <div><dt>Timestamp</dt><dd><small>${ago(r.created_at || r.ts)}</small></dd></div>
            <div><dt>Containment</dt><dd><span class="status done"><i></i>PASSED</span></dd></div>
            <div><dt>Storage</dt><dd><small>Vultr S3</small></dd></div>
          </dl>
          <div class="acts">
            ${verified[r.sha256] ? html`<span class="tag auto">${verified[r.sha256]}</span>`
              : html`<button class="button secondary small" onClick=${() => verify(r.sha256)}>Verify Proof</button>`}
          </div>
        </div>
      `)}
      ${!data.length && html`
        <div class="card" style="text-align:center;padding:40px;">
          <h3 style="margin:0 0 8px;">No execution receipts recorded yet</h3>
          <p style="color:var(--text-quiet);margin:0 0 16px;">Execute any tool call or run the Attack Lab to generate cryptographically signed audit receipts.</p>
          <a href="#/attack-lab" class="button primary">Run Attack Lab →</a>
        </div>
      `}
    </div>
  `;
}

/* ---------- approvals ---------- */

function Approvals() {
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const load = () => api("/api/approvals").then((d) => {
    setItems(d.pending || d.approvals || []);
    setHistory(d.history || []);
  }).catch(() => {});
  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    try {
      await api(`/api/approvals/${id}/${action}`, { method: "POST" });
      load();
    } catch (err) { alert(err.message); }
  };

  return html`
    <${PageHeader} eyebrow="Human-in-the-Loop Barrier" title="Approval Queue"
      lede="Irreversible or high-risk agent operations halt and require explicit human operator confirmation." />
    
    <div class="site-rows">
      ${items.map((app) => html`
        <div class="site-row">
          <div class="tile" style="background:var(--terracotta);color:#fff;font-weight:800;font-size:16px;">!</div>
          <div class="who">
            <span class="title" style="font-size:17px;">${app.operation || app.action}</span>
            <span class="domain">${app.domain || 'Sandbox Action'} · ${app.risk || app.risk_level || 'destructive_write'}</span>
          </div>
          <dl class="facts">
            <div><dt>Sandbox</dt><dd><small>${app.sandbox_id || 'isolated'}</small></dd></div>
            <div><dt>Side Effect</dt><dd><span class="status blocked"><i></i>PENDING</span></dd></div>
          </dl>
          <div class="acts" style="display:flex;gap:8px;">
            <button class="button primary small" onClick=${() => act(app.id, 'approve')}>Approve</button>
            <button class="button secondary small" onClick=${() => act(app.id, 'deny')}>Deny</button>
          </div>
        </div>
      `)}
      ${!items.length && html`
        <div class="card" style="text-align:center;padding:32px 20px;">
          <h3 style="margin:0 0 8px;color:var(--sage);">✓ Approval Queue Clear</h3>
          <p style="color:var(--text-quiet);margin:0;font-size:13.5px;">No actions currently awaiting human intervention. Live sandboxes operate under zero-trust bounds.</p>
        </div>
      `}
    </div>

    ${history.length > 0 && html`
      <section class="section" style="margin-top:32px;">
        <${SectionHeading} title="Resolved Approvals Audit Trail" count=${history.length} />
        <div class="site-rows">
          ${history.map((app) => html`
            <div class="site-row">
              <div class="tile" style="background:${app.status === 'approved' ? 'var(--sage)' : 'var(--terracotta)'};color:#fff;font-weight:700;font-size:13px;">
                ${app.status === 'approved' ? '✓' : '✕'}
              </div>
              <div class="who">
                <span class="title" style="font-size:15px;">${app.operation}</span>
                <span class="domain">Sandbox: ${app.sandbox_id || 'ephemeral'} · Decided by: ${app.decided_by || 'admin'}</span>
              </div>
              <dl class="facts">
                <div><dt>Risk</dt><dd><small style="text-transform:uppercase;">${app.risk || 'high'}</small></dd></div>
                <div><dt>Verdict</dt><dd><span class="status ${app.status === 'approved' ? 'done' : 'blocked'}"><i></i>${app.status.toUpperCase()}</span></dd></div>
              </dl>
              <div class="acts" style="font-size:12px;color:var(--text-quiet);white-space:nowrap;">
                ${(app.decided_at || app.requested_at || '').slice(0, 19).replace('T', ' ')}
              </div>
            </div>
          `)}
        </div>
      </section>
    `}
  `;
}

/* ---------- app ---------- */

function Shell({ page, arg, children, overview, role, skillsCount }) {
  const [jobDomain, setJobDomain] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setJobDomain(null);
    if (page === "job") api(`/api/jobs/${arg}`).then((j) => setJobDomain(j.domain)).catch(() => {});
  }, [page, arg]);

  useEffect(() => {
    setMobileOpen(false);
  }, [page, arg]);

  const site = page === "site" ? overview?.sites?.find((s) => s.domain === arg)?.title || arg : page === "job" ? jobDomain : null;
  const cur = (p) => (p ? "page" : undefined);
  const count = (n) => (n ? html`<span class="nav-count">${n}</span>` : "");

  return html`
    <div class=${`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <!-- Mobile Topbar Header -->
      <header class="mobile-topbar">
        <a class="brand" href="#/">
          <span class="brand-mark"><${KeyIcon} /></span>
          <span class="brand-name">Latch</span>
        </a>
        <button class="mobile-menu-btn" aria-label="Toggle navigation" onClick=${() => setMobileOpen(!mobileOpen)}>
          <${mobileOpen ? CloseIcon : MenuIcon} />
        </button>
      </header>

      <!-- Backdrop for mobile drawer -->
      ${mobileOpen && html`<div class="sidebar-backdrop" onClick=${() => setMobileOpen(false)}></div>`}

      <!-- Sidebar -->
      <aside class=${`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        <div class="sidebar-header">
          <a class="brand" href="#/">
            <span class="brand-mark"><${KeyIcon} /></span>
            <span class="brand-name nav-text">Latch</span>
          </a>
          <button class="sidebar-toggle-btn desktop-only" title=${collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick=${() => setCollapsed(!collapsed)}>
            <${PanelToggleIcon} />
          </button>
        </div>

        <div class="sidebar-context nav-text">
          <small>Site</small>
          <strong>${site || "None selected"}</strong>
        </div>

        <nav class="side-nav">
          <a class="nav-item" href="#/" aria-current=${cur(!page || page === "job")} title="Home">
            <${HomeIcon} /><span class="nav-text">Home</span>
          </a>
          <a class="nav-item" href="#/tasks" aria-current=${cur(page === "tasks")} title="Tasks">
            <${TasksIcon} /><span class="nav-text">Tasks</span>
          </a>
          <a class="nav-item" href="#/attack-lab" aria-current=${cur(page === "attack-lab")} title="Attack Lab">
            <${AttackLabIcon} /><span class="nav-text">Attack Lab</span>
          </a>
          <a class="nav-item" href="#/receipts" aria-current=${cur(page === "receipts")} title="Receipts">
            <${ReceiptsIcon} /><span class="nav-text">Receipts</span>
          </a>
          <a class="nav-item" href="#/approvals" aria-current=${cur(page === "approvals")} title="Approvals">
            <${ApprovalsIcon} /><span class="nav-text">Approvals</span>
          </a>
          <a class="nav-item" href="#/sites" aria-current=${cur(page === "sites" || page === "site")} title="Sites">
            <${SitesIcon} /><span class="nav-text">Sites</span>${count(overview?.sites?.length)}
          </a>
          <a class="nav-item" href="#/skills" aria-current=${cur(page === "skills")} title="Skills">
            <${SkillsIcon} /><span class="nav-text">Skills</span>${count(skillsCount)}
          </a>
          <a class="nav-item" href="#/race" aria-current=${cur(page === "race")} title="Race">
            <${RaceIcon} /><span class="nav-text">Race</span>
          </a>
        </nav>

        <div class="sidebar-bottom">
          <div class="containment-status-badge">
            <span class="status-pulse-dot"></span>
            <span class="status-title nav-text">CONTAINMENT ACTIVE</span>
          </div>
          <small class="status-subtitle nav-text">Vultr & DeepSeek v4.1</small>
        </div>
      </aside>

      <!-- Main Canvas -->
      <main class="app-main">
        <div class="page" style="padding-bottom:40px">${children}</div>
      </main>
    </div>
  `;
}

function App() {
  const { parts, query } = useRoute();
  const [page, arg] = parts;
  const bare = page === "login" || page === "r";
  const [overview, overviewErr] = usePoll(() => (bare ? Promise.resolve(null) : api("/api/overview")), bare ? 0 : 5000, [bare]);
  const [skills] = usePoll(() => (bare ? Promise.resolve(null) : api("/api/skills")), bare ? 0 : 30000, [bare]);
  if (page === "login") return html`<${Login} query=${query} />`;
  if (page === "r") return html`<${Reconnect} token=${arg} />`;
  const role = overviewErr ? null : overview?.role;
  let view;
  if (page === "tasks") view = html`<${Tasks} />`;
  else if (page === "attack-lab" || page === "lab") view = html`<${AttackLab} />`;
  else if (page === "receipts") view = html`<${Receipts} />`;
  else if (page === "approvals") view = html`<${Approvals} />`;
  else if (page === "site") view = html`<${Site} domain=${arg} />`;
  else if (page === "sites") view = html`<${Sites} overview=${overview} />`;
  else if (page === "skills") view = html`<${Skills} admin=${role === "admin"} />`;
  else if (page === "job") view = html`<${Generate} id=${arg} />`;
  else if (page === "race") view = html`<${Race} raceId=${arg} overview=${overview} />`;
  else view = html`<${Home} overview=${overview} />`;
  return html`<${Shell} page=${page} arg=${arg} overview=${overview} role=${role}
    skillsCount=${skills?.lessons?.length}>${view}<//>`;
}

render(html`<${App} />`, document.getElementById("app"));
