// API service for data wrangling operations
import { nodeService } from './api';
import { toTgdfRecords, fromTgdfRecords } from './tgdf';

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
      
      // Convert TGDF data to standard format if it exists
      if (data.flowData) {
        // Flow data may contain records for multiple nodes and connections
        Object.keys(data.flowData).forEach(key => {
          if (data.flowData[key] && data.flowData[key].records) {
            data.flowData[key].records = fromTgdfRecords(data.flowData[key].records);
          }
        });
      }
      
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
      
      // Convert TGDF records to standard format
      if (data.records) {
        data.records = fromTgdfRecords(data.records);
      }
      
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
      
      // Convert TGDF records to standard format
      if (data.records) {
        data.records = fromTgdfRecords(data.records);
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching data for connection ${connectionId}:`, error);
      throw error;
    }
  },

  // Update data for a specific node
  async updateNodeData(nodeId, newData) {
    try {
      // Convert data to TGDF format
      const tgdfRecords = toTgdfRecords(newData);
      
      const response = await fetch(`${API_BASE_URL}/data/nodes/${nodeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: tgdfRecords }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert any returned records from TGDF to standard format
      if (data.records) {
        data.records = fromTgdfRecords(data.records);
      }
      
      return data;
    } catch (error) {
      console.error(`Error updating data for node ${nodeId}:`, error);
      throw error;
    }
  },

  // Update data for a specific connection
  async updateConnectionData(connectionId, newData) {
    try {
      // Convert data to TGDF format
      const tgdfRecords = toTgdfRecords(newData);
      
      const response = await fetch(`${API_BASE_URL}/data/connections/${connectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: tgdfRecords }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert any returned records from TGDF to standard format
      if (data.records) {
        data.records = fromTgdfRecords(data.records);
      }
      
      return data;
    } catch (error) {
      console.error(`Error updating data for connection ${connectionId}:`, error);
      throw error;
    }
  },
  // Transform data
  async transformData(transformationRequest) {
    try {
      // Convert input records to TGDF format
      if (transformationRequest.records) {
        transformationRequest.records = toTgdfRecords(transformationRequest.records);
      }
      
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
      
      const data = await response.json();
      
      // Convert returned records from TGDF to standard format
      if (data.transformedRecords) {
        data.transformedRecords = fromTgdfRecords(data.transformedRecords);
      }
      
      return data;
    } catch (error) {
      console.error('Error transforming data:', error);
      throw error;
    }
  },

  // Validate data
  async validateData(validationRequest) {
    try {
      // Convert input records to TGDF format
      if (validationRequest.records) {
        validationRequest.records = toTgdfRecords(validationRequest.records);
      }
      
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
      
      const data = await response.json();
      
      // The validation results might include original records
      if (data.records) {
        data.records = fromTgdfRecords(data.records);
      }
      
      return data;
    } catch (error) {
      console.error('Error validating data:', error);
      throw error;
    }
  },
  // Save validation results
  async saveValidationResults(resultsData) {
    try {
      // Convert any records in results to TGDF format
      if (resultsData.records) {
        resultsData.records = toTgdfRecords(resultsData.records);
      }
      if (resultsData.validRecords) {
        resultsData.validRecords = toTgdfRecords(resultsData.validRecords);
      }
      if (resultsData.invalidRecords) {
        resultsData.invalidRecords = toTgdfRecords(resultsData.invalidRecords);
      }
      
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
      
      const data = await response.json();
      
      // Convert any returned records from TGDF
      if (data.records) {
        data.records = fromTgdfRecords(data.records);
      }
      if (data.validRecords) {
        data.validRecords = fromTgdfRecords(data.validRecords);
      }
      if (data.invalidRecords) {
        data.invalidRecords = fromTgdfRecords(data.invalidRecords);
      }
      
      return data;
    } catch (error) {
      console.error('Error saving validation results:', error);
      throw error;
    }
  },

  // Export data as CSV
  async exportAsCSV(exportRequest) {
    try {
      // Convert records to TGDF format if they exist
      if (exportRequest.records) {
        exportRequest.records = toTgdfRecords(exportRequest.records);
      }
      
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
      
      // The response might be a CSV file or JSON metadata
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      } else {
        // Handle CSV download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        return { 
          success: true, 
          downloadUrl: url,
          filename: exportRequest.filename || 'export.csv'
        };
      }
    } catch (error) {
      console.error('Error exporting data as CSV:', error);
      throw error;
    }
  },
};
