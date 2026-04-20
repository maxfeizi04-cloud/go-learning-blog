+++
title = "第 3 天：学习 package、go_package、生成规则，读 Go Generated Code Guide"
date = 2026-03-03T09:00:00+08:00
draft = false
summary = "学习 package、go_package、生成规则，读 Go Generated Code Guide"
tags = ["grpc", "learning-path", "protobuf"]
series = ["gRPC 30天学习"]
slug = "day-03"
weight = 3
day = 3
week = 1
+++

## 今日主题

学习 package、go_package、生成规则，读 Go Generated Code Guide

## 今天为什么学这个

这一天的主题不是孤立知识点，而是这条学习线里的一个关键节点。真正目标不是把术语记住，而是把它接到后面几天的实操和排障链路里。

## 今天至少要搞懂

- 理解 package 和 go_package 在 Go 代码生成里的作用
- 能解释为什么 protoc 需要知道导入路径
- 把 codegen 命令固定成可复用流程

## 建议实践

手动跑一遍 protoc、--go_out、--go-grpc_out

## 推荐操作步骤

1. 先把今天要读的资料快速过一遍，圈出不懂的术语和命令。
2. 按今天的实践要求做一个最小可运行 demo，不要先追求完整项目。
3. 把执行过程中看到的输入、输出、日志或截图整理到当天目录的笔记里。
4. 对照完成标准做一次自测，确认不是“看懂了”，而是真的“跑通了”。

## 完成标准

能解释你前面遇到的 unable to determine Go import path

## 建议产出物

- 一个可以反复运行的最小 demo
- 一页记录输入、输出和失败路径的 README 或笔记
- 一段“如果这是生产环境，我还缺什么”的复盘

## 今日复盘

- 今天真正搞懂了什么
- 哪一步最容易卡住
- 如果明天继续推进，下一步最该补什么