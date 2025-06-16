import { useState, useEffect } from 'react';
import { 
  Paper, Typography, Box, Button, Divider, TextField, MenuItem, 
  IconButton, Grid, Chip, Tooltip, Card, CardContent,
  FormControl, InputLabel, Select, CircularProgress, Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import PingIcon from '@mui/icons-material/Sensors';
import LinkIcon from '@mui/icons-material/Link';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useNodes } from '../context/NodeContext';
import NodeStatusIndicator from './NodeStatusIndicator';
import { performHeartbeat, updateNodeStatus, executeNodeApiCall } from '../services/nodeUtils';
import { nodeService } from '../services/api';

const NodeDetailsPanel = ({ node, onClose }) => {
  const { updateNode, deleteNode, connections } = useNodes();
  const [editing, setEditing] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});
  const [pingResult, setPingResult] = useState(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [connectedNodes, setConnectedNodes] = useState({ incoming: [], outgoing: [] });
  const [apiExecutionResult, setApiExecutionResult] = useState(null);
  const [isExecutingApi, setIsExecutingApi] = useState(false);

  // Set form values when node changes
  useEffect(() => {
    if (node) {
      setFormValues({
        name: node.name || '',
        type: node.type || 'service',
        host: node.host || '',
        port: node.port || '',
        protocol: node.protocol || 'http',
        path: node.path || '',
        description: node.description || '',
      });
      setPingResult(null); // Reset ping result when node changes
      setApiExecutionResult(null); // Reset API result when node changes
      findConnectedNodes(node.id); // Find connected nodes when node changes
    }
  }, [node, connections]);

  // Find nodes connected to this node
  const findConnectedNodes = (nodeId) => {
    if (!connections || !nodeId) return;
    
    const incoming = [];
    const outgoing = [];
    
    connections.forEach(conn => {
      if (conn.target === nodeId) {
        incoming.push(conn.source);
      }
      if (conn.source === nodeId) {
        outgoing.push(conn.target);
      }
    });
    
    setConnectedNodes({ incoming, outgoing });
  };

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
        protocol: node.protocol || 'http',
        path: node.path || '',
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
  
  // Perform a heartbeat check on the node
  const handleCheckStatus = async () => {
    if (!node) return;
    
    setIsCheckingStatus(true);
    setPingResult(null);
    
    try {
      const heartbeatResult = await performHeartbeat(node);
      setPingResult({
        success: heartbeatResult.success,
        latency: heartbeatResult.latency,
        message: heartbeatResult.message
      });
      
      // Update node status based on heartbeat result
      await updateNodeStatus(node.id, heartbeatResult);
    } catch (error) {
      console.error('Error checking node status:', error);
      setPingResult({
        success: false,
        message: 'An error occurred while checking status'
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };
  
  // Execute the node's API
  const handleExecuteApi = async () => {
    if (!node) return;
    
    setIsExecutingApi(true);
    setApiExecutionResult(null);
    
    try {
      // Use the API service to execute the node's API
      const result = await nodeService.executeNodeApi(node.id);
      setApiExecutionResult(result);
      
      // If successful, update node status
      if (result.success) {
        await updateNode(node.id, { 
          status: 'active',
          lastApiExecution: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error executing node API:', error);
      setApiExecutionResult({
        success: false,
        error: 'An error occurred while executing the API'
      });
    } finally {
      setIsExecutingApi(false);
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

  const connectionCount = connectedNodes.incoming.length + connectedNodes.outgoing.length;
  const hasConnections = connectionCount > 0;

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="h2">
            Node Details
          </Typography>
          <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
            <NodeStatusIndicator 
              status={node.status} 
              isChecking={isCheckingStatus} 
              lastHeartbeat={node.lastHeartbeat}
              size={12}
            />
          </Box>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {editing ? (
          <Box component="form">
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
                  <MenuItem value="service">Service</MenuItem>
                  <MenuItem value="gateway">Gateway</MenuItem>
                  <MenuItem value="storage">Storage</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Protocol</InputLabel>
                  <Select
                    value={formValues.protocol}
                    onChange={handleChange('protocol')}
                    label="Protocol"
                  >
                    <MenuItem value="http">HTTP</MenuItem>
                    <MenuItem value="https">HTTPS</MenuItem>
                    <MenuItem value="ws">WS</MenuItem>
                    <MenuItem value="wss">WSS</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
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
              <Grid item xs={8}>
                <TextField
                  label="Path"
                  value={formValues.path}
                  onChange={handleChange('path')}
                  fullWidth
                  placeholder="/api/v1/resource"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  value={formValues.description}
                  onChange={handleChange('description')}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={handleCancelEdit} color="inherit">Cancel</Button>
                <Button
                  onClick={handleSave}
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                >
                  Save
                </Button>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                {node.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Chip 
                  label={node.type} 
                  size="small" 
                  sx={{ mr: 1 }} 
                />
                <Typography variant="body2" color="text.secondary">
                  {node.protocol || 'http'}://{node.host}{node.port ? `:${node.port}` : ''}{node.path || ''}
                </Typography>
              </Box>
              {node.description && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {node.description}
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                API Execution
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                <Button
                  onClick={handleExecuteApi}
                  variant="outlined"
                  color="primary"
                  disabled={isExecutingApi}
                  startIcon={isExecutingApi ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                >
                  Execute API Call
                </Button>
                <Button
                  onClick={handleCheckStatus}
                  variant="outlined"
                  color="secondary"
                  disabled={isCheckingStatus}
                  startIcon={isCheckingStatus ? <CircularProgress size={20} /> : <PingIcon />}
                >
                  Check Status
                </Button>
              </Box>
              
              {apiExecutionResult && (
                <Card variant="outlined" sx={{ mb: 2, mt: 1 }}>
                  <CardContent>
                    <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2" color={apiExecutionResult.success ? "success.main" : "error.main"}>
                        API Response {apiExecutionResult.success ? '✓' : '✗'}
                      </Typography>
                      {apiExecutionResult.statusCode && (
                        <Chip 
                          label={`Status: ${apiExecutionResult.statusCode}`} 
                          size="small"
                          color={apiExecutionResult.success ? "success" : "error"}
                          variant="outlined"
                        />
                      )}
                    </Box>
                    
                    <Typography variant="caption" display="block" gutterBottom>
                      {apiExecutionResult.url || `${node.protocol || 'http'}://${node.host}${node.port ? `:${node.port}` : ''}${node.path || ''}`}
                    </Typography>
                    
                    {apiExecutionResult.latency && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Latency: {apiExecutionResult.latency}ms
                      </Typography>
                    )}
                    
                    <Box sx={{ mt: 1, p: 1, backgroundColor: 'grey.50', borderRadius: 1, overflow: 'auto', maxHeight: 200 }}>
                      <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                        {JSON.stringify(apiExecutionResult.data || apiExecutionResult.error || {}, null, 2)}
                      </pre>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {pingResult && (
                <Alert 
                  severity={pingResult.success ? "success" : "error"} 
                  sx={{ mb: 2 }}
                >
                  {pingResult.message}
                  {pingResult.latency && ` (${pingResult.latency}ms)`}
                </Alert>
              )}
            </Box>
            
            {hasConnections && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Connections
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {connectedNodes.incoming.length > 0 && (
                      <Tooltip title="Incoming connections">
                        <Chip
                          icon={<LinkIcon style={{ transform: 'rotate(180deg)' }} />}
                          label={`${connectedNodes.incoming.length} incoming`}
                          size="small"
                          variant="outlined"
                        />
                      </Tooltip>
                    )}
                    {connectedNodes.outgoing.length > 0 && (
                      <Tooltip title="Outgoing connections">
                        <Chip
                          icon={<LinkIcon />}
                          label={`${connectedNodes.outgoing.length} outgoing`}
                          size="small"
                          variant="outlined"
                        />
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1 }}>
              <Button
                onClick={handleDelete}
                color="error"
                startIcon={<DeleteIcon />}
              >
                Delete
              </Button>
              <Button
                onClick={handleEditClick}
                variant="contained"
                color="primary"
              >
                Edit
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
};

export default NodeDetailsPanel;
