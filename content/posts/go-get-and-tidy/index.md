+++
title = "go get 和 go mod tidy 分别该在什么时候用"
date = 2026-04-03T10:00:00+08:00
draft = false
summary = "很多模块操作问题其实不是命令不会写，而是没分清 go get 和 go mod tidy 的职责边界。"
tags = ["go-mod", "dependency-management", "go-get", "module"]
series = ["Go 模块与依赖管理"]
slug = "go-get-and-tidy"
+++

## 为什么这两个命令总被混用

因为它们都可能导致 `go.mod` 和 `go.sum` 变化，所以看起来像“都在管依赖”。

但职责其实不同。

## go get 更像“显式改依赖”

你主动想引入、升级或降级某个依赖时，用的是 `go get`。

例如：

```bash
go get github.com/pkg/errors@latest
```

它表达的是：我就是要改这个依赖版本。

## go mod tidy 更像“整理依赖图”

`go mod tidy` 的重点不在于主动升级，而在于：

- 删除没用到的依赖
- 补上实际用到但没显式记录的依赖
- 整理 `go.sum`

所以它更像“让模块图和代码真实使用情况对齐”。

## 一个实用习惯

我的习惯通常是：

- 想改某个依赖版本时，先 `go get`
- 改完后跑一次 `go mod tidy`

这样职责就很清楚：

- `go get` 负责“我要改什么”
- `go mod tidy` 负责“把结果整理干净”

## 常见误区

### 以为 tidy 会帮你做有意识的升级策略

不会。它主要做的是整理，不是替你决定依赖升级路径。

### 每次依赖变动只跑 get，不跑 tidy

这样最后 `go.mod` / `go.sum` 很容易留下一些不必要的历史痕迹。

## 我的复盘

很多命令争论其实不是工具复杂，而是动作意图没有分清。把“改依赖”和“整理依赖”拆开后，模块操作会稳定很多。