# 🎯 START HERE - Sistem Absensi

**Selamat datang!** Ini adalah titik awal untuk sistem absensi Anda.

---

## 📋 Apa yang Anda Miliki

✅ **Python ML Service** (Flask + face_recognition + dlib) - COMPLETE & READY ⚡ (NEW!)
✅ **Backend API** (NestJS + PostgreSQL) - COMPLETE & READY
✅ **Web Admin Panel** (React + TypeScript) - COMPLETE & READY
✅ **Android App** (Kotlin) - STRUCTURE READY
✅ **Complete Documentation** - ALL GUIDES READY

---

## ⚡ FASTEST Start (Using Commands)

Gunakan custom commands untuk start semua server sekaligus:

```bash
# In Claude Code terminal
/start    # Start backend + web admin in separate windows!
/scrcpy   # Launch Android screen mirroring (jika perlu)
```

Atau jalankan langsung dari `scripts/` folder:

```bash
# Windows - Start all services
scripts\start-all.bat

# Atau start satu-satu:
scripts\start-backend.bat        # Backend (port 3001)
scripts\start-web-admin.bat      # Web Admin (port 5173)
scripts\start-face-recognition.bat  # ML Service (port 5000)

# Stop all services:
scripts\stop-all.bat
```

**That's it!** Servers akan start di jendela CMD terpisah. Lanjut ke Step 5 untuk create admin account.

📖 **Detail tentang commands**: Lihat `COMMANDS.md`

---

## 🚀 Quick Start (Manual - 10 Menit)

### Step 1: Install Prerequisites

**Python 3.11+ (untuk ML Service)** ⚡ (NEW!):
```bash
# Windows: Download dari https://www.python.org/downloads/
# Mac: brew install python@3.11
# Linux: sudo apt install python3.11 python3.11-venv python3-pip

# Verify
python --version  # Should be 3.11+
```

**PostgreSQL**:

**Windows**:
```bash
# Download dari https://www.postgresql.org/download/windows/
# Install dan catat password postgres
```

**Mac**:
```bash
brew install postgresql
brew services start postgresql
```

**Linux**:
```bash
sudo apt install postgresql
sudo systemctl start postgresql
```

### Step 2: Start Python ML Service ⚡ (NEW!)

```bash
# Buka terminal 1
cd face-recognition-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start ML service
python app.py

# ✅ ML Service running di http://localhost:5000
# KEEP THIS RUNNING! Don't close this terminal.
```

### Step 3: Start Backend

```bash
# Buka terminal 2 (baru)
cd backend

# Install dependencies
npm install

# Edit .env (sesuaikan password PostgreSQL Anda)
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/absensi_db?schema=public"

# Generate Prisma Client
npm run prisma:generate

# Create & migrate database
npm run prisma:migrate

# Start server
npm run start:dev

# ✅ Backend running di http://localhost:3001/api
```

### Step 4: Start Web Admin

```bash
# Buka terminal 3 (baru)
cd web-admin

# Install dependencies
npm install

# Start dev server
npm run dev

# ✅ Web Admin running di http://localhost:5173
```

### Step 5: Create Admin Account

```bash
# Terminal 4 (atau gunakan Postman)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@absensi.com",
    "password": "admin123",
    "name": "Super Admin",
    "role": "ADMIN"
  }'
```

### Step 6: Login

1. Buka browser: http://localhost:5173
2. Login dengan:
   - Email: `admin@absensi.com`
   - Password: `admin123`
3. ✅ Anda masuk ke Dashboard!

---

## 📂 File Penting

| File | Deskripsi |
|------|-----------|
| **README.md** | Overview lengkap proyek |
| **COMMANDS.md** | Panduan commands & scripts |
| **FEATURES.md** | Daftar fitur lengkap |
| **DEPLOYMENT.md** | Cara deploy ke production |
| **CHANGELOG.md** | History perubahan |

---

## 🗺️ Roadmap Belajar

### Hari 1: Setup & Familiarisasi
- [x] Baca START_HERE.md (file ini) ✅
- [ ] Baca QUICKSTART.md
- [ ] Setup backend & web admin
- [ ] Explore dashboard

### Hari 2-3: Backend
- [ ] Baca backend/README.md
- [ ] Pahami API endpoints
- [ ] Test dengan Postman/curl
- [ ] Lihat database di Prisma Studio

### Hari 4-5: Web Admin
- [ ] Baca web-admin/README.md
- [ ] Pahami component structure
- [ ] Modify styling (optional)
- [ ] Add new features (optional)

### Hari 6-7: Android (Optional)
- [ ] Baca android/ANDROID_GUIDE.md
- [ ] Setup Android Studio
- [ ] Implement features
- [ ] Test di emulator/device

### Hari 8+: Production
- [ ] Baca DEPLOYMENT.md
- [ ] Setup VPS/cloud
- [ ] Deploy backend
- [ ] Deploy web admin
- [ ] Go live! 🚀

---

## 🎓 Learning Path by Role

### Sebagai **Backend Developer**
1. Mulai dari `backend/README.md`
2. Pelajari NestJS architecture
3. Pahami Prisma ORM
4. Explore modules (auth, employee, attendance, reports)
5. Add new features

