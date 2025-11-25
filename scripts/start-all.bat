@echo off
echo ========================================
echo  Starting All Development Servers
echo ========================================
echo.

REM Get the directory where the script is located
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."

echo Project Dir: %PROJECT_DIR%
echo.

echo This will start the following services:
echo 1. Backend (NestJS) - Port 3001
echo 2. Web Admin (React + Vite) - Port 5173
echo 3. Face Recognition (Python Flask) - Port 5000
echo.
echo Each service will open in a separate CMD window.
echo.
pause

echo.
echo [1/3] Starting Backend...
cd /d "%SCRIPT_DIR%"
call start-backend.bat
timeout /t 2 /nobreak >nul

echo.
echo [2/3] Starting Web Admin...
cd /d "%SCRIPT_DIR%"
call start-web-admin.bat
timeout /t 2 /nobreak >nul

echo.
echo [3/3] Starting Face Recognition...
cd /d "%SCRIPT_DIR%"
call start-face-recognition.bat
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo  All Services Started!
echo ========================================
echo.
echo Service URLs:
echo - Backend API:        http://localhost:3001/api
echo - Web Admin:          http://localhost:5173
echo - Face Recognition:   http://localhost:5000
echo.
echo ========================================
echo.
pause
