import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Card,
  CardContent,
  Button,
  Chip,
  Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ReactJson from 'react-json-view';
import { DataGrid } from '@mui/x-data-grid';

export default function DataViewer({ data, snapshot }) {
  const [viewFormat, setViewFormat] = useState(0);
  const theme = useTheme();
  
  const handleFormatChange = (event, newValue) => {
    setViewFormat(newValue);
  };

  // If we have snapshot data but no specific data selected
  if (!data && snapshot) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          System Data Flow Snapshot
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Overview of data flow between nodes in the current system.
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Active Data Flows
          </Typography>
          {snapshot.flows?.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Source</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Data Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {snapshot.flows.map((flow, index) => (
                    <TableRow key={index}>
                      <TableCell>{flow.sourceName}</TableCell>
                      <TableCell>{flow.targetName}</TableCell>
                      <TableCell>{flow.dataType || 'JSON'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={flow.status} 
                          color={flow.status === 'active' ? 'success' : 'warning'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{new Date(flow.lastUpdated).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No active data flows detected</Alert>
          )}
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Node Data Summary
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {snapshot.nodeSummaries?.map((node) => (
              <Card key={node.id} variant="outlined" sx={{ minWidth: 250, maxWidth: 300 }}>
                <CardContent>
                  <Typography variant="subtitle2">{node.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{node.type}</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" display="block">
                    Input data: {node.inputCount || 0} records
                  </Typography>
                  <Typography variant="caption" display="block">
                    Output data: {node.outputCount || 0} records
                  </Typography>
                  <Typography variant="caption" display="block">
                    Last activity: {node.lastActivity ? new Date(node.lastActivity).toLocaleString() : 'Never'}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  // If no data is selected at all
  if (!data) {
    return (
      <Alert severity="info">
        Select a node or connection from the left panel to view its data.
      </Alert>
    );
  }

  const renderContent = () => {
    // Return early if no data records
    if (!data?.records || data.records.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No data available for this {data.nodeId ? 'node' : 'connection'}.
        </Alert>
      );
    }

    switch (viewFormat) {
      case 0: // JSON View
        return (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <ReactJson 
              src={data.records} 
              theme={theme.palette.mode === 'dark' ? 'monokai' : 'rjv-default'} 
              collapsed={1}
              displayDataTypes={false}
              enableClipboard={true}
              style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
            />
          </Box>
        );
      
      case 1: // Table View
        // If data is an array of objects with consistent schema
        if (Array.isArray(data.records) && data.records.length > 0) {
          // For tabular data
          if (typeof data.records[0] === 'object') {
            // Create columns from the first record's keys
            const columns = Object.keys(data.records[0]).map(key => ({
              field: key,
              headerName: key,
              flex: 1,
              renderCell: (params) => {
                const value = params.value;
                // Render values based on their type
                if (typeof value === 'object' && value !== null) {
                  return JSON.stringify(value).substring(0, 50) + '...';
                }
                return value?.toString() || '';
              }
            }));
            
            // Add id to each row if not present
            const rows = data.records.map((record, index) => ({
              id: record.id || index,
              ...record
            }));
            
            return (
              <Box sx={{ height: 400, width: '100%', mt: 2 }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10, 25]}
                  disableSelectionOnClick
                  autoHeight
                />
              </Box>
            );
          }
        }
        
        // Fallback for data that can't be displayed as a table
        return (
          <Alert severity="info" sx={{ mt: 2 }}>
            The current data cannot be displayed in table format. Please use JSON view.
          </Alert>
        );
        case 2: // CSV View
        return (
          <Box sx={{ mt: 2 }}>
            <Paper variant="outlined" sx={{ p: 2, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {data.csvContent || 'CSV format not available for this data'}
            </Paper>
            <Button 
              variant="outlined" 
              size="small" 
              sx={{ mt: 1 }}
              onClick={() => {
                if (data.csvContent) {
                  const blob = new Blob([data.csvContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${data.nodeId || data.id}_data.csv`;
                  link.click();
                }
              }}
            >
              Download CSV
            </Button>
          </Box>
        );
      case 3: // TGDF View
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              TGDF Format View
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              This view shows the data in Tagged Data Format (TGDF) structure with metadata and integrity information.
            </Alert>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <ReactJson 
                src={data.tgdfRecords || data.records} 
                theme={theme.palette.mode === 'dark' ? 'monokai' : 'twilight'} 
                collapsed={2}
                displayDataTypes={true}
                enableClipboard={true}
                style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
              />
            </Box>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {data.nodeId 
            ? `Data for Node: ${data.nodeName || data.nodeId}` 
            : `Data for Connection: ${data.sourceName || data.source} → ${data.targetName || data.target}`}
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>        <Tabs value={viewFormat} onChange={handleFormatChange} aria-label="data format tabs">
          <Tab label="JSON" />
          <Tab label="Table" />
          <Tab label="CSV" />
          <Tab label="TGDF" />
        </Tabs>
      </Box>
      
      {renderContent()}
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Data Information
        </Typography>
        <Typography variant="body2">
          Records: {data.records?.length || 0}
        </Typography>
        <Typography variant="body2">
          Format: {data.format || 'JSON'}
        </Typography>
        <Typography variant="body2">
          Last Updated: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'Unknown'}
        </Typography>
      </Box>
    </Box>
  );
}
