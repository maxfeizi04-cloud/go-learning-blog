+++
title = "两数之和：从暴力枚举到哈希表"
date = 2026-04-02T18:00:00+08:00
draft = false
summary = "用经典的 Two Sum 题目梳理从暴力枚举到哈希表优化的思路演进，顺手建立一套稳定的算法题解写法。"
tags = ["algorithm", "array", "hash-table", "leetcode"]
series = ["算法与数据结构"]
slug = "two-sum-hash-table"
isAlgorithm = true
difficulty = "easy"
source = "LeetCode"
problemId = "1"
+++

## 题目

给定一个整数数组 `nums` 和目标值 `target`，找出两个下标，使得对应元素之和等于 `target`。

## 题目分析

这道题很适合作为算法题解入门题，因为它的优化路径非常直白：

- 先想到最直接的双重循环
- 再思考怎样避免重复查找
- 最后自然过渡到哈希表

核心问题其实只有一个：当我们遍历到当前数字时，能不能立刻知道它需要的“另一个数”是否已经出现过。

## 方法一：直觉解法

最直接的写法就是枚举所有二元组。

```go
func twoSumBruteForce(nums []int, target int) []int {
    for i := 0; i < len(nums); i++ {
        for j := i + 1; j < len(nums); j++ {
            if nums[i]+nums[j] == target {
                return []int{i, j}
            }
        }
    }
    return nil
}
```

这个方法容易理解，但时间复杂度是 `O(n^2)`。

## 方法二：优化思路

如果我们在遍历到 `nums[i]` 时，已经知道前面每个数字出现过的位置，那么只要算出 `target-nums[i]`，就能马上判断答案是否已经出现过。

这正好对应哈希表：

- key：数值
- value：下标

## Go 实现

```go
func twoSum(nums []int, target int) []int {
    indexByValue := make(map[int]int, len(nums))
    for i, num := range nums {
        need := target - num
        if j, ok := indexByValue[need]; ok {
            return []int{j, i}
        }
        indexByValue[num] = i
    }
    return nil
}
```

## 复杂度分析

- 时间复杂度：`O(n)`
- 空间复杂度：`O(n)`

## 易错点

- 一定要先查哈希表，再插入当前值，避免把同一个元素使用两次
- 如果题目要求返回的是下标，map 的 value 应该存位置，而不是计数

## 我的复盘

这题最大的价值，不是哈希表本身，而是让我再次确认了一件事：很多优化并不复杂，关键是把“重复做的事”显式找出来。

## 关联题

- 两数之和 II
- 三数之和
- 四数之和