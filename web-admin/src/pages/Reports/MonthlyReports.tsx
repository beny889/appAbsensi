import { useState } from 'react';
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
  Tooltip,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import { reportsApi, MonthlyAttendanceGrid, EmployeeGridData } from '@/api';
import { usePageTitle } from '@/contexts/PageTitleContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function MonthlyReports() {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear().toString());
  const [month, setMonth] = useState((currentDate.getMonth() + 1).toString());
  const [loading, setLoading] = useState(false);
  const [gridData, setGridData] = useState<MonthlyAttendanceGrid | null>(null);

  usePageTitle('Laporan Bulanan', 'Preview dan download laporan kehadiran karyawan per bulan');

  const loadPreview = async () => {
    if (!year || !month) {
      toast.error('Pilih tahun dan bulan terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      const data = await reportsApi.getMonthlyGrid(parseInt(year), parseInt(month));
      setGridData(data);
      if (data.employees.length === 0) {
        toast.error('Tidak ada data karyawan untuk periode ini');
      }
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const getDayOfWeek = (day: number): string => {
    const date = new Date(parseInt(year), parseInt(month) - 1, day);
    return DAY_NAMES[date.getDay()];
  };

  const getStatusCell = (emp: EmployeeGridData, dayIndex: number) => {
    const day = emp.dailyStatus[dayIndex];
    if (!day) return { text: '', indicator: '', bg: 'inherit', color: 'inherit' };

    // Build indicator: @ = telat, # = pulang awal
    const indicators: string[] = [];
    if (day.isLate) indicators.push('@');
    if (day.isEarly) indicators.push('#');
    const indicator = indicators.join(' ');

    if (day.isWeekend) {
      return { text: 'L', indicator: '', bg: '#e0e0e0', color: '#666' };
    } else if (day.checkIn && day.checkOut) {
      return { text: 'H', indicator, bg: '#c8e6c9', color: '#2e7d32' };
    } else if (day.checkIn) {
      return { text: 'M', indicator: day.isLate ? '@' : '', bg: '#fff9c4', color: '#f57f17' };
    } else if (day.checkOut) {
      return { text: 'P', indicator: day.isEarly ? '#' : '', bg: '#b3e5fc', color: '#0277bd' };
    } else {
      return { text: '-', indicator: '', bg: '#ffcdd2', color: '#c62828' };
    }
  };

  const generatePDF = () => {
    if (!gridData || gridData.employees.length === 0) {
      toast.error('Tampilkan preview terlebih dahulu');
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const monthName = MONTH_NAMES[parseInt(month) - 1];
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Laporan Kehadiran Bulanan - ${monthName} ${year}`, pageWidth / 2, 15, { align: 'center' });

    // Subtitle
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Hari Kerja: ${gridData.workingDays} hari | Total Karyawan: ${gridData.employees.length}`, pageWidth / 2, 22, { align: 'center' });

    // Build table headers - use displayDays for dynamic columns
    const headers = ['Nama'];
    for (let d = 1; d <= gridData.displayDays; d++) {
      headers.push(d.toString());
    }
    headers.push('Frek\nTelat', 'Menit\nTelat', 'Frek\nP.Awal', 'Menit\nP.Awal', 'Tdk\nMasuk');

    // Build table body - use displayDays for dynamic columns
    const body = gridData.employees.map((emp) => {
      const row: string[] = [emp.name];

      // Only iterate up to displayDays
      for (let i = 0; i < gridData.displayDays; i++) {
        const day = emp.dailyStatus[i];
        if (!day) {
          row.push('');
        } else if (day.isWeekend) {
          row.push('L');
        } else if (day.checkIn && day.checkOut) {
          const parts = ['H'];
          if (day.isLate) parts.push('@');
          if (day.isEarly) parts.push('#');
          row.push(parts.join(' ').trim());
        } else if (day.checkIn) {
          row.push(day.isLate ? 'M @' : 'M');
        } else if (day.checkOut) {
          row.push(day.isEarly ? 'P #' : 'P');
        } else {
          row.push('-');
        }
      }

      row.push(
        emp.summary.lateCount.toString(),
        emp.summary.totalLateMinutes.toString(),
        emp.summary.earlyCount.toString(),
        emp.summary.totalEarlyMinutes.toString(),
        emp.summary.absentCount.toString()
      );

      return row;
    });

    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 28,
      theme: 'grid',
      styles: {
        fontSize: 6,
        cellPadding: 1,
        halign: 'center',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 6,
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 35 },
      },
      didParseCell: (data) => {
        // Color cells for date columns (1 to displayDays)
        if (data.section === 'body' && data.column.index > 0 && data.column.index <= gridData.displayDays) {
          const value = data.cell.raw as string;
          if (value === 'L') {
            data.cell.styles.fillColor = [220, 220, 220];
            data.cell.styles.textColor = [100, 100, 100];
          } else if (value.startsWith('H')) {
            data.cell.styles.fillColor = [212, 237, 218];
            data.cell.styles.textColor = [40, 167, 69];
          } else if (value.startsWith('M')) {
            data.cell.styles.fillColor = [255, 243, 205];
            data.cell.styles.textColor = [133, 100, 4];
          } else if (value.startsWith('P')) {
            data.cell.styles.fillColor = [209, 236, 241];
            data.cell.styles.textColor = [23, 162, 184];
          } else if (value === '-') {
            data.cell.styles.fillColor = [248, 215, 218];
            data.cell.styles.textColor = [220, 53, 69];
          }
        }
        // Bold for summary columns (after date columns)
        if (data.section === 'body' && data.column.index > gridData.displayDays) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { left: 10, right: 10 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Keterangan: H = Hadir, M = Masuk saja, P = Pulang saja, L = Libur, - = Tidak Hadir, @ = Terlambat, # = Pulang Awal', 10, finalY);

    doc.setFontSize(7);
    doc.text(`Digenerate pada: ${new Date().toLocaleString('id-ID')}`, 10, finalY + 5);

    doc.save(`Laporan_Kehadiran_${monthName}_${year}.pdf`);
    toast.success('PDF berhasil didownload');
  };

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="number"
              label="Tahun"
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setGridData(null);
              }}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              select
              label="Bulan"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setGridData(null);
              }}
              InputLabelProps={{ shrink: true }}
              SelectProps={{ native: true }}
              size="small"
            >
              {MONTH_NAMES.map((name, index) => (
                <option key={index + 1} value={index + 1}>
                  {name}
                </option>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={loadPreview}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PreviewIcon />}
            >
              {loading ? 'Loading...' : 'Tampilkan Preview'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              fullWidth
              variant="contained"
              color="error"
              onClick={generatePDF}
              disabled={!gridData || gridData.employees.length === 0}
              startIcon={<PdfIcon />}
            >
              Download PDF
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {gridData && gridData.employees.length > 0 && (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Preview: {MONTH_NAMES[parseInt(month) - 1]} {year}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Hari Kerja: {gridData.workingDays} hari | Total Karyawan: {gridData.employees.length}
            </Typography>
          </Box>

          <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 150, position: 'sticky', left: 0, zIndex: 3, bgcolor: 'background.paper' }}>
                    Nama
                  </TableCell>
                  {Array.from({ length: gridData.displayDays }, (_, i) => {
                    const dayNum = i + 1;
                    const dayName = getDayOfWeek(dayNum);
                    const isWeekend = dayName === 'Min' || dayName === 'Sab';
                    return (
                      <TableCell
                        key={dayNum}
                        align="center"
                        sx={{
                          fontWeight: 'bold',
                          minWidth: 30,
                          p: 0.5,
                          bgcolor: isWeekend ? '#f5f5f5' : 'background.paper',
                        }}
                      >
                        <Typography variant="caption" display="block">{dayNum}</Typography>
                        <Typography variant="caption" display="block" color="textSecondary" fontSize={9}>
                          {dayName}
                        </Typography>
                      </TableCell>
                    );
                  })}
                  <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 45, p: 0.5, bgcolor: '#e3f2fd' }}>
                    <Tooltip title="Frekuensi Telat"><span>Telat</span></Tooltip>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 45, p: 0.5, bgcolor: '#e3f2fd' }}>
                    <Tooltip title="Total Menit Telat"><span>Mnt</span></Tooltip>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 45, p: 0.5, bgcolor: '#fff3e0' }}>
                    <Tooltip title="Frekuensi Pulang Awal"><span>P.Awal</span></Tooltip>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 45, p: 0.5, bgcolor: '#fff3e0' }}>
                    <Tooltip title="Total Menit Pulang Awal"><span>Mnt</span></Tooltip>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 50, p: 0.5, bgcolor: '#ffebee' }}>
                    <Tooltip title="Tidak Masuk"><span>Absen</span></Tooltip>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gridData.employees.map((emp) => (
                  <TableRow key={emp.id} hover>
                    <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                      <Typography variant="body2" noWrap>{emp.name}</Typography>
                      <Typography variant="caption" color="textSecondary">{emp.department}</Typography>
                    </TableCell>
                    {Array.from({ length: gridData.displayDays }, (_, dayIndex) => {
                      const status = getStatusCell(emp, dayIndex);
                      return (
                        <TableCell
                          key={dayIndex}
                          align="center"
                          sx={{
                            p: 0.5,
                            bgcolor: status.bg,
                            color: status.color,
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                          }}
                        >
                          <Box sx={{ lineHeight: 1.1 }}>
                            {status.text}
                            {status.indicator && (
                              <Typography variant="caption" display="block" sx={{ fontSize: '0.6rem', color: '#d32f2f', lineHeight: 1 }}>
                                {status.indicator}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      );
                    })}
                    <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: emp.summary.lateCount > 0 ? '#e3f2fd' : 'inherit' }}>
                      {emp.summary.lateCount}
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: emp.summary.totalLateMinutes > 0 ? '#e3f2fd' : 'inherit' }}>
                      {emp.summary.totalLateMinutes}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: emp.summary.earlyCount > 0 ? '#fff3e0' : 'inherit' }}>
                      {emp.summary.earlyCount}
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: emp.summary.totalEarlyMinutes > 0 ? '#fff3e0' : 'inherit' }}>
                      {emp.summary.totalEarlyMinutes}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: emp.summary.absentCount > 0 ? '#ffebee' : 'inherit', color: emp.summary.absentCount > 0 ? '#c62828' : 'inherit' }}>
                      {emp.summary.absentCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight="medium" gutterBottom>
              Keterangan:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: '#c8e6c9', borderRadius: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold', color: '#2e7d32' }}>H</Box>
                <Typography variant="caption">Hadir (Masuk & Pulang)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: '#fff9c4', borderRadius: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold', color: '#f57f17' }}>M</Box>
                <Typography variant="caption">Masuk saja</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: '#b3e5fc', borderRadius: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold', color: '#0277bd' }}>P</Box>
                <Typography variant="caption">Pulang saja</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: '#e0e0e0', borderRadius: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold', color: '#666' }}>L</Box>
                <Typography variant="caption">Libur (Weekend/Hari Libur)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: '#ffcdd2', borderRadius: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold', color: '#c62828' }}>-</Box>
                <Typography variant="caption">Tidak Hadir</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" fontWeight="bold" sx={{ color: '#d32f2f', fontSize: 12 }}>@</Typography>
                <Typography variant="caption">Terlambat</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" fontWeight="bold" sx={{ color: '#d32f2f', fontSize: 12 }}>#</Typography>
                <Typography variant="caption">Pulang Awal</Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      )}

      {gridData && gridData.employees.length === 0 && (
        <Paper sx={{ mt: 2, p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            Tidak ada data karyawan untuk periode {MONTH_NAMES[parseInt(month) - 1]} {year}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
