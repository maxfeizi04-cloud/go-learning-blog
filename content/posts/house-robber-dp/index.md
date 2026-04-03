+++
title = "打家劫舍：从线性 DP 到状态压缩"
date = 2026-04-03T12:30:00+08:00
draft = false
summary = "打家劫舍是动态规划里非常典型的一题，适合练习“选或不选当前元素”这种状态转移模式。"
tags = ["algorithm", "dynamic-programming", "dp", "leetcode"]
series = ["算法与数据结构"]
slug = "house-robber-dp"
isAlgorithm = true
difficulty = "medium"
difficulties = ["medium"]
source = "LeetCode"
problemId = "198"
+++

## 题目

给定一个非负整数数组，表示每间房屋存放的金额。不能偷相邻的房屋，问最多能偷多少钱。

## 题目分析

这题很适合练“当前元素选或不选”的动态规划模型。

当考虑第 `i` 个位置时：

- 选它：那就不能选 `i-1`
- 不选它：那就沿用前一个状态

## 方法一：直觉解法

最朴素的思路通常是递归枚举，但会有大量重复子问题。

## 方法二：优化思路

设 `dp[i]` 表示考虑前 `i` 间房屋时能获得的最大金额，则：

```text
dp[i] = max(dp[i-1], dp[i-2] + nums[i])
```

含义非常直接：

- 不偷当前房屋：答案是 `dp[i-1]`
- 偷当前房屋：答案是 `dp[i-2] + nums[i]`

## Go 实现

```go
func rob(nums []int) int {
    if len(nums) == 0 {
        return 0
    }
    if len(nums) == 1 {
        return nums[0]
    }

    prev2, prev1 := nums[0], max(nums[0], nums[1])
    for i := 2; i < len(nums); i++ {
        cur := max(prev1, prev2+nums[i])
        prev2 = prev1
        prev1 = cur
    }
    return prev1
}

func max(a, b int) int {
    if a > b {
        return a
    }
    return b
}
```

## 复杂度分析

- 时间复杂度：`O(n)`
- 空间复杂度：`O(1)`

## 易错点

- 空数组和单元素数组要单独处理
- `dp[i-2] + nums[i]` 表示的是“选当前”而不是“选前一个”

## 我的复盘

这题让我把“状态压缩”理解得更具体了：并不是所有 DP 都要保留整张表，关键是看当前状态到底依赖几个历史状态。