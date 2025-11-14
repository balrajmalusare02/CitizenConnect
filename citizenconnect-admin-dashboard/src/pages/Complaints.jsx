import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ComplaintsTable from '../components/ComplaintsTable'; // Import the table
import { complaintService } from '../services/complaintService';
import { socketService } from '../services/socketService';

const Complaints = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch all complaints
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError('');
      // We are now calling the '/complaints/view' endpoint
     const response = await complaintService.getAllComplaints();
     
     // The backend response is { message, count, complaints }
     const complaintsRes = response.complaints || [];
 
     // Map the backend data to fit the table component
     const formattedComplaints = complaintsRes.map(c => ({
       ...c,
       id: c.id,
       complainerName: c.user?.name,
       email: c.user?.email,
       // mobile: c.user?.mobile, // 'mobile' is not in your prisma schema
       area: c.location, // Map 'location' to 'area'
       department: c.department || 'N/A',
       status: c.status,
       feedback: c.feedbacks?.rating ? `${c.feedbacks.rating} stars` : 'No feedback',
       createdAt: c.createdAt,
     }));
 
     setComplaints(formattedComplaints);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError(
        'Failed to load complaints. Please check your backend connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Setup Socket.IO for real-time updates
  useEffect(() => {
    fetchComplaints(); // Initial data fetch

    socketService.connect();

    // Listen for new complaints
    socketService.onNewComplaint((newComplaint) => {
      console.log('New complaint received:', newComplaint);
      setComplaints((prev) => [newComplaint, ...prev]);
      setLastUpdate(new Date());
    });

    // Listen for complaint updates
    socketService.onComplaintUpdate((updatedComplaint) => {
      console.log('Complaint updated:', updatedComplaint);
      setComplaints((prev) =>
        prev.map((c) => (c.id === updatedComplaint.id ? updatedComplaint : c))
      );
      setLastUpdate(new Date());
    });

    // Cleanup on unmount
    return () => {
      socketService.removeListeners();
      socketService.disconnect();
    };
  }, []);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchComplaints();
  };

  if (loading && complaints.length === 0) {
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
          {t('sidebar.complaints')}
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

      {/* Complaints Table */}
      <ComplaintsTable
        complaints={complaints}
        onRefresh={handleRefresh}
        onStatusUpdate={handleRefresh} // Refresh data on status update
      />
    </Container>
  );
};

export default Complaints;