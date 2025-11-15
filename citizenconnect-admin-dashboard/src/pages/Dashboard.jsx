import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import AnalyticsCards from '../components/AnalyticsCards';
import DepartmentChart from '../components/DepartmentChart';
import AreaChart from '../components/AreaChart';
import { complaintService } from '../services/complaintService';
import { socketService } from '../services/socketService';

// Accept onPageChange to pass down to the cards
const Dashboard = ({ onPageChange }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [departmentData, setDepartmentData] = useState([]);
  const [areaData, setAreaData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch all dashboard summary data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch summary data in parallel (ComplaintsTable is removed)
      const [analyticsRes, departmentRes, areaRes] = await Promise.all([
        complaintService.getAnalytics(),
        complaintService.getDepartmentStats(),
        complaintService.getAreaStats(),
      ]);

      // --- START: NEW DATA TRANSLATION ---
const transformedAnalytics = {
  totalComplaints: analyticsRes.overview.total,
  resolvedComplaints: analyticsRes.statusBreakdown.resolved,
  underReviewComplaints: analyticsRes.statusBreakdown.inProgress,
  pendingComplaints: analyticsRes.statusBreakdown.raised,
  closedComplaints: analyticsRes.statusBreakdown.closed,
  feedbackCount: 0, // Your analytics endpoint doesn't send this yet
};
setAnalytics(transformedAnalytics);

// Translate department data
// Backend sends: { departmentBreakdown: [...] }
// Chart wants: [...]
setDepartmentData(departmentRes.departmentBreakdown);

// Translate area data
// Backend sends: { statistics: [{ area: "Ward 5", total: 10 }] }
// Chart wants: [{ area: "Ward 5", count: 10 }]
const transformedAreaData = areaRes.statistics.map(item => ({
  area: item.area,
  count: item.total, // Map "total" to "count"
}));
setAreaData(transformedAreaData);
// --- END: NEW DATA TRANSLATION ---
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(
        'Failed to load dashboard data. Please check your backend connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Setup Socket.IO for real-time updates
  useEffect(() => {
    fetchData(); // Initial data fetch

    socketService.connect();

    // Listen for new complaints or updates to refresh analytics
    socketService.onNewComplaint(() => fetchData());
    socketService.onComplaintUpdate(() => fetchData());
    

    // Auto-refresh every 30 seconds as backup
    const interval = setInterval(fetchData, 30000); // 30 seconds

    // Cleanup on unmount
    return () => {
      socketService.removeListeners();
      socketService.disconnect();
      clearInterval(interval);
    };
  }, []);

  if (loading && !analytics) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {t('dashboard.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('dashboard.lastUpdate')}: {lastUpdate.toLocaleString('en-IN')}
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Analytics Cards - Pass onPageChange to make them clickable */}
      <Box sx={{ mb: 4 }}>
        <AnalyticsCards analytics={analytics} onPageChange={onPageChange} />
      </Box>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <DepartmentChart data={departmentData} />
        </Grid>
        <Grid item xs={12} md={6}>
          <AreaChart data={areaData} />
        </Grid>
      </Grid>

      {/* ComplaintsTable is now removed from the main dashboard */}
    </Container>
  );
};

export default Dashboard;