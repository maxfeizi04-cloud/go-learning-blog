+++
title = "最小覆盖子串：滑动窗口里“刚好满足”怎么维护"
date = 2026-04-03T18:00:00+08:00
draft = false
summary = "这道题是滑动窗口进阶版，关键不是单纯扩缩窗口，而是维护“覆盖要求是否满足”和“什么时候可以继续收缩”。"
tags = ["algorithm", "sliding-window", "hash-table", "leetcode"]
series = ["算法与数据结构"]
slug = "minimum-window-substring"
isAlgorithm = true
difficulty = "hard"
difficulties = ["hard"]
source = "LeetCode"
problemId = "76"
+++

## 题目

给定字符串 `s` 和 `t`，在 `s` 中找出包含 `t` 所有字符的最短子串。

## 题目分析

这题不是普通的“最长合法窗口”，而是“最短满足窗口”。难点在于：

- 你要先判断窗口什么时候已经满足要求
- 满足后，还要尽可能继续缩小窗口

所以它比“无重复字符的最长子串”多了一层“覆盖计数”的管理。

## 方法一：直觉解法

最直接的办法是枚举所有子串，再检查是否覆盖 `t`。这显然能做，但复杂度会非常高。

## 方法二：优化思路

核心思路还是滑动窗口，但要维护两个计数：

- `need`：目标字符串里每个字符需要多少次
- `window`：当前窗口里每个字符已有多少次

当窗口已经满足所有需求时：

- 尝试移动左边界缩小窗口
- 每次缩之前更新当前最优答案

## Go 实现

```go
func minWindow(s string, t string) string {
    if len(t) == 0 || len(s) < len(t) {
        return ""
    }

    need := make(map[byte]int)
    for i := 0; i < len(t); i++ {
        need[t[i]]++
    }

    window := make(map[byte]int)
    valid := 0
    left := 0
    bestStart, bestLen := 0, len(s)+1

    for right := 0; right < len(s); right++ {
        ch := s[right]
        if _, ok := need[ch]; ok {
            window[ch]++
            if window[ch] == need[ch] {
                valid++
            }
        }

        for valid == len(need) {
            if right-left+1 < bestLen {
                bestStart = left
                bestLen = right - left + 1
            }

            drop := s[left]
            if _, ok := need[drop]; ok {
                if window[drop] == need[drop] {
                    valid--
                }
                window[drop]--
            }
            left++
        }
    }

    if bestLen == len(s)+1 {
        return ""
    }
    return s[bestStart : bestStart+bestLen]
}
```

## 复杂度分析

- 时间复杂度：`O(n)`
- 空间复杂度：`O(k)`

## 易错点

- `valid` 统计的是“满足要求的字符种类数”，不是字符总数
- 更新最优答案要放在窗口仍然满足要求的时候
- 收缩窗口时，先判断是否会破坏合法性，再减少计数

## 我的复盘

这题让我真正把滑动窗口从“会套模板”推进到了“会维护约束”。一旦想清楚窗口合法条件和失效条件，复杂问题也能拆开处理。