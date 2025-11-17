// src/services/feedbackService.js

import api from './api';

export const feedbackService = {
  /**
   * Fetches all feedbacks from the server.
   * @returns {Promise<Object>} An object containing { success, count, data }
   */
  getAllFeedbacks: async () => {
    try {
      const response = await api.get('/feedback');
      return response.data; // Returns { success: true, count: 5, data: [...] }
    } catch (error) {
      console.error("Error fetching all feedbacks:", error);
      throw error;
    }
  },
};