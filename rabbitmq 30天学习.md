这份计划按 30 天、每天 60~120 分钟 设计，默认你用 Go + RabbitMQ 4.2.x 学习。它基于 RabbitMQ 官方当前 4.2.5 文档和 4.x 教程来排顺序；如果你以后装的是别的版本，先在官方文档右上角切到对应版本再学。

建议你的固定节奏是：30 分钟读资料、45 分钟写 demo、15 分钟复盘。每天都产出一个可运行的小目录和一页 README，不要只看不写。

**30 天计划**

**第 1 周：先把模型和 6 个基础教程跑通**

1. Day 1：安装 RabbitMQ、启用 Management、登录 Web UI，学会看 connections、channels、queues、exchanges；Demo 是本地启动 broker 并创建一个 study vhost 和测试用户；资料看 Docs、Tutorials、Management；完成标准是你能打开 http://localhost:15672 并解释 UI 里每个核心菜单做什么。
2. Day 2：只学核心概念，不写复杂代码，弄清 producer、consumer、exchange、queue、binding、routing key、vhost、connection、channel；Demo 是画一张消息流转图并手动在 UI 里建一个 exchange 和 queue；资料看 How to Use RabbitMQ、Exchanges、Queues、Channels、Vhosts；完成标准是你能解释“为什么生产者逻辑上是发给 exchange，而不是直接发给 queue”。
3. Day 3：写第一个 Go 生产者和消费者，跑通最简单的单队列收发；Demo 是 hello 队列的一发一收；资料看 T1 和 amqp091-go；完成标准是你能用 Go 发一条消息、收一条消息，并知道 Dial -> Channel -> QueueDeclare -> Publish/Consume 这条基本路径。
4. Day 4：学习工作队列和竞争消费，理解“一个消息只被一个 worker 处理”；Demo 是两个 worker 抢同一个 task_queue；资料看 T2、Queues、Consumer Prefetch；完成标准是你能观察到消息在两个 worker 之间分配，而不是广播。
5. Day 5：学习 fanout exchange 和广播；Demo 是一个日志发送端，两个接收端同时收到同一条消息；资料看 T3、Exchanges；完成标准是你能解释“工作队列”和“发布订阅”的根本差异。
6. Day 6：学习 direct exchange 和路由键；Demo 是按日志级别把 info、warning、error 分发到不同消费者；资料看 T4、Exchanges；完成标准是你能用 routing key 做精确路由。
7. Day 7：学习 topic exchange 和模式匹配；Demo 是按 order.created、order.timeout、stock.release 这样的 key 做订阅；资料看 T5、Exchanges；完成标准是你能解释 * 和 # 的区别，并给你的秒杀系统设计 5 个 topic key。

**第 2 周：可靠性和消费控制**

1. Day 8：学习 RPC 模式，但重点不是“喜欢它”，而是知道它的边界；Demo 是一个简单的库存查询 RPC；资料看 T6；完成标准是你能说清什么时候该用同步 RPC，什么时候更该用异步消息。
2. Day 9：系统学习队列属性：durable、exclusive、auto-delete、server-named queue；Demo 是做一个临时回复队列和一个持久工作队列；资料看 Queues；完成标准是你能独立选择“这个场景该用临时队列还是持久队列”。

1. Day 10：学习消费确认 ack、拒绝 nack/reject、重回队列 requeue；Demo 是让消费者故意失败一次，观察 redelivery；资料看 Confirms、Reliability；完成标准是你能解释“消息为什么会重复投递”。
2. Day 11：学习 prefetch，控制未确认消息上限；Demo 是同样 100 条任务分别在 prefetch=1 和 prefetch=50 下跑一遍，比较吞吐和公平性；资料看 Consumer Prefetch、T2；完成标准是你知道为什么很多 worker 场景先从 prefetch=1 开始。
3. Day 12：学习 publisher confirms。截至 2026-04-18，官方 Tutorials 第 7 章没有 Go 版本，所以这天直接用官方 Confirms 指南加 amqp091-go 仓库示例；Demo 是“发布后只有收到 confirm 才算成功”；资料看 Confirms、amqp091-go；完成标准是你能区分“客户端 write 成功”和“broker 已接管消息”。
4. Day 13：做可靠性实验：重启 broker、杀掉消费者、网络断开后重连；Demo 是记录消息是否丢失、是否重复、是否 redeliver；资料看 Reliability、amqp091-go；完成标准是你写出一页“哪些故障由 RabbitMQ 兜底，哪些要业务自己兜底”。
5. Day 14：做一个小项目 1，建议是“异步订单创建”或“异步图片处理”；要求带 durable queue、手动 ack、prefetch、publisher confirm；资料复用本周内容；完成标准是你把第 1、2 周知识真正串起来，而不是碎片化记忆。

