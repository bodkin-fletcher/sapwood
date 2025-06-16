import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, MenuItem, Grid } from '@mui/material';
import { useNodes } from '../context/NodeContext';

const CreateNodeDialog = ({ open, onClose }) => {
  const { addNode } = useNodes();
  const [formValues, setFormValues] = useState({
    name: '',
    type: 'service',
    host: '',
    port: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

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

  const handleSubmit = async () => {
    if (!validate()) return;

    const node = {
      ...formValues,
      port: formValues.port ? parseInt(formValues.port, 10) : undefined
    };

    const result = await addNode(node);
    if (result) {
      handleReset();
      onClose();
    }
  };

  const handleReset = () => {
    setFormValues({
      name: '',
      type: 'service',
      host: '',
      port: '',
      description: ''
    });
    setErrors({});
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="sm">
      <DialogTitle>Create New Node</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              label="Name"
              value={formValues.name}
              onChange={handleChange('name')}
              fullWidth
              error={!!errors.name}
              helperText={errors.name}
              autoFocus
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
              <MenuItem value="gateway">API Gateway</MenuItem>
              <MenuItem value="storage">Database/Storage</MenuItem>
              <MenuItem value="service">Service</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={8}>
            <TextField
              label="Host"
              value={formValues.host}
              onChange={handleChange('host')}
              placeholder="localhost or IP address"
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
              placeholder="Optional"
              fullWidth
              error={!!errors.port}
              helperText={errors.port}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              value={formValues.description}
              onChange={handleChange('description')}
              multiline
              rows={3}
              fullWidth
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateNodeDialog;
