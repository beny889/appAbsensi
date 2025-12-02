@echo off
echo ============================================
echo   Deploy to Testing Environment
echo   testing.bravenozora.com
echo ============================================
echo.

:: Build backend
echo [1/2] Building Backend...
cd /d "%~dp0\..\backend"
call npm run build:testing
if errorlevel 1 (
    echo ERROR: Backend build failed!
    pause
    exit /b 1
)
echo Backend build complete!
echo.

:: Build web-admin
echo [2/2] Building Web Admin...
cd /d "%~dp0\..\web-admin"
call npm run build:testing
if errorlevel 1 (
    echo ERROR: Web Admin build failed!
    pause
    exit /b 1
)
echo Web Admin build complete!
echo.

echo ============================================
echo   BUILD COMPLETE!
echo ============================================
echo.
echo Upload files ke server testing:
echo.
echo 1. Backend:
echo    - backend/dist/        → ~/domains/testing.bravenozora.com/backend/dist/
echo    - backend/prisma/      → ~/domains/testing.bravenozora.com/backend/prisma/
echo    - backend/.env.testing → ~/domains/testing.bravenozora.com/backend/.env
echo.
echo 2. Web Admin:
echo    - web-admin/dist/      → ~/domains/testing.bravenozora.com/public_html/
echo.
echo 3. SSH ke server dan jalankan:
echo    source ~/nodevenv/domains/testing.bravenozora.com/backend/20/bin/activate
echo    cd ~/domains/testing.bravenozora.com/backend
echo    npx prisma generate
echo    touch tmp/restart.txt
echo.
echo ============================================
pause
