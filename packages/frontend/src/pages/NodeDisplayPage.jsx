import { useState } from 'react';
import { Box, Button, Paper, Typography, Grid, ButtonGroup } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNodes } from '../context/NodeContext';
import NodeCanvas from '../components/NodeCanvas';
import NodeDetailsPanel from '../components/NodeDetailsPanel';
import ConnectionDetailsPanel from '../components/ConnectionDetailsPanel';
import CreateNodeDialog from '../components/CreateNodeDialog';
import CreateConnectionDialog from '../components/CreateConnectionDialog';
import ConnectionEditDialog from '../components/ConnectionEditDialog';

const NodeDisplayPage = () => {
  const {
    nodes,
    connections,
    selectedNode,
    selectedConnection,
    setSelectedNode,
    setSelectedConnection,
    fetchNodes,
    loading
  } = useNodes();
  const [createNodeDialogOpen, setCreateNodeDialogOpen] = useState(false);
  const [createConnectionDialogOpen, setCreateConnectionDialogOpen] = useState(false);
  const [connectionEditDialogOpen, setConnectionEditDialogOpen] = useState(false);

  const handleOpenCreateNodeDialog = () => {
    setCreateNodeDialogOpen(true);
  };

  const handleCloseCreateNodeDialog = () => {
    setCreateNodeDialogOpen(false);
  };

  const handleOpenCreateConnectionDialog = () => {
    setCreateConnectionDialogOpen(true);
  };

  const handleCloseCreateConnectionDialog = () => {
    setCreateConnectionDialogOpen(false);
  };

  const handleSelectConnection = (connection) => {
    setSelectedConnection(connection);
    setSelectedNode(null); // Deselect node when connection is selected
  };

  const handleCloseDetails = () => {
    setSelectedNode(null);
    setSelectedConnection(null);
  };

  const handleOpenConnectionEditDialog = () => {
    if (!selectedConnection) return;
    setConnectionEditDialogOpen(true);
  };

  const handleCloseConnectionEditDialog = (needsRefresh = false) => {
    setConnectionEditDialogOpen(false);
    if (needsRefresh) {
      fetchNodes();
    }
  };

  const handleRefresh = () => {
    fetchNodes();
  };

  return (
    <Grid container spacing={2} sx={{ height: 'calc(100vh - 100px)' }}>
      <Grid item xs={12} md={9} sx={{ height: '100%' }}>
        <Paper
          sx={{
            p: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper'
          }}
        >          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" component="h2">
              Node Display
            </Typography>
            <Box>
              <ButtonGroup variant="contained" aria-label="node operations">
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreateNodeDialog}
                >
                  Create Node
                </Button>
                <Button
                  startIcon={<LinkIcon />}
                  onClick={handleOpenCreateConnectionDialog}
                  disabled={nodes.length < 2}
                >
                  Connect
                </Button>
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </ButtonGroup>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
            <NodeCanvas
              nodes={nodes}
              onSelectNode={setSelectedNode}
              selectedNodeId={selectedNode?.id}
              onSelectConnection={handleSelectConnection}
            />
          </Box>

          <CreateNodeDialog
            open={createNodeDialogOpen}
            onClose={handleCloseCreateNodeDialog}
          />

          <CreateConnectionDialog
            open={createConnectionDialogOpen}
            onClose={handleCloseCreateConnectionDialog}
          />

          <ConnectionEditDialog
            open={connectionEditDialogOpen}
            onClose={handleCloseConnectionEditDialog}
            connection={selectedConnection}
          />
        </Paper>
      </Grid>

      <Grid item xs={12} md={3} sx={{ height: '100%' }}>
        {selectedNode ? (
          <NodeDetailsPanel
            node={selectedNode}
            onClose={handleCloseDetails}
          />
        ) : selectedConnection ? (
          <ConnectionDetailsPanel
            connection={selectedConnection}
            onClose={handleCloseDetails}
          />
        ) : (
          <Paper sx={{ height: '100%', p: 3, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Select a node or connection to view details
            </Typography>
          </Paper>
        )}
      </Grid>
    </Grid>
  );
};

export default NodeDisplayPage;
