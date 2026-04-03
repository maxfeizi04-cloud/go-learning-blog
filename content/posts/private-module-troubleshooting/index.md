+++
title = "私有模块拉取失败时应该怎么排查"
date = 2026-04-03T16:30:00+08:00
draft = false
summary = "私有模块问题经常同时涉及 Git 凭据、代理、sumdb 和模块路径。把排查顺序理顺后，很多问题会变得简单。"
tags = ["go-mod", "private-module", "dependency-management", "troubleshooting"]
series = ["Go 模块与依赖管理"]
slug = "private-module-troubleshooting"
+++

## 为什么私有模块问题总是显得很乱

因为它经常不是单点问题，而是几层配置叠在一起：

- Git 权限
- 模块路径
- `GOPRIVATE`
- `GOPROXY`
- `GOSUMDB`

只要其中一层没对上，错误信息就可能看起来很绕。

## 我推荐的排查顺序

### 1. 先确认仓库本身能不能访问

不要先猜 Go 配置。先确认当前机器对私有仓库本身就有访问权限。

### 2. 再确认模块路径写得对不对

仓库地址、模块路径、代码里的 import path，三者必须一致到 Go 工具链能识别的程度。

### 3. 再看 GOPRIVATE

如果私有模块没有被纳入 `GOPRIVATE`，Go 可能还会去走公开代理或公开 checksum database。

### 4. 最后看代理与校验行为

这时候再去看 `GOPROXY` 和 `GOSUMDB` 是否符合你的企业网络和仓库策略。

## 很常见的误判

### 误判一：以为是代理问题，其实是权限问题

如果 Git 本身就访问不到仓库，那你改 Go 环境变量也救不了。

### 误判二：以为是路径问题，其实是 GOPRIVATE 没配置

仓库明明存在，但 Go 还是去访问公开服务，这种情况很常见。

## 我的复盘

私有模块排查最怕一开始就乱改环境变量。先把“权限、路径、私有边界、代理校验”按顺序拆开，问题往往比想象中简单。