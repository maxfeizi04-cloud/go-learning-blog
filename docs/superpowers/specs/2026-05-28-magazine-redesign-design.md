# Magazine-Style Visual Redesign

## 目标

将博客前端从"组件各自为政"重构为统一的杂志式设计系统，建立严格的 type scale / spacing / color / card / grid 体系。

## 一、字体层级 (Type Scale)

所有组件禁止手写 `font-size`，只能引用以下 token：

| Token | 用途 | 大小 |
|---|---|---|
| `--text-display` | 首页大标题 | `clamp(56px, 7vw, 96px)` |
| `--text-headline` | 文章页标题 | `clamp(36px, 4.5vw, 54px)` |
| `--text-title` | 区块标题 | `clamp(28px, 3vw, 38px)` |
| `--text-subhead` | 卡片标题 | `clamp(20px, 1.5vw, 26px)` |
| `--text-body` | 正文 | `1.1rem` |
| `--text-small` | 辅助信息 | `0.875rem` |
| `--text-caption` | 标签/日期 | `0.75rem` |
| `--text-eyebrow` | 分类角标 | `0.6875rem` |

规则：
- 标题族走 `--font-serif`，正文及以下走 `--font-sans`
- `letter-spacing` 和 `line-height` 随层级递减规律化

## 二、间距节奏 (Spacing Scale)

所有 gap / padding / margin 禁止裸数字：

| Token | 值 | 用途 |
|---|---|---|
| `--space-xs` | `4px` | label-value 间隙 |
| `--space-sm` | `8px` | 标签行 gap |
| `--space-md` | `16px` | 卡片内 gap、段落间距 |
| `--space-lg` | `24px` | 组件内 padding、hero actions 间距 |
| `--space-xl` | `32px` | 区块内部间距 |
| `--space-2xl` | `48px` | 大区块 gap |
| `--space-3xl` | `64px` | 页面级 section gap |
| `--space-section` | `clamp(48px, 6vw, 80px)` | 弹性大间隔 |

规则：
- 向内 (padding) 用 md/lg 两档
- 向外 (margin-bottom/gap) 用 lg/xl/2xl 三档

## 三、色彩体系

3 层文本色 + 2 层表面色 + 2 层边框色：

| Token | 值 | 用途 |
|---|---|---|
| `--text-primary` | `#1d2d2b` | 正文主色 |
| `--text-secondary` | `#556563` | 辅助文案 |
| `--text-tertiary` | `#8a9e9a` | 日期/meta |
| `--surface-card` | `rgba(255,252,246,0.92)` | 普通卡片背景 |
| `--surface-elevated` | `rgba(255,250,241,0.98)` | hero/重点模块背景 |
| `--border-subtle` | `rgba(29,45,43,0.08)` | 内部细线 |
| `--border-strong` | `rgba(29,45,43,0.14)` | 卡片外框 |

Accent 色保持 `--accent: #0b7a5a`，限定用于可交互元素。

## 四、卡片体系统一

3 种卡片，所有列表项、搜索结果、专题卡、文章卡均归入其中一种：

| 类型 | 场景 | 特征 |
|---|---|---|
| **Card** | 文章卡、专题卡、roadmap、entry | `--surface-card` + `--border-strong` + `--radius-md` |
| **Card--elevated** | Hero feature、重点推荐 | Card 基础上叠加 `box-shadow` |
| **Card--flush** | 搜索结果、snippet 列表、标签、TOC | 无边框无背景，hover 出现底色 |

统一规则：
- padding: `--space-lg`
- 标题: `--text-subhead` serif
- 描述: `--text-secondary`
- meta: `--text-tertiary` + `--text-caption`
- hover: `translateY(-2px)` + shadow 加深 + 顶部 accent 细线

## 五、布局网格

| Token | 列数 | 用在哪 |
|---|---|---|
| `--grid-4` | `repeat(4, 1fr)` | 大屏 4 列 |
| `--grid-3` | `repeat(3, 1fr)` | 默认 3 列 |
| `--grid-2` | `repeat(2, 1fr)` | split 布局、prev/next |
| `--grid-1` | `1fr` | 移动端 fallback |

去掉 `1.08fr 0.92fr` 等微调比例，用等分网格 + 间距传达层次。

## 六、首页 Hero

- 背景改为单一干净渐变（`--surface-elevated` → 微泛绿）
- 左右两栏走 `--grid-2`（去掉比例偏差）
- Feature 卡片加杂志式装饰（引号/编号角标）
- Track 卡片统一走 Card 系统
- 大标题用 `--text-display`
- 统计数据保留，用 `--text-caption` + `--text-title`

## 七、文章详情页

- 文章头加入 `--surface-card` 背景 + 底部分隔线
- 标题走 `--text-headline`，摘要走 `--text-subhead`
- 正文区两栏：TOC 侧栏 + 正文 (max 74ch)
- TOC 降级为 Card--flush 样式（轻量透气）
- 正文字体 `--text-body`，h2/h3/h4 走 type scale
- 代码块和图片的宽幅 breakout 保留，但 padding 走 token

## 八、导航头部

- 去掉 `border-radius: 999px` 胶囊造型
- 改为全宽矩形 + 底部细分隔线（`--border-subtle`）
- 背景从半透明玻璃改为 `--surface-card` 实色
- Sticky 状态下底部分隔线可见
- 移动端汉堡菜单保留，面板样式走 Card 系统

## 九、背景层次

- Body 背景改为纯色 `--bg: #f4efe7`（去掉径向渐变叠加）
- 三层分离：背景层 (body) → 内容层 (Card) → 强调层 (Card--elevated)
- 层次靠卡片和间距区分，不靠底纹

---

## 实施顺序

1. `0-tokens.css` — 写入所有新 token
2. `1-reset.css` — 简化 body 背景
3. `2-layout.css` — 统一 grid、header、footer
4. `3-components.css` — 重构 3 种卡片 + 按钮 + tag
5. `4-pages.css` — hero、article layout
6. `5-article.css` — prose 排版
7. `6-dark.css` — 暗色模式适配新 token
8. `critical.css` — 提取关键路径 token
9. `layouts/` 模板 — 移除硬编码 style、统一 class 名
