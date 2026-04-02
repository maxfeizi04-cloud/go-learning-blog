+++
title = "二分查找的边界写法：左闭右闭与左闭右开"
date = 2026-04-02T17:00:00+08:00
draft = false
summary = "把最容易写错的二分边界问题拆开讲清楚，帮助自己从背模板变成真正理解循环不变量。"
tags = ["algorithm", "binary-search", "boundary", "array"]
series = ["算法与数据结构"]
slug = "binary-search-boundary"
isAlgorithm = true
difficulty = "medium"
difficulties = ["medium"]
source = "LeetCode"
problemId = "704"
+++

## 题目

二分查找本身不难，真正容易出错的是边界：到底是 `left <= right`，还是 `left < right`？更新时到底写 `mid+1`、`mid-1` 还是 `mid`？

## 题目分析

二分题最核心的不是公式，而是循环不变量。也就是说，你必须能解释清楚：当前搜索区间里，哪些位置仍然“可能是答案”。

一旦区间定义和更新规则不一致，代码就很容易死循环或者漏掉答案。

## 方法一：直觉解法

最常见的一种写法是左闭右闭区间 `[left, right]`。

```go
func binarySearch(nums []int, target int) int {
    left, right := 0, len(nums)-1
    for left <= right {
        mid := left + (right-left)/2
        if nums[mid] == target {
            return mid
        }
        if nums[mid] < target {
            left = mid + 1
        } else {
            right = mid - 1
        }
    }
    return -1
}
```

## 方法二：优化思路

如果题目是“找第一个满足条件的位置”“找最后一个不满足条件的位置”这类边界型问题，我更倾向于用左闭右开区间 `[left, right)`，因为更新逻辑更统一。

```go
func binarySearch(nums []int, target int) int {
    left, right := 0, len(nums)
    for left < right {
        mid := left + (right-left)/2
        if nums[mid] == target {
            return mid
        }
        if nums[mid] < target {
            left = mid + 1
        } else {
            right = mid
        }
    }
    return -1
}
```

## Go 实现

如果只是做普通查找，我会优先选择左闭右闭，因为更直观；如果是边界查找题，我会更自然地切到左闭右开。

## 复杂度分析

- 时间复杂度：`O(log n)`
- 空间复杂度：`O(1)`

## 易错点

- `mid` 不要写成 `(left+right)/2`，极端情况下可能溢出
- 边界更新必须和区间定义完全匹配
- 空数组、单元素数组要顺手脑补一遍

## 我的复盘

很多时候二分查找写不对，不是没见过模板，而是没有始终用同一个区间模型思考。以后我会先写出“区间含义”，再写更新规则。

## 关联题

- 搜索插入位置
- 在排序数组中查找元素的第一个和最后一个位置
- 寻找峰值