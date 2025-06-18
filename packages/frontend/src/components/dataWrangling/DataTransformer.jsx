import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Grid,
  FormHelperText,
  Divider,
  Chip,
  Snackbar
} from '@mui/material';
import { dataService } from '../../services/dataApi';
import MonacoEditor from '@monaco-editor/react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import UndoIcon from '@mui/icons-material/Undo';
import SaveIcon from '@mui/icons-material/Save';

// Available transformation functions
const TRANSFORMATIONS = [
  {
    id: 'filter',
    name: 'Filter',
    description: 'Filter records based on a condition',
    inputFields: [
      { name: 'condition', type: 'expression', label: 'Condition (JS expression)', placeholder: 'record => record.value > 10' }
    ]
  },
  {
    id: 'map',
    name: 'Map',
    description: 'Transform each record in the dataset',
    inputFields: [
      { name: 'transformation', type: 'expression', label: 'Transformation (JS expression)', placeholder: 'record => ({ ...record, doubled: record.value * 2 })' }
    ]
  },
  {
    id: 'sort',
    name: 'Sort',
    description: 'Sort records by a field',
    inputFields: [
      { name: 'field', type: 'text', label: 'Field name', placeholder: 'value' },
      { name: 'direction', type: 'select', label: 'Direction', options: ['ascending', 'descending'] }
    ]
  },
  {
    id: 'groupBy',
    name: 'Group By',
    description: 'Group records by a field',
    inputFields: [
      { name: 'field', type: 'text', label: 'Field name', placeholder: 'category' }
    ]
  },
  {
    id: 'aggregate',
    name: 'Aggregate',
    description: 'Calculate aggregate values like sum, avg, count',
    inputFields: [
      { name: 'operation', type: 'select', label: 'Operation', options: ['sum', 'avg', 'count', 'min', 'max'] },
      { name: 'field', type: 'text', label: 'Field name', placeholder: 'value' }
    ]
  },
  {
    id: 'custom',
    name: 'Custom JavaScript',
    description: 'Write custom JavaScript to transform data',
    inputFields: [
      { name: 'code', type: 'code', label: 'JavaScript Code', placeholder: '// Write code that processes the "data" array and returns the result\nreturn data.filter(item => item.active);' }
    ]
  }
];

