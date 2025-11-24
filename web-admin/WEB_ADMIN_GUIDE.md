# Web Admin Panel - Development Guide

Panduan lengkap untuk membangun Web Admin Panel menggunakan React + Vite + TypeScript.

## 🚀 Quick Start

```bash
# Initialize Vite project with React + TypeScript
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install

# Install additional libraries
npm install react-router-dom axios
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install @reduxjs/toolkit react-redux
npm install recharts
npm install date-fns
npm install react-hot-toast

# Dev dependencies
npm install -D @types/react-router-dom

# Start development server
npm run dev
```

## 📁 Project Structure

```
web-admin/
├── public/
├── src/
│   ├── api/                    # API Services
│   │   ├── client.ts          # Axios instance
│   │   ├── auth.ts            # Auth API
│   │   ├── employees.ts       # Employee API
│   │   ├── attendance.ts      # Attendance API
│   │   └── reports.ts         # Reports API
│   │
│   ├── components/            # Reusable Components
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   ├── common/
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   └── charts/
│   │       ├── AttendanceChart.tsx
│   │       └── StatsCard.tsx
│   │
│   ├── pages/                 # Pages/Routes
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Employees/
│   │   │   ├── EmployeeList.tsx
│   │   │   ├── EmployeeDetail.tsx
│   │   │   └── EmployeeForm.tsx
│   │   ├── Attendance/
│   │   │   ├── AttendanceList.tsx
│   │   │   └── AttendanceDetail.tsx
│   │   └── Reports/
│   │       ├── DailyReport.tsx
│   │       └── MonthlyReport.tsx
│   │
│   ├── store/                 # Redux Store
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── employeeSlice.ts
│   │   │   └── attendanceSlice.ts
│   │   └── store.ts
│   │
│   ├── types/                 # TypeScript Types
│   │   ├── auth.ts
│   │   ├── employee.ts
│   │   ├── attendance.ts
│   │   └── common.ts
│   │
│   ├── utils/                 # Utilities
│   │   ├── constants.ts
│   │   ├── formatters.ts
│   │   └── validators.ts
│   │
│   ├── hooks/                 # Custom Hooks
│   │   ├── useAuth.ts
│   │   └── useDebounce.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── .env
├── .env.example
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 🔧 Configuration Files

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

### .env

```bash
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Absensi Admin
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 🔑 Key Implementation Files

### 1. API Client (src/api/client.ts)

```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 2. Auth API (src/api/auth.ts)

```typescript
import { apiClient } from './client';
import { LoginRequest, LoginResponse, User } from '@/types/auth';

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },
};
```

### 3. Employees API (src/api/employees.ts)

```typescript
import { apiClient } from './client';
import { Employee, UpdateEmployeeDto } from '@/types/employee';

export const employeesApi = {
  getAll: async (): Promise<Employee[]> => {
    const response = await apiClient.get<Employee[]>('/employees');
    return response.data;
  },

  getById: async (id: string): Promise<Employee> => {
    const response = await apiClient.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateEmployeeDto): Promise<Employee> => {
    const response = await apiClient.put<Employee>(`/employees/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/employees/${id}`);
  },
};
```

### 4. Reports API (src/api/reports.ts)

```typescript
import { apiClient } from './client';
import { DailyReport, MonthlyReport, DashboardStats } from '@/types/reports';

export const reportsApi = {
  getDailyReport: async (date: string): Promise<DailyReport> => {
    const response = await apiClient.get<DailyReport>('/reports/daily', {
      params: { date },
    });
    return response.data;
  },

  getMonthlyReport: async (year: number, month: number): Promise<MonthlyReport> => {
    const response = await apiClient.get<MonthlyReport>('/reports/monthly', {
      params: { year, month },
    });
    return response.data;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/reports/dashboard');
    return response.data;
  },
};
```

### 5. Types (src/types/auth.ts)

```typescript
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  position?: string;
  department?: string;
}
```

### 6. Redux Store (src/store/slices/authSlice.ts)

```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '@/api/auth';
import { LoginRequest, User } from '@/types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest) => {
    const response = await authApi.login(credentials);
    localStorage.setItem('token', response.token);
    return response;
  }
);

