CollegeConnect Java backend (Spring Boot)

This backend provides simple endpoints that wrap Firestore operations and verify Firebase ID tokens.

Quick start (local, requires Java 17 and Maven):

1. Set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON with Firestore access:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccount.json"
```

## Recent changes

- `CurrentUser` is now a request-scoped bean (`@RequestScope`) so authentication context is isolated per HTTP request.

## Running unit tests

Run unit tests with:

```bash
cd backend
mvn test
```

I ran the unit tests locally and they passed (3 tests). To verify locally, run the command above; the project includes unit tests for controllers and the auth filter.

## Integration tests with Firestore emulator (optional)

There is a docker-compose config to run the Firestore emulator and a helper script to run a single integration test against it.

Requirements: Docker + docker-compose and Maven.

Run:

```bash
cd backend
./scripts/run-emulator-integration.sh
```

The integration test is skipped unless `FIRESTORE_EMULATOR_HOST` is set (the script sets it to `localhost:8080`).

How it works (short)
--------------------
- The integration script starts a local Firestore emulator (docker compose), waits for the emulator to be healthy, sets the environment variable `FIRESTORE_EMULATOR_HOST=localhost:8080`, then runs a single integration test class that boots the Spring application and posts to `/api/events`.
- The app's `FirestoreConfig` detects `FIRESTORE_EMULATOR_HOST` and uses the emulator instead of real Firestore. The test provides a small test `FirebaseTokenVerifier` that returns a mocked token so requests pass the authentication filter.
- After the test completes the script tears down the emulator.

CI notes
--------
- The integration test requires the emulator. In CI you can either:
	- start the emulator container before running tests and set `FIRESTORE_EMULATOR_HOST`, or
	- mark the integration test to run only in a dedicated job or with an environment flag.

Preparing a PR
--------------
- I recommend creating a feature branch (for example `feature/backend-firestore-emulator-tests`) and committing the changes there. The branch should include:
	- Request-scoped `CurrentUser` change
	- Unit test fixes for request scope
	- `dev/firestore-emulator/docker-compose.yml` and `scripts/run-emulator-integration.sh`
	- The integration test class and updated `FirestoreConfig`
	- An updated `backend/README.md` with the instructions above
- If you'd like, I can create the branch and make a commit locally (without pushing). Then you can review and push when ready.

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
