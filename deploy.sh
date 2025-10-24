#!/bin/bash

# CollegeConnect Deployment Script
# This script helps deploy the application to production

set -e

echo "🚀 CollegeConnect Deployment Script"
echo "===================================="

# Check if GCP project is set
if [ -z "$GCP_PROJECT_ID" ]; then
    echo "❌ Error: GCP_PROJECT_ID environment variable not set"
    echo "Please run: export GCP_PROJECT_ID=your-project-id"
    exit 1
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "${YELLOW}Step 1: Building Backend${NC}"
cd backend
mvn clean package -DskipTests
cd ..

echo ""
echo "${GREEN}✓ Backend built successfully${NC}"

echo ""
echo "${YELLOW}Step 2: Building Docker Image${NC}"
gcloud builds submit --tag gcr.io/$GCP_PROJECT_ID/collegeconnect-backend backend/

echo ""
echo "${GREEN}✓ Docker image built${NC}"

echo ""
echo "${YELLOW}Step 3: Deploying to Cloud Run${NC}"
gcloud run deploy collegeconnect-backend \
  --image gcr.io/$GCP_PROJECT_ID/collegeconnect-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars FIRESTORE_PROJECT_ID=studio-6560732135-c4764 \
  --port 8081

echo ""
echo "${GREEN}✓ Backend deployed to Cloud Run${NC}"

# Get backend URL
BACKEND_URL=$(gcloud run services describe collegeconnect-backend --region us-central1 --format 'value(status.url)')

echo ""
echo "${YELLOW}Step 4: Deploying Frontend to Vercel${NC}"
echo "Backend URL: $BACKEND_URL"

# Set environment variable for Vercel
export NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL

# Deploy to Vercel
vercel --prod --yes

echo ""
echo "${GREEN}✓ Frontend deployed to Vercel${NC}"

echo ""
echo "===================================="
echo "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Frontend: Check Vercel dashboard for URL"
echo ""
echo "Next steps:"
echo "1. Add your Vercel domain to Firebase authorized domains"
echo "2. Test the application"
echo "3. Monitor logs in Cloud Run and Vercel dashboards"
