+++
title = "用 worker pool 控制并发度"
date = 2026-03-25T20:50:00+08:00
draft = false
summary = "从最小实现出发，解释 worker pool 为什么适合限流、批处理和后台任务，并梳理它最容易写坏的几个点。"
tags = ["worker-pool", "concurrency", "pattern"]
series = ["Go 并发与控制流"]
slug = "worker-pool-pattern"
+++

goroutine 很轻量，但“轻量”不等于“无限开”。一旦任务量上来，不受控地起 goroutine 很容易把下游数据库、CPU 或第三方 API 一起打爆。

这时候，`worker pool` 是最常用的限流模型之一。

## 核心思想

- 准备一个任务队列
- 启动固定数量的 worker
- 每个 worker 从队列里取任务执行
- 主流程等待所有任务完成

```go
jobs := make(chan int)
var wg sync.WaitGroup

for i := 0; i < 4; i++ {
    wg.Add(1)
    go func(id int) {
        defer wg.Done()
        for job := range jobs {
            fmt.Println("worker", id, "job", job)
        }
    }(i)
}
```

## 为什么它比“每个任务一个 goroutine”更稳

因为系统同时运行的任务数有了上限。你把上限设成 4，就意味着无论队列里堆了多少任务，真正并发执行的都只有 4 个。

## 一个完整点的收尾方式

```go
for _, job := range []int{1, 2, 3, 4, 5, 6} {
    jobs <- job
}
close(jobs)
wg.Wait()
```

这里的关闭动作很关键。worker 的循环通常是 `for job := range jobs`，所以你必须在任务发完后关闭通道，它们才能自然退出。

## 实战里常加的能力

### 超时和取消

worker 执行外部调用时，最好带上 `context`，这样任务不需要时能及时中止。

### 错误收集

可以单独准备一个 `errCh`，或者用 `errgroup` / 聚合器收集处理结果。

### 背压

如果 `jobs` 是有缓冲通道，缓冲区大小也在影响系统行为。缓冲过大时，生产者可能一次性堆太多任务；过小时，又可能过早阻塞。

## 我的总结

- worker pool 的目标不是“更快”，而是“可控”
- 它特别适合限流、批处理、后台消费
- 收尾时别忘了关闭任务通道并等待 worker 退出
- 如果任务会访问外部系统，记得把 `context` 一起传进去