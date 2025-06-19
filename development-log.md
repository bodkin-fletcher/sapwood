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

## Sprint 3 - Data Wrangling Implementation (June 17, 2025)

### Overview
In Sprint 3, we've implemented the data wrangling capabilities as outlined in the roadmap. This allows users to view, edit, transform, and validate data flowing between nodes in the system. The implementation includes both frontend components and backend services to support these features.

### Key Features Implemented

1. **Data Visualization**:
   - JSON viewer with collapsible tree structure
   - Tabular data viewer for structured data
   - CSV export capabilities

2. **Data Editing**:
   - Monaco-based code editor for JSON data
   - Validation of edited data
   - Save functionality for modified data

3. **Data Transformation Tools**:
   - Filter operations for data records
   - Map functions to transform data structures
   - Sort and group by operations
   - Aggregation functions (sum, average, etc.)
   - Custom JavaScript transformation support

4. **Data Validation**:
   - Schema validation for data consistency
   - Data type checking for field values
   - Required fields validation
   - Value range checks for numeric fields
   - Format validation for emails, dates, etc.

5. **File-Based JSON Persistence**:
   - Backend storage of node and connection data
   - Save/load functionality for data states
   - Persistent validation results

6. **Tagged Data Format (TGDF) Implementation**:
   - Created comprehensive TGDF utilities for both backend and frontend
   - Implemented conversion functions for nodes, connections, and data records
   - Standardized data representation across the entire application
   - Added support for TGDF integrity and versioning

### Technical Implementation

#### Frontend
- Created DataWranglingPage component as the main container
- Implemented specialized components:
  - DataViewer for various data visualization formats
  - DataEditor with Monaco editor integration
  - DataTransformer with various transformation options
  - DataValidator with validation rules and result display
- Added dataApi service for communication with backend
- Implemented TGDF utility service with conversion logic for all data types

#### Backend
- Created data.js routes file with endpoints for:
  - Data flow snapshot retrieval
  - Node and connection data operations
  - Data transformation processing
  - Validation services
  - CSV export functionality
- Implemented file-based JSON persistence in the data directory
- Created TGDF utility module for consistent data serialization

#### TGDF Integration Details

The Tagged Data Format (TGDF) implementation required several key components:

1. **Data Type Conversion**:
   - Basic type conversion for text, numbers, dates, etc.
   - Specialized handling for complex types
   - Automatic type detection for user data

2. **Integrity & Versioning**:
   - SHA-256 hash generation for data integrity
   - Version tracking for data format evolution
   - Consistent naming and identification

3. **API Layer Updates**:
   - Modified all API services to convert to/from TGDF
   - Updated API endpoints to expect and return TGDF-formatted data
   - Ensured backward compatibility for existing interfaces

4. **UI Integration**:
   - Updated Data Wrangling components to work with TGDF data
   - Modified data display to properly render TGDF fields
   - Enhanced editors to maintain TGDF consistency

### Sprint Completion (June 17, 2025)
We have successfully completed Sprint 3 with the implementation of TGDF across the entire application. Key accomplishments:

1. **Complete TGDF Implementation**:
   - Implemented TGDF conversion for nodes, connections, and data records
   - Added validation functions for TGDF format compliance
   - Updated all API endpoints to use TGDF as the canonical data format
   - Preserved backward compatibility with non-TGDF interfaces

2. **Enhanced Data Services**:
   - Added TGDF view in the DataViewer component
   - Updated data transformation to properly handle TGDF format
   - Enhanced validation to include TGDF schema validation
   - Improved error handling for data operations

3. **Full API Integration**:
   - All backend routes now use TGDF for data storage and transformation
   - Frontend API services properly convert to/from TGDF
   - Data integrity is maintained across all operations

### Next Steps
- Enhance transformation capabilities with more operations
- Add visualization capabilities for different data formats
- Implement real-time updates for data changes
- Integrate with external data sources
- Extend the TGDF implementation with additional data types and validation rules
- Add more comprehensive TGDF schema validation
- Implement TGDF-based data import/export with external systems

The data wrangling features provide a solid foundation for users to work with data flowing through nodes, making Sapwood more functional and valuable as an integration tool.

## Sprint 4: API Integration & Enhanced Monitoring

### Monitoring System Enhancements

#### Retry Mechanism
- **Feature**: Implemented a configurable retry system for heartbeats and API calls.
- **Implementation**: Both heartbeat checks and API executions now support retry attempts with configurable delay.
- **Configuration**: Users can set the number of retry attempts and delay between retries in the settings.

#### Real-time Status Updates
- **Feature**: Added a monitoring dashboard with real-time node status updates.
- **Implementation**: Created a dedicated monitoring page that shows node health metrics and connectivity status.
- **Technical Implementation**: Status updates can be configured to refresh at specified intervals.

#### Node Metrics
- **Enhancement**: Added comprehensive metrics tracking for each node.
- **Implementation**:
  1. Track uptime percentage, average latency, and failure rates
  2. Store historical heartbeat and API call data
  3. Display metrics in both node details panel and monitoring dashboard

