@echo off
echo ====================================================
echo  Campus Connect - One-Click Start (Android Emulator)
echo ====================================================
echo.

:: Set Android SDK paths (Ensures no CMD trailing space issues)
set "ANDROID_HOME=C:\Users\tejan\AppData\Local\Android\Sdk"
set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%"

:: 1. Kill any existing Node/Metro processes to avoid Port 8081 conflicts
echo [1/4] Freeing up dev ports...
taskkill /f /im node.exe >nul 2>&1

:: 2. Check if Pixel_8 emulator is already running
echo [2/4] Checking for running emulator...
adb devices 2>nul | findstr /i "emulator-" >nul
if %errorlevel% equ 0 (
    echo   Emulator is already running!
    goto :run_app
)

:: 3. Start the emulator if not running
echo   Starting Pixel 8 Emulator...
start "" emulator.exe @Pixel_8 -gpu host -no-snapshot-load

echo   Waiting for Pixel 8 to boot up (this may take a moment)...
adb wait-for-device
echo   Emulator connected!

:: Wait until the Android OS is fully loaded
:waitboot
adb shell getprop sys.boot_completed 2>nul | findstr "1" >nul
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto waitboot
)
echo   Pixel 8 fully booted!

:run_app
:: 4. Reverse the port and start the Metro Server
echo.
echo [3/4] Reversing TCP ports...
adb reverse tcp:8081 tcp:8081 >nul 2>&1

echo.
echo [4/4] Starting Metro Bundler and launching Campus Connect...
echo ====================================================
echo.
npx expo start --android
