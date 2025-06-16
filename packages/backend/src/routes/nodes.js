// Node data storage and API routes
import { randomUUID } from 'crypto';

// In-memory data store
const nodes = [
  { 
    id: '1', 
    name: 'API Gateway', 
    type: 'gateway',
    host: 'api.example.com',
    port: 443,
    protocol: 'https',
    path: '/api/v1',
    status: 'active',
    description: 'Main API gateway for external services'
  },
  { 
    id: '2', 
    name: 'Database', 
    type: 'storage',
    host: 'db.internal',
    port: 5432,
    protocol: 'http',
    path: '/query',
    status: 'active',
    description: 'Primary PostgreSQL database'
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
    description: 'Data processing microservice'
  },
];

let connections = [];

export default async function registerNodeRoutes(fastify) {
  // Get all nodes
  fastify.get('/api/nodes', async (request, reply) => {
    return { nodes };
  });

  // Get a specific node by ID
  fastify.get('/api/nodes/:id', async (request, reply) => {
    const { id } = request.params;
    const node = nodes.find(n => n.id === id);
    
    if (!node) {
      reply.code(404);
      return { error: 'Node not found' };
    }
    
    return { node };
  });

  // Create a new node
  fastify.post('/api/nodes', async (request, reply) => {
    const { name, type, host, port, protocol, path, description } = request.body;
    
    // Simple validation
    if (!name || !host) {
      reply.code(400);
      return { error: 'Name and host are required' };
    }
    
    const newNode = {
      id: randomUUID(),
      name,
      type: type || 'service',
      host,
      port: port ? parseInt(port, 10) : null,
      protocol: protocol || 'http',
      path: path || '',
      description: description || '',
      status: 'active'
    };
    
    nodes.push(newNode);
    
    reply.code(201);
    return { node: newNode };
  });

  // Update a node
  fastify.put('/api/nodes/:id', async (request, reply) => {
    const { id } = request.params;
    const updates = request.body;
    
    const nodeIndex = nodes.findIndex(n => n.id === id);
    
    if (nodeIndex === -1) {
      reply.code(404);
      return { error: 'Node not found' };
    }
    
    // Update the node
    nodes[nodeIndex] = {
      ...nodes[nodeIndex],
      ...updates,
      id // Ensure ID doesn't change
    };
    
    return { node: nodes[nodeIndex] };
  });

  // Delete a node
  fastify.delete('/api/nodes/:id', async (request, reply) => {
    const { id } = request.params;
    const nodeIndex = nodes.findIndex(n => n.id === id);
    
    if (nodeIndex === -1) {
      reply.code(404);
      return { error: 'Node not found' };
    }
    
    nodes.splice(nodeIndex, 1);
    
    // Also remove any connections involving this node
    const initialConnectionCount = connections.length;
    connections = connections.filter(
      conn => conn.source !== id && conn.target !== id
    );
    
    return { 
      success: true, 
      connectionsRemoved: initialConnectionCount - connections.length 
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
    const { source, target, label, type, description, properties, sourcePoint, targetPoint } = request.body;
    
    // Validate nodes exist
    const sourceNode = nodes.find(n => n.id === source);
    const targetNode = nodes.find(n => n.id === target);
    
    if (!sourceNode || !targetNode) {
      reply.code(400);
      return { error: 'Source or target node not found' };
    }
    
    // Check if connection already exists
    const connectionExists = connections.some(
      c => c.source === source && c.target === target && 
           c.sourcePointIndex === sourcePoint?.index && c.targetPointIndex === targetPoint?.index
    );
    
    if (connectionExists) {
      reply.code(409);
      return { error: 'Connection already exists' };
    }
    
    const newConnection = {
      id: randomUUID(),
      source,
      target,
      sourcePointIndex: sourcePoint?.index,
      targetPointIndex: targetPoint?.index,
      label: label || null,
      type: type || 'default',
      description: description || '',
      properties: properties || {},
      created: new Date().toISOString()
    };
    
    connections.push(newConnection);
    
    reply.code(201);
    return { connection: newConnection };
  });

  // Get a specific connection by ID
  fastify.get('/api/connections/:id', async (request, reply) => {
    const { id } = request.params;
    const connection = connections.find(c => c.id === id);
    
    if (!connection) {
      reply.code(404);
      return { error: 'Connection not found' };
    }
    
    return { connection };
  });

  // Update a connection
  fastify.put('/api/connections/:id', async (request, reply) => {
    const { id } = request.params;
    const updates = request.body;
    
    const connectionIndex = connections.findIndex(c => c.id === id);
    
    if (connectionIndex === -1) {
      reply.code(404);
      return { error: 'Connection not found' };
    }

    // If changing source or target, validate new nodes exist
    if (updates.source || updates.target) {
      const sourceId = updates.source || connections[connectionIndex].source;
      const targetId = updates.target || connections[connectionIndex].target;
      
      const sourceNode = nodes.find(n => n.id === sourceId);
      const targetNode = nodes.find(n => n.id === targetId);
      
      if (!sourceNode || !targetNode) {
        reply.code(400);
        return { error: 'Source or target node not found' };
      }
    }
    
    // Update the connection
    connections[connectionIndex] = {
      ...connections[connectionIndex],
      ...updates,
      id // Ensure ID doesn't change
    };
    
    return { connection: connections[connectionIndex] };
  });

  // Delete a connection
  fastify.delete('/api/connections/:id', async (request, reply) => {
    const { id } = request.params;
    const connectionIndex = connections.findIndex(c => c.id === id);
    
    if (connectionIndex === -1) {
      reply.code(404);
      return { error: 'Connection not found' };
    }
    
    connections.splice(connectionIndex, 1);
    
    return { success: true };
  });
}
