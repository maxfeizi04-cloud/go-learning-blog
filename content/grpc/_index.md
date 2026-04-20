+++
title = "gRPC 学习"
description = "按 30 天学习节奏整理 gRPC 在 Go 里的环境搭建、Proto 设计、流式 RPC、拦截器、TLS 与生产化实践。"
+++

这里集中整理 gRPC 的 30 天学习内容。页面不按发布时间，而按学习顺序组织，适合逐天推进。

## 这条学习线适合谁

- 已经会写基础 Go，但还没系统做过 gRPC 项目的人
- 想把 gRPC 从“能跑通示例”推进到“能做成工程”的人
- 对 Proto 设计、流式 RPC、拦截器、TLS、健康检查和优雅停机还没有完整认知的人

## 你会在这 30 天里拿到什么

- 一个能独立搭起来的 gRPC 开发环境
- 一套从 `.proto` 到代码生成、再到 server/client 的完整链路
- 对 unary、server streaming、client streaming、bidirectional streaming 的清晰边界认知
- 对 metadata、interceptor、deadline、状态码、TLS、reflection、health、graceful shutdown 的工程化理解

## 建议的使用方式

不要把这 30 天当成“阅读清单”，更适合当“练习清单”来用：

1. 每天先看主题和完成标准
2. 按当天建议实践做一个最小 demo
3. 把 demo、命令、报错和结论写进当天目录的笔记里
4. 每周最后一天做一次复盘，不要只追求天数推进

## 进入前的前置条件

更顺的起点是你已经具备这些基础：

- 会写基础 Go 程序
- 理解 `net/http`、`context`、goroutine 的基本使用
- 知道 Go 模块、`go install`、PATH 配置这些基础环境概念

如果这些还不稳，建议先补 Go 基础和模块内容，再回来推进 gRPC 这一条线。
