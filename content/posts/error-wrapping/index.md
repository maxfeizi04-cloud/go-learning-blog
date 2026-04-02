+++
title = "用 errors.Is 和 errors.As 组织错误处理"
date = 2026-03-31T21:10:00+08:00
draft = false
summary = "从 %w、errors.Is、errors.As 的配合方式入手，理清 Go 里“保留上下文”和“稳定判断错误”的正确姿势。"
tags = ["errors", "api", "engineering"]
series = ["Go 工程化实践"]
slug = "error-wrapping-patterns"
+++

写 Go 一段时间之后，几乎一定会遇到一个问题：错误信息写得越详细，业务层越难稳定判断；只返回裸错误，又丢失上下文。

Go 1.13 之后的错误包装机制，就是用来解决这个矛盾的。

## 为什么不能只靠字符串比对

很多项目早期会写出这种代码：

```go
if err != nil && strings.Contains(err.Error(), "not found") {
    // ...
}
```

它的问题很明显：

- 错误文案一改，判断就失效
- 上下文一多，字符串更不稳定
- 第三方库返回格式不同，很难统一

更稳的方式，是把“判断依据”建立在错误链结构上，而不是错误文本上。

## %w 的作用是什么

`fmt.Errorf("query user: %w", err)` 会把原始错误包进去，形成一条错误链。

这样你既能补充上下文，又不丢失底层错误身份。

```go
if err := repo.Find(ctx, id); err != nil {
    return fmt.Errorf("load profile %d: %w", id, err)
}
```

## errors.Is 什么时候用

当你关心的是“这是不是某一类错误”时，用 `errors.Is`。

```go
if errors.Is(err, sql.ErrNoRows) {
    return ErrUserNotFound
}
```

它会沿着整条错误链往下查，所以即使中间包了很多层，也还能命中原始错误。

## errors.As 什么时候用

当你想把错误还原成某种具体类型，并读取更多字段时，用 `errors.As`。

```go
type ValidationError struct {
    Field string
    Msg   string
}

func (e *ValidationError) Error() string {
    return e.Field + ": " + e.Msg
}

var verr *ValidationError
if errors.As(err, &verr) {
    fmt.Println("field:", verr.Field)
}
```

## 工程里常见的一层翻译

比较常见的做法是：

- 基础设施层返回底层错误
- service 层补足业务语义
- handler 层只根据稳定错误做状态码映射

```go
func (s *Service) GetUser(ctx context.Context, id int64) (*User, error) {
    user, err := s.repo.Get(ctx, id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, fmt.Errorf("user %d: %w", id, ErrUserNotFound)
        }
        return nil, fmt.Errorf("user %d: %w", id, err)
    }
    return user, nil
}
```

这样上层就不需要知道 repo 到底用了 `sql`、`gorm` 还是别的实现。

## 不要过度包装

并不是每一层都必须 `fmt.Errorf("xxx: %w", err)`。

如果当前层没有增加新上下文，只是单纯把错误继续往上抛，直接 `return err` 往往更清晰。过度包装会让错误链非常长，阅读日志时反而费劲。

## 我的总结

- 用 `%w` 叠加上下文，不要丢底层错误身份
- 用 `errors.Is` 判断类别，用 `errors.As` 取具体类型
- 错误判断要面向稳定语义，不要面向字符串文案
- 真正有信息增量时再包装，别把每层都变成“套娃”