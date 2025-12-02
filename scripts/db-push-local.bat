@echo off
echo ========================================
echo  Push Prisma Schema to LOCAL Database
echo ========================================
echo.
echo Database: absensi_db (localhost)
echo.

cd /d "C:\All Bot\absensiApp\backend"

echo Copying .env.local to .env...
copy .env.local .env >nul

echo.
echo Running prisma db push...
npx prisma db push

echo.
echo ========================================
echo  Schema pushed successfully!
echo ========================================
echo.
pause
