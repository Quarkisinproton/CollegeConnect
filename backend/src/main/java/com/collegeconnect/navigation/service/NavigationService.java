package com.collegeconnect.navigation.service;

import com.collegeconnect.navigation.algorithm.AStarAlgorithm;
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

    private final PathfindingAlgorithm defaultAlgo = new AStarAlgorithm(); // Placeholder for 'faster than dijkstra'

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

    private PathfindingAlgorithm selectAlgorithm(String name) {
        if (name == null) return defaultAlgo;
        String key = name.trim().toUpperCase(Locale.ROOT);
        switch (key) {
            case "FTD": // Faster Than Dijkstra (from PDF) – currently mapped to A*
            case "ASTAR":
                return defaultAlgo;
            // case "DIJKSTRA": return new DijkstraAlgorithm(); // if needed later
            default:
                return defaultAlgo;
        }
    }

    public record Bounds(double minLat, double minLng, double maxLat, double maxLng) {}
}
