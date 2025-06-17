import { createContext, useState, useContext, useEffect } from 'react';
import { nodeService } from '../services/api';

// Create and export the context
export const NodeContext = createContext();

export const NodeProvider = ({ children }) => {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch initial nodes data
    fetchNodes();
    fetchConnections();
  }, []);

  const fetchNodes = async () => {
    setLoading(true);
    try {
      const fetchedNodes = await nodeService.getAllNodes();
      setNodes(fetchedNodes || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching nodes:', error);
      setError('Failed to fetch nodes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const fetchedConnections = await nodeService.getAllConnections();
      setConnections(fetchedConnections || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
      // We don't set an error state here to avoid disrupting the UI
    }
  };

  const addNode = async (node) => {
    setLoading(true);
    try {
      const newNode = await nodeService.createNode(node);
      setNodes([...nodes, newNode]);
      return newNode;
    } catch (error) {
      console.error('Error adding node:', error);
      setError('Failed to add node. Please try again later.');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const updateNode = async (id, updates) => {
    setLoading(true);
    try {
      const updatedNode = await nodeService.updateNode(id, updates);
      
      // Update local state
      const updatedNodes = nodes.map(node => 
        node.id === id ? updatedNode : node
      );
      setNodes(updatedNodes);
      
      // Update selectedNode if it's the one being edited
      if (selectedNode && selectedNode.id === id) {
        setSelectedNode(updatedNode);
      }
      return true;
    } catch (error) {
      console.error('Error updating node:', error);
      setError('Failed to update node. Please try again later.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteNode = async (id) => {
    setLoading(true);
    try {
      await nodeService.deleteNode(id);
      
      // Update local state
      setNodes(nodes.filter(node => node.id !== id));
      
      // Clear selectedNode if it's the one being deleted
      if (selectedNode && selectedNode.id === id) {
        setSelectedNode(null);
      }
      
      // We don't need to manually filter connections as the backend will handle that
      // Just refresh the connections list
      await fetchConnections();
      
      return true;
    } catch (error) {
      console.error('Error deleting node:', error);
      setError('Failed to delete node. Please try again later.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const executeNodeApi = async (id) => {
    setLoading(true);
    try {
      const result = await nodeService.executeNodeApi(id);
      
      // Update node status if the call was successful
      if (result && result.success) {
        const nodeToUpdate = nodes.find(n => n.id === id);
        if (nodeToUpdate) {
          await updateNode(id, { 
            status: 'active',
            lastApiExecution: new Date().toISOString()
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error executing node API:', error);
      setError('Failed to execute node API. Please try again later.');
      return {
        success: false,
        error: error.message || 'An error occurred'
      };
    } finally {
      setLoading(false);
    }
  };

  const addConnection = async (source, target, options = {}) => {
    try {
      const newConnection = await nodeService.createConnection(source, target, options);
      setConnections([...connections, newConnection]);
      return newConnection;
    } catch (error) {
      console.error('Error creating connection:', error);
      setError('Failed to create connection. Please try again later.');
      return null;
    }
  };

  const updateConnection = async (id, updates) => {
    try {
      const updatedConnection = await nodeService.updateConnection(id, updates);
      
      // Update local state
      const updatedConnections = connections.map(conn => 
        conn.id === id ? updatedConnection : conn
      );
      setConnections(updatedConnections);
      
      // Update selectedConnection if it's the one being edited
      if (selectedConnection && selectedConnection.id === id) {
        setSelectedConnection(updatedConnection);
      }
      return updatedConnection;
    } catch (error) {
      console.error('Error updating connection:', error);
      setError('Failed to update connection. Please try again later.');
      return null;
    }
  };

  const deleteConnection = async (connectionId) => {
    try {
      await nodeService.deleteConnection(connectionId);
      setConnections(connections.filter(conn => conn.id !== connectionId));
      
      // Clear selectedConnection if it's the one being deleted
      if (selectedConnection && selectedConnection.id === connectionId) {
        setSelectedConnection(null);
      }
      return true;
    } catch (error) {
      console.error('Error deleting connection:', error);
      setError('Failed to delete connection. Please try again later.');
      return false;
    }
  };

  const getConnectionById = (id) => {
    return connections.find(conn => conn.id === id);
  };

  const getConnectionsBetweenNodes = (sourceId, targetId) => {
    return connections.filter(conn => 
      conn.source === sourceId && conn.target === targetId
    );
  };

  const value = {
    nodes,
    connections,
    selectedNode,
    selectedConnection,
    loading,
    error,
    setSelectedNode,
    setSelectedConnection,
    fetchNodes,
    fetchConnections,
    addNode,
    updateNode,
    deleteNode,
    executeNodeApi,
    addConnection,
    updateConnection,
    deleteConnection,
    getConnectionById,
    getConnectionsBetweenNodes
  };

  return <NodeContext.Provider value={value}>{children}</NodeContext.Provider>;
};

export const useNodes = () => {
  const context = useContext(NodeContext);
  if (!context) {
    throw new Error('useNodes must be used within a NodeProvider');
  }
  return context;
};
