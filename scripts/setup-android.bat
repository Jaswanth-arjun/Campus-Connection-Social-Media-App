@echo off
echo ============================================
echo  Campus Connect - Android Development Setup
echo ============================================
echo.

:: Check Node.js
echo [1/6] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Download from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo   Found Node.js %%i

:: Check Android SDK
echo.
echo [2/6] Checking Android SDK...
set "ANDROID_HOME_CHECK=%LOCALAPPDATA%\Android\Sdk"
if exist "%ANDROID_HOME_CHECK%" (
    echo   Found Android SDK at %ANDROID_HOME_CHECK%
) else (
    echo   [WARNING] Android SDK not found at default location.
    echo   Please install Android Studio from: https://developer.android.com/studio
    echo   After installation, the SDK will be at: %ANDROID_HOME_CHECK%
    echo.
    echo   REQUIRED Android Studio components:
    echo     - Android SDK Platform 34 ^(or latest^)
    echo     - Android SDK Build-Tools
    echo     - Android Emulator
    echo     - Android SDK Platform-Tools
    echo     - Intel HAXM ^(for Intel CPUs^) or Android Emulator Hypervisor ^(for AMD^)
    echo.
)

:: Check ADB
echo.
echo [3/6] Checking ADB (Android Debug Bridge)...
where adb >nul 2>&1
if %errorlevel% neq 0 (
    echo   [WARNING] ADB not in PATH.
    echo   Add these to your system PATH environment variable:
    echo     %LOCALAPPDATA%\Android\Sdk\platform-tools
    echo     %LOCALAPPDATA%\Android\Sdk\emulator
    echo     %LOCALAPPDATA%\Android\Sdk\tools
    echo     %LOCALAPPDATA%\Android\Sdk\tools\bin
    echo.
    echo   Also set ANDROID_HOME environment variable to:
    echo     %LOCALAPPDATA%\Android\Sdk
) else (
    for /f "tokens=*" %%i in ('adb version 2^>nul ^| findstr /i "version"') do echo   %%i
)

:: Check Emulator
echo.
echo [4/6] Checking Android Emulator...
where emulator >nul 2>&1
if %errorlevel% neq 0 (
    echo   [WARNING] Emulator command not found in PATH.
    echo   Make sure Android Emulator is installed via Android Studio SDK Manager.
) else (
    echo   Emulator found! Available AVDs:
    emulator -list-avds 2>nul
    echo.
)

:: Install EAS CLI
echo.
echo [5/6] Checking EAS CLI...
where eas >nul 2>&1
if %errorlevel% neq 0 (
    echo   EAS CLI not found. Installing globally...
    call npm install -g eas-cli
    echo   EAS CLI installed!
) else (
    for /f "tokens=*" %%i in ('eas --version 2^>nul') do echo   Found EAS CLI %%i
)

:: Install dependencies
echo.
echo [6/6] Installing project dependencies...
call npm install

echo.
echo ============================================
echo  Setup Complete!
echo ============================================
echo.
echo  Next Steps:
echo  -----------
echo  1. If Android Studio is not installed:
echo     Download from: https://developer.android.com/studio
echo.
echo  2. Create an Android Virtual Device (AVD):
echo     - Open Android Studio ^> More Actions ^> Virtual Device Manager
echo     - Create Device ^> Pixel 7 ^> API 34 ^> Finish
echo.
echo  3. Set environment variables (if not done):
echo     ANDROID_HOME = %LOCALAPPDATA%\Android\Sdk
echo     Add to PATH:
echo       %%ANDROID_HOME%%\platform-tools
echo       %%ANDROID_HOME%%\emulator
echo.
echo  4. Login to EAS:
echo     eas login
echo.
echo  5. Link project to EAS:
echo     eas init
echo     (This will give you a project ID to put in app.json)
echo.
echo  6. Build your first APK:
echo     npm run build:preview
echo.
echo  7. Start the emulator and run:
echo     npm run android
echo.
echo ============================================
pause
