+++
title = "滑动窗口入门：无重复字符的最长子串"
date = 2026-04-03T11:00:00+08:00
draft = false
summary = "用经典滑动窗口题目建立“左边缩、右边扩”的基本思路，重点理解窗口何时失效、何时更新答案。"
tags = ["algorithm", "array", "hash-table", "sliding-window", "leetcode"]
series = ["算法与数据结构"]
slug = "sliding-window-longest-substring"
isAlgorithm = true
difficulty = "medium"
difficulties = ["medium"]
source = "LeetCode"
problemId = "3"
+++

## 题目

给定一个字符串，求不含重复字符的最长子串长度。

## 题目分析

这题最核心的不是枚举所有子串，而是维护一个始终“合法”的窗口。

所谓合法，就是窗口内没有重复字符。只要这个条件被破坏，就移动左边界把窗口收缩回来。

## 方法一：直觉解法

最直觉的做法是枚举所有子串，再判断是否有重复字符。这个思路容易想到，但复杂度会比较差。

## 方法二：优化思路

滑动窗口的关键动作是：

- 右指针不断向右扩张
- 一旦出现重复字符，左指针向右收缩
- 每次窗口合法时更新答案

一般会配一个哈希表来记录字符出现次数。

## Go 实现

```go
func lengthOfLongestSubstring(s string) int {
    counter := make(map[byte]int)
    left, ans := 0, 0

    for right := 0; right < len(s); right++ {
        counter[s[right]]++
        for counter[s[right]] > 1 {
            counter[s[left]]--
            left++
        }
        if width := right - left + 1; width > ans {
            ans = width
        }
    }

    return ans
}
```

## 复杂度分析

- 时间复杂度：`O(n)`
- 空间复杂度：`O(k)`，`k` 为字符集大小

## 易错点

- 更新答案要放在窗口已经恢复合法之后
- 左指针不是机械右移，而是要在“重复被消除”之前持续移动

## 我的复盘

滑动窗口看起来像技巧题，但本质上是在维护一个动态约束区间。把“窗口合法条件”想清楚，这类题就会稳定很多。