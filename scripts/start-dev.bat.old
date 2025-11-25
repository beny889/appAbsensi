@echo off
echo ========================================
echo  Starting Absensi Development Servers
echo ========================================
echo.

echo [1/3] Checking if servers are already running...
netstat -ano | findstr ":3001" >nul
if %errorlevel%==0 (
    echo Backend already running on port 3001
) else (
    echo Starting Backend Server...
    cd backend
    start "Absensi Backend" cmd /k "npm run start:dev"
    cd ..
    timeout /t 3 /nobreak >nul
    echo Backend started!
)

echo.
netstat -ano | findstr ":5173" >nul
if %errorlevel%==0 (
    echo Web Admin already running on port 5173
) else (
    echo Starting Web Admin...
    cd web-admin
    start "Absensi Web Admin" cmd /k "npm run dev"
    cd ..
    timeout /t 3 /nobreak >nul
    echo Web Admin started!
)

echo.
echo ========================================
echo  Development Servers Status
echo ========================================
echo Backend API:     http://localhost:3001/api
echo Web Admin:       http://localhost:5173
echo API Health:      http://localhost:3001/api/health
echo ========================================
echo.
echo Press any key to check server status...
pause >nul

echo.
echo Checking servers...
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Backend is responding
) else (
    echo [WAIT] Backend is starting... (may take 10-20 seconds)
)

curl -s http://localhost:5173 >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Web Admin is responding
) else (
    echo [WAIT] Web Admin is starting... (may take 5-10 seconds)
)

echo.
echo ========================================
echo  Quick Commands
echo ========================================
echo - Open Web Admin:  start http://localhost:5173
echo - Open API Docs:   start http://localhost:3001/api
echo - Stop Servers:    Ctrl+C in each window
echo ========================================
echo.
