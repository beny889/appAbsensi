# 🚀 Quick Start Guide - Sistem Absensi

Panduan cepat untuk memulai development sistem absensi.

## ⚡ Setup dalam 5 Menit

### 1. Backend API (2 menit)

```bash
# Masuk ke direktori backend
cd backend

# Install dependencies
npm install

# Setup database PostgreSQL
# Pastikan PostgreSQL sudah terinstall dan running

# Edit .env (sesuaikan dengan database Anda)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/absensi_db?schema=public"
PORT=3001
JWT_SECRET=your-secret-key-here

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start server
npm run start:dev

# ✅ Server running di http://localhost:3001/api
```

### 2. Web Admin Panel (2 menit)

```bash
# Buka terminal baru
cd web-admin

# Install dependencies
npm install

# Start development server
npm run dev

# ✅ Web admin running di http://localhost:5173
```

### 3. Create Admin User (1 menit)

```bash
# Create admin user via API
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@test.com",
    "password": "admin123",
    "role": "ADMIN"
  }'
```

**Admin Account Credentials**:
- Email: `admin@test.com`
- Password: `admin123`

### 4. Test Login

1. Buka browser: `http://localhost:5173`
2. Login dengan credentials admin di atas
3. Dashboard akan menampilkan statistik

---

## 📱 Android Development

### Prerequisites
- Android Studio
- JDK 17+
- Android SDK
- Android device (physical device recommended)

### Setup

```bash
# 1. Open Android Studio
File → Open → Select 'android' folder

# 2. Sync Gradle
Tools → Sync Project with Gradle Files

# 3. Setup ADB Reverse (for USB connection)
# Connect your Android device via USB
adb reverse tcp:3001 tcp:3001

# 4. RetrofitClient.kt already configured with:
BASE_URL = "http://localhost:3001/api/"

# 5. Build & Run
Run → Run 'app'

# 6. Test Face Registration
# - Tap "📸 Rekam Data Wajah" button on home screen
# - Camera will open with face detection
# - When face detected, enter your name
# - Submit registration
# - Check web admin for approval
```

### Face Registration Flow
1. **Android App**: Record face → Submit with name
2. **Backend**: Store with PENDING status
3. **Web Admin**: Admin approves → Create user account
4. **Android App**: Employee can now login

---

## 🧪 Testing

### Test Backend API

```bash
# Health check
curl http://localhost:3001/api/health

# Register admin
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123",
    "name": "Admin Test",
    "role": "ADMIN"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'

# Copy token dari response, kemudian:

# Get employees (replace YOUR_TOKEN)
curl http://localhost:3001/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Web Admin

1. **Login Page**
   - Navigate to `http://localhost:5173/login`
   - Enter credentials
   - Check success redirect to dashboard

2. **Dashboard**
   - Verify stats cards display
   - Check API data loading

3. **Employees**
   - Navigate to `/employees`
   - Test search functionality
   - Verify table displays

4. **Attendance**
   - Navigate to `/attendance`
   - Test date filters
   - Check data displays

5. **Reports**
   - Test daily report with date selection
   - Test monthly report with year/month selection

---

## 🔧 Common Issues & Solutions

### Backend tidak start

**Problem**: `Error: connect ECONNREFUSED`

**Solution**:
```bash
# Check PostgreSQL running
sudo systemctl status postgresql

# Start if not running
sudo systemctl start postgresql

# Check connection
psql -U postgres -h localhost
```

### Web Admin tidak bisa connect ke API

**Problem**: CORS error atau network error

**Solution**:
```bash
# 1. Check backend running
curl http://localhost:3001/api/health

# 2. Check CORS di backend/src/main.ts
app.enableCors({
  origin: ['http://localhost:5173'],
  credentials: true,
});

# 3. Check .env di web-admin
VITE_API_URL=http://localhost:3001/api
```

### Android build error

**Problem**: Gradle sync failed

**Solution**:
```bash
# 1. Clean project
Build → Clean Project

# 2. Invalidate caches
File → Invalidate Caches → Invalidate and Restart

# 3. Check Gradle JDK
File → Settings → Build → Gradle → Gradle JDK = 17
```

### Android network error

**Problem**: Registration fails with "network error"

**Solution**:
```bash
# 1. Check ADB reverse is active
adb reverse tcp:3001 tcp:3001
adb reverse --list

# 2. Verify backend is running
curl http://localhost:3001/api/health

# 3. Rebuild Android app after any RetrofitClient changes
Build → Rebuild Project

# 4. Check device is connected
adb devices
```

### Database migration error

**Problem**: Migration failed

**Solution**:
```bash
# Reset database (CAREFUL: Deletes all data!)
cd backend
npm run prisma:migrate reset

# Or manually drop and recreate
psql -U postgres
DROP DATABASE absensi_db;
CREATE DATABASE absensi_db;
\q

# Then migrate again
npm run prisma:migrate
```

---

## 📚 Documentation References

- **Main README**: `README.md` - Overview lengkap
- **Backend**: `backend/README.md` - Backend API docs
- **Web Admin**: `web-admin/README.md` - Web admin docs
- **Android Guide**: `android/ANDROID_GUIDE.md` - Android development
- **Deployment**: `DEPLOYMENT.md` - Production deployment

---

## 🎯 Development Workflow

### Typical Development Day

```bash
# Morning: Start services
cd backend && npm run start:dev &
cd web-admin && npm run dev &

# Code, code, code...

# Test changes
# - Backend: curl or Postman
# - Frontend: Browser at localhost:5173
# - Android: Android Studio emulator

# Evening: Commit changes
git add .
git commit -m "feat: add new feature"
git push
```

### Making Changes

**Backend changes**:
1. Edit files in `backend/src/`
2. Server auto-restarts (watch mode)
3. Test with curl/Postman

**Web Admin changes**:
1. Edit files in `web-admin/src/`
2. Hot reload automatic
3. Test in browser

**Database schema changes**:
1. Edit `backend/prisma/schema.prisma`
2. Run `npm run prisma:migrate`
3. Prisma Client auto-generated

---

## ✅ Checklist: Saya siap development!

Backend:
- [ ] PostgreSQL installed & running
- [ ] Node.js 18+ installed
- [ ] `npm install` berhasil
- [ ] Database migrations berhasil
- [ ] Server running di port 3001
- [ ] Health check returns OK

Web Admin:
- [ ] `npm install` berhasil
- [ ] Dev server running di port 5173
- [ ] Bisa login
- [ ] Dashboard shows data

Android (Optional):
- [ ] Android Studio installed
- [ ] Gradle sync successful
- [ ] Emulator/device connected
- [ ] App builds successfully

---

## 🆘 Need Help?

1. **Check logs**:
   - Backend: Terminal output
   - Web Admin: Browser console (F12)
   - Android: Logcat in Android Studio

2. **Database issues**: Use Prisma Studio
   ```bash
   cd backend
   npm run prisma:studio
   # Opens at http://localhost:5555
   ```

3. **API testing**: Use Postman or curl

4. **Documentation**: Read the detailed guides in each folder

---

## 🎉 You're Ready!

Sekarang Anda sudah siap untuk mulai development. Happy coding! 🚀

**Next Steps**:
1. Explore the codebase
2. Read the detailed documentation
3. Start implementing features
4. Test thoroughly
5. Deploy to production (see DEPLOYMENT.md)

---

**Tips**:
- Use Git untuk version control
- Write tests untuk code Anda
- Follow the existing code style
- Document your changes
- Ask questions bila stuck!

---

Selamat coding! 💻✨
