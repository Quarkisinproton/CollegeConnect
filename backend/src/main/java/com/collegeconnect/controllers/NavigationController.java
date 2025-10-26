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
    public record RouteResponse(
        double distance, 
        double duration, 
        String algorithm, 
        List<RoutePoint> path,
        String metrics  // Algorithm performance info
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

        Route route = navigationService.route(
                request.start().lat(), request.start().lng(),
                request.end().lat(), request.end().lng(),
                request.algorithm()
        );

        if (route.getPath().isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "No path found between the selected points"));
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
            
        return ResponseEntity.ok(new RouteResponse(
            route.getTotalDistance(), 
            route.getEstimatedDuration(), 
            algoName, 
            pts,
            metrics
        ));
    }
}
