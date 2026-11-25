export const SETUP_GUIDE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Android Debloater MCP Server: Full Setup Guide</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/tokens.css">
<style>
:root {
  --bg: #07090e;
  --surface: #0d1117;
  --surface-alt: #121722;
  --surface-elevated: #161c27;
  --ink: #ffffff;
  --muted: #8b949e;
  --dim: #64748b;
  --line: rgba(255, 255, 255, 0.08);
  --line-hover: rgba(255, 255, 255, 0.16);
  --accent: #ccff00;
  --accent-hover: #b8e600;
  --accent-ink: #000000;
  --code: #090d14;
  --code-ink: #e6edf3;
  --warn: #f59e0b;
  --warn-bg: rgba(245, 158, 11, 0.07);
  --warn-border: rgba(245, 158, 11, 0.28);
  --ok: #4ade80;
  --ok-bg: rgba(74, 222, 128, 0.1);
  --danger: #f87171;
  box-sizing: border-box;
  color-scheme: dark;
}

html {
  scroll-padding-top: 115px;
  -webkit-text-size-adjust: 100%;
}

*, *::before, *::after {
  box-sizing: inherit;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font: 400 15px/1.65 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3 {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  line-height: 1.22;
  margin: 0;
  color: #ffffff;
}

a {
  color: var(--accent);
  text-decoration: none;
  transition: opacity 0.15s;
}

a:hover {
  opacity: 0.85;
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ================= HEADER BAR ================= */
.header-bar {
  background: rgba(7, 9, 14, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--line);
  padding: 10px 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #fff;
  min-width: 0;
  flex-shrink: 1;
}

.brand-icon {
  width: 28px;
  height: 28px;
  background: var(--accent);
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  flex-shrink: 0;
}

.brand-text {
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1.2;
  display: flex;
  flex-direction: column;
  white-space: nowrap;
}

.brand-title-short {
  display: none;
}

.brand-sub {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--muted);
  letter-spacing: 0.02em;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.btn-nav {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 0.82rem;
  text-decoration: none;
  color: #fff;
  background: var(--surface);
  border: 1px solid var(--line);
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-nav:hover {
  background: #151b26;
  border-color: var(--line-hover);
}

.btn-accent {
  background: var(--accent);
  color: #000;
  font-weight: 700;
  border-color: var(--accent);
}

.btn-accent:hover {
  background: var(--accent-hover);
  color: #000;
  opacity: 1;
}

/* ================= MOBILE STICKY TOC PILLS ================= */
.mobile-toc-bar {
  display: none;
  background: rgba(10, 14, 20, 0.94);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--line);
  padding: 8px 14px;
  position: sticky;
  top: 49px;
  z-index: 90;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x;
  scrollbar-width: none;
  gap: 6px;
}

.mobile-toc-bar::-webkit-scrollbar {
  display: none;
}

.mobile-toc-pill {
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--line);
  padding: 5px 11px;
  border-radius: 9999px;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.15s;
}

.mobile-toc-pill:hover {
  color: #fff;
  border-color: var(--line-hover);
}

.mobile-toc-pill.active {
  background: var(--accent);
  color: #000;
  font-weight: 700;
  border-color: var(--accent);
}

/* ================= LAYOUT ================= */
.layout {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 48px;
}

/* Sticky Desktop Sidebar */
nav.toc {
  position: sticky;
  top: 68px;
  align-self: start;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
  padding: 32px 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

nav.toc b {
  display: block;
  font-size: 0.74rem;
  font-weight: 800;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 14px;
}

nav.toc a {
  display: block;
  padding: 6px 0 6px 14px;
  border-left: 2px solid var(--line);
  color: var(--muted);
  text-decoration: none;
  font-size: 0.85rem;
  line-height: 1.4;
  transition: all 0.15s;
}

nav.toc a:hover {
  color: #fff;
  border-left-color: var(--line-hover);
}

nav.toc a.on {
  color: #fff;
  border-left-color: var(--accent);
  font-weight: 600;
}

/* Main Content Area */
main {
  padding: 36px 0 80px;
  min-width: 0;
}

.kicker-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(204, 255, 0, 0.1);
  border: 1px solid rgba(204, 255, 0, 0.25);
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 4px 10px;
  border-radius: 9999px;
  margin-bottom: 12px;
}

.kicker-dot {
  width: 6px;
  height: 6px;
  background: var(--accent);
  border-radius: 50%;
}

h1 {
  font-size: clamp(1.85rem, 4.5vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.15;
}

.lead {
  color: var(--muted);
  max-width: 68ch;
  margin: 14px 0 20px;
  font-size: 1.05rem;
  line-height: 1.6;
}

.meta-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0 24px;
}

.meta-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--surface);
  border: 1px solid var(--line);
  font-size: 0.75rem;
  font-weight: 600;
  color: #c9d1d9;
  padding: 4px 10px;
  border-radius: 6px;
}

.meta-badge svg {
  color: var(--accent);
}

/* Safety Callout Box */
.safety-callout {
  background: var(--warn-bg);
  border: 1px solid var(--warn-border);
  border-left: 4px solid var(--warn);
  border-radius: 12px;
  padding: 18px 20px;
  margin: 22px 0 30px;
  max-width: 76ch;
}

.safety-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--warn);
  margin-bottom: 8px;
}

.safety-callout p {
  margin: 6px 0;
  font-size: 0.9rem;
  color: #e2e8f0;
  line-height: 1.6;
}

section {
  padding-top: 42px;
  margin-top: 42px;
  border-top: 1px solid var(--line);
}

h2 {
  font-size: clamp(1.35rem, 2.5vw, 1.75rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 12px;
}

h3 {
  font-size: 1.02rem;
  font-weight: 700;
  margin: 26px 0 8px;
  color: #fff;
}

p {
  margin: 12px 0;
  max-width: 74ch;
  color: #c9d1d9;
}

ul, ol {
  max-width: 74ch;
  padding-left: 22px;
  color: #c9d1d9;
}

li {
  margin: 6px 0;
}

code {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.85em;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 5px;
  padding: 2px 6px;
  color: #38bdf8;
}

/* Code Snippet Blocks */
.code-window {
  margin: 16px 0;
  background: var(--code);
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.025);
  border-bottom: 1px solid var(--line);
  padding: 8px 14px;
}

