import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ComplaintsTable from '../components/ComplaintsTable'; // Re-use the table!
import { complaintService } from '../services/complaintService';
import { socketService } from '../services/socketService';

const EmployeeDashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch employee's specific dashboard data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await complaintService.getEmployeeDashboardData();

      // Format the complaints list for the table
      const formattedComplaints = response.complaints.map(c => ({
        ...c,
        id: c.id,
        complainerName: c.user?.name,
        email: c.user?.email,
        area: c.location,
        department: c.department || 'N/A',
        status: c.status,
        feedback: c.feedbacks?.rating ? `${c.feedbacks.rating} stars` : 'No feedback',
        createdAt: c.createdAt,
      }));

      setData({ ...response, complaints: formattedComplaints });
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching employee data:', err);
      setError('Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    socketService.connect();

    // Refresh data if any complaint is updated
    socketService.onComplaintUpdate(() => fetchData());

    return () => {
      socketService.removeListeners();
      socketService.disconnect();
    };
  }, []);

  if (loading || !data) {
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
          My Dashboard
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

      {/* Employee Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold">{data.summary.totalAssigned}</Typography>
              <Typography variant="body2" color="text.secondary">Total Assigned</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="primary">{data.summary.active}</Typography>
              <Typography variant="body2" color="text.secondary">Active Complaints</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="green">{data.summary.resolved}</Typography>
              <Typography variant="body2" color="text.secondary">Resolved Complaints</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* My Assigned Complaints Table */}
      <ComplaintsTable
        complaints={data.complaints}
        onRefresh={fetchData}
        onStatusUpdate={fetchData}
      />
    </Container>
  );
};

export default EmployeeDashboard;