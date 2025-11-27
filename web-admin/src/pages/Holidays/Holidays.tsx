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
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControlLabel,
  Switch,
  Autocomplete,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  Public as GlobalIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { holidaysApi, Holiday, CreateHolidayDto, employeesApi } from '@/api';
import { Employee } from '@/types';
import { usePageTitle } from '@/contexts/PageTitleContext';
import toast from 'react-hot-toast';

export default function Holidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState<CreateHolidayDto>({
    date: '',
    name: '',
    description: '',
    isGlobal: true,
    userIds: [],
  });

  usePageTitle('Hari Libur', 'Kelola hari libur nasional dan cuti bersama');

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  useEffect(() => {
    loadHolidays();
    loadEmployees();
  }, [selectedYear]);

  const loadEmployees = async () => {
    try {
      const data = await employeesApi.getAll();
      const activeEmployees = data.filter(emp => emp.isActive !== false);
      setEmployees(activeEmployees);
    } catch (error) {
    }
  };

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const data = await holidaysApi.getByYear(selectedYear);
      // Sort by date
      const sortedData = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setHolidays(sortedData);
    } catch (error) {
      toast.error('Gagal memuat data hari libur');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (holiday?: Holiday) => {
    if (holiday) {
      setEditingHoliday(holiday);
      const assignedEmployees = holiday.users?.map(hu =>
        employees.find(e => e.id === hu.userId)
      ).filter(Boolean) as Employee[] || [];
      setSelectedEmployees(assignedEmployees);
      setFormData({
        date: holiday.date.split('T')[0],
        name: holiday.name,
        description: holiday.description || '',
        isGlobal: holiday.isGlobal,
        userIds: holiday.users?.map(hu => hu.userId) || [],
      });
    } else {
      setEditingHoliday(null);
      setSelectedEmployees([]);
      setFormData({
        date: '',
        name: '',
        description: '',
        isGlobal: true,
        userIds: [],
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingHoliday(null);
    setSelectedEmployees([]);
  };

  const handleSubmit = async () => {
    if (!formData.date || !formData.name.trim()) {
      toast.error('Tanggal dan nama hari libur harus diisi');
      return;
    }

    if (!formData.isGlobal && selectedEmployees.length === 0) {
      toast.error('Pilih minimal 1 karyawan untuk libur non-global');
      return;
    }

    const submitData: CreateHolidayDto = {
      ...formData,
      userIds: formData.isGlobal ? [] : selectedEmployees.map(e => e.id),
    };

    try {
      if (editingHoliday) {
        await holidaysApi.update(editingHoliday.id, submitData);
        toast.success('Hari libur berhasil diupdate');
      } else {
        await holidaysApi.create(submitData);
        toast.success('Hari libur berhasil ditambahkan');
      }
      handleCloseDialog();
      loadHolidays();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Terjadi kesalahan';
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus hari libur "${name}"?`)) {
      try {
        await holidaysApi.delete(id);
        toast.success('Hari libur berhasil dihapus');
        loadHolidays();
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || 'Gagal menghapus hari libur';
        toast.error(errorMsg);
      }
    }
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Tahun</InputLabel>
          <Select
            value={selectedYear}
            label="Tahun"
            onChange={(e) => setSelectedYear(e.target.value as number)}
          >
            {years.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Tambah Hari Libur
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50}><strong>No</strong></TableCell>
              <TableCell><strong>Tanggal</strong></TableCell>
              <TableCell><strong>Nama Hari Libur</strong></TableCell>
              <TableCell><strong>Berlaku Untuk</strong></TableCell>
              <TableCell><strong>Deskripsi</strong></TableCell>
              <TableCell align="center" width={120}><strong>Aksi</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {holidays.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Box py={3}>
                    <CalendarIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="textSecondary">
                      Belum ada hari libur yang terdaftar untuk tahun {selectedYear}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              holidays.map((holiday, index) => (
                <TableRow key={holiday.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {formatShortDate(holiday.date)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(holiday.date).toLocaleDateString('id-ID', { weekday: 'long' })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="medium">{holiday.name}</Typography>
                  </TableCell>
                  <TableCell>
                    {holiday.isGlobal ? (
                      <Chip
                        icon={<GlobalIcon />}
                        label="Semua Karyawan"
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ) : (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {holiday.users?.slice(0, 3).map((hu) => (
                          <Chip
                            key={hu.id}
                            icon={<PersonIcon />}
                            label={hu.user.name}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {holiday.users && holiday.users.length > 3 && (
                          <Chip
                            label={`+${holiday.users.length - 3} lainnya`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {holiday.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(holiday)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(holiday.id, holiday.name)}
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

      <Box mt={2}>
        <Typography variant="body2" color="textSecondary">
          Total: {holidays.length} hari libur pada tahun {selectedYear}
        </Typography>
      </Box>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingHoliday ? 'Edit Hari Libur' : 'Tambah Hari Libur'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Tanggal"
              type="date"
              fullWidth
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Nama Hari Libur"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Contoh: Hari Raya Idul Fitri"
            />
            <TextField
              label="Deskripsi (Optional)"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Keterangan tambahan"
            />

            <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isGlobal}
                    onChange={(e) => {
                      setFormData({ ...formData, isGlobal: e.target.checked });
                      if (e.target.checked) {
                        setSelectedEmployees([]);
                      }
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {formData.isGlobal ? <GlobalIcon color="primary" /> : <PersonIcon />}
                    <Typography>
                      {formData.isGlobal ? 'Berlaku untuk semua karyawan' : 'Berlaku untuk karyawan tertentu'}
                    </Typography>
                  </Box>
                }
              />
            </Box>

            {!formData.isGlobal && (
              <Autocomplete
                multiple
                options={employees}
                disableCloseOnSelect
                getOptionLabel={(option) => option.name}
                value={selectedEmployees}
                onChange={(_, newValue) => setSelectedEmployees(newValue)}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox
                      style={{ marginRight: 8 }}
                      checked={selected}
                    />
                    {option.name}
                    {option.department?.name && (
                      <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                        ({option.department.name})
                      </Typography>
                    )}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Cari karyawan..."
                    error={!formData.isGlobal && selectedEmployees.length === 0}
                    helperText={!formData.isGlobal && selectedEmployees.length === 0 ? 'Pilih minimal 1 karyawan' : ''}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      label={option.name}
                      size="small"
                    />
                  ))
                }
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Batal</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={!formData.date || !formData.name.trim()}
          >
            {editingHoliday ? 'Update' : 'Tambah'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