.window-dots {
  display: flex;
  gap: 6px;
}

.window-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
}

.window-dot:nth-child(1) { background: #ff5f56; }
.window-dot:nth-child(2) { background: #ffbd2e; }
.window-dot:nth-child(3) { background: #27c93f; }

.code-lang {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--dim);
  text-transform: uppercase;
}

.btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--line);
  color: #c9d1d9;
  border-radius: 6px;
  padding: 4px 9px;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-copy:hover {
  background: var(--accent);
  color: #000;
  border-color: var(--accent);
}

.btn-copy.copied {
  background: var(--ok);
  color: #000;
  border-color: var(--ok);
}

pre {
  margin: 0;
  padding: 16px 18px;
  overflow-x: auto;
  font: 500 0.85rem/1.6 'JetBrains Mono', ui-monospace, monospace;
  color: var(--code-ink);
}

pre code {
  background: none;
  border: 0;
  padding: 0;
  color: inherit;
  font: inherit;
}

.c {
  color: #64748b;
  font-style: italic;
}

/* Callout Box */
.box {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px 18px;
  margin: 18px 0;
  max-width: 74ch;
}

.box p {
  margin: 4px 0;
  font-size: 0.92rem;
  color: #e2e8f0;
}

/* Table Card Wrapper */
.tw {
  overflow-x: auto;
  margin: 16px 0;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
}

table {
  border-collapse: collapse;
  width: 100%;
  min-width: 560px;
  font-size: 0.88rem;
}

th, td {
  text-align: left;
  padding: 11px 14px;
  border-bottom: 1px solid var(--line);
  vertical-align: top;
}

th {
  background: #090d14;
  font-weight: 600;
  color: #fff;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

td {
  color: #c9d1d9;
}

tr:last-child td {
  border-bottom: none;
}

.badge-ro {
  display: inline-flex;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  background: var(--ok-bg);
  color: var(--ok);
  border: 1px solid rgba(74, 222, 128, 0.2);
}

.badge-rw {
  display: inline-flex;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  background: rgba(245, 158, 11, 0.1);
  color: var(--warn);
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.filter {
  width: 100%;
  max-width: 380px;
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  color: #fff;
  font: inherit;
  font-size: 0.88rem;
  margin: 10px 0;
  transition: border-color 0.15s;
}

.filter:focus {
  outline: none;
  border-color: var(--accent);
}

.btn {
  display: inline-block;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 700;
  text-decoration: none;
  background: var(--accent);
  color: #000;
  transition: background 0.15s;
}

.btn:hover {
  background: var(--accent-hover);
  color: #000;
}

/* ================= RESPONSIVE ================= */
@media (max-width: 960px) {
  .header-bar {
    padding: 10px 16px;
  }
  .brand-sub {
    display: none;
  }
  .brand-title-full {
    display: none;
  }
  .brand-title-short {
    display: inline;
    font-size: 0.88rem;
  }
  .btn-nav {
    padding: 6px 11px;
    font-size: 0.8rem;
  }
  .layout {
    grid-template-columns: 1fr;
    gap: 0;
    padding: 0 16px;
  }
  nav.toc {
    display: none;
  }
  .mobile-toc-bar {
    display: flex;
  }
  main {
    padding: 20px 0 60px;
  }
  section {
    padding-top: 32px;
    margin-top: 32px;
  }
}

@media (max-width: 480px) {
  .header-bar {
    padding: 8px 12px;
    gap: 8px;
  }
  .brand-icon {
    width: 26px;
    height: 26px;
  }
  .brand-title-short {
    font-size: 0.84rem;
  }
  .btn-nav {
    padding: 5px 9px;
    font-size: 0.76rem;
    gap: 4px;
  }
  .btn-nav svg {
    width: 12px;
    height: 12px;
  }
  h1 {
    font-size: 1.65rem;
  }
  .lead {
    font-size: 0.94rem;
  }
}
</style>
</head>
<body>

<!-- Header Bar -->
<header class="header-bar">
  <a href="/" class="brand-lockup">
    <div class="brand-icon">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <rect width="14" height="20" x="5" y="2" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    </div>
    <div class="brand-text">
      <span class="brand-title-full">Universal Android Debloater MCP</span>
      <span class="brand-title-short">Android Debloater</span>
      <span class="brand-sub">Setup &amp; Architecture Guide</span>
    </div>
  </a>

  <div class="header-actions">
    <a href="/" class="btn-nav">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      <span>Home</span>
    </a>
    <a href="https://github.com/Murlikumar99/Universal-Android-Debloater-MCP-Server-" target="_blank" rel="noopener" class="btn-nav btn-accent">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
      </svg>
      <span>GitHub</span>
    </a>
  </div>
</header>

<!-- Mobile Sticky Navigation Pills Rail -->
<nav class="mobile-toc-bar" id="mobileTocBar" aria-label="Mobile Navigation">
  <a href="#start" class="mobile-toc-pill active">Overview</a>
  <a href="#adb" class="mobile-toc-pill">1. Install ADB</a>
  <a href="#phone" class="mobile-toc-pill">2. Phone Setup</a>
  <a href="#project" class="mobile-toc-pill">3. Project Setup</a>
  <a href="#connect" class="mobile-toc-pill">4. Connect</a>
  <a href="#run" class="mobile-toc-pill">5. Run Server</a>
  <a href="#clients" class="mobile-toc-pill">6. AI Clients</a>
  <a href="#python" class="mobile-toc-pill">Python &amp; Code</a>
  <a href="#flow" class="mobile-toc-pill">7. Walkthrough</a>
  <a href="#restore" class="mobile-toc-pill">8. Restore</a>
  <a href="#tools" class="mobile-toc-pill">9. Tools (23)</a>
  <a href="#env" class="mobile-toc-pill">10. Settings</a>
  <a href="#fix" class="mobile-toc-pill">11. Troubleshooting</a>
  <a href="#credits" class="mobile-toc-pill">Credits</a>
</nav>

<div class="layout">
<!-- Desktop Sticky Sidebar -->
<nav class="toc" aria-label="Desktop Sections">
  <b>Documentation</b>
  <a href="#start" class="on">Overview</a>
  <a href="#adb">1. Install ADB, Node &amp; Python</a>
  <a href="#phone">2. Prepare the Phone</a>
  <a href="#project">3. Install the Project</a>
  <a href="#connect">4. Connect a Device</a>
  <a href="#run">5. Run the Server</a>
  <a href="#clients">6. Connect AI Clients</a>
  <a href="#python">Python &amp; Code SDKs</a>
  <a href="#flow">7. Debloat Walkthrough</a>
  <a href="#restore">8. Restore Removed Apps</a>
  <a href="#tools">9. All 23 Tools Catalog</a>
  <a href="#env">10. Settings &amp; Data Paths</a>
  <a href="#fix">11. Troubleshooting</a>
  <a href="#credits">Credits &amp; License</a>
</nav>

<!-- Main Guide Content -->
<main>
  <h1 id="start">Android Debloater MCP Server: Full Setup Guide</h1>
  
  <p class="lead">Every command from install to restore, in order. The server lets an AI client or Python/TypeScript script read your phone over ADB and plan app removals. You approve every removal yourself.</p>

  <div class="meta-badges">
    <span class="meta-badge">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      MCP v1.0.0
    </span>
    <span class="meta-badge">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
      Platform Tools 34+
    </span>
    <span class="meta-badge">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
      Node.js &amp; Python 3.10+
    </span>
    <span class="meta-badge">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 12 2 2 4-4"/></svg>
      23 Tools Registered
    </span>
    <span class="meta-badge">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      UPI &amp; Banking Protected
    </span>
  </div>

  <!-- Safety Notice Box -->
  <div class="safety-callout">
    <div class="safety-header">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>Safety First — Human Approval Required</span>
    </div>
    <p>Removing system apps can break features, block system updates, or cause a bootloop if mishandled. Universal Android Debloater MCP enforces a three-tier safety barrier: <strong>hardcoded boot-critical packages are blocked permanently</strong>, banking/UPI dependencies are safeguarded, APKs are pulled locally before any action, and every removal requires interactive token verification.</p>
  </div>

  <div class="box">
    <p>Commands here follow the repository at <a href="https://github.com/Murlikumar99/Universal-Android-Debloater-MCP-Server-" target="_blank" rel="noopener">github.com/Murlikumar99/Universal-Android-Debloater-MCP-Server-</a>. Replace capital placeholders such as <code>SERIAL</code> with your actual connected device serial.</p>
  </div>

  <!-- Section 1 -->
  <section id="adb">
    <h2>1. Install ADB, Node.js, and Python</h2>
    <p>You need Node.js 20.11+, npm 10+, Android platform-tools 34+, and optionally Python 3.10+ for Python MCP client scripting.</p>
    
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">bash</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>node --version
npm --version
adb --version
python3 --version

<span class="c"># Install official Python MCP SDK &amp; HTTP client (optional for Python scripts)</span>
pip install mcp httpx</code></pre>
    </div>

    <h3>Linux (Ubuntu or Debian)</h3>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">bash</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>sudo apt update && sudo apt install -y android-sdk-platform-tools
adb --version</code></pre>
    </div>

    <h3>Linux (Fedora or Arch)</h3>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">bash</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code><span class="c"># Fedora</span>
sudo dnf install -y android-tools

<span class="c"># Arch Linux</span>
sudo pacman -S android-tools</code></pre>
    </div>

    <h3>macOS</h3>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">bash</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>brew install --cask android-platform-tools
adb --version</code></pre>
    </div>

    <h3>Windows</h3>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">powershell</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>winget install Google.PlatformTools

<span class="c"># or use the repository installer script</span>
powershell -ExecutionPolicy Bypass -File .\\scripts\\install.ps1</code></pre>
    </div>

    <h3>Automated Installer Script</h3>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">bash</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>bash ./scripts/install.sh</code></pre>
    </div>
    <p>If <code>adb</code> is not in your system PATH, configure the environment variable <code>ADB_PATH</code> to point to the binary.</p>
  </section>

  <!-- Section 2 -->
  <section id="phone">
    <h2>2. Prepare the phone or TV</h2>
    <ol>
      <li>Open <strong>Settings &gt; About phone</strong> and tap <strong>Build number</strong> seven times until developer mode is unlocked.</li>
      <li>Open <strong>Developer options</strong> and enable <strong>USB debugging</strong>.</li>
    </ol>

    <div class="tw">
      <table>
        <thead>
          <tr>
            <th>Brand</th>
            <th>Required Setting</th>
            <th>Why</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Xiaomi, Redmi, POCO</strong></td>
            <td>Enable <em>USB debugging (Security settings)</em> &amp; <em>Install via USB</em>. (Requires Mi Account + SIM).</td>
            <td>Without this, package state mutations throw <code>SecurityException</code>.</td>
          </tr>
          <tr>
            <td><strong>OPPO, Realme, OnePlus</strong></td>
            <td>Enable <em>Disable permission monitoring</em> at the bottom of Developer options.</td>
            <td>Prevents ColorOS / OxygenOS from blocking user-0 uninstalls.</td>
          </tr>
          <tr>
            <td><strong>Samsung</strong></td>
            <td>Turn off <em>Auto Blocker</em> while executing ADB commands.</td>
            <td>Auto Blocker intercepts USB package disable requests.</td>
          </tr>
          <tr>
            <td><strong>Vivo, iQOO</strong></td>
            <td>Grant USB installation authorization prompt on the display.</td>
            <td>Required for modifying system app visibility.</td>
          </tr>
          <tr>
            <td><strong>Pixel, Motorola, Nothing</strong></td>
            <td>USB debugging is sufficient.</td>
            <td>Standard AOSP behavior.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3>Android TV, Google TV, Fire TV</h3>
    <p>On Google TV open <em>Settings &gt; System &gt; About</em> and press OK seven times on <em>Android TV OS build</em>. On Android TV use <em>Device Preferences &gt; About &gt; Build</em>. On Fire TV use <em>My Fire TV &gt; About</em> and select the device name seven times. Then enable <em>Network debugging</em> in Developer options.</p>
  </section>

  <!-- Section 3 -->
  <section id="project">
    <h2>3. Install and check the project</h2>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">bash</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>git clone https://github.com/Murlikumar99/Universal-Android-Debloater-MCP-Server-.git
cd Universal-Android-Debloater-MCP-Server-

npm install
npm test
npm run build</code></pre>
    </div>
    <p>Verify all test suites pass with <code>npm test</code> before executing any operations on a physical device.</p>
  </section>

  <!-- Section 4 -->
  <section id="connect">
    <h2>4. Connect a device</h2>
    <h3>USB Connection</h3>
    <p>Connect your phone via data cable, select "File Transfer", and accept the "Allow USB debugging?" dialog with "Always allow".</p>
    
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">bash</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>adb devices -l</code></pre>
    </div>
    <p>A status of <code>device</code> means connection succeeded. If it displays <code>unauthorized</code>, accept the prompt on the screen.</p>

    <h3>Wireless Debugging (Android 11+)</h3>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">bash</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code><span class="c"># Pair device with pairing code from Developer options</span>
adb pair 192.168.1.45:39123 482910

<span class="c"># Connect to the main wireless debugging port</span>
adb connect 192.168.1.45:41555
adb devices -l</code></pre>
    </div>
  </section>

  <!-- Section 5 -->
  <section id="run">
    <h2>5. Run the server</h2>
    <h3>Try with Simulated Mock Devices</h3>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">bash</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>ADB_MOCK=1 npm run dev</code></pre>
    </div>
    <p>Starts the server with mock devices at <code>http://localhost:3000</code>. Physical devices are never touched.</p>

    <h3>Use Physical Real Device</h3>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">bash</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>ADB_MOCK=0 npm run dev</code></pre>
    </div>

    <h3>Stdio MCP Server for AI Clients</h3>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">bash</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code><span class="c"># Standalone execution over stdio</span>
node dist/index.js</code></pre>
    </div>
  </section>

  <!-- Section 6 -->
  <section id="clients">
    <h2>6. Connect your AI client</h2>
    
    <h3>Google Antigravity Setup</h3>
    <p>Google Antigravity provides agentic development workflows. Configure it automatically with OpenDesign or via JSON settings:</p>
    
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">bash</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code><span class="c"># Fast automatic install via OpenDesign</span>
od mcp install antigravity</code></pre>
    </div>

    <p>Or add this block to <code>~/.gemini/antigravity/mcp_config.json</code>:</p>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">json</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>{
  "mcpServers": {
    "android-debloater": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/Universal-Android-Debloater-MCP-Server-/dist/index.js"],
      "env": {
        "ADB_MOCK": "0",
        "LOG_LEVEL": "info"
      }
    }
  }
}</code></pre>
    </div>

    <h3>Claude Code, Gemini CLI, and OpenAI Codex CLI</h3>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">bash</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code><span class="c"># Claude Code CLI</span>
claude mcp add android-debloater -- node /ABSOLUTE/PATH/TO/Universal-Android-Debloater-MCP-Server-/dist/index.js

<span class="c"># Gemini CLI (~/.gemini/settings.json)</span>
gemini mcp add android-debloater node /ABSOLUTE/PATH/TO/Universal-Android-Debloater-MCP-Server-/dist/index.js

<span class="c"># OpenAI Codex CLI (~/.codex/config.toml)</span>
codex --mcp-config ~/.codex/mcp.json</code></pre>
    </div>

    <h3>Claude Desktop, Cursor, and Windsurf</h3>
    <div class="tw">
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Config Location</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Claude Desktop (macOS)</strong></td>
            <td><code>~/Library/Application Support/Claude/claude_desktop_config.json</code></td>
          </tr>
          <tr>
            <td><strong>Claude Desktop (Windows)</strong></td>
            <td><code>%APPDATA%\\Claude\\claude_desktop_config.json</code></td>
          </tr>
          <tr>
            <td><strong>Cursor</strong></td>
            <td><code>~/.cursor/mcp.json</code></td>
          </tr>
          <tr>
            <td><strong>Windsurf</strong></td>
            <td><code>~/.codeium/windsurf/mcp_config.json</code></td>
          </tr>
          <tr>
            <td><strong>VS Code (Copilot / Cline)</strong></td>
            <td><code>.vscode/mcp.json</code></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- Section: Python & Multi-Language Code SDKs -->
  <section id="python">
    <h2>Python &amp; Multi-Language Code SDKs</h2>
    <p>You can drive Universal Android Debloater MCP programmatically from <strong>Python 3.10+</strong>, <strong>TypeScript / Node.js</strong>, or via authenticated <strong>HTTP REST APIs</strong>. Below are complete, copy-ready scripts.</p>

    <h3>1. Python MCP Client SDK (<code>debloat_mcp_client.py</code>)</h3>
    <p>Connects to the MCP server over <code>stdio</code> using the official <code>mcp</code> Python library, inspects connected Android devices, syncs UAD/Canta/AppManager lists, classifies safe bloatware, and generates a cryptographically hashed removal plan:</p>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">python</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>import asyncio
import json
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

SERVER_PATH = "/ABSOLUTE/PATH/TO/Universal-Android-Debloater-MCP-Server-/dist/index.js"

async def run_debloat_workflow(serial: str) -> None:
    server_params = StdioServerParameters(
        command="node",
        args=[SERVER_PATH],
        env={"ADB_MOCK": "0", "LOG_LEVEL": "info"},
    )

    async with stdio_client(server_params) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()

            <span class="c"># 1. Enumerate all 23 registered MCP tools</span>
            tools_resp = await session.list_tools()
            print(f"Connected! {len(tools_resp.tools)} MCP tools available.")

            <span class="c"># 2. Inspect connected Android device profile &amp; RAM/storage</span>
            profile = await session.call_tool("get_device_profile", {"serial": serial})
            print("Device Profile:", profile.content[0].text)

            <span class="c"># 3. Sync community debloat databases (UAD-NG, AppManager, Canta)</span>
            await session.call_tool("sync_debloat_lists", {"forceRefresh": False})

            <span class="c"># 4. Classify installed packages and filter for 'Safe' tier</span>
            classified = await session.call_tool(
                "classify_apps",
                {"serial": serial, "filterTier": "Safe"}
            )
            safe_apps = json.loads(classified.content[0].text)
            print(f"Found {len(safe_apps.get('packages', []))} Safe bloatware packages.")

            <span class="c"># 5. Create an immutable removal plan (read-only until approved)</span>
            plan_resp = await session.call_tool(
                "plan_removal",
                {
                    "serial": serial,
                    "acknowledgeRisky": False,
                    "packages": [
                        {"packageName": "com.facebook.services", "action": "disable"},
                        {"packageName": "com.facebook.system", "action": "disable"},
                    ],
                },
            )
            plan_data = json.loads(plan_resp.content[0].text)
            plan_id = plan_data.get("planId")
            print(f"Created Plan ID: {plan_id}")
            print(f"Approve in terminal: node dist/index.js approve {plan_id}")

if __name__ == "__main__":
    asyncio.run(run_debloat_workflow("SERIAL"))</code></pre>
    </div>

    <h3>2. Python Direct ADB Package Inspector &amp; Backup Script (<code>android_audit.py</code>)</h3>
    <p>Standalone Python 3 utility that invokes <code>adb</code> using safe argument arrays (never <code>shell=True</code>) to audit user-0 packages, check OEM build properties, and pull APK backups with SHA-256 verification:</p>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">python</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>import hashlib
import json
import subprocess
from pathlib import Path
from typing import List, Dict

HARD_PROTECTED_PACKAGES = {
    "android",
    "com.android.systemui",
    "com.android.settings",
    "com.android.phone",
    "com.android.providers.telephony",
    "com.google.android.gms",
    "com.google.android.gsf",
}

def run_adb(serial: str, args: List[str]) -> str:
    <span class="c"># Always pass an argument list; never use shell=True</span>
    cmd = ["adb", "-s", serial] + args
    result = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=30)
    return result.stdout.strip()

