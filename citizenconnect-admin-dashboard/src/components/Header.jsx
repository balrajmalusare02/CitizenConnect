import React, { useState, useEffect } from 'react'; // <-- IMPORT useEffect
import {
  AppBar, Toolbar, Typography, Box, IconButton, Avatar,
  Menu, MenuItem, Badge // <-- IMPORT Badge
} from '@mui/material';
import { NotificationsNone, AccountCircle } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService'; // <-- IMPORT notificationService
import { socketService } from '../services/socketService'; // <-- IMPORT socketService
import NotificationMenu from './NotificationMenu'; // <-- IMPORT our new menu

const EMBLEM_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/120px-Emblem_of_India.svg.png';

const Header = ({ onPageChange }) => { // <-- Already accepts onPageChange
  const { t, i18n} = useTranslation();

  // State for Profile Menu
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const isProfileMenuOpen = Boolean(profileAnchorEl);

  // --- NEW: State for Notification Menu ---
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const isNotificationMenuOpen = Boolean(notificationAnchorEl);
  const [unreadCount, setUnreadCount] = useState(0);
  // ---------------------------------------

  // --- NEW: Fetch initial count on load ---
  useEffect(() => {
    notificationService.getMyNotifications().then(data => {
      setUnreadCount(data.unreadCount);
    });

    // Listen for socket events to update the badge in real-time
    socketService.onNewNotification(() => {
      // Just increment the count, no need to fetch all
      setUnreadCount(prevCount => prevCount + 1);
    });

    return () => socketService.removeListeners();
  }, []);
  // --------------------------------------

  // --- Profile Menu Handlers ---
  const handleProfileMenuOpen = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };
  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };
  const handleLogout = () => {
    handleProfileMenuClose();
    authService.logout();
  };
  const handleProfile = () => {
    handleProfileMenuClose();
    onPageChange('profile');
  };
  // -----------------------------

  // --- NEW: Notification Menu Handlers ---
  const handleNotificationMenuOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };
  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };
  // ---------------------------------

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'background.paper',
        color: 'text.primary',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left Side */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* ... (Emblem and Title code remains the same) ... */}
          <Avatar
            src={EMBLEM_URL}
            alt="Emblem of India"
            sx={{ width: 40, height: 40, mr: 1.5 }}
          />
          <Box>
            <Typography variant="body2" fontWeight="bold">
              GOVERNMENT OF INDIA
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('login.title')} - {t('login.subtitle')}
            </Typography>
          </Box>
        </Box>

        {/* Right Side: Icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>

          {/* --- UPDATED: Notification Button --- */}
          <IconButton color="inherit" onClick={handleNotificationMenuOpen}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsNone />
            </Badge>
          </IconButton>
          {/* ---------------------------------- */}

          <IconButton color="inherit" onClick={handleProfileMenuOpen}>
            <AccountCircle />
          </IconButton>
        </Box>
      </Toolbar>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileAnchorEl}
        open={isProfileMenuOpen}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfile}>Profile</MenuItem>
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>

      {/* --- NEW: Notification Menu Component --- */}
      <NotificationMenu
        anchorEl={notificationAnchorEl}
        open={isNotificationMenuOpen}
        onClose={handleNotificationMenuClose}
        onPageChange={onPageChange}
        onUpdateCount={(count) => setUnreadCount(count)}
      />
      {/* -------------------------------------- */}

    </AppBar>
  );
};

export default Header;