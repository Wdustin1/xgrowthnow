# xgrowthnow — Visual Polish Pass

**Date:** 2026-04-17
**Scope:** All 17 HTML pages under `/public/`
**Nature:** Visual polish only — no copy, feature, or functional changes

---

## Goal

Elevate xgrowthnow from a site that reads as template-built / AI-generated to a site that reads as intentionally designed. Kill the specific visual tells that make the current design feel generic; introduce a coherent, confident design language across landing pages and the authenticated app.

## Non-goals

- No copy changes. All headlines, microcopy, CTAs, and button labels stay verbatim.
- No layout restructuring. Section order, page flow, and information architecture stay.
- No new features, no removed features. All API calls, Stripe flows, and auth remain untouched.
- No framework change. Stays vanilla HTML + inline/linked CSS. No React, no Tailwind, no build step.

## Problems being fixed

Diagnosed from audit of the current codebase:

1. **Two disconnected design systems.** Landing pages use Plus Jakarta Sans + gradients; tool pages use system fonts + flat colors. Navigating marketing → product feels like two different products.
2. **AI-slop visual tells.** Purple-gradient CTAs (`linear-gradient(135deg, blue, purple)`), radial hero glows (`radial-gradient(ellipse 100% 60% at 50% -10%, rgba(29,155,240,0.13))`), drop-shadowed buttons — all canonical SaaS-template patterns.
3. **Mud contrast.** Gray-on-black body text (#71767b on #000) reads as an inverted light theme, not an intentional dark design.
4. **Zero shared CSS.** Every page redeclares the same `:root` variables. ~70% CSS duplication. Future polish changes multiply by 17.

## Aesthetic direction

**Refined SaaS** — Linear / Cal.com / Vercel tier. Deep ink palette, restrained gradient, structural typography, one bold accent color used sparingly.

### Typography

| Role | Family | Weights | Usage |
|------|--------|---------|-------|
| Display | Bricolage Grotesque | 700, 800 | Hero headlines, section headings, hero page titles |
| Body | Geist | 400, 500, 600 | Paragraphs, buttons, nav, UI labels |
| Mono | Geist Mono | 400, 500 | Numeric data, metrics, code-ish displays |

Italic/emphasis in hero headlines uses a gradient text treatment (white → soft indigo) instead of a solid color.

Type scale (px): `12 · 13 · 15 · 18 · 22 · 30 · 44 · 64`
Line-height: `1.04` for display, `1.55` for body, `1.4` for UI.

### Color tokens

```css
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
}
```

### Hero treatment

Replace each page's radial-gradient hero with a restrained version:
- Deep ink base (`--bg`).
- Soft directional glow: `radial-gradient(500px 300px at 85% 20%, rgba(90,120,255,0.08), transparent 60%)` — subtle, single-source, no purple.

## Component language

### Buttons

- **Primary:** white fill `#ffffff`, text `#0a0b10`, weight 600, radius `--radius`, padding `11px 18px`. Hover: background `#e8ebff`, translateY(-1px).
- **Secondary:** bg `rgba(255,255,255,0.04)`, border `1px solid var(--border-hi)`, text `var(--text)`. Backdrop blur 10px. Hover: bg `rgba(255,255,255,0.08)`, border `rgba(255,255,255,0.22)`.
- **Ghost:** transparent, text `var(--text)`, border `1px solid var(--border)`. Hover: border `var(--border-hi)`.
- Arrow glyphs (`→`) slide 2px right on hover via transform.
- **No purple gradients. No drop shadows.**

### Cards

- Background `var(--card)`, border `1px solid var(--border)`, radius `--radius-lg`.
- Hover: border → `--border-hi`, translateY(-1px), optional accent-soft glow on top-left.
- Stat cards: mono font for numbers, subtle up/down arrow in `--success` or `--danger`.

### Inputs

- Background `var(--surface)`, border `1px solid var(--border)`, radius `--radius`, padding `11px 14px`.
- Focus: border `var(--border-focus)`, ring `0 0 0 3px var(--accent-soft)`.
- Placeholder: `var(--text-faint)`.

### Sidebar (shared via `sidebar.js`)

- Active nav item: background `var(--accent-soft)`, left border `3px solid var(--accent)`, text `var(--text)`.
- Hover: background `var(--card)`, text `var(--text)`.
- Logo: replace gradient disc with outlined square mark, radius `6px`, 1px border.
- User section: refined avatar (2px border using `--border-hi`), handle in mono font.
- "Upgrade to Pro" CTA uses secondary button pattern, not a gradient pill.

### Badges

- Radius `999px`, padding `3px 10px`, font-size 11px, weight 500.
- Variants: `neutral` (border + muted), `accent` (soft-fill + accent text), `success`, `warning`.

### Loaders / spinners

- Keep current spinner structure, recolor to `--accent` on `--border` track, 1.5s linear rotation.

## Animations (preserved + minor additions)

**Keep exactly as-is:**
- `fade-in` on scroll (landing pages).
- Sidebar slide in/out on mobile (`sidebar.js`).
- Toggle switch ease-out.
- Spinner rotation (recolored only).
- Staggered card reveal on dashboard.

**Add (subtle, no new libraries):**
- Button arrow translate on hover (2px).
- Card translateY(-1px) on hover.
- Input focus-ring appear (200ms ease-out).
- Link underline slide-in from left on marketing copy.

All animations respect `prefers-reduced-motion` — wrap motion rules so they disable when the user opts out.

## Implementation architecture

### New file: `/public/theme.css`

Single source of truth. Contains:
1. `@font-face` imports (Google Fonts Bricolage Grotesque, Geist, Geist Mono).
2. `:root` tokens (all variables above).
3. `*, *::before, *::after` reset.
4. Base typography (`html`, `body`, `h1`-`h6`, `p`, `a`, `code`).
5. Reusable component classes: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.card`, `.input`, `.badge`, `.stat`, `.spinner`, `.eyebrow`.
6. Utility helpers: `.mono`, `.muted`, `.faint`, `.surface`, `.bordered`.
7. Reduced-motion block.

Linked from every HTML page via `<link rel="stylesheet" href="/theme.css">`.

### Per-page `<style>` blocks

Keep existing page-specific layout rules. Delete duplicated `:root` token declarations, font stacks, button styles, card styles — anything now covered by `theme.css`. What remains should only describe the page's unique layout.

### `sidebar.js` update

Inline CSS injected by `initLayout()` stays (it's tied to the runtime injection pattern), but switch from hard-coded colors to `var(--accent)`, `var(--border)`, etc. It inherits from `theme.css` since it runs after the stylesheet loads.

## Per-page task breakdown

| # | Page | Changes beyond theme.css import |
|---|------|--------------------------------|
| 1 | `theme.css` | Create the file. |
| 2 | `index.html` | Hero gradient swap, button recolor, CTA restructure to new button pattern, nav restyle. |
| 3 | `pricing.html` | Pricing cards restyled, toggle restyled, FAQ accordion restyled. |
| 4 | `growth-predictor.html` | Form inputs, result cards, chart colors to accent. |
| 5 | `sidebar.js` | Active state with accent bar, logo outlined mark, button pattern. |
| 6 | `dashboard.html` | Tool-card grid restyled, welcome header typography. |
| 7 | `unfollow.html` | Bulk-action bar, list rows, toggle. |
| 8 | `unfollow-tracker.html` | Empty state, list rows. |
| 9 | `inactive-follows.html` | Filter chips, list rows. |
| 10 | `loyal-fans.html` | Leaderboard rows, rank medallion restyled. |
| 11 | `tweet-optimizer.html` | Textarea (large input), result pane. |
| 12 | `competitor-spy.html` | Search input, tweet cards. |
| 13 | `viral-reposter.html` | Queue table, scheduling controls. |
| 14 | `top5.html` | Tweet cards. |
| 15 | `tweet-to-reel.html` | Preview pane, generate-button. |
| 16 | `unreplied.html` | List rows, reply buttons. |
| 17 | `best-time.html` | Heatmap color ramp, axis labels, legend. |
| 18 | `f5bot.html` | Form, result area. |
| 19 | `dcabtc.html` | Calc form, result. Standalone page also hosted at bitcoincalc.xyz; same polish applied. |

## Execution order

1. **Foundation:** `theme.css` + `index.html`. Lock the look on the most-visited page.
2. **Marketing:** `pricing.html`, `growth-predictor.html`.
3. **Shared chrome:** `sidebar.js` + `dashboard.html`.
4. **Tool pages batch 1:** `unfollow.html`, `unfollow-tracker.html`, `inactive-follows.html`, `loyal-fans.html`.
5. **Tool pages batch 2:** `tweet-optimizer.html`, `competitor-spy.html`, `viral-reposter.html`, `top5.html`.
6. **Tool pages batch 3:** `tweet-to-reel.html`, `unreplied.html`, `best-time.html`.
7. **Misc:** `f5bot.html`, `dcabtc.html`.

## Testing / verification

This is polish, not functional change, so the verification surface is visual.

- Open each page at 360px, 768px, 1280px, 1920px widths. Confirm layout isn't broken.
- Confirm hovers, focus states, and existing animations still work.
- Confirm `prefers-reduced-motion: reduce` disables motion.
- Confirm `sidebar.js` still injects correctly and active state highlights the current tool.
- Confirm the dashboard grid and locked-tool state still render.
- Smoke test: auth/me, stripe checkout button, growth-predictor form submit — confirm no visual restyle broke JS selectors.

## Risk & rollback

- **Risk:** page-level `<style>` blocks reference colors by variable name that no longer exists in the page's own scope. Mitigation: `theme.css` sets all variables on `:root`, so any page importing it inherits them.
- **Risk:** Google Fonts network call adds latency. Mitigation: `preconnect` + `display=swap`.
- **Rollback:** the polish is additive (new `theme.css` + edits to existing files). Each page is an independent unit; any page can be reverted via `git checkout -- public/<page>.html` without affecting others.

## Out of scope

- No changes to `/api/**`.
- No changes to `server.js`, `vercel.json`, or `package.json`.
- No new dependencies.
- No copy edits.
- No new features, no removed features.