#### Connection Monitoring
- **Feature**: Enhanced monitoring to include connection status.
- **Implementation**: The monitoring dashboard shows the overall system health, including the status of connections.

### API Integration Enhancements

#### Robust Error Handling
- **Feature**: Implemented more sophisticated error handling for API calls.
- **Implementation**: API calls now track attempts, success rates, and specific error messages.
- **User Experience**: Error messages are more descriptive and helpful for troubleshooting.

#### API Call History
- **Feature**: Added history tracking for API calls.
- **Implementation**: Each node maintains a configurable history of recent API calls.
- **UI Integration**: History can be viewed in both the node details panel and monitoring dashboard.

### Settings and Configuration

#### Enhanced Settings Panel
- **Feature**: Expanded the settings panel with more configuration options.
- **Implementation**: Added controls for retry attempts, monitoring frequency, history size, etc.
- **User Experience**: Settings are organized into logical groups with appropriate controls.

#### Per-Node Configuration
- **Feature**: Added ability to view detailed metrics for each node.
- **Implementation**: Node details panel now shows node-specific metrics.

Sapwood's monitoring capabilities are now significantly enhanced, providing users with deeper insights into their system's health and performance. The retry mechanisms make the system more resilient to temporary failures, and the comprehensive metrics help identify patterns and potential issues.

## Sprint 5: Layout & Export Capabilities

### Overview
Sprint 5 focused on implementing layout and export capabilities, allowing users to visually arrange nodes and export their layouts in various formats. This enables better organization, documentation, and sharing of node arrangements.

### Layout Editor Features

#### Interactive Node Arrangement
- **Feature**: Implemented a comprehensive layout editor with interactive node positioning.
- **Implementation**: Created an SVG-based canvas with drag-and-drop functionality for node arrangement.
- **User Experience**: Seamless node dragging with position saving.

#### Grid System & Snapping
- **Feature**: Added a configurable grid system with snapping functionality.
- **Implementation**: Positions are automatically aligned to the nearest grid point when grid is enabled.
- **Technical Details**: Grid size is configurable and is calculated based on the zoom level.

#### Layout Templates
- **Feature**: Created multiple layout algorithms for automatic node arrangement:
  - **Grid Layout**: Simple row/column arrangement
  - **Circular Layout**: Nodes arranged in a circle
  - **Hierarchical Layout**: Tree-like structure based on connections
  - **Force-Directed Layout**: Physics-based arrangement for organic layouts
- **Implementation**: Each template includes a specialized algorithm for calculating optimal node positions.

#### Node Grouping
- **Feature**: Implemented the ability to create logical groups of nodes.
- **UI**: Groups are visually represented with a colored background and label.
- **Management**: Groups can be created, edited, and deleted through a dedicated dialog.
- **Applications**: Helps organize large node arrangements by functional area or purpose.

### Export Capabilities

#### Multiple Export Formats
- **Feature**: Implemented export functionality in various formats:
  - **SVG**: Vector graphics export with full fidelity
  - **PDF**: Document export using jsPDF with proper scaling and orientation
  - **PNG**: Raster image export with background and proper resolution
  - **JSON**: Complete data structure export with node and connection information
  - **CSV**: Tabular data export packaged in a ZIP file
- **Technical Implementation**: Used specialized libraries for each format (jsPDF, JSZip, PapaParse)

#### Print & Preview Support
- **Feature**: Added a dedicated preview mode for layouts.
- **Implementation**: Preview shows the layout exactly as it will appear when exported or printed.
- **Paper Support**: Implemented standard paper sizes (A4, Letter, Legal, A3) and orientations.

#### Export Controls
- **Feature**: Added a comprehensive export toolbar with format options.
- **Implementation**: Each export format has specific options and settings.
- **User Experience**: Simple one-click export after selecting format and options.

### Technical Implementation

#### Dynamic Library Loading
- **Approach**: Used dynamic imports for large libraries (jsPDF, JSZip).
- **Rationale**: Improves initial load performance by only loading export libraries when needed.

#### SVG Rendering Engine
- **Feature**: Created a sophisticated SVG generator for layout rendering.
- **Implementation**: Handles node placement, connections, groups, and visual styling.
- **Technical Details**: Supports various paper sizes and orientations with proper scaling.

#### Export Error Handling
- **Feature**: Implemented robust error handling for export operations.
- **Implementation**: Added fallback mechanisms when primary export methods fail.
- **User Experience**: Meaningful error messages with suggested alternatives.

### Sprint 5 Completion
We have successfully completed all planned layout and export capabilities for Sprint 5. The implementation provides a solid foundation for users to visually organize their node arrangements and share them in various formats.

### Next Steps
- Enhance force-directed layout with a more sophisticated physics simulation
- Add more customization options for templates and exports
- Implement template saving and sharing features
- Collect user feedback on export quality and layout usability

## Conclusion

Sapwood's design aims to balance visual simplicity with powerful functionality, allowing users to represent and interact with distributed systems in an intuitive way. The UI decisions prioritize clarity and usability, while the architectural choices focus on flexibility and maintainability.
