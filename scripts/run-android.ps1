# Configure l'environnement Android puis lance expo run:android
$ErrorActionPreference = "Stop"

$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$adb = "$sdk\platform-tools\adb.exe"
$javaHome = "C:\Program Files\Android\Android Studio\jbr"

$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:JAVA_HOME = $javaHome
$env:Path = "$javaHome\bin;$sdk\platform-tools;$sdk\emulator;$env:Path"

if (-not (Test-Path $adb)) {
  Write-Host "adb introuvable — installation automatique de platform-tools..." -ForegroundColor Yellow
  & "$PSScriptRoot\install-android-platform-tools.ps1"
  if (-not (Test-Path $adb)) {
    Write-Host ""
    Write-Host "ERREUR : adb toujours introuvable." -ForegroundColor Red
    Write-Host "Installez manuellement dans Android Studio : SDK Tools > Android SDK Platform-Tools"
    exit 1
  }
}

if (-not (Test-Path "$javaHome\bin\java.exe")) {
  Write-Host "ERREUR : Java introuvable dans $javaHome" -ForegroundColor Red
  exit 1
}

$pathInfo = & "$PSScriptRoot\use-short-path.ps1"
$root = $pathInfo.ProjectRoot
Set-Location $root

try {
  if (-not (Test-Path $adb)) {
    & "$PSScriptRoot\install-android-platform-tools.ps1"
  }

  Write-Host "ANDROID_HOME=$env:ANDROID_HOME"
  Write-Host "JAVA_HOME=$env:JAVA_HOME"

  $devices = & $adb devices 2>$null | Select-Object -Skip 1 | Where-Object { $_ -match "device$" }
  if (-not $devices) {
    Write-Host ""
    Write-Host "Aucun telephone / emulateur Android detecte." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option A — Telephone (recommande pour le micro) :"
    Write-Host "  1. Activez Options developpeur + Debogage USB"
    Write-Host "  2. Branchez le cable USB, acceptez l'autorisation sur le telephone"
    Write-Host "  3. Relancez : npm run android"
    Write-Host ""
    Write-Host "Option B — Compiler l'APK sans appareil :"
    Write-Host "  npm run android:apk"
    Write-Host ""
    exit 1
  }

  npx expo run:android
} finally {
  if ($pathInfo.UsedSubst) {
    subst $pathInfo.DriveLetter /d 2>$null
  }
}
