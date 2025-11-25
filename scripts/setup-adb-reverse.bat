@echo off
echo ========================================
echo  Setup ADB Reverse Port Forwarding
echo ========================================
echo.

REM Set ADB path directly
set "ADB_PATH=C:\scrcpy\scrcpy-win64-v3.1\adb.exe"

REM Check if ADB exists
if not exist "%ADB_PATH%" (
    echo ERROR: ADB not found at %ADB_PATH%
    echo.
    echo Trying system PATH...
    set "ADB_PATH=adb"
)

echo Using ADB: %ADB_PATH%
echo.

echo ----------------------------------------
echo Step 1: Checking connected devices...
echo ----------------------------------------
"%ADB_PATH%" devices
echo.

echo ----------------------------------------
echo Step 2: Setting up ADB reverse...
echo ----------------------------------------
"%ADB_PATH%" reverse tcp:3001 tcp:3001
echo.

echo ----------------------------------------
echo Step 3: Verifying reverse mappings...
echo ----------------------------------------
"%ADB_PATH%" reverse --list
echo.

echo ========================================
echo  DONE!
echo ========================================
echo.
echo Android app can now access backend at:
echo   http://localhost:3001
echo.
echo Press any key to close...
pause >nul
