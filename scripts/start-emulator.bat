@echo off
echo ============================================
echo  Campus Connect - Emulator Launcher
echo ============================================
echo.

:: Check for emulator command
where emulator >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Emulator not found in PATH.
    echo.
    echo Trying default location...
    set "EMULATOR=%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe"
    if not exist "%EMULATOR%" (
        echo [ERROR] Emulator not found at default location either.
        echo Please install Android Studio and set up PATH.
        pause
        exit /b 1
    )
) else (
    set "EMULATOR=emulator"
)

:: List available AVDs
echo Available Android Virtual Devices:
echo -----------------------------------
%EMULATOR% -list-avds 2>nul
echo -----------------------------------
echo.

:: Get AVD name
set "AVD=%~1"
if "%AVD%"=="" (
    set /p AVD="Enter AVD name (or press Enter for first available): "
)

if "%AVD%"=="" (
    :: Use first available AVD
    for /f "tokens=*" %%i in ('%EMULATOR% -list-avds 2^>nul') do (
        set "AVD=%%i"
        goto :found
    )
    echo [ERROR] No AVDs found! Create one in Android Studio first.
    echo   Android Studio ^> More Actions ^> Virtual Device Manager ^> Create Device
    pause
    exit /b 1
)

:found
echo.
echo Starting emulator: %AVD%
echo (This may take a minute...)
echo.

start "" %EMULATOR% @%AVD% -gpu host -no-snapshot-load

echo Emulator is starting in the background.
echo.
echo Waiting for device to boot...

:: Wait for device to be ready
adb wait-for-device
echo Device connected!

:: Wait for boot to complete
:waitboot
adb shell getprop sys.boot_completed 2>nul | findstr "1" >nul
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto waitboot
)

echo Device fully booted!
echo.
echo You can now run:
echo   npm run android
echo.
pause
