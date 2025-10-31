package com.collegeconnect.controllers;
import com.collegeconnect.navigation.model.Route;
import com.collegeconnect.navigation.service.NavigationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/navigation")
public class NavigationController {

    private final NavigationService navigationService;

    public NavigationController(NavigationService navigationService) {
        this.navigationService = navigationService;
    }

    @GetMapping("/bounds")
    public NavigationService.Bounds getBounds() {
        return navigationService.getBounds();
    }

    public record LatLng(double lat, double lng) {}
    public record RouteRequest(LatLng start, LatLng end, String algorithm) {}
    public record RoutePoint(double lat, double lng) {}
    public record SnapSegment(RoutePoint original, RoutePoint snapped) {}
    public record RouteResponse(
        double distance, 
        double duration, 
        String algorithm, 
        List<RoutePoint> path,
        String metrics,  // Algorithm performance info
        SnapSegment startSnap,  // null if not snapped
        SnapSegment endSnap     // null if not snapped
    ) {}

    @PostMapping("/route")
    public ResponseEntity<?> route(@RequestBody RouteRequest request) {
        if (request == null || request.start() == null || request.end() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid request body"));
        }

        // Outside-campus guard
        if (!navigationService.isInsideCampus(request.start().lat(), request.start().lng())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "error", "Navigation is only available within campus bounds",
                            "code", "OUTSIDE_CAMPUS"
                    ));
        }

        // Prefer BiA* and include smart snapping (both start and end)
        NavigationService.RouteWithSnaps result = navigationService.routeWithSmartSnapping(
                request.start().lat(), request.start().lng(),
                request.end().lat(), request.end().lng()
        );

        Route route = result.route();
        
        if (route.getPath().isEmpty()) {
            // After snap retry still no path — ask user to try again instead of drawing a straight line
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "error", "No route found from your location. Try moving a little and recalculate.",
                            "code", "ROUTE_UNAVAILABLE_TRY_AGAIN"
                    ));
        }

        List<RoutePoint> pts = route.getPath().stream()
                .map(n -> new RoutePoint(n.getLatitude(), n.getLongitude()))
                .toList();
        
        // Extract metrics from algorithm name (format: "BiA* (123 nodes, 45ms)")
        String metrics = route.getAlgorithm().contains("(") 
            ? route.getAlgorithm().substring(route.getAlgorithm().indexOf("("))
            : "";
        String algoName = route.getAlgorithm().contains("(")
            ? route.getAlgorithm().substring(0, route.getAlgorithm().indexOf("(")).trim()
            : route.getAlgorithm();
        
        // Build snap segment info if snapping occurred
        SnapSegment startSnap = null;
        if (result.startSnap() != null) {
            startSnap = new SnapSegment(
                new RoutePoint(result.startSnap().originalLat(), result.startSnap().originalLng()),
                new RoutePoint(result.startSnap().snappedLat(), result.startSnap().snappedLng())
            );
        }
        
        SnapSegment endSnap = null;
        if (result.endSnap() != null) {
            endSnap = new SnapSegment(
                new RoutePoint(result.endSnap().originalLat(), result.endSnap().originalLng()),
                new RoutePoint(result.endSnap().snappedLat(), result.endSnap().snappedLng())
            );
        }
            
        return ResponseEntity.ok(new RouteResponse(
            route.getTotalDistance(), 
            route.getEstimatedDuration(), 
            algoName, 
            pts,
            metrics,
            startSnap,
            endSnap
        ));
    }

    @PostMapping("/compare")
    public ResponseEntity<?> compareAlgorithms(@RequestBody RouteRequest request) {
        if (request == null || request.start() == null || request.end() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid request body"));
        }

        // Outside-campus guard
        if (!navigationService.isInsideCampus(request.start().lat(), request.start().lng())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "error", "Navigation is only available within campus bounds",
                            "code", "OUTSIDE_CAMPUS"
                    ));
        }

        NavigationService.RouteComparison comparison = navigationService.routeComparison(
                request.start().lat(), request.start().lng(),
                request.end().lat(), request.end().lng()
        );

        // If both routes failed, return fallback
        if (comparison.astar().getPath().isEmpty() && comparison.bidirectional().getPath().isEmpty()) {
            double distance = haversine(request.start().lat(), request.start().lng(), 
                                       request.end().lat(), request.end().lng());
            double walkingSpeed = 1.4; // m/s
            double duration = distance / walkingSpeed;
            RouteResponse fallback = new RouteResponse(
                distance,
                duration,
                "Direct",
                List.of(
                    new RoutePoint(request.start().lat(), request.start().lng()),
                    new RoutePoint(request.end().lat(), request.end().lng())
                ),
                " (fallback)",
                null,
                null
            );
            return ResponseEntity.ok(new AlgorithmComparison(fallback, fallback, "Both algorithms failed"));
        }

        // Build response for A*
        RouteResponse astarResponse = buildRouteResponse(comparison.astar());
        
        // Build response for BiA*
        RouteResponse biaResponse = buildRouteResponse(comparison.bidirectional());

        // Determine which is faster
        String winner = determineWinner(comparison.astar(), comparison.bidirectional());

        return ResponseEntity.ok(new AlgorithmComparison(astarResponse, biaResponse, winner));
    }

    private RouteResponse buildRouteResponse(Route route) {
        if (route.getPath().isEmpty()) {
            return new RouteResponse(0, 0, "None", List.of(), "(no path found)", null, null);
        }

        List<RoutePoint> pts = route.getPath().stream()
                .map(n -> new RoutePoint(n.getLatitude(), n.getLongitude()))
                .toList();
        
        String metrics = route.getAlgorithm().contains("(") 
            ? route.getAlgorithm().substring(route.getAlgorithm().indexOf("("))
            : "";
        String algoName = route.getAlgorithm().contains("(")
            ? route.getAlgorithm().substring(0, route.getAlgorithm().indexOf("(")).trim()
            : route.getAlgorithm();
            
        return new RouteResponse(
            route.getTotalDistance(), 
            route.getEstimatedDuration(), 
            algoName, 
            pts,
            metrics,
            null,  // comparison endpoint doesn't use snapping
            null
        );
    }

    private String determineWinner(Route astar, Route bia) {
        // Parse computation time from algorithm string (format: "A* (123 nodes, 45ms)")
        long astarTime = extractTimeMs(astar.getAlgorithm());
        long biaTime = extractTimeMs(bia.getAlgorithm());
        
        if (astarTime == 0 && biaTime == 0) {
            return "Unable to determine (missing metrics)";
        }
        
        if (astarTime < biaTime) {
            double speedup = (double) biaTime / astarTime;
            return String.format("A* was faster by %.1fx", speedup);
        } else if (biaTime < astarTime) {
            double speedup = (double) astarTime / biaTime;
            return String.format("BiA* was faster by %.1fx", speedup);
        } else {
            return "Tie (same computation time)";
        }
    }

    private long extractTimeMs(String algorithmString) {
        // Extract milliseconds from format: "A* (123 nodes, 45ms)"
        if (!algorithmString.contains("ms)")) return 0;
        
        try {
            int msIndex = algorithmString.indexOf("ms)");
            int commaIndex = algorithmString.lastIndexOf(",", msIndex);
            if (commaIndex == -1) return 0;
            
            String timeStr = algorithmString.substring(commaIndex + 1, msIndex).trim();
            return Long.parseLong(timeStr);
        } catch (Exception e) {
            return 0;
        }
    }

    public record AlgorithmComparison(RouteResponse astar, RouteResponse bidirectional, String winner) {}

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
}
