@echo off
echo ========================================
echo  Stopping All Development Servers
echo ========================================
echo.

REM Get the directory where the script is located
set "SCRIPT_DIR=%~dp0"

echo Stopping all services...
echo.

echo [1/3] Stopping Backend (port 3001)...
cd /d "%SCRIPT_DIR%"
call stop-backend.bat

echo [2/3] Stopping Web Admin (port 5173)...
cd /d "%SCRIPT_DIR%"
call stop-web-admin.bat

echo [3/3] Stopping Face Recognition (port 5000)...
cd /d "%SCRIPT_DIR%"
call stop-face-recognition.bat

echo.
echo ========================================
echo  All Services Stopped!
echo ========================================
echo.
pause
