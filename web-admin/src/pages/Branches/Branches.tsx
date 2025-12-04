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
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Key as KeyIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { branchApi, deviceBindingApi } from '@/api';
import { authApi } from '@/api/auth';
import { Branch, CreateBranchDto, DeviceBinding } from '@/types';
import { usePageTitle } from '@/contexts/PageTitleContext';
import toast from 'react-hot-toast';

export default function Branches() {
  const userRole = authApi.getUserRole();
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<CreateBranchDto>({
    name: '',
    code: '',
    address: '',
    city: '',
    isActive: true,
  });

  // Binding codes state
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);
  const [bindingsMap, setBindingsMap] = useState<Record<string, DeviceBinding[]>>({});
  const [loadingBindings, setLoadingBindings] = useState<string | null>(null);
  const [deleteBindingDialog, setDeleteBindingDialog] = useState<{
    open: boolean;
    binding: DeviceBinding | null;
  }>({ open: false, binding: null });
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingBinding, setDeletingBinding] = useState(false);

  usePageTitle('Manajemen Cabang', 'Kelola cabang untuk karyawan dan departemen');

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const data = await branchApi.getAll();
      setBranches(data);
    } catch (error) {
      toast.error('Gagal memuat data cabang');
    } finally {
      setLoading(false);
    }
  };

  const loadBindings = async (branchId: string) => {
    if (bindingsMap[branchId]) return; // Already loaded

    setLoadingBindings(branchId);
    try {
      const bindings = await deviceBindingApi.getByBranch(branchId);
      setBindingsMap((prev) => ({ ...prev, [branchId]: bindings }));
    } catch (error) {
      toast.error('Gagal memuat binding codes');
    } finally {
      setLoadingBindings(null);
    }
  };

  const handleExpandBranch = (branchId: string) => {
    if (expandedBranch === branchId) {
      setExpandedBranch(null);
    } else {
      setExpandedBranch(branchId);
      if (isSuperAdmin) {
        loadBindings(branchId);
      }
    }
  };

  const handleGenerateBinding = async (branchId: string) => {
    try {
      const newBinding = await deviceBindingApi.create({ branchId });
      setBindingsMap((prev) => ({
        ...prev,
        [branchId]: [newBinding, ...(prev[branchId] || [])],
      }));
      toast.success(`Binding code ${newBinding.code} berhasil dibuat`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Gagal membuat binding code';
      toast.error(errorMsg);
    }
  };

  const handleToggleBinding = async (binding: DeviceBinding) => {
    try {
      const result = await deviceBindingApi.toggle(binding.id, !binding.isActive);
      setBindingsMap((prev) => ({
        ...prev,
        [binding.branchId]: prev[binding.branchId].map((b) =>
          b.id === binding.id ? { ...b, isActive: result.isActive } : b
        ),
      }));
      toast.success(result.message);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Gagal mengubah status binding';
      toast.error(errorMsg);
    }
  };

  const handleDeleteBindingClick = (binding: DeviceBinding) => {
    setDeleteBindingDialog({ open: true, binding });
    setDeletePassword('');
  };

  const handleDeleteBindingConfirm = async () => {
    if (!deleteBindingDialog.binding || !deletePassword) return;

    setDeletingBinding(true);
    try {
      await deviceBindingApi.delete(deleteBindingDialog.binding.id, deletePassword);
      const branchId = deleteBindingDialog.binding.branchId;
      setBindingsMap((prev) => ({
        ...prev,
        [branchId]: prev[branchId].filter((b) => b.id !== deleteBindingDialog.binding!.id),
      }));
      toast.success('Binding code berhasil dihapus');
      setDeleteBindingDialog({ open: false, binding: null });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Gagal menghapus binding code';
      toast.error(errorMsg);
    } finally {
      setDeletingBinding(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Kode ${code} disalin ke clipboard`);
  };

  const handleOpenDialog = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name,
        code: branch.code,
        address: branch.address || '',
        city: branch.city || '',
        isActive: branch.isActive,
      });
    } else {
      setEditingBranch(null);
      setFormData({
        name: '',
        code: '',
        address: '',
        city: '',
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBranch(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Nama cabang harus diisi');
      return;
    }

    if (!formData.code.trim()) {
      toast.error('Kode cabang harus diisi');
      return;
    }

    try {
      if (editingBranch) {
        await branchApi.update(editingBranch.id, formData);
        toast.success('Cabang berhasil diupdate');
      } else {
        await branchApi.create(formData);
        toast.success('Cabang berhasil ditambahkan');
      }
      handleCloseDialog();
      loadBranches();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Terjadi kesalahan';
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id: string, name: string, userCount: number, deptCount: number) => {
    if (userCount > 0) {
      toast.error(`Tidak dapat menghapus cabang. Masih ada ${userCount} karyawan yang terdaftar.`);
      return;
    }

    if (deptCount > 0) {
      toast.error(`Tidak dapat menghapus cabang. Masih ada ${deptCount} departemen yang terdaftar.`);
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus cabang ${name}?`)) {
      try {
        await branchApi.delete(id);
        toast.success('Cabang berhasil dihapus');
        loadBranches();
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || 'Gagal menghapus cabang';
        toast.error(errorMsg);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Tambah Cabang
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {isSuperAdmin && <TableCell width={50} />}
              <TableCell><strong>Nama Cabang</strong></TableCell>
              <TableCell><strong>Kode</strong></TableCell>
              <TableCell><strong>Kota</strong></TableCell>
              <TableCell><strong>Jumlah Karyawan</strong></TableCell>
              <TableCell><strong>Jumlah Departemen</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Aksi</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {branches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSuperAdmin ? 8 : 7} align="center">
                  <Typography variant="body2" color="textSecondary" py={3}>
                    Belum ada cabang yang terdaftar
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              branches.map((branch) => (
                <>
                  <TableRow key={branch.id} hover>
                    {isSuperAdmin && (
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleExpandBranch(branch.id)}
                        >
                          {expandedBranch === branch.id ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                      </TableCell>
                    )}
                    <TableCell>
                      <Typography fontWeight={500}>{branch.name}</Typography>
                      {branch.address && (
                        <Typography variant="caption" color="textSecondary" display="block">
                          {branch.address}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={branch.code} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {branch.city || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={branch._count?.users || 0}
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={branch._count?.departments || 0}
                        color="secondary"
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {branch.isActive ? (
                        <Chip label="Aktif" color="success" size="small" />
                      ) : (
                        <Chip label="Tidak Aktif" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(branch)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(
                          branch.id,
                          branch.name,
                          branch._count?.users || 0,
                          branch._count?.departments || 0
                        )}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  {/* Expandable Binding Codes Section (SUPER_ADMIN only) */}
                  {isSuperAdmin && (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ py: 0, borderBottom: expandedBranch === branch.id ? undefined : 'none' }}>
                        <Collapse in={expandedBranch === branch.id} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                              <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <KeyIcon fontSize="small" />
                                Binding Codes
                              </Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => handleGenerateBinding(branch.id)}
                              >
                                Generate Code
                              </Button>
                            </Box>

                            {loadingBindings === branch.id ? (
                              <Box display="flex" justifyContent="center" py={2}>
                                <CircularProgress size={24} />
                              </Box>
                            ) : (bindingsMap[branch.id]?.length || 0) === 0 ? (
                              <Typography variant="body2" color="textSecondary" textAlign="center" py={2}>
                                Belum ada binding code. Klik "Generate Code" untuk membuat.
                              </Typography>
                            ) : (
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell><strong>Kode</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                    <TableCell><strong>Device</strong></TableCell>
                                    <TableCell><strong>Dibuat</strong></TableCell>
                                    <TableCell align="center"><strong>Aktif</strong></TableCell>
                                    <TableCell align="center"><strong>Hapus</strong></TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {bindingsMap[branch.id]?.map((binding) => (
                                    <TableRow key={binding.id}>
                                      <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                          <Chip
                                            label={binding.code}
                                            color="primary"
                                            variant="outlined"
                                            sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                                          />
                                          <Tooltip title="Salin kode">
                                            <IconButton
                                              size="small"
                                              onClick={() => handleCopyCode(binding.code)}
                                            >
                                              <CopyIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        </Box>
                                      </TableCell>
                                      <TableCell>
                                        {binding.usedAt ? (
                                          <Chip
                                            label="Digunakan"
                                            color="info"
                                            size="small"
                                          />
                                        ) : (
                                          <Chip
                                            label="Tersedia"
                                            color="success"
                                            size="small"
                                          />
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {binding.deviceName ? (
                                          <Typography variant="body2">
                                            {binding.deviceName}
                                          </Typography>
                                        ) : (
                                          <Typography variant="body2" color="textSecondary">
                                            -
                                          </Typography>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2" color="textSecondary">
                                          {formatDate(binding.createdAt)}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Switch
                                          size="small"
                                          checked={binding.isActive}
                                          onChange={() => handleToggleBinding(binding)}
                                          color="success"
                                        />
                                      </TableCell>
                                      <TableCell align="center">
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleDeleteBindingClick(binding)}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Branch Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBranch ? 'Edit Cabang' : 'Tambah Cabang'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nama Cabang"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Contoh: Cabang Jakarta Pusat"
            />
            <TextField
              label="Kode Cabang"
              fullWidth
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
              placeholder="Contoh: JKT, SBY, BDG"
              helperText="Kode singkat untuk identifikasi cabang (akan diubah ke huruf besar)"
            />
            <TextField
              label="Alamat (Optional)"
              fullWidth
              multiline
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Alamat lengkap cabang"
            />
            <TextField
              label="Kota (Optional)"
              fullWidth
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Contoh: Jakarta, Surabaya, Bandung"
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
            disabled={!formData.name.trim() || !formData.code.trim()}
          >
            {editingBranch ? 'Update' : 'Tambah'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Binding Dialog */}
      <Dialog
        open={deleteBindingDialog.open}
        onClose={() => setDeleteBindingDialog({ open: false, binding: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Hapus Binding Code</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Anda akan menghapus binding code:
          </Typography>
          <Chip
            label={deleteBindingDialog.binding?.code}
            color="error"
            sx={{ fontFamily: 'monospace', fontWeight: 'bold', my: 1 }}
          />
          {deleteBindingDialog.binding?.deviceName && (
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Device: {deleteBindingDialog.binding.deviceName}
            </Typography>
          )}
          <Typography variant="body2" color="error" sx={{ mt: 2, mb: 2 }}>
            Jika binding code ini sedang digunakan, device tidak akan bisa mengakses aplikasi lagi.
          </Typography>
          <TextField
            label="Masukkan Password Anda"
            type="password"
            fullWidth
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Password untuk konfirmasi"
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteBindingDialog({ open: false, binding: null })}
            disabled={deletingBinding}
          >
            Batal
          </Button>
          <Button
            onClick={handleDeleteBindingConfirm}
            variant="contained"
            color="error"
            disabled={!deletePassword || deletingBinding}
          >
            {deletingBinding ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
