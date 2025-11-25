# Development Commands & Scripts

Panduan lengkap untuk menggunakan development commands dan scripts.

---

## Quick Reference

| Script | Description | Port |
|--------|-------------|------|
| `scripts\start-all.bat` | Start all services | 3001, 5173, 5000 |
| `scripts\start-backend.bat` | Start Backend only | 3001 |
| `scripts\start-web-admin.bat` | Start Web Admin only | 5173 |
| `scripts\start-face-recognition.bat` | Start ML Service only | 5000 |
| `scripts\stop-all.bat` | Stop all services | - |
| `scripts\stop-backend.bat` | Stop Backend only | 3001 |
| `scripts\stop-web-admin.bat` | Stop Web Admin only | 5173 |
| `scripts\stop-face-recognition.bat` | Stop ML Service only | 5000 |
| `scripts\launch-scrcpy.bat` | Android screen mirroring | - |

---

## Claude Code Custom Commands

### `/start` - Start Development Servers

Menjalankan Backend + Web Admin di jendela CMD terpisah.

```bash
/start
```

**What it does**:
1. Opens Backend in new CMD window (port 3001)
2. Opens Web Admin in new CMD window (port 5173)
3. Each service runs independently

**Options**:
- `/start` - Start Backend + Web Admin
- `/start backend` - Start Backend only
- `/start web` - Start Web Admin only
- `/start all` - Start all services including Face Recognition

---

### `/scrcpy` - Android Screen Mirroring

Launch scrcpy untuk mirror layar Android device ke komputer.

```bash
/scrcpy
```

**Prerequisites**:
- scrcpy installed (`C:\scrcpy\scrcpy-win64-v3.1\`)
- Android device connected via USB
- USB Debugging enabled

---

## Scripts (scripts/ folder)

### Start Scripts

#### `start-all.bat`
Start all 3 services in separate windows:
```cmd
scripts\start-all.bat
```

#### `start-backend.bat`
Start Backend API only:
```cmd
scripts\start-backend.bat
```
- Port: 3001
- URL: http://localhost:3001/api

#### `start-web-admin.bat`
Start Web Admin only:
```cmd
scripts\start-web-admin.bat
```
- Port: 5173
- URL: http://localhost:5173

#### `start-face-recognition.bat`
Start Python ML Service only:
```cmd
scripts\start-face-recognition.bat
```
- Port: 5000
- URL: http://localhost:5000/health

---

### Stop Scripts

#### `stop-all.bat`
Stop all services:
```cmd
scripts\stop-all.bat
```

#### `stop-backend.bat`
Stop Backend only (kills process on port 3001):
```cmd
scripts\stop-backend.bat
```

#### `stop-web-admin.bat`
Stop Web Admin only (kills process on port 5173):
```cmd
scripts\stop-web-admin.bat
```

#### `stop-face-recognition.bat`
Stop ML Service only (kills process on port 5000):
```cmd
scripts\stop-face-recognition.bat
```

---

### Utility Scripts

#### `launch-scrcpy.bat`
Launch Android screen mirroring:
```cmd
scripts\launch-scrcpy.bat
```

#### `status-check.bat`
Check status of all services:
```cmd
scripts\status-check.bat
```

---

## Common Workflows

### Starting Development

**Option 1: All Services**
```cmd
scripts\start-all.bat
```

**Option 2: Backend + Web Admin Only**
```cmd
scripts\start-backend.bat
scripts\start-web-admin.bat
```

**Option 3: Claude Code Command**
```bash
/start
```

---

### Android Development

```bash
# 1. Connect Android device via USB
# 2. Enable USB Debugging on device

# 3. Start servers
/start

# 4. Launch scrcpy
/scrcpy

# 5. Setup ADB reverse for localhost
adb reverse tcp:3001 tcp:3001
```

---

### Full Development Session

```bash
# Morning: Start everything
scripts\start-all.bat

# Work on code...
# - Backend: http://localhost:3001/api
# - Web Admin: http://localhost:5173
# - ML Service: http://localhost:5000

# Evening: Stop all
scripts\stop-all.bat
```

---

## Health Checks

```bash
# Backend
curl http://localhost:3001/api/health

# ML Service
curl http://localhost:5000/health

# Web Admin (returns HTML)
curl http://localhost:5173
```

---

## Troubleshooting

### Port Already in Use

```cmd
# Find process using port
netstat -ano | findstr :3001

# Kill process by PID
taskkill /F /PID <PID>
```

### Backend Won't Start

1. Check PostgreSQL is running
2. Check `.env` configuration
3. Run `npm run prisma:generate`

### ML Service Won't Start

1. Check Python 3.11+ installed
2. Activate virtual environment
3. Install dependencies: `pip install -r requirements.txt`

### scrcpy Issues

1. Check device connected: `adb devices`
2. Enable USB Debugging on device
3. Accept USB debugging authorization on device

---

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| Backend API | 3001 | http://localhost:3001/api |
| Web Admin | 5173 | http://localhost:5173 |
| ML Service | 5000 | http://localhost:5000 |
| Prisma Studio | 5555 | http://localhost:5555 |

---

**Last Updated**: November 25, 2025
