# Magazine-Style Visual Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the blog's CSS from a collection of ad-hoc component styles into a unified magazine design system with strict tokens for type, spacing, color, cards, and grids.

**Architecture:** The 8-file CSS pipeline stays (`0-tokens` → `7-utilities` → concat → minify → fingerprint). Each file is rewritten in order, with templates updated last. The core inversion: instead of components inventing their own values, they reference a shared token layer. Three card variants replace ~8 ad-hoc card-like components.

**Tech Stack:** Hugo Extended 0.159.2, hand-written CSS (no PostCSS/Tailwind), Google Fonts (IBM Plex Sans/Mono + Noto Serif SC)

**Spec:** `docs/superpowers/specs/2026-05-28-magazine-redesign-design.md`

---

### Task 1: Rewrite `assets/css/0-tokens.css` — Design Token Foundation

**Files:**
- Rewrite: `assets/css/0-tokens.css`

- [ ] **Step 1: Replace 0-tokens.css with the new token system**

```css
:root {
  /* ── Palette ── */
  --bg: #f4efe7;
  --text-primary: #1d2d2b;
  --text-secondary: #556563;
  --text-tertiary: #8a9e9a;
  --surface-card: rgba(255, 252, 246, 0.92);
  --surface-elevated: rgba(255, 250, 241, 0.98);
  --border-subtle: rgba(29, 45, 43, 0.08);
  --border-strong: rgba(29, 45, 43, 0.14);
  --accent: #0b7a5a;
  --accent-deep: #08543f;
  --accent-soft: rgba(11, 122, 90, 0.1);

  /* ── Shadows ── */
  --shadow-card: 0 18px 40px rgba(22, 35, 31, 0.08);
  --shadow-elevated: 0 24px 60px rgba(22, 35, 31, 0.14);

  /* ── Radii ── */
  --radius-md: 16px;
  --radius-lg: 24px;

  /* ── Layout widths ── */
  --content-width: 1520px;
  --content-gutter: clamp(16px, 2.4vw, 36px);
  --hero-max-width: 1600px;
  --article-shell-width: 1100px;
  --article-body-width: 720px;

  /* ── Grid ── */
  --grid-4: repeat(4, minmax(0, 1fr));
  --grid-3: repeat(3, minmax(0, 1fr));
  --grid-2: repeat(2, minmax(0, 1fr));
  --grid-1: 1fr;

  /* ── Spacing scale ── */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  --space-section: clamp(48px, 6vw, 80px);

  /* ── Typography ── */
  --font-sans: "IBM Plex Sans", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-serif: "Noto Serif SC", "Source Han Serif SC", "STSong", serif;
  --font-mono: "IBM Plex Mono", "Cascadia Code", Consolas, monospace;

  /* Type scale */
  --text-display: clamp(56px, 7vw, 96px);
  --text-headline: clamp(36px, 4.5vw, 54px);
  --text-title: clamp(28px, 3vw, 38px);
  --text-subhead: clamp(20px, 1.5vw, 26px);
  --text-body: 1.1rem;
  --text-small: 0.875rem;
  --text-caption: 0.75rem;
  --text-eyebrow: 0.6875rem;

  /* Leading */
  --leading-display: 0.94;
  --leading-heading: 1.12;
  --leading-title: 1.2;
  --leading-subhead: 1.32;
  --leading-body: 1.8;

  /* ── Transitions ── */
  --ease-out: 300ms ease-out;
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/css/0-tokens.css
git commit -m "feat: rewrite design tokens for magazine system"
```

---

### Task 2: Simplify `assets/css/1-reset.css` — Clean Background

**Files:**
- Rewrite: `assets/css/1-reset.css`

- [ ] **Step 1: Replace 1-reset.css with simplified version**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-body);
  line-height: var(--leading-body);
  background: var(--bg);
}

body.has-open-menu {
  overflow: hidden;
}

a {
  color: inherit;
  text-decoration: none;
}

img {
  max-width: 100%;
  height: auto;
}

:where(a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])) {
  touch-action: manipulation;
}

:where(a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])):focus-visible {
  outline: 3px solid rgba(11, 122, 90, 0.38);
  outline-offset: 3px;
}

code,
pre {
  font-family: var(--font-mono);
}

.page-frame {
  min-height: 100vh;
}

.skip-link {
  position: fixed;
  top: 14px;
  left: 14px;
  z-index: 60;
  padding: 10px 14px;
  border-radius: 999px;
  background: #0f1f1d;
  color: #fff;
  box-shadow: 0 14px 30px rgba(15, 31, 29, 0.2);
  transform: translateY(-180%);
  transition: transform var(--ease-out);
}

.skip-link:focus {
  transform: translateY(0);
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/css/1-reset.css
git commit -m "feat: simplify body background to pure --bg color"
```

---

### Task 3: Refactor `assets/css/3-components.css` — Unified Card System

**Files:**
- Rewrite: `assets/css/3-components.css`

> Note: This file is processed **after** `2-layout.css` in the pipeline (see `head.html:16-22`). However we write it first because layout references card classes. The CSS cascade in Hugo's `resources.Concat` follows the slice order: tokens → reset → layout → components → pages → article → dark → utilities. We process tasks in logical dependency order here, not file-number order.

- [ ] **Step 1: Replace 3-components.css with unified component system**

```css
/* ═══════════════════════════════════════════════
   Unified Card System
   ═══════════════════════════════════════════════ */

/* Card — default card for articles, topics, entries, roadmap */
.card {
  display: grid;
  gap: var(--space-sm);
  padding: var(--space-lg);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  position: relative;
  overflow: hidden;
  isolation: isolate;
  transition: transform var(--ease-out), box-shadow var(--ease-out), border-color var(--ease-out);
}

.card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--accent-soft), transparent 56%);
  opacity: 0;
  transition: opacity var(--ease-out);
  pointer-events: none;
}

.card::after {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent), rgba(35, 166, 127, 0.38));
  opacity: 0;
  transform: scaleX(0.2);
  transform-origin: 0 50%;
  transition: opacity 0.24s ease, transform 0.26s cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
}

.card:hover,
.card:focus-visible {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
  border-color: rgba(11, 122, 90, 0.22);
}

.card:hover::before,
.card:hover::after,
.card:focus-visible::before,
.card:focus-visible::after {
  opacity: 1;
  transform: scaleX(1);
}

/* Card--elevated — hero feature, key modules */
.card--elevated {
  box-shadow: var(--shadow-elevated);
  background: var(--surface-elevated);
}

/* Card--flush — search results, snippet list, TOC, related teasers */
.card--flush {
  padding: var(--space-md);
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
}

.card--flush::before,
.card--flush::after {
  display: none;
}

.card--flush:hover {
  transform: translateY(-1px);
  background: rgba(11, 122, 90, 0.06);
  box-shadow: none;
}

/* ═══════════════════════════════════════════════
   Card content patterns
   ═══════════════════════════════════════════════ */

.card__meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-sm) var(--space-md);
  color: var(--text-tertiary);
  font-size: var(--text-caption);
}

.card__title {
  margin: var(--space-sm) 0 var(--space-xs);
  font-family: var(--font-serif);
  font-size: var(--text-subhead);
  line-height: var(--leading-subhead);
}

.card__desc {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.card__kicker {
  color: var(--accent);
  font-size: var(--text-eyebrow);
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

/* ═══════════════════════════════════════════════
   Buttons
   ═══════════════════════════════════════════════ */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 20px;
  border-radius: 999px;
  font-weight: 700;
  font-size: var(--text-small);
  transition: transform var(--ease-out), box-shadow var(--ease-out);
}

.btn:hover {
  transform: translateY(-1px);
}

.btn--primary {
  color: #fff;
  background: linear-gradient(135deg, var(--accent), #0d8b66);
  box-shadow: 0 16px 34px rgba(11, 122, 90, 0.28);
}

.btn--secondary {
  border: 1px solid var(--border-strong);
  background: rgba(255, 255, 255, 0.52);
  color: var(--text-primary);
}

/* ═══════════════════════════════════════════════
   Tags & Badges
   ═══════════════════════════════════════════════ */

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: var(--space-md);
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-deep);
  font-size: var(--text-caption);
  font-weight: 700;
  white-space: normal;
  overflow-wrap: anywhere;
}

.tag-pill--muted {
  background: rgba(29, 45, 43, 0.06);
  color: var(--text-secondary);
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: var(--text-caption);
  font-weight: 800;
  letter-spacing: 0.02em;
  white-space: normal;
  overflow-wrap: anywhere;
}

