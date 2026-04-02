+++
title = "从 append 看 slice 的容量增长"
date = 2026-03-26T21:40:00+08:00
draft = false
summary = "通过 len、cap 和底层数组共享关系，理解 append 为什么有时会原地修改、有时会悄悄复制出新切片。"
tags = ["slice", "memory", "performance"]
series = ["Go 内存与性能"]
slug = "slice-capacity-growth"
+++

`s` 是 Go 里最常见的数据结构之一，但很多“看似诡异”的行为，其实都能用 `len`、`cap` 和底层数组共享关系解释清楚。

## slice 本身不存数据

一个 slice 可以粗略理解为三元组：

- 指向底层数组的指针
- 长度 `len`
- 容量 `cap`

所以复制一个 slice 变量，复制的不是整份数据，而是这三个描述字段。

## append 为什么有时会影响原切片

如果底层数组还有剩余容量，`append` 可能直接在原数组后面写入。

```go
base := []int{1, 2, 3}
a := base[:2]
b := append(a, 9)
fmt.Println(base) // 可能变成 [1 2 9]
fmt.Println(b)    // [1 2 9]
```

这里的关键不是变量名，而是 `a` 和 `base` 仍然共享同一块底层数组。

## append 什么时候会分配新数组

当容量不够时，运行时会申请更大的数组，把旧数据复制过去，再把新元素追加进去。

这时返回的新 slice 就和原数组“分家”了。

```go
s := make([]int, 0, 1)
s = append(s, 1)
t := append(s, 2) // 很可能触发扩容
```

## 为什么这和性能有关

如果你提前知道大概会放多少元素，最好预估容量，减少多次扩容和数据拷贝。

```go
items := make([]string, 0, 1000)
for _, v := range source {
    items = append(items, v)
}
```

这类预分配在热点路径、批量处理和序列化逻辑里很常见。

## 子切片为什么容易“意外持有大对象”

另一个常见问题是：从一个很大的 slice 里切出一个很小的子切片，但底层仍引用整块大数组，导致内存迟迟不释放。

```go
small := big[:10]
```

如果 `small` 生命周期很长，而 `big` 非常大，就可能造成额外内存占用。这时可以考虑显式复制一份。

```go
small = append([]byte(nil), big[:10]...)
```

## 我的总结

- slice 是对底层数组的视图，不是独立容器
- `append` 是否原地写入，取决于容量是否足够
- 共享底层数组会带来性能优势，也会带来修改联动
- 知道目标规模时，预分配容量通常是值得的