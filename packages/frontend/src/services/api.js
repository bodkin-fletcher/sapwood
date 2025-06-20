// API service for node-related operations
import { 
  toTgdfNode, toTgdfConnection, fromTgdfNode, fromTgdfConnection 
} from './tgdf';

// Base URL for API requests - export it so other services can use it
export const API_BASE_URL = 'http://localhost:8080/api';

export const nodeService = {  // Get all nodes
  async getAllNodes() {
    try {
      const response = await fetch(`${API_BASE_URL}/nodes`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      // Convert TGDF nodes to standard format
      return data.tgdfNodes?.map(fromTgdfNode) || [];
    } catch (error) {
      console.error('Error fetching nodes:', error);
      throw error;
    }
  },
  // Get a specific node
  async getNodeById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/nodes/${id}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      // Convert TGDF node to standard format
      return fromTgdfNode(data.tgdfNode);
    } catch (error) {
      console.error(`Error fetching node ${id}:`, error);
      throw error;
    }
  },
  // Create a new node
  async createNode(nodeData) {
    try {
      // Convert to TGDF format
      const tgdfNode = toTgdfNode(nodeData);
      
      const response = await fetch(`${API_BASE_URL}/nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tgdfNode),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      // Convert TGDF response back to standard format
      return fromTgdfNode(data.node);
    } catch (error) {
      console.error('Error creating node:', error);
      throw error;
    }
  },
  // Update a node
  async updateNode(id, updates) {
    try {
      // Convert updates to TGDF format
      const tgdfUpdates = toTgdfNode(updates);
      
      const response = await fetch(`${API_BASE_URL}/nodes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tgdfUpdates),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      // Convert the response back from TGDF
      return fromTgdfNode(data.node);
    } catch (error) {
      console.error(`Error updating node ${id}:`, error);
      throw error;
    }
  },

  // Delete a node
  async deleteNode(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/nodes/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error deleting node ${id}:`, error);
      throw error;
    }
  },

  // Execute a node's API
  async executeNodeApi(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/nodes/${id}/execute`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error executing API for node ${id}:`, error);
      throw error;
    }
  },
  // Get all connections
  async getAllConnections() {
    try {
      const response = await fetch(`${API_BASE_URL}/connections`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      // Convert TGDF connections to standard format
      return data.tgdfConnections?.map(fromTgdfConnection) || [];
    } catch (error) {
      console.error('Error fetching connections:', error);
      throw error;
    }
  },
  // Get a specific connection by ID
  async getConnectionById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/connections/${id}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      // Convert TGDF connection to standard format
      return fromTgdfConnection(data.tgdfConnection);
    } catch (error) {
      console.error(`Error fetching connection ${id}:`, error);
      throw error;
    }
  },
  // Create a new connection
  async createConnection(sourceId, targetId, options = {}) {
    try {
      const { label, type, description, properties } = options;
      
      // Create connection object
      const connectionData = {
        source: sourceId,
        target: targetId,
        label,
        type,
        description,
        properties
      };
      
      // Convert to TGDF format
      const tgdfConnection = toTgdfConnection(connectionData);
      
      const response = await fetch(`${API_BASE_URL}/connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tgdfConnection),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      // Convert TGDF response back to standard format
      return fromTgdfConnection(data.connection);
    } catch (error) {
      console.error('Error creating connection:', error);
      throw error;
    }
  },
  // Update a connection
  async updateConnection(id, updates) {
    try {
      // Convert updates to TGDF format
      // First we need to ensure it has the complete connection structure
      // by getting the current connection and merging with updates
      const currentConnection = await this.getConnectionById(id);
      const updatedConnection = { ...currentConnection, ...updates };
      
      // Convert to TGDF format
      const tgdfUpdates = toTgdfConnection(updatedConnection);
      
      const response = await fetch(`${API_BASE_URL}/connections/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tgdfUpdates),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      // Convert TGDF response back to standard format
      return fromTgdfConnection(data.connection);
    } catch (error) {
      console.error(`Error updating connection ${id}:`, error);
      throw error;
    }
  },

  // Delete a connection
  async deleteConnection(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/connections/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error deleting connection ${id}:`, error);
      throw error;
    }
  },
};

// API service for settings-related operations
export const settingsService = {
  // Get settings
  async getSettings() {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      return data.settings;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  // Update settings
  async updateSettings(settingsData) {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.settings;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  // Reset settings to default
  async resetSettings() {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/reset`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.settings;
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  }
};
