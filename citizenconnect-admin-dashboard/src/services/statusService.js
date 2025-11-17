import api from './api';

export const statusService = {
  // Calls GET /api/status/complaint/:id/history
  getComplaintHistory: async (complaintId) => {
    try {
      const response = await api.get(`/status/complaint/${complaintId}/history`);
      return response.data; // Returns { complaintId, title, timeline, ... }
    } catch (error) {
      console.error("Failed to fetch history:", error);
      throw error;
    }
  },
};