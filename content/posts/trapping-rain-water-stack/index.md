+++
title = "接雨水：单调栈怎样把凹槽面积一层层算出来"
date = 2026-04-03T18:30:00+08:00
draft = false
summary = "接雨水是单调栈的进阶题，重点不只是会写代码，而是理解为什么弹栈时刚好能确定一个凹槽的面积。"
tags = ["algorithm", "monotonic-stack", "array", "leetcode"]
series = ["算法与数据结构"]
slug = "trapping-rain-water-stack"
isAlgorithm = true
difficulty = "hard"
difficulties = ["hard"]
source = "LeetCode"
problemId = "42"
+++

## 题目

给定一个表示柱子高度的数组，求下雨后最多能接多少雨水。

## 题目分析

这题难点不在公式，而在于“什么时候一个凹槽的面积已经可以确定”。

单调栈的核心思路是：当你遇到一个更高的右边界时，就可能把中间某个低谷的蓄水量结算出来。

## 方法一：直觉解法

最朴素的想法是：对每个位置分别找左侧最高和右侧最高，再算当前位置能装多少水。这能做，但需要额外数组。

## 方法二：优化思路

用单调递减栈存下标。当当前柱子更高时：

- 栈顶会作为“凹槽底部”被弹出
- 新栈顶是左边界
- 当前下标是右边界

这时一个局部凹槽的宽和高都可以算出来。

## Go 实现

```go
func trap(height []int) int {
    stack := make([]int, 0, len(height))
    ans := 0

    for i := 0; i < len(height); i++ {
        for len(stack) > 0 && height[i] > height[stack[len(stack)-1]] {
            bottom := stack[len(stack)-1]
            stack = stack[:len(stack)-1]
            if len(stack) == 0 {
                break
            }
            left := stack[len(stack)-1]
            width := i - left - 1
            boundedHeight := min(height[left], height[i]) - height[bottom]
            ans += width * boundedHeight
        }
        stack = append(stack, i)
    }

    return ans
}

func min(a, b int) int {
    if a < b {
        return a
    }
    return b
}
```

## 复杂度分析

- 时间复杂度：`O(n)`
- 空间复杂度：`O(n)`

## 易错点

- 弹出底部后，如果栈空了，说明左边界不存在，这一层不能结算
- 高度要用左右边界较小值减去底部高度

## 我的复盘

接雨水这题真正让我吃透了单调栈的“局部结算”思想。很多时候不是一次算完整答案，而是等条件成熟时把一部分答案结掉。