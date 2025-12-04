import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import { reportsApi, employeesApi, branchApi, authApi } from '@/api';
import { Employee, EmployeeDetailReport as EmployeeDetailReportType, Branch } from '@/types';
import { usePageTitle } from '@/contexts/PageTitleContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export default function EmployeeDetailReport() {
  const isSuperAdmin = authApi.getUserRole() === 'SUPER_ADMIN';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const today = format(new Date(), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [report, setReport] = useState<EmployeeDetailReportType | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');

  usePageTitle('Laporan Detail Karyawan', 'Lihat detail absensi per karyawan dalam rentang waktu tertentu');

  useEffect(() => {
    loadEmployees();
    if (isSuperAdmin) {
      branchApi.getAll().then(setBranches).catch(() => {});
    }
  }, [isSuperAdmin]);

  // Filter employees by selected branch
  const filteredEmployees = selectedBranchId
    ? employees.filter(emp => emp.branchId === selectedBranchId)
    : employees;

  const loadEmployees = async () => {
    try {
      const data = await employeesApi.getAll();
      // Show all active users (employees get attendance records)
      const activeEmployees = data.filter(emp => emp.isActive !== false);
      setEmployees(activeEmployees);
    } catch (error) {
      toast.error('Gagal memuat daftar karyawan');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleQuickFilter = (type: 'this_month' | 'last_month' | 'three_months') => {
    const today = new Date();
    let start: Date;
    let end: Date;

    switch (type) {
      case 'this_month':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'last_month':
        const lastMonth = subMonths(today, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case 'three_months':
        start = startOfMonth(subMonths(today, 2));
        end = endOfMonth(today);
        break;
    }

    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  };

  const loadReport = async () => {
    if (!selectedEmployeeId) {
      toast.error('Pilih karyawan terlebih dahulu');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Pilih rentang tanggal');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Tanggal mulai harus sebelum tanggal akhir');
      return;
    }

    setLoading(true);
    try {
      const data = await reportsApi.getEmployeeDetailReport(selectedEmployeeId, startDate, endDate, selectedBranchId || undefined);
      setReport(data);
      if (data.dailyRecords.length === 0) {
        toast.error('Tidak ada data untuk periode ini');
      }
    } catch (error) {
      toast.error('Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Chip label="Hadir" size="small" sx={{ bgcolor: '#c8e6c9', color: '#2e7d32' }} />;
      case 'LATE':
        return <Chip label="Terlambat" size="small" sx={{ bgcolor: '#fff9c4', color: '#f57f17' }} />;
      case 'EARLY':
        return <Chip label="Pulang Awal" size="small" sx={{ bgcolor: '#ffcc80', color: '#e65100' }} />;
      case 'ABSENT':
        return <Chip label="Tidak Hadir" size="small" sx={{ bgcolor: '#ffcdd2', color: '#c62828' }} />;
      case 'HOLIDAY':
        return <Chip label="Libur" size="small" sx={{ bgcolor: '#e0e0e0', color: '#666' }} />;
      case 'FUTURE':
        return <Chip label="-" size="small" sx={{ bgcolor: '#f5f5f5', color: '#999' }} />;
      default:
        return <Chip label="-" size="small" />;
    }
  };

  const formatTime = (isoString: string | null | undefined) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return format(date, 'HH:mm');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy');
  };

  const getKeterangan = (record: EmployeeDetailReportType['dailyRecords'][0]) => {
    if (record.status === 'HOLIDAY') return record.holidayName || 'Hari Libur';
    if (record.status === 'ABSENT') return 'Tidak hadir';
    if (record.status === 'FUTURE') return '-';

    const parts: string[] = [];
    if (record.checkIn?.isLate && record.checkIn.lateMinutes > 0) {
      parts.push(`Telat ${record.checkIn.lateMinutes} menit`);
    }
    if (record.checkOut?.isEarly && record.checkOut.earlyMinutes > 0) {
      parts.push(`Pulang awal ${record.checkOut.earlyMinutes} menit`);
    }
    if (parts.length === 0 && record.status === 'PRESENT') {
      return 'Tepat waktu';
    }
    return parts.join(', ') || '-';
  };

  const generatePDF = () => {
    if (!report) {
      toast.error('Tampilkan data terlebih dahulu');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(16);
    doc.text('LAPORAN DETAIL KEHADIRAN KARYAWAN', pageWidth / 2, 15, { align: 'center' });

    // Employee info
    doc.setFontSize(11);
    doc.text(`Nama: ${report.user.name}`, 14, 28);
    doc.text(`Departemen: ${report.user.department}`, 14, 34);
    doc.text(`Periode: ${formatDate(report.period.startDate)} - ${formatDate(report.period.endDate)}`, 14, 40);

    // Summary
    doc.setFontSize(10);
    doc.text(`Hari Kerja: ${report.summary.workingDays}`, 14, 50);
    doc.text(`Hadir: ${report.summary.presentDays}`, 60, 50);
    doc.text(`Terlambat: ${report.summary.lateDays}`, 100, 50);
    doc.text(`Pulang Awal: ${report.summary.earlyDays}`, 140, 50);
    doc.text(`Tidak Hadir: ${report.summary.absentDays}`, 14, 56);
    doc.text(`Kehadiran: ${report.summary.attendanceRate.toFixed(1)}%`, 60, 56);

    // Table
    const tableData = report.dailyRecords
      .filter(r => r.status !== 'FUTURE')
      .map(record => [
        formatDate(record.date),
        record.dayName,
        formatTime(record.checkIn?.time),
        formatTime(record.checkOut?.time),
        record.status === 'PRESENT' ? 'Hadir' :
          record.status === 'LATE' ? 'Terlambat' :
          record.status === 'EARLY' ? 'Pulang Awal' :
          record.status === 'ABSENT' ? 'Tidak Hadir' :
          record.status === 'HOLIDAY' ? 'Libur' : '-',
        getKeterangan(record),
      ]);

    autoTable(doc, {
      startY: 62,
      head: [['Tanggal', 'Hari', 'Masuk', 'Pulang', 'Status', 'Keterangan']],
      body: tableData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [33, 150, 243] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 62;
    doc.setFontSize(8);
    doc.text(`Dicetak: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, finalY + 10);

    doc.save(`laporan-${report.user.name.replace(/\s+/g, '-')}-${report.period.startDate}-${report.period.endDate}.pdf`);
    toast.success('PDF berhasil didownload');
  };

  return (
    <Box>
      {/* Filter Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {isSuperAdmin && (
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label="Filter Cabang"
                value={selectedBranchId}
                onChange={(e) => { setSelectedBranchId(e.target.value); setSelectedEmployeeId(''); setReport(null); }}
                size="small"
              >
                <MenuItem value="">Semua Cabang</MenuItem>
                {branches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          )}
          <Grid item xs={12} sm={6} md={isSuperAdmin ? 3 : 3}>
            <TextField
              fullWidth
              select
              label="Pilih Karyawan"
              value={selectedEmployeeId}
              onChange={(e) => { setSelectedEmployeeId(e.target.value); setReport(null); }}
              size="small"
              disabled={loadingEmployees}
            >
              {loadingEmployees ? (
                <MenuItem value="">Loading...</MenuItem>
              ) : (
                filteredEmployees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name} {emp.department ? `(${emp.department.name})` : ''}
                  </MenuItem>
                ))
              )}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField
              fullWidth
              select
              label="Periode"
              value=""
              onChange={(e) => {
                const val = e.target.value as 'this_month' | 'last_month' | 'three_months';
                if (val) handleQuickFilter(val);
              }}
              size="small"
            >
              <MenuItem value="this_month">Bulan Ini</MenuItem>
              <MenuItem value="last_month">Bulan Lalu</MenuItem>
              <MenuItem value="three_months">3 Bulan Terakhir</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Tanggal Mulai"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Tanggal Akhir"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PreviewIcon />}
                onClick={loadReport}
                disabled={loading}
              >
                Tampilkan
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<PdfIcon />}
                onClick={generatePDF}
                disabled={!report}
                sx={{ minWidth: 'auto', px: 2 }}
              >
                PDF
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      {report && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Hari Kerja</Typography>
              <Typography variant="h5" fontWeight="bold">{report.summary.workingDays}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e9' }}>
              <Typography variant="caption" color="text.secondary">Hadir</Typography>
              <Typography variant="h5" fontWeight="bold" color="success.main">{report.summary.presentDays}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff8e1' }}>
              <Typography variant="caption" color="text.secondary">Terlambat</Typography>
              <Typography variant="h5" fontWeight="bold" color="warning.main">{report.summary.lateDays}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0' }}>
              <Typography variant="caption" color="text.secondary">Pulang Awal</Typography>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#e65100' }}>{report.summary.earlyDays}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#ffebee' }}>
              <Typography variant="caption" color="text.secondary">Tidak Hadir</Typography>
              <Typography variant="h5" fontWeight="bold" color="error.main">{report.summary.absentDays}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
              <Typography variant="caption" color="text.secondary">Kehadiran</Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                {report.summary.attendanceRate.toFixed(1)}%
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Employee Info */}
      {report && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1">
            <strong>{report.user.name}</strong> - {report.user.department}
            {report.user.position !== '-' && ` (${report.user.position})`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Periode: {formatDate(report.period.startDate)} - {formatDate(report.period.endDate)}
          </Typography>
        </Paper>
      )}

      {/* Daily Records Table */}
      {report && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Tanggal</strong></TableCell>
                <TableCell><strong>Hari</strong></TableCell>
                <TableCell><strong>Masuk</strong></TableCell>
                <TableCell><strong>Pulang</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Keterangan</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.dailyRecords
                .filter(r => r.status !== 'FUTURE')
                .map((record) => (
                  <TableRow
                    key={record.date}
                    sx={{
                      bgcolor: record.status === 'HOLIDAY' ? '#fafafa' : 'inherit',
                      '&:hover': { bgcolor: '#f5f5f5' }
                    }}
                  >
                    <TableCell>{formatDate(record.date)}</TableCell>
                    <TableCell>{record.dayName}</TableCell>
                    <TableCell>
                      {formatTime(record.checkIn?.time)}
                      {record.checkIn?.isLate && (
                        <Typography component="span" variant="caption" color="warning.main" sx={{ ml: 0.5 }}>
                          (+{record.checkIn.lateMinutes}m)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatTime(record.checkOut?.time)}
                      {record.checkOut?.isEarly && (
                        <Typography component="span" variant="caption" color="error.main" sx={{ ml: 0.5 }}>
                          (-{record.checkOut.earlyMinutes}m)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{getStatusChip(record.status)}</TableCell>
                    <TableCell>{getKeterangan(record)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty State */}
      {!loading && !report && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Pilih karyawan dan rentang tanggal, lalu klik "Tampilkan" untuk melihat laporan
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
