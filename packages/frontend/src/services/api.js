// API service for node-related operations
const API_BASE_URL = 'http://localhost:8080/api';

export const nodeService = {
  // Get all nodes
  async getAllNodes() {
    try {
      const response = await fetch(`${API_BASE_URL}/nodes`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      return data.nodes;
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
      return data.node;
    } catch (error) {
      console.error(`Error fetching node ${id}:`, error);
      throw error;
    }
  },

  // Create a new node
  async createNode(nodeData) {
    try {
      const response = await fetch(`${API_BASE_URL}/nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nodeData),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.node;
    } catch (error) {
      console.error('Error creating node:', error);
      throw error;
    }
  },

  // Update a node
  async updateNode(id, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/nodes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.node;
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
      return data.connections;
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
      return data.connection;
    } catch (error) {
      console.error(`Error fetching connection ${id}:`, error);
      throw error;
    }
  },

  // Create a new connection
  async createConnection(sourceId, targetId, options = {}) {
    try {
      const { label, type, description, properties } = options;
      const response = await fetch(`${API_BASE_URL}/connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: sourceId,
          target: targetId,
          label,
          type,
          description,
          properties
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.connection;
    } catch (error) {
      console.error('Error creating connection:', error);
      throw error;
    }
  },

  // Update a connection
  async updateConnection(id, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/connections/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.connection;
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
