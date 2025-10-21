#!/usr/bin/env bash
# Stop all CollegeConnect local development services

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "Stopping CollegeConnect services..."

# Stop backend
if [ -f "$BACKEND_DIR/backend.pid" ]; then
    backend_pid=$(cat "$BACKEND_DIR/backend.pid")
    if ps -p $backend_pid > /dev/null 2>&1; then
        echo "Stopping backend (PID: $backend_pid)..."
        kill $backend_pid
        rm -f "$BACKEND_DIR/backend.pid"
    fi
fi

# Stop frontend
if [ -f "$PROJECT_ROOT/frontend.pid" ]; then
    frontend_pid=$(cat "$PROJECT_ROOT/frontend.pid")
    if ps -p $frontend_pid > /dev/null 2>&1; then
        echo "Stopping frontend (PID: $frontend_pid)..."
        kill $frontend_pid
        rm -f "$PROJECT_ROOT/frontend.pid"
    fi
fi

# Kill any remaining Node/Java processes on our ports
pkill -f "next dev" 2>/dev/null || true
pkill -f "backend-0.0.1-SNAPSHOT.jar" 2>/dev/null || true

# Stop Firestore emulator
echo "Stopping Firestore emulator..."
docker compose -f "$BACKEND_DIR/dev/firestore-emulator/docker-compose.yml" down

echo "✓ All services stopped"
