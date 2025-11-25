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
- Admin approval workflow
- Attendance reports (daily/monthly)

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

# Start development
npm run start:dev    # Port 3001

# Prisma Studio (Database GUI)
npx prisma studio    # Port 5555
```

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
DELETE /api/attendance/:id

GET    /api/reports/daily
GET    /api/reports/monthly
GET    /api/reports/dashboard
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
      "embeddingsCount": 5
    }
  ],
  "supportsMultipleEmbeddings": true
}
```

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
- Matching menggunakan cosine similarity (threshold 80%)

### JWT Authentication
- Token-based untuk API access
- Role-based access control (ADMIN/EMPLOYEE)
- Protected routes dengan guards

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
- Verify similarity threshold (default 80%)
- Re-register dengan pencahayaan lebih baik

---

**Last Updated**: November 26, 2025
