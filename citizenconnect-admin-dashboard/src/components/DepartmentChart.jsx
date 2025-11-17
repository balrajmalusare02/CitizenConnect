import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Pie } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const DepartmentChart = ({ data }) => 
  {  const { t } = useTranslation();

  // Prepare chart data
  const chartData = {
    labels: (data && Array.isArray(data)) ? data.map((d) => d.department) : [],
    datasets: [
      {
        label: t('dashboard.departmentChart'),
        data: (data && Array.isArray(data)) ? data.map((d) => d.count) : [],
        backgroundColor: [
          '#667eea',
          '#f093fb',
          '#4facfe',
          '#43e97b',
          '#fa709a',
          '#fee140',
          '#30cfd0',
          '#a8edea',
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          {t('dashboard.departmentChart')}
        </Typography>
        <Box sx={{ height: 350, mt: 2 }}>
          {data && data.length > 0 ? (
            <Pie data={chartData} options={options} />
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center" mt={10}>
              No data available
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default DepartmentChart;
