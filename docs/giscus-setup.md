# giscus 接入说明

这个项目已经预留了 giscus 评论模板，但当前还不能直接启用，原因是仓库的 GitHub Discussions 还没有打开。

## 当前状态

已知配置：

- 仓库：`maxfeizi04-cloud/go-learning-blog`
- 仓库 ID：`R_kgDOR33oYw`
- 计划使用分类：`Announcements`

当前阻塞项：

- GitHub 仓库 `maxfeizi04-cloud/go-learning-blog` 的 Discussions 目前还未开启

## 你需要先做的事

### 1. 在 GitHub 仓库里打开 Discussions

路径：

- 打开仓库主页
- `Settings`
- `Features`
- 勾选 `Discussions`

如果保留 GitHub 默认分类，后面可以直接继续使用 `Announcements`。

### 2. 安装 giscus app

打开 [giscus 官网](https://giscus.app/zh-CN)，按提示把 giscus app 安装到 `maxfeizi04-cloud/go-learning-blog` 仓库。

### 3. 生成剩余配置

在 giscus 配置页里选择：

- Repository: `maxfeizi04-cloud/go-learning-blog`
- Page ↔ Discussions Mapping: `pathname`
- Discussion Category: `Announcements`
- Features / Theme / Language: 按站点当前默认配置即可

这一步最重要的是拿到：

- `categoryId`

## 仓库里已经预填好的配置

[hugo.toml](D:\Codex\go-learning-blog\hugo.toml) 里目前已经预填：

- `repo = "maxfeizi04-cloud/go-learning-blog"`
- `repoId = "R_kgDOR33oYw"`
- `category = "Announcements"`

你后面只需要把：

- `categoryId`
- `enabled`

补齐成下面这样：

```toml
[params.giscus]
enabled = true
repo = "maxfeizi04-cloud/go-learning-blog"
repoId = "R_kgDOR33oYw"
category = "Announcements"
categoryId = "..."
```

## 补完后建议执行

```powershell
.\scripts\check-site.ps1
git add .
git commit -m "feat: enable giscus comments"
git push
```

然后回到线上文章页，检查评论框是否正常出现。