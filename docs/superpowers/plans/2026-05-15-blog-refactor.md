# Blog Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor blog CSS (ITCSS split), merge 6 section list templates into one config-driven template, and upgrade visual design to magazine/editorial direction.

**Architecture:** Hugo Pipes (`resources.Concat` + `minify` + `fingerprint`) assembles 8 ITCSS-layer CSS files. A single `_default/list.html` drives 3 section modes (standard, filter, study-track) via `[listConfig]` front matter in `_index.md`. Visual tokens are refreshed for larger typography, more whitespace, and a warm editorial palette.

**Tech Stack:** Hugo Extended 0.159.2, Vanilla CSS (custom properties), Hugo Pipes, no external Node toolchain.

---

## File Structure

```
assets/css/
├── 0-tokens.css        # NEW — :root custom properties
├── 1-reset.css         # NEW — global reset
├── 2-layout.css        # NEW — page frame, containers, grid systems
├── 3-components.css    # NEW — buttons, cards, header, footer, search, TOC, etc.
├── 4-pages.css         # NEW — hero, card-grid, filter-panel, topic-grid, empty-state
├── 5-article.css       # NEW — article shell, prose, code blocks, visualizer, related
├── 6-dark.css          # NEW — @media (prefers-color-scheme: dark) overrides
├── 7-utilities.css     # NEW — .visually-hidden, reduced-motion, etc.
├── critical.css        # NEW — minimal above-fold rules for inline in <head>
└── main.css            # DELETED after migration

layouts/
├── _default/
│   └── list.html       # REWRITE — config-driven, all 3 modes
├── partials/
│   ├── head.html       # MODIFY — CSS assembly via Hugo Pipes
│   ├── critical-css.html # MODIFY — loads from critical.css resource
│   ├── section-hero.html      # NEW
│   ├── section-topics.html    # NEW
│   ├── section-filter.html    # NEW
│   └── section-roadmap.html   # NEW
├── algorithms/list.html    # DELETE
├── go-engineering/list.html # DELETE
├── go-modules/list.html    # DELETE
├── grpc/list.html          # DELETE
├── rabbitmq/list.html      # DELETE
└── index.html              # MODIFY — new homepage layout

content/
├── algorithms/_index.md    # MODIFY — add listConfig
├── go-engineering/_index.md # MODIFY — add listConfig
├── go-modules/_index.md    # MODIFY — add listConfig
├── grpc/_index.md          # MODIFY — add listConfig
├── rabbitmq/_index.md      # MODIFY — add listConfig
└── posts/_index.md         # MODIFY — add listConfig
```

---

## Phase 1: CSS Modularization

### Task 1: Create 0-tokens.css

**Files:**
- Create: `assets/css/0-tokens.css`
- Reference: `assets/css/main.css:1-24`

Extract all `:root` custom properties from main.css into their own file.

- [ ] **Step 1: Create `assets/css/0-tokens.css`**

Write the file with all token definitions from main.css lines 1-24, adding any new tokens needed for the visual refresh (larger type scale, editorial spacing):

```css
:root {
  /* Palette */
  --bg: #f4efe7;
  --bg-soft: #efe7db;
  --surface: rgba(255, 252, 246, 0.9);
  --surface-strong: #fffaf1;
  --surface-muted: #ecf2ef;
  --text: #1d2d2b;
  --muted: #556563;
  --line: rgba(29, 45, 43, 0.12);
  --accent: #0b7a5a;
  --accent-deep: #08543f;
  --accent-soft: rgba(11, 122, 90, 0.1);

  /* Shadows */
  --shadow: 0 24px 80px rgba(38, 55, 50, 0.12);

  /* Radii */
  --radius-xl: 28px;
  --radius-lg: 22px;
  --radius-md: 16px;

  /* Layout widths */
  --content-width: 1520px;
  --content-gutter: clamp(16px, 2.4vw, 36px);
  --hero-max-width: 1600px;
  --article-shell-width: 1100px;
  --article-body-width: 720px;

  /* Spacing */
  --section-gap: clamp(48px, 6vw, 80px);

  /* Typography */
  --font-sans: "IBM Plex Sans", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-serif: "Noto Serif SC", "Source Han Serif SC", "STSong", serif;
  --font-mono: "IBM Plex Mono", "Cascadia Code", Consolas, monospace;

  /* Type scale — magazine direction */
  --text-body: 1.1rem;
  --text-small: 0.875rem;
  --text-caption: 0.75rem;
  --leading-body: 1.8;
  --leading-heading: 1.2;

  /* Transitions */
  --ease-out: 300ms ease-out;
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/css/0-tokens.css
git commit -m "feat: add 0-tokens.css — extract design tokens from main.css"
```

---

### Task 2: Create 1-reset.css through 7-utilities.css

**Files:**
- Create: `assets/css/1-reset.css`
- Create: `assets/css/2-layout.css`
- Create: `assets/css/3-components.css`
- Create: `assets/css/4-pages.css`
- Create: `assets/css/5-article.css`
- Create: `assets/css/6-dark.css`
- Create: `assets/css/7-utilities.css`
- Read: `assets/css/main.css` (entire file for extraction)

