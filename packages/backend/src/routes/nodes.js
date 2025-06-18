// Node data storage and API routes
import { randomUUID } from 'crypto';
import { 
  toTgdfNode, toTgdfNodes, toTgdfConnection, toTgdfConnections,
  fromTgdfNode, fromTgdfConnection
} from '../utils/tgdf.js';

// In-memory data store (in standard format first, will convert to TGDF when serving)
const standardNodes = [
  { 
    id: '1', 
    name: 'API Gateway', 
    type: 'gateway',
    host: 'api.example.com',
    port: 443,
    protocol: 'https',
    path: '/api/v1',
    status: 'active',
    description: 'Main API gateway for external services',
    created: '2025-06-01T10:00:00Z'
  },  { 
    id: '2', 
    name: 'Database', 
    type: 'storage',
    host: 'db.internal',
    port: 5432,
    protocol: 'http',
    path: '/query',
    status: 'active',
    description: 'Primary PostgreSQL database',
    created: '2025-06-01T10:05:00Z'
  },
  { 
    id: '3', 
    name: 'Processing Service', 
    type: 'service',
    host: 'processor.internal',
    port: 8000,
    protocol: 'http',
    path: '/process',
    status: 'inactive',
    description: 'Data processing microservice',
    created: '2025-06-01T10:10:00Z'
  },
];

// Convert to TGDF format
const nodes = standardNodes.map(node => toTgdfNode(node));

// Connections in standard format
let standardConnections = [
  {
    id: 'conn-1',
    source: '1',
    target: '2',
    sourcePoint: 0,
    targetPoint: 0,
    type: 'data',
    status: 'active',
    created: '2025-06-01T10:15:00Z'
  },
  {
    id: 'conn-2',
    source: '2',
    target: '3',
    sourcePoint: 1,
    targetPoint: 0,
    type: 'process',
    status: 'inactive',
    created: '2025-06-01T10:20:00Z'
  }
];

// Convert to TGDF format
let connections = standardConnections.map(connection => toTgdfConnection(connection));

