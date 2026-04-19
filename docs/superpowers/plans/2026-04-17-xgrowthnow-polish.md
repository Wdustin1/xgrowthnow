# xgrowthnow Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate xgrowthnow's visual design from template-feel to "refined SaaS" across all 17 HTML pages without touching copy, layouts, or functionality.

**Architecture:** One shared `/public/theme.css` file owns typography, color tokens, and component primitives (buttons, cards, inputs, badges, spinner, hero glow). Each page keeps its own layout CSS but drops duplicated tokens/fonts/buttons and inherits from the shared file. The `sidebar.js` runtime CSS injection is updated to use the shared tokens.

**Tech Stack:** Vanilla HTML + CSS. Google Fonts (Bricolage Grotesque, Geist, Geist Mono). No build step. No framework.

**Verification:** Visual polish has no test suite — verification is by serving the site locally (`npm start`) and opening each page at 360/768/1280/1920 widths to confirm layout, hover, focus, and animations work.

---

## Pre-flight

Before Task 1:

- [ ] Run `cd /home/dustin/xgrowthnow && git status` — confirm clean working tree on `main`.
- [ ] Run `npm install` if `node_modules/` is missing.
- [ ] Run `npm start` in one terminal; open http://localhost:3456 in a browser. Keep it open for manual verification between tasks.

---

## Task 1: Create shared `theme.css`

**Files:**
- Create: `public/theme.css`

- [ ] **Step 1: Create the file**

Write `/home/dustin/xgrowthnow/public/theme.css` with the following exact content:

