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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { departmentApi } from '@/api';
import { Department, CreateDepartmentDto, UpdateDepartmentDto } from '@/types';
import { usePageTitle } from '@/contexts/PageTitleContext';
import toast from 'react-hot-toast';

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState<CreateDepartmentDto>({
    name: '',
    description: '',
    isActive: true,
  });

  usePageTitle('Manajemen Departemen', 'Kelola departemen untuk karyawan dan jadwal kerja');

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const data = await departmentApi.getAll();
      setDepartments(data);
    } catch (error) {
      toast.error('Gagal memuat data departemen');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        name: department.name,
        description: department.description || '',
        isActive: department.isActive,
      });
    } else {
      setEditingDepartment(null);
      setFormData({
        name: '',
        description: '',
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDepartment(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Nama departemen harus diisi');
      return;
    }

    try {
      if (editingDepartment) {
        await departmentApi.update(editingDepartment.id, formData);
        toast.success('Departemen berhasil diupdate');
      } else {
        await departmentApi.create(formData);
        toast.success('Departemen berhasil ditambahkan');
      }
      handleCloseDialog();
      loadDepartments();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Terjadi kesalahan';
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id: string, name: string, userCount: number, scheduleCount: number) => {
    if (userCount > 0) {
      toast.error(`Tidak dapat menghapus departemen. Masih ada ${userCount} user yang terdaftar.`);
      return;
    }

    if (scheduleCount > 0) {
      toast.error(`Tidak dapat menghapus departemen. Masih ada ${scheduleCount} jadwal kerja yang terdaftar.`);
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus departemen ${name}?`)) {
      try {
        await departmentApi.delete(id);
        toast.success('Departemen berhasil dihapus');
        loadDepartments();
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || 'Gagal menghapus departemen';
        toast.error(errorMsg);
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
          Tambah Departemen
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Nama Departemen</strong></TableCell>
              <TableCell><strong>Deskripsi</strong></TableCell>
              <TableCell><strong>Jumlah User</strong></TableCell>
              <TableCell><strong>Jadwal Kerja</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Aksi</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="textSecondary" py={3}>
                    Belum ada departemen yang terdaftar
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell>{department.name}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {department.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={department._count?.users || 0}
                      color="primary"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={department._count?.workSchedules || 0}
                      color="secondary"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {department.isActive ? (
                      <Chip label="Aktif" color="success" size="small" />
                    ) : (
                      <Chip label="Tidak Aktif" color="default" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(department)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(
                        department.id,
                        department.name,
                        department._count?.users || 0,
                        department._count?.workSchedules || 0
                      )}
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

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDepartment ? 'Edit Departemen' : 'Tambah Departemen'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nama Departemen"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Contoh: IT, HR, Finance"
            />
            <TextField
              label="Deskripsi (Optional)"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi singkat tentang departemen"
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
            disabled={!formData.name.trim()}
          >
            {editingDepartment ? 'Update' : 'Tambah'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
