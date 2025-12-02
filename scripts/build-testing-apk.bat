@echo off
echo ============================================
echo   Build Testing APK
echo   URL: testing.bravenozora.com
echo ============================================
echo.

cd /d "%~dp0\..\android-testing"

if not exist "gradlew.bat" (
    echo ERROR: android-testing folder not found!
    echo Please copy android/ to android-testing/ first.
    pause
    exit /b 1
)

echo Building Debug APK...
call gradlew.bat assembleDebug

if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo ============================================
echo   BUILD COMPLETE!
echo ============================================
echo.
echo APK Location:
echo android-testing\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Install ke device:
echo adb install -r android-testing\app\build\outputs\apk\debug\app-debug.apk
echo.
echo ============================================
pause
