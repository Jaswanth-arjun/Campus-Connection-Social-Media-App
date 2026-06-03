# 🚀 Android Development & OTA Updates Guide

## Quick Start TL;DR

```bash
# One-time setup
scripts\setup-android.bat

# Start emulator
scripts\start-emulator.bat

# Run app in emulator
npm run android

# Build APK (install once on mobile)
npm run build:preview

# Push updates (no reinstall needed!)
npm run update:preview "Fixed login bug"
```

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Android Emulator Setup](#android-emulator-setup)
3. [Running on Emulator](#running-on-emulator)
4. [Building APK for Mobile](#building-apk-for-mobile)
5. [OTA Updates (No Reinstall!)](#ota-updates-no-reinstall)
6. [Development Workflow](#development-workflow)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Install Android Studio

Download from: https://developer.android.com/studio

During installation, make sure these are checked:
- ✅ Android SDK
- ✅ Android SDK Platform-Tools
- ✅ Android Virtual Device (AVD)
- ✅ Android Emulator

### 2. Set Environment Variables

**Option A: Through Windows GUI**
1. Search "Environment Variables" in Start Menu
2. Click "Environment Variables" button
3. Add/edit these **System Variables**:

| Variable | Value |
|----------|-------|
| `ANDROID_HOME` | `C:\Users\tejan\AppData\Local\Android\Sdk` |

4. Add to **Path** variable:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
```

**Option B: Through PowerShell (run as Admin)**
```powershell
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
$path = [Environment]::GetEnvironmentVariable("Path", "User")
$additions = "$env:LOCALAPPDATA\Android\Sdk\platform-tools;$env:LOCALAPPDATA\Android\Sdk\emulator"
[Environment]::SetEnvironmentVariable("Path", "$path;$additions", "User")
```

### 3. Install EAS CLI

```bash
npm install -g eas-cli
```

### 4. Login to Expo / EAS

```bash
eas login
```

### 5. Initialize EAS Project

```bash
eas init
```

This gives you a **project ID**. Update `app.json`:
```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/YOUR_PROJECT_ID"
    },
    "extra": {
      "eas": {
        "projectId": "YOUR_PROJECT_ID"
      }
    }
  }
}
```

---

## Android Emulator Setup

### Create a Virtual Device

1. Open **Android Studio**
2. Click **More Actions** → **Virtual Device Manager**
3. Click **Create Device**
4. Choose: **Pixel 7** (or Pixel 7 Pro)
5. Select system image: **API 34** (Android 14) — click "Download" if needed
6. **AVD Name**: `Pixel_7_API_34` (or any name you prefer)
7. Click **Finish**

### Hardware Acceleration (Important for Performance!)

**Intel CPU:**
- Install **Intel HAXM** from Android Studio SDK Manager
- Or: Settings → SDK Tools → Intel x86 Emulator Accelerator

**AMD CPU:**
- Enable **Hyper-V** in Windows Features
- Or: Android Studio SDK Manager → Android Emulator Hypervisor Driver

### Start the Emulator

**Option 1: Using our script**
```bash
scripts\start-emulator.bat
```

**Option 2: Manual command**
```bash
emulator -list-avds                    # List available devices
emulator @Pixel_7_API_34 -gpu host     # Start specific device
```

**Option 3: From Android Studio**
- Open Device Manager → Click ▶️ Play button

---

## Running on Emulator

### Development Mode (Hot Reload)

```bash
# Start Expo dev server + open in emulator
npm run android

# Or start server first, then press 'a' to open Android
npm start
# Then press 'a' in the terminal
```

This gives you **instant hot-reload** — changes appear immediately without rebuilding.

### Running a Built APK on Emulator

```bash
# Install APK on running emulator
adb install -r path\to\your-app.apk

# Or use our script
npm run emulator:install path\to\your-app.apk
```

---

## Building APK for Mobile

### Build on EAS Cloud (Recommended)

```bash
# Preview APK (for testing)
npm run build:preview

# Production AAB (for Play Store)
npm run build:production
```

After the build completes, EAS gives you a download URL for the APK.

### Build Locally

```bash
npm run build:preview:local
```

The APK will be generated in the project directory.

### Install APK on Physical Device

1. **Enable Developer Options** on your phone:
   - Settings → About Phone → Tap "Build Number" 7 times
   
2. **Enable USB Debugging**:
   - Settings → Developer Options → USB Debugging → ON

3. **Connect via USB** and install:
   ```bash
   adb devices                        # Verify device is connected
   adb install -r path\to\app.apk     # Install (replace existing)
   ```

4. **Or just share the APK** via WhatsApp/Drive/Email and install directly on phone.

---

## OTA Updates (No Reinstall!)

### How It Works

```
┌─────────────────────────────────────────────┐
│          OTA Update Flow                     │
│                                              │
│  1. You make code changes                    │
│  2. Run: npm run update:preview "message"    │
│  3. EAS uploads the JS bundle                │
│  4. User opens app → detects update          │
│  5. Downloads in background                  │
│  6. Prompts: "Update available! Restart?"    │
│  7. App restarts with new code ✅             │
│                                              │
│  ❌ No new APK download                      │
│  ❌ No uninstall/reinstall                   │
│  ❌ No Play Store review                     │
└─────────────────────────────────────────────┘
```

### Push an Update

```bash
# After making code changes:
npm run update:preview "Fixed login screen layout"

# Or use the script:
scripts\push-update.bat "Fixed login screen layout"
```

### What CAN Be Updated OTA

✅ JavaScript / TypeScript code
✅ Styles and layouts
✅ Images and assets (in JS bundle)
✅ Navigation changes
✅ API endpoint changes
✅ Bug fixes

### What CANNOT Be Updated OTA (Requires New APK)

❌ Native module changes (new npm packages with native code)
❌ `app.json` configuration changes
❌ Android permissions changes
❌ Splash screen changes
❌ App icon changes
❌ Expo SDK version upgrades

### Update Channels

| Channel | Use For | Command |
|---------|---------|---------|
| `preview` | Testing with team | `npm run update:preview "msg"` |
| `development` | Local dev testing | `npm run update:dev "msg"` |
| `production` | Live users | `npm run update:production "msg"` |

---

## Development Workflow

### Daily Development (Use Emulator)

```bash
# 1. Start emulator
scripts\start-emulator.bat

# 2. Run with hot reload
npm run android

# 3. Make changes → see them instantly
```

### Testing on Mobile (First Time)

```bash
# 1. Build APK
npm run build:preview

# 2. Download APK from EAS dashboard
# 3. Install on phone via USB or share APK file
adb install -r downloaded-app.apk
```

### Pushing Updates to Mobile (After First Install)

```bash
# Just push the update — no reinstall needed!
npm run update:preview "Added new chat feature"

# The app will auto-detect and prompt to restart
```

### When to Rebuild APK

Only rebuild when you:
- Add/remove npm packages with native code
- Change `app.json` configuration
- Change Android permissions
- Upgrade Expo SDK version

---

## Troubleshooting

### "ADB not found"
```bash
# Add to PATH:
set PATH=%PATH%;%LOCALAPPDATA%\Android\Sdk\platform-tools
```

### "Emulator not starting"
- Check if virtualization is enabled in BIOS
- Intel: Install HAXM from SDK Manager
- AMD: Enable Hyper-V in Windows Features
- Try: `emulator @YourAVD -gpu swiftshader_indirect`

### "Expo not connecting to emulator"
```bash
# Clear Expo cache and retry
npx expo start --clear --android
```

### "OTA update not showing"
- OTA only works in **built APKs** (not in Expo Go / dev mode)
- Make sure `app.json` has correct `projectId`
- Check channel matches: build channel = update channel
- Force check: Settings screen → "Check for Updates" button

### "Build failing on EAS"
```bash
# Clear and retry
npx expo doctor
npx expo install --fix
npm run build:preview
```

### "APK won't install on device"
- Enable "Install unknown apps" in phone settings
- Uninstall old version: `adb uninstall com.campusconnect.app`
- Use `-r` flag: `adb install -r app.apk`

---

## Asset Files Required

Ensure these exist in `assets/images/`:

| File | Size | Purpose |
|------|------|---------|
| `icon.png` | 1024×1024 | App icon |
| `adaptive-icon.png` | 1024×1024 | Android adaptive icon |
| `splash.png` | 1242×2436 | Splash screen |
| `notification-icon.png` | 96×96 | Notification icon |
| `favicon.jpg` | 32×32 | Web favicon |

Generate icons at: https://icon.kitchen/

---

## Useful Commands Reference

| Command | Description |
|---------|-------------|
| `npm run android` | Run on emulator with hot reload |
| `npm run start:clear` | Start with cache cleared |
| `npm run build:preview` | Build testing APK on EAS |
| `npm run build:preview:local` | Build APK locally |
| `npm run update:preview "msg"` | Push OTA update |
| `scripts\start-emulator.bat` | Start Android emulator |
| `scripts\push-update.bat "msg"` | Push update (with prompts) |
| `scripts\setup-android.bat` | Check/install prerequisites |
| `adb devices` | List connected devices |
| `adb install -r app.apk` | Install APK on device |
| `emulator -list-avds` | List virtual devices |
