import api from './api';

export const notificationService = {
  // Calls GET /api/notifications
  getMyNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      return response.data; // Returns { success, count, unreadCount, notifications }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      return { notifications: [], unreadCount: 0 };
    }
  },

  // Calls PUT /api/notifications/:id/read
  markAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  },
};