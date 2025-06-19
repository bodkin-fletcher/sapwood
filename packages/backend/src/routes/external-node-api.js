// External Node API specification implementation
import { randomUUID } from 'crypto';
import crypto from 'crypto';

/**
 * Generates a SHA-256 hash for content
 * @param {Object} content - Content to hash
 * @returns {String} - SHA-256 hash
 */
const generateHash = (content) => {
  const contentString = JSON.stringify(content);
  return crypto.createHash('sha256').update(contentString).digest('hex');
};

/**
 * Implementation of the node heartbeat API for external nodes
 * This provides a reference implementation that matches the specification
 */
export default async function registerExternalNodeApiRoutes(fastify) {
  // Root API - provides a list of available routes
  fastify.get('/', async (request, reply) => {
    // Create a list of available routes
    const routes = [
      {
        path: { text: "/" },
        methods: { text: "GET" },
        description: { text: "API route listing" }
      },
      {
        path: { text: "/heartbeat" },
        methods: { text: "GET" },
        description: { text: "Node heartbeat check" }
      },
      {
        path: { text: "/status" },
        methods: { text: "GET" },
        description: { text: "Node detailed status" }
      }
    ];

    // Create the data object
    const data = {
      nodeId: {
        flexname: "example_node_1"
      },
      nodeName: {
        text: "Example Node"
      },
      timestamp: {
        instant: new Date().toISOString()
      },
      routes: routes
    };

    // Generate hash for integrity
    const dataHash = generateHash(data);

    // Create the full TGDF response
    const response = {
      api_routes: {
        version: "v0.1.0",
        integrity: {
          hashes: {
            sha256: dataHash
          }
        },
        data
      }
    };

    return response;
  });

  // Heartbeat API
  fastify.get('/heartbeat', async (request, reply) => {
    // Get the optional timeout query parameter
    const timeout = parseInt(request.query.timeout) || 5000;

    // Create the heartbeat data - should be minimal
    const data = {
      nodeId: {
        flexname: "example_node_1"
      },
      nodeName: {
        text: "Example Node"
      },
      timestamp: {
        instant: new Date().toISOString()
      }
    };

    // Generate hash for integrity
    const dataHash = generateHash(data);

    // Create the full TGDF response
    const response = {
      node_heartbeat: {
        version: "v0.1.0",
        integrity: {
          hashes: {
            sha256: dataHash
          }
        },
        data
      }
    };

    return response;
  });

  // Status API
  fastify.get('/status', async (request, reply) => {
    // Create the status data
    const data = {
      nodeId: {
        flexname: "example_node_1"
      },
      nodeName: {
        text: "Example Node"
      },
      timestamp: {
        instant: new Date().toISOString()
      },
      status: {
        text: "active"  // "active", "inactive", "warning", or "pending"
      },
      uptime: {
        number: "3600"  // Seconds since node started
      },
      memory: {
        total: {
          number: "1024"
        },
        used: {
          number: "512"
        }
      },
      cpu: {
        usage: {
          number: "45.2"  // Percentage
        }
      },
      connections: {
        count: {
          number: "12"
        },
        active: {
          number: "5"
        }
      },
      tasks: {
        pending: {
          number: "3"
        },
        processing: {
          number: "1"
        },
        completed: {
          number: "42"
        },
        failed: {
          number: "2"
        }
      }
    };

    // Generate hash for integrity
    const dataHash = generateHash(data);

    // Create the full TGDF response
    const response = {
      node_status: {
        version: "v0.1.0",
        integrity: {
          hashes: {
            sha256: dataHash
          }
        },
        data
      }
    };

    return response;
  });
}
