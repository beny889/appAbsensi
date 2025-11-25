# Fitur Aplikasi Absensi

## Face Recognition

### On-Device Recognition (MobileFaceNet)
- **Model**: MobileFaceNet TFLite (~5MB)
- **Embedding**: 192-dimensional face vectors
- **Matching**: On-device Euclidean distance
- **Threshold**: 0.7 (configurable)
- **Offline Support**: Matching tanpa internet setelah sync

### Multi-Pose Registration (5 Foto)
Registrasi wajah menggunakan 5 foto dari sudut berbeda:

| Pose | Deskripsi | Arrow Indicator |
|------|-----------|-----------------|
| 1 | Lihat LURUS ke kamera | Target icon (pulse) |
| 2 | Tengok sedikit ke KIRI | Arrow left (animate left) |
| 3 | Tengok sedikit ke KANAN | Arrow right (animate right) |
| 4 | ANGKAT dagu sedikit | Arrow up (animate up) |
| 5 | TUNDUKKAN kepala sedikit | Arrow down (animate down) |

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
      "embeddingsCount": 5
    }
  ],
  "supportsMultipleEmbeddings": true
}
```

---

## Attendance System

### Check-in (Masuk)
1. User buka app → Klik "Masuk"
2. Kamera terbuka dengan corner frame
3. Corner frame indikator warna berubah
4. Wajah stabil (hijau) → Auto-capture setelah 3 detik
5. On-device matching dengan embeddings tersimpan
6. Match ditemukan → Submit ke backend
7. Backend cek jadwal → Deteksi late
8. Tampilkan hasil sukses

### Check-out (Pulang)
1. User buka app → Klik "Pulang"
2. Same flow dengan Check-in
3. Backend cek jadwal → Deteksi early checkout
4. Jika pulang cepat → Konfirmasi dialog di Android
5. Tampilkan hasil sukses

### Late/Early Detection
- **Late Check-in**: `isLate=true`, `lateMinutes=X`
- **Early Check-out**: `isEarlyCheckout=true`, `earlyMinutes=X`
- Berdasarkan jadwal kerja departemen

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
- **Monthly Report**: Rekap bulanan per karyawan
- **Dashboard**: Statistik real-time

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

### User
```prisma
model User {
  id              String    @id @default(cuid())
  email           String?   @unique  // NULL for employees
  password        String?             // NULL for employees
  name            String
  role            Role      @default(EMPLOYEE)
  departmentId    String?
  faceEmbedding   String?   @db.Text  // Single embedding (legacy)
  faceEmbeddings  String?   @db.Text  // Multiple embeddings (5 poses)
  faceImageUrl    String?   @db.Text
  isActive        Boolean   @default(true)
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

---

## API Endpoints

### Public (No Auth)
```
POST /api/face-registration/submit    # Submit face registration
GET  /api/attendance/sync-embeddings  # Sync embeddings to Android
POST /api/attendance/verify-device    # Device-verified attendance
POST /api/attendance/verify-anonymous # Server-verified attendance
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
const val DISTANCE_THRESHOLD = 0.7f  // Match threshold
const val EMBEDDING_SIZE = 192       // MobileFaceNet output
```

---

**Last Updated**: November 26, 2025
