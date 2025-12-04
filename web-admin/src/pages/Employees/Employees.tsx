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
  InputAdornment,
  IconButton,
  Tooltip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { employeesApi, departmentApi, authApi } from '@/api';
import { Employee, Department, UpdateEmployeeDto } from '@/types';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Employees() {
  const isSuperAdmin = authApi.getUserRole() === 'SUPER_ADMIN';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState<UpdateEmployeeDto>({});
  const [saving, setSaving] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  usePageTitle('Manajemen Karyawan', 'Kelola data karyawan yang terdaftar dalam sistem');

  useEffect(() => {
    loadEmployees();
    loadDepartments();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await employeesApi.getAll();
      setEmployees(data);
    } catch (error) {
      toast.error('Gagal memuat data karyawan');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await departmentApi.getAll();
      setDepartments(data);
    } catch (error) {
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.department?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Reset page when search changes
  useEffect(() => {
    setPage(0);
  }, [search]);

  const activeCount = employees.filter(e => e.isActive).length;
  const inactiveCount = employees.filter(e => !e.isActive).length;

  // Pagination handlers
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get paginated employees
  const paginatedEmployees = filteredEmployees.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`Hapus karyawan "${employee.name}"?\n\nKaryawan hanya bisa dihapus jika belum memiliki record absensi.`)) {
      return;
    }

    try {
      await employeesApi.delete(employee.id);
      toast.success('Karyawan berhasil dihapus');
      loadEmployees();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Gagal menghapus karyawan';
      toast.error(message);
    }
  };

  // Edit dialog handlers
  const handleOpenEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditForm({
      name: employee.name,
      departmentId: employee.departmentId || '',
      isActive: employee.isActive,
      startDate: employee.startDate ? employee.startDate.split('T')[0] : '',
    });
    setEditDialogOpen(true);
  };

  const handleCloseEdit = () => {
    setEditDialogOpen(false);
    setEditingEmployee(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editingEmployee) return;

    setSaving(true);
    try {
      await employeesApi.update(editingEmployee.id, editForm);
      toast.success('Data karyawan berhasil diperbarui');
      handleCloseEdit();
      loadEmployees();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Gagal memperbarui data karyawan';
      toast.error(message);
    } finally {
      setSaving(false);
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
      {/* Stats Cards + Search in One Row */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Card sx={{ minWidth: 120 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
            <Avatar sx={{ bgcolor: '#1976d2', width: 32, height: 32 }}>
              <PeopleIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold" lineHeight={1}>{employees.length}</Typography>
              <Typography variant="caption" color="text.secondary">Total</Typography>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 100 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
            <Avatar sx={{ bgcolor: '#4caf50', width: 32, height: 32 }}>
              <CheckCircleIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold" lineHeight={1}>{activeCount}</Typography>
              <Typography variant="caption" color="text.secondary">Aktif</Typography>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 100 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
            <Avatar sx={{ bgcolor: '#9e9e9e', width: 32, height: 32 }}>
              <CancelIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold" lineHeight={1}>{inactiveCount}</Typography>
              <Typography variant="caption" color="text.secondary">Nonaktif</Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Search */}
        <TextField
          placeholder="Cari nama atau departemen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Table */}
      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold', py: 2, width: 60 }} align="center">No</TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Karyawan</TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Departemen</TableCell>
              {isSuperAdmin && <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Cabang</TableCell>}
              <TableCell sx={{ fontWeight: 'bold', py: 2 }} align="center">Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Terdaftar</TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 2 }} align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSuperAdmin ? 7 : 6} align="center" sx={{ py: 6 }}>
                  <PersonIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                  <Typography variant="body1" color="text.secondary">
                    {search ? 'Tidak ada hasil pencarian' : 'Belum ada data karyawan'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedEmployees.map((employee, index) => (
                <TableRow
                  key={employee.id}
                  hover
                  sx={{
                    '&:hover': { bgcolor: '#fafafa' },
                    opacity: employee.isActive ? 1 : 0.6,
                  }}
                >
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {page * rowsPerPage + index + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {employee.faceImageUrl ? (
                        <Tooltip title="Klik untuk memperbesar">
                          <Avatar
                            src={employee.faceImageUrl}
                            alt={employee.name}
                            sx={{
                              width: 44,
                              height: 44,
                              cursor: 'pointer',
                              border: '2px solid #4caf50',
                              transition: 'transform 0.2s',
                              '&:hover': { transform: 'scale(1.1)' }
                            }}
                            onClick={() => setSelectedImage({ url: employee.faceImageUrl!, name: employee.name })}
                          />
                        </Tooltip>
                      ) : (
                        <Avatar sx={{ width: 44, height: 44, bgcolor: '#e0e0e0' }}>
                          <PersonIcon sx={{ color: '#9e9e9e' }} />
                        </Avatar>
                      )}
                      <Box>
                        <Typography variant="body1" fontWeight="500">
                          {employee.name}
                        </Typography>
                        {employee.faceImageUrl && (
                          <Typography variant="caption" color="success.main">
                            Wajah terdaftar
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={employee.department?.name || 'Tidak ada'}
                      size="small"
                      variant={employee.department ? 'filled' : 'outlined'}
                      color={employee.department ? 'primary' : 'default'}
                      sx={{ fontWeight: 500 }}
                    />
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <Typography variant="body2">
                        {employee.branch?.name || '-'}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell align="center">
                    <Chip
                      label={employee.isActive ? 'Aktif' : 'Nonaktif'}
                      size="small"
                      color={employee.isActive ? 'success' : 'default'}
                      sx={{ minWidth: 80 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(employee.createdAt), 'dd MMM yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(employee)}
                          sx={{
                            color: '#1976d2',
                            '&:hover': { bgcolor: '#e3f2fd' }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Hapus">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(employee)}
                          sx={{
                            color: '#d32f2f',
                            '&:hover': { bgcolor: '#ffebee' }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={filteredEmployees.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="Baris per halaman:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} dari ${count}`
        }
        sx={{ borderTop: '1px solid #e0e0e0' }}
      />

      {/* Image Preview Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {selectedImage && (
          <Box>
            <Box sx={{ bgcolor: '#1976d2', color: 'white', py: 2, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon />
                <Typography variant="h6">{selectedImage.name}</Typography>
              </Box>
              <IconButton size="small" onClick={() => setSelectedImage(null)} sx={{ color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#f5f5f5', p: 3 }}>
              <img
                src={selectedImage.url}
                alt={selectedImage.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                }}
              />
            </Box>
          </Box>
        )}
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEdit}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon />
            <span>Edit Karyawan</span>
          </Box>
          <IconButton size="small" onClick={handleCloseEdit} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {editingEmployee && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              {/* Employee Photo Preview */}
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                {editingEmployee.faceImageUrl ? (
                  <Avatar
                    src={editingEmployee.faceImageUrl}
                    alt={editingEmployee.name}
                    sx={{ width: 80, height: 80, border: '3px solid #4caf50' }}
                  />
                ) : (
                  <Avatar sx={{ width: 80, height: 80, bgcolor: '#e0e0e0' }}>
                    <PersonIcon sx={{ fontSize: 40, color: '#9e9e9e' }} />
                  </Avatar>
                )}
              </Box>

              <TextField
                fullWidth
                label="Nama Karyawan"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
                size="small"
              />

              <FormControl fullWidth size="small">
                <InputLabel>Departemen</InputLabel>
                <Select
                  value={editForm.departmentId || ''}
                  label="Departemen"
                  onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                >
                  <MenuItem value="">
                    <em>Tidak Ada</em>
                  </MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Tanggal Mulai Bekerja"
                type="date"
                value={editForm.startDate || ''}
                onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                size="small"
                InputLabelProps={{ shrink: true }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={editForm.isActive ?? true}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    color="success"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Status:</span>
                    <Chip
                      label={editForm.isActive ? 'Aktif' : 'Nonaktif'}
                      size="small"
                      color={editForm.isActive ? 'success' : 'default'}
                    />
                  </Box>
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={handleCloseEdit} variant="outlined" color="inherit">
            Batal
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={saving || !editForm.name}
            sx={{ minWidth: 100 }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