This is a large extraction task. Each CSS file is constructed by extracting the relevant rules from `assets/css/main.css` based on these ranges:

| File | Source lines | Content |
|------|-------------|---------|
| `1-reset.css` | 26-73 | `*,*::before,*::after`, `html`, `body`, `a`, `img`, focus-visible, `code/pre`, `.page-frame`, `.skip-link` |
| `2-layout.css` | 75-500 (approx) | `.site-header`, `.site-main`, `.site-footer`, `.brand`, `.nav`, responsive header layouts, `.home-flow`, `.split-grid`, `.article-shell`, `.article-body` wrapper, `.article-rail` |
| `3-components.css` | 500-1514 (approx) | `.button`, `.article-card`, `.entry-card`, `.topic-card`, `.filter-pill`, `.pager`, `.breadcrumb`, `.site-search`, `.search-box`, `.search-result`, `.section-head`, `.eyebrow`, `.difficulty-label`, `.callout`, `.snippet-item`, `.comments`, `.text-link`, header inner, footer |
| `4-pages.css` | 3004-3705 (homepage) + scattered page patterns | `.landing-hero` and all its children, `.page-hero`, `.card-grid`, `.empty-state`, `.filter-panel`, `.filter-row`, `.topic-grid`, `.entry-list`, `.snippet-list`, `.roadmap-group`, `.roadmap-list`, `.roadmap-item`, `.surface` variants |
| `5-article.css` | 1515-1781 (TOC/code) + 2076-2273 (algorithm UI) + 2274-2664 (related/roadmap) | `.toc-card`, `.highlight`, `.prose`, code blocks, `.article-body`, `.algorithm-visualizer`, `.related-grid`, `.related-card`, `.prev-next` |
| `6-dark.css` | 2665-3003 | Everything inside `@media (prefers-color-scheme: dark)` |
| `7-utilities.css` | scattered throughout | `.visually-hidden`, `.no-js`, `@media (prefers-reduced-motion)`, print styles |

**Important:** Use `grep` to locate exact line ranges for each category. Some rules may straddle comment boundaries. Always copy the exact rule blocks — never edit the CSS in this task (editing comes in Phase 3).

- [ ] **Step 1: Identify exact line ranges for each file**

Read through `assets/css/main.css` and note the exact line numbers for each extraction target. Use the comment markers as boundary guides:

```bash
grep -n "^/\*" assets/css/main.css
```

- [ ] **Step 2: Create 1-reset.css**

Extract lines 26-73 from main.css (global reset rules up to `.skip-link` end):

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
  color: var(--text);
  font-family: var(--font-sans);
  line-height: var(--leading-body);
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), transparent 34%),
    radial-gradient(circle at bottom right, rgba(11, 122, 90, 0.14), transparent 24%),
    linear-gradient(135deg, var(--bg), #e7efe8);
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
  transform: translateY(-180%);
  /* ... keep all skip-link rules from main.css ... */
}
```

- [ ] **Step 3: Create 2-layout.css**

Extract all layout container, header structure, article shell, and grid system rules. This includes `.site-header`, `.site-main`, `.site-footer`, `.brand`, `.nav`, `.home-flow`, `.split-grid`, `.article-shell`, `.article-rail`, responsive breakpoints for header.

- [ ] **Step 4: Create 3-components.css**

Extract all component rules: buttons, cards, filter pills, pager, breadcrumb, search components, section heads, labels, callout, snippet items, comments, text links, footer, header innards.

- [ ] **Step 5: Create 4-pages.css**

Extract page-level patterns: `.landing-hero` (all children), `.page-hero`, `.card-grid`, `.empty-state`, `.filter-panel`, `.filter-row`, `.topic-grid`, `.entry-list`, `.snippet-list`, `.roadmap-group`, `.roadmap-list`, `.roadmap-item`, surface variants.

- [ ] **Step 6: Create 5-article.css**

Extract article-specific rules: TOC, code highlighting, prose typography, algorithm visualizer, related posts, prev/next nav.

- [ ] **Step 7: Create 6-dark.css**

Extract the entire dark mode `@media` block. Add warm-dark palette adjustments per spec:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1d1c;
    --bg-soft: #222725;
    --surface: rgba(30, 35, 33, 0.92);
    --surface-strong: #252a28;
    --surface-muted: #202523;
    --text: #e8edea;
    --muted: #9aaa a5;
    --line: rgba(232, 237, 234, 0.1);
    --accent: #2ea882;
    --accent-deep: #50c99e;
    --accent-soft: rgba(46, 168, 130, 0.14);
    --shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
  }

  body {
    background:
      radial-gradient(circle at top left, rgba(24, 28, 26, 0.94), transparent 34%),
      radial-gradient(circle at bottom right, rgba(46, 168, 130, 0.08), transparent 24%),
      linear-gradient(135deg, var(--bg), #1c221f);
  }
  /* ... rest of dark mode overrides from main.css ... */
}
```

