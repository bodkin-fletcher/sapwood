/**
 * Export utilities for Sapwood - handles exporting node layouts to various formats
 */
import Papa from 'papaparse';
// jsPDF and JSZip are imported dynamically to avoid issues with SSR and to reduce initial bundle size

/**
 * Helper function to create an SVG representation of nodes and connections
 * @param {Array} nodes - The nodes to render
 * @param {Array} connections - The connections between nodes 
 * @param {Object} options - Layout options
 * @returns {SVGElement} SVG DOM element
 */
const createSvgElement = (nodes, connections, options = {}) => {
  const {
    paperSize = 'a4',
    orientation = 'landscape',
    template = 'default',
    nodeGroups = []
  } = options;
  
  // Define paper dimensions in pixels (assuming 96 DPI)
  const paperSizes = {
    'a4': { width: 794, height: 1123 }, // A4 in pixels at 96 DPI
    'letter': { width: 816, height: 1056 },
    'legal': { width: 816, height: 1344 },
    'a3': { width: 1123, height: 1587 }
  };
  
  // Get dimensions based on paper size and orientation
  let width = paperSizes[paperSize]?.width || 794;
  let height = paperSizes[paperSize]?.height || 1123;
  
  if (orientation === 'landscape') {
    [width, height] = [height, width];
  }
  
  // Create SVG element
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  
  // Add a white background
  const background = document.createElementNS(svgNS, "rect");
  background.setAttribute("width", "100%");
  background.setAttribute("height", "100%");
  background.setAttribute("fill", "white");
  svg.appendChild(background);
  
  // Create mapping of node groups for styling
  const nodeGroupsMap = {};
  nodeGroups.forEach(group => {
    group.nodes.forEach(nodeId => {
      nodeGroupsMap[nodeId] = {
        color: group.color,
        name: group.name
      };
    });
  });
  
  // Helper function to calculate node positions
  const calculateNodePositions = () => {
    // This is a simple layout algorithm
    // In a real implementation, this could be more sophisticated
    const margin = 50;
    const nodeWidth = 120;
    const nodeHeight = 60;
    const nodesPerRow = Math.floor((width - 2 * margin) / (nodeWidth + 20));
    
    return nodes.map((node, index) => {
      const row = Math.floor(index / nodesPerRow);
      const col = index % nodesPerRow;
      
      return {
        ...node,
        x: margin + col * (nodeWidth + 20) + nodeWidth / 2,
        y: margin + row * (nodeHeight + 40) + nodeHeight / 2,
        width: nodeWidth,
        height: nodeHeight
      };
    });
  };
  
  // Apply layout positions to nodes
  const positionedNodes = calculateNodePositions();
  
  // Create a map for quick node lookup
  const nodeMap = {};
  positionedNodes.forEach(node => {
    nodeMap[node.id] = node;
  });
  
  // Add groups first (if any)
  const groupElements = document.createElementNS(svgNS, "g");
  groupElements.setAttribute("class", "node-groups");
  
  nodeGroups.forEach(group => {
    if (group.nodes.length > 0) {
      // Calculate the bounding box for this group
      const groupNodes = group.nodes.map(id => nodeMap[id]).filter(Boolean);
      
      if (groupNodes.length) {
        // Calculate group bounds with padding
        const padding = 20;
        const minX = Math.min(...groupNodes.map(n => n.x - n.width/2)) - padding;
        const minY = Math.min(...groupNodes.map(n => n.y - n.height/2)) - padding;
        const maxX = Math.max(...groupNodes.map(n => n.x + n.width/2)) + padding;
        const maxY = Math.max(...groupNodes.map(n => n.y + n.height/2)) + padding;
        
        // Create group rectangle
        const groupRect = document.createElementNS(svgNS, "rect");
        groupRect.setAttribute("x", minX);
        groupRect.setAttribute("y", minY);
        groupRect.setAttribute("width", maxX - minX);
        groupRect.setAttribute("height", maxY - minY);
        groupRect.setAttribute("rx", "8");
        groupRect.setAttribute("ry", "8");
        groupRect.setAttribute("fill", group.color);
        groupRect.setAttribute("fill-opacity", "0.1");
        groupRect.setAttribute("stroke", group.color);
        groupRect.setAttribute("stroke-width", "2");
        groupElements.appendChild(groupRect);
        
        // Add group label
        const groupLabel = document.createElementNS(svgNS, "text");
        groupLabel.setAttribute("x", minX + 10);
        groupLabel.setAttribute("y", minY + 20);
        groupLabel.setAttribute("fill", group.color);
        groupLabel.setAttribute("font-family", "Arial, sans-serif");
        groupLabel.setAttribute("font-weight", "bold");
        groupLabel.setAttribute("font-size", "14");
        groupLabel.textContent = group.name;
        groupElements.appendChild(groupLabel);
      }
    }
  });
  
  svg.appendChild(groupElements);
  
  // Add connections
  const connectionElements = document.createElementNS(svgNS, "g");
  connectionElements.setAttribute("class", "connections");
  
  connections.forEach(connection => {
    const source = nodeMap[connection.source];
    const target = nodeMap[connection.target];
    
    if (source && target) {
      // Create line
      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", source.x);
      line.setAttribute("y1", source.y);
      line.setAttribute("x2", target.x);
      line.setAttribute("y2", target.y);
      line.setAttribute("stroke", "#666");
      line.setAttribute("stroke-width", "1.5");
      
      // Add arrow marker
      const markerId = `arrow-${connection.id}`;
      const defs = document.createElementNS(svgNS, "defs");
      const marker = document.createElementNS(svgNS, "marker");
      marker.setAttribute("id", markerId);
      marker.setAttribute("markerWidth", "10");
      marker.setAttribute("markerHeight", "7");
      marker.setAttribute("refX", "10");
      marker.setAttribute("refY", "3.5");
      marker.setAttribute("orient", "auto");
      
      const polygon = document.createElementNS(svgNS, "polygon");
      polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
      polygon.setAttribute("fill", "#666");
      
      marker.appendChild(polygon);
      defs.appendChild(marker);
      connectionElements.appendChild(defs);
      
      line.setAttribute("marker-end", `url(#${markerId})`);
      connectionElements.appendChild(line);
      
      // Add connection label if present
      if (connection.label) {
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        
        const text = document.createElementNS(svgNS, "text");
        text.setAttribute("x", midX);
        text.setAttribute("y", midY - 10);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "#333");
        text.setAttribute("font-family", "Arial, sans-serif");
        text.setAttribute("font-size", "12");
        text.setAttribute("background", "white");
        text.textContent = connection.label;
        
        // Add white background to text for better readability
        const textBg = document.createElementNS(svgNS, "rect");
        const bbox = text.getBBox ? text.getBBox() : { x: midX - 20, y: midY - 25, width: 40, height: 20 };
        textBg.setAttribute("x", bbox.x - 2);
        textBg.setAttribute("y", bbox.y - 2);
        textBg.setAttribute("width", bbox.width + 4);
        textBg.setAttribute("height", bbox.height + 4);
        textBg.setAttribute("fill", "white");
        textBg.setAttribute("fill-opacity", "0.8");
        
        connectionElements.appendChild(textBg);
        connectionElements.appendChild(text);
      }
    }
  });
  
  svg.appendChild(connectionElements);
  
  // Add nodes on top
  const nodeElements = document.createElementNS(svgNS, "g");
  nodeElements.setAttribute("class", "nodes");
  
  positionedNodes.forEach(node => {
    const group = document.createElementNS(svgNS, "g");
    group.setAttribute("class", "node");
    group.setAttribute("transform", `translate(${node.x - node.width/2},${node.y - node.height/2})`);
    
    // Node group color (if node belongs to a group)
    const groupInfo = nodeGroupsMap[node.id];
    const nodeColor = groupInfo?.color || "#1976d2";
    
    // Create node rectangle
    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("width", node.width);
    rect.setAttribute("height", node.height);
    rect.setAttribute("rx", "5");
    rect.setAttribute("ry", "5");
    rect.setAttribute("fill", "white");
    rect.setAttribute("stroke", nodeColor);
    rect.setAttribute("stroke-width", "2");
    group.appendChild(rect);
    
    // Add node name
    const nameText = document.createElementNS(svgNS, "text");
    nameText.setAttribute("x", node.width / 2);
    nameText.setAttribute("y", 25);
    nameText.setAttribute("text-anchor", "middle");
    nameText.setAttribute("fill", "#000");
    nameText.setAttribute("font-family", "Arial, sans-serif");
    nameText.setAttribute("font-weight", "bold");
    nameText.setAttribute("font-size", "14");
    nameText.textContent = node.name;
    group.appendChild(nameText);
    
    // Add node type if present
    if (node.type) {
      const typeText = document.createElementNS(svgNS, "text");
      typeText.setAttribute("x", node.width / 2);
      typeText.setAttribute("y", 45);
      typeText.setAttribute("text-anchor", "middle");
      typeText.setAttribute("fill", "#666");
      typeText.setAttribute("font-family", "Arial, sans-serif");
      typeText.setAttribute("font-size", "12");
      typeText.textContent = node.type;
      group.appendChild(typeText);
    }
    
    nodeElements.appendChild(group);
  });
  
  svg.appendChild(nodeElements);
  
  // Add title and metadata
  const title = document.createElementNS(svgNS, "title");
  title.textContent = "Sapwood Node Layout";
  svg.appendChild(title);
  
  // Add metadata about template
  const metadata = document.createElementNS(svgNS, "metadata");
  metadata.setAttribute("id", "sapwood-metadata");
  metadata.textContent = JSON.stringify({
    template,
    paperSize,
    orientation,
    createdAt: new Date().toISOString()
  });
  svg.appendChild(metadata);
  
  return svg;
};

