@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  Launching scrcpy for Android Device
echo ========================================
echo.

REM Find scrcpy executable
set "SCRCPY_PATH="
set "ADB_PATH="

REM Check common locations
if exist "C:\scrcpy\scrcpy-win64-v3.1\scrcpy.exe" (
    set "SCRCPY_PATH=C:\scrcpy\scrcpy-win64-v3.1\scrcpy.exe"
    set "ADB_PATH=C:\scrcpy\scrcpy-win64-v3.1\adb.exe"
) else (
    REM Try to find in C:\scrcpy
    for /f "delims=" %%i in ('dir /s /b "C:\scrcpy\scrcpy.exe" 2^>nul') do (
        set "SCRCPY_PATH=%%i"
        set "ADB_PATH=%%~dpi\adb.exe"
        goto :found
    )

    REM Try system PATH
    where scrcpy >nul 2>&1
    if !errorlevel! equ 0 (
        set "SCRCPY_PATH=scrcpy"
        set "ADB_PATH=adb"
    )
)

:found
if "%SCRCPY_PATH%"=="" (
    echo ERROR: scrcpy not found!
    echo.
    echo Please install scrcpy:
    echo 1. Download from: https://github.com/Genymobile/scrcpy/releases
    echo 2. Extract to C:\scrcpy\
    echo 3. Or use Chocolatey: choco install scrcpy
    echo 4. Or use Scoop: scoop install scrcpy
    echo.
    pause
    exit /b 1
)

echo [OK] Found scrcpy: %SCRCPY_PATH%
echo.

REM Check for connected devices
echo Checking for connected Android devices...
"%ADB_PATH%" devices
echo.

REM Count devices
for /f %%i in ('"%ADB_PATH%" devices ^| find /c "device"') do set DEVICE_COUNT=%%i
set /a DEVICE_COUNT=DEVICE_COUNT-1

if %DEVICE_COUNT% leq 0 (
    echo WARNING: No Android devices detected!
    echo.
    echo Please make sure:
    echo   1. USB Debugging is enabled on your device
    echo   2. Device is connected via USB
    echo   3. You have authorized the computer on your device
    echo.
    pause
) else (
    echo [OK] Found %DEVICE_COUNT% device(s)
)

echo.
echo Starting scrcpy with optimized settings...
echo   - Stay awake enabled
echo   - Screen turned off (battery saving)
echo   - Power off on close
echo.

REM Launch scrcpy with optimal settings for development
"%SCRCPY_PATH%" --stay-awake --turn-screen-off --power-off-on-close

echo.
echo scrcpy closed.
pause
