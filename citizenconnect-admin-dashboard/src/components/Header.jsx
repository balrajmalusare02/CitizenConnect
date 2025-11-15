import React, { useState } from 'react'; // <-- 1. IMPORT useState
import {
  AppBar, Toolbar, Typography, Box, IconButton, Avatar,
  Menu, MenuItem // <-- 2. IMPORT Menu and MenuItem
} from '@mui/material';
import { NotificationsNone, AccountCircle } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/authService'; // <-- 3. IMPORT authService

const EMBLEM_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/120px-Emblem_of_India.svg.png';

const Header = () => {
  const { t } = useTranslation();

  // --- 4. ADD STATE FOR THE MENU ---
  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    authService.logout();
  };

  const handleProfile = () => {
    handleMenuClose();
    // TODO: We will make this navigate to a new profile page
    alert('Profile page coming soon!'); 
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
        {/* Left Side: Emblem and Title */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={EMBLEM_URL}
            alt="Emblem of India"
            sx={{ width: 40, height: 40, mr: 1.5 }}
          />
          <Box>
            <Typography
              variant="body2"
              fontWeight="bold"
              sx={{ lineHeight: 1.2, color: 'text.primary' }}
            >
              GOVERNMENT OF INDIA
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.2 }}
            >
              {t('login.title')} - {t('login.subtitle')}
            </Typography>
          </Box>
        </Box>

        {/* Right Side: Icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>

          {/* This is the line we deleted */}

          <IconButton color="inherit">
            <NotificationsNone />
          </IconButton>

          {/* --- 5. UPDATE THE PROFILE ICON BUTTON --- */}
          <IconButton
            color="inherit"
            onClick={handleProfileMenuOpen} // <-- Make it open the menu
          >
            <AccountCircle />
          </IconButton>
          {/* -------------------------------------- */}
        </Box>
      </Toolbar>

      {/* --- 6. ADD THE MENU COMPONENT --- */}
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfile}>Profile</MenuItem>
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>
      {/* ------------------------------- */}

    </AppBar>
  );
};

export default Header;