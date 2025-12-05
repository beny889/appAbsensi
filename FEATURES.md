# Fitur Aplikasi Absensi

## Face Recognition

### On-Device Recognition (MobileFaceNet)
- **Model**: MobileFaceNet TFLite (~5MB)
- **Embedding**: 192-dimensional face vectors
- **Matching**: On-device Euclidean distance
- **Threshold**: Dynamic dari backend (default: 0.35)
- **Offline Support**: Matching tanpa internet setelah sync
- **Dynamic Sync**: Threshold sync ulang saat klik "Coba Lagi"

### Face Alignment (v2.6.0)
**Meningkatkan akurasi ~3% dengan alignment berbasis posisi mata**

- **ML Kit Landmarks**: Deteksi posisi mata kiri dan kanan
- **Rotasi Wajah**: Wajah dirotasi agar mata horizontal
- **Landmark-based Crop**: Crop konsisten berdasarkan jarak mata (2.5x eye distance)
- **Output**: 112x112 RGB (sesuai input MobileFaceNet)
- **Eye Position**: Mata diposisikan di 35% dari atas output

**Test Results:**
| Method | Similarity |
|--------|------------|
| Tanpa Alignment | 76.0% |
| Dengan Alignment | **78.9%** |

**File:** `android/app/src/main/java/com/absensi/util/FaceAlignmentUtils.kt`

### Multi-Pose Registration (5 Foto)
Registrasi wajah menggunakan 5 foto dari sudut berbeda untuk akurasi lebih baik:

| Pose | Deskripsi | Arrow Indicator |
|------|-----------|-----------------|
| 1 | Lihat LURUS ke kamera | Target icon (pulse) |
| 2 | Tengok sedikit ke KIRI | Arrow left (animate left) |
| 3 | Tengok sedikit ke KANAN | Arrow right (animate right) |
| 4 | ANGKAT dagu sedikit | Arrow up (animate up) |
| 5 | TUNDUKKAN kepala sedikit | Arrow down (animate down) |

**Multi-Embedding Matching**: Saat absen, wajah dibandingkan dengan **semua 5 embeddings** dari setiap user. Distance terbaik dari 5 perbandingan digunakan untuk matching, meningkatkan akurasi pengenalan wajah dari berbagai angle.

### Visual Feedback System

#### Corner Frame Indicator
Warna corner frame berubah sesuai status deteksi:

| State | Warna | Kondisi |
|-------|-------|---------|
| DEFAULT | Putih | Tidak ada wajah terdeteksi |
| DETECTED | Kuning | Wajah terdeteksi, menunggu stabil |
| READY | Hijau | Wajah stabil, siap capture |
| WARNING | Merah | Wajah terlalu jauh / tidak di tengah |

#### Animasi
- **Progress Arc**: Segmented arc menunjukkan progress 1-5 foto
- **Flash Animation**: Efek flash putih saat capture (100ms fade-in, 200ms fade-out)
- **Checkmark Animation**: Centang hijau animasi saat pose berhasil (400ms)
- **Arrow Indicators**: Animasi translate/pulse untuk panduan arah pose

#### Timing
- **Stability Frames**: 15 frame berturut-turut wajah stabil
- **Capture Delay**: 3 detik setelah READY
- **Transition Delay**: 1.5 detik setelah checkmark animation

### Embedding Sync
```
GET /api/attendance/sync-embeddings

Response:
{
  "count": 5,
  "embeddings": [
    {
      "odId": "user-id",
      "name": "User Name",
      "embedding": [192 floats],     // First embedding (legacy)
      "embeddings": [[192], [192], ...], // All 5 embeddings
      "embeddingsCount": 5,
      "faceImageUrl": "data:image/jpeg;base64,..."
    }
  ],
  "syncTimestamp": 1764174551290,
  "supportsMultipleEmbeddings": true,
  "settings": {
    "faceDistanceThreshold": 0.35,
    "updatedAt": 1764174551290
  }
}
```

### Dynamic Threshold Sync
Threshold face matching di-sync dari backend:
1. **Initial Sync**: Saat pertama kali buka CameraActivity
2. **Retry Sync**: Saat klik "Coba Lagi" di dialog error
3. **Storage**: Disimpan di SharedPreferences untuk akses cepat
4. **Fallback**: Jika sync gagal, gunakan threshold tersimpan sebelumnya

