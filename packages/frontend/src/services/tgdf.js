// TGDF Utility Functions for Frontend
import { v4 as uuidv4 } from 'uuid';

/**
 * Converts a basic value to TGDF format
 * @param {*} value - The value to convert
 * @param {string} type - Optional type hint for conversion
 * @returns {Object} - TGDF formatted value
 */
export const toTgdfBasic = (value, type = null) => {
  if (value === null || value === undefined) {
    return { text: "none" };
  }

  // Determine the type if not provided
  if (!type) {
    if (typeof value === 'string') {
      // Check if it's a date in ISO format
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return { date: value };
      }
      // Check if it's a datetime in ISO format
      else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(value)) {
        return { instant: value };
      }
      // Check if it's "yes" or "no"
      else if (value.toLowerCase() === 'yes' || value.toLowerCase() === 'no') {
        return { yesno: value.toLowerCase() };
      }
      // Check if it's a valid email format
      else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return { email: value };
      }
      // Check if it's a restricted name format
      else if (/^[a-z0-9_]+$/.test(value)) {
        return { flexname: value };
      }
      // Default to text
      else {
        return { text: value };
      }
    }
    else if (typeof value === 'number') {
      return { number: value.toString() };
    }
    else if (typeof value === 'boolean') {
      return { yesno: value ? 'yes' : 'no' };
    }
    else {
      // Return as text if we can't determine the type
      return { text: String(value) };
    }
  } else {
    // Use the provided type
    switch (type) {
      case 'text':
        return { text: String(value) };
      case 'number':
        return { number: typeof value === 'number' ? value.toString() : String(value) };
      case 'yesno':
        if (typeof value === 'boolean') {
          return { yesno: value ? 'yes' : 'no' };
        } else if (typeof value === 'string') {
          return { yesno: value.toLowerCase() === 'true' || value === '1' ? 'yes' : 'no' };
        }
        return { yesno: 'no' };
      case 'date':
        return { date: value };
      case 'instant':
        return { instant: value };
      case 'flexname':
        return { flexname: value };
      case 'email':
        return { email: value };
      default:
        return { text: String(value) };
    }
  }
};

/**
 * Generates a simple SHA-256 hash-like string for content
 * @param {Object} content - Content to hash
 * @returns {String} - Simple hash
 */
