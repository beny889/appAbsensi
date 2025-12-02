import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
} from '@mui/material';
import { authApi } from '@/api/auth';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Email dan password harus diisi');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      if (response.user.role !== 'ADMIN') {
        toast.error('Hanya admin yang dapat mengakses panel ini');
        authApi.logout();
        return;
      }
      toast.success('Login berhasil!');
      navigate('/');
    } catch (error: any) {
      // Error already handled by API interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: 400,
          px: 2,
        }}
      >
        {/* Logo */}
        <Box
          component="img"
          src="/logo.png"
          alt="Logo"
          sx={{
            width: 120,
            height: 120,
            mb: 2,
            borderRadius: '50%',
            backgroundColor: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
        />

        <Paper elevation={6} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom fontWeight="bold">
            Absensi Admin Panel
          </Typography>
          <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 3 }}>
            Silakan login untuk melanjutkan
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
          </Box>
        </Paper>

        {/* Footer */}
        <Typography
          variant="body2"
          sx={{
            mt: 4,
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
          }}
        >
          © 2025 Absensi System • v2.4.0
          <br />
          Created by Beny
        </Typography>
      </Box>
    </Box>
  );
}
