import api from './api';

export const userService = {
  changePassword: async (passwords) => {
    try {
      // Passwords object should be { oldPassword, newPassword }
      const response = await api.put('/users/change-password', passwords);
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Password change failed',
      };
    }
  },
};