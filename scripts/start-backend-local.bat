@echo off
echo ========================================
echo  Starting Backend (LOCAL Environment)
echo ========================================
echo.
echo Database: absensi_local (localhost)
echo API: http://localhost:3001
echo.

cd /d "C:\All Bot\absensiApp\backend"

echo Copying .env.local to .env...
copy .env.local .env >nul

echo Starting backend server...
npm run start:dev
