# Compile l'APK sans appareil connecte (utile si pas de telephone branche)
$ErrorActionPreference = "Stop"

$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$javaHome = "C:\Program Files\Android\Android Studio\jbr"
$adb = "$sdk\platform-tools\adb.exe"

$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:JAVA_HOME = $javaHome
$env:Path = "$javaHome\bin;$sdk\platform-tools;$env:Path"

$pathInfo = & "$PSScriptRoot\use-short-path.ps1"
$root = $pathInfo.ProjectRoot
Set-Location $root

try {
  if (-not (Test-Path $adb)) {
    & "$PSScriptRoot\install-android-platform-tools.ps1"
  }

  if (-not (Test-Path "android\gradlew.bat")) {
    Write-Host "Generation du projet Android (prebuild)..."
    npx expo prebuild --platform android --no-install
  }

  Write-Host "Compilation de l'APK (peut prendre plusieurs minutes)..."
  Set-Location android

  if (Test-Path "app\.cxx") {
    Remove-Item -Recurse -Force "app\.cxx" -ErrorAction SilentlyContinue
  }

  .\gradlew.bat app:assembleDebug -PreactNativeArchitectures=arm64-v8a
  Set-Location ..

  $apk = Get-ChildItem -Path "android\app\build\outputs\apk\debug" -Filter "*.apk" -ErrorAction SilentlyContinue | Select-Object -First 1

  if ($apk) {
    Write-Host ""
    Write-Host "APK pret :" -ForegroundColor Green
    Write-Host $apk.FullName
    Write-Host ""
    Write-Host "Copiez-le sur votre telephone et installez-le, ou branchez le telephone (USB debug) puis : npm run android"
  } else {
    Write-Host "Compilation terminee mais APK introuvable dans android\app\build\outputs\apk\debug" -ForegroundColor Yellow
  }
} finally {
  if ($pathInfo.UsedSubst) {
    subst $pathInfo.DriveLetter /d 2>$null
  }
}
