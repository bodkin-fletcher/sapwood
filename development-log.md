# Sapwood Development Log

## Design Principles and Decisions

### Overview
Sapwood is designed as a node-based visual interface for API interactions, allowing users to create visual representations of distributed systems, manage API connections, and test endpoints in a collaborative environment.

This document tracks key design decisions and architectural choices made during development.

## UI Design

### Node Representation

#### Hexagonal Design
- **Decision**: Hexagons were chosen as the primary node shape.
- **Rationale**: Hexagons provide better spatial efficiency compared to circles and better visual distinction compared to rectangles. The six sides also naturally accommodate our connection point design.
- **Implementation**: Rotated the hexagons to have flat sides on the vertical edges (pointed ends up/down), which creates a more visually appealing layout and better suits our input/output connection paradigm.

#### Connection Points
- **Design**: Each node features 3 input connection points (left side) and 3 output connection points (right side).
- **Visibility**: Connection points are only visible when:
  1. The node is hovered
  2. The node is selected
  3. A connection exists at that specific point
- **Rationale**: This approach reduces visual clutter while still allowing users to understand the connection capabilities of each node.

### Connection Management

#### Connection Creation
- **Implementation**: Users can drag from an output point on one node to an input point on another node to create connections.
- **Visual Feedback**: During connection creation, a preview line is shown to indicate the potential connection path.
- **Connection Types**: Different connection types (data, control, reference) have different visual representations.

#### Connection Point System
- **Decision**: Implemented specific connection points rather than allowing connections from any part of the node perimeter.
- **Rationale**: This creates clearer visual semantics about what connects to what, and how data/control flow moves through the system.
- **Technical Implementation**: Connection indices are stored in the connection data structure, allowing the system to remember which specific points are connected.

## Node Data Structure

### API URL Components
- **Implementation**: Nodes now include:
  - `protocol`: The protocol (http, https, ws, wss)
  - `host`: The hostname or IP address
  - `port`: Optional port number
  - `path`: The API endpoint path
- **Rationale**: This provides more flexibility than just host/port, allowing for complete API URL construction.

### Node Status and API Execution
- **Feature**: Nodes can execute their configured API endpoints and display the response.
- **Implementation**: 
  1. API execution state is tracked and displayed in the UI
  2. Response data is formatted and shown in the node details panel
  3. Node status is updated based on execution results
- **Use Cases**: Allows users to validate API endpoints, test integrations, and monitor system health.

## UX Improvements

### Canvas Interactions

#### Zoom Behavior
- **Enhancement**: Modified zoom functionality to center on cursor position rather than the top-left corner.
- **Rationale**: This creates a more intuitive zoom interaction, similar to industry-standard design tools.
- **Implementation**: Recalculates the pan position based on the cursor location and zoom delta.

#### Scroll Handling
- **Issue**: Canvas zooming previously caused page scrolling, disrupting the user experience.
- **Fix**: Implemented proper event handling to prevent default scrolling behavior when zooming the canvas.
- **Technical Detail**: Uses `event.preventDefault()` for wheel events, but only within the canvas area.

#### Selection System
- **Implementation**: Users can select nodes in multiple ways:
  1. Direct click to select individual nodes
  2. Shift+click for multi-select
  3. Drag selection box to select multiple nodes
- **Enhancement**: Added visual feedback for different selection states.

## Technical Architecture

### State Management
- **Approach**: Using React Context for global state management of nodes and connections.
- **Rationale**: Provides a clean API for components to access and modify node data without prop drilling.

### API Integration
- **Backend Communication**: RESTful API for node and connection CRUD operations.
- **Simulated Responses**: For development and demo purposes, simulated API responses are generated based on node type.

### Performance Considerations
- **Rendering Optimization**: Connection points are conditionally rendered to reduce the number of SVG elements.
- **State Updates**: Careful management of state updates to prevent unnecessary re-renders.

## Future Enhancements

### Planned Features
1. **Node Templates**: Pre-configured node types for common API patterns
2. **Advanced Routing**: More sophisticated connection patterns with conditional paths
3. **Data Transformation**: Visual tools for transforming data between nodes
4. **Authentication Management**: Integrated auth token handling for secured APIs
5. **Execution History**: Logging and history of API executions for audit purposes

### Technical Debt & Improvements
1. **Testing**: Comprehensive test suite for core components
2. **Keyboard Navigation**: Enhanced keyboard shortcuts for power users
3. **Accessibility**: Improved screen reader support and keyboard navigation
4. **Documentation**: Inline code documentation and updated user guides

## Conclusion

Sapwood's design aims to balance visual simplicity with powerful functionality, allowing users to represent and interact with distributed systems in an intuitive way. The UI decisions prioritize clarity and usability, while the architectural choices focus on flexibility and maintainability.
