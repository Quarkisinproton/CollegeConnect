package com.collegeconnect.navigation.model;

/**
 * Represents a geographical coordinate (latitude, longitude)
 * Used as a node in the navigation graph
 */
public class Node {
    private final String id;
    private final double latitude;
    private final double longitude;
    private String name; // Optional: e.g., "Main Building", "Library"
    
    // For pathfinding algorithms
    private double gScore; // Cost from start node (Dijkstra/A*)
    private double fScore; // gScore + heuristic (A* only)
    private Node parent;   // For path reconstruction
    private boolean visited;
    
    public Node(String id, double latitude, double longitude) {
        this.id = id;
        this.latitude = latitude;
        this.longitude = longitude;
        this.gScore = Double.MAX_VALUE;
        this.fScore = Double.MAX_VALUE;
        this.visited = false;
    }
    
    public Node(String id, double latitude, double longitude, String name) {
        this(id, latitude, longitude);
        this.name = name;
    }
    
    // Reset for new pathfinding run
    public void reset() {
        this.gScore = Double.MAX_VALUE;
        this.fScore = Double.MAX_VALUE;
        this.parent = null;
        this.visited = false;
    }
    
    // Getters and setters
    public String getId() { return id; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public double getGScore() { return gScore; }
    public void setGScore(double gScore) { this.gScore = gScore; }
    
    public double getFScore() { return fScore; }
    public void setFScore(double fScore) { this.fScore = fScore; }
    
    public Node getParent() { return parent; }
    public void setParent(Node parent) { this.parent = parent; }
    
    public boolean isVisited() { return visited; }
    public void setVisited(boolean visited) { this.visited = visited; }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Node node = (Node) o;
        return id.equals(node.id);
    }
    
    @Override
    public int hashCode() {
        return id.hashCode();
    }
    
    @Override
    public String toString() {
        return "Node{" +
                "id='" + id + '\'' +
                ", lat=" + latitude +
                ", lng=" + longitude +
                (name != null ? ", name='" + name + '\'' : "") +
                '}';
    }
}
