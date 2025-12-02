@echo off
echo ========================================
echo  Starting LOCAL Development Environment
echo ========================================
echo.

echo [1/2] Starting Backend (localhost:3001)...
start cmd /k "cd /d C:\All Bot\absensiApp\backend && npm run start:local"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Web Admin (localhost:5173)...
start cmd /k "cd /d C:\All Bot\absensiApp\web-admin && npm run dev:local"

echo.
echo ========================================
echo  LOCAL Environment Started!
echo ========================================
echo  Backend:   http://localhost:3001
echo  Web Admin: http://localhost:5173
echo ========================================
echo.
echo Press any key to exit...
pause >nul
