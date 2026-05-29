@echo off
echo ============================================
echo  Campus Connect - Push OTA Update
echo ============================================
echo.

:: Get update message from argument or prompt
set "MSG=%~1"
if "%MSG%"=="" (
    set /p MSG="Enter update message: "
)

if "%MSG%"=="" (
    set "MSG=App update %date% %time%"
)

echo.
echo Pushing update to preview channel...
echo Message: %MSG%
echo.

call eas update --channel preview --message "%MSG%"

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo  Update pushed successfully!
    echo  Users will see the update when they 
    echo  next open the app.
    echo ============================================
) else (
    echo.
    echo [ERROR] Update failed! Make sure:
    echo   1. You are logged into EAS: eas login
    echo   2. Project is initialized: eas init
    echo   3. You have built at least one APK first
)

pause
