+++
title = "第 1 天：安装 RabbitMQ、启用 Management、登录 Web UI，学会看 connections、channels、queues、exchanges"
date = 2026-02-01T09:00:00+08:00
draft = false
summary = "安装 RabbitMQ、启用 Management、登录 Web UI，学会看 connections、channels、queues、exchanges"
tags = ["rabbitmq", "learning-path", "queue", "exchange"]
series = ["RabbitMQ 30天学习"]
slug = "day-01"
weight = 1
day = 1
week = 1
+++

## 今日主题

安装 RabbitMQ、启用 Management、登录 Web UI，学会看 connections、channels、queues、exchanges

## 今天为什么学这个

这一天的主题不是孤立知识点，而是这条学习线里的一个关键节点。真正目标不是把术语记住，而是把它接到后面几天的实操和排障链路里。

## 今天至少要搞懂

- 先把 RabbitMQ 的基本模型搞清楚
- 知道消息是如何从 producer 流向 exchange 再流向 queue
- 建立对不同 exchange 路由方式的直觉

## 建议实践

本地启动 broker 并创建一个 study vhost 和测试用户

## 推荐操作步骤

1. 先把今天要读的资料快速过一遍，圈出不懂的术语和命令。
2. 按今天的实践要求做一个最小可运行 demo，不要先追求完整项目。
3. 把执行过程中看到的输入、输出、日志或截图整理到当天目录的笔记里。
4. 对照完成标准做一次自测，确认不是“看懂了”，而是真的“跑通了”。

## 完成标准

你能打开 http://localhost:15672 并解释 UI 里每个核心菜单做什么

## 重点资料

Docs、Tutorials、Management

## 建议产出物

- 一个可以反复运行的最小 demo
- 一页记录输入、输出和失败路径的 README 或笔记
- 一段“如果这是生产环境，我还缺什么”的复盘

## 今日复盘

- 今天真正搞懂了什么
- 哪一步最容易卡住
- 如果明天继续推进，下一步最该补什么