def list_user0_packages(serial: str) -> List[Dict[str, str]]:
    raw = run_adb(serial, ["shell", "pm", "list", "packages", "-f", "--user", "0"])
    packages: List[Dict[str, str]] = []
    for line in raw.splitlines():
        if line.startswith("package:") and "=" in line:
            path_part, pkg_name = line[len("package:"):].rsplit("=", 1)
            packages.append({
                "packageName": pkg_name.strip(),
                "apkPath": path_part.strip(),
                "protected": pkg_name.strip() in HARD_PROTECTED_PACKAGES,
            })
    return packages

def backup_apk_with_sha256(serial: str, pkg_name: str, apk_path: str, out_dir: Path) -> Dict[str, str]:
    out_dir.mkdir(parents=True, exist_ok=True)
    local_apk = out_dir / f"{pkg_name}.apk"
    run_adb(serial, ["pull", apk_path, str(local_apk)])
    digest = hashlib.sha256(local_apk.read_bytes()).hexdigest()
    return {"packageName": pkg_name, "file": str(local_apk), "sha256": digest}

if __name__ == "__main__":
    device_serial = "SERIAL"
    pkgs = list_user0_packages(device_serial)
    print(json.dumps({"totalPackages": len(pkgs), "sample": pkgs[:5]}, indent=2))</code></pre>
    </div>

    <h3>3. Python HTTP REST Client with Session Authentication (<code>http_api_client.py</code>)</h3>
    <p>Communicates with the local web server proxy using short-lived <code>httpOnly</code> session cookies and bearer tokens:</p>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">python</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>import httpx

