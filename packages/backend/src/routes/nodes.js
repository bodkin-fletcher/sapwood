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
    status: 'active',
    description: 'Main API gateway for external services'
  },
  { 
    id: '2', 
    name: 'Database', 
    type: 'storage',
    host: 'db.internal',
    port: 5432,
    status: 'active',
    description: 'Primary PostgreSQL database'
  },
  { 
    id: '3', 
    name: 'Processing Service', 
    type: 'service',
    host: 'processor.internal',
    port: 8000,
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
    const { name, type, host, port, description } = request.body;
    
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

  // Get all connections
  fastify.get('/api/connections', async (request, reply) => {
    return { connections };
  });

  // Create a new connection
  fastify.post('/api/connections', async (request, reply) => {
    const { source, target } = request.body;
    
    // Validate nodes exist
    const sourceNode = nodes.find(n => n.id === source);
    const targetNode = nodes.find(n => n.id === target);
    
    if (!sourceNode || !targetNode) {
      reply.code(400);
      return { error: 'Source or target node not found' };
    }
    
    // Check if connection already exists
    const connectionExists = connections.some(
      c => c.source === source && c.target === target
    );
    
    if (connectionExists) {
      reply.code(409);
      return { error: 'Connection already exists' };
    }
    
    const newConnection = {
      id: randomUUID(),
      source,
      target,
      created: new Date().toISOString()
    };
    
    connections.push(newConnection);
    
    reply.code(201);
    return { connection: newConnection };
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
