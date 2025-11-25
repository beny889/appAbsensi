@echo off
echo ========================================
echo  Service Status Check
echo ========================================
echo.

echo Checking all services...
echo.

REM Check Backend (port 3001)
echo [Backend - Port 3001]
netstat -ano | findstr ":3001" | findstr LISTENING >nul
if %errorlevel%==0 (
    echo Status: RUNNING
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
        echo PID: %%a
    )
    echo URL: http://localhost:3001/api
    echo.
    REM Try to check health endpoint
    curl -s http://localhost:3001/api/health >nul 2>&1
    if %errorlevel%==0 (
        echo Health: OK - Responding
    ) else (
        echo Health: STARTING - Not responding yet
    )
) else (
    echo Status: NOT RUNNING
)
echo.
echo ----------------------------------------
echo.

REM Check Web Admin (port 5173)
echo [Web Admin - Port 5173]
netstat -ano | findstr ":5173" | findstr LISTENING >nul
if %errorlevel%==0 (
    echo Status: RUNNING
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
        echo PID: %%a
    )
    echo URL: http://localhost:5173
    echo.
    REM Try to check if responding
    curl -s http://localhost:5173 >nul 2>&1
    if %errorlevel%==0 (
        echo Health: OK - Responding
    ) else (
        echo Health: STARTING - Not responding yet
    )
) else (
    echo Status: NOT RUNNING
)
echo.
echo ----------------------------------------
echo.

REM Check Face Recognition (port 5000)
echo [Face Recognition - Port 5000]
netstat -ano | findstr ":5000" | findstr LISTENING >nul
if %errorlevel%==0 (
    echo Status: RUNNING
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
        echo PID: %%a
    )
    echo URL: http://localhost:5000
    echo.
    REM Try to check health endpoint
    curl -s http://localhost:5000/health >nul 2>&1
    if %errorlevel%==0 (
        echo Health: OK - Responding
    ) else (
        echo Health: STARTING - Not responding yet
    )
) else (
    echo Status: NOT RUNNING
)

echo.
echo ========================================
echo  Summary
echo ========================================
echo.

set "BACKEND_RUNNING=0"
set "WEBADMIN_RUNNING=0"
set "FACEREC_RUNNING=0"

netstat -ano | findstr ":3001" | findstr LISTENING >nul
if %errorlevel%==0 set "BACKEND_RUNNING=1"

netstat -ano | findstr ":5173" | findstr LISTENING >nul
if %errorlevel%==0 set "WEBADMIN_RUNNING=1"

netstat -ano | findstr ":5000" | findstr LISTENING >nul
if %errorlevel%==0 set "FACEREC_RUNNING=1"

if %BACKEND_RUNNING%==1 (
    echo [✓] Backend
) else (
    echo [✗] Backend
)

if %WEBADMIN_RUNNING%==1 (
    echo [✓] Web Admin
) else (
    echo [✗] Web Admin
)

if %FACEREC_RUNNING%==1 (
    echo [✓] Face Recognition
) else (
    echo [✗] Face Recognition
)

echo.
echo ========================================
echo.
pause
