+++
title = "第 8 天：系统学 proto 字段设计。读 Programming Guides 和 Style Guide"
date = 2026-03-08T09:00:00+08:00
draft = false
summary = "系统学 proto 字段设计。读 Programming Guides 和 Style Guide"
tags = ["grpc", "learning-path", "protobuf"]
series = ["gRPC 30天学习"]
slug = "day-08"
weight = 8
day = 8
week = 2
+++

## 今日主题

系统学 proto 字段设计。读 Programming Guides 和 Style Guide

## 今天为什么学这个

这一天的主题不是孤立知识点，而是这条学习线里的一个关键节点。真正目标不是把术语记住，而是把它接到后面几天的实操和排障链路里。

## 今天至少要搞懂

- 掌握 message、字段号、标量类型的基本语义
- 理解为什么字段号一旦发布就不该随意复用
- 能写出最小可用的 hello.proto

## 建议实践

为 User、Order 设计 2 个 message

## 推荐操作步骤

1. 先把今天要读的资料快速过一遍，圈出不懂的术语和命令。
2. 按今天的实践要求做一个最小可运行 demo，不要先追求完整项目。
3. 把执行过程中看到的输入、输出、日志或截图整理到当天目录的笔记里。
4. 对照完成标准做一次自测，确认不是“看懂了”，而是真的“跑通了”。

## 完成标准

字段命名、编号、包名规范正确

## 建议产出物

- 一个可以反复运行的最小 demo
- 一页记录输入、输出和失败路径的 README 或笔记
- 一段“如果这是生产环境，我还缺什么”的复盘

## 今日复盘

- 今天真正搞懂了什么
- 哪一步最容易卡住
- 如果明天继续推进，下一步最该补什么