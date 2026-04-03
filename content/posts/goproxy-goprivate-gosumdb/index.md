+++
title = "GOPROXY、GOPRIVATE、GOSUMDB 到底各管什么"
date = 2026-04-03T09:00:00+08:00
draft = false
summary = "把 Go 模块下载链路里最容易混淆的三个环境变量拆开讲清楚，理解代理、校验和私有仓库之间的边界。"
tags = ["go-mod", "dependency-management", "private-module", "proxy"]
series = ["Go 模块与依赖管理"]
slug = "goproxy-goprivate-gosumdb"
+++

## 为什么这三个变量总让人混

很多 Go 模块问题，最后都会绕回这三个环境变量：

- `GOPROXY`
- `GOPRIVATE`
- `GOSUMDB`

之所以容易混，是因为它们都和“依赖怎么下载”有关，但控制点并不一样。

## 先给一个最短结论

- `GOPROXY`：决定去哪里下载模块
- `GOSUMDB`：决定去哪里校验模块内容的哈希
- `GOPRIVATE`：告诉 Go 哪些模块属于私有范围，不要走公开代理和公开校验

## GOPROXY 管下载路径

最常见的配置是：

```bash
go env -w GOPROXY=https://proxy.golang.org,direct
```

它的意思不是“只能走代理”，而是：

- 先尝试代理
- 失败后再直接去源码仓库拉取

如果你在国内开发，通常会配置成更稳定的代理地址。

## GOSUMDB 管完整性校验

Go 模块默认会记录并校验依赖哈希，`GOSUMDB` 决定去哪个 checksum database 做这件事。

这也是为什么有些私有模块在没配好时，会出现“模块路径访问不到”之外的校验问题。

## GOPRIVATE 是边界开关

这项配置最关键。它告诉 Go：这些模块是私有的，不应该用公开代理，也不应该去公开 checksum database 校验。

例如：

```bash
go env -w GOPRIVATE=github.com/your-org/*
```

一旦范围写对了，很多私有仓库相关的问题都会一下子少很多。

## 常见误区

### 误以为 GOPRIVATE 只是关闭代理

它不只是影响代理，还会影响 checksum database 行为。

### 把私有模块交给公开 sumdb 校验

这往往会导致奇怪的访问或校验错误，因为公开服务并不知道你的私有仓库。

### 配了 GOPROXY，却没配 GOPRIVATE

这在企业内网或私有 GitHub 仓库场景里非常常见。

## 我的复盘

这三个变量其实对应三件不同的事：下载、校验、私有边界。把它们拆开理解后，模块问题排查会顺很多。