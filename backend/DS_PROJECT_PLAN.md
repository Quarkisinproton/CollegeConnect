# 🗺️ Data Structures Project - Custom Navigation Algorithm

## 📋 Project Overview

**Goal**: Implement a custom pathfinding/navigation algorithm from scratch using Data Structures concepts (no external routing libraries in backend).

**Branch**: `JavaMain` (development/testing)  
**Production Branch**: `main` (merge after successful testing)

---

## 🎯 Data Structures to Implement

### Core DS Concepts Required:

1. **Graph** - Road network representation
   - Nodes: Locations/intersections
   - Edges: Roads/paths with weights (distance/time)
   
2. **Priority Queue (Heap)** - For A* or Dijkstra's algorithm
   - Min-heap for efficient pathfinding
   
3. **HashMap** - Fast location lookup
   - Key: Location ID/coordinates
   - Value: Node data
   
4. **ArrayList/LinkedList** - Store paths and adjacency lists
   
5. **Stack/Queue** - Path reconstruction and BFS/DFS

---

## 🧮 Algorithms to Implement

### Option 1: Dijkstra's Algorithm (Simpler)
- **Pros**: Guaranteed shortest path, well-documented
- **Cons**: Slower for large graphs
- **Best for**: Campus-sized maps (small to medium)

### Option 2: A* Algorithm (Recommended)
- **Pros**: Faster with heuristic, industry standard
- **Cons**: Slightly more complex
- **Best for**: Larger maps with known destination

### Option 3: Both (Showcase)
- Implement both and compare performance

---

## 📁 Proposed Package Structure

```
backend/src/main/java/com/collegeconnect/
├── navigation/                          ← NEW PACKAGE
│   ├── model/
│   │   ├── Node.java                   ← Graph node (location)
│   │   ├── Edge.java                   ← Road/path with weight
│   │   ├── Graph.java                  ← Graph data structure
│   │   └── Route.java                  ← Navigation result
│   ├── algorithm/
│   │   ├── PathfindingAlgorithm.java   ← Interface
│   │   ├── DijkstraAlgorithm.java      ← Dijkstra implementation
│   │   └── AStarAlgorithm.java         ← A* implementation
│   ├── service/
│   │   └── NavigationService.java      ← Main navigation service
│   └── util/
│       ├── MinHeap.java                ← Custom priority queue
│       └── HeuristicCalculator.java    ← Distance calculations
└── controllers/
    └── NavigationController.java        ← REST API endpoints
```

---

## 🔌 API Design

### New Endpoints (NavigationController)

```java
// Calculate route between two points
POST /api/navigation/route
Body: {
  "start": { "lat": 12.345, "lng": 67.890 },
  "end": { "lat": 12.346, "lng": 67.891 },
  "algorithm": "ASTAR" // or "DIJKSTRA"
}
Response: {
  "distance": 1234.5,
  "duration": 300, // seconds
  "path": [
    { "lat": 12.345, "lng": 67.890 },
    { "lat": 12.3455, "lng": 67.8905 },
    ...
  ],
  "algorithm": "ASTAR"
}

// Get campus map graph
GET /api/navigation/graph
Response: {
  "nodes": [...],
  "edges": [...]
}
```

---

## 📊 Implementation Phases

### Phase 1: Data Structures (Week 1)
- [ ] Create Node, Edge, Graph classes
- [ ] Implement custom MinHeap (priority queue)
- [ ] Add graph building utilities
- [ ] Create sample campus map data

### Phase 2: Algorithms (Week 1-2)
- [ ] Implement Dijkstra's algorithm
- [ ] Implement A* algorithm
- [ ] Add heuristic calculations (Haversine distance)
- [ ] Unit tests for both algorithms

### Phase 3: Service Layer (Week 2)
- [ ] NavigationService integration
- [ ] REST API endpoints
- [ ] Input validation
- [ ] Error handling

### Phase 4: Testing (Week 2-3)
- [ ] Unit tests for all DS components
- [ ] Integration tests with real coordinates
- [ ] Performance benchmarking
- [ ] Compare with Leaflet routing (accuracy check)

### Phase 5: Frontend Integration (Week 3)
- [ ] Update EventMap to call backend API
- [ ] Display custom routes on map
- [ ] Add algorithm selector UI
- [ ] Performance metrics display

---

## 🧪 Testing Strategy

### Unit Tests
- Graph construction
- MinHeap operations
- Pathfinding correctness
- Edge cases (no path, same start/end)

### Integration Tests
- API endpoint responses
- Real campus coordinates
- Large graph performance

### Comparison Tests
- Your algorithm vs. Leaflet routing
- Accuracy comparison
- Performance comparison

---

## 📈 Success Criteria

1. ✅ All DS concepts properly implemented
2. ✅ Algorithm finds shortest path correctly
3. ✅ Performance acceptable for campus-sized maps (<100ms)
4. ✅ Unit tests pass (>90% coverage)
5. ✅ Works with real campus coordinates
6. ✅ Matches or beats Leaflet routing accuracy

---

## 🚀 Next Steps

1. **Review this plan** - Any changes needed?
2. **Choose algorithm** - Dijkstra, A*, or both?
3. **Define campus map** - Use your college layout or generic?
4. **Start with Node/Edge/Graph** - Build foundation first
5. **Implement MinHeap** - Custom priority queue
6. **Build algorithm** - Core pathfinding logic
7. **Test locally** - Verify correctness
8. **Merge to main** - After successful testing

---

## 📚 Learning Resources

- **Dijkstra**: O(E log V) with min-heap
- **A***: O(E log V) with heuristic optimization
- **Haversine Formula**: Great-circle distance between lat/lng points
- **Graph Theory**: Adjacency lists vs. matrices

---

**Ready to start? Let's build this! 🎯**
