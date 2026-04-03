+++
title = "带冷冻期的股票买卖：动态规划状态为什么要拆这么细"
date = 2026-04-03T18:45:00+08:00
draft = false
summary = "这题是动态规划里很典型的状态设计题，重点是把“持有”“卖出”“冷冻”几种状态拆清楚。"
tags = ["algorithm", "dynamic-programming", "dp", "leetcode"]
series = ["算法与数据结构"]
slug = "stock-with-cooldown-dp"
isAlgorithm = true
difficulty = "medium"
difficulties = ["medium"]
source = "LeetCode"
problemId = "309"
+++

## 题目

给定股票价格数组，你可以多次交易，但卖出股票后第二天不能立刻再买入，问最大收益。

## 题目分析

这题不难想到“每天都做决策”，难的是状态不能只写成“买或不买”。

因为“刚卖出”这个状态会直接影响下一天是否允许买入，所以必须把状态拆细。

## 方法一：直觉解法

如果只用“持有 / 不持有”两个状态，冷冻期信息会丢失，转移很容易写错。

## 方法二：优化思路

更清晰的拆法是：

- `hold`：当天结束时持有股票
- `sold`：当天刚卖出股票
- `rest`：当天结束时不持有且不在卖出当日

这样冷冻期就能自然表达出来。

## Go 实现

```go
func maxProfit(prices []int) int {
    if len(prices) == 0 {
        return 0
    }

    hold := -prices[0]
    sold := 0
    rest := 0

    for i := 1; i < len(prices); i++ {
        prevHold, prevSold, prevRest := hold, sold, rest
        hold = max(prevHold, prevRest-prices[i])
        sold = prevHold + prices[i]
        rest = max(prevRest, prevSold)
    }

    return max(sold, rest)
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

- `sold` 表示的是“当天刚卖出”，不是所有不持有状态
- `hold` 的转移要从 `rest` 来，不能直接从 `sold` 来，因为冷冻期不允许次日买入

## 我的复盘

这题让我再次确认，动态规划里很多难点根本不在实现，而在状态设计。一旦状态拆得不够细，转移式就会看起来“差一点对”。