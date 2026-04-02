+++
title = "快速判断变量是否逃逸"
date = 2026-04-01T22:30:00+08:00
draft = false
summary = "用编译参数快速观察 Go 变量是否发生逃逸，适合写性能实验时做第一轮判断。"
tags = ["performance", "compiler", "memory"]
series = []
slug = "escape-analysis"
+++

Go 里想快速看逃逸分析结果，最常用的是：

```bash
go build -gcflags="-m"
```

如果想看得更详细一点：

```bash
go build -gcflags="-m -m"
```

一个最小例子：

```go
func newUser() *User {
    u := User{Name: "codex"}
    return &u
}
```

通常这种返回局部变量地址的场景，会让变量逃逸到堆上。

判断时不要只盯“是否逃逸”，还要看：

- 这个对象是否真的在热点路径上
- 堆分配次数是否明显增加
- GC 压力是否真的上来了
