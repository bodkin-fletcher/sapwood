// External Node API client for communicating with external nodes via backend proxy
import { API_BASE_URL } from './api';

/**
 * Service for interacting with external node APIs
 * that follow the Sapwood Node API specification
 * 
 * All calls are proxied through the backend to avoid CORS issues
 */
export const externalNodeApi = {
  /**
   * Get the list of available API routes from a node
   * @param {string} nodeId - ID of the node in the Sapwood system
   * @returns {Promise<Object>} - API routes data
   */
  async getApiRoutes(nodeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/node-proxy/${nodeId}/root`, {
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
   * @param {string} nodeId - ID of the node in the Sapwood system
   * @param {number} timeout - Optional timeout in milliseconds
   * @returns {Promise<Object>} - Heartbeat response data
   */
  async checkHeartbeat(nodeId, timeout = 5000) {
    try {
      // Call through the proxy
      const response = await fetch(`${API_BASE_URL}/node-proxy/${nodeId}/heartbeat?timeout=${timeout}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

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
   * @param {string} nodeId - ID of the node in the Sapwood system
   * @returns {Promise<Object>} - Status response data
   */
  async getStatus(nodeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/node-proxy/${nodeId}/status`, {
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
   * @param {string} nodeId - ID of the node in the Sapwood system
   * @param {boolean} fullStatus - Whether to get full status after heartbeat check
   * @param {boolean} includeRoutes - Whether to get available routes information
   * @returns {Promise<Object>} - Combined health status data
   */
  async checkNodeHealth(nodeId, fullStatus = false, includeRoutes = false) {    try {
      // First try the heartbeat
      const heartbeat = await this.checkHeartbeat(nodeId);
      
      let result = {
        online: true,
        heartbeat: heartbeat.node_heartbeat
      };

      // Get routes information if requested
      if (includeRoutes) {
        try {
          const routes = await this.getApiRoutes(nodeId);
          result.routes = routes.api_routes;
        } catch (routesError) {
          result.routesError = routesError.message;
        }
      }      // If heartbeat successful and we want full status
      if (fullStatus) {
        try {
          const status = await this.getStatus(nodeId);
          result.status = status.node_status;
        } catch (statusError) {
          // Add error but continue
          result.status = null;
          result.statusError = statusError.message;
        }
      }// Return the result with heartbeat and optional routes
      return result;
    } catch (error) {
      return {
        online: false,
        error: error.message
      };
    }
  }
};
