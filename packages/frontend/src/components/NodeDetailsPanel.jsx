import { useState, useEffect } from 'react';
import { Paper, Typography, Box, Button, Divider, TextField, MenuItem, IconButton, Grid, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import PingIcon from '@mui/icons-material/Sensors';
import { useNodes } from '../context/NodeContext';

const NodeDetailsPanel = ({ node, onClose }) => {
  const { updateNode, deleteNode } = useNodes();
  const [editing, setEditing] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});
  const [pingResult, setPingResult] = useState(null);

  // Set form values when node changes
  useEffect(() => {
    if (node) {
      setFormValues({
        name: node.name || '',
        type: node.type || 'service',
        host: node.host || '',
        port: node.port || '',
        description: node.description || '',
      });
      setPingResult(null); // Reset ping result when node changes
    }
  }, [node]);

  const handleChange = (prop) => (event) => {
    setFormValues({ ...formValues, [prop]: event.target.value });
    // Clear error when field is edited
    if (errors[prop]) {
      setErrors({ ...errors, [prop]: null });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formValues.name) newErrors.name = 'Name is required';
    if (!formValues.host) newErrors.host = 'Host is required';
    if (formValues.port && !/^\d+$/.test(formValues.port)) {
      newErrors.port = 'Port must be a number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditClick = () => {
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    if (node) {
      setFormValues({
        name: node.name || '',
        type: node.type || 'service',
        host: node.host || '',
        port: node.port || '',
        description: node.description || '',
      });
    }
    setErrors({});
  };

  const handleSave = async () => {
    if (!node || !validate()) return;

    const updates = {
      ...formValues,
      port: formValues.port ? parseInt(formValues.port, 10) : undefined
    };

    const success = await updateNode(node.id, updates);
    if (success) {
      setEditing(false);
      setErrors({});
    }
  };
  const handleDelete = async () => {
    if (!node) return;
    
    if (window.confirm(`Are you sure you want to delete node "${node.name}"?`)) {
      const success = await deleteNode(node.id);
      if (success) {
        onClose();
      }
    }
  };
  
  // Simulate a ping to the node
  const handlePingNode = async () => {
    if (!node || !node.host) return;
    
    setPingResult({ loading: true });
    
    try {
      // In a real implementation, we would do an actual ping
      // For now, simulate a network request with timeout
      const start = Date.now();
      const isSuccess = Math.random() > 0.2; // 80% success rate for demo
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      
      const latency = Date.now() - start;
      
      setPingResult({
        success: isSuccess,
        latency,
        message: isSuccess 
          ? `Successfully connected to ${node.host}${node.port ? `:${node.port}` : ''}`
          : `Failed to connect to ${node.host}${node.port ? `:${node.port}` : ''}`
      });
      
      // Update node status based on ping result
      if (node.status !== (isSuccess ? 'active' : 'inactive')) {
        await updateNode(node.id, { 
          status: isSuccess ? 'active' : 'inactive',
          lastPing: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('Error pinging node:', error);
      setPingResult({
        success: false,
        message: 'An error occurred while trying to ping the node'
      });
    }
  };

  if (!node) {
    return (
      <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Select a node to view details
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          Node Details
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {editing ? (
        <Box component="form" sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Name"
                value={formValues.name}
                onChange={handleChange('name')}
                fullWidth
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Type"
                value={formValues.type}
                onChange={handleChange('type')}
                fullWidth
              >
                <MenuItem value="gateway">API Gateway</MenuItem>
                <MenuItem value="storage">Database/Storage</MenuItem>
                <MenuItem value="service">Service</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={8}>
              <TextField
                label="Host"
                value={formValues.host}
                onChange={handleChange('host')}
                fullWidth
                error={!!errors.host}
                helperText={errors.host}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Port"
                value={formValues.port}
                onChange={handleChange('port')}
                fullWidth
                error={!!errors.port}
                helperText={errors.port}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={formValues.description}
                onChange={handleChange('description')}
                multiline
                rows={3}
                fullWidth
              />
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Name:</strong> {node.name}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Type:</strong> {node.type === 'gateway' ? 'API Gateway' :
                          node.type === 'storage' ? 'Database/Storage' :
                          node.type === 'service' ? 'Service' : 'Other'}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Host:</strong> {node.host || 'Not specified'}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Port:</strong> {node.port || 'Not specified'}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Status:</strong> {node.status || 'Unknown'}
          </Typography>
          {node.description && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Description:</strong>
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2">
                  {node.description}
                </Typography>
              </Paper>
            </>
          )}
        </Box>
      )}      {/* Ping result display */}
      {pingResult && (
        <Paper sx={{ mt: 2, p: 2, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" gutterBottom>
            Ping Result:
          </Typography>
          <Chip 
            label={pingResult.success ? "Success" : "Failed"} 
            color={pingResult.success ? "success" : "error"}
            size="small"
          />
          {pingResult.message && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {pingResult.message}
            </Typography>
          )}
          {pingResult.latency && (
            <Typography variant="body2">
              Latency: {pingResult.latency}ms
            </Typography>
          )}
        </Paper>
      )}

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Button 
            color="error" 
            startIcon={<DeleteIcon />} 
            onClick={handleDelete}
            sx={{ mr: 1 }}
          >
            Delete
          </Button>
          {!editing && (
            <Button
              startIcon={<PingIcon />}
              onClick={handlePingNode}
              color="secondary"
            >
              Ping
            </Button>
          )}
        </Box>
        <Box>
          {editing ? (
            <>
              <Button onClick={handleCancelEdit} sx={{ mr: 1 }}>
                Cancel
              </Button>
              <Button 
                variant="contained" 
                startIcon={<SaveIcon />} 
                onClick={handleSave}
              >
                Save
              </Button>
            </>
          ) : (
            <Button 
              variant="contained" 
              onClick={handleEditClick}
            >
              Edit
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default NodeDetailsPanel;