.badge--algo { background: rgba(11, 122, 90, 0.12); color: var(--accent-deep); }
.badge--viz   { background: rgba(43, 89, 195, 0.14); color: #2b59c3; }
.badge--source { background: rgba(29, 45, 43, 0.06); color: var(--text-secondary); }
.badge--difficulty-easy   { background: rgba(82, 170, 94, 0.14); color: #2f7d3c; }
.badge--difficulty-medium { background: rgba(202, 123, 24, 0.14); color: #9a5d12; }
.badge--difficulty-hard   { background: rgba(181, 58, 58, 0.14); color: #9b2f2f; }

/* ═══════════════════════════════════════════════
   Search Components
   ═══════════════════════════════════════════════ */

.site-search {
  position: relative;
  min-width: min(100%, 360px);
}

.site-search__form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-sm);
  align-items: center;
}

.site-search__input {
  width: 100%;
  min-height: 48px;
  padding: 0 var(--space-md);
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: var(--surface-card);
  color: var(--text-primary);
  font: inherit;
}

.site-search__input:focus {
  outline: none;
  border-color: rgba(11, 122, 90, 0.5);
  box-shadow: 0 0 0 4px rgba(11, 122, 90, 0.12);
}

.site-search__button {
  min-height: 48px;
  padding: 0 var(--space-md);
  border: none;
  border-radius: 999px;
  background: rgba(11, 122, 90, 0.14);
  color: var(--accent-deep);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: transform var(--ease-out), box-shadow var(--ease-out);
}

.site-search__button:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(22, 35, 31, 0.08);
}

.site-search__dropdown {
  position: absolute;
  top: calc(100% + var(--space-sm));
  left: 0;
  right: 0;
  z-index: 30;
  padding: var(--space-md);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  background: var(--surface-elevated);
  box-shadow: var(--shadow-elevated);
  backdrop-filter: blur(16px);
}

.site-search__status,
.search-page__status,
.search-result__meta,
.search-empty {
  color: var(--text-secondary);
  font-size: var(--text-small);
}

.site-search__results,
.search-page__results {
  display: grid;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.site-search__more {
  display: inline-flex;
  align-items: center;
  margin-top: var(--space-md);
  color: var(--accent-deep);
  font-weight: 700;
}

.search-result {
  composes: card--flush;
  display: grid;
  gap: var(--space-sm);
  padding: var(--space-md);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-card);
}

.search-result:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
  border-color: rgba(11, 122, 90, 0.22);
}

.search-result__title {
  font-size: var(--text-subhead);
  line-height: 1.4;
}

.search-result__summary {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.search-result__highlight {
  padding: 0.08em 0.28em;
  border-radius: 999px;
  background: rgba(11, 122, 90, 0.18);
  color: var(--accent-deep);
}

/* ═══════════════════════════════════════════════
   Search Page
   ═══════════════════════════════════════════════ */

.search-page {
  display: grid;
  gap: var(--space-md);
}

.search-page__bar {
  display: grid;
  gap: var(--space-md);
}

.search-page .site-search {
  min-width: 100%;
}

.search-page .site-search__dropdown {
  position: static;
  margin-top: var(--space-sm);
}

/* ═══════════════════════════════════════════════
   Search History
   ═══════════════════════════════════════════════ */

.search-history {
  display: grid;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.search-history__title {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-small);
  font-weight: 700;
}

.search-history__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.search-chip,
.search-history__clear {
  min-height: 40px;
  padding: 0 var(--space-md);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: var(--surface-card);
  color: var(--text-primary);
  font: inherit;
  cursor: pointer;
}

.search-chip:hover,
.search-history__clear:hover {
  border-color: rgba(11, 122, 90, 0.28);
  color: var(--accent-deep);
}

.search-history__clear {
  justify-self: start;
  color: var(--text-secondary);
}

/* ═══════════════════════════════════════════════
   Search Group (section grouping)
   ═══════════════════════════════════════════════ */

.search-group {
  display: grid;
  gap: var(--space-sm);
}

.search-group__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.search-group__title {
  margin: 0;
  font-size: var(--text-subhead);
  font-family: var(--font-serif);
}

.search-group--compact .search-group__title {
  font-size: var(--text-small);
  font-family: var(--font-sans);
}

.search-group__count {
  color: var(--text-secondary);
  font-size: var(--text-caption);
}

.search-group__list {
  display: grid;
  gap: var(--space-sm);
}

.search-page__status {
  margin: 0;
}

.search-selectable--active {
  outline: none;
}

.search-result.search-selectable--active {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
  border-color: rgba(11, 122, 90, 0.28);
  background: rgba(255, 255, 255, 0.92);
}

.search-chip.search-selectable--active {
  border-color: rgba(11, 122, 90, 0.32);
  background: rgba(11, 122, 90, 0.14);
  color: var(--accent-deep);
}

/* ═══════════════════════════════════════════════
   Compact Header Search
   ═══════════════════════════════════════════════ */

.site-search--compact {
  min-width: clamp(180px, 22vw, 240px);
}

.site-search--compact .site-search__form {
  grid-template-columns: minmax(0, 1fr) 38px;
  gap: var(--space-sm);
}

.site-search--compact .site-search__input {
  min-height: 44px;
  padding: 0 var(--space-md);
  font-size: var(--text-small);
  background: rgba(255, 255, 255, 0.68);
}

.site-search--compact .site-search__button {
  min-height: 44px;
  width: 44px;
  padding: 0;
  font-size: var(--text-caption);
  background: rgba(11, 122, 90, 0.1);
}

.site-search--compact .site-search__dropdown {
  top: calc(100% + var(--space-sm));
}

.search-page .site-search--full {
  min-width: 100%;
}

/* ═══════════════════════════════════════════════
   Search Icon Toggle (article pages)
   ═══════════════════════════════════════════════ */

.site-search__toggle {
  display: inline-grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.66);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color var(--ease-out), color var(--ease-out), border-color var(--ease-out);
}

.site-search__toggle:hover,
.site-search--open .site-search__toggle {
  color: var(--accent-deep);
  border-color: rgba(11, 122, 90, 0.2);
  background: rgba(11, 122, 90, 0.1);
}

.site-search__icon {
  width: 18px;
  height: 18px;
}

.site-search--icon {
  min-width: auto;
  width: 46px;
}

.site-search--icon .site-search__panel--floating {
  position: absolute;
  top: calc(100% + var(--space-sm));
  right: 0;
  width: min(420px, 76vw);
  padding: var(--space-md);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  background: var(--surface-elevated);
  box-shadow: var(--shadow-elevated);
  backdrop-filter: blur(16px);
  z-index: 35;
}

.site-search--icon .site-search__form {
  grid-template-columns: minmax(0, 1fr) 46px;
  gap: var(--space-sm);
}

.site-search--icon .site-search__input {
  min-height: 46px;
  padding: 0 var(--space-md);
  font-size: var(--text-small);
}

.site-search--icon .site-search__button {
  min-height: 46px;
  width: 46px;
  padding: 0;
  font-size: var(--text-caption);
}

.site-search--icon .site-search__dropdown {
  position: static;
  margin-top: var(--space-sm);
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

/* Search icon animation */
.site-search__panel--floating {
  transform-origin: top right;
}

.site-search--icon .site-search__panel--floating {
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px) scale(0.98);
  pointer-events: none;
  transition:
    opacity var(--ease-out),
    transform var(--ease-out),
    visibility 0s linear 220ms;
}

.site-search--icon.site-search--open .site-search__panel--floating {
  opacity: 1;
  visibility: visible;
  transform: translateY(0) scale(1);
  pointer-events: auto;
  transition:
    opacity var(--ease-out),
    transform var(--ease-out),
    visibility 0s linear 0s;
}

.site-search--icon.site-search--open .site-search__toggle {
  transform: translateY(-1px) scale(1.02);
}

/* ═══════════════════════════════════════════════
   Article Navigation (prev/next)
   ═══════════════════════════════════════════════ */

.article-nav {
  display: grid;
  grid-template-columns: var(--grid-2);
  gap: var(--space-md);
}

.article-nav__item {
  display: grid;
  gap: var(--space-xs);
  padding: var(--space-lg);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  position: relative;
  overflow: hidden;
  isolation: isolate;
  transition: transform var(--ease-out), box-shadow var(--ease-out), border-color var(--ease-out);
}

.article-nav__item::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--accent-soft), transparent 56%);
  opacity: 0;
  transition: opacity var(--ease-out);
  pointer-events: none;
}

.article-nav__item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
  border-color: rgba(11, 122, 90, 0.22);
}

.article-nav__item:hover::before {
  opacity: 1;
}

.article-nav__item--next {
  text-align: right;
}

.article-nav__item span {
  color: var(--text-tertiary);
  font-size: var(--text-caption);
}

.article-nav__item strong {
  font-size: var(--text-subhead);
}

/* ═══════════════════════════════════════════════
   Pagination
   ═══════════════════════════════════════════════ */

.pager {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-md);
  margin-top: var(--space-md);
  padding: var(--space-lg);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  background: var(--surface-elevated);
  box-shadow: var(--shadow-elevated);
  backdrop-filter: blur(12px);
}

