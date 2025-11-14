import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Refresh, Phone, Email, LocationOn } from '@mui/icons-material';
import { complaintService } from '../services/complaintService';

const ComplaintsTable = ({ complaints, onRefresh, onStatusUpdate }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchText, setSearchText] = useState('');

  // Handle status change
  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      await complaintService.updateComplaintStatus(complaintId, newStatus);
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update complaint status');
    }
  };

  // Table columns
  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      headerClassName: 'table-header',
    },
    {
      field: 'complainerName',
      headerName: 'Complainer Name',
      width: 180,
      headerClassName: 'table-header',
    },
    {
      field: 'mobile',
      headerName: 'Mobile',
      width: 140,
      headerClassName: 'table-header',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
          {params.value}
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
      headerClassName: 'table-header',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
          {params.value}
        </Box>
      ),
    },
    {
      field: 'area',
      headerName: 'Area/Location',
      width: 180,
      headerClassName: 'table-header',
      renderCell: (params) => (
        <Tooltip title={params.value} arrow>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {params.value}
            </span>
          </Box>
        </Tooltip>
      ),
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 130,
      headerClassName: 'table-header',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      headerClassName: 'table-header',
      renderCell: (params) => (
        <FormControl size="small" fullWidth>
          <Select
            value={params.value}
            onChange={(e) => handleStatusChange(params.row.id, e.target.value)}
            sx={{ fontSize: 13 }}
          >
            <MenuItem value="Raised">Raised</MenuItem>
             <MenuItem value="Acknowledged">Acknowledged</MenuItem>
             <MenuItem value="InProgress">In Progress</MenuItem>
             <MenuItem value="Resolved">Resolved</MenuItem>
             <MenuItem value="Closed">Closed</MenuItem>
          </Select>
        </FormControl>
      ),
    },
    {
      field: 'feedback',
      headerName: 'Feedback',
      width: 150,
      headerClassName: 'table-header',
      renderCell: (params) => (
        <Typography variant="body2" noWrap>
          {params.value || 'No feedback'}
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      headerClassName: 'table-header',
      renderCell: (params) => new Date(params.value).toLocaleString('en-IN'),
    },
  ];

  // Filter complaints
  const filteredComplaints = complaints?.filter((complaint) => {
    const matchesStatus =
      filterStatus === 'all' || complaint.status?.toLowerCase() === filterStatus;
    const matchesSearch =
      searchText === '' ||
      complaint.complainerName?.toLowerCase().includes(searchText.toLowerCase()) ||
      complaint.mobile?.includes(searchText) ||
      complaint.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      complaint.area?.toLowerCase().includes(searchText.toLowerCase()) ||
      complaint.department?.toLowerCase().includes(searchText.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            All Complaints
          </Typography>
          <Tooltip title="Refresh data">
            <IconButton onClick={onRefresh} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ flex: 1, maxWidth: 400 }}
            placeholder="Search by name, mobile, email, area..."
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={filterStatus}
              label="Filter by Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="under review">Under Review</MenuItem>
              <MenuItem value="under resolving">Under Resolving</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Data Grid */}
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredComplaints || []}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50, 100]}
            disableSelectionOnClick
            sx={{
              '& .table-header': {
                backgroundColor: '#f5f5f5',
                fontWeight: 'bold',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f9f9f9',
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ComplaintsTable;
