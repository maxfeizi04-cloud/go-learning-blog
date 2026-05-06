param(
  [string]$ContentRoot = 'content'
)

Import-Module (Join-Path $PSScriptRoot 'Shared.psm1') -Force

function Get-FrontMatter([string]$Content) {
  $match = [regex]::Match($Content, '(?s)\A\+\+\+\r?\n(.*?)\r?\n\+\+\+')
  if ($match.Success) {
    return $match.Groups[1].Value
  }

  return $null
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

function Get-TomlInteger([string]$FrontMatter, [string]$Key) {
  $pattern = '(?m)^' + [regex]::Escape($Key) + '\s*=\s*(-?\d+)\s*$'
  $match = [regex]::Match($FrontMatter, $pattern)
  if ($match.Success) {
    return [int]$match.Groups[1].Value
  }

  return $null
}

function Has-TomlValue([string]$FrontMatter, [string]$Key) {
  return [regex]::IsMatch($FrontMatter, '(?m)^' + [regex]::Escape($Key) + '\s*=')
}

function Add-CommonFieldErrors([System.Collections.Generic.List[string]]$Errors, [string]$RelativePath, [pscustomobject]$Rule, [string]$FrontMatter) {
  $title = Get-TomlString $FrontMatter 'title'
  $summary = Get-TomlString $FrontMatter 'summary'
  $slug = Get-TomlString $FrontMatter 'slug'
  $tags = Get-TomlArray $FrontMatter 'tags'
  $series = Get-TomlArray $FrontMatter 'series'

  if (-not (Has-TomlValue $FrontMatter 'date')) {
    $Errors.Add(('{0}: missing required field ''date''' -f $RelativePath))
  }
  if ([string]::IsNullOrWhiteSpace($title)) {
    $Errors.Add(('{0}: missing required field ''title''' -f $RelativePath))
  }
  if ([string]::IsNullOrWhiteSpace($summary)) {
    $Errors.Add(('{0}: missing required field ''summary''' -f $RelativePath))
  }
  if ([string]::IsNullOrWhiteSpace($slug)) {
    $Errors.Add(('{0}: missing required field ''slug''' -f $RelativePath))
  }
  if ($Rule.RequireTags -and $tags.Count -eq 0) {
    $Errors.Add(('{0}: tags must contain at least one entry' -f $RelativePath))
  }
  if ($Rule.RequireSeries -and $series.Count -eq 0) {
    $Errors.Add(('{0}: series must contain at least one entry' -f $RelativePath))
  }

  return @{
    Slug = $slug
  }
}

function Add-PostSpecificErrors([System.Collections.Generic.List[string]]$Errors, [string]$RelativePath, [string]$FrontMatter) {
  $isAlgorithm = Get-TomlBool $FrontMatter 'isAlgorithm'
  if (-not $isAlgorithm) {
    return
  }

  $difficulty = Get-TomlString $FrontMatter 'difficulty'
  $difficulties = Get-TomlArray $FrontMatter 'difficulties'
  $source = Get-TomlString $FrontMatter 'source'
  $problemId = Get-TomlString $FrontMatter 'problemId'

  if ([string]::IsNullOrWhiteSpace($difficulty)) {
    $Errors.Add(('{0}: algorithm posts must define ''difficulty''' -f $RelativePath))
  }
  if ($difficulties.Count -eq 0) {
    $Errors.Add(('{0}: algorithm posts must define ''difficulties''' -f $RelativePath))
  }
  elseif ($difficulty -and -not ($difficulties -contains $difficulty)) {
    $Errors.Add(('{0}: ''difficulties'' must include the same value as ''difficulty''' -f $RelativePath))
  }
  if ([string]::IsNullOrWhiteSpace($source)) {
    $Errors.Add(('{0}: algorithm posts must define ''source''' -f $RelativePath))
  }
  if ([string]::IsNullOrWhiteSpace($problemId)) {
    $Errors.Add(('{0}: algorithm posts must define ''problemId''' -f $RelativePath))
  }
}

function Add-StudyTrackErrors([System.Collections.Generic.List[string]]$Errors, [string]$RelativePath, [pscustomobject]$Rule, [System.IO.FileInfo]$File, [string]$FrontMatter, [string]$Slug) {
  $day = Get-TomlInteger $FrontMatter 'day'
  $week = Get-TomlInteger $FrontMatter 'week'

  if ($null -eq $day) {
    $Errors.Add(('{0}: missing required field ''day''' -f $RelativePath))
  }
  elseif ($day -lt 1 -or $day -gt $Rule.MaxDay) {
    $Errors.Add(('{0}: ''day'' must be between 1 and {1}' -f $RelativePath, $Rule.MaxDay))
  }

  if ($null -eq $week) {
    $Errors.Add(('{0}: missing required field ''week''' -f $RelativePath))
  }
  elseif ($week -lt 1 -or $week -gt $Rule.MaxWeek) {
    $Errors.Add(('{0}: ''week'' must be between 1 and {1}' -f $RelativePath, $Rule.MaxWeek))
  }

  $bundleName = $File.Directory.Name
  if ($bundleName -match '^day-(\d+)$') {
    $expectedDay = [int]$matches[1]
    if ($Slug -and $Slug -ne $bundleName) {
      $Errors.Add(('{0}: ''slug'' must match the bundle directory name ''{1}''' -f $RelativePath, $bundleName))
    }
    if ($null -ne $day -and $day -ne $expectedDay) {
      $Errors.Add(('{0}: ''day'' must match the bundle directory name ''{1}''' -f $RelativePath, $bundleName))
    }
  }
}

$workspace = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$contentPath = Resolve-SafePath $workspace $ContentRoot
$errors = New-Object System.Collections.Generic.List[string]
$sectionRules = @(
  [pscustomobject]@{
    Section = 'posts'
    RequireTags = $true
    RequireSeries = $true
    ValidationKind = 'post'
  },
  [pscustomobject]@{
    Section = 'snippets'
    RequireTags = $true
    RequireSeries = $false
    ValidationKind = 'snippet'
  },
  [pscustomobject]@{
    Section = 'grpc'
    RequireTags = $true
    RequireSeries = $true
    ValidationKind = 'study-track'
    MaxDay = 30
    MaxWeek = 4
  },
  [pscustomobject]@{
    Section = 'rabbitmq'
    RequireTags = $true
    RequireSeries = $true
    ValidationKind = 'study-track'
    MaxDay = 30
    MaxWeek = 4
  }
)

$targets = foreach ($rule in $sectionRules) {
  $sectionPath = Join-Path $contentPath $rule.Section
  if (-not (Test-Path $sectionPath)) {
    continue
  }

  Get-ChildItem $sectionPath -Recurse -File -Filter *.md |
    Where-Object { $_.Name -ne '_index.md' } |
    ForEach-Object {
      [pscustomobject]@{
        Rule = $rule
        File = $_
      }
    }
}

foreach ($target in $targets) {
  $rule = $target.Rule
  $file = $target.File
  $raw = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
  $frontMatter = Get-FrontMatter $raw
  $relativePath = $file.FullName.Substring($workspace.Length + 1).Replace('\', '/')

  if (-not $frontMatter) {
    $errors.Add(('{0}: missing TOML front matter delimited by +++' -f $relativePath))
    continue
  }

  $commonFields = Add-CommonFieldErrors -Errors $errors -RelativePath $relativePath -Rule $rule -FrontMatter $frontMatter

  switch ($rule.ValidationKind) {
    'post' {
      Add-PostSpecificErrors -Errors $errors -RelativePath $relativePath -FrontMatter $frontMatter
    }
    'study-track' {
      Add-StudyTrackErrors -Errors $errors -RelativePath $relativePath -Rule $rule -File $file -FrontMatter $frontMatter -Slug $commonFields.Slug
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
