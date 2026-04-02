param(
  [switch]$IncludeDrafts,
  [switch]$PublishedOnly,
  [int]$Port = 1313,
  [switch]$WriteToDisk,
  [switch]$OpenBrowser
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

$hugoExe = Get-HugoExecutable
$shouldIncludeDrafts = $IncludeDrafts -or -not $PublishedOnly
$args = @('server', '--bind', '0.0.0.0', '--port', $Port)

if (-not $WriteToDisk) {
  $args += '--renderToMemory'
}

if ($shouldIncludeDrafts) {
  $args += '-D'
}

if ($OpenBrowser) {
  $args += '--openBrowser'
}

Write-Host "Starting Hugo server on port $Port..." -ForegroundColor Cyan
if (-not $WriteToDisk) {
  Write-Host 'Preview output will stay in memory and will not overwrite the public directory.' -ForegroundColor DarkGray
}
if ($shouldIncludeDrafts) {
  Write-Host 'Draft content is included in this preview.' -ForegroundColor DarkGray
}

& $hugoExe @args