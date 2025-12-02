@echo off
echo ========================================
echo  Seed Local Database (absensi_db)
echo ========================================
echo.
echo This will create:
echo   - Admin user (admin@absensi.com / admin123)
echo   - Default department
echo   - Default work schedule
echo   - 10 dummy employees
echo.

cd /d "C:\All Bot\absensiApp\backend"

echo Copying .env.local to .env...
copy .env.local .env >nul

echo.
echo Running seed script...
npx ts-node prisma/seed-init.ts

echo.
pause
