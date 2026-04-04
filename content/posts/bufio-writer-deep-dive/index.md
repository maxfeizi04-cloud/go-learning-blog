+++
title = "bufio.Writer 详解：为什么写完以后要 Flush"
date = 2026-04-04T10:30:00+08:00
draft = false
summary = "从缓冲写入的作用、Flush 的必要性到和底层 Writer 的边界，系统梳理 bufio.Writer 的实战用法。"
tags = ["bufio", "io", "writer", "standard-library"]
series = ["Go 标准库与接口"]
slug = "bufio-writer-deep-dive"
+++

## 背景

如果 `bufio.Reader` 解决的是“读取时的缓冲与便利性”，那 `bufio.Writer` 对应解决的就是“写入时的缓冲与批量输出”。

它最常见的价值有两点：

- 把很多小写入合并，减少底层调用开销
- 提供一个明确的缓冲写出层，让调用方自己决定何时真正刷出数据

## 核心概念

最常见的创建方式是：

```go
writer := bufio.NewWriter(w)
```

这里的 `w` 可以是任何实现了 `io.Writer` 的对象。

### 它为什么更高效

如果你的代码频繁做小块写入，直接写到底层目标可能会产生很多次底层调用。`bufio.Writer` 会先把这些写入积累到缓冲区，等条件合适时再一次性刷出去。

这在文本输出、协议拼装、日志聚合这类场景里很常见。

## 最重要的一件事：Flush

`bufio.Writer` 最经典的坑就是：

- 你调用了 `Write`
- 程序也没报错
- 但目标里看不到完整输出

原因通常就是：你忘了 `Flush()`。

```go
if err := writer.Flush(); err != nil {
    return err
}
```

如果你不 `Flush`，缓冲区里的数据可能还停在内存里，没有真正写到底层目标。

## 示例代码

```go
package main

import (
    "bufio"
    "bytes"
    "fmt"
)

func main() {
    var buf bytes.Buffer
    writer := bufio.NewWriter(&buf)

    _, _ = writer.WriteString("hello")
    _, _ = writer.WriteString(", writer")

    fmt.Println("before flush:", buf.String())
    _ = writer.Flush()
    fmt.Println("after flush:", buf.String())
}
```

这段代码最能说明 `bufio.Writer` 的真实语义：`WriteString` 成功，不代表底层目标已经立刻拿到了最终数据。

## 使用边界

### 不要和底层 Writer 混着写

如果你已经创建了 `bufio.Writer`，就尽量统一通过它写，不要一会儿写缓冲层，一会儿又直接写底层 `w`。否则输出顺序和缓冲状态很容易变得难以推理。

### Flush 通常应该显式处理错误

`Flush` 不是形式动作，它是真正把缓冲内容写到底层的关键步骤，所以它失败时不能忽略错误。

### 不是所有写入都值得加 bufio.Writer

如果本来就是一次性大块输出，再额外套一层缓冲未必有明显收益。它更适合高频小写入场景。

## 我的总结

- `bufio.Writer` 是带缓冲的 `io.Writer` 包装器
- 它最重要的价值是减少小写入的底层开销
- 使用它时最容易踩的坑就是忘记 `Flush`
- 创建了 `bufio.Writer` 后，尽量不要和底层 Writer 混着写
- 它非常适合文本输出、协议拼装和批量写出场景