- [ ] **Step 8: Create 7-utilities.css**

```css
.visually-hidden {
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

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 9: Commit**

```bash
git add assets/css/1-reset.css assets/css/2-layout.css assets/css/3-components.css assets/css/4-pages.css assets/css/5-article.css assets/css/6-dark.css assets/css/7-utilities.css
git commit -m "feat: add ITCSS split files 1-reset through 7-utilities"
```

---

### Task 3: Create critical.css

**Files:**
- Create: `assets/css/critical.css`

Critical CSS contains only the minimal above-fold rules needed for first paint. This replaces the manually maintained `critical-css.html` partial.

- [ ] **Step 1: Create `assets/css/critical.css`**

```css
:root {
  --content-width: 1520px;
  --content-gutter: clamp(16px, 2.4vw, 36px);
  --hero-max-width: 1600px;
  --article-shell-width: 1100px;
  --bg: #f4efe7;
  --text: #1d2d2b;
  --accent: #0b7a5a;
  --font-sans: "IBM Plex Sans", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-serif: "Noto Serif SC", "Source Han Serif SC", "STSong", serif;
  --radius-xl: 28px;
  --radius-lg: 22px;
  --radius-md: 16px;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  color: var(--text);
  font-family: var(--font-sans);
  line-height: 1.8;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), transparent 34%),
    radial-gradient(circle at bottom right, rgba(11, 122, 90, 0.14), transparent 24%),
    linear-gradient(135deg, var(--bg), #e7efe8);
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
  padding-top: 18px;
}

.site-header__inner {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 24px;
  align-items: center;
  padding: 16px 20px;
  border-radius: 999px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.landing-hero {
  position: relative;
  left: 50%;
  width: min(calc(100vw - (var(--content-gutter) * 2)), var(--hero-max-width));
  margin: 0;
  padding: clamp(28px, 4vw, 44px);
  border: 1px solid rgba(255, 255, 255, 0.56);
  border-radius: 42px;
  background:
    radial-gradient(circle at top right, rgba(11, 122, 90, 0.22), transparent 24%),
    radial-gradient(circle at bottom left, rgba(255, 255, 255, 0.82), transparent 34%),
    linear-gradient(145deg, rgba(255, 250, 241, 0.98), rgba(232, 241, 236, 0.92));
  box-shadow: 0 30px 90px rgba(22, 35, 31, 0.12);
  transform: translateX(-50%);
  overflow: hidden;
}

.landing-hero__inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
  gap: 28px;
  align-items: stretch;
}

@media (max-width: 980px) {
  .site-header {
    position: static;
    padding-top: 14px;
  }
  .site-header__inner {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 14px;
    padding: 14px;
    border-radius: 28px;
  }
  .landing-hero__inner {
    grid-template-columns: 1fr;
  }
}
```

This is the minimal set of rules needed to render the header, hero skeleton, and body background on first paint. The full CSS loads async.

- [ ] **Step 2: Commit**

```bash
git add assets/css/critical.css
git commit -m "feat: add critical.css — minimal above-fold rules for inline"
```

---

### Task 4: Update head.html CSS loading

**Files:**
- Modify: `layouts/partials/head.html`
- Modify: `layouts/partials/critical-css.html`
- Delete: `assets/css/main.css` (after verifying build)

Switch from single-file CSS to Hugo Pipes assembly. Replace manual critical CSS partial with resource-based inline.

- [ ] **Step 1: Rewrite CSS loading in `layouts/partials/head.html`**

Replace line 14 (`{{ $css := resources.Get "css/main.css" | minify | fingerprint }}`) and line 15 (`{{ $criticalCSS := partial "critical-css.html" . }}`) and lines 23-24 (the `<style>` and `<link>` tags):

Line 14 becomes:
```go
{{ $tokens := resources.Get "css/0-tokens.css" }}
{{ $reset := resources.Get "css/1-reset.css" }}
{{ $layout := resources.Get "css/2-layout.css" }}
{{ $components := resources.Get "css/3-components.css" }}
{{ $pages := resources.Get "css/4-pages.css" }}
{{ $article := resources.Get "css/5-article.css" }}
{{ $dark := resources.Get "css/6-dark.css" }}
{{ $utilities := resources.Get "css/7-utilities.css" }}
{{ $css := slice $tokens $reset $layout $components $pages $article $dark $utilities | resources.Concat "css/main.css" | minify | fingerprint }}
{{ $critical := resources.Get "css/critical.css" | minify }}
```

Lines 23-24 become:
```html
<style>{{ $critical.Content | safeCSS }}</style>
<link rel="preload" href="{{ $css.RelPermalink }}" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="{{ $css.RelPermalink }}"></noscript>
```

- [ ] **Step 2: Simplify `layouts/partials/critical-css.html`**

Replace all 228 lines with a single fallback line (critical CSS is now loaded from resource in head.html, but keep the partial for backward reference during transition):

```html
{{ $critical := resources.Get "css/critical.css" | minify }}
{{ $critical.Content | safeCSS }}
```

- [ ] **Step 3: Verify build**

Run Hugo dev server and check that styles load correctly:

```powershell
./scripts/start.ps1 -PublishedOnly
```

Open `http://localhost:1313` and verify:
- Page loads without FOUC (flash of unstyled content)
- Header, hero, and cards render correctly
- Dev tools show no 404s for CSS

