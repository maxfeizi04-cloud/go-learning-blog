1. 第 1 天：理解 gRPC 是什么，读 [Introduction to gRPC](https://grpc.io/docs/what-is-grpc/introduction/) 和 [gRPC Documentation](https://grpc.io/docs/)。做什么：写下 gRPC、REST、消息队列三者的区别。验收：你能解释为什么 gRPC 适合服务间通信。

三者的核心区别在于：gRPC 和 REST 都主要是“服务直接调用”，而“消息队列”是“通过中间队列异步传递消息”。

| 项目     | gRPC                     | REST                     | 消息队列                     |
| :------- | :----------------------- | :----------------------- | :--------------------------- |
| 本质     | RPC 调用                 | 资源式 HTTP API          | 异步消息传递                 |
| 通信方式 | 同步为主，也支持流式     | 同步请求-响应            | 异步为主                     |
| 协议     | HTTP/2                   | 通常 HTTP/1.1 或 HTTP/2  | 依赖 MQ 协议和中间件         |
| 数据格式 | Protobuf                 | 通常 JSON                | 任意消息体                   |
| 性能     | 高，适合内部服务         | 一般，易调试易兼容       | 吞吐高，解耦强               |
| 可读性   | 较低，不适合直接人工查看 | 高，浏览器/Postman 友好  | 取决于消息内容               |
| 耦合方式 | 调用方依赖服务方接口     | 调用方依赖 HTTP API      | 生产者和消费者解耦           |
| 典型场景 | 微服务内部通信           | 对外开放 API、前后端交互 | 异步任务、削峰填谷、事件驱动 |

可以这样理解：

- gRPC：像“函数调用远程服务”，强调高性能、强类型、低延迟。
- REST：像“通过 URL 操作资源”，强调通用性、易理解、生态成熟。
- 消息队列：像“发消息到邮箱，别人稍后处理”，强调异步、解耦、可靠传递。

常见使用场景：

- 内部微服务通信：优先 gRPC
- 对外提供开放接口：优先 REST
- 下单后发短信、发邮件、生成报表：优先 消息队列

一句话总结：

- 要“立刻拿结果”用 gRPC 或 REST
- 要“先发出去，稍后处理”用 消息队列

gRPC 适合服务间通信，核心原因是它更符合“机器调用机器”的场景，而不是“人调用接口”的场景。

主要有这几个点：

1. 性能高
   gRPC 默认用 HTTP/2 + Protobuf。
   Protobuf 是二进制格式，比 JSON 更小、更快；HTTP/2 支持多路复用，减少连接开销，所以很适合高并发、低延迟的内部调用。
2. 接口约束强
   gRPC 先用 .proto 定义服务和消息结构，再生成客户端和服务端代码。
   这意味着接口是强类型、明确的，字段、方法、返回值都提前约定好，能减少“文档写的是一套，实际接口又是一套”的问题。
3. 多语言协作方便
   微服务体系里常常不同服务用不同语言实现。
   gRPC 可以从同一份 .proto 生成 Go、Java、Python、Node.js 等多种语言代码，跨语言通信成本低。
4. 更像本地调用
   调用方式接近“调用一个远程函数”，比 REST 里手动拼 URL、处理 HTTP 方法、解析 JSON 更直接。
   对内部服务开发来说，心智负担更低，开发效率更高。
5. 天然支持流式通信
   gRPC 不只是普通请求-响应，还支持：
   - 服务端流
   - 客户端流
   - 双向流

这对日志流、实时推送、长连接数据同步这类服务间场景很有价值，REST 做起来通常更绕。

1. 更适合可控的内部环境
   gRPC 对浏览器、人工调试、开放生态不如 REST 友好，但服务间通信通常发生在内部网络中，调用双方都由团队控制。
   这时“高性能、强约束、自动生成代码”的收益，比“人类可读、通用易调试”更重要。

一句话说就是：

gRPC 适合服务间通信，因为内部服务更看重性能、类型安全、接口一致性和跨语言协作，而这些正是 gRPC 的强项。



1. 第 2 天：理解 Protocol Buffers 基础，读 [Protocol Buffers Docs](https://protobuf.dev/) 和 [Go Tutorial](https://protobuf.dev/getting-started/gotutorial/)。做什么：写一个最小 hello.proto。验收：知道 message、字段号、标量类型是什么意思。
2. 第 3 天：学习 package、go_package、生成规则，读 [Go Generated Code Guide](https://protobuf.dev/reference/go/go-generated/)。做什么：手动跑一遍 protoc、--go_out、--go-grpc_out。验收：能解释你前面遇到的 unable to determine Go import path。
3. 第 4 天：安装并跑通官方 Go 示例，读 [Go Quick Start](https://grpc.io/docs/languages/go/quickstart/)。做什么：本地成功启动一个 server 和 client。验收：client 能收到 server 响应。
4. 第 5 天：学习 Go 版基础教程，读 [Go Basics Tutorial](https://grpc.io/docs/languages/go/basics/)。做什么：照着做一次 unary RPC。验收：你能说清生成的 pb.go 和 grpc.pb.go 分别负责什么。
5. 第 6 天：自己从零重写 Hello World，不抄教程。做什么：删掉示例代码，自己创建 proto、server、client。验收：你不看教程也能重新搭起来。
6. 第 7 天：复盘第一周。做什么：写一页笔记，总结 proto -> codegen -> server -> client 的完整链路。验收：你能在 5 分钟内口述整个流程。
7. 第 8 天：系统学 proto 字段设计。读 [Programming Guides](https://protobuf.dev/programming-guides/) 和 [Style Guide](https://protobuf.dev/programming-guides/style/)。做什么：为 User、Order 设计 2 个 message。验收：字段命名、编号、包名规范正确。
8. 第 9 天：学习 repeated、map、enum。做什么：给 Order 增加状态枚举和商品列表。验收：能正确生成并在 Go 中访问这些字段。

1. 第 10 天：学习 optional、presence、oneof，读 [Field Presence](https://protobuf.dev/programming-guides/field_presence/)。做什么：设计一个“手机号或邮箱二选一”的更新请求。验收：你知道什么时候该用 oneof。
2. 第 11 天：学习 schema 演进。做什么：模拟一次接口升级，新增字段但不破坏旧客户端。验收：你能解释为什么 tag 不能复用、不能随便删。
3. 第 12 天：开始第一个业务服务 user-service。做什么：实现 CreateUser、GetUser、ListUsers。验收：三个 RPC 都能跑通。
4. 第 13 天：开始第二个业务服务 order-service。做什么：实现 CreateOrder、GetOrder。验收：client 能独立访问两个服务。
5. 第 14 天：复盘第二周。做什么：整理出“好 proto 的 10 条规则”。验收：以后新建 proto 时能按规则自查。
6. 第 15 天：学习四种 RPC 模式。回看 [Go Basics Tutorial](https://grpc.io/docs/languages/go/basics/)。做什么：在 user-service 新增一个 server streaming RPC。验收：client 能持续接收多条消息。
7. 第 16 天：做 client streaming。做什么：实现一个批量上传或批量创建接口。验收：server 能汇总客户端流数据后一次返回。
8. 第 17 天：做 bidirectional streaming。做什么：实现一个简化版聊天流或事件订阅流。验收：双方能边发边收。
9. 第 18 天：学习 context 和取消。做什么：在 streaming 场景下处理中断、超时、客户端取消。验收：你能避免 goroutine 泄漏。
10. 第 19 天：学习 deadline，读 [Deadlines](https://grpc.io/docs/guides/deadlines/)。做什么：给所有 client 调用加超时。验收：你能在 server 端观察到超时取消行为。
11. 第 20 天：学习错误处理，读 [Error Handling](https://grpc.io/docs/guides/error/) 和 [Status Codes](https://grpc.io/docs/guides/status-codes/)。做什么：把业务错误改成标准 gRPC status code。验收：区分 NotFound、InvalidArgument、Unavailable。
12. 第 21 天：复盘第三周。做什么：画出 4 种 RPC 模式的调用时序图。验收：你知道每种模式最适合什么业务。
13. 第 22 天：学习 metadata，读 [Metadata](https://grpc.io/docs/guides/metadata/)。做什么：传递 request-id 和简单 token。验收：server 能读取 metadata，client 能收到 trailer。
14. 第 23 天：学习 interceptor，读 [Interceptors](https://grpc.io/docs/guides/interceptors/)。做什么：实现 unary 日志拦截器。验收：每个请求都有结构化日志。
15. 第 24 天：继续 interceptor。做什么：实现鉴权拦截器和 recovery 思路。验收：未授权请求被统一拦截。
16. 第 25 天：学习 TLS 与认证，读 [Authentication](https://grpc.io/docs/guides/auth/)。做什么：用本地自签证书开启 TLS。验收：纯明文连接失败，TLS 连接成功。
17. 第 26 天：学习 reflection，读 [Reflection](https://grpc.io/docs/guides/reflection/)。做什么：开启 reflection，并安装 [grpcurl](https://github.com/fullstorydev/grpcurl)。验收：你能用 grpcurl list 和 describe 查看服务。
18. 第 27 天：学习健康检查，读 [Health Checking](https://grpc.io/docs/guides/health-checking/)。做什么：注册 health service。验收：grpcurl 能看到健康状态，客户端能据此判断服务是否可用。
19. 第 28 天：学习优雅停机，读 [Graceful Shutdown](https://grpc.io/docs/guides/server-graceful-stop/)。做什么：实现 SIGINT/SIGTERM 下的 graceful stop。验收：服务关闭时不粗暴中断正在处理的请求。
20. 第 29 天：学习 keepalive、性能与观测，读 [Keepalive](https://grpc.io/docs/guides/keepalive/)、[Performance Best Practices](https://grpc.io/docs/guides/performance/)、[Flow Control](https://grpc.io/docs/guides/flow-control/)、[OpenTelemetry Metrics](https://grpc.io/docs/guides/opentelemetry-metrics/)。做什么：至少理解连接复用、长连接、背压。验收：你能解释为什么不是所有场景都该用 streaming。
21. 第 30 天：做一个结业项目。做什么：完成一个带 proto、codegen、interceptor、deadline、status code、TLS、reflection、health、graceful shutdown 的小系统。验收：你能不用教程，从空目录搭出一个可维护的 gRPC Go 项目。