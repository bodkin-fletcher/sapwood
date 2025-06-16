import { useState } from 'react';
import { Box, Button, Paper, Typography, Grid, TextField, Slider, FormControlLabel, Switch, InputAdornment } from '@mui/material';
import { useSettings } from '../context/SettingsContext';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';

const SettingsPage = () => {
  const { settings, updateSettings, resetSettings, loading } = useSettings();
  const [formValues, setFormValues] = useState({
    heartbeatInterval: settings.heartbeatInterval,
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
    } else {
      // If not saved, just reset form to current settings
      setFormValues({
        heartbeatInterval: settings.heartbeatInterval,
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
          </Box>

          <Grid container spacing={3}>
            {/* Heartbeat Interval */}
            <Grid item xs={12}>
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
                    step={1}
                    min={5}
                    max={60}
                  />
                </Grid>
                <Grid item>
                  <TextField
                    value={formValues.heartbeatInterval}
                    onChange={handleChange('heartbeatInterval')}
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

            {/* Theme Toggle */}
            <Grid item xs={12}>
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
            <Grid item xs={12}>
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
