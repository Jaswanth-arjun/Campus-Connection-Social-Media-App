@echo off
title Campus Connect - Build and OTA Updates
color 0B
clear

:menu
cls
echo ====================================================
echo    Campus Connect - Cloud APK Build and OTA Updates
echo ====================================================
echo.
echo   [1] Build standalone APK (Preview)
echo       - Generates a downloadable APK and a QR code
echo       - Install this once on your phone to start
echo.
echo   [2] Publish Code Update Over-The-Air (OTA)
echo       - Updates all your code modifications instantly
echo       - Your phone gets the update without reinstalling!
echo.
echo   [3] Exit
echo.
echo ====================================================
set /p opt="Choose an option [1-3]: "

if "%opt%"=="1" goto build
if "%opt%"=="2" goto update
if "%opt%"=="3" goto exit
goto menu

:build
cls
echo ====================================================
echo   Building standalone APK on EAS Cloud...
echo ====================================================
echo.
echo 1. Ensuring git is updated...
git add -A
git commit -m "Prepare build" 2>nul
echo.
echo 2. Running EAS Cloud Build (Preview APK)...
npx eas-cli build --platform android --profile preview
echo.
echo Press any key to return to menu...
pause >nul
goto menu

:update
cls
echo ====================================================
echo   Publishing Over-The-Air (OTA) Update...
echo ====================================================
echo.
set /p msg="Enter a brief update message (e.g. Fixed profile UI): "
if "%msg%"=="" set msg="Code update"
echo.
echo 1. Ensuring git is updated...
git add -A
git commit -m "%msg%" 2>nul
echo.
echo 2. Publishing OTA update to Preview channel...
npx eas-cli update --channel preview --message "%msg%"
echo.
echo OTA Update published successfully!
echo Open Campus Connect on your phone/emulator and restart when prompted.
echo.
echo Press any key to return to menu...
pause >nul
goto menu

:exit
exit
