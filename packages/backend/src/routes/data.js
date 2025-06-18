// Data routes for data wrangling operations
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to data storage directory
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// TGDF utility imports
import { 
  toTgdfRecords, fromTgdfRecords, 
  toTgdfBasic, fromTgdfBasic,
  validateTgdfNode
} from '../utils/tgdf.js';

// Register the data routes
export default async function registerDataRoutes(fastify) {
  // Ensure data directory exists
  const ensureDataDir = async () => {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (err) {
      console.error('Error creating data directory:', err);
    }
  };

  await ensureDataDir();

  // Helper to convert JSON to CSV
  const jsonToCSV = (jsonArray) => {
    if (!Array.isArray(jsonArray) || jsonArray.length === 0) {
      return '';
    }
    
    const headers = Object.keys(jsonArray[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add rows
    for (const row of jsonArray) {
      const values = headers.map(header => {
        const value = row[header];
        // Handle special cases (objects, arrays, null, etc.)
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return `"${value}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  // Helper to perform data transformations on TGDF data
  const transformData = (tgdfData, transformType, params) => {
    if (!Array.isArray(tgdfData) || tgdfData.length === 0) {
      return [];
    }
    
    try {
      // Convert TGDF to standard format for transformation
      const standardData = fromTgdfRecords(tgdfData);
      let transformedData;
      
      switch (transformType) {
        case 'filter':
          // Convert string to function
          const filterFn = new Function('record', `return ${params.condition}`);
          transformedData = standardData.filter(record => {
            try {
              return filterFn(record);
            } catch (err) {
              return false;
            }
          });
          break;
          
        case 'map':
          const mapFn = new Function('record', `return ${params.transformation}`);
          transformedData = standardData.map(record => {
            try {
              return mapFn(record);
            } catch (err) {
              return record;
            }
          });
          break;
          
        case 'sort':
          transformedData = [...standardData].sort((a, b) => {
            const aValue = a[params.field];
            const bValue = b[params.field];
            
            if (params.direction === 'ascending') {
              return aValue > bValue ? 1 : -1;
            } else {
              return aValue < bValue ? 1 : -1;
            }
          });
          break;
          
        case 'groupBy':
          const result = {};
          for (const record of standardData) {
            const key = record[params.field];
            if (!result[key]) {
              result[key] = [];
            }
            result[key].push(record);
          }
          // Convert object to array for consistency
          transformedData = Object.entries(result).map(([key, value]) => ({
            key,
            items: value,
            count: value.length
          }));
          break;
          
        case 'aggregate':
          const aggregatedData = {};
          
          for (const record of standardData) {
            const key = record[params.field];
            if (!aggregatedData[key]) {
              aggregatedData[key] = [];
            }
            aggregatedData[key].push(record);
          }
          
          transformedData = Object.entries(aggregatedData).map(([key, records]) => {
            let result = { key, count: records.length };
            
            if (params.operation === 'sum') {
              result.sum = records.reduce((sum, record) => sum + (Number(record[params.field]) || 0), 0);
            } else if (params.operation === 'avg') {
              result.average = records.reduce((sum, record) => sum + (Number(record[params.field]) || 0), 0) / records.length;
            } else if (params.operation === 'min') {
              result.min = Math.min(...records.map(record => Number(record[params.field]) || 0));
            } else if (params.operation === 'max') {
              result.max = Math.max(...records.map(record => Number(record[params.field]) || 0));
            }
            
            return result;
          });
          break;
          
        case 'custom':
          // Execute custom code - provide both standard and TGDF data to the function
          const customFn = new Function('data', 'tgdfData', params.code);
          transformedData = customFn(standardData, tgdfData);
          break;
          
        default:
          transformedData = standardData;
      }
      
      // For operations that don't return records (e.g., groupBy, aggregate), 
      // we'll return as-is without converting back to TGDF
      if (transformType === 'groupBy' || transformType === 'aggregate') {
        return transformedData;
      }
      
      // Convert results back to TGDF format
      return toTgdfRecords(transformedData);
      
    } catch (error) {
      console.error('Error during transformation:', error);
      return [];
    }
  };

  // Helper to validate data
  const validateData = (data, rules) => {
    if (!Array.isArray(data) || data.length === 0) {
      return { 
        valid: false,
        errors: ['No data to validate'],
        warnings: []
      };
    }
    
    const validationParams = {
      validRecords: [],
      invalidRecords: [],
      errors: [],
      warnings: []
    };
    
    // Apply each validation rule
    for (const rule of rules) {
      switch (rule) {
        case 'schema':
          // Schema validation - ensure all records have the same fields
          const firstRecordKeys = Object.keys(data[0]).sort().join(',');
          data.forEach((record, index) => {
            const recordKeys = Object.keys(record).sort().join(',');
            if (recordKeys !== firstRecordKeys) {
              validationParams.errors.push(`Record at index ${index} has different schema`);
              validationParams.invalidRecords.push(record);
            }
          });
          break;
          
        case 'dataType':
          // Data type validation - ensure values match expected types
          data.forEach((record, index) => {
            let isValid = true;
            Object.entries(record).forEach(([key, value]) => {
              // Check first record for type reference
              const firstValue = data[0][key];
              if (typeof value !== typeof firstValue) {
                validationParams.errors.push(
                  `Record at index ${index}: field "${key}" should be ${typeof firstValue} but got ${typeof value}`
                );
                isValid = false;
              }
            });
            if (!isValid && !validationParams.invalidRecords.includes(record)) {
              validationParams.invalidRecords.push(record);
            }
          });
          break;
          
        case 'required':
          // Required fields validation - ensure no null/empty values
          const requiredFields = Object.keys(data[0]);
          data.forEach((record, index) => {
            let isValid = true;
            requiredFields.forEach(field => {
              if (record[field] === null || record[field] === undefined || record[field] === '') {
                validationParams.errors.push(`Record at index ${index}: field "${field}" is required`);
                isValid = false;
              }
            });
            if (!isValid && !validationParams.invalidRecords.includes(record)) {
              validationParams.invalidRecords.push(record);
            }
          });
          break;
          
        case 'range':
          // Range validation for numeric fields
          data.forEach((record, index) => {
            let isValid = true;
            Object.entries(record).forEach(([key, value]) => {
              if (typeof value === 'number') {
                // Simple range check (more sophisticated rules could be applied)
                if (value < -1000000 || value > 1000000) {
                  validationParams.warnings.push(
                    `Record at index ${index}: field "${key}" value ${value} is outside normal range`
                  );
                  isValid = false;
                }
              }
            });
            if (!isValid && !validationParams.invalidRecords.includes(record)) {
              validationParams.invalidRecords.push(record);
            }
          });
          break;
          
        case 'format':
          // Format validation (email, dates, etc.)
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
          
          data.forEach((record, index) => {
            let isValid = true;
            Object.entries(record).forEach(([key, value]) => {
              if (typeof value === 'string') {
                // Email validation
                if (key.includes('email') && !emailRegex.test(value)) {
                  validationParams.errors.push(
                    `Record at index ${index}: field "${key}" is not a valid email`
                  );
                  isValid = false;
                }
                
                // Date validation
                if ((key.includes('date') || key.includes('time')) && !dateRegex.test(value)) {
                  validationParams.errors.push(
                    `Record at index ${index}: field "${key}" is not a valid date/time format`
                  );
                  isValid = false;
                }
              }
            });
            if (!isValid && !validationParams.invalidRecords.includes(record)) {
              validationParams.invalidRecords.push(record);
            }
          });
          break;
      }
    }
    
    // Add valid records (those not in invalidRecords)
    validationParams.validRecords = data.filter(record => !validationParams.invalidRecords.includes(record));
    
    return {
      valid: validationParams.errors.length === 0,
      ...validationParams
    };
  };

  // Standard data format for each node
  const standardNodeData = {
    '1': [
      { id: '101', timestamp: '2025-06-01T12:00:00Z', user: 'user123', action: 'login', status: 'success' },
      { id: '102', timestamp: '2025-06-01T12:05:23Z', user: 'user456', action: 'query', status: 'success' },
      { id: '103', timestamp: '2025-06-01T12:10:45Z', user: 'user789', action: 'login', status: 'failed' },
      { id: '104', timestamp: '2025-06-01T12:15:12Z', user: 'user123', action: 'logout', status: 'success' },
    ],
    '2': [
      { id: '201', name: 'Product A', category: 'Electronics', price: 299.99, inStock: true },
      { id: '202', name: 'Product B', category: 'Books', price: 24.95, inStock: true },
      { id: '203', name: 'Product C', category: 'Electronics', price: 149.50, inStock: false },
      { id: '204', name: 'Product D', category: 'Clothing', price: 49.99, inStock: true },
    ],
    '3': [
      { id: '301', orderId: 'ORD-001', customer: 'Customer A', items: 3, total: 374.93 },
      { id: '302', orderId: 'ORD-002', customer: 'Customer B', items: 1, total: 24.95 },
      { id: '303', orderId: 'ORD-003', customer: 'Customer C', items: 2, total: 199.49 },
    ],
  };

  // Convert to TGDF format
  const nodeData = {};
  Object.entries(standardNodeData).forEach(([nodeId, records]) => {
    nodeData[nodeId] = toTgdfRecords(records);
  });

  // Sample data for connections (empty for now, connections can have data added via API)
  const standardConnectionData = {};
  const connectionData = {};

  // Sample validation results
  const validationResults = {};

  // Get data flow snapshot
  fastify.get('/api/data/flow', async (request, reply) => {
    try {
      // This would be fetched from a database in a real application
      const flows = [];
      
      // Generate sample flow data
      for (const nodeId in nodeData) {
        const targetIds = ['1', '2', '3'].filter(id => id !== nodeId);
        for (const targetId of targetIds) {
          flows.push({
            sourceId: nodeId,
            sourceName: `Node ${nodeId}`,
            targetId: targetId,
            targetName: `Node ${targetId}`,
            status: Math.random() > 0.3 ? 'active' : 'inactive',
            dataType: 'JSON',
            recordCount: Math.floor(Math.random() * 100) + 1,
            lastUpdated: new Date(Date.now() - Math.random() * 86400000).toISOString()
          });
        }
      }
      
      // Generate node summaries
      const nodeSummaries = [];
      for (const nodeId in nodeData) {
        nodeSummaries.push({
          id: nodeId,
          name: `Node ${nodeId}`,
          type: ['API', 'Database', 'Processing'][nodeId - 1],
          status: Math.random() > 0.2 ? 'active' : 'inactive',
          inputCount: Math.floor(Math.random() * 50) + 1,
          outputCount: Math.floor(Math.random() * 100) + 1,
          lastUpdated: new Date(Date.now() - Math.random() * 86400000).toISOString()
        });
      }
      
      return {
        flows,
        nodeSummaries,
        timestamp: new Date().toISOString(),
        dataFormat: 'TGDF'
      };
    } catch (error) {
      console.error('Error getting data flow snapshot:', error);
      reply.code(500).send({ error: 'Failed to get data flow snapshot' });
    }
  });

  // Get node data
  fastify.get('/api/data/nodes/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      // Get node name
      const node = fastify.nodes.find(n => n.id === id);
      if (!node) {
        return reply.code(404).send({ error: `Node with ID ${id} not found` });
      }
      
      // Get node data in TGDF format
      const tgdfData = nodeData[id] || [];
      
      // Convert to standard format for frontend display
      const standardData = fromTgdfRecords(tgdfData);
      
      // Generate CSV from standard data
      const csvContent = jsonToCSV(standardData);
      
      return {
        nodeId: id,
        nodeName: node.name,
        format: 'JSON',
        tgdfRecords: tgdfData,  // Include raw TGDF data
        records: standardData,  // Include converted standard data
        csvContent,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error getting data for node ${request.params.id}:`, error);
      reply.code(500).send({ error: 'Failed to get node data' });
    }
  });

  // Get connection data
  fastify.get('/api/data/connections/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      // Get connection details
      const connection = fastify.connections.find(c => c.id === id);
      if (!connection) {
        return reply.code(404).send({ error: `Connection with ID ${id} not found` });
      }
      
      // Get connection data or create sample data
      if (!connectionData[id]) {
        // Sample data based on source node
        const sourceData = nodeData[connection.source] || [];
        
        // Create standard format data first
        const standardData = fromTgdfRecords(sourceData).map(item => ({
          ...item,
          processedAt: new Date().toISOString(),
          connectionId: id
        }));
        
        // Convert to TGDF format for storage
        connectionData[id] = toTgdfRecords(standardData);
      }
      
      // Get TGDF data
      const tgdfData = connectionData[id];
      
      // Convert to standard format for frontend display
      const standardData = fromTgdfRecords(tgdfData);
      
      // Generate CSV from standard data
      const csvContent = jsonToCSV(standardData);
      
      const sourceNode = fastify.nodes.find(n => n.id === connection.source);
      const targetNode = fastify.nodes.find(n => n.id === connection.target);
      
      return {
        id,
        source: connection.source,
        target: connection.target,
        sourceName: sourceNode?.name || 'Unknown',
        targetName: targetNode?.name || 'Unknown',
        format: 'JSON',
        tgdfRecords: tgdfData,  // Include raw TGDF data
        records: standardData,  // Include converted standard data
        csvContent,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error getting data for connection ${request.params.id}:`, error);
      reply.code(500).send({ error: 'Failed to get connection data' });
    }
  });

  // Update node data
  fastify.put('/api/data/nodes/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { records } = request.body;
      
      if (!records || !Array.isArray(records)) {
        return reply.code(400).send({ error: 'Invalid request. Missing or invalid records.' });
      }
      
      // Update node data
      nodeData[id] = records; // Records should be in TGDF format already
      
      return { 
        success: true,
        message: `Data for node ${id} updated successfully`,
        count: records.length
      };
    } catch (error) {
      console.error(`Error updating data for node ${request.params.id}:`, error);
      reply.code(500).send({ error: 'Failed to update node data' });
    }
  });

  // Update connection data
  fastify.put('/api/data/connections/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { records } = request.body;
      
      if (!records || !Array.isArray(records)) {
        return reply.code(400).send({ error: 'Invalid request. Missing or invalid records.' });
      }
      
      // Update connection data
      connectionData[id] = records; // Records should be in TGDF format already
      
      return { 
        success: true,
        message: `Data for connection ${id} updated successfully`,
        count: records.length
      };
    } catch (error) {
      console.error(`Error updating data for connection ${request.params.id}:`, error);
      reply.code(500).send({ error: 'Failed to update connection data' });
    }
  });

  // Transform data
  fastify.post('/api/data/transform', async (request, reply) => {
    try {
      const { type, params, data, sourceId } = request.body;
      
      if (!type || !params || !data) {
        return reply.code(400).send({ error: 'Invalid request. Missing required parameters.' });
      }
      
      // Convert input to TGDF format if it's not already (frontend might or might not send TGDF)
      let tgdfInputData;
      
      if (data[0] && data[0].record) {
        // Data is already in TGDF format
        tgdfInputData = data;
      } else {
        // Convert to TGDF format
        tgdfInputData = toTgdfRecords(data);
      }
      
      // Transform the TGDF data
      const transformedTgdfData = transformData(tgdfInputData, type, params);
      
      // Convert transformed data back to standard format for the frontend
      const standardTransformedData = fromTgdfRecords(transformedTgdfData);
      
      return {
        transformedData: standardTransformedData,
        tgdfTransformedData: transformedTgdfData, // Include raw TGDF data
        transformType: type,
        sourceId
      };
    } catch (error) {
      console.error('Error transforming data:', error);
      reply.code(500).send({ error: `Failed to transform data: ${error.message}` });
    }
  });

  // Validate data
  fastify.post('/api/data/validate', async (request, reply) => {
    try {
      const { rules, data, sourceId } = request.body;
      
      if (!rules || !data) {
        return reply.code(400).send({ error: 'Invalid request. Missing required parameters.' });
      }
      
      // Convert input to TGDF format if it's not already
      let tgdfInputData;
      if (data[0] && data[0].record) {
        // Data is already in TGDF format
        tgdfInputData = data;
      } else {
        // Convert to TGDF format
        tgdfInputData = toTgdfRecords(data);
      }
      
      // First validate TGDF format compliance
      let tgdfResults = null;
      if (rules.includes('tgdf')) {
        // Validate TGDF format using the TGDF validation functions
        const validationParams = {
          validRecords: [],
          invalidRecords: [],
          errors: [],
          warnings: []
        };
        
        // Validate each record
        tgdfInputData.forEach((record, index) => {
          // Use validateTgdfRecord function if it's available
          // For now we'll do some basic checks
          if (!record.record || !record.record.data || !record.record.data.identityHash) {
            validationParams.errors.push(`Record at index ${index} is missing required TGDF structure`);
            validationParams.invalidRecords.push(record);
          } else {
            validationParams.validRecords.push(record);
          }
        });
        
        tgdfResults = {
          valid: validationParams.errors.length === 0,
          ...validationParams
        };
      }
      
      // Validate the data for other rules using standard format
      const standardData = fromTgdfRecords(tgdfInputData);
      const standardResults = validateData(standardData, rules.filter(r => r !== 'tgdf'));
      
      // Combine TGDF validation with standard validation
      const results = tgdfResults ? {
        valid: tgdfResults.valid && standardResults.valid,
        errors: [...(tgdfResults.errors || []), ...(standardResults.errors || [])],
        warnings: [...(tgdfResults.warnings || []), ...(standardResults.warnings || [])],
        tgdfValidation: tgdfResults,
        standardValidation: standardResults,
        records: standardData,
        tgdfRecords: tgdfInputData
      } : standardResults;
      
      // Store validation results
      validationResults[sourceId] = {
        ...results,
        timestamp: new Date().toISOString()
      };
      
      return results;
    } catch (error) {
      console.error('Error validating data:', error);
      reply.code(500).send({ error: `Failed to validate data: ${error.message}` });
    }
  });

  // Save validation results
  fastify.post('/api/data/validation-results', async (request, reply) => {
    try {
      const { results, sourceId, sourceType } = request.body;
      
      if (!results || !sourceId || !sourceType) {
        return reply.code(400).send({ error: 'Invalid request. Missing required parameters.' });
      }
      
      // Store validation results
      validationResults[sourceId] = {
        ...results,
        sourceType,
        timestamp: new Date().toISOString()
      };
      
      // Save to file
      const filePath = path.join(DATA_DIR, `validation_${sourceId}.json`);
      await fs.writeFile(
        filePath,
        JSON.stringify(validationResults[sourceId], null, 2)
      );
      
      return {
        success: true,
        message: 'Validation results saved successfully'
      };
    } catch (error) {
      console.error('Error saving validation results:', error);
      reply.code(500).send({ error: `Failed to save validation results: ${error.message}` });
    }
  });

  // Export data to CSV
  fastify.post('/api/data/export/csv', async (request, reply) => {
    try {
      const { records, type, id, filename } = request.body;
      
      if (!records || !Array.isArray(records)) {
        return reply.code(400).send({ error: 'Invalid request. Missing or invalid records.' });
      }
      
      // Convert records to CSV
      const csvContent = jsonToCSV(records);
      
      // Save to file
      const filePath = path.join(DATA_DIR, `${type}_${id}_export.csv`);
      await fs.writeFile(filePath, csvContent);
      
      return {
        success: true,
        csvContent,
        filePath: `${type}_${id}_export.csv`,
        message: 'Data exported to CSV successfully'
      };
    } catch (error) {
      console.error('Error exporting data to CSV:', error);
      reply.code(500).send({ error: `Failed to export data to CSV: ${error.message}` });
    }
  });
  
  // Make node data available to other routes
  fastify.addHook('onReady', () => {
    fastify.decorate('nodeData', nodeData);
    fastify.decorate('connectionData', connectionData);
  });
}
