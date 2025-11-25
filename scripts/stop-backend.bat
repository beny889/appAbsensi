@echo off
echo ========================================
echo  Stopping Backend Service
echo ========================================
echo.

echo Checking for Backend on port 3001...
netstat -ano | findstr ":3001" | findstr LISTENING >nul
if %errorlevel%==0 (
    echo Found Backend process, stopping...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
        echo Killing PID: %%a
        taskkill /F /PID %%a 2>nul
    )
    echo.
    echo [OK] Backend stopped!
) else (
    echo [INFO] Backend is not running on port 3001
)

echo.
echo ========================================
echo  Done!
echo ========================================
echo.
pause
