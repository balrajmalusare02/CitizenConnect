import React, { useState, useEffect } from 'react';

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
import { useNavigate } from 'react-router-dom';
import { Refresh, Phone, Email, LocationOn, HowToReg, Info, Map } from '@mui/icons-material';
import { complaintService } from '../services/complaintService';
import AssignComplaintModal from './AssignComplaintModal';
import ComplaintDetailModal from './ComplaintDetailModal';


const ComplaintsTable = ({ complaints, onRefresh, onStatusUpdate, hideColumns = [], initialFilter }) => {
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchText, setSearchText] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailComplaintId, setDetailComplaintId] = useState(null);
  

  const handleOpenAssignModal = (id) => {
    setSelectedComplaintId(id);
    setModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setModalOpen(false);
    setSelectedComplaintId(null);
  };

  const handleOpenDetailModal = (id) => {
    setDetailComplaintId(id);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setDetailComplaintId(null);
  };

  useEffect(() => {
    if (initialFilter) {
      // Map legacy card values to new dropdown values
      if (initialFilter === 'under review') {
        setFilterStatus('inprogress');
      } else {
        setFilterStatus(initialFilter);
      }
    }
  }, [initialFilter]);

  

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
  let columns = [
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
    // --- SMART LOCATION COLUMN (With Map Button) ---
    {
      field: 'area',
      headerName: 'Area/Location',
      width: 220, 
      headerClassName: 'table-header',
      renderCell: (params) => {
        const address = params.value;
        const gps = params.row.gps;
        
        // Check for coordinates
        const lat = gps?.latitude || gps?.lat;
        const lng = gps?.longitude || gps?.lng;
        const hasCoords = lat && lng;

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
            {/* Address Text */}
            <Tooltip title={address} arrow>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, overflow: 'hidden' }}>
                <LocationOn sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {address}
                </span>
              </Box>
            </Tooltip>

            {/* Internal Map Button */}
            {hasCoords && (
              <Tooltip title="View on Heatmap">
                <IconButton 
                  size="small" 
                  color="primary" 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent row click
                    // Navigate to Heatmap and pass the coordinates
                    navigate('/heatmap', { 
                      state: { 
                        focusLat: lat, 
                        focusLng: lng,
                        focusId: params.row.id 
                      } 
                    });
                  }}
                  sx={{ 
                    padding: 0.5,
                    backgroundColor: '#e3f2fd',
                    '&:hover': { backgroundColor: '#bbdefb' }
                  }}
                >
                  <Map sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
    // -----------------------------
    {
      field: 'department',
      headerName: 'Department',
      width: 130,
      headerClassName: 'table-header',
    },

    {
      field: 'assignedToName',
      headerName: 'Assigned To',
      width: 150,
      headerClassName: 'table-header',
      renderCell: (params) => (
        <Typography variant="body2" noWrap>
          {params.value || 'Unassigned'}
        </Typography>
      ),
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

    {
    field: 'actions',
    headerName: 'Actions',
    width: 120,
    headerClassName: 'table-header',
    renderCell: (params) => {
      return (
        <Box>
          <Tooltip title="View Details">
            <IconButton
              color="default"
              onClick={() => handleOpenDetailModal(params.row.id)}
            >
              <Info />
            </IconButton>
          </Tooltip>
          {/* Only show assign button if unassigned AND not resolved/closed */}
          {!params.row.assignedToId && params.row.status !== 'Resolved' && params.row.status !== 'Closed' && ( 
            <Tooltip title="Assign Complaint">
              <IconButton
                color="primary"
                onClick={() => handleOpenAssignModal(params.row.id)}
              >
                <HowToReg />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      );
      return <Typography variant="caption">Assigned</Typography>;
    },
  }
  ];

  const filteredColumns = columns.filter(col => !hideColumns.includes(col.field));

// Filter complaints
  const filteredComplaints = complaints?.filter((complaint) => {
    const complaintStatus = complaint.status?.toLowerCase(); // e.g., 'raised', 'inprogress'
    const filter = filterStatus; // e.g., 'all', 'pending', 'inprogress'

    let matchesStatus = false;

    if (filter === 'all') {
      matchesStatus = true;
    } else if (filter === 'pending') {
      // User Definition: "All active complaints except resolved and closed"
      // This covers: Raised, Acknowledged, InProgress
      matchesStatus = ['raised', 'acknowledged', 'inprogress'].includes(complaintStatus);
    } else if (filter === 'acknowledged') {
      matchesStatus = complaintStatus === 'acknowledged';
    } else if (filter === 'inprogress') {
      matchesStatus = complaintStatus === 'inprogress';
    } else if (filter === 'resolved') {
      matchesStatus = complaintStatus === 'resolved';
    } else if (filter === 'closed') {
      matchesStatus = complaintStatus === 'closed';
    } else {
      // Fallback for exact matches
      matchesStatus = complaintStatus === filter;
    }

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
              <MenuItem value="pending">Pending (All Active)</MenuItem>
              <MenuItem value="acknowledged">Acknowledged</MenuItem>
              <MenuItem value="inprogress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Data Grid */}
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredComplaints || []}
            columns={filteredColumns}
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
      <AssignComplaintModal
            open={modalOpen}
            onClose={handleCloseAssignModal}
            complaintId={selectedComplaintId}
            onSubmitSuccess={() => {
              onRefresh(); // Refresh the whole table
            }}
          />

      <ComplaintDetailModal
        open={detailModalOpen}
        onClose={handleCloseDetailModal}
        complaintId={detailComplaintId}
      />
    </Card>
  );
};

export default ComplaintsTable;
