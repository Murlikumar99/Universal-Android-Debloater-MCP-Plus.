# OpenDesign System Specification — Universal Android Debloater MCP

This document serves as the authoritative design system specification and brand contract for **Universal Android Debloater MCP**, adhering to OpenDesign standards (`nexu-io/open-design`).

---

## 1. Design Principles

1. **Precision & Trust First**
   - High-consequence operations (package removal, ADB commands, system recovery) require absolute clarity and zero ambiguity.
   - Status indicators, safety tiers, and code blocks use high-contrast, universally understood conventions.

2. **Terminal Precision Meets Modern Web**
   - Developer-grade typography featuring **Plus Jakarta Sans** for crisp, geometric UI hierarchy and **JetBrains Mono** for code, commands, and package identifiers.
   - Clean obsidian dark canvas (`#07090e`) with electric lime accents (`#ccff00`) and subtle frosted glass surfaces (`rgba(13, 17, 23, 0.85)`).

3. **Consistent Iconography**
   - Pure Lucide Icons line-art aesthetic.
   - Uniform 1.75px–2px stroke width, rounded line caps and joins.
   - Zero emojis, zero sparkle/magic icons, and zero decorative visual noise.

4. **Flawless Multi-Device Responsiveness**
   - Mobile-first execution: UI elements must never overflow, wrap awkwardly into vertical stacks, or clip text labels.
   - Sticky navigation bars with horizontal scrolling pills and auto-centering for long lists.
   - Smooth transitions, tactile touch targets (minimum 44x44px for tap targets).

---

## 2. Design Tokens (`tokens.css`)

The canonical OpenDesign token architecture defines tokens under the `--od-*` namespace:

### Surface & Canvas
- `--od-bg`: `#07090e` — Deep canvas black
- `--od-surface`: `#0d1117` — Primary surface card
- `--od-surface-subtle`: `#121722` — Secondary container surface
- `--od-surface-elevated`: `#161c27` — Modals, popovers, sticky headers
- `--od-surface-card`: `#0a0e14` — Code and widget inner backgrounds

### Borders & Dividers
- `--od-border`: `rgba(255, 255, 255, 0.08)` — Subtle structure dividers
- `--od-border-subtle`: `rgba(255, 255, 255, 0.05)` — Table and row hair lines
- `--od-border-hover`: `rgba(255, 255, 255, 0.16)` — Hover interactive borders
- `--od-border-focus`: `#ccff00` — Keyboard focus and active element border

### Typography & Foreground
- `--od-fg`: `#ffffff` — Primary text
- `--od-fg-muted`: `#8b949e` — Secondary descriptions and subtitles
- `--od-fg-dim`: `#64748b` — Inactive pills, placeholders, meta captions
- `--od-fg-inverse`: `#000000` — High-contrast text on bright accents

### Brand & Interactive Accent
- `--od-accent`: `#ccff00` — Electric lime primary brand accent
- `--od-accent-hover`: `#b8e600` — Accent active/hover state
- `--od-accent-subtle`: `rgba(204, 255, 0, 0.12)` — Accent badges and tint fills
- `--od-accent-border`: `rgba(204, 255, 0, 0.35)` — Accent border glow

### Safety Tiers & Semantic Statuses
- `--od-safe`: `#4ade80` — Green (Safe: no side effects)
- `--od-prob`: `#facc15` — Yellow (Probably Safe: minor features affected)
- `--od-risk`: `#fb923c` — Orange (Risky: carrier/OEM features)
- `--od-unsafe`: `#f87171` — Red (Unsafe: bootloop/critical telephony risk)
- `--od-warn`: `#f59e0b` — Amber warning alerts

---

## 3. Component Architecture & Patterns

### 3.1 Global Header & Navigation
- Height: 56px desktop / 52px mobile.
- Sticky position with backdrop blur (`backdrop-filter: blur(14px)`).
- Brand icon with lime container and dark phone glyph.
- Flex header prevents wrapping: buttons use `white-space: nowrap; flex-shrink: 0`.
- Text labels truncate gracefully with ellipsis when viewport drops below 360px.

### 3.2 Sticky Mobile TOC (Table of Contents)
- Appears below header on mobile/tablet viewports (< 960px).
- Horizontal scroll with hidden scrollbar.
- Active pill dynamically highlighted with `--od-accent` and auto-scrolled into center view via `scrollIntoView({ inline: 'center' })`.

### 3.3 Code Display & Copy Engine
- Outer card styled like a terminal window with 3 window controls (macOS traffic lights).
- Copy button positioned in header with tactile feedback ("Copied!" + checkmark icon).
- Monospace font (`JetBrains Mono`, `ui-monospace`) with line numbers and syntax contrast.

### 3.4 Interactive Tools Catalog
- Real-time search filter filtering by tool name, purpose, and impact.
- Badge count showing matching tools count.
- Clear distinction between read-only tools and system-changing tools.

---

## 4. MCP Agent & Antigravity Integration

OpenDesign projects integrate with AI clients using Model Context Protocol (MCP).

### Integration Commands
```bash
# Register MCP in Antigravity via OpenDesign CLI
od mcp install antigravity

# Or configure via standard JSON
# ~/.gemini/antigravity/mcp_config.json
```
