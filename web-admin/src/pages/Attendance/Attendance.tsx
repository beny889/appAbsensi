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
  TablePagination,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { Person as PersonIcon, Delete as DeleteIcon, Search as SearchIcon, Today as TodayIcon, Clear as ClearIcon } from '@mui/icons-material';
import { attendanceApi } from '@/api';
import { Attendance as AttendanceType } from '@/types';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Attendance() {
  const [attendances, setAttendances] = useState<AttendanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string; type: string } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; attendance: AttendanceType | null }>({
    open: false,
    attendance: null,
  });
  const [deleting, setDeleting] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  usePageTitle('Data Absensi', 'Riwayat absensi karyawan');

  useEffect(() => {
    loadAttendances();
  }, [startDate, endDate]);

  const loadAttendances = async () => {
    setLoading(true);
    try {
      const data = await attendanceApi.getAll(startDate || undefined, endDate || undefined);
      // Sort by timestamp descending (newest first)
      const sortedData = data.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setAttendances(sortedData);
      setPage(0); // Reset to first page when data changes
    } catch (error) {
      toast.error('Gagal memuat data absensi');
    } finally {
      setLoading(false);
    }
  };

  // Pagination handlers
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter by search query
  const filteredAttendances = attendances.filter((attendance) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = attendance.user?.name?.toLowerCase() || '';
    const position = attendance.user?.position?.toLowerCase() || '';
    return name.includes(query) || position.includes(query);
  });

  // Get paginated data from filtered results
  const paginatedAttendances = filteredAttendances.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Reset page when search changes
  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  // Quick filter handlers
  const handleTodayFilter = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setStartDate(today);
    setEndDate(today);
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  const isFilterActive = startDate || endDate || searchQuery;

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
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Cari Karyawan"
              placeholder="Nama atau posisi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Tanggal Mulai"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Tanggal Akhir"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4} md={5}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<TodayIcon />}
                onClick={handleTodayFilter}
                sx={{ textTransform: 'none' }}
              >
                Hari Ini
              </Button>
              {isFilterActive && (
                <Button
                  variant="outlined"
                  size="small"
                  color="secondary"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilter}
                  sx={{ textTransform: 'none' }}
                >
                  Reset Filter
                </Button>
              )}
            </Box>
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
            {paginatedAttendances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    {attendances.length === 0
                      ? 'Belum ada data absensi'
                      : searchQuery
                      ? `Tidak ditemukan hasil untuk "${searchQuery}"`
                      : 'Tidak ada data pada halaman ini'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedAttendances.map((attendance) => (
                <TableRow key={attendance.id} hover>
                  <TableCell>
                    {(attendance.faceImageUrl || attendance.user?.faceImageUrl) ? (
                      <Tooltip title="Klik untuk memperbesar">
                        <Avatar
                          src={attendance.faceImageUrl || attendance.user?.faceImageUrl}
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
                            url: (attendance.faceImageUrl || attendance.user?.faceImageUrl)!,
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
        <TablePagination
          component="div"
          count={filteredAttendances.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Baris per halaman:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`
          }
        />
      </TableContainer>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          {searchQuery ? (
            <>Ditemukan: {filteredAttendances.length} dari {attendances.length} record</>
          ) : (
            <>Total: {attendances.length} record</>
          )}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Halaman {page + 1} dari {Math.ceil(filteredAttendances.length / rowsPerPage) || 1}
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