- [ ] **Step 4: Remove main.css**

```bash
git rm assets/css/main.css
```

- [ ] **Step 5: Commit**

```bash
git add layouts/partials/head.html layouts/partials/critical-css.html
git commit -m "feat: switch to Hugo Pipes CSS assembly, auto-critical from resource"
```

---

## Phase 2: Template Consolidation

### Task 5: Create section-hero.html partial

**Files:**
- Create: `layouts/partials/section-hero.html`

Reads `_index.md` front matter to render the hero banner for section list pages.

- [ ] **Step 1: Create `layouts/partials/section-hero.html`**

```html
{{ $eyebrow := .Params.listConfig.eyebrow | default (partial "page-label.html" (dict "kind" "section" "value" .Section "fallback" "")) }}
<section class="page-hero">
  {{ with $eyebrow }}
    <p class="eyebrow">{{ . }}</p>
  {{ end }}
  <h1>{{ .Title }}</h1>
  {{ with .Description }}
    <p class="page-hero__lead">{{ . }}</p>
  {{ else }}
    {{ with .Content }}
      <div class="page-hero__lead">{{ . }}</div>
    {{ end }}
  {{ end }}
</section>
```

- [ ] **Step 2: Commit**

```bash
git add layouts/partials/section-hero.html
git commit -m "feat: add section-hero partial — reads listConfig from _index.md"
```

---

### Task 6: Create section-topics.html partial

**Files:**
- Create: `layouts/partials/section-topics.html`

Renders topic navigation grid from `listConfig.topics` array in `_index.md` front matter.

- [ ] **Step 1: Create `layouts/partials/section-topics.html`**

```html
{{ $topics := .Params.listConfig.topics }}
{{ if $topics }}
<section class="surface surface--catalog">
  <div class="section-head">
    <div>
      <p class="eyebrow">专题索引</p>
      <h2>按知识点复习</h2>
    </div>
  </div>

  <div class="topic-grid topic-grid--wide">
    {{ range $topics }}
      {{ $count := 0 }}
      {{ if isset . "tag" }}
        {{ $filtered := where site.RegularPages.ByDate.Reverse "Params.tags" "intersect" (slice .tag) }}
        {{ if isset . "sectionFilter" }}
          {{ $filtered = where $filtered "Section" .sectionFilter }}
        {{ end }}
        {{ $count = len $filtered }}
      {{ else if isset . "difficulty" }}
        {{ $filtered := where site.RegularPages.ByDate.Reverse "Params.difficulty" .difficulty }}
        {{ $count = len $filtered }}
      {{ else if isset . "series" }}
        {{ $filtered := where site.RegularPages.ByDate.Reverse "Params.series" "intersect" (slice .series) }}
        {{ $count = len $filtered }}
      {{ end }}
      <a class="topic-card" href="{{ .href | relURL }}">
        <strong>{{ .title }}</strong>
        <p>{{ .description }}</p>
        <span>{{ $count }} 篇文章</span>
      </a>
    {{ end }}
  </div>
</section>
{{ end }}
```

- [ ] **Step 2: Commit**

```bash
git add layouts/partials/section-topics.html
git commit -m "feat: add section-topics partial — config-driven topic grid"
```

---

### Task 7: Create section-filter.html and section-roadmap.html partials

**Files:**
- Create: `layouts/partials/section-filter.html`
- Create: `layouts/partials/section-roadmap.html`

- [ ] **Step 1: Create `layouts/partials/section-filter.html`**

The filter panel is only used by the `posts` section. It reads `listConfig.filter` preset to decide which filter pills to show:

```html
{{ $filter := .Params.listConfig.filter }}
{{ if $filter }}
  {{ if eq $filter.preset "posts" }}
  <section class="surface filter-panel">
    <div class="section-head">
      <div>
        <p class="eyebrow">快速筛选</p>
        <h2>算法难度与标签筛选</h2>
      </div>
    </div>
    <div class="filter-row">
      <a class="filter-pill filter-pill--active" href="{{ "posts/" | relURL }}">全部文章</a>
      <a class="filter-pill" href="{{ "tags/algorithm/" | relURL }}">算法题解</a>
      <a class="filter-pill" href="{{ "difficulties/easy/" | relURL }}">入门</a>
      <a class="filter-pill" href="{{ "difficulties/medium/" | relURL }}">中等</a>
      <a class="filter-pill" href="{{ "tags/array/" | relURL }}">#数组</a>
      <a class="filter-pill" href="{{ "tags/hash-table/" | relURL }}">#哈希表</a>
      <a class="filter-pill" href="{{ "tags/binary-search/" | relURL }}">#二分</a>
      <a class="filter-pill" href="{{ "tags/dynamic-programming/" | relURL }}">#动态规划</a>
      <a class="filter-pill" href="{{ "tags/monotonic-stack/" | relURL }}">#单调栈</a>
    </div>
  </section>
  {{ end }}
{{ end }}
```

