import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  Store as StoreIcon,
  HomeWork as HomeWorkIcon,
} from '@mui/icons-material';
import { reportsApi, DashboardPresence, EmployeeInStore, EmployeeNotInStore } from '@/api';
import { DashboardStats } from '@/types';
import { usePageTitle } from '@/contexts/PageTitleContext';
import toast from 'react-hot-toast';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

function StatsCard({ title, value, icon, color }: StatsCardProps) {
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" height="100%">
        <Box>
          <Typography variant="body2" color="textSecondary" gutterBottom>
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
            p: 2,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </Paper>
  );
}

// Helper to format time from ISO string
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// Helper to get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [presence, setPresence] = useState<DashboardPresence | null>(null);
  const [loading, setLoading] = useState(true);

  usePageTitle('Dashboard', 'Selamat datang di Sistem Absensi');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, presenceData] = await Promise.all([
        reportsApi.getDashboardStats(),
        reportsApi.getDashboardPresence(),
      ]);
      setStats(statsData);
      setPresence(presenceData);
    } catch (error) {
      toast.error('Gagal memuat statistik');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Karyawan"
            value={stats?.totalEmployees || 0}
            icon={<PeopleIcon sx={{ fontSize: 40 }} />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Hadir Hari Ini"
            value={stats?.todayPresent || 0}
            icon={<CheckCircleIcon sx={{ fontSize: 40 }} />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Tidak Hadir"
            value={stats?.todayAbsent || 0}
            icon={<CancelIcon sx={{ fontSize: 40 }} />}
            color="#d32f2f"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Tingkat Kehadiran"
            value={`${stats?.attendanceRate.toFixed(1)}%`}
            icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
            color="#ed6c02"
          />
        </Grid>

        {/* Presence Panels */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              height: 400,
              display: 'flex',
              flexDirection: 'column',
              borderTop: '4px solid #2e7d32',
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <StoreIcon sx={{ color: '#2e7d32' }} />
              <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                Di Toko
              </Typography>
              <Chip
                label={presence?.inStore.length || 0}
                size="small"
                sx={{ bgcolor: '#2e7d32', color: 'white', fontWeight: 'bold' }}
              />
            </Box>
            <Box sx={{ overflow: 'auto', flex: 1 }}>
              {presence?.inStore.length === 0 ? (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  height="100%"
                >
                  <Typography color="textSecondary">
                    Belum ada karyawan yang masuk
                  </Typography>
                </Box>
              ) : (
                <List dense disablePadding>
                  {presence?.inStore.map((emp: EmployeeInStore) => (
                    <ListItem
                      key={emp.id}
                      sx={{
                        bgcolor: emp.isLate ? 'rgba(211, 47, 47, 0.08)' : 'rgba(46, 125, 50, 0.08)',
                        borderRadius: 1,
                        mb: 0.5,
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={emp.faceImageUrl || undefined}
                          sx={{
                            bgcolor: emp.isLate ? '#d32f2f' : '#2e7d32',
                            width: 40,
                            height: 40,
                            fontSize: 14,
                            border: `2px solid ${emp.isLate ? '#d32f2f' : '#2e7d32'}`,
                          }}
                        >
                          {getInitials(emp.name)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={emp.name}
                        secondary={`${emp.department} • ${formatTime(emp.checkInTime)}`}
                        primaryTypographyProps={{ fontWeight: 'medium', fontSize: 14 }}
                        secondaryTypographyProps={{ fontSize: 12 }}
                      />
                      {emp.isLate ? (
                        <Chip
                          label={`Telat ${emp.lateMinutes} menit`}
                          color="error"
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          label="Tepat Waktu"
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              height: 400,
              display: 'flex',
              flexDirection: 'column',
              borderTop: '4px solid #757575',
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <HomeWorkIcon sx={{ color: '#757575' }} />
              <Typography variant="h6" sx={{ color: '#757575', fontWeight: 'bold' }}>
                Belum di Toko
              </Typography>
              <Chip
                label={presence?.notInStore.length || 0}
                size="small"
                sx={{ bgcolor: '#757575', color: 'white', fontWeight: 'bold' }}
              />
            </Box>
            <Box sx={{ overflow: 'auto', flex: 1 }}>
              {presence?.notInStore.length === 0 ? (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  height="100%"
                >
                  <Typography color="textSecondary">
                    Semua karyawan sudah di toko
                  </Typography>
                </Box>
              ) : (
                <List dense disablePadding>
                  {presence?.notInStore.map((emp: EmployeeNotInStore) => {
                    const isEarly = emp.status === 'checked_out' && emp.isEarlyCheckout;
                    const getBgColor = () => {
                      if (emp.status === 'not_checked_in') return 'rgba(117, 117, 117, 0.08)';
                      if (isEarly) return 'rgba(237, 108, 2, 0.08)';
                      return 'rgba(46, 125, 50, 0.08)';
                    };
                    const getBorderColor = () => {
                      if (emp.status === 'not_checked_in') return '#757575';
                      if (isEarly) return '#ed6c02';
                      return '#2e7d32';
                    };

                    return (
                      <ListItem
                        key={emp.id}
                        sx={{
                          bgcolor: getBgColor(),
                          borderRadius: 1,
                          mb: 0.5,
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            src={emp.faceImageUrl || undefined}
                            sx={{
                              bgcolor: getBorderColor(),
                              width: 40,
                              height: 40,
                              fontSize: 14,
                              border: `2px solid ${getBorderColor()}`,
                            }}
                          >
                            {getInitials(emp.name)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={emp.name}
                          secondary={
                            emp.status === 'checked_out'
                              ? `${emp.department} • ${formatTime(emp.checkOutTime!)}`
                              : `${emp.department}`
                          }
                          primaryTypographyProps={{ fontWeight: 'medium', fontSize: 14 }}
                          secondaryTypographyProps={{ fontSize: 12 }}
                        />
                        {emp.status === 'not_checked_in' ? (
                          <Chip label="-" size="small" variant="outlined" />
                        ) : isEarly ? (
                          <Chip
                            label={`Pulang Cepat ${emp.earlyMinutes} menit`}
                            color="warning"
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            label="Tepat Waktu"
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ringkasan Kehadiran Bulan Ini
            </Typography>
            <Typography variant="h3" color="primary" fontWeight="bold">
              {stats?.monthlyTotalAttendances || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total absensi bulan ini
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
