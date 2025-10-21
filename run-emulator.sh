#!/usr/bin/env bash
# Run Firestore Emulator
cd backend
docker run --rm -p 8080:8080 \
  gcr.io/google.com/cloudsdktool/cloud-sdk:emulators \
  gcloud beta emulators firestore start \
  --host-port=0.0.0.0:8080 \
  --project=demo-project
