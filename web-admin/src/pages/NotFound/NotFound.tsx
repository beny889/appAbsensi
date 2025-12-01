import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        px: 3,
      }}
    >
      <Typography
        variant="h1"
        color="primary"
        sx={{ fontSize: { xs: '80px', sm: '120px' }, fontWeight: 'bold', mb: 2 }}
      >
        404
      </Typography>
      <Typography variant="h5" sx={{ mb: 1, color: 'text.primary' }}>
        Halaman tidak ditemukan
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400 }}>
        Halaman yang Anda cari tidak ada atau telah dipindahkan.
      </Typography>
      <Button
        variant="contained"
        size="large"
        startIcon={<HomeIcon />}
        onClick={() => navigate('/')}
      >
        Kembali ke Dashboard
      </Button>
    </Box>
  );
};

export default NotFound;
