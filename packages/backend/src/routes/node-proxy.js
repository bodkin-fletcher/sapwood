// Node API Proxy routes for communicating with external nodes
// Using built-in fetch API (available in Node.js since v18)
import { fromTgdfNode } from '../utils/tgdf.js';

/**
 * Registers routes for proxying requests to external node APIs
 * This prevents CORS issues when accessing node APIs from the browser
 */
export default async function registerNodeApiProxyRoutes(fastify) {
  // Proxy for node root API (route discovery)
  fastify.get('/api/node-proxy/:nodeId/root', async (request, reply) => {
    const { nodeId } = request.params;
    
    try {
      // Find the node in our system
      const node = await getNodeById(nodeId, fastify);
      if (!node) {
        reply.code(404);
        return { error: `Node ${nodeId} not found` };
      }
      
      // Construct the node's base URL
      const nodeBaseUrl = buildNodeUrl(node);
      
      // Forward the request to the node's root endpoint
      const response = await fetch(`${nodeBaseUrl}/`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        reply.code(response.status);
        return { 
          error: `Error from node: ${response.statusText}`, 
          status: response.status 
        };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      fastify.log.error(`Error proxying root API request to node ${nodeId}: ${error.message}`);
      reply.code(500);
      return { error: "Error communicating with node", details: error.message };
    }
  });
  
  // Proxy for node heartbeat API
  fastify.get('/api/node-proxy/:nodeId/heartbeat', async (request, reply) => {
    const { nodeId } = request.params;
    const timeout = request.query.timeout || 5000;
    
    try {
      // Find the node in our system
      const node = await getNodeById(nodeId, fastify);
      if (!node) {
        reply.code(404);
        return { error: `Node ${nodeId} not found` };
      }
      
      // Construct the node's base URL
      const nodeBaseUrl = buildNodeUrl(node);
      
      // Forward the request to the node's heartbeat endpoint
      const response = await fetch(`${nodeBaseUrl}/heartbeat?timeout=${timeout}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        reply.code(response.status);
        return { 
          error: `Error from node: ${response.statusText}`, 
          status: response.status 
        };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      fastify.log.error(`Error proxying heartbeat request to node ${nodeId}: ${error.message}`);
      reply.code(500);
      return { error: "Error communicating with node", details: error.message };
    }
  });
  
  // Proxy for node status API
  fastify.get('/api/node-proxy/:nodeId/status', async (request, reply) => {
    const { nodeId } = request.params;
    
    try {
      // Find the node in our system
      const node = await getNodeById(nodeId, fastify);
      if (!node) {
        reply.code(404);
        return { error: `Node ${nodeId} not found` };
      }
      
      // Construct the node's base URL
      const nodeBaseUrl = buildNodeUrl(node);
      
      // Forward the request to the node's status endpoint
      const response = await fetch(`${nodeBaseUrl}/status`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        reply.code(response.status);
        return { 
          error: `Error from node: ${response.statusText}`, 
          status: response.status 
        };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      fastify.log.error(`Error proxying status request to node ${nodeId}: ${error.message}`);
      reply.code(500);
      return { error: "Error communicating with node", details: error.message };
    }
  });
}

/**
 * Helper function to retrieve a node by ID
 */
async function getNodeById(nodeId, fastify) {
  try {
    // Note: This is a placeholder implementation. In a real system,
    // you would query your database or data store for the node.
    // For now, we'll use the internal route to get the node.
    
    const response = await fastify.inject({
      method: 'GET',
      url: `/api/nodes/${nodeId}`
    });
    
    if (response.statusCode !== 200) {
      return null;
    }
    
    const data = JSON.parse(response.body);
    return data.node ? fromTgdfNode(data.node) : null;
  } catch (error) {
    fastify.log.error(`Error getting node ${nodeId}: ${error.message}`);
    return null;
  }
}

/**
 * Helper function to build a node's base URL
 */
function buildNodeUrl(node) {
  const protocol = node.protocol || 'http';
  const host = node.host || 'localhost';
  const port = node.port ? `:${node.port}` : '';
  const path = node.path || '';
  
  return `${protocol}://${host}${port}${path}`;
}
