param(
  [string]$Destination = '.site-check'
)

function Get-HugoExecutable {
  $hugo = Get-Command hugo -ErrorAction SilentlyContinue
  if ($hugo) {
    return $hugo.Source
  }

  $wingetHugo = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter hugo.exe -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName

  if ($wingetHugo) {
    return $wingetHugo
  }

  throw 'Hugo is not installed or not available in PATH. Run: winget install --id Hugo.Hugo.Extended -e'
}

function Resolve-SafePath([string]$BaseDir, [string]$RelativePath) {
  $basePath = [System.IO.Path]::GetFullPath($BaseDir)
  $targetPath = [System.IO.Path]::GetFullPath((Join-Path $basePath $RelativePath))
  $baseWithSeparator = if ($basePath.EndsWith([System.IO.Path]::DirectorySeparatorChar)) { $basePath } else { $basePath + [System.IO.Path]::DirectorySeparatorChar }

  if ($targetPath -ne $basePath -and -not $targetPath.StartsWith($baseWithSeparator, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Resolved path escapes workspace: $targetPath"
  }

  return $targetPath
}

function Get-ConfigValue([string]$Content, [string]$Key) {
  $pattern = '(?m)^' + [regex]::Escape($Key) + '\s*=\s*"([^"]*)"'
  $match = [regex]::Match($Content, $pattern)
  if ($match.Success) {
    return $match.Groups[1].Value.Trim()
  }

  return ''
}

$workspace = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$configPath = Resolve-SafePath $workspace 'hugo.toml'
$config = [System.IO.File]::ReadAllText($configPath, [System.Text.Encoding]::UTF8)

$defaultAuthorPlaceholder = [string]([char]0x4F60) + [char]0x7684 + [char]0x540D + [char]0x5B57
$baseURL = Get-ConfigValue $config 'baseURL'
$author = Get-ConfigValue $config 'author'
$email = Get-ConfigValue $config 'email'
$github = Get-ConfigValue $config 'github'
$description = Get-ConfigValue $config 'description'

$blockingIssues = New-Object System.Collections.Generic.List[string]
$notes = New-Object System.Collections.Generic.List[string]

if (-not $baseURL -or $baseURL -eq 'https://blog.example.com/') {
  $blockingIssues.Add('`baseURL` is still using the default placeholder. Replace it with your real site URL.')
}

if (-not $author -or $author -eq $defaultAuthorPlaceholder) {
  $blockingIssues.Add('`author` is still using the default placeholder. Replace it with your preferred byline.')
}

if (-not $email -or $email -eq 'hello@example.com') {
  $blockingIssues.Add('`email` is still using the default placeholder. Replace it with your real contact email.')
}

if (-not $github -or $github -eq 'https://github.com/yourname') {
  $blockingIssues.Add('`github` is still using the default placeholder. Replace it with your GitHub URL.')
}

if (-not $description) {
  $blockingIssues.Add('`description` is empty. Add a short site description before deployment.')
}

if ($config -match '(?m)^\s*enabled\s*=\s*false\s*$') {
  $notes.Add('giscus comments are currently disabled. This is optional and does not block deployment.')
}

$destinationPath = Resolve-SafePath $workspace $Destination
$hugoExe = Get-HugoExecutable

Write-Host 'Running clean build check...' -ForegroundColor Cyan
& $hugoExe '--cleanDestinationDir' '--gc' '--minify' '--destination' $destinationPath | Out-Host
if ($LASTEXITCODE -ne 0) {
  throw 'Hugo build failed during preflight check.'
}

$indexPath = Join-Path $destinationPath 'index.html'
$notFoundPath = Join-Path $destinationPath '404.html'
if (-not (Test-Path $indexPath)) {
  throw 'Build succeeded but index.html was not generated.'
}
if (-not (Test-Path $notFoundPath)) {
  throw 'Build succeeded but 404.html was not generated.'
}

Write-Host ''
Write-Host 'Build artifacts look good.' -ForegroundColor Green
Write-Host "Check output directory: $destinationPath" -ForegroundColor DarkGray

if ($notes.Count -gt 0) {
  Write-Host ''
  Write-Host 'Notes:' -ForegroundColor Yellow
  foreach ($note in $notes) {
    Write-Host "- $note" -ForegroundColor Yellow
  }
}

if ($blockingIssues.Count -gt 0) {
  Write-Host ''
  Write-Host 'Before going live, fix these items:' -ForegroundColor Red
  foreach ($issue in $blockingIssues) {
    Write-Host "- $issue" -ForegroundColor Red
  }
  exit 1
}

Write-Host ''
Write-Host 'Site config and build are ready for deployment.' -ForegroundColor Green