BASE_URL = "http://localhost:3000"
HEADERS = {"Origin": BASE_URL, "Content-Type": "application/json"}

with httpx.Client(base_url=BASE_URL, headers=HEADERS, timeout=15.0) as client:
    <span class="c"># 1. Acquire short-lived server-validated session token</span>
    auth_resp = client.post("/api/session")
    auth_resp.raise_for_status()
    token = auth_resp.json()["token"]
    client.headers["Authorization"] = f"Bearer {token}"

    <span class="c"># 2. Fetch live server, device, and debloat database status</span>
    status = client.get("/api/status").json()
    print("Connected Devices:", len(status.get("devices", [])))
    print("Registered MCP Tools:", len(status.get("tools", [])))

    <span class="c"># 3. Trigger a read-only debloat list sync</span>
    sync_res = client.post("/api/action", json={"action": "sync_lists"}).json()
    print("Sync Result:", sync_res)</code></pre>
    </div>

    <h3>4. TypeScript / Node.js MCP Client (<code>mcp-client.ts</code>)</h3>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">typescript</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["./dist/index.js"],
    env: { ...process.env, ADB_MOCK: "0" },
  });

  const client = new Client({ name: "debloat-ts-client", version: "1.0.0" });
  await client.connect(transport);

  const devices = await client.callTool({ name: "list_devices", arguments: {} });
  console.log("Devices:", devices.content);

  const report = await client.callTool({
    name: "classify_apps",
    arguments: { serial: "SERIAL", filterTier: "Safe" },
  });
  console.log("Safe Candidates:", report.content);

  await client.close();
}

