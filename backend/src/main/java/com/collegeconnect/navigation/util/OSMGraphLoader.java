package com.collegeconnect.navigation.util;

import com.collegeconnect.navigation.model.Edge;
import com.collegeconnect.navigation.model.Graph;
import com.collegeconnect.navigation.model.Node;

import javax.xml.stream.XMLEventReader;
import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.events.Attribute;
import javax.xml.stream.events.StartElement;
import javax.xml.stream.events.XMLEvent;
import java.io.InputStream;
import java.util.*;

/**
 * Minimal OSM (XML) loader for building a pedestrian graph from OSM data.
 * Parses nodes and ways and creates bidirectional edges for walkable ways.
 */
public class OSMGraphLoader {

    // Exclude only fast/inaccessible roads; accept everything else for maximum campus connectivity
    private static final Set<String> EXCLUDED_HIGHWAYS = new HashSet<>(Arrays.asList(
            "motorway", "motorway_link", "trunk", "trunk_link"
    ));    public static class Result {
        public final Graph graph;
        public final double minLat, minLng, maxLat, maxLng;

        public Result(Graph graph, double minLat, double minLng, double maxLat, double maxLng) {
            this.graph = graph;
            this.minLat = minLat;
            this.minLng = minLng;
            this.maxLat = maxLat;
            this.maxLng = maxLng;
        }
    }

    public Result loadFromResource(InputStream osmXml) throws Exception {
        Map<Long, Node> nodeMap = new HashMap<>();
        List<Way> ways = new ArrayList<>();

        double minLat = Double.POSITIVE_INFINITY;
        double minLng = Double.POSITIVE_INFINITY;
        double maxLat = Double.NEGATIVE_INFINITY;
        double maxLng = Double.NEGATIVE_INFINITY;

        XMLInputFactory factory = XMLInputFactory.newInstance();
        XMLEventReader reader = factory.createXMLEventReader(osmXml);

        Way currentWay = null;
        boolean inWay = false;
        String currentKey = null;
        String currentVal = null;

        while (reader.hasNext()) {
            XMLEvent event = reader.nextEvent();
            if (event.isStartElement()) {
                StartElement start = event.asStartElement();
                String name = start.getName().getLocalPart();
                if ("node".equals(name)) {
                    Long id = getLongAttr(start, "id");
                    double lat = getDoubleAttr(start, "lat");
                    double lon = getDoubleAttr(start, "lon");
                    Node node = new Node("n" + id, lat, lon);
                    nodeMap.put(id, node);

                    // track bounds
                    minLat = Math.min(minLat, lat);
                    minLng = Math.min(minLng, lon);
                    maxLat = Math.max(maxLat, lat);
                    maxLng = Math.max(maxLng, lon);
                } else if ("way".equals(name)) {
                    inWay = true;
                    currentWay = new Way();
                } else if (inWay && "nd".equals(name)) {
                    Long ref = getLongAttr(start, "ref");
                    currentWay.nodeRefs.add(ref);
                } else if (inWay && "tag".equals(name)) {
                    currentKey = getStringAttr(start, "k");
                    currentVal = getStringAttr(start, "v");
                    if ("highway".equals(currentKey)) {
                        currentWay.highway = currentVal;
                    }
                }
            } else if (event.isEndElement()) {
                String name = event.asEndElement().getName().getLocalPart();
                if ("way".equals(name)) {
                    inWay = false;
                    ways.add(currentWay);
                    currentWay = null;
                }
            }
        }

        Graph graph = new Graph();
        // Add all nodes
        for (Node node : nodeMap.values()) {
            graph.addNode(node);
        }

        // Connect ways that are walkable
        for (Way way : ways) {
            if (way.highway == null) continue;
            // Accept all highway types except fast roads (motorway/trunk)
            if (EXCLUDED_HIGHWAYS.contains(way.highway)) continue;
            
            List<Long> refs = way.nodeRefs;
            for (int i = 0; i < refs.size() - 1; i++) {
                Node a = nodeMap.get(refs.get(i));
                Node b = nodeMap.get(refs.get(i + 1));
                if (a == null || b == null) continue;
                double dist = haversine(a.getLatitude(), a.getLongitude(), b.getLatitude(), b.getLongitude());
                graph.addEdge(new Edge(a, b, dist, true));
            }
        }

            // Stitch near-miss endpoints: connect way endpoints within 50m to bridge graph fragmentation
            System.out.println("🔧 DEBUG: About to call stitchCloseEndpoints...");
            stitchCloseEndpoints(graph, nodeMap, ways, 50.0);
            System.out.println("🔧 DEBUG: stitchCloseEndpoints completed");
        
            // Stitch isolated nodes: connect nodes with 0-1 neighbors to nearest node within 50m
            System.out.println("🔧 DEBUG: About to call stitchIsolatedNodes...");
            stitchIsolatedNodes(graph, 50.0);
            System.out.println("🔧 DEBUG: stitchIsolatedNodes completed");

        return new Result(graph, minLat, minLng, maxLat, maxLng);
    }

