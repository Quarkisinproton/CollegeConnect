package com.collegeconnect.navigation.service;

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
            return new RouteWithSnaps(first, null, null);
        }

        // Find nearest nodes for start and end
        com.collegeconnect.navigation.model.Node startNode = graph.findClosestNode(startLat, startLng);
        com.collegeconnect.navigation.model.Node endNode = graph.findClosestNode(endLat, endLng);
        
        if (startNode == null || endNode == null) {
            return new RouteWithSnaps(first, null, null);
        }

        // Try with both snapped
        double snappedStartLat = startNode.getLatitude();
        double snappedStartLng = startNode.getLongitude();
        double snappedEndLat = endNode.getLatitude();
        double snappedEndLng = endNode.getLongitude();

        Route second = defaultAlgo.findRoute(graph, snappedStartLat, snappedStartLng, snappedEndLat, snappedEndLng);
        
        if (!second.getPath().isEmpty()) {
            // Annotate algorithm to show snapping occurred
            String alg = second.getAlgorithm();
            try {
                java.lang.reflect.Field f = second.getClass().getDeclaredField("algorithm");
                f.setAccessible(true);
                f.set(second, alg + " (snapped)");
            } catch (Exception ignore) {}
            
            // Build snap info
            SnapPoint startSnap = new SnapPoint(startLat, startLng, snappedStartLat, snappedStartLng);
            SnapPoint endSnap = new SnapPoint(endLat, endLng, snappedEndLat, snappedEndLng);
            return new RouteWithSnaps(second, startSnap, endSnap);
        }
        
        return new RouteWithSnaps(second, null, null);
    }

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
