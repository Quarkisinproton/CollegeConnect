# 🎓 CollegeConnect

A modern campus event management platform built with Next.js, Spring Boot, and Firebase.

## 🌟 Features

- **Event Discovery**: Browse all campus events with interactive map visualization
- **Role-Based Access**: Presidents can create/manage events, students can view and navigate
- **Advanced Navigation**: 
  - **Bidirectional A* Algorithm**: Fast pathfinding using BiA* (Faster Than Dijkstra)
  - **Smart Snapping**: Automatic adjustment to nearest roads when routing fails
  - **Graph Stitching**: 3280-edge optimized graph with intelligent road network bridging
  - **Visual Feedback**: Dashed lines showing where clicks were snapped to roads
  - **Interactive Map**: Click anywhere to set custom start points for navigation
- **Firebase Authentication**: Secure anonymous login with role-based profiles
- **Responsive Design**: Built with shadcn/ui components and Tailwind CSS

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 15.3.3 with React 18 and TypeScript
- **UI**: shadcn/ui components + Tailwind CSS
- **Maps**: Leaflet 1.9.4 with custom navigation visualization
- **Routing**: Custom BiA* pathfinding with smart snapping fallback
- **Auth**: Firebase Authentication
- **Hosting**: Vercel

### Backend
- **Framework**: Spring Boot 3.2.6 (Java 17)
- **Database**: Firebase Firestore
- **Navigation Engine**: 
  - Custom graph-based pathfinding (A* & BiA*)
  - OSM data parser with graph stitching
  - Smart snapping for failed routes
  - 3280-edge campus road network
- **Security**: Firebase token verification with CORS
- **Hosting**: Render.com (Docker)

## 🚀 Quick Start

### Running Locally
See **[START_HERE.md](START_HERE.md)** for complete local development setup.

### Deploying to Production
See **[EASY_DEPLOYMENT.md](EASY_DEPLOYMENT.md)** for Render + Vercel deployment guide.

### OOP Implementation Proof
See **[backend/README_OOP.md](backend/README_OOP.md)** for comprehensive documentation of all Java OOP concepts (classes, objects, methods, constructors, access specifiers, overloading, inheritance, interfaces, abstract methods, packages).

## 🌐 Live Demo

- **Frontend**: https://college-connect-kohi.vercel.app
- **Backend API**: https://collegeconnect-backend-htrb.onrender.com

## 📁 Project Structure

```
CollegeConnect/
├── src/                    # Next.js frontend
│   ├── app/               # Pages and layouts
│   ├── components/        # React components (including EventMap)
│   ├── firebase/          # Firebase config and hooks
│   └── types/             # TypeScript definitions
├── backend/               # Spring Boot backend
│   └── src/main/java/com/collegeconnect/
│       ├── model/         # Entity classes
│       ├── service/       # Business logic
│       ├── controllers/   # REST API endpoints
│       ├── config/        # Configuration
│       ├── security/      # Auth filters
│       └── navigation/    # Campus navigation system
│           ├── algorithm/ # A* and BiA* implementations
│           ├── model/     # Graph, Node, Edge, Route
│           ├── service/   # NavigationService with smart snapping
│           └── util/      # OSM parser with graph stitching
└── docs/                  # Additional documentation
```

## 🎯 Key API Endpoints

### Events
- `GET /api/events` - List all events
- `GET /api/events/{id}` - Get event details
- `POST /api/events` - Create event (presidents only)

### Users
- `GET /api/users/{uid}` - Get user profile
- `PUT /api/users/{uid}` - Update user profile

### Navigation
- `GET /api/navigation/bounds` - Get campus boundary coordinates
- `POST /api/navigation/route` - Calculate route with smart snapping
  - Uses BiA* algorithm by default
  - Automatically snaps to nearest roads if routing fails
  - Returns path coordinates and snap segment data
- `POST /api/navigation/compare` - Compare A* vs BiA* performance

## �️ Navigation System Architecture

### Graph Construction
The navigation system uses OpenStreetMap (OSM) data to build a campus road network:

1. **OSM Parsing**: Extracts nodes and walkable ways from `map.osm`
2. **Graph Building**: Creates bidirectional edges between connected nodes
3. **Graph Stitching** (Critical for connectivity):
   - **Endpoint Stitching**: Bridges way endpoints within 50m (adds ~134 connections)
   - **Isolated Node Stitching**: Connects weakly-connected nodes (adds ~776 connections)
   - **Result**: 1803 nodes, 3280 edges (vs 864 without stitching)

### Pathfinding Algorithms

#### Bidirectional A* (BiA*) - Default
- Searches from both start and end simultaneously
- Typically 1.5-3x faster than standard A*
- Uses haversine distance as heuristic
- Stops when search frontiers meet

#### Standard A* - Available for Comparison
- Single-direction search from start to goal
- Kept for performance benchmarking
- Access via `/compare` endpoint

### Smart Snapping Feature
When direct routing fails (user clicks off-road):

1. **First Attempt**: Try direct routing with clicked coordinates
2. **Snap & Retry**: If fails, snap both start and end to nearest graph nodes
3. **Visualization**: Show dashed gray lines indicating adjustments
4. **User Feedback**: Toast notification shows when snapping occurred

### Performance Metrics
- Average routing time: 1-5ms for typical campus routes
- Graph load time: ~200ms on startup
- Memory footprint: ~15MB for full campus graph

## �📝 License

MIT License - feel free to use this project for educational purposes.

---

Built with ❤️ for college communities

## 🎨 UI theming and modern polish

- Ambient background: The app uses a subtle gradient background via the `app-bg` utility (defined in `src/app/globals.css`).
- Theme toggle: A new `ThemeToggle` in the header switches between light and dark themes; your preference is saved in `localStorage`.
- Softer shadows and motion: Tailwind adds `shadow-soft`/`shadow-elevated` and entrance animations (`animate-fade-in`, `animate-slide-up-fade`).
- Layout container: Main app content is centered to `max-w-7xl` with improved spacing for a clean look.

Customize the palette by editing CSS variables under `:root` and `.dark` in `globals.css`.