export const fetchProfile = createAsyncThunk('auth/profile', async () => {
  return await authApi.getProfile();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      authApi.logout();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
```

### 7. Dashboard Page (src/pages/Dashboard.tsx)

```typescript
import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { People, CheckCircle, Cancel, TrendingUp } from '@mui/icons-material';
import { reportsApi } from '@/api/reports';
import { DashboardStats } from '@/types/reports';
import StatsCard from '@/components/charts/StatsCard';
import AttendanceChart from '@/components/charts/AttendanceChart';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await reportsApi.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Karyawan"
            value={stats?.totalEmployees || 0}
            icon={<People />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Hadir Hari Ini"
            value={stats?.todayPresent || 0}
            icon={<CheckCircle />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Tidak Hadir"
            value={stats?.todayAbsent || 0}
            icon={<Cancel />}
            color="#d32f2f"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Tingkat Kehadiran"
            value={`${stats?.attendanceRate.toFixed(1)}%`}
            icon={<TrendingUp />}
            color="#ed6c02"
          />
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Grafik Kehadiran Bulanan
            </Typography>
            <AttendanceChart />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
```

### 8. Employee List Page (src/pages/Employees/EmployeeList.tsx)

```typescript
import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { employeesApi } from '@/api/employees';
import { Employee } from '@/types/employee';

const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await employeesApi.getAll();
      setEmployees(data);
    } catch (error) {
      console.error('Failed to load employees', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus karyawan ini?')) {
      try {
        await employeesApi.delete(id);
        loadEmployees();
      } catch (error) {
        console.error('Failed to delete employee', error);
      }
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Manajemen Karyawan
      </Typography>

      <TextField
        fullWidth
        label="Cari karyawan..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nama</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Posisi</TableCell>
              <TableCell>Departemen</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.position || '-'}</TableCell>
                <TableCell>{employee.department || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={employee.isActive ? 'Aktif' : 'Nonaktif'}
                    color={employee.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small">
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(employee.id)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default EmployeeList;
```

### 9. App Router (src/App.tsx)

```typescript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/Employees/EmployeeList';
import AttendanceList from './pages/Attendance/AttendanceList';
import DailyReport from './pages/Reports/DailyReport';
import MonthlyReport from './pages/Reports/MonthlyReport';
import PrivateRoute from './components/PrivateRoute';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="employees" element={<EmployeeList />} />
              <Route path="attendance" element={<AttendanceList />} />
              <Route path="reports/daily" element={<DailyReport />} />
              <Route path="reports/monthly" element={<MonthlyReport />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </ThemeProvider>
    </Provider>
  );
};

export default App;
```

## 🎨 UI Components

### StatsCard Component

```typescript
import React from 'react';
import { Paper, Box, Typography } from '@mui/material';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="textSecondary">
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: color,
            color: 'white',
            p: 1.5,
            borderRadius: 2,
          }}
        >
          {icon}
        </Box>
      </Box>
    </Paper>
  );
};

export default StatsCard;
```

## 🚀 Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
vercel deploy

# Deploy to Netlify
netlify deploy --prod
```

## 📊 Features Checklist

- [x] Authentication & Authorization
- [x] Dashboard with statistics
- [x] Employee management (CRUD)
- [x] Face registration approval workflow (NEW!)
- [x] Attendance tracking
- [x] Daily/Monthly reports
- [ ] Export to Excel/PDF
- [ ] Real-time updates (Socket.io)
- [ ] Push notifications for new registrations
- [ ] Notification system
- [ ] User settings
- [ ] Dark mode

---

**Happy coding! 💻**
