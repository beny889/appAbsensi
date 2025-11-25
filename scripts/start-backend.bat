@echo off
echo ========================================
echo  Starting Backend Service (NestJS)
echo ========================================
echo.

REM Get the directory where the script is located
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."
set "BACKEND_DIR=%PROJECT_DIR%\backend"

echo Project Dir: %PROJECT_DIR%
echo Backend Dir: %BACKEND_DIR%
echo.

if not exist "%BACKEND_DIR%" (
    echo [ERROR] Backend directory not found: %BACKEND_DIR%
    pause
    exit /b 1
)

echo Starting Backend Server...
echo Port: 3001
echo.

cd /d "%BACKEND_DIR%"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to change directory
    pause
    exit /b 1
)

start "Absensi Backend [Port: 3001]" cmd /k "npm run start:dev"

echo.
echo ========================================
echo  Backend Service Started!
echo ========================================
echo Window: "Absensi Backend [Port: 3001]"
echo API URL: http://localhost:3001/api
echo ========================================
echo.
