// API service for data wrangling operations
import { nodeService } from './api';

const API_BASE_URL = 'http://localhost:8080/api';

export const dataService = {
  // Get a snapshot of data flowing through the system
  async getDataFlowSnapshot() {
    try {
      const response = await fetch(`${API_BASE_URL}/data/flow`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching data flow snapshot:', error);
      throw error;
    }
  },

  // Get data for a specific node
  async getNodeData(nodeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/data/nodes/${nodeId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching data for node ${nodeId}:`, error);
      throw error;
    }
  },

  // Get data for a specific connection
  async getConnectionData(connectionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/data/connections/${connectionId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching data for connection ${connectionId}:`, error);
      throw error;
    }
  },

  // Update data for a specific node
  async updateNodeData(nodeId, newData) {
    try {
      const response = await fetch(`${API_BASE_URL}/data/nodes/${nodeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: newData }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating data for node ${nodeId}:`, error);
      throw error;
    }
  },

  // Update data for a specific connection
  async updateConnectionData(connectionId, newData) {
    try {
      const response = await fetch(`${API_BASE_URL}/data/connections/${connectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: newData }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating data for connection ${connectionId}:`, error);
      throw error;
    }
  },

  // Transform data
  async transformData(transformationRequest) {
    try {
      const response = await fetch(`${API_BASE_URL}/data/transform`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformationRequest),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error transforming data:', error);
      throw error;
    }
  },

  // Validate data
  async validateData(validationRequest) {
    try {
      const response = await fetch(`${API_BASE_URL}/data/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validationRequest),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error validating data:', error);
      throw error;
    }
  },

  // Save validation results
  async saveValidationResults(resultsData) {
    try {
      const response = await fetch(`${API_BASE_URL}/data/validation-results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resultsData),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving validation results:', error);
      throw error;
    }
  },

  // Export data as CSV
  async exportAsCSV(exportRequest) {
    try {
      const response = await fetch(`${API_BASE_URL}/data/export/csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportRequest),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error exporting data as CSV:', error);
      throw error;
    }
  },
};
