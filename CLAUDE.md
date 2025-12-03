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

## Build Web Admin

### PENTING: Vite Environment Files
Vite memiliki prioritas environment file:
- `npm run dev` → `.env` atau `.env.development`
- `npm run build` → `.env.production` (OVERRIDE semua .env lain!)
- `npm run build -- --mode testing` → `.env.testing`

**JANGAN** langsung `npm run build` untuk testing! Akan menggunakan API production.

### Build Commands per Environment
| Environment | Command | API URL |
|-------------|---------|---------|
| Local Dev | `npm run dev` | localhost:3001 |
| Testing | `npm run build -- --mode testing` | testing.bravenozora.com |
| Production | `npm run build` | bravenozora.com |

### Verifikasi Build sebelum Deploy
Pastikan API URL benar sebelum upload:
```bash
cd web-admin
grep -r "bravenozora" dist/assets/*.js | head -1
```
- Testing: harus ada `testing.bravenozora.com`
- Production: harus ada `bravenozora.com` (tanpa testing)

### Common Issue: CORS Error setelah Deploy
**Gejala:** Web admin blank, console error CORS
**Penyebab:** Build menggunakan `.env.production` bukan `.env.testing`
**Solusi:** Rebuild dengan `npm run build -- --mode testing`

## Environment URLs (PENTING!)

### Konfigurasi yang BENAR:

| File | VITE_API_URL |
|------|--------------|
| `.env` (local) | `http://localhost:3001/api` |
| `.env.testing` | `https://testing.bravenozora.com/api` |
| `.env.production` | `https://absen.bravenozora.com/api` |

### PERHATIAN!
- Production URL adalah `absen.bravenozora.com`, **BUKAN** `bravenozora.com`
- Selalu verifikasi setelah build:
  ```bash
  grep -o "https://[^\"]*bravenozora[^\"]*" dist/assets/*.js | head -1
  ```
- Jika muncul error CORS dengan URL berbeda dari origin, cek `.env.production`

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

### Error: CORS setelah deploy web-admin ke testing
- Penyebab: `npm run build` menggunakan `.env.production` (API production)
- Solusi: Gunakan `npm run build -- --mode testing`
- Verifikasi: `grep -r "testing.bravenozora" dist/assets/*.js`

## Multi-Embedding Face Recognition

### Arsitektur
- Registrasi: Android app mengambil **5 foto** dari sudut berbeda
- Setiap foto menghasilkan 1 embedding (192-dimensional vector)
- Semua 5 embeddings disimpan di database field `faceEmbeddings` (JSON array)
- Field `faceEmbedding` (singular) untuk backward compatibility

### File Penting
| Komponen | File |
|----------|------|
| Registrasi | `android/*/presentation/camera/CameraActivity.kt` |
| Face Matching | `android/*/ml/FaceRecognitionHelper.kt` |
| **Face Alignment** | `android/*/util/FaceAlignmentUtils.kt` |
| Image Utils | `android/*/util/ImageUtils.kt` |
| Sync Embeddings | `backend/src/modules/attendance/attendance.service.ts` |
| Face Match Logs | `web-admin/src/pages/FaceMatchLogs/FaceMatchLogs.tsx` |

### Face Alignment (v2.6.0)
**Meningkatkan akurasi face recognition ~3% dengan alignment berbasis ML Kit landmarks**

**Cara Kerja:**
1. ML Kit mendeteksi `LEFT_EYE` dan `RIGHT_EYE` landmarks
2. Hitung sudut kemiringan wajah dari posisi mata
3. Rotasi gambar untuk membuat mata horizontal
4. Crop wajah berdasarkan jarak mata (2.5x eye distance)
5. Posisi mata di 35% dari atas output
6. Resize ke 112x112 untuk MobileFaceNet

**FaceAlignmentUtils.kt Parameters:**
```kotlin
OUTPUT_SIZE = 112           // MobileFaceNet input size
EYE_Y_RATIO = 0.35f         // Posisi mata di output (35% dari atas)
FACE_WIDTH_RATIO = 2.5f     // Crop size = 2.5x eye distance
```

**CameraActivity.kt Changes:**
```kotlin
// ML Kit Face Detector options
.setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)  // Enable landmarks

// Di processImageProxy()
val fullBitmap = ImageUtils.imageProxyToBitmap(imageProxy)
val alignedFace = FaceAlignmentUtils.alignAndCropFace(fullBitmap, face)
```

### Data Flow Face Match Logs
1. Android app melakukan face matching dengan `findBestMatchMultiWithLog()`
2. Hasil dikirim ke backend via `/attendance/log-attempt`
3. Data `allMatches` berisi JSON dengan field:
   - `odId`, `name`, `distance`, `similarity`, `isMatch`, **`embeddingsCount`**

### Catatan Penting
- `UserMatchInfo` di `FaceRecognitionHelper.kt` HARUS include `embeddingsCount`
- JSON output di `CameraActivity.kt` HARUS include `"embeddingsCount":${match.embeddingsCount}`
- Jika Face Match Logs menunjukkan Embeddings = 1 padahal database punya 5:
  - Cek apakah APK sudah diupdate dengan kode yang benar
  - Cek `UserMatchInfo` data class sudah ada field `embeddingsCount`
  - Cek JSON builder sudah include `embeddingsCount`

### Sync Antar Folder Android
Perubahan di `android/` harus di-sync ke:
- `android-testing/` - untuk testing server
- `android-local/` - untuk local development

## Deploy dari Testing ke Production

