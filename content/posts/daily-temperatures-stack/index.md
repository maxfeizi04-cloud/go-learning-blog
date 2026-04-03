+++
title = "每日温度：单调栈为什么适合等下一个更大值"
date = 2026-04-03T12:00:00+08:00
draft = false
summary = "用每日温度这道题进一步巩固单调栈：为什么存下标、为什么可以一次遍历解决、以及答案为什么是距离而不是值。"
tags = ["algorithm", "monotonic-stack", "array", "leetcode"]
series = ["算法与数据结构"]
slug = "daily-temperatures-stack"
isAlgorithm = true
difficulty = "medium"
difficulties = ["medium"]
source = "LeetCode"
problemId = "739"
+++

## 题目

给定每日温度数组，返回每一天还要等多少天才能遇到更高温度。如果之后都不会升高，就返回 `0`。

## 题目分析

这题和“下一个更大元素”本质很像，只是这次要求的不是更大值本身，而是与当前位置之间的距离。

所以单调栈仍然适用，而且栈里必须存下标。

## 方法一：直觉解法

最直接的办法是对每一天向右找第一个更高温度，复杂度是 `O(n^2)`。

## 方法二：优化思路

维护一个单调递减栈：

- 栈里存还没找到更高温度的下标
- 当前温度如果更高，就不断弹出栈顶
- 弹出时顺便计算距离 `i - top`

## Go 实现

```go
func dailyTemperatures(temperatures []int) []int {
    ans := make([]int, len(temperatures))
    stack := make([]int, 0, len(temperatures))

    for i, temp := range temperatures {
        for len(stack) > 0 && temperatures[stack[len(stack)-1]] < temp {
            top := stack[len(stack)-1]
            stack = stack[:len(stack)-1]
            ans[top] = i - top
        }
        stack = append(stack, i)
    }

    return ans
}
```

## 复杂度分析

- 时间复杂度：`O(n)`
- 空间复杂度：`O(n)`

## 易错点

- 栈里必须存下标，不然没法回填距离
- 未被弹出的元素答案默认就是 `0`

## 我的复盘

这题让我真正吃透了单调栈的“延迟结算”思路：答案不是立刻得出，而是在未来某个更强信号出现时一次性结算。