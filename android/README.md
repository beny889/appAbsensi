# Android Absensi App

Android application untuk sistem absensi dengan **On-Device Face Recognition** menggunakan MobileFaceNet.

## ✅ Status: COMPLETE & READY

Project ini sudah memiliki fitur face registration dan attendance yang lengkap dengan on-device face recognition.

### 📦 Yang Sudah Diimplementasi

- ✅ Gradle configuration (build.gradle)
- ✅ AndroidManifest.xml dengan permissions
- ✅ Package structure (MVVM + Clean Architecture)
- ✅ Dependencies setup (Hilt, Retrofit, ML Kit, CameraX, TFLite)
- ✅ **On-Device Face Recognition** (MobileFaceNet TFLite)
- ✅ **Multi-Pose Registration** (5 foto dari berbagai sudut)
- ✅ **Attendance Flow** (Check-in/Check-out dengan face verification)
- ✅ **Embedding Sync** (Download embeddings dari server)
- ✅ **Late/Early Detection** (Otomatis cek keterlambatan)
- ✅ **Dynamic Threshold Sync** (Sync threshold dari backend saat retry)
- ✅ **Identity Confirmation Dialog** (Konfirmasi identitas sebelum submit)
- ✅ **Face Match Logging** (Log setiap percobaan face matching ke backend)
- ✅ **Camera Lifecycle Management** (Proper onPause/onResume handling)

## 🧠 On-Device Face Recognition

Sistem ini menggunakan **MobileFaceNet TFLite** untuk face recognition langsung di device Android, **tanpa perlu server ML**.

### Cara Kerja:

```
┌─────────────────────────────────────────────────────┐
│                   ANDROID DEVICE                     │
├─────────────────────────────────────────────────────┤
│  1. Kamera menangkap wajah                          │
│           ↓                                          │
│  2. ML Kit mendeteksi wajah (validasi posisi)       │
│           ↓                                          │
│  3. MobileFaceNet ekstrak embedding (192 dimensi)   │
│           ↓                                          │
│  4. Bandingkan dengan embeddings lokal              │
│     (tersimpan di SharedPreferences)                │
│           ↓                                          │
│  5. Hitung jarak Euclidean, cari match terbaik      │
│           ↓                                          │
│  6. Jika jarak < threshold (dari backend) → Cocok!  │
│           ↓                                          │
│  7. Tampilkan dialog konfirmasi identitas           │
└─────────────────────────────────────────────────────┘
                      ↓
              User konfirmasi → Kirim ke Backend:
              { userId, type, distance, similarity }
```

### Model Specifications:

| Spec | Value |
|------|-------|
| **Model** | MobileFaceNet TFLite |
| **Input** | 112x112 RGB |
| **Output** | 192-dimensional embedding |
| **Distance Metric** | Euclidean (L2 norm) |
| **Threshold** | Dynamic dari backend (default: 0.35) |
| **Accuracy** | 99.55% on LFW |

## 📁 Struktur Package

```
com.absensi/
├── AbsensiApplication.kt          # Application class dengan Hilt
├── util/
│   ├── Constants.kt               # ✅ Constants & thresholds
│   ├── Resource.kt                # ✅ Resource wrapper
│   ├── ImageUtils.kt              # ✅ Image processing
│   ├── FaceRecognitionHelper.kt   # ✅ MobileFaceNet TFLite
│   └── EmbeddingStorage.kt        # ✅ Local embedding cache
├── data/
│   ├── remote/
│   │   ├── api/
│   │   │   ├── ApiService.kt      # ✅ Retrofit interface
│   │   │   └── RetrofitClient.kt  # ✅ HTTP client
│   │   └── dto/
│   │       ├── AuthDto.kt         # ✅ Auth DTOs
│   │       ├── FaceRegistrationDto.kt  # ✅ Registration DTOs
│   │       └── AttendanceDto.kt   # ✅ Attendance DTOs
│   └── repository/
│       └── FaceRegistrationRepository.kt  # ✅ API integration
├── presentation/
│   ├── main/
│   │   ├── MainActivity.kt        # ✅ Main entry point
│   │   └── HomeFragment.kt        # ✅ Dashboard with stats
│   └── camera/
│       └── CameraActivity.kt      # ✅ Face capture & recognition
└── di/
    └── NetworkModule.kt           # ✅ Hilt DI modules
```