/**
 * Export nodes and connections to SVG format
 * @param {Array} nodes - The nodes to export
 * @param {Array} connections - The connections between nodes
 * @param {Object} options - Export options
 */
export const exportToSvg = (nodes, connections, options = {}) => {
  const svg = createSvgElement(nodes, connections, options);
  
  // Serialize the SVG to a string
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);
  
  // Create a Blob with the SVG content
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  
  // Create a download link
  downloadFile(blob, 'sapwood-layout.svg');
};

/**
 * Export nodes and connections to PDF format
 * @param {Array} nodes - The nodes to export
 * @param {Array} connections - The connections between nodes
 * @param {Object} options - Export options
 */
export const exportToPdf = (nodes, connections, options = {}) => {
  // Import jsPDF dynamically to prevent issues with SSR
  import('jspdf').then(({ default: jsPDF }) => {
    const svg = createSvgElement(nodes, connections, options);
    
    // Get dimensions
    const width = parseInt(svg.getAttribute('width'));
    const height = parseInt(svg.getAttribute('height'));
    
    // Create PDF with correct orientation
    const orientation = options.orientation === 'landscape' ? 'l' : 'p';
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'px',
      format: options.paperSize || 'a4',
      hotfixes: ['px_scaling']
    });
    
    // Create an Image from SVG
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      // Calculate scaling to fit on PDF page
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const scale = Math.min(pdfWidth / width, pdfHeight / height);
      
      // Add SVG as image to the PDF
      pdf.addImage(
        img, 
        'SVG', 
        (pdfWidth - width * scale) / 2, // center horizontally
        (pdfHeight - height * scale) / 2, // center vertically
        width * scale, 
        height * scale
      );
      
      // Add metadata
      pdf.setProperties({
        title: 'Sapwood Node Layout',
        subject: 'Node connections diagram',
        creator: 'Sapwood',
        author: 'Sapwood System'
      });
      
      // Save the PDF
      pdf.save('sapwood-layout.pdf');
      
      // Cleanup
      URL.revokeObjectURL(url);
    };
    
    img.onerror = () => {
      console.error('Error loading SVG into image for PDF export');
      alert('Failed to generate PDF. Falling back to SVG export.');
      exportToSvg(nodes, connections, options);
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  }).catch(error => {
    console.error('Error loading jsPDF:', error);
    alert('Failed to load PDF library. Falling back to SVG export.');
    exportToSvg(nodes, connections, options);
  });
};

