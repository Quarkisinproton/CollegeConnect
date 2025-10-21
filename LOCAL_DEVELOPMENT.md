# 🚀 CollegeConnect - Local Development Guide

## Quick Start

### Prerequisites
- ✅ Java 17+ (You have Java 21)
- ✅ Maven 3.6+ (You have Maven 3.8.7)
- ✅ Node.js 18+ (You have Node 20.19.5)
- ✅ Docker (You have Docker 28.5.1)

All prerequisites are already installed on your system!

### Start Everything

```bash
./start-local.sh
```

This single command will:
1. Start the Firestore emulator (port 8080)
2. Install frontend dependencies (if needed)
3. Build and start the Spring Boot backend (port 8081)
4. Start the Next.js frontend (port 9002)

### Stop Everything

```bash
./stop-local.sh
```

Or press `Ctrl+C` in the terminal running `start-local.sh`.

---

## Manual Setup (Alternative)

If you prefer to run services individually:

### 1. Start Firestore Emulator

```bash
cd backend
docker compose -f dev/firestore-emulator/docker-compose.yml up -d
```

Check it's running: http://localhost:8080

### 2. Start Backend

```bash
cd backend
export FIRESTORE_EMULATOR_HOST=localhost:8080
export FIRESTORE_PROJECT=demo-project

# Build (first time only)
mvn clean package -DskipTests

# Run
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

Backend will be available at: http://localhost:8081

### 3. Start Frontend

```bash
# In project root
npm install  # First time only
npm run dev
```

Frontend will be available at: http://localhost:9002

---

## URLs

| Service | URL | Description |
|---------|-----|-------------|
| 🌐 Frontend | http://localhost:9002 | Next.js application |
| 🔧 Backend API | http://localhost:8081/api | Spring Boot REST API |
| 💾 Firestore Emulator | http://localhost:8080 | Local Firestore database |

---

## Testing the Application

### 1. Access the Application
Open http://localhost:9002 in your browser

### 2. Login
You'll be redirected to the login page. Choose a user profile:

**Students** (can view events):
- Alex Johnson
- Brenda Smith
- Charlie Brown
- Diana Prince

**Presidents** (can create events):
- Edward King
- Fiona Queen
- George Lord
- Helen Duke

### 3. View Dashboard
After login, you'll see all upcoming events

### 4. Create an Event (Presidents only)
1. Click "Create Event" in the header
2. Fill in event details
3. Click on the map to select event location
4. Submit the form

### 5. View Event Details
Click on any event card to see:
- Event information
- Location on map
- "Navigate to Event" button (uses your current location)

---

## API Endpoints

### Events
```bash
# List all events
curl http://localhost:8081/api/events

# List my events (requires auth token)
curl -H "Authorization: Bearer <token>" \
  http://localhost:8081/api/events?owner=true

# Create event (requires auth token)
curl -X POST http://localhost:8081/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Tech Meetup",
    "description": "Monthly tech gathering",
    "dateTime": "2025-10-25T18:00:00Z",
    "location": {"lat": 17.783, "lng": 83.378},
    "locationName": "Main Campus",
    "createdBy": "user-id",
    "creatorName": "John Doe"
  }'
```

### Users
```bash
# Create/Update user profile
curl -X PUT http://localhost:8081/api/users/user-id \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user-id",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "student"
  }'
```

---

## Running Tests

### Backend Unit Tests
```bash
cd backend
mvn test
```

### Backend Integration Tests (with Emulator)
```bash
cd backend
./scripts/run-emulator-integration.sh
```

### Frontend Type Check
```bash
npm run typecheck
```

---

## Troubleshooting

### Port Already in Use
If you see "port already in use" errors:

```bash
# Check what's using the port
lsof -i :9002  # Frontend
lsof -i :8081  # Backend
lsof -i :8080  # Emulator

# Kill the process
kill -9 <PID>
```

### Backend Won't Start
Check the logs:
```bash
tail -f backend/backend.log
```

Common issues:
- Java version mismatch (need Java 17+)
- Port 8081 already in use
- Firestore emulator not running

### Frontend Won't Start
Check the logs:
```bash
tail -f frontend.log
```

Common issues:
- Dependencies not installed (run `npm install`)
- Port 9002 already in use
- Backend not running (frontend needs backend for API)

### Firestore Emulator Issues
```bash
# Stop and remove containers
docker compose -f backend/dev/firestore-emulator/docker-compose.yml down -v

# Restart
docker compose -f backend/dev/firestore-emulator/docker-compose.yml up -d
```

### Clean Start
```bash
# Stop everything
./stop-local.sh

# Clean backend
cd backend
mvn clean

# Clean frontend
cd ..
rm -rf .next node_modules
npm install

# Start fresh
./start-local.sh
```

---

## Development Tips

### Watch Backend Logs
```bash
tail -f backend/backend.log
```

### Watch Frontend Logs
```bash
tail -f frontend.log
```

### Rebuild Backend After Code Changes
```bash
cd backend
mvn clean package -DskipTests
# Then restart the backend
```

### Frontend Hot Reload
The Next.js dev server automatically reloads when you save files. No restart needed!

### Access Firestore Emulator UI
The emulator doesn't have a UI by default, but you can:
1. View data through your application
2. Use the Firebase Emulator Suite UI (requires separate setup)
3. Use the REST API at http://localhost:8080

---

## Project Structure

```
CollegeConnect/
├── start-local.sh          # Start all services
├── stop-local.sh           # Stop all services
├── src/                    # Frontend Next.js code
├── backend/                # Backend Spring Boot code
│   ├── src/
│   ├── dev/firestore-emulator/
│   └── scripts/
├── package.json            # Frontend dependencies
└── backend/pom.xml         # Backend dependencies
```

---

## Environment Variables

### Backend
```bash
FIRESTORE_EMULATOR_HOST=localhost:8080  # Use local emulator
FIRESTORE_PROJECT=demo-project          # Project ID for emulator
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json  # For production
```

### Frontend
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8081  # Backend API URL
```

---

## Next Steps

1. ✅ Start the application with `./start-local.sh`
2. 🌐 Open http://localhost:9002
3. 👤 Login with a test user
4. 🎉 Create and view events!

For production deployment, see the deployment documentation.

---

**Need help?** Check the logs or refer to:
- Backend README: `backend/README.md`
- Main README: `README.md`
