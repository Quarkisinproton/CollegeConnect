package com.collegeconnect.navigation.algorithm;

import com.collegeconnect.navigation.model.Graph;
import com.collegeconnect.navigation.model.Node;
import com.collegeconnect.navigation.model.Route;

import java.util.*;

/**
 * A* pathfinding using straight-line distance as heuristic (Haversine).
 * Generally faster than Dijkstra on geographic graphs.
 */
public class AStarAlgorithm implements PathfindingAlgorithm {

    @Override
    public Route findRoute(Graph graph, double startLat, double startLng, double endLat, double endLng) {
        graph.resetNodes();

        Node start = graph.findClosestNode(startLat, startLng);
        Node goal = graph.findClosestNode(endLat, endLng);
        if (start == null || goal == null) return new Route(Collections.emptyList(), 0, 0, getName());

        Map<Node, Double> gScore = new HashMap<>();
        Map<Node, Node> cameFrom = new HashMap<>();

        Comparator<Node> byF = Comparator.comparingDouble(n -> n.getFScore());
        PriorityQueue<Node> open = new PriorityQueue<>(byF);

        for (Node n : graph.getAllNodes()) {
            n.setGScore(Double.MAX_VALUE);
            n.setFScore(Double.MAX_VALUE);
        }
        start.setGScore(0);
        start.setFScore(heuristic(start, goal));
        gScore.put(start, 0.0);
        open.add(start);

        while (!open.isEmpty()) {
            Node current = open.poll();
            if (current.equals(goal)) {
                return buildRoute(cameFrom, current, start, goal);
            }
            current.setVisited(true);

            for (var edge : graph.getNeighbors(current)) {
                Node neighbor = edge.getTo();
                if (neighbor.isVisited()) continue;

                double tentative = current.getGScore() + edge.getWeight();
                if (tentative < neighbor.getGScore()) {
                    cameFrom.put(neighbor, current);
                    neighbor.setGScore(tentative);
                    neighbor.setFScore(tentative + heuristic(neighbor, goal));
                    // reinsert to update priority
                    open.remove(neighbor);
                    open.add(neighbor);
                }
            }
        }

        return new Route(Collections.emptyList(), 0, 0, getName());
    }

    private double heuristic(Node a, Node b) {
        return haversine(a.getLatitude(), a.getLongitude(), b.getLatitude(), b.getLongitude());
    }

    private Route buildRoute(Map<Node, Node> cameFrom, Node current, Node start, Node goal) {
        List<Node> path = new ArrayList<>();
        path.add(current);
        while (cameFrom.containsKey(current)) {
            current = cameFrom.get(current);
            path.add(current);
        }
        Collections.reverse(path);
        double distance = pathDistance(path);
        double walkingSpeed = 1.4; // m/s
        double duration = distance / walkingSpeed;
        return new Route(path, distance, duration, getName());
    }

    private double pathDistance(List<Node> path) {
        double sum = 0;
        for (int i = 0; i < path.size() - 1; i++) {
            sum += haversine(path.get(i).getLatitude(), path.get(i).getLongitude(),
                    path.get(i + 1).getLatitude(), path.get(i + 1).getLongitude());
        }
        return sum;
    }

    // Haversine in meters
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
    public String getName() { return "ASTAR"; }
}
