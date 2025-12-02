@echo off
echo ========================================
echo  Building LOCAL APK
echo ========================================
echo.

cd /d "C:\All Bot\absensiApp\android-local"

echo Building debug APK...
call gradlew.bat assembleDebug

echo.
echo ========================================
echo  Build Complete!
echo ========================================
echo  APK Location:
echo  android-local\app\build\outputs\apk\debug\app-debug.apk
echo ========================================
echo.
echo Press any key to exit...
pause >nul