---

## Attendance System

### Check-in (Masuk)
1. User buka app → Klik "Masuk"
2. Kamera terbuka dengan corner frame
3. Corner frame indikator warna berubah
4. Wajah stabil (hijau) → Auto-capture setelah 3 detik
5. On-device matching dengan embeddings tersimpan
6. Match ditemukan → Dialog konfirmasi identitas
7. User konfirmasi → `isProfileConfirmed = true` (face detection STOP TOTAL)
8. Submit ke backend
9. Backend cek jadwal → Deteksi late
10. Tampilkan hasil sukses

**Konfirmasi Identitas**:
- Face detection berhenti TOTAL setelah user konfirmasi ("Ya, ini saya")
- `isProfileConfirmed = true` - permanent block sampai Activity finish
- Menampilkan foto registrasi user yang di-match
- User bisa batal untuk scan ulang (face detection aktif lagi)
- Setelah konfirmasi, harus kembali ke Home untuk scan ulang

### Check-out (Pulang)
1. User buka app → Klik "Pulang"
2. Kamera terbuka dengan corner frame
3. On-device matching sama dengan Check-in
4. Match ditemukan → **Cek jadwal DULU**
5. **Jika pulang cepat** → Dialog early checkout langsung (dengan info user)
   - Konfirmasi → `isProfileConfirmed = true` → Submit → Sukses
   - Batal → `isProfileConfirmed = true` → Kembali ke kamera (tapi face detection STOP)
6. **Jika tidak early** → Dialog konfirmasi identitas normal
   - User konfirmasi → `isProfileConfirmed = true` → Submit → Sukses
7. Tampilkan hasil sukses

**Penting**: Setelah user konfirmasi profil (baik Masuk maupun Pulang), face detection berhenti total. User harus kembali ke Home dan buka kamera baru untuk scan ulang.

### Late/Early Detection
- **Late Check-in**: `isLate=true`, `lateMinutes=X`
- **Early Check-out**: `isEarlyCheckout=true`, `earlyMinutes=X`
- Berdasarkan jadwal kerja departemen

---

## Multi-Branch Support (v2.7.0)

### Branch Management
- **CRUD Cabang**: Create, read, update, delete cabang/lokasi
- **Branch Code**: Kode singkat untuk identifikasi (e.g., "JKT", "SBY", "BDG")
- **Branch Status**: Aktif/tidak aktif
- **Branch Stats**: Jumlah karyawan dan departemen per cabang

### Android Branch Selection
- **First Launch**: Pilih cabang saat pertama kali buka app
- **Permanent Selection**: Tidak bisa diubah setelah dipilih
- **Auto-Registration**: Registrasi wajah otomatis pakai branch dari device
- **Auto-Attendance**: Absensi otomatis pakai branch dari device

### Role-Based Branch Access
| Role | Access |
|------|--------|
| SUPER_ADMIN | Semua cabang, semua menu |
| BRANCH_ADMIN | Cabang tertentu, menu tertentu |

### Data Filtering per Branch
Semua endpoint admin difilter berdasarkan akses cabang user:
- ✅ Employees - Filter by `user.branchId`
- ✅ Attendance - Filter by `user.branchId`
- ✅ Departments - Filter by `department.branchId`
- ✅ Dashboard Stats - Filter employees & attendance
- ✅ Dashboard Presence - Filter employees
- ✅ Face Registration - Filter by `registration.branchId`

---

## Admin Management (v2.7.0)

### Admin Users CRUD
- **Create Admin**: Nama, email, password, role
- **Edit Admin**: Update data, reset password
- **Delete Admin**: Hapus akun admin
- **Active/Inactive**: Toggle status admin

### Menu Access Control
Admin dapat dibatasi menu yang bisa diakses:
- `dashboard` - Dashboard
- `employees` - Karyawan
- `attendance` - Absensi
- `face-registration` - Pendaftaran Wajah
- `branches` - Cabang
- `departments` - Departemen
- `work-schedules` - Jadwal Kerja
- `holidays` - Hari Libur
- `reports` - Laporan
- `face-match-logs` - Face Match Logs
- `settings` - Pengaturan
- `admin-users` - Manajemen Admin

### Branch Access Control
- **Multi-Branch**: Admin bisa akses lebih dari satu cabang
- **Dynamic Filter**: Data otomatis difilter sesuai akses

