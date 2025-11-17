// src/components/FeedbackTable.jsx

import React from 'react';
import { Box, Typography, Card, CardContent, Rating } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

// Define the columns for the DataGrid
const columns = [
  {
    field: 'createdAt',
    headerName: 'Date',
    width: 180,
    renderCell: (params) => new Date(params.value).toLocaleString('en-IN'),
  },
  {
    field: 'complaintId',
    headerName: 'Complaint ID',
    width: 120,
    valueGetter: (params) => params.row?.complaint?.id,
    renderCell: (params) => (
      // We can make this clickable later to open the complaint modal
      <Typography variant="body2" sx={{ textDecoration: 'underline', cursor: 'pointer' }}>
        #{params.value}
      </Typography>
    ),
  },
  {
    field: 'user',
    headerName: 'User',
    width: 200,
    valueGetter: (params) => params.row?.user?.name,
  },
  {
    field: 'rating',
    headerName: 'Rating',
    width: 150,
    renderCell: (params) => (
      <Rating value={params.value} readOnly />
    ),
  },
  {
    field: 'comment',
    headerName: 'Comment',
    flex: 1, // Take remaining space
    renderCell: (params) => (
      <Typography variant="body2" sx={{ whiteSpace: 'normal', py: 1 }}>
        {params.value}
      </Typography>
    ),
  },
];

const FeedbackTable = ({ feedbacks }) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={feedbacks}
            columns={columns}
            getRowId={(row) => row?.id} // Tell DataGrid to use 'id' as the unique key
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            rowHeight={80} // Set a taller fixed height for comments
            sx={{
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
              },
              '& .table-header': { // Ensure you have this class or apply styles directly
                backgroundColor: '#f5f5f5',
                fontWeight: 'bold',
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default FeedbackTable;