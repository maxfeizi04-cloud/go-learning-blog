+++
title = "单调栈入门：用下一个更大元素理解模板"
date = 2026-04-02T16:00:00+08:00
draft = false
summary = "用“下一个更大元素”这道典型题建立单调栈模板，重点讲清楚为什么栈里存下标，以及什么时候弹栈。"
tags = ["algorithm", "monotonic-stack", "array", "template"]
series = ["算法与数据结构"]
slug = "monotonic-stack-next-greater"
isAlgorithm = true
difficulty = "medium"
+++

## 题目

给定一个数组，求每个位置右侧第一个比它大的元素。如果不存在，返回 `-1`。

## 题目分析

如果每个位置都往右扫一次，时间复杂度就是 `O(n^2)`。真正的优化点在于：一旦某个元素已经被“更大值”盖过去了，它就没必要再参与后续比较。

单调栈的价值就在这里，它能帮我们高效维护“还没找到答案”的元素。

## 方法一：直觉解法

最朴素的办法是双重循环：

- 外层枚举每个位置
- 内层向右找第一个更大值

这种方法简单，但一旦数据量上来就很慢。

## 方法二：优化思路

我们维护一个“还没有找到答案”的下标栈，并让这些下标对应的值保持单调递减。

当遇到一个更大的新元素时：

- 如果栈顶比它小，说明栈顶的答案已经出现
- 不断弹栈，直到栈为空或者栈顶比它大

## Go 实现

```go
func nextGreater(nums []int) []int {
    ans := make([]int, len(nums))
    for i := range ans {
        ans[i] = -1
    }

    stack := make([]int, 0, len(nums))
    for i, num := range nums {
        for len(stack) > 0 && nums[stack[len(stack)-1]] < num {
            top := stack[len(stack)-1]
            stack = stack[:len(stack)-1]
            ans[top] = num
        }
        stack = append(stack, i)
    }

    return ans
}
```

## 复杂度分析

- 时间复杂度：`O(n)`，每个元素最多入栈出栈一次
- 空间复杂度：`O(n)`

## 易错点

- 结果数组要先初始化为 `-1`
- 栈里最好存下标，不要直接存值
- 写代码前先想清楚你维护的是单调递增栈还是单调递减栈

## 我的复盘

单调栈最容易让人困惑的地方不是代码，而是“为什么它能做到不回头”。这次真正想清楚后，我觉得关键就在于：被弹出的元素，其答案已经确定了。

## 关联题

- 每日温度
- 接雨水
- 柱状图中最大的矩形