main().catch(console.error);</code></pre>
    </div>

    <h3>5. Server Tool Implementation Architecture (<code>src/server.ts</code>)</h3>
    <p>How Universal Android Debloater MCP enforces strict input validation, command allowlisting, and zero-shell-interpolation execution:</p>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">typescript</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";

const execFileAsync = promisify(execFile);
const PACKAGE_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$/;

export function registerDebloatTools(server: McpServer) {
  server.tool(
    "explain_classification",
    "Returns safety tier, community consensus, and dependency trace for a package.",
    {
      serial: z.string().min(1),
      packageName: z.string().regex(PACKAGE_REGEX, "Invalid Android package name"),
    },
    async ({ serial, packageName }) => {
      <span class="c">// Argument array passed directly to OS execve — never a shell string</span>
      const { stdout } = await execFileAsync("adb", [
        "-s", serial, "shell", "dumpsys", "package", packageName,
      ]);
      return {
        content: [{ type: "text", text: JSON.stringify({ packageName, dumpsysLength: stdout.length }) }],
      };
    }
  );
}</code></pre>
    </div>
  </section>

  <!-- Section 7 -->
  <section id="flow">
    <h2>7. Debloat walkthrough</h2>
    <p>Commands and tools execute strictly in sequence across MCP JSON, Python, and ADB:</p>

    <h3>Step 1: Inspect the Device</h3>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">json</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>list_devices {}
