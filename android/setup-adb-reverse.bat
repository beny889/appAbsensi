@echo off
REM ============================================
REM Setup ADB Reverse for Absensi App
REM ============================================
REM This script sets up port forwarding so that
REM the Android device can access localhost:3001
REM ============================================

echo.
echo ========================================
echo Setting up ADB Reverse for Absensi App
echo ========================================
echo.

REM Check if ADB is available
adb version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] ADB not found in PATH!
    echo.
    echo Please install Android SDK Platform Tools:
    echo https://developer.android.com/studio/releases/platform-tools
    echo.
    pause
    exit /b 1
)

echo [INFO] Checking for connected devices...
adb devices | find "device" >nul
if errorlevel 1 (
    echo [ERROR] No Android device connected!
    echo.
    echo Please connect your Android device via USB
    echo and enable USB Debugging.
    echo.
    pause
    exit /b 1
)

echo [OK] Android device detected
echo.

echo [INFO] Setting up ADB reverse for port 3001...
adb reverse tcp:3001 tcp:3001
if errorlevel 1 (
    echo [ERROR] Failed to setup ADB reverse
    pause
    exit /b 1
)

echo [OK] ADB reverse setup successful!
echo.

echo [INFO] Verifying reverse port forwarding...
adb reverse --list
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Your Android device can now access:
echo   http://localhost:3001/api
echo.
echo This will connect to your backend server.
echo ========================================
echo.
pause
