# Deployment Guide - Sistem Absensi

Panduan lengkap untuk deployment sistem absensi ke production.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Backend Deployment](#backend-deployment)
- [Web Admin Deployment](#web-admin-deployment)
- [Android App Distribution](#android-app-distribution)
- [Database Setup](#database-setup)
- [Security Checklist](#security-checklist)

---

## Prerequisites

### Server Requirements

**Backend Server (VPS/Cloud)**:
- Ubuntu 20.04+ atau CentOS 7+
- **Python 3.11+** ⚡ (NEW! for ML Service)
- Node.js 18+
- PostgreSQL 14+
- Nginx
- PM2 (process manager)
- Minimum 2GB RAM, 20GB Storage (recommend 4GB for ML service)

**Domain & SSL**:
- Domain name (contoh: api.absensi.com, admin.absensi.com)
- SSL certificate (Let's Encrypt recommended)

---

## Python ML Service Deployment ⚡ (DEPLOY FIRST!)

**IMPORTANT**: The Python ML Service must be deployed BEFORE the backend, as the backend depends on it for face recognition.

### 1. Install Python and Dependencies

```bash
# SSH ke server
ssh root@YOUR_SERVER_IP

# Install Python 3.11+
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3-pip

# Verify installation
python3.11 --version
```

### 2. Deploy ML Service Code

```bash
# Create app directory
sudo mkdir -p /var/www/face-recognition-service
cd /var/www/face-recognition-service

# Clone atau upload kode
# Option 1: Git (dari subfolder)
git clone YOUR_REPO_URL temp
mv temp/face-recognition-service/* .
rm -rf temp

# Option 2: Manual upload via SCP
# scp -r face-recognition-service/* user@server:/var/www/face-recognition-service/

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
# This installs: Flask, face-recognition, dlib-bin, Pillow, NumPy
```

### 3. Configure Environment

```bash
# Create .env file
nano .env
```

Add configuration:
```bash
PORT=5000
DEBUG=False
```

### 4. Test ML Service

```bash
# Test run
python app.py

# Should see:
# ================================================
#    Face Recognition Service
#    Running on http://localhost:5000
# ================================================

# In another terminal, test health endpoint
curl http://localhost:5000/health

# Should return:
# {"status":"ok","service":"Face Recognition Service","version":"1.0.0"}

# Stop test run (Ctrl+C)
```

### 5. Setup systemd Service

```bash
# Create systemd service file
sudo nano /etc/systemd/system/face-recognition.service
```

Add configuration:
```ini
[Unit]
Description=Face Recognition ML Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/face-recognition-service
Environment="PATH=/var/www/face-recognition-service/venv/bin"
ExecStart=/var/www/face-recognition-service/venv/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Set proper permissions
sudo chown -R www-data:www-data /var/www/face-recognition-service

# Reload systemd
sudo systemctl daemon-reload

# Start service
sudo systemctl start face-recognition

# Enable on boot
sudo systemctl enable face-recognition

# Check status
sudo systemctl status face-recognition
```

### 6. Configure Nginx (Optional - Internal Use Only)

**Note**: The ML service is typically used internally by the backend only, so you may NOT need to expose it publicly. If you want to expose it:

```bash
sudo nano /etc/nginx/sites-available/face-recognition
```

```nginx
server {
    listen 80;
    server_name ml.absensi.com;  # Optional, only if exposing publicly

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # Increase timeout for ML processing
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}
```

```bash
# Enable site (if needed)
sudo ln -s /etc/nginx/sites-available/face-recognition /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Verify ML Service

```bash
# Check service status
sudo systemctl status face-recognition

# View logs
sudo journalctl -u face-recognition -f

# Test health endpoint
curl http://localhost:5000/health

# Test embedding extraction (with sample base64 image)
curl -X POST http://localhost:5000/extract-embedding \
  -H "Content-Type: application/json" \
  -d '{"image": "YOUR_BASE64_IMAGE_HERE"}'
```

---

## Backend Deployment

### 1. Setup Server

```bash
# SSH ke server
ssh root@YOUR_SERVER_IP

# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
```

### 2. Setup PostgreSQL Database

```bash
# Login sebagai postgres user
sudo -u postgres psql

# Create database dan user
CREATE DATABASE absensi_db;
CREATE USER absensi_user WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE absensi_db TO absensi_user;

# Exit psql
\q
```

### 3. Deploy Backend Code

```bash
# Create app directory
sudo mkdir -p /var/www/absensi-backend
cd /var/www/absensi-backend

# Clone atau upload kode
# Option 1: Git
git clone YOUR_REPO_URL .

# Option 2: Manual upload
# Upload via SCP/SFTP

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
nano .env
```

Edit `.env`:
```bash
DATABASE_URL="postgresql://absensi_user:YOUR_STRONG_PASSWORD@localhost:5432/absensi_db?schema=public"
PORT=3001
NODE_ENV=production
JWT_SECRET=GENERATE_RANDOM_SECURE_KEY_HERE
JWT_EXPIRATION=7d
ALLOWED_ORIGINS=https://admin.absensi.com

# Python ML Service ⚡ (NEW!)
FACE_RECOGNITION_SERVICE_URL=http://localhost:5000
```

### 4. Run Database Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed initial data
npm run prisma:seed
```

### 5. Build & Start with PM2

```bash
# Build aplikasi
npm run build

# Start dengan PM2
pm2 start dist/main.js --name absensi-api

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Jalankan command yang muncul

# Check status
pm2 status
pm2 logs absensi-api
```

### 6. Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/absensi-api
```

Add configuration:
```nginx
server {
    listen 80;
    server_name api.absensi.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/absensi-api /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 7. Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.absensi.com

# Auto renewal
sudo certbot renew --dry-run
```

### 8. Backend Health Check

```bash
# Test API
curl https://api.absensi.com/api/health

# Should return:
# {"status":"ok","timestamp":"...","service":"Absensi API"}
```

---

## Web Admin Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd web-admin
vercel deploy --prod

# Set environment variables via Vercel dashboard
# VITE_API_URL=https://api.absensi.com/api
```

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist

# Set environment variables via Netlify dashboard
```

### Option 3: Self-Hosted (Nginx)

```bash
# Build locally atau di server
cd web-admin
npm install
npm run build

# Upload dist/ ke server
# Via SCP
scp -r dist/* user@server:/var/www/absensi-admin/

# Nginx config
sudo nano /etc/nginx/sites-available/absensi-admin
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name admin.absensi.com;
    root /var/www/absensi-admin;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass https://api.absensi.com;
    }
}
```

```bash
# Enable & restart
sudo ln -s /etc/nginx/sites-available/absensi-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# SSL
sudo certbot --nginx -d admin.absensi.com
```

---

## Android App Distribution

### 1. Generate Signed APK

**Di Android Studio**:
1. Build → Generate Signed Bundle/APK
2. Pilih APK
3. Create new keystore atau use existing
4. Fill keystore details
5. Build Release APK

### 2. Distribution Options

#### Option A: Google Play Store (Recommended)
```bash
# 1. Create Google Play Console account
# 2. Create app listing
# 3. Upload APK/AAB
# 4. Fill store listing
# 5. Submit for review
```

#### Option B: Internal Distribution Server
```bash
# Upload APK ke server
scp app-release.apk user@server:/var/www/downloads/

# Nginx config untuk download
server {
    listen 80;
    server_name download.absensi.com;
    root /var/www/downloads;

    location /app-release.apk {
        add_header Content-Type application/vnd.android.package-archive;
    }
}
```

#### Option C: Firebase App Distribution
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Upload
firebase appdistribution:distribute app-release.apk \
  --app YOUR_APP_ID \
  --groups "testers"
```

### 3. Update Configuration

Before building, update `Constants.kt`:
```kotlin
const val BASE_URL = "https://api.absensi.com/api/"
```

---

## Database Setup

### Backup Strategy

```bash
# Create backup script
sudo nano /usr/local/bin/backup-absensi-db.sh
```

Script content:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/absensi"
mkdir -p $BACKUP_DIR

pg_dump -U absensi_user absensi_db > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-absensi-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-absensi-db.sh
```

### Restore from Backup

```bash
# Unzip backup
gunzip /var/backups/absensi/backup_20250101_020000.sql.gz

# Restore
psql -U absensi_user absensi_db < /var/backups/absensi/backup_20250101_020000.sql
```

---

## Security Checklist

### Backend
- [ ] Change default JWT_SECRET
- [ ] Use strong database password
- [ ] Enable firewall (UFW)
- [ ] Configure fail2ban
- [ ] Setup SSL/TLS
- [ ] Enable rate limiting
- [ ] Regular security updates
- [ ] Monitor logs
- [ ] Disable root SSH login
- [ ] Use SSH keys instead of passwords

### Database
- [ ] Strong passwords
- [ ] Disable remote access (if not needed)
- [ ] Regular backups
- [ ] Encrypt sensitive data
- [ ] Monitor queries

### Frontend
- [ ] Use HTTPS only
- [ ] Content Security Policy
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Environment variables not exposed

### Android
- [ ] ProGuard/R8 enabled
- [ ] Code obfuscation
- [ ] SSL pinning
- [ ] Secure storage for tokens
- [ ] Validate server certificates

---

## Monitoring & Maintenance

### Backend Monitoring

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs absensi-api

# Check server resources
htop
df -h

# Database monitoring
psql -U absensi_user absensi_db
SELECT * FROM pg_stat_activity;
```

### Setup Monitoring (Optional)

```bash
# Install Prometheus & Grafana
# Or use cloud services like:
# - New Relic
# - DataDog
# - Sentry (for error tracking)
```

### Update Strategy

```bash
# Backend update
cd /var/www/absensi-backend
git pull
npm install
npm run build
pm2 restart absensi-api

# Database migration (if needed)
npm run prisma:migrate
```

---

## Troubleshooting

### Python ML Service Issues ⚡ (NEW!)

```bash
# Service not running
sudo systemctl status face-recognition

# View detailed logs
sudo journalctl -u face-recognition -n 50 --no-pager

# Common issues:
# 1. Port 5000 already in use
sudo netstat -tlnp | grep 5000

# 2. dlib installation failed
# Solution: Use dlib-bin instead
source /var/www/face-recognition-service/venv/bin/activate
pip uninstall dlib
pip install dlib-bin

# 3. Permission issues
sudo chown -R www-data:www-data /var/www/face-recognition-service

# 4. Python version too old
python3.11 --version  # Must be 3.11+

# Restart service
sudo systemctl restart face-recognition
```

### Backend won't start
```bash
# Check logs
pm2 logs absensi-api

# Check database connection
psql -U absensi_user -d absensi_db -h localhost

# Check port
sudo netstat -tlnp | grep 3001
```

### Database connection failed
```bash
# Check PostgreSQL running
sudo systemctl status postgresql

# Check user permissions
sudo -u postgres psql
\du
```

### Nginx errors
```bash
# Check config
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log
```

### SSL certificate issues
```bash
# Renew manually
sudo certbot renew

# Check expiry
sudo certbot certificates
```

---

## Support & Resources

- **Documentation**: `/docs` folder
- **API Docs**: https://api.absensi.com/api/docs (if Swagger enabled)
- **Status Page**: Monitor uptime
- **Backup Location**: `/var/backups/absensi`
- **Logs**: `/var/log/nginx/`, `pm2 logs`

---

**Deployment Date**: ____________________
**Deployed By**: ____________________
**Server IP**: ____________________
**Domain**: ____________________

---

## Quick Reference Commands

```bash
# Python ML Service ⚡ (NEW!)
sudo systemctl status face-recognition
sudo systemctl restart face-recognition
sudo journalctl -u face-recognition -f
curl http://localhost:5000/health

# Backend
pm2 restart absensi-api
pm2 logs absensi-api
pm2 status

# Database
sudo -u postgres psql absensi_db
\dt  # list tables
\q   # exit

# Nginx
sudo systemctl restart nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log

# SSL
sudo certbot renew
sudo certbot certificates

# Backup
/usr/local/bin/backup-absensi-db.sh
```

---

**Good luck with deployment!**

---

**Last Updated**: November 25, 2025