```css
/* xgrowthnow — theme.css
   Single source of truth: tokens, typography, components.
   Visual polish pass, 2026-04-17.
*/

@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600&display=swap');

:root {
  --bg:          #0a0b10;
  --surface:     #0f1117;
  --card:        #12141b;
  --card-hi:     #171a24;
  --border:      rgba(255,255,255,0.08);
  --border-hi:   rgba(255,255,255,0.14);
  --border-focus: rgba(90,120,255,0.5);

  --text:        #fafbff;
  --text-mute:   #8c90a3;
  --text-faint:  #5a5e6e;

  --accent:      #5a78ff;
  --accent-hi:   #7b92ff;
  --accent-soft: rgba(90,120,255,0.12);
  --accent-glow: rgba(90,120,255,0.25);

  --success:     #33d68e;
  --warning:     #ffc846;
  --danger:      #ff5f5f;

  --radius-sm:   6px;
  --radius:      10px;
  --radius-lg:   16px;
  --radius-xl:   24px;

  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 24px; --space-6: 32px;
  --space-7: 48px; --space-8: 64px; --space-9: 96px;

  /* Legacy-compat aliases (existing pages reference these names).
     Keep so unchanged page CSS rules still resolve while we migrate. */
  --blue: var(--accent);
  --muted: var(--text-mute);
  --purple: var(--accent);
}

*, *::before, *::after { box-sizing: border-box; }

html, body {
  margin: 0; padding: 0;
  background: var(--bg);
  color: var(--text);
  font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 15px; line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Bricolage Grotesque', 'Geist', sans-serif;
  font-weight: 700; line-height: 1.04;
  letter-spacing: -0.025em; color: var(--text); margin: 0;
}
h1 { font-size: clamp(38px, 5.2vw, 64px); font-weight: 800; letter-spacing: -0.035em; }
h2 { font-size: clamp(30px, 3.6vw, 44px); font-weight: 700; letter-spacing: -0.03em; }
h3 { font-size: clamp(22px, 2.4vw, 30px); font-weight: 700; letter-spacing: -0.02em; }
h4 { font-size: 22px; font-weight: 600; letter-spacing: -0.015em; }
h5 { font-size: 18px; font-weight: 600; letter-spacing: -0.01em; }
h6 { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-mute); }

p { margin: 0 0 var(--space-3); color: var(--text-mute); }
p.lead { font-size: 17px; color: var(--text-mute); line-height: 1.6; }

a { color: var(--accent); text-decoration: none; transition: color 0.15s; }
a:hover { color: var(--accent-hi); }

code, pre, .mono {
  font-family: 'Geist Mono', 'SF Mono', Menlo, monospace;
  font-feature-settings: "tnum" 1, "ss01" 1;
}

/* ---------- Buttons ---------- */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 11px 18px; min-height: 40px;
  font-family: 'Geist', sans-serif; font-size: 14px; font-weight: 600;
  line-height: 1; letter-spacing: -0.005em;
  border-radius: var(--radius); border: 1px solid transparent;
  cursor: pointer; white-space: nowrap; text-decoration: none;
  transition: background 0.18s, border-color 0.18s, color 0.18s, transform 0.18s, box-shadow 0.18s;
}
.btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-soft), 0 0 0 1px var(--accent);
}
.btn-primary { background: #ffffff; color: #0a0b10; }
.btn-primary:hover { background: #e8ebff; color: #0a0b10; transform: translateY(-1px); }
.btn-secondary {
  background: rgba(255,255,255,0.04); color: var(--text);
  border-color: var(--border-hi); backdrop-filter: blur(10px);
}
.btn-secondary:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.22); color: var(--text);
}
.btn-ghost { background: transparent; color: var(--text); border-color: var(--border); }
.btn-ghost:hover { border-color: var(--border-hi); color: var(--text); }
.btn-accent { background: var(--accent); color: #fff; border-color: var(--accent); }
.btn-accent:hover { background: var(--accent-hi); border-color: var(--accent-hi); color: #fff; transform: translateY(-1px); }
.btn .arrow { display: inline-block; transition: transform 0.18s; }
.btn:hover .arrow { transform: translateX(2px); }
.btn-lg { padding: 14px 22px; font-size: 15px; min-height: 46px; }
.btn-sm { padding: 7px 12px; font-size: 13px; min-height: 32px; }
.btn:disabled { opacity: 0.45; pointer-events: none; }

/* ---------- Cards ---------- */
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  transition: border-color 0.2s, transform 0.2s, background 0.2s;
}
.card-hover:hover { border-color: var(--border-hi); transform: translateY(-1px); }
.card-accent { border-color: var(--accent-soft); }

/* ---------- Inputs ---------- */
.input, input[type="text"].x-input, input[type="email"].x-input, input[type="number"].x-input,
textarea.x-input, select.x-input {
  width: 100%; display: block;
  padding: 11px 14px; min-height: 40px;
  font-family: 'Geist', sans-serif; font-size: 14px;
  color: var(--text); background: var(--surface);
  border: 1px solid var(--border); border-radius: var(--radius);
  outline: none; transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
}
.input::placeholder, textarea.x-input::placeholder { color: var(--text-faint); }
.input:focus, textarea.x-input:focus, input.x-input:focus, select.x-input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px var(--accent-soft);
  background: var(--card);
}

/* ---------- Badges ---------- */
.badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 10px; font-size: 11px; font-weight: 500;
  border-radius: 999px; border: 1px solid var(--border);
  color: var(--text-mute); background: rgba(255,255,255,0.02);
}
.badge-accent { background: var(--accent-soft); border-color: rgba(90,120,255,0.25); color: var(--accent-hi); }
.badge-success { background: rgba(51,214,142,0.1); border-color: rgba(51,214,142,0.3); color: var(--success); }
.badge-warning { background: rgba(255,200,70,0.1); border-color: rgba(255,200,70,0.3); color: var(--warning); }
.badge-danger  { background: rgba(255,95,95,0.1);  border-color: rgba(255,95,95,0.3);  color: var(--danger); }
.badge-dot::before {
  content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor;
  box-shadow: 0 0 8px currentColor;
}

/* ---------- Spinner ---------- */
.spinner {
  width: 18px; height: 18px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: tspin 1.5s linear infinite;
}
@keyframes tspin { to { transform: rotate(360deg); } }

/* ---------- Eyebrow label ---------- */
.eyebrow {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: 'Geist Mono', monospace;
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--text-faint);
}
.eyebrow::before { content: ""; width: 20px; height: 1px; background: currentColor; }

/* ---------- Stat (numeric display) ---------- */
.stat {
  display: flex; flex-direction: column; gap: 4px;
  padding: var(--space-4) var(--space-5);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.stat-value { font-family: 'Geist Mono', monospace; font-size: 28px; font-weight: 600; color: var(--text); font-feature-settings: "tnum" 1; }
.stat-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-faint); }

/* ---------- Hero glow (refined replacement for radial AI-slop gradient) ---------- */
.hero-glow { position: relative; isolation: isolate; }
.hero-glow::before {
  content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none;
  background:
    radial-gradient(800px 400px at 50% 0%, rgba(90,120,255,0.10), transparent 60%),
    radial-gradient(500px 300px at 85% 20%, rgba(90,120,255,0.06), transparent 60%);
}

/* ---------- Text gradient for italic emphasis ---------- */
.text-gradient {
  background: linear-gradient(180deg, var(--text) 0%, #8998d4 110%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ---------- Link underline slide-in (marketing copy) ---------- */
.link-slide {
  position: relative; color: var(--text);
}
.link-slide::after {
  content: ""; position: absolute; left: 0; bottom: -2px; height: 1px; width: 100%;
  background: currentColor; transform: scaleX(0); transform-origin: left;
  transition: transform 0.25s ease-out;
}
.link-slide:hover::after { transform: scaleX(1); }

/* ---------- Utilities ---------- */
.muted { color: var(--text-mute); }
.faint { color: var(--text-faint); }
.surface { background: var(--surface); }
.bordered { border: 1px solid var(--border); }

/* ---------- Reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

- [ ] **Step 2: Verify font import loads**

Run: `curl -sSI "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500&display=swap" | head -1`
Expected: `HTTP/2 200`

- [ ] **Step 3: Commit**

```bash
cd /home/dustin/xgrowthnow
git add public/theme.css
git commit -m "Add shared theme.css with tokens and component primitives"
```

---

## Polish Recipe (used by every page task 2-10)

Every HTML page in `public/` gets the same surgical treatment. The recipe:

**1. Add theme.css link** — in `<head>`, right after the existing meta tags, add:
```html
<link rel="stylesheet" href="/theme.css">
```

**2. Remove old font imports** — delete any `<link>` or `@import` that pulls in `Plus+Jakarta+Sans`, `Inter`, `Roboto`, or any other non-Geist font.

**3. Remove duplicated token declarations** from the page's inline `<style>` — delete any `:root { --bg: ...; --card: ...; --border: ...; --blue: ...; --purple: ...; --text: ...; --muted: ...; --radius: ...; }` block. Keep only page-specific layout variables.

**4. Remove duplicated base resets** — delete `* { box-sizing: border-box; margin:0; padding:0; }` from the page style (theme.css covers it).

**5. Swap font-family on `body` and headings** — delete any `font-family: 'Plus Jakarta Sans'...` or `font-family: -apple-system...` rules. Theme.css applies Bricolage Grotesque + Geist globally.

**6. Replace purple-gradient buttons** — find any CSS rule with `linear-gradient(135deg, var(--blue), var(--purple))` or similar blue→purple gradient. Replace with the new button system:
   - Old primary CTAs → add class `btn btn-primary`, remove the gradient.
   - Old secondary CTAs → add class `btn btn-secondary`, remove the gradient.
   - For gradient text (e.g., `<em>` inside `<h1>`) → wrap with `.text-gradient`.

**7. Replace radial hero gradients** — find `background: radial-gradient(ellipse ... rgba(29,155,240,0.13), transparent)` (the ellipse-100%-60% signature). Remove it. On the wrapping hero `<section>` add class `hero-glow`.

**8. Update inline colors to use tokens** — anywhere the page uses `#1d9bf0` hardcoded, change to `var(--accent)`. Anywhere it uses `#71767b` or `#8899a6` muted gray, change to `var(--text-mute)`. `#000`/`#0a0a0a` → `var(--bg)`. `#111`/`#16181c` → `var(--card)`. `#2f3336` → `var(--border-hi)`.

