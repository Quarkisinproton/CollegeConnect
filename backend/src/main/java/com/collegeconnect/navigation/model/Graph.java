package com.collegeconnect.navigation.model;

import java.util.*;

/**
 * Graph data structure representing the navigation map
 * Uses adjacency list for efficient neighbor lookups
 */
public class Graph {
    private final Map<String, Node> nodes;
    private final Map<String, List<Edge>> adjacencyList;
    
    public Graph() {
        this.nodes = new HashMap<>();
        this.adjacencyList = new HashMap<>();
    }
    
    /**
     * Add a node to the graph
     */
    public void addNode(Node node) {
        nodes.put(node.getId(), node);
        adjacencyList.putIfAbsent(node.getId(), new ArrayList<>());
    }
    
    /**
     * Add an edge between two nodes
     * If bidirectional, adds edges in both directions
     */
    public void addEdge(Edge edge) {
        String fromId = edge.getFrom().getId();
        String toId = edge.getTo().getId();
        
        // Ensure nodes exist
        addNode(edge.getFrom());
        addNode(edge.getTo());
        
        // Add edge from -> to
        adjacencyList.get(fromId).add(edge);
        
        // If bidirectional, add reverse edge
        if (edge.isBidirectional()) {
            Edge reverseEdge = new Edge(edge.getTo(), edge.getFrom(), edge.getWeight(), false);
            adjacencyList.get(toId).add(reverseEdge);
        }
    }
    
    /**
     * Get all neighbors of a node
     */
    public List<Edge> getNeighbors(Node node) {
        return adjacencyList.getOrDefault(node.getId(), new ArrayList<>());
    }
    
    /**
     * Get a node by ID
     */
    public Node getNode(String id) {
        return nodes.get(id);
    }
    
    /**
     * Find the closest node to given coordinates
     */
    public Node findClosestNode(double latitude, double longitude) {
        Node closest = null;
        double minDistance = Double.MAX_VALUE;
        
        for (Node node : nodes.values()) {
            double distance = calculateDistance(latitude, longitude, node.getLatitude(), node.getLongitude());
            if (distance < minDistance) {
                minDistance = distance;
                closest = node;
            }
        }
        
        return closest;
    }
    
    /**
     * Calculate straight-line distance between two coordinates (Haversine formula)
     * Returns distance in meters
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000; // Earth's radius in meters
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
    
    /**
     * Reset all nodes for a new pathfinding run
     */
    public void resetNodes() {
        for (Node node : nodes.values()) {
            node.reset();
        }
    }
    
    /**
     * Get all nodes
     */
    public Collection<Node> getAllNodes() {
        return nodes.values();
    }
    
    /**
     * Get total number of nodes
     */
    public int getNodeCount() {
        return nodes.size();
    }
    
    /**
     * Get total number of edges
     */
    public int getEdgeCount() {
        return adjacencyList.values().stream()
                .mapToInt(List::size)
                .sum();
    }
    
    @Override
    public String toString() {
        return "Graph{" +
                "nodes=" + nodes.size() +
                ", edges=" + getEdgeCount() +
                '}';
    }
}