## 🎯 Implemented Features

### 1. Face Registration (Multi-Pose) ✅

Pengguna diminta mengambil **5 foto dari sudut berbeda** untuk akurasi maksimal:

| No | Pose | Emoji | Deskripsi |
|----|------|-------|-----------|
| 1 | Depan | 😐 | Wajah lurus ke kamera |
| 2 | Kiri | 👈 | Toleh sedikit ke kiri |
| 3 | Kanan | 👉 | Toleh sedikit ke kanan |
| 4 | Atas | ☝️ | Angkat dagu sedikit |
| 5 | Bawah | 👇 | Tunduk sedikit |

**Flow:**
1. User tap "📸 Rekam Data Wajah"
2. CameraActivity opens dengan pose guide
3. Capture 5 foto dengan validasi real-time
4. Ekstrak 5 embeddings menggunakan MobileFaceNet
5. Kirim ke backend untuk approval admin
6. Admin approve → User account created

### 2. Attendance (Check-in/Check-out) ✅

**Flow:**
1. User tap "Absen Masuk" atau "Absen Pulang"
2. CameraActivity opens untuk face verification
3. Wajah di-capture dan embedding diekstrak
4. Dibandingkan dengan embeddings tersimpan
5. Jika match → konfirmasi dengan foto pendaftaran
6. User confirm → attendance record created
7. Backend otomatis cek telat/pulang awal

### 3. Embedding Sync ✅

Embeddings semua user yang approved di-download ke device saat:
- App pertama kali dibuka
- Manual refresh
- Background sync
- **Saat klik "Coba Lagi"** di dialog error

```kotlin
// EmbeddingStorage.kt
fun syncFromServer() {
    // Download semua approved user embeddings
    // Download settings (faceDistanceThreshold)
    // Simpan ke SharedPreferences
    // Untuk offline capability
}
```

### 4. Dynamic Threshold Sync ✅

Threshold face matching di-sync dari backend:

```kotlin
// Response dari /api/attendance/sync-embeddings
{
    "settings": {
        "faceDistanceThreshold": 0.35,
        "updatedAt": 1764174551290
    }
}

// CameraActivity.kt - syncThresholdAndRetry()
// Dipanggil saat user klik "Coba Lagi" di dialog error
// Sync threshold + embeddings terbaru dari backend
// Simpan ke EmbeddingStorage.saveFaceThreshold()
```

### 5. Identity Confirmation Dialog ✅

Setelah face match berhasil, tampilkan dialog konfirmasi:
- Menampilkan nama user yang di-match
- Menampilkan foto registrasi user
- User bisa konfirmasi atau batal
- **Face detection STOP** saat dialog muncul (mencegah re-scan)

### 6. Permanent Face Detection Stop ✅

Setelah user konfirmasi profil ("Ya, ini saya"):
- **`isProfileConfirmed = true`** - Permanent block
- Face detection STOP TOTAL sampai Activity finish
- Berlaku untuk CHECK_IN dan CHECK_OUT
- User harus kembali ke Home untuk scan ulang

### 7. Early Checkout Check Before Dialog ✅

Untuk CHECK_OUT, sistem cek jadwal SEBELUM tampilkan dialog:
- Jika **early** → Dialog early checkout langsung (dengan info user)
- Jika **not early** → Dialog konfirmasi identitas normal
- Cancel early checkout → `isProfileConfirmed = true` (face detection tetap stop)

### 8. Camera Lifecycle Management ✅

Proper handling saat Activity pause/resume:
- **onPause()**: Release camera resources, set processing flags
- **onResume()**: Restart camera, reset all state flags
- **Prevents**: App crash saat switch mode (Masuk ↔ Pulang)