get_device_profile { "serial": "SERIAL" }
get_resource_usage { "serial": "SERIAL" }</code></pre>
    </div>

    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">python</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code><span class="c"># Equivalent Python MCP calls</span>
devices = await session.call_tool("list_devices", {})
profile = await session.call_tool("get_device_profile", {"serial": "SERIAL"})
resources = await session.call_tool("get_resource_usage", {"serial": "SERIAL"})</code></pre>
    </div>

    <h3>Step 2: Sync Debloat Lists &amp; Classify Apps</h3>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">json</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>sync_debloat_lists { "forceRefresh": false }
classify_apps { "serial": "SERIAL", "filterTier": "Safe" }
explain_classification { "serial": "SERIAL", "packageName": "com.facebook.services" }</code></pre>
    </div>

    <h3>Step 3: Create Plan &amp; Local APK Backup</h3>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">json</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>create_backup {
  "serial": "SERIAL",
  "packages": ["com.facebook.services"]
}

plan_removal {
  "serial": "SERIAL",
  "acknowledgeRisky": false,
  "packages": [
    { "packageName": "com.facebook.services", "action": "disable" }
  ]
}</code></pre>
    </div>

    <h3>Step 4: Interactive Human Terminal Approval</h3>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">bash</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>node dist/index.js approve PLAN_ID</code></pre>
    </div>
    <p>Review every command in your terminal, type the verification code, and obtain your single-use approval token (valid for 10 minutes).</p>

    <h3>Step 5: Execute Plan (Dry Run First)</h3>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">json</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code><span class="c">// 1. Always dry run first</span>
execute_plan { "planId": "PLAN_ID", "approvalToken": "TOKEN", "dryRun": true }

<span class="c">// 2. Execute live changes</span>
execute_plan { "planId": "PLAN_ID", "approvalToken": "TOKEN", "dryRun": false }

<span class="c">// 3. Verify cryptographic SHA-256 audit log &amp; generate report</span>
verify_audit_log {}
generate_report { "serial": "SERIAL", "planId": "PLAN_ID" }</code></pre>
    </div>
  </section>

  <!-- Section 8 -->
  <section id="restore">
    <h2>8. Restore removed apps</h2>
    <p>Any package uninstalled for user 0 or disabled can be restored at any time via MCP, Python, generated shell scripts, or ADB.</p>
    
    <h3>Via MCP Tool</h3>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">json</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>plan_restore { "serial": "SERIAL", "packages": ["com.facebook.services"] }
execute_restore { "serial": "SERIAL", "packages": ["com.facebook.services"], "dryRun": false }</code></pre>
    </div>

    <h3>Via Python Batch Restore Script (<code>restore_packages.py</code>)</h3>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">python</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>import subprocess
from typing import List

def restore_packages(serial: str, packages: List[str]) -> None:
    for pkg in packages:
        subprocess.run(
            ["adb", "-s", serial, "shell", "cmd", "package", "install-existing", "--user", "0", pkg],
            check=False,
        )
        subprocess.run(
            ["adb", "-s", serial, "shell", "pm", "enable", "--user", "0", pkg],
            check=False,
        )
        print(f"Restored and enabled: {pkg}")

if __name__ == "__main__":
    restore_packages("SERIAL", ["com.facebook.services", "com.facebook.system"])</code></pre>
    </div>

    <h3>Via Generated Standalone Scripts</h3>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">bash</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code><span class="c"># Linux or macOS</span>
bash ~/.local/state/android-debloater-mcp/restore-scripts/restore-TIMESTAMP-PLANID.sh

<span class="c"># Windows PowerShell</span>
powershell -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\\android-debloater-mcp\\restore-scripts\\restore-TIMESTAMP-PLANID.ps1"</code></pre>
    </div>

    <h3>Directly via ADB Terminal</h3>
    <div class="code-window">
      <div class="code-header">
        <div class="window-dots"><div class="window-dot"></div><div class="window-dot"></div><div class="window-dot"></div></div>
        <span class="code-lang">bash</span>
        <button type="button" class="btn-copy">Copy</button>
      </div>
      <pre><code>adb -s SERIAL shell cmd package install-existing --user 0 com.facebook.services
