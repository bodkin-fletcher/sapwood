// Main Fastify server entrypoint
import Fastify from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';

// Import route handlers
import registerNodeRoutes from './routes/nodes.js';
import registerSettingsRoutes from './routes/settings.js';
import registerDataRoutes from './routes/data.js';
import registerExternalNodeApiRoutes from './routes/external-node-api.js';
import registerNodeApiProxyRoutes from './routes/node-proxy.js';

// Workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Fastify instance
const fastify = Fastify({
  logger: true
});

// Register CORS
await fastify.register(import('@fastify/cors'), {
  origin: true,
});

// Register static file serving (for frontend in production)
await fastify.register(import('@fastify/static'), {
  root: path.join(__dirname, '..', '..', 'frontend', 'dist'),
  prefix: '/',
});

// Register health check route
fastify.get('/api/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register route handlers
await registerNodeRoutes(fastify);
await registerSettingsRoutes(fastify);
await registerDataRoutes(fastify);
await registerExternalNodeApiRoutes(fastify);
await registerNodeApiProxyRoutes(fastify);

// Handle SPA routing - send all non-API requests to index.html
fastify.setNotFoundHandler((request, reply) => {
  // Only handle GET requests that don't start with /api
  if (request.method === 'GET' && !request.url.startsWith('/api')) {
    return reply.sendFile('index.html');
  }

  // Default 404 handler
  reply.code(404).send({ error: 'Not Found' });
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
