param(
  [string]$ContentRoot = 'content'
)

function Resolve-SafePath([string]$BaseDir, [string]$RelativePath) {
  $basePath = [System.IO.Path]::GetFullPath($BaseDir)
  $targetPath = [System.IO.Path]::GetFullPath((Join-Path $basePath $RelativePath))
  $baseWithSeparator = if ($basePath.EndsWith([System.IO.Path]::DirectorySeparatorChar)) { $basePath } else { $basePath + [System.IO.Path]::DirectorySeparatorChar }

  if ($targetPath -ne $basePath -and -not $targetPath.StartsWith($baseWithSeparator, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Resolved path escapes workspace: $targetPath"
  }

  return $targetPath
}

function Get-FrontMatter([string]$Content) {
  $match = [regex]::Match($Content, '(?s)\A\+\+\+\r?\n(.*?)\r?\n\+\+\+')
  if ($match.Success) {
    return $match.Groups[1].Value
  }

  return $null
}

function Get-TomlString([string]$FrontMatter, [string]$Key) {
  $pattern = '(?m)^' + [regex]::Escape($Key) + '\s*=\s*"((?:[^"\\]|\\.)*)"\s*$'
  $match = [regex]::Match($FrontMatter, $pattern)
  if ($match.Success) {
    return $match.Groups[1].Value.Trim()
  }

  return ''
}

function Get-TomlArray([string]$FrontMatter, [string]$Key) {
  $pattern = '(?m)^' + [regex]::Escape($Key) + '\s*=\s*\[(.*)\]\s*$'
  $match = [regex]::Match($FrontMatter, $pattern)
  if (-not $match.Success) {
    return @()
  }

  $values = [regex]::Matches($match.Groups[1].Value, '"((?:[^"\\]|\\.)*)"')
  return @($values | ForEach-Object { $_.Groups[1].Value.Trim() })
}

function Get-TomlBool([string]$FrontMatter, [string]$Key) {
  $pattern = '(?m)^' + [regex]::Escape($Key) + '\s*=\s*(true|false)\s*$'
  $match = [regex]::Match($FrontMatter, $pattern)
  if ($match.Success) {
    return $match.Groups[1].Value -eq 'true'
  }

  return $null
}

function Has-TomlValue([string]$FrontMatter, [string]$Key) {
  return [regex]::IsMatch($FrontMatter, '(?m)^' + [regex]::Escape($Key) + '\s*=')
}

$workspace = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$contentPath = Resolve-SafePath $workspace $ContentRoot
$errors = New-Object System.Collections.Generic.List[string]

$targets = @()
$targets += Get-ChildItem (Join-Path $contentPath 'posts') -Recurse -File -Filter *.md | Where-Object { $_.Name -ne '_index.md' }
$targets += Get-ChildItem (Join-Path $contentPath 'snippets') -Recurse -File -Filter *.md | Where-Object { $_.Name -ne '_index.md' }

foreach ($file in $targets) {
  $raw = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
  $frontMatter = Get-FrontMatter $raw
  $relativePath = $file.FullName.Substring($workspace.Length + 1).Replace('\', '/')

  if (-not $frontMatter) {
    $errors.Add(('{0}: missing TOML front matter delimited by +++' -f $relativePath))
    continue
  }

  $section = if ($relativePath.StartsWith('content/posts/')) { 'posts' } else { 'snippets' }
  $title = Get-TomlString $frontMatter 'title'
  $summary = Get-TomlString $frontMatter 'summary'
  $slug = Get-TomlString $frontMatter 'slug'
  $tags = Get-TomlArray $frontMatter 'tags'
  $series = Get-TomlArray $frontMatter 'series'

  if (-not (Has-TomlValue $frontMatter 'date')) {
    $errors.Add(('{0}: missing required field ''date''' -f $relativePath))
  }
  if ([string]::IsNullOrWhiteSpace($title)) {
    $errors.Add(('{0}: missing required field ''title''' -f $relativePath))
  }
  if ([string]::IsNullOrWhiteSpace($summary)) {
    $errors.Add(('{0}: missing required field ''summary''' -f $relativePath))
  }
  if ([string]::IsNullOrWhiteSpace($slug)) {
    $errors.Add(('{0}: missing required field ''slug''' -f $relativePath))
  }
  if ($tags.Count -eq 0) {
    $errors.Add(('{0}: tags must contain at least one entry' -f $relativePath))
  }

  if ($section -eq 'posts' -and $series.Count -eq 0) {
    $errors.Add(('{0}: series must contain at least one entry' -f $relativePath))
  }

  if ($section -eq 'posts') {
    $isAlgorithm = Get-TomlBool $frontMatter 'isAlgorithm'
    if ($isAlgorithm) {
      $difficulty = Get-TomlString $frontMatter 'difficulty'
      $difficulties = Get-TomlArray $frontMatter 'difficulties'
      $source = Get-TomlString $frontMatter 'source'
      $problemId = Get-TomlString $frontMatter 'problemId'

      if ([string]::IsNullOrWhiteSpace($difficulty)) {
        $errors.Add(('{0}: algorithm posts must define ''difficulty''' -f $relativePath))
      }
      if ($difficulties.Count -eq 0) {
        $errors.Add(('{0}: algorithm posts must define ''difficulties''' -f $relativePath))
      }
      elseif ($difficulty -and -not ($difficulties -contains $difficulty)) {
        $errors.Add(('{0}: ''difficulties'' must include the same value as ''difficulty''' -f $relativePath))
      }
      if ([string]::IsNullOrWhiteSpace($source)) {
        $errors.Add(('{0}: algorithm posts must define ''source''' -f $relativePath))
      }
      if ([string]::IsNullOrWhiteSpace($problemId)) {
        $errors.Add(('{0}: algorithm posts must define ''problemId''' -f $relativePath))
      }
    }
  }
}

if ($errors.Count -gt 0) {
  Write-Host 'Front matter validation failed:' -ForegroundColor Red
  foreach ($error in $errors) {
    Write-Host ('- ' + $error) -ForegroundColor Red
  }
  throw 'Front matter validation failed.'
}

Write-Host 'Front matter validation passed.' -ForegroundColor Green