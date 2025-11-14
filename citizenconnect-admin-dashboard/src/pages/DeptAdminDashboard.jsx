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
import { DataGrid } from '@mui/x-data-grid'; // Import DataGrid
import { useTranslation } from 'react-i18next';
import ComplaintsTable from '../components/ComplaintsTable';
import { complaintService } from '../services/complaintService';
import { socketService } from '../services/socketService';

// Define columns for the new Employee table
const employeeColumns = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'name', headerName: 'Name', width: 200 },
  { field: 'email', headerName: 'Email', width: 250 },
  { field: 'role', headerName: 'Role', width: 150 },
  { field: 'assignedComplaints', headerName: 'Assigned', type: 'number', width: 100 },
  { field: 'resolvedComplaints', headerName: 'Resolved', type: 'number', width: 100 },
  { field: 'resolutionRate', headerName: 'Rate', width: 100 },
];

const DeptAdminDashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch department admin's dashboard data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await complaintService.getDeptAdminDashboardData();

      // Format the complaints list for the main table
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
      console.error('Error fetching dept admin data:', err);
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
    socketService.onNewComplaint(() => fetchData());

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
          Department Dashboard ({data.department})
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

      {/* Department Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold">{data.summary.total}</Typography>
              <Typography variant="body2" color="text.secondary">Total Dept. Complaints</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="primary">{data.summary.active}</Typography>
              <Typography variant="body2" color="text.secondary">Active Complaints</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="orange">{data.summary.unassigned}</Typography>
              <Typography variant="body2" color="text.secondary">Unassigned Complaints</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="green">{data.summary.resolved}</Typography>
              <Typography variant="body2" color="text.secondary">Resolved Complaints</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* NEW: Employee Performance Table */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Department Employee Performance
          </Typography>
          <Box sx={{ height: 300, width: '100%' }}>
            <DataGrid
              rows={data.employees}
              columns={employeeColumns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              density="compact"
            />
          </Box>
        </CardContent>
      </Card>

      {/* All Department Complaints Table */}
      <ComplaintsTable
        complaints={data.complaints}
        onRefresh={fetchData}
        onStatusUpdate={fetchData}
      />
    </Container>
  );
};

export default DeptAdminDashboard;