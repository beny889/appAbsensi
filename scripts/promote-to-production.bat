@echo off
echo ============================================
echo   Promote Testing to Production
echo   testing.bravenozora.com → absen.bravenozora.com
echo ============================================
echo.
echo CHECKLIST sebelum promote:
echo [ ] Semua fitur sudah ditest di testing.bravenozora.com
echo [ ] Tidak ada error di browser console
echo [ ] Database schema sudah sesuai
echo [ ] Login dan semua menu berfungsi
echo.
set /p confirm="Sudah test semua? Lanjutkan promote ke production? (y/n): "
if /i not "%confirm%"=="y" (
    echo Dibatalkan.
    pause
    exit /b 0
)

echo.
echo Building untuk Production...
echo.

:: Build backend
echo [1/2] Building Backend (Production)...
cd /d "%~dp0\..\backend"
call npm run build:production
if errorlevel 1 (
    echo ERROR: Backend build failed!
    pause
    exit /b 1
)
echo Backend build complete!
echo.

:: Build web-admin
echo [2/2] Building Web Admin (Production)...
cd /d "%~dp0\..\web-admin"
call npm run build:production
if errorlevel 1 (
    echo ERROR: Web Admin build failed!
    pause
    exit /b 1
)
echo Web Admin build complete!
echo.

echo ============================================
echo   PRODUCTION BUILD COMPLETE!
echo ============================================
echo.
echo Upload files ke server production:
echo.
echo 1. Backend:
echo    - backend/dist/           → ~/domains/absen.bravenozora.com/backend/dist/
echo    - backend/prisma/         → ~/domains/absen.bravenozora.com/backend/prisma/
echo    - backend/.env.production → ~/domains/absen.bravenozora.com/backend/.env
echo.
echo 2. Web Admin:
echo    - web-admin/dist/         → ~/domains/absen.bravenozora.com/public_html/
echo.
echo 3. SSH ke server dan jalankan:
echo    source ~/nodevenv/domains/absen.bravenozora.com/backend/20/bin/activate
echo    cd ~/domains/absen.bravenozora.com/backend
echo    npx prisma generate
echo    touch tmp/restart.txt
echo.
echo ============================================
pause
