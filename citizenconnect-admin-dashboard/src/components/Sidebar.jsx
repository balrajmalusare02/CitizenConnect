import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Divider,
  Avatar,
  MenuItem,
  Select,
  FormControl,
  InputAdornment,
} from '@mui/material';
import {
  Dashboard,
  ReportProblem,
  Assessment,
  Logout,
  Person,
  Language,
  Map,
  Feedback,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/authService';
import { MapContainer } from 'react-leaflet';

const drawerWidth = 260;

const Sidebar = ({ currentPage, onPageChange, userRole }) => {
  const { t, i18n } = useTranslation();
  const user = authService.getCurrentUser();
  const [language, setLanguage] = useState(i18n.language);

  let menuItems = [
  { text: t('sidebar.dashboard'), icon: <Dashboard />, page: 'dashboard' },
  { text: t('sidebar.complaints'), icon: <ReportProblem />, page: 'complaints' },
];

// Only show Analytics to non-employees
if (userRole !== 'DEPARTMENT_EMPLOYEE') {
  menuItems.push({ text: t('sidebar.analytics'), icon: <Assessment />, page: 'analytics' });
  menuItems.push({ text: 'Heatmap', icon: <Map />, page: 'heatmap' });
  menuItems.push({ text: t('sidebar.feedback'), icon: <Feedback />, page: 'feedback' });
}

// For employees, "Dashboard" is their only page.
if (userRole === 'DEPARTMENT_EMPLOYEE') {
  menuItems = [
    { text: 'My Dashboard', icon: <Dashboard />, page: 'dashboard' },
  ];
} else if (userRole === 'WARD_OFFICER') {
  menuItems = [
    { text: 'My Ward Dashboard', icon: <Dashboard />, page: 'dashboard' },
  ];
}
else if (userRole === 'DEPARTMENT_ADMIN') {
  // Dept Admin gets Dashboard and Complaints, but not Analytics
  menuItems = [
    { text: 'Dept. Dashboard', icon: <Dashboard />, page: 'dashboard' },
    { text: 'Dept. Complaints', icon: <ReportProblem />, page: 'complaints' },
  ];
}

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      authService.logout();
    }
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
       width: drawerWidth,
       flexShrink: 0,
      '& .MuiDrawer-paper': {
      width: drawerWidth,
      boxSizing: 'border-box',
      // Use theme colors for a consistent look
      backgroundColor: '#111827',
      color: 'white',
      },
      }}
    >
      <Toolbar>
        <Typography variant="h6" fontWeight="bold" sx={{ width: '100%', textAlign: 'center' }}>
          {t('login.title')}
        </Typography>
      </Toolbar>
      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />

      {/* User Profile Section */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Avatar
          sx={{
            width: 70,
            height: 70,
            margin: '0 auto',
            mb: 1,
            bgcolor: 'rgba(255,255,255,0.3)',
            fontSize: 30,
          }}
        >
          <Person fontSize="large" />
        </Avatar>
        <Typography variant="subtitle1" fontWeight="bold">
          {user?.name || 'Admin User'}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          {user?.email || 'admin@example.com'}
        </Typography>
      </Box>

      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />

      {/* Language Selector */}
      <Box sx={{ p: 2 }}>
        <FormControl fullWidth size="small">
          <Select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            sx={{
              color: 'white',
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.3)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.5)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
              '.MuiSvgIcon-root': {
                color: 'white',
              },
            }}
            startAdornment={
              <InputAdornment position="start">
                <Language sx={{ color: 'white' }} />
              </InputAdornment>
            }
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="hi">हिंदी</MenuItem>
            <MenuItem value="mr">मराठी</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.2)', mb: 2 }} />

      {/* Menu Items */}
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.page} disablePadding>
            <ListItemButton
              selected={currentPage === item.page}
              onClick={() => onPageChange(item.page)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.25)',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
                mx: 1,
                borderRadius: 1,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Logout Button at Bottom */}
      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
              mx: 1,
              borderRadius: 1,
              my: 1,
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              <Logout />
            </ListItemIcon>
            <ListItemText primary={t('sidebar.logout')} />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
