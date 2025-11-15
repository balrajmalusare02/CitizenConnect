import { io } from 'socket.io-client';
import { authService } from './authService';

let socket = null;

export const socketService = {
  // Connect to socket server
  connect: () => {
    const token = authService.getToken();
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

    socket = io(SOCKET_URL, {
      auth: {
        token: token, // Send JWT token for authentication
      },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return socket;
  },

  // Disconnect socket
  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  // Listen for new complaints
  onNewComplaint: (callback) => {
    if (socket) {
      socket.on('new-complaint', callback);
    }
  },

  // Listen for complaint status updates
  onComplaintUpdate: (callback) => {
    if (socket) {
      socket.on('complaint-status-updated', callback);
    }
  },

  // Listen for new notifications
  onNewNotification: (callback) => {
    if (socket) {
      socket.on('new-notification', callback);
    }
  },

  // Remove all listeners
  removeListeners: () => {
    if (socket) {
      socket.off('new-complaint');
      socket.off('complaint-status-updated');
      socket.off('analyticsUpdate');
    }
  },

  // Get socket instance
  getSocket: () => socket,
};
