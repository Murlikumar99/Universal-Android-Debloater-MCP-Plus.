export const LANDING_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Debloat Android with MCP — Universal Android Debloater MCP</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/tokens.css">
  <style>
    :root {
      --bg: #07090e;
      --card-bg: #0d1117;
      --card-inner: #080b10;
      --border: rgba(255, 255, 255, 0.08);
      --border-hover: rgba(255, 255, 255, 0.16);
      --lime: #ccff00;
      --lime-hover: #b8e600;
      --text: #ffffff;
      --text-muted: #8b949e;
      --text-dim: #64748b;
      --code-bg: #0c1017;
      --pill-safe-bg: rgba(74, 222, 128, 0.12);
      --pill-safe-text: #4ade80;
      --pill-safe-border: rgba(74, 222, 128, 0.25);
      --pill-prob-bg: rgba(250, 204, 21, 0.12);
      --pill-prob-text: #facc15;
      --pill-prob-border: rgba(250, 204, 21, 0.25);
      --pill-risk-bg: rgba(251, 146, 60, 0.12);
      --pill-risk-text: #fb923c;
      --pill-risk-border: rgba(251, 146, 60, 0.25);
      --pill-unsafe-bg: rgba(248, 113, 113, 0.12);
      --pill-unsafe-text: #f87171;
      --pill-unsafe-border: rgba(248, 113, 113, 0.25);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    html {
      scroll-behavior: smooth;
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    /* Container */
    .container {
      max-width: 1140px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* Navbar */
    header {
      padding: 20px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(7, 9, 14, 0.9);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .nav-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-icon {
      width: 30px;
      height: 30px;
      background: var(--lime);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
    }

    .brand-title {
      font-size: 0.9rem;
      font-weight: 700;
      line-height: 1.15;
      color: #fff;
      display: flex;
      flex-direction: column;
    }

    .nav-menu {
      display: flex;
      align-items: center;
      gap: 28px;
      font-size: 0.88rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .nav-menu a:hover {
      color: #fff;
    }

    .btn-lime {
      background: var(--lime);
      color: #000;
      font-weight: 700;
      font-size: 0.88rem;
      padding: 9px 20px;
      border-radius: 9999px;
      transition: background 0.15s, transform 0.15s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: none;
      cursor: pointer;
    }

    .btn-lime:hover {
      background: var(--lime-hover);
    }

    .btn-lime-rect {
      background: var(--lime);
      color: #000;
      font-weight: 700;
      font-size: 0.92rem;
      padding: 12px 22px;
      border-radius: 8px;
      transition: background 0.15s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: none;
      cursor: pointer;
    }

    .btn-lime-rect:hover {
      background: var(--lime-hover);
    }

    .btn-dark {
      background: #0d1117;
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.14);
      font-weight: 600;
      font-size: 0.92rem;
      padding: 12px 20px;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-dark:hover {
      border-color: rgba(255, 255, 255, 0.3);
      background: #141a24;
    }

    /* Hero Section */
    .hero-section {
      padding: 72px 0 64px;
    }

    .hero-grid {
      display: grid;
      grid-template-columns: 1fr 1.08fr;
      gap: 48px;
      align-items: center;
    }

    .hero-title {
      font-size: 3.85rem;
      font-weight: 800;
      line-height: 1.04;
      letter-spacing: -0.035em;
      margin-bottom: 22px;
    }

    .hero-desc {
      color: var(--text-muted);
      font-size: 1.05rem;
      line-height: 1.6;
      max-width: 460px;
      margin-bottom: 30px;
    }

    .hero-cta {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .hero-subtext {
      color: var(--text-dim);
      font-size: 0.85rem;
      letter-spacing: 0.01em;
    }

    /* Code Window */
    .code-window {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
    }

    .code-header {
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .code-dots {
      display: flex;
      gap: 6px;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .dot-red { background: #ef4444; }
    .dot-yellow { background: #eab308; }
    .dot-green { background: #22c55e; }

    .code-filename {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .code-body {
      padding: 18px 20px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      line-height: 1.65;
      overflow-x: auto;
      color: #e6edf3;
      counter-reset: line-number;
    }

    .code-line {
      display: flex;
    }

    .line-no {
      color: #484f58;
      width: 26px;
      flex-shrink: 0;
      user-select: none;
      text-align: right;
      padding-right: 14px;
    }

    .kwd { color: #ff7b72; font-weight: 500; }
    .str { color: #7ee787; }
    .com { color: #8b949e; font-style: italic; }
    .fn { color: #d2a8ff; }
    .var { color: #79c0ff; }
    .num { color: #79c0ff; }

    /* 4-Item Feature Strip */
    .strip-section {
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      padding: 34px 0;
      margin-bottom: 80px;
    }

    .strip-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 28px;
    }

    .strip-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
    }

    .strip-item:not(:last-child)::after {
      content: "";
      position: absolute;
      right: -14px;
      top: 4px;
      bottom: 4px;
      width: 1px;
      background: var(--border);
    }

    .strip-head {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
    }

    .strip-head svg {
      color: var(--lime);
      flex-shrink: 0;
    }

    .strip-desc {
      color: var(--text-muted);
      font-size: 0.85rem;
      line-height: 1.45;
    }

    /* Section Headers */
    .section-kicker {
      color: var(--lime);
      font-size: 0.85rem;
      font-weight: 700;
      margin-bottom: 8px;
      text-transform: capitalize;
    }

    .section-heading {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      margin-bottom: 10px;
      color: #fff;
    }

    .section-sub {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-bottom: 36px;
    }

    /* Features Grid */
    .features-section {
      margin-bottom: 96px;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .feat-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: border-color 0.15s, transform 0.15s;
    }

    .feat-card:hover {
      border-color: var(--border-hover);
      transform: translateY(-2px);
    }

    .feat-icon-wrap {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.04);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--lime);
    }

    .feat-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #fff;
    }

    .feat-desc {
      color: var(--text-muted);
      font-size: 0.88rem;
      line-height: 1.45;
    }

    /* Process Section */
    .process-section {
      margin-bottom: 96px;
    }

    .process-grid {
      display: grid;
      grid-template-columns: 1fr auto 1fr auto 1fr;
      align-items: center;
      gap: 14px;
    }

    .step-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px 22px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .step-icon-wrap {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.04);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--lime);
    }

    .step-title {
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
    }

    .step-desc {
      color: var(--text-muted);
      font-size: 0.85rem;
      line-height: 1.45;
    }

    .step-arrow {
      color: var(--lime);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    /* Dashboard Section */
    .dashboard-section {
      margin-bottom: 80px;
    }

    .dashboard-split {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 40px;
      align-items: center;
    }

    .dash-window {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      display: grid;
      grid-template-columns: 170px 1fr;
      min-height: 330px;
    }

    .dash-sidebar {
      background: rgba(0, 0, 0, 0.35);
      border-right: 1px solid var(--border);
      padding: 18px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .dash-side-title {
      font-size: 0.78rem;
      font-weight: 700;
      color: #fff;
      padding: 4px 10px 10px;
    }

    .dash-nav-item {
      padding: 7px 10px;
      font-size: 0.78rem;
      color: var(--text-muted);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .dash-nav-item:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.04);
    }

    .dash-nav-item.active {
      background: var(--lime);
      color: #000;
      font-weight: 700;
    }

    .dash-main {
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
    }

    .dash-pane-title {
      font-size: 0.98rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 2px;
    }

    .dash-pane-sub {
      color: var(--text-muted);
      font-size: 0.75rem;
      margin-bottom: 16px;
    }

    .dash-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.78rem;
    }

    .dash-table th {
      text-align: left;
      padding: 8px 6px;
      color: var(--text-dim);
      font-weight: 500;
      border-bottom: 1px solid var(--border);
      font-size: 0.72rem;
    }

    .dash-table td {
      padding: 10px 6px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: var(--text-muted);
    }

    .dash-table td.pkg-name {
      font-family: 'JetBrains Mono', monospace;
      color: #fff;
      font-size: 0.76rem;
    }

    .tier-badge {
      font-size: 0.68rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 9999px;
      display: inline-block;
      white-space: nowrap;
    }

    .tier-safe {
      background: var(--pill-safe-bg);
      color: var(--pill-safe-text);
      border: 1px solid var(--pill-safe-border);
    }

    .tier-prob {
      background: var(--pill-prob-bg);
      color: var(--pill-prob-text);
      border: 1px solid var(--pill-prob-border);
    }

    .tier-risk {
      background: var(--pill-risk-bg);
      color: var(--pill-risk-text);
      border: 1px solid var(--pill-risk-border);
    }

    .tier-unsafe {
      background: var(--pill-unsafe-bg);
      color: var(--pill-unsafe-text);
      border: 1px solid var(--pill-unsafe-border);
    }

    .dash-caption {
      font-size: 0.76rem;
      color: var(--text-dim);
      margin-top: 10px;
    }

    .dash-bullets {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 20px 0 28px;
      font-size: 0.92rem;
      color: #d1d5db;
    }

    .dash-bullet-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .dash-check {
      color: var(--lime);
      font-weight: bold;
    }

    /* Documentation Card */
    .docs-banner-section {
      margin-bottom: 84px;
    }

    .docs-banner {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 28px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }

    .docs-left {
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .docs-icon {
      color: var(--lime);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .docs-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 4px;
    }

    .docs-desc {
      color: var(--text-muted);
      font-size: 0.88rem;
    }

    /* Footer */
    footer {
      border-top: 1px solid var(--border);
      padding: 56px 0 40px;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr 1fr 1fr;
      gap: 40px;
      margin-bottom: 48px;
    }

    .footer-brand {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .footer-desc {
      color: var(--text-muted);
      font-size: 0.86rem;
      line-height: 1.5;
      max-width: 270px;
    }

    .footer-col-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 14px;
    }

    .footer-links {
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .footer-links a:hover {
      color: #fff;
    }

    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      color: var(--text-dim);
    }

    /* Mobile Menu Toggle Button */
    .mobile-menu-btn {
      display: none;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: #fff;
      cursor: pointer;
      transition: all 0.15s;
    }

    .mobile-menu-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: var(--border-hover);
    }

    /* Mobile Nav Drawer */
    .mobile-nav-drawer {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: #07090e;
      border-bottom: 1px solid var(--border);
      padding: 20px 24px 28px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.95);
      flex-direction: column;
      gap: 12px;
      z-index: 99;
      transform: translateY(-8px);
      opacity: 0;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
      pointer-events: none;
    }

    .mobile-nav-drawer.open {
      display: flex;
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    .btn-copy-code {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border);
      color: var(--text-muted);
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-copy-code:hover {
      background: var(--lime);
      color: #000;
      border-color: var(--lime);
    }

    .mobile-nav-link {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text-muted);
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: color 0.15s;
    }

    .mobile-nav-link:hover, .mobile-nav-link:active {
      color: var(--lime);
    }

    .mobile-cta-wrap {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* Responsive */
    @media (max-width: 960px) {
      .hero-grid { grid-template-columns: 1fr; }
      .strip-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
      .strip-item::after { display: none; }
      .features-grid { grid-template-columns: repeat(2, 1fr); }
      .process-grid { grid-template-columns: 1fr; }
      .step-arrow { transform: rotate(90deg); margin: 6px 0; }
      .dashboard-split { grid-template-columns: 1fr; }
      .footer-grid { grid-template-columns: 1fr 1fr; }
    }

    @media (max-width: 820px) {
      .nav-menu { display: none; }
      .header-desktop-cta { display: none; }
      .mobile-menu-btn { display: flex; }
    }

    @media (max-width: 640px) {
      .hero-title { font-size: 2.6rem; }
      .strip-grid { grid-template-columns: 1fr; }
      .features-grid { grid-template-columns: 1fr; }
      .dash-window { grid-template-columns: 1fr; }
      .dash-sidebar { border-right: none; border-bottom: 1px solid var(--border); }
      .docs-banner { flex-direction: column; align-items: flex-start; }
      .footer-grid { grid-template-columns: 1fr; }
      .footer-bottom { flex-direction: column; gap: 10px; align-items: flex-start; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <header>
    <div class="container nav-inner">
      <a href="/" class="brand">
        <div class="brand-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="20" x="5" y="2" rx="2" />
            <path d="M12 18h.01" />
          </svg>
        </div>
        <div class="brand-title">
          <span>Universal Android</span>
          <span>Debloater MCP</span>
        </div>
      </a>

      <nav class="nav-menu">
        <a href="#features">Features</a>
        <a href="#process">Process</a>
        <a href="#dashboard">Dashboard</a>
        <a href="/guide">Docs</a>
        <a href="#about">About</a>
      </nav>

      <div style="display: flex; align-items: center; gap: 10px;">
        <a href="/guide" class="btn-lime header-desktop-cta">Get started</a>

        <!-- Mobile Menu Toggle Button -->
        <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Toggle navigation menu" aria-expanded="false" onclick="toggleMobileMenu()">
          <svg id="menuIconOpen" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" x2="20" y1="6" y2="6"/>
            <line x1="4" x2="20" y1="12" y2="12"/>
            <line x1="4" x2="20" y1="18" y2="18"/>
          </svg>
          <svg id="menuIconClose" style="display: none;" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Navigation Drawer -->
    <div class="mobile-nav-drawer" id="mobileNavDrawer">
      <a href="#features" class="mobile-nav-link" onclick="closeMobileMenu()">Features <span>&rarr;</span></a>
      <a href="#process" class="mobile-nav-link" onclick="closeMobileMenu()">Process <span>&rarr;</span></a>
      <a href="#dashboard" class="mobile-nav-link" onclick="closeMobileMenu()">Dashboard <span>&rarr;</span></a>
      <a href="/guide" class="mobile-nav-link" onclick="closeMobileMenu()">Docs &amp; Setup Guide <span>&rarr;</span></a>
      <a href="#about" class="mobile-nav-link" onclick="closeMobileMenu()">About <span>&rarr;</span></a>
      
      <div class="mobile-cta-wrap">
        <a href="/guide" class="btn-lime-rect" style="text-align: center; justify-content: center; width: 100%;" onclick="closeMobileMenu()">
          Get started &rarr;
        </a>
        <a href="https://github.com/Murlikumar99/Universal-Android-Debloater-MCP-Server-" target="_blank" rel="noopener" class="btn-dark" style="text-align: center; justify-content: center; width: 100%;">
          View on GitHub
        </a>
      </div>
    </div>
  </header>

  <main>
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container hero-grid">
        <div class="hero-left">
          <h1 class="hero-title">Debloat<br>Android with<br>MCP</h1>
          <p class="hero-desc">
            Inspect packages, understand system app risks, and plan removals through an open-source MCP server. Nothing changes on your phone until you approve it.
          </p>
          <div class="hero-cta">
            <a href="/guide" class="btn-lime-rect">Get started &rarr;</a>
            <a href="https://github.com/Murlikumar99/Universal-Android-Debloater-MCP-Server-" target="_blank" rel="noopener" class="btn-dark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              View on GitHub
            </a>
          </div>
          <div class="hero-subtext">Open source &middot; MIT licensed &middot; Developer friendly</div>
        </div>

        <div class="hero-right">
          <div class="code-window">
            <div class="code-header">
              <div class="code-dots">
                <span class="dot dot-red"></span>
                <span class="dot dot-yellow"></span>
                <span class="dot dot-green"></span>
              </div>
              <span class="code-filename">list-packages.ts</span>
              <button type="button" class="btn-copy-code" onclick="copyHeroCode(this)" title="Copy snippet" aria-label="Copy snippet">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                <span>Copy</span>
              </button>
            </div>
            <pre class="code-body"><code><div class="code-line"><span class="line-no">1</span><span><span class="kwd">import</span> { <span class="fn">McpServer</span> } <span class="kwd">from</span> <span class="str">"@modelcontextprotocol/sdk/server/mcp.js"</span>;</span></div><div class="code-line"><span class="line-no">2</span><span><span class="kwd">import</span> { <span class="var">execFile</span> } <span class="kwd">from</span> <span class="str">"node:child_process"</span>;</span></div><div class="code-line"><span class="line-no">3</span><span></span></div><div class="code-line"><span class="line-no">4</span><span><span class="kwd">const</span> <span class="var">server</span> = <span class="kwd">new</span> <span class="fn">McpServer</span>({</span></div><div class="code-line"><span class="line-no">5</span><span>  <span class="var">name</span>: <span class="str">"android-debloater"</span>,</span></div><div class="code-line"><span class="line-no">6</span><span>  <span class="var">version</span>: <span class="str">"0.1.0"</span>,</span></div><div class="code-line"><span class="line-no">7</span><span>});</span></div><div class="code-line"><span class="line-no">8</span><span></span></div><div class="code-line"><span class="line-no">9</span><span><span class="com">// argument array, never a shell string</span></span></div><div class="code-line"><span class="line-no">10</span><span><span class="var">server</span>.<span class="fn">tool</span>(<span class="str">"list_packages"</span>, { <span class="var">serial</span>: <span class="var">z</span>.<span class="fn">string</span>() },</span></div><div class="code-line"><span class="line-no">11</span><span>  <span class="kwd">async</span> ({ <span class="var">serial</span> }) =&gt; {</span></div><div class="code-line"><span class="line-no">12</span><span>    <span class="kwd">const</span> <span class="var">out</span> = <span class="kwd">await</span> <span class="fn">adb</span>([</span></div><div class="code-line"><span class="line-no">13</span><span>      <span class="str">"-s"</span>, <span class="var">serial</span>, <span class="str">"shell"</span>,</span></div><div class="code-line"><span class="line-no">14</span><span>      <span class="str">"pm"</span>, <span class="str">"list"</span>, <span class="str">"packages"</span>, <span class="str">"--user"</span>, <span class="str">"0"</span>,</span></div><div class="code-line"><span class="line-no">15</span><span>    ]);</span></div><div class="code-line"><span class="line-no">16</span><span>    <span class="kwd">return</span> { <span class="var">content</span>: [{ <span class="var">type</span>: <span class="str">"text"</span>, <span class="var">text</span>: <span class="var">out</span> }] };</span></div><div class="code-line"><span class="line-no">17</span><span>  });</span></div></code></pre>
          </div>
        </div>
      </div>
    </section>

    <!-- 4-Feature Strip -->
    <section class="strip-section">
      <div class="container strip-grid">
        <div class="strip-item">
          <div class="strip-head">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            <span>Open source</span>
          </div>
          <p class="strip-desc">MIT licensed and community driven.</p>
        </div>

        <div class="strip-item">
          <div class="strip-head">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
            <span>MCP powered</span>
          </div>
          <p class="strip-desc">Built on the Model Context Protocol.</p>
        </div>

        <div class="strip-item">
          <div class="strip-head">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>
            <span>ADB integration</span>
          </div>
          <p class="strip-desc">Talks to your phone through Android Debug Bridge.</p>
        </div>

        <div class="strip-item">
          <div class="strip-head">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
            <span>Safety first</span>
          </div>
          <p class="strip-desc">Review, approve and undo supported changes.</p>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section" id="features">
      <div class="container">
        <div class="section-kicker">Features</div>
        <h2 class="section-heading">Everything you need to debloat Android</h2>
        <p class="section-sub">A focused set of tools to inspect, plan and maintain Android packages.</p>

        <div class="features-grid">
          <div class="feat-card">
            <div class="feat-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
            </div>
            <div class="feat-title">Package inspection</div>
            <p class="feat-desc">List installed apps with versions, permissions and install source.</p>
          </div>

          <div class="feat-card">
            <div class="feat-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
            </div>
            <div class="feat-title">Safe debloating</div>
            <p class="feat-desc">Four safety tiers. Unsafe apps can never be planned for removal.</p>
          </div>

          <div class="feat-card">
            <div class="feat-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 22 4-10 4 10"/></svg>
            </div>
            <div class="feat-title">MCP integration</div>
            <p class="feat-desc">Works with Claude Code, Codex, Antigravity, Gemini CLI and more.</p>
          </div>

          <div class="feat-card">
            <div class="feat-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
            </div>
            <div class="feat-title">Operation history</div>
            <p class="feat-desc">A tamper-evident audit log of every plan and command.</p>
          </div>

          <div class="feat-card">
            <div class="feat-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </div>
            <div class="feat-title">Restore & recovery</div>
            <p class="feat-desc">Re-enable or reinstall packages with generated restore scripts.</p>
          </div>

          <div class="feat-card">
            <div class="feat-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </div>
            <div class="feat-title">Developer friendly</div>
            <p class="feat-desc">TypeScript, tests and documented tools you can extend.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Process Section -->
    <section class="process-section" id="process">
      <div class="container">
        <div class="section-kicker">Process</div>
        <h2 class="section-heading">A simple process. Full control.</h2>
        <p class="section-sub">The first two steps only read from your phone.</p>

        <div class="process-grid">
          <div class="step-card">
            <div class="step-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </div>
            <div class="step-title">1. Set up</div>
            <p class="step-desc">Install ADB and the server, then add it to your MCP client.</p>
          </div>

          <div class="step-arrow">&rarr;</div>

          <div class="step-card">
            <div class="step-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/></svg>
            </div>
            <div class="step-title">2. Connect</div>
            <p class="step-desc">Turn on USB debugging and connect by USB or Wi-Fi.</p>
          </div>

          <div class="step-arrow">&rarr;</div>

          <div class="step-card">
            <div class="step-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
            </div>
            <div class="step-title">3. Manage</div>
            <p class="step-desc">Review the plan, approve it in your terminal, then apply.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Dashboard Section -->
    <section class="dashboard-section" id="dashboard">
      <div class="container dashboard-split">
        <div class="dash-left">
          <div class="dash-window">
            <div class="dash-sidebar">
              <div class="dash-side-title">Debloater MCP</div>
              <div class="dash-nav-item" onclick="switchDashTab('overview')">Overview</div>
              <div class="dash-nav-item" onclick="switchDashTab('devices')">Devices</div>
              <div class="dash-nav-item active" id="tab-packages" onclick="switchDashTab('packages')">Apps & Packages</div>
              <div class="dash-nav-item" onclick="switchDashTab('plans')">Debloat Plans</div>
              <div class="dash-nav-item" onclick="switchDashTab('activity')">Activity Log</div>
              <div class="dash-nav-item" onclick="switchDashTab('settings')">Settings</div>
            </div>

            <div class="dash-main" id="dashMainContent">
              <div class="dash-pane-title" id="paneTitle">Apps & Packages</div>
              <div class="dash-pane-sub" id="paneSub">Browse and classify installed packages.</div>

              <div id="paneBody">
                <table class="dash-table">
                  <thead>
                    <tr>
                      <th>Package</th>
                      <th>Type</th>
                      <th>Tier</th>
                    </tr>
                  </thead>
                  <tbody id="dashTableRows">
                    <tr>
                      <td class="pkg-name">com.facebook.services</td>
                      <td>System</td>
                      <td><span class="tier-badge tier-safe">Safe</span></td>
                    </tr>
                    <tr>
                      <td class="pkg-name">com.google.android.videos</td>
                      <td>System</td>
                      <td><span class="tier-badge tier-prob">Probably Safe</span></td>
                    </tr>
                    <tr>
                      <td class="pkg-name">com.vendor.unknownservice</td>
                      <td>System</td>
                      <td><span class="tier-badge tier-risk">Risky</span></td>
                    </tr>
                    <tr>
                      <td class="pkg-name">com.google.android.gms</td>
                      <td>System</td>
                      <td><span class="tier-badge tier-unsafe">Unsafe</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="dash-caption">Illustration with sample data. The tool itself runs through your MCP client and terminal.</div>
        </div>

        <div class="dash-right">
          <div class="section-kicker">Dashboard</div>
          <h2 class="section-heading">A clear view of your packages</h2>
          <p class="section-sub" style="margin-bottom: 20px;">Inspect packages, create debloat plans and track results.</p>

          <div class="dash-bullets">
            <div class="dash-bullet-item">
              <span class="dash-check">&#10003;</span>
              <span>See connected devices and their details</span>
            </div>
            <div class="dash-bullet-item">
              <span class="dash-check">&#10003;</span>
              <span>Search, filter and classify installed packages</span>
            </div>
            <div class="dash-bullet-item">
              <span class="dash-check">&#10003;</span>
              <span>Review plans before anything runs</span>
            </div>
            <div class="dash-bullet-item">
              <span class="dash-check">&#10003;</span>
              <span>Track history and restore packages</span>
            </div>
          </div>

          <a href="https://github.com/Murlikumar99/Universal-Android-Debloater-MCP-Server-" target="_blank" rel="noopener" class="btn-lime-rect">See it in the repo &rarr;</a>
        </div>
      </div>
    </section>

    <!-- Docs Banner -->
    <section class="docs-banner-section" id="about">
      <div class="container">
        <div class="docs-banner">
          <div class="docs-left">
            <div class="docs-icon">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                <path d="M6 6h10"/>
                <path d="M6 10h10"/>
              </svg>
            </div>
            <div>
              <div class="docs-title">Full setup documentation</div>
              <div class="docs-desc">Install, ADB setup, client configs, every tool and troubleshooting.</div>
            </div>
          </div>
          <a href="/guide" class="btn-dark" style="white-space: nowrap;">Read the guide &rarr;</a>
        </div>
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer>
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="/" class="brand">
            <div class="brand-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="20" x="5" y="2" rx="2" />
                <path d="M12 18h.01" />
              </svg>
            </div>
            <div class="brand-title">
              <span>Universal Android</span>
              <span>Debloater MCP</span>
            </div>
          </a>
          <p class="footer-desc">Open-source MCP server for Android package inspection and debloating.</p>
          <div>
            <a href="https://github.com/Murlikumar99/Universal-Android-Debloater-MCP-Server-" target="_blank" rel="noopener" class="btn-dark" style="padding: 8px 14px; font-size: 0.82rem;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              View on GitHub
            </a>
          </div>
        </div>

        <div>
          <div class="footer-col-title">Product</div>
          <div class="footer-links">
            <a href="#features">Features</a>
            <a href="#process">Process</a>
            <a href="#dashboard">Dashboard</a>
            <a href="/guide">Documentation</a>
          </div>
        </div>

        <div>
          <div class="footer-col-title">Resources</div>
          <div class="footer-links">
            <a href="/guide#project">Installation</a>
            <a href="/guide#adb">ADB setup</a>
            <a href="/guide#clients">About MCP</a>
          </div>
        </div>

        <div>
          <div class="footer-col-title">Community</div>
          <div class="footer-links">
            <a href="https://github.com/Murlikumar99/Universal-Android-Debloater-MCP-Server-/issues" target="_blank" rel="noopener">Issues</a>
            <a href="https://github.com/Murlikumar99/Universal-Android-Debloater-MCP-Server-" target="_blank" rel="noopener">Repository</a>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <span>&copy; 2026 Universal Android Debloater MCP. Independent project, not affiliated with Google or any phone maker.</span>
        <span>MIT License</span>
      </div>
    </div>
  </footer>

  <script>
    const dashTabs = {
      packages: {
        title: 'Apps & Packages',
        sub: 'Browse and classify installed packages.',
        html: \`
          <table class="dash-table">
            <thead>
              <tr>
                <th>Package</th>
                <th>Type</th>
                <th>Tier</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="pkg-name">com.facebook.services</td>
                <td>System</td>
                <td><span class="tier-badge tier-safe">Safe</span></td>
              </tr>
              <tr>
                <td class="pkg-name">com.google.android.videos</td>
                <td>System</td>
                <td><span class="tier-badge tier-prob">Probably Safe</span></td>
              </tr>
              <tr>
                <td class="pkg-name">com.vendor.unknownservice</td>
                <td>System</td>
                <td><span class="tier-badge tier-risk">Risky</span></td>
              </tr>
              <tr>
                <td class="pkg-name">com.google.android.gms</td>
                <td>System</td>
                <td><span class="tier-badge tier-unsafe">Unsafe</span></td>
              </tr>
            </tbody>
          </table>
        \`
      },
      overview: {
        title: 'System Overview',
        sub: 'Connected device profile and resource usage.',
        html: \`
          <div style="font-size:0.8rem; color:var(--text-muted); line-height:1.7;">
            <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border);">
              <span>Device Model:</span><span style="color:#fff; font-family:'JetBrains Mono';">Samsung Galaxy S24 Ultra (SM-S928B)</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border);">
              <span>Android Version:</span><span style="color:#fff; font-family:'JetBrains Mono';">14 (API 34) · One UI 6.1</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border);">
              <span>RAM Reclaimable:</span><span style="color:var(--lime); font-family:'JetBrains Mono'; font-weight:700;">+2.14 GB Available</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:8px 0;">
              <span>Battery Status:</span><span style="color:#fff; font-family:'JetBrains Mono';">87% · Discharging · Good</span>
            </div>
          </div>
        \`
      },
      devices: {
        title: 'Connected ADB Devices',
        sub: 'Authorized USB and Wi-Fi debugging endpoints.',
        html: \`
          <table class="dash-table">
            <thead>
              <tr>
                <th>Serial / Endpoint</th>
                <th>Type</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="pkg-name">RFCT80XXXXX</td>
                <td>USB-C (Fast)</td>
                <td><span class="tier-badge tier-safe">device</span></td>
              </tr>
              <tr>
                <td class="pkg-name">192.168.1.120:5555</td>
                <td>Google TV (Wi-Fi)</td>
                <td><span class="tier-badge tier-safe">device</span></td>
              </tr>
            </tbody>
          </table>
        \`
      },
      plans: {
        title: 'Debloat Plans',
        sub: 'Pending human-approved package removal manifests.',
        html: \`
          <div style="font-size:0.78rem; color:var(--text-muted);">
            <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border); padding:10px 12px; border-radius:8px; margin-bottom:8px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span style="color:#fff; font-weight:700;">PLAN-9281-RECOMMENDED</span>
                <span class="tier-badge tier-safe">Ready</span>
              </div>
              <div style="font-family:'JetBrains Mono'; font-size:0.72rem; color:var(--text-dim);">Hash: 8f4a13c9... · 4 packages · Zero UPI dependencies</div>
            </div>
          </div>
        \`
      },
      activity: {
        title: 'Tamper-Evident Activity Log',
        sub: 'Cryptographic SHA-256 operation trail.',
        html: \`
          <div style="font-size:0.75rem; font-family:'JetBrains Mono'; color:var(--text-muted); line-height:1.6;">
            <div style="border-left:2px solid var(--lime); padding-left:10px; margin-bottom:10px;">
              <div style="color:#fff; font-weight:600;">[2026-11-05 09:30:12 UTC] BACKUP_VERIFIED</div>
              <div style="color:var(--text-dim);">com.facebook.services.apk (SHA-256: 4a9f... ok)</div>
            </div>
            <div style="border-left:2px solid rgba(255,255,255,0.2); padding-left:10px;">
              <div style="color:#fff; font-weight:600;">[2026-11-05 09:30:14 UTC] PM_UNINSTALL_USER0</div>
              <div style="color:var(--text-dim);">Success: Package uninstalled for user 0</div>
            </div>
          </div>
        \`
      },
      settings: {
        title: 'MCP Server Settings',
        sub: 'Environment configuration and state directories.',
        html: \`
          <div style="font-size:0.78rem; color:var(--text-muted); line-height:1.6;">
            <div style="margin-bottom:8px;"><strong>State Directory:</strong> <span style="font-family:'JetBrains Mono'; color:#fff;">~/.local/state/android-debloater-mcp/</span></div>
            <div style="margin-bottom:8px;"><strong>ADB Mock Mode:</strong> <span style="font-family:'JetBrains Mono'; color:var(--lime);">0 (Hardware Passthrough)</span></div>
            <div><strong>Approval Timeout:</strong> <span style="font-family:'JetBrains Mono'; color:#fff;">600s (10 Minutes Single-Use)</span></div>
          </div>
        \`
      }
    };

    function switchDashTab(tabKey) {
      document.querySelectorAll('.dash-nav-item').forEach(el => el.classList.remove('active'));
      const activeEl = Array.from(document.querySelectorAll('.dash-nav-item')).find(el => el.textContent.toLowerCase().includes(tabKey) || (tabKey === 'packages' && el.textContent.includes('Packages')));
      if (activeEl) activeEl.classList.add('active');

      const data = dashTabs[tabKey];
      if (data) {
        document.getElementById('paneTitle').innerText = data.title;
        document.getElementById('paneSub').innerText = data.sub;
        document.getElementById('paneBody').innerHTML = data.html;
      }
    }

    /* Mobile Menu Interactions */
    function toggleMobileMenu() {
      const drawer = document.getElementById('mobileNavDrawer');
      const btn = document.getElementById('mobileMenuBtn');
      const iconOpen = document.getElementById('menuIconOpen');
      const iconClose = document.getElementById('menuIconClose');
      const isOpen = drawer.classList.contains('open');

      if (isOpen) {
        closeMobileMenu();
      } else {
        drawer.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        iconOpen.style.display = 'none';
        iconClose.style.display = 'block';
      }
    }

    function closeMobileMenu() {
      const drawer = document.getElementById('mobileNavDrawer');
      const btn = document.getElementById('mobileMenuBtn');
      const iconOpen = document.getElementById('menuIconOpen');
      const iconClose = document.getElementById('menuIconClose');
      if (!drawer) return;
      drawer.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      iconOpen.style.display = 'block';
      iconClose.style.display = 'none';
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileMenu();
    });

    document.addEventListener('click', (e) => {
      const header = document.querySelector('header');
      if (header && !header.contains(e.target)) {
        closeMobileMenu();
      }
    });

    function copyHeroCode(btn) {
      var code = 'import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";\\nimport { execFile } from "node:child_process";\\n\\nconst server = new McpServer({\\n  name: "android-debloater",\\n  version: "0.1.0",\\n});\\n\\n// argument array, never a shell string\\nserver.tool("list_packages", { serial: z.string() },\\n  async ({ serial }) => {\\n    const out = await adb([\\n      "-s", serial, "shell",\\n      "pm", "list", "packages", "--user", "0",\\n    ]);\\n    return { content: [{ type: "text", text: out }] };\\n  });';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done, fallback);
      } else {
        fallback();
      }
      function done() {
        btn.innerHTML = '<span>Copied!</span>';
        setTimeout(function(){
          btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>Copy</span>';
        }, 1800);
      }
      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = code;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch(e) {}
        document.body.removeChild(ta);
        done();
      }
    }
  </script>
</body>
</html>`;
