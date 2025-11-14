import React from 'react';
import { Box, Typography, Link } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 2,
        mt: 'auto', // This makes it stick to the bottom
        backgroundColor: '#FFFFFF', // White background
        borderTop: '1px solid #E0E0E0',
        color: 'text.secondary',
        textAlign: 'center',
      }}
    >
      <Typography variant="body2">
        © {new Date().getFullYear()} CitizenConnect Portal. All rights reserved.
      </Typography>
      <Typography variant="caption">
        Designed & Developed by{' '}
        <Link href="#" underline="hover" color="primary">
          Your Team Name
        </Link>
      </Typography>
    </Box>
  );
};

export default Footer;