### Checklist Sebelum Deploy
- [ ] Semua fitur sudah di-test di testing.bravenozora.com
- [ ] Tidak ada error di console browser
- [ ] Face Match Logs menunjukkan data yang benar (embeddingsCount = 5)
- [ ] Absensi masuk/pulang berfungsi normal

---

### LANGKAH 1: Build Web Admin Production

**Di terminal lokal (Git Bash):**
```bash
cd "/c/All Bot/absensiApp/web-admin"
npm run build
```

**Verifikasi hasil build (WAJIB!):**
```bash
cd "/c/All Bot/absensiApp/web-admin/dist/assets"
grep -o "https://[^\"]*bravenozora[^\"]*" *.js | head -1
```
✅ Harus muncul: `https://absen.bravenozora.com/api`
❌ Jika muncul `testing.bravenozora.com` = SALAH (untuk testing)
❌ Jika muncul `bravenozora.com/api` (tanpa "absen") = SALAH, cek `.env.production`

**Compress untuk upload:**
```bash
cd "/c/All Bot/absensiApp/web-admin"
tar -cvf dist.tar dist/
```
📁 File hasil: `web-admin/dist.tar`

---

### LANGKAH 2: Build Backend Production

**Di terminal lokal (Git Bash):**
```bash
cd "/c/All Bot/absensiApp/backend"
npm run build
```

**Compress untuk upload:**
```bash
cd "/c/All Bot/absensiApp/backend"
tar -cvf all.tar dist/ prisma/ package.json
```
📁 File hasil: `backend/all.tar`

---

### LANGKAH 3: Build Android Production APK

**Di terminal lokal (Git Bash):**
```bash
cd "/c/All Bot/absensiApp/android"
JAVA_HOME="C:\\Program Files\\Android\\Android Studio\\jbr" cmd.exe //c ".\gradlew.bat clean assembleRelease"
```

📁 File hasil: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

**Sign APK:**
```bash
# Align APK
"/c/Users/benys/AppData/Local/Android/Sdk/build-tools/35.0.0/zipalign" -v -p 4 \
  "/c/All Bot/absensiApp/android/app/build/outputs/apk/release/app-release-unsigned.apk" \
  "/c/All Bot/absensiApp/android/app/build/outputs/apk/release/app-release-aligned.apk"

# Sign dengan debug keystore (atau production keystore)
java -jar "/c/Users/benys/AppData/Local/Android/Sdk/build-tools/35.0.0/lib/apksigner.jar" sign \
  --ks "/c/Users/benys/.android/debug.keystore" \
  --ks-key-alias androiddebugkey \
  --ks-pass pass:android \
  --key-pass pass:android \
  --out "/c/All Bot/absensiApp/Absensi-Production.apk" \
  "/c/All Bot/absensiApp/android/app/build/outputs/apk/release/app-release-aligned.apk"
```

📁 File hasil: `Absensi-Production.apk` (di root folder)

---

### LANGKAH 4: Upload ke Server Production

**Buka FileZilla/WinSCP, connect ke server production:**
- Host: (sesuai hosting)
- Username: (sesuai hosting)
- Port: 22 (SFTP)

**Upload Web Admin:**
1. Upload file `web-admin/dist.tar` ke `~/domains/absen.bravenozora.com/`
2. SSH ke server, jalankan:
```bash
cd ~/domains/absen.bravenozora.com
tar -xvf dist.tar
rm -rf public_html/*
mv dist/* public_html/
rm -rf dist dist.tar
```

**Upload Backend:**
1. Upload file `backend/all.tar` ke `~/domains/absen.bravenozora.com/backend/`
2. SSH ke server, jalankan:
```bash
cd ~/domains/absen.bravenozora.com/backend
tar -xvf all.tar
rm all.tar
touch tmp/restart.txt
```

---

### LANGKAH 5: Verifikasi Production

1. **Web Admin:** Buka https://absen.bravenozora.com
   - [ ] Halaman login muncul dengan benar
   - [ ] Footer "© 2025 Absensi System • v2.4.0" terlihat
   - [ ] Login berhasil

2. **Cek Fitur:**
   - [ ] Menu Karyawan - ada pagination dan kolom No
   - [ ] Menu Absensi - ada kolom No
   - [ ] Menu Face Match Logs - format similarity benar (75%, bukan 7500%)
   - [ ] Logo di sidebar terlihat

3. **Test APK Production:**
   - [ ] Install `Absensi-Production.apk` ke HP
   - [ ] Test absensi masuk
   - [ ] Cek Face Match Logs - embeddingsCount harus sesuai

---

### LANGKAH 6: Distribute APK ke Users

**Opsi 1: Share langsung**
- Kirim file `Absensi-Production.apk` via WhatsApp/Telegram/Email

**Opsi 2: Upload ke server**
```bash
# Upload ke public_html agar bisa didownload
scp Absensi-Production.apk user@server:~/domains/absen.bravenozora.com/public_html/
```
URL download: https://absen.bravenozora.com/Absensi-Production.apk

---

### Rollback jika Error

**Restore Web Admin:**
```bash
# Di server production
cd ~/domains/absen.bravenozora.com
# Pastikan ada backup sebelumnya
cp -r public_html_backup/* public_html/
```

**Restore Backend:**
```bash
cd ~/domains/absen.bravenozora.com/backend
cp -r dist_backup/* dist/
touch tmp/restart.txt
```

**Tip:** Selalu backup sebelum deploy!
```bash
# Backup sebelum deploy
cd ~/domains/absen.bravenozora.com
cp -r public_html public_html_backup
cp -r backend/dist backend/dist_backup
```
