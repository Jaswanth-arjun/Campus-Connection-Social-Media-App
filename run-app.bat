@echo off
echo ====================================================
echo  Campus Connect - One-Click Start (Android Emulator)
echo ====================================================
echo.

:: Set Android SDK paths (Ensures no CMD trailing space issues)
set "ANDROID_HOME=C:\Users\tejan\AppData\Local\Android\Sdk"
set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%"

:: 1. Kill any existing Node/Metro processes to avoid Port 8081 conflicts
echo [1/5] Freeing up dev ports...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8081 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

:: 2. Check if Pixel_8 emulator is already running
echo [2/5] Checking for running emulator...
adb devices 2>nul | findstr /i "emulator-" >nul
if %errorlevel% equ 0 (
    echo   Emulator is already running!
    goto :reverse_ports
)

:: 3. Start the emulator if not running
echo   Starting Pixel 8 Emulator...
start "" emulator.exe @Pixel_8 -gpu host -no-snapshot-load -dns-server 8.8.8.8,8.8.4.4

echo   Waiting for Pixel 8 to boot up (this may take a moment)...
adb wait-for-device
echo   Emulator connected!

:: Wait until the Android OS is fully loaded
:waitboot
adb shell getprop sys.boot_completed 2>nul | findstr "1" >nul
if %errorlevel% neq 0 (
    ping -n 3 127.0.0.1 >nul
    goto waitboot
)
echo   Pixel 8 fully booted!

:reverse_ports
:: 4. Reverse the port
echo.
echo [3/5] Reversing TCP ports...
adb reverse tcp:8081 tcp:8081 >nul 2>&1
echo   Port 8081 reversed to host successfully!

:: 5. Start the Metro Server in an EXTERNAL window to prevent IDE hangs
echo.
echo [4/5] Spawning Metro Server in a new window...
echo       (This prevents IDE hangs and keeps the console fully interactive!)
echo ====================================================
start "Campus Connect Metro Bundler" cmd.exe /c "npx expo start --android --clear"

:: 6. Launch Expo Go on the emulator automatically
echo.
echo [5/5] Launching Expo Go on the emulator...
ping -n 6 127.0.0.1 >nul
adb shell monkey -p host.exp.exponent -c android.intent.category.LAUNCHER 1 >nul 2>&1
echo.
echo ====================================================
echo  🚀 Metro Bundler is running in the new command window!
echo  📱 Expo Go has been opened on your emulator.
echo.
echo  👉 Inside Expo Go on the emulator:
echo     1. Tap "Enter URL"
echo     2. Enter: exp://127.0.0.1:8081
echo     3. Click "Connect" to load the app!
echo.
echo  (Press any key to close this window)
echo ====================================================
pause >nul
