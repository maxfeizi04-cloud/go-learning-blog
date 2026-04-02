+++
title = "用 replace 与 go work 做本地多模块联调"
date = 2026-04-02T13:30:00+08:00
draft = false
summary = "从本地调试的真实场景出发，理解 replace 和 go work 分别适合解决什么问题，以及它们的边界在哪里。"
tags = ["replace", "go-work", "go-mod", "dependency-management"]
series = ["Go 模块与依赖管理"]
slug = "replace-and-go-work"
+++

## 为什么会遇到本地多模块联调

当你维护多个 Go 项目，或者把公共库单独拆出来时，经常会遇到这种情况：

- A 模块依赖 B 模块
- 你正在本地同时修改 A 和 B
- 你不想每改一次 B 都先发一个远程版本

这时就会自然遇到 `replace` 和 `go work`。

## replace 适合什么场景

`replace` 更适合当前项目临时替换依赖来源。

```go
replace example.com/lib => ../lib
```

这样当前项目在解析依赖时，就会直接使用本地路径，而不是去拉远端版本。

## go work 解决什么问题

`go work` 更像 workspace 级别的协作工具。它能把多个模块放到同一个工作区里统一联调，而不需要在每个模块里都写一遍 `replace`。

```bash
go work init ./app ./lib
```

## 两者怎么选

我的经验是：

- 临时验证一个依赖替换时，用 `replace`
- 长时间维护多个本地模块并行开发时，用 `go work`

## 我的复盘

`replace` 更像单项目级别的应急工具，`go work` 更像多模块开发的长期方案。把这两者分清后，本地联调就会顺很多。