package com.collegeconnect.navigation.algorithm;

import com.collegeconnect.navigation.model.Graph;
import com.collegeconnect.navigation.model.Route;

public interface PathfindingAlgorithm {
    Route findRoute(Graph graph, double startLat, double startLng, double endLat, double endLng);
    String getName();
}
