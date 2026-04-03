+++
title = "为什么 v2+ 模块路径里必须带版本号"
date = 2026-04-03T09:30:00+08:00
draft = false
summary = "理解 Go 模块里的 semantic import versioning：为什么 v2 以上版本必须写进 import path，以及它解决了什么问题。"
tags = ["go-mod", "dependency-management", "versioning", "module"]
series = ["Go 模块与依赖管理"]
slug = "semantic-import-versioning"
+++

## 现象

很多人第一次看到 Go 模块的 `v2`、`v3` 会觉得别扭：

```go
module github.com/example/lib/v2
```

或者：

```go
import "github.com/example/lib/v2"
```

为什么版本号还要写进路径？

## 背后的原因

Go 模块要解决的不只是“依赖哪个版本”，还要保证不同大版本可以共存。

如果 `v1` 和 `v2` 的 API 已经不兼容，但 import path 还长得一模一样，编译器和依赖解析器就很难明确知道你到底想用哪个版本。

## semantic import versioning 的核心

规则很简单：

- `v0` 和 `v1` 不需要写进路径
- `v2+` 必须写进路径

例如：

- `github.com/example/lib`
- `github.com/example/lib/v2`

## 这样做的好处

最大的好处是“明确”。

一旦 import path 不同：

- 依赖关系更清晰
- 编译期就能区分不同大版本
- 不兼容升级不会悄悄污染旧代码

## 最容易踩的坑

### 升到 v2 了，但 module path 没改

这会导致版本发布和实际 import path 不一致，Go 工具链很可能直接报错。

### 仓库 tag 是 v2，但代码里还是旧路径

这也是典型错误。大版本升级不是只打 tag，还要同步调整模块路径和引用路径。

## 我的复盘

Go 这里的设计一开始看起来别扭，但本质上是在用路径把“不兼容变更”显式化。长远看，这比把风险藏在版本号里更稳。