**9. Verify animations still trigger** — the `fade-in`, `.fade-in.show`, sidebar slide, and toggle easing classes are page-local; leave them. Confirm visually after reload.

**10. Visual verify** — open the page at localhost:3456, check hover/focus states, refresh with dev tools network tab to confirm `theme.css` loads 200.

---

## Task 2: Polish `index.html` (landing page)

**Files:**
- Modify: `public/index.html`

- [ ] **Step 1: Add theme.css link**

Open `public/index.html`. In `<head>`, locate the existing `<link>` to Plus Jakarta Sans. Replace it with:
```html
<link rel="stylesheet" href="/theme.css">
```
Delete any other `<link>` or `@import` for Google Fonts.

- [ ] **Step 2: Strip duplicated tokens and resets from inline `<style>`**

In the `<style>` block, delete:
- The full `:root { ... }` declaration (move any unique local vars outside the block; delete duplicates of the tokens listed in theme.css).
- Any `* { ... }` wildcard reset.
- Any rule that sets `body { font-family: ... }` or `h1..h6 { font-family: ... }`.

- [ ] **Step 3: Replace purple-gradient CTAs**

Find in the inline style:
```css
.btn-primary {
  background: linear-gradient(135deg, var(--blue), var(--purple));
  ...
}
```
Delete the rule entirely (theme.css owns `.btn-primary` now). Same for `.btn-secondary` if it uses gradients/shadows.

