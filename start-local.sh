#!/usr/bin/env bash
# CollegeConnect Local Development Startup Script
set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
EMULATOR_COMPOSE="$BACKEND_DIR/dev/firestore-emulator/docker-compose.yml"

echo -e "${BLUE}=== CollegeConnect Local Development Setup ===${NC}\n"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"
    
    # Stop backend if running
    if [ -f "$BACKEND_DIR/backend.pid" ]; then
        backend_pid=$(cat "$BACKEND_DIR/backend.pid")
        if ps -p $backend_pid > /dev/null 2>&1; then
            echo "Stopping backend (PID: $backend_pid)..."
            kill $backend_pid 2>/dev/null || true
        fi
        rm -f "$BACKEND_DIR/backend.pid"
    fi
    
    # Stop frontend if running
    if [ -f "$PROJECT_ROOT/frontend.pid" ]; then
        frontend_pid=$(cat "$PROJECT_ROOT/frontend.pid")
        if ps -p $frontend_pid > /dev/null 2>&1; then
            echo "Stopping frontend (PID: $frontend_pid)..."
            kill $frontend_pid 2>/dev/null || true
        fi
        rm -f "$PROJECT_ROOT/frontend.pid"
    fi
    
    # Stop Firestore emulator
    echo "Stopping Firestore emulator..."
    docker compose -f "$EMULATOR_COMPOSE" down 2>/dev/null || true
    
    echo -e "${GREEN}Cleanup complete${NC}"
}

trap cleanup EXIT INT TERM

# Step 1: Start Firestore Emulator
echo -e "${BLUE}[1/4] Starting Firestore Emulator...${NC}"
docker compose -f "$EMULATOR_COMPOSE" up -d --build

echo "Waiting for emulator to be ready..."
for i in {1..60}; do
    if curl -sSf http://localhost:8080/ >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Firestore emulator is ready at http://localhost:8080${NC}\n"
        break
    fi
    sleep 1
done

if ! curl -sSf http://localhost:8080/ >/dev/null 2>&1; then
    echo -e "${RED}✗ Firestore emulator failed to start${NC}"
    exit 1
fi

# Step 2: Install Frontend Dependencies
echo -e "${BLUE}[2/4] Installing Frontend Dependencies...${NC}"
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    cd "$PROJECT_ROOT"
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}\n"
else
    echo -e "${YELLOW}✓ Frontend dependencies already installed${NC}\n"
fi

# Step 3: Build and Start Backend
echo -e "${BLUE}[3/4] Building and Starting Backend...${NC}"
cd "$BACKEND_DIR"

# Build backend if jar doesn't exist
if [ ! -f "$BACKEND_DIR/target/backend-0.0.1-SNAPSHOT.jar" ]; then
    echo "Building backend..."
    mvn clean package -DskipTests
fi

# Check if backend port is already in use
if check_port 8081; then
    echo -e "${YELLOW}⚠ Backend port 8081 is already in use. Please stop the existing process.${NC}"
    exit 1
fi

# Set environment variables and start backend
# IMPORTANT: Use the same project id as the frontend firebase config so both hit the same emulator dataset
export FIRESTORE_EMULATOR_HOST=localhost:8080
export FIRESTORE_PROJECT=studio-6560732135-c4764

echo "Starting backend on port 8081..."
java -jar "$BACKEND_DIR/target/backend-0.0.1-SNAPSHOT.jar" > "$BACKEND_DIR/backend.log" 2>&1 &
backend_pid=$!
echo $backend_pid > "$BACKEND_DIR/backend.pid"

# Wait for backend to be ready
echo "Waiting for backend to start..."
for i in {1..30}; do
    if check_port 8081; then
        echo -e "${GREEN}✓ Backend is ready at http://localhost:8081${NC}\n"
        break
    fi
    sleep 1
done

if ! check_port 8081; then
    echo -e "${RED}✗ Backend failed to start. Check $BACKEND_DIR/backend.log for errors${NC}"
    tail -n 20 "$BACKEND_DIR/backend.log"
    exit 1
fi

# Step 4: Start Frontend
echo -e "${BLUE}[4/4] Starting Frontend...${NC}"
cd "$PROJECT_ROOT"

# Check if frontend port is already in use
if check_port 9002; then
    echo -e "${YELLOW}⚠ Frontend port 9002 is already in use. Please stop the existing process.${NC}"
    exit 1
fi

echo "Starting Next.js frontend on port 9002..."
npm run dev > "$PROJECT_ROOT/frontend.log" 2>&1 &
frontend_pid=$!
echo $frontend_pid > "$PROJECT_ROOT/frontend.pid"

# Wait for frontend to be ready
echo "Waiting for frontend to start..."
for i in {1..30}; do
    if check_port 9002; then
        echo -e "${GREEN}✓ Frontend is ready at http://localhost:9002${NC}\n"
        break
    fi
    sleep 1
done

if ! check_port 9002; then
    echo -e "${RED}✗ Frontend failed to start. Check $PROJECT_ROOT/frontend.log for errors${NC}"
    tail -n 20 "$PROJECT_ROOT/frontend.log"
    exit 1
fi

# Display summary
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🚀 CollegeConnect is running locally!                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Services:${NC}"
echo -e "  📱 Frontend:          ${GREEN}http://localhost:9002${NC}"
echo -e "  🔧 Backend API:       ${GREEN}http://localhost:8081${NC}"
echo -e "  💾 Firestore Emulator: ${GREEN}http://localhost:8080${NC}"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo -e "  Backend:  tail -f $BACKEND_DIR/backend.log"
echo -e "  Frontend: tail -f $PROJECT_ROOT/frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}\n"

# Keep script running and show logs
tail -f "$PROJECT_ROOT/frontend.log" 2>/dev/null &
tail_pid=$!

wait $tail_pid
