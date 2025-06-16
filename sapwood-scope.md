# Sapwood - Scope

## Description
Sapwood is a fullstack web application that provides a visual interface for managing, connecting, and monitoring nodes, which can be any external services or APIs. It enables users to create workflows by connecting nodes, visualize data flows, and generate printable layouts. The app is designed to be intuitive, modern, and efficient, offering a user-friendly experience for orchestrating complex operations.

## Technology Stack
- **Backend**: Node.js v22.11.0, Fastify v4.28.1  
- **Frontend**: React, Vite, Material-UI  
- **Package Manager**: Yarn 4.5.2  
- **Additional Libraries**: To be determined (e.g., for SVG manipulation, data visualization)

The app adheres to the standards outlined in `fletchers-decree`, ensuring compatibility and performance.

## Style
The application will feature a modern, intuitive design with a left-side menu bar for navigation, drawing inspiration from contemporary web applications like X (formerly Twitter). The interface will be clean and slick, prioritizing usability and efficiency.

## Key Features
- **Node Display Page**:  
  - Dynamic SVG-based display with hexagon-shaped nodes  
  - Drag-and-drop functionality for creating, moving, and connecting nodes  
  - Action panel on the right displaying selected node details (host, port, settings)  
  - Color-coded status indicators (e.g., red for error, green for success) based on heartbeat or last action  
- **Data Wrangling Page**:  
  - Visualization of inputs and outputs from runs (e.g., tables, charts, logs)  
  - Intelligent handling of common data formats:  
    - JSON: Render collections as tables, with editing capabilities for identical fields  
    - CSV: Display and edit tabular data  
    - YAML: Structured display and editing  
    - Markdown: Render and edit text with formatting  
  - Editing, cleaning, and coercing data into the needed form  
  - Bulk editing and data validation features  
  - Transformation functions to convert data between formats or perform calculations on data fields  
- **Layout Display Page**:  
  - SVG-based printable layouts, each sized for paper  
  - Export options: print, SVG file, or PDF  
- **Settings Page**:  
  - Edit application settings (e.g., heartbeat interval)  
  - Save settings to a YAML configuration file  
- **Heartbeat Mechanism**:  
  - Periodic status checks for all nodes (default interval: 10 seconds, configurable)  
- **API Integration**:  
  - Robust system to call node APIs, process, and format data between nodes  
  - Display data at any point in the workflow  
- **Data Storage**:  
  - Store inputs and outputs for each run for debugging and analysis  
  - Initially in memory, with a transition to file-based storage (JSON files)  
- **Raw Data Viewing and Editing**:  
  - Interface to inspect and modify primitive data (nodes, connections, runs)  

## Core Entities
- **Node**: Represents an external API or service with configuration details (host, port, settings).  
- **Connection**: Defines a data flow between two nodes (output to input).  
- **Graph**: A collection of nodes and connections forming a workflow.  
- **Run**: An execution of a graph, recording inputs and outputs for each node.  

## Additional Considerations
- **Authentication**: Simple local username/password authentication, extensible for future systems.  
- **Configuration**: YAML file for settings, loaded on startup and editable via the UI.  
- **Performance**: Optimized for handling large graphs with many nodes and connections efficiently.  
- **Offline Capabilities**: Graceful handling of offline scenarios with cached data and configurations, though full offline functionality may be limited by external node dependencies.  

Sapwood aims to deliver a solid, clean, and intuitive experience, providing powerful tools for node management and data visualization while adhering to public standards like `fletchers-decree`.