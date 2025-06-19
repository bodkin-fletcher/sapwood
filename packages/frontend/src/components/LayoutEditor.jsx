import { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Tooltip
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ViewComfyIcon from '@mui/icons-material/ViewComfy';
import SaveIcon from '@mui/icons-material/Save';
import { getLayoutTemplate } from '../services/layoutTemplates';

/**
 * Layout Editor Component
 * Provides an interactive SVG canvas for arranging nodes and connections
 */
const LayoutEditor = ({
  nodes,
  connections,
  paperSize,
  orientation,
  zoom,
  showGrid,
  template,
  nodeGroups,
  onNodeGroupsChange,
  onZoomChange,
  onGridToggle
}) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dragNode, setDragNode] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [positions, setPositions] = useState({});
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const gridSize = 20;
  
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
  // Initialize node positions based on template
  useEffect(() => {
    // If we don't have positions yet, or template has changed, initialize with template
    if (Object.keys(positions).length === 0 || template) {
      const layoutFunction = getLayoutTemplate(template || 'grid');
      const options = {
        width: dimensions.width,
        height: dimensions.height,
        gridSize
      };
      
      const initialPositions = layoutFunction(nodes, connections, options);
      setPositions(initialPositions);
    }
  }, [nodes, connections, template, dimensions]);
  
  // Handle node drag start
  const handleDragStart = (node, e) => {
    const svg = svgRef.current;
    if (!svg) return;
    
    // Get SVG coordinates
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    // Calculate offset from node position
    const nodePosition = positions[node.id] || { x: 0, y: 0 };
    setOffset({
      x: svgP.x - nodePosition.x,
      y: svgP.y - nodePosition.y
    });
    
    setDragNode(node);
  };
    // Snap position to grid if showGrid is enabled
  const snapToGrid = (position) => {
    if (!showGrid) return position;
    
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize
    };
  };
  
  // Handle mouse move (dragging)
  const handleMouseMove = (e) => {
    if (!dragNode) return;
    const svg = svgRef.current;
    if (!svg) return;
    
    // Convert mouse coordinates to SVG coordinate system
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    // Calculate new position
    let newX = svgP.x - offset.x;
    let newY = svgP.y - offset.y;
    
    // Snap to grid if enabled
    if (showGrid) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }
    
    // Update positions
    setPositions({
      ...positions,
      [dragNode.id]: { x: newX, y: newY }
    });
  };
  
  // Handle drag end
  const handleDragEnd = () => {
    setDragNode(null);
  };
  
  // Get node groups for a specific node
  const getNodeGroups = (nodeId) => {
    return nodeGroups.filter(group => group.nodes.includes(nodeId));
  };
  
  // Save the current layout
  const saveLayout = () => {
    // In a real implementation, this would save to backend
    console.log('Saving layout:', { positions, nodeGroups });
    alert('Layout saved');
  };

  return (
    <Box 
      ref={containerRef}
      sx={{ 
        width: '100%', 
        height: '70vh',
        overflow: 'auto',
        position: 'relative',
        border: '1px solid #ccc',
        backgroundColor: '#f5f5f5'
      }}
    >
      {/* Toolbar */}
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
      >        <Tooltip title="Zoom In">
          <IconButton onClick={() => typeof onZoomChange === 'function' && onZoomChange(Math.min(zoom + 0.1, 2))}>
            <ZoomInIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out">
          <IconButton onClick={() => typeof onZoomChange === 'function' && onZoomChange(Math.max(zoom - 0.1, 0.5))}>
            <ZoomOutIcon />
          </IconButton>
        </Tooltip><Tooltip title="Toggle Grid">
          <IconButton 
            onClick={() => typeof onGridToggle === 'function' && onGridToggle()}
            color={showGrid ? 'primary' : 'default'}
          >
            <ViewComfyIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Save Layout">
          <IconButton onClick={saveLayout}>
            <SaveIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Canvas */}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          background: 'white',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* Grid background if enabled */}
        {showGrid && (
          <defs>
            <pattern 
              id="grid" 
              width={gridSize} 
              height={gridSize} 
              patternUnits="userSpaceOnUse"
            >
              <path 
                d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} 
                fill="none" 
                stroke="#ccc" 
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
        )}
        {showGrid && (
          <rect 
            x="0" 
            y="0" 
            width="100%" 
            height="100%" 
            fill="url(#grid)" 
          />
        )}
        
        {/* Node groups */}
        {nodeGroups.map((group) => {
          if (group.nodes.length === 0) return null;
          
          // Calculate group bounds
          const groupNodeIds = group.nodes.filter(id => positions[id]);
          if (groupNodeIds.length === 0) return null;
          
          // Calculate bounding box with padding
          const padding = 15;
          const nodePositions = groupNodeIds.map(id => ({ 
            ...positions[id], 
            id 
          }));
          
          const minX = Math.min(...nodePositions.map(n => n.x - 60)) - padding;
          const minY = Math.min(...nodePositions.map(n => n.y - 30)) - padding;
          const maxX = Math.max(...nodePositions.map(n => n.x + 60)) + padding;
          const maxY = Math.max(...nodePositions.map(n => n.y + 30)) + padding;
          
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
        
        {/* Connections between nodes */}
        {connections.map(connection => {
          const source = nodes.find(n => n.id === connection.source);
          const target = nodes.find(n => n.id === connection.target);
          
          if (!source || !target) return null;
          
          const sourcePos = positions[source.id] || { x: 0, y: 0 };
          const targetPos = positions[target.id] || { x: 0, y: 0 };
          
          const midX = (sourcePos.x + targetPos.x) / 2;
          const midY = (sourcePos.y + targetPos.y) / 2;
          
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
                x1={sourcePos.x}
                y1={sourcePos.y}
                x2={targetPos.x}
                y2={targetPos.y}
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
        {nodes.map(node => {
          const pos = positions[node.id] || { x: 0, y: 0 };
          const nodeGroups = getNodeGroups(node.id);
          const borderColor = nodeGroups.length > 0 ? nodeGroups[0].color : '#1976d2';
          
          return (
            <g 
              key={node.id} 
              transform={`translate(${pos.x - 60}, ${pos.y - 30})`}
              onMouseDown={(e) => handleDragStart(node, e)}
              style={{ cursor: 'move' }}
            >
              <rect
                width="120"
                height="60"
                rx="5"
                ry="5"
                fill="white"
                stroke={borderColor}
                strokeWidth="2"
              />
              <text
                x="60"
                y="25"
                textAnchor="middle"
                fill="#000"
                fontFamily="Arial, sans-serif"
                fontWeight="bold"
                fontSize="14"
              >
                {node.name}
              </text>
              <text
                x="60"
                y="45"
                textAnchor="middle"
                fill="#666"
                fontFamily="Arial, sans-serif"
                fontSize="12"
              >
                {node.type || ''}
              </text>
              {node.status && (
                <circle
                  cx="10"
                  cy="10"
                  r="5"
                  fill={node.status === 'active' ? '#4caf50' : 
                         node.status === 'warning' ? '#ff9800' : 
                         node.status === 'error' ? '#f44336' : '#9e9e9e'}
                />
              )}
            </g>
          );
        })}
      </svg>
      
      {/* Dimensions indicator */}
      <Typography 
        variant="caption" 
        component="div" 
        sx={{ 
          position: 'absolute', 
          bottom: 5, 
          right: 10, 
          backgroundColor: 'rgba(255,255,255,0.7)', 
          padding: '2px 6px', 
          borderRadius: 1 
        }}
      >
        {`${paperSize.toUpperCase()} • ${orientation} • ${Math.round(zoom * 100)}%`}
      </Typography>
    </Box>
  );
};

export default LayoutEditor;
