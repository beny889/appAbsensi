@echo off
echo ========================================
echo  Starting Face Recognition Service (Flask + Python)
echo ========================================
echo.

REM Get the directory where the script is located
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."
set "FACEREC_DIR=%PROJECT_DIR%\face-recognition-service"

echo Project Dir: %PROJECT_DIR%
echo Face Recognition Dir: %FACEREC_DIR%
echo.

if not exist "%FACEREC_DIR%" (
    echo [ERROR] Face Recognition directory not found: %FACEREC_DIR%
    pause
    exit /b 1
)

echo Starting Face Recognition Service...
echo Port: 5000
echo.

cd /d "%FACEREC_DIR%"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to change directory
    pause
    exit /b 1
)

start "Face Recognition Service [Port: 5000]" cmd /k "python app.py"

echo.
echo ========================================
echo  Face Recognition Service Started!
echo ========================================
echo Window: "Face Recognition Service [Port: 5000]"
echo API URL: http://localhost:5000
echo ========================================
echo.
