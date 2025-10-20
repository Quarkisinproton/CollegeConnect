package com.collegeconnect.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.InputStream;

@Configuration
public class FirestoreConfig {

    @Bean
    public Firestore firestore() throws Exception {
        // If an emulator is configured, create a Firestore client that talks to it without credentials.
        String emulatorHost = System.getenv("FIRESTORE_EMULATOR_HOST");
        if (emulatorHost != null && !emulatorHost.isBlank()) {
            // When the emulator is configured via FIRESTORE_EMULATOR_HOST, the
            // Firestore client libraries detect and use it. Avoid forcing a host
            // value (which can cause gRPC name resolver issues). Just set the
            // project id and return the default instance so the emulator env var
            // is respected.
            String projectId = System.getenv().getOrDefault("FIRESTORE_PROJECT", "demo-project");
            FirestoreOptions options = FirestoreOptions.getDefaultInstance().toBuilder()
                .setProjectId(projectId)
                .build();
            return options.getService();
        }

        // Prefer GOOGLE_APPLICATION_CREDENTIALS env var in production.
        String serviceAccountPath = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");

        if (serviceAccountPath != null && !serviceAccountPath.isBlank()) {
            try (InputStream serviceAccount = new FileInputStream(serviceAccountPath)) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();
                if (FirebaseApp.getApps().isEmpty()) {
                    FirebaseApp.initializeApp(options);
                }
            }
        } else {
            // Will use application default credentials if available in the environment
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.getApplicationDefault())
                        .build();
                FirebaseApp.initializeApp(options);
            }
        }

        return FirestoreClient.getFirestore();
    }
}
