# 🎮 Development Commands

Panduan lengkap untuk menggunakan development commands dan scripts.

---

## 🚀 Custom Claude Commands

### `/start` - Start All Development Servers

Menjalankan semua server development (Backend + Web Admin) secara otomatis.

**Usage**:
```
/start
```

**What it does**:
1. Starts Backend API (NestJS) on port 3001
2. Starts Web Admin (React) on port 5173
3. Shows status and URLs
4. Opens in separate terminal windows

---

### `/scrcpy` - Launch Android Screen Mirroring

Launch scrcpy untuk mirror layar Android device ke komputer.

**Usage**:
```
/scrcpy
```

**What it does**:
1. Checks if scrcpy is installed
2. Checks for connected Android devices
3. Launches scrcpy with optimized settings:
   - Resolution: 1024x768
   - Bitrate: 8Mbps
   - Always on top
   - Keep screen on

**Prerequisites**:
- scrcpy installed
- Android device connected via USB
- USB Debugging enabled
- ADB drivers installed

---

## 📜 Shell Scripts

### Windows (`.bat` files)

#### Start Development Servers
```cmd
start-dev.bat
```

#### Stop All Servers
```cmd
stop-dev.bat
```

#### Launch scrcpy
```cmd
launch-scrcpy.bat
```

### Linux/Mac (`.sh` files)

#### Start Development Servers
```bash
./start-dev.sh
```

#### Stop All Servers
```bash
./stop-dev.sh
```

#### Launch scrcpy
```bash
./launch-scrcpy.sh
```

---

## 🔧 Script Details

### `start-dev.bat` / `start-dev.sh`

**Features**:
- ✅ Checks if servers already running
- ✅ Starts backend in separate window
- ✅ Starts web admin in separate window
- ✅ Shows server URLs
- ✅ Checks server health
- ✅ Logs output to files (Unix only)

**Ports**:
- Backend: `3001`
- Web Admin: `5173`

**Logs** (Linux/Mac):
- Backend: `logs/backend.log`
- Web Admin: `logs/web-admin.log`

---

### `stop-dev.bat` / `stop-dev.sh`

**Features**:
- ✅ Stops backend server
- ✅ Stops web admin server
- ✅ Kills processes by port
- ✅ Confirms shutdown

---

### `launch-scrcpy.bat` / `launch-scrcpy.sh`

**Features**:
- ✅ Checks scrcpy installation
- ✅ Checks ADB installation
- ✅ Lists connected devices
- ✅ Launches with optimal settings
- ✅ Error handling

**scrcpy Settings Used**:
```bash
--max-size 1024          # Limit resolution to 1024px
--bit-rate 8M            # 8Mbps for smooth streaming
--always-on-top          # Keep window on top
--turn-screen-off        # Turn off device screen
--stay-awake             # Prevent device sleep
```

---

## 📦 Installation Requirements

### scrcpy Installation

#### Windows
```cmd
# Option 1: Chocolatey
choco install scrcpy

# Option 2: Scoop
scoop install scrcpy

# Option 3: Manual
# Download from: https://github.com/Genymobile/scrcpy/releases
```

#### macOS
```bash
brew install scrcpy
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt install scrcpy
```

#### Linux (Arch)
```bash
sudo pacman -S scrcpy
```

### Android SDK Platform Tools (for ADB)

#### Windows
```cmd
# Chocolatey
choco install adb

# Or download from:
# https://developer.android.com/studio/releases/platform-tools
```

#### macOS
```bash
brew install android-platform-tools
```

#### Linux
```bash
sudo apt install adb
```

---

## 🎯 Common Workflows

### Starting Development

**Option 1: Using Command**
```bash
# In Claude Code
/start
```

**Option 2: Using Script**
```bash
# Windows
start-dev.bat

# Linux/Mac
./start-dev.sh
```

---

### Android Development Workflow

```bash
# 1. Connect Android device via USB

# 2. Enable USB Debugging on device
# Settings → Developer Options → USB Debugging

# 3. Start servers
/start

# 4. Launch scrcpy
/scrcpy

# 5. Now you can:
#    - See device screen on PC
#    - Use device normally
#    - Test app while developing
#    - Keep device screen off (save battery)
```

