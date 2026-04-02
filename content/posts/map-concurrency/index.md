+++
title = "为什么 map 不是并发安全的"
date = 2026-03-27T22:00:00+08:00
draft = false
summary = "从运行时行为和常见替代方案出发，理解 Go map 在并发读写下为什么会出问题，以及该如何选择保护策略。"
tags = ["map", "concurrency", "sync"]
series = ["Go 并发与控制流"]
slug = "map-concurrency-safety"
+++

Go 的 `map` 很好用，但它有一个非常明确的边界：默认不是并发安全的。

这不是“性能差一点”的问题，而是可能直接触发运行时错误的问题。

## 最常见的报错

```text
fatal error: concurrent map writes
```

或者是：

```text
fatal error: concurrent map read and map write
```

运行时会在一部分危险场景下主动检测并报错，但不要把这个检测当成保护网。真正的问题是，只要多个 goroutine 没有同步地访问同一个 `map`，程序行为就不再可靠。

## 为什么 map 不能随便并发读写

因为 `map` 在插入、扩容、迁移 bucket 时会修改内部结构。如果这时候另一个 goroutine 同时在读或写，就可能看到不一致状态。

你可以把它理解成：`map` 的内部实现为了性能做了很多原地调整，但这些调整默认没有加锁。

## 几种常见解决方案

### 1. 用 mutex 包住普通 map

这是最常见、也最容易推理的方式。

```go
type Counter struct {
    mu sync.RWMutex
    m  map[string]int
}

func (c *Counter) Inc(key string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.m[key]++
}

func (c *Counter) Get(key string) int {
    c.mu.RLock()
    defer c.mu.RUnlock()
    return c.m[key]
}
```

### 2. 用单 goroutine 串行拥有 map

如果你的业务天然是事件流模型，也可以让一个 goroutine 独占 map，其它协程通过 channel 发命令过去。

这种方式的优点是状态边界非常清晰。

### 3. 特定场景下用 sync.Map

`sync.Map` 不是普通 map 的无脑替代。它更适合：

- 读多写少
- key 集合比较稳定
- 多 goroutine 独立读写、很难统一加锁

如果你的场景是频繁更新的业务状态，普通 `map + mutex` 往往更直观。

## 一个容易忽略的点

“只有一个写 goroutine，多个读 goroutine”也不安全。因为只要存在写入，就必须和读同步。

## 我的总结

- 原生 `map` 默认不保证并发安全
- 只要存在并发写，或者读写并发，就需要同步
- 最通用的解法是 `map + sync.RWMutex`
- `sync.Map` 有适用边界，不要把它当成银弹