// External Node API client for communicating with external nodes

/**
 * Service for interacting with external node APIs
 * that follow the Sapwood Node API specification
 */
export const externalNodeApi = {
  /**
   * Get the list of available API routes from a node
   * @param {string} nodeBaseUrl - Base URL of the node
   * @returns {Promise<Object>} - API routes data
   */
  async getApiRoutes(nodeBaseUrl) {
    try {
      const response = await fetch(`${nodeBaseUrl}/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get API routes with status: ${response.status}`);
      }

      const data = await response.json();

      // Validate that we got a TGDF api_routes object
      if (!data.api_routes) {
        throw new Error('Invalid API routes response: not a TGDF api_routes item');
      }

      return data;
    } catch (error) {
      console.error('Error getting API routes:', error);
      throw error;
    }
  },
  
  /**
   * Check if a node is online using its heartbeat API
   * @param {string} nodeBaseUrl - Base URL of the node 
   * @param {number} timeout - Optional timeout in milliseconds
   * @returns {Promise<Object>} - Heartbeat response data
   */
  async checkHeartbeat(nodeBaseUrl, timeout = 5000) {
    try {
      // Build the URL with optional timeout parameter
      const url = new URL(`${nodeBaseUrl}/heartbeat`);
      url.searchParams.append('timeout', timeout.toString());

      // Send request with AbortController for client-side timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      // Clear the timeout as we got a response
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Heartbeat failed with status: ${response.status}`);
      }

      const data = await response.json();

      // Validate that we got a TGDF node_heartbeat object
      if (!data.node_heartbeat) {
        throw new Error('Invalid heartbeat response: not a TGDF node_heartbeat item');
      }

      return data;
    } catch (error) {
      console.error('Error checking node heartbeat:', error);
      throw error;
    }
  },

  /**
   * Get detailed status information from a node
   * @param {string} nodeBaseUrl - Base URL of the node
   * @returns {Promise<Object>} - Status response data
   */
  async getStatus(nodeBaseUrl) {
    try {
      const response = await fetch(`${nodeBaseUrl}/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Status check failed with status: ${response.status}`);
      }

      const data = await response.json();

      // Validate that we got a TGDF node_status object
      if (!data.node_status) {
        throw new Error('Invalid status response: not a TGDF node_status item');
      }

      return data;
    } catch (error) {
      console.error('Error getting node status:', error);
      throw error;
    }
  },

  /**
   * Check node health and get its status
   * Uses heartbeat for a quick check, then status for details if needed
   * @param {string} nodeBaseUrl - Base URL of the node
   * @param {boolean} fullStatus - Whether to get full status after heartbeat check
   * @returns {Promise<Object>} - Combined health status data
   */  async checkNodeHealth(nodeBaseUrl, fullStatus = false, includeRoutes = false) {
    try {
      // First try the heartbeat
      const heartbeat = await this.checkHeartbeat(nodeBaseUrl);
      
      let result = {
        online: true,
        heartbeat: heartbeat.node_heartbeat
      };

      // Get routes information if requested
      if (includeRoutes) {
        try {
          const routes = await this.getApiRoutes(nodeBaseUrl);
          result.routes = routes.api_routes;
        } catch (routesError) {
          result.routesError = routesError.message;
        }
      }

      // If heartbeat successful and we want full status
      if (fullStatus) {
        try {
          const status = await this.getStatus(nodeBaseUrl);
          return {
            online: true,
            heartbeat: heartbeat.node_heartbeat,
            status: status.node_status
          };
        } catch (statusError) {
          // Return just heartbeat if status fails
          return {
            online: true,
            heartbeat: heartbeat.node_heartbeat,
            status: null,
            statusError: statusError.message
          };
        }
      }      // Return the result with heartbeat and optional routes
      return result;
    } catch (error) {
      return {
        online: false,
        error: error.message
      };
    }
  }
};
