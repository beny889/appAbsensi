# Absensi Backend API

Backend API untuk sistem absensi dengan face recognition dan GPS detection.

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + Passport
- **Validation**: class-validator

## Features

- ✅ JWT Authentication
- ✅ Role-based Access Control (Admin & Employee)
- ✅ Employee Self-Registration (NEW!)
- ✅ Face Registration Approval Workflow (NEW!)
- ✅ Face Recognition Integration (Embedding Storage)
- ✅ GPS Location Validation
- ✅ Check-in/Check-out Management
- ✅ Attendance Reports & Analytics
- ✅ Employee Management

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm atau yarn

## Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env dengan konfigurasi database Anda

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Run seed data
npm run prisma:seed
```

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/absensi_db?schema=public"

# Application
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Running the Application

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Prisma Studio (Database GUI)
npm run prisma:studio
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user profile

### Employees
- `GET /api/employees` - Get all employees (Admin only)
- `GET /api/employees/:id` - Get employee by ID
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee (Admin only)
- `POST /api/employees/face-register` - Register face embedding (deprecated - use face-registration endpoints)
- `GET /api/employees/face-status/:id` - Check if face registered

### Face Registration (NEW!)
- `POST /api/face-registration/submit` - Submit face registration (Public - No auth)
- `GET /api/face-registration/pending` - Get pending registrations (Admin only)
- `GET /api/face-registration/:id` - Get registration by ID (Admin only)
- `POST /api/face-registration/:id/approve` - Approve registration (Admin only)
- `POST /api/face-registration/:id/reject` - Reject registration (Admin only)
- `DELETE /api/face-registration/:id` - Delete registration (Admin only)
- `GET /api/face-registration/stats/overview` - Get statistics (Admin only)

### Attendance
- `POST /api/attendance` - Create attendance record
- `POST /api/attendance/verify` - Verify face & location, then create attendance
- `GET /api/attendance/my` - Get my attendance history
- `GET /api/attendance/today` - Get today's attendance
- `GET /api/attendance/user/:userId` - Get user attendance (Admin only)
- `GET /api/attendance/all` - Get all attendances (Admin only)

### Reports
- `GET /api/reports/daily` - Daily summary (Admin only)
- `GET /api/reports/monthly` - Monthly summary (Admin only)
- `GET /api/reports/user/monthly` - My monthly report
- `GET /api/reports/user/:userId/monthly` - User monthly report (Admin only)
- `GET /api/reports/dashboard` - Dashboard statistics (Admin only)

## Database Schema

### User
- id, email, password, name, role
- phone, position, department
- faceEmbedding, faceImageUrl
- isActive, createdAt, updatedAt

### Attendance
- id, userId, type (CHECK_IN/CHECK_OUT)
- latitude, longitude, locationId
- faceImageUrl, similarity
- notes, isVerified, timestamp

### Location
- id, name, address
- latitude, longitude, radius
- isActive

### Settings
- id, key, value, description

### FaceRegistration (NEW!)
- id, name
- faceEmbedding (128-dimensional vector as JSON)
- faceImageUrl (data URL or public URL)
- status (PENDING/APPROVED/REJECTED)
- rejectionReason, reviewedAt, reviewedBy
- userId (foreign key, created on approval)

## Face Recognition Flow

### 1. Employee Self-Registration (NEW!)
1. **Mobile App** (No login required)
   - User opens app
   - Taps "📸 Rekam Data Wajah" button
   - Camera opens with ML Kit face detection
   - Face detected → Name input dialog
   - User enters name

2. **Submit to Backend**
   - POST /api/face-registration/submit
   - Body: { name: string, faceImageBase64: string }
   - Backend generates 128-dim placeholder embedding
   - Stores with status: PENDING
   - Checks for duplicate faces (cosine similarity)

3. **Admin Approval**
   - Admin views pending registrations in web panel
   - Reviews face image and name
   - Approves or rejects

4. **On Approval**
   - Backend creates User account automatically
   - Copies face data to User table
   - Status changed to APPROVED
   - Employee can now login

### 2. Check-in/Check-out
   - Android app capture foto + GPS
   - Send base64 image to backend
   - Backend generates embedding from image
   - Compare dengan stored embedding (cosine similarity >80%)
   - Validate GPS dalam radius (Haversine distance)
   - Save attendance record

## GPS Validation

- Admin set lokasi kantor (lat, lng, radius)
- Backend validate apakah user dalam radius
- Menggunakan Haversine formula untuk calculate distance

## Security

- JWT token authentication
- Role-based access control
- Password hashing dengan bcrypt
- Input validation
- CORS configuration

## Development

```bash
# Format code
npm run format

# Lint
npm run lint

# Run tests
npm run test

# Test coverage
npm run test:cov
```

## Deployment

1. Setup PostgreSQL database
2. Configure environment variables
3. Run migrations
4. Build application
5. Deploy to VPS/Cloud

## License

Private - Internal Use Only
