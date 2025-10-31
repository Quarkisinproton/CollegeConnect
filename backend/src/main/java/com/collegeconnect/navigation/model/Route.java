package com.collegeconnect.navigation.model;

import java.util.List;

/**
 * Represents a calculated navigation route
 */
public class Route {
    private final List<Node> path;
    private final double totalDistance; // in meters
    private final double estimatedDuration; // in seconds
    private final String algorithm; // "DIJKSTRA" or "ASTAR"
    
    public Route(List<Node> path, double totalDistance, double estimatedDuration, String algorithm) {
        this.path = path;
        this.totalDistance = totalDistance;
        this.estimatedDuration = estimatedDuration;
        this.algorithm = algorithm;
    }
    
    public List<Node> getPath() { return path; }
    public double getTotalDistance() { return totalDistance; }
    public double getEstimatedDuration() { return estimatedDuration; }
    public String getAlgorithm() { return algorithm; }
    
    public boolean isValid() {
        return path != null && !path.isEmpty();
    }
    
    @Override
    public String toString() {
        return "Route{" +
                "pathLength=" + (path != null ? path.size() : 0) +
                ", distance=" + String.format("%.2f", totalDistance) + "m" +
                ", duration=" + String.format("%.0f", estimatedDuration) + "s" +
                ", algorithm='" + algorithm + '\'' +
                '}';
    }
}
