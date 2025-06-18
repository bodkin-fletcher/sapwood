import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, CardHeader,
  LinearProgress, Chip, Divider, Button, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogActions, DialogContent, DialogTitle
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useNodes } from '../context/NodeContext';
import { useSettings } from '../context/SettingsContext';
import NodeStatusIndicator from './NodeStatusIndicator';
import {
  getNodeMetrics, getApiCallMetrics,
  getHeartbeatHistory, getApiCallHistory,
  performHeartbeat, updateNodeStatus
} from '../services/nodeUtils';

const MonitoringDashboard = () => {
  const { nodes, connections, fetchNodes } = useNodes();
  const { settings } = useSettings();
  const [nodeMetrics, setNodeMetrics] = useState({});
  const [apiMetrics, setApiMetrics] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyDialogType, setHistoryDialogType] = useState('heartbeat'); // 'heartbeat' or 'api'

  // Load metrics when component mounts or nodes change
  useEffect(() => {
    refreshMetrics();

    // Set up auto-refresh if enabled
    if (settings.monitoringEnabled && settings.statusUpdateFrequency > 0) {
      const intervalId = setInterval(() => {
        refreshMetrics();
      }, settings.statusUpdateFrequency * 1000);

      return () => clearInterval(intervalId);
    }
  }, [nodes, settings.monitoringEnabled, settings.statusUpdateFrequency]);

  // Refresh all metrics
  const refreshMetrics = () => {
    setLoading(true);

    // Calculate metrics for each node
    const newNodeMetrics = {};
    const newApiMetrics = {};

    nodes.forEach(node => {
      newNodeMetrics[node.id] = getNodeMetrics(node.id);
      newApiMetrics[node.id] = getApiCallMetrics(node.id);
    });

    setNodeMetrics(newNodeMetrics);
    setApiMetrics(newApiMetrics);
    setLoading(false);
  };

  // Run a manual heartbeat check for a specific node
  const runHeartbeat = async (node) => {
    try {
      const result = await performHeartbeat(node, {
        retryAttempts: settings.retryAttempts,
        retryDelay: settings.retryDelay
      });

      // Update node status
      await updateNodeStatus(node.id, result);

      // Refresh metrics
      refreshMetrics();
      return result;
    } catch (error) {
      console.error('Error running heartbeat:', error);
      return null;
    }
  };

  // Open history dialog
  const openHistory = (node, type) => {
    setSelectedNode(node);
    setHistoryDialogType(type);
    setHistoryDialogOpen(true);
  };

  // Format date for display
  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  // Get history data based on selected type
  const getHistoryData = () => {
    if (!selectedNode) return [];

    if (historyDialogType === 'heartbeat') {
      return getHeartbeatHistory(selectedNode.id);
    } else {
      return getApiCallHistory(selectedNode.id);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Typography variant="h5" component="h1">Monitoring Dashboard</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={refreshMetrics}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Nodes
              </Typography>
              <Typography variant="h3">{nodes.length}</Typography>
              <Box sx={{ mt: 1 }}>
                {nodes.filter(node => node.status === 'active').length} active, {' '}
                {nodes.filter(node => node.status !== 'active').length} inactive
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Connections
              </Typography>
              <Typography variant="h3">{connections.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                System Health
              </Typography>
              {nodes.length > 0 ? (
                <>
                  <Typography variant="h3">
                    {Math.round(
                      (nodes.filter(node => node.status === 'active').length / nodes.length) * 100
                    )}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(nodes.filter(node => node.status === 'active').length / nodes.length) * 100}
                    sx={{ mt: 1, mb: 1 }}
                    color={(nodes.filter(node => node.status === 'active').length / nodes.length) > 0.7 ? 'success' : 'warning'}
                  />
                </>
              ) : (
                <Typography variant="h3">N/A</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Node List */}
      <Typography variant="h6" gutterBottom>Node Status</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Node</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Uptime %</TableCell>
              <TableCell>Avg. Latency</TableCell>
              <TableCell>API Success</TableCell>
              <TableCell>Last Check</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {nodes.map((node) => (
              <TableRow key={node.id} hover>
                <TableCell>{node.name}</TableCell>
                <TableCell>
                  <Chip size="small" label={node.type} />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <NodeStatusIndicator status={node.status} />
                    <Typography sx={{ ml: 1 }}>
                      {node.status === 'active' ? 'Active' : 'Inactive'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {nodeMetrics[node.id]?.uptime.toFixed(1)}%
                </TableCell>
                <TableCell>
                  {nodeMetrics[node.id]?.avgLatency || 0} ms
                </TableCell>
                <TableCell>
                  {apiMetrics[node.id]?.successRate.toFixed(1)}%
                </TableCell>
                <TableCell>
                  {formatDate(nodeMetrics[node.id]?.lastCheck)}
                </TableCell>
                <TableCell>
                  <Tooltip title="Run Heartbeat">
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => runHeartbeat(node)}
                    >
                      <RefreshIcon fontSize="small" />
                    </Button>
                  </Tooltip>
                  <Tooltip title="Heartbeat History">
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => openHistory(node, 'heartbeat')}
                    >
                      <HistoryIcon fontSize="small" />
                    </Button>
                  </Tooltip>
                  <Tooltip title="API Call History">
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => openHistory(node, 'api')}
                    >
                      <SettingsIcon fontSize="small" />
                    </Button>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {historyDialogType === 'heartbeat' ? 'Heartbeat History' : 'API Call History'} - {selectedNode?.name}
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Latency</TableCell>
                  <TableCell>Attempts</TableCell>
                  <TableCell>Message</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getHistoryData().map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatDate(entry.timestamp)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {entry.success ?
                          <CheckCircleOutlineIcon color="success" fontSize="small" /> :
                          <ErrorOutlineIcon color="error" fontSize="small" />
                        }
                        <Typography sx={{ ml: 1 }}>
                          {entry.success ? 'Success' : 'Failed'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{entry.latency || 'N/A'} ms</TableCell>
                    <TableCell>{entry.attempts || 1}</TableCell>
                    <TableCell>{entry.message || entry.error || 'No message'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {getHistoryData().length === 0 && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography>No history data available</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MonitoringDashboard;
