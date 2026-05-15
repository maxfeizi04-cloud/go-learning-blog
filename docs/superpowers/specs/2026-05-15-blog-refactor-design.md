# Blog Refactor Design

**Date:** 2026-05-15
**Status:** approved

## Scope

整体性重构：CSS 模块化、布局模板合并、视觉设计升级（杂志/专栏方向）。

## CSS Architecture

单文件 `assets/css/main.css` (3705 lines) 拆分为 ITCSS 启发式层级，放在 `assets/css/` 下：

```
assets/css/
├── 0-tokens.css        # :root custom properties — 颜色、字体、间距、圆角、阴影
├── 1-reset.css         # 全局 reset + body/a/img 基础
├── 2-layout.css        # .page-frame, .skip-link, .home-flow, .split-grid, 容器类
├── 3-components.css    # button, article-card, entry-card, topic-card, filter-pill,
│                       #   pager, breadcrumb, header, footer, search-box, TOC,
│                       #   callout, snippet-item, difficulty-label
├── 4-pages.css         # .landing-hero, .page-hero, .card-grid, .empty-state,
│                       #   .filter-panel, .topic-grid, .entry-list, .snippet-list
├── 5-article.css       # .article-shell, .article-body 排版, code/pre, 可视器,
│                       #   related-posts
├── 6-dark.css          # @media (prefers-color-scheme: dark) 全部暗色覆盖
└── 7-utilities.css     # 辅助类 (.visually-hidden, .no-js 等)
```

文件名数字前缀保证 `resources.Concat` 拼接顺序即层叠顺序。Hugo Pipes 负责 concat + minify + fingerprint。

### Critical CSS

不再手动维护 `layouts/partials/critical-css.html`。改用 Hugo `resources.PostProcess` 或构建脚本从编译产物自动提取首屏关键规则。`critical-css.html` 当前 228 行与 main.css 重复率很高，手工同步不可靠。

## Template Consolidation

### 目标

6 个 section list 模板合并为 1 个 `_default/list.html`，通过每个 section 的 `_index.md` front matter 中 `[listConfig]` 控制行为。

### 删除的文件

- `layouts/algorithms/list.html`
- `layouts/go-engineering/list.html`
- `layouts/go-modules/list.html`
- `layouts/grpc/list.html`
- `layouts/rabbitmq/list.html`

### 新增的 partial

- `layouts/partials/section-hero.html` — 读 front matter 渲染 hero 区
- `layouts/partials/section-topics.html` — 渲染 topic 导航网格
- `layouts/partials/section-filter.html` — 渲染过滤面板
- `layouts/partials/section-roadmap.html` — 渲染学习轨道周概览

### 三种模式

| 模式 | 触发条件 | 行为 |
|------|---------|------|
| 标准列表 | 无特殊配置 | hero → content → card grid + pagination |
| 过滤列表 | `listConfig.filter` | hero → filter panel → card grid + pagination |
| 学习轨道 | `listConfig.groupBy = "week"` | hero → content → roadmap → 按周分组 card grid |

### 配置示例

```toml
# content/algorithms/_index.md
[[listConfig.topics]]
title = "数组与哈希"
description = "查找、计数、映射与下标关系"
href = "tags/array/"
countBy = "tag"
value = "array"

[listConfig.filter]
preset = "algorithms"
---
# content/grpc/_index.md
[listConfig]
eyebrow = "gRPC 学习"
groupBy = "week"
groupLabel = "第 %d 周"
totalGroups = 5

[[listConfig.roadmap]]
title = "第 1 周"
description = "环境、proto、codegen、最小 server/client 链路"
```

## Visual Design: Magazine/Editorial Direction

### Typography

- 首页标题: `clamp(2.5rem, 5vw, 4rem)`
- 文章标题: `clamp(2rem, 3.5vw, 2.8rem)`
- 正文字号: `1.1rem`, 行高 1.8
- 文章标题、引言、blockquote 使用衬线体 (`--font-serif`)
- `eyebrow` letter-spacing 微调

### Spacing

- 文章页最大宽度 ~1100px（阅读舒适区），首页保持宽幅
- Section 间距 ~80px
- Card padding +20%
- 宽幅图片/代码块"破版"处理（突出正文列）

### Color

- 保持暖纸色基调 (`#f4efe7`)
- 暗色模式从纯暗转为深棕/墨绿暖暗，与亮色同色系家族
- Accent 绿色范围收窄，仅在关键交互点使用

### Homepage Layout

```
┌──────────────────────────────────────┐
│  Hero (左): 标题 + 引导 + 统计 + CTA   │
│  Feature (右): 最新文章大卡片          │
└──────────────────────────────────────┘
┌──────────┬──────────┬──────────┐
│  Go 工程  │  算法     │  模块     │
├──────────┼──────────┼──────────┤
│  gRPC    │ RabbitMQ │ 代码片段  │
└──────────┴──────────┴──────────┘
┌──────────────────────────────────────┐
│  最新文章 card grid (2 列)            │
└──────────────────────────────────────┘
```

去掉当前 split-grid 的 Go/算法分栏（与专题网格功能重复）。

### Details

- Blockquote: 衬线体 + 左侧粗竖线
- 代码块与正文之间更大呼吸空间
- 文章元信息移到标题下方做副标题行
- Hover transition: 300ms ease-out

## Non-Goals

- 不引入 Tailwind CSS 或外部 CSS 框架
- 不引入 Node.js 构建工具链（Vite、Lightning CSS 等）
- 不改变 Hugo 版本或 CI/CD 流程
- 不修改内容文件结构（posts/snippets/grpc/rabbitmq 目录不变）

## Risks & Mitigations

- **Hugo PostCSS 兼容性**: 仅用 autoprefixer+cssnano，Hugo 内建 PostCSS 已验证支持
- **模板合并回归**: 逐 section 迁移，每个 section 在 dev server 验证后再迁移下一个
- **视觉调整内容可见性**: 排版和间距调整可能影响代码块展示，需在迁移完成后 `check-site.ps1` 全量验证
