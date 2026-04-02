param(
  [Parameter(Mandatory = $true)]
  [string]$Title,
  [string]$Slug,
  [string[]]$Tags = @(),
  [string]$Series = "",
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
  $resolvedSlug = 'post-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
  Write-Host "Slug fallback applied: $resolvedSlug" -ForegroundColor Yellow
}
$resolvedSlug = Assert-Slug $resolvedSlug

$titleEscaped = Escape-TomlString $Title
$seriesEscaped = Escape-TomlString $Series
$postsRoot = Resolve-SafePath (Join-Path $PSScriptRoot '..\content\posts') '.'
$targetDir = Resolve-SafePath $postsRoot $resolvedSlug
$targetFile = Resolve-SafePath $targetDir 'index.md'

if (Test-Path $targetFile) {
  throw "Post already exists: $targetFile"
}

[System.IO.Directory]::CreateDirectory($targetDir) | Out-Null
$date = (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz')
$tagsToml = if ($Tags.Count -gt 0) { ($Tags | ForEach-Object { '"' + (Escape-TomlString $_) + '"' }) -join ', ' } else { '' }
$seriesToml = if ($Series) { '"' + $seriesEscaped + '"' } else { '' }
$draftValue = if ($Publish) { 'false' } else { 'true' }

$content = @"
+++
title = "$titleEscaped"
date = $date
draft = $draftValue
summary = ""
tags = [$tagsToml]
series = [$seriesToml]
slug = "$resolvedSlug"
+++

## 背景

## 核心概念

## 示例代码

```go
package main

import "fmt"

func main() {
    fmt.Println("hello, go")
}
```

## 踩坑记录

## 我的总结
"@

[System.IO.File]::WriteAllText($targetFile, $content, $utf8)
Write-Host "Created post: $targetFile" -ForegroundColor Green