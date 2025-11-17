import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, CircularProgress, Alert, Box, Typography,
  List, ListItem, ListItemText, Divider, Avatar
} from '@mui/material';
import { statusService } from '../services/statusService';

const ComplaintDetailModal = ({ open, onClose, complaintId }) => {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && complaintId) {
      setLoading(true);
      setError('');
      setDetails(null);
      statusService.getComplaintHistory(complaintId)
        .then(data => {
          setDetails(data);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load complaint history.');
          setLoading(false);
        });
    }
  }, [open, complaintId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Complaint Details: #{details?.complaintId} {details?.title}
      </DialogTitle>
      <DialogContent>
        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        {details && (
          <Box>
            <Typography variant="body1">
              <strong>Current Status:</strong> {details.currentStatus}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Filed by:</strong> {details.createdBy?.name || 'N/A'} ({details.createdBy?.email})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Filed on:</strong> {new Date(details.createdAt).toLocaleString()}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="h6">Status History</Typography>
            <List dense>
              {details.timeline.map((update, index) => (
                <ListItem key={update.id} divider={index < details.timeline.length - 1}>
                  <ListItemText
                    primary={
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {update.statusDisplayName}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {update.remarks || 'No remarks provided.'}
                        </Typography>
                        <br />
                        <Typography component="span" variant="caption" color="text.secondary">
                          — Updated by: {update.updatedBy?.name || 'System'} ({update.updatedBy?.role || 'N/A'})
                          at {new Date(update.updatedAt).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ComplaintDetailModal;