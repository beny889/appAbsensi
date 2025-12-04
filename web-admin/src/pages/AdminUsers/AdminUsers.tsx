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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { adminUsersApi, branchApi } from '@/api';
import { AdminUser, CreateAdminDto, MenuOption, Branch } from '@/types';
import { usePageTitle } from '@/contexts/PageTitleContext';
import toast from 'react-hot-toast';

const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', description: 'Akses semua cabang dan menu' },
  { value: 'BRANCH_ADMIN', label: 'Branch Admin', description: 'Akses cabang tertentu' },
];

export default function AdminUsers() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [menuOptions, setMenuOptions] = useState<MenuOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState<CreateAdminDto & { isActive?: boolean }>({
    email: '',
    password: '',
    name: '',
    role: 'BRANCH_ADMIN',
    allowedMenus: [],
    branchIds: [],
  });

  usePageTitle('Manajemen Admin', 'Kelola akun admin dan hak akses');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [adminsData, branchesData, menusData] = await Promise.all([
        adminUsersApi.getAll(),
        branchApi.getAll(),
        adminUsersApi.getAvailableMenus(),
      ]);
      setAdmins(adminsData);
      setBranches(branchesData);
      setMenuOptions(menusData);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Anda tidak memiliki akses ke halaman ini');
      } else {
        toast.error('Gagal memuat data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (admin?: AdminUser) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        email: admin.email,
        password: '',
        name: admin.name,
        role: admin.role,
        isActive: admin.isActive,
        allowedMenus: admin.allowedMenus || [],
        branchIds: admin.adminBranchAccess.map((a) => a.branchId),
      });
    } else {
      setEditingAdmin(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'BRANCH_ADMIN',
        allowedMenus: [],
        branchIds: [],
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAdmin(null);
  };

  const handleSubmit = async () => {
    if (!formData.email.trim()) {
      toast.error('Email harus diisi');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Nama harus diisi');
      return;
    }
    if (!editingAdmin && !formData.password) {
      toast.error('Password harus diisi');
      return;
    }
    if (!editingAdmin && formData.password && formData.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    try {
      if (editingAdmin) {
        const updateData: any = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await adminUsersApi.update(editingAdmin.id, updateData);
        toast.success('Admin berhasil diupdate');
      } else {
        await adminUsersApi.create(formData);
        toast.success('Admin berhasil ditambahkan');
      }
      handleCloseDialog();
      loadData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Terjadi kesalahan';
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus admin ${name}?`)) {
      try {
        await adminUsersApi.delete(id);
        toast.success('Admin berhasil dihapus');
        loadData();
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || 'Gagal menghapus admin';
        toast.error(errorMsg);
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'error';
      case 'BRANCH_ADMIN':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    const option = ROLE_OPTIONS.find((r) => r.value === role);
    return option?.label || role;
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
          Tambah Admin
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Nama</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Akses Cabang</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Aksi</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="textSecondary" py={3}>
                    Belum ada admin yang terdaftar
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <Typography fontWeight={500}>{admin.name}</Typography>
                  </TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={getRoleLabel(admin.role)}
                      color={getRoleColor(admin.role) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {admin.role === 'SUPER_ADMIN' ? (
                      <Chip label="Semua Cabang" color="error" size="small" variant="outlined" />
                    ) : admin.adminBranchAccess.length > 0 ? (
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {admin.adminBranchAccess.map((access) => (
                          <Chip
                            key={access.id}
                            label={access.branch.code}
                            size="small"
                            variant={access.isDefault ? 'filled' : 'outlined'}
                            color={access.isDefault ? 'primary' : 'default'}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="caption" color="textSecondary">
                        Belum diatur
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {admin.isActive ? (
                      <Chip label="Aktif" color="success" size="small" />
                    ) : (
                      <Chip label="Tidak Aktif" color="default" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(admin)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(admin.id, admin.name)}
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

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAdmin ? 'Edit Admin' : 'Tambah Admin'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box display="flex" gap={2}>
              <TextField
                label="Nama"
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Box>

            <Box display="flex" gap={2}>
              <TextField
                label={editingAdmin ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}
                type="password"
                fullWidth
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingAdmin}
                helperText="Minimal 6 karakter"
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  renderValue={(selected) => {
                    const option = ROLE_OPTIONS.find((r) => r.value === selected);
                    return option?.label || selected;
                  }}
                >
                  {ROLE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box>
                        <Typography>{option.label}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {option.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {formData.role !== 'SUPER_ADMIN' && (
              <>
                <Alert severity="info" sx={{ mb: 1 }}>
                  Untuk Branch Admin, pilih cabang dan menu yang dapat diakses
                </Alert>

                <FormControl fullWidth>
                  <InputLabel>Akses Cabang</InputLabel>
                  <Select
                    multiple
                    value={formData.branchIds}
                    onChange={(e) => setFormData({ ...formData, branchIds: e.target.value as string[] })}
                    input={<OutlinedInput label="Akses Cabang" />}
                    renderValue={(selected) =>
                      branches
                        .filter((b) => selected.includes(b.id))
                        .map((b) => b.name)
                        .join(', ')
                    }
                  >
                    {branches.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        <Checkbox checked={formData.branchIds?.includes(branch.id) || false} />
                        <ListItemText primary={branch.name} secondary={branch.code} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Akses Menu</InputLabel>
                  <Select
                    multiple
                    value={formData.allowedMenus}
                    onChange={(e) => setFormData({ ...formData, allowedMenus: e.target.value as string[] })}
                    input={<OutlinedInput label="Akses Menu" />}
                    renderValue={(selected) =>
                      menuOptions
                        .filter((m) => selected.includes(m.key))
                        .map((m) => m.label)
                        .join(', ')
                    }
                  >
                    {menuOptions.map((menu) => (
                      <MenuItem key={menu.key} value={menu.key}>
                        <Checkbox checked={formData.allowedMenus?.includes(menu.key) || false} />
                        <ListItemText primary={menu.label} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}

            {editingAdmin && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Aktif"
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
            disabled={!formData.name.trim() || !formData.email.trim()}
          >
            {editingAdmin ? 'Update' : 'Tambah'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