.pager__meta {
  display: grid;
  justify-items: center;
  gap: var(--space-sm);
}

.pager__summary {
  color: var(--text-secondary);
  font-size: var(--text-small);
  font-weight: 700;
}

.pager__list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-sm);
}

.pager__link,
.pager__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 var(--space-md);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: var(--surface-card);
  color: var(--text-primary);
  font-weight: 700;
  transition: transform var(--ease-out), box-shadow var(--ease-out), border-color var(--ease-out);
}

.pager__link:hover,
.pager__item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
  border-color: rgba(11, 122, 90, 0.24);
}

.pager__item--current {
  border-color: rgba(11, 122, 90, 0.3);
  background: rgba(11, 122, 90, 0.12);
  color: var(--accent-deep);
}

.pager__link--disabled {
  color: var(--text-secondary);
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.48);
  box-shadow: none;
}

.pager__link--disabled:hover {
  transform: none;
  border-color: var(--border-subtle);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ═══════════════════════════════════════════════
   Related Posts Teasers
   ═══════════════════════════════════════════════ */

.related-block {
  display: grid;
  gap: var(--space-md);
}

.related-block__head {
  display: grid;
  gap: var(--space-xs);
}

.related-list {
  display: grid;
  gap: 0;
}

.related-teaser {
  display: grid;
  gap: var(--space-sm);
  padding: var(--space-md) 0;
  border-top: 1px solid var(--border-subtle);
  transition: transform var(--ease-out), color var(--ease-out);
}

.related-teaser:first-child {
  padding-top: 0;
  border-top: none;
}

.related-teaser:hover {
  transform: translateY(-2px);
  color: var(--accent-deep);
}

.related-teaser__meta {
  color: var(--text-tertiary);
  font-size: var(--text-caption);
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.related-teaser strong {
  font-size: var(--text-subhead);
  line-height: var(--leading-subhead);
}

.related-teaser p {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-small);
  line-height: 1.65;
  overflow-wrap: anywhere;
}

/* ═══════════════════════════════════════════════
   Comments
   ═══════════════════════════════════════════════ */

.comments-block {
  padding: var(--space-lg);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--surface-card);
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/css/3-components.css
git commit -m "feat: refactor components with unified card system and design tokens"
```

---

### Task 4: Refactor `assets/css/2-layout.css` — Grid, Header, Footer

**Files:**
- Rewrite: `assets/css/2-layout.css`

- [ ] **Step 1: Replace 2-layout.css with refactored layout system**

```css
/* ═══════════════════════════════════════════════
   Container
   ═══════════════════════════════════════════════ */

.site-header,
.site-main,
.site-footer {
  width: min(calc(100% - (var(--content-gutter) * 2)), var(--content-width));
  margin-inline: auto;
}

/* ═══════════════════════════════════════════════
   Header — newspaper masthead style
   ═══════════════════════════════════════════════ */

.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  padding-top: var(--space-md);
}

.site-header__inner {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-card);
  backdrop-filter: blur(12px);
  animation: intro-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-width: 0;
}

.brand__mark {
  display: inline-grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  color: #fff;
  font-weight: 700;
  font-size: 18px;
  text-transform: lowercase;
  background: linear-gradient(135deg, var(--accent), #23a67f);
  box-shadow: 0 18px 40px rgba(11, 122, 90, 0.3);
}

.brand__text {
  display: grid;
  gap: var(--space-xs);
}

.brand__text strong {
  font-size: var(--text-small);
}

.brand__text small {
  color: var(--text-secondary);
  font-size: var(--text-caption);
}

.site-header__desktop-search {
  justify-self: end;
}

.site-header__mobile-controls,
.site-header__mobile-panel {
  display: none;
}

.site-header__menu-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  width: auto;
  padding: 0 var(--space-md);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  color: var(--text-primary);
  cursor: pointer;
  transition: transform var(--ease-out), box-shadow var(--ease-out), border-color var(--ease-out);
}

.site-header__menu-toggle:hover,
.site-header[data-menu-open="true"] .site-header__menu-toggle {
  border-color: rgba(11, 122, 90, 0.24);
  background: rgba(11, 122, 90, 0.12);
  box-shadow: 0 10px 24px rgba(22, 35, 31, 0.08);
}

.site-header__menu-label {
  font-size: var(--text-caption);
  font-weight: 800;
  letter-spacing: 0.04em;
}

.site-header__menu-icon {
  display: grid;
  gap: 4px;
  width: 18px;
}

.site-header__menu-icon span {
  display: block;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
  transition: transform var(--ease-out), opacity var(--ease-out);
}

.site-header[data-menu-open="true"] .site-header__menu-icon span:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}

.site-header[data-menu-open="true"] .site-header__menu-icon span:nth-child(2) {
  opacity: 0;
}

.site-header[data-menu-open="true"] .site-header__menu-icon span:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

.site-header__backdrop {
  position: fixed;
  inset: 0;
  z-index: 18;
  background: rgba(15, 31, 29, 0.18);
  backdrop-filter: blur(6px);
}

/* Navigation */
.nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
}

.nav__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: var(--space-sm) var(--space-md);
  border-radius: 999px;
  color: var(--text-secondary);
  font-size: var(--text-small);
  font-weight: 600;
  transition: background-color var(--ease-out), color var(--ease-out);
}

.nav__link:hover,
.nav__link--active {
  color: var(--accent-deep);
  background: var(--accent-soft);
}

/* ═══════════════════════════════════════════════
   Main content
   ═══════════════════════════════════════════════ */

.site-main {
  padding-block: var(--space-xl) var(--space-3xl);
}

.site-footer {
  padding-bottom: var(--space-2xl);
}

.site-footer__inner {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-lg);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--surface-card);
}

.site-footer__inner p {
  margin: var(--space-xs) 0 0;
  color: var(--text-secondary);
}

.site-footer__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  font-weight: 700;
  color: var(--accent-deep);
}

/* ═══════════════════════════════════════════════
   Breadcrumb
   ═══════════════════════════════════════════════ */

.breadcrumb {
  margin-bottom: var(--space-lg);
}

.breadcrumb__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin: 0;
  padding: 0;
  list-style: none;
}

.breadcrumb__item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.breadcrumb__item:not(:last-child)::after {
  content: ">";
  color: var(--text-secondary);
  font-size: var(--text-small);
}

.breadcrumb__link {
  color: var(--accent-deep);
  font-size: var(--text-small);
  font-weight: 600;
  text-decoration: none;
  transition: color var(--ease-out);
}

.breadcrumb__link:hover {
  color: var(--accent);
  text-decoration: underline;
}

.breadcrumb__text {
  color: var(--text-primary);
  font-size: var(--text-small);
  font-weight: 600;
}

/* ═══════════════════════════════════════════════
   Shared Section Elements
   ═══════════════════════════════════════════════ */

.eyebrow {
  margin: 0 0 var(--space-sm);
  color: var(--accent);
  font-size: var(--text-eyebrow);
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.section-head h2 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: var(--text-title);
  line-height: var(--leading-title);
}

.text-link {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  color: var(--accent-deep);
  font-weight: 700;
}

/* ═══════════════════════════════════════════════
   Surface (content panels)
   ═══════════════════════════════════════════════ */

.surface {
  padding: var(--space-lg);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  box-shadow: var(--shadow-card);
  margin-top: var(--space-md);
}

.surface--elevated {
  background: var(--surface-elevated);
  box-shadow: var(--shadow-elevated);
}

.surface--stream {
  background: linear-gradient(180deg, var(--surface-card), rgba(238, 245, 242, 0.92));
}

.surface--catalog {
  padding: clamp(28px, 3vw, 40px);
}

/* ═══════════════════════════════════════════════
   Card Grids
   ═══════════════════════════════════════════════ */

.card-grid {
  display: grid;
  grid-template-columns: var(--grid-3);
  gap: var(--space-md);
}

.card-grid--wide {
  grid-template-columns: var(--grid-3);
  gap: clamp(18px, 1.8vw, var(--space-lg));
}

.topic-grid {
  display: grid;
  grid-template-columns: var(--grid-3);
  gap: var(--space-md);
}

.topic-grid--wide {
  gap: clamp(18px, 1.8vw, var(--space-lg));
}

.split-grid {
  display: grid;
  grid-template-columns: var(--grid-2);
  gap: var(--space-md);
  margin-top: var(--space-md);
}

/* ═══════════════════════════════════════════════
   Page Hero (section/taxonomy pages)
   ═══════════════════════════════════════════════ */

.page-hero {
  padding: var(--space-lg);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  background: var(--surface-elevated);
  box-shadow: var(--shadow-card);
  margin-top: var(--space-md);
  animation: intro-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.page-hero h1 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: var(--text-headline);
  line-height: var(--leading-heading);
}

