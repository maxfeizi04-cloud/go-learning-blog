# Go Learning Blog

一个适合记录 Go 学习过程、踩坑总结和代码片段的 Hugo 个人博客骨架。

## 你现在拿到的内容

- 自定义 Hugo 布局，不依赖外部主题
- 首页、列表页、文章页、标签页、关于页、404 页面
- `posts` / `snippets` 两种内容模型
- `tags` / `series` 分类
- 代码高亮、目录、上一篇/下一篇
- 搜索、分页和本地写作脚本
- 可选 `giscus` 评论占位
- Cloudflare Pages 部署说明

## 目录结构

```text
go-learning-blog/
  archetypes/
  assets/
  content/
  docs/
  layouts/
  scripts/
  static/
  hugo.toml
```

## 本地启动

这个项目已经用 Hugo Extended `0.159.2` 验证过构建。你本机装好 Hugo Extended 后就可以直接预览：

```powershell
winget install Hugo.Hugo.Extended
cd D:\Codex\go-learning-blog
./scripts/start.ps1 -IncludeDrafts
```

访问 `http://localhost:1313`。

默认情况下，这个预览脚本会使用 Hugo 的内存渲染模式，不会把开发态内容写回 `public/`。如果你确实需要把预览输出写到磁盘，可以额外传 `-WriteToDisk`。

## 常用脚本

启动本地预览并包含草稿：

```powershell
./scripts/start.ps1 -IncludeDrafts
```

只看已发布内容：

```powershell
./scripts/start.ps1 -PublishedOnly
```

发布前自检：

```powershell
.\scripts\check-site.ps1
```

这个脚本会做一次干净的最小化构建，并把输出写到 `.site-check/`，同时检查常见占位配置是否还残留。

新建完整学习文章：

```powershell
.\scripts\new-post.ps1 -Title "理解 channel 的关闭语义" -Tags channel,concurrency -Series "Go 并发与控制流"
```

新建代码片段：

```powershell
.\scripts\new-snippet.ps1 -Title "用 benchstat 比较基准测试结果" -Tags testing,performance
```

## 发布前建议先做的事

- 把 `hugo.toml` 里的 `baseURL`、`author`、`email`、`github` 换成你自己的
- 完善 `content/about/index.md`
- 运行一次 `./scripts/check-site.ps1`

## 部署到 Cloudflare Pages

完整步骤见：

- `docs/deploy-cloudflare-pages.md`

如果你暂时还没有自定义域名，可以先用：

```text
Build command: hugo --gc --minify --cleanDestinationDir -b $CF_PAGES_URL
Build output directory: public
Environment variable: HUGO_VERSION=0.159.2
```

如果你已经确定正式域名并且 `baseURL` 已经写成正式地址，则更推荐：

```text
Build command: hugo --gc --minify --cleanDestinationDir
Build output directory: public
Environment variable: HUGO_VERSION=0.159.2
```

`--cleanDestinationDir` 能减少旧分页、旧标签页或旧路由残留在输出目录里的风险。

## 开启 giscus 评论

编辑 `hugo.toml`，把下面配置补全并开启：

```toml
[params.giscus]
enabled = true
repo = "yourname/your-repo"
repoId = "..."
category = "Announcements"
categoryId = "..."
```

## 建议的写作习惯

- `posts` 放完整学习文章
- `snippets` 放短技巧和代码片段
- 用 `series` 串起系列内容
- 每篇文章写 `summary`
- 图片尽量跟文章一起放在 page bundle 目录里