# Sapwood Node API Specification

This document outlines the API interfaces that Sapwood expects when communicating with external nodes. These specifications define the standard endpoints, request formats, and response structures that node developers should implement to ensure compatibility with the Sapwood system.

## API Formats

All APIs must support the Tagged Data Format (TGDF) structure for request and response data. This format ensures consistent data handling across the Sapwood ecosystem. Each response is structured as a self-contained TGDF item with an appropriate type tag.

## Core Endpoints

### 1. Root API

The root API endpoint provides a list of available routes offered by the node. This helps with API discovery and allows clients to determine what capabilities the node supports.

#### Endpoint

```
GET {node_base_url}/
```

#### Request

Simple GET request with no body.

#### Response

```json
{
  "api_routes": {
    "version": "v0.1.0",
    "integrity": {
      "hashes": {
        "sha256": "ab..."
      }
    },
    "data": {
      "nodeId": {
        "flexname": "gateway_node_1"
      },
      "nodeName": {
        "text": "API Gateway"
      },
      "timestamp": {
        "instant": "2025-06-18T10:15:30.123Z"
      },
      "routes": [
        {
          "path": {
            "text": "/"
          },
          "methods": {
            "text": "GET"
          },
          "description": {
            "text": "API route listing"
          }
        },
        {
          "path": {
            "text": "/heartbeat"
          },
          "methods": {
            "text": "GET"
          },
          "description": {
            "text": "Node heartbeat check"
          }
        },
        {
          "path": {
            "text": "/status"
          },
          "methods": {
            "text": "GET"
          },
          "description": {
            "text": "Node detailed status"
          }
        }
      ]
    }
  }
}
```

### 2. Heartbeat API

The heartbeat API is used to check if a node is online and responsive. This is the most fundamental API that every node must implement, providing minimal information to verify node availability.

#### Endpoint

```
GET {node_base_url}/heartbeat
```

#### Request

Simple GET request with no body.

Optional query parameters:
- `timeout`: Maximum time (in ms) to wait for a response (default: 5000)

#### Response

```json
{
  "node_heartbeat": {
    "version": "v0.1.0",
    "integrity": {
      "hashes": {
        "sha256": "ab..."
      }
    },
    "data": {
      "nodeId": {
        "flexname": "gateway_node_1"
      },
      "nodeName": {
        "text": "API Gateway"
      },
      "timestamp": {
        "instant": "2025-06-18T10:15:30.123Z"
      }
    }
  }
}
```

### 2. Status API

The status API provides more detailed information about the current state of the node, including health metrics and operational statistics.

#### Endpoint

```
GET {node_base_url}/status
```

#### Request

Simple GET request with no body.

#### Response

```json
{
  "node_status": {
    "version": "v0.1.0",
    "integrity": {
      "hashes": {
        "sha256": "ab..."
      }
    },
    "data": {
      "nodeId": {
        "flexname": "gateway_node_1"
      },
      "nodeName": {
        "text": "API Gateway"
      },
      "timestamp": {
        "instant": "2025-06-18T10:15:30.123Z"
      },
      "status": {
        "text": "active"  // "active", "inactive", "warning", or "pending"
      },
      "uptime": {
        "number": "86400"  // Seconds since node started
      },
      "memory": {
        "total": {
          "number": "1024"
        },
        "used": {
          "number": "512"
        }
      },
      "cpu": {
        "usage": {
          "number": "45.2"  // Percentage
        }
      },
      "connections": {
        "count": {
          "number": "12"
        },
        "active": {
          "number": "5"
        }
      },
      "tasks": {
        "pending": {
          "number": "3"
        },
        "processing": {
          "number": "1"
        },
        "completed": {
          "number": "42"
        },
        "failed": {
          "number": "2"
        }
      }
    }
  }
}
```


```

## Status Codes and Their Meanings

Sapwood recognizes the following status indicators for nodes:

| Status | Description |
|--------|-------------|
| `active` | Node is online, healthy, and operating normally |
| `inactive` | Node is offline or not responding |
| `warning` | Node is online but experiencing issues (e.g., high resource usage, slow responses) |
| `pending` | Node is in a transitional state (e.g., starting up, reconfiguring) |

## Node Types

Sapwood supports the following node types, each with its own specific behaviors and capabilities:

| Type | Description |
|------|-------------|
| `gateway` | Entry/exit point for API requests |
| `service` | Provides business logic or application functionality |
| `storage` | Manages data storage and retrieval |
| `transform` | Processes and transforms data |
| `integration` | Connects to external systems |
| `analytics` | Performs data analysis |
| `ui` | Provides user interface components |

## TGDF Format

All API responses adhere to the Tagged Data Format (TGDF), which provides a structured, self-contained approach to organizing data. In TGDF, each piece of information is encapsulated in a JSON object with a type identifier that describes a real-world concept it represents.

### Structure of a TGDF Item

Each TGDF item (the fundamental unit) consists of a type-specific key and its associated content:

```json
{
  "node_status": {           // The type-specific key (e.g., "node_status", "node_heartbeat")
    "version": "v0.1.0",     // Version of this item type structure
    "integrity": {           // Contains cryptographic hashes and optional stamps 
      "hashes": {
        "sha256": "..."
      }
    },
    "data": {                // The actual content data
      // Fields specific to this type
      "nodeId": {
        "flexname": "gateway_node_1"
      },
      // Additional fields...
    }
  }
}
```

### Basic TGDF Types

TGDF supports these basic types for representing data elements:

- `text`: Standard text strings (`{ "text": "Any actual text" }`)
- `number`: Numeric values as strings (`{ "number": "123" }`)  
- `yesno`: Boolean equivalent, represented as "yes" or "no" (`{ "yesno": "yes" }`)
- `date`: Date values in ISO 8601 format (`{ "date": "2025-06-18" }`)
- `instant`: Timestamp values in ISO 8601 format (`{ "instant": "2025-06-18T10:15:30.123Z" }`)
- `flexname`: Restricted names using only lowercase letters, numbers, and underscores (`{ "flexname": "restricted_name_like_this" }`)
- `email`: Valid email addresses (`{ "email": "valid_email@example.com" }`)

## Implementation Notes

1. **Heartbeat vs. Status**:
   - The heartbeat API is designed to be lightweight and fast, providing just enough information to determine if a node is responsive.
   - The status API provides more detailed health metrics and is typically called less frequently than heartbeat.

2. **Error Handling**:
   - All APIs should return appropriate HTTP status codes (200 for success, 4xx for client errors, 5xx for server errors).
   - Error responses should include a descriptive message in the TGDF format.

3. **Authentication**:
   - Nodes may implement authentication via API keys or other mechanisms.
   - Authentication details should be included in the node configuration.

4. **Node Configuration**:
   - Nodes should respect the configured values for host, port, and path when exposing their APIs.
   - Default configuration can be overridden at the node level.

5. **Performance Considerations**:
   - Heartbeat responses should be fast (< 100ms ideally).
   - Status responses may take longer but should still return within reasonable timeframes (< 1s).
