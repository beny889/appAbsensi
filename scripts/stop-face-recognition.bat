@echo off
echo ========================================
echo  Stopping Face Recognition Service
echo ========================================
echo.

echo Checking for Face Recognition on port 5000...
netstat -ano | findstr ":5000" | findstr LISTENING >nul
if %errorlevel%==0 (
    echo Found Face Recognition process, stopping...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
        echo Killing PID: %%a
        taskkill /F /PID %%a 2>nul
    )
    echo.
    echo [OK] Face Recognition stopped!
) else (
    echo [INFO] Face Recognition is not running on port 5000
)

echo.
echo ========================================
echo  Done!
echo ========================================
echo.
pause
