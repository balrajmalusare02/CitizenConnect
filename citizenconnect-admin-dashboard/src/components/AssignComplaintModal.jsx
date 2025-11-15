import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, CircularProgress, Alert, List, ListItem,
  ListItemText, ListItemAvatar, Avatar,
} from '@mui/material';
import { Person } from '@mui/icons-material';
import { complaintService } from '../services/complaintService';

const AssignComplaintModal = ({ open, onClose, complaintId, onSubmitSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setLoading(true);
      setSelectedEmployeeId(null);
      setError('');
      complaintService.getAssignableEmployees()
        .then(data => {
          setEmployees(data.employees);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load employees.');
          setLoading(false);
        });
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedEmployeeId) return;

    try {
      await complaintService.assignComplaint(complaintId, selectedEmployeeId);
      onSubmitSuccess(); // Tell the parent table to refresh
      onClose(); // Close the modal
    } catch (err) {
      setError('Failed to assign complaint.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Assign Complaint #{complaintId}</DialogTitle>
      <DialogContent>
        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && (
          <List sx={{ height: 300, overflowY: 'auto' }}>
            {employees.map(emp => (
              <ListItem
                key={emp.id}
                button
                selected={selectedEmployeeId === emp.id}
                onClick={() => setSelectedEmployeeId(emp.id)}
              >
                <ListItemAvatar>
                  <Avatar><Person /></Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={emp.name}
                  secondary={`${emp.department || 'N/A'} - ${emp.role}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!selectedEmployeeId}>Assign</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignComplaintModal;