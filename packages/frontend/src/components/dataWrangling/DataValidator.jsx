import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Divider,
  Grid,
  Chip,
  Snackbar
} from '@mui/material';
import { dataService } from '../../services/dataApi';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';

// Available validation types
const VALIDATION_RULES = [
  {
    id: 'schema',
    name: 'Schema Validation',
    description: 'Validates that data conforms to an expected schema structure'
  },
  {
    id: 'dataType',
    name: 'Data Type Checking',
    description: 'Checks that data values match expected types'
  },
  {
    id: 'required',
    name: 'Required Fields',
    description: 'Ensures all required fields are present'
  },
  {
    id: 'range',
    name: 'Value Range Checks',
    description: 'Confirms values fall within acceptable ranges'
  },
  {
    id: 'format',
    name: 'Format Validation',
    description: 'Validates specific formats like emails, dates, etc.'
  }
];

export default function DataValidator({ data, onValidate }) {
  const [validationResults, setValidationResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [selectedRules, setSelectedRules] = useState(['schema', 'dataType', 'required']);

  const toggleRule = (ruleId) => {
    if (selectedRules.includes(ruleId)) {
      setSelectedRules(selectedRules.filter(id => id !== ruleId));
    } else {
      setSelectedRules([...selectedRules, ruleId]);
    }
  };

  const runValidation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!data) {
        throw new Error('No data available to validate');
      }

      // Use the backend to validate the data
      const results = await dataService.validateData({
        rules: selectedRules,
        data: data.records,
        sourceId: data.nodeId || data.id
      });
      
      setValidationResults(results);
      
      setNotification({
        open: true,
        message: 'Validation completed',
        severity: results.valid ? 'success' : 'warning'
      });
      
    } catch (err) {
      console.error("Error during validation:", err);
      setError(err.message || "Failed to validate data");
      setValidationResults(null);
      setNotification({
        open: true,
        message: 'Error: ' + (err.message || "Failed to validate data"),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveValidationResults = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!validationResults) {
        throw new Error('No validation results to save');
      }

      // Save validation results for the node/connection
      await dataService.saveValidationResults({
        results: validationResults,
        sourceId: data.nodeId || data.id,
        sourceType: data.nodeId ? 'node' : 'connection'
      });

      setNotification({
        open: true,
        message: 'Validation results saved',
        severity: 'success'
      });

      if (onValidate) onValidate();
      
    } catch (err) {
      console.error("Error saving validation results:", err);
      setError(err.message || "Failed to save validation results");
      setNotification({
        open: true,
        message: 'Error: ' + (err.message || "Failed to save validation results"),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const renderRuleSelection = () => {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Select Validation Rules
        </Typography>
        <Grid container spacing={1}>
          {VALIDATION_RULES.map(rule => (
            <Grid item key={rule.id}>
              <Chip
                label={rule.name}
                color={selectedRules.includes(rule.id) ? 'primary' : 'default'}
                onClick={() => toggleRule(rule.id)}
                sx={{ mr: 1 }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  const renderValidationResultsSummary = () => {
    if (!validationResults) return null;
    
    const { valid, errors, warnings } = validationResults;
    
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Validation Summary
        </Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {valid ? (
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
            ) : (
              <ErrorIcon color="error" sx={{ mr: 1 }} />
            )}
            <Typography variant="body1">
              {valid ? 'Data is valid' : 'Data has validation issues'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="subtitle2" color="error">
                  Errors: {errors.length}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="subtitle2" color="warning.main">
                  Warnings: {warnings.length}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="subtitle2">
                  Records Checked: {validationResults.recordsChecked || 0}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Paper>
      </Box>
    );
  };

  const renderValidationDetails = () => {
    if (!validationResults || (!validationResults.errors.length && !validationResults.warnings.length)) {
      return null;
    }
    
    return (
      <Box>
        <Divider sx={{ mb: 2 }}>
          <Chip label="Details" />
        </Divider>
        
        {validationResults.errors.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" color="error" gutterBottom>
              Errors
            </Typography>
            <List dense>
              {validationResults.errors.map((error, index) => (
                <ListItem key={index} divider={index < validationResults.errors.length - 1}>
                  <ListItemIcon>
                    <ErrorIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={error.message}
                    secondary={`Record ${error.recordIndex !== undefined ? error.recordIndex : 'N/A'} - ${error.rule}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
        
        {validationResults.warnings.length > 0 && (
          <Box>
            <Typography variant="subtitle1" color="warning.main" gutterBottom>
              Warnings
            </Typography>
            <List dense>
              {validationResults.warnings.map((warning, index) => (
                <ListItem key={index} divider={index < validationResults.warnings.length - 1}>
                  <ListItemIcon>
                    <WarningIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={warning.message}
                    secondary={`Record ${warning.recordIndex !== undefined ? warning.recordIndex : 'N/A'} - ${warning.rule}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    );
  };

  if (!data) {
    return (
      <Alert severity="info">
        Select a node or connection from the left panel to validate its data.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Data Validation
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {data.nodeId 
          ? `Validating data for node: ${data.nodeName || data.nodeId}` 
          : `Validating data for connection: ${data.sourceName || data.source} → ${data.targetName || data.target}`}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {renderRuleSelection()}
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
          onClick={runValidation}
          disabled={loading || selectedRules.length === 0}
        >
          {loading ? 'Running Validation...' : 'Run Validation'}
        </Button>
      </Box>

      {renderValidationResultsSummary()}
      {renderValidationDetails()}
      
      {validationResults && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={saveValidationResults}
            disabled={loading}
          >
            Save Validation Results
          </Button>
        </Box>
      )}

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
