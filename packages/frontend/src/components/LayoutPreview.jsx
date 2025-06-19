import { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { exportToSvg } from '../services/exportUtils';
import { getLayoutTemplate } from '../services/layoutTemplates';

/**
 * Layout Preview Component
 * Renders a print/export preview of the node layout
 */
const LayoutPreview = ({
  nodes,
  connections,
  paperSize,
  orientation,
  template,
  nodeGroups,
}) => {
  const previewRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  // Paper dimensions in pixels (assuming 96 DPI)
  const paperSizes = {
    'a4': { width: 794, height: 1123 }, // A4 in pixels at 96 DPI
    'letter': { width: 816, height: 1056 },
    'legal': { width: 816, height: 1344 },
    'a3': { width: 1123, height: 1587 }
  };
  
  // Calculate display dimensions based on paper size and orientation
  useEffect(() => {
    let width = paperSizes[paperSize]?.width || 794;
    let height = paperSizes[paperSize]?.height || 1123;
    
    if (orientation === 'landscape') {
      [width, height] = [height, width];
    }
    
    setDimensions({ width, height });
  }, [paperSize, orientation]);
  
  // Handle zoom in
  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.1, 2));
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 0.1, 0.5));
  };
  
  // Handle print
  const handlePrint = () => {
    window.print();
  };
  
  // Handle export
  const handleExport = () => {
    exportToSvg(nodes, connections, {
      template,
      paperSize,
      orientation,
      nodeGroups
    });
  };  // Node position calculations using layout templates
  const calculateNodePositions = () => {
    const nodeWidth = 120;
    const nodeHeight = 60;
    
    // Get the layout function for the selected template
    const layoutFunction = getLayoutTemplate(template || 'grid');
    
    // Apply the layout to get positions
    const positions = layoutFunction(nodes, connections, {
      width: dimensions.width,
      height: dimensions.height,
      nodeWidth,
      nodeHeight
    });
    
    // Return nodes with positions and dimensions
    return nodes.map(node => ({
      ...node,
      x: positions[node.id]?.x || 0,
      y: positions[node.id]?.y || 0,
      width: nodeWidth,
      height: nodeHeight
    }));
  };
  
  // Apply calculated positions
  const positionedNodes = calculateNodePositions();
  
  // Create a node map for quick lookup
  const nodeMap = {};
  positionedNodes.forEach(node => {
    nodeMap[node.id] = node;
  });
  
  return (
    <Box sx={{ position: 'relative' }}>
      {/* Preview toolbar */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 10, 
          right: 10, 
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: 1,
          boxShadow: 1,
          padding: 0.5,
          display: 'flex'
        }}
      >
        <Tooltip title="Zoom In">
          <IconButton onClick={handleZoomIn}>
            <ZoomInIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out">
          <IconButton onClick={handleZoomOut}>
            <ZoomOutIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Export">
          <IconButton onClick={handleExport}>
            <FileDownloadIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Print">
          <IconButton onClick={handlePrint}>
            <PrintIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Preview panel */}
      <Box
        ref={previewRef}
        sx={{
          width: '100%',
          height: '70vh',
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: 3,
          backgroundColor: '#f5f5f5',
        }}
      >
        {/* Paper preview with shadow effect */}
        <Box
          sx={{
            width: dimensions.width,
            height: dimensions.height,
            backgroundColor: 'white',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            position: 'relative',
            transition: 'transform 0.2s',
            marginTop: zoom < 1 ? 2 : 0,
            '@media print': {
              boxShadow: 'none',
              margin: 0,
              padding: 0,
              transform: 'scale(1)'
            }
          }}
        >
          {/* SVG Content */}
          <svg
            width={dimensions.width}
            height={dimensions.height}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Background */}
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="white"
            />
            
            {/* Template elements based on selected template */}
            {template === 'technical' && (
              <>
                {/* Technical template frame */}
                <rect
                  x="10"
                  y="10"
                  width={dimensions.width - 20}
                  height={dimensions.height - 20}
                  fill="none"
                  stroke="#ccc"
                  strokeWidth="0.5"
                />
                
                {/* Title block */}
                <rect
                  x={dimensions.width - 200}
                  y={dimensions.height - 100}
                  width="190"
                  height="90"
                  fill="none"
                  stroke="#000"
                  strokeWidth="1"
                />
                
                <text
                  x={dimensions.width - 100}
                  y={dimensions.height - 70}
                  textAnchor="middle"
                  fontFamily="Arial, sans-serif"
                  fontSize="14"
                  fontWeight="bold"
                >
                  Sapwood Layout
                </text>
                
                <text
                  x={dimensions.width - 100}
                  y={dimensions.height - 50}
                  textAnchor="middle"
                  fontFamily="Arial, sans-serif"
                  fontSize="10"
                >
                  {`Paper: ${paperSize.toUpperCase()} • ${orientation}`}
                </text>
                
                <text
                  x={dimensions.width - 100}
                  y={dimensions.height - 30}
                  textAnchor="middle"
                  fontFamily="Arial, sans-serif"
                  fontSize="10"
                >
                  {`Date: ${new Date().toLocaleDateString()}`}
                </text>
              </>
            )}
            
            {/* Node groups */}
            {nodeGroups.map((group) => {
              if (group.nodes.length === 0) return null;
              
              // Calculate bounding box for group
              const groupNodes = group.nodes
                .map(id => nodeMap[id])
                .filter(Boolean);
                
              if (groupNodes.length === 0) return null;
              
              // Calculate group bounds with padding
              const padding = 15;
              const minX = Math.min(...groupNodes.map(n => n.x - n.width/2)) - padding;
              const minY = Math.min(...groupNodes.map(n => n.y - n.height/2)) - padding;
              const maxX = Math.max(...groupNodes.map(n => n.x + n.width/2)) + padding;
              const maxY = Math.max(...groupNodes.map(n => n.y + n.height/2)) + padding;
              
              return (
                <g key={group.id}>
                  <rect
                    x={minX}
                    y={minY}
                    width={maxX - minX}
                    height={maxY - minY}
                    rx="8"
                    ry="8"
                    fill={group.color}
                    fillOpacity="0.1"
                    stroke={group.color}
                    strokeWidth="2"
                  />
                  <text
                    x={minX + 10}
                    y={minY + 20}
                    fill={group.color}
                    fontFamily="Arial, sans-serif"
                    fontWeight="bold"
                    fontSize="14"
                  >
                    {group.name}
                  </text>
                </g>
              );
            })}
            
            {/* Connections */}
            {connections.map(connection => {
              const source = nodeMap[connection.source];
              const target = nodeMap[connection.target];
              
              if (!source || !target) return null;
              
              const midX = (source.x + target.x) / 2;
              const midY = (source.y + target.y) / 2;
              
              return (
                <g key={connection.id}>
                  <defs>
                    <marker
                      id={`arrow-${connection.id}`}
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#666"
                      />
                    </marker>
                  </defs>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="#666"
                    strokeWidth="1.5"
                    markerEnd={`url(#arrow-${connection.id})`}
                  />
                  
                  {connection.label && (
                    <>
                      <rect
                        x={midX - 40}
                        y={midY - 15}
                        width="80"
                        height="20"
                        fill="white"
                        fillOpacity="0.8"
                        rx="3"
                        ry="3"
                      />
                      <text
                        x={midX}
                        y={midY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#333"
                        fontFamily="Arial, sans-serif"
                        fontSize="12"
                      >
                        {connection.label}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
            
            {/* Nodes */}
            {positionedNodes.map(node => {
              // Determine node color based on group
              const nodeGroup = nodeGroups.find(group => group.nodes.includes(node.id));
              const borderColor = nodeGroup ? nodeGroup.color : '#1976d2';
              
              return (
                <g key={node.id}>
                  <rect
                    x={node.x - node.width/2}
                    y={node.y - node.height/2}
                    width={node.width}
                    height={node.height}
                    rx="5"
                    ry="5"
                    fill="white"
                    stroke={borderColor}
                    strokeWidth="2"
                  />
                  <text
                    x={node.x}
                    y={node.y - 5}
                    textAnchor="middle"
                    fill="#000"
                    fontFamily="Arial, sans-serif"
                    fontWeight="bold"
                    fontSize="14"
                  >
                    {node.name}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + 15}
                    textAnchor="middle"
                    fill="#666"
                    fontFamily="Arial, sans-serif"
                    fontSize="12"
                  >
                    {node.type || ''}
                  </text>
                  {node.status && (
                    <circle
                      cx={node.x - node.width/2 + 10}
                      cy={node.y - node.height/2 + 10}
                      r="5"
                      fill={node.status === 'active' ? '#4caf50' : 
                             node.status === 'warning' ? '#ff9800' : 
                             node.status === 'error' ? '#f44336' : '#9e9e9e'}
                    />
                  )}
                </g>
              );
            })}
            
            {/* Apply additional template-specific styling */}
            {template === 'detailed' && (
              <g>
                <rect
                  x="10"
                  y="10"
                  width={dimensions.width - 20}
                  height="30"
                  fill="#f0f0f0"
                  stroke="#ccc"
                />
                <text
                  x={dimensions.width / 2}
                  y="30"
                  textAnchor="middle"
                  fontFamily="Arial, sans-serif"
                  fontSize="16"
                  fontWeight="bold"
                >
                  Sapwood Node Diagram - {new Date().toLocaleDateString()}
                </text>
              </g>
            )}
          </svg>
          
          {/* Page size indicator only visible on screen (not in print) */}
          <Typography
            variant="caption"
            component="div"
            sx={{
              position: 'absolute',
              bottom: 5,
              right: 10,
              backgroundColor: 'rgba(255,255,255,0.7)',
              padding: '2px 6px',
              borderRadius: 1,
              '@media print': {
                display: 'none'
              }
            }}
          >
            {`${paperSize.toUpperCase()} • ${orientation}`}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LayoutPreview;
