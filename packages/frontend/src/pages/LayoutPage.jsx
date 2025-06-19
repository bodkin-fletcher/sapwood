import { useState } from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import LayoutEditor from '../components/LayoutEditor';
import LayoutControls from '../components/LayoutControls';
import LayoutPreview from '../components/LayoutPreview';
import { useNodes } from '../context/NodeContext';

const LayoutPage = () => {
  const { nodes, connections } = useNodes();
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [paperSize, setPaperSize] = useState('a4');
  const [orientation, setOrientation] = useState('landscape');
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [nodeGroups, setNodeGroups] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Handle template change
  const handleTemplateChange = (template) => {
    setSelectedTemplate(template);
  };
  
  // Handle paper size change
  const handlePaperSizeChange = (size) => {
    setPaperSize(size);
  };
  
  // Handle orientation change
  const handleOrientationChange = (newOrientation) => {
    setOrientation(newOrientation);
  };
  
  // Toggle between edit and preview mode
  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
  };
  
  // Update node groups
  const updateNodeGroups = (groups) => {
    setNodeGroups(groups);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Layout & Export
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <LayoutControls 
              selectedTemplate={selectedTemplate}
              onTemplateChange={handleTemplateChange}
              paperSize={paperSize}
              onPaperSizeChange={handlePaperSizeChange}
              orientation={orientation}
              onOrientationChange={handleOrientationChange}
              zoom={zoom}
              onZoomChange={setZoom}
              showGrid={showGrid}
              onGridToggle={() => setShowGrid(!showGrid)}
              previewMode={previewMode}
              onPreviewToggle={togglePreviewMode}
              nodes={nodes}
              nodeGroups={nodeGroups}
              onNodeGroupsChange={updateNodeGroups}
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2, minHeight: '70vh' }}>
            {previewMode ? (
              <LayoutPreview
                nodes={nodes}
                connections={connections}
                paperSize={paperSize}
                orientation={orientation}
                template={selectedTemplate}
                nodeGroups={nodeGroups}
              />
            ) : (
              <LayoutEditor                nodes={nodes}
                connections={connections}
                paperSize={paperSize}
                orientation={orientation}
                zoom={zoom}
                showGrid={showGrid}
                template={selectedTemplate}
                nodeGroups={nodeGroups}
                onNodeGroupsChange={updateNodeGroups}
                onZoomChange={setZoom}
                onGridToggle={() => setShowGrid(!showGrid)}
              />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LayoutPage;
