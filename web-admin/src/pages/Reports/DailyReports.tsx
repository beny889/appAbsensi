import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  MenuItem,
} from '@mui/material';
import { reportsApi, branchApi, authApi } from '@/api';
import { DailyReport, Attendance, Branch } from '@/types';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface GroupedAttendance {
  userId: string;
  userName: string;
  departmentName: string;
  checkIn: Attendance | null;
  checkOut: Attendance | null;
}

export default function DailyReports() {
  const isSuperAdmin = authApi.getUserRole() === 'SUPER_ADMIN';
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');

  usePageTitle('Laporan Harian', 'Ringkasan kehadiran karyawan per hari');

  useEffect(() => {
    if (isSuperAdmin) {
      branchApi.getAll().then(setBranches).catch(() => {});
    }
  }, [isSuperAdmin]);

  // Group attendances by user (1 row per user with masuk & pulang combined)
  const groupedAttendances = useMemo((): GroupedAttendance[] => {
    if (!report?.attendances) return [];

    const userMap = new Map<string, GroupedAttendance>();

    report.attendances.forEach((attendance) => {
      const userId = attendance.userId;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          userName: attendance.user?.name || '-',
          departmentName: attendance.user?.department?.name || '-',
          checkIn: null,
          checkOut: null,
        });
      }

      const record = userMap.get(userId)!;
      if (attendance.type === 'CHECK_IN') {
        record.checkIn = attendance;
      } else {
        record.checkOut = attendance;
      }
    });

    return Array.from(userMap.values());
  }, [report?.attendances]);

  const loadReport = async () => {
    if (!date) {
      toast.error('Pilih tanggal terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      const data = await reportsApi.getDailyReport(date, selectedBranchId || undefined);
      setReport(data);
      toast.success('Laporan berhasil dimuat');
    } catch (error) {
      toast.error('Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={isSuperAdmin ? 4 : 6}>
            <TextField
              fullWidth
              type="date"
              label="Pilih Tanggal"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          {isSuperAdmin && (
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Filter Cabang"
                value={selectedBranchId}
                onChange={(e) => { setSelectedBranchId(e.target.value); setReport(null); }}
              >
                <MenuItem value="">Semua Cabang</MenuItem>
                {branches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          )}
          <Grid item xs={12} sm={isSuperAdmin ? 4 : 6}>
            <Button
              fullWidth
              variant="contained"
              onClick={loadReport}
              disabled={loading}
              sx={{ height: 56 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Tampilkan Laporan'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {report && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Total Karyawan
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {report.totalEmployees}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Masuk
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {report.totalCheckIns}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Pulang
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="secondary">
                  {report.totalCheckOuts}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Tingkat Kehadiran
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {report.attendanceRate.toFixed(1)}%
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Detail Absensi - {format(new Date(report.date), 'dd MMMM yyyy')}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Total {groupedAttendances.length} karyawan hadir
            </Typography>

            {groupedAttendances.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nama</TableCell>
                      <TableCell>Departemen</TableCell>
                      <TableCell>Masuk</TableCell>
                      <TableCell>Pulang</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {groupedAttendances.map((record) => (
                      <TableRow key={record.userId}>
                        <TableCell>{record.userName}</TableCell>
                        <TableCell>{record.departmentName}</TableCell>
                        <TableCell>
                          {record.checkIn ? format(new Date(record.checkIn.timestamp), 'HH:mm') : '-'}
                        </TableCell>
                        <TableCell>
                          {record.checkOut ? format(new Date(record.checkOut.timestamp), 'HH:mm') : '-'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {record.checkIn?.isLate && (
                              <Chip
                                label={`Terlambat ${record.checkIn.lateMinutes} menit`}
                                color="error"
                                size="small"
                              />
                            )}
                            {record.checkOut?.isEarlyCheckout && (
                              <Chip
                                label={`Pulang Awal ${record.checkOut.earlyMinutes} menit`}
                                color="warning"
                                size="small"
                              />
                            )}
                            {!record.checkIn?.isLate && !record.checkOut?.isEarlyCheckout && (
                              <Chip label="Tepat Waktu" color="success" size="small" />
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                Tidak ada data absensi pada tanggal ini
              </Typography>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}
