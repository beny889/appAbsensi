# Network Setup Guide - Android App

Panduan lengkap untuk setup networking antara Android app dan Backend API.

## 📋 Prerequisites

- Android device atau emulator terhubung via ADB
- Backend API berjalan di `http://localhost:3001`
- ADB (Android Debug Bridge) terinstall

## 🔧 Setup Methods

Ada 3 metode untuk menghubungkan Android app dengan backend:

### Method 1: ADB Reverse (Recommended untuk Real Device)

**Kelebihan**: Paling mudah, tidak perlu konfigurasi IP

**Setup**:
```bash
# Jalankan script otomatis
./setup-adb-reverse.bat

# Atau manual:
adb reverse tcp:3001 tcp:3001
adb reverse --list  # Verify
```

**BASE_URL di kode**: `http://localhost:3001/api/`

**Cocok untuk**:
- ✅ Real device via USB
- ✅ Development & testing
- ✅ Backend di laptop yang sama

---

### Method 2: WiFi/LAN IP (Untuk Production)

**Setup**:

1. Cari IP address laptop Anda:
   ```bash
   # Windows
   ipconfig

   # Mac/Linux
   ifconfig
   ```

2. Update `BASE_URL` di kode:
   ```kotlin
   // RetrofitClient.kt atau Constants.kt
   const val BASE_URL = "http://192.168.x.x:3001/api/"
   ```

3. Pastikan device dan laptop di network yang sama

**Cocok untuk**:
- ✅ Production testing
- ✅ Multiple devices
- ✅ Tanpa USB connection

---

### Method 3: Android Emulator

**Setup**:

Update `BASE_URL` di kode:
```kotlin
const val BASE_URL = "http://10.0.2.2:3001/api/"
```

`10.0.2.2` adalah special alias untuk localhost dari emulator Android.

**Cocok untuk**:
- ✅ Development di emulator
- ✅ Quick testing tanpa device

---

## 🚀 Quick Start (Recommended)

### Step 1: Start Backend
```bash
cd backend
npm run start:dev
# Backend akan running di http://localhost:3001
```

### Step 2: Connect Device & Setup ADB
```bash
# Connect Android device via USB
# Enable USB Debugging di device

# Verify connection
adb devices

# Setup port forwarding
cd android
./setup-adb-reverse.bat
```

### Step 3: Install & Run App
```bash
# Build & install APK
./gradlew installDebug

# Atau install manual
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Step 4: Test Connection
Di aplikasi, coba fitur "Rekam Data Wajah". Jika berhasil connect, registrasi akan ter-submit.

---

## 🐛 Troubleshooting

### Error: "Cannot connect to server"

**Solusi**:
1. Pastikan backend running:
   ```bash
   curl http://localhost:3001/api/health
   # Response: {"status":"ok"}
   ```

2. Cek ADB reverse:
   ```bash
   adb reverse --list
   # Should show: tcp:3001 -> tcp:3001
   ```

3. Setup ulang ADB reverse:
   ```bash
   adb reverse --remove tcp:3001
   adb reverse tcp:3001 tcp:3001
   ```

4. Test dari device:
   ```bash
   adb shell "curl http://localhost:3001/api/health"
   ```

---

### Error: "Unknown host" atau "Network error"

**Solusi**:
1. Cek BASE_URL di kode sesuai dengan method yang digunakan
2. Pastikan `android:usesCleartextTraffic="true"` di AndroidManifest.xml
3. Rebuild aplikasi setelah ubah BASE_URL

---

### Error: "Timeout"

**Solusi**:
1. Increase timeout di `Constants.kt`:
   ```kotlin
   const val CONNECT_TIMEOUT = 60L  // Increase to 60s
   const val READ_TIMEOUT = 60L
   ```

2. Cek apakah backend terlalu lambat respond
3. Cek koneksi network

---

## 📱 Monitoring & Debugging

### View App Logs
```bash
# Filter logs untuk app absensi
adb logcat | grep -i "absensi\|FaceRegistration\|retrofit\|okhttp"

# Clear logs sebelum test
adb logcat -c
```

### View Backend Logs
```bash
# Di terminal backend, watch for incoming requests
# Setiap request akan terlog di console
```

### Test API Endpoint
```bash
# Test dari laptop
curl -X POST http://localhost:3001/api/face-registration/submit \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","faceImageBase64":"base64string"}'

# Test dari device (via adb shell)
adb shell "curl -X POST http://localhost:3001/api/face-registration/submit \
  -H 'Content-Type: application/json' \
  -d '{\"name\":\"Test\",\"faceImageBase64\":\"test\"}'"
```

---

## 🔐 Security Notes

### Development
- HTTP (tanpa S) boleh digunakan untuk development
- `usesCleartextTraffic="true"` diperlukan untuk HTTP

### Production
- **WAJIB** gunakan HTTPS
- Deploy backend dengan SSL certificate
- Update `BASE_URL` ke `https://your-domain.com/api/`
- Set `usesCleartextTraffic="false"` atau remove

---

## 📝 Configuration Files

### RetrofitClient.kt
```kotlin
object RetrofitClient {
    // Main BASE_URL configuration
    private const val BASE_URL = "http://localhost:3001/api/"
    // ...
}
```

### Constants.kt
```kotlin
object Constants {
    // Backup BASE_URL (optional)
    const val BASE_URL = "http://localhost:3001/api/"
    const val CONNECT_TIMEOUT = 30L
    const val READ_TIMEOUT = 30L
    const val WRITE_TIMEOUT = 30L
}
```

### AndroidManifest.xml
```xml
<application
    android:usesCleartextTraffic="true"
    ...>
```

---

## ✅ Checklist untuk Setiap Development Session

- [ ] Backend running di localhost:3001
- [ ] Android device connected via USB
- [ ] USB Debugging enabled
- [ ] ADB reverse setup (untuk real device)
- [ ] BASE_URL configured correctly
- [ ] App installed dengan APK terbaru

---

## 🆘 Support

Jika masih ada masalah:
1. Cek logs di Android (adb logcat)
2. Cek logs di Backend console
3. Test endpoint dengan curl
4. Verify ADB connection
5. Rebuild & reinstall app

---

**Last Updated**: 2025-11-24
**Version**: 1.0
