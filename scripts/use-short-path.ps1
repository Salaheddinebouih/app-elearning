# Raccourcit le chemin du projet (limite Windows 260 caracteres pour CMake/NDK)
param(
  [string]$DriveLetter = "G:"
)

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

# Toujours utiliser subst sur Windows — CMake/React Native depasse souvent 260 caracteres
if ($env:OS -ne "Windows_NT") {
  return @{
    UsedSubst = $false
    ProjectRoot = $projectRoot
  }
}

$existing = subst 2>$null | Select-String "^$([regex]::Escape($DriveLetter))"
if ($existing) {
  subst $DriveLetter /d 2>$null
}

subst $DriveLetter $projectRoot
$shortRoot = "$DriveLetter\"

Write-Host "Chemin raccourci : $shortRoot -> $projectRoot" -ForegroundColor Cyan

return @{
  UsedSubst = $true
  DriveLetter = $DriveLetter
  ProjectRoot = $shortRoot
}