### Dynamic Sidebar
- Menu yang tidak diizinkan otomatis tersembunyi
- SUPER_ADMIN selalu melihat semua menu
- BRANCH_ADMIN hanya melihat menu yang diizinkan

---

## SUPER_ADMIN Enhancements (v2.7.1)

### Branch Column di Halaman Data
**Kolom "Cabang" ditampilkan di 8 halaman data (hanya untuk SUPER_ADMIN)**

| Halaman | Lokasi Kolom | Data Source |
|---------|--------------|-------------|
| Employees | Setelah Departemen | `employee.branch?.name` |
| Attendance | Setelah Karyawan | `attendance.user?.branch?.name` |
| Face Registration | Setelah Nama | `registration.branch?.name` |
| Departments | Setelah Nama | `department.branch?.name` |
| Work Schedules | Setelah Departemen | `schedule.department?.branch?.name` |
| Holidays | Setelah Tanggal | `holiday.branch?.name` |
| Face Match Logs | Setelah Waktu | `attempt.branch?.name` |
| **Daily Reports** | Setelah Nama | `attendance.user?.branch?.name` |

**Catatan**: Kolom branch hanya tampil untuk user dengan role `SUPER_ADMIN`. BRANCH_ADMIN tidak melihat kolom ini karena data sudah difilter otomatis per cabang.

### Branch Filter di Halaman Report
**Filter cabang (single-select) di 3 halaman report (hanya untuk SUPER_ADMIN)**

| Halaman | Filter Location | Behavior |
|---------|-----------------|----------|
| Daily Reports | Sebelah date picker | Filter data harian per cabang |
| Monthly Reports | Sebelah month picker | Filter grid bulanan per cabang |
| Employee Detail | Di atas employee picker | Filter employee list + report per cabang |

**Features**:
- Dropdown dengan opsi "Semua Cabang" + daftar cabang aktif
- Single-select (bukan multi-select) untuk konsistensi
- Di Employee Detail Report, memilih cabang akan memfilter daftar karyawan yang bisa dipilih
- Perubahan filter langsung memuat ulang data

### BRANCH_ADMIN Auto-Filter (v2.7.4)
**Backend otomatis filter data reports berdasarkan branch access user**

| Endpoint | Filter Behavior |
|----------|-----------------|
| `GET /reports/daily` | Auto-filter by user's branch access |
| `GET /reports/monthly-grid` | Auto-filter by user's branch access |

**Behavior**:
- SUPER_ADMIN: Tanpa filter (lihat semua cabang), bisa filter manual
- BRANCH_ADMIN: Otomatis difilter sesuai cabang yang diakses
- Filter explicit `branchId` dari frontend tetap prioritas utama

---

## Admin Features

### Face Registration Management
- List registrasi pending dengan foto preview
- Approve: Pilih departemen → Auto-create user
- Reject: Input alasan penolakan
- Delete: Hapus registrasi

### Employee Management
- CRUD karyawan
- Assign departemen
- View face status (registered/not)
- View attendance history

### Department Management
- CRUD departemen
- Active/inactive toggle
- View employee count
- View schedule assigned

### Work Schedules
- Satu jadwal per departemen
- Format waktu: HH:MM
- Check-in time & Check-out time
- Digunakan untuk late/early detection

### Reports
- **Daily Report**: Rekap harian per tanggal
- **Monthly Report**: Rekap bulanan per karyawan dengan preview
- **Monthly Report Preview**: Preview data sebelum download PDF
- **Dashboard**: Statistik real-time

### Holiday Management
- CRUD hari libur nasional dan cuti bersama
- Filter berdasarkan tahun
- Otomatis exclude dari working days di report
- Monthly attendance grid menampilkan hari libur berbeda
- Tanggal libur tidak dihitung sebagai absent
- **Holiday-Based Marking**: Kode "L" hanya untuk tanggal dari tabel holidays (bukan otomatis weekend)
- **Multi-Employee Holiday**: Support libur untuk semua karyawan atau karyawan tertentu
  - `isGlobal = true`: Libur berlaku untuk semua karyawan
  - `isGlobal = false`: Libur hanya untuk karyawan yang dipilih
  - Junction table `HolidayUser` untuk relasi many-to-many