.page-hero__lead {
  max-width: 48rem;
  margin: var(--space-md) 0 0;
  color: var(--text-secondary);
  font-size: var(--text-subhead);
  line-height: var(--leading-body);
}

/* ═══════════════════════════════════════════════
   Roadmap
   ═══════════════════════════════════════════════ */

.roadmap-shell {
  display: grid;
  gap: var(--space-md);
  margin-top: var(--space-md);
}

.roadmap-list {
  display: grid;
  gap: var(--space-md);
}

/* ═══════════════════════════════════════════════
   Entry card (list items)
   ═══════════════════════════════════════════════ */

.entry-panel {
  margin-top: 0;
}

.entry-list {
  display: grid;
  gap: var(--space-md);
}

/* ═══════════════════════════════════════════════
   Home Flow Container
   ═══════════════════════════════════════════════ */

.home-flow {
  display: grid;
  gap: var(--space-lg);
  margin-top: var(--space-lg);
  width: min(100%, 1500px);
  margin-inline: auto;
}

/* ═══════════════════════════════════════════════
   Entry / Roadmap / Topic cards now all use .card
   ═══════════════════════════════════════════════ */

.roadmap-item p,
.topic-card p,
.entry-card p {
  margin: 0;
  color: var(--text-secondary);
}

.roadmap-item span,
.topic-card span,
.entry-card__meta {
  color: var(--accent-deep);
  font-size: var(--text-caption);
  font-weight: 700;
}

/* ═══════════════════════════════════════════════
   Empty state
   ═══════════════════════════════════════════════ */

.empty-state {
  text-align: center;
}

/* ═══════════════════════════════════════════════
   Responsive: Tablet
   ═══════════════════════════════════════════════ */

@media (max-width: 980px) {
  .site-header__inner {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-md);
    padding: var(--space-md);
  }

  .site-header__nav--desktop,
  .site-header__desktop-search {
    display: none;
  }

  .site-header__mobile-controls {
    display: flex;
    align-items: center;
    justify-self: end;
  }

  .site-header__mobile-panel {
    display: grid;
    grid-column: 1 / -1;
    gap: var(--space-md);
    max-height: none;
  }

  .site-header[data-menu-ready="true"] .site-header__mobile-panel {
    max-height: 0;
    margin-top: 0;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-10px);
    transition:
      max-height 0.26s ease,
      opacity var(--ease-out),
      margin-top var(--ease-out),
      transform var(--ease-out);
  }

  .site-header[data-menu-ready="true"][data-menu-open="true"] .site-header__mobile-panel {
    max-height: 80vh;
    margin-top: var(--space-md);
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }

  .site-header__nav--mobile {
    display: grid;
    gap: 0;
  }

  .site-header__nav--mobile .nav__link {
    justify-content: flex-start;
    min-height: 52px;
    padding: var(--space-md) 0;
    border-radius: 0;
    border-bottom: 1px solid var(--border-subtle);
    background: transparent;
  }

  .site-header__nav--mobile .nav__link:hover,
  .site-header__nav--mobile .nav__link--active {
    transform: none;
    background: transparent;
  }

  .card-grid,
  .topic-grid,
  .split-grid {
    grid-template-columns: var(--grid-1);
  }

  .article-nav {
    grid-template-columns: var(--grid-1);
  }

  .pager {
    grid-template-columns: 1fr;
    justify-items: stretch;
  }

  .pager__meta {
    order: -1;
  }
}

/* ═══════════════════════════════════════════════
   Responsive: Large desktop
   ═══════════════════════════════════════════════ */

@media (min-width: 1240px) {
  .card-grid--wide {
    grid-template-columns: var(--grid-4);
  }

  .topic-grid--wide {
    grid-template-columns: var(--grid-4);
  }
}

/* ═══════════════════════════════════════════════
   Responsive: Mobile
   ═══════════════════════════════════════════════ */

@media (max-width: 720px) {
  .site-header__inner {
    padding: var(--space-sm) var(--space-md);
  }

  .site-search__form {
    grid-template-columns: 1fr;
  }

  .site-search__button {
    width: 100%;
  }

  .site-header__menu-label {
    display: none;
  }

  .brand__text small {
    display: none;
  }

  .section-head,
  .site-footer__inner {
    flex-direction: column;
    align-items: start;
  }

  .surface,
  .page-hero {
    padding: var(--space-md);
  }

  .section-head h2 {
    font-size: clamp(26px, 7vw, var(--text-title));
  }

  .pager__link,
  .pager__item {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .site-header,
  .site-main,
  .site-footer {
    width: min(calc(100% - 16px), var(--content-width));
  }

  .surface,
  .page-hero,
  .site-footer__inner {
    padding: var(--space-md);
  }
}

/* ═══════════════════════════════════════════════
   Intro animation
   ═══════════════════════════════════════════════ */

@keyframes intro-rise {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/css/2-layout.css
git commit -m "feat: refactor layout with masthead header and token-driven grids"
```

---

### Task 5: Refactor `assets/css/4-pages.css` — Homepage Hero & Article Shell

**Files:**
- Rewrite: `assets/css/4-pages.css`

- [ ] **Step 1: Replace 4-pages.css**

```css
/* ═══════════════════════════════════════════════
   Landing Hero — full-bleed editorial opener
   ═══════════════════════════════════════════════ */

.landing-hero {
  position: relative;
  left: 50%;
  width: min(calc(100vw - (var(--content-gutter) * 2)), var(--hero-max-width));
  margin: 0;
  padding: clamp(28px, 4vw, 44px);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  background: linear-gradient(145deg, var(--surface-elevated), rgba(232, 241, 236, 0.92));
  box-shadow: var(--shadow-elevated);
  transform: translateX(-50%);
  overflow: hidden;
}

.landing-hero::before,
.landing-hero::after {
  content: "";
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.landing-hero::before {
  top: -120px;
  right: -40px;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(11, 122, 90, 0.14), transparent 68%);
}

.landing-hero::after {
  bottom: -140px;
  left: -100px;
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(24, 34, 32, 0.06), transparent 72%);
}

.landing-hero__inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: var(--grid-2);
  gap: var(--space-lg);
  align-items: stretch;
}

.landing-hero__copy {
  display: grid;
  align-content: end;
  gap: var(--space-md);
  max-width: 44rem;
  min-height: min(72vh, 620px);
}

.landing-hero__eyebrow {
  margin: 0;
  color: var(--accent);
  font-size: var(--text-eyebrow);
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.landing-hero h1 {
  margin: 0;
  max-width: 8ch;
  font-family: var(--font-serif);
  font-size: var(--text-display);
  line-height: var(--leading-display);
  letter-spacing: -0.04em;
}

.landing-hero__lead {
  max-width: 20ch;
  margin: 0;
  color: #28403c;
  font-size: clamp(22px, 2.2vw, 30px);
  line-height: 1.4;
}

.landing-hero__body {
  max-width: 56ch;
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-small);
}

.landing-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  padding-top: var(--space-sm);
}

.landing-hero__stats {
  display: grid;
  grid-template-columns: var(--grid-3);
  gap: var(--space-sm);
  max-width: 560px;
  margin: var(--space-xs) 0 0;
}

.landing-hero__stats div {
  display: grid;
  gap: var(--space-xs);
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-subtle);
}

.landing-hero__stats dt {
  color: var(--text-secondary);
  font-size: var(--text-caption);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.landing-hero__stats dd {
  margin: 0;
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 800;
  line-height: 1;
}

/* Hero feature card */
.landing-hero__stage {
  display: grid;
  grid-template-rows: minmax(280px, 1fr) auto;
  gap: var(--space-md);
}

.landing-hero__feature {
  display: grid;
  align-content: end;
  gap: var(--space-sm);
  min-height: 320px;
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(180deg, rgba(15, 31, 29, 0.08), rgba(15, 31, 29, 0.68)),
    linear-gradient(135deg, rgba(21, 44, 40, 0.88), rgba(7, 106, 78, 0.84));
  color: #edf4f1;
  box-shadow: var(--shadow-elevated);
  transition: transform var(--ease-out);
}

.landing-hero__feature::after {
  content: "";
  position: absolute;
  inset: var(--space-md);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: calc(var(--radius-lg) - 6px);
  pointer-events: none;
}

.landing-hero__feature:hover {
  transform: translateY(-2px);
}

.landing-hero__feature-kicker {
  position: relative;
  z-index: 1;
  color: rgba(237, 244, 241, 0.76);
  font-size: var(--text-eyebrow);
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.landing-hero__feature strong {
  position: relative;
  z-index: 1;
  font-size: clamp(26px, 3vw, 36px);
  line-height: 1.18;
}

.landing-hero__feature p {
  position: relative;
  z-index: 1;
  margin: 0;
  line-height: 1.65;
}

.landing-hero__feature-meta {
  position: relative;
  z-index: 1;
  color: rgba(237, 244, 241, 0.8);
  font-size: var(--text-caption);
  font-weight: 600;
}

/* Hero tracks */
.landing-hero__tracks {
  display: grid;
  grid-template-columns: var(--grid-3);
  gap: var(--space-sm);
}

.landing-hero__track {
  display: grid;
  gap: var(--space-sm);
  min-height: 100%;
  padding: var(--space-lg);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--surface-card);
  box-shadow: var(--shadow-card);
  transition: transform var(--ease-out), box-shadow var(--ease-out);
}

.landing-hero__track:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-elevated);
}

