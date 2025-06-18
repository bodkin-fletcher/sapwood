// Utility functions for working with nodes and their connections
import { nodeService } from './api';

// Generate a unique ID for temporary nodes or connections
export const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

// Calculate the position of a connection point on a hexagon
export const calculateConnectionPoint = (x, y, size, angle) => {
  return {
    x: x + size * Math.cos(angle),
    y: y + size * Math.sin(angle)
  };
};

// Calculate specific connection point positions for a node (inputs on left, outputs on right)
export const calculateNodeConnectionPoints = (x, y, size, pointCount = 3) => {
  const points = {
    inputs: [],
    outputs: []
  };

  // Calculate input points (left side)
  const inputStep = size * 1.5 / (pointCount + 1);
  for (let i = 1; i <= pointCount; i++) {
    points.inputs.push({
      x: -size * 0.866, // Fixed position relative to center (cos(60°) = 0.866)
      y: -size * 0.75 + i * inputStep, // Fixed position relative to center
      index: i - 1
    });
  }

  // Calculate output points (right side)
  const outputStep = size * 1.5 / (pointCount + 1);
  for (let i = 1; i <= pointCount; i++) {
    points.outputs.push({
      x: size * 0.866, // Fixed position relative to center
      y: -size * 0.75 + i * outputStep, // Fixed position relative to center
      index: i - 1
    });
  }

  return points;
};

// Find the best connection points between two nodes
export const findBestConnectionPoints = (sourceNode, targetNode, nodeSize) => {
  const sourceCenterX = sourceNode.x;
  const sourceCenterY = sourceNode.y;
  const targetCenterX = targetNode.x;
  const targetCenterY = targetNode.y;

  // Calculate angle between the two nodes
  const angle = Math.atan2(targetCenterY - sourceCenterY, targetCenterX - sourceCenterX);

  // Find the connection point on the source node
  const sourcePoint = calculateConnectionPoint(sourceCenterX, sourceCenterY, nodeSize, angle);

  // Find the connection point on the target node (opposite angle)
  const targetPoint = calculateConnectionPoint(targetCenterX, targetCenterY, nodeSize, angle + Math.PI);

  return { sourcePoint, targetPoint };
};

// Find nearest connection point for advanced connection system
export const findNearestConnectionPoint = (nodeX, nodeY, cursorX, cursorY, isSource) => {
  const points = calculateNodeConnectionPoints(0, 0, NODE_SIZE);
  const checkPoints = isSource ? points.outputs : points.inputs;

  let nearestPoint = null;
  let minDistance = Infinity;

  for (const point of checkPoints) {
    // Adjust point positions to be relative to actual node position
    const pointX = nodeX + point.x;
    const pointY = nodeY + point.y;

    const distance = Math.sqrt(
      Math.pow(pointX - cursorX, 2) + Math.pow(pointY - cursorY, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = {
        ...point,
        x: pointX,  // Store absolute position
        y: pointY
      };
    }
  }

  return nearestPoint;
};

// Calculate a curved path for a connection between two points
export const calculateConnectionPath = (source, target, curvature = 0.3, type = 'default') => {
  // Calculate control points for the curved path
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Determine control point offset based on distance
  const offset = dist * curvature;

  // Adjust path based on connection type
  switch (type) {
    case 'data':
      // Stronger curve for data flow connections
      return calculateDataFlowPath(source, target, curvature * 1.5);

    case 'control':
      // Zigzag path for control flow
      return calculateControlFlowPath(source, target);

    case 'reference':
      // Dashed straight line for references
      return `M${source.x},${source.y} L${target.x},${target.y}`;

    case 'default':
    default:
      // Calculate control points perpendicular to the line between points
      const controlPoint1 = {
        x: source.x + dx / 3 - dy * 0.1,
        y: source.y + dy / 3 + dx * 0.1
      };

      const controlPoint2 = {
        x: target.x - dx / 3 - dy * 0.1,
        y: target.y - dy / 3 + dx * 0.1
      };

      // Return SVG path data for a cubic Bezier curve
      return `M${source.x},${source.y} C${controlPoint1.x},${controlPoint1.y} ${controlPoint2.x},${controlPoint2.y} ${target.x},${target.y}`;
  }
};

// Calculate a curved path with stronger curve for data flow connections
const calculateDataFlowPath = (source, target, curvature = 0.45) => {
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;

  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Perpendicular direction
  const perpX = -dy / dist;
  const perpY = dx / dist;

  // Control point at the middle but offset perpendicular to the line
  const controlX = midX + perpX * dist * curvature;
  const controlY = midY + perpY * dist * curvature;

  // Return SVG path data for a quadratic Bezier curve
  return `M${source.x},${source.y} Q${controlX},${controlY} ${target.x},${target.y}`;
};

// Calculate a zigzag path for control flow connections
const calculateControlFlowPath = (source, target) => {
  const midX = (source.x + target.x) / 2;

  // Return SVG path data for a zigzag line
  return `M${source.x},${source.y} H${midX} V${target.y} H${target.x}`;
};

// Calculate a hexagon's points for SVG path - VERTICAL ORIENTATION
export const calculateHexagonPoints = (x, y, size) => {
  const points = [];
  // For vertical orientation, we start at the bottom point and go counter-clockwise
  // 30° offset for the first point to get flat sides on left and right
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6; // 30° offset
    points.push(`${x + size * Math.cos(angle)},${y + size * Math.sin(angle)}`);
  }
  return points.join(' ');
};

