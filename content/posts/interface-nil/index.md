+++
title = "搞懂 interface 里的 nil 陷阱"
date = 2026-03-30T20:20:00+08:00
draft = false
summary = "解释为什么“看起来是 nil”的接口值并不等于 nil，并用具体例子梳理接口底层的类型和值语义。"
tags = ["interface", "nil", "language"]
series = ["Go 语言核心机制"]
slug = "interface-nil-trap"
+++

Go 里有一个特别经典、也特别容易在面试和线上代码里同时出现的问题：明明返回的是 `nil`，为什么外层判断 `err != nil` 还是成立？

## 先看一个例子

```go
type MyError struct{}

func (e *MyError) Error() string { return "boom" }

func f() error {
    var err *MyError = nil
    return err
}
```

很多人会直觉觉得 `f()` 返回的是 `nil`。但实际结果是：返回值不等于 `nil`。

## 为什么会这样

接口值在底层可以理解成两部分：

- 动态类型
- 动态值

只有“类型和值都为 nil”的接口，才等于 `nil`。

在上面的例子里：

- 动态类型是 `*MyError`
- 动态值是 `nil`

所以它不是一个“空接口值”，而是“携带了具体类型，但具体值为空”的接口值。

## 这对 error 特别重要

因为 `error` 本身就是接口，所以最常见的坑就是函数内部返回了一个“typed nil”。

```go
func f() error {
    var err *MyError
    return err
}

func main() {
    if err := f(); err != nil {
        fmt.Println("unexpected non-nil")
    }
}
```

## 正确姿势是什么

如果函数签名返回 `error`，那你在表示“没有错误”时，最好直接返回字面量 `nil`。

```go
func f(ok bool) error {
    if ok {
        return nil
    }
    return &MyError{}
}
```

## 接口调试时怎么快速定位

当你怀疑掉进这个坑时，可以打印类型和值：

```go
fmt.Printf("type=%T value=%v\n", err, err)
```

如果输出看起来像 `type=*main.MyError value=<nil>`，那几乎就可以确定是 typed nil。

## 更广一点的理解

这个问题不只出现在 `error` 上，只要是接口，都可能发生。

例如某个函数返回 `io.Reader`、`any`、自定义接口，只要你把一个空指针赋给接口变量，都可能出现“值为空但接口不为空”的情况。

## 我的总结

- 接口是否为 `nil`，取决于“动态类型 + 动态值”是否都为空
- `(*T)(nil)` 赋给接口后，接口通常不等于 `nil`
- 返回 `error` 时，表示成功就直接 `return nil`
- 一旦怀疑有问题，先打印 `%T`，往往很快就能看清真相