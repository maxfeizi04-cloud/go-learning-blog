+++
title = "WaitGroup 详解：计数、等待与常见误用"
date = 2026-04-06T10:30:00+08:00
draft = false
summary = "从 Add、Done、Wait 的语义出发，系统梳理 sync.WaitGroup 的工作方式、适用场景和最常见的误用。"
tags = ["waitgroup", "concurrency", "sync", "goroutine"]
series = ["Go 并发与控制流"]
slug = "waitgroup-deep-dive"
+++

很多 Go 初学者第一次接触 `sync.WaitGroup`，会把它理解成“等待 goroutine 结束的小工具”。这个理解方向没错，但如果只停在这个层面，后面很容易在计数时机、复用方式和错误传播上踩坑。

{{< callout type="tip" title="先记住一句话" >}}
`WaitGroup` 只负责“等待一组任务结束”，不负责取消、错误收集或并发上限控制。
{{< /callout >}}

## WaitGroup 到底在做什么

它的核心模型其实非常直接：

- `Add(n)`：把待完成任务数加上 `n`
- `Done()`：表示一个任务结束，本质上等价于 `Add(-1)`
- `Wait()`：阻塞，直到计数归零

也就是说，`WaitGroup` 本质上是一个“任务计数器”，而不是 goroutine 本身的管理器。

## 最常见的基本写法

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    var wg sync.WaitGroup

    for i := 0; i < 3; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            fmt.Println("worker", id)
        }(i)
    }

    wg.Wait()
}
```

这段代码里最关键的关系是：

- 每启动一个 goroutine 之前先 `Add(1)`
- goroutine 结束时一定会执行 `Done()`
- 主流程最后 `Wait()`

## 为什么 Add 通常要放在启动 goroutine 之前

因为如果你把 `Add(1)` 放到 goroutine 里面，就会产生竞态窗口：

- 主协程可能已经执行到 `Wait()`
- 但子 goroutine 还没来得及 `Add(1)`

这时程序就可能提前结束等待，逻辑直接失真。

错误示例：

```go
go func() {
    wg.Add(1) // 不推荐
    defer wg.Done()
    work()
}()
wg.Wait()
```

更稳的写法始终是：

```go
wg.Add(1)
go func() {
    defer wg.Done()
    work()
}()
```

## Done 为什么最好配合 defer

因为一旦函数里提前 return、panic 或中途加了分支，手动调用 `Done()` 很容易漏。

所以最常见的稳定写法就是：

```go
go func() {
    defer wg.Done()
    work()
}()
```

这样“任务开始时登记，任务结束时结算”的结构会非常清晰。

## WaitGroup 不适合解决什么问题

### 1. 不适合做错误收集

`WaitGroup` 本身不传递错误。如果并发任务有错误结果，你需要额外准备：

- `errCh`
- 共享错误变量加锁
- 或者直接换成 `errgroup`

### 2. 不适合做取消控制

如果任务需要超时、取消、主动中止，那应该配合 `context`，而不是指望 `WaitGroup` 帮你停掉 goroutine。

### 3. 不适合限制并发数

`WaitGroup` 只能等，不会限制同时运行多少个任务。要限流通常要配合：

- worker pool
- 带缓冲 channel
- semaphore

## 常见误区

### 误区一：计数加多了或减少了

如果 `Add` 和 `Done` 不对称：

- 少 `Done()` 会让 `Wait()` 永远卡住
- 多 `Done()` 或 `Add(-1)` 过头，会直接 panic

### 误区二：把 WaitGroup 复制传值

`WaitGroup` 不能在使用中被复制。最常见的稳妥方式是：

- 用同一个变量
- 需要传递时传指针

例如：

```go
func runTask(wg *sync.WaitGroup) {
    defer wg.Done()
}
```

### 误区三：还没等上一轮结束，就开始复用

`WaitGroup` 可以复用，但前提是上一轮任务已经彻底结束，也就是 `Wait()` 已经返回。否则逻辑会变得非常难推理。

## 一个稍完整的示例

下面这个版本更接近真实项目里“并发拉取数据后统一收尾”的模式：

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func main() {
    var wg sync.WaitGroup
    results := make(chan string, 3)

    tasks := []string{"profile", "orders", "settings"}
    for _, task := range tasks {
        task := task
        wg.Add(1)
        go func() {
            defer wg.Done()
            time.Sleep(100 * time.Millisecond)
            results <- "loaded " + task
        }()
    }

    go func() {
        wg.Wait()
        close(results)
    }()

    for result := range results {
        fmt.Println(result)
    }
}
```

这里 `WaitGroup` 负责等待所有生产者结束，真正的“消费结束信号”还是通过 `close(results)` 表达出来。

## 我的总结

- `WaitGroup` 的本质是任务计数器，不是 goroutine 管理框架
- `Add` 通常要放在启动 goroutine 之前
- `Done` 最好配合 `defer`
- 它不负责错误、取消和限流
- 真正稳定的并发代码，通常是 `WaitGroup` 和 `context`、channel、worker pool 一起配合使用