### Settings / Configuration
- **Face Similarity**: Konfigurasi threshold pencocokan wajah ditampilkan sebagai persentase
  - Ditampilkan sebagai: "60% - Normal" (bukan distance 0.40)
  - Nilai tinggi = lebih ketat (wajah harus sangat mirip)
  - Nilai rendah = lebih longgar (toleransi lebih tinggi)
  - Default: 60% (distance 0.4)
  - Formula: `Similarity = (1 - Distance) * 100`
  - Range slider: 0% - 90%
- **Change Password**: Admin dapat mengubah password akun

### Reports (Collapsible Menu)
Menu "Laporan" dengan sub-menu collapse:
- **Harian**: Rekap absensi per tanggal
- **Bulanan**: Rekap bulanan dengan grid kehadiran
  - Dynamic columns: Kolom tanggal hanya sampai hari ini (jika bulan berjalan)
  - Export PDF dengan format yang sama
- **Detail Karyawan**: Laporan detail per karyawan

### Face Match Logs (Debugging)
**Path**: `/face-match-logs`

Log setiap percobaan face matching untuk debugging:
- **Attempt Type**: CHECK_IN atau CHECK_OUT
- **Status**: Berhasil (✓) atau Gagal (✗)
- **Matched User**: Nama user yang di-match (jika sukses)
- **Similarity**: Persentase kemiripan terbaik
- **Threshold**: Nilai threshold yang digunakan
- **Embeddings**: Jumlah embeddings yang digunakan per user (1-5)
- **Detail View**: Klik row untuk lihat semua perbandingan (ranking by similarity)

**Detail Dialog Columns**:
| Column | Description |
|--------|-------------|
| # | Ranking (1 = paling mirip) |
| Nama | Nama user |
| Distance | Euclidean distance (lower = better) |
| Similarity | Persentase kemiripan |
| Embeddings | Jumlah embeddings yang dibandingkan |
| Match? | ✓ jika di bawah threshold |

**Use Cases**:
- Debug kenapa user tidak dikenali
- Lihat ranking similarity ke semua user
- Bandingkan threshold yang berbeda
- Verifikasi multi-embedding digunakan (kolom Embeddings = 5)
- Audit setiap percobaan absensi

---

## Branch Selection in Modals (v2.7.3)

### Field Cabang di Modal CRUD
**SUPER_ADMIN dapat memilih cabang saat tambah/edit data**

| Halaman | Field Behavior | Edit Mode |
|---------|----------------|-----------|
| Departments | Pilih cabang (wajib) | Disabled |
| WorkSchedules | Pilih cabang → filter departemen | Disabled |
| Holidays | Pilih cabang (wajib) | Disabled |

**Features**:
- Field cabang hanya muncul untuk SUPER_ADMIN
- Wajib diisi (tidak boleh kosong)
- Red border error state jika belum dipilih
- Tombol Simpan disabled sampai cabang dipilih
- Saat edit: field cabang dan departemen read-only

**WorkSchedules Specific**:
- Pilih cabang dulu → departemen list difilter per cabang
- Helper text "Pilih cabang untuk menampilkan departemen"
- Jika cabang tidak punya departemen, tampilkan warning

---

## UI/UX Improvements (v2.7.2)

### Delete Confirmation Modal
**Modal dialog yang modern untuk konfirmasi hapus**

| Halaman | Sebelum | Sesudah |
|---------|---------|---------|
| WorkSchedules | `window.confirm()` | MUI Dialog |
| Branches | `window.confirm()` | MUI Dialog |
| Departments | `window.confirm()` | MUI Dialog |

**Modal Features**:
- ⚠️ Warning icon berwarna merah
- Nama item yang akan dihapus ditampilkan dengan Chip
- Pesan "Tindakan ini tidak dapat dibatalkan"
- Tombol Batal (outlined) dan Hapus (merah dengan icon)
- Loading spinner saat proses penghapusan
- Dialog tidak bisa ditutup selama proses berlangsung

### Icon Button Consistency
**Semua halaman data memiliki style button yang konsisten**

- Tooltip pada hover ("Edit" / "Hapus")
- Hover effect dengan background color
- Icon size seragam (`fontSize="small"`)

**Color Scheme**:
| Action | Icon Color | Hover Background |
|--------|------------|------------------|
| Edit | `#1976d2` (blue) | `#e3f2fd` |
| Delete | `#d32f2f` (red) | `#ffebee` |

---

## Security