/**
 * Export nodes and connections to PNG format
 * @param {Array} nodes - The nodes to export
 * @param {Array} connections - The connections between nodes
 * @param {Object} options - Export options
 */
export const exportToPng = (nodes, connections, options = {}) => {
  const svg = createSvgElement(nodes, connections, options);
  
  // Serialize the SVG to a string
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);
  
  // Create a Blob with the SVG content
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);
  
  // Create an image element to load the SVG
  const img = new Image();
  img.onload = () => {
    // Create a canvas to render the image
    const canvas = document.createElement('canvas');
    canvas.width = svg.getAttribute('width');
    canvas.height = svg.getAttribute('height');
    
    // Draw the image on the canvas
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    
    // Convert canvas to PNG and download
    try {
      canvas.toBlob((blob) => {
        downloadFile(blob, 'sapwood-layout.png');
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      console.error('Error creating PNG:', err);
      alert('Failed to create PNG. Your browser may not support this feature.');
    }
  };
  
  img.onerror = () => {
    console.error('Error loading SVG into image');
    alert('Failed to generate PNG from SVG. Try using the SVG export instead.');
    URL.revokeObjectURL(url);
  };
  
  img.src = url;
};

/**
 * Export nodes and connections to JSON format
 * @param {Array} nodes - The nodes to export
 * @param {Array} connections - The connections between nodes
 * @param {Array} nodeGroups - The node grouping information
 */
export const exportToJson = (nodes, connections, nodeGroups = []) => {
  const data = {
    nodes,
    connections,
    nodeGroups,
    metadata: {
      version: '1.0',
      generator: 'Sapwood',
      exportDate: new Date().toISOString()
    }
  };
  
  // Create a Blob with the JSON content
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  
  // Create a download link
  downloadFile(blob, 'sapwood-data.json');
};

/**
 * Export nodes and connections to CSV format
 * @param {Array} nodes - The nodes to export
 * @param {Array} connections - The connections between nodes
 */
export const exportToCsv = (nodes, connections) => {
  // Create CSV for nodes
  const nodesCsv = Papa.unparse({
    fields: ['id', 'name', 'type', 'status', 'data'],
    data: nodes.map(node => ({
      id: node.id,
      name: node.name,
      type: node.type || '',
      status: node.status || '',
      data: JSON.stringify(node.data || {})
    }))
  });
  
  // Create CSV for connections
  const connectionsCsv = Papa.unparse({
    fields: ['id', 'source', 'target', 'label', 'type'],
    data: connections.map(connection => ({
      id: connection.id,
      source: connection.source,
      target: connection.target,
      label: connection.label || '',
      type: connection.type || ''
    }))
  });
  
  // Import JSZip dynamically
  import('jszip').then(({ default: JSZip }) => {
    // Create a new zip file
    const zip = new JSZip();
    
    // Add files to the zip
    zip.file('nodes.csv', nodesCsv);
    zip.file('connections.csv', connectionsCsv);
    
    // Add a readme file explaining the data structure
    const readme = `# Sapwood Export
This ZIP file contains data exported from Sapwood in CSV format.

## Files
- nodes.csv: Contains all node data
- connections.csv: Contains all connection data

## Data Format
### nodes.csv
- id: Unique identifier for the node
- name: Node name
- type: Node type
- status: Current node status
- data: Additional node data (JSON format)

### connections.csv
- id: Unique identifier for the connection
- source: ID of the source node
- target: ID of the target node
- label: Connection label
- type: Connection type

Generated: ${new Date().toISOString()}
`;
    zip.file('README.md', readme);
    
    // Generate zip file and trigger download
    zip.generateAsync({ type: 'blob' }).then(content => {
      downloadFile(content, 'sapwood-export.zip');
    });
  }).catch(error => {
    console.error('Error creating ZIP file:', error);
    
    // Fallback to downloading just the nodes CSV
    const blob = new Blob([nodesCsv], { type: 'text/csv' });
    downloadFile(blob, 'sapwood-nodes.csv');
    
    alert('Could not create ZIP file with all exports. Downloaded nodes CSV only.');
  });
};

/**
 * Helper function to initiate a file download
 * @param {Blob} blob - The file content as a Blob
 * @param {String} filename - The filename to use
 */
const downloadFile = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Append to body and trigger download
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};
