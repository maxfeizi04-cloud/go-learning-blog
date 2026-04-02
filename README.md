# Go Learning Blog

一个适合记录 Go 学习过程、算法刷题复盘、踩坑总结和代码片段的 Hugo 个人博客骨架。

## 你现在拿到的内容

- 自定义 Hugo 布局，不依赖外部主题
- 首页、列表页、文章页、标签页、关于页、404 页面
- `posts` / `snippets` 两种内容模型
- Go 学习记录 + 算法题解双主线
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

新建完整 Go / 工程学习文章：

```powershell
.\scripts\new-post.ps1 -Title "理解 channel 的关闭语义" -Tags channel,concurrency -Series "Go 并发与控制流"
```

新建算法题解文章：

```powershell
.\scripts\new-algo-post.ps1 -Title "两数之和：从暴力枚举到哈希表" -Tags array,hash-table -Difficulty easy
```

新建代码片段：

```powershell
.\scripts\new-snippet.ps1 -Title "用 benchstat 比较基准测试结果" -Tags testing,performance
```

## 内容建议

- `posts` 放完整学习文章、算法题解、工程实践总结
- `snippets` 放短技巧、算法模板、代码片段和命令备忘
- 用 `series` 串起长期主题，例如 `Go 并发与控制流`、`算法与数据结构`
- 每篇文章写 `summary`
- 图片尽量跟文章一起放在 page bundle 目录里

## 部署与上线相关文档

- [Cloudflare Pages 部署说明](docs/deploy-cloudflare-pages.md)
- [上线后检查清单](docs/post-launch-checklist.md)
- [自定义域名配置说明](docs/custom-domain-cloudflare-pages.md)
- [giscus 接入说明](docs/giscus-setup.md)