In the HTML body, ensure the hero buttons use class names `btn btn-primary` and `btn btn-secondary` (they already do — confirm no other class is forcing a gradient).

Wrap the hero `<em>FASTER</em>` in the headline with the gradient treatment:
```html
<h1 class="fade-in">Grow on X Organically<br/>&amp; Get Monetized <em class="text-gradient">FASTER</em></h1>
```

- [ ] **Step 4: Swap the radial hero gradient**

Find the hero section wrapper. If it has:
```css
.hero::before {
  background: radial-gradient(ellipse 100% 60% at 50% -10%, rgba(29,155,240,0.13), transparent 60%);
}
```
Delete the rule. Add class `hero-glow` to the hero `<section>` in HTML.

- [ ] **Step 5: Audit remaining color hardcodes**

Grep within `public/index.html` for `#1d9bf0`, `#7b61ff`, `#71767b`, `#8899a6`, `#111`, `#16181c`. For each hit, replace with the correct token per the polish recipe step 8.

- [ ] **Step 6: Visual verify**

Reload http://localhost:3456 at 1280px, then 768px, then 360px. Check:
- Headlines use Bricolage Grotesque (distinctive rounded-grotesque letterforms).
- Body is Geist.
- Primary CTA is white on ink, no purple gradient.
- Hero has a subtle blue glow, not the old bright ellipse.
- `fade-in` on scroll still triggers.
- No layout shift, no broken spacing.

- [ ] **Step 7: Commit**

```bash
git add public/index.html
git commit -m "Polish landing page with shared theme"
```

---

## Task 3: Polish `pricing.html`

**Files:**
- Modify: `public/pricing.html`

- [ ] **Step 1: Apply the polish recipe (all 10 steps above)**

Page-specific callouts:
- The pricing cards (tier cards) should keep their layout. Add `card card-hover` classes. Remove any per-card gradient background; use `--card` solid.
- The "most popular" / "recommended" tier: instead of gradient fill, use `card-accent` class (subtle accent border) and add a `badge badge-accent badge-dot` at the card's top.
- Billing toggle (monthly/annual): keep existing toggle component, remove any purple/blue gradient on the thumb; thumb becomes `#fff` on `var(--accent)` track.
- FAQ accordion chevrons: keep transition, recolor to `var(--text-mute)`.

- [ ] **Step 2: Visual verify**

Reload http://localhost:3456/pricing. Check:
- Three tier cards visually equal-weight, except the accent-bordered recommended tier.
- Toggle animates as before.
- FAQ accordion expands/collapses cleanly.

- [ ] **Step 3: Commit**

