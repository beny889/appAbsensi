import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
} from '@mui/material';
import { reportsApi } from '@/api';
import { DailyReport } from '@/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function DailyReports() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    if (!date) {
      toast.error('Pilih tanggal terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      const data = await reportsApi.getDailyReport(date);
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
        Laporan Harian
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Ringkasan kehadiran karyawan per hari
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Pilih Tanggal"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
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
                  Check-In
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {report.totalCheckIns}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Check-Out
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
            <Typography variant="body2" color="textSecondary">
              Total {report.attendances.length} record absensi
            </Typography>
          </Paper>
        </>
      )}
    </Box>
  );
}
