import { useState, useEffect, useMemo } from 'react';
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
  Store as StoreIcon,
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

// Menu items with keys matching backend's getAvailableMenus()
const menuItems = [
  { key: 'dashboard', text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { key: 'employees', text: 'Karyawan', icon: <PeopleIcon />, path: '/employees' },
  { key: 'attendance', text: 'Absensi', icon: <AssignmentIcon />, path: '/attendance' },
  { key: 'face-registration', text: 'Pendaftaran Wajah', icon: <FaceIcon />, path: '/face-registration/pending' },
  { key: 'branches', text: 'Cabang', icon: <StoreIcon />, path: '/branches' },
  { key: 'departments', text: 'Departemen', icon: <BusinessIcon />, path: '/departments' },
  { key: 'work-schedules', text: 'Jadwal Kerja', icon: <ScheduleIcon />, path: '/work-schedules' },
  { key: 'holidays', text: 'Hari Libur', icon: <CalendarIcon />, path: '/holidays' },
];

const reportSubItems = [
  { text: 'Harian', icon: <TodayIcon />, path: '/reports/daily' },
  { text: 'Bulanan', icon: <DateRangeIcon />, path: '/reports/monthly' },
  { text: 'Detail Karyawan', icon: <PersonIcon />, path: '/reports/employee-detail' },
];

const bottomMenuItems = [
  { key: 'face-match-logs', text: 'Face Match Logs', icon: <BugReportIcon />, path: '/face-match-logs' },
  { key: 'admin-users', text: 'Manajemen Admin', icon: <PersonIcon />, path: '/admin-users' },
  { key: 'settings', text: 'Pengaturan', icon: <SettingsIcon />, path: '/settings' },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [pendingRegistrationCount, setPendingRegistrationCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { title, description } = usePageTitle();

  // Get user role and allowed menus for filtering
  const userRole = authApi.getUserRole();
  const allowedMenus = authApi.getAllowedMenus();

  // Filter menu items based on user's allowed menus
  // SUPER_ADMIN sees all menus, others see only allowed menus
  const filteredMenuItems = useMemo(() => {
    if (userRole === 'SUPER_ADMIN' || !allowedMenus) {
      return menuItems;
    }
    return menuItems.filter((item) => allowedMenus.includes(item.key));
  }, [userRole, allowedMenus]);

  const filteredBottomMenuItems = useMemo(() => {
    if (userRole === 'SUPER_ADMIN' || !allowedMenus) {
      return bottomMenuItems;
    }
    return bottomMenuItems.filter((item) => allowedMenus.includes(item.key));
  }, [userRole, allowedMenus]);

  const showReportsMenu = useMemo(() => {
    if (userRole === 'SUPER_ADMIN' || !allowedMenus) {
      return true;
    }
    return allowedMenus.includes('reports');
  }, [userRole, allowedMenus]);

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
          {filteredMenuItems.map((item) => (
            <ListItem key={item.key} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>
                  {item.key === 'face-registration' ? (
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

          {/* Reports menu with collapse - only shown if user has access */}
          {showReportsMenu && (
            <>
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
            </>
          )}

          {/* Bottom menu items (Settings, Face Match Logs, Admin Management) */}
          {filteredBottomMenuItems.map((item) => (
            <ListItem key={item.key} disablePadding>
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
