import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Slider,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Save as SaveIcon,
  Face as FaceIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { settingsApi } from '@/api';
import { usePageTitle } from '@/contexts/PageTitleContext';
import toast from 'react-hot-toast';

export default function Settings() {
  // Profile State
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // Similarity Threshold State
  const [threshold, setThreshold] = useState<number>(0.6);
  const [loadingThreshold, setLoadingThreshold] = useState(true);
  const [savingThreshold, setSavingThreshold] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  usePageTitle('Pengaturan', 'Konfigurasi sistem dan keamanan akun');

  useEffect(() => {
    loadProfile();
    loadThreshold();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await settingsApi.getProfile();
      setProfileName(profile.name);
      setProfileEmail(profile.email);
    } catch (error) {
      toast.error('Gagal memuat profil');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileEmail.trim()) {
      toast.error('Email tidak boleh kosong');
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await settingsApi.updateProfile({
        name: profileName,
        email: profileEmail,
      });
      setProfileName(updated.name);
      setProfileEmail(updated.email);
      toast.success('Profil berhasil disimpan');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Gagal menyimpan profil';
      toast.error(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const loadThreshold = async () => {
    try {
      const data = await settingsApi.getSimilarityThreshold();
      setThreshold(data.value);
    } catch (error) {
      toast.error('Gagal memuat pengaturan');
    } finally {
      setLoadingThreshold(false);
    }
  };

  const handleSaveThreshold = async () => {
    setSavingThreshold(true);
    try {
      await settingsApi.updateSimilarityThreshold(threshold);
      toast.success('Pengaturan similarity berhasil disimpan');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Gagal menyimpan pengaturan';
      toast.error(message);
    } finally {
      setSavingThreshold(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Semua field harus diisi');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password baru minimal 8 karakter');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(newPassword)) {
      toast.error('Password harus mengandung huruf besar, huruf kecil, dan angka');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Password baru dan konfirmasi tidak cocok');
      return;
    }

    setSavingPassword(true);
    try {
      await settingsApi.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success('Password berhasil diubah');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Gagal mengubah password';
      toast.error(message);
    } finally {
      setSavingPassword(false);
    }
  };

  // Distance threshold: lower = stricter (faces must be more similar)
  // Higher distance threshold = more lenient (allows less similar faces)
  const getThresholdLabel = (distance: number) => {
    if (distance >= 0.9) return 'Sangat Longgar';
    if (distance >= 0.7) return 'Longgar';
    if (distance >= 0.5) return 'Normal';
    if (distance >= 0.3) return 'Ketat';
    return 'Sangat Ketat';
  };

  const getThresholdColor = (distance: number) => {
    if (distance >= 0.9) return '#7b1fa2'; // purple - very lenient
    if (distance >= 0.7) return '#1976d2'; // blue - lenient
    if (distance >= 0.5) return '#388e3c'; // green - normal
    if (distance >= 0.3) return '#f57c00'; // orange - strict
    return '#d32f2f'; // red - very strict
  };

  // Convert to percentage for display (0.1 = 10%, 1.0 = 100%)
  const thresholdToPercent = (distance: number) => Math.round(distance * 100);

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Face Recognition Settings */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardHeader
              avatar={<FaceIcon sx={{ color: '#1976d2' }} />}
              title={<Typography variant="h6">Face Recognition</Typography>}
              subheader="Pengaturan pengenalan wajah"
            />
            <Divider />
            <CardContent>
              {loadingThreshold ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    <strong>Distance Threshold</strong> menentukan toleransi pencocokan wajah.
                    Nilai lebih tinggi = lebih longgar (toleransi lebih tinggi, mudah match).
                    Nilai lebih rendah = lebih ketat (wajah harus sangat mirip).
                  </Alert>

                  <Box sx={{ px: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Distance Threshold
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{ color: getThresholdColor(threshold) }}
                      >
                        {thresholdToPercent(threshold)}% - {getThresholdLabel(threshold)}
                      </Typography>
                    </Box>

                    <Slider
                      value={thresholdToPercent(threshold)}
                      onChange={(_, value) => setThreshold((value as number) / 100)}
                      min={10}
                      max={100}
                      step={5}
                      marks={[
                        { value: 10, label: '10%' },
                        { value: 30, label: '30%' },
                        { value: 50, label: '50%' },
                        { value: 70, label: '70%' },
                        { value: 100, label: '100%' },
                      ]}
                      sx={{
                        '& .MuiSlider-thumb': {
                          backgroundColor: getThresholdColor(threshold),
                        },
                        '& .MuiSlider-track': {
                          backgroundColor: getThresholdColor(threshold),
                        },
                      }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Ketat (Aman)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Longgar (Mudah)
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      startIcon={savingThreshold ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      onClick={handleSaveThreshold}
                      disabled={savingThreshold}
                    >
                      Simpan
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Settings */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardHeader
              avatar={<PersonIcon sx={{ color: '#1976d2' }} />}
              title={<Typography variant="h6">Profil Admin</Typography>}
              subheader="Ubah nama dan email login"
            />
            <Divider />
            <CardContent>
              {loadingProfile ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    fullWidth
                    label="Nama"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />

                  <TextField
                    fullWidth
                    label="Email (Username Login)"
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    helperText="Email ini digunakan untuk login"
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={savingProfile ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                    >
                      Simpan
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Change Password */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardHeader
              avatar={<LockIcon sx={{ color: '#d32f2f' }} />}
              title={<Typography variant="h6">Ganti Password</Typography>}
              subheader="Ubah password akun admin"
            />
            <Divider />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  fullWidth
                  label="Password Saat Ini"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          edge="end"
                        >
                          {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Password Baru"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  helperText="Minimal 8 karakter, huruf besar, huruf kecil, dan angka"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          edge="end"
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Konfirmasi Password Baru"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={confirmPassword !== '' && newPassword !== confirmPassword}
                  helperText={
                    confirmPassword !== '' && newPassword !== confirmPassword
                      ? 'Password tidak cocok'
                      : ''
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={savingPassword ? <CircularProgress size={20} color="inherit" /> : <LockIcon />}
                    onClick={handleChangePassword}
                    disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                  >
                    Ubah Password
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
