+++
title = "bufio.Reader 详解：缓冲读取、窥视与逐段消费"
date = 2026-04-03T14:30:00+08:00
draft = false
summary = "从缓冲层的作用、常用方法到使用边界，系统梳理 bufio.Reader 在 Go 标准库里的定位和实战写法。"
tags = ["bufio", "io", "reader", "standard-library"]
series = ["Go 标准库与接口"]
slug = "bufio-reader-deep-dive"
+++

## 背景

如果 `io.Reader` 解决的是“统一输入抽象”的问题，那 `bufio.Reader` 解决的就是“读取效率和读取便利性”的问题。

它的核心价值主要有两类：

- 减少底层小块读取带来的系统调用开销
- 提供更方便的按字节、按行、按分隔符读取能力

## 核心概念

最常见的创建方式是：

```go
reader := bufio.NewReader(r)
```

这里的 `r` 可以是任何实现了 `io.Reader` 的对象。

### 它为什么更高效

`bufio.Reader` 内部会维护一个缓冲区。调用方如果频繁做小块读取：

- 底层并不是每次都重新向文件或网络要数据
- 很多读取动作会直接命中内存里的缓冲区

这在逐字节解析协议、逐行处理文本时尤其重要。

## 常用方法

### ReadString / ReadBytes

适合按分隔符读数据，比如按换行读取：

```go
line, err := reader.ReadString('\n')
```

### ReadByte

适合实现自定义解析器或状态机：

```go
b, err := reader.ReadByte()
```

### Peek

适合“先看一眼、暂不消费”的场景：

```go
head, err := reader.Peek(4)
```

这在解析协议头、判断文件前缀时很好用。

### UnreadByte

适合你读多了一字节，想退回去重新解析：

```go
b, _ := reader.ReadByte()
_ = reader.UnreadByte()
```

但它不是任意回退工具，通常只支持退回最近一次成功读取的那个字节。

## 示例代码

下面是一个按行读取文本的例子：

```go
package main

import (
    "bufio"
    "fmt"
    "io"
    "strings"
)

func main() {
    src := "first line\nsecond line\n"
    reader := bufio.NewReader(strings.NewReader(src))

    for {
        line, err := reader.ReadString('\n')
        if len(line) > 0 {
            fmt.Printf("line=%q\n", line)
        }
        if err == io.EOF {
            break
        }
        if err != nil {
            panic(err)
        }
    }
}
```

## 使用时的边界

### 不是所有读取都该包 bufio.Reader

如果你本来就是一次性整块读取，或者底层已经有缓冲，再额外包一层未必有明显收益。

### 不要和底层 Reader 交替读

如果你已经创建了 `bufio.Reader`，就尽量通过它来读，不要又去直接读底层 `r`。否则缓冲区里的状态和底层位置会失去同步。

### Peek 看到的是缓冲里的视图

拿到 `Peek` 的结果后，不要假设它能长期持有。后续继续读取可能会让这块底层缓冲被覆盖。

## 我的总结

- `bufio.Reader` 的本质是“带缓冲的 Reader 包装器”
- 它既优化读取效率，也提供了更友好的逐段读取接口
- `ReadString`、`Peek`、`ReadByte` 都很常用，但要清楚各自语义
- 创建了 `bufio.Reader` 后，尽量不要和底层 Reader 混着读
- 它非常适合文本解析、协议解析和逐行消费场景