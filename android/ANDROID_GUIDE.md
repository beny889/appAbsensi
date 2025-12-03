# Android App - Development Guide

Panduan lengkap untuk Android app sistem absensi dengan **on-device face recognition** menggunakan MobileFaceNet.

## 🌐 Production Configuration

| Environment | URL |
|-------------|-----|
| **Backend API** | https://absen.bravenozora.com/api/ |
| **Web Admin** | https://absen.bravenozora.com |

## Tech Stack

| Component | Technology |
|-----------|------------|
| Language | Kotlin |
| Architecture | MVVM |
| Camera | CameraX |
| Face Detection | ML Kit Face Detection |
| Face Recognition | MobileFaceNet TFLite (192-dim) |
| HTTP Client | Retrofit + OkHttp |
| DI | Hilt |

## On-Device Face Recognition

### MobileFaceNet TFLite
- **Model**: `assets/mobile_face_net.tflite` (~5MB)
- **Input**: 112x112 RGB image
- **Output**: 192-dimensional embedding vector
- **Matching**: Euclidean distance (threshold: 0.7)

### Face Alignment (v2.6.0)
**Meningkatkan akurasi ~3% dengan alignment berbasis posisi mata**

| Step | Deskripsi |
|------|-----------|
| 1 | ML Kit deteksi LEFT_EYE dan RIGHT_EYE landmarks |
| 2 | Hitung sudut kemiringan wajah dari posisi mata |
| 3 | Rotasi gambar untuk membuat mata horizontal |
| 4 | Crop berdasarkan jarak mata (2.5x eye distance) |
| 5 | Posisi mata di 35% dari atas output |
| 6 | Resize ke 112x112 untuk MobileFaceNet |

**Parameters:**
```kotlin
OUTPUT_SIZE = 112           // MobileFaceNet input size
EYE_Y_RATIO = 0.35f         // Posisi mata (35% dari atas)
FACE_WIDTH_RATIO = 2.5f     // Crop = 2.5x eye distance
```

### Key Files
```
android/app/src/main/
├── assets/
│   └── mobile_face_net.tflite       # Face recognition model
├── java/com/absensi/
│   ├── ml/
│   │   └── FaceRecognitionHelper.kt # MobileFaceNet wrapper
│   ├── util/
│   │   ├── FaceAlignmentUtils.kt    # Face alignment (v2.6.0)
│   │   └── ImageUtils.kt            # Image processing
│   ├── data/local/
│   │   └── EmbeddingStorage.kt      # Local embedding cache
│   ├── presentation/
│   │   ├── main/
│   │   │   ├── HomeFragment.kt      # Home screen with attendance list
│   │   │   ├── HomeViewModel.kt     # ViewModel for home
│   │   │   └── AttendanceAdapter.kt # RecyclerView adapter
│   │   └── camera/
│   │       ├── CameraActivity.kt        # Main camera activity
│   │       └── FaceFrameProgressView.kt # Custom corner frame view
│   └── data/repository/
│       ├── AttendanceRepository.kt
│       └── FaceRegistrationRepository.kt
└── res/
    ├── drawable/
    │   ├── ic_arrow_left.xml
    │   ├── ic_arrow_right.xml
    │   ├── ic_arrow_up.xml
    │   ├── ic_arrow_down.xml
    │   ├── ic_face_center.xml
    │   └── bg_counter_badge.xml     # Badge for attendance counter
    └── layout/
        ├── fragment_home.xml        # Home screen layout
        ├── activity_camera.xml
        ├── dialog_early_checkout.xml
        ├── dialog_identity_confirmation.xml
        └── dialog_result.xml
```

## Home Screen UI

### Layout Components
| Component | Description |
|-----------|-------------|
| Header Card | Menampilkan waktu real-time (HH:MM:SS) dan tanggal |
| Action Buttons | Tombol MASUK (hijau) dan PULANG (merah) |
| Attendance Counter | Badge biru di samping judul riwayat |
| RecyclerView | Daftar absensi hari ini |
| Empty State | Tampilan jika belum ada absensi |

