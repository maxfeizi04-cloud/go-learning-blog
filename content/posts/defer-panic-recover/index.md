+++
title = "把 defer、panic、recover 放到一张图里理解"
date = 2026-03-24T22:10:00+08:00
draft = false
summary = "用调用顺序和最小示例梳理 defer 的执行时机、panic 的传播路径，以及 recover 真正生效的边界。"
tags = ["defer", "panic", "recover"]
series = ["Go 语言核心机制"]
slug = "defer-panic-recover"
+++

`defer`、`panic`、`recover` 经常一起出现，但如果只把它们当成三个孤立知识点，就很容易在真实代码里写出半懂不懂的恢复逻辑。

## 先抓主线

- `defer`：函数返回前执行
- `panic`：中断当前正常流程，沿调用栈向上展开
- `recover`：只能在 `defer` 里拦住当前 goroutine 的 panic

## defer 是后进先出

```go
func main() {
    defer fmt.Println("first")
    defer fmt.Println("second")
    fmt.Println("body")
}
```

输出顺序是：

```text
body
second
first
```

这点在释放资源时很好用，因为你可以按“获取资源”的顺序写代码，最终会按相反顺序清理。

## panic 发生后会怎样

当函数里发生 panic，当前函数不会继续往下执行，但已经注册的 `defer` 仍然会执行。然后 panic 继续向上冒泡。

```go
func main() {
    defer fmt.Println("cleanup")
    panic("boom")
}
```

## recover 什么时候有效

只有在 `defer` 触发的函数里调用 `recover()`，并且当前 goroutine 正在发生 panic，它才会真正拿到值。

```go
func main() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("recovered:", r)
        }
    }()

    panic("boom")
}
```

## 它不能做什么

### 不能跨 goroutine recover

一个 goroutine 里的 `recover`，拦不住另一个 goroutine 的 panic。每个 goroutine 都要自己兜底。

### 不适合把 panic 当普通错误流

业务分支错误应该返回 `error`。`panic/recover` 更适合处理真正的“不该发生”的状态，或者在框架层做最后一道保护。

## Web 服务里常见的用法

HTTP 中间件里经常会用 `recover` 防止某个 handler 的 panic 直接把整个服务打崩，然后统一记日志、返回 500。

但这层兜底的意义是“保住进程”，不是鼓励业务代码随便 `panic`。

## 我的总结

- `defer` 是资源回收和收尾逻辑的自然落点
- panic 会触发 defer，再沿调用栈继续传播
- `recover` 只在 defer 中、只对当前 goroutine 生效
- 日常业务错误优先返回 `error`，不要把 panic 当流程控制