```bash
git add public/pricing.html
git commit -m "Polish pricing page with shared theme"
```

---

## Task 4: Polish `growth-predictor.html`

**Files:**
- Modify: `public/growth-predictor.html`

- [ ] **Step 1: Apply the polish recipe**

Page-specific callouts:
- The handle-input form: the input field should become `class="input"` (or the existing class styled to inherit input tokens). Search button uses `btn btn-primary`.
- Result cards (follower count, growth score, projection chart): wrap each in `class="card"`, use `class="stat"` for the big numeric displays (mono font via theme.css).
- Chart.js / custom chart colors: if the chart's line color is hardcoded to `#1d9bf0`, change to the CSS variable string resolved in JS:
  ```js
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  ```
  Use `accent` for the dataset `borderColor`. Gridline color: resolve `--border`.

- [ ] **Step 2: Visual verify**

Reload http://localhost:3456/growth-predictor. Enter a test handle (e.g., `elonmusk`). Confirm:
- Input focus ring shows accent glow.
- Results render with new card + stat styling.
- Chart draws with accent-colored line on soft gridlines.

- [ ] **Step 3: Commit**

```bash
git add public/growth-predictor.html
git commit -m "Polish growth predictor with shared theme"
```

---

## Task 5: Update `sidebar.js` runtime styles

**Files:**
- Modify: `public/sidebar.js`

- [ ] **Step 1: Rewrite the injected CSS block**

In `public/sidebar.js`, locate the `initLayout` function's `style.textContent = ...` template literal. Replace the entire CSS block with:

```css
:root { --sidebar-w: 240px; }
body.has-sidebar { display: flex; flex-direction: column; min-height: 100vh; }

.topbar {
  display: flex; align-items: center; gap: 14px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  background: rgba(10,11,16,0.85); backdrop-filter: blur(12px);
  position: sticky; top: 0; z-index: 200; flex-shrink: 0;
}
.topbar-menu {
  background: none; border: none; color: var(--text);
  font-size: 20px; cursor: pointer; padding: 4px; display: none;
}
.topbar-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
.topbar-logo-icon {
  width: 28px; height: 28px; border-radius: 8px;
  background: var(--card); border: 1px solid var(--border-hi);
  color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700;
}
.topbar-logo-text {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 17px; font-weight: 700; letter-spacing: -0.02em; color: var(--text);
}
.topbar-logo-text span { color: var(--accent); }
.topbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
.topbar-avatar {
  width: 30px; height: 30px; border-radius: 50%; object-fit: cover;
  border: 2px solid var(--border-hi);
}

.app-body { display: flex; flex: 1; min-height: 0; }

.sidebar {
  width: var(--sidebar-w);
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  position: fixed; top: 53px; left: 0;
  height: calc(100vh - 53px); overflow-y: auto;
  z-index: 150; transition: transform 0.25s ease-out;
}
.sidebar-logo {
  display: flex; align-items: center; gap: 10px;
  padding: 20px 20px 16px; text-decoration: none;
  border-bottom: 1px solid var(--border);
}
.sidebar-logo-icon {
  width: 30px; height: 30px; border-radius: 8px;
  background: var(--card); border: 1px solid var(--border-hi);
  color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700;
}
.sidebar-logo-text {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 17px; font-weight: 700; letter-spacing: -0.02em; color: var(--text);
}
.sidebar-logo-text span { color: var(--accent); }

.sidebar-nav {
  flex: 1; padding: 12px 10px;
  display: flex; flex-direction: column; gap: 1px;
}
.nav-item {
  position: relative;
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px 9px 14px;
  border-radius: var(--radius);
  text-decoration: none;
  color: var(--text-mute); font-size: 14px; font-weight: 500;
  transition: background 0.15s, color 0.15s;
}
.nav-item:hover { background: var(--card); color: var(--text); }
.nav-item.active {
  background: var(--accent-soft);
  color: var(--text);
  font-weight: 600;
}
.nav-item.active::before {
  content: ""; position: absolute; left: 0; top: 8px; bottom: 8px;
  width: 3px; border-radius: 3px; background: var(--accent);
}
.nav-item.locked { opacity: 0.55; }
.nav-icon { font-size: 16px; flex-shrink: 0; width: 20px; text-align: center; }
.nav-label { flex: 1; }
.nav-badge { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 999px; }
.free-badge { background: rgba(51,214,142,0.12); color: var(--success); border: 1px solid rgba(51,214,142,0.3); }
.nav-lock { font-size: 11px; opacity: 0.6; }

.sidebar-user {
  padding: 14px; border-top: 1px solid var(--border);
  display: flex; align-items: center; gap: 10px;
}
.sidebar-avatar {
  width: 34px; height: 34px; border-radius: 50%; object-fit: cover;
  border: 2px solid var(--border-hi); flex-shrink: 0;
}
.sidebar-user-info { flex: 1; min-width: 0; }
.sidebar-username {
  font-family: 'Geist Mono', monospace;
  font-size: 12px; color: var(--text-mute);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.upgrade-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; margin-top: 6px;
  padding: 7px 12px; font-size: 12px; font-weight: 600;
  border-radius: var(--radius);
  background: rgba(255,255,255,0.04); color: var(--text);
  border: 1px solid var(--border-hi);
  text-decoration: none; transition: background 0.15s, border-color 0.15s;
}
.upgrade-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.22); color: var(--text); }
.pro-badge {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 600; color: var(--warning);
  margin-top: 6px;
}

.sidebar-overlay {
  display: none; position: fixed; inset: 0;
  background: rgba(0,0,0,0.6); z-index: 149;
  backdrop-filter: blur(2px);
}
.sidebar-overlay.show { display: block; }

.page-content { margin-left: var(--sidebar-w); flex: 1; min-width: 0; }

@media (max-width: 768px) {
  .topbar-menu { display: block; }
  .sidebar { transform: translateX(-100%); top: 53px; }
  .sidebar.open { transform: translateX(0); }
  .page-content { margin-left: 0; }
}
```