### Passwordless Authentication
- Karyawan: Face recognition only (no email/password)
- Admin: Email/password untuk web panel
- Auto-generate credentials untuk admin baru

### Face Embedding Security
- Disimpan sebagai vektor numerik (bukan foto)
- Database field: TEXT dengan JSON array
- Matching menggunakan Euclidean distance

### JWT Authentication
- Token-based untuk API access
- Role-based access control (ADMIN/EMPLOYEE)
- Protected routes dengan guards
- **Strong Secret**: 64+ karakter random string
- **Short Expiration**: 24 jam (bukan 7 hari)

### Rate Limiting (v2.3.0)
- **Global**: 3 req/sec, 20 req/min, 100 req/hour
- **Login**: Max 5 attempts per minute
- **Package**: `@nestjs/throttler`
- Proteksi terhadap brute force attack

### Password Policy (v2.3.0)
- Minimal 8 karakter
- Harus mengandung huruf besar (A-Z)
- Harus mengandung huruf kecil (a-z)
- Harus mengandung angka (0-9)
- Validasi di backend dan frontend

### Protected Endpoints (v2.3.0)
- Register endpoint memerlukan JWT + role ADMIN
- Hanya admin yang bisa mendaftarkan user baru

---

## Technical Stack

### Android
| Component | Technology |
|-----------|------------|
| Language | Kotlin |
| Architecture | MVVM |
| Camera | CameraX |
| Face Detection | ML Kit Face Detection |
| Face Recognition | MobileFaceNet TFLite |
| HTTP Client | Retrofit + OkHttp |
| DI | Hilt |

### Backend
| Component | Technology |
|-----------|------------|
| Framework | NestJS |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT + Passport |
| Body Parser | 50MB limit (untuk base64 images) |

### Web Admin
| Component | Technology |
|-----------|------------|
| Framework | React 18 |
| Language | TypeScript |
| Build Tool | Vite |
| UI Library | Material-UI |
| HTTP Client | Axios |
| Router | React Router |

---

## Database Schema

### Branch (v2.7.0)
```prisma
model Branch {
  id          String   @id @default(cuid())
  name        String   @unique
  code        String   @unique  // e.g., "JKT", "SBY", "BDG"
  address     String?  @db.Text
  city        String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users             User[]
  departments       Department[]
  faceRegistrations FaceRegistration[]
  adminAccess       AdminBranchAccess[]
}
```

### AdminBranchAccess (v2.7.0)
```prisma
model AdminBranchAccess {
  id        String   @id @default(cuid())
  userId    String
  branchId  String
  isDefault Boolean  @default(false)
  user      User     @relation(...)
  branch    Branch   @relation(...)
  createdAt DateTime @default(now())

  @@unique([userId, branchId])
}
```

### User
```prisma
model User {
  id              String    @id @default(cuid())
  email           String?   @unique  // NULL for employees
  password        String?             // NULL for employees
  name            String
  role            Role      @default(EMPLOYEE)
  departmentId    String?
  branchId        String?             // v2.7.0: Branch assignment
  allowedMenus    String?   @db.Text  // v2.7.0: JSON array of menu keys
  faceEmbedding   String?   @db.Text  // Single embedding (legacy)
  faceEmbeddings  String?   @db.Text  // Multiple embeddings (5 poses)
  faceImageUrl    String?   @db.Text
  isActive        Boolean   @default(true)

  adminBranchAccess AdminBranchAccess[]  // v2.7.0
}
```

### FaceRegistration
```prisma
model FaceRegistration {
  id              String    @id @default(cuid())
  name            String
  faceEmbedding   String    @db.Text  // First embedding
  faceEmbeddings  String?   @db.Text  // All 5 embeddings
  faceImageUrl    String?   @db.Text  // First photo (base64)
  status          RegistrationStatus @default(PENDING)
  userId          String?   // Set after approval
}
```

### Attendance
```prisma
model Attendance {
  id              String    @id @default(cuid())
  userId          String
  type            AttendanceType
  timestamp       DateTime  @default(now())
  isLate          Boolean?
  lateMinutes     Int?
  isEarlyCheckout Boolean?
  earlyMinutes    Int?
  scheduledTime   String?
}
```

### WorkSchedule
```prisma
model WorkSchedule {
  id            String    @id @default(cuid())
  departmentId  String    @unique
  checkInTime   String    // "HH:MM"
  checkOutTime  String    // "HH:MM"
  isActive      Boolean   @default(true)
}
```

