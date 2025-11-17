// src/pages/Feedback.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { feedbackService } from '../services/feedbackService'; // Import our new service
import FeedbackTable from '../components/FeedbackTable'; // Import our new table

const Feedback = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbacks, setFeedbacks] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch all feedbacks
  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await feedbackService.getAllFeedbacks();
      
      setFeedbacks(response.data || []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      setError('Failed to load feedbacks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
    // Note: We haven't set up real-time socket updates for feedback yet.
  }, []);

  if (loading && feedbacks.length === 0) {
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
          All User Feedback
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

      {/* Feedbacks Table */}
      <FeedbackTable feedbacks={feedbacks} />
    </Container>
  );
};

export default Feedback;