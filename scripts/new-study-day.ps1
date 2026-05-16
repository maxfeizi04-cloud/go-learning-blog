param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('grpc', 'rabbitmq')]
  [string]$Track,
  [Parameter(Mandatory = $true)]
  [ValidateRange(1, 30)]
  [int]$Day,
  [Parameter(Mandatory = $true)]
  [string]$Title,
  [string]$Summary = "",
  [string[]]$Tags = @(),
  [string]$Series = "",
  [datetime]$Date = (Get-Date),
  [string]$ContentRoot = 'content',
  [switch]$Publish
)

function Escape-TomlString([string]$Value) {
  $Value.Replace('\', '\\').Replace('"', '\"')
}

function Normalize-TagList([string[]]$Values) {
  $normalized = New-Object System.Collections.Generic.List[string]
  foreach ($value in $Values) {
    if ([string]::IsNullOrWhiteSpace($value)) {
      continue
    }

    foreach ($item in ($value -split ',')) {
      $trimmed = $item.Trim()
      if ($trimmed) {
        $normalized.Add($trimmed)
      }
    }
  }

  return @($normalized | Select-Object -Unique)
}

function Resolve-SafePath([string]$BaseDir, [string]$RelativePath) {
  $basePath = [System.IO.Path]::GetFullPath($BaseDir)
  $targetPath = [System.IO.Path]::GetFullPath((Join-Path $basePath $RelativePath))
  $baseWithSeparator = if ($basePath.EndsWith([System.IO.Path]::DirectorySeparatorChar)) { $basePath } else { $basePath + [System.IO.Path]::DirectorySeparatorChar }

  if (-not $targetPath.StartsWith($baseWithSeparator, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Resolved path escapes content directory: $targetPath"
  }

  return $targetPath
}

function Get-TrackConfig([string]$Value) {
  switch ($Value) {
    'grpc' {
      $series = 'gRPC 30天学习'
      $tags = @('grpc', 'learning-path')
      return @{
        Series = $series
        Tags = $tags
      }
    }
    'rabbitmq' {
      $series = 'RabbitMQ 30天学习'
      $tags = @('rabbitmq', 'learning-path')
      return @{
        Series = $series
        Tags = $tags
      }
    }
    default {
      throw "Unsupported track: $Value"
    }
  }
}

function Normalize-StudyTitle([int]$Value, [string]$RawTitle) {
  $trimmedTitle = $RawTitle.Trim()
  $prefixPattern = '^第\s*(\d+)\s*天(?:\s*[：:]\s*)?(.*)$'
  $match = [regex]::Match($trimmedTitle, $prefixPattern)
  if ($match.Success) {
    $titleDay = [int]$match.Groups[1].Value
    if ($titleDay -ne $Value) {
      throw "Title day prefix does not match -Day. Expected day $Value but got $titleDay."
    }

    $topic = $match.Groups[2].Value.Trim()
    if (-not $topic) {
      throw 'Title must include a topic after the day prefix.'
    }

    return @{
      FullTitle = ('第 {0} 天：{1}' -f $Value, $topic)
      Topic = $topic
    }
  }

  return @{
    FullTitle = ('第 {0} 天：{1}' -f $Value, $trimmedTitle)
    Topic = $trimmedTitle
  }
}

function Get-StudyWeek([int]$Value) {
  return [Math]::Min(4, [int][Math]::Ceiling($Value / 7.0))
}

$utf8 = New-Object System.Text.UTF8Encoding($false)
$workspace = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$contentRootPath = Resolve-SafePath $workspace $ContentRoot
$trackRoot = Resolve-SafePath $contentRootPath $Track
$trackConfig = Get-TrackConfig $Track
$titleParts = Normalize-StudyTitle -Value $Day -RawTitle $Title
$daySlug = 'day-{0:d2}' -f $Day
$week = Get-StudyWeek $Day
$seriesValue = if ($Series) { $Series.Trim() } else { $trackConfig.Series }
$summaryValue = if ($Summary) { $Summary.Trim() } else { $titleParts.Topic }
$draftValue = if ($Publish) { 'false' } else { 'true' }
$dateValue = $Date.ToString('yyyy-MM-ddTHH:mm:sszzz')
$finalTags = Normalize-TagList -Values ($trackConfig.Tags + $Tags)
$tagsToml = ($finalTags | ForEach-Object { '"' + (Escape-TomlString $_.Trim()) + '"' }) -join ', '
$targetDir = Resolve-SafePath $trackRoot $daySlug
$targetFile = Resolve-SafePath $targetDir 'index.md'

if (Test-Path $targetFile) {
  throw "Study day already exists: $targetFile"
}

[System.IO.Directory]::CreateDirectory($targetDir) | Out-Null

$content = @"
+++
title = "$(Escape-TomlString $titleParts.FullTitle)"
date = $dateValue
draft = $draftValue
summary = "$(Escape-TomlString $summaryValue)"
tags = [$tagsToml]
series = ["$(Escape-TomlString $seriesValue)"]
slug = "$daySlug"
weight = $Day
day = $Day
week = $week
+++

## 今日主题

$($titleParts.Topic)

## 今天为什么学这个

这一天的主题不是孤立知识点，它需要和整条学习线的前后内容串起来。

## 今天至少要搞懂

- 
- 
- 

## 建议实践

## 推荐操作步骤

1. 先把今天的主题、目标和完成标准快速读一遍。
2. 写一个最小 demo 或整理一份最小实验步骤，不要一开始就做大而全。
3. 记录关键输入、输出、日志、报错和结论，保证明天回看时能复现。
4. 对照完成标准自测，确认不是“看懂了”，而是真的“跑通了”。

## 完成标准

## 重点资料

- 

## 补充笔记

## 建议产出物

- 一个可以反复运行的最小 demo
- 一页记录输入、输出和失败路径的 README 或笔记
- 一段“如果这是生产环境，我还缺什么”的复盘

## 今日复盘

- 今天真正搞懂了什么
- 哪一步最容易卡住
- 如果明天继续推进，下一步最该补什么
"@

[System.IO.File]::WriteAllText($targetFile, $content, $utf8)
Write-Host "Created study day: $targetFile" -ForegroundColor Green
