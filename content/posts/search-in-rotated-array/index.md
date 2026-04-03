+++
title = "旋转数组中的二分查找：先判断哪一边有序"
date = 2026-04-03T11:30:00+08:00
draft = false
summary = "这题是二分查找进阶版，关键不在 mid，而在于每次都先判断左右哪一侧仍然保持有序。"
tags = ["algorithm", "binary-search", "array", "leetcode"]
series = ["算法与数据结构"]
slug = "search-in-rotated-array"
isAlgorithm = true
difficulty = "medium"
difficulties = ["medium"]
source = "LeetCode"
problemId = "33"
+++

## 题目

给定一个经过旋转的升序数组和目标值，返回目标值下标；若不存在，返回 `-1`。

## 题目分析

这题虽然是二分，但难点不在传统的“比大小缩区间”，而在于你要先判断：

- 左半边是否有序
- 右半边是否有序

因为旋转之后，至少有一边仍然保持有序。

## 方法一：直觉解法

暴力扫描当然可以做，但这题的价值就在于练习“带条件判断的二分查找”。

## 方法二：优化思路

每次取 `mid` 后：

- 如果 `nums[left] <= nums[mid]`，说明左半边有序
- 否则右半边有序

再根据 target 是否落在有序区间里，决定保留哪一半。

## Go 实现

```go
func search(nums []int, target int) int {
    left, right := 0, len(nums)-1
    for left <= right {
        mid := left + (right-left)/2
        if nums[mid] == target {
            return mid
        }

        if nums[left] <= nums[mid] {
            if nums[left] <= target && target < nums[mid] {
                right = mid - 1
            } else {
                left = mid + 1
            }
        } else {
            if nums[mid] < target && target <= nums[right] {
                left = mid + 1
            } else {
                right = mid - 1
            }
        }
    }
    return -1
}
```

## 复杂度分析

- 时间复杂度：`O(log n)`
- 空间复杂度：`O(1)`

## 易错点

- 判断哪边有序时，不要忘记带等号
- 条件区间要和保留区间严格对应，否则很容易丢答案

## 我的复盘

这题让我意识到：很多“变种二分”并不是新模板，而是在二分骨架上额外叠一层区间语义判断。