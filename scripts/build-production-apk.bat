@echo off
echo ========================================
echo  Building PRODUCTION APK
echo ========================================
echo.

REM Set JAVA_HOME
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set PATH=%JAVA_HOME%\bin;%PATH%

REM Set paths
set ANDROID_DIR=C:\All Bot\absensiApp\android
set BUILD_TOOLS=C:\Users\benys\AppData\Local\Android\Sdk\build-tools\35.0.0
set APK_DIR=%ANDROID_DIR%\app\build\outputs\apk\release
set KEYSTORE=C:\Users\benys\.android\debug.keystore

cd /d "%ANDROID_DIR%"

echo Step 1: Building release APK...
call gradlew.bat assembleRelease
if errorlevel 1 goto error

echo.
echo Step 2: Zipalign APK...
"%BUILD_TOOLS%\zipalign.exe" -v -p 4 "%APK_DIR%\app-release-unsigned.apk" "%APK_DIR%\app-release-aligned.apk"
if errorlevel 1 goto error

echo.
echo Step 3: Signing APK...
java -jar "%BUILD_TOOLS%\lib\apksigner.jar" sign --ks "%KEYSTORE%" --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out "%APK_DIR%\app-release-signed.apk" "%APK_DIR%\app-release-aligned.apk"
if errorlevel 1 goto error

echo.
echo Step 4: Copying to project root...
copy "%APK_DIR%\app-release-signed.apk" "C:\All Bot\absensiApp\Absensi-Production.apk"

echo.
echo ========================================
echo  Build Complete!
echo ========================================
echo  APK Location:
echo  C:\All Bot\absensiApp\Absensi-Production.apk
echo ========================================
echo.
goto end

:error
echo.
echo ========================================
echo  BUILD FAILED!
echo ========================================
echo.

:end
echo Press any key to exit...
pause >nul
