# Sistem Absensi - Face Recognition

Sistem absensi dengan **on-device face recognition** menggunakan MobileFaceNet yang terdiri dari:
- **Backend API** (NestJS + PostgreSQL)
- **Android App** (Native Kotlin + MobileFaceNet TFLite)
- **Web Admin Panel** (React + Vite)

## Fitur Utama

### Face Recognition (On-Device)
- **MobileFaceNet TFLite** - Model AI untuk ekstraksi face embedding
- **192-dimensional embeddings** - Vektor wajah presisi tinggi
- **Multi-pose registration** - 5 foto dari berbagai sudut untuk akurasi lebih baik
- **On-device matching** - Pencocokan wajah langsung di HP, tidak perlu internet
- **Dynamic Threshold Sync** - Sync threshold dari backend saat "Coba Lagi"

### Visual Feedback (Android)
- **Corner Frame Indicator** - Warna berubah sesuai status deteksi wajah:
  - Putih: Tidak ada wajah
  - Kuning: Wajah terdeteksi, belum stabil
  - Hijau: Wajah stabil, siap capture
  - Merah: Wajah terlalu jauh / tidak di tengah
- **Progress Arc** - Menunjukkan progress registrasi (1-5 foto)
- **Flash Animation** - Efek flash saat capture foto
- **Arrow Indicators** - Panduan arah pose (kiri, kanan, atas, bawah)
- **Checkmark Animation** - Animasi centang saat pose berhasil

### Attendance System
- **Passwordless** - Karyawan hanya pakai wajah, tidak perlu login
- **Check-in/Check-out** - Absen masuk dan pulang
- **Late/Early Detection** - Deteksi terlambat dan pulang cepat otomatis
- **Work Schedules** - Jadwal kerja per departemen

### Admin Features
- **Face Registration Approval** - Review dan approve pendaftaran wajah
- **Employee Management** - Kelola data karyawan
- **Department Management** - Kelola departemen
- **Holiday Management** - Kelola hari libur nasional dan cuti bersama
- **Attendance Reports** - Laporan harian dan bulanan dengan preview
- **Dashboard Analytics** - Statistik kehadiran
- **Settings Management** - Konfigurasi face threshold dan ganti password
- **Collapsible Reports Menu** - Menu laporan dengan sub-menu collapse
- **Face Match Logs** - Log setiap percobaan face matching untuk debugging

## Quick Start

```bash
# Start semua services
/start

# Atau manual:
cd backend && npm run start:dev     # Port 3001
cd web-admin && npm run dev         # Port 5173
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | NestJS + TypeScript + Prisma + PostgreSQL |
| Android | Kotlin + MobileFaceNet TFLite + ML Kit |
| Web Admin | React + Vite + Material-UI |
| Face Recognition | MobileFaceNet (192-dim embeddings) |

## Arsitektur

```
┌─────────────────────┐
│    Android App      │
│  ┌───────────────┐  │
│  │ MobileFaceNet │  │ ← On-device face recognition
│  │   TFLite      │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │   ML Kit      │  │ ← Face detection
│  │ Face Detector │  │
│  └───────────────┘  │
└──────────┬──────────┘
           │ HTTP (embeddings + attendance)
           ▼
┌─────────────────────┐
│    Backend API      │
│    (NestJS)         │
│    Port 3001        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌─────────────────┐
│    PostgreSQL       │     │   Web Admin     │
│    Database         │     │   (React)       │
└─────────────────────┘     │   Port 5173     │
                            └─────────────────┘
```

## Flow Registrasi Wajah

```
1. User buka app → Klik "Daftar Wajah Baru"
2. Input nama → Kamera terbuka
3. Capture 5 foto dengan pose berbeda:
   - Pose 1: Lihat LURUS ke kamera
   - Pose 2: Tengok sedikit ke KIRI
   - Pose 3: Tengok sedikit ke KANAN
   - Pose 4: ANGKAT dagu sedikit
   - Pose 5: TUNDUKKAN kepala sedikit
4. Setiap pose:
   - Corner frame kuning → wajah terdeteksi
   - Corner frame hijau → siap capture (tahan 3 detik)
   - Flash + Checkmark → foto berhasil
   - Arrow indicator → panduan pose berikutnya
5. Setelah 5 foto → Submit ke backend
6. Admin approve di web panel
7. User bisa absen dengan wajah
```

## Flow Absen (Check-in/Check-out)

```
1. User buka app → Klik "Masuk" atau "Pulang"
2. Kamera terbuka dengan corner frame indicator
3. Corner frame berubah warna sesuai status
4. Wajah stabil (hijau) → Auto-capture
5. On-device face matching:
   - Sync embeddings dari server (cached)
   - Compare dengan MobileFaceNet
   - Match threshold dari settings (default: 0.35)
6. Match ditemukan:
   - CHECK_IN: Dialog konfirmasi identitas
   - CHECK_OUT: Cek jadwal dulu → Jika early: Dialog early checkout, Jika tidak: Dialog konfirmasi
7. User konfirmasi → isProfileConfirmed = true (face detection STOP TOTAL)
8. Submit attendance ke backend
9. Tampilkan hasil: "Selamat datang, [Nama]!"

**Penting**: Setelah konfirmasi profil, face detection berhenti total.
User harus kembali ke Home untuk scan ulang.

