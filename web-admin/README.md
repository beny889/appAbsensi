# Web Admin Panel - Sistem Absensi

Web-based admin panel untuk sistem absensi dengan React, TypeScript, dan Material-UI.

## 🌐 Environments

| Environment | Web Admin | Backend API |
|-------------|-----------|-------------|
| **Production** | https://absen.bravenozora.com | https://absen.bravenozora.com/api |
| **Testing** | https://testing.bravenozora.com | https://testing.bravenozora.com/api |
| **Local** | http://localhost:5173 | http://localhost:3001/api |

## ✅ Status: PRODUCTION READY

Project ini sudah di-deploy dan berjalan di production dengan fitur-fitur berikut:

### 📦 Fitur Yang Sudah Diimplementasi

- ✅ **Authentication**
  - Login page dengan validation
  - JWT token management
  - Auto logout on token expiry
  - Protected routes

- ✅ **Dashboard**
  - Statistik real-time (Total karyawan, Hadir hari ini, Tidak hadir, Tingkat kehadiran)
  - Card-based statistics
  - Responsive design

- ✅ **Employee Management**
  - Daftar karyawan
  - Search & filter
  - Status karyawan (Aktif/Nonaktif)
  - Face registration status

- ✅ **Face Registration Management** (NEW!)
  - View pending face registrations
  - Approve/Reject workflow
  - View submitted face images
  - Automatic user account creation on approval
  - Rejection with reason

- ✅ **Attendance Tracking**
  - Daftar absensi dengan filter tanggal
  - Detail check-in/check-out
  - Face similarity score
  - Location information

- ✅ **Reports**
  - Daily Report dengan statistik
  - Monthly Report per karyawan dengan preview
  - Attendance rate calculation
  - Working days calculation (exclude holidays)

- ✅ **Holiday Management**
  - CRUD hari libur nasional dan cuti bersama
  - Filter berdasarkan tahun
  - Integrated dengan reports (exclude dari working days)
  - **Multi-Employee Holiday**: Support libur untuk semua atau karyawan tertentu
    - Checkbox "Libur untuk semua karyawan"
    - Multi-select karyawan jika tidak global

- ✅ **Settings**
  - Face similarity threshold configuration (ditampilkan sebagai %)
  - Change admin password
  - Dynamic settings dari database
  - Threshold sync ke Android app secara otomatis

- ✅ **Collapsible Reports Menu**
  - Menu "Laporan" dengan sub-menu collapse
  - Sub-menu: Harian, Bulanan, Detail Karyawan
  - Auto-expand saat di halaman report

- ✅ **Face Match Logs**
  - Log setiap percobaan face matching (sukses/gagal)
  - Detail: threshold, similarity, matched user
  - Klik row untuk lihat ranking semua perbandingan
  - Useful untuk debugging face recognition

- ✅ **Multi-Branch Support** (v2.7.0)
  - Branch management (CRUD)
  - Branch filter untuk semua data (employees, attendance, departments)
  - Role-based access: SUPER_ADMIN lihat semua, BRANCH_ADMIN lihat cabang tertentu

- ✅ **Admin Management** (v2.7.0)
  - Admin users CRUD (SUPER_ADMIN only)
  - Menu access control - atur menu mana yang bisa diakses
  - Branch access control - atur cabang mana yang bisa diakses
  - Dynamic sidebar - menu tersembunyi jika tidak punya akses

- ✅ **SUPER_ADMIN Enhancements** (v2.7.1)
  - Kolom "Cabang" di 7 halaman data (Employees, Attendance, Face Registration, Departments, Work Schedules, Holidays, Face Match Logs)
  - Filter cabang di 3 halaman report (Daily, Monthly, Employee Detail)
  - Daftar karyawan difilter berdasarkan cabang yang dipilih di Employee Detail Report

## 🚀 Quick Start

