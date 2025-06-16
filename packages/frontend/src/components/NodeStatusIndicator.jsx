import React from 'react';
import { Box, Tooltip, CircularProgress } from '@mui/material';
import { getStatusColor } from '../services/nodeUtils';

const NodeStatusIndicator = ({ status, isChecking = false, lastHeartbeat, size = 10 }) => {
  // Format the time since last heartbeat
  const getTimeSince = (timestamp) => {
    if (!timestamp) return 'Never checked';
    
    const lastCheck = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now - lastCheck) / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds} seconds ago`;
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)} minutes ago`;
    } else if (diffSeconds < 86400) {
      return `${Math.floor(diffSeconds / 3600)} hours ago`;
    } else {
      return `${Math.floor(diffSeconds / 86400)} days ago`;
    }
  };
  
  // Get status name for tooltip
  const getStatusName = (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'warning':
        return 'Warning';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };
  
  // Get tooltip text
  const getTooltipText = () => {
    if (isChecking) {
      return 'Checking status...';
    }
    
    const statusName = getStatusName(status);
    const timeSince = getTimeSince(lastHeartbeat);
    
    return `${statusName}\nLast checked: ${timeSince}`;
  };
  
  return (
    <Tooltip title={getTooltipText()} placement="top" arrow>
      <Box sx={{ display: 'inline-flex', position: 'relative' }}>
        <Box
          sx={{
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: getStatusColor(status),
            boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease'
          }}
        />
        
        {isChecking && (
          <CircularProgress
            size={size + 6}
            sx={{
              position: 'absolute',
              top: -3,
              left: -3,
              color: getStatusColor(status),
              opacity: 0.7
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
};

export default NodeStatusIndicator;