### Holiday
```prisma
model Holiday {
  id          String        @id @default(cuid())
  date        DateTime      @unique
  name        String
  description String?
  isGlobal    Boolean       @default(true)  // true = semua karyawan
  users       HolidayUser[]                 // Relasi ke karyawan tertentu
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}
```

### HolidayUser (Junction Table)
```prisma
model HolidayUser {
  id        String   @id @default(cuid())
  holidayId String
  userId    String
  holiday   Holiday  @relation(fields: [holidayId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([holidayId, userId])  // Prevent duplicate assignments
}
```

### Settings
```prisma
model Settings {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String   @db.Text
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### FaceMatchAttempt
```prisma
model FaceMatchAttempt {
  id                String   @id @default(cuid())
  attemptType       String   // CHECK_IN | CHECK_OUT
  success           Boolean  // true if match found
  matchedUserId     String?
  matchedUserName   String?
  threshold         Float    // threshold used
  bestDistance      Float?   // best distance
  bestSimilarity    Float?   // best similarity (%)
  totalUsersCompared Int     // number of users compared
  allMatches        String   @db.Text // JSON of all comparisons
  createdAt         DateTime @default(now())
}
```

---

## API Endpoints

### Public (No Auth)
```
POST /api/face-registration/submit    # Submit face registration
GET  /api/attendance/sync-embeddings  # Sync embeddings to Android
POST /api/attendance/verify-device    # Device-verified attendance
POST /api/attendance/verify-anonymous # Server-verified attendance
GET  /api/attendance/schedule/:userId # Get user schedule (for early checkout)
POST /api/attendance/log-attempt      # Log face match attempt
```

### Admin Only
```
GET  /api/face-registration/pending
POST /api/face-registration/:id/approve
POST /api/face-registration/:id/reject
GET  /api/employees
GET  /api/departments
GET  /api/work-schedules
GET  /api/reports/*
GET  /api/attendance/face-match-attempts  # Get all face match logs

GET    /api/holidays
POST   /api/holidays
PUT    /api/holidays/:id
DELETE /api/holidays/:id

# Settings
GET  /api/settings                      # Get all settings
GET  /api/settings/similarity-threshold # Get face threshold
PUT  /api/settings/similarity-threshold # Update face threshold

# Auth
POST /api/auth/change-password          # Change admin password

# Branch Management (v2.7.0)
GET    /api/branches              # List semua cabang
GET    /api/branches/list         # List cabang aktif (public)
POST   /api/branches              # Create cabang (SUPER_ADMIN)
PUT    /api/branches/:id          # Update cabang
DELETE /api/branches/:id          # Delete cabang

# Admin Management (v2.7.0)
GET    /api/admin-users           # List semua admin (SUPER_ADMIN)
GET    /api/admin-users/menus     # List menu yang tersedia
POST   /api/admin-users           # Create admin baru
PUT    /api/admin-users/:id       # Update admin
DELETE /api/admin-users/:id       # Delete admin
```

---

## Configuration

### Backend (.env)
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
PORT=3001
```

### Android (Constants.kt)
```kotlin
const val BASE_URL = "http://10.0.2.2:3001/api/"
```

### FaceRecognitionHelper.kt
```kotlin
const val DISTANCE_THRESHOLD = 0.7f  // Match threshold (Android local)
const val EMBEDDING_SIZE = 192       // MobileFaceNet output
```

### Backend Dynamic Settings
Settings disimpan di database dan dapat diubah via web admin:
```
FACE_SIMILARITY_THRESHOLD = 0.6  // Server-side face matching threshold
```

---

## Production Ready

### Debug Code Removed
- **Android**: Semua `Log.d()` statements dihapus
- **Web Admin**: Semua `console.log` dan `console.error` dihapus
- **Backend**: Semua `console.log` statements dihapus
- **Security**: Dev bypass login dihapus dari web admin
- **Clean UI**: Visual threshold badge dihapus dari camera

### New App Logo
- **Design**: Fingerprint icon biru gradient
- **Background**: Putih (#FFFFFF)
- **Style**: Modern dan professional

---

**Last Updated**: December 4, 2025
**Version**: 2.7.1 (SUPER_ADMIN Branch Column & Filter)