export default async function registerNodeRoutes(fastify) {// Get all nodes
  fastify.get('/api/nodes', async (request, reply) => {
    return { nodes };
  });

  // Get a specific node by ID
  fastify.get('/api/nodes/:id', async (request, reply) => {
    const { id } = request.params;
    const tgdfNode = nodes.find(n => n.node.data.identityHash === id);
    
    if (!tgdfNode) {
      reply.code(404);
      return { error: 'Node not found' };
    }
    
    return { node: tgdfNode };
  });
  // Create a new node
  fastify.post('/api/nodes', async (request, reply) => {
    // If request is already in TGDF format
    if (request.body.node && request.body.node.data) {
      const tgdfNode = request.body;
      nodes.push(tgdfNode);
      return { node: tgdfNode };
    }

    // If request is in standard format
    const { name, type, host, port, protocol, path, description } = request.body;
    
    // Simple validation
    if (!name || !host) {
      reply.code(400);
      return { error: 'Name and host are required' };
    }
      // Create a standard node first
    const standardNode = {
      id: randomUUID(),
      name,
      type: type || 'service',
      host,
      port: port ? parseInt(port, 10) : null,
      protocol: protocol || 'http',
      path: path || '',
      description: description || '',
      status: 'active',
      created: new Date().toISOString()
    };
    
    // Convert to TGDF format
    const tgdfNode = toTgdfNode(standardNode);
    
    // Add to nodes array
    nodes.push(tgdfNode);
    standardNodes.push(standardNode);
    
    reply.code(201);
    return { node: tgdfNode };
  });
  // Update a node
  fastify.put('/api/nodes/:id', async (request, reply) => {
    const { id } = request.params;
    const updates = request.body;
    
    // Find in TGDF format
    const nodeIndex = nodes.findIndex(n => n.node.data.identityHash === id);
    
    if (nodeIndex === -1) {
      reply.code(404);
      return { error: 'Node not found' };
    }    // Find the standard node too for easier updating
    const standardNodeIndex = standardNodes.findIndex(n => n.id === id);
    
    let updatedStandardNode;
    let updatedTgdfNode;
    
    // If the update is already in TGDF format
    if (updates.node && updates.node.data) {
      updatedTgdfNode = updates;
      updatedStandardNode = fromTgdfNode(updatedTgdfNode);
      updatedStandardNode.id = id; // Ensure ID doesn't change
      
      // Update arrays
      nodes[nodeIndex] = updatedTgdfNode;
      if (standardNodeIndex !== -1) {
        standardNodes[standardNodeIndex] = updatedStandardNode;
      }
    } else {
      // Update the standard node first
      if (standardNodeIndex !== -1) {
        updatedStandardNode = {
          ...standardNodes[standardNodeIndex],
          ...updates,
          id // Ensure ID doesn't change
        };
        standardNodes[standardNodeIndex] = updatedStandardNode;
      } else {
        // If we can't find the standard node, create a new one from updates
        updatedStandardNode = {
          id,
          ...updates
        };
      }
      
      // Convert to TGDF and update
      updatedTgdfNode = toTgdfNode(updatedStandardNode);
      nodes[nodeIndex] = updatedTgdfNode;
    }
    
    return { node: updatedTgdfNode };
  });
  // Delete a node
  fastify.delete('/api/nodes/:id', async (request, reply) => {
    const { id } = request.params;
    const nodeIndex = nodes.findIndex(n => n.node.data.identityHash === id);
    
    if (nodeIndex === -1) {
      reply.code(404);
      return { error: 'Node not found' };
    }
    
    // Remove from both arrays
    nodes.splice(nodeIndex, 1);
    
    const standardNodeIndex = standardNodes.findIndex(n => n.id === id);
    if (standardNodeIndex !== -1) {
      standardNodes.splice(standardNodeIndex, 1);
    }
    
    // Also remove any connections involving this node
    let connectionsRemoved = 0;

    // Update standard connections
    const initialStandardConnectionCount = standardConnections.length;
    standardConnections = standardConnections.filter(
      conn => conn.source !== id && conn.target !== id
    );
    connectionsRemoved = initialStandardConnectionCount - standardConnections.length;

    // Update TGDF connections (if we've converted them)
    if (connections && Array.isArray(connections)) {
      connections = connections.filter(
        conn => conn.connection && 
          fromTgdfBasic(conn.connection.data.source) !== id && 
          fromTgdfBasic(conn.connection.data.target) !== id
      );
    }
    
    return { 
      success: true, 
      connectionsRemoved
    };
  });

  // Execute a node's API (simulation)
  fastify.post('/api/nodes/:id/execute', async (request, reply) => {
    const { id } = request.params;
    const node = nodes.find(n => n.id === id);
    
    if (!node) {
      reply.code(404);
      return { error: 'Node not found' };
    }
    
    // Simulate API execution
    const isSuccess = Math.random() > 0.2; // 80% success rate
    const latency = 100 + Math.floor(Math.random() * 500);
    await new Promise(resolve => setTimeout(resolve, latency));
    
    // Update node status based on the execution result
    if (node.status !== (isSuccess ? 'active' : 'inactive')) {
      node.status = isSuccess ? 'active' : 'inactive';
      node.lastExecuted = new Date().toISOString();
    }
    
    const protocol = node.protocol || 'http';
    const port = node.port ? `:${node.port}` : '';
    const url = `${protocol}://${node.host}${port}${node.path}`;
    
    if (isSuccess) {
      // Generate sample response data
      let responseData;
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
      
      return {
        success: true,
        statusCode: 200,
        data: responseData,
        latency,
        url
      };
    } else {
      return {
        success: false,
        statusCode: 500,
        error: 'Internal server error',
        latency,
        url
      };
    }
  });
  // Get all connections
  fastify.get('/api/connections', async (request, reply) => {
    return { connections };
  });

  // Create a new connection
  fastify.post('/api/connections', async (request, reply) => {
    // If request is already in TGDF format
    if (request.body.connection && request.body.connection.data) {
      const tgdfConnection = request.body;
      connections.push(tgdfConnection);
      
      // Also add to standard connections for backward compatibility
      const standardConnection = fromTgdfConnection(tgdfConnection);
      standardConnections.push(standardConnection);
      
      reply.code(201);
      return { connection: tgdfConnection };
    }
    
    // If request is in standard format
    const { source, target, type, sourcePoint, targetPoint } = request.body;
    
    // Validate nodes exist
    const sourceNode = nodes.find(n => n.node.data.identityHash === source);
    const targetNode = nodes.find(n => n.node.data.identityHash === target);
    
    if (!sourceNode || !targetNode) {
      reply.code(400);
      return { error: 'Source or target node not found' };
    }
    
    // Check if connection already exists
    const connectionExists = connections.some(conn => {
      const connData = conn.connection.data;
      return fromTgdfBasic(connData.source) === source && 
             fromTgdfBasic(connData.target) === target && 
             fromTgdfBasic(connData.sourcePoint) === sourcePoint && 
             fromTgdfBasic(connData.targetPoint) === targetPoint;
    });
    
    if (connectionExists) {
      reply.code(409);
      return { error: 'Connection already exists' };
    }
    
    // Create standard connection first
    const standardConnection = {
      id: randomUUID(),
      source,
      target,
      sourcePoint: sourcePoint || 0,
      targetPoint: targetPoint || 0,
      type: type || 'default',
      status: 'active',
      created: new Date().toISOString()
    };
    
    // Convert to TGDF format
    const tgdfConnection = toTgdfConnection(standardConnection);
    
    // Add to both arrays
    connections.push(tgdfConnection);
    standardConnections.push(standardConnection);
    
    reply.code(201);
    return { connection: tgdfConnection };
  });
  // Get a specific connection by ID
  fastify.get('/api/connections/:id', async (request, reply) => {
    const { id } = request.params;
    const tgdfConnection = connections.find(c => c.connection.data.identityHash === id);
    
    if (!tgdfConnection) {
      reply.code(404);
      return { error: 'Connection not found' };
    }
    
    return { connection: tgdfConnection };
  });

  // Update a connection
  fastify.put('/api/connections/:id', async (request, reply) => {
    const { id } = request.params;
    const updates = request.body;
    
    // Find in TGDF format
    const connectionIndex = connections.findIndex(c => c.connection.data.identityHash === id);
    
    if (connectionIndex === -1) {
      reply.code(404);
      return { error: 'Connection not found' };
    }
    
    // Find the standard connection too for easier updating
    const standardConnectionIndex = standardConnections.findIndex(c => c.id === id);
    
    let updatedStandardConnection;
    let updatedTgdfConnection;
    
    // If the update is already in TGDF format
    if (updates.connection && updates.connection.data) {
      updatedTgdfConnection = updates;
      updatedStandardConnection = fromTgdfConnection(updatedTgdfConnection);
      updatedStandardConnection.id = id; // Ensure ID doesn't change
      
      // If changing source or target, validate new nodes exist
      const sourceId = fromTgdfBasic(updatedTgdfConnection.connection.data.source);
      const targetId = fromTgdfBasic(updatedTgdfConnection.connection.data.target);
      
      const sourceNode = nodes.find(n => n.node.data.identityHash === sourceId);
      const targetNode = nodes.find(n => n.node.data.identityHash === targetId);
      
      if (!sourceNode || !targetNode) {
        reply.code(400);
        return { error: 'Source or target node not found' };
      }
      
      // Update arrays
      connections[connectionIndex] = updatedTgdfConnection;
      if (standardConnectionIndex !== -1) {
        standardConnections[standardConnectionIndex] = updatedStandardConnection;
      }
    } else {
      // If changing source or target, validate new nodes exist
      if (updates.source || updates.target) {
        const currentConn = connections[connectionIndex];
        const sourceId = updates.source || fromTgdfBasic(currentConn.connection.data.source);
        const targetId = updates.target || fromTgdfBasic(currentConn.connection.data.target);
        
        const sourceNode = nodes.find(n => n.node.data.identityHash === sourceId);
        const targetNode = nodes.find(n => n.node.data.identityHash === targetId);
        
        if (!sourceNode || !targetNode) {
          reply.code(400);
          return { error: 'Source or target node not found' };
        }
      }
      
      // Update the standard connection first
      if (standardConnectionIndex !== -1) {
        updatedStandardConnection = {
          ...standardConnections[standardConnectionIndex],
          ...updates,
          id // Ensure ID doesn't change
        };
        standardConnections[standardConnectionIndex] = updatedStandardConnection;
      } else {
        // If we can't find the standard connection, create one from the TGDF connection
        const currentConn = fromTgdfConnection(connections[connectionIndex]);
        updatedStandardConnection = {
          ...currentConn,
          ...updates,
          id // Ensure ID doesn't change
        };
        standardConnections.push(updatedStandardConnection);
      }
      
      // Convert to TGDF and update
      updatedTgdfConnection = toTgdfConnection(updatedStandardConnection);
      connections[connectionIndex] = updatedTgdfConnection;
    }
    
    return { connection: updatedTgdfConnection };
  });
  // Delete a connection
  fastify.delete('/api/connections/:id', async (request, reply) => {
    const { id } = request.params;
    const connectionIndex = connections.findIndex(c => c.connection.data.identityHash === id);
    
    if (connectionIndex === -1) {
      reply.code(404);
      return { error: 'Connection not found' };
    }
    
    // Remove from TGDF connections array
    connections.splice(connectionIndex, 1);
    
    // Also remove from standard connections array for consistency
    const standardConnectionIndex = standardConnections.findIndex(c => c.id === id);
    if (standardConnectionIndex !== -1) {
      standardConnections.splice(standardConnectionIndex, 1);
    }
    
    return { success: true };
  });
}
