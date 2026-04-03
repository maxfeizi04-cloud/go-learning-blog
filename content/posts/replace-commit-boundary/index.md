+++
title = "什么时候不该把 replace 提交进仓库"
date = 2026-04-03T10:30:00+08:00
draft = false
summary = "replace 很好用，但它最容易造成的工程问题，不是不会写，而是写完之后不该不该提交。"
tags = ["replace", "go-mod", "dependency-management", "collaboration"]
series = ["Go 模块与依赖管理"]
slug = "replace-commit-boundary"
+++

## 为什么这个问题重要

`replace` 在本地开发时很好用，但它有一个天然风险：它经常携带非常强的环境依赖。

例如：

```go
replace github.com/example/lib => ../lib
```

这条规则对你自己的机器可能完全合理，但对 CI、同事机器和生产构建来说未必成立。

## 什么情况下不要提交

最常见的不要提交场景是：

- 指向本地绝对路径或相对路径
- 只用于个人调试
- 只为临时验证某个修复

这些 replace 一旦提交，别人拉下来很可能直接构建失败。

## 什么情况下可以提交

如果你的 `replace` 是团队明确约定的一部分，而且所有环境都能接受，例如某些 monorepo 工作流，那就另说。

但这种情况应该是“明确设计”，不是“顺手提交”。

## 更稳的做法

如果只是本地多模块联调，更推荐：

- 用 `go work`
- 或者在提交前清理临时 `replace`

## 我的复盘

`replace` 的真正风险不在语法，而在协作边界。判断它要不要提交，本质上是在判断：这个规则是项目规则，还是只是你本机规则。