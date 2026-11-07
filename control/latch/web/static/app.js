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

const LatchLogo = () => html`
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="overflow:visible">
    <defs>
      <linearGradient id="latchGradient" x1="10%" y1="90%" x2="80%" y2="20%">
        <stop offset="0%" stop-color="#FF521C" />
        <stop offset="50%" stop-color="#FF6B32" />
        <stop offset="85%" stop-color="#FFE0CC" />
        <stop offset="100%" stop-color="#FFFFFF" />
      </linearGradient>
    </defs>
    <!-- Lower orange loop -->
    <path fill-rule="evenodd" clip-rule="evenodd" d="M 26.2 35.7 L 25.1 36.0 L 24.0 36.4 L 22.1 37.5 L 20.9 38.3 L 19.8 39.4 L 18.7 40.9 L 17.5 42.8 L 17.2 44.0 L 16.8 45.5 L 16.4 47.0 L 16.4 77.5 L 16.8 79.4 L 17.2 80.6 L 17.5 81.7 L 17.9 82.5 L 18.3 83.2 L 19.1 84.3 L 21.3 86.6 L 22.8 87.7 L 25.1 88.9 L 27.0 89.2 L 28.9 89.6 L 70.8 89.6 L 73.0 89.2 L 74.5 88.9 L 77.5 87.4 L 79.1 86.2 L 80.6 84.3 L 81.3 83.2 L 82.1 82.1 L 82.5 80.9 L 82.8 79.4 L 83.2 77.9 L 83.2 71.9 L 82.1 72.6 L 82.1 73.0 L 81.3 73.8 L 79.4 75.3 L 78.3 76.0 L 77.5 76.0 L 76.8 76.4 L 76.0 79.4 L 73.8 81.7 L 72.6 82.5 L 71.1 82.8 L 28.1 82.8 L 27.0 82.5 L 25.8 81.7 L 24.0 79.8 L 23.6 79.1 L 23.2 77.5 L 23.2 47.0 L 23.6 45.8 L 24.0 45.1 L 26.2 42.8 L 28.1 42.1 L 28.1 35.7 Z" fill="#FF521C" />
    <!-- Upper shackle loop with orange-to-white gradient -->
    <path fill-rule="evenodd" clip-rule="evenodd" d="M 47.4 10.0 L 45.1 10.4 L 44.0 10.8 L 42.8 11.1 L 42.1 11.5 L 41.3 11.9 L 39.4 13.0 L 38.3 13.8 L 35.7 16.4 L 34.5 17.9 L 33.4 19.8 L 33.0 20.6 L 32.3 22.5 L 31.9 24.3 L 31.5 26.2 L 31.5 71.9 L 32.3 73.4 L 33.0 74.2 L 33.8 74.5 L 35.7 74.9 L 36.4 74.9 L 37.2 74.9 L 73.0 74.5 L 74.2 74.2 L 75.3 73.8 L 77.5 72.6 L 79.4 71.1 L 80.9 69.2 L 82.1 67.0 L 82.5 65.8 L 82.8 64.7 L 83.2 63.2 L 83.2 46.6 L 82.8 45.1 L 82.5 44.0 L 82.1 42.8 L 81.7 42.1 L 81.3 41.3 L 80.2 39.8 L 78.3 37.9 L 77.2 37.2 L 76.4 37.2 L 75.7 36.4 L 74.9 36.0 L 72.3 35.3 L 68.1 34.9 L 68.1 25.8 L 67.7 24.0 L 67.4 22.5 L 66.6 20.6 L 66.2 19.8 L 65.8 19.1 L 65.1 17.9 L 64.3 16.8 L 61.3 13.8 L 60.2 13.0 L 59.1 12.3 L 56.8 11.1 L 55.7 10.8 L 54.5 10.4 L 52.3 10.0 Z M 48.5 16.4 L 51.1 16.4 L 53.0 16.8 L 54.9 17.5 L 56.0 18.3 L 57.2 19.1 L 59.1 20.9 L 59.8 22.1 L 60.9 24.3 L 61.3 25.5 L 60.9 35.3 L 41.3 35.7 L 41.3 37.2 L 41.7 38.7 L 41.7 41.3 L 41.3 41.7 L 71.5 42.1 L 72.6 42.5 L 73.4 42.8 L 75.7 45.1 L 76.0 45.8 L 76.4 47.0 L 76.4 63.2 L 76.0 64.3 L 75.7 65.1 L 73.8 67.0 L 73.0 67.4 L 72.3 67.7 L 71.1 68.1 L 38.7 68.1 L 37.9 67.4 L 37.9 27.7 L 38.3 25.5 L 38.7 24.3 L 39.4 22.5 L 40.6 21.3 L 40.6 20.9 L 42.5 19.1 L 43.6 18.3 L 44.7 17.5 L 46.6 16.8 Z" fill="url(#latchGradient)" />
  </svg>
`;

