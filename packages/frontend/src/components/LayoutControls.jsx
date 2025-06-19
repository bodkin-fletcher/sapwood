import { useState } from 'react';
import { 
  Box, Typography, FormControl, InputLabel, Select, MenuItem, 
  Slider, FormGroup, FormControlLabel, Switch, Button, 
  Divider, List, ListItem, ListItemText, TextField, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DataObjectIcon from '@mui/icons-material/DataObject';
import TableChartIcon from '@mui/icons-material/TableChart';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import PreviewIcon from '@mui/icons-material/Preview';
import { exportToSvg, exportToPdf, exportToPng, exportToJson, exportToCsv } from '../services/exportUtils';
import { layoutTemplates } from '../services/layoutTemplates';

const LayoutControls = ({
  selectedTemplate,
  onTemplateChange,
  paperSize,
  onPaperSizeChange,
  orientation,
  onOrientationChange,
  zoom,
  onZoomChange,
  showGrid,
  onGridToggle,
  previewMode,
  onPreviewToggle,
  nodes,
  nodeGroups,
  onNodeGroupsChange
}) => {
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState({ name: '', color: '#1976d2', nodes: [] });
  const [editMode, setEditMode] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);  // Templates available for the layout
  const templates = layoutTemplates;
  
  // Paper sizes with dimensions in mm
  const paperSizes = [
    { id: 'a4', name: 'A4', width: 210, height: 297 },
    { id: 'letter', name: 'Letter', width: 215.9, height: 279.4 },
    { id: 'legal', name: 'Legal', width: 215.9, height: 355.6 },
    { id: 'a3', name: 'A3', width: 297, height: 420 }
  ];
    // Apply the selected template to arrange nodes
  const applyTemplate = () => {
    // Template application happens automatically in the LayoutEditor component
    // Just trigger the template change
    onTemplateChange(selectedTemplate);
  };
  
  // Handle opening the group dialog
  const handleOpenGroupDialog = (group = null) => {
    if (group) {
      setCurrentGroup({ ...group });
      setEditMode(true);
    } else {
      setCurrentGroup({ name: '', color: '#1976d2', nodes: [] });
      setEditMode(false);
    }
    setGroupDialogOpen(true);
  };
  
  // Handle closing the group dialog
  const handleCloseGroupDialog = () => {
    setGroupDialogOpen(false);
  };
  
  // Handle saving a group
  const handleSaveGroup = () => {
    if (!currentGroup.name) return;
    
    if (editMode) {
      // Update existing group
      const updatedGroups = nodeGroups.map(group => 
        group.id === currentGroup.id ? currentGroup : group
      );
      onNodeGroupsChange(updatedGroups);
    } else {
      // Create new group
      const newGroup = {
        ...currentGroup,
        id: `group-${Date.now()}`
      };
      onNodeGroupsChange([...nodeGroups, newGroup]);
    }
    
    handleCloseGroupDialog();
  };
  
  // Handle deleting a group
  const handleDeleteGroup = (groupId) => {
    const updatedGroups = nodeGroups.filter(group => group.id !== groupId);
    onNodeGroupsChange(updatedGroups);
  };
  
  // Toggle node selection for a group
  const toggleNodeInGroup = (nodeId) => {
    const nodeIndex = currentGroup.nodes.indexOf(nodeId);
    if (nodeIndex >= 0) {
      // Remove node from group
      setCurrentGroup({
        ...currentGroup,
        nodes: currentGroup.nodes.filter(id => id !== nodeId)
      });
    } else {
      // Add node to group
      setCurrentGroup({
        ...currentGroup,
        nodes: [...currentGroup.nodes, nodeId]
      });
    }
  };
  
  // Handle export operations
  const handleExport = async (format) => {
    switch (format) {
      case 'svg':
        exportToSvg(nodes, connections, {
          template: selectedTemplate,
          paperSize,
          orientation,
          nodeGroups
        });
        break;
      case 'pdf':
        exportToPdf(nodes, connections, {
          template: selectedTemplate,
          paperSize,
          orientation,
          nodeGroups
        });
        break;
      case 'png':
        exportToPng(nodes, connections, {
          template: selectedTemplate,
          paperSize,
          orientation,
          nodeGroups
        });
        break;
      case 'json':
        exportToJson(nodes, connections, nodeGroups);
        break;
      case 'csv':
        exportToCsv(nodes, connections);
        break;
      default:
        console.error('Unsupported export format:', format);
    }
    
    setExportMenuOpen(false);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Layout Settings</Typography>
      
      {/* Template Selection */}      <FormControl fullWidth margin="normal">
        <InputLabel id="template-select-label">Template</InputLabel>
        <Select
          labelId="template-select-label"
          id="template-select"
          value={selectedTemplate}
          onChange={(e) => onTemplateChange(e.target.value)}
          label="Template"
        >
          {templates.map((template) => (
            <MenuItem key={template.id} value={template.id}>
              {template.name}
              {template.description && (
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  {template.description}
                </Typography>
              )}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      {/* Apply Template button */}
      <Box sx={{ mt: 1, mb: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={applyTemplate}
          startIcon={<ViewWeekIcon />}
          size="small"
        >
          Apply Template
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Rearranges nodes according to the selected layout pattern
        </Typography>
      </Box>
      
      {/* Paper Size Selection */}
      <FormControl fullWidth margin="normal">
        <InputLabel id="size-select-label">Paper Size</InputLabel>
        <Select
          labelId="size-select-label"
          id="size-select"
          value={paperSize}
          onChange={(e) => onPaperSizeChange(e.target.value)}
          label="Paper Size"
        >
          {paperSizes.map((size) => (
            <MenuItem key={size.id} value={size.id}>{size.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      
      {/* Orientation */}
      <FormControl fullWidth margin="normal">
        <InputLabel id="orientation-select-label">Orientation</InputLabel>
        <Select
          labelId="orientation-select-label"
          id="orientation-select"
          value={orientation}
          onChange={(e) => onOrientationChange(e.target.value)}
          label="Orientation"
        >
          <MenuItem value="portrait">Portrait</MenuItem>
          <MenuItem value="landscape">Landscape</MenuItem>
        </Select>
      </FormControl>
      
      {/* Zoom Slider */}
      <Box sx={{ mt: 3, mb: 2 }}>
        <Typography id="zoom-slider-label" gutterBottom>
          Zoom
        </Typography>
        <Slider
          value={zoom}
          onChange={(e, newValue) => onZoomChange(newValue)}
          min={0.5}
          max={2}
          step={0.1}
          aria-labelledby="zoom-slider-label"
          valueLabelDisplay="auto"
          valueLabelFormat={value => `${Math.round(value * 100)}%`}
        />
      </Box>
      
      {/* Grid Toggle */}
      <FormGroup>
        <FormControlLabel 
          control={<Switch checked={showGrid} onChange={onGridToggle} />}
          label="Show Grid" 
        />
      </FormGroup>
      
      {/* Preview Mode Toggle */}
      <Button
        variant={previewMode ? "contained" : "outlined"}
        startIcon={<PreviewIcon />}
        onClick={onPreviewToggle}
        fullWidth
        sx={{ mt: 2 }}
      >
        {previewMode ? "Exit Preview" : "Preview Layout"}
      </Button>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Node Groups Section */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>Node Groups</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => handleOpenGroupDialog()}
          fullWidth
          sx={{ mb: 2 }}
        >
          Add Group
        </Button>
        
        {nodeGroups.length > 0 ? (
          <List dense>
            {nodeGroups.map((group) => (
              <ListItem
                key={group.id}
                secondaryAction={
                  <Box>
                    <IconButton edge="end" onClick={() => handleOpenGroupDialog(group)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDeleteGroup(group.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 16, 
                          height: 16, 
                          bgcolor: group.color, 
                          borderRadius: '50%',
                          mr: 1
                        }} 
                      />
                      {group.name}
                    </Box>
                  }
                  secondary={`${group.nodes.length} nodes`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            No groups created yet
          </Typography>
        )}
      </Box>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Export Section */}
      <Box>
        <Typography variant="h6" gutterBottom>Export Options</Typography>
        
        <Stack spacing={1} sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ImageIcon />}
            onClick={() => handleExport('svg')}
            fullWidth
          >
            Export SVG
          </Button>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => handleExport('pdf')}
            fullWidth
          >
            Export PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<ImageIcon />}
            onClick={() => handleExport('png')}
            fullWidth
          >
            Export PNG
          </Button>
          <Button
            variant="outlined"
            startIcon={<DataObjectIcon />}
            onClick={() => handleExport('json')}
            fullWidth
          >
            Export JSON
          </Button>
          <Button
            variant="outlined"
            startIcon={<TableChartIcon />}
            onClick={() => handleExport('csv')}
            fullWidth
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            fullWidth
          >
            Print Layout
          </Button>
        </Stack>
      </Box>
      
      {/* Group Dialog */}
      <Dialog open={groupDialogOpen} onClose={handleCloseGroupDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Group' : 'Create Group'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="group-name"
            label="Group Name"
            fullWidth
            variant="outlined"
            value={currentGroup.name}
            onChange={(e) => setCurrentGroup({...currentGroup, name: e.target.value})}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Group Color</Typography>
            <input 
              type="color" 
              value={currentGroup.color} 
              onChange={(e) => setCurrentGroup({...currentGroup, color: e.target.value})} 
              style={{ width: '100%', height: '40px' }}
            />
          </Box>
          
          <Typography variant="subtitle2" gutterBottom>Select Nodes</Typography>
          <List dense sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #eee' }}>
            {nodes.map(node => (
              <ListItem key={node.id} dense>
                <FormControlLabel 
                  control={
                    <Switch 
                      checked={currentGroup.nodes.includes(node.id)} 
                      onChange={() => toggleNodeInGroup(node.id)} 
                    />
                  }
                  label={node.name}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGroupDialog}>Cancel</Button>
          <Button onClick={handleSaveGroup} variant="contained" disabled={!currentGroup.name}>
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LayoutControls;