### Prerequisites
```bash
- Node.js 18+
- npm atau yarn
```

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Server will run on http://localhost:5173
```

### Configuration

Edit `.env` file:

**Development:**
```bash
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Absensi Admin Panel
```

**Testing (.env.testing):**
```bash
VITE_API_URL=https://testing.bravenozora.com/api
VITE_APP_NAME=Absensi Admin [TESTING]
```

**Production (.env.production):**
```bash
VITE_API_URL=https://absen.bravenozora.com/api
VITE_APP_NAME=Absensi Admin Panel
```

## 📁 Project Structure

```
src/
├── api/                    # API Services
│   ├── client.ts          # ✅ Axios client with interceptors
│   ├── auth.ts            # ✅ Auth API
│   └── index.ts           # ✅ All API exports
│
├── types/                 # TypeScript Types
│   └── index.ts           # ✅ All type definitions
│
├── components/            # React Components
│   └── layout/
│       └── Layout.tsx     # ✅ Main layout with sidebar
│
├── pages/                 # Pages
│   ├── Auth/
│   │   └── Login.tsx      # ✅ Login page
│   ├── Dashboard/
│   │   └── Dashboard.tsx  # ✅ Dashboard with stats
│   ├── Employees/
│   │   └── Employees.tsx  # ✅ Employee list
│   ├── Attendance/
│   │   └── Attendance.tsx # ✅ Attendance records
│   ├── FaceMatchLogs/
│   │   └── FaceMatchLogs.tsx # ✅ Face match logs (debugging)
│   └── Reports/
│       ├── DailyReports.tsx   # ✅ Daily report
│       └── MonthlyReports.tsx # ✅ Monthly report
│
├── App.tsx                # ✅ Main app with routes
├── main.tsx              # ✅ Entry point
└── vite-env.d.ts         # ✅ TypeScript declarations
```

## 🎨 UI Components

### Material-UI Components Used
- **Layout**: AppBar, Drawer, Toolbar
- **Data Display**: Table, Card, Chip
- **Form**: TextField, Button
- **Feedback**: CircularProgress, Toast notifications
- **Navigation**: React Router DOM

### Color Scheme
- Primary: `#1976d2` (Blue)
- Secondary: `#dc004e` (Pink)
- Success: `#2e7d32` (Green)
- Error: `#d32f2f` (Red)
- Warning: `#ed6c02` (Orange)

## 🔐 Authentication Flow

1. User enters email & password
2. Call `/api/auth/login`
3. Receive JWT token
4. Store token in localStorage
5. Include token in all subsequent requests
6. Auto logout on 401 response

## 📊 Pages Overview

### 1. Login (`/login`)
- Email & password form
- Admin-only access validation
- Error handling
- Auto redirect to dashboard on success
- **New UI (v2.3.0)**:
  - Blue gradient background
  - Logo di tengah
  - Modern card design

### 2. Dashboard (`/`)
- 4 stat cards (Total Employees, Today Present, Today Absent, Attendance Rate)
- Monthly attendance summary
- Real-time data from API

### 3. Employees (`/employees`)
- Table of all employees
- Search functionality
- Face registration status
- Active/Inactive status
- Registration date

### 4. Face Registration (`/face-registration/pending`) (NEW!)
- View all pending face registrations
- Display submitted face images
- Employee name and submission date
- Approve button with user account creation form
- Reject button with reason input
- Statistics overview

### 5. Attendance (`/attendance`)
- All attendance records
- Date range filter
- Check-in/Check-out display
- Face similarity percentage
- Location information

### 6. Daily Reports (`/reports/daily`)
- Select specific date
- Total check-ins/check-outs
- Attendance rate
- Summary statistics

### 7. Monthly Reports (`/reports/monthly`)
- Select year & month
- Preview data before PDF download
- Per-employee attendance grid (day by day)
- Working days calculation (excludes holidays)
- Late/early/absent summary per employee
- Color-coded status (Green=hadir, Red=absent, Orange=terlambat)
- Export to PDF

### 8. Holiday Management (`/holidays`)
- List all holidays with year filter
- Add new holiday (date + name + description)
- Edit existing holidays
- Delete holidays
- Holidays auto-excluded from working days in reports

### 10. Face Match Logs (`/face-match-logs`)
- List semua percobaan face matching
- Filter by success/fail status
- Columns: Waktu, Tipe, Status, Match, Similarity
- Klik row untuk detail:
  - Threshold yang digunakan
  - Total users dibandingkan
  - Ranking similarity ke semua user
- Useful untuk debugging face recognition issues

### 11. Settings (`/settings`)
- **Face Similarity Threshold**:
  - Ditampilkan sebagai persentase (0% - 90%)
  - Formula: `Similarity = (1 - Distance) * 100`
  - Contoh: Distance 0.35 = Similarity 65%
  - Slider dengan label: "Sangat Ketat", "Ketat", "Normal", "Longgar"
  - Perubahan langsung sync ke Android saat app call `/api/attendance/sync-embeddings`
- **Change Admin Password**:
  - Validasi password lama
  - Minimum 8 karakter (v2.3.0)
  - Harus mengandung huruf besar, huruf kecil, dan angka
- Real-time settings update (no restart needed)

## 🔧 Development

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Adding New Features

