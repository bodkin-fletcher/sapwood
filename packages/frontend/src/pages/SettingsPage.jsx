import { useState } from 'react';
import { Box, Button, Paper, Typography, Grid, TextField, Slider, FormControlLabel, Switch, InputAdornment } from '@mui/material';
import { useSettings } from '../context/SettingsContext';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';

const SettingsPage = () => {
  const { settings, updateSettings, resetSettings, loading } = useSettings(); const [formValues, setFormValues] = useState({
    heartbeatInterval: settings.heartbeatInterval,
    retryAttempts: settings.retryAttempts || 3,
    retryDelay: settings.retryDelay || 2,
    statusUpdateFrequency: settings.statusUpdateFrequency || 5,
    monitoringEnabled: settings.monitoringEnabled !== false, // default to true
    dataHistorySize: settings.dataHistorySize || 25,
    notificationThreshold: settings.notificationThreshold || 'warning',
    theme: settings.theme,
    displayMode: settings.displayMode
  });
  const [isSaved, setIsSaved] = useState(true);

  const handleChange = (prop) => (event) => {
    setFormValues({ ...formValues, [prop]: event.target.value });
    setIsSaved(false);
  };

  const handleSliderChange = (prop) => (event, newValue) => {
    setFormValues({ ...formValues, [prop]: newValue });
    setIsSaved(false);
  };

  const handleSwitchChange = (prop) => (event) => {
    setFormValues({ ...formValues, [prop]: event.target.checked ? 'dark' : 'light' });
    setIsSaved(false);
  };

  const handleSave = () => {
    updateSettings(formValues);
    setIsSaved(true);
  };
  const handleReset = () => {
    if (isSaved) {
      // If already saved, reset to defaults after confirmation
      if (window.confirm('Are you sure you want to reset all settings to default values?')) {
        resetSettings().then(() => {
          setFormValues({
            heartbeatInterval: settings.heartbeatInterval,
            theme: settings.theme,
            displayMode: settings.displayMode
          });
          setIsSaved(true);
        });
      }
    } else {      // If not saved, just reset form to current settings
      setFormValues({
        heartbeatInterval: settings.heartbeatInterval,
        retryAttempts: settings.retryAttempts || 3,
        retryDelay: settings.retryDelay || 2,
        statusUpdateFrequency: settings.statusUpdateFrequency || 5,
        monitoringEnabled: settings.monitoringEnabled !== false,
        dataHistorySize: settings.dataHistorySize || 25,
        notificationThreshold: settings.notificationThreshold || 'warning',
        theme: settings.theme,
        displayMode: settings.displayMode
      });
      setIsSaved(true);
    }
  };

  return (
    <Grid container spacing={2} justifyContent="center">
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3, mt: 2 }}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" component="h2">
              Application Settings
            </Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleReset}
                sx={{ mr: 1 }}
                disabled={isSaved}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={isSaved}
              >
                Save Changes
              </Button>
            </Box>
          </Box>          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Monitoring Settings</Typography>
            </Grid>

            {/* Monitoring Enabled Toggle */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formValues.monitoringEnabled}
                    onChange={(e) => {
                      setFormValues({ ...formValues, monitoringEnabled: e.target.checked });
                      setIsSaved(false);
                    }}
                  />
                }
                label="Enable Automatic Monitoring"
              />
            </Grid>

            {/* Heartbeat Interval */}
            <Grid item xs={12} md={6}>
              <Typography id="heartbeat-slider" gutterBottom>
                Heartbeat Interval (seconds)
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <Slider
                    value={formValues.heartbeatInterval}
                    onChange={handleSliderChange('heartbeatInterval')}
                    aria-labelledby="heartbeat-slider"
                    valueLabelDisplay="auto"
                    disabled={!formValues.monitoringEnabled}
                    step={1}
                    min={5}
                    max={60}
                  />
                </Grid>
                <Grid item>
                  <TextField
                    value={formValues.heartbeatInterval}
                    onChange={handleChange('heartbeatInterval')}
                    disabled={!formValues.monitoringEnabled}
                    inputProps={{
                      step: 1,
                      min: 5,
                      max: 60,
                      type: 'number',
                      'aria-labelledby': 'heartbeat-slider',
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">sec</InputAdornment>,
                    }}
                    sx={{ width: '100px' }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Status Update Frequency */}
            <Grid item xs={12} md={6}>
              <Typography id="status-update-slider" gutterBottom>
                Status Update Frequency (seconds)
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <Slider
                    value={formValues.statusUpdateFrequency}
                    onChange={handleSliderChange('statusUpdateFrequency')}
                    aria-labelledby="status-update-slider"
                    valueLabelDisplay="auto"
                    disabled={!formValues.monitoringEnabled}
                    step={1}
                    min={1}
                    max={30}
                  />
                </Grid>
                <Grid item>
                  <TextField
                    value={formValues.statusUpdateFrequency}
                    onChange={handleChange('statusUpdateFrequency')}
                    disabled={!formValues.monitoringEnabled}
                    inputProps={{
                      step: 1,
                      min: 1,
                      max: 30,
                      type: 'number',
                      'aria-labelledby': 'status-update-slider',
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">sec</InputAdornment>,
                    }}
                    sx={{ width: '100px' }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Retry Attempts */}
            <Grid item xs={12} md={6}>
              <Typography id="retry-attempts-slider" gutterBottom>
                Retry Attempts
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <Slider
                    value={formValues.retryAttempts}
                    onChange={handleSliderChange('retryAttempts')}
                    aria-labelledby="retry-attempts-slider"
                    valueLabelDisplay="auto"
                    step={1}
                    min={0}
                    max={5}
                  />
                </Grid>
                <Grid item>
                  <TextField
                    value={formValues.retryAttempts}
                    onChange={handleChange('retryAttempts')}
                    inputProps={{
                      step: 1,
                      min: 0,
                      max: 5,
                      type: 'number',
                      'aria-labelledby': 'retry-attempts-slider',
                    }}
                    sx={{ width: '100px' }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Retry Delay */}
            <Grid item xs={12} md={6}>
              <Typography id="retry-delay-slider" gutterBottom>
                Retry Delay (seconds)
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <Slider
                    value={formValues.retryDelay}
                    onChange={handleSliderChange('retryDelay')}
                    aria-labelledby="retry-delay-slider"
                    valueLabelDisplay="auto"
                    step={1}
                    min={1}
                    max={10}
                  />
                </Grid>
                <Grid item>
                  <TextField
                    value={formValues.retryDelay}
                    onChange={handleChange('retryDelay')}
                    inputProps={{
                      step: 1,
                      min: 1,
                      max: 10,
                      type: 'number',
                      'aria-labelledby': 'retry-delay-slider',
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">sec</InputAdornment>,
                    }}
                    sx={{ width: '100px' }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Data History Size */}
            <Grid item xs={12} md={6}>
              <Typography id="history-size-slider" gutterBottom>
                Data History Size (entries)
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <Slider
                    value={formValues.dataHistorySize}
                    onChange={handleSliderChange('dataHistorySize')}
                    aria-labelledby="history-size-slider"
                    valueLabelDisplay="auto"
                    step={5}
                    min={10}
                    max={100}
                  />
                </Grid>
                <Grid item>
                  <TextField
                    value={formValues.dataHistorySize}
                    onChange={handleChange('dataHistorySize')}
                    inputProps={{
                      step: 5,
                      min: 10,
                      max: 100,
                      type: 'number',
                      'aria-labelledby': 'history-size-slider',
                    }}
                    sx={{ width: '100px' }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Notification Threshold */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Notification Threshold"
                value={formValues.notificationThreshold}
                onChange={handleChange('notificationThreshold')}
                SelectProps={{
                  native: true,
                }}
                fullWidth
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Appearance Settings</Typography>
            </Grid>

            {/* Theme Toggle */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formValues.theme === 'dark'}
                    onChange={handleSwitchChange('theme')}
                  />
                }
                label="Dark Mode"
              />
            </Grid>

            {/* Display Mode */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Display Mode"
                value={formValues.displayMode}
                onChange={handleChange('displayMode')}
                SelectProps={{
                  native: true,
                }}
                fullWidth
              >
                <option value="standard">Standard</option>
                <option value="compact">Compact</option>
                <option value="expanded">Expanded</option>
              </TextField>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default SettingsPage;