---

### Full Development Session

```bash
# Morning: Start everything
/start          # Start backend + web admin
/scrcpy         # Mirror Android screen

# Work on code...
# - Edit files in VS Code/Android Studio
# - Test on web admin (localhost:5173)
# - Test on Android device (via scrcpy)

# Evening: Stop servers
# Windows: stop-dev.bat
# Linux/Mac: ./stop-dev.sh
```

---

## 🐛 Troubleshooting

### Servers won't start

**Backend fails**:
```bash
# Check PostgreSQL
# Windows
services.msc → PostgreSQL

# Linux/Mac
sudo systemctl status postgresql
```

**Port already in use**:
```bash
# Windows - Kill process on port 3001
netstat -ano | findstr :3001
taskkill /F /PID <PID>

# Linux/Mac - Kill process on port 3001
lsof -ti:3001 | xargs kill
```

---

### scrcpy issues

**scrcpy not found**:
```bash
# Check installation
scrcpy --version

# Reinstall if needed
# See installation section above
```

**No devices found**:
1. Check USB cable connection
2. Enable USB Debugging on Android
3. Accept authorization on device
4. Try `adb devices` to verify

**Black screen**:
```bash
# Try without --turn-screen-off
scrcpy --max-size 1024 --bit-rate 8M
```

**Lag/stuttering**:
```bash
# Reduce bitrate
scrcpy --max-size 800 --bit-rate 4M

# Or reduce resolution
scrcpy --max-size 720 --bit-rate 8M
```

---

## 📊 Server Status Check

### Quick Check
```bash
# Backend health
curl http://localhost:3001/api/health

# Web admin (should return HTML)
curl http://localhost:5173
```

### Full Status
```bash
# Windows
netstat -ano | findstr ":3001"
netstat -ano | findstr ":5173"

# Linux/Mac
lsof -i :3001
lsof -i :5173
```

---

## 🔍 Viewing Logs

### Windows
Logs are shown in the terminal windows that open.

### Linux/Mac
```bash
# Backend logs
tail -f logs/backend.log

# Web admin logs
tail -f logs/web-admin.log

# Both logs simultaneously
tail -f logs/*.log
```

---

## ⚡ Quick Reference

| Command | Description |
|---------|-------------|
| `/start` | Start all dev servers |
| `/scrcpy` | Launch Android mirroring |
| `start-dev.bat` | Windows: Start servers |
| `./start-dev.sh` | Unix: Start servers |
| `stop-dev.bat` | Windows: Stop servers |
| `./stop-dev.sh` | Unix: Stop servers |
| `launch-scrcpy.bat` | Windows: Launch scrcpy |
| `./launch-scrcpy.sh` | Unix: Launch scrcpy |

---

## 💡 Pro Tips

1. **Use scrcpy keyboard shortcuts**:
   - `Ctrl+C` / `Cmd+C` - Copy
   - `Ctrl+V` / `Cmd+V` - Paste
   - `Ctrl+S` / `Cmd+S` - Screenshot
   - `Ctrl+P` / `Cmd+P` - Power button
   - `Ctrl+↑/↓` - Volume

2. **Monitor logs in real-time**:
   ```bash
   # Linux/Mac
   tail -f logs/*.log
   ```

3. **Restart single server**:
   ```bash
   # Stop just backend
   # Windows
   netstat -ano | findstr :3001
   taskkill /F /PID <PID>

   # Then restart
   cd backend && npm run start:dev
   ```

4. **Use scrcpy wireless** (after initial USB connection):
   ```bash
   # Get device IP
   adb shell ip addr show wlan0

   # Connect via TCP
   adb tcpip 5555
   adb connect DEVICE_IP:5555

   # Now disconnect USB and use scrcpy
   scrcpy
   ```

---

## 📝 Notes

- Commands work from project root directory
- Scripts check if servers already running
- Logs stored in `logs/` folder (Unix)
- scrcpy requires USB debugging enabled
- Backend needs PostgreSQL running
- Web admin needs backend running

---

**Happy Development! 🚀**