- [ ] **Step 2: Leave logo markup untouched**

The "no copy changes" scope covers logo text. Do not touch:
- `buildSidebar`: `Dash<span>Board</span>` + `✈` glyph stays.
- `buildTopbar`: `X<span>Growth</span>` + `✈` glyph stays.

The new `.topbar-logo-icon` and `.sidebar-logo-icon` CSS rules (Step 1) reframe the glyph in a bordered card, which transforms the appearance without changing content.

- [ ] **Step 3: Update the sign-in fallback button**

In `buildSidebar`, the unauthenticated branch uses:
```js
<a href="/api/auth/login" class="upgrade-btn" style="width:100%;text-align:center;">𝕏 Sign In</a>
```
Remove the inline `style=` attribute (the upgrade-btn class now handles width and alignment).

Same for `buildTopbar`: remove the inline `style=` attribute on the sign-in link and replace with `class="btn btn-sm btn-secondary"`.

- [ ] **Step 4: Visual verify**

Reload any page that uses the sidebar (e.g., http://localhost:3456/dashboard). Confirm:
- Sidebar is fixed-width, dark surface, refined.
- Active nav item has a left accent bar.
- Mobile (<768px): hamburger opens sidebar with overlay.
- Avatar has subtle border, username is mono font.

- [ ] **Step 5: Commit**

```bash
git add public/sidebar.js
git commit -m "Polish sidebar and topbar using shared tokens"
```

---

## Task 6: Polish `dashboard.html`

**Files:**
- Modify: `public/dashboard.html`

- [ ] **Step 1: Apply the polish recipe**

Page-specific callouts:
- Welcome header: use `h1` (inherits Bricolage Grotesque), keep copy.
- Tool grid: each tool card becomes `class="card card-hover"`. Locked tools add a `card` with `opacity: 0.55; pointer-events: none;` wrapper (or a padlock overlay using `badge badge-warning` at top-right).
- Stat strip (if present) uses `class="stat"` for each metric.

- [ ] **Step 2: Visual verify**

Reload http://localhost:3456/dashboard. Confirm:
- Tool grid is visually cohesive.
- Locked tools read clearly as locked.
- Hover states work.

- [ ] **Step 3: Commit**

```bash
git add public/dashboard.html
git commit -m "Polish dashboard with shared theme"
```

---

## Task 7: Polish tool pages — batch 1

**Files:**
- Modify: `public/unfollow.html`
- Modify: `public/unfollow-tracker.html`
- Modify: `public/inactive-follows.html`
- Modify: `public/loyal-fans.html`

- [ ] **Step 1: For each of the 4 files, apply the polish recipe**

Page-specific callouts per file:

**unfollow.html** — Mass unfollow bulk-action bar. List rows get `class="card"` styling at row level with subtle hover. Checkbox toggles keep existing CSS; restyle to use `--accent` for checked state (`accent-color: var(--accent);`).

**unfollow-tracker.html** — Empty state (no unfollows yet) gets `class="card"` with centered eyebrow + body copy. List rows same as unfollow.html.

**inactive-follows.html** — Filter chips become `class="badge"` (use `badge badge-accent` for active filter). List rows: same treatment.

**loyal-fans.html** — Leaderboard: rank medallion for top 3 becomes a `stat`-style numeric display with subtle accent glow. Rows 4-20 standard card rows.

- [ ] **Step 2: Visual verify each page**

Reload each URL:
- http://localhost:3456/unfollow
- http://localhost:3456/unfollow-tracker
- http://localhost:3456/inactive-follows
- http://localhost:3456/loyal-fans

Confirm typography, card/row styling, and any filter chips look cohesive with the landing page.

- [ ] **Step 3: Commit**

```bash
git add public/unfollow.html public/unfollow-tracker.html public/inactive-follows.html public/loyal-fans.html
git commit -m "Polish unfollow/loyal-fans tool pages with shared theme"
```

---

## Task 8: Polish tool pages — batch 2

**Files:**
- Modify: `public/tweet-optimizer.html`
- Modify: `public/competitor-spy.html`
- Modify: `public/viral-reposter.html`
- Modify: `public/top5.html`

- [ ] **Step 1: For each file, apply the polish recipe**

Page-specific callouts:

**tweet-optimizer.html** — Large textarea becomes `class="input"` with `min-height: 140px`. Result pane below: `class="card"`, suggestion list items styled as rows with subtle left accent bar.

**competitor-spy.html** — Handle-search input: `class="input"`. Competitor's tweet cards: `class="card card-hover"`. Engagement metrics on each card: `class="mono"` numbers.

**viral-reposter.html** — Scheduled queue table: replace any zebra-stripe/alt-row backgrounds with solid card rows separated by 1px `--border` dividers. Time column in mono font.

**top5.html** — Tweet cards: `class="card card-hover"`. Ranking number (1-5) uses `stat-value` style, muted.

- [ ] **Step 2: Visual verify each page**

Reload each URL:
- http://localhost:3456/tweet-optimizer
- http://localhost:3456/competitor-spy
- http://localhost:3456/viral-reposter
- http://localhost:3456/top5

- [ ] **Step 3: Commit**

```bash
git add public/tweet-optimizer.html public/competitor-spy.html public/viral-reposter.html public/top5.html
git commit -m "Polish tweet-optimizer/spy/reposter/top5 with shared theme"
```

---

## Task 9: Polish tool pages — batch 3

**Files:**
- Modify: `public/tweet-to-reel.html`
- Modify: `public/unreplied.html`
- Modify: `public/best-time.html`

- [ ] **Step 1: For each file, apply the polish recipe**

Page-specific callouts:

**tweet-to-reel.html** — Tweet preview card: `class="card"`. "Generate" CTA: `btn btn-primary btn-lg`. Preview pane (video output area): `class="card surface"`.

**unreplied.html** — Comment rows: `class="card"`. "Reply" button per row: `btn btn-sm btn-secondary`.

**best-time.html** — Heatmap cells keep their grid; replace the color ramp from the current palette to a gradient from `var(--surface)` (cool, low engagement) through `var(--accent-soft)` mid to `var(--accent)` (high engagement). Axis labels use `class="mono"` + `--text-faint`. Legend: a small horizontal gradient bar below the heatmap.

- [ ] **Step 2: Visual verify each page**

Reload each URL:
- http://localhost:3456/tweet-to-reel
- http://localhost:3456/unreplied
- http://localhost:3456/best-time

- [ ] **Step 3: Commit**

```bash
git add public/tweet-to-reel.html public/unreplied.html public/best-time.html
git commit -m "Polish reel/unreplied/best-time with shared theme"
```

---

## Task 10: Polish misc pages

**Files:**
- Modify: `public/f5bot.html`
- Modify: `public/dcabtc.html`

- [ ] **Step 1: For each file, apply the polish recipe**

Page-specific callouts:

**f5bot.html** — Form and result area get standard `input` + `card` treatment.

**dcabtc.html** — Standalone bitcoin DCA calculator, also served at bitcoincalc.xyz. Apply the same recipe; it's a self-contained page so there is no sidebar. Confirm the calc form (start date, amount, frequency) uses `input` class, results card uses `card`, chart colors resolve `var(--accent)` in JS.

- [ ] **Step 2: Visual verify each page**

Reload:
- http://localhost:3456/f5bot
- http://localhost:3456/dcabtc

- [ ] **Step 3: Commit**

```bash
git add public/f5bot.html public/dcabtc.html
git commit -m "Polish f5bot and dcabtc with shared theme"
```

---

## Task 11: Final QA pass

**Files:** None modified (unless regressions found).

- [ ] **Step 1: Click through every page at desktop width (1280px)**

Open each URL in a clean browser tab. Confirm:
- Fonts are Bricolage Grotesque (headings) + Geist (body) everywhere.
- No purple gradient CTAs anywhere.
- No bright-ellipse radial backgrounds.
- Hover, focus, and active states all work.
- Theme.css returns 200 (check Network tab).

Pages to check:
- `/`
- `/pricing`
- `/growth-predictor`
- `/dashboard`
- `/unfollow`
- `/unfollow-tracker`
- `/inactive-follows`
- `/loyal-fans`
- `/tweet-optimizer`
- `/competitor-spy`
- `/viral-reposter`
- `/top5`
- `/tweet-to-reel`
- `/unreplied`
- `/best-time`
- `/f5bot`
- `/dcabtc`

- [ ] **Step 2: Resize to 768px and 360px**

On at least 3 pages (landing, pricing, dashboard), confirm layout holds at tablet and mobile widths. Sidebar collapses to hamburger on <768px.

- [ ] **Step 3: Reduced motion**

In DevTools > Rendering > "Emulate CSS media feature prefers-reduced-motion: reduce". Reload landing. Confirm `fade-in`, `translateY` hovers, and button arrow slide all stop animating.

- [ ] **Step 4: Functional smoke test**

Without logging in, confirm:
- Hero CTA "Get Started →" navigates to `/pricing`.
- "Preview My Growth →" navigates to `/growth-predictor`.
- Submitting a test handle on `/growth-predictor` returns a chart.
- Sidebar sign-in link goes to `/api/auth/login` (may 500 locally without Twitter creds — that's fine, only verify it routes).

- [ ] **Step 5: No regressions commit**

If all checks pass, no commit needed. If any page needed a fix during QA, commit it:
```bash
git add -u
git commit -m "Fix regressions from polish pass QA"
```

- [ ] **Step 6: Final push (OPTIONAL — ask user)**

Do not push without explicit user approval:
```bash
git log --oneline main..HEAD
# Show the user the commit list. Ask: "Push to origin/main?"
# If yes:
git push origin main
```

---

## Rollback plan

Each page task is an independent commit. To revert a single page:
```bash
git revert <commit-sha>
# or
git checkout HEAD~N -- public/<file>.html
```

To revert the entire polish pass:
```bash
git reset --hard <pre-polish-sha>
```

The polish is additive (new `theme.css` + edits to existing files). No API, server, or vercel config changes.
