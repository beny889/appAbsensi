@echo off
echo ========================================
echo  Starting Web Admin Service (React + Vite)
echo ========================================
echo.

REM Get the directory where the script is located
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."
set "WEBADMIN_DIR=%PROJECT_DIR%\web-admin"

echo Project Dir: %PROJECT_DIR%
echo Web Admin Dir: %WEBADMIN_DIR%
echo.

if not exist "%WEBADMIN_DIR%" (
    echo [ERROR] Web Admin directory not found: %WEBADMIN_DIR%
    pause
    exit /b 1
)

echo Starting Web Admin Server...
echo Port: 5173
echo.

cd /d "%WEBADMIN_DIR%"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to change directory
    pause
    exit /b 1
)

start "Absensi Web Admin [Port: 5173]" cmd /k "npm run dev"

echo.
echo ========================================
echo  Web Admin Service Started!
echo ========================================
echo Window: "Absensi Web Admin [Port: 5173]"
echo URL: http://localhost:5173
echo ========================================
echo.