.landing-hero__track span {
  color: var(--accent-deep);
  font-size: var(--text-caption);
  font-weight: 700;
}

.landing-hero__track strong {
  font-size: var(--text-subhead);
  line-height: var(--leading-subhead);
}

.landing-hero__track p {
  margin: 0;
  color: var(--text-secondary);
}

.landing-hero__track--accent {
  background: linear-gradient(180deg, rgba(11, 122, 90, 0.1), var(--surface-card));
}

/* ═══════════════════════════════════════════════
   Article Shell — editorial layout
   ═══════════════════════════════════════════════ */

.article-shell {
  display: grid;
  gap: var(--space-lg);
}

.article-shell--editorial {
  width: min(100%, var(--article-shell-width));
  margin-inline: auto;
}

.article-head {
  padding: var(--space-lg);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  background: var(--surface-elevated);
  margin-top: var(--space-md);
  animation: intro-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.article-head h1 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: var(--text-headline);
  line-height: var(--leading-heading);
  letter-spacing: -0.02em;
}

.article-head--editorial {
  padding: clamp(24px, 3vw, 36px);
  background: linear-gradient(180deg, var(--surface-elevated), rgba(241, 248, 244, 0.9));
}

.article-head--narrow {
  width: 100%;
}

.article-head__intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-lg);
  align-items: end;
}

.article-head__title-block {
  max-width: 60rem;
}

.article-head__meta-block {
  justify-self: end;
}

.article-head__meta-block .article-meta {
  display: grid;
  gap: var(--space-sm);
  margin-top: 0;
  padding-left: var(--space-lg);
  border-left: 1px solid var(--border-subtle);
}

.article-head__summary {
  max-width: 68rem;
  margin: var(--space-lg) 0 0;
  color: var(--text-secondary);
  font-size: clamp(21px, 2vw, 26px);
  line-height: var(--leading-body);
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md) var(--space-md);
  margin-top: var(--space-lg);
  color: var(--text-secondary);
  font-size: var(--text-small);
}

.article-meta span {
  overflow-wrap: anywhere;
}

/* Article layout: main content + TOC rail */
.article-layout {
  display: grid;
  gap: var(--space-lg);
  align-items: start;
}

.article-layout--with-toc {
  grid-template-columns: minmax(0, 1fr) 380px;
  align-items: start;
}

.article-content {
  display: grid;
  gap: var(--space-lg);
  min-width: 0;
}

/* Article body */
.article-body {
  padding: clamp(30px, 4vw, 48px);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  box-shadow: var(--shadow-card);
}

.article-body--narrow {
  width: min(100%, 860px);
  margin-inline: auto;
}

/* TOC rail */
.article-toc--rail {
  position: sticky;
  top: 100px;
  align-self: start;
}

.toc-card {
  padding: var(--space-lg);
  border: 1px solid rgba(11, 122, 90, 0.12);
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, var(--surface-elevated), rgba(241, 247, 244, 0.94));
  box-shadow: var(--shadow-card);
  position: relative;
}

.toc-card::before {
  content: "";
  position: absolute;
  inset: var(--space-md) var(--space-md) auto;
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent), rgba(35, 166, 127, 0.36));
  pointer-events: none;
}

.toc-card h2 {
  margin: 0 0 var(--space-md);
  color: var(--accent-deep);
  font-size: var(--text-small);
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.toc-card nav {
  max-height: calc(100vh - 160px);
  overflow: auto;
  padding-right: var(--space-xs);
}

.toc-card ul {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.toc-card li {
  margin: 0;
}

.toc-card li + li {
  margin-top: var(--space-sm);
}

.toc-card ul ul {
  margin-top: var(--space-sm);
  margin-left: var(--space-sm);
  padding-left: var(--space-md);
  border-left: 1px solid rgba(11, 122, 90, 0.18);
}

.toc-card a {
  display: block;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-small);
  line-height: 1.5;
  transition: background-color var(--ease-out), color var(--ease-out), transform var(--ease-out);
}

.toc-card a:hover {
  color: var(--accent-deep);
  background: rgba(11, 122, 90, 0.08);
  transform: translateX(2px);
}

.toc-card a.is-trail {
  color: #42615a;
  background: rgba(11, 122, 90, 0.06);
}

.toc-card a.is-active,
.toc-card a[aria-current="true"] {
  color: var(--accent-deep);
  background: rgba(11, 122, 90, 0.14);
  box-shadow: inset 0 0 0 1px rgba(11, 122, 90, 0.16);
  font-weight: 700;
}

.toc-card a.is-active:hover,
.toc-card a[aria-current="true"]:hover {
  transform: none;
}

/* Article tool wrapper */
.article-tool {
  padding: var(--space-lg);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  box-shadow: var(--shadow-card);
}

.article-tool--nav {
  padding: var(--space-lg);
}

.article-tool--nav .article-nav__item {
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.64);
}

/* Narrow variant for pages without TOC */
.article-shell--solo .article-head,
.article-nav--narrow,
.article-shell--solo .comments-block {
  width: min(100%, 860px);
  margin-inline: auto;
}

.related-block--narrow {
  width: min(100%, 860px);
  margin-inline: auto;
}

/* ═══════════════════════════════════════════════
   Filter Panel
   ═══════════════════════════════════════════════ */

.filter-panel {
  display: grid;
  gap: var(--space-md);
}

.filter-panel .section-head {
  margin-bottom: 0;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 var(--space-md);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: var(--surface-card);
  color: var(--text-primary);
  font-size: var(--text-caption);
  font-weight: 700;
}

.filter-pill:hover,
.filter-pill--active {
  border-color: rgba(11, 122, 90, 0.24);
  background: rgba(11, 122, 90, 0.1);
  color: var(--accent-deep);
}

/* ═══════════════════════════════════════════════
   Responsive: Tablet (Hero & Article)
   ═══════════════════════════════════════════════ */

@media (max-width: 980px) {
  .landing-hero {
    width: min(calc(100vw - 24px), var(--hero-max-width));
    padding: var(--space-lg);
  }

  .landing-hero__inner {
    grid-template-columns: var(--grid-1);
  }

  .landing-hero__copy {
    min-height: auto;
  }

  .landing-hero__stage {
    grid-template-rows: auto;
  }

  .landing-hero__tracks {
    grid-template-columns: var(--grid-1);
  }

  .article-layout--with-toc {
    grid-template-columns: var(--grid-1);
  }

  .article-layout--with-toc .article-toc--rail {
    order: -1;
  }

  .article-toc--rail {
    position: static;
  }

  .article-head__intro {
    grid-template-columns: 1fr;
  }

  .article-head__meta-block {
    justify-self: start;
  }

  .article-head__meta-block .article-meta {
    padding-left: 0;
    border-left: none;
    border-top: 1px solid var(--border-subtle);
    padding-top: var(--space-md);
  }

  .toc-card nav {
    max-height: none;
  }
}

/* ═══════════════════════════════════════════════
   Responsive: Mobile (Hero & Article)
   ═══════════════════════════════════════════════ */

