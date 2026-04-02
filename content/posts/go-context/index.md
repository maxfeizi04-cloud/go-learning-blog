+++
title = "用 context 管理请求生命周期"
date = 2026-04-02T09:00:00+08:00
draft = false
summary = "梳理 context 在超时控制、取消传播和请求链路中的基本用法，避免把它当作全局参数袋。"
tags = ["context", "concurrency", "web"]
series = ["Go 并发与控制流"]
slug = "go-context-lifecycle"
+++

`context` 的价值，不在于“多传一个参数”，而在于把请求的生命周期显式地传到函数边界上。

{{< callout type="tip" title="先记住一个原则" >}}
`context` 用来控制取消、超时和链路元数据，不要把业务可选参数都塞进去。
{{< /callout >}}

## 为什么要有 context

在 Web 服务里，一个请求往往会串起数据库、缓存、RPC 和下游 HTTP 调用。如果上游请求已经取消，或者超时已经发生，后续操作继续执行通常只是在浪费资源。

这个时候，`context.Context` 可以把“这个请求还是否有效”一路传下去。

## 最常用的两个能力

### 1. 超时控制

```go
ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
defer cancel()

err := service.FetchProfile(ctx, userID)
if err != nil {
    return err
}
```

### 2. 取消传播

上层 `cancel()` 之后，下游持有同一条上下文链的操作会收到 `Done()` 信号。

```go
select {
case <-ctx.Done():
    return ctx.Err()
case result := <-ch:
    return result.err
}
```

## 一些容易犯的错

### 不要把 context 存进 struct

推荐把它作为每个函数的第一个参数传进去，而不是在对象创建时缓存起来，否则生命周期会变得模糊。

### 不要传 nil

如果当前实在没有可用上下文，也应该传 `context.Background()` 或 `context.TODO()`。

### 不要滥用 Value

`context.WithValue` 更适合放 trace id、request id 这种链路信息，不适合存大量业务字段。

## 一个简单的调用链示例

```go
func Handler(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
    defer cancel()

    if err := QueryUser(ctx, 42); err != nil {
        http.Error(w, err.Error(), http.StatusGatewayTimeout)
        return
    }
}

func QueryUser(ctx context.Context, id int64) error {
    req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://example.com", nil)
    if err != nil {
        return err
    }

    _, err = http.DefaultClient.Do(req)
    return err
}
```

## 我的总结

- `context` 是生命周期控制工具，不是参数收纳盒
- 超时和取消要从入口尽早设置
- 下层库函数如果支持 `context`，优先传带超时的版本
