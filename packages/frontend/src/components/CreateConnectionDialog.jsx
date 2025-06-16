import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { useNodes } from '../context/NodeContext';

const CreateConnectionDialog = ({ open, onClose }) => {
  const { nodes, addConnection } = useNodes();
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [errors, setErrors] = useState({});

  const handleSourceChange = (event) => {
    setSourceId(event.target.value);
    if (errors.source) {
      setErrors({ ...errors, source: null });
    }
  };

  const handleTargetChange = (event) => {
    setTargetId(event.target.value);
    if (errors.target) {
      setErrors({ ...errors, target: null });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!sourceId) newErrors.source = 'Please select a source node';
    if (!targetId) newErrors.target = 'Please select a target node';
    if (sourceId === targetId && sourceId) newErrors.target = 'Source and target must be different';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const result = await addConnection(sourceId, targetId);
    if (result) {
      handleReset();
      onClose();
    }
  };

  const handleReset = () => {
    setSourceId('');
    setTargetId('');
    setErrors({});
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel}>
      <DialogTitle>Connect Nodes</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <FormControl fullWidth error={!!errors.source} sx={{ mb: 3 }}>
          <InputLabel id="source-node-label">Source Node</InputLabel>
          <Select
            labelId="source-node-label"
            id="source-node"
            value={sourceId}
            label="Source Node"
            onChange={handleSourceChange}
          >
            {nodes.map(node => (
              <MenuItem key={node.id} value={node.id}>
                {node.name} ({node.host})
              </MenuItem>
            ))}
          </Select>
          {errors.source && <FormHelperText>{errors.source}</FormHelperText>}
        </FormControl>

        <FormControl fullWidth error={!!errors.target}>
          <InputLabel id="target-node-label">Target Node</InputLabel>
          <Select
            labelId="target-node-label"
            id="target-node"
            value={targetId}
            label="Target Node"
            onChange={handleTargetChange}
          >
            {nodes.map(node => (
              <MenuItem 
                key={node.id} 
                value={node.id}
                disabled={node.id === sourceId}
              >
                {node.name} ({node.host})
              </MenuItem>
            ))}
          </Select>
          {errors.target && <FormHelperText>{errors.target}</FormHelperText>}
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Connect
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateConnectionDialog;