1. **Add new API endpoint** in `src/api/`
2. **Add TypeScript types** in `src/types/`
3. **Create page component** in `src/pages/`
4. **Add route** in `src/App.tsx`
5. **Add menu item** in `src/components/layout/Layout.tsx`

### Example: Adding a new page

```typescript
// 1. Create page component
// src/pages/Settings/Settings.tsx
export default function Settings() {
  return <div>Settings Page</div>;
}

// 2. Add route in App.tsx
import Settings from './pages/Settings/Settings';

<Route path="settings" element={<Settings />} />

// 3. Add menu item in Layout.tsx
const menuItems = [
  // ... existing items
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized production files.

### Deploy to Qword Hosting (Current Production)

1. **Build locally:**
   ```bash
   npm run build
   ```

2. **Upload `dist/` contents:**
   - Production: `~/domains/absen.bravenozora.com/public_html/`
   - Testing: `~/domains/testing.bravenozora.com/public_html/`

3. **Structure di server:**
   ```
   public_html/
   ├── index.html
   ├── assets/
   │   ├── index-xxx.js
   │   └── index-xxx.css
   └── favicon.ico
   ```

4. **Configure .htaccess** untuk SPA routing:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

### Deploy to Vercel (Alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel deploy

# Production deployment
vercel --prod
```

### Deploy to Netlify (Alternative)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy

# Production deployment
netlify deploy --prod
```

### Environment Variables

For production, set these environment variables:

```bash
VITE_API_URL=https://absen.bravenozora.com/api
VITE_APP_NAME=Absensi Admin Panel
```

## 🔒 Security Best Practices

- ✅ JWT tokens stored in localStorage
- ✅ Automatic token refresh on API errors
- ✅ Protected routes with authentication check
- ✅ HTTPS only in production
- ✅ Input validation
- ✅ Error handling with toast notifications

## 🐛 Troubleshooting

### Cannot connect to API
```bash
# Check .env file
VITE_API_URL=http://localhost:3001/api

# Make sure backend is running
cd ../backend
npm run start:dev
```

### Build errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Clear cache
npm cache clean --force
```

### CORS errors
Backend should allow your frontend origin in CORS configuration.

Check `backend/src/main.ts`:
```typescript
app.enableCors({
  origin: ['http://localhost:5173'],
  credentials: true,
});
```

## 📚 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Material-UI v5** - UI components
- **React Router v6** - Routing
- **Axios** - HTTP client
- **date-fns** - Date formatting
- **react-hot-toast** - Notifications

## 📖 API Integration

All API calls use the centralized `apiClient` from `src/api/client.ts` which handles:
- Base URL configuration
- JWT token injection
- Error handling
- Automatic logout on 401

Example API call:
```typescript
import { employeesApi } from '@/api';

const employees = await employeesApi.getAll();
```

## 🎯 Features Roadmap

### ✅ Implemented
- [x] Authentication & Authorization
- [x] Dashboard with statistics
- [x] Employee management
- [x] Face registration approval workflow
- [x] Attendance tracking
- [x] Daily & Monthly reports
- [x] Monthly report preview with PDF export
- [x] Holiday management
- [x] Settings (face threshold + change password)
- [x] Collapsible reports menu
- [x] Face Match Logs (debugging)

### 🔜 Future Enhancements
- [ ] Export to Excel
- [ ] Charts & graphs (Recharts)
- [ ] Real-time updates (WebSocket)
- [ ] Push notifications for new registrations
- [ ] User settings
- [ ] Dark mode
- [ ] Location management
- [ ] Advanced filters
- [ ] Bulk approval/rejection

## 💡 Tips

1. **Development**: Use React DevTools extension
2. **API Testing**: Keep backend running on port 3001
3. **Debugging**: Check browser console for errors
4. **Performance**: Use React.memo for expensive components
5. **State Management**: Consider Redux if app grows larger

## 📝 License

Private - Internal Use Only

---

## ✅ Production Ready

- **Debug Code Removed**: Semua `console.log` dan `console.error` statements dihapus
- **Security Hardened**: Dev bypass login sudah dihapus
- **Clean UI**: Visual debug elements sudah dihapus
- **Proper Error Handling**: Error messages user-friendly
- **Deployed**:
  - Production: https://absen.bravenozora.com
  - Testing: https://testing.bravenozora.com

---

**Need Help?** Check the main README.md or contact the development team.

---

**Last Updated**: December 4, 2025
**Version**: 2.7.1 (SUPER_ADMIN Branch Column & Filter)