```kotlin
override fun onPause() {
    super.onPause()
    isProcessing = true
    cameraProvider?.unbindAll()
}

override fun onResume() {
    super.onResume()
    isProcessing = false
    isProfileConfirmed = false
    if (cameraProvider != null) startCamera()
}
```

### 9. Face Match Logging ✅

Log setiap percobaan face matching ke backend untuk debugging:
- Kirim data setelah face matching selesai (sukses/gagal)
- Includes: threshold, distance, similarity, all comparisons
- Endpoint: `POST /api/attendance/log-attempt`

## 📱 Build & Run

```bash
# 1. Open in Android Studio
File → Open → Select android folder

# 2. Download MobileFaceNet model
# Letakkan file `mobile_face_net.tflite` di:
# android/app/src/main/assets/mobile_face_net.tflite
# Lihat assets/README_MODEL.md untuk download link

# 3. Sync Gradle
Tools → Sync Project with Gradle Files

# 4. Setup ADB Reverse (untuk USB connection)
adb reverse tcp:3001 tcp:3001

# 5. Build & Run
Run → Run 'app'
```

## 🔧 Network Setup

### For Physical Device (USB) - Recommended
```bash
# Connect device via USB
adb devices

# Setup port forwarding
adb reverse tcp:3001 tcp:3001

# Verify
adb reverse --list
```

### For Emulator
```kotlin
// Change BASE_URL in Constants.kt to:
const val BASE_URL = "http://10.0.2.2:3001/api/"
```

### For WiFi (Same Network)
```kotlin
// Change BASE_URL in Constants.kt to:
const val BASE_URL = "http://192.168.x.x:3001/api/"
```

## 🔧 Configuration

### Constants.kt

```kotlin
object Constants {
    const val BASE_URL = "http://localhost:3001/api/"

    // Face Recognition
    const val FACE_DISTANCE_THRESHOLD = 0.7f  // Lower = stricter
    const val MIN_FACE_SIZE = 0.15f
    const val REQUIRED_STABLE_FRAMES = 15

    // Timeouts
    const val CONNECT_TIMEOUT = 30L
    const val READ_TIMEOUT = 30L
    const val WRITE_TIMEOUT = 60L
}
```

### FaceRecognitionHelper.kt

```kotlin
class FaceRecognitionHelper(context: Context) {
    private val interpreter: Interpreter  // TFLite interpreter

    // Extract 192-dim embedding from face bitmap
    fun getEmbedding(bitmap: Bitmap): FloatArray

    // Calculate Euclidean distance between embeddings
    fun calculateDistance(emb1: FloatArray, emb2: FloatArray): Float

    // Find best match from stored embeddings
    fun findBestMatch(embedding: FloatArray): MatchResult?
}
```

## ⚠️ Important Notes

- **Minimum SDK**: 24 (Android 7.0)
- **Target SDK**: 34 (Android 14)
- **Permissions**: Camera only (no location needed)
- **Model file**: `mobile_face_net.tflite` harus ada di assets
- **Lighting**: Pastikan pencahayaan cukup untuk face detection
- **HTTPS**: Gunakan HTTPS di production

## 📚 Resources & References

- [MobileFaceNet Paper](https://arxiv.org/abs/1804.07573)
- [ML Kit Face Detection](https://developers.google.com/ml-kit/vision/face-detection)
- [TensorFlow Lite Android](https://www.tensorflow.org/lite/android)
- [CameraX Guide](https://developer.android.com/training/camerax)
- [Hilt Dependency Injection](https://developer.android.com/training/dependency-injection/hilt-android)

---

## ✅ Production Ready

- **Debug Code Removed**: Semua `Log.d()` statements dihapus
- **Clean UI**: Visual threshold badge dihapus dari camera
- **New App Logo**: Fingerprint icon biru gradient dengan background putih
- **Error Logging**: Hanya `Log.e()` untuk production error tracking

---

Untuk detail lebih lengkap, lihat **ANDROID_GUIDE.md**.

---

**Last Updated**: November 27, 2025
**Version**: 2.2.0 (Production Ready - Debug Removed, New Logo)
