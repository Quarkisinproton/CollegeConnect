#!/usr/bin/env bash
# Run Backend API on port 8081 (leaves 8080 free for Firestore emulator)
cd backend
export FIRESTORE_EMULATOR_HOST=localhost:8080
export FIRESTORE_PROJECT=demo-project

# Prefer SERVER_PORT env var if provided; default to 8081
PORT=${SERVER_PORT:-8081}
echo "Starting backend on port ${PORT} (Firestore emulator at ${FIRESTORE_EMULATOR_HOST})"
java -jar target/backend-0.0.1-SNAPSHOT.jar --server.port=${PORT}