- [ ] **Step 2: Create `layouts/partials/section-roadmap.html`**

Used by study track sections (gRPC, RabbitMQ) to show the 4-week overview:

```html
{{ $roadmap := .Params.listConfig.roadmap }}
{{ if $roadmap }}
<section class="surface roadmap-group">
  <div class="section-head">
    <div>
      <p class="eyebrow">学习节奏</p>
      <h2>4 周完成 30 天</h2>
    </div>
  </div>
  <div class="roadmap-list">
    {{ range $roadmap }}
    <div class="roadmap-item roadmap-item--static">
      <strong>{{ .title }}</strong>
      <p>{{ .description }}</p>
    </div>
    {{ end }}
  </div>
</section>
{{ end }}
```

- [ ] **Step 3: Commit**

```bash
git add layouts/partials/section-filter.html layouts/partials/section-roadmap.html
git commit -m "feat: add section-filter and section-roadmap partials"
```

---

### Task 8: Rewrite _default/list.html as config-driven

**Files:**
- Modify: `layouts/_default/list.html`

Replace the current posts-only filter logic with a config-driven template that handles all 3 modes.

- [ ] **Step 1: Rewrite `layouts/_default/list.html`**

```html
{{ define "main" }}

{{ partial "breadcrumb.html" . }}
{{ partial "section-hero.html" . }}

{{ with .Content }}
  {{ if not .Description }}
  <section class="surface">
    <div class="prose">{{ . }}</div>
  </section>
  {{ end }}
{{ end }}

{{ $listConfig := .Params.listConfig }}

{{ if $listConfig.filter }}
  {{ partial "section-filter.html" . }}
{{ end }}

{{ if $listConfig.topics }}
  {{ partial "section-topics.html" . }}
{{ end }}

{{ if eq ($listConfig.groupBy | default "") "week" }}
  {{ partial "section-roadmap.html" . }}

  {{ $pages := .Pages.ByWeight }}
  {{ $totalWeeks := $listConfig.totalWeeks | default 4 }}
  {{ range seq 1 $totalWeeks }}
    {{ $week := . }}
    {{ $weekPages := where $pages "Params.week" $week }}
    {{ if gt (len $weekPages) 0 }}
      <section class="surface surface--catalog">
        <div class="section-head">
          <div>
            <p class="eyebrow">Week {{ $week }}</p>
            <h2>第 {{ $week }} 周</h2>
          </div>
        </div>
        <div class="card-grid card-grid--wide">
          {{ range $weekPages }}
            {{ partial "article-card.html" . }}
          {{ end }}
        </div>
      </section>
    {{ end }}
  {{ end }}

{{ else }}
  {{ $pages := .Pages.ByDate.Reverse }}
  {{ if gt (len $pages) 0 }}
    {{ $paginator := .Paginate $pages }}
    <section class="surface surface--catalog">
      <div class="card-grid card-grid--wide">
        {{ range $paginator.Pages }}
          {{ partial "article-card.html" . }}
        {{ end }}
      </div>
    </section>
    {{ partial "pager.html" $paginator }}
  {{ else }}
    <section class="surface empty-state">
      <h2>这里暂时还没有内容</h2>
      <p>你可以先用 Hugo 新建一篇文章，然后继续写你的 Go 学习记录。</p>
    </section>
  {{ end }}
{{ end }}

{{ end }}
```

- [ ] **Step 2: Verify all section pages still render**

Start dev server and check each section:

```powershell
./scripts/start.ps1 -PublishedOnly
```

Visit and verify:
- `/posts/` — hero + filter panel + card grid + pagination
- `/algorithms/` — hero + topic grid + latest 6 cards + "查看全部" link
- `/go-engineering/` — hero + topic grid + latest cards
- `/go-modules/` — hero + topic grid + latest cards
- `/grpc/` — hero + content + roadmap + week-by-week cards
- `/rabbitmq/` — hero + content + roadmap + week-by-week cards

- [ ] **Step 3: Commit**

```bash
git add layouts/_default/list.html
git commit -m "feat: rewrite list.html as config-driven, supporting 3 section modes"
```

---

### Task 9: Update section _index.md files with listConfig

**Files:**
- Modify: `content/posts/_index.md`
- Modify: `content/algorithms/_index.md`
- Modify: `content/go-engineering/_index.md`
- Modify: `content/go-modules/_index.md`
- Modify: `content/grpc/_index.md`
- Modify: `content/rabbitmq/_index.md`

Add `[listConfig]` front matter to each section so the new generic list template can render them correctly.

