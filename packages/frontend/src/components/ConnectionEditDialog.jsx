import { useState, useEffect } from 'react';
import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText,
  TextField,
  Box,
  Chip,
  Typography
} from '@mui/material';
import { useNodes } from '../context/NodeContext';

const ConnectionEditDialog = ({ open, onClose, connection }) => {
  const { nodes, updateNode, deleteConnection } = useNodes();
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [connectionLabel, setConnectionLabel] = useState('');
  const [connectionType, setConnectionType] = useState('default');
  const [errors, setErrors] = useState({});

  // Reset form when dialog opens with a connection
  useEffect(() => {
    if (connection) {
      setSourceId(connection.source);
      setTargetId(connection.target);
      setConnectionLabel(connection.label || '');
      setConnectionType(connection.type || 'default');
      setErrors({});
    }
  }, [connection]);

  const getNodeNameById = (id) => {
    const node = nodes.find(n => n.id === id);
    return node ? node.name : 'Unknown Node';
  };

  const handleSourceChange = (event) => {
    setSourceId(event.target.value);
    if (errors.source) {
      setErrors({ ...errors, source: null });
    }
  };

  const handleTargetChange = (event) => {
    setTargetId(event.target.value);
    if (errors.target) {
      setErrors({ ...errors, target: null });
    }
  };

  const handleLabelChange = (event) => {
    setConnectionLabel(event.target.value);
  };

  const handleTypeChange = (event) => {
    setConnectionType(event.target.value);
  };

  const validate = () => {
    const newErrors = {};
    if (!sourceId) newErrors.source = 'Please select a source node';
    if (!targetId) newErrors.target = 'Please select a target node';
    if (sourceId === targetId && sourceId) newErrors.target = 'Source and target must be different';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      // Update connection via API - for now we're simulating this by deleting and recreating
      // This can be enhanced later with a proper backend endpoint
      await deleteConnection(connection.id);
      
      // Create new connection with updated properties
      const newConnection = await useNodes().addConnection(sourceId, targetId, {
        label: connectionLabel.trim() || undefined,
        type: connectionType,
      });

      if (newConnection) {
        handleReset();
        onClose(true); // Pass true to indicate successful update
      }
    } catch (error) {
      console.error('Error updating connection:', error);
      setErrors({ general: 'Failed to update connection' });
    }
  };

  const handleReset = () => {
    if (!connection) {
      setSourceId('');
      setTargetId('');
      setConnectionLabel('');
      setConnectionType('default');
    } else {
      setSourceId(connection.source);
      setTargetId(connection.target);
      setConnectionLabel(connection.label || '');
      setConnectionType(connection.type || 'default');
    }
    setErrors({});
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this connection?')) {
      try {
        await deleteConnection(connection.id);
        onClose(true);
      } catch (error) {
        console.error('Error deleting connection:', error);
        setErrors({ general: 'Failed to delete connection' });
      }
    }
  };

  return (
    <Dialog open={open} onClose={handleCancel}>
      <DialogTitle>Edit Connection</DialogTitle>
      <DialogContent sx={{ pt: 2, minWidth: '400px' }}>
        {errors.general && (
          <Box sx={{ mb: 2 }}>
            <Typography color="error">{errors.general}</Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Chip
            label={`Source: ${getNodeNameById(sourceId)}`}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`Target: ${getNodeNameById(targetId)}`}
            color="secondary"
            variant="outlined"
          />
        </Box>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <TextField
            label="Connection Label"
            value={connectionLabel}
            onChange={handleLabelChange}
            placeholder="Optional label for this connection"
            fullWidth
          />
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="connection-type-label">Connection Type</InputLabel>
          <Select
            labelId="connection-type-label"
            value={connectionType}
            label="Connection Type"
            onChange={handleTypeChange}
          >
            <MenuItem value="default">Default</MenuItem>
            <MenuItem value="data">Data Flow</MenuItem>
            <MenuItem value="control">Control Flow</MenuItem>
            <MenuItem value="reference">Reference</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDelete} color="error">
          Delete
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConnectionEditDialog;
