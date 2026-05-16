# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Preview

```powershell
# Dev preview with drafts
./scripts/start.ps1 -IncludeDrafts

# Dev preview, published-only
./scripts/start.ps1 -PublishedOnly

# Production build
hugo --gc --minify --cleanDestinationDir
```

The project requires **Hugo Extended 0.159.2**. Install via `winget install Hugo.Hugo.Extended`. The dev server binds on port 1313 with `--renderToMemory` by default (does not write to `public/`).

## Preflight & Validation

```powershell
./scripts/check-site.ps1                 # Full preflight: front matter validation + clean build + config checks
./scripts/validate-frontmatter.ps1        # Front matter validation only
./scripts/check-search-ui.ps1             # Client-side search JS end-to-end smoke test (requires Node)
```

Run `check-site.ps1` before pushing to `main` — it mirrors the CI pipeline locally.

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/new-post.ps1 -Title "..." -Tags ... -Series "..."` | Create a new `posts/` article |
| `scripts/new-algo-post.ps1 -Title "..." -Tags ... -Difficulty easy` | Create an algorithm solution post |
| `scripts/new-snippet.ps1 -Title "..." -Tags ...` | Create a new `snippets/` entry |
| `scripts/new-study-day.ps1 -Track grpc\|rabbitmq -Day N -Title "..."` | Create study track content |
| `scripts/check-site.ps1` | Full preflight |
| `scripts/check-search-ui.ps1` | Search JS smoke test |
| `scripts/validate-frontmatter.ps1` | Validate all front matter |

Shared PowerShell utilities live in `scripts/Shared.psm1` (`Resolve-SafePath`, `Get-TomlString`, `Get-TomlBool`).

## Architecture

This is a **Hugo static site with fully custom layouts** — no external theme dependency. Everything under `layouts/` is hand-built.

### Content structure

```
content/
  posts/             # Main learning articles + algorithm solutions (page bundles: index.md per post)
  snippets/           # Short tips, algorithm templates, cheatsheets (single .md files)
  grpc/               # 30-day gRPC study track (day-01/ through day-30/ page bundles)
  rabbitmq/           # 30-day RabbitMQ study track (day-01/ through day-30/ page bundles)
  algorithms/_index.md
  go-modules/_index.md
  go-engineering/_index.md
  roadmap/_index.md
  about/index.md
  search/_index.md
```

### Layout hierarchy

The base template is `layouts/_default/baseof.html` — every page inherits this shell (header, footer, skip-link). It uses `{{ block "main" . }}{{ end }}` to inject page content.

- **`layouts/index.html`** — Homepage with hero, featured posts, split grids for Go/Algo sections, study track cards, snippet list
- **`layouts/_default/single.html`** — Article page with breadcrumbs, TOC rail, prev/next nav, related posts, comments placeholder
- **`layouts/_default/list.html`** — Generic list page with hero + card grid + pagination. The `posts` section gets an extra filter panel for algorithm difficulty/tag filtering
- **`layouts/_default/taxonomy.html`** — Tag/series/difficulty listing pages with paginated card grid
- **`layouts/roadmap/list.html`** — Custom roadmap page showing three learning tracks (Go engineering, algorithms, suggested order)

Section-specific list templates (`layouts/algorithms/list.html`, `layouts/go-modules/list.html`, `layouts/go-engineering/list.html`, `layouts/grpc/list.html`, `layouts/rabbitmq/list.html`) provide section filtering, but the key rendering is in `_default/list.html`.

### Key partials

| Partial | Role |
|---------|------|
| `head.html` | `<head>` with SEO meta, OG tags, critical CSS inline, deferred full CSS |
| `critical-css.html` | Inline critical-path CSS (layout skeleton only, ~230 lines) |
| `header.html` | Sticky header with brand, search icon/bar, nav |
| `article-card.html` | Reusable post card with badges (algorithm, difficulty, visualization, tags) |
| `pager.html` | Pagination links |
| `search-box.html` | Search input component shared by icon-dropdown and search page |
| `scripts.html` | Loads `search.js`, `ui-enhancements.js`, `algorithm-visualizer.js` |
| `comments.html` | giscus placeholder (disabled by default) |
| `difficulty-label.html` | Maps difficulty values to Chinese labels |
| `page-label.html` | Maps section/taxonomy values to Chinese labels |
| `breadcrumb.html` | Breadcrumb nav |
| `algorithm-visualizer.html` | Conditional visualizer panel for algorithm posts |
| `related-posts.html` | Related articles widget |

### Search system

Client-side search in `assets/js/search.js`. Hugo generates a JSON index at `/index.json` (via `layouts/index.json`) containing all pages from `mainSections`. The search script:

- On article pages: renders a search icon toggle that opens a dropdown panel
- On `/search/`: full-page search with keyboard navigation, per-section result grouping, history
- Supports ArrowDown/ArrowUp navigation, Enter to activate, Escape to close
- Highlights query fragments in results

### Taxonomies

Three taxonomies defined in `hugo.toml`: `tags`, `series`, `difficulties`. Algorithm posts must set `difficulty` (easy/medium/hard) and the corresponding `difficulties` array.

### Front matter requirements

`validate-frontmatter.ps1` enforces per-section rules:

| Section | Required fields | Extra rules |
|---------|----------------|-------------|
| `posts` | date, title, summary, slug, tags, series | If `isAlgorithm = true`: also difficulty, difficulties, source, problemId |
| `snippets` | date, title, summary, slug, tags | — |
| `grpc` | date, title, summary, slug, tags, series, day, week | day 1-30, week 1-4; slug & day must match bundle dir name (`day-NN`) |
| `rabbitmq` | date, title, summary, slug, tags, series, day, week | same as grpc |

All content uses TOML front matter delimited by `+++`.

### CI/CD

`.github/workflows/site-check.yml` runs on push/PR to `main`:

1. Checkout + setup Hugo Extended 0.159.2 + Node 22
2. Front matter validation
3. Hugo production build (`--gc --minify --cleanDestinationDir`)
4. Preflight script (`check-site.ps1`)
5. Search UI smoke test (uses jsdom for DOM-level assertions)
6. Broken link check (lychee)
7. If on `main` push: deploy to Cloudflare Pages via `cloudflare/pages-action`

### CSS approach

Custom CSS in `assets/css/main.css`, processed through Hugo's asset pipeline (minified + fingerprinted). Critical CSS is extracted into `layouts/partials/critical-css.html` and inlined in `<head>` for fast first paint. The full CSS loads deferred.

### Content conventions

- Posts use Hugo page bundles (directory per post with `index.md`)
- Snippets are standalone `.md` files (not bundles)
- Study tracks use `day-XX` page bundles with `weight` for ordering
- Algorithm posts set `isAlgorithm = true` plus `source` (e.g. "LeetCode"), `problemId`, `difficulty`
- Use `series` to link related articles across sections
