+++
title = "第 20 天：学习错误处理，读 Error Handling 和 Status Codes"
date = 2026-03-20T09:00:00+08:00
draft = false
summary = "学习错误处理，读 Error Handling 和 Status Codes"
tags = ["grpc", "learning-path", "error-handling"]
series = ["gRPC 30天学习"]
slug = "day-20"
weight = 20
day = 20
week = 3
+++

## 今日主题

学习错误处理，读 Error Handling 和 Status Codes

## 今天为什么学这个

这一天的主题不是孤立知识点，而是这条学习线里的一个关键节点。真正目标不是把术语记住，而是把它接到后面几天的实操和排障链路里。

## 今天至少要搞懂

- 把超时、取消、错误码串成一条稳定链路
- 避免流式和并发场景里的 goroutine 泄漏
- 让客户端能区分业务失败和基础设施失败

## 建议实践

把业务错误改成标准 gRPC status code

## 推荐操作步骤

1. 先把今天要读的资料快速过一遍，圈出不懂的术语和命令。
2. 按今天的实践要求做一个最小可运行 demo，不要先追求完整项目。
3. 把执行过程中看到的输入、输出、日志或截图整理到当天目录的笔记里。
4. 对照完成标准做一次自测，确认不是“看懂了”，而是真的“跑通了”。

## 完成标准

区分 NotFound、InvalidArgument、Unavailable

## 建议产出物

- 一个可以反复运行的最小 demo
- 一页记录输入、输出和失败路径的 README 或笔记
- 一段“如果这是生产环境，我还缺什么”的复盘

## 今日复盘

- 今天真正搞懂了什么
- 哪一步最容易卡住
- 如果明天继续推进，下一步最该补什么