adb -s SERIAL shell pm enable --user 0 com.facebook.services</code></pre>
    </div>
  </section>

  <!-- Section 9: 23 Tools -->
  <section id="tools">
    <h2>9. All 23 Tools Catalog</h2>
    <p>The MCP server exposes 23 specialized tools categorized by function:</p>
    
    <input type="text" id="toolSearch" class="filter" placeholder="Search 23 MCP tools by name or description..." aria-label="Search tools">

    <div class="tw">
      <table id="toolsTable">
        <thead>
          <tr>
            <th>Tool Name</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>list_devices</code></td>
            <td><span class="badge-ro">Read-only</span></td>
            <td>Lists all connected USB and wireless devices with connection and authorization status.</td>
          </tr>
          <tr>
            <td><code>get_device_profile</code></td>
            <td><span class="badge-ro">Read-only</span></td>
            <td>Reads brand, model, Android version, security patch, skin (OneUI, MIUI), and battery.</td>
          </tr>
          <tr>
            <td><code>get_resource_usage</code></td>
            <td><span class="badge-ro">Read-only</span></td>
            <td>Fetches RAM breakdown, CPU load averages, storage stats, and top background apps.</td>
          </tr>
          <tr>
            <td><code>adb_pair</code></td>
            <td><span class="badge-ro">Read-only</span></td>
            <td>Pairs an Android 11+ wireless debugging target via IP:port and 6-digit PIN.</td>
          </tr>
          <tr>
            <td><code>adb_connect</code></td>
            <td><span class="badge-ro">Read-only</span></td>
            <td>Connects to a wireless ADB address over local Wi-Fi.</td>
          </tr>
          <tr>
            <td><code>adb_disconnect</code></td>
            <td><span class="badge-ro">Read-only</span></td>
            <td>Disconnects an active wireless ADB target.</td>
          </tr>
          <tr>
            <td><code>list_installed_apps</code></td>
            <td><span class="badge-ro">Read-only</span></td>
            <td>Enumerates third-party or system packages with filters for enabled/disabled status.</td>
          </tr>
          <tr>
            <td><code>get_app_details</code></td>
            <td><span class="badge-ro">Read-only</span></td>
            <td>Extracts APK path, version, requested permissions, installer, and shared user ID.</td>
          </tr>
          <tr>
            <td><code>audit_permissions</code></td>
            <td><span class="badge-ro">Read-only</span></td>
            <td>Calculates risk scores for packages holding sensitive permissions.</td>
          </tr>
          <tr>
            <td><code>sync_debloat_lists</code></td>
            <td><span class="badge-ro">Read-only</span></td>
            <td>Downloads and normalizes UAD, AppManager, and Canta community debloat databases.</td>
          </tr>
          <tr>
            <td><code>get_list_status</code></td>
            <td><span class="badge-ro">Read-only</span></td>
            <td>Inspects cache age, rule count, conflict resolution stats, and update timestamps.</td>
          </tr>
          <tr>
            <td><code>lookup_package</code></td>
            <td><span class="badge-ro">Read-only</span></td>
            <td>Returns detailed breakdown across all three debloat databases for a specific package.</td>
          </tr>
          <tr>
            <td><code>classify_apps</code></td>
            <td><span class="badge-ro">Read-only</span></td>
            <td>Rates installed packages into Safe, Probably Safe, Risky, or Unsafe categories.</td>
          </tr>
          <tr>
            <td><code>explain_classification</code></td>
            <td><span class="badge-ro">Read-only</span></td>
            <td>Outputs exact rationales, dependency traces, and recommendations for a package.</td>
          </tr>
          <tr>
            <td><code>plan_removal</code></td>
            <td><span class="badge-ro">Read-only</span></td>
            <td>Generates an immutable, cryptographically hashed debloat plan with rollback commands.</td>
          </tr>
          <tr>
            <td><code>create_backup</code></td>
            <td><span class="badge-ro">Read-only (Host Disk)</span></td>
            <td>Pulls APK files from the phone to local host disk and calculates SHA-256 checksums.</td>
          </tr>
          <tr>
            <td><code>list_backups</code></td>
            <td><span class="badge-ro">Read-only</span></td>
            <td>Lists all local APK backups, timestamps, and integrity records.</td>
          </tr>
          <tr>
            <td><code>generate_restore_script</code></td>
            <td><span class="badge-ro">Read-only</span></td>
            <td>Compiles bash and PowerShell restoration scripts tailored to a specific plan ID.</td>
          </tr>
          <tr>
            <td><code>execute_plan</code></td>
            <td><span class="badge-rw">Modifies Device</span></td>
            <td>Executes removal plan commands after validating single-use token. (Dry-run default).</td>
          </tr>
          <tr>
            <td><code>plan_restore</code></td>
            <td><span class="badge-ro">Read-only</span></td>
            <td>Previews restoration commands for uninstalled or disabled packages.</td>
          </tr>
          <tr>
            <td><code>execute_restore</code></td>
            <td><span class="badge-rw">Modifies Device</span></td>
            <td>Restores target packages using install-existing and pm enable commands.</td>
          </tr>
          <tr>
            <td><code>generate_report</code></td>
            <td><span class="badge-ro">Read-only</span></td>
            <td>Generates before-and-after audit reports in Markdown and JSON formats.</td>
          </tr>
          <tr>
            <td><code>verify_audit_log</code></td>
            <td><span class="badge-ro">Read-only</span></td>
            <td>Verifies cryptographic SHA-256 hash-chain integrity of local execution logs.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- Section 10 -->
  <section id="env">
    <h2>10. Settings &amp; Data Paths</h2>
    <div class="tw">
      <table>
        <thead>
          <tr>
            <th>Variable</th>
            <th>Default</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>ADB_MOCK</code></td><td>0</td><td>Set to 1 to simulate Android devices in development.</td></tr>
          <tr><td><code>ADB_PATH</code></td><td>auto</td><td>Explicit filesystem path to the adb binary.</td></tr>
          <tr><td><code>PORT</code></td><td>3000</td><td>Port for the web console and API.</td></tr>
          <tr><td><code>ALLOWED_ORIGINS</code></td><td>http://localhost:3000</td><td>Allowed origins for web console security.</td></tr>
          <tr><td><code>LOG_LEVEL</code></td><td>info</td><td>debug, info, warn, or error.</td></tr>
        </tbody>
      </table>
    </div>

    <div class="box">
      <p><strong>Storage Paths:</strong></p>
      <ul>
        <li>Linux: <code>~/.local/state/android-debloater-mcp/</code></li>
        <li>macOS: <code>~/Library/Application Support/android-debloater-mcp/</code></li>
        <li>Windows: <code>%LOCALAPPDATA%\\android-debloater-mcp\\</code></li>
      </ul>
    </div>
  </section>

  <!-- Section 11 -->
  <section id="fix">
    <h2>11. Troubleshooting</h2>
    <div class="tw">
      <table>
        <thead>
          <tr>
            <th>Error / Symptom</th>
            <th>Resolution</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>ADB_NOT_FOUND</code></td>
            <td>Install platform-tools or set <code>ADB_PATH</code> to the binary location.</td>
          </tr>
          <tr>
            <td><code>DEVICE_UNAUTHORIZED</code></td>
            <td>Unlock phone screen and accept the USB Debugging permission dialog.</td>
          </tr>
          <tr>
            <td>Xiaomi: "Shell cannot change component state"</td>
            <td>Enable <em>USB debugging (Security settings)</em> with SIM inserted and Mi account logged in.</td>
          </tr>
          <tr>
            <td><code>APPROVAL_INVALID_OR_EXPIRED</code></td>
            <td>Approval tokens expire after 10 minutes or upon single use. Run <code>node dist/index.js approve PLAN_ID</code> again.</td>
          </tr>
          <tr>
            <td><code>UNSAFE_PACKAGE_BLOCKED</code></td>
            <td>The package is protected by the core safety engine (bootloader, telephony, framework). It cannot be removed.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <section id="credits">
    <h2>Credits &amp; License</h2>
    <p>Universal Android Debloater MCP is open source under the MIT License. Debloat community lists retain their respective licenses: UAD-NG (GPL-3.0), AppManager (AGPL-3.0), and Canta (LGPL-3.0).</p>
    <p><a class="btn" href="https://github.com/Murlikumar99/Universal-Android-Debloater-MCP-Server-" target="_blank" rel="noopener">View GitHub Repository</a></p>
  </section>
