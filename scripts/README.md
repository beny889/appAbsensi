# Scripts Folder

Folder ini berisi semua batch scripts (.bat) untuk mengelola development servers proyek Absensi App.

## 📋 Available Scripts

### Starting Services

| Script | Description | Port |
|--------|-------------|------|
| `start-backend.bat` | Start Backend (NestJS) | 3001 |
| `start-web-admin.bat` | Start Web Admin (React + Vite) | 5173 |
| `start-face-recognition.bat` | Start Face Recognition (Python Flask) | 5000 |
| `start-all.bat` | Start semua services sekaligus | - |

### Stopping Services

| Script | Description |
|--------|-------------|
| `stop-backend.bat` | Stop Backend service |
| `stop-web-admin.bat` | Stop Web Admin service |
| `stop-face-recognition.bat` | Stop Face Recognition service |
| `stop-all.bat` | Stop semua services sekaligus |

### Utility Scripts

| Script | Description |
|--------|-------------|
| `status-check.bat` | Cek status semua services (running/not running) |
| `launch-scrcpy.bat` | Launch scrcpy untuk Android device screen mirroring |

## 🚀 Cara Menggunakan

### 1. Double-click pada file .bat
Cara termudah adalah dengan double-click pada file .bat yang ingin dijalankan di Windows Explorer.

### 2. Via Command Line (CMD/PowerShell)
```bash
# Dari root project
scripts\start-backend.bat
scripts\start-web-admin.bat
scripts\start-face-recognition.bat
scripts\start-all.bat

# Atau dari folder scripts
cd scripts
start-backend.bat
```

### 3. Via Claude Code Command
```bash
/start
```
Akan menampilkan menu interaktif untuk memilih service yang ingin dijalankan.

## 📌 Important Notes

- **Separate Windows**: Setiap service akan dibuka di CMD window yang terpisah
- **Port Checking**: Script akan otomatis cek apakah port sudah digunakan sebelum start
- **Auto-detect**: Script menggunakan relative path, jadi bisa dijalankan dari mana saja
- **ADB Reverse**: Jika Backend dijalankan, ADB reverse akan otomatis di-setup (via /start command)

## 🔍 Status Check

Untuk cek status semua services, jalankan:
```bash
scripts\status-check.bat
```

Output akan menunjukkan:
- Status setiap service (RUNNING/NOT RUNNING)
- PID (Process ID) jika running
- Health check status (OK/STARTING/NOT RUNNING)
- Summary dengan checkmarks

## 🛑 Stopping Services

### Stop Specific Service
```bash
scripts\stop-backend.bat
scripts\stop-web-admin.bat
scripts\stop-face-recognition.bat
```

### Stop All Services
```bash
scripts\stop-all.bat
```

### Manual Stop
Anda juga bisa:
1. Close CMD window dari service yang ingin dihentikan
2. Tekan `Ctrl+C` di CMD window tersebut

## 📝 Service URLs

Setelah services running, akses via:

| Service | URL |
|---------|-----|
| Backend API | http://localhost:3001/api |
| Backend Health | http://localhost:3001/api/health |
| Web Admin | http://localhost:5173 |
| Face Recognition | http://localhost:5000 |
| Face Rec Health | http://localhost:5000/health |

## 🔧 Troubleshooting

### Port Already in Use
Jika ada error "port already in use":
1. Jalankan `status-check.bat` untuk cek service mana yang running
2. Stop service tersebut dengan `stop-xxx.bat`
3. Atau kill manual via Task Manager

### Service Not Starting
1. Cek apakah dependencies sudah di-install (`npm install` atau `pip install`)
2. Cek logs di CMD window yang dibuka
3. Tunggu 10-30 detik untuk services fully start
4. Jalankan health check di browser

### ADB Reverse Issues (Android)
Jika Android app tidak bisa connect ke backend:
1. Pastikan device terhubung: `adb devices`
2. Setup ulang reverse: `/c/scrcpy/scrcpy-win64-v3.1/adb.exe reverse tcp:3001 tcp:3001`
3. Atau jalankan `/start` command lagi

## 📂 Folder Structure

```
scripts/
├── start-backend.bat          # Start Backend
├── start-web-admin.bat        # Start Web Admin
├── start-face-recognition.bat # Start Face Recognition
├── start-all.bat              # Start all
├── stop-backend.bat           # Stop Backend
├── stop-web-admin.bat         # Stop Web Admin
├── stop-face-recognition.bat  # Stop Face Recognition
├── stop-all.bat               # Stop all
├── status-check.bat           # Check status
├── launch-scrcpy.bat          # Launch scrcpy
└── README.md                  # This file
```

## 💡 Tips

1. **Recommended Workflow**:
   - Start services yang dibutuhkan saja (hemat resource)
   - Use `status-check.bat` untuk verify sebelum coding
   - Stop services saat tidak digunakan

2. **Development**:
   - Backend + Web Admin: untuk web development
   - Backend + Face Recognition: untuk testing face recognition
   - All services: untuk full integration testing

3. **VS Code Terminal**:
   - Tetap free untuk git, npm, dan command lain
   - Services berjalan independent di CMD windows
   - Lebih organized dan mudah di-manage