### Sebagai **Frontend Developer**
1. Mulai dari `web-admin/README.md`
2. Pelajari React + TypeScript setup
3. Pahami API integration
4. Customize UI/UX
5. Add new pages

### Sebagai **Mobile Developer**
1. Mulai dari `android/ANDROID_GUIDE.md`
2. Setup Android Studio
3. Understand MVVM architecture
4. Implement face detection
5. Implement GPS tracking

### Sebagai **Full Stack Developer**
1. Pahami keseluruhan arsitektur (README.md)
2. Setup semua components
3. Understand data flow
4. Implement end-to-end features
5. Deploy to production

---

## 🆘 Troubleshooting

### Backend tidak start?
```bash
# Check PostgreSQL running
sudo systemctl status postgresql

# Check .env configuration
cat .env
```

### Web Admin error?
```bash
# Check backend running
curl http://localhost:3001/api/health

# Check .env
cat .env
```

### Lupa password database?
```bash
# Reset PostgreSQL password
sudo -u postgres psql
ALTER USER postgres PASSWORD 'newpassword';
```

---

## 📚 Documentation Index

### Getting Started
- ✅ **START_HERE.md** (You are here!)
- 📖 **README.md** - Complete overview
- 📖 **COMMANDS.md** - Commands & scripts guide

### Technical Docs
- 📋 **FEATURES.md** - Full feature documentation
- 🚀 **DEPLOYMENT.md** - Production deployment
- 📝 **CHANGELOG.md** - Version history

---

## ✅ Quick Checks

Sebelum mulai development, pastikan:

**Python ML Service** ⚡ (NEW!):
- [ ] Python 3.11+ installed
- [ ] Virtual environment created
- [ ] pip install berhasil
- [ ] Service running di port 5000
- [ ] Health check success: curl http://localhost:5000/health

**Backend**:
- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed & running
- [ ] npm install berhasil
- [ ] Database migrated
- [ ] Server running di port 3001

**Web Admin**:
- [ ] npm install berhasil
- [ ] .env configured
- [ ] Dev server running di port 5173
- [ ] Bisa akses http://localhost:5173

**Database**:
- [ ] PostgreSQL service running
- [ ] Database `absensi_db` exists
- [ ] Migrations applied
- [ ] Can connect via psql

---

## 🎯 Next Actions

**Choose your path:**

### 🚀 I want to use it NOW
→ Follow QUICKSTART.md
→ Setup in 5 minutes
→ Start using!

### 🎓 I want to understand the code
→ Read README.md
→ Explore backend/
→ Explore web-admin/
→ Check android/

### 🔧 I want to customize
→ Read technical docs
→ Modify code
→ Add features
→ Test changes

### 🚢 I want to deploy
→ Read DEPLOYMENT.md
→ Setup production server
→ Deploy!

---

## 💡 Pro Tips

1. **Use Git**: Version control your changes
2. **Read Logs**: Check terminal output for errors
3. **Use Postman**: Test APIs easily
4. **Prisma Studio**: Visual database management
   ```bash
   cd backend
   npm run prisma:studio
   ```
5. **React DevTools**: Debug React components
6. **Chrome DevTools**: Debug web app (F12)

---

## 🎉 You're All Set!

Sistem Anda sudah siap! Pilih salah satu path di atas dan mulai!

**Need help?**
- Check documentation files
- Read error messages carefully
- Check logs (terminal output)
- Google the error
- Ask for help!

---

## 📞 Quick Commands Reference

```bash
# === SCRIPTS (Recommended - Opens in Separate Windows) ===
scripts\start-all.bat            # Start all services
scripts\start-backend.bat        # Start Backend only (port 3001)
scripts\start-web-admin.bat      # Start Web Admin only (port 5173)
scripts\start-face-recognition.bat # Start ML Service only (port 5000)
scripts\stop-all.bat             # Stop all services
scripts\launch-scrcpy.bat        # Launch Android screen mirroring

# === MANUAL COMMANDS ===

# Python ML Service
cd face-recognition-service
python -m venv venv               # Create virtual environment
venv\Scripts\activate             # Activate (Windows)
pip install -r requirements.txt   # Install dependencies
python app.py                     # Start ML service

# Backend
cd backend
npm install                    # Install dependencies
npm run start:dev             # Start development server
npm run prisma:studio         # Open database GUI
npm run prisma:migrate        # Run migrations

# Web Admin
cd web-admin
npm install                    # Install dependencies
npm run dev                   # Start development server
npm run build                 # Build for production

# Health Checks
curl http://localhost:5000/health  # ML Service
curl http://localhost:3001/api     # Backend
```

---

**Happy Coding! 🚀**

Selamat memulai journey development sistem absensi Anda!

---

**Last Updated**: November 25, 2025
**Status**: ✅ Ready to Use
**Version**: 1.5.0 (Late/Early Status Tracking)

---

## 🔗 Quick Links

- [README](README.md) - Complete overview
- [Commands](COMMANDS.md) - Scripts & commands
- [Features](FEATURES.md) - Full feature list
- [Deployment](DEPLOYMENT.md) - Production guide
- [Changelog](CHANGELOG.md) - Version history

---

**Now GO and BUILD something AMAZING! 🌟**
