package com.collegeconnect.navigation.model;

/**
 * Represents an edge (road/path) between two nodes in the navigation graph
 */
public class Edge {
    private final Node from;
    private final Node to;
    private final double weight; // Distance in meters or travel time in seconds
    private final boolean bidirectional; // Can travel both ways
    
    public Edge(Node from, Node to, double weight) {
        this(from, to, weight, true);
    }
    
    public Edge(Node from, Node to, double weight, boolean bidirectional) {
        this.from = from;
        this.to = to;
        this.weight = weight;
        this.bidirectional = bidirectional;
    }
    
    // Getters
    public Node getFrom() { return from; }
    public Node getTo() { return to; }
    public double getWeight() { return weight; }
    public boolean isBidirectional() { return bidirectional; }
    
    @Override
    public String toString() {
        return "Edge{" +
                "from=" + from.getId() +
                ", to=" + to.getId() +
                ", weight=" + weight +
                ", bidirectional=" + bidirectional +
                '}';
    }
}
