+++
title = "理解 goroutine 调度器的基本模型"
date = 2026-03-28T21:00:00+08:00
draft = false
summary = "从 G、M、P 三个角色理解 goroutine 为什么轻量，以及常见并发场景里调度器在做什么。"
tags = ["goroutine", "scheduler", "runtime"]
series = ["Go 并发与控制流"]
slug = "goroutine-scheduler-model"
+++

很多人第一次接触 goroutine，会把它理解成“更轻的线程”。这个说法方向没错，但只说到了一半。

## G、M、P 是什么

- `G`：goroutine，本质上是要执行的任务
- `M`：machine，底层工作线程
- `P`：processor，调度上下文，负责把待运行的 `G` 分配给 `M`

理解这三个角色以后，再看“为什么 goroutine 创建成本低”“为什么网络阻塞不一定卡死所有任务”，就会更顺。

## 一个直觉模型

你可以把 `P` 想成调度工位，`M` 是工人，`G` 是等待执行的工单。

当一个 goroutine 因为系统调用阻塞时，运行时会尽量把其他可执行任务切走，避免整个程序只剩下干等。

## 学习时值得观察的点

### Goroutine 很多时，程序为什么还能跑

因为 goroutine 初始栈很小，运行时还会按需扩容，所以它比操作系统线程轻量得多。

### CPU 密集和 IO 密集的表现为什么不同

调度器能隐藏不少 IO 等待，但 CPU 密集任务最终还是受内核线程和 CPU 核数限制。

### GOMAXPROCS 到底影响什么

它大体上决定同时有多少个 `P` 在工作，也就影响了可并行执行 Go 代码的上限。

## 一个最小实验

```go
package main

import (
    "fmt"
    "runtime"
    "sync"
)

func main() {
    runtime.GOMAXPROCS(2)

    var wg sync.WaitGroup
    for i := 0; i < 5; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            fmt.Println("worker", id)
        }(i)
    }
    wg.Wait()
}
```

## 我的总结

先建立 `G-M-P` 模型，再去看抢占、work stealing、syscall 让渡，会轻松很多。
