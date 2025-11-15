import api from './api';

export const complaintService = {
  // Existing functions...
  getAllComplaints: async () => {
    const response = await api.get('/complaints/view');
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  getDepartmentStats: async () => {
    const response = await api.get('/analytics/by-department');
    return response.data;
  },

  getAreaStats: async () => {
    const response = await api.get('/heatmap/area-stats');
    return response.data;
  },

  updateComplaintStatus: async (complaintId, status) => {
    const response = await api.put(`/complaints/${complaintId}/status`, {
      newStatus: status,
    });
    return response.data;
  },

  // NEW: Advanced Analytics Functions
  getFilteredAnalytics: async (timeFilter, areaFilter, departmentFilter) => {
    const response = await api.get('/complaints/analytics/filtered', {
      params: {
        timeFilter,
        areaFilter: areaFilter !== 'all' ? areaFilter : undefined,
        departmentFilter: departmentFilter !== 'all' ? departmentFilter : undefined,
      },
    });
    return response.data;
  },

  getTrendData: async (period) => {
  // Your backend endpoint uses a query param, not a URL param
  const response = await api.get('/analytics/trend', {
    params: { period } // e.g., /api/analytics/trend?period=month
  });
  return response.data;
},

  getResponseTimeStats: async () => {
    const response = await api.get('/complaints/analytics/response-time');
    return response.data;
  },

  getEmployeeDashboardData: async () => {
    const response = await api.get('/dashboard/employee');
    return response.data;
  },

  getWardOfficerDashboardData: async () => {
    // We don't need to send a ward. The backend will get it from the user's auth token.
    const response = await api.get('/dashboard/ward-officer');
    return response.data;
  },

  getDeptAdminDashboardData: async () => {
    const response = await api.get('/dashboard/department-admin');
    return response.data;
  },

  getHeatmapData: async () => {
    const response = await api.get('/heatmap/map-data');
    return response.data;
  },

  getSeverityZones: async () => {
    const response = await api.get('/heatmap/severity-zones');
    return response.data;
  },

  getAssignableEmployees: async () => {
    const response = await api.get('/assignments/employees');
    return response.data; // Returns { success: true, employees: [...] }
  },

  assignComplaint: async (complaintId, employeeId) => {
    const response = await api.put(`/assignments/${complaintId}/assign`, {
      assignedToId: employeeId,
    });
    return response.data;
  },
};
