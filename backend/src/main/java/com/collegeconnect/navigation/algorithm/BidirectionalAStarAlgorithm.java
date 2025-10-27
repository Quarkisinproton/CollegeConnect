package com.collegeconnect.navigation.algorithm;

import com.collegeconnect.navigation.model.Graph;
import com.collegeconnect.navigation.model.Node;
import com.collegeconnect.navigation.model.Route;

import java.util.*;

/**
 * Bidirectional A* - searches from both start and goal simultaneously.
 * Typically 2x faster than unidirectional A* for long paths.
 * This is a common "faster than Dijkstra" optimization used in navigation systems.
 */
public class BidirectionalAStarAlgorithm implements PathfindingAlgorithm {

    private int nodesExplored = 0;
    private long computeTimeMs = 0;

    @Override
    public Route findRoute(Graph graph, double startLat, double startLng, double endLat, double endLng) {
        long startTime = System.currentTimeMillis();
        nodesExplored = 0;
        graph.resetNodes();

        Node start = graph.findClosestNode(startLat, startLng);
        Node goal = graph.findClosestNode(endLat, endLng);
        
            System.out.println("[BiA*] Start: (" + startLat + "," + startLng + ") → closest node: " + 
                (start != null ? start.getId() + " at (" + start.getLatitude() + "," + start.getLongitude() + ")" : "NULL"));
            System.out.println("[BiA*] Goal: (" + endLat + "," + endLng + ") → closest node: " + 
                (goal != null ? goal.getId() + " at (" + goal.getLatitude() + "," + goal.getLongitude() + ")" : "NULL"));
            if (start != null) {
                System.out.println("[BiA*] Start node has " + graph.getNeighbors(start).size() + " neighbors");
            }
            if (goal != null) {
                System.out.println("[BiA*] Goal node has " + graph.getNeighbors(goal).size() + " neighbors");
            }
        
        if (start == null || goal == null) {
            computeTimeMs = System.currentTimeMillis() - startTime;
            return createEmptyRoute();
        }

        if (start.equals(goal)) {
            computeTimeMs = System.currentTimeMillis() - startTime;
            return new Route(Collections.singletonList(start), 0, 0, getName());
        }

        // Forward search (from start)
        Map<Node, Double> gScoreForward = new HashMap<>();
        Map<Node, Node> cameFromForward = new HashMap<>();
        PriorityQueue<NodeEntry> openForward = new PriorityQueue<>(Comparator.comparingDouble(e -> e.fScore));
        Set<Node> closedForward = new HashSet<>();

        // Backward search (from goal)
        Map<Node, Double> gScoreBackward = new HashMap<>();
        Map<Node, Node> cameFromBackward = new HashMap<>();
        PriorityQueue<NodeEntry> openBackward = new PriorityQueue<>(Comparator.comparingDouble(e -> e.fScore));
        Set<Node> closedBackward = new HashSet<>();

        // Initialize
        gScoreForward.put(start, 0.0);
        openForward.add(new NodeEntry(start, 0.0, heuristic(start, goal)));

        gScoreBackward.put(goal, 0.0);
        openBackward.add(new NodeEntry(goal, 0.0, heuristic(goal, start)));

        double bestPathCost = Double.MAX_VALUE;
        Node meetingPoint = null;

        // Alternate between forward and backward searches
        while (!openForward.isEmpty() && !openBackward.isEmpty()) {
            
            // Forward step
            if (!openForward.isEmpty()) {
                NodeEntry current = openForward.poll();
                nodesExplored++;
                
                if (current.fScore >= bestPathCost) {
                    // Prune: this path can't be better
                    continue;
                }

                if (closedForward.contains(current.node)) continue;
                closedForward.add(current.node);

                // Check if backward search has reached this node
                if (closedBackward.contains(current.node)) {
                    double pathCost = gScoreForward.get(current.node) + gScoreBackward.get(current.node);
                    if (pathCost < bestPathCost) {
                        bestPathCost = pathCost;
                        meetingPoint = current.node;
                    }
                }

                // Expand neighbors
                for (var edge : graph.getNeighbors(current.node)) {
                    Node neighbor = edge.getTo();
                    if (closedForward.contains(neighbor)) continue;

                    double tentativeG = gScoreForward.get(current.node) + edge.getWeight();
                    if (tentativeG < gScoreForward.getOrDefault(neighbor, Double.MAX_VALUE)) {
                        gScoreForward.put(neighbor, tentativeG);
                        cameFromForward.put(neighbor, current.node);
                        double f = tentativeG + heuristic(neighbor, goal);
                        openForward.add(new NodeEntry(neighbor, tentativeG, f));
                    }
                }
            }

            // Backward step
            if (!openBackward.isEmpty()) {
                NodeEntry current = openBackward.poll();
                nodesExplored++;

                if (current.fScore >= bestPathCost) {
                    continue;
                }

                if (closedBackward.contains(current.node)) continue;
                closedBackward.add(current.node);

                // Check if forward search has reached this node
                if (closedForward.contains(current.node)) {
                    double pathCost = gScoreForward.get(current.node) + gScoreBackward.get(current.node);
                    if (pathCost < bestPathCost) {
                        bestPathCost = pathCost;
                        meetingPoint = current.node;
                    }
                }

                // Expand neighbors (backward = reverse edges)
                for (var edge : graph.getNeighbors(current.node)) {
                    Node neighbor = edge.getTo();
                    if (closedBackward.contains(neighbor)) continue;

                    double tentativeG = gScoreBackward.get(current.node) + edge.getWeight();
                    if (tentativeG < gScoreBackward.getOrDefault(neighbor, Double.MAX_VALUE)) {
                        gScoreBackward.put(neighbor, tentativeG);
                        cameFromBackward.put(neighbor, current.node);
                        double f = tentativeG + heuristic(neighbor, start);
                        openBackward.add(new NodeEntry(neighbor, tentativeG, f));
                    }
                }
            }

            // Early termination: if both searches meet
            if (meetingPoint != null && 
                (openForward.isEmpty() || openBackward.isEmpty() ||
                 (openForward.peek().fScore + openBackward.peek().fScore >= bestPathCost))) {
                break;
            }
        }

        computeTimeMs = System.currentTimeMillis() - startTime;

        if (meetingPoint == null) {
            return createEmptyRoute();
        }

        // Reconstruct path through meeting point
        return buildRoute(cameFromForward, cameFromBackward, meetingPoint, start, goal, bestPathCost);
    }