**第 3 周：失败处理、重试、幂等**

1. Day 15：学习 TTL，区分消息 TTL 和队列 TTL；Demo 是给测试消息设置过期时间并观察其消失；资料看 TTL、Queues；完成标准是你知道 TTL 不是“定时任务”，只是过期控制。
2. Day 16：学习死信交换机 DLX；Demo 是消费失败后把消息打入死信队列；资料看 DLX；完成标准是你能把业务失败消息和正常消息流隔离开。
3. Day 17：做“延迟重试链路”；Demo 是 main queue -> fail -> retry queue(TTL) -> DLX -> main queue；资料看 TTL、DLX；完成标准是你能实现“5 秒后重试、最多 3 次”。
4. Day 18：做“毒消息停车场”；Demo 是连续失败超过阈值后进入 parking_lot 队列，不再无限重试；资料看 DLX、Quorum Queues；完成标准是你能解释为什么不能让坏消息永远 requeue。
5. Day 19：学习消费者幂等；Demo 是用 MySQL 唯一键或 Redis 去重键，确保重复投递不产生重复订单；资料看 Reliability；完成标准是你能实现“至少一次投递 + 业务幂等”的组合。
6. Day 20：学习 Go 客户端的连接恢复边界。amqp091-go 官方明确不负责自动重连和拓扑重建，这部分要应用自己做；Demo 是写一个最小重连包装层，断线后重建 connection、channel、exchange、queue、consumer；资料看 amqp091-go；完成标准是你理解“客户端库不做自动恢复”不是缺陷，而是把拓扑一致性决策留给业务。
7. Day 21：做一个小项目 2，直接贴近你的场景：把“秒杀下单异步化”抽成 RabbitMQ worker；至少包含 order.create 主队列、重试队列、死信队列、幂等键；完成标准是你能回答“如果 worker 写库失败，消息、库存、订单状态怎么协同处理”。

**第 4 周：队列类型、Streams、运维与生产化**

1. Day 22：学习队列类型，先搞清 classic queue、quorum queue、stream 的边界；Demo 是写一页场景对照表：订单任务、通知广播、审计日志分别选什么；资料看 Queues、Quorum Queues、Streams；完成标准是你能清楚说出“订单类关键任务优先考虑 quorum queue 的理由”。
2. Day 23：上手 quorum queue；Demo 是把前面的主工作队列改成 quorum queue，观察声明方式和行为差异；资料看 Quorum Queues；完成标准是你知道 quorum queue 更偏数据安全，但吞吐和资源模型跟 classic 不一样。
3. Day 24：开始学 Streams，不把它和普通队列混在一起；Demo 是跑通 Go Stream Hello World；资料看 S1、Streams、stream-go-client；完成标准是你理解 stream 是“可重复读取的追加日志”，不是普通消费后删除的队列。
4. Day 25：学习 stream offset tracking 和 replay；Demo 是消费一批消息后退出，再从上次 offset 继续；资料看 S2、Streams；完成标准是你能解释为什么日志回放、审计、事件溯源更适合 stream。
5. Day 26：学习多租户与权限控制；Demo 是创建 study-dev 和 study-prod 两个 vhost，给不同用户不同权限；资料看 Vhosts、Access Control；完成标准是你不再在所有环境里混用默认 / vhost 和 guest 用户。
6. Day 27：学习 policy，把 TTL、DLX、长度限制从代码里拿出来；Demo 是不改应用代码，只通过 policy 给某类队列加 TTL 和死信；资料看 Policies、Queues；完成标准是你理解 RabbitMQ 官方为什么推荐“能用 policy 的地方，优先用 policy”。
7. Day 28：学习监控；Demo 是接上 Prometheus，至少观察 ready、unacked、发布速率、投递速率、消费者状态；资料看 Management、Prometheus；完成标准是你能凭指标判断“是生产过快、消费过慢，还是消费者卡死”。
8. Day 29：学习集群和跨地域思路，但这天以认知为主；Demo 是写一页“单机、集群、Federation/Shovel 的使用边界”；资料看 Clustering；完成标准是你知道 RabbitMQ 集群主要是局域网场景，不要把它当跨地域消息总线随便拉长。
9. Day 30：做最终项目和总复盘；建议你实现一个完整的“订单异步处理子系统”：生产者、工作队列、confirm、manual ack、prefetch、TTL 重试、DLQ、幂等、监控；完成标准是你写出自己的 RabbitMQ 学习笔记，内容至少包括“模型图、可靠性策略、重试策略、队列类型选择、线上排障指标”。