</main>
</div>

<script>
// Copy Buttons
function safeCopy(text, callback) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(callback).catch(function(){
      fallback(text, callback);
    });
  } else {
    fallback(text, callback);
  }
  function fallback(val, cb) {
    var ta = document.createElement("textarea");
    ta.value = val;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch(e) {}
    document.body.removeChild(ta);
    cb();
  }
}

document.querySelectorAll(".code-window").forEach(function(win){
  var btn = win.querySelector(".btn-copy");
  var pre = win.querySelector("pre");
  if (!btn || !pre) return;
  btn.addEventListener("click", function(){
    var code = pre.querySelector("code").innerText;
    safeCopy(code, function(){
      btn.textContent = "Copied!";
      btn.classList.add("copied");
      setTimeout(function(){
        btn.textContent = "Copy";
        btn.classList.remove("copied");
      }, 1800);
    });
  });
});

// Tool Search Filter
var toolSearch = document.getElementById("toolSearch");
if (toolSearch) {
  toolSearch.addEventListener("input", function(){
    var query = toolSearch.value.toLowerCase().trim();
    document.querySelectorAll("#toolsTable tbody tr").forEach(function(row){
      var match = row.textContent.toLowerCase().indexOf(query) > -1;
      row.style.display = match ? "" : "none";
    });
  });
}

// Smooth anchor navigation for Desktop and Mobile TOC
var tocLinks = [].slice.call(document.querySelectorAll("nav.toc a"));
var mobPills = [].slice.call(document.querySelectorAll(".mobile-toc-pill"));
var sections = tocLinks.map(function(link){
  var href = link.getAttribute("href");
  return href ? document.querySelector(href) : null;
});

var allNavLinks = [].slice.call(document.querySelectorAll("nav.toc a, .mobile-toc-pill"));
allNavLinks.forEach(function(link){
  link.addEventListener("click", function(e){
    var href = link.getAttribute("href");
    if (href && href.startsWith("#")) {
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        var headerOffset = window.innerWidth <= 860 ? 105 : 20;
        var elementPosition = target.getBoundingClientRect().top;
        var offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: "smooth"
        });
      }
    }
  });
});

var currentActiveIndex = -1;
var isTouchingBar = false;
var bar = document.getElementById("mobileTocBar");

if (bar) {
  bar.addEventListener("touchstart", function() { isTouchingBar = true; }, { passive: true });
  bar.addEventListener("touchend", function() {
    setTimeout(function() { isTouchingBar = false; }, 600);
  }, { passive: true });
}

function updateScrollSpy(){
  var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
  var probeY = scrollY + 140;
  var activeIndex = 0;

  for (var i = 0; i < sections.length; i++) {
    var sec = sections[i];
    if (sec && sec.offsetTop <= probeY) {
      activeIndex = i;
    }
  }

  // Only run updates when the active section index actually changes
  if (activeIndex === currentActiveIndex) {
    return;
  }
  currentActiveIndex = activeIndex;

  tocLinks.forEach(function(link, index){
    link.classList.toggle("on", index === activeIndex);
  });

  mobPills.forEach(function(pill, index){
    var isActive = index === activeIndex;
    pill.classList.toggle("active", isActive);
    // Never call pill.scrollIntoView() which locks window touch scrolling!
    // Instead, scroll the mobileTocBar container horizontally only.
    if (isActive && bar && !isTouchingBar) {
      var pillLeft = pill.offsetLeft;
      var pillWidth = pill.offsetWidth;
      var barWidth = bar.clientWidth;
      var targetLeft = pillLeft - (barWidth / 2) + (pillWidth / 2);
      bar.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
    }
  });
}

// RequestAnimationFrame throttled scroll listener for 60/120fps touch scroll
var scrollTicking = false;
window.addEventListener("scroll", function(){
  if (!scrollTicking) {
    window.requestAnimationFrame(function(){
      updateScrollSpy();
      scrollTicking = false;
    });
    scrollTicking = true;
  }
}, { passive: true });

updateScrollSpy();
</script>
</body>
</html>`;
