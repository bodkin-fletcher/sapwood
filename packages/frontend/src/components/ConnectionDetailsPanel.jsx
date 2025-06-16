import { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  IconButton, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Grid, 
  Divider,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNodes } from '../context/NodeContext';

const ConnectionDetailsPanel = ({ connection, onClose }) => {
  const { nodes, updateConnection, deleteConnection } = useNodes();
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(connection?.label || '');
  const [connectionType, setConnectionType] = useState(connection?.type || 'default');
  const [description, setDescription] = useState(connection?.description || '');

  if (!connection) {
    return (
      <Paper sx={{ height: '100%', p: 3, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Select a connection to view details
        </Typography>
      </Paper>
    );
  }

  const sourceNode = nodes.find(n => n.id === connection.source);
  const targetNode = nodes.find(n => n.id === connection.target);

  const handleStartEdit = () => {
    setIsEditing(true);
    setLabel(connection.label || '');
    setConnectionType(connection.type || 'default');
    setDescription(connection.description || '');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    try {
      await updateConnection(connection.id, {
        label: label.trim() || null,
        type: connectionType,
        description: description.trim() || ''
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update connection:', error);
      // You could display an error message here
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this connection?')) {
      try {
        await deleteConnection(connection.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete connection:', error);
        // You could display an error message here
      }
    }
  };

  return (
    <Paper sx={{ height: '100%', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Connection Details</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Divider />
      
      <Box sx={{ p: 3, flexGrow: 1, overflow: 'auto' }}>
        {isEditing ? (
          // Editing mode
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Connection label (optional)"
                variant="outlined"
                size="small"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Connection Type</InputLabel>
                <Select
                  value={connectionType}
                  onChange={(e) => setConnectionType(e.target.value)}
                  label="Connection Type"
                >
                  <MenuItem value="default">Default</MenuItem>
                  <MenuItem value="data">Data Flow</MenuItem>
                  <MenuItem value="control">Control Flow</MenuItem>
                  <MenuItem value="reference">Reference</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Connection description (optional)"
                variant="outlined"
                size="small"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        ) : (
          // View mode
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Connection
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Chip 
                    label={sourceNode?.name || 'Unknown'} 
                    color="primary" 
                    variant="outlined" 
                    size="small" 
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2">→</Typography>
                  <Chip 
                    label={targetNode?.name || 'Unknown'} 
                    color="secondary" 
                    variant="outlined" 
                    size="small" 
                    sx={{ ml: 1 }}
                  />
                </Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Label
                </Typography>
                <Typography variant="body1">
                  {connection.label || <Typography color="text.secondary" variant="body2" component="span">(No label)</Typography>}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Type
                </Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {connection.type || 'Default'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1">
                  {connection.description || <Typography color="text.secondary" variant="body2" component="span">(No description)</Typography>}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Created
                </Typography>
                <Typography variant="body1">
                  {new Date(connection.created).toLocaleString()}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}
      </Box>
      
      <Divider />
      
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
        {isEditing ? (
          <>
            <Button onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSaveEdit}
            >
              Save
            </Button>
          </>
        ) : (
          <>
            <Button 
              startIcon={<DeleteIcon />} 
              color="error" 
              onClick={handleDelete}
            >
              Delete
            </Button>
            <Button 
              startIcon={<EditIcon />} 
              variant="contained" 
              onClick={handleStartEdit}
            >
              Edit
            </Button>
          </>
        )}
      </Box>
    </Paper>
  );
};

export default ConnectionDetailsPanel;
