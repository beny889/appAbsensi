import { useState } from 'react';
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
} from '@mui/material';
import { reportsApi } from '@/api';
import { MonthlyReport } from '@/types';
import toast from 'react-hot-toast';

export default function MonthlyReports() {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear().toString());
  const [month, setMonth] = useState((currentDate.getMonth() + 1).toString());
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    if (!year || !month) {
      toast.error('Pilih tahun dan bulan terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      const data = await reportsApi.getMonthlyReport(parseInt(year), parseInt(month));
      setReport(data);
      toast.success('Laporan berhasil dimuat');
    } catch (error) {
      toast.error('Gagal memuat laporan');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Laporan Bulanan
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Ringkasan kehadiran karyawan per bulan
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Tahun"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Bulan (1-12)"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: 1, max: 12 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
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
                  Hari Kerja
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {report.workingDays}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Total Check-In
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {report.totalCheckIns}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Total Check-Out
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="secondary">
                  {report.totalCheckOuts}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Total Karyawan
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {report.employeeStats.length}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Nama Karyawan</strong></TableCell>
                  <TableCell><strong>Departemen</strong></TableCell>
                  <TableCell align="center"><strong>Hari Hadir</strong></TableCell>
                  <TableCell align="center"><strong>Hari Kerja</strong></TableCell>
                  <TableCell align="center"><strong>Tingkat Kehadiran</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.employeeStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="textSecondary">
                        Belum ada data
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  report.employeeStats.map((stat) => (
                    <TableRow key={stat.user.id} hover>
                      <TableCell>{stat.user.name}</TableCell>
                      <TableCell>{stat.user.department || '-'}</TableCell>
                      <TableCell align="center">{stat.attendanceDays}</TableCell>
                      <TableCell align="center">{stat.workingDays}</TableCell>
                      <TableCell align="center">
                        <Typography
                          fontWeight="bold"
                          color={stat.attendanceRate >= 80 ? 'success.main' : 'error.main'}
                        >
                          {stat.attendanceRate.toFixed(1)}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
