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

// Sample data for each node
const nodeData = {
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

// Sample data for connections
const connectionData = {};

// Sample validation results
const validationResults = {};

// Ensure data directory exists
const ensureDataDir = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
};

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

// Helper to perform data transformations
const transformData = (data, transformType, params) => {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  try {
    switch (transformType) {
      case 'filter':
        // Convert string to function
        const filterFn = new Function('record', `return ${params.condition}`);
        return data.filter(record => {
          try {
            return filterFn(record);
          } catch (err) {
            return false;
          }
        });
        
      case 'map':
        const mapFn = new Function('record', `return ${params.transformation}`);
        return data.map(record => {
          try {
            return mapFn(record);
          } catch (err) {
            return record;
          }
        });
        
      case 'sort':
        return [...data].sort((a, b) => {
          const aValue = a[params.field];
          const bValue = b[params.field];
          
          if (params.direction === 'ascending') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
        
      case 'groupBy':
        const result = {};
        for (const record of data) {
          const key = record[params.field];
          if (!result[key]) {
            result[key] = [];
          }
          result[key].push(record);
        }
        // Convert object to array for consistency
        return Object.entries(result).map(([key, value]) => ({
          key,
          items: value,
          count: value.length
        }));
        
      case 'aggregate':
        const aggregatedData = {};
        
        for (const record of data) {
          const key = record[params.field];
          if (!aggregatedData[key]) {
            aggregatedData[key] = [];
          }
          aggregatedData[key].push(record);
        }
        
        return Object.entries(aggregatedData).map(([key, records]) => {
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
        
      case 'custom':
        // Execute custom code
        const customFn = new Function('data', params.code);
        return customFn(data);
        
      default:
        return data;
    }
  } catch (err) {
    console.error(`Error in transformation ${transformType}:`, err);
    throw new Error(`Transformation failed: ${err.message}`);
  }
};

// Helper to validate data
const validateData = (data, rules) => {
  if (!Array.isArray(data) || data.length === 0) {
    return { valid: true, errors: [], warnings: [], recordsChecked: 0 };
  }
  
  const errors = [];
  const warnings = [];
  
  // Sample schema validation based on first record
  if (rules.includes('schema')) {
    const firstRecord = data[0];
    const schemaFields = Object.keys(firstRecord);
    
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const recordFields = Object.keys(record);
      
      // Check for missing fields
      for (const field of schemaFields) {
        if (!recordFields.includes(field)) {
          errors.push({
            recordIndex: i,
            rule: 'schema',
            message: `Missing field '${field}' in record`
          });
        }
      }
      
      // Check for extra fields (warning only)
      for (const field of recordFields) {
        if (!schemaFields.includes(field)) {
          warnings.push({
            recordIndex: i,
            rule: 'schema',
            message: `Extra field '${field}' found in record`
          });
        }
      }
    }
  }
  
  // Data type validation
  if (rules.includes('dataType')) {
    const firstRecord = data[0];
    const fieldTypes = {};
    
    // Determine expected types from first record
    for (const field in firstRecord) {
      fieldTypes[field] = typeof firstRecord[field];
    }
    
    // Validate types in all records
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      
      for (const field in record) {
        if (fieldTypes[field] && typeof record[field] !== fieldTypes[field]) {
          errors.push({
            recordIndex: i,
            rule: 'dataType',
            message: `Field '${field}' has incorrect type: expected '${fieldTypes[field]}', got '${typeof record[field]}'`
          });
        }
      }
    }
  }
  
  // Required fields validation
  if (rules.includes('required')) {
    // Assume all fields in first record are required
    const requiredFields = Object.keys(data[0]);
    
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      
      for (const field of requiredFields) {
        if (record[field] === undefined || record[field] === null || record[field] === '') {
          errors.push({
            recordIndex: i,
            rule: 'required',
            message: `Required field '${field}' is missing or empty`
          });
        }
      }
    }
  }
  
  // Value range checks (for numeric fields)
  if (rules.includes('range')) {
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      
      for (const field in record) {
        const value = record[field];
        
        if (typeof value === 'number') {
          // These are example range checks; in a real application, 
          // the ranges would be configurable
          if (isNaN(value)) {
            errors.push({
              recordIndex: i,
              rule: 'range',
              message: `Field '${field}' contains NaN value`
            });
          } else if (value < 0 && field.includes('price')) {
            errors.push({
              recordIndex: i,
              rule: 'range',
              message: `Field '${field}' has negative value`
            });
          }
        }
      }
    }
  }
  
  // Format validation (emails, dates, etc.)
  if (rules.includes('format')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?Z$/;
    
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      
      for (const field in record) {
        const value = record[field];
        
        if (typeof value === 'string') {
          // Check email fields
          if (field.includes('email') && !emailRegex.test(value)) {
            errors.push({
              recordIndex: i,
              rule: 'format',
              message: `Field '${field}' contains invalid email format`
            });
          }
          
          // Check date/timestamp fields
          if ((field.includes('date') || field.includes('timestamp')) && !dateRegex.test(value)) {
            warnings.push({
              recordIndex: i,
              rule: 'format',
              message: `Field '${field}' may not be in ISO date format`
            });
          }
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    recordsChecked: data.length
  };
};

// Register the data routes
export default async function registerDataRoutes(fastify) {
  await ensureDataDir();

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
            dataType: 'JSON',
            status: Math.random() > 0.3 ? 'active' : 'inactive',
            lastUpdated: new Date().toISOString()
          });
        }
      }
      
      // Node summaries
      const nodeSummaries = ['1', '2', '3'].map(id => ({
        id,
        name: `Node ${id}`,
        type: ['gateway', 'storage', 'service'][parseInt(id) - 1],
        inputCount: Math.floor(Math.random() * 20) + 1,
        outputCount: Math.floor(Math.random() * 20) + 1,
        lastActivity: new Date().toISOString()
      }));
      
      return {
        flows,
        nodeSummaries,
        timestamp: new Date().toISOString()
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
      
      // Get node data
      const data = nodeData[id] || [];
      
      // Generate CSV
      const csvContent = jsonToCSV(data);
      
      return {
        nodeId: id,
        nodeName: node.name,
        format: 'JSON',
        records: data,
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
        // Create derived data for the connection
        connectionData[id] = sourceData.map(item => ({
          ...item,
          processedAt: new Date().toISOString(),
          connectionId: id
        }));
      }
      
      const data = connectionData[id];
      
      // Generate CSV
      const csvContent = jsonToCSV(data);
      
      const sourceNode = fastify.nodes.find(n => n.id === connection.source);
      const targetNode = fastify.nodes.find(n => n.id === connection.target);
      
      return {
        id,
        source: connection.source,
        target: connection.target,
        sourceName: sourceNode?.name || 'Unknown',
        targetName: targetNode?.name || 'Unknown',
        format: 'JSON',
        records: data,
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
      const { data } = request.body;
      
      if (!data || !Array.isArray(data)) {
        return reply.code(400).send({ error: 'Invalid data format. Expected array.' });
      }
      
      // Update node data
      nodeData[id] = data;
      
      // Persist to file
      const filePath = path.join(DATA_DIR, `node_${id}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      
      return {
        success: true,
        nodeId: id,
        message: 'Node data updated successfully'
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
      const { data } = request.body;
      
      if (!data || !Array.isArray(data)) {
        return reply.code(400).send({ error: 'Invalid data format. Expected array.' });
      }
      
      // Update connection data
      connectionData[id] = data;
      
      // Persist to file
      const filePath = path.join(DATA_DIR, `connection_${id}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      
      return {
        success: true,
        connectionId: id,
        message: 'Connection data updated successfully'
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
      
      if (!type || !params || !data || !Array.isArray(data)) {
        return reply.code(400).send({ error: 'Invalid request. Missing required parameters.' });
      }
      
      // Transform the data
      const transformedData = transformData(data, type, params);
      
      return {
        transformedData,
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
      
      if (!rules || !data || !Array.isArray(data)) {
        return reply.code(400).send({ error: 'Invalid request. Missing required parameters.' });
      }
      
      // Validate the data
      const results = validateData(data, rules);
      
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
      
      // Persist to file
      const filePath = path.join(DATA_DIR, `validation_${sourceId}.json`);
      await fs.writeFile(filePath, JSON.stringify(validationResults[sourceId], null, 2));
      
      return {
        success: true,
        sourceId,
        sourceType,
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
      const { id, type } = request.body;
      
      if (!id || !type) {
        return reply.code(400).send({ error: 'Invalid request. Missing required parameters.' });
      }
      
      let data;
      if (type === 'node') {
        data = nodeData[id] || [];
      } else if (type === 'connection') {
        data = connectionData[id] || [];
      } else {
        return reply.code(400).send({ error: 'Invalid type. Must be "node" or "connection".' });
      }
      
      // Generate CSV
      const csvContent = jsonToCSV(data);
      
      // Save CSV file
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
