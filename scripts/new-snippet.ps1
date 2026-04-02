param(
  [Parameter(Mandatory = $true)]
  [string]$Title,
  [string]$Slug,
  [string[]]$Tags = @(),
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
  $resolvedSlug = 'snippet-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
  Write-Host "Slug fallback applied: $resolvedSlug" -ForegroundColor Yellow
}
$resolvedSlug = Assert-Slug $resolvedSlug

$titleEscaped = Escape-TomlString $Title
$snippetsRoot = Resolve-SafePath (Join-Path $PSScriptRoot '..\content\snippets') '.'
$targetFile = Resolve-SafePath $snippetsRoot ($resolvedSlug + '.md')

if (Test-Path $targetFile) {
  throw "Snippet already exists: $targetFile"
}

$date = (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz')
$tagsToml = if ($Tags.Count -gt 0) { ($Tags | ForEach-Object { '"' + (Escape-TomlString $_) + '"' }) -join ', ' } else { '' }
$draftValue = if ($Publish) { 'false' } else { 'true' }

$content = @"
+++
title = "$titleEscaped"
date = $date
draft = $draftValue
summary = ""
tags = [$tagsToml]
series = []
slug = "$resolvedSlug"
+++

## 问题

## 命令或代码

```bash
# command here
```

## 备注
"@

[System.IO.File]::WriteAllText($targetFile, $content, $utf8)
Write-Host "Created snippet: $targetFile" -ForegroundColor Green