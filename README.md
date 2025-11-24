# Sistem Absensi - Face Recognition & GPS

Sistem absensi komprehensif dengan face recognition dan GPS detection yang terdiri dari:
- **Backend API** (NestJS + PostgreSQL)
- **Android App** (Native Kotlin + ML Kit)
- **Web Admin Panel** (React + Vite)

## 📋 Table of Contents

- [Quick Start](#-quick-start-commands)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Tech Stack](#tech-stack)
- [Fitur Utama](#fitur-utama)
- [Setup & Installation](#setup--installation)
- [Struktur Proyek](#struktur-proyek)
- [Deployment](#deployment)

## ⚡ Quick Start Commands

**FASTEST way to start development:**

```bash
# In Claude Code terminal:
/start    # Start backend + web admin automatically
/scrcpy   # Launch Android screen mirroring (optional)
```

Or use scripts directly:

```bash
# Windows
start-dev.bat
launch-scrcpy.bat

# Linux/Mac
./start-dev.sh
./launch-scrcpy.sh
```

📖 **Full command documentation**: See [COMMANDS.md](COMMANDS.md)

---

## 🏗 Arsitektur Sistem

```
┌─────────────────┐         ┌─────────────────┐
│  Android App    │◄───────►│   Backend API   │
│  (Kotlin)       │  HTTPS  │   (NestJS)      │
│  - ML Kit Face  │         │   - JWT Auth    │
│  - GPS Location │         │   - Prisma ORM  │
└─────────────────┘         │   - PostgreSQL  │
                            └────────┬────────┘
                                     │
┌─────────────────┐                  │
│  Web Admin      │◄─────────────────┘
│  (React+Vite)   │         HTTPS
│  - Dashboard    │
│  - Reports      │
│  - Employee Mgmt│
└─────────────────┘
```

## 🛠 Tech Stack

### Backend API
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL 14+
- **ORM**: Prisma
- **Auth**: JWT + Passport
- **Validation**: class-validator
- **Port**: 3001

### Android App
- **Language**: Kotlin
- **Architecture**: MVVM + Clean Architecture
- **Face Recognition**: ML Kit Face Detection
- **Location**: Google Play Services Location API
- **Networking**: Retrofit + OkHttp
- **Local DB**: Room (SQLite)
- **DI**: Hilt/Dagger

### Web Admin Panel
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI / Ant Design
- **State Management**: Redux Toolkit / Zustand
- **Charts**: Recharts
- **Port**: 5173

## ✨ Fitur Utama

### 🔐 Authentication & Authorization
- JWT token authentication
- Role-based access (Admin & Employee)
- Secure password hashing (bcrypt)

### 👤 Face Recognition
- **Employee Self-Registration** (NEW!)
  - Self-service face enrollment via mobile app
  - Base64 image upload
  - Auto placeholder embedding generation
  - Pending approval workflow
- **Admin Approval System** (NEW!)
  - Review pending face registrations
  - Approve/reject workflow
  - Automatic user account creation on approval
- Face verification saat check-in/out
- Cosine similarity matching
- Threshold: 80%
- Face embedding storage (128-dimensional vectors)

### 📍 GPS & Geofencing
- Location-based attendance
- Configurable radius per location
- Real-time GPS validation
- Haversine distance calculation

### 📊 Attendance Management
- Check-in/Check-out tracking
- Daily attendance records
- Attendance history
- Real-time status

### 📈 Reports & Analytics
- Daily summary
- Monthly summary
- Employee attendance rate
- Dashboard statistics
- Export capabilities

## 🚀 Setup & Installation

### Prerequisites
```bash
# Required software
- Node.js 18+
- PostgreSQL 14+
- Android Studio (untuk Android dev)
- JDK 17+
```

### 1. Clone & Setup

```bash
cd absensiApp
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure database
# Edit .env file dengan database credentials Anda

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start development server
npm run start:dev

# Server will run on http://localhost:3001
```

### 3. Web Admin Setup

```bash
cd ../web-admin

# Install dependencies
npm install

# Configure API endpoint
# Edit .env file

# Start development server
npm run dev

# App will run on http://localhost:5173
```

### 4. Android Setup

```bash
cd ../android

# Open in Android Studio
# Sync Gradle
# Update BASE_URL di Constants.kt
# Build & Run
```

## 📁 Struktur Proyek

```
absensiApp/
├── backend/                # NestJS Backend API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/      # Authentication
│   │   │   ├── employee/  # Employee Management
│   │   │   ├── attendance/# Attendance
│   │   │   └── reports/   # Reports & Analytics
│   │   ├── prisma/        # Prisma Service
│   │   ├── common/        # Guards, Decorators
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma  # Database Schema
│   └── package.json
│
├── android/               # Android Native App
│   ├── app/
│   │   └── src/
│   │       └── main/
│   │           ├── java/
│   │           │   └── com/absensi/
│   │           │       ├── data/     # Repository, API
│   │           │       ├── domain/   # Use Cases
│   │           │       └── presentation/ # UI, ViewModels
│   │           └── res/
│   └── build.gradle
│
└── web-admin/            # React Admin Panel
    ├── src/
    │   ├── components/   # Reusable Components
    │   ├── pages/        # Pages
    │   ├── services/     # API Services
    │   ├── store/        # State Management
    │   └── App.tsx
    └── package.json
```

## 🔑 Database Schema

### Users Table
```sql
- id (cuid)
- email (unique)
- password (hashed)
- name
- role (ADMIN/EMPLOYEE)
- phone, position, department
- faceEmbedding (text)
- faceImageUrl
- isActive
- createdAt, updatedAt
```

### Attendances Table
```sql
- id (cuid)
- userId (foreign key)
- type (CHECK_IN/CHECK_OUT)
- latitude, longitude
- locationId (foreign key)
- faceImageUrl
- similarity (float)
- notes
- isVerified
- timestamp
```

### Locations Table
```sql
- id (cuid)
- name, address
- latitude, longitude
- radius (meters, default 100)
- isActive
```

### FaceRegistration Table (NEW!)
```sql
- id (cuid)
- name
- faceEmbedding (text, 128-dim vector)
- faceImageUrl (data URL or public URL)
- status (PENDING/APPROVED/REJECTED)
- rejectionReason (text, optional)
- approvedAt (datetime)
- approvedBy (userId, foreign key)
- createdAt, updatedAt
```

## 🔄 Flow Diagram

### Employee Self-Registration Flow (NEW!)
```
1. User opens app (no login required)
2. Click "📸 Rekam Data Wajah" button
3. Camera opens → Face detection via ML Kit
4. Face detected → Input name dialog appears
5. User enters full name → Click "Daftar"
6. App converts image to base64
7. POST to /api/face-registration/submit
   - name: string
   - faceImageBase64: string
8. Backend:
   - Generate placeholder embedding (128-dim)
   - Store with status PENDING
   - Check for duplicate faces
9. Return success → User notified to wait for approval
10. Admin reviews in web panel
11. Admin approves → Auto-create user account
12. User can now login and use the app
```

### Admin Face Registration Approval Flow (NEW!)
```
1. Admin logs into web panel
2. Navigate to Face Registration > Pending
3. View list of pending registrations
4. For each registration:
   - View submitted face image
   - View applicant name
   - Click "Approve" or "Reject"
5. On Approve:
   - Create User account automatically
   - Copy face data to User table
   - Set registration status to APPROVED
   - Employee can now login
6. On Reject:
   - Set status to REJECTED
   - Optionally add rejection reason
   - Notify employee (future enhancement)
```

### Check-in Flow
```
1. User clicks "Check In"
2. Request GPS permission
3. Get current location
4. Camera captures face photo
5. ML Kit extracts face embedding
6. Send to backend: { embedding, lat, lng, type: CHECK_IN }
7. Backend:
   - Compare embedding (cosine similarity)
   - Validate GPS radius
   - Check duplicate check-in
8. Create attendance record
9. Return success → Show confirmation
```

### Check-out Flow
```
1. User clicks "Check Out"
2. Get current location
3. Camera captures face
4. ML Kit extracts embedding
5. Send to backend: { embedding, lat, lng, type: CHECK_OUT }
6. Backend:
   - Verify face
   - Validate location
   - Check if already checked in
7. Create checkout record
8. Calculate work duration
9. Return success
```

## 📱 API Endpoints

### Authentication
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Employees
```
GET    /api/employees
GET    /api/employees/:id
PUT    /api/employees/:id
DELETE /api/employees/:id
POST   /api/employees/face-register
GET    /api/employees/face-status/:id
```

### Attendance
```
POST /api/attendance
POST /api/attendance/verify
GET  /api/attendance/my
GET  /api/attendance/today
GET  /api/attendance/user/:userId
GET  /api/attendance/all
```

### Reports
```
GET /api/reports/daily
GET /api/reports/monthly
GET /api/reports/user/monthly
GET /api/reports/user/:userId/monthly
GET /api/reports/dashboard
```

### Face Registration (NEW!)
```
POST   /api/face-registration/submit           (Public - No auth)
GET    /api/face-registration/pending          (Admin only)
GET    /api/face-registration/:id              (Admin only)
POST   /api/face-registration/:id/approve      (Admin only)
POST   /api/face-registration/:id/reject       (Admin only)
DELETE /api/face-registration/:id              (Admin only)
GET    /api/face-registration/stats/overview   (Admin only)
```

## 🚀 Deployment

### Backend (VPS/Cloud)

```bash
# 1. Setup PostgreSQL
sudo apt install postgresql

# 2. Clone & install
git clone <repo>
cd backend
npm install
npm run build

# 3. Setup PM2
npm install -g pm2
pm2 start dist/main.js --name absensi-api

# 4. Setup Nginx reverse proxy
# Port 3001 → domain.com
```

### Web Admin (Static Hosting)

```bash
# Build
npm run build

# Deploy to Vercel/Netlify
vercel deploy
# atau
netlify deploy
```

### Android (APK Distribution)

```bash
# Generate signed APK
# Android Studio → Build → Generate Signed Bundle/APK

# Distribute via:
- Google Play Store (recommended)
- Internal distribution server
- Direct download
```

## 🔐 Security Best Practices

- ✅ HTTPS only untuk semua komunikasi
- ✅ JWT token dengan expiry
- ✅ Password hashing dengan bcrypt
- ✅ Face embedding encryption
- ✅ Rate limiting di API
- ✅ Input validation & sanitization
- ✅ CORS configuration
- ✅ Role-based access control

## 📊 Performance Optimization

- Face embedding storage di database (bukan image)
- Indexed database queries
- Caching dengan Redis (optional)
- Image compression untuk face photos
- Pagination untuk large datasets
- Lazy loading di frontend

## 🐛 Troubleshooting

### Backend tidak start
```bash
# Check PostgreSQL running
sudo systemctl status postgresql

# Check .env configuration
cat .env

# Regenerate Prisma client
npm run prisma:generate
```

### Android build error
```bash
# Clean & rebuild
./gradlew clean
./gradlew build

# Sync Gradle
File → Sync Project with Gradle Files
```

### Face recognition tidak akurat
```bash
# Pastikan:
- Lighting cukup
- Wajah terlihat jelas
- Tidak ada obstacle (masker, kacamata hitam)
- Distance optimal (30-100cm)
```

## 📝 Next Steps

### Phase 1: MVP ✅ (COMPLETE)
- ✅ Backend API complete
- ✅ Database schema
- ✅ Authentication
- ✅ Face recognition logic
- ✅ GPS validation

### Phase 2: Frontend ✅ (COMPLETE)
- ✅ Web admin panel (READY TO USE)
  - Login & authentication
  - Dashboard with statistics
  - Employee management
  - Attendance tracking
  - Daily & monthly reports
- ✅ Android app (STARTER TEMPLATE READY)
  - Project structure
  - Gradle configuration
  - Package architecture
  - Core utilities

### Phase 3: Deployment 🚀 (READY)
- ✅ Deployment documentation
- ✅ Production setup guide
- ✅ Security checklist
- ✅ Monitoring strategy

### Phase 4: Enhancement (Future)
- [ ] Android app full implementation
- [ ] Push notifications
- [ ] Shift management
- [ ] Leave/cuti management
- [ ] Overtime tracking
- [ ] Biometric fallback
- [ ] Offline mode
- [ ] Export to Excel/PDF
- [ ] Charts & analytics
- [ ] Real-time updates (WebSocket)

## 📄 License

Private - Internal Use Only

## 👥 Support

Untuk pertanyaan atau issues, hubungi team developer.

---

**Built with ❤️ for efficient attendance management**
