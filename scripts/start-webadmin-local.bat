@echo off
echo ========================================
echo  Starting Web Admin (LOCAL Environment)
echo ========================================
echo.
echo API: http://localhost:3001/api
echo Web: http://localhost:5173
echo.

cd /d "C:\All Bot\absensiApp\web-admin"

echo Copying .env.local to .env...
copy .env.local .env >nul

echo Starting web admin server...
npm run dev
