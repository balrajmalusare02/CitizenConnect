import React, { useState, useEffect } from 'react';
import { Menu, MenuItem, Typography, CircularProgress, Box, ListItemText } from '@mui/material';
import { notificationService } from '../services/notificationService';
import { socketService } from '../services/socketService';

// This menu is opened by the Header.
// onPageChange will be used to navigate to the 'All Complaints' page.
const NotificationMenu = ({ anchorEl, open, onClose, onPageChange, onUpdateCount }) => {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Function to fetch notifications
  const fetchNotifications = () => {
    setLoading(true);
    notificationService.getMyNotifications().then(data => {
      setNotifications(data.notifications);
      onUpdateCount(data.unreadCount); // Update the count in the header
      setLoading(false);
    });
  };

  // Fetch data when the menu is opened
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  // Listen for real-time socket updates
  useEffect(() => {
    socketService.onNewNotification(() => {
      // When a new notification comes in, just re-fetch
      // This will only run if the menu is already open
      if (open) {
        fetchNotifications();
      }
    });

    // Clean up listener
    return () => socketService.removeListeners();
  }, [open]);

  const handleNotificationClick = (notification) => {
    // 1. Mark as read
    if (!notification.isRead) {
      notificationService.markAsRead(notification.id).then(() => {
        fetchNotifications(); // Refresh the list
      });
    }

    // 2. Close the menu
    onClose();

    // 3. Navigate to the 'All Complaints' page
    if (notification.complaintId) {
      onPageChange('complaints');
    }
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      PaperProps={{
        style: {
          maxHeight: 400,
          width: 350,
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Notifications</Typography>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && notifications.length === 0 && (
        <MenuItem disabled>
          <ListItemText primary="You have no notifications." />
        </MenuItem>
      )}

      {!loading && notifications.map(notif => (
        <MenuItem
          key={notif.id}
          onClick={() => handleNotificationClick(notif)}
          sx={{ 
            backgroundColor: notif.isRead ? 'transparent' : '#f5f7fa',
            whiteSpace: 'normal' 
          }}
        >
          <ListItemText
            primary={notif.message}
            secondary={new Date(notif.createdAt).toLocaleString()}
            primaryTypographyProps={{ 
              fontWeight: notif.isRead ? 'normal' : 'bold' 
            }}
          />
        </MenuItem>
      ))}
    </Menu>
  );
};

export default NotificationMenu;