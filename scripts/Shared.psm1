function Resolve-SafePath([string]$BaseDir, [string]$RelativePath) {
  $basePath = [System.IO.Path]::GetFullPath($BaseDir)
  $targetPath = [System.IO.Path]::GetFullPath((Join-Path $basePath $RelativePath))
  $baseWithSeparator = if ($basePath.EndsWith([System.IO.Path]::DirectorySeparatorChar)) { $basePath } else { $basePath + [System.IO.Path]::DirectorySeparatorChar }

  if ($targetPath -ne $basePath -and -not $targetPath.StartsWith($baseWithSeparator, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Resolved path escapes workspace: $targetPath"
  }

  return $targetPath
}

function Get-TomlString([string]$Content, [string]$Key) {
  $pattern = '(?m)^\s*' + [regex]::Escape($Key) + '\s*=\s*"((?:[^"\\]|\\.)*)"\s*$'
  $match = [regex]::Match($Content, $pattern)
  if ($match.Success) {
    return $match.Groups[1].Value.Trim()
  }

  return ''
}

function Get-TomlBool([string]$Content, [string]$Key) {
  $pattern = '(?m)^\s*' + [regex]::Escape($Key) + '\s*=\s*(true|false)\s*$'
  $match = [regex]::Match($Content, $pattern)
  if ($match.Success) {
    return $match.Groups[1].Value -eq 'true'
  }

  return $null
}

Export-ModuleMember -Function Resolve-SafePath, Get-TomlString, Get-TomlBool
