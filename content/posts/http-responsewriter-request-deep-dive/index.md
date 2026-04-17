+++
title = "读懂 w http.ResponseWriter, r *http.Request：Go HTTP 处理函数的核心入口"
date = 2026-04-17T10:30:00+08:00
draft = false
summary = "从请求读取、响应写出到常见误区，系统梳理 Handler 里最常见的两个参数到底代表什么，以及它们在 HTTP 流程里的角色。"
tags = ["http", "handler", "net-http", "web"]
series = ["Go Web 与接口设计"]
slug = "http-responsewriter-request-deep-dive"
+++

很多人第一次写 Go Web 服务，最常见的函数签名就是：

```go
func Handler(w http.ResponseWriter, r *http.Request)
```

看起来只有两个参数，但这两个参数几乎承载了一个 HTTP 请求处理过程里最核心的输入和输出。

## 背景

这个函数签名是 `net/http` 包的标准入口。它表达的是：

- `r`：当前这次 HTTP 请求带进来的所有信息
- `w`：你准备如何把响应写回客户端

如果把它们理解清楚，后面再看中间件、路由、JSON 接口和文件上传都会顺很多。

## 核心概念

### `r *http.Request` 代表什么

`r` 是一个请求对象，里面包含：

- 请求方法，如 `GET`、`POST`
- URL 路径和查询参数
- 请求头
- 请求体
- 请求上下文

也就是说，你要读“客户端到底发了什么”，基本都从 `r` 里拿。

最常见的几个字段：

```go
r.Method
r.URL.Path
r.URL.Query()
r.Header.Get("Content-Type")
r.Body
r.Context()
```

### `w http.ResponseWriter` 代表什么

`w` 是响应写出接口。它负责把你的处理结果发回客户端。

它最核心的事情有三件：

- 写响应头
- 写状态码
- 写响应体

例如：

```go
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusOK)
_, _ = w.Write([]byte(`{"ok":true}`))
```

## 一个最小可运行示例

```go
package main

import (
    "fmt"
    "net/http"
)

func Handler(w http.ResponseWriter, r *http.Request) {
    name := r.URL.Query().Get("name")
    if name == "" {
        name = "guest"
    }

    w.Header().Set("Content-Type", "text/plain; charset=utf-8")
    w.WriteHeader(http.StatusOK)
    _, _ = fmt.Fprintf(w, "hello, %s", name)
}
```

这段代码里：

- 从 `r.URL.Query()` 读取查询参数
- 用 `w.Header()` 设置响应头
- 用 `w.WriteHeader()` 设置状态码
- 最后把正文写出去

## `ResponseWriter` 最容易踩的点

### 1. 状态码一旦写出，就很难回头改

如果你已经调用了：

```go
w.WriteHeader(http.StatusOK)
```

后面再想改成 `500` 就晚了。

更常见的是：你没有显式调用 `WriteHeader`，但先调用了 `Write`。这时 Go 会默认把状态码当成 `200 OK` 发出去。

```go
_, _ = w.Write([]byte("hello")) // 隐式写出 200
```

所以如果你需要明确控制状态码，最好先写头、再写 body。

### 2. Header 必须在写 body 之前设置

这一点和状态码一样，一旦 body 开始写出，很多响应头就已经来不及改了。

错误示例：

```go
_, _ = w.Write([]byte("hello"))
w.Header().Set("Content-Type", "text/plain")
```

正确顺序应该是：

```go
w.Header().Set("Content-Type", "text/plain")
_, _ = w.Write([]byte("hello"))
```

## `Request` 最容易踩的点

### 1. `Body` 不是随便反复读的

`r.Body` 通常是一个流，读过一次以后位置就往后走了。很多场景下你不能假设它能反复读取。

### 2. 取消、超时要看 `r.Context()`

如果客户端断开连接，或者上游超时，很多底层操作会通过 `r.Context()` 传播取消信号。

这也是为什么下游数据库、HTTP 调用最好都带上：

```go
ctx := r.Context()
```

## 实战里经常怎么配合

最常见的处理流程其实很固定：

1. 从 `r` 里读路径、参数、header、body
2. 做校验和业务处理
3. 用 `w` 设置响应头和状态码
4. 把结果写回去

例如 JSON API 通常会这样写：

```go
func JSONHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
        return
    }

    w.Header().Set("Content-Type", "application/json; charset=utf-8")
    w.WriteHeader(http.StatusOK)
    _, _ = w.Write([]byte(`{"message":"ok"}`))
}
```

## 我的总结

- `r *http.Request` 代表请求输入
- `w http.ResponseWriter` 代表响应输出
- 读请求看 `r`，写响应看 `w`
- 设置 header 和状态码要早于写 body
- `r.Body` 通常不是可重复消费的数据源
- 真正把这两个参数吃透后，再看中间件、路由、JSON 编解码会轻松很多
