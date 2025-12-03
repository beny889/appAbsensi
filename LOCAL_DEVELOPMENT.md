# Local Development Setup

## Overview

Project ini dikonfigurasi untuk 3 environment:
- **Local** - untuk development di komputer lokal
- **Testing** - untuk staging/testing sebelum production (testing.bravenozora.com)
- **Production** - untuk server live (absen.bravenozora.com)

## Environment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ENVIRONMENTS                              │
├─────────────────┬─────────────────────┬─────────────────────────┤
│     LOCAL       │      TESTING        │      PRODUCTION         │
├─────────────────┼─────────────────────┼─────────────────────────┤
│ localhost:3001  │ testing.bravenozora │ absen.bravenozora.com   │
│ localhost:5173  │     .com            │                         │
├─────────────────┼─────────────────────┼─────────────────────────┤
│ absensi_local   │ paketquc_testing    │ paketquc_absensi        │
├─────────────────┼─────────────────────┼─────────────────────────┤
│ android-local/  │ android-testing/    │ android/                │
└─────────────────┴─────────────────────┴─────────────────────────┘
```

## Workflow

```
Local Dev → Testing → Production
    │           │          │
    ▼           ▼          ▼
  Test      Verify      Live
  Lokal     di Server   Users
```

## Structure

```
C:\All Bot\absensiApp\
├── android/              ← Production APK (absen.bravenozora.com)
├── android-local/        ← Local APK (localhost)
├── android-testing/      ← Testing APK (testing.bravenozora.com)
├── backend/
│   ├── .env              ← Active environment (auto-switched)
│   ├── .env.local        ← Local config
│   ├── .env.testing      ← Testing config
│   └── .env.production   ← Production config
├── web-admin/
│   ├── .env              ← Active environment (auto-switched)
│   ├── .env.local        ← Local config
│   ├── .env.testing      ← Testing config
│   └── .env.production   ← Production config
└── scripts/
    ├── start-local.bat       ← Start local servers
    ├── build-local-apk.bat   ← Build APK for local
    ├── deploy-testing.bat    ← Build & deploy to testing
    ├── build-testing-apk.bat ← Build APK for testing
    ├── promote-to-production.bat ← Promote testing to production
    └── setup-local-db.sql
```

## Quick Start (Local Development)

### 1. Setup Database Lokal

Buka MySQL Workbench atau phpMyAdmin, jalankan:
```sql
CREATE DATABASE IF NOT EXISTS absensi_local;
```

Atau jalankan file: `scripts/setup-local-db.sql`

### 2. Push Schema ke Database Lokal

```bash
cd backend
npm run db:push:local
```

### 3. Start Local Servers

Double-click: `scripts/start-local.bat`

Atau manual:
```bash
# Terminal 1 - Backend
cd backend
npm run start:local

# Terminal 2 - Web Admin
cd web-admin
npm run dev:local
```

### 4. Build APK untuk Testing Lokal

Double-click: `scripts/build-local-apk.bat`

APK location: `android-local/app/build/outputs/apk/debug/app-debug.apk`

## Available Scripts

### Backend
| Script | Description |
|--------|-------------|
| `npm run start:local` | Start development server dengan .env.local |
| `npm run start:testing` | Start development server dengan .env.testing |
| `npm run start:dev` | Start development server dengan .env yang aktif |
| `npm run build:local` | Build untuk local |
| `npm run build:testing` | Build untuk testing |
| `npm run build:production` | Build untuk production |
| `npm run db:push:local` | Sync schema ke database lokal |
| `npm run db:push:testing` | Sync schema ke database testing |
| `npm run db:push:production` | Sync schema ke database production |

### Web Admin
| Script | Description |
|--------|-------------|
| `npm run dev:local` | Start dev server dengan .env.local |
| `npm run dev:testing` | Start dev server dengan .env.testing |
| `npm run dev:production` | Start dev server dengan .env.production |
| `npm run build:local` | Build untuk local |
| `npm run build:testing` | Build untuk testing |
| `npm run build:production` | Build untuk production |

## Android Local Testing

### Untuk Physical Device (Recommended)
Menggunakan **ADB Reverse** - tidak perlu edit IP address!

1. Hubungkan HP via USB
2. Jalankan `scripts/start-local.bat` (sudah include adb reverse)
3. Build dan install APK: `scripts/build-local-apk.bat`

**Manual ADB Reverse:**
```bash
adb reverse tcp:3001 tcp:3001
```

Ini membuat `localhost:3001` di Android app mengarah ke `localhost:3001` di komputer.

### Untuk Emulator
IP `10.0.2.2` di emulator Android = `localhost` di host machine.
Atau gunakan adb reverse seperti physical device.

## Deployment Workflow

### 1. Test di Local:
1. Jalankan `scripts/start-local.bat`
2. Test semua fitur di web admin (localhost:5173)
3. Build dan install APK dari `android-local/`
4. Test semua fitur di Android app

### 2. Deploy ke Testing:
1. Double-click `scripts/deploy-testing.bat`
2. Upload files ke server testing:
   - `backend/dist/` → `~/domains/testing.bravenozora.com/backend/dist/`
   - `backend/prisma/` → `~/domains/testing.bravenozora.com/backend/prisma/`
   - `web-admin/dist/` → `~/domains/testing.bravenozora.com/public_html/`
3. SSH ke server, jalankan:
   ```bash
   source ~/nodevenv/domains/testing.bravenozora.com/backend/20/bin/activate
   cd ~/domains/testing.bravenozora.com/backend
   npx prisma generate
   touch tmp/restart.txt
   ```
4. Test di https://testing.bravenozora.com
5. Build APK testing: `scripts/build-testing-apk.bat`

### 3. Promote ke Production:
1. Pastikan semua test pass di testing.bravenozora.com
2. Double-click `scripts/promote-to-production.bat`
3. Upload files ke server production:
   - `backend/dist/` → `~/domains/absen.bravenozora.com/backend/dist/`
   - `backend/prisma/` → `~/domains/absen.bravenozora.com/backend/prisma/`
   - `web-admin/dist/` → `~/domains/absen.bravenozora.com/public_html/`
4. SSH ke server, jalankan:
   ```bash
   source ~/nodevenv/domains/absen.bravenozora.com/backend/20/bin/activate
   cd ~/domains/absen.bravenozora.com/backend
   npx prisma generate
   touch tmp/restart.txt
   ```
5. Build production APK dari `android/` folder

> **Troubleshooting**: Jika beberapa endpoint return 500 setelah deploy, kemungkinan besar `prisma/schema.prisma` tidak ter-upload. Lihat `backend/README.md` section "Production Error 500 - Prisma Schema Mismatch".

## URL Reference

| Component | Local | Testing | Production |
|-----------|-------|---------|------------|
| Backend API | http://localhost:3001/api | https://testing.bravenozora.com/api | https://absen.bravenozora.com/api |
| Web Admin | http://localhost:5173 | https://testing.bravenozora.com | https://absen.bravenozora.com |
| Database | absensi_local | paketquc_testing | paketquc_absensi |
| APK Folder | android-local/ | android-testing/ | android/ |

## Database Sync: Production → Testing (Satu Arah)

Sync data dari production ke testing untuk testing dengan data real.

### ⚠️ PERINGATAN PENTING
```
PRODUCTION (paketquc_absensi) ──────► TESTING (paketquc_testing)
         ✅ BOLEH                         ❌ JANGAN PERNAH BALIK!
