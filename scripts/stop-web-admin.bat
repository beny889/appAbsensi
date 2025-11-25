@echo off
echo ========================================
echo  Stopping Web Admin Service
echo ========================================
echo.

echo Checking for Web Admin on port 5173...
netstat -ano | findstr ":5173" | findstr LISTENING >nul
if %errorlevel%==0 (
    echo Found Web Admin process, stopping...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
        echo Killing PID: %%a
        taskkill /F /PID %%a 2>nul
    )
    echo.
    echo [OK] Web Admin stopped!
) else (
    echo [INFO] Web Admin is not running on port 5173
)

echo.
echo ========================================
echo  Done!
echo ========================================
echo.
pause
