@echo off
echo ========================================
echo  Stopping Development Servers
echo ========================================
echo.

echo Stopping Backend (port 3001)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do taskkill /F /PID %%a 2>nul
echo Backend stopped.

echo.
echo Stopping Web Admin (port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /F /PID %%a 2>nul
echo Web Admin stopped.

echo.
echo ========================================
echo  All servers stopped!
echo ========================================