    /**
     * Find way endpoints that are close but not connected, and bridge them.
     * This fixes common OSM data gaps where roads/paths nearly touch but aren't formally connected.
     */
    private void stitchCloseEndpoints(Graph graph, Map<Long, Node> nodeMap, List<Way> ways, double maxDistanceMeters) {
        System.out.println("🔧 DEBUG: ENTERED stitchCloseEndpoints method");
        // Collect all way endpoints (first and last node of each way with a highway tag)
        List<Node> endpoints = new ArrayList<>();
        for (Way way : ways) {
            if (way.highway == null || EXCLUDED_HIGHWAYS.contains(way.highway)) continue;
            if (way.nodeRefs.isEmpty()) continue;
            
            Long firstRef = way.nodeRefs.get(0);
            Long lastRef = way.nodeRefs.get(way.nodeRefs.size() - 1);
            
            Node firstNode = nodeMap.get(firstRef);
            Node lastNode = nodeMap.get(lastRef);
            
            if (firstNode != null && !endpoints.contains(firstNode)) endpoints.add(firstNode);
            if (lastNode != null && !endpoints.contains(lastNode)) endpoints.add(lastNode);
        }
        
        int bridgesAdded = 0;
        // For each endpoint, find other endpoints within maxDistance and connect them
        for (int i = 0; i < endpoints.size(); i++) {
            Node a = endpoints.get(i);
            for (int j = i + 1; j < endpoints.size(); j++) {
                Node b = endpoints.get(j);
                
                // Skip if already directly connected
                boolean alreadyConnected = graph.getNeighbors(a).stream()
                        .anyMatch(edge -> edge.getTo().equals(b));
                if (alreadyConnected) continue;
                
                double dist = haversine(a.getLatitude(), a.getLongitude(), b.getLatitude(), b.getLongitude());
                if (dist <= maxDistanceMeters) {
                    graph.addEdge(new Edge(a, b, dist, true));
                    bridgesAdded++;
                }
            }
        }
        
        if (bridgesAdded > 0) {
                System.out.println("   Stitched way endpoints: " + bridgesAdded + " bridges (<" + maxDistanceMeters + "m)");
        }
    }

        /**
         * Connect isolated nodes (with 0 or 1 neighbors) to the nearest node within maxDistance.
         * This fixes nodes that are part of very short ways or disconnected from the main graph.
         */
        private void stitchIsolatedNodes(Graph graph, double maxDistanceMeters) {
            System.out.println("🔧 DEBUG: ENTERED stitchIsolatedNodes method");
            int bridgesAdded = 0;
            List<Node> allNodes = new ArrayList<>(graph.getAllNodes());
        
            for (Node node : allNodes) {
                // Only fix nodes with 0 or 1 neighbor (isolated or weakly connected)
                int neighborCount = graph.getNeighbors(node).size();
                if (neighborCount > 1) continue;
            
                // Find the closest node within maxDistance
                Node closest = null;
                double minDist = Double.MAX_VALUE;
            
                for (Node candidate : allNodes) {
                    if (candidate.equals(node)) continue;
                
                    double dist = haversine(
                        node.getLatitude(), node.getLongitude(),
                        candidate.getLatitude(), candidate.getLongitude()
                    );
                
                    if (dist < minDist && dist <= maxDistanceMeters) {
                        minDist = dist;
                        closest = candidate;
                    }
                }
            
                // Add bridge edge if we found a close node and they're not already connected
                if (closest != null) {
                    final Node closestFinal = closest;
                    boolean alreadyConnected = graph.getNeighbors(node).stream()
                            .anyMatch(edge -> edge.getTo().equals(closestFinal));
                
                    if (!alreadyConnected) {
                        graph.addEdge(new Edge(node, closestFinal, minDist, true));
                        bridgesAdded++;
                    }
                }
            }
        
            if (bridgesAdded > 0) {
                System.out.println("   Connected isolated nodes: " + bridgesAdded + " bridges (<" + maxDistanceMeters + "m)");
            }
        }

    private static class Way {
        List<Long> nodeRefs = new ArrayList<>();
        String highway; // type
    }

    private static Long getLongAttr(StartElement start, String name) {
        Attribute attr = start.getAttributeByName(new javax.xml.namespace.QName(name));
        return attr != null ? Long.parseLong(attr.getValue()) : null;
    }

    private static double getDoubleAttr(StartElement start, String name) {
        Attribute attr = start.getAttributeByName(new javax.xml.namespace.QName(name));
        return attr != null ? Double.parseDouble(attr.getValue()) : Double.NaN;
    }

    private static String getStringAttr(StartElement start, String name) {
        Attribute attr = start.getAttributeByName(new javax.xml.namespace.QName(name));
        return attr != null ? attr.getValue() : null;
    }

    // Haversine distance in meters
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
