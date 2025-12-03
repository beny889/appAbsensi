@echo off
echo ========================================
echo  Starting LOCAL Development Environment
echo ========================================
echo.

echo [1/3] Setting up ADB Reverse (for Android device)...
"%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" reverse tcp:3001 tcp:3001 >nul 2>&1
if %errorlevel%==0 (
    echo       ADB Reverse: OK - Android device can connect to localhost:3001
) else (
    echo       ADB Reverse: SKIPPED - No device connected or ADB not found
)

echo [2/3] Starting Backend (localhost:3001)...
start cmd /k "cd /d C:\All Bot\absensiApp\backend && npm run start:local"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Web Admin (localhost:5173)...
start cmd /k "cd /d C:\All Bot\absensiApp\web-admin && npm run dev:local"

echo.
echo ========================================
echo  LOCAL Environment Started!
echo ========================================
echo  Backend:   http://localhost:3001
echo  Web Admin: http://localhost:5173
echo  ADB:       Port 3001 forwarded to device
echo ========================================
echo.
echo Press any key to exit...
pause >nul
