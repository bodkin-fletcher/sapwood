import { useState, useEffect, useContext } from 'react';
import { NodeContext } from '../context/NodeContext';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import DataViewer from '../components/dataWrangling/DataViewer';
import DataEditor from '../components/dataWrangling/DataEditor';
import DataTransformer from '../components/dataWrangling/DataTransformer';
import DataValidator from '../components/dataWrangling/DataValidator';
import { dataService } from '../services/dataApi';

export default function DataWranglingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedNodeData, setSelectedNodeData] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataFlowSnapshot, setDataFlowSnapshot] = useState(null);
  
  const { nodes, connections } = useContext(NodeContext);

  useEffect(() => {
    // Load data flow snapshot when the page loads
    fetchDataFlowSnapshot();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const fetchDataFlowSnapshot = async () => {
    setLoading(true);
    try {
      const snapshot = await dataService.getDataFlowSnapshot();
      setDataFlowSnapshot(snapshot);
      setError(null);
    } catch (err) {
      console.error("Error fetching data flow snapshot:", err);
      setError("Failed to load data flow information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNodeDataSelect = async (nodeId) => {
    setLoading(true);
    try {
      const nodeData = await dataService.getNodeData(nodeId);
      setSelectedNodeData(nodeData);
      setSelectedConnection(null);
      setError(null);
    } catch (err) {
      console.error("Error fetching node data:", err);
      setError(`Failed to load data for node ID: ${nodeId}`);
      setSelectedNodeData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionSelect = async (connectionId) => {
    setLoading(true);
    try {
      const connectionData = await dataService.getConnectionData(connectionId);
      setSelectedConnection(connectionData);
      setSelectedNodeData(null);
      setError(null);
    } catch (err) {
      console.error("Error fetching connection data:", err);
      setError(`Failed to load data for connection ID: ${connectionId}`);
      setSelectedConnection(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    if (selectedNodeData) {
      handleNodeDataSelect(selectedNodeData.nodeId);
    } else if (selectedConnection) {
      handleConnectionSelect(selectedConnection.id);
    } else {
      fetchDataFlowSnapshot();
    }
  };

  // Determine which component to render based on active tab
  const renderTabContent = () => {
    const data = selectedNodeData || selectedConnection;
    
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }
    
    if (!data && !dataFlowSnapshot) {
      return (
        <Alert severity="info">
          Select a node or connection to view and manage its data.
        </Alert>
      );
    }

    switch (activeTab) {
      case 0: // View
        return <DataViewer data={data} snapshot={dataFlowSnapshot} />;
      case 1: // Edit
        return <DataEditor 
          data={data} 
          onSave={refreshData}
        />;
      case 2: // Transform
        return <DataTransformer 
          data={data} 
          onTransform={refreshData}
        />;
      case 3: // Validate
        return <DataValidator 
          data={data}
          onValidate={refreshData}
        />;
      default:
        return <DataViewer data={data} snapshot={dataFlowSnapshot} />;
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Data Wrangling
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          View, edit, transform, and validate data flowing through your node network.
        </Typography>

        <Grid container spacing={3}>
          {/* Left panel - Node and Connection selection */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Data Sources
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Nodes
              </Typography>
              {nodes.length > 0 ? (
                nodes.map(node => (
                  <Button
                    key={node.id}
                    variant={selectedNodeData?.nodeId === node.id ? "contained" : "outlined"}
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                    onClick={() => handleNodeDataSelect(node.id)}
                  >
                    {node.name}
                  </Button>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No nodes available
                </Typography>
              )}
              
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Connections
              </Typography>
              {connections.length > 0 ? (
                connections.map(conn => (
                  <Button
                    key={conn.id}
                    variant={selectedConnection?.id === conn.id ? "contained" : "outlined"}
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                    onClick={() => handleConnectionSelect(conn.id)}
                  >
                    {`${conn.source} → ${conn.target}`}
                  </Button>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No connections available
                </Typography>
              )}

              <Box sx={{ mt: 3 }}>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={fetchDataFlowSnapshot}
                  fullWidth
                >
                  Refresh Data Flow
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* Right panel - Data management tools */}
          <Grid item xs={12} md={9}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="data wrangling tabs">
                  <Tab label="View" />
                  <Tab label="Edit" />
                  <Tab label="Transform" />
                  <Tab label="Validate" />
                </Tabs>
              </Box>
              
              {renderTabContent()}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
