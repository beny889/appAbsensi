import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  FaceRetouchingNatural as FaceIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ExpandLess,
  ExpandMore,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';
import { authApi } from '@/api/auth';
import { faceRegistrationApi } from '@/api';
import { usePageTitle } from '@/contexts/PageTitleContext';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Karyawan', icon: <PeopleIcon />, path: '/employees' },
  { text: 'Absensi', icon: <AssignmentIcon />, path: '/attendance' },
  { text: 'Pendaftaran Wajah', icon: <FaceIcon />, path: '/face-registration/pending' },
  { text: 'Departemen', icon: <BusinessIcon />, path: '/departments' },
  { text: 'Jadwal Kerja', icon: <ScheduleIcon />, path: '/work-schedules' },
  { text: 'Hari Libur', icon: <CalendarIcon />, path: '/holidays' },
];

const reportSubItems = [
  { text: 'Harian', icon: <TodayIcon />, path: '/reports/daily' },
  { text: 'Bulanan', icon: <DateRangeIcon />, path: '/reports/monthly' },
  { text: 'Detail Karyawan', icon: <PersonIcon />, path: '/reports/employee-detail' },
];

const bottomMenuItems = [
  { text: 'Face Match Logs', icon: <BugReportIcon />, path: '/face-match-logs' },
  { text: 'Pengaturan', icon: <SettingsIcon />, path: '/settings' },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [pendingRegistrationCount, setPendingRegistrationCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { title, description } = usePageTitle();

  // Auto-expand reports menu if current path is a report page
  useEffect(() => {
    if (location.pathname.startsWith('/reports')) {
      setReportsOpen(true);
    }
  }, [location.pathname]);

  // Fetch pending registration count
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const stats = await faceRegistrationApi.getStats();
        setPendingRegistrationCount(stats.pending || 0);
      } catch (error) {
        // Silently fail - don't show error toast for badge count
      }
    };

    fetchPendingCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleReportsClick = () => {
    setReportsOpen(!reportsOpen);
  };

  const handleLogout = () => {
    authApi.logout();
  };

  const isReportPath = location.pathname.startsWith('/reports');

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Fixed Header */}
      <Toolbar sx={{ gap: 1.5 }}>
        <Box
          component="img"
          src="/logo.png"
          alt="Logo"
          sx={{ width: 32, height: 32, borderRadius: '50%' }}
        />
        <Typography variant="h6" noWrap component="div">
          Absensi Admin
        </Typography>
      </Toolbar>
      <Divider />

      {/* Scrollable Menu */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List>
          {/* Regular menu items */}
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>
                  {item.text === 'Pendaftaran Wajah' ? (
                    <Badge
                      badgeContent={pendingRegistrationCount}
                      color="error"
                      max={99}
                      sx={{
                        '& .MuiBadge-badge': {
                          right: -3,
                          top: 3,
                          fontSize: '0.65rem',
                          minWidth: '18px',
                          height: '18px',
                        },
                      }}
                    >
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}

          {/* Reports menu with collapse */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleReportsClick}
              selected={isReportPath}
              sx={{
                bgcolor: isReportPath ? 'action.selected' : 'transparent',
              }}
            >
              <ListItemIcon>
                <AssessmentIcon color={isReportPath ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText
                primary="Laporan"
                primaryTypographyProps={{
                  fontWeight: isReportPath ? 600 : 400,
                }}
              />
              {reportsOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>
          <Collapse in={reportsOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {reportSubItems.map((item) => (
                <ListItemButton
                  key={item.text}
                  sx={{ pl: 4 }}
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontSize: '0.9rem' }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Collapse>

          {/* Bottom menu items (Settings) */}
          {bottomMenuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Fixed Logout */}
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box>
            <Typography variant="h6" noWrap component="div" fontWeight="bold">
              {title}
            </Typography>
            {description && (
              <Typography variant="caption" noWrap component="div" sx={{ opacity: 0.85, mt: -0.5 }}>
                {description}
              </Typography>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
