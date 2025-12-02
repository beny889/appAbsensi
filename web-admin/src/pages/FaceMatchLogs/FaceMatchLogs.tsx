import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  CheckCircle as SuccessIcon,
  Cancel as FailIcon,
  Login as CheckInIcon,
  Logout as CheckOutIcon,
} from '@mui/icons-material';
import { faceMatchApi } from '@/api';
import { FaceMatchAttempt, UserMatchInfo } from '@/types';
import { usePageTitle } from '@/contexts/PageTitleContext';

const FaceMatchLogs: React.FC = () => {
  const [attempts, setAttempts] = useState<FaceMatchAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // Detail dialog
  const [selectedAttempt, setSelectedAttempt] = useState<FaceMatchAttempt | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  usePageTitle('Face Match Logs', 'Log percobaan face matching untuk debugging');

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await faceMatchApi.getAttempts(page + 1, rowsPerPage);
      setAttempts(response.data);
      setTotalCount(response.meta.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, [page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetail = (attempt: FaceMatchAttempt) => {
    setSelectedAttempt(attempt);
    setDetailOpen(true);
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const parseAllMatches = (jsonStr: string): UserMatchInfo[] => {
    try {
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  };

  if (loading && attempts.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ width: 60 }}>No</TableCell>
                <TableCell>Waktu</TableCell>
                <TableCell>Tipe</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Matched User</TableCell>
                <TableCell align="right">Threshold</TableCell>
                <TableCell align="right">Best Distance</TableCell>
                <TableCell align="right">Best Similarity</TableCell>
                <TableCell align="right">Users Compared</TableCell>
                <TableCell align="center">Detail</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attempts.map((attempt, index) => (
                <TableRow key={attempt.id} hover>
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {page * rowsPerPage + index + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDateTime(attempt.createdAt)}</TableCell>
                  <TableCell>
                    <Chip
                      icon={attempt.attemptType === 'CHECK_IN' ? <CheckInIcon /> : <CheckOutIcon />}
                      label={attempt.attemptType === 'CHECK_IN' ? 'Masuk' : 'Pulang'}
                      size="small"
                      color={attempt.attemptType === 'CHECK_IN' ? 'primary' : 'secondary'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={attempt.success ? <SuccessIcon /> : <FailIcon />}
                      label={attempt.success ? 'Berhasil' : 'Gagal'}
                      size="small"
                      color={attempt.success ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>
                    {attempt.matchedUserName || '-'}
                  </TableCell>
                  <TableCell align="right">
                    {(attempt.threshold * 100).toFixed(0)}%
                  </TableCell>
                  <TableCell align="right">
                    {attempt.bestDistance?.toFixed(4) || '-'}
                  </TableCell>
                  <TableCell align="right">
                    {attempt.bestSimilarity ? `${attempt.bestSimilarity.toFixed(1)}%` : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {attempt.totalUsersCompared}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Lihat Detail">
                      <IconButton size="small" onClick={() => handleViewDetail(attempt)}>
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {attempts.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    Belum ada data face match log
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Baris per halaman:"
        />
      </Paper>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detail Face Match Attempt
        </DialogTitle>
        <DialogContent dividers>
          {selectedAttempt && (
            <Box>
              {/* Summary */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="textSecondary">Summary</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Waktu</Typography>
                    <Typography>{formatDateTime(selectedAttempt.createdAt)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Tipe</Typography>
                    <Chip
                      label={selectedAttempt.attemptType === 'CHECK_IN' ? 'Masuk' : 'Pulang'}
                      size="small"
                      color={selectedAttempt.attemptType === 'CHECK_IN' ? 'primary' : 'secondary'}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Status</Typography>
                    <Chip
                      label={selectedAttempt.success ? 'Berhasil' : 'Gagal'}
                      size="small"
                      color={selectedAttempt.success ? 'success' : 'error'}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Threshold</Typography>
                    <Typography>{(selectedAttempt.threshold * 100).toFixed(0)}%</Typography>
                  </Box>
                  {selectedAttempt.matchedUserName && (
                    <Box>
                      <Typography variant="body2" color="textSecondary">Matched User</Typography>
                      <Typography>{selectedAttempt.matchedUserName}</Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="body2" color="textSecondary">Total Users Compared</Typography>
                    <Typography>{selectedAttempt.totalUsersCompared}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* All Matches Table */}
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                Semua Perbandingan (diurutkan dari paling mirip)
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Nama</TableCell>
                      <TableCell align="right">Distance</TableCell>
                      <TableCell align="right">Similarity</TableCell>
                      <TableCell align="center">Embeddings</TableCell>
                      <TableCell align="center">Match?</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parseAllMatches(selectedAttempt.allMatches).map((match, index) => (
                      <TableRow
                        key={match.odId}
                        sx={{
                          backgroundColor: match.isMatch ? 'success.light' : 'inherit',
                          '&:hover': { backgroundColor: match.isMatch ? 'success.main' : 'action.hover' }
                        }}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          {match.name}
                          {match.isMatch && (
                            <Chip
                              label="MATCH"
                              size="small"
                              color="success"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">{match.distance.toFixed(4)}</TableCell>
                        <TableCell align="right">{match.similarity}%</TableCell>
                        <TableCell align="center">
                          <Tooltip title={`${match.embeddingsCount || 1} embedding(s) digunakan untuk pencocokan`}>
                            <Chip
                              label={match.embeddingsCount || 1}
                              size="small"
                              color={match.embeddingsCount && match.embeddingsCount > 1 ? 'info' : 'default'}
                              variant={match.embeddingsCount && match.embeddingsCount > 1 ? 'filled' : 'outlined'}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center">
                          {match.isMatch ? (
                            <SuccessIcon color="success" />
                          ) : (
                            <FailIcon color="disabled" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FaceMatchLogs;
