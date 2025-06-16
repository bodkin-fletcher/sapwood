import { createContext, useState, useContext, useEffect } from 'react';
import { nodeService } from '../services/api';

const NodeContext = createContext();

export const NodeProvider = ({ children }) => {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
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

  const addConnection = async (source, target) => {
    try {
      const newConnection = await nodeService.createConnection(source, target);
      setConnections([...connections, newConnection]);
      return newConnection;
    } catch (error) {
      console.error('Error creating connection:', error);
      setError('Failed to create connection. Please try again later.');
      return null;
    }
  };

  const deleteConnection = async (connectionId) => {
    try {
      await nodeService.deleteConnection(connectionId);
      setConnections(connections.filter(conn => conn.id !== connectionId));
      return true;
    } catch (error) {
      console.error('Error deleting connection:', error);
      setError('Failed to delete connection. Please try again later.');
      return false;
    }
  };

  const value = {
    nodes,
    connections,
    selectedNode,
    loading,
    error,
    setSelectedNode,
    fetchNodes,
    addNode,
    updateNode,
    deleteNode,
    addConnection,
    deleteConnection
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
