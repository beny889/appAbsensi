import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  TextField,
  Grid,
} from '@mui/material';
import { attendanceApi } from '@/api';
import { Attendance as AttendanceType } from '@/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Attendance() {
  const [attendances, setAttendances] = useState<AttendanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadAttendances();
  }, [startDate, endDate]);

  const loadAttendances = async () => {
    setLoading(true);
    try {
      const data = await attendanceApi.getAll(startDate || undefined, endDate || undefined);
      setAttendances(data);
    } catch (error) {
      toast.error('Gagal memuat data absensi');
      console.error(error);
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
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Data Absensi
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Riwayat absensi karyawan
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Tanggal Mulai"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Tanggal Akhir"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Karyawan</strong></TableCell>
              <TableCell><strong>Tipe</strong></TableCell>
              <TableCell><strong>Waktu</strong></TableCell>
              <TableCell><strong>Lokasi</strong></TableCell>
              <TableCell><strong>Similarity</strong></TableCell>
              <TableCell><strong>Verified</strong></TableCell>
              <TableCell><strong>Catatan</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="textSecondary">
                    Belum ada data absensi
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              attendances.map((attendance) => (
                <TableRow key={attendance.id} hover>
                  <TableCell>{attendance.user?.name || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={attendance.type}
                      color={attendance.type === 'CHECK_IN' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(attendance.timestamp), 'dd MMM yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    {attendance.location?.name || `${attendance.latitude}, ${attendance.longitude}`}
                  </TableCell>
                  <TableCell>
                    {attendance.similarity ? `${(attendance.similarity * 100).toFixed(1)}%` : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={attendance.isVerified ? 'Yes' : 'No'}
                      color={attendance.isVerified ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{attendance.notes || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="textSecondary">
          Total: {attendances.length} record
        </Typography>
      </Box>
    </Box>
  );
}
