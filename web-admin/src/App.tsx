import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { PageTitleProvider } from './contexts/PageTitleContext';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Employees from './pages/Employees/Employees';
import Attendance from './pages/Attendance/Attendance';
import DailyReports from './pages/Reports/DailyReports';
import MonthlyReports from './pages/Reports/MonthlyReports';
import EmployeeDetailReport from './pages/Reports/EmployeeDetailReport';
import PendingRegistrations from './pages/FaceRegistration/PendingRegistrations';
import WorkSchedules from './pages/WorkSchedules/WorkSchedules';
import Departments from './pages/Departments/Departments';
import Holidays from './pages/Holidays/Holidays';
import Settings from './pages/Settings/Settings';
import FaceMatchLogs from './pages/FaceMatchLogs';
import Layout from './components/layout/Layout';

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

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PageTitleProvider>
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
              <Route path="employees" element={<Employees />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="face-registration/pending" element={<PendingRegistrations />} />
              <Route path="departments" element={<Departments />} />
              <Route path="work-schedules" element={<WorkSchedules />} />
              <Route path="reports/daily" element={<DailyReports />} />
              <Route path="reports/monthly" element={<MonthlyReports />} />
              <Route path="reports/employee-detail" element={<EmployeeDetailReport />} />
              <Route path="holidays" element={<Holidays />} />
              <Route path="face-match-logs" element={<FaceMatchLogs />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PageTitleProvider>
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}

export default App;