@media (max-width: 720px) {
  .landing-hero {
    width: min(calc(100vw - 20px), var(--hero-max-width));
    padding: var(--space-md);
  }

  .landing-hero h1 {
    max-width: none;
    font-size: clamp(42px, 16vw, 68px);
  }

  .landing-hero__lead {
    max-width: none;
    font-size: 20px;
  }

  .landing-hero__actions,
  .landing-hero__stats {
    grid-template-columns: var(--grid-1);
  }

  .landing-hero__stats dd {
    font-size: 30px;
  }

  .landing-hero__feature {
    min-height: 260px;
    padding: var(--space-md);
  }

  .article-head--editorial {
    padding: var(--space-md);
  }

  .article-tool,
  .article-tool--nav {
    padding: var(--space-md);
  }

  .related-teaser strong {
    font-size: 18px;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/css/4-pages.css
git commit -m "feat: refactor hero and article shell with token-driven design"
```

---

### Task 6: Refactor `assets/css/5-article.css` — Prose, Code, Badges, Visualizer

**Files:**
- Rewrite: `assets/css/5-article.css`

- [ ] **Step 1: Replace 5-article.css**

```css
/* ═══════════════════════════════════════════════
   Prose — reading typography
   ═══════════════════════════════════════════════ */

.prose {
  max-width: 74ch;
  margin-inline: auto;
  color: var(--text-primary);
  font-size: clamp(17px, 1.15vw, 19px);
  line-height: var(--leading-body);
  text-wrap: pretty;
}

.prose > *:first-child {
  margin-top: 0;
}

.prose > p:first-of-type {
  font-size: 1.12em;
  line-height: 1.95;
  color: #2b3d3a;
}

.prose h2,
.prose h3,
.prose h4 {
  margin-top: 2em;
  margin-bottom: 0.72em;
  line-height: var(--leading-heading);
  font-family: var(--font-serif);
  scroll-margin-top: 120px;
}

.prose h2 { font-size: clamp(30px, 3vw, 36px); }
.prose h3 { font-size: clamp(24px, 2.2vw, 29px); }
.prose h4 { font-size: 21px; }

.prose p,
.prose ul,
.prose ol,
.prose blockquote,
.prose pre,
.prose table {
  margin: 1.15em 0;
}

.prose img {
  display: block;
  margin: 1.6em auto;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  background: var(--surface-card);
}

.prose ul,
.prose ol {
  padding-left: 1.55em;
}

.prose li + li {
  margin-top: 0.42em;
}

.prose a {
  color: var(--accent-deep);
  text-decoration: underline;
  text-decoration-color: rgba(11, 122, 90, 0.36);
  text-underline-offset: 3px;
}

.prose blockquote,
.callout {
  margin: 1.6em 0;
  padding: var(--space-lg);
  border-left: 4px solid var(--accent);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  background: rgba(11, 122, 90, 0.06);
  font-family: var(--font-serif);
  font-style: italic;
  color: var(--text-secondary);
}

.callout strong {
  display: block;
  margin-bottom: var(--space-xs);
  font-style: normal;
  font-family: var(--font-sans);
}

.callout--warning {
  border-left-color: #ca7b18;
  background: rgba(202, 123, 24, 0.08);
}

.prose :not(pre) > code {
  padding: 0.18em 0.5em;
  border-radius: 12px;
  background: rgba(29, 45, 43, 0.08);
  font-size: 0.9em;
}

/* ═══════════════════════════════════════════════
   Code Blocks
   ═══════════════════════════════════════════════ */

.prose .highlight {
  position: relative;
  margin: 2.5em 0;
}

.prose .highlight pre,
.prose pre.chroma {
  overflow-x: auto;
  padding: 54px var(--space-lg) var(--space-lg);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  background: linear-gradient(180deg, #17211f, #131c1b);
  color: #edf4f1;
  line-height: 1.75;
  font-size: 15px;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.03),
    0 18px 34px rgba(16, 24, 23, 0.18);
}

.code-copy {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  min-height: 38px;
  padding: 0 var(--space-md);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(237, 244, 241, 0.9);
  font: inherit;
  font-size: var(--text-caption);
  font-weight: 700;
  cursor: pointer;
  transition: background-color var(--ease-out), border-color var(--ease-out), transform var(--ease-out);
}

.code-copy:hover:not(:disabled) {
  background: rgba(127, 208, 193, 0.18);
  border-color: rgba(127, 208, 193, 0.28);
  transform: translateY(-1px);
}

.code-copy:disabled {
  cursor: default;
  opacity: 0.92;
}

/* Code syntax colors */
.prose .chroma { background: transparent; color: #edf4f1; }
.prose .chroma .line { display: flex; align-items: flex-start; }
.prose .chroma .ln {
  flex: 0 0 3ch;
  width: 3ch;
  min-width: 3ch;
  margin-right: 1.25em;
  color: rgba(237, 244, 241, 0.35);
  text-align: right;
  user-select: none;
  font-variant-numeric: tabular-nums;
}
.prose .chroma .cl { flex: 1; }

.prose .chroma .k, .prose .chroma .kc, .prose .chroma .kd,
.prose .chroma .kn, .prose .chroma .kp, .prose .chroma .kr,
.prose .chroma .kt, .prose .chroma .ow { color: #f4b37d; }

.prose .chroma .nf, .prose .chroma .fm { color: #7fd0c1; }

.prose .chroma .na, .prose .chroma .nb, .prose .chroma .nc,
.prose .chroma .nd, .prose .chroma .ne, .prose .chroma .nn,
.prose .chroma .nx, .prose .chroma .nt { color: #d7f09a; }

.prose .chroma .s, .prose .chroma .sa, .prose .chroma .sb,
.prose .chroma .sc, .prose .chroma .dl, .prose .chroma .sd,
.prose .chroma .s2, .prose .chroma .se, .prose .chroma .sh,
.prose .chroma .si, .prose .chroma .sx, .prose .chroma .sr,
.prose .chroma .s1, .prose .chroma .ss { color: #9fdad0; }

.prose .chroma .m, .prose .chroma .mb, .prose .chroma .mf,
.prose .chroma .mh, .prose .chroma .mi, .prose .chroma .mo,
.prose .chroma .il { color: #c8a8ff; }

.prose .chroma .c, .prose .chroma .ch, .prose .chroma .cm,
.prose .chroma .c1, .prose .chroma .cs, .prose .chroma .cp,
.prose .chroma .cpf { color: rgba(201, 223, 216, 0.5); font-style: italic; }

.prose .chroma .o, .prose .chroma .p { color: #c7ddd7; }
.prose .chroma .w { color: transparent; }

/* ═══════════════════════════════════════════════
   Article badge rows
   ═══════════════════════════════════════════════ */

.article-badge-row,
.article-card__badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: var(--space-md);
}

/* ═══════════════════════════════════════════════
   Reading Progress Bar
   ═══════════════════════════════════════════════ */

#reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  height: 3px;
  width: 0;
  background: linear-gradient(90deg, var(--accent), #23a67f);
  box-shadow: 0 0 18px rgba(11, 122, 90, 0.22);
  transition: width 0.12s ease;
}

/* ═══════════════════════════════════════════════
   Algorithm Visualizer
   ═══════════════════════════════════════════════ */

.algorithm-visualizer {
  display: grid;
  gap: var(--space-lg);
  margin: 0 0 var(--space-xl);
  padding: var(--space-lg);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  background: linear-gradient(180deg, rgba(238, 245, 242, 0.96), var(--surface-elevated));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    0 18px 50px rgba(22, 35, 31, 0.1);
}

.algorithm-visualizer__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
}

.algorithm-visualizer__head h2 {
  margin: 0;
  font-size: clamp(26px, 3vw, 34px);
  font-family: var(--font-serif);
}

.algorithm-visualizer__intro,
.algorithm-visualizer__sample {
  margin: var(--space-sm) 0 0;
  color: var(--text-secondary);
}

.algorithm-visualizer__sample {
  max-width: 26rem;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  font-size: var(--text-small);
  line-height: 1.6;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.algorithm-visualizer__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.algorithm-visualizer__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.algorithm-visualizer__button {
  min-height: 40px;
  padding: 0 var(--space-md);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: var(--surface-card);
  color: var(--text-primary);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: transform var(--ease-out), box-shadow var(--ease-out), border-color var(--ease-out);
}

.algorithm-visualizer__button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(11, 122, 90, 0.22);
  box-shadow: var(--shadow-card);
}

.algorithm-visualizer__button:disabled {
  cursor: default;
  opacity: 0.55;
}

.algorithm-visualizer__button--primary {
  color: #fff;
  border-color: rgba(11, 122, 90, 0.2);
  background: linear-gradient(135deg, var(--accent), #0d8b66);
}

.algorithm-visualizer__progress {
  display: grid;
  gap: var(--space-sm);
  min-width: min(100%, 320px);
  flex: 1 1 280px;
}

.algorithm-visualizer__progress span,
.algorithm-visualizer__rail-head span,
.algorithm-visualizer__step-kicker,
.algorithm-visualizer__empty {
  color: var(--text-secondary);
  font-size: var(--text-caption);
}

.algorithm-visualizer__progress input {
  width: 100%;
  accent-color: var(--accent);
}

.algorithm-visualizer__content {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.9fr);
  gap: var(--space-md);
  align-items: start;
}

.algorithm-visualizer__board,
.algorithm-visualizer__details,
.algo-board__lane,
.algo-board__panel {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-card);
}

.algorithm-visualizer__board { min-height: 100%; }
.algorithm-visualizer__details,
.algo-board__lane,
.algo-board__panel {
  padding: var(--space-md);
  display: grid;
  gap: var(--space-md);
}

.algorithm-visualizer__step h3 {
  margin: var(--space-xs) 0 var(--space-sm);
  font-size: var(--text-title);
}

.algorithm-visualizer__step p {
  margin: 0;
  color: #314441;
}

.algorithm-visualizer__metrics {
  display: grid;
  grid-template-columns: var(--grid-2);
  gap: var(--space-sm);
}

.algorithm-visualizer__metric {
  display: grid;
  gap: var(--space-xs);
  padding: var(--space-md);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: rgba(248, 251, 249, 0.84);
}

.algorithm-visualizer__metric strong { font-size: 18px; }
.algorithm-visualizer__metric--accent  { background: rgba(11, 122, 90, 0.1); }
.algorithm-visualizer__metric--success { background: rgba(82, 170, 94, 0.14); }
.algorithm-visualizer__metric--warning { background: rgba(181, 58, 58, 0.12); }

.algorithm-visualizer__rail {
  display: grid;
  gap: var(--space-sm);
}

.algorithm-visualizer__rail-head strong { font-size: 18px; }

.algorithm-visualizer__timeline {
  display: grid;
  gap: var(--space-sm);
  max-height: 260px;
  margin: 0;
  padding: 0;
  overflow: auto;
  list-style: none;
}

.algorithm-visualizer__timeline-button {
  display: grid;
  gap: var(--space-xs);
  width: 100%;
  padding: var(--space-md);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform var(--ease-out), box-shadow var(--ease-out), border-color var(--ease-out);
}

.algorithm-visualizer__timeline-button:hover,
.algorithm-visualizer__timeline-button.is-active {
  transform: translateY(-1px);
  border-color: rgba(11, 122, 90, 0.24);
  background: rgba(11, 122, 90, 0.09);
}

.algorithm-visualizer__timeline-button strong { font-size: var(--text-small); }

/* Algo board sub-components */
.algo-board { display: grid; gap: var(--space-md); height: 100%; }
.algo-board__grid { display: grid; grid-template-columns: var(--grid-2); gap: var(--space-md); }
.algo-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(82px, 1fr));
  gap: var(--space-sm);
}

.algo-cell {
  display: grid;
  gap: var(--space-sm);
  padding: var(--space-md);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  transition: transform var(--ease-out), border-color var(--ease-out), box-shadow var(--ease-out), background-color var(--ease-out);
}

.algo-cell--current { border-color: rgba(11, 122, 90, 0.26); box-shadow: 0 12px 26px rgba(11, 122, 90, 0.12); transform: translateY(-2px); }
.algo-cell--match   { background: rgba(43, 89, 195, 0.1); border-color: rgba(43, 89, 195, 0.24); }
.algo-cell--found   { background: rgba(82, 170, 94, 0.16); border-color: rgba(82, 170, 94, 0.32); }
.algo-cell--range   { background: rgba(11, 122, 90, 0.08); }
.algo-cell--inactive { opacity: 0.48; }
.algo-cell--mid     { border-color: rgba(202, 123, 24, 0.3); box-shadow: inset 0 0 0 1px rgba(202, 123, 24, 0.18); }
.algo-cell--window  { background: rgba(202, 123, 24, 0.1); }
.algo-cell--best    { box-shadow: inset 0 0 0 1px rgba(82, 170, 94, 0.28); }
.algo-cell--duplicate { background: rgba(181, 58, 58, 0.14); border-color: rgba(181, 58, 58, 0.28); }

.algo-cell__index { color: var(--text-secondary); font-size: var(--text-caption); }
.algo-cell__value { font-size: var(--text-subhead); line-height: 1; }

.algo-cell__markers { display: flex; flex-wrap: wrap; gap: var(--space-xs); }
.algo-cell__marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 var(--space-sm);
  border-radius: 999px;
  background: rgba(29, 45, 43, 0.08);
  color: var(--accent-deep);
  font-size: 11px;
  font-weight: 800;
}

.algo-pair-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(88px, 1fr)); gap: var(--space-sm); }
.algo-pair {
  display: grid;
  gap: var(--space-xs);
  padding: var(--space-sm);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: rgba(249, 251, 250, 0.86);
}
.algo-pair span { color: var(--text-secondary); font-size: var(--text-caption); }
.algo-pair strong { font-size: 18px; }
.algo-pair--new { background: rgba(11, 122, 90, 0.1); }
.algo-pair--match { background: rgba(43, 89, 195, 0.1); }

.algorithm-visualizer__empty {
  margin: 0;
  padding: var(--space-md);
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-card);
}