**你每天固定要写的东西**

- 一个可运行 demo。
- 一个 README，写清消息流向、关键配置和失败路径。
- 一段“今天我踩了什么坑”的记录。
- 一个“如果这是生产环境，我还差什么”的清单。

**资料索引**

- Docs：[RabbitMQ 4.2 Documentation](https://www.rabbitmq.com/docs)
- Tutorials：[RabbitMQ Tutorials](https://www.rabbitmq.com/tutorials)
- How to Use RabbitMQ：[How to Use RabbitMQ](https://www.rabbitmq.com/docs/use-rabbitmq)
- T1：[Go Tutorial 1: Hello World](https://www.rabbitmq.com/tutorials/tutorial-one-go)
- T2：[Go Tutorial 2: Work Queues](https://www.rabbitmq.com/tutorials/tutorial-two-go)
- T3：[Go Tutorial 3: Publish/Subscribe](https://www.rabbitmq.com/tutorials/tutorial-three-go)
- T4：[Go Tutorial 4: Routing](https://www.rabbitmq.com/tutorials/tutorial-four-go)
- T5：[Go Tutorial 5: Topics](https://www.rabbitmq.com/tutorials/tutorial-five-go)
- T6：[Go Tutorial 6: RPC](https://www.rabbitmq.com/tutorials/tutorial-six-go)
- S1：[Go Stream Tutorial 1: Hello World](https://www.rabbitmq.com/tutorials/tutorial-one-go-stream)
- S2：[Go Stream Tutorial 2: Offset Tracking](https://www.rabbitmq.com/tutorials/tutorial-two-go-stream)
- Exchanges：[Exchanges](https://www.rabbitmq.com/docs/exchanges)
- Queues：[Queues](https://www.rabbitmq.com/docs/queues)
- Channels：[Channels](https://www.rabbitmq.com/docs/channels)
- Vhosts：[Virtual Hosts](https://www.rabbitmq.com/docs/vhosts)
- Consumer Prefetch：[Consumer Prefetch](https://www.rabbitmq.com/docs/consumer-prefetch)
- Confirms：[Consumer Acknowledgements and Publisher Confirms](https://www.rabbitmq.com/docs/confirms)
- Reliability：[Reliability Guide](https://www.rabbitmq.com/docs/reliability)
- TTL：[Time-To-Live and Expiration](https://www.rabbitmq.com/docs/ttl)
- DLX：[Dead Letter Exchanges](https://www.rabbitmq.com/docs/dlx)
- Quorum Queues：[Quorum Queues](https://www.rabbitmq.com/docs/quorum-queues)
- Streams：[Streams and Superstreams](https://www.rabbitmq.com/docs/streams)
- Management：[Management Plugin](https://www.rabbitmq.com/docs/management)
- Policies：[Policies](https://www.rabbitmq.com/docs/policies)
- Access Control：[Authentication, Authorisation, Access Control](https://www.rabbitmq.com/docs/access-control)
- Prometheus：[Monitoring with Prometheus and Grafana](https://www.rabbitmq.com/docs/prometheus)
- Clustering：[Clustering Guide](https://www.rabbitmq.com/docs/clustering)
- amqp091-go：[rabbitmq/amqp091-go](https://github.com/rabbitmq/amqp091-go)
- tutorials-repo：[rabbitmq/rabbitmq-tutorials](https://github.com/rabbitmq/rabbitmq-tutorials)
- stream-go-client：[rabbitmq/rabbitmq-stream-go-client](https://github.com/rabbitmq/rabbitmq-stream-go-client)