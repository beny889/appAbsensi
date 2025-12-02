# Claude Code Instructions

## Environment Paths (Windows)

- **JAVA_HOME**: `C:\Program Files\Android\Android Studio\jbr`
- **Android SDK**: `C:\Users\benys\AppData\Local\Android\Sdk`
- **Build Tools**: `C:\Users\benys\AppData\Local\Android\Sdk\build-tools\35.0.0`
- **Debug Keystore**: `C:\Users\benys\.android\debug.keystore`

## Build Android APK

### PENTING: Gradle di Windows
Untuk menjalankan gradlew di Windows dari Git Bash/MSYS, gunakan:
```bash
JAVA_HOME="C:\\Program Files\\Android\\Android Studio\\jbr" cmd.exe //c ".\gradlew.bat assembleRelease"
```

### Build Production APK
1. Jalankan: `scripts/build-production-apk.bat`
2. Atau manual dari Git Bash:
   ```bash
   cd /c/All\ Bot/absensiApp/android
   JAVA_HOME="C:\\Program Files\\Android\\Android Studio\\jbr" cmd.exe //c ".\gradlew.bat assembleRelease"
   ```

### Sign APK
Gunakan apksigner.jar (bukan apksigner.bat) dengan java:
```bash
java -jar "C:\Users\benys\AppData\Local\Android\Sdk\build-tools\35.0.0\lib\apksigner.jar" sign --ks "C:\Users\benys\.android\debug.keystore" --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out output.apk input.apk
```

### APK Output Locations
| Environment | APK Location |
|-------------|--------------|
| Production | `Absensi-Production.apk` (project root) |
| Testing | `android-testing/app/build/outputs/apk/debug/app-debug.apk` |
| Local | `android-local/app/build/outputs/apk/debug/app-debug.apk` |

## Server Debug Commands

### Production
```bash
source ~/nodevenv/domains/absen.bravenozora.com/backend/20/bin/activate
cd ~/domains/absen.bravenozora.com/backend
node dist/main.js
```

### Testing
```bash
source ~/nodevenv/domains/testing.bravenozora.com/backend/20/bin/activate
cd ~/domains/testing.bravenozora.com/backend
node dist/main.js
```

### Restart Backend (tanpa SSH debug)
```bash
# Production
touch ~/domains/absen.bravenozora.com/backend/tmp/restart.txt

# Testing
touch ~/domains/testing.bravenozora.com/backend/tmp/restart.txt
```

## Common Issues

### Error: JAVA_HOME is not set
- Pastikan Android Studio terinstall
- Jalankan dari Command Prompt, atau set JAVA_HOME di script

### Error: gradlew.bat not recognized
- Jalankan dari Command Prompt (cmd.exe), bukan Git Bash
- Atau gunakan: `cmd.exe //c ".\gradlew.bat assembleRelease"`

### Error: apksigner.bat not recognized
- Gunakan java langsung: `java -jar ...\lib\apksigner.jar sign ...`
