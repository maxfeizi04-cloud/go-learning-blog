# Go Learning Blog Design System

## 1. Scope

This document is the project-specific design system for `go-learning-blog`.

It is not a generic SaaS landing-page style guide. It exists to keep a consistent visual and interaction language across:

- article pages
- taxonomy and list pages
- search UI
- related-post recommendations
- code and prose presentation
- algorithm visualization modules

The site is a Chinese technical blog built with Hugo. Reading comfort, information hierarchy, and code-oriented clarity matter more than marketing-style visual spectacle.

## 2. Product Context

### Content types

- **Posts**: long-form Go and algorithm articles
- **Snippets**: short reusable code notes
- **Algorithm posts**: posts with difficulty/source metadata and optional visualization blocks

### Most important surfaces

- Home page
- Section list pages
- Single article pages
- Search dropdown and search page
- Algorithm visualizer
- Related posts block

### Primary user goals

- scan topics quickly
- read long Chinese technical content comfortably
- copy and inspect code
- navigate between related concepts
- search for specific articles, tags, or algorithms

## 3. Core Design Principles

### Reading first

The site should feel like a high-quality technical notebook, not a product promo page. Layout and styling should always serve long-form reading.

### Warm, calm, deliberate

The visual system should feel grounded and editorial: warm backgrounds, soft surfaces, restrained accents, and subtle depth.

### Code is first-class content

Code blocks, inline code, metadata, and algorithm states should feel intentional and highly legible.

### Interaction stays subordinate

Interactive modules such as search and algorithm visualizers are useful tools, but they should not overpower the article itself.

### Chinese typography is a first-order concern

This project is primarily Chinese-language. Spacing, line-height, measure, and heading rhythm should be optimized for Chinese reading, not copied from English-first marketing sites.

### Preserve the current identity

New UI should extend the existing system already defined in `assets/css/main.css`, not replace it with a new brand language.

## 4. Visual Identity

### Overall mood

- warm paper-like background
- subtle green accent
- translucent surface cards
- editorial typography
- restrained shadow depth

### What this project is not

- not a pure white docs SaaS page
- not a dark-first interface
- not a gradient-heavy startup hero system
- not a purple or neon product brand

## 5. Color System

Use the existing tokens in `assets/css/main.css` as the source of truth.

### Core tokens

- `--bg: #f4efe7`
- `--bg-soft: #efe7db`
- `--surface: rgba(255, 252, 246, 0.9)`
- `--surface-strong: #fffaf1`
- `--surface-muted: #ecf2ef`
- `--text: #1d2d2b`
- `--muted: #556563`
- `--line: rgba(29, 45, 43, 0.12)`
- `--accent: #0b7a5a`
- `--accent-deep: #08543f`
- `--accent-soft: rgba(11, 122, 90, 0.1)`

### Usage rules

- Use `--text` for primary reading text.
- Use `--muted` for metadata, helper text, and secondary labels.
- Use `--accent` and `--accent-deep` sparingly for emphasis, focus, and active states.
- Use `--surface` and `--surface-strong` for cards and reading containers.
- Use `--line` for separation; do not replace it with harsh high-contrast borders.

### Accent policy

Accent color should guide attention, not flood the layout. Typical valid uses:

- active nav states
- focus rings
- badges
- call-to-action buttons
- search highlight
- algorithm visualizer emphasis

Do not introduce a second competing brand accent unless the entire token system is being intentionally redesigned.

## 6. Typography

### Font families

Use the existing families as the canonical set:

- Sans: `IBM Plex Sans`, `Segoe UI`, `PingFang SC`, `Microsoft YaHei`, sans-serif
- Serif: `Noto Serif SC`, `Source Han Serif SC`, `STSong`, serif
- Mono: `IBM Plex Mono`, `Cascadia Code`, `Consolas`, monospace

### Typographic roles

- **Sans** for UI, navigation, metadata, cards, search, controls
- **Serif** for major editorial headings
- **Mono** for code, inline code, labels tied to code/state, technical values

### Chinese-specific rules

- Do not rely on tight negative letter-spacing as a design signature.
- Avoid uppercase styling as a primary hierarchy mechanism for Chinese UI text.
- Keep line-height generous for long reading blocks.
- Prefer stable rhythm over compressed density.

### Recommended scale

- Hero / article title: `36px` to `58px`, serif
- Section heading: `28px` to `36px`, serif
- Subheading: `22px` to `29px`, serif
- Card title: `18px` to `22px`, sans
- Body: `16px` to `19px`, sans
- Metadata: `12px` to `14px`, sans
- Code / micro labels: `12px` to `15px`, mono

### Prose standards

- Body line-height should remain around `1.8` to `1.95` for articles.
- Long-form prose should remain narrow enough to read comfortably.
- Paragraphs, lists, tables, and code blocks must maintain strong vertical rhythm.

## 7. Spacing and Layout

### Global container

- Main width uses `--content-width: 1160px`
- Outer page gutters tighten responsively

### Spacing philosophy

- spacious, not sparse
- clear block separation
- enough breathing room around code and tools
- article body gets the highest spacing priority

### Radius scale

- `--radius-md: 16px`
- `--radius-lg: 22px`
- `--radius-xl: 28px`
- pills / chips / buttons: `999px`

### Depth

Use the existing restrained shadow language:

