import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 3,
            textAlign: 'center',
            bgcolor: 'background.default',
          }}
        >
          <Typography variant="h4" gutterBottom color="error">
            Terjadi Kesalahan
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 400 }}>
            Maaf, terjadi kesalahan pada aplikasi. Silakan refresh halaman atau kembali ke dashboard.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleRefresh}
            >
              Refresh Halaman
            </Button>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={this.handleHome}
            >
              Ke Dashboard
            </Button>
          </Box>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
