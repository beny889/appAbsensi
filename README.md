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
- **Face Alignment (v2.6.0)** - Rotasi wajah berdasarkan posisi mata untuk akurasi +3%

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

### Multi-Branch Support (v2.7.0)
- **Branch Management** - Kelola cabang/lokasi perusahaan
- **Branch Selection (Android)** - Pilih cabang saat pertama kali buka app (permanen)
- **Role-Based Branch Access** - SUPER_ADMIN lihat semua, BRANCH_ADMIN lihat cabang tertentu
- **Data Filtering** - Semua data (karyawan, absensi, departemen, dll) difilter per cabang
- **Admin Branch Assignment** - Atur admin mana yang bisa akses cabang mana

### Admin Management (v2.7.0)
- **Admin Users CRUD** - Buat, edit, hapus akun admin
- **Role Assignment** - SUPER_ADMIN atau BRANCH_ADMIN
- **Menu Access Control** - Atur menu mana yang bisa diakses setiap admin
- **Branch Access Control** - Atur cabang mana yang bisa diakses setiap admin
- **Dynamic Sidebar** - Menu otomatis tersembunyi jika tidak punya akses

### SUPER_ADMIN Enhancements (v2.7.1)
- **Branch Column** - Kolom "Cabang" di 8 halaman data (hanya untuk SUPER_ADMIN):
  - Employees, Attendance, Face Registration, Departments
  - Work Schedules, Holidays, Face Match Logs, **Daily Reports**
- **Branch Filter** - Filter cabang di 3 halaman report (single-select):
  - Daily Reports, Monthly Reports, Employee Detail Report
- **Filtered Employee List** - Daftar karyawan difilter berdasarkan cabang yang dipilih

### Branch Selection in Modals (v2.7.3)
- **Branch Field untuk SUPER_ADMIN** - Pilih cabang saat tambah/edit data
  - Departments, WorkSchedules, Holidays
  - Field wajib diisi (tidak boleh kosong)

### BRANCH_ADMIN Auto-Filter (v2.7.4)
- **Auto-Filter Reports** - Backend otomatis filter reports sesuai branch access
  - Daily Reports, Monthly Reports auto-filter untuk BRANCH_ADMIN
  - SUPER_ADMIN tetap bisa lihat semua cabang

### UI/UX Improvements (v2.7.2)
- **Delete Confirmation Modal** - Modal dialog MUI mengganti window.confirm()
  - WorkSchedules, Branches, Departments
  - Warning icon, loading spinner, tombol styled
- **Icon Button Consistency** - Tooltip dan hover effect pada semua tombol aksi
- **Work Schedule Branch Access** - BRANCH_ADMIN hanya bisa kelola jadwal cabangnya

### Admin Features
- **Face Registration Approval** - Review dan approve pendaftaran wajah
- **Employee Management** - Kelola data karyawan
- **Department Management** - Kelola departemen
- **Holiday Management** - Kelola hari libur nasional dan cuti bersama
- **Attendance Reports** - Laporan harian dan bulanan dengan preview
- **Dashboard Analytics** - Statistik kehadiran
- **Settings Management** - Konfigurasi face threshold dan ganti password
- **Collapsible Reports Menu** - Menu laporan dengan sub-menu collapse
- **Face Match Logs** - Log setiap percobaan face matching untuk audit
  - Tampilkan `embeddingsCount` per user untuk verifikasi multi-embedding
- **UI Improvements** (v2.5.0)
  - Footer "PT. Sample Corp" di sidebar
  - Logo perusahaan di header
  - Pagination untuk tabel besar
  - Kolom "No" untuk nomor urut

### Production Ready
- **Debug Code Removed** - Semua Log.d dan console.log sudah dihapus
- **Security Hardened** - Dev bypass login sudah dihapus
- **Clean UI** - Visual debug elements sudah dihapus
- **New App Logo** - Logo fingerprint biru gradient dengan background putih

### Security Features (v2.3.0+)
- **Rate Limiting** - Proteksi brute force dengan @nestjs/throttler
  - Global: 3 req/sec, 20 req/min, 100 req/hour
  - Login: Max 5 attempts/minute (stricter)
- **Protected Register** - Hanya ADMIN yang bisa register user baru
- **Strong JWT** - Secret 64+ karakter, expiration 24 jam
- **Password Policy** - Minimal 8 karakter, huruf besar/kecil, angka
- **CORS from ENV** - Origin dikelola via environment variable

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

### Branch Management (v2.7.0)
```
GET    /api/branches              # List semua cabang (admin)
GET    /api/branches/list         # List cabang aktif (public, untuk Android)
POST   /api/branches              # Create cabang (SUPER_ADMIN only)
PUT    /api/branches/:id          # Update cabang
DELETE /api/branches/:id          # Delete cabang
```

### Admin Management (v2.7.0)
```
GET    /api/admin-users           # List semua admin (SUPER_ADMIN only)
GET    /api/admin-users/menus     # List menu yang tersedia
POST   /api/admin-users           # Create admin baru
PUT    /api/admin-users/:id       # Update admin
DELETE /api/admin-users/:id       # Delete admin
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

### Branch (v2.7.0)
- `id` - Primary key (cuid)
- `name` - Nama cabang (unique)
- `code` - Kode singkat cabang (unique, e.g., "JKT", "SBY")
- `address` - Alamat lengkap
- `city` - Kota
- `isActive` - Status aktif/tidak

### AdminBranchAccess (v2.7.0)
- `id` - Primary key (cuid)
- `userId` - Foreign key ke User (admin)
- `branchId` - Foreign key ke Branch
- `isDefault` - Cabang default untuk admin ini

### User
- `faceEmbedding` - Single embedding (legacy, 128/192-dim)
- `faceEmbeddings` - Multiple embeddings JSON array (5 poses)
- `departmentId` - Foreign key ke Department
- `branchId` - Foreign key ke Branch (v2.7.0)
- `allowedMenus` - JSON array menu keys yang bisa diakses (v2.7.0)

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
  - Termasuk `embeddingsCount` per user untuk debugging multi-embedding

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

**Last Updated**: December 5, 2025
**Version**: 2.7.2 (UI/UX Improvements & Branch Access)
