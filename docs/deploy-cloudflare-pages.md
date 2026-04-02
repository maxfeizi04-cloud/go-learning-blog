# 部署到 Cloudflare Pages

这份文档按“先自检，再上线”的顺序整理，适合这个 Hugo 博客项目。

## 0. 发布前先跑一次自检

先在项目根目录执行：

```powershell
.\scripts\check-site.ps1
```

这个脚本会做两件事：

- 检查 `hugo.toml` 里是否还残留默认占位值
- 做一次干净构建，确认页面文件能正常生成

如果脚本报错，优先按提示修完再继续部署。

## 1. 补齐站点配置

上线前，至少确认下面这些配置已经换成你自己的：

- `baseURL`
- `author`
- `email`
- `github`
- 站点描述和关于页内容

对应文件：

- `hugo.toml`
- `content/about/index.md`

如果你暂时只想先发布到 Cloudflare 默认域名，`baseURL` 可以先写成未来准备长期使用的正式域名，后面再绑定；也可以先保留 Pages 域名方案，但不要一直留着 `blog.example.com` 这种默认占位值。

## 2. 准备仓库

如果你还没有第一次提交，可以在项目根目录执行：

```powershell
git add .
git commit -m "init go learning blog"
```

然后到 GitHub 新建仓库，再把本地仓库推上去。

```powershell
git branch -M main
git remote add origin https://github.com/yourname/go-learning-blog.git
git push -u origin main
```

## 3. 连接 Cloudflare Pages

1. 登录 Cloudflare。
2. 打开 Pages。
3. 选择 Connect to Git。
4. 授权 GitHub。
5. 选择你的 `go-learning-blog` 仓库。

## 4. 选择构建方式

### 方案 A：先用 Cloudflare 提供的 `*.pages.dev` 域名

构建参数可以这样填：

```text
Framework preset: Hugo
Production branch: main
Build command: hugo --gc --minify --cleanDestinationDir -b $CF_PAGES_URL
Build output directory: public
```

### 方案 B：准备直接绑定自己的正式域名

如果你已经确定站点会绑定到比如 `https://blog.example.com/` 这样的正式域名，推荐：

1. 先把 `hugo.toml` 里的 `baseURL` 改成正式域名。
2. 在 Cloudflare Pages 里使用下面的构建命令：

```text
Framework preset: Hugo
Production branch: main
Build command: hugo --gc --minify --cleanDestinationDir
Build output directory: public
```

`--cleanDestinationDir` 可以减少改分页、改 taxonomy 或删页面后残留旧产物的问题。

## 5. 配置环境变量

建议至少添加：

```text
HUGO_VERSION=0.159.2
```

如果后面接入评论、统计或别的第三方脚本，再按需要补环境变量。

## 6. 首次发布后检查

Cloudflare 首次发布成功后，建议至少检查这些页面：

- 首页
- `/posts/`
- 一篇文章详情页
- `/tags/`
- `/search/`
- `/index.xml`
- 404 页面

同时重点确认：

- 中文内容没有乱码
- 搜索正常返回结果
- 分页、标签和导航链接都可点击
- 页面的 canonical / OG 信息不是默认占位地址

## 7. 绑定自定义域名

如果你有自己的域名，可以在 Pages 项目里添加 Custom Domain。

常见做法：

- `blog.yourdomain.com`

绑定成功后，再回头确认一次：

- `baseURL` 已经改成正式域名
- 页面里的链接和分享卡片都指向正式域名

## 8. 打开评论

如果你想开启评论区：

1. 在 GitHub 仓库开启 Discussions。
2. 到 giscus 配置页生成参数。
3. 把参数填进 `hugo.toml` 的 `[params.giscus]`。
4. 把 `enabled` 改成 `true`。
5. 重新运行一次 `./scripts/check-site.ps1`，再推送部署。

## 9. 后续更新方式

后面每次写完内容，建议保持这个顺序：

```powershell
.\scripts\check-site.ps1
git add .
git commit -m "write new post"
git push
```

这样可以把“配置没改完”或“构建被新内容弄坏”这类问题尽量挡在发布前。