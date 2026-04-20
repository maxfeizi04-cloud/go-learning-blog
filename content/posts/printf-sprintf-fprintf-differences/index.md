+++
title = "Printf、Sprintf、Fprintf 到底有什么区别"
date = 2026-04-20T15:40:00+08:00
draft = true
summary = "把 Printf、Sprintf、Fprintf 放在“结果最终去哪了”这个角度对比：一个写标准输出，一个返回字符串，一个写 io.Writer。顺着这个差异去看控制台、缓冲区、文件和 HTTP 响应，会更容易选对。"
tags = ["fmt", "standard-library", "writer", "string"]
series = ["Go 标准库与接口"]
slug = "printf-sprintf-fprintf-differences"
+++

第一次看 `fmt.Printf`、`fmt.Sprintf`、`fmt.Fprintf` 时，很多人会记住“都是格式化输出”，但一到具体代码里还是容易拿错。

真正更稳的记法不是盯着名字，而是先问一句：格式化完成之后，这个结果最终要去哪里？

{{< callout type="tip" title="先记住一句话" >}}
三者的核心区别不是“格式化能力不同”，而是“输出目标不同”。
{{< /callout >}}

## 为什么这三个函数总是容易混

它们有三个共同点：

- 都使用同一套格式化占位符，比如 `%s`、`%d`、`%v`
- 都属于 `fmt` 包
- 都是在“把值按某种格式组织起来”

真正不同的，是格式化结果的落点：

- `Printf`：直接写到标准输出
- `Sprintf`：返回一个字符串
- `Fprintf`：写到你提供的 `io.Writer`

只要把这条主线抓住，很多选择其实很自然。

## 三者的核心区别

先看一组并排的代码：

```go
package main

import (
    "bytes"
    "fmt"
)

func main() {
    name := "gopher"

    fmt.Printf("hello, %s\n", name)

    message := fmt.Sprintf("hello, %s", name)
    fmt.Println(message)

    var buf bytes.Buffer
    _, _ = fmt.Fprintf(&buf, "hello, %s", name)
    fmt.Println(buf.String())
}
```

同样都是 `"hello, %s"`，区别只在结果写到了不同地方。

| 函数 | 结果去向 | 常见场景 |
| --- | --- | --- |
| `fmt.Printf` | 标准输出 | CLI 程序、临时调试、控制台打印 |
| `fmt.Sprintf` | 返回字符串 | 拼日志文案、错误文案、缓存 key、SQL 片段 |
| `fmt.Fprintf` | 指定 `io.Writer` | 文件、缓冲区、HTTP 响应、网络连接 |

## Printf：当你就是要往控制台打

`fmt.Printf` 最直接的使用场景，就是“我现在就要把内容打印出来”。

```go
fmt.Printf("user=%s age=%d\n", name, age)
```

它适合：

- 命令行程序的正常输出
- 本地调试时快速看变量
- 小工具脚本的进度信息

可以把它粗略理解成：`Printf` 已经帮你选好了输出目标，也就是标准输出。

从使用心智上看，它更像“立刻展示”，而不是“先组织文本，等会儿再决定怎么处理”。

## Sprintf：当你还不想写出去

`fmt.Sprintf` 不负责写，它只负责“把格式化后的结果返回给你”。

```go
cacheKey := fmt.Sprintf("user:%d:profile", userID)
msg := fmt.Sprintf("load user %d failed: %v", userID, err)
```

这个函数特别适合“后面还有别的动作”的场景，比如：

- 要把结果继续传给日志库
- 要作为错误信息的一部分返回
- 要写进 map key、缓存 key、SQL 或模板变量

也就是说，`Sprintf` 的重点不是“输出”，而是“拿到一个已经格式化好的字符串”。

如果你的下一步还是直接打印到控制台，那通常没必要先 `Sprintf` 再 `Println`，那样只是多绕了一层。

## Fprintf：当你想把输出目标抽象掉

`fmt.Fprintf` 最值得掌握的地方，是它把输出目标抽象成了 `io.Writer`。

函数签名可以近似理解成：

```go
func Fprintf(w io.Writer, format string, a ...any) (n int, err error)
```

也就是说，只要某个类型实现了 `Write(p []byte) (n int, err error)`，你就可以把它交给 `Fprintf`。

### 写到缓冲区

```go
var buf bytes.Buffer
_, _ = fmt.Fprintf(&buf, "name=%s score=%d", name, score)
```

### 写到文件

```go
file, err := os.Create("app.log")
if err != nil {
    return err
}
defer file.Close()

if _, err := fmt.Fprintf(file, "job=%s status=%s\n", jobID, status); err != nil {
    return err
}
```

### 写到 HTTP 响应

```go
func handler(w http.ResponseWriter, r *http.Request) {
    name := r.URL.Query().Get("name")
    _, _ = fmt.Fprintf(w, "hello, %s", name)
}
```

这里它的价值就很明显了：格式化逻辑没变，变的只是写入目标。

很多人第一次看到 `Fprintf` 会误以为这个 `F` 是 `File`，然后把它理解成“专门写文件的版本”。这其实会把它理解窄了。文件当然可以写，但真正更关键的是它面向的是 `io.Writer`，不是某一个具体设备。

## 返回值也值得一起记

这三个函数连返回值都在提醒你它们的职责不同：

```go
n, err := fmt.Printf("x=%d\n", 42)
s := fmt.Sprintf("x=%d", 42)
m, err := fmt.Fprintf(os.Stdout, "x=%d\n", 42)
```

- `Printf` 返回 `(n int, err error)`，因为它真的发生了写入
- `Sprintf` 返回 `string`，因为它只是生成字符串
- `Fprintf` 返回 `(n int, err error)`，因为它也真的发生了写入

这个差异在文件、网络、HTTP 响应这类场景里尤其重要。只要是真写出去，就可能失败；只要只是拼字符串，就不存在写入失败这个问题。

## 容易犯错的点

### 1. 先 Sprintf，再立刻 Println

像这样通常是多余的：

```go
fmt.Println(fmt.Sprintf("user=%d", userID))
```

如果你只是想输出到控制台，直接：

```go
fmt.Printf("user=%d\n", userID)
```

通常更直接。

### 2. 把 Fprintf 当成“只能写文件”

这会错过它最有价值的地方。`bytes.Buffer`、`http.ResponseWriter`、`net.Conn`、`os.File` 都能接。

### 3. 在需要 writer 的地方还自己手拼字符串

比如在 HTTP handler 里先 `Sprintf`，再 `w.Write([]byte(...))`，并不是错，但如果只是简单格式化输出，`Fprintf` 往往更顺手。

### 4. 忽略写入错误

往标准输出写时，很多人习惯忽略返回值问题不大；但如果写的是文件、网络连接或响应流，`err` 往往就值得认真处理。

## 我的总结

- 三者都会格式化，但落点不同
- `Printf` 适合直接输出到控制台
- `Sprintf` 适合先拿到字符串，再继续处理
- `Fprintf` 适合把同一套格式化逻辑写到任意 `io.Writer`
- 真正选型时，不要先想名字像不像，而要先想“结果最终要去哪”
