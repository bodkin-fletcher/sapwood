/**
 * Layout Templates for Sapwood
 * Contains templates for arranging nodes in different patterns
 */

/**
 * Apply a grid layout to nodes
 * @param {Array} nodes - Nodes to arrange
 * @param {Object} options - Layout options
 * @returns {Object} Map of node positions
 */
export const applyGridLayout = (nodes, options = {}) => {
  const {
    width = 800,
    height = 600,
    margin = 50,
    nodeWidth = 120,
    nodeHeight = 60,
    spacing = 20
  } = options;
  
  const positions = {};
  const effectiveWidth = width - 2 * margin;
  const nodesPerRow = Math.floor(effectiveWidth / (nodeWidth + spacing));
  
  nodes.forEach((node, index) => {
    const row = Math.floor(index / nodesPerRow);
    const col = index % nodesPerRow;
    
    positions[node.id] = {
      x: margin + col * (nodeWidth + spacing) + nodeWidth / 2,
      y: margin + row * (nodeHeight + spacing) + nodeHeight / 2
    };
  });
  
  return positions;
};

/**
 * Apply a circular layout to nodes
 * @param {Array} nodes - Nodes to arrange
 * @param {Object} options - Layout options
 * @returns {Object} Map of node positions
 */
export const applyCircularLayout = (nodes, options = {}) => {
  const {
    width = 800,
    height = 600,
    margin = 50,
  } = options;
  
  const positions = {};
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - margin;
  
  nodes.forEach((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI;
    
    positions[node.id] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });
  
  return positions;
};

/**
 * Apply a hierarchical tree layout to nodes
 * @param {Array} nodes - Nodes to arrange
 * @param {Array} connections - Connections between nodes
 * @param {Object} options - Layout options
 * @returns {Object} Map of node positions
 */
export const applyHierarchicalLayout = (nodes, connections, options = {}) => {
  const {
    width = 800,
    height = 600,
    margin = 50,
    nodeWidth = 120,
    nodeHeight = 60,
    levelHeight = 120
  } = options;
  
  // Find root nodes (nodes with no incoming connections)
  const targetNodeIds = new Set(connections.map(conn => conn.target));
  const rootNodes = nodes.filter(node => !targetNodeIds.has(node.id));
  
  // Build node hierarchy
  const hierarchy = {};
  const processedNodes = new Set();
  
  // Function to process a node and its children
  const processNode = (nodeId, level = 0) => {
    if (processedNodes.has(nodeId)) return;
    processedNodes.add(nodeId);
    
    // Initialize level if needed
    hierarchy[level] = hierarchy[level] || [];
    hierarchy[level].push(nodeId);
    
    // Process children
    const childConnections = connections.filter(conn => conn.source === nodeId);
    childConnections.forEach(conn => {
      processNode(conn.target, level + 1);
    });
  };
  
  // Process all root nodes
  rootNodes.forEach(node => processNode(node.id));
  
  // If no root nodes found, use first node as root
  if (rootNodes.length === 0 && nodes.length > 0) {
    processNode(nodes[0].id);
  }
  
  // Position nodes by level
  const positions = {};
  
  Object.entries(hierarchy).forEach(([level, nodeIds]) => {
    const levelNum = parseInt(level);
    const y = margin + levelNum * levelHeight;
    
    // Calculate width needed for this level
    const levelWidth = nodeIds.length * (nodeWidth + margin);
    const startX = (width - levelWidth) / 2 + nodeWidth / 2;
    
    nodeIds.forEach((nodeId, index) => {
      positions[nodeId] = {
        x: startX + index * (nodeWidth + margin),
        y
      };
    });
  });
  
  return positions;
};

/**
 * Apply a force-directed layout to nodes
 * This is a simplified version - a real implementation would use
 * a physics simulation for better results
 * @param {Array} nodes - Nodes to arrange
 * @param {Array} connections - Connections between nodes
 * @param {Object} options - Layout options
 * @returns {Object} Map of node positions
 */
export const applyForceDirectedLayout = (nodes, connections, options = {}) => {
  const {
    width = 800,
    height = 600
  } = options;
  
  // For simplicity, we'll return a simple circular layout
  // In a real implementation, this would use a force-directed algorithm
  return applyCircularLayout(nodes, options);
};

/**
 * Get a layout template by name
 * @param {String} templateName - The name of the template to use
 * @returns {Function} The layout function
 */
export const getLayoutTemplate = (templateName) => {
  switch (templateName) {
    case 'circular':
      return applyCircularLayout;
    case 'hierarchical':
      return applyHierarchicalLayout;
    case 'force-directed':
      return applyForceDirectedLayout;
    case 'grid':
    default:
      return applyGridLayout;
  }
};

/**
 * List of available layout templates
 */
export const layoutTemplates = [
  { id: 'grid', name: 'Grid Layout', description: 'Simple grid arrangement' },
  { id: 'circular', name: 'Circular Layout', description: 'Nodes arranged in a circle' },
  { id: 'hierarchical', name: 'Hierarchical', description: 'Tree-like structure based on connections' },
  { id: 'force-directed', name: 'Force Directed', description: 'Physics-based dynamic layout' }
];
