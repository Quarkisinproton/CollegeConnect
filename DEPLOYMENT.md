# 🚀 CollegeConnect - Deployment Guide

## Overview

This guide covers deploying CollegeConnect to production using:
- **Vercel** for the Next.js frontend
- **Google Cloud Run** for the Spring Boot backend
- **Firebase Firestore** for the database

---

## Prerequisites

1. **Accounts**:
   - [Vercel Account](https://vercel.com) (free)
   - [Google Cloud Account](https://cloud.google.com) (free $300 credit)
   - [Firebase Project](https://console.firebase.google.com) (already have)

2. **CLI Tools**:
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Install Google Cloud SDK
   # Linux:
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   gcloud init
   
   # Install Firebase CLI
   npm install -g firebase-tools
   ```

---

## Part 1: Firebase Setup (Database)

### 1. Create Production Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project" or use existing `studio-6560732135-c4764`
3. Enable **Firestore Database**:
   - Click "Firestore Database" → "Create database"
   - Choose location (e.g., `us-central1`)
   - Start in **production mode**
   - Deploy the security rules:

```bash
cd /home/gb/Desktop/NAVEventProject/CollegeConnect
firebase deploy --only firestore:rules
```

### 2. Enable Firebase Authentication

1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Add authorized domains:
   - Your Vercel domain (e.g., `your-app.vercel.app`)
   - Your custom domain (if any)

### 3. Get Service Account Key (for Backend)

1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate new private key**
3. Save the JSON file securely (don't commit to git!)

---

## Part 2: Backend Deployment (Google Cloud Run)

### 1. Create Dockerfile for Backend

Create `backend/Dockerfile`:

```dockerfile
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY target/backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 2. Build and Deploy to Cloud Run

```bash
cd /home/gb/Desktop/NAVEventProject/CollegeConnect

# Set your Google Cloud project
export PROJECT_ID="your-gcp-project-id"
gcloud config set project $PROJECT_ID

# Build the backend
cd backend
mvn clean package -DskipTests

# Build Docker image
gcloud builds submit --tag gcr.io/$PROJECT_ID/collegeconnect-backend

# Deploy to Cloud Run
gcloud run deploy collegeconnect-backend \
  --image gcr.io/$PROJECT_ID/collegeconnect-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars FIRESTORE_PROJECT_ID=studio-6560732135-c4764 \
  --port 8081

# Get the backend URL
gcloud run services describe collegeconnect-backend --region us-central1 --format 'value(status.url)'
```

**Copy the backend URL** - you'll need it for the frontend!

### 3. Upload Service Account Key

```bash
# Create secret for service account
gcloud secrets create firestore-credentials --data-file=/path/to/your-service-account-key.json

# Grant Cloud Run access to the secret
gcloud run services update collegeconnect-backend \
  --region us-central1 \
  --update-secrets=/secrets/firebase-key=firestore-credentials:latest \
  --set-env-vars GOOGLE_APPLICATION_CREDENTIALS=/secrets/firebase-key
```

---

## Part 3: Frontend Deployment (Vercel)

### 1. Update Environment Variables

Create `.env.production` in project root:

```bash
# .env.production
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.run.app
```

### 2. Deploy to Vercel

```bash
cd /home/gb/Desktop/NAVEventProject/CollegeConnect

# Login to Vercel
vercel login

# Deploy (first time)
vercel --prod

# Or link to existing project
vercel link
vercel --prod
```

### 3. Configure Vercel Environment Variables

Go to your Vercel dashboard:
1. Select your project
2. Go to **Settings** → **Environment Variables**
3. Add:
   - `NEXT_PUBLIC_BACKEND_URL` = `https://your-backend-url.run.app`

### 4. Redeploy

```bash
vercel --prod
```

---

## Part 4: Update Firebase Config

### 1. Update Authorized Domains

1. Go to Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Add your Vercel domain: `your-app.vercel.app`

### 2. Update CORS on Backend

Update `backend/src/main/resources/application.properties`:

```properties
# Allow your frontend domain
cors.allowed-origins=https://your-app.vercel.app,http://localhost:9002
```

Redeploy backend:
```bash
cd backend
mvn clean package -DskipTests
gcloud builds submit --tag gcr.io/$PROJECT_ID/collegeconnect-backend
gcloud run deploy collegeconnect-backend --image gcr.io/$PROJECT_ID/collegeconnect-backend --region us-central1
```

---

## Part 5: Custom Domain (Optional)

### For Vercel (Frontend):

1. Go to Vercel dashboard → **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS records as instructed

### For Cloud Run (Backend):

```bash
gcloud beta run domain-mappings create \
  --service collegeconnect-backend \
  --domain api.yourdomain.com \
  --region us-central1
```

Update your DNS:
- Add the provided CNAME/A records

---

## Deployment Checklist

- [ ] Firebase project created and Firestore enabled
- [ ] Firestore security rules deployed
- [ ] Firebase Authentication enabled
- [ ] Service account key generated and uploaded to GCP
- [ ] Backend built and deployed to Cloud Run
- [ ] Backend URL obtained
- [ ] Frontend environment variables updated
- [ ] Frontend deployed to Vercel
- [ ] Vercel domain added to Firebase authorized domains
- [ ] CORS configured on backend
- [ ] Custom domain configured (if applicable)
- [ ] Test the application!

---

## Estimated Costs

### Free Tier Limits:
- **Vercel**: 100GB bandwidth/month, unlimited projects
- **Cloud Run**: 2 million requests/month, 360,000 GB-seconds/month
- **Firestore**: 50K reads, 20K writes, 20K deletes per day
- **Firebase Auth**: Unlimited

### Beyond Free Tier:
- **Cloud Run**: ~$0.00002400 per request
- **Firestore**: $0.06 per 100K reads
- **Bandwidth**: ~$0.12 per GB

**Expected cost for small app**: $0-10/month

---

## Continuous Deployment

### Option 1: Vercel Auto-Deploy from GitHub

1. Import your GitHub repo in Vercel
2. Vercel will auto-deploy on every push to `main`

### Option 2: GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          java-version: '21'
          distribution: 'temurin'
      
      - name: Build Backend
        run: |
          cd backend
          mvn clean package -DskipTests
      
      - name: Deploy to Cloud Run
        uses: google-github-actions/deploy-cloudrun@v1
        with:
          service: collegeconnect-backend
          image: gcr.io/${{ secrets.GCP_PROJECT_ID }}/collegeconnect-backend
          region: us-central1
  
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Monitoring

### Cloud Run Logs:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=collegeconnect-backend" --limit 50
```

### Vercel Logs:
Check the Vercel dashboard → Your Project → Logs

### Firestore Usage:
Firebase Console → Usage tab

---

## Troubleshooting

### Backend won't connect to Firestore:
- Check service account key is uploaded correctly
- Verify `GOOGLE_APPLICATION_CREDENTIALS` env var
- Check Firestore project ID matches

### Frontend can't reach backend:
- Verify CORS is configured
- Check `NEXT_PUBLIC_BACKEND_URL` is set correctly
- Ensure Cloud Run allows unauthenticated requests

### Authentication issues:
- Check authorized domains in Firebase
- Verify Firebase config in frontend matches production project

---

## Rollback

### Rollback Backend:
```bash
gcloud run services update-traffic collegeconnect-backend --to-revisions=PREVIOUS_REVISION=100 --region us-central1
```

### Rollback Frontend:
Vercel dashboard → Deployments → Find previous deployment → Promote to Production

---

## Next Steps

1. Follow this guide step by step
2. Test thoroughly in production
3. Set up monitoring and alerts
4. Configure backup strategy for Firestore
5. Consider adding CDN (Vercel does this automatically)

---

**Questions?** Check:
- [Vercel Docs](https://vercel.com/docs)
- [Cloud Run Docs](https://cloud.google.com/run/docs)
- [Firebase Docs](https://firebase.google.com/docs)
