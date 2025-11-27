@echo off
cd /d "%~dp0"
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
echo Using JAVA_HOME: %JAVA_HOME%
echo Building from: %CD%
call "%~dp0gradlew.bat" assembleDebug
