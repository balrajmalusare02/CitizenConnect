import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import {
  PendingActions,
  CheckCircle,
  HourglassEmpty,
  Cancel,
  Assessment,
  Feedback,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

// Accept onPageChange as a prop
const AnalyticsCards = ({ analytics, onPageChange }) => {
  const { t } = useTranslation();

  const cards = [
    {
      title: t('dashboard.totalComplaints'),
      value: analytics?.totalComplaints || 0,
      icon: <Assessment sx={{ fontSize: 40 }} />,
      color: '#3f51b5', // Use theme primary color
      bgColor: 'rgba(63, 81, 181, 0.1)',
      page: 'complaints', // Page to navigate to
    },
    {
      title: t('dashboard.resolved'),
      value: analytics?.resolvedComplaints || 0,
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: '#4caf50',
      bgColor: '#e8f5e9',
      page: 'complaints', // Page to navigate to
    },
    {
      title: t('dashboard.underReview'),
      value: analytics?.underReviewComplaints || 0,
      icon: <HourglassEmpty sx={{ fontSize: 40 }} />,
      color: '#ff9800',
      bgColor: '#fff3e0',
      page: 'complaints', // Page to navigate to
    },
    {
      title: t('dashboard.pending'),
      value: analytics?.pendingComplaints || 0,
      icon: <PendingActions sx={{ fontSize: 40 }} />,
      color: '#f44336',
      bgColor: '#ffebee',
      page: 'complaints', // Page to navigate to
    },
    {
      title: t('dashboard.closed'),
      value: analytics?.closedComplaints || 0,
      icon: <Cancel sx={{ fontSize: 40 }} />,
      color: '#9e9e9e',
      bgColor: '#f5f5f5',
      page: 'complaints', // Page to navigate to
    },
    {
      title: t('dashboard.feedback'),
      value: analytics?.feedbackCount || 0,
      icon: <Feedback sx={{ fontSize: 40 }} />,
      color: '#2196f3',
      bgColor: '#e3f2fd',
      page: 'analytics', // Page to navigate to
    },
  ];

  // Handle click, calling the function from AppLayout
  const handleCardClick = (page) => {
    if (onPageChange && page) {
      onPageChange(page);
    }
  };

  return (
    <Grid container spacing={3}>
      {cards.map((card, index) => (
        <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
          <Card
            onClick={() => handleCardClick(card.page)}
            sx={{
              height: '100%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer', // Add pointer cursor
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              },
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    backgroundColor: card.bgColor,
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.color,
                  }}
                >
                  {card.icon}
                </Box>
              </Box>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                {card.value.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {card.title}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default AnalyticsCards;