- [ ] **Step 1: Update `content/posts/_index.md`**

Add to front matter:
```toml
[listConfig.filter]
preset = "posts"
[listConfig]
eyebrow = "学习记录"
```

- [ ] **Step 2: Update `content/algorithms/_index.md`**

Add to front matter:
```toml
[listConfig]
eyebrow = "算法专题"

[[listConfig.topics]]
title = "数组与哈希"
description = "查找、计数、映射与下标关系"
href = "tags/array/"
tag = "array"
sectionFilter = "posts"

[[listConfig.topics]]
title = "二分查找"
description = "边界定义、循环不变量和查找区间"
href = "tags/binary-search/"
tag = "binary-search"
sectionFilter = "posts"

[[listConfig.topics]]
title = "单调栈"
description = "下一个更大元素、温度、区间贡献"
href = "tags/monotonic-stack/"
tag = "monotonic-stack"
sectionFilter = "posts"

[[listConfig.topics]]
title = "动态规划"
description = "状态定义、转移方程到滚动优化"
href = "tags/dynamic-programming/"
tag = "dynamic-programming"
sectionFilter = "posts"

[[listConfig.topics]]
title = "难度：入门"
description = "快速建立题感和基本模板"
href = "difficulties/easy/"
difficulty = "easy"

[[listConfig.topics]]
title = "难度：中等"
description = "训练边界处理、状态设计和综合能力"
href = "difficulties/medium/"
difficulty = "medium"
```

- [ ] **Step 3: Update `content/go-engineering/_index.md`**

Add to front matter:
```toml
[listConfig]
eyebrow = "Go 工程"

[[listConfig.topics]]
title = "Go 并发与控制流"
description = "goroutine、channel、context 等并发主题"
href = "series/go-并发与控制流/"
series = "Go 并发与控制流"

[[listConfig.topics]]
title = "Go 工程化实践"
description = "错误处理、模块管理、依赖组织和项目结构"
href = "series/go-工程化实践/"
series = "Go 工程化实践"

[[listConfig.topics]]
title = "Go 模块与依赖管理"
description = "go.mod、go.sum、replace、go work"
href = "go-modules/"
series = "Go 模块与依赖管理"
```

- [ ] **Step 4: Update `content/go-modules/_index.md`**

Add to front matter:
```toml
[listConfig]
eyebrow = "模块专题"
```

- [ ] **Step 5: Update `content/grpc/_index.md`**

Add to front matter:
```toml
[listConfig]
eyebrow = "gRPC 学习"
groupBy = "week"
totalWeeks = 5

[[listConfig.roadmap]]
title = "第 1 周"
description = "先把环境、proto、codegen、最小 server/client 链路搭通。"

[[listConfig.roadmap]]
title = "第 2 周"
description = "重点练习 proto 设计、字段演进和两个基础业务服务。"

[[listConfig.roadmap]]
title = "第 3 周"
description = "把四种 RPC 模式、context、deadline 和错误处理串起来。"

[[listConfig.roadmap]]
title = "第 4 周"
description = "补齐 metadata、interceptor、TLS、reflection、health、graceful shutdown 与性能认知。"
```

- [ ] **Step 6: Update `content/rabbitmq/_index.md`**

Add to front matter:
```toml
[listConfig]
eyebrow = "RabbitMQ 学习"
groupBy = "week"
totalWeeks = 4

[[listConfig.roadmap]]
title = "第 1 周"
description = "先把模型概念和 6 个官方基础教程全部跑通。"

[[listConfig.roadmap]]
title = "第 2 周"
description = "重点补齐可靠性、ack、prefetch、publisher confirm 与重连边界。"

[[listConfig.roadmap]]
title = "第 3 周"
description = "集中解决 TTL、DLX、重试链路、毒消息和业务幂等。"

[[listConfig.roadmap]]
title = "第 4 周"
description = "学习队列类型、Streams、policy、监控、集群与最终项目集成。"
```

- [ ] **Step 7: Commit**

```bash
git add content/posts/_index.md content/algorithms/_index.md content/go-engineering/_index.md content/go-modules/_index.md content/grpc/_index.md content/rabbitmq/_index.md
git commit -m "feat: add listConfig front matter to all section _index.md files"
```

---

### Task 10: Delete old section list templates

**Files:**
- Delete: `layouts/algorithms/list.html`
- Delete: `layouts/go-engineering/list.html`
- Delete: `layouts/go-modules/list.html`
- Delete: `layouts/grpc/list.html`
- Delete: `layouts/rabbitmq/list.html`

- [ ] **Step 1: Verify all sections still render correctly after the _default/list.html rewrite**

Run the dev server and check every section URL once more.

- [ ] **Step 2: Delete the files**

```bash
git rm layouts/algorithms/list.html
git rm layouts/go-engineering/list.html
git rm layouts/go-modules/list.html
git rm layouts/grpc/list.html
git rm layouts/rabbitmq/list.html
```

- [ ] **Step 3: Verify build still succeeds**