const generateSimpleHash = (content) => {
  // Since crypto module isn't available in browser, create a simpler function
  // This is just for demo purposes - in production, use a proper hashing library
  const contentString = JSON.stringify(content);
  let hash = 0;

  for (let i = 0; i < contentString.length; i++) {
    const char = contentString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Convert to hex-like string
  const hexHash = Math.abs(hash).toString(16).padStart(16, '0');
  return hexHash;
};

/**
 * Converts a node to TGDF format
 * @param {Object} node - Node to convert
 * @returns {Object} - TGDF formatted node
 */
export const toTgdfNode = (node) => {
  // Create the data object with standard and generic fields
  const data = {
    // Standard fields
    identityHash: node.id || uuidv4(),
    tokens: node.tags ? node.tags.map(tag => ({ text: tag })) : "no_tokens",
    name: { flexname: `${node.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}` },
    created: { instant: node.created || new Date().toISOString() },

    // Generic fields
    type: toTgdfBasic(node.type, 'flexname'),
    description: toTgdfBasic(node.description, 'text'),
    status: toTgdfBasic(node.status, 'flexname'),
    host: toTgdfBasic(node.host, 'text'),
    port: toTgdfBasic(node.port, 'number'),
    protocol: toTgdfBasic(node.protocol, 'flexname'),
    path: toTgdfBasic(node.path, 'text')
  };

  // Generate version
  const version = "v0.1.0";

  // Generate hashes for integrity
  const integrity = {
    hashes: {
      sha256: generateSimpleHash(data)
    }
  };

  // Return the complete node in TGDF format
  return {
    node: {
      version,
      integrity,
      data
    }
  };
};

/**
 * Converts a connection to TGDF format
 * @param {Object} connection - Connection to convert
 * @returns {Object} - TGDF formatted connection
 */
export const toTgdfConnection = (connection) => {
  // Create the data object with standard and generic fields
  const data = {
    // Standard fields
    identityHash: connection.id || uuidv4(),
    tokens: connection.tags ? connection.tags.map(tag => ({ text: tag })) : "no_tokens",
    name: { flexname: `connection_${connection.source}_to_${connection.target}` },
    created: { instant: connection.created || new Date().toISOString() },

    // Generic fields
    source: toTgdfBasic(connection.source, 'flexname'),
    target: toTgdfBasic(connection.target, 'flexname'),
    sourcePoint: toTgdfBasic(connection.sourcePoint, 'number'),
    targetPoint: toTgdfBasic(connection.targetPoint, 'number'),
    status: toTgdfBasic(connection.status || 'active', 'flexname'),
    type: toTgdfBasic(connection.type || 'default', 'flexname')
  };

  // Generate version
  const version = "v0.1.0";

  // Generate hashes for integrity
  const integrity = {
    hashes: {
      sha256: generateSimpleHash(data)
    }
  };

  // Return the complete connection in TGDF format
  return {
    connection: {
      version,
      integrity,
      data
    }
  };
};

/**
 * Converts data records to TGDF format
 * @param {Array} records - Records to convert
 * @returns {Array} - TGDF formatted records
 */
export const toTgdfRecords = (records) => {
  return records.map(record => {
    // Create the data object with fields converted to TGDF format
    const data = {
      // Standard fields
      identityHash: record.id || uuidv4(),
      tokens: "no_tokens",
      name: { flexname: `record_${record.id || uuidv4().substring(0, 8)}` },
      created: { instant: record.timestamp || record.created || new Date().toISOString() },
    };

    // Convert all other fields to TGDF format
    Object.entries(record).forEach(([key, value]) => {
      if (!['id', 'timestamp', 'created'].includes(key)) {
        data[key] = toTgdfBasic(value);
      }
    });

    // Generate version
    const version = "v0.1.0";

    // Generate hashes for integrity
    const integrity = {
      hashes: {
        sha256: generateSimpleHash(data)
      }
    };

    // Return the complete record in TGDF format
    return {
      record: {
        version,
        integrity,
        data
      }
    };
  });
};

/**
 * Extracts the original value from a TGDF basic item
 * @param {Object} tgdfItem - TGDF item to extract from
 * @returns {*} - Original value
 */
export const fromTgdfBasic = (tgdfItem) => {
  if (!tgdfItem || typeof tgdfItem !== 'object') return tgdfItem;

  const keys = Object.keys(tgdfItem);
  if (keys.length !== 1) return tgdfItem;

  const type = keys[0];
  const value = tgdfItem[type];

  switch (type) {
    case 'text':
    case 'flexname':
    case 'date':
    case 'instant':
    case 'email':
      return value;
    case 'number':
      return isNaN(Number(value)) ? value : Number(value);
    case 'yesno':
      return value === 'yes';
    default:
      return value;
  }
};

/**
 * Converts a TGDF node back to standard format
 * @param {Object} tgdfNode - TGDF node to convert
 * @returns {Object} - Standard node
 */
export const fromTgdfNode = (tgdfNode) => {
  if (!tgdfNode || !tgdfNode.node || !tgdfNode.node.data) return null;

  const { data } = tgdfNode.node;

  // Extract standard node fields
  return {
    id: data.identityHash,
    name: fromTgdfBasic(data.name) || fromTgdfBasic(data.identityHash),
    type: fromTgdfBasic(data.type),
    description: fromTgdfBasic(data.description),
    status: fromTgdfBasic(data.status),
    host: fromTgdfBasic(data.host),
    port: fromTgdfBasic(data.port),
    protocol: fromTgdfBasic(data.protocol),
    path: fromTgdfBasic(data.path),
    created: fromTgdfBasic(data.created)
  };
};

/**
 * Converts a TGDF connection back to standard format
 * @param {Object} tgdfConnection - TGDF connection to convert
 * @returns {Object} - Standard connection
 */
export const fromTgdfConnection = (tgdfConnection) => {
  if (!tgdfConnection || !tgdfConnection.connection || !tgdfConnection.connection.data) return null;

  const { data } = tgdfConnection.connection;

  // Extract standard connection fields
  return {
    id: data.identityHash,
    source: fromTgdfBasic(data.source),
    target: fromTgdfBasic(data.target),
    sourcePoint: fromTgdfBasic(data.sourcePoint),
    targetPoint: fromTgdfBasic(data.targetPoint),
    status: fromTgdfBasic(data.status),
    type: fromTgdfBasic(data.type),
    created: fromTgdfBasic(data.created)
  };
};

/**
 * Converts TGDF records back to standard format
 * @param {Array} tgdfRecords - TGDF records to convert
 * @returns {Array} - Standard records
 */
export const fromTgdfRecords = (tgdfRecords) => {
  if (!Array.isArray(tgdfRecords)) return [];

  return tgdfRecords.map(tgdfRecord => {
    if (!tgdfRecord || !tgdfRecord.record || !tgdfRecord.record.data) return null;

    const { data } = tgdfRecord.record;
    const record = {
      id: data.identityHash,
    };

    // Extract all fields except standard ones
    Object.entries(data).forEach(([key, value]) => {
      if (!['identityHash', 'tokens', 'name', 'created'].includes(key)) {
        record[key] = fromTgdfBasic(value);
      }
    });

    // Add timestamp from created field
    record.timestamp = fromTgdfBasic(data.created);

    return record;
  }).filter(record => record !== null);
};
