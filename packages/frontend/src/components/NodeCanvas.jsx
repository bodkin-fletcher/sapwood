import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { useNodes } from '../context/NodeContext';

// Helper function to calculate hexagon points
const calculateHexagonPoints = (x, y, size) => {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    points.push(`${x + size * Math.cos(angle)},${y + size * Math.sin(angle)}`);
  }
  return points.join(' ');
};

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status) {
    case 'active':
      return '#4caf50'; // Green
    case 'inactive':
      return '#f44336'; // Red
    case 'warning':
      return '#ff9800'; // Orange
    default:
      return '#9e9e9e'; // Grey
  }
};

// Helper function to get node type icon path
const getNodeTypeIcon = (type) => {
  switch (type) {
    case 'gateway':
      return 'M10,2L3,9H7V15H13V9H17L10,2M7,18V21H13V18H7Z'; // API Gateway
    case 'storage':
      return 'M2,2H8V8H2V2M10,2H16V8H10V2M18,2H22V8H18V2M2,10H8V16H2V10M10,10H16V16H10V10M18,10H22V16H18V10M2,18H8V22H2V18M10,18H16V22H10V18M18,18H22V22H18V18Z'; // Database
    case 'service':
      return 'M8,5.14V19.14L19,12.14L8,5.14Z'; // Service (play button)
    default:
      return 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z'; // Default (circle)
  }
};

const NodeCanvas = ({ nodes, onSelectNode, selectedNodeId }) => {
  const svgRef = useRef(null);
  const { connections } = useNodes();
  const [nodePositions, setNodePositions] = useState({});
  
  // Calculate node positions in a grid layout
  useEffect(() => {
    const positions = {};
    const columns = 3; // Number of columns in the grid
    const startX = 150;
    const startY = 100;
    const xGap = 200;
    const yGap = 150;
    
    nodes.forEach((node, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      
      positions[node.id] = {
        x: startX + (col * xGap),
        y: startY + (row * yGap)
      };
    });
    
    setNodePositions(positions);
  }, [nodes]);

  useEffect(() => {
    // In a more complex implementation, we would handle pan and zoom here
    // For now, we just ensure the SVG fits the container
    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (svgRef.current) {
        svgRef.current.setAttribute('width', width);
        svgRef.current.setAttribute('height', height);
        svgRef.current.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }
    });

    if (svgRef.current) {
      resizeObserver.observe(svgRef.current.parentElement);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const handleNodeClick = (node) => {
    onSelectNode(node);
  };
  
  // Calculate connection path between two nodes
  const getConnectionPath = (sourceId, targetId) => {
    const source = nodePositions[sourceId];
    const target = nodePositions[targetId];
    
    if (!source || !target) return '';
    
    // Simple direct line for now
    return `M${source.x},${source.y} L${target.x},${target.y}`;
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <defs>
          <filter id="node-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b98a5" />
          </marker>
        </defs>

        {/* Render connections */}
        <g>
          {connections.map((connection) => (
            <path
              key={connection.id}
              d={getConnectionPath(connection.source, connection.target)}
              stroke="#8b98a5"
              strokeWidth={2}
              fill="none"
              strokeDasharray="5,5"
              markerEnd="url(#arrow)"
            />
          ))}
        </g>
        
        {/* Render nodes */}
        {nodes.map((node) => {
          const position = nodePositions[node.id] || { x: 0, y: 0 };
          const { x, y } = position;
          const size = 40;
          const isSelected = node.id === selectedNodeId;
          
          return (
            <g 
              key={node.id} 
              onClick={() => handleNodeClick(node)}
              style={{ cursor: 'pointer' }}
            >
              {/* Hexagon shape */}
              <polygon
                points={calculateHexagonPoints(x, y, size)}
                fill={isSelected ? '#1d9bf0' : '#192734'}
                stroke={getStatusColor(node.status)}
                strokeWidth={isSelected ? 3 : 2}
                filter="url(#node-shadow)"
              />
              
              {/* Node type icon */}
              <svg x={x - 12} y={y - 12} width="24" height="24" viewBox="0 0 24 24">
                <path 
                  d={getNodeTypeIcon(node.type)} 
                  fill={isSelected ? '#ffffff' : '#8b98a5'}
                />
              </svg>
              
              {/* Node name */}
              <text
                x={x}
                y={y + size + 20}
                textAnchor="middle"
                fill={isSelected ? '#ffffff' : '#8b98a5'}
                fontSize="14"
              >
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>
    </Box>
  );
};

export default NodeCanvas;
