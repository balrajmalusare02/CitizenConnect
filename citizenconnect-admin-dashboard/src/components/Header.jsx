import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Avatar } from '@mui/material';
import { NotificationsNone, AccountCircle } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

// --- Placeholders for Logos ---
// You can get these from the MHA website or your assets
const EMBLEM_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/120px-Emblem_of_India.svg.png';
const G20_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/G20_India_2023_logo.svg/120px-G20_India_2023_logo.svg.png';
const YOGA_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/International_Day_of_Yoga_2021_logo.svg/100px-International_Day_of_Yoga_2021_logo.svg.png';

const Header = () => {
  const { t } = useTranslation();

  return (
    <AppBar
      position="fixed"
      sx={{
        // This makes the Header sit *above* the sidebar
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'background.paper', // White background
        color: 'text.primary', // Dark text
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

        {/* Right Side: Logos and User Icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Logos (hidden on small screens) */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
            <img src={G20_LOGO_URL} alt="G20 Logo" height="30px" />
            <img src={YOGA_LOGO_URL} alt="Yoga Logo" height="30px" />
          </Box>
          
          <IconButton color="inherit">
            <NotificationsNone />
          </IconButton>
          <IconButton color="inherit">
            <AccountCircle />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;