// Node size constant for consistent calculations
export const NODE_SIZE = 40;

// Get hex color for node status
export const getStatusColor = (status) => {
  switch (status) {
    case 'active':
      return '#4caf50'; // Green
    case 'inactive':
      return '#f44336'; // Red
    case 'warning':
      return '#ff9800'; // Orange
    case 'pending':
      return '#2196f3'; // Blue
    default:
      return '#9e9e9e'; // Grey
  }
};

// Get SVG path data for node type icon
export const getNodeTypeIcon = (type) => {
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

// Check if a point is inside a hexagon
export const isPointInHexagon = (px, py, cx, cy, size) => {
  const dx = Math.abs(px - cx);
  const dy = Math.abs(py - cy);
  const r = size * 1.1; // Slightly larger for better UX

  // Quick rectangle check first
  if (dx > r || dy > r) return false;

  // More precise check
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist <= r;
};

// Check if a point is near a connection point
export const isPointNearConnectionPoint = (px, py, point, threshold = 8) => {
  // Adjust for the fact that point.x and point.y are now relative to node center
  const adjustedPoint = {
    x: point.x,
    y: point.y
  };

  const distance = Math.sqrt(
    Math.pow(px - adjustedPoint.x, 2) + Math.pow(py - adjustedPoint.y, 2)
  );
  return distance <= threshold;
};

// Calculate distance from a point to a line segment
export const distanceToLineSegment = (px, py, x1, y1, x2, y2) => {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;

  return Math.sqrt(dx * dx + dy * dy);
};

// Check if a point is close to a connection path
export const isPointNearConnection = (px, py, source, target, threshold = 10) => {
  return distanceToLineSegment(
    px, py,
    source.x, source.y,
    target.x, target.y
  ) <= threshold;
};

// Find a connection near a point
export const findConnectionNearPoint = (px, py, connections, nodePositions, threshold = 10) => {
  for (const connection of connections) {
    const sourcePos = nodePositions[connection.source];
    const targetPos = nodePositions[connection.target];

    if (!sourcePos || !targetPos) continue;

    if (isPointNearConnection(px, py, sourcePos, targetPos, threshold)) {
      return connection;
    }
  }
  return null;
};

// Store heartbeat history for each node
const heartbeatHistory = {};

/**
 * Performs a heartbeat check for a node with retry capabilities
 * @param {Object} node - The node to check
 * @param {Object} options - Options for the heartbeat
 * @param {number} options.retryAttempts - Number of retry attempts (default: 3)
 * @param {number} options.retryDelay - Delay between retries in seconds (default: 2)
 * @returns {Object} Heartbeat result
 */
export const performHeartbeat = async (node, options = {}) => {
  const retryAttempts = options.retryAttempts || 3;
  const retryDelay = options.retryDelay || 2;

  let attempts = 0;
  let lastError = null;

  while (attempts <= retryAttempts) {
    try {
      // In a real app, we would make an actual HTTP request to the node
      // For this demo, we'll simulate network behavior

      // Random success rate based on current status (and decreasing with attempts)
      const baseSuccessRate = node.status === 'active' ? 0.9 : 0.3;
      const attemptFactor = 1 - (attempts * 0.2); // Success rate decreases with each attempt
      const successRate = baseSuccessRate * attemptFactor;
      const isSuccess = Math.random() < successRate;

      // Simulate network latency (increasing with attempts)
      const baseLatency = 50 + Math.floor(Math.random() * 200);
      const latency = baseLatency * (1 + attempts * 0.5); // Latency increases with each attempt
      await new Promise(resolve => setTimeout(resolve, latency));

      if (!isSuccess) {
        attempts++;

        if (attempts <= retryAttempts) {
          console.log(`Heartbeat attempt ${attempts} failed for node ${node.id}, retrying in ${retryDelay}s...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * 1000));
          continue;
        } else {
          throw new Error('Maximum retry attempts reached');
        }
      }

      // Create result object
      const result = {
        success: isSuccess,
        latency,
        timestamp: new Date().toISOString(),
        attempts: attempts + 1,
        message: isSuccess ? 'Connection successful' : 'Connection failed after multiple attempts'
      };

      // Store in history
      if (!heartbeatHistory[node.id]) {
        heartbeatHistory[node.id] = [];
      }
      heartbeatHistory[node.id].push(result);

      // Only keep the latest N entries (default 25)
      const maxHistorySize = 25;
      if (heartbeatHistory[node.id].length > maxHistorySize) {
        heartbeatHistory[node.id] = heartbeatHistory[node.id].slice(-maxHistorySize);
      }

      return result;
    } catch (error) {
      lastError = error;
      attempts++;

      if (attempts <= retryAttempts) {
        console.log(`Heartbeat attempt ${attempts} failed for node ${node.id}, retrying in ${retryDelay}s...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * 1000));
      }
    }
  }

  // If we reached here, all attempts failed
  const failureResult = {
    success: false,
    timestamp: new Date().toISOString(),
    attempts: attempts,
    message: lastError?.message || 'All heartbeat attempts failed'
  };

  // Store in history
  if (!heartbeatHistory[node.id]) {
    heartbeatHistory[node.id] = [];
  }
  heartbeatHistory[node.id].push(failureResult);

  // Only keep the latest N entries
  const maxHistorySize = 25;
  if (heartbeatHistory[node.id].length > maxHistorySize) {
    heartbeatHistory[node.id] = heartbeatHistory[node.id].slice(-maxHistorySize);
  }

  return failureResult;
};

// Update a node's status based on heartbeat
export const updateNodeStatus = async (nodeId, heartbeatResult) => {
  const status = heartbeatResult.success ? 'active' : 'inactive';
  try {
    return await nodeService.updateNode(nodeId, {
      status,
      lastHeartbeat: heartbeatResult.timestamp
    });
  } catch (error) {
    console.error('Error updating node status:', error);
    return null;
  }
};

// Get heartbeat history for a node
export const getHeartbeatHistory = (nodeId) => {
  return heartbeatHistory[nodeId] || [];
};

// Get status metrics for a node based on heartbeat history
export const getNodeMetrics = (nodeId) => {
  const history = heartbeatHistory[nodeId] || [];

  if (history.length === 0) {
    return {
      uptime: 0,
      avgLatency: 0,
      failureRate: 0,
      totalChecks: 0,
      lastCheck: null
    };
  }

  // Calculate metrics
  const successfulChecks = history.filter(check => check.success).length;
  const totalChecks = history.length;
  const latencies = history.filter(check => check.success && check.latency).map(check => check.latency);
  const avgLatency = latencies.length > 0 ?
    latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length : 0;

  return {
    uptime: (successfulChecks / totalChecks) * 100,
    avgLatency: Math.round(avgLatency),
    failureRate: ((totalChecks - successfulChecks) / totalChecks) * 100,
    totalChecks,
    lastCheck: history[history.length - 1].timestamp
  };
};

// Store API call history
const apiCallHistory = {};

// Execute an API call to a node with retry capability
export const executeNodeApiCall = async (node, options = {}) => {
  const retryAttempts = options.retryAttempts || 2;
  const retryDelay = options.retryDelay || 1;

  let attempts = 0;
  let lastError = null;

  try {
    if (!node.host || !node.path) {
      throw new Error('Node is missing host or path information');
    }

    // Construct the full URL
    const protocol = node.protocol || 'http';
    const port = node.port ? `:${node.port}` : '';
    const url = `${protocol}://${node.host}${port}${node.path}`;

    while (attempts <= retryAttempts) {
      try {
        // For demonstration, we'll simulate the API call
        // In a real app, we would make an actual HTTP request

        console.log(`Executing API call to: ${url} (attempt ${attempts + 1})`);

        // Simulate network latency (increasing with each attempt)
        const baseLatency = 100 + Math.floor(Math.random() * 500);
        const latency = baseLatency * (1 + attempts * 0.5); // Latency increases with each attempt
        await new Promise(resolve => setTimeout(resolve, latency));

        // Simulate success/failure based on node status
        const baseSuccessRate = node.status === 'active' ? 0.9 : 0.3;
        const attemptFactor = 1 - (attempts * 0.1); // Success rate decreases with each attempt
        const successRate = Math.max(0.1, baseSuccessRate * attemptFactor);
        const isSuccess = Math.random() < successRate;

        let responseData;
        let statusCode;

        if (!isSuccess) {
          statusCode = 500;
          responseData = {
            status: 'error',
            message: 'Internal server error',
            code: 'SERVER_ERROR',
            timestamp: new Date().toISOString()
          };

          // Increment attempts and retry if needed
          attempts++;
          if (attempts <= retryAttempts) {
            console.log(`API call attempt ${attempts} failed for node ${node.id}, retrying in ${retryDelay}s...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * 1000));
            continue; // Try again
          }
        }

        // If we got here, either the call was successful or we've exhausted retries
        if (isSuccess) {
          statusCode = 200;

          // Generate sample response data based on node type
          switch (node.type) {
            case 'gateway':
              responseData = {
                status: 'ok',
                gateway: node.name,
                routes: ['users', 'products', 'orders'],
                timestamp: new Date().toISOString()
              };
              break;
            case 'storage':
              responseData = {
                status: 'ok',
                database: node.name,
                collections: ['users', 'products', 'orders'],
                stats: {
                  connections: Math.floor(Math.random() * 100),
                  queriesPerSecond: Math.floor(Math.random() * 1000)
                }
              };
              break;
            default:
              responseData = {
                status: 'ok',
                service: node.name,
                version: '1.0',
                uptime: Math.floor(Math.random() * 10000),
                memory: {
                  total: Math.floor(Math.random() * 1024),
                  used: Math.floor(Math.random() * 512)
                }
              };
          }
        }

        // Create result object
        const result = {
          success: isSuccess,
          statusCode,
          data: responseData,
          latency,
          timestamp: new Date().toISOString(),
          url,
          attempts: attempts + 1
        };

        // Store in history
        if (!apiCallHistory[node.id]) {
          apiCallHistory[node.id] = [];
        }
        apiCallHistory[node.id].push(result);

        // Keep history size under limit
        const maxHistorySize = 25;
        if (apiCallHistory[node.id].length > maxHistorySize) {
          apiCallHistory[node.id] = apiCallHistory[node.id].slice(-maxHistorySize);
        }

        return result;
      } catch (error) {
        lastError = error;
        attempts++;

        if (attempts <= retryAttempts) {
          console.log(`API call attempt ${attempts} failed for node ${node.id} with error: ${error.message}, retrying in ${retryDelay}s...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * 1000));
        } else {
          break;
        }
      }
    }

    // If we reach here, all attempts failed
    const failureResult = {
      success: false,
      statusCode: 0,
      error: lastError?.message || 'All API call attempts failed',
      timestamp: new Date().toISOString(),
      attempts: attempts,
      url
    };

    // Store in history
    if (!apiCallHistory[node.id]) {
      apiCallHistory[node.id] = [];
    }
    apiCallHistory[node.id].push(failureResult);

    // Keep history size under limit
    const maxHistorySize = 25;
    if (apiCallHistory[node.id].length > maxHistorySize) {
      apiCallHistory[node.id] = apiCallHistory[node.id].slice(-maxHistorySize);
    }

    return failureResult;
  } catch (error) {
    return {
      success: false,
      statusCode: 0,
      error: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    };
  }
};

// Get API call history for a node
export const getApiCallHistory = (nodeId) => {
  return apiCallHistory[nodeId] || [];
};

// Get API call metrics for a node
export const getApiCallMetrics = (nodeId) => {
  const history = apiCallHistory[nodeId] || [];

  if (history.length === 0) {
    return {
      successRate: 0,
      avgLatency: 0,
      totalCalls: 0,
      lastCall: null,
      avgAttempts: 0
    };
  }

  // Calculate metrics
  const successfulCalls = history.filter(call => call.success).length;
  const totalCalls = history.length;
  const latencies = history.filter(call => call.success && call.latency).map(call => call.latency);
  const attempts = history.filter(call => call.attempts).map(call => call.attempts);

  const avgLatency = latencies.length > 0 ?
    latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length : 0;
  const avgAttempts = attempts.length > 0 ?
    attempts.reduce((sum, att) => sum + att, 0) / attempts.length : 1;

  return {
    successRate: (successfulCalls / totalCalls) * 100,
    avgLatency: Math.round(avgLatency),
    totalCalls,
    lastCall: history[history.length - 1].timestamp,
    avgAttempts: Number(avgAttempts.toFixed(1))
  };
};