### Attendance Counter Badge
Counter badge menampilkan jumlah karyawan yang sudah absen hari ini:
- Warna: Biru (#1976D2)
- Bentuk: Pill dengan rounded corners (12dp)
- Visibility: Hanya muncul jika count > 0
- Update: Otomatis saat data di-refresh

### Pull to Refresh
- SwipeRefreshLayout untuk refresh data
- Indicator colors: blue, green, orange, red
- Reload attendance list saat user swipe down

## Multi-Pose Registration (5 Foto)

Registrasi wajah menggunakan 5 foto dari sudut berbeda:

| Pose | Deskripsi | Arrow Indicator |
|------|-----------|-----------------|
| 1 | Lihat LURUS ke kamera | Target icon (pulse animation) |
| 2 | Tengok sedikit ke KIRI | Arrow left (animate left) |
| 3 | Tengok sedikit ke KANAN | Arrow right (animate right) |
| 4 | ANGKAT dagu sedikit | Arrow up (animate up) |
| 5 | TUNDUKKAN kepala sedikit | Arrow down (animate down) |

### Registration Flow
```
1. User klik "Daftar Wajah Baru" di HomeFragment
2. CameraActivity opens (MODE_REGISTRATION)
3. Loop for 5 poses:
   a. Show arrow indicator untuk pose saat ini
   b. Corner frame kuning → wajah terdeteksi
   c. Corner frame hijau → wajah stabil (tahan 3 detik)
   d. Auto-capture dengan flash animation
   e. Extract embedding dengan MobileFaceNet
   f. Show checkmark animation
   g. Transition ke pose berikutnya
4. Input nama via dialog
5. Submit 5 embeddings + 5 images ke backend
6. Admin approve di web panel
```

## Corner Frame Visual Feedback

### FaceFrameProgressView States
Corner frame berubah warna sesuai status:

| State | Warna | Kondisi |
|-------|-------|---------|
| DEFAULT | Putih (#FFFFFF) | Tidak ada wajah terdeteksi |
| DETECTED | Kuning (#FFEB3B) | Wajah terdeteksi, belum stabil |
| READY | Hijau (#4CAF50) | Wajah stabil, siap capture |
| WARNING | Merah (#F44336) | Wajah terlalu jauh / tidak di tengah |

### Validation Rules
- **Face Size**: Minimal 25% dari frame (warning jika terlalu kecil)
- **Position**: Wajah harus di tengah (±20% tolerance)
- **Stability**: 15 frame berturut-turut tanpa perubahan signifikan

### Timing Configuration
```kotlin
// CameraActivity.kt
const val STABILITY_FRAMES = 15      // Frames untuk stable
const val CAPTURE_DELAY_MS = 3000L   // Delay setelah READY
const val TRANSITION_DELAY_MS = 1500L // Delay setelah capture
```

## Attendance Flow (Masuk/Pulang)

### Check-in Flow
```
1. User klik "MASUK" di HomeFragment
2. CameraActivity opens (MODE_CHECK_IN)
3. Corner frame indicator aktif
4. Wajah stabil (hijau) → Auto-capture
5. Extract embedding dengan MobileFaceNet
6. On-device matching:
   a. Load embeddings dari cache (atau sync dari server)
   b. Compare dengan semua embeddings
   c. Threshold: 0.7 (Euclidean distance)
7. Match found → Show identity confirmation dialog
8. User confirm → Submit attendance ke backend
9. Show result dialog (success/fail)
```

### Check-out Flow (with Early Detection)
```
1. User klik "PULANG" di HomeFragment
2. CameraActivity opens (MODE_CHECK_OUT)
3. Same face capture flow
4. On-device matching → Identity found
5. Call getUserSchedule API (tidak perlu face recognition lagi)
6. If early checkout:
   a. Show early checkout confirmation dialog
   b. Display: current time, scheduled time, minutes early
   c. User confirm or cancel
7. Submit attendance dengan isEarlyCheckout flag
8. Log attempt ke backend (success/fail)
```

### Camera Lifecycle Management
```
onPause():
- isProcessing = true
- cameraProvider?.unbindAll()  // Release camera

onResume():
- Reset all flags (isProcessing, isProfileConfirmed, etc)
- Restart camera if provider exists

Impact:
- No crash when switching between Masuk ↔ Pulang
- Proper camera resource release
```

## Embedding Sync

Android sync embeddings dari server untuk offline matching:

```kotlin
// AttendanceRepository.kt
suspend fun syncEmbeddings(): List<EmbeddingData> {
    val response = apiService.syncEmbeddings()
    // Cache locally
    embeddingStorage.saveEmbeddings(response.embeddings)
    return response.embeddings
}
```

### API Response
```json
{
  "count": 5,
  "embeddings": [
    {
      "odId": "user-id",
      "name": "User Name",
      "embedding": [192 floats],
      "embeddings": [[192], [192], ...],
      "embeddingsCount": 5
    }
  ],
  "supportsMultipleEmbeddings": true
}
```

## Configuration

### Constants.kt
```kotlin
object Constants {
    // Network - Production URL
    const val BASE_URL = "https://absen.bravenozora.com/api/"
    const val CONNECT_TIMEOUT = 30L
    const val READ_TIMEOUT = 30L
    const val WRITE_TIMEOUT = 30L

    // Development alternatives:
    // const val BASE_URL = "http://10.0.2.2:3001/api/"     // Emulator
    // const val BASE_URL = "http://192.168.x.x:3001/api/"  // WiFi
    // const val BASE_URL = "http://localhost:3001/api/"    // ADB reverse

    const val REQUEST_CAMERA_PERMISSION = 100
}
```

### FaceRecognitionHelper.kt
```kotlin
companion object {
    const val MODEL_NAME = "mobile_face_net.tflite"
    const val INPUT_SIZE = 112
    const val EMBEDDING_SIZE = 192
    const val DISTANCE_THRESHOLD = 0.7f
}
```

## Permissions (AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />

<uses-feature android:name="android.hardware.camera" android:required="true" />
<uses-feature android:name="android.hardware.camera.autofocus" />
```

**Note**: Location permission sudah DIHAPUS. Face recognition only!

## Build & Run

```bash
# Build debug APK
cd android
./gradlew.bat assembleDebug

# Output: app/build/outputs/apk/debug/app-debug.apk

# Install ke device
adb install -r app/build/outputs/apk/debug/app-debug.apk

# View logs
adb logcat | grep -E "FaceRecognition|CameraActivity|embedding"
```

## Troubleshooting

### Face tidak dikenali
1. Cek embedding dimensions (harus 192)
2. Cek threshold di FaceRecognitionHelper.kt
3. Pastikan embeddings sudah sync
4. Re-register jika pakai model lama (128-dim)

### Corner frame tidak berubah warna
1. Pastikan wajah terlihat jelas
2. Dekatkan wajah (minimal 25% frame)
3. Posisikan wajah di tengah oval

### Request entity too large
- Backend sudah di-config untuk 50MB body limit
- Jika masih error, cek `main.ts` di backend

### Embedding dimensions mismatch (192 vs 128)
- Model lama: 128 dimensions
- Model baru (MobileFaceNet): 192 dimensions
- User dengan 128-dim harus re-register

### Network error
```bash
# Untuk emulator
adb reverse tcp:3001 tcp:3001

# Untuk real device, gunakan IP komputer
# dan pastikan firewall allow port 3001
```

## Dependencies (build.gradle)

```gradle
dependencies {
    // CameraX
    implementation "androidx.camera:camera-camera2:1.3.1"
    implementation "androidx.camera:camera-lifecycle:1.3.1"
    implementation "androidx.camera:camera-view:1.3.1"

    // ML Kit Face Detection
    implementation "com.google.mlkit:face-detection:16.1.6"

    // TensorFlow Lite
    implementation "org.tensorflow:tensorflow-lite:2.13.0"
    implementation "org.tensorflow:tensorflow-lite-support:0.4.4"

    // Retrofit
    implementation "com.squareup.retrofit2:retrofit:2.9.0"
    implementation "com.squareup.retrofit2:converter-gson:2.9.0"

    // Hilt
    implementation "com.google.dagger:hilt-android:2.48"
    kapt "com.google.dagger:hilt-compiler:2.48"

    // Coroutines
    implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3"
}
```

---

**Last Updated**: December 3, 2025
**Version**: 2.6.0 (Face Alignment for Improved Recognition)
