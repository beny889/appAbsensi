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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { workScheduleApi, departmentApi } from '@/api';
import { WorkSchedule, CreateWorkScheduleDto, UpdateWorkScheduleDto, Department } from '@/types';
import { usePageTitle } from '@/contexts/PageTitleContext';
import toast from 'react-hot-toast';

export default function WorkSchedules() {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(null);
  const [formData, setFormData] = useState<CreateWorkScheduleDto>({
    departmentId: '',
    checkInTime: '09:00',
    checkOutTime: '17:00',
    isActive: true,
  });

  usePageTitle('Jadwal Kerja', 'Kelola jadwal kerja per departemen');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [schedulesData, departmentsData] = await Promise.all([
        workScheduleApi.getAll(),
        departmentApi.getAll(),
      ]);
      setSchedules(schedulesData);
      setDepartments(departmentsData.filter(d => d.isActive));
    } catch (error) {
      toast.error('Gagal memuat data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async () => {
    try {
      const data = await workScheduleApi.getAll();
      setSchedules(data);
    } catch (error) {
      toast.error('Gagal memuat data jadwal kerja');
      console.error(error);
    }
  };

  const handleOpenDialog = (schedule?: WorkSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        departmentId: schedule.departmentId,
        checkInTime: schedule.checkInTime,
        checkOutTime: schedule.checkOutTime,
        isActive: schedule.isActive,
      });
    } else {
      setEditingSchedule(null);
      setFormData({
        departmentId: '',
        checkInTime: '09:00',
        checkOutTime: '17:00',
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSchedule(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingSchedule) {
        // Update existing schedule
        await workScheduleApi.update(editingSchedule.id, formData);
        toast.success('Jadwal kerja berhasil diupdate');
      } else {
        // Create new schedule
        await workScheduleApi.create(formData);
        toast.success('Jadwal kerja berhasil ditambahkan');
      }
      handleCloseDialog();
      loadSchedules();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Terjadi kesalahan';
      toast.error(errorMsg);
      console.error(error);
    }
  };

  const handleDelete = async (id: string, department: string) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus jadwal kerja untuk departemen ${department}?`
      )
    ) {
      try {
        await workScheduleApi.delete(id);
        toast.success('Jadwal kerja berhasil dihapus');
        loadSchedules();
      } catch (error) {
        toast.error('Gagal menghapus jadwal kerja');
        console.error(error);
      }
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
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Tambah Jadwal
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Departemen</strong></TableCell>
              <TableCell><strong>Jam Masuk</strong></TableCell>
              <TableCell><strong>Jam Pulang</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Aksi</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {schedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="textSecondary" py={3}>
                    Belum ada jadwal kerja yang dikonfigurasi
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>{schedule.department?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={schedule.checkInTime}
                      color="success"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={schedule.checkOutTime}
                      color="error"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {schedule.isActive ? (
                      <Chip label="Aktif" color="success" size="small" />
                    ) : (
                      <Chip label="Tidak Aktif" color="default" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(schedule)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(schedule.id, schedule.department?.name || 'N/A')}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSchedule ? 'Edit Jadwal Kerja' : 'Tambah Jadwal Kerja'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth disabled={!!editingSchedule}>
              <InputLabel>Departemen</InputLabel>
              <Select
                value={formData.departmentId}
                label="Departemen"
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              >
                <MenuItem value="">
                  <em>Pilih Departemen</em>
                </MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
              {editingSchedule && (
                <FormHelperText>Departemen tidak dapat diubah</FormHelperText>
              )}
              {!editingSchedule && departments.length === 0 && (
                <FormHelperText error>
                  Belum ada departemen. Silakan buat departemen terlebih dahulu.
                </FormHelperText>
              )}
            </FormControl>
            <TextField
              label="Jam Masuk"
              type="time"
              fullWidth
              value={formData.checkInTime}
              onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Jam Pulang"
              type="time"
              fullWidth
              value={formData.checkOutTime}
              onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Aktif"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Batal</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={!formData.departmentId || !formData.checkInTime || !formData.checkOutTime}
          >
            {editingSchedule ? 'Update' : 'Tambah'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
