# Installe Android SDK Platform-Tools (adb) si absent
$ErrorActionPreference = "Stop"

$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$platformTools = "$sdk\platform-tools"
$adb = "$platformTools\adb.exe"

if (Test-Path $adb) {
  Write-Host "adb deja installe : $adb" -ForegroundColor Green
  exit 0
}

New-Item -ItemType Directory -Force -Path $sdk | Out-Null

$zipUrl = "https://dl.google.com/android/repository/platform-tools-latest-windows.zip"
$zipPath = Join-Path $env:TEMP "platform-tools-latest-windows.zip"

Write-Host "Telechargement de platform-tools..."
Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing

Write-Host "Extraction vers $platformTools ..."
if (Test-Path $platformTools) {
  Remove-Item -Recurse -Force $platformTools
}

Expand-Archive -Path $zipPath -DestinationPath $sdk -Force
Remove-Item $zipPath -Force

if (-not (Test-Path $adb)) {
  Write-Host "ERREUR : installation echouee (adb introuvable)." -ForegroundColor Red
  exit 1
}

Write-Host "OK : adb installe -> $adb" -ForegroundColor Green
