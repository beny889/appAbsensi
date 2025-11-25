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
  InputAdornment,
  IconButton,
  Tooltip,
  Avatar,
  Dialog,
} from '@mui/material';
import { Search as SearchIcon, Delete as DeleteIcon, Person as PersonIcon } from '@mui/icons-material';
import { employeesApi } from '@/api';
import { Employee } from '@/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await employeesApi.getAll();
      setEmployees(data);
    } catch (error) {
      toast.error('Gagal memuat data karyawan');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase()) ||
      emp.department?.name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.position?.toLowerCase().includes(search.toLowerCase())
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
        Manajemen Karyawan
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Daftar karyawan yang terdaftar dalam sistem
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Cari karyawan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Nama</strong></TableCell>
              <TableCell><strong>Posisi</strong></TableCell>
              <TableCell><strong>Departemen</strong></TableCell>
              <TableCell><strong>Telepon</strong></TableCell>
              <TableCell><strong>Foto Wajah</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Terdaftar</strong></TableCell>
              <TableCell align="center"><strong>Aksi</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="textSecondary">
                    {search ? 'Tidak ada hasil' : 'Belum ada data karyawan'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id} hover>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.position || '-'}</TableCell>
                  <TableCell>{employee.department?.name || '-'}</TableCell>
                  <TableCell>{employee.phone || '-'}</TableCell>
                  <TableCell>
                    {employee.faceImageUrl ? (
                      <Tooltip title="Klik untuk memperbesar">
                        <Avatar
                          src={employee.faceImageUrl}
                          alt={employee.name}
                          sx={{
                            width: 45,
                            height: 45,
                            cursor: 'pointer',
                            border: '2px solid #4caf50',
                            '&:hover': {
                              transform: 'scale(1.1)',
                              transition: 'transform 0.2s',
                            }
                          }}
                          onClick={() => setSelectedImage({ url: employee.faceImageUrl!, name: employee.name })}
                        />
                      </Tooltip>
                    ) : (
                      <Avatar sx={{ width: 45, height: 45, bgcolor: '#e0e0e0' }}>
                        <PersonIcon sx={{ color: '#9e9e9e' }} />
                      </Avatar>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={employee.isActive ? 'Aktif' : 'Nonaktif'}
                      color={employee.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(employee.createdAt), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Hapus karyawan (hanya jika belum ada absensi)">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(employee)}
                      >
                        <DeleteIcon />
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
          Total: {filteredEmployees.length} karyawan
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
                bgcolor: '#1976d2',
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
                label="Face Registered"
                color="success"
                icon={<PersonIcon />}
              />
            </Box>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}
