+++
title = "RabbitMQ 学习"
description = "按 30 天学习节奏整理 RabbitMQ 的模型、可靠性、重试、幂等、队列类型、Streams 与运维实践。"
+++

这里集中整理 RabbitMQ 的 30 天学习内容。页面重点强调按天推进和按周复盘。

## 这条学习线适合谁

- 已经知道消息队列概念，但还没把 RabbitMQ 系统跑通的人
- 会写 Go，但还没真正做过 RabbitMQ 可靠性、重试和幂等设计的人
- 想把 RabbitMQ 从“会发消息”推进到“能做生产化链路”的人

## 你会在这 30 天里拿到什么

- 对 producer、consumer、exchange、queue、binding、routing key 的系统理解
- 对 ack、prefetch、publisher confirm、重连边界的清晰认知
- 对 TTL、DLX、重试链路、毒消息、幂等处理的成体系实践
- 对 classic queue、quorum queue、stream、policy、监控和集群边界的工程判断

## 建议的使用方式

RabbitMQ 最怕“只看不跑”。更稳的用法是：

1. 每天至少完成一个可重复执行的 demo
2. 每天都记录消息流向、失败路径和恢复路径
3. 每周最后做一次总结，确认自己真的能解释为什么这样设计

## 进入前的前置条件

如果你具备下面这些基础，推进会更顺：

- 会写基础 Go 程序
- 知道 TCP 连接、进程服务和环境变量这些基本概念
- 对 HTTP、RPC、异步消息三者的区别有初步理解

如果你目标是做生产级异步链路，这条学习线建议和 Go 工程文章一起看，而不是孤立看消息队列本身。
