# Quick Start Guide - CollegeConnect

## Step-by-Step Manual Setup

Follow these steps in order to run CollegeConnect locally:

### Step 1: Build the Backend

```bash
cd backend
mvn clean package spring-boot:repackage
```

This will create `target/backend-0.0.1-SNAPSHOT.jar`

### Step 2: Install Frontend Dependencies (if needed)

```bash
cd ..  # back to project root
npm install
```

### Step 3: Start Services in Separate Terminals

Open **3 separate terminal windows/tabs**:

#### Terminal 1 - Firestore Emulator
```bash
cd backend
docker run --rm -p 8080:8080 \
  gcr.io/google.com/cloudsdktool/cloud-sdk:emulators \
  gcloud beta emulators firestore start \
  --host-port=0.0.0.0:8080 \
  --project=demo-project
```

Wait until you see: "Dev App Server is now running"

#### Terminal 2 - Backend API (Java)
```bash
cd backend
export FIRESTORE_EMULATOR_HOST=localhost:8080
export FIRESTORE_PROJECT=demo-project
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

Wait until you see: "Started Application in X seconds"

#### Terminal 3 - Frontend (Next.js)
```bash
# In project root
npm run dev
```

Wait until you see: "Ready in X ms"

### Step 4: Access the Application

Open your browser to: **http://localhost:9002**

---

## Quick Commands

### Check if services are running
```bash
# Check emulator
curl http://localhost:8080/ 

# Check backend
curl http://localhost:8081/api/events

# Check frontend  
curl http://localhost:9002
```

### Stop all services
Press `Ctrl+C` in each terminal window

---

## If You Get Errors

### Backend won't start
- Make sure the emulator is running first
- Check if port 8081 is free: `lsof -i :8081`
- View logs in the terminal where you started it

### Frontend won't connect to backend
- Make sure backend is running on port 8081
- Check `next.config.ts` - it should proxy `/api/*` to backend

### Emulator issues
- Try pulling the latest image: `docker pull gcr.io/google.com/cloudsdktool/cloud-sdk:emulators`
- Make sure port 8080 is free: `lsof -i :8080`

---

## Alternative: Use docker-compose for Emulator

Instead of the docker run command, you can use:

```bash
cd backend
docker compose -f dev/firestore-emulator/docker-compose.yml up
```

(Note: Keep the terminal open to see logs)