```
**JANGAN PERNAH** sync dari testing ke production - ini akan menghapus data live!

### Cara Sync via phpMyAdmin

1. **Export dari Production:**
   - Login phpMyAdmin → pilih `paketquc_absensi`
   - Tab **Export** → Format: SQL
   - Opsi: ✅ Add DROP TABLE, ✅ Complete inserts
   - Klik **Go** → download file `.sql`

2. **Import ke Testing:**
   - Pilih database `paketquc_testing`
   - Tab **Import** → pilih file `.sql`
   - Klik **Go**

3. **Restart Backend Testing:**
   ```bash
   touch ~/domains/testing.bravenozora.com/backend/tmp/restart.txt
   ```

## SSL Certificate untuk Testing

Android app memerlukan SSL certificate untuk connect ke testing server.

**Setup SSL di cPanel:**
1. Login ke cPanel
2. Cari **SSL/TLS Status** atau **Let's Encrypt**
3. Pilih subdomain `testing.bravenozora.com`
4. Klik **Run AutoSSL** atau **Issue Certificate**
5. Tunggu beberapa menit

**Error jika SSL belum aktif:**
```
Network error: Hostname testing.bravenozora.com not verified:
certificate: sha256/...
subjectAltNames: [absen.bravenozora.com, ...]
```

## Build Production APK (Detail)

### Prerequisites
- Android Studio terinstall (untuk JBR/Java)
- Android SDK dengan build-tools 35.0.0

### Quick Build
Double-click: `scripts/build-production-apk.bat`

Output: `Absensi-Production.apk` di project root

### Manual Build Steps (Command Prompt)

1. **Set environment**:
   ```cmd
   set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
   set PATH=%JAVA_HOME%\bin;%PATH%
   ```

2. **Build release APK**:
   ```cmd
   cd C:\All Bot\absensiApp\android
   gradlew.bat assembleRelease
   ```

3. **Zipalign**:
   ```cmd
   C:\Users\benys\AppData\Local\Android\Sdk\build-tools\35.0.0\zipalign.exe -v -p 4 app\build\outputs\apk\release\app-release-unsigned.apk app\build\outputs\apk\release\app-release-aligned.apk
   ```

4. **Sign APK**:
   ```cmd
   java -jar C:\Users\benys\AppData\Local\Android\Sdk\build-tools\35.0.0\lib\apksigner.jar sign --ks C:\Users\benys\.android\debug.keystore --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out app\build\outputs\apk\release\app-release-signed.apk app\build\outputs\apk\release\app-release-aligned.apk
   ```

### Output Locations
| Build Type | Location |
|------------|----------|
| Unsigned | `android/app/build/outputs/apk/release/app-release-unsigned.apk` |
| Signed | `android/app/build/outputs/apk/release/app-release-signed.apk` |
| Final | `Absensi-Production.apk` (project root) |

### Troubleshooting

**Error: JAVA_HOME is not set**
- Pastikan Android Studio terinstall
- Set JAVA_HOME: `set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr`

**Error: gradlew.bat not recognized**
- Jalankan dari Command Prompt (cmd.exe), bukan Git Bash
- Atau gunakan: `cmd.exe /c "gradlew.bat assembleRelease"`

**Error: apksigner.bat not recognized**
- Gunakan java langsung: `java -jar ...\lib\apksigner.jar sign ...`
