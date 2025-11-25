---
description: Start development servers (Backend, Web Admin, Face Recognition) - individually or all together
---

Start development servers untuk proyek absensi dengan kontrol fleksibel per-service.

## Available Services:
1. **Backend** - NestJS API (Port 3001)
2. **Web Admin** - React + Vite (Port 5173)
3. **Face Recognition** - Python Flask (Port 5000)

## IMPORTANT:
- All services akan dibuka di SEPARATE CMD/PowerShell windows (NOT in VS Code terminal)
- User dapat memilih service mana yang ingin dijalankan
- User dapat menjalankan semua service sekaligus atau per-service

## Instructions:

1. **Ask user which service(s) to start:**
   - Present options using AskUserQuestion tool with multiSelect: true
   - Options:
     - "All Services" (Backend + Web Admin + Face Recognition)
     - "Backend Only"
     - "Web Admin Only"
     - "Face Recognition Only"
     - "Backend + Web Admin"
     - "Backend + Face Recognition"

2. **Launch selected services in separate CMD windows:**

   For each selected service, use PowerShell to launch the corresponding .bat file:

   **Backend:**
   ```
   powershell -Command "Start-Process cmd.exe -ArgumentList '/c', 'cd \"C:\All Bot\absensiApp\" && scripts\start-backend.bat'"
   ```

   **Web Admin:**
   ```
   powershell -Command "Start-Process cmd.exe -ArgumentList '/c', 'cd \"C:\All Bot\absensiApp\" && scripts\start-web-admin.bat'"
   ```

   **Face Recognition:**
   ```
   powershell -Command "Start-Process cmd.exe -ArgumentList '/c', 'cd \"C:\All Bot\absensiApp\" && scripts\start-face-recognition.bat'"
   ```

   **All Services:**
   ```
   powershell -Command "Start-Process cmd.exe -ArgumentList '/c', 'cd \"C:\All Bot\absensiApp\" && scripts\start-all.bat'"
   ```

3. **Setup ADB reverse (if Backend is started):**
   - Wait 5 seconds for backend to initialize
   - Setup ADB reverse for Android device:
     ```
     /c/scrcpy/scrcpy-win64-v3.1/adb.exe reverse tcp:3001 tcp:3001
     ```

4. **Inform user about the services:**
   - Show which services are starting in separate CMD windows
   - Show the URLs:
     - Backend API: http://localhost:3001/api (if started)
     - Web Admin: http://localhost:5173 (if started)
     - Face Recognition: http://localhost:5000 (if started)
     - API Health Check: http://localhost:3001/api/health (if Backend started)
     - Face Rec Health: http://localhost:5000/health (if Face Rec started)
   - Inform about ADB reverse (if Backend started):
     - ADB reverse tcp:3001 has been set up for Android device
     - Android app can now access backend via localhost:3001
   - Remind user:
     - VS Code terminal remains free for other commands (git, npm, claude, etc)
     - Servers run independently from VS Code in separate CMD windows
     - To stop: Use stop scripts (stop-backend.bat, stop-web-admin.bat, stop-face-recognition.bat, or stop-all.bat)
     - To check status: scripts\status-check.bat
     - If device disconnected/restarted: run /start again to re-setup ADB reverse
   - Note: Services may take 10-30 seconds to fully start

## Available Scripts:
Located in `scripts/` folder:
- `start-backend.bat` - Start Backend only
- `start-web-admin.bat` - Start Web Admin only
- `start-face-recognition.bat` - Start Face Recognition only
- `start-all.bat` - Start all services
- `stop-backend.bat` - Stop Backend
- `stop-web-admin.bat` - Stop Web Admin
- `stop-face-recognition.bat` - Stop Face Recognition
- `stop-all.bat` - Stop all services
- `status-check.bat` - Check status of all services

User can also run these scripts manually by double-clicking or via command line.
