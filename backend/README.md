# Absensi Backend API

Backend API untuk sistem absensi dengan **on-device face recognition** (MobileFaceNet).

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | NestJS |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT + Passport |
| Body Parser | 50MB limit (untuk base64 images) |

## Features

- Passwordless authentication (karyawan pakai wajah saja)
- Multi-pose face registration (5 foto)
- Face embedding storage (192-dim vectors)
- Embedding sync API untuk Android
- Late/early detection berdasarkan jadwal
- Department & work schedule management
- Holiday management (hari libur nasional & per-karyawan)
- Admin approval workflow
- Attendance reports (daily/monthly with preview)
- Dynamic settings (face threshold, dll)
- Admin password management

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env dengan konfigurasi database

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed dummy data (optional)
npm run prisma:seed

# Start development
npm run start:dev    # Port 3001

# Prisma Studio (Database GUI)
npx prisma studio    # Port 5555
```

## Seed Data

Script untuk generate dummy attendance data:

```bash
npm run prisma:seed
```

Seed script (`prisma/seed.ts`) akan:
1. Membuat 10 karyawan dummy dengan nama Indonesia
2. Generate attendance records (masuk & pulang) untuk hari ini
3. Random waktu masuk (07:00 - 08:30) dan pulang (16:30 - 17:30)
4. Otomatis hitung status terlambat/pulang awal

### Dummy Employees
| Nama | Posisi |
|------|--------|
| Budi Santoso | Staff IT |
| Siti Rahayu | HRD |
| Ahmad Wijaya | Marketing |
| Dewi Lestari | Finance |
| Eko Prasetyo | Staff IT |
| Fitri Handayani | Customer Service |
| Gunawan Hidayat | Warehouse |
| Heni Susanti | Accounting |
| Irfan Maulana | Security |
| Joko Widodo | Driver |

**Note**: Jalankan seed ulang akan menghapus data dummy lama dan membuat yang baru.

## Environment Variables (.env)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/absensi_db"
JWT_SECRET="your-secret-key"
PORT=3001
```

## API Endpoints

### Public (No Auth Required)
```
POST /api/face-registration/submit    # Submit face registration
GET  /api/attendance/sync-embeddings  # Sync embeddings ke Android
POST /api/attendance/verify-device    # Device-verified attendance
POST /api/attendance/verify-anonymous # Server-verified attendance
GET  /api/attendance/schedule/:userId # Get user schedule (early checkout)
POST /api/attendance/log-attempt      # Log face match attempt (debugging)
```

