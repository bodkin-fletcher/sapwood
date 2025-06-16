import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Tooltip, CircularProgress, Fade, Typography } from '@mui/material';
import { useNodes } from '../context/NodeContext';
import { useSettings } from '../context/SettingsContext';
import { 
  calculateHexagonPoints,
  getStatusColor,
  getNodeTypeIcon,
  calculateConnectionPath,
  calculateNodeConnectionPoints,
  findNearestConnectionPoint,
  NODE_SIZE,
  isPointInHexagon,
  isPointNearConnectionPoint,
  performHeartbeat,
  updateNodeStatus
} from '../services/nodeUtils';

const ZOOM_SENSITIVITY = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const CONNECTION_POINT_RADIUS = 4;
const GRID_SIZE = 20;
const GRID_COLOR = 'rgba(255, 255, 255, 0.08)';
const BG_COLOR = '#1e2430'; // Dark blue-gray background
const NODE_FILL_COLOR = '#2a3142'; // Slightly lighter blue-gray for nodes

const NodeCanvas = ({ nodes, onSelectNode, selectedNodeId, onSelectConnection }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const { connections, addConnection, deleteConnection, updateNode } = useNodes();
  const { settings } = useSettings();
  const [nodePositions, setNodePositions] = useState({});
  const [dragging, setDragging] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [connectionPreview, setConnectionPreview] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredConnectionPoint, setHoveredConnectionPoint] = useState(null);
  const [hoveredConnection, setHoveredConnection] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [heartbeatInProgress, setHeartbeatInProgress] = useState({});
  const [svgDimensions, setSvgDimensions] = useState({ width: 1000, height: 800 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false); // Track Shift key for multi-select
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);
  const [multiSelectedNodes, setMultiSelectedNodes] = useState([]);

  // Track mouse position for various interactions
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  
  // Initialize node positions when nodes change
  useEffect(() => {
    const positions = { ...nodePositions };
    
    nodes.forEach((node) => {
      // Only set position if it doesn't exist yet
      if (!positions[node.id]) {
        // Find a random position for new nodes
        positions[node.id] = {
          x: 150 + Math.random() * 500,
          y: 100 + Math.random() * 300
        };
      }
    });
    
    // Remove positions for deleted nodes
    Object.keys(positions).forEach(id => {
      if (!nodes.find(node => node.id === id)) {
        delete positions[id];
      }
    });
    
    setNodePositions(positions);
  }, [nodes]);

  // Handle keyboard events for space key (pan mode) and shift key (multi-select)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !isSpacePressed) {
        setIsSpacePressed(true);
        if (containerRef.current) {
          containerRef.current.style.cursor = 'grab';
        }
      }
      if (e.shiftKey && !isShiftPressed) {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
        if (containerRef.current) {
          containerRef.current.style.cursor = 'default';
        }
      }
      if (!e.shiftKey && isShiftPressed) {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed, isShiftPressed]);

  // Set up resize observer
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSvgDimensions({ width, height });
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Heartbeat interval
  useEffect(() => {
    // Only run if heartbeat interval is valid
    if (!settings.heartbeatInterval || settings.heartbeatInterval < 1) {
      return;
    }

    const intervalId = setInterval(async () => {
      // Check each node
      for (const node of nodes) {
        // Skip if a heartbeat is already in progress for this node
        if (heartbeatInProgress[node.id]) continue;

        // Mark heartbeat as in progress
        setHeartbeatInProgress(prev => ({ ...prev, [node.id]: true }));

        try {
          // Perform heartbeat check
          const result = await performHeartbeat(node);
          
          // Update node status
          if (result.success !== (node.status === 'active')) {
            await updateNodeStatus(node.id, result);
          }
        } catch (error) {
          console.error(`Heartbeat failed for node ${node.id}:`, error);
        } finally {
          // Clear in-progress flag
          setHeartbeatInProgress(prev => ({ ...prev, [node.id]: false }));
        }
      }
    }, settings.heartbeatInterval * 1000);

    return () => clearInterval(intervalId);
  }, [nodes, settings.heartbeatInterval, heartbeatInProgress, updateNode]);

  // Convert screen coordinates to SVG coordinates
  const screenToSvgCoordinates = useCallback((x, y) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const svgRect = svgRef.current.getBoundingClientRect();
    const svgX = (x - svgRect.left) / zoom - pan.x;
    const svgY = (y - svgRect.top) / zoom - pan.y;
    
    return { x: svgX, y: svgY };
  }, [zoom, pan]);

  // Handle connection selection
  const handleConnectionClick = useCallback((e, connection) => {
    e.stopPropagation();
    
    // If shift is pressed, add to multi-select
    if (isShiftPressed) {
      // For now we're just focusing on multi-select for nodes
      // Could expand this for connections later
      setSelectedConnection(connection);
      onSelectConnection && onSelectConnection(connection);
      return;
    }
    
    setSelectedConnection(connection);
    onSelectConnection && onSelectConnection(connection);
    onSelectNode(null); // Deselect any selected node
    setMultiSelectedNodes([]);
  }, [isShiftPressed, onSelectConnection, onSelectNode]);

  // Handle starting node drag or selection box
  const handleMouseDown = useCallback((e, node) => {
    if (e.button !== 0) return; // Only handle left click
    
    e.stopPropagation();
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    
    if (isSpacePressed) {
      // Start panning the canvas
      setIsPanning(true);
      setPanStart({ x: pan.x, y: pan.y });
    } else if (node) {
      // Start dragging the node
      setDragging(node.id);
      
      // If shift is pressed, handle multi-select
      if (isShiftPressed) {
        const isAlreadySelected = multiSelectedNodes.includes(node.id);
        if (isAlreadySelected) {
          // Deselect the node
          setMultiSelectedNodes(prev => prev.filter(id => id !== node.id));
        } else {
          // Add the node to the selection
          setMultiSelectedNodes(prev => [...prev, node.id]);
        }
      } else if (!multiSelectedNodes.includes(node.id)) {
        // If not holding shift and clicking an unselected node, 
        // make this the only selected node
        setMultiSelectedNodes([]);
        onSelectNode(node);
      }
    } else {
      // Start drawing selection box
      const { x, y } = screenToSvgCoordinates(e.clientX, e.clientY);
      setSelectionBox({
        startX: x,
        startY: y,
        width: 0,
        height: 0
      });
      
      // Clear selection if not holding shift
      if (!isShiftPressed) {
        setMultiSelectedNodes([]);
        onSelectNode(null);
      }
    }
  }, [isSpacePressed, pan, isShiftPressed, multiSelectedNodes, onSelectNode, screenToSvgCoordinates]);

  // Handle mouse move for dragging nodes, panning, or selection box
  const handleMouseMove = useCallback((e) => {
    const currentMousePos = { x: e.clientX, y: e.clientY };
    
    // Handle panning
    if (isPanning) {
      const dx = (currentMousePos.x - lastMousePosRef.current.x) / zoom;
      const dy = (currentMousePos.y - lastMousePosRef.current.y) / zoom;
      
      setPan({
        x: pan.x + dx,
        y: pan.y + dy
      });
      
      lastMousePosRef.current = currentMousePos;
      return;
    }
    
    // Handle dragging nodes
    if (dragging) {
      const dx = (currentMousePos.x - lastMousePosRef.current.x) / zoom;
      const dy = (currentMousePos.y - lastMousePosRef.current.y) / zoom;
      
      if (multiSelectedNodes.length > 0 && multiSelectedNodes.includes(dragging)) {
        // Move all selected nodes
        const updatedPositions = { ...nodePositions };
        multiSelectedNodes.forEach(nodeId => {
          if (updatedPositions[nodeId]) {
            updatedPositions[nodeId] = {
              x: updatedPositions[nodeId].x + dx,
              y: updatedPositions[nodeId].y + dy
            };
          }
        });
        setNodePositions(updatedPositions);
      } else {
        // Move just the dragged node
        setNodePositions(prevPositions => ({
          ...prevPositions,
          [dragging]: {
            x: prevPositions[dragging].x + dx,
            y: prevPositions[dragging].y + dy
          }
        }));
      }
      
      lastMousePosRef.current = currentMousePos;
      return;
    }
    
    // Handle creating connection preview
    if (connecting) {
      const svgCoords = screenToSvgCoordinates(currentMousePos.x, currentMousePos.y);
      
      // Check if mouse is over a node (potential target)
      let targetNode = null;
      let targetPoint = null;

      for (const node of nodes) {
        if (node.id === connecting.nodeId) continue; // Skip source node
        
        const nodePos = nodePositions[node.id];
        if (!nodePos) continue;
        
        if (isPointInHexagon(svgCoords.x, svgCoords.y, nodePos.x, nodePos.y, NODE_SIZE)) {
          targetNode = node;
          
          // Find the nearest input point on the target node
          targetPoint = findNearestConnectionPoint(nodePos.x, nodePos.y, svgCoords.x, svgCoords.y, false);
          
          break;
        }
      }
      
      // Update connection preview
      setConnectionPreview({
        source: connecting.point,
        target: targetPoint || svgCoords,
        targetNode
      });
      
      return;
    }
    
    // Handle selection box
    if (selectionBox) {
      const { x, y } = screenToSvgCoordinates(currentMousePos.x, currentMousePos.y);
      
      // Calculate box dimensions
      const width = x - selectionBox.startX;
      const height = y - selectionBox.startY;
      
      setSelectionBox({
        ...selectionBox,
        width,
        height
      });
      
      return;
    }
    
    // Check if hovering over a node or connection
    const svgCoords = screenToSvgCoordinates(currentMousePos.x, currentMousePos.y);
    
    // Check for hovering over nodes
    let foundHoveredNode = null;
    let foundHoveredPoint = null;
    
    for (const node of nodes) {
      const nodePos = nodePositions[node.id];
      if (!nodePos) continue;
      
      // Check if hovering over the node
      if (isPointInHexagon(svgCoords.x, svgCoords.y, nodePos.x, nodePos.y, NODE_SIZE)) {
        foundHoveredNode = node;
        
        // Check if hovering over a connection point
        const connectionPoints = calculateNodeConnectionPoints(0, 0, NODE_SIZE);
        
        // Check input points
        for (const point of connectionPoints.inputs) {
          // Adjust point to node position
          const absolutePoint = {
            x: nodePos.x + point.x,
            y: nodePos.y + point.y,
            index: point.index
          };
          
          if (isPointNearConnectionPoint(svgCoords.x, svgCoords.y, absolutePoint)) {
            foundHoveredPoint = {
              ...absolutePoint,
              nodeId: node.id,
              isInput: true
            };
            break;
          }
        }
        
        // Check output points if no input point was hovered
        if (!foundHoveredPoint) {
          for (const point of connectionPoints.outputs) {
            // Adjust point to node position
            const absolutePoint = {
              x: nodePos.x + point.x,
              y: nodePos.y + point.y,
              index: point.index
            };
            
            if (isPointNearConnectionPoint(svgCoords.x, svgCoords.y, absolutePoint)) {
              foundHoveredPoint = {
                ...absolutePoint,
                nodeId: node.id,
                isInput: false
              };
              break;
            }
          }
        }
        
        break;
      }
    }
    
    setHoveredNode(foundHoveredNode);
    setHoveredConnectionPoint(foundHoveredPoint);
    
  }, [isPanning, dragging, connecting, selectionBox, zoom, pan, nodes, nodePositions, multiSelectedNodes, screenToSvgCoordinates]);

  // Handle mouse up to finish dragging, panning, connecting, or selection
  const handleMouseUp = useCallback((e) => {
    // Finish dragging nodes - update server with new positions
    if (dragging) {
      const draggedNodes = multiSelectedNodes.includes(dragging) 
        ? multiSelectedNodes 
        : [dragging];
      
      // Update node positions on the server
      draggedNodes.forEach(async nodeId => {
        const node = nodes.find(n => n.id === nodeId);
        if (node && nodePositions[nodeId]) {
          await updateNode(nodeId, {
            x: nodePositions[nodeId].x,
            y: nodePositions[nodeId].y
          });
        }
      });
      
      setDragging(null);
    }
    
    // Finish connection creation
    if (connecting && connectionPreview && connectionPreview.targetNode) {
      // Create a new connection
      addConnection(
        connecting.nodeId,
        connectionPreview.targetNode.id,
        {
          sourcePointIndex: connecting.point.index,
          targetPointIndex: connectionPreview.target.index,
          type: 'default'
        }
      );
      
      setConnecting(null);
      setConnectionPreview(null);
    } else if (connecting) {
      // Cancel connection if no target node
      setConnecting(null);
      setConnectionPreview(null);
    }
    
    // Finish panning
    if (isPanning) {
      setIsPanning(false);
    }
    
    // Finish selection box
    if (selectionBox) {
      // Calculate which nodes are inside the selection box
      const selectedIds = nodes
        .filter(node => {
          const pos = nodePositions[node.id];
          if (!pos) return false;
          
          const { startX, startY, width, height } = selectionBox;
          const boxX = width < 0 ? startX + width : startX;
          const boxY = height < 0 ? startY + height : startY;
          const boxWidth = Math.abs(width);
          const boxHeight = Math.abs(height);
          
          return pos.x >= boxX && pos.x <= boxX + boxWidth && 
                 pos.y >= boxY && pos.y <= boxY + boxHeight;
        })
        .map(node => node.id);
      
      // Update selection based on shift key
      if (isShiftPressed) {
        // Toggle selection for each node in the box
        const newSelection = [...multiSelectedNodes];
        
        selectedIds.forEach(id => {
          const index = newSelection.indexOf(id);
          if (index === -1) {
            newSelection.push(id);
          } else {
            newSelection.splice(index, 1);
          }
        });
        
        setMultiSelectedNodes(newSelection);
      } else {
        // Replace selection with nodes in the box
        setMultiSelectedNodes(selectedIds);
        
        // If there's exactly one node selected, also set it as the selected node
        if (selectedIds.length === 1) {
          onSelectNode(nodes.find(node => node.id === selectedIds[0]));
        } else {
          onSelectNode(null);
        }
      }
      
      setSelectionBox(null);
    }
  }, [dragging, connecting, connectionPreview, isPanning, selectionBox, multiSelectedNodes, isShiftPressed, 
      nodes, nodePositions, updateNode, addConnection, onSelectNode]);

  // Handle mouse wheel for zooming
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    // Calculate zoom change
    const delta = -Math.sign(e.deltaY) * ZOOM_SENSITIVITY;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
    
    // Calculate cursor position relative to canvas
    const svgRect = svgRef.current.getBoundingClientRect();
    const cursorX = (e.clientX - svgRect.left) / zoom;
    const cursorY = (e.clientY - svgRect.top) / zoom;
    
    // Calculate new pan to zoom around cursor position
    const newPan = {
      x: pan.x - cursorX * (newZoom / zoom - 1),
      y: pan.y - cursorY * (newZoom / zoom - 1)
    };
    
    setZoom(newZoom);
    setPan(newPan);
  }, [zoom, pan]);

  // Handle starting a connection from a connection point
  const handleConnectionPointMouseDown = useCallback((e, point, nodeId, isInput) => {
    e.stopPropagation();
    
    // Only allow starting connections from output points
    if (isInput) return;
    
    // Get the node position to convert the relative point to absolute position
    const nodePos = nodePositions[nodeId];
    if (!nodePos) return;
    
    // Create an absolute position point for the connection
    const absolutePoint = {
      x: nodePos.x + point.x,
      y: nodePos.y + point.y,
      index: point.index
    };
    
    setConnecting({
      nodeId,
      point: absolutePoint
    });
  }, [nodePositions]);

  // Handle click on canvas background
  const handleBackgroundClick = useCallback(() => {
    // Deselect everything when clicking background
    onSelectNode(null);
    onSelectConnection(null);
    setSelectedConnection(null);
    setMultiSelectedNodes([]);
  }, [onSelectNode, onSelectConnection]);

  // Handle node click
  const handleNodeClick = useCallback((e, node) => {
    e.stopPropagation();
    
    // If not dragging (to avoid selecting while finishing a drag)
    if (!dragging) {
      if (isShiftPressed) {
        // Toggle node in multi-select
        const isSelected = multiSelectedNodes.includes(node.id);
        if (isSelected) {
          setMultiSelectedNodes(prev => prev.filter(id => id !== node.id));
        } else {
          setMultiSelectedNodes(prev => [...prev, node.id]);
        }
      } else {
        // Regular click - select only this node
        onSelectNode(node);
        setMultiSelectedNodes([]);
        setSelectedConnection(null);
      }
    }
  }, [dragging, isShiftPressed, multiSelectedNodes, onSelectNode]);

  // Render node connection points
  const renderConnectionPoints = (node) => {
    const nodePos = nodePositions[node.id];
    if (!nodePos) return null;
    
    const points = calculateNodeConnectionPoints(nodePos.x, nodePos.y, NODE_SIZE);
    const isSelected = selectedNodeId === node.id || multiSelectedNodes.includes(node.id);
    const isHovered = hoveredNode && hoveredNode.id === node.id;
    
    // Get connected point indices for this node
    const connectedPoints = {
      inputs: [],
      outputs: []
    };
    
    connections.forEach(conn => {
      if (conn.source === node.id && conn.sourcePointIndex !== undefined) {
        connectedPoints.outputs.push(conn.sourcePointIndex);
      }
      if (conn.target === node.id && conn.targetPointIndex !== undefined) {
        connectedPoints.inputs.push(conn.targetPointIndex);
      }
    });
    
    // Determine visibility of points
    const showPoints = isSelected || isHovered;
    
    return (
      <>
        {/* Input points */}
        {points.inputs.map((point, idx) => {
          const isConnected = connectedPoints.inputs.includes(idx);
          const isHovered = hoveredConnectionPoint && 
            hoveredConnectionPoint.nodeId === node.id && 
            hoveredConnectionPoint.isInput && 
            hoveredConnectionPoint.index === idx;
            
          // Show if connected, hovered, or node is selected/hovered
          const visible = isConnected || isHovered || showPoints;
          
          return (
            <circle
              key={`input-${node.id}-${idx}`}              cx={point.x}
              cy={point.y}
              r={CONNECTION_POINT_RADIUS}
              fill={isConnected ? "#4caf50" : "#90caf9"}
              stroke="#516170"
              strokeWidth={1}
              style={{ 
                cursor: 'pointer',
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.2s'
              }}
              onMouseDown={(e) => handleConnectionPointMouseDown(e, point, node.id, true)}
            />
          );
        })}
        
        {/* Output points */}
        {points.outputs.map((point, idx) => {
          const isConnected = connectedPoints.outputs.includes(idx);
          const isHovered = hoveredConnectionPoint && 
            hoveredConnectionPoint.nodeId === node.id && 
            !hoveredConnectionPoint.isInput && 
            hoveredConnectionPoint.index === idx;
            
          // Show if connected, hovered, or node is selected/hovered
          const visible = isConnected || isHovered || showPoints;
          
          return (
            <circle
              key={`output-${node.id}-${idx}`}              cx={point.x}
              cy={point.y}
              r={CONNECTION_POINT_RADIUS}
              fill={isConnected ? "#2196f3" : "#90caf9"}
              stroke="#516170"
              strokeWidth={1}
              style={{ 
                cursor: 'pointer',
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.2s'
              }}
              onMouseDown={(e) => handleConnectionPointMouseDown(e, point, node.id, false)}
            />
          );
        })}
      </>
    );
  };

  return (    <Box 
      ref={containerRef}
      sx={{ 
        width: '100%',
        height: 'calc(100vh - 140px)', // Reduce height to avoid scrolling
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: BG_COLOR,
        boxSizing: 'border-box'
      }}
      onWheel={handleWheel}
    >
      <svg
        ref={svgRef}
        width={svgDimensions.width}
        height={svgDimensions.height}
        style={{ touchAction: 'none' }}
        onClick={handleBackgroundClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >        <defs>
          {/* Grid pattern definition */}
          <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
            <rect width={GRID_SIZE} height={GRID_SIZE} fill={BG_COLOR} />
            <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke={GRID_COLOR} strokeWidth="1"/>
          </pattern>
        </defs>
        
        {/* Grid background */}
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        <g transform={`translate(${pan.x * zoom}, ${pan.y * zoom}) scale(${zoom})`}>
          {/* Render connections */}
          {connections.map((connection) => {
            const sourcePos = nodePositions[connection.source];
            const targetPos = nodePositions[connection.target];
            if (!sourcePos || !targetPos) return null;
            
            // Get connection points based on indices if available
            let sourcePt, targetPt;
            
            if (connection.sourcePointIndex !== undefined) {
              const sourcePoints = calculateNodeConnectionPoints(0, 0, NODE_SIZE);
              const sourcePoint = sourcePoints.outputs[connection.sourcePointIndex];
              if (sourcePoint) {
                sourcePt = {
                  x: sourcePos.x + sourcePoint.x,
                  y: sourcePos.y + sourcePoint.y,
                  index: sourcePoint.index
                };
              }
            }
            
            if (connection.targetPointIndex !== undefined) {
              const targetPoints = calculateNodeConnectionPoints(0, 0, NODE_SIZE);
              const targetPoint = targetPoints.inputs[connection.targetPointIndex];
              if (targetPoint) {
                targetPt = {
                  x: targetPos.x + targetPoint.x,
                  y: targetPos.y + targetPoint.y,
                  index: targetPoint.index
                };
              }
            }
            
            // Fallback to center points if indices are not available
            const source = sourcePt || sourcePos;
            const target = targetPt || targetPos;
            
            const path = calculateConnectionPath(source, target, 0.3, connection.type);
            const isSelected = selectedConnection === connection || 
                              (selectedConnection && selectedConnection.id === connection.id);
            const isHovered = hoveredConnection === connection;
            
            return (
              <g key={connection.id || `${connection.source}-${connection.target}`}>
                <path 
                  d={path}                  fill="none"
                  stroke={isSelected ? "#ff9800" : (isHovered ? "#4dabf5" : "#90caf9")}
                  strokeWidth={isSelected ? 3 : (isHovered ? 2 : 1.5)}
                  strokeDasharray={connection.type === 'reference' ? "5,5" : "none"}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => handleConnectionClick(e, connection)}
                />
                {/* Arrow marker for the connection */}
                <polygon 
                  points="0,-3 6,0 0,3" 
                  fill={isSelected ? "#ff9800" : (isHovered ? "#4dabf5" : "#90caf9")}
                  transform={`translate(${target.x},${target.y}) rotate(${Math.atan2(target.y - source.y, target.x - source.x) * 180 / Math.PI})`}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => handleConnectionClick(e, connection)}
                />
              </g>
            );
          })}
          
          {/* Render connection preview */}
          {connectionPreview && (
            <path 
              d={calculateConnectionPath(
                connectionPreview.source, 
                connectionPreview.target, 
                0.3, 
                'default'
              )}
              fill="none"
              stroke="#2196f3"
              strokeWidth={2}
              strokeDasharray="5,5"
            />
          )}
          
          {/* Render nodes */}
          {nodes.map((node) => {
            const pos = nodePositions[node.id];
            if (!pos) return null;
            
            const isSelected = selectedNodeId === node.id || multiSelectedNodes.includes(node.id);
            const isHovered = hoveredNode && hoveredNode.id === node.id;
            const statusColor = getStatusColor(node.status);
            
            return (
              <g 
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                style={{ cursor: dragging === node.id ? 'grabbing' : 'pointer' }}
                onMouseDown={(e) => handleMouseDown(e, node)}
                onClick={(e) => handleNodeClick(e, node)}
              >                {/* Node hexagon shape */}                {/* Main hexagon */}
                <polygon 
                  points={calculateHexagonPoints(0, 0, NODE_SIZE)}
                  fill={isSelected ? '#375273' : NODE_FILL_COLOR}
                  stroke={isSelected ? '#4dabf5' : (isHovered ? '#90caf9' : '#516170')}
                  strokeWidth={isSelected ? 2 : (isHovered ? 1.5 : 1)}
                />

                {/* Status border inside hexagon */}
                <polygon 
                  points={calculateHexagonPoints(0, 0, NODE_SIZE - 4)}
                  fill="none"
                  stroke={statusColor}
                  strokeWidth={2}
                  opacity={heartbeatInProgress[node.id] ? 0.7 : 1}
                >
                  {heartbeatInProgress[node.id] && (
                    <animate 
                      attributeName="opacity" 
                      values="1;0.3;1" 
                      dur="1.5s" 
                      repeatCount="indefinite" 
                    />
                  )}
                </polygon>
                
                {/* Render connection points */}
                {renderConnectionPoints(node)}
                
                {/* Node type icon */}
                <svg 
                  x={-14} 
                  y={-14} 
                  width="28" 
                  height="28" 
                  viewBox="0 0 24 24"
                >
                  <path d={getNodeTypeIcon(node.type)} fill="#e0e0e0" />
                </svg>
                
                {/* Node name */}
                <text 
                  y={NODE_SIZE + 15}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#e0e0e0"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                >
                  {node.name}
                </text>
              </g>
            );
          })}
          
          {/* Selection box */}
          {selectionBox && (
            <rect 
              x={selectionBox.width < 0 ? selectionBox.startX + selectionBox.width : selectionBox.startX}
              y={selectionBox.height < 0 ? selectionBox.startY + selectionBox.height : selectionBox.startY}
              width={Math.abs(selectionBox.width)}
              height={Math.abs(selectionBox.height)}
              fill="rgba(33, 150, 243, 0.1)"
              stroke="rgba(33, 150, 243, 0.8)"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          )}
        </g>
      </svg>
    </Box>
  );
};

export default NodeCanvas;
