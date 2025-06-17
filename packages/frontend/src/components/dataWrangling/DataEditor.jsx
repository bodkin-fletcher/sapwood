import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  TextField,
  Snackbar
} from '@mui/material';
import { dataService } from '../../services/dataApi';
import MonacoEditor from '@monaco-editor/react';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';

export default function DataEditor({ data, onSave }) {
  const [editorValue, setEditorValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (data && data.records) {
      try {
        // Pretty format the JSON for better editing
        const formattedJson = JSON.stringify(data.records, null, 2);
        setEditorValue(formattedJson);
      } catch (err) {
        console.error("Error formatting JSON:", err);
        setError("Unable to format data for editing. The data might be invalid.");
        setEditorValue(JSON.stringify(data.records));
      }
    }
  }, [data]);

  const handleEditorChange = (value) => {
    setEditorValue(value);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Parse the edited JSON to validate it
      const parsedData = JSON.parse(editorValue);
      
      // Determine if we're saving node data or connection data
      let result;
      if (data.nodeId) {
        result = await dataService.updateNodeData(data.nodeId, parsedData);
      } else {
        result = await dataService.updateConnectionData(data.id, parsedData);
      }
      
      setNotification({
        open: true,
        message: 'Data saved successfully!',
        severity: 'success'
      });
      
      // Notify parent component to refresh data
      if (onSave) onSave();
      
    } catch (err) {
      console.error("Error saving data:", err);
      setError(err.message || "Failed to save data. Please check your JSON syntax.");
      setNotification({
        open: true,
        message: 'Error: ' + (err.message || "Failed to save data"),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (data && data.records) {
      const formattedJson = JSON.stringify(data.records, null, 2);
      setEditorValue(formattedJson);
      setNotification({
        open: true,
        message: 'Changes discarded',
        severity: 'info'
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  if (!data) {
    return (
      <Alert severity="info">
        Select a node or connection from the left panel to edit its data.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Edit Data
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {data.nodeId 
          ? `Editing data for node: ${data.nodeName || data.nodeId}` 
          : `Editing data for connection: ${data.sourceName || data.source} → ${data.targetName || data.target}`}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Box sx={{ height: 400, width: '100%' }}>
          <MonacoEditor
            language="json"
            value={editorValue}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              fontSize: 14,
              tabSize: 2,
            }}
          />
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<UndoIcon />}
          onClick={handleReset}
          disabled={loading}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        message={notification.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
