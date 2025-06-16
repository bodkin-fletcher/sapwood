// Main Fastify server entrypoint
import Fastify from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';

// Workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Fastify instance
const fastify = Fastify({
  logger: true
});

// Register CORS
// Note: Using the @fastify/cors package instead of fastify-cors since the latter is deprecated
await fastify.register(import('@fastify/cors'), {
  origin: true,
});

// Define routes
fastify.get('/api/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

fastify.get('/api/nodes', async (request, reply) => {
  // Placeholder for node data
  return {
    nodes: [
      { id: 1, name: 'API Gateway', status: 'active', type: 'gateway' },
      { id: 2, name: 'Database', status: 'active', type: 'storage' },
      { id: 3, name: 'Processing', status: 'inactive', type: 'service' },
    ]
  };
});

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: '0.0.0.0' });
    console.log(`Server is running on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