### Admin Only
```
GET    /api/face-registration/pending
POST   /api/face-registration/:id/approve
POST   /api/face-registration/:id/reject
DELETE /api/face-registration/:id

GET    /api/employees
PUT    /api/employees/:id
DELETE /api/employees/:id

GET    /api/departments
POST   /api/departments
PUT    /api/departments/:id
DELETE /api/departments/:id

GET    /api/work-schedules
POST   /api/work-schedules
PUT    /api/work-schedules/:id

GET    /api/attendance/today-all
GET    /api/attendance/face-match-attempts  # Face match logs (debugging)
DELETE /api/attendance/:id

GET    /api/reports/daily
GET    /api/reports/monthly
GET    /api/reports/monthly-grid
GET    /api/reports/dashboard

GET    /api/holidays              # List all (includes users relation)
GET    /api/holidays?year=YYYY   # Filter by year
POST   /api/holidays              # Create (body: { date, name, description?, isGlobal, userIds? })
PUT    /api/holidays/:id          # Update (body: { date?, name?, description?, isGlobal?, userIds? })
DELETE /api/holidays/:id

# Settings
GET    /api/settings                      # Get all settings
GET    /api/settings/similarity-threshold # Get face threshold
PUT    /api/settings/similarity-threshold # Update face threshold (0.1-1.0)

# Auth
POST   /api/auth/change-password          # Change admin password
```

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
  faceEmbeddings  String?   @db.Text  // All 5 embeddings (JSON array)
  faceImageUrl    String?   @db.Text  // First photo (base64 data URL)
  status          RegistrationStatus @default(PENDING)
  userId          String?   // Set after approval
}
```

### Attendance
```prisma
model Attendance {
  id              String    @id @default(cuid())
  userId          String
  type            AttendanceType  // CHECK_IN | CHECK_OUT
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
  holiday   Holiday  @relation(...)
  user      User     @relation(...)
  createdAt DateTime @default(now())
  @@unique([holidayId, userId])
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

**Available Settings**:
| Key | Default | Description |
|-----|---------|-------------|
| `FACE_SIMILARITY_THRESHOLD` | 0.6 | Threshold pencocokan wajah (0.1 - 1.0) |

### FaceMatchAttempt
```prisma
model FaceMatchAttempt {
  id                String   @id @default(cuid())
  attemptType       String   // CHECK_IN | CHECK_OUT
  success           Boolean
  matchedUserId     String?
  matchedUserName   String?
  threshold         Float
  bestDistance      Float?
  bestSimilarity    Float?
  totalUsersCompared Int
  allMatches        String   @db.Text  // JSON ranking
  createdAt         DateTime @default(now())
}
```

## Embedding Sync API

Android sync embeddings untuk on-device matching:

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

### Settings dalam Sync Response
Response `sync-embeddings` menyertakan settings untuk Android:
- `faceDistanceThreshold`: Threshold untuk face matching (default: 0.35)
- `updatedAt`: Timestamp terakhir settings diupdate

Android akan menyimpan threshold ini ke SharedPreferences dan menggunakannya untuk on-device face matching.

## Face Registration Submit

Android submit 5 embeddings + 5 images:

```
POST /api/face-registration/submit

Body:
{
  "name": "User Name",
  "faceEmbeddings": ["[192 floats]", ...],  // 5 embedding strings
  "faceImagesBase64": ["base64...", ...]    // 5 images (optional)
}

Response:
{
  "id": "registration-id",
  "message": "Registration submitted successfully",
  "status": "PENDING",
  "embeddingsCount": 5
}
```

## Body Size Configuration

Backend dikonfigurasi untuk handle large payloads (5 base64 images):

```typescript
// main.ts
import { json, urlencoded } from 'express';

app.use(json({ limit: '50mb' }));
app.use(urlencoded({ extended: true, limit: '50mb' }));
```

## Security

### Passwordless for Employees
- Karyawan: Face recognition only (email/password NULL)
- Admin: Email/password untuk web panel

### Face Embedding Security
- Disimpan sebagai vektor numerik (bukan foto)
- Database field: TEXT dengan JSON array
- Matching menggunakan cosine similarity
- Threshold dinamis dari Settings table (default 0.6 = 60%)

### JWT Authentication
- Token-based untuk API access
- Role-based access control (ADMIN/EMPLOYEE)
- Protected routes dengan guards
- **Strong Secret**: 64+ karakter (WAJIB diganti di production!)
- **Short Expiration**: 24 jam untuk keamanan

### Rate Limiting (v2.3.0)
- **Package**: `@nestjs/throttler`
- **Global Limits**: 3 req/sec, 20 req/min, 100 req/hour
- **Login Endpoint**: Max 5 attempts per minute (stricter)
- Proteksi terhadap brute force attack

### Password Policy (v2.3.0)
- Minimal 8 karakter
- Harus mengandung huruf besar (A-Z)
- Harus mengandung huruf kecil (a-z)
- Harus mengandung angka (0-9)

### Protected Register Endpoint (v2.3.0)
- Endpoint `/auth/register` dilindungi dengan JWT
- Hanya user dengan role ADMIN yang bisa register user baru
- Menggunakan `ForbiddenException` untuk unauthorized access

## Development

```bash
# Format code
npm run format

# Lint
npm run lint

# Build
npm run build

# Production
npm run start:prod
```

## Troubleshooting

### Request entity too large
- Body limit sudah 50MB di main.ts
- Cek network/proxy jika masih error

### Embedding dimensions mismatch
- Model lama: 128 dimensions
- Model baru (MobileFaceNet): 192 dimensions
- User harus re-register dengan model terbaru

### Face not recognized
- Cek embeddings count di database
- Verify similarity threshold di Settings (default 0.6)
- Adjust threshold via web admin (Settings > Face Similarity)
- Re-register dengan pencahayaan lebih baik

---

## ✅ Production Ready

- **Debug Code Removed**: Semua `console.log` statements dihapus
- **Security Hardened**: JWT validation aktif
- **Error Logging**: Hanya error logging untuk production tracking
- **Clean API**: Response bersih tanpa debug info

---

**Last Updated**: November 27, 2025
**Version**: 2.3.0 (Security Hardening - Rate Limiting, JWT, Password Policy)
