# Cloudflare Pages 自定义域名配置说明

这份文档适合在 `go-learning-blog.pages.dev` 已经可用之后，再把站点切到你自己的域名。

## 1. 先决定用哪个域名

最常见的两种方式：

- 子域名：`blog.yourdomain.com`
- 根域名：`yourdomain.com`

如果只是博客，我更推荐先用子域名，风险更小，也更容易和主站分开管理。

## 2. 在 Cloudflare Pages 里添加域名

路径：

- Workers & Pages
- 选择你的 Pages 项目
- `Custom domains`
- `Set up a custom domain`

填入你准备使用的域名后继续。

## 3. 子域名和根域名的区别

### 子域名

如果你使用的是子域名，例如 `blog.yourdomain.com`：

- 不一定要求整站 NS 都托管到 Cloudflare
- 如果域名已在 Cloudflare 管理，Cloudflare 会自动帮你加记录
- 如果域名不在 Cloudflare 管理，你需要在 DNS 提供商那里添加一条 CNAME，指向 `go-learning-blog.pages.dev`

### 根域名

如果你要直接用根域名，例如 `yourdomain.com`：

- 这个域名必须作为 Cloudflare zone 存在于同一个账号下
- 需要把域名 NS 切到 Cloudflare
- 配好后 Cloudflare 会为 Pages 自动创建记录和证书

## 4. 绑定成功后要做的两件事

### 更新 `baseURL`

把 [hugo.toml](D:\Codex\go-learning-blog\hugo.toml) 里的：

```toml
baseURL = "https://go-learning-blog.pages.dev/"
```

改成你的正式域名，例如：

```toml
baseURL = "https://blog.yourdomain.com/"
```

### 重新部署

改完 `baseURL` 后重新推送一次，让 canonical、OG、RSS 都切到正式域名。

## 5. 是否保留 `pages.dev` 访问

你有两个选择：

- 保留 `go-learning-blog.pages.dev` 作为备用访问地址
- 把 `go-learning-blog.pages.dev` 301 重定向到正式域名

如果你准备长期对外使用正式域名，通常更推荐重定向，避免搜索引擎看到两个可访问入口。

## 6. 推荐的最终检查

切域名后，至少重新检查：

- 首页是否从正式域名打开
- 页面源码中的 `canonical` 是否已经更新
- RSS 是否来自正式域名
- 搜索、标签、分页和文章详情页都正常
- 如果做了重定向，`pages.dev` 是否正确跳转

## 7. 当前项目的建议顺序

对这个项目，推荐按这个顺序操作：

1. 先确认 `go-learning-blog.pages.dev` 可正常使用
2. 在 Pages 中添加自定义域名
3. 域名验证成功后修改 `hugo.toml` 里的 `baseURL`
4. 重新推送部署
5. 再跑一次 [docs/post-launch-checklist.md](D:\Codex\go-learning-blog\docs\post-launch-checklist.md)