**Jika gagal (Coba Lagi)**:
1. User klik "Coba Lagi" di dialog error
2. App sync threshold terbaru dari backend
3. App sync embeddings terbaru
4. User scan ulang dengan settings terbaru
```

## API Endpoints

### Face Registration
```
POST   /api/face-registration/submit     # Submit registrasi (public)
GET    /api/face-registration/pending    # List pending (admin)
POST   /api/face-registration/:id/approve
POST   /api/face-registration/:id/reject
```

### Attendance
```
GET    /api/attendance/sync-embeddings   # Sync embeddings ke Android
POST   /api/attendance/verify-device     # Submit dari device-verified face
POST   /api/attendance/verify-anonymous  # Verify face di server
GET    /api/attendance/schedule/:userId  # Get jadwal kerja user
POST   /api/attendance/log-attempt       # Log face match attempt (debugging)
GET    /api/attendance/face-match-attempts # Get all face match logs
```

### Departments & Schedules
```
GET    /api/departments
POST   /api/departments
GET    /api/work-schedules
POST   /api/work-schedules
```

### Holidays
```
GET    /api/holidays              # List all holidays
GET    /api/holidays?year=YYYY    # Filter by year
POST   /api/holidays              # Create holiday (admin)
PUT    /api/holidays/:id          # Update holiday (admin)
DELETE /api/holidays/:id          # Delete holiday (admin)
```

### Settings
```
GET    /api/settings                      # Get all settings
GET    /api/settings/similarity-threshold # Get face threshold
PUT    /api/settings/similarity-threshold # Update face threshold (0.1-1.0)
POST   /api/auth/change-password          # Change admin password
```

**Note**: Web admin menampilkan threshold sebagai "Similarity %" untuk kemudahan:
- Backend menyimpan sebagai distance (0.1 - 1.0)
- Frontend menampilkan sebagai similarity (0% - 90%)
- Formula: `Similarity = (1 - Distance) * 100`
- Contoh: Distance 0.4 = Similarity 60%

## Database Schema

### User
- `faceEmbedding` - Single embedding (legacy, 128/192-dim)
- `faceEmbeddings` - Multiple embeddings JSON array (5 poses)
- `departmentId` - Foreign key ke Department

### FaceRegistration
- `faceEmbedding` - First embedding
- `faceEmbeddings` - All 5 embeddings
- `faceImageUrl` - Foto pose pertama (base64 data URL)
- `embeddingsCount` - Jumlah embeddings (5)

### WorkSchedule
- `departmentId` - Unique per department
- `checkInTime` - Format "HH:MM"
- `checkOutTime` - Format "HH:MM"

### Holiday
- `date` - Tanggal libur
- `name` - Nama hari libur
- `description` - Deskripsi (opsional)
- `isGlobal` - true = semua karyawan, false = karyawan tertentu
- `users` - Relasi ke HolidayUser (untuk libur per karyawan)

### HolidayUser (Junction Table)
- `holidayId` - Foreign key ke Holiday
- `userId` - Foreign key ke User

### Settings
- `key` - Nama setting (unique)
- `value` - Nilai setting (TEXT)
- **Available Keys**:
  - `FACE_SIMILARITY_THRESHOLD` - Threshold pencocokan wajah (default: 0.6)

### FaceMatchAttempt
- `attemptType` - CHECK_IN atau CHECK_OUT
- `success` - true jika match ditemukan
- `matchedUserId` / `matchedUserName` - User yang di-match (jika sukses)
- `threshold` - Threshold yang digunakan
- `bestDistance` / `bestSimilarity` - Jarak/similarity terbaik
- `totalUsersCompared` - Jumlah user yang dibandingkan
- `allMatches` - JSON detail semua perbandingan (ranking)

## Android Structure

```
android/app/src/main/
├── java/com/absensi/
│   ├── ml/
│   │   └── FaceRecognitionHelper.kt   # MobileFaceNet wrapper
│   ├── presentation/camera/
│   │   ├── CameraActivity.kt          # Main camera activity
│   │   └── FaceFrameProgressView.kt   # Custom view dengan corner frame
│   └── data/
│       └── repository/
│           └── FaceRegistrationRepository.kt
├── assets/
│   └── mobile_face_net.tflite         # MobileFaceNet model (5MB)
└── res/
    ├── drawable/
    │   ├── ic_arrow_left.xml
    │   ├── ic_arrow_right.xml
    │   ├── ic_arrow_up.xml
    │   ├── ic_arrow_down.xml
    │   └── ic_face_center.xml
    └── layout/
        └── activity_camera.xml
```

## Configuration

### Backend (.env)
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/absensi"
JWT_SECRET="your-secret-key"
PORT=3001
```

### Android (Constants.kt)
```kotlin
const val BASE_URL = "http://10.0.2.2:3001/api/"  // Emulator
// atau
const val BASE_URL = "http://192.168.x.x:3001/api/"  // Real device
```

## Troubleshooting

### Embedding dimensions mismatch (192 vs 128)
- Model MobileFaceNet menghasilkan 192 dimensi
- Jika ada user dengan 128 dimensi, hapus dan registrasi ulang

### Face tidak dikenali
1. Pastikan embeddings sudah sync (`/api/attendance/sync-embeddings`)
2. Cek threshold di Settings (default: 60%)
3. Adjust threshold di Settings > Face Similarity:
   - Nilai lebih tinggi = lebih ketat (wajah harus sangat mirip)
   - Nilai lebih rendah = lebih longgar (toleransi lebih tinggi)
4. Registrasi ulang dengan pencahayaan lebih baik

### Corner frame tidak berubah warna
- Pastikan wajah terlihat jelas di kamera
- Dekatkan wajah ke kamera (minimal 25% dari frame)
- Posisikan wajah di tengah oval

## Development

### Build Android APK
```bash
cd android
./gradlew.bat assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk
```

### Install ke device
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### View logs
```bash
adb logcat | grep -E "FaceRecognition|CameraActivity|embedding"
```

## License

Private - Internal Use Only

---

**Built with MobileFaceNet for accurate on-device face recognition**

---

**Last Updated**: November 27, 2025
