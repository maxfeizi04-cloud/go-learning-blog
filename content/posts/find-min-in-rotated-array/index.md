+++
title = "寻找旋转数组最小值：二分不只用来找目标"
date = 2026-04-03T18:15:00+08:00
draft = false
summary = "这题很适合训练“二分不是只找某个值，而是用条件判断缩小区间”的思维方式。"
tags = ["algorithm", "binary-search", "array", "leetcode"]
series = ["算法与数据结构"]
slug = "find-min-in-rotated-array"
isAlgorithm = true
difficulty = "medium"
difficulties = ["medium"]
source = "LeetCode"
problemId = "153"
+++

## 题目

给定一个升序数组，它在某个点发生旋转，要求找出其中的最小值。

## 题目分析

这题非常适合用来理解“二分不是只用来找某个 target”。

你真正要找的不是某个明确值，而是满足某种结构特征的位置：最小值所在的那一侧。

## 方法一：直觉解法

直接线性扫描当然能做，但这会浪费数组原本的有序结构。

## 方法二：优化思路

关键判断是：

- 如果 `nums[mid] > nums[right]`，说明最小值一定在右半边
- 否则最小值在左半边或者就是 `mid`

所以每次都能排除一半区间。

## Go 实现

```go
func findMin(nums []int) int {
    left, right := 0, len(nums)-1
    for left < right {
        mid := left + (right-left)/2
        if nums[mid] > nums[right] {
            left = mid + 1
        } else {
            right = mid
        }
    }
    return nums[left]
}
```

## 复杂度分析

- 时间复杂度：`O(log n)`
- 空间复杂度：`O(1)`

## 易错点

- `right = mid` 不能写成 `mid - 1`，因为 `mid` 本身可能就是最小值
- while 条件通常是 `left < right`，不是 `<=`

## 我的复盘

这题让我进一步确认：二分查找最本质的能力，是利用结构性质持续排除不可能区间，而不是只盯着某个目标值比较大小。