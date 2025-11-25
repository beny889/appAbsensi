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
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
} from '@mui/material';
import { Person as PersonIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { attendanceApi } from '@/api';
import { Attendance as AttendanceType } from '@/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Attendance() {
  const [attendances, setAttendances] = useState<AttendanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string; type: string } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; attendance: AttendanceType | null }>({
    open: false,
    attendance: null,
  });
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteClick = (attendance: AttendanceType) => {
    setDeleteDialog({ open: true, attendance });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.attendance) return;

    setDeleting(true);
    try {
      await attendanceApi.delete(deleteDialog.attendance.id);
      toast.success('Data absensi berhasil dihapus');
      setAttendances(attendances.filter(a => a.id !== deleteDialog.attendance!.id));
      setDeleteDialog({ open: false, attendance: null });
    } catch (error) {
      toast.error('Gagal menghapus data absensi');
      console.error(error);
    } finally {
      setDeleting(false);
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
              <TableCell><strong>Foto</strong></TableCell>
              <TableCell><strong>Karyawan</strong></TableCell>
              <TableCell><strong>Tipe</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Waktu</strong></TableCell>
              <TableCell><strong>Jadwal</strong></TableCell>
              <TableCell><strong>Similarity</strong></TableCell>
              <TableCell><strong>Catatan</strong></TableCell>
              <TableCell align="center"><strong>Aksi</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" color="textSecondary">
                    Belum ada data absensi
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              attendances.map((attendance) => (
                <TableRow key={attendance.id} hover>
                  <TableCell>
                    {attendance.faceImageUrl ? (
                      <Tooltip title="Klik untuk memperbesar">
                        <Avatar
                          src={attendance.faceImageUrl}
                          alt={attendance.user?.name || 'User'}
                          sx={{
                            width: 45,
                            height: 45,
                            cursor: 'pointer',
                            border: attendance.type === 'CHECK_IN' ? '2px solid #1976d2' : '2px solid #9c27b0',
                            '&:hover': {
                              transform: 'scale(1.1)',
                              transition: 'transform 0.2s',
                            }
                          }}
                          onClick={() => setSelectedImage({
                            url: attendance.faceImageUrl!,
                            name: attendance.user?.name || 'User',
                            type: attendance.type
                          })}
                        />
                      </Tooltip>
                    ) : (
                      <Avatar sx={{ width: 45, height: 45, bgcolor: '#e0e0e0' }}>
                        <PersonIcon sx={{ color: '#9e9e9e' }} />
                      </Avatar>
                    )}
                  </TableCell>
                  <TableCell>{attendance.user?.name || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={attendance.type === 'CHECK_IN' ? 'Masuk' : 'Pulang'}
                      color={attendance.type === 'CHECK_IN' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {attendance.type === 'CHECK_IN' ? (
                      attendance.isLate ? (
                        <Chip
                          label={`Telat ${attendance.lateMinutes} menit`}
                          color="error"
                          size="small"
                          variant="outlined"
                        />
                      ) : attendance.scheduledTime ? (
                        <Chip
                          label="Tepat Waktu"
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Chip label="-" size="small" variant="outlined" />
                      )
                    ) : (
                      attendance.isEarlyCheckout ? (
                        <Chip
                          label={`Pulang Cepat ${attendance.earlyMinutes} menit`}
                          color="warning"
                          size="small"
                          variant="outlined"
                        />
                      ) : attendance.scheduledTime ? (
                        <Chip
                          label="Tepat Waktu"
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Chip label="-" size="small" variant="outlined" />
                      )
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(attendance.timestamp), 'dd MMM yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    {attendance.scheduledTime || '-'}
                  </TableCell>
                  <TableCell>
                    {attendance.similarity ? `${(attendance.similarity * 100).toFixed(1)}%` : '-'}
                  </TableCell>
                  <TableCell>{attendance.notes || '-'}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Hapus">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(attendance)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
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

      {/* Image Preview Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
          }
        }}
      >
        {selectedImage && (
          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                bgcolor: selectedImage.type === 'CHECK_IN' ? '#1976d2' : '#9c27b0',
                color: 'white',
                py: 2,
                px: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <PersonIcon />
              <Typography variant="h6">{selectedImage.name}</Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: '#f5f5f5',
                p: 2,
              }}
            >
              <img
                src={selectedImage.url}
                alt={selectedImage.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              />
            </Box>
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Chip
                label={selectedImage.type === 'CHECK_IN' ? 'Masuk' : 'Pulang'}
                color={selectedImage.type === 'CHECK_IN' ? 'primary' : 'secondary'}
                icon={<PersonIcon />}
              />
            </Box>
          </Box>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, attendance: null })}
      >
        <DialogTitle>Hapus Data Absensi</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin menghapus data absensi{' '}
            <strong>{deleteDialog.attendance?.user?.name}</strong> pada{' '}
            <strong>
              {deleteDialog.attendance?.timestamp &&
                format(new Date(deleteDialog.attendance.timestamp), 'dd MMM yyyy HH:mm')}
            </strong>
            ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, attendance: null })}
            disabled={deleting}
          >
            Batal
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