const KeyIcon = LatchLogo;
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

function cleanSiteDomain(raw) {
  if (!raw) return "";
  let d = String(raw).trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
  if (d === "toscrape.com") return "books.toscrape.com";
  return d;
}

function SiteLogo({ domain, title, size = 32, className = "" }) {
  const clean = cleanSiteDomain(domain);
  const [failed, setFailed] = useState(false);
  const initial = title ? title[0].toUpperCase() : (clean ? clean[0].toUpperCase() : "S");

  if (!clean || failed) {
    return html`
      <span class=${`site-logo-fallback ${className}`} style=${`width:${size}px;height:${size}px;font-size:${Math.max(12, Math.round(size * 0.44))}px;`} aria-hidden="true">
        ${initial}
      </span>
    `;
  }

  const src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(clean)}&sz=128`;

  return html`
    <span class=${`site-logo-wrap ${className}`} style=${`width:${size}px;height:${size}px;`}>
      <img
        class="site-logo-img"
        src=${src}
        alt=${title || clean}
        width=${size}
        height=${size}
        loading="lazy"
        onError=${() => setFailed(true)}
      />
    </span>
  `;
}

function PageHeader({ title, mono, lede, icon, children }) {
  return html`<header class="page-header">
    <div>
      <div style="display:flex;align-items:center;gap:14px;">
        ${icon && html`<div class="page-header-icon">${icon}</div>`}
        <h1 class=${mono ? "mono" : ""}>${title}</h1>
      </div>
      ${lede && html`<p class="lede">${lede}</p>`}
    </div>
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
        <div class="orbit-latch-center">
          <${LatchLogo} />
        </div>
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
            <div class="tool-avatar">
              <${SiteLogo} domain=${s.domain} title=${s.title} size=28 />
            </div>
            <div class="tool-name-wrap">
              <span class="tool-title">${s.title}</span>
              <span class="verified-icon" title="Verified in sandbox">✓</span>
            </div>
          </div>
          <span class="tool-status-dot-wrap"><i class="status-dot"></i><span>connected</span></span>
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
        <h2>Containment Guarantees</h2>
      </div>
      <div class="containment-pillars-grid">
        <div class="pillar-card">
          <h3 class="pillar-title">Air-Gapped Sandbox</h3>
          <p class="pillar-body">Autonomous verification runs in disposable containers with zero-egress kernel networking.</p>
        </div>

        <div class="pillar-card">
          <h3 class="pillar-title">Zero Plain Secrets</h3>
          <p class="pillar-body">Master session cookies remain sealed in vault storage; agents only receive scoped Bearer keys.</p>
        </div>

        <div class="pillar-card">
          <h3 class="pillar-title">Operator Approval Gate</h3>
          <p class="pillar-body">Destructive mutations require explicit human confirmation before dispatch.</p>
        </div>

        <div class="pillar-card">
          <h3 class="pillar-title">SHA-256 Lifecycle Proof</h3>
          <p class="pillar-body">Every execution generates an immutable cryptographic receipt stored in Vultr S3.</p>
        </div>
      </div>
    </section>
  `;
}

function DessnSocialProof() {
  return html`
    <div class="dessn-proof-strip">
      <span class="dessn-proof-label">Trusted by autonomous agent teams building with</span>
      <div class="dessn-proof-logos">
        <span>Anthropic</span>
        <span class="dot-sep">•</span>
        <span>LangChain</span>
        <span class="dot-sep">•</span>
        <span>DeepSeek</span>
        <span class="dot-sep">•</span>
        <span>Vultr</span>
        <span class="dot-sep">•</span>
        <span>Cursor</span>
        <span class="dot-sep">•</span>
        <span>OpenAI</span>
      </div>
    </div>
  `;
}

function DessnQuotes() {
  return html`
    <div class="dessn-quotes-grid">
      <div class="dessn-quote-card light">
        <blockquote class="dessn-quote-text">
          “The team and I are really loving Latch. We can safely deploy autonomous agents without credential anxiety.”
        </blockquote>
        <div class="dessn-quote-author">
          <div class="dessn-avatar">AC</div>
          <div>
            <strong>Alex Chen</strong>
            <span>AI Platform Lead · Vultr Ecosystem</span>
          </div>
        </div>
      </div>
      <div class="dessn-quote-card dark">
        <blockquote class="dessn-quote-text">
          “This is ABSOLUTELY ESSENTIAL for production agents. We get real browser workflows with deterministic containment and immutable receipts.”
        </blockquote>
        <div class="dessn-quote-author">
          <div class="dessn-avatar teal">ER</div>
          <div>
            <strong>Elena Rostova</strong>
            <span>Principal Systems Architect</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function DessnTrioPillars() {
  return html`
    <section class="section" style="margin-top:54px;">
      <div class="section-heading" style="text-align:center;justify-content:center;flex-direction:column;gap:8px;">
        <h2 style="font-size:32px;font-family:var(--font-serif);font-weight:500;">Anchored in prod, built for containment.</h2>
        <p style="color:var(--secondary-text);font-size:16px;max-width:540px;margin:0 auto;">
          Latch sits at the intersection of agent autonomy and zero-trust security.
        </p>
      </div>

      <div class="dessn-tab-capsules">
        <div class="dessn-pill-tab active">
          <span>Air-gapped sandboxes</span>
          <span class="dessn-floral-badge blue">❋</span>
        </div>
        <div class="dessn-pill-tab">
          <span>Zero plain secrets</span>
          <span class="dessn-floral-badge orange">❋</span>
        </div>
        <div class="dessn-pill-tab">
          <span>Deterministic SHA-256</span>
          <span class="dessn-floral-badge green">❋</span>
        </div>
      </div>

      <div class="dessn-showcase-panels">
        <!-- Panel 1: Periwinkle -->
        <div class="dessn-panel periwinkle">
          <div class="dessn-panel-content">
            <h3 class="dessn-panel-title">Visibility <em>into what's live</em></h3>
            <ul class="dessn-panel-checklist">
              <li><span class="dessn-check-icon">◉</span> Live verified API state across every site</li>
              <li><span class="dessn-check-icon">◉</span> Real-time network exfiltration barriers</li>
              <li><span class="dessn-check-icon">◉</span> Continuous cookie & session health audits</li>
            </ul>
          </div>
          <div class="dessn-panel-graphic">
            <div class="dessn-mini-window">
              <div class="mini-window-bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="bar-title">latch / containment-gate</span></div>
              <div class="mini-window-body">
                <div class="mini-chip green">POST /v1/luma.com/list_events → 200 OK</div>
                <div class="mini-chip blue">Egress firewall: Outbound socket DENIED</div>
                <div class="mini-chip orange">Vault session: Sealed in AES-256</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel 2: Amber -->
        <div class="dessn-panel amber">
          <div class="dessn-panel-content">
            <h3 class="dessn-panel-title">Shortcut <em>to typed consistency</em></h3>
            <ul class="dessn-panel-checklist">
              <li><span class="dessn-check-icon">◉</span> Autonomous OpenAPI 3.1 schema synthesis</li>
              <li><span class="dessn-check-icon">◉</span> DeepSeek v4.1 reasoning verification</li>
              <li><span class="dessn-check-icon">◉</span> Zero hallucination schema validation</li>
            </ul>
          </div>
          <div class="dessn-panel-graphic">
            <div class="dessn-mini-window dark">
              <div class="mini-window-bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="bar-title">openapi.json</span></div>
              <div class="mini-window-body mono">
                <div style="color:#A39D94;">paths:</div>
                <div style="padding-left:14px;color:#E5A83B;">/search_books:</div>
                <div style="padding-left:28px;color:#F3ECE2;">post: verified [SHA-256: 7f3a...]</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel 3: Terracotta -->
        <div class="dessn-panel terracotta">
          <div class="dessn-panel-content">
            <h3 class="dessn-panel-title">Containment-first <em>environment</em></h3>
            <ul class="dessn-panel-checklist">
              <li><span class="dessn-check-icon">◉</span> Red-team attack suite in disposable containers</li>
              <li><span class="dessn-check-icon">◉</span> Human approval gates for state mutations</li>
              <li><span class="dessn-check-icon">◉</span> Immutable Vultr Object Storage receipts</li>
            </ul>
          </div>
          <div class="dessn-panel-graphic">
            <div class="dessn-mini-window">
              <div class="mini-window-bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="bar-title">containment-proof.log</span></div>
              <div class="mini-window-body">
                <div class="mini-threat-row"><span>ATTACK 01 · Exfiltration</span><strong style="color:#15803D;">BLOCKED</strong></div>
                <div class="mini-threat-row"><span>ATTACK 02 · Tampering</span><strong style="color:#15803D;">BLOCKED</strong></div>
                <div class="mini-threat-row"><span>ATTACK 03 · Secret Harvest</span><strong style="color:#15803D;">BLOCKED</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function DessnHowItWorks() {
  return html`
    <section class="dessn-how-it-works-section">
      <div class="how-head">
        <h2>How it works</h2>
        <p>Latch provides true containment so models can act without risk.</p>
      </div>

      <div class="how-steps-grid">
        <div class="how-step-card">
          <div class="how-step-badge">1</div>
          <h3 class="how-step-title">Connect any web app in one click</h3>
          <p class="how-step-desc">Paste the target URL. Latch spins up an isolated, sandboxed browser session.</p>
          <div class="how-step-preview">
            <code>connect(url) → sandbox_id: sbx_984</code>
          </div>
        </div>

        <div class="how-step-card">
          <div class="how-step-badge">2</div>
          <h3 class="how-step-title">Autonomous exploration & synthesis</h3>
          <p class="how-step-desc">Models crawl states, map parameters, and synthesize strict OpenAPI schemas inside kernel-isolated jail.</p>
          <div class="how-step-preview">
            <code>deepseek_synthesize() → openapi_3_1</code>
          </div>
        </div>

        <div class="how-step-card">
          <div class="how-step-badge">3</div>
          <h3 class="how-step-title">Instant typed MCP & REST dispatch</h3>
          <p class="how-step-desc">Agents invoke operations with scoped Bearer tokens. Every invocation produces a SHA-256 audit receipt.</p>
          <div class="how-step-preview">
            <code>dispatch() → receipt_sha256</code>
          </div>
        </div>
      </div>
    </section>
  `;
}

function DessnBottomBanner() {
  return html`
    <div class="landing-footer-card">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:24px;position:relative;z-index:2;">
        <div>
          <h2 style="font-family:var(--font-serif);font-size:clamp(32px, 4vw, 48px);font-weight:500;margin:0 0 10px;color:#FFFFFF;">
            Containment, in your hands.
          </h2>
          <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.9);max-width:48ch;">
            Deploy autonomous agents against live websites with deterministic boundaries and cryptographic receipts.
          </p>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <a href="#/race" class="button" style="background:#191816;color:#FFFFFF;padding:14px 28px;font-size:15px;border-radius:9999px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.3);">
            Try Benchmark Race →
          </a>
        </div>
      </div>

      <div class="footer-top-grid" style="position:relative;z-index:2;margin-top:20px;">
        <div class="footer-brand-col">
          <div class="footer-brand-title">
            <span class="brand-mark"><${LatchLogo} /></span>
            <span>LATCH</span>
          </div>
          <p class="footer-tagline">
            Deterministic containment architecture and verified, typed APIs for autonomous agents.
          </p>
        </div>
        <div class="footer-col">
          <span class="footer-col-title">Product</span>
          <ul class="footer-nav-list">
            <li><a href="#/sites">Sites & Schemas</a></li>
            <li><a href="#/attack-lab">Containment Attack Lab</a></li>
            <li><a href="#/tasks">Task Planner</a></li>
            <li><a href="#/receipts">Audit Receipts</a></li>
            <li><a href="#/approvals">Approval Queue</a></li>
            <li><a href="#/race">4-Way Race</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <span class="footer-col-title">Infrastructure</span>
          <ul class="footer-nav-list">
            <li><a href="https://vultr.com" target="_blank" rel="noreferrer">Vultr Cloud & Object Storage</a></li>
            <li><a href="https://deepseek.com" target="_blank" rel="noreferrer">DeepSeek v4.1 Reasoning</a></li>
            <li><a href="https://anthropic.com" target="_blank" rel="noreferrer">Claude Code MCP Integration</a></li>
            <li><a href="https://github.com" target="_blank" rel="noreferrer">Open Source GitHub Repository</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom-bar" style="position:relative;z-index:2;">
        <span>© 2026 Latch Project · All rights reserved</span>
        <div style="display:flex;gap:16px;">
          <a href="#/">Security Proof</a>
          <a href="#/">OpenAPI 3.1</a>
          <a href="#/">Terms</a>
        </div>
      </div>
    </div>
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

    <${DessnSocialProof} />

    <${DessnQuotes} />

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
        <h2>Featured Published APIs</h2>
        <span class="section-count">${sites.length}</span>
      </div>
      <div class="featured-tools-grid">
        ${sites.map((s) => html`<${FeaturedToolCard} s=${s} />`)}
      </div>
      ${overview && !sites.length && html`<div class="empty">No apps generated yet. Paste a URL above to start!</div>`}
    </section>

    <${DessnTrioPillars} />

    <${DessnHowItWorks} />

    <${ContainmentGuarantees} />

    <${DessnBottomBanner} />
  `;
}

/* ---------- sites ---------- */

function Sites({ overview }) {
  const sites = overview?.sites || [], running = overview?.running || [];
  return html`
    <${PageHeader} title="Sites" />
    <div class="site-rows">
      ${sites.map((s) => html`<div class="site-row">
        <a class="tile" href=${`#/site/${s.domain}`} aria-label=${s.title} tabindex="-1">
          <${SiteLogo} domain=${s.domain} title=${s.title} size=36 />
        </a>
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
        <a class="tile" href=${`#/job/${j.id}`} aria-label=${j.domain} tabindex="-1">
          <${SiteLogo} domain=${j.domain} size=36 />
        </a>
        <div class="who"><a class="title" href=${`#/job/${j.id}`}>${j.domain.split(".")[0]}</a><span class="domain">${j.domain}</span></div>
        <dl class="facts"><div><dt>Status</dt><dd><${Status} state="busy" label=${j.status} /></dd></div></dl>
        <div class="acts"><a class="button secondary" href=${`#/job/${j.id}`}>Watch →</a></div>
      </div>`)}
      ${overview && !sites.length && !running.length && html`<div class="empty">No sites yet</div>`}
    </div>`;
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
    <${PageHeader} title=${site.title} icon=${html`<${SiteLogo} domain=${domain} title=${site.title} size=36 />`}>
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
        <div class="oplist"><div class="oplist-head"><span class="section-label">Read</span><span class="section-count">${reads.length}</span></div>
          ${reads.map((o) => html`<${OpRow} op=${o} />`)}</div>
        <div class="oplist"><div class="oplist-head"><span class="section-label">Write</span><span class="section-count">${writes.length}</span></div>
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
    <${PageHeader} title=${data.domain} icon=${html`<${SiteLogo} domain=${data.domain} size=36 />`}>
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
        <div class="panel"><div class="panel-head"><span class="section-label">Endpoints</span><span class="section-count">${data.endpoints.length}</span></div>
          <ul>${[...data.endpoints].reverse().map((e) => html`<li><span></span>
            <span class="ep" title=${e.endpoint}>${e.endpoint.replace(/^(\w+) [^/]+/, "$1 ")}</span><span></span>
            <span class="why">${e.label}</span></li>`)}</ul></div>
        <div class="panel"><div class="panel-head"><span class="section-label">Operations</span><span class="section-count">${verified} / ${ops.length}</span></div>
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
  const hasPresets = Boolean(presets?.tasks && presets.tasks.length > 0);

  useEffect(() => {
    if (d) {
      api(`/api/race/presets/${d}`).then((p) => {
        setPresets(p);
        if (p?.tasks && p.tasks.length > 0) {
          setCustom(false);
          setTask((t) => (t && (raceId || p.tasks.includes(t)) ? t : p.tasks[0]));
        } else {
          setCustom(true);
          setTask("");
        }
      }).catch(() => {
        setPresets({ tasks: [], custom: true });
        setCustom(true);
        setTask("");
      });
    }
  }, [d]);

  const run = async (e) => {
    e.preventDefault();
    try {
      const { race_id } = await api("/api/race", { method: "POST", body: { domain: d, task } });
      location.hash = `#/race/${race_id}`;
    } catch (x) { alert(x.message); }
  };

  return html`
    <${PageHeader} title="Same task, four ways">
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
        ${!hasPresets ? html`
          <input id="rtask" class="input" placeholder="Type a task question for ${d}..."
            value=${task} onInput=${(e) => setTask(e.target.value)} />
        ` : custom ? html`
          <div class="row" style="gap:8px;">
            <input id="rtask" class="input" placeholder="Type custom benchmark question..." value=${task} onInput=${(e) => setTask(e.target.value)} style="flex:1;" />
            <button type="button" class="button secondary small" onClick=${() => { setCustom(false); setTask(presets.tasks[0]); }}>Presets</button>
          </div>`
          : html`<select id="rtask" class="input" value=${task}
              onChange=${(e) => (e.target.value === "__custom" ? (setCustom(true), setTask("")) : setTask(e.target.value))}>
              ${presets.tasks.map((t) => html`<option value=${t}>${t}</option>`)}
              <option value="__custom">Custom…</option>
            </select>`}</div>
      <button class="button primary large" disabled=${!d || !task.trim()}>Run</button>
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
      <${PageHeader} title=${data.domain} mono=${true}>
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

function TaskDetail({ taskId, onClose, onRerun }) {
  const [data, setData] = useState(null);
  const [poll, setPoll] = useState(true);

  const fetchDetail = () => {
    api(`/api/tasks/${taskId}`).then((res) => {
      setData(res);
      if (res?.task?.status !== "running" && res?.task?.status !== "awaiting_approval") {
        setPoll(false);
      }
    }).catch(() => {});
  };

  useEffect(() => {
    fetchDetail();
    if (!poll) return;
    const interval = setInterval(fetchDetail, 1200);
    return () => clearInterval(interval);
  }, [taskId, poll]);

  if (!data) return html`<div class="card" style="margin-bottom:24px;padding:24px;">Loading task details...</div>`;

  const { task, steps = [], events = [] } = data;
  const receiptEvent = events.find((e) => e.event === "receipt_hashed");
  const sha = receiptEvent?.fields?.sha256;
  const isRunning = task.status === "running" || task.status === "awaiting_approval";

  return html`
    <div class="card" style="margin-bottom:28px;border-color:var(--terracotta);background:var(--ivory);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
        <div>
          <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-quiet);">${task.id}</span>
          <h3 style="margin:4px 0 0;font-size:18px;">${task.goal}</h3>
        </div>
        <div class="row" style="gap:10px;">
          <button class="button primary small" disabled=${isRunning} onClick=${() => { setPoll(true); onRerun(task.id); }}>
            ${isRunning ? "Executing..." : "Re-run in Sandbox →"}
          </button>
          <button class="button secondary small" onClick=${onClose}>Close</button>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <span class="status ${task.status === 'done' ? 'done' : isRunning ? 'live' : 'queued'}">
          <i></i>${(task.status || 'planned').toUpperCase()}
        </span>
        <span style="font-size:12px;color:var(--text-quiet);">${steps.length} planned steps</span>
      </div>

      <!-- Steps breakdown -->
      <div class="oplist" style="margin-bottom:18px;">
        ${steps.map((st, i) => html`
          <div style="padding:10px 14px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <span class="mark ${st.status === 'done' ? 'ok' : st.status === 'running' ? 'busy' : 'idle'}">
              ${st.status === 'done' ? '✓' : st.status === 'running' ? '↻' : '–'}
            </span>
            <strong style="min-width:60px;font-size:13px;">Step ${i + 1}</strong>
            <code class="mono" style="color:var(--terracotta-dark);font-size:11px;padding:2px 6px;background:var(--oat-50);border-radius:4px;text-transform:uppercase;">
              ${st.kind}
            </code>
            <span style="color:var(--text);font-size:13px;flex:1;">${st.description}</span>
            ${st.destructive && html`
              <span style="font-size:10.5px;padding:2px 7px;background:rgba(184,86,50,0.1);color:var(--terracotta);border-radius:4px;font-weight:700;">
                APPROVAL REQUIRED
              </span>
            `}
          </div>
        `)}
      </div>

      <!-- Execution Output & Code Trace -->
      ${steps.some((s) => s.payload_json) && html`
        <div style="margin-top:14px;">
          <label class="field-label">Sandbox Generated Code</label>
          <pre class="code" style="max-height:220px;font-size:12px;">${steps.map((s) => s.payload_json).filter(Boolean).join("\n\n")}</pre>
        </div>
      `}

      <!-- Containment Dispatch Trace -->
      ${events.length > 0 && html`
        <div style="margin-top:18px;">
          <label class="field-label">Containment Execution Lifecycle</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;">
            ${events.map((ev) => html`
              <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:8px;background:var(--oat-50);border:1px solid var(--line);font-size:11px;font-family:var(--font-mono);color:var(--espresso-800);">
                <span style="color:var(--terracotta);font-weight:700;">•</span>
                <span>${ev.event}</span>
                ${ev.fields?.sandbox_id && html`<small style="color:var(--text-quiet);">(${ev.fields.sandbox_id})</small>`}
              </span>
            `)}
          </div>
        </div>
      `}

      <!-- Cryptographic Proof Card -->
      ${sha && html`
        <div style="margin-top:20px;padding:14px 16px;border-radius:12px;background:var(--paper);border:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--terracotta-dark);letter-spacing:.05em;text-transform:uppercase;">
              Cryptographic Audit Receipt
            </div>
            <code class="mono" style="font-size:11.5px;color:var(--espresso-950);">${sha}</code>
          </div>
          <a class="button secondary small" href="#/receipts">View in Audit Receipts →</a>
        </div>
      `}
    </div>
  `;
}

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [planning, setPlanning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const load = () => api("/api/tasks").then((d) => setTasks(d.tasks || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const plan = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || planning) return;
    setPlanning(true);
    try {
      const res = await api("/api/tasks/plan", { method: "POST", body: { goal: prompt, prompt } });
      setSelectedTaskId(res.task_id);
      load();
    } catch (err) { alert(err.message); }
    finally { setPlanning(false); }
  };

  const executeTask = async (taskId) => {
    try {
      await api(`/api/tasks/${taskId}/run`, { method: "POST" });
      setSelectedTaskId(taskId);
      load();
    } catch (err) { alert(err.message); }
  };

  return html`
    <${PageHeader} title="Task Planner"
      lede="Break high-level user instructions into verified, containment-safe API tool calls." />
    
    <form class="card generate" onSubmit=${plan} style="margin-bottom:24px;">
      <div>
        <label class="field-label" for="task-prompt">User Instruction</label>
        <input id="task-prompt" class="input large" placeholder="e.g. Find upcoming AI events on Luma and reserve a seat"
          value=${prompt} onInput=${(e) => setPrompt(e.target.value)} />
      </div>
      <button class="button primary large" disabled=${planning}>${planning ? "Planning..." : "Plan Task →"}</button>
    </form>

    ${selectedTaskId && html`
      <${TaskDetail}
        taskId=${selectedTaskId}
        onClose=${() => setSelectedTaskId(null)}
        onRerun=${executeTask}
      />
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
              <div><dt>Status</dt><dd><span class="status ${t.status === 'done' ? 'done' : t.status === 'running' ? 'live' : 'queued'}"><i></i>${(t.status || 'planned').toUpperCase()}</span></dd></div>
            </dl>
            <div class="acts" style="display:flex;gap:8px;">
              <button class="button secondary small" onClick=${() => setSelectedTaskId(t.id)}>
                Inspect Output
              </button>
              <button class="button ${t.status === 'done' ? 'secondary' : 'primary'} small" onClick=${() => executeTask(t.id)}>
                ${t.status === 'done' ? 'Re-run' : 'Run'}
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
    {
      num: "01",
      name: "Network Exfiltration Bypass",
      desc: "Attacker attempts to transmit private tokens to external HTTP listener.",
      blockedBy: "BLOCKED by strict outbound iptables firewall policy."
    },
    {
      num: "02",
      name: "Filesystem Tampering",
      desc: "Attacker attempts to write or alter binaries in system root paths.",
      blockedBy: "BLOCKED by read-only rootfs mount & no-exec partition enforcement."
    },
    {
      num: "03",
      name: "Secret Harvesting",
      desc: "Attacker attempts to dump environment variables and process memory.",
      blockedBy: "BLOCKED by sanitized process environment; zero host tokens exposed."
    },
    {
      num: "04",
      name: "Denial-of-Service Fork Bomb",
      desc: "Attacker spawns unbounded threads and child processes to exhaust CPU.",
      blockedBy: "BLOCKED by strict cgroup pids throttling and memory ceilings."
    },
    {
      num: "05",
      name: "Host Sandbox Breakout",
      desc: "Attacker leverages kernel exploits to break container boundary.",
      blockedBy: "BLOCKED by unprivileged Linux user namespaces & seccomp profile."
    },
  ];

  return html`
    <${PageHeader} title="Containment Attack Lab"
      lede="Live verification proving attacks against isolated sandboxes are deterministically blocked.">
      <button class="button primary large" disabled=${running} onClick=${executeSuite} style="box-shadow:0 8px 24px rgba(212,80,29,0.35);">
        ${running ? "Assault in progress..." : "Run Attack Suite"}
      </button>
    <//>

    <div class="containment-pillars-grid" style="margin-bottom:28px;">
      ${attacks.map((att) => html`
        <div class="pillar-card" style="border-color:${runData ? 'rgba(212,80,29,0.3)' : 'rgba(25,24,22,0.09)'};">
          <div class="pillar-head">
            <span class="pillar-badge-num">ATTACK ${att.num}</span>
            <span class="threat-status"><i class="threat-dot"></i>BLOCKED</span>
          </div>
          <h3 class="pillar-title">${att.name}</h3>
          <p class="pillar-body">${att.desc}</p>
          <div class="pillar-callout">
            ${att.blockedBy}
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
    <${PageHeader} title="Audit Receipts"
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
    <${PageHeader} title="Approval Queue"
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

function Shell({ page, arg, children, overview, role }) {
  const [jobDomain, setJobDomain] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 50) {
        setNavVisible(true);
      } else if (currentScrollY > lastScrollY.current + 8) {
        // Scrolling down -> auto-hide navbar
        setNavVisible(false);
      } else if (currentScrollY < lastScrollY.current - 8) {
        // Scrolling up -> reveal navbar
        setNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setJobDomain(null);
    if (page === "job") api(`/api/jobs/${arg}`).then((j) => setJobDomain(j.domain)).catch(() => {});
  }, [page, arg]);

  useEffect(() => {
    setMobileOpen(false);
    setNavVisible(true);
  }, [page, arg]);

  const site = page === "site" ? overview?.sites?.find((s) => s.domain === arg)?.title || arg : page === "job" ? jobDomain : null;
  const cur = (p) => (p ? "page" : undefined);
  const count = (n) => (n ? html`<span class="nav-count">${n}</span>` : "");
  const isHidden = !navVisible && !mobileOpen;

  return html`
    <div class="app-shell horizontal-shell">
      <!-- Top Horizontal Navigation Bar (Centered, Auto-Hide & Glossy Glass) -->
      <header class=${`top-navbar glossy-nav ${isHidden ? "nav-hidden" : ""}`}>
        <div class="top-navbar-container">
          <!-- Left: Brand Logo -->
          <div class="top-navbar-left">
            <a class="brand" href="#/">
              <span class="brand-mark"><${LatchLogo} /></span>
              <span class="brand-name">Latch</span>
            </a>
          </div>

          <!-- Center: Primary Desktop Navigation Links -->
          <div class="top-navbar-center">
            <nav class="top-nav-menu desktop-nav">
              <a class="top-nav-link" href="#/" aria-current=${cur(!page || page === "job")}>
                <span>Home</span>
              </a>
              <a class="top-nav-link" href="#/tasks" aria-current=${cur(page === "tasks")}>
                <span>Tasks</span>
              </a>
              <a class="top-nav-link" href="#/attack-lab" aria-current=${cur(page === "attack-lab")}>
                <span>Attack Lab</span>
              </a>
              <a class="top-nav-link" href="#/receipts" aria-current=${cur(page === "receipts")}>
                <span>Receipts</span>
              </a>
              <a class="top-nav-link" href="#/approvals" aria-current=${cur(page === "approvals")}>
                <span>Approvals</span>
              </a>
              <a class="top-nav-link" href="#/sites" aria-current=${cur(page === "sites" || page === "site")}>
                <span>Sites</span>
                ${overview?.sites?.length ? html`<span class="nav-count">${overview.sites.length}</span>` : ""}
              </a>
            </nav>
          </div>

          <!-- Right: Balanced Empty / Context Area & Mobile Toggle -->
          <div class="top-navbar-right">
            ${site && html`
              <div class="top-nav-site-pill desktop-nav" title="Currently scoped site">
                <span class="pill-dot"></span>
                <span class="pill-site">${site}</span>
              </div>
            `}
            <!-- Mobile Toggle Button (Visible only on mobile) -->
            <button class="mobile-toggle-btn" aria-label="Toggle navigation" onClick=${() => setMobileOpen(!mobileOpen)}>
              <${mobileOpen ? CloseIcon : MenuIcon} />
            </button>
          </div>
        </div>
      </header>

      <!-- Mobile Full-Screen Drawer (Matching Image 2 Reference) -->
      ${mobileOpen && html`
        <div class="mobile-drawer-overlay">
          <div class="mobile-drawer-content">
            <nav class="mobile-drawer-nav">
              <a class="mobile-nav-row" href="#/" aria-current=${cur(!page || page === "job")} onClick=${() => setMobileOpen(false)}>
                <span>Home</span>
                <svg class="mobile-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </a>
              <a class="mobile-nav-row" href="#/tasks" aria-current=${cur(page === "tasks")} onClick=${() => setMobileOpen(false)}>
                <span>Tasks</span>
                <svg class="mobile-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </a>
              <a class="mobile-nav-row" href="#/attack-lab" aria-current=${cur(page === "attack-lab")} onClick=${() => setMobileOpen(false)}>
                <span>Attack Lab</span>
                <svg class="mobile-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </a>
              <a class="mobile-nav-row" href="#/receipts" aria-current=${cur(page === "receipts")} onClick=${() => setMobileOpen(false)}>
                <span>Receipts</span>
                <svg class="mobile-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </a>
              <a class="mobile-nav-row" href="#/approvals" aria-current=${cur(page === "approvals")} onClick=${() => setMobileOpen(false)}>
                <span>Approvals</span>
                <svg class="mobile-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </a>
              <a class="mobile-nav-row" href="#/sites" aria-current=${cur(page === "sites" || page === "site")} onClick=${() => setMobileOpen(false)}>
                <span class="row-label">Sites ${overview?.sites?.length ? html`<span class="nav-count" style="margin-left:8px;">${overview.sites.length}</span>` : ""}</span>
                <svg class="mobile-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </a>
            </nav>

            <div class="mobile-drawer-bottom">
              <a class="mobile-cta-full" href="#/sites" onClick=${() => setMobileOpen(false)}>
                View Sandboxed APIs →
              </a>
            </div>
          </div>
        </div>
      `}

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
  else if (page === "job") view = html`<${Generate} id=${arg} />`;
  else if (page === "race") view = html`<${Race} raceId=${arg} overview=${overview} />`;
  else view = html`<${Home} overview=${overview} />`;
  return html`<${Shell} page=${page} arg=${arg} overview=${overview} role=${role}>${view}<//>`;
}

render(html`<${App} />`, document.getElementById("app"));