```powershell
hugo --gc --minify --cleanDestinationDir
```

Expected: exit code 0, no template errors.

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor: delete 5 section list templates, consolidated into _default/list.html"
```

---

## Phase 3: Visual Design Refresh

### Task 11: Refresh homepage layout (index.html)

**Files:**
- Modify: `layouts/index.html`

Restructure homepage to: Hero (left copy + right feature card) → 3×2 topic grid → card grid (latest articles).

- [ ] **Step 1: Rewrite `layouts/index.html`**

```html
{{ define "main" }}
{{ $posts := where site.RegularPages.ByDate.Reverse "Section" "posts" }}
{{ $snippets := where site.RegularPages.ByDate.Reverse "Section" "snippets" }}
{{ $algoPosts := where $posts "Params.isAlgorithm" true }}
{{ $goPosts := where $posts "Params.isAlgorithm" "ne" true }}
{{ $latestArticles := where site.RegularPages.ByDate.Reverse "Section" "in" site.Params.articleSections }}
{{ $featuredPost := index $posts 0 }}

<section class="landing-hero">
  <div class="landing-hero__inner">
    <div class="landing-hero__copy">
      <p class="landing-hero__eyebrow">Go + 算法学习</p>
      <h1>{{ site.Title }}</h1>
      <p class="landing-hero__lead">{{ site.Params.siteIntro }}</p>
      <p class="landing-hero__body">{{ site.Params.sitePitch }}</p>
      <div class="landing-hero__actions">
        <a class="button button--primary" href="{{ "posts/" | relURL }}">开始阅读</a>
        <a class="button button--secondary" href="{{ "roadmap/" | relURL }}">查看路线图</a>
      </div>
      <dl class="landing-hero__stats">
        <div>
          <dt>长文</dt>
          <dd>{{ len $posts }}</dd>
        </div>
        <div>
          <dt>片段</dt>
          <dd>{{ len $snippets }}</dd>
        </div>
        <div>
          <dt>专题</dt>
          <dd>{{ len site.Taxonomies.series }}</dd>
        </div>
      </dl>
    </div>

    {{ with $featuredPost }}
    <a class="landing-hero__feature" href="{{ .RelPermalink }}">
      <span class="landing-hero__feature-kicker">最新发布</span>
      <strong>{{ .Title }}</strong>
      <p>{{ .Summary | default (.Plain | truncate 110) }}</p>
      <span class="landing-hero__feature-meta">{{ .Date.Format site.Params.dateFormat }} · {{ .ReadingTime }} 分钟阅读</span>
    </a>
    {{ end }}
  </div>
</section>

<div class="home-flow">

  <section class="surface">
    <div class="topic-grid topic-grid--home">
      {{ $goCount := len $goPosts }}
      {{ $algoCount := len $algoPosts }}
      {{ $modulePosts := where $posts "Params.series" "intersect" (slice "Go 模块与依赖管理") }}
      {{ $grpcSection := site.GetPage "section" "grpc" }}
      {{ $rabbitmqSection := site.GetPage "section" "rabbitmq" }}
      {{ $grpcCount := 0 }}{{ with $grpcSection }}{{ $grpcCount = len .Pages }}{{ end }}
      {{ $rabbitmqCount := 0 }}{{ with $rabbitmqSection }}{{ $rabbitmqCount = len .Pages }}{{ end }}

      <a class="topic-card" href="{{ "go-engineering/" | relURL }}">
        <strong>Go 工程</strong>
        <p>并发、工程化、性能与模块实践</p>
        <span>{{ $goCount }} 篇文章</span>
      </a>
      <a class="topic-card" href="{{ "algorithms/" | relURL }}">
        <strong>算法题解</strong>
        <p>数组、二分、DP、单调栈等专题</p>
        <span>{{ $algoCount }} 篇题解</span>
      </a>
      <a class="topic-card" href="{{ "go-modules/" | relURL }}">
        <strong>模块专题</strong>
        <p>go.mod、版本约束与发布实践</p>
        <span>{{ len $modulePosts }} 篇文章</span>
      </a>
      <a class="topic-card" href="{{ "grpc/" | relURL }}">
        <strong>gRPC 学习</strong>
        <p>Proto、流式 RPC、拦截器、TLS</p>
        <span>{{ $grpcCount }} 天内容</span>
      </a>
      <a class="topic-card" href="{{ "rabbitmq/" | relURL }}">
        <strong>RabbitMQ 学习</strong>
        <p>可靠性、重试、幂等、队列运维</p>
        <span>{{ $rabbitmqCount }} 天内容</span>
      </a>
      <a class="topic-card" href="{{ "snippets/" | relURL }}">
        <strong>代码片段</strong>
        <p>Go 技巧、算法模板与速查</p>
        <span>{{ len $snippets }} 条</span>
      </a>
    </div>
  </section>

  <section class="surface surface--stream">
    <div class="section-head">
      <div>
        <p class="eyebrow">最新更新</p>
        <h2>学习内容最近更新</h2>
      </div>
    </div>
    <div class="card-grid">
      {{ range first 6 $latestArticles }}
        {{ partial "article-card.html" . }}
      {{ end }}
    </div>
  </section>

