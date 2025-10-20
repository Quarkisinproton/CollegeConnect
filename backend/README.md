CollegeConnect Java backend (Spring Boot)

This backend provides simple endpoints that wrap Firestore operations and verify Firebase ID tokens.

Quick start (local, requires Java 17 and Maven):

1. Set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON with Firestore access:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccount.json"
```

2. Build and run locally:

```bash
cd backend
mvn package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

3. Endpoints:
- POST /api/events — create an event (body follows EventDto JSON shape)
- PUT /api/users/{uid} — upsert a user profile

Authorization:
- Provide Firebase ID token in Authorization: Bearer <token> header. Endpoints will verify the token using the Firebase Admin SDK.

Deployment:
- Build the jar and deploy to Cloud Run or other container platform. The Dockerfile is provided.