export default function DataTransformer({ data, onTransform }) {
  const [selectedTransformation, setSelectedTransformation] = useState('');
  const [transformationInputs, setTransformationInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [originalData, setOriginalData] = useState([]);
  const [transformedData, setTransformedData] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (data && data.records) {
      setOriginalData(data.records);
      setTransformedData([]);
      setSelectedTransformation('');
      setTransformationInputs({});
    }
  }, [data]);

  const handleTransformationChange = (event) => {
    setSelectedTransformation(event.target.value);
    setTransformationInputs({});
    setTransformedData([]);
  };

  const handleInputChange = (field, value) => {
    setTransformationInputs({
      ...transformationInputs,
      [field]: value
    });
  };

  const executeTransformation = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!selectedTransformation) {
        throw new Error('Please select a transformation type');
      }

      // Use the backend to execute the transformation
      const result = await dataService.transformData({
        type: selectedTransformation,
        params: transformationInputs,
        data: originalData,
        sourceId: data.nodeId || data.id
      });

      setTransformedData(result.transformedData);
      setNotification({
        open: true,
        message: 'Transformation applied successfully!',
        severity: 'success'
      });
    } catch (err) {
      console.error("Error applying transformation:", err);
      setError(err.message || "Failed to apply transformation");
      setNotification({
        open: true,
        message: 'Error: ' + (err.message || "Failed to apply transformation"),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTransformedData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (transformedData.length === 0) {
        throw new Error('No transformed data to save');
      }

      let result;      // Note: The dataService methods will handle TGDF conversion automatically
      if (data.nodeId) {
        result = await dataService.updateNodeData(data.nodeId, transformedData);
      } else {
        result = await dataService.updateConnectionData(data.id, transformedData);
      }

      setNotification({
        open: true,
        message: 'Transformed data saved successfully!',
        severity: 'success'
      });

      // Notify parent component to refresh data
      if (onTransform) onTransform();
    } catch (err) {
      console.error("Error saving transformed data:", err);
      setError(err.message || "Failed to save transformed data");
      setNotification({
        open: true,
        message: 'Error: ' + (err.message || "Failed to save transformed data"),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetTransformation = () => {
    setTransformedData([]);
    setNotification({
      open: true,
      message: 'Transformation reset',
      severity: 'info'
    });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const renderInputFields = () => {
    if (!selectedTransformation) return null;

    const transformation = TRANSFORMATIONS.find(t => t.id === selectedTransformation);
    if (!transformation) return null;

    return transformation.inputFields.map((field) => {
      switch (field.type) {
        case 'text':
          return (
            <Grid item xs={12} key={field.name}>
              <TextField
                fullWidth
                label={field.label}
                placeholder={field.placeholder}
                value={transformationInputs[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
              />
            </Grid>
          );
        case 'select':
          return (
            <Grid item xs={12} key={field.name}>
              <FormControl fullWidth>
                <InputLabel>{field.label}</InputLabel>
                <Select
                  value={transformationInputs[field.name] || ''}
                  label={field.label}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                >
                  {field.options.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          );
        case 'expression':
          return (
            <Grid item xs={12} key={field.name}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label={field.label}
                placeholder={field.placeholder}
                value={transformationInputs[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
              />
              <FormHelperText>
                Enter a JavaScript expression. Example: {field.placeholder}
              </FormHelperText>
            </Grid>
          );
        case 'code':
          return (
            <Grid item xs={12} key={field.name}>
              <Typography variant="subtitle2" gutterBottom>
                {field.label}
              </Typography>
              <Paper variant="outlined" sx={{ height: 200 }}>
                <MonacoEditor
                  language="javascript"
                  value={transformationInputs[field.name] || field.placeholder}
                  onChange={(value) => handleInputChange(field.name, value)}
                  options={{
                    minimap: { enabled: false },
                    automaticLayout: true,
                    fontSize: 14
                  }}
                />
              </Paper>
              <FormHelperText>
                Write code to transform the data array. Return the transformed result.
              </FormHelperText>
            </Grid>
          );
        default:
          return null;
      }
    });
  };

  const renderPreview = () => {
    // Display both original and transformed data side by side
    return (
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="subtitle2" gutterBottom>
            Original Data
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
            <pre style={{ margin: 0, fontSize: '0.8rem' }}>
              {JSON.stringify(originalData, null, 2)}
            </pre>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2" gutterBottom>
            Transformed Data {transformedData.length > 0 && `(${transformedData.length} records)`}
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
            {transformedData.length > 0 ? (
              <pre style={{ margin: 0, fontSize: '0.8rem' }}>
                {JSON.stringify(transformedData, null, 2)}
              </pre>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                Apply transformation to see results here
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    );
  };

  if (!data) {
    return (
      <Alert severity="info">
        Select a node or connection from the left panel to transform its data.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Transform Data
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {data.nodeId 
          ? `Transforming data for node: ${data.nodeName || data.nodeId}` 
          : `Transforming data for connection: ${data.sourceName || data.source} → ${data.targetName || data.target}`}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Transformation Type</InputLabel>
            <Select
              value={selectedTransformation}
              label="Transformation Type"
              onChange={handleTransformationChange}
            >
              {TRANSFORMATIONS.map(transform => (
                <MenuItem key={transform.id} value={transform.id}>
                  {transform.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {selectedTransformation ? 
                TRANSFORMATIONS.find(t => t.id === selectedTransformation)?.description :
                'Select a transformation type'
              }
            </FormHelperText>
          </FormControl>
        </Grid>

        {renderInputFields()}

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={executeTransformation}
              disabled={loading || !selectedTransformation}
            >
              Apply Transformation
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Divider>
            <Chip label="Preview" />
          </Divider>
        </Grid>

        <Grid item xs={12}>
          {renderPreview()}
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<UndoIcon />}
              onClick={resetTransformation}
              disabled={loading || transformedData.length === 0}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={saveTransformedData}
              disabled={loading || transformedData.length === 0}
            >
              {loading ? 'Saving...' : 'Save Transformed Data'}
            </Button>
          </Box>
        </Grid>
      </Grid>

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