</div>
{{ end }}
```

- [ ] **Step 2: Verify homepage renders correctly**

Run dev server, check `http://localhost:1313`:
- Hero section shows copy + feature card side by side
- 3×2 topic grid renders
- Latest articles card grid renders

- [ ] **Step 3: Commit**

```bash
git add layouts/index.html
git commit -m "feat: restructure homepage — hero + 3×2 topic grid + card grid"
```

---

### Task 12: Refresh visual design tokens and typography

**Files:**
- Modify: `assets/css/0-tokens.css` (already created, verify/update)
- Modify: `assets/css/1-reset.css`
- Modify: `assets/css/5-article.css`

Apply magazine/editorial typography, spacing, and color refinements to the CSS files.

- [ ] **Step 1: Update typography defaults in `assets/css/1-reset.css`**

In the `body` rule, ensure:
```css
body {
  /* ... existing ... */
  font-size: var(--text-body);     /* was implicitly 1rem, now 1.1rem */
  line-height: var(--leading-body); /* 1.8 */
}
```

- [ ] **Step 2: Update article typography in `assets/css/5-article.css`**

Ensure article page uses editorial type scale:

```css
.article-shell h1 {
  font-family: var(--font-serif);
  font-size: clamp(2rem, 3.5vw, 2.8rem);
  line-height: var(--leading-heading);
  letter-spacing: -0.02em;
}

.article-body {
  font-size: var(--text-body);
  line-height: var(--leading-body);
}

.article-body blockquote {
  font-family: var(--font-serif);
  font-style: italic;
  border-left: 3px solid var(--accent);
  padding-left: 1.5em;
  margin: 2em 0;
  color: var(--muted);
}

.prose .highlight pre,
.prose pre.chroma {
  margin: 2.5em 0;
  border-radius: var(--radius-lg);
}

/* Wide break-out for code blocks and images */
.article-body .highlight,
.article-body figure {
  margin-left: calc(-1 * (var(--article-body-width) - 100%) / 2);
  margin-right: calc(-1 * (var(--article-body-width) - 100%) / 2);
}

.article-body .highlight pre,
.article-body figure img {
  width: 100%;
}
```

- [ ] **Step 3: Update transitions in `assets/css/0-tokens.css`**

Standardize hover transitions:
```css
--ease-out: 300ms ease-out;
```

Search across `3-components.css` and `4-pages.css` and replace any `transition: ... 0.18s` or `transition: ... 0.2s` with `transition: ... var(--ease-out)` or use the token value.

- [ ] **Step 4: Verify visual changes**

Start dev server and check:
- Homepage: larger hero title, topic grid spacing
- Article page: serif headings, wider code blocks, blockquote styling
- Dark mode: warm dark palette (verify token changes in 6-dark.css from Task 2)
- All hover transitions are smooth at 300ms

- [ ] **Step 5: Commit**

```bash
git add assets/css/0-tokens.css assets/css/1-reset.css assets/css/3-components.css assets/css/5-article.css
git commit -m "feat: apply magazine typography, spacing, and color refinements"
```

---

## Phase 4: Verification

### Task 13: Full site verification

**Files:** (none — verification only)

- [ ] **Step 1: Run preflight checks**

```powershell
./scripts/check-site.ps1
```

Expected: all checks pass — front matter validation, clean build, config checks.

- [ ] **Step 2: Run search UI smoke test**

```powershell
./scripts/check-search-ui.ps1
```

Expected: all DOM-level assertions pass.

- [ ] **Step 3: Manual visual verification**

Start dev server with drafts and published:
```powershell
./scripts/start.ps1 -IncludeDrafts
```

Check each page type:
- `/` — homepage: hero + topic grid + card grid
- `/posts/` — section list with filter
- `/algorithms/` — topic grid + latest cards
- `/go-engineering/` — topic grid + latest cards
- `/go-modules/` — topic grid + latest cards
- `/grpc/` — roadmap + week-by-week
- `/rabbitmq/` — roadmap + week-by-week
- `/snippets/` — standard list
- Any article page — serif headings, blockquote, code blocks, TOC
- `/search/` — full search works
- Dark mode — toggle OS dark mode, verify warm palette

- [ ] **Step 4: Fix any visual regressions**

Address any misaligned elements, missing styles, or broken layouts found in step 3.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final visual polish and regression fixes"
```

---

## Implementation Order

```
Phase 1 (CSS):     Tasks 1 → 2 → 3 → 4
Phase 2 (Templates): Tasks 5 → 6 → 7 → 8 → 9 → 10
Phase 3 (Visual):   Tasks 11 → 12
Phase 4 (Verify):   Task 13
```

Phases are sequential (each depends on the previous). Within Phase 2, Tasks 5-7 can be done in parallel (they create independent partials).