    private Route buildRoute(Map<Node, Node> cameFromForward, Map<Node, Node> cameFromBackward,
                            Node meetingPoint, Node start, Node goal, double distance) {
        // Build forward path (start -> meeting point)
        List<Node> forwardPath = new ArrayList<>();
        Node current = meetingPoint;
        while (current != null) {
            forwardPath.add(current);
            current = cameFromForward.get(current);
        }
        Collections.reverse(forwardPath);

        // Build backward path (meeting point -> goal)
        current = cameFromBackward.get(meetingPoint);
        while (current != null) {
            forwardPath.add(current);
            current = cameFromBackward.get(current);
        }

        double walkingSpeed = 1.4; // m/s
        double duration = distance / walkingSpeed;
        return new Route(forwardPath, distance, duration, getName() + " (" + nodesExplored + " nodes, " + computeTimeMs + "ms)");
    }

    private Route createEmptyRoute() {
        return new Route(Collections.emptyList(), 0, 0, getName() + " (no path, " + computeTimeMs + "ms)");
    }

    private double heuristic(Node a, Node b) {
        return haversine(a.getLatitude(), a.getLongitude(), b.getLatitude(), b.getLongitude());
    }

    private static double haversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000; // meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    @Override
    public String getName() { return "BiA*"; }

    private static class NodeEntry {
        final Node node;
        final double gScore;
        final double fScore;

        NodeEntry(Node node, double gScore, double fScore) {
            this.node = node;
            this.gScore = gScore;
            this.fScore = fScore;
        }
    }
}
