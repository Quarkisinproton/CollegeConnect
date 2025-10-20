#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Starting Firestore emulator via docker-compose..."
 docker compose -f dev/firestore-emulator/docker-compose.yml up -d --build

# Wait for emulator to be healthy
echo "Waiting for emulator to be ready..."
for i in {1..120}; do
  if curl -sSf http://localhost:8080/ >/dev/null 2>&1; then
    echo "Emulator ready"
    break
  fi
  sleep 1
done

if ! curl -sSf http://localhost:8080/ >/dev/null 2>&1; then
  echo "Emulator did not become ready in time"
  docker compose -f dev/firestore-emulator/docker-compose.yml down || true
  exit 1
fi

export FIRESTORE_EMULATOR_HOST=localhost:8080

# Run only the integration test
mvn -Dtest=com.collegeconnect.integration.FirestoreEmulatorIntegrationTest test

# Tear down
docker compose -f dev/firestore-emulator/docker-compose.yml down
