+++
title = "第 26 天：学习 reflection，读 Reflection"
date = 2026-03-26T09:00:00+08:00
draft = false
summary = "学习 reflection，读 Reflection"
tags = ["grpc", "learning-path", "reflection"]
series = ["gRPC 30天学习"]
slug = "day-26"
weight = 26
day = 26
week = 4
+++

## 今日主题

学习 reflection，读 Reflection

## 今天为什么学这个

这一天的主题不是孤立知识点，而是这条学习线里的一个关键节点。真正目标不是把术语记住，而是把它接到后面几天的实操和排障链路里。

## 今天至少要搞懂

- 把 gRPC 从“能跑通”推进到“接近可上线”
- 理解拦截器、认证、可观测性和优雅停机各自的职责边界
- 让服务具备更完整的诊断与治理能力

## 建议实践

开启 reflection，并安装 [grpcurl](https://github.com/fullstorydev/grpcurl)

## 推荐操作步骤

1. 先把今天要读的资料快速过一遍，圈出不懂的术语和命令。
2. 按今天的实践要求做一个最小可运行 demo，不要先追求完整项目。
3. 把执行过程中看到的输入、输出、日志或截图整理到当天目录的笔记里。
4. 对照完成标准做一次自测，确认不是“看懂了”，而是真的“跑通了”。

## 完成标准

你能用 grpcurl list 和 describe 查看服务

## 建议产出物

- 一个可以反复运行的最小 demo
- 一页记录输入、输出和失败路径的 README 或笔记
- 一段“如果这是生产环境，我还缺什么”的复盘

## 今日复盘

- 今天真正搞懂了什么
- 哪一步最容易卡住
- 如果明天继续推进，下一步最该补什么