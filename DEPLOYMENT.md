# Panduan Deployment ke Qword Hosting

## Struktur Server

```
~/domains/bravenozora.com/
├── public_html/              <- Web Admin (React/Vite)
│   ├── index.html
│   ├── logo.png
│   ├── assets/
│   │   ├── index-xxxx.js
│   │   └── *.js
│   ├── api/                  <- (proxy config atau static)
│   └── cgi-bin/
│
└── backend/                  <- NestJS Backend
    ├── dist/
    │   ├── src/
    │   │   └── main.js
    │   └── prisma/
    ├── prisma/
    ├── node_modules/
    ├── package.json
    ├── .env
    ├── ecosystem.config.js
    └── uploads/
```

---

## Quick Update (Sync Perubahan)

Jika hanya perlu update kode tanpa setup ulang:

### 1. Build Lokal
```bash
# Build backend
cd backend && npm run build

# Build web-admin
cd web-admin && npm run build
```

### 2. Upload Files

**Web Admin** - Upload ke `~/domains/bravenozora.com/public_html/`:
```bash
# Hapus file lama di server
cd ~/domains/bravenozora.com/public_html
rm -f index.html logo.png
rm -rf assets/

# Upload dari lokal:
# - web-admin/dist/index.html
# - web-admin/dist/logo.png
# - web-admin/dist/assets/
```

**Backend** - Upload ke `~/domains/bravenozora.com/backend/`:
```bash
# Hapus dist lama di server
cd ~/domains/bravenozora.com/backend
rm -rf dist/

# Upload dari lokal:
# - backend/dist/ (seluruh folder)
```

### 3. Restart Backend
```bash
cd ~/domains/bravenozora.com/backend
pm2 restart absensi-backend
pm2 status
```

---

## Setup Awal (Fresh Deployment)

### Langkah 1: Buat Database MySQL di cPanel

1. Login ke cPanel Qword
2. Buka **MySQL Databases**
3. Buat database baru: `absensi` (akan menjadi `paketquc_absensi`)
4. Buat user baru dengan password kuat
5. Add user ke database dengan **ALL PRIVILEGES**
6. Catat credentials:
   - Database: `paketquc_absensi`
   - User: `paketquc_absensi`
   - Password: `[password yang dibuat]`
   - Host: `localhost`

---

### Langkah 2: Upload Web Admin

Upload isi folder `web-admin/dist/` ke `~/domains/bravenozora.com/public_html/`:

```
web-admin/dist/index.html  → public_html/index.html
web-admin/dist/logo.png    → public_html/logo.png
web-admin/dist/assets/*    → public_html/assets/
```

---

### Langkah 3: Upload Backend

Upload ke `~/domains/bravenozora.com/backend/`:

```
backend/dist/              → backend/dist/
backend/prisma/            → backend/prisma/
backend/package.json       → backend/package.json
backend/package-lock.json  → backend/package-lock.json
```

---

### Langkah 4: Konfigurasi Backend .env

Buat file `.env` di `~/domains/bravenozora.com/backend/`:

```env
# Database - MySQL (Qword)
DATABASE_URL="mysql://paketquc_absensi:PASSWORD_ANDA@localhost:3306/paketquc_absensi"

# Application
PORT=3001
NODE_ENV=production

# JWT
JWT_SECRET=k9$mP2xQ7vL4nR8wA3cF6hJ1tY5uB0eI9sDgZpXoNqWrMaVbCyKjUiOlHfGzTnEm
JWT_EXPIRATION=24h

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# CORS
ALLOWED_ORIGINS=https://bravenozora.com,https://www.bravenozora.com
```

---

### Langkah 5: Install Dependencies & Setup Database

```bash
cd ~/domains/bravenozora.com/backend

# Install dependencies
npm install --production

# Generate Prisma Client
npx prisma generate

# Jalankan migrasi database
npx prisma migrate deploy

# Buat user admin
node dist/prisma/create-admin.js
```

**Kredensial Admin Default:**
- Email: `admin@admin.com`
- Password: `admin123`

---

### Langkah 6: Setup PM2

Buat `ecosystem.config.js` di `~/domains/bravenozora.com/backend/`:

```javascript
module.exports = {
  apps: [{
    name: 'absensi-backend',
    script: 'dist/src/main.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

Jalankan:
```bash
cd ~/domains/bravenozora.com/backend
pm2 start ecosystem.config.js
pm2 save
```

---

## Commands Berguna

```bash
# Masuk ke folder project
cd ~/domains/bravenozora.com/backend

# Restart backend
pm2 restart absensi-backend

# Lihat logs
pm2 logs absensi-backend

# Status PM2
pm2 status

# Stop backend
pm2 stop absensi-backend

# Jalankan migrasi baru
npx prisma migrate deploy
```

---

## Troubleshooting

### Backend tidak berjalan
```bash
pm2 logs absensi-backend --lines 100
```

### Database connection error
- Cek kredensial di `.env`
- Pastikan format: `mysql://user:pass@localhost:3306/dbname`

### API tidak respond
```bash
pm2 status
netstat -tlnp | grep 3001
```

### Permission error uploads
```bash
mkdir -p ~/domains/bravenozora.com/backend/uploads
chmod 755 ~/domains/bravenozora.com/backend/uploads
```

---

## File Summary

### Yang Perlu Di-Upload (Update)

| Source (Lokal) | Destination (Server) |
|----------------|---------------------|
| `web-admin/dist/index.html` | `~/domains/bravenozora.com/public_html/index.html` |
| `web-admin/dist/logo.png` | `~/domains/bravenozora.com/public_html/logo.png` |
| `web-admin/dist/assets/*` | `~/domains/bravenozora.com/public_html/assets/` |
| `backend/dist/*` | `~/domains/bravenozora.com/backend/dist/` |

### Yang JANGAN Dihapus di Server

| File/Folder | Lokasi |
|-------------|--------|
| `.env` | `~/domains/bravenozora.com/backend/.env` |
| `ecosystem.config.js` | `~/domains/bravenozora.com/backend/ecosystem.config.js` |
| `node_modules/` | `~/domains/bravenozora.com/backend/node_modules/` |
| `uploads/` | `~/domains/bravenozora.com/backend/uploads/` |
| `api/` | `~/domains/bravenozora.com/public_html/api/` |
| `cgi-bin/` | `~/domains/bravenozora.com/public_html/cgi-bin/` |

---

## Automatic Deployment (GitHub Actions)

Tersedia workflow CI/CD otomatis menggunakan GitHub Actions dengan FTP.

### Setup GitHub Secrets

Buka repository GitHub → **Settings** → **Secrets and variables** → **Actions**, tambahkan:

| Secret Name | Value |
|-------------|-------|
| `FTP_HOST` | `ftp.bravenozora.com` atau IP server |
| `FTP_USER` | Username FTP |
| `FTP_PASSWORD` | Password FTP |

### Cara Kerja

1. Push code ke branch `master` atau `main`
2. GitHub Actions otomatis:
   - Build backend dan web-admin
   - Upload via FTP ke server
3. **Manual**: Restart PM2 via Terminal hosting:
   ```bash
   cd ~/domains/bravenozora.com/backend
   pm2 restart absensi-backend
   ```

### Manual Trigger

Bisa juga trigger manual dari GitHub → **Actions** → **Deploy to Qword** → **Run workflow**

Lihat detail di: `.github/workflows/deploy.yml`

---

**Last Updated**: December 1, 2025
