# Sapwood

Integrating diverse nodes for streamlined automation and workflow management

## Overview

Sapwood is a fullstack web application that provides a visual interface for managing, connecting, and monitoring nodes, which can be any external services or APIs. It enables users to create workflows by connecting nodes, visualize data flows, and generate printable layouts. Built with modern technologies according to the standards outlined in Fletcher's Decree.

## Features

### Sprint 1 - MVP Foundation
- **Node Creation & Management**: Create, edit, and delete nodes with a visual interface
- **Node Visualization**: Display nodes as hexagons in an interactive canvas
- **Node Connections**: Create connections between nodes
- **Status Monitoring**: Basic status indicators for nodes
- **Settings Management**: Configure application settings including theme and heartbeat interval
- **Dark Mode**: Full dark mode support with a clean interface inspired by X (Twitter)

### Sprint 2 - Connection & Visualization Enhancement
- **Interactive Canvas**: Pan, zoom, and drag-and-drop features for node management
- **Connection Visualization**: Enhanced SVG paths with labels and types
- **Connection Management**: Create, edit, and delete connections with detailed properties
- **Multi-select**: Select multiple nodes with Shift+click or selection box
- **Node Focus System**: Right panel for detailed node information and editing
- **Status Monitoring**: Live heartbeat checks with visual indicators
- **Context Menus**: Right-click menus for nodes and connections

## Upcoming Features

- **Data Wrangling**: Process and transform data between nodes (Sprint 3)
- **Layout Generation**: Create SVG-based printable layouts (Sprint 5)
- **Advanced Node Management**: Enhanced monitoring and API integration (Sprint 4)

## Technology Stack

- **Backend**: Node.js v22.11.0, Fastify v4.28.1
- **Frontend**: React, Vite, Material-UI
- **Package Manager**: Yarn 4.5.2

## Getting Started

### Prerequisites

- Node.js v22.11.0
- Yarn v4.5.2

### Installation

No installation required! This project uses Yarn Zero-Installs, so all dependencies are already cached in the repository.

Simply clone the repository:

```bash
git clone <repository-url>
cd sapwood
```

### Development

Start both frontend and backend development servers:

```bash
yarn dev
```

- Frontend will be available at: http://localhost:3000
- Backend API will be available at: http://localhost:8080

### Building for Production

```bash
yarn build
```

## Project Structure

```
sapwood/
├── packages/
│   ├── frontend/  # React application using Vite and Material-UI
│   └── backend/   # Fastify server providing the API
├── .yarn/        # Yarn PnP cache for Zero-Installs
└── sapwood-scope.md  # Detailed project specification
```

## Documentation

- [Project Scope & Features](./sapwood-scope.md)
- [Development Roadmap](./roadmap.md) - Step-by-step plan for project completion

## Using the Application

### Working with Nodes
- Create nodes using the "Create Node" button
- Drag nodes to position them on the canvas
- Select a node to view and edit its details in the right panel
- Use Space + drag to pan around the canvas
- Use mouse wheel to zoom in and out

### Working with Connections
- Hold Alt/Ctrl + drag from one node to another to create a connection
- Click on a connection to view and edit its details
- Use the "Connect" button to create connections via dialog
- Right-click on connections for additional options

### Multi-selection
- Shift + click to select multiple nodes
- Click and drag on empty canvas to create a selection box
- Multi-selected nodes can be moved together