- soft ambient shadows
- translucent surfaces
- border + blur + shadow together

Do not introduce heavy enterprise-style card shadows or flat harsh borders.

## 8. Key Components

### Header and navigation

The header is sticky, rounded, and lightly translucent. It should feel like a floating editorial toolbar, not a hard application shell.

Rules:

- brand remains left-aligned
- desktop nav stays compact and calm
- search remains a first-class control
- mobile menu should feel lightweight and readable

### Search UI

Search is a utility feature and should optimize for clarity.

Rules:

- result cards must include `meta`, `title`, and `summary`
- highlighted query fragments must remain visible but not noisy
- keyboard selection must be visually obvious
- status text should explain the current search state
- mobile search should collapse to a single-column form

### Article cards

Article cards should prioritize quick comprehension:

- date and reading time first
- badges next when relevant
- title as the main focal point
- summary visible by default
- tags limited and muted

### Single article page

The article page is the most important layout in the project.

Rules:

- title block must feel editorial, not dashboard-like
- summary should be visible near the top
- metadata should remain compact
- tags and badges should support scanning
- related tools should not interrupt the reading flow

### Prose and code blocks

Code should feel polished and trustworthy.

Rules:

- maintain strong contrast in code blocks
- preserve line numbers alignment
- copy button should be clear and unobtrusive
- inline code should remain visually distinct but not loud

### Related posts

Related posts should feel like a continuation of study, not ad-like recommendations.

Rules:

- concise metadata
- clear title hierarchy
- short summary
- compact but readable cards

### Algorithm visualizer

The visualizer is a companion learning tool.

Rules:

- article content remains primary; visualizer supports it
- steps, controls, and board states must be understandable without animation
- metrics should be easy to scan
- timeline should make execution order obvious
- the sample chip must safely wrap long content

### Badges and tags

Badges communicate taxonomy and state. They should stay compact and consistent.

Rules:

- pills for tags and metadata
- difficulty colors should remain semantically distinct
- visualization badge should not overpower difficulty/source badges

## 9. Long Content Hardening

This project contains many long technical strings:

- code terms
- mixed Chinese/English labels
- tags
- sample inputs
- URLs
- identifiers

All text containers that can receive variable content must explicitly handle wrapping.

Use patterns such as:

- `overflow-wrap: anywhere`
- `word-break: break-word`
- controlled truncation where appropriate

This is especially important for:

- search result summaries
- tag pills
- metadata rows
- algorithm visualizer sample chips
- code-adjacent labels

## 10. Accessibility and Interaction

### Focus

Use the existing strong `:focus-visible` outline treatment. Interactive elements must remain keyboard-discernible.

### Keyboard support

At minimum, these flows must work:

- search open / navigate / activate / escape
- mobile menu toggle
- algorithm visualizer controls

### Motion

Motion should be present but restrained.

Rules:

- use animation for polish, not meaning
- do not hide required information behind motion
- prefer short easing-based transitions
- any new animation-heavy component should include a reduced-motion path

### Hit targets

Interactive UI should remain comfortable on touch devices. Avoid tiny icon-only tap targets without padding.

## 11. Responsive Rules

Current layout already uses breakpoints around:

- `980px`
- `720px`
- `480px`

Design additions should respect these breakpoints and patterns.

### Mobile behavior

- search forms collapse vertically
- article rails stack above content
- metrics become one-column
- controls expand to wider tap targets
- long text must wrap without breaking layout

### Desktop behavior

- header maintains clear three-part structure
- article TOC can remain in a rail
- tool panels can sit beside or below article content without crowding it

## 12. Implementation Guidance

### File ownership

- Tokens and global patterns: `assets/css/main.css`
- Search markup: `layouts/partials/search-box.html`
- Search behavior: `assets/js/search.js`
- Article structure: `layouts/_default/single.html`
- Card patterns: `layouts/partials/article-card.html`
- Related posts: `layouts/partials/related-posts.html`
- Visualizer markup: `layouts/partials/algorithm-visualizer.html`
- Visualizer behavior: `assets/js/algorithm-visualizer.js`

### Before changing UI

Ask:

1. Does this improve reading or discovery?
2. Does it preserve the current warm editorial identity?
3. Is it safe for Chinese content and long technical strings?
4. Does it stay usable on mobile?
5. Does it fit the existing token system?

## 13. Do / Don't

### Do

- keep the warm paper-like background and green accent system
- prioritize reading comfort
- use serif selectively for editorial emphasis
- keep search informative, not minimal to the point of ambiguity
- make algorithm tools visually rich but subordinate to the article
- harden components against unusually long text

### Don't

- turn the blog into a white SaaS landing page
- replace the font system with Inter/Geist unless the site is intentionally rebranded
- use purple as a default accent
- rely on English-first uppercase styling for Chinese UI
- remove summaries or metadata from search and article discovery surfaces
- add heavy enterprise shadows or dense dashboard chrome

## 14. Short Prompt Reference

When designing new UI for this project, use this framing:

"Design for a Chinese Hugo technical blog with a warm editorial feel. Preserve the existing green accent, translucent surfaces, IBM Plex Sans / Noto Serif SC / IBM Plex Mono typography, and reading-first hierarchy. Favor calm search and article discovery, polished code presentation, and accessible interaction. Do not drift into SaaS marketing-site patterns."
