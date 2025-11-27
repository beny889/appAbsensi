# Web Admin Panel - Development Guide

Panduan lengkap untuk Web Admin Panel sistem absensi.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | React 18 |
| Language | TypeScript |
| Build Tool | Vite |
| UI Library | Material-UI (MUI) |
| HTTP Client | Axios |
| Router | React Router v6 |

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev    # Port 5173

# Build for production
npm run build
```

## Project Structure

```
web-admin/src/
├── api/
│   └── index.ts           # Axios client + API functions
├── components/
│   └── layout/
│       └── Layout.tsx     # Main layout with sidebar
├── pages/
│   ├── Dashboard/
│   │   └── Dashboard.tsx
│   ├── Employees/
│   │   └── Employees.tsx
│   ├── Attendance/
│   │   └── Attendance.tsx
│   ├── Departments/
│   │   └── Departments.tsx
│   ├── WorkSchedules/
│   │   └── WorkSchedules.tsx
│   ├── FaceRegistration/
│   │   └── PendingRegistrations.tsx
│   ├── Reports/
│   │   ├── DailyReports.tsx
│   │   ├── MonthlyReports.tsx
│   │   └── EmployeeDetailReport.tsx
│   ├── FaceMatchLogs/
│   │   └── FaceMatchLogs.tsx  # NEW: Face match logs
│   └── Settings/
│       └── Settings.tsx
├── types/
│   └── index.ts           # TypeScript interfaces
├── App.tsx
└── main.tsx
```

## Features

### Dashboard
- Total karyawan
- Masuk hari ini
- Pulang hari ini
- Tingkat kehadiran (%)
- Pending registrations count

### Face Registration Management
**Path**: `/face-registration`

- List registrasi pending dengan foto preview
- **Approve**: Pilih departemen (required) → Auto-create user
- **Reject**: Input alasan penolakan
- **Delete**: Hapus registrasi

**Approval Flow**:
1. Klik "Setujui" pada registrasi
2. Dialog muncul dengan:
   - Role dropdown (Employee/Admin)
   - Departemen dropdown (required)
3. Klik "Setujui & Buat Akun"
4. User otomatis dibuat dengan face data

### Employee Management
**Path**: `/employees`

- List semua karyawan
- Search by nama
- View face status (registered/not)
- Edit employee data
- Delete employee (hanya jika belum ada absensi)

### Department Management
**Path**: `/departments`

- CRUD departemen
- Active/inactive toggle
- View employee count per departemen
- View schedule status

### Work Schedules
**Path**: `/work-schedules`

- Satu jadwal per departemen
- Format waktu: HH:MM
- Check-in time & Check-out time
- Digunakan untuk late/early detection

### Attendance Records
**Path**: `/attendance`

- List semua record absensi
- Filter by tanggal
- Delete record (admin only)
- Status chips:
  - Tepat Waktu (hijau)
  - Terlambat X menit (merah)
  - Pulang Cepat X menit (orange)

### Reports

#### Daily Report
**Path**: `/reports/daily`

- Pilih tanggal
- Summary cards:
  - Total Karyawan
  - Masuk
  - Pulang
  - Tingkat Kehadiran
- Detail table grouped by user:
  - Nama, Departemen, Masuk (time), Pulang (time), Status

#### Monthly Report
**Path**: `/reports/monthly`

- Pilih bulan/tahun
- Preview mode: Lihat data sebelum download
- Grid attendance day-by-day per employee
- Per-employee summary (late, early, absent counts)
- Total hari kerja (exclude holidays)
- Export ke PDF

### Holiday Management
**Path**: `/holidays`

- List hari libur dengan filter tahun
- CRUD hari libur nasional/cuti bersama
- Fields: Tanggal, Nama, Deskripsi, isGlobal, Karyawan
- Otomatis terintegrasi dengan reports
- **Multi-Employee Holiday**:
  - Checkbox "Libur untuk semua karyawan" (isGlobal)
  - Multi-select karyawan jika tidak global
  - Label menampilkan "Semua Karyawan" atau nama karyawan

### Face Match Logs
**Path**: `/face-match-logs`

Log setiap percobaan face matching untuk debugging:
- **List View**: Waktu, Tipe (CHECK_IN/CHECK_OUT), Status (✓/✗), Match, Similarity
- **Filter**: By success/fail status
- **Detail Modal**: Klik row untuk lihat detail
  - Threshold yang digunakan
  - Total users dibandingkan
  - Ranking similarity ke semua user (sorted by similarity)
- **Use Cases**:
  - Debug kenapa user tidak dikenali
  - Lihat ranking similarity ke semua user
  - Bandingkan threshold yang berbeda

### Settings
**Path**: `/settings`

Halaman konfigurasi untuk pengaturan sistem:

#### Face Similarity
- **Display**: Percentage (0% - 90%)
- **Default**: 60% (backend distance 0.4)
- **Interface**: Slider dengan visual indicator
- **Penjelasan**:
  - Nilai tinggi = lebih ketat (wajah harus sangat mirip)
  - Nilai rendah = lebih longgar (toleransi lebih tinggi)
- **Konversi**: `Similarity = (1 - Distance) * 100`
- Perubahan langsung berlaku tanpa restart

**Conversion Table**:
| Similarity | Distance | Label |
|------------|----------|-------|
| 90% | 0.10 | Sangat Ketat |
| 70% | 0.30 | Ketat |
| 50% | 0.50 | Normal |
| 30% | 0.70 | Longgar |
| 0%  | 1.00 | Sangat Longgar |

#### Change Password
- Form ganti password admin
- **Validasi**:
  - Current password harus benar
  - New password minimal 6 karakter
- Konfirmasi dengan password saat ini

## Configuration

### .env
```bash
VITE_API_URL=http://localhost:3001/api
```

### API Client (src/api/index.ts)
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
});

// Auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## TypeScript Types

### User
```typescript
interface User {
  id: string;
  email?: string;      // NULL for employees
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  departmentId?: string;
  department?: Department;
  faceImageUrl?: string;
  isActive: boolean;
}
```

### FaceRegistration
```typescript
interface FaceRegistration {
  id: string;
  name: string;
  faceImageUrl?: string;   // Base64 data URL
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}
```

### Attendance
```typescript
interface Attendance {
  id: string;
  userId: string;
  user?: User;
  type: 'CHECK_IN' | 'CHECK_OUT';
  timestamp: string;
  isLate?: boolean;
  lateMinutes?: number;
  isEarlyCheckout?: boolean;
  earlyMinutes?: number;
  scheduledTime?: string;
}
```

### Department
```typescript
interface Department {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  _count?: {
    users: number;
    workSchedules: number;
  };
}
```

## UI Components

### Layout
- Material-UI AppBar
- Sidebar dengan navigation menu:
  - Dashboard
  - Karyawan
  - Absensi
  - Pendaftaran Wajah
  - Departemen
  - Jadwal Kerja
  - Hari Libur
  - Laporan (collapsible)
    - Harian
    - Bulanan
    - Detail Karyawan
  - Face Match Logs (debugging)
  - Pengaturan

**Collapsible Reports Menu**:
- Menu "Laporan" dengan icon Assessment
- Klik untuk expand/collapse sub-menu
- Auto-expand saat di halaman report
- Visual indicator saat active

### Tables
- MUI DataGrid atau Table
- Pagination
- Sorting
- Row actions (edit, delete)

### Dialogs
- Confirmation dialogs
- Form dialogs (approval, create, edit)
- Alert dialogs

### Chips
- Status indicators dengan warna:
  - Success (hijau): Tepat Waktu, Aktif
  - Error (merah): Terlambat, Rejected
  - Warning (orange): Pulang Cepat, Pending
  - Default (abu): Inactive

## API Endpoints Used

### Dashboard
- `GET /api/reports/dashboard`

### Face Registration
- `GET /api/face-registration/pending`
- `POST /api/face-registration/:id/approve`
- `POST /api/face-registration/:id/reject`
- `DELETE /api/face-registration/:id`

### Employees
- `GET /api/employees`
- `PUT /api/employees/:id`
- `DELETE /api/employees/:id`

### Departments
- `GET /api/departments`
- `POST /api/departments`
- `PUT /api/departments/:id`
- `DELETE /api/departments/:id`

### Work Schedules
- `GET /api/work-schedules`
- `POST /api/work-schedules`
- `PUT /api/work-schedules/:id`

### Attendance
- `GET /api/attendance/all`
- `GET /api/attendance/today-all`
- `DELETE /api/attendance/:id`
- `GET /api/attendance/face-match-attempts` - Face match logs

### Reports
- `GET /api/reports/daily?date=YYYY-MM-DD`
- `GET /api/reports/monthly?year=YYYY&month=MM`
- `GET /api/reports/monthly-grid?year=YYYY&month=MM`

### Holidays
- `GET /api/holidays` - List all (includes users relation)
- `GET /api/holidays?year=YYYY` - Filter by year
- `POST /api/holidays` - Body: `{ date, name, description?, isGlobal, userIds? }`
- `PUT /api/holidays/:id` - Body: `{ date?, name?, description?, isGlobal?, userIds? }`
- `DELETE /api/holidays/:id`

### Settings
- `GET /api/settings`
- `GET /api/settings/similarity-threshold`
- `PUT /api/settings/similarity-threshold`

### Auth
- `POST /api/auth/change-password`

## Development

```bash
# Development
npm run dev

# Build
npm run build

# Preview production
npm run preview

# Type check
npm run type-check
```

## Features Checklist

- [x] Authentication & Authorization
- [x] Dashboard with statistics
- [x] Employee management (CRUD)
- [x] Delete employee (with attendance validation)
- [x] Face registration approval workflow
- [x] Department required on approval
- [x] Department management (CRUD)
- [x] Work schedule management
- [x] Attendance tracking with late/early status
- [x] Delete attendance records
- [x] Daily reports with detail table
- [x] Monthly reports per employee
- [x] Monthly report preview + PDF export
- [x] Dynamic date columns (current month)
- [x] Holiday management (CRUD)
- [x] Holiday multi-employee support (isGlobal + userIds)
- [x] Terminology: Masuk/Pulang (not Check In/Out)
- [x] Collapsible reports menu
- [x] Settings page (face threshold)
- [x] Change admin password
- [x] Face Match Logs (debugging)
- [ ] Export to Excel
- [ ] Dark mode

---

**Last Updated**: November 27, 2025
