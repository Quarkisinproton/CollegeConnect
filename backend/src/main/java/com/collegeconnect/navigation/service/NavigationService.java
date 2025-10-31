package com.collegeconnect.navigation.service;
import java.util.List;
import java.util.ArrayList;
import java.util.Comparator;

import com.collegeconnect.navigation.algorithm.AStarAlgorithm;
import com.collegeconnect.navigation.algorithm.BidirectionalAStarAlgorithm;
import com.collegeconnect.navigation.algorithm.PathfindingAlgorithm;
import com.collegeconnect.navigation.model.Graph;
import com.collegeconnect.navigation.model.Route;
import com.collegeconnect.navigation.util.OSMGraphLoader;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.util.Locale;

@Service
public class NavigationService {

    private Graph graph;
    private double minLat, minLng, maxLat, maxLng;

    private final PathfindingAlgorithm astarAlgo = new AStarAlgorithm();
    private final PathfindingAlgorithm bidirectionalAlgo = new BidirectionalAStarAlgorithm();
    private final PathfindingAlgorithm defaultAlgo = bidirectionalAlgo; // Bidirectional is faster

    @PostConstruct
    public void init() {
        try {
            ClassPathResource resource = new ClassPathResource("map/map.osm");
            try (InputStream in = resource.getInputStream()) {
                OSMGraphLoader loader = new OSMGraphLoader();
                OSMGraphLoader.Result res = loader.loadFromResource(in);
                this.graph = res.graph;
                this.minLat = res.minLat;
                this.minLng = res.minLng;
                this.maxLat = res.maxLat;
                this.maxLng = res.maxLng;
                
                System.out.println("✅ Campus navigation graph loaded:");
                System.out.println("   Nodes: " + graph.getNodeCount());
                System.out.println("   Edges: " + graph.getEdgeCount());
                System.out.println("   Bounds: [" + String.format("%.6f", minLat) + ", " + 
                                   String.format("%.6f", minLng) + "] to [" + 
                                   String.format("%.6f", maxLat) + ", " + 
                                   String.format("%.6f", maxLng) + "]");
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to load campus OSM graph from resources", e);
        }
    }

    public Bounds getBounds() {
        return new Bounds(minLat, minLng, maxLat, maxLng);
    }

    public boolean isInsideCampus(double lat, double lng) {
        // Simple bounding-box check with a small margin (~20m)
        double latMargin = 0.0002;
        double lngMargin = 0.0002;
        return lat >= (minLat - latMargin) && lat <= (maxLat + latMargin)
                && lng >= (minLng - lngMargin) && lng <= (maxLng + lngMargin);
    }

    public Route route(double startLat, double startLng, double endLat, double endLng, String algorithm) {
        PathfindingAlgorithm algo = selectAlgorithm(algorithm);
        return algo.findRoute(graph, startLat, startLng, endLat, endLng);
    }

    /**
     * Attempt routing with smart snapping: if no direct path, snap start and/or end
     * to nearest graph nodes and retry. Returns RouteWithSnaps containing the route
     * plus metadata about which points were snapped.
     */
    public RouteWithSnaps routeWithSmartSnapping(double startLat, double startLng, double endLat, double endLng) {
        // First attempt without snapping
        Route first = defaultAlgo.findRoute(graph, startLat, startLng, endLat, endLng);
        if (!first.getPath().isEmpty()) {
            System.out.println("[SmartSnap] Direct route found, no snapping needed.");
            return new RouteWithSnaps(first, null, null);
        }

        // Smart snapping with retry for isolated nodes
        int maxTries = 5;
        List<com.collegeconnect.navigation.model.Node> startCandidates = getClosestNodes(graph, startLat, startLng, maxTries);
        List<com.collegeconnect.navigation.model.Node> endCandidates = getClosestNodes(graph, endLat, endLng, maxTries);

        com.collegeconnect.navigation.model.Node startNode = null;
        com.collegeconnect.navigation.model.Node endNode = null;
        for (com.collegeconnect.navigation.model.Node candidate : startCandidates) {
            int neighbors = graph.getNeighbors(candidate).size();
            System.out.println("[SmartSnap] Start candidate: " + candidate + " neighbors=" + neighbors);
            if (neighbors > 1) { startNode = candidate; break; }
        }
        if (startNode == null && !startCandidates.isEmpty()) startNode = startCandidates.get(0);

        for (com.collegeconnect.navigation.model.Node candidate : endCandidates) {
            int neighbors = graph.getNeighbors(candidate).size();
            System.out.println("[SmartSnap] End candidate: " + candidate + " neighbors=" + neighbors);
            if (neighbors > 1) { endNode = candidate; break; }
        }
        if (endNode == null && !endCandidates.isEmpty()) endNode = endCandidates.get(0);

        if (startNode == null || endNode == null) {
            System.out.println("[SmartSnap] Could not find valid snapped nodes.");
            return new RouteWithSnaps(first, null, null);
        }

        double snappedStartLat = startNode.getLatitude();
        double snappedStartLng = startNode.getLongitude();
        double snappedEndLat = endNode.getLatitude();
        double snappedEndLng = endNode.getLongitude();

        System.out.println("[SmartSnap] Using snapped start: " + startNode + ", snapped end: " + endNode);

        Route second = defaultAlgo.findRoute(graph, snappedStartLat, snappedStartLng, snappedEndLat, snappedEndLng);

        if (!second.getPath().isEmpty()) {
            String alg = second.getAlgorithm();
            try {
                java.lang.reflect.Field f = second.getClass().getDeclaredField("algorithm");
                f.setAccessible(true);
                f.set(second, alg + " (snapped)");
            } catch (Exception ignore) {}

            SnapPoint startSnap = new SnapPoint(startLat, startLng, snappedStartLat, snappedStartLng);
            SnapPoint endSnap = new SnapPoint(endLat, endLng, snappedEndLat, snappedEndLng);
            return new RouteWithSnaps(second, startSnap, endSnap);
        }

        System.out.println("[SmartSnap] No route found after snapping. Start node neighbors=" + graph.getNeighbors(startNode).size() + ", End node neighbors=" + graph.getNeighbors(endNode).size());
        return new RouteWithSnaps(second, null, null);
    }

    // Helper: get N closest nodes to a lat/lng (optimized - fixed-size max-heap)
    private List<com.collegeconnect.navigation.model.Node> getClosestNodes(Graph graph, double lat, double lng, int n) {
        // Use a max-heap of size N to keep only the N closest nodes (O(N log N) instead of O(M log M) where M=1803)
        java.util.PriorityQueue<NodeDistance> maxHeap = new java.util.PriorityQueue<>(n + 1, 
            (a, b) -> Double.compare(b.distance, a.distance)); // Max-heap: largest distance at top
        
        for (com.collegeconnect.navigation.model.Node node : graph.getAllNodes()) {
            // Use squared distance to avoid expensive sqrt
            double dx = node.getLatitude() - lat;
            double dy = node.getLongitude() - lng;
            double distSq = dx * dx + dy * dy;
            
            maxHeap.offer(new NodeDistance(node, distSq));
            if (maxHeap.size() > n) {
                maxHeap.poll(); // Remove farthest node, keep only N closest
            }
        }
        
        // Convert to list sorted by distance (closest first)
        List<NodeDistance> sorted = new ArrayList<>(maxHeap);
        sorted.sort(Comparator.comparingDouble(nd -> nd.distance));
        
        List<com.collegeconnect.navigation.model.Node> result = new ArrayList<>(n);
        for (NodeDistance nd : sorted) {
            result.add(nd.node);
        }
        return result;
    }
    
    private record NodeDistance(com.collegeconnect.navigation.model.Node node, double distance) {}

    public record SnapPoint(double originalLat, double originalLng, double snappedLat, double snappedLng) {}
    public record RouteWithSnaps(Route route, SnapPoint startSnap, SnapPoint endSnap) {}
    /**
     * Run both A* and BiA* algorithms to compare performance.
     * Returns both routes with their metrics for side-by-side comparison.
     */
    public RouteComparison routeComparison(double startLat, double startLng, double endLat, double endLng) {
        Route astarRoute = astarAlgo.findRoute(graph, startLat, startLng, endLat, endLng);
        Route biaRoute = bidirectionalAlgo.findRoute(graph, startLat, startLng, endLat, endLng);
        return new RouteComparison(astarRoute, biaRoute);
    }

    private PathfindingAlgorithm selectAlgorithm(String name) {
        if (name == null) return defaultAlgo;
        String key = name.trim().toUpperCase(Locale.ROOT);
        switch (key) {
            case "FTD": // Faster Than Dijkstra - Bidirectional A*
            case "BIDIRECTIONAL":
            case "BIA":
                return bidirectionalAlgo;
            case "ASTAR":
            case "A*":
                return astarAlgo;
            default:
                return defaultAlgo;
        }
    }

    public record Bounds(double minLat, double minLng, double maxLat, double maxLng) {}
    public record RouteComparison(Route astar, Route bidirectional) {}
}