/* ═══════════════════════════════════════════════
   Responsive
   ═══════════════════════════════════════════════ */

@media (max-width: 980px) {
  .algorithm-visualizer__content,
  .algo-board__grid {
    grid-template-columns: var(--grid-1);
  }
}

@media (max-width: 720px) {
  .prose {
    font-size: var(--text-small);
    line-height: 1.8;
  }

  .prose h2 { font-size: clamp(26px, 9vw, 32px); }
  .prose h3 { font-size: clamp(22px, 7vw, 27px); }
  .prose h4 { font-size: 19px; }

  .prose pre,
  .prose .highlight pre,
  .prose pre.chroma {
    padding: 48px var(--space-md) var(--space-md);
    font-size: 14px;
  }

  .prose .chroma .ln {
    flex: 0 0 2ch;
    width: 2ch;
    min-width: 2ch;
    margin-right: 0.8em;
  }

  .code-copy {
    top: var(--space-sm);
    right: var(--space-sm);
    min-height: 30px;
    padding: 0 var(--space-sm);
  }

  .algorithm-visualizer { padding: var(--space-md); }

  .algorithm-visualizer__head,
  .algorithm-visualizer__toolbar,
  .algorithm-visualizer__rail-head,
  .algo-board__head {
    align-items: flex-start;
    flex-direction: column;
  }

  .algorithm-visualizer__actions { width: 100%; }
  .algorithm-visualizer__button { flex: 1 1 calc(50% - 10px); justify-content: center; }
  .algorithm-visualizer__progress,
  .algorithm-visualizer__sample { max-width: none; min-width: 100%; }
  .algorithm-visualizer__metrics { grid-template-columns: var(--grid-1); }
  .algo-strip, .algo-pair-list { grid-template-columns: repeat(auto-fit, minmax(74px, 1fr)); }
  .algorithm-visualizer__timeline { max-height: none; }
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/css/5-article.css
git commit -m "feat: refactor prose typography with token-driven spacing"
```

---

### Task 7: Refactor `assets/css/6-dark.css` — Dark Mode

**Files:**
- Rewrite: `assets/css/6-dark.css`

- [ ] **Step 1: Replace 6-dark.css**

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1d1c;
    --text-primary: #e8edea;
    --text-secondary: #9aaaa5;
    --text-tertiary: #6b8079;
    --surface-card: rgba(30, 35, 33, 0.92);
    --surface-elevated: rgba(35, 40, 38, 0.96);
    --border-subtle: rgba(232, 237, 234, 0.08);
    --border-strong: rgba(232, 237, 234, 0.12);
    --accent: #2ea882;
    --accent-deep: #50c99e;
    --accent-soft: rgba(46, 168, 130, 0.14);
    --shadow-card: 0 18px 40px rgba(0, 0, 0, 0.22);
    --shadow-elevated: 0 24px 60px rgba(0, 0, 0, 0.32);
    color-scheme: dark;
  }

  .prose {
    color: #e0e0e0;
  }

  .prose > p:first-of-type {
    color: #d0d0d0;
  }

  .prose a {
    color: var(--accent);
    text-decoration-color: rgba(46, 168, 130, 0.4);
  }

  .prose blockquote,
  .callout {
    background: rgba(46, 168, 130, 0.1);
  }

  .prose :not(pre) > code {
    background: rgba(255, 255, 255, 0.1);
  }

  .prose .highlight pre,
  .prose pre.chroma {
    background: linear-gradient(180deg, #1c1c1c, #181818);
  }

  .site-search__input {
    background: rgba(40, 40, 40, 0.8);
    border-color: rgba(255, 255, 255, 0.14);
    color: var(--text-primary);
  }

  .site-search__button {
    background: rgba(46, 168, 130, 0.2);
    color: var(--accent);
  }

  .site-search__dropdown {
    background: rgba(30, 30, 30, 0.96);
    border-color: var(--border-strong);
  }

  .search-result {
    background: rgba(40, 40, 40, 0.72);
    border-color: var(--border-strong);
  }

  .search-chip,
  .search-history__clear {
    background: rgba(40, 40, 40, 0.76);
    border-color: var(--border-strong);
    color: var(--text-primary);
  }

  .filter-pill {
    background: rgba(40, 40, 40, 0.78);
    border-color: var(--border-strong);
    color: var(--text-primary);
  }

  .toc-card {
    background: linear-gradient(180deg, rgba(30, 30, 30, 0.94), rgba(35, 35, 35, 0.9));
  }

  .code-copy {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.1);
    color: rgba(237, 244, 241, 0.9);
  }

  .site-search__toggle {
    background: rgba(40, 40, 40, 0.66);
    border-color: var(--border-strong);
    color: var(--text-secondary);
  }

  .site-search--icon .site-search__panel--floating {
    background: rgba(30, 30, 30, 0.97);
    border-color: var(--border-strong);
  }

  .algorithm-visualizer {
    background: linear-gradient(180deg, rgba(35, 35, 35, 0.96), rgba(40, 40, 40, 0.94));
    border-color: var(--border-strong);
  }

  .algorithm-visualizer__sample,
  .algorithm-visualizer__metric,
  .algo-cell,
  .algo-pair {
    background: rgba(40, 40, 40, 0.84);
    border-color: var(--border-strong);
  }

  .article-head--editorial {
    background: linear-gradient(180deg, var(--surface-elevated), rgba(30, 33, 31, 0.9));
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/css/6-dark.css
git commit -m "feat: update dark mode for new token system"
```

---

### Task 8: Update `assets/css/critical.css` — Critical Path Tokens

**Files:**
- Rewrite: `assets/css/critical.css`

- [ ] **Step 1: Replace critical.css**

```css
:root {
  --content-width: 1520px;
  --content-gutter: clamp(16px, 2.4vw, 36px);
  --hero-max-width: 1600px;
  --article-shell-width: 1100px;
  --bg: #f4efe7;
  --text-primary: #1d2d2b;
  --text-secondary: #556563;
  --accent: #0b7a5a;
  --surface-card: rgba(255, 252, 246, 0.92);
  --surface-elevated: rgba(255, 250, 241, 0.98);
  --border-subtle: rgba(29, 45, 43, 0.08);
  --border-strong: rgba(29, 45, 43, 0.14);
  --font-sans: "IBM Plex Sans", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-serif: "Noto Serif SC", "Source Han Serif SC", "STSong", serif;
  --radius-md: 16px;
  --radius-lg: 24px;
  --space-md: 16px;
  --space-lg: 24px;
  --text-body: 1.1rem;
  --text-small: 0.875rem;
  --text-display: clamp(56px, 7vw, 96px);
  --leading-body: 1.8;
  --leading-display: 0.94;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  color: var(--text-primary);
  font-family: var(--font-sans);
  line-height: var(--leading-body);
  background: var(--bg);
}

.page-frame {
  min-height: 100vh;
}

.skip-link {
  position: fixed;
  top: 14px;
  left: 14px;
  z-index: 60;
  transform: translateY(-180%);
}

.skip-link:focus {
  transform: translateY(0);
}

.site-header,
.site-main,
.site-footer {
  width: min(calc(100% - (var(--content-gutter) * 2)), var(--content-width));
  margin-inline: auto;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  padding-top: var(--space-md);
}

.site-header__inner {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--space-lg);
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border-subtle);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-width: 0;
}

.landing-hero {
  position: relative;
  left: 50%;
  width: min(calc(100vw - (var(--content-gutter) * 2)), var(--hero-max-width));
  margin: 0;
  padding: clamp(28px, 4vw, 44px);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  background: var(--surface-elevated);
  transform: translateX(-50%);
  overflow: hidden;
}

.landing-hero__inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-lg);
  align-items: stretch;
}

@media (max-width: 980px) {
  .site-header {
    position: static;
    padding-top: var(--space-md);
  }
  .site-header__inner {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-md);
    padding: var(--space-md);
  }
  .landing-hero__inner {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/css/critical.css
git commit -m "feat: update critical CSS for new token system"
```

---

### Task 9: Update Templates — Remove Hardcoded Styles, Align Classes

**Files:**
- Modify: `layouts/partials/article-card.html`
- Modify: `layouts/index.html`
- Modify: `layouts/partials/header.html`
- Modify: `layouts/partials/section-hero.html`

- [ ] **Step 1: Update article-card.html — use new .card classes**

```bash
# Read the file first (already done), then apply edits
```

In `layouts/partials/article-card.html`, replace:
- `class="article-card"` → `class="article-card"` (keep as wrapper for specificity)
- `class="article-card__link"` → add class `card` (becomes `class="article-card__link card"`)
- `class="article-card__meta"` → add class `card__meta`
- `<h3>` → `<h3 class="card__title">`
- `<p>` after h3 → `<p class="card__desc">`

Write the updated file:

```html
{{ $isAlgorithm := eq .Params.isAlgorithm true }}
{{ $hasVisualization := and $isAlgorithm .Params.visualization }}
{{ $difficulty := .Params.difficulty | default "" }}
{{ $difficultyLabel := "" }}
{{ if $difficulty }}
  {{ $difficultyLabel = partial "difficulty-label.html" (dict "value" $difficulty "fallback" $difficulty) }}
{{ end }}
{{ $source := .Params.source | default "" }}
{{ $problemId := .Params.problemId | default "" }}
{{ $problemLabel := "" }}
{{ if or $source $problemId }}
  {{ if and $source $problemId }}
    {{ $problemLabel = printf "%s %s" $source $problemId }}
  {{ else }}
    {{ $problemLabel = or $source $problemId }}
  {{ end }}
{{ end }}
<article class="article-card">
  <a class="article-card__link card" href="{{ .RelPermalink }}">
    <div class="article-card__meta card__meta">
      <span>{{ .Date.Format site.Params.dateFormat }}</span>
      <span>{{ .ReadingTime }} 分钟</span>
    </div>
    {{ if or $isAlgorithm $problemLabel $difficulty $hasVisualization }}
      <div class="article-card__badges">
        {{ if $isAlgorithm }}
          <span class="badge badge--algo">算法题解</span>
        {{ end }}
        {{ if $hasVisualization }}
          <span class="badge badge--viz">可视化</span>
        {{ end }}
        {{ if $problemLabel }}
          <span class="badge badge--source">{{ $problemLabel }}</span>
        {{ end }}
        {{ if $difficulty }}
          <span class="badge badge--difficulty badge--difficulty-{{ lower $difficulty }}">{{ $difficultyLabel }}</span>
        {{ end }}
      </div>
    {{ end }}
    <h3 class="card__title">{{ .Title }}</h3>
    <p class="card__desc">{{ .Summary | default (.Plain | truncate 110) }}</p>
    {{ with .Params.tags }}
      <div class="tag-row">
        {{ range first 3 . }}
          <span class="tag-pill tag-pill--muted">#{{ . }}</span>
        {{ end }}
      </div>
    {{ end }}
  </a>
</article>
```

- [ ] **Step 2: Update index.html — use .btn classes**

In `layouts/index.html`, replace:
- `class="button button--primary"` → `class="btn btn--primary"`
- `class="button button--secondary"` → `class="btn btn--secondary"`
- `class="topic-card"` → add class `card` (becomes `class="topic-card card"`)

```bash
# Use Edit tool for precise replacements
```

Three replacements in `layouts/index.html`:

1. `class="button button--primary"` → `class="btn btn--primary"`
2. `class="button button--secondary"` → `class="btn btn--secondary"`
3. Each `<a class="topic-card"` → `<a class="topic-card card"`

- [ ] **Step 3: Update section-topics.html — use .card class**

In `layouts/partials/section-topics.html`, replace:
`<a class="topic-card"` → `<a class="topic-card card"`

- [ ] **Step 4: Update roadmap list.html — use .card class**

In `layouts/roadmap/list.html`, replace each:
`<a class="roadmap-item"` → `<a class="roadmap-item card"`

- [ ] **Step 5: Update entry cards in list templates**

Find and update all `class="entry-card"` → `class="entry-card card"` across `_default/list.html` and study-track specific layouts.

Search with grep:
```bash
grep -rn "entry-card" layouts/
```

For each occurrence where `entry-card` is used as a standalone card (not combined with other modifiers), add `card` to the class list.

- [ ] **Step 6: Commit**

```bash
git add layouts/
git commit -m "feat: align templates with new card and button class system"
```

---

### Task 10: Build and Verify

**Files:**
- None (verification only)

- [ ] **Step 1: Build the site**

Run: `cd D:/Codex/go-learning-blog && hugo --gc --minify --cleanDestinationDir`

Expected: Build succeeds with no errors.

- [ ] **Step 2: Run preflight checks**

Run: `powershell -File scripts/check-site.ps1`

Check: All validations pass including front matter, build, and config checks.

- [ ] **Step 3: Start dev server and verify visually**

Run: `hugo serve --renderToMemory --port 1313`

Open `http://localhost:1313` and verify:
- Homepage hero renders correctly with new type scale
- Card grids show unified card styling
- Article page has clean article head + prose typography
- Dark mode is legible (inspect via browser dev tools)
- Mobile responsive breakpoints work (header, hero, cards, article layout)
- Search dropdown and search page render correctly

- [ ] **Step 4: Commit final verification**

```bash
git add -A
git commit -m "chore: final verification after magazine redesign"
```
