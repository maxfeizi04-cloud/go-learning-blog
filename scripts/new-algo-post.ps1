param(
  [Parameter(Mandatory = $true)]
  [string]$Title,
  [string]$Slug,
  [string[]]$Tags = @(),
  [string]$Difficulty = "",
  [string]$Source = "LeetCode",
  [string]$ProblemId = "",
  [string]$Series = "算法与数据结构",
  [switch]$Publish
)

function New-Slug([string]$Value) {
  $slug = $Value.ToLowerInvariant()
  $slug = [regex]::Replace($slug, '[^a-z0-9\s-]', '')
  $slug = [regex]::Replace($slug, '\s+', '-')
  $slug = [regex]::Replace($slug, '-+', '-')
  $slug.Trim('-')
}

function Escape-TomlString([string]$Value) {
  $Value.Replace('\', '\\').Replace('"', '\"')
}

function Assert-Slug([string]$Value) {
  if ($Value -notmatch '^[a-z0-9]+(?:-[a-z0-9]+)*$') {
    throw 'Slug must contain only lowercase letters, numbers, and hyphens.'
  }

  $Value
}

function Resolve-SafePath([string]$BaseDir, [string]$RelativePath) {
  $basePath = [System.IO.Path]::GetFullPath($BaseDir)
  $targetPath = [System.IO.Path]::GetFullPath((Join-Path $basePath $RelativePath))
  $baseWithSeparator = if ($basePath.EndsWith([System.IO.Path]::DirectorySeparatorChar)) { $basePath } else { $basePath + [System.IO.Path]::DirectorySeparatorChar }

  if (-not $targetPath.StartsWith($baseWithSeparator, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Resolved path escapes content directory: $targetPath"
  }

  $targetPath
}

$utf8 = New-Object System.Text.UTF8Encoding($false)
$resolvedSlug = if ($Slug) { $Slug.ToLowerInvariant().Trim() } else { New-Slug $Title }
if (-not $resolvedSlug) {
  $resolvedSlug = 'algo-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
  Write-Host "Slug fallback applied: $resolvedSlug" -ForegroundColor Yellow
}
$resolvedSlug = Assert-Slug $resolvedSlug

$titleEscaped = Escape-TomlString $Title
$difficultyEscaped = Escape-TomlString $Difficulty
$sourceEscaped = Escape-TomlString $Source
$problemIdEscaped = Escape-TomlString $ProblemId
$seriesEscaped = Escape-TomlString $Series
$postsRoot = Resolve-SafePath (Join-Path $PSScriptRoot '..\content\posts') '.'
$targetDir = Resolve-SafePath $postsRoot $resolvedSlug
$targetFile = Resolve-SafePath $targetDir 'index.md'

if (Test-Path $targetFile) {
  throw "Algorithm post already exists: $targetFile"
}

[System.IO.Directory]::CreateDirectory($targetDir) | Out-Null
$date = (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz')
$tagsWithAlgo = @('algorithm') + $Tags | Select-Object -Unique
$tagsToml = if ($tagsWithAlgo.Count -gt 0) { ($tagsWithAlgo | ForEach-Object { '"' + (Escape-TomlString $_) + '"' }) -join ', ' } else { '' }
$difficultyToml = if ($Difficulty) { 'difficulty = "' + $difficultyEscaped + '"' } else { '' }
$sourceToml = if ($Source) { 'source = "' + $sourceEscaped + '"' } else { '' }
$problemIdToml = if ($ProblemId) { 'problemId = "' + $problemIdEscaped + '"' } else { '' }
$draftValue = if ($Publish) { 'false' } else { 'true' }

$content = @"
+++
title = "$titleEscaped"
date = $date
draft = $draftValue
summary = ""
tags = [$tagsToml]
series = ["$seriesEscaped"]
slug = "$resolvedSlug"
isAlgorithm = true
$difficultyToml
$sourceToml
$problemIdToml
+++

## 题目

## 题目分析

## 方法一：直觉解法

## 方法二：优化思路

## Go 实现

```go
package main

func solve(nums []int) int {
    return 0
}
```

## 复杂度分析

- 时间复杂度：
- 空间复杂度：

## 易错点

## 我的复盘

## 关联题
"@

[System.IO.File]::WriteAllText($targetFile, $content, $utf8)
Write-Host "Created algorithm post: $targetFile" -ForegroundColor Green