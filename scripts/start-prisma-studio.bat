@echo off
echo ========================================
echo  Starting Prisma Studio
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

echo Starting Prisma Studio...
echo.

cd /d "%BACKEND_DIR%"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to change directory
    pause
    exit /b 1
)

start "Prisma Studio [Database Viewer]" cmd /k "npx prisma studio"

echo.
echo ========================================
echo  Prisma Studio Started!
echo ========================================
echo Window: "Prisma Studio [Database Viewer]"
echo URL: Check the console window for the URL
echo ========================================
echo.
