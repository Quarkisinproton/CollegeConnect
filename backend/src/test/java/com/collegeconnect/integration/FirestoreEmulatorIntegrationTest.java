package com.collegeconnect.integration;

import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Scope;
import org.springframework.web.context.WebApplicationContext;
import com.collegeconnect.security.FirebaseTokenVerifier;
import com.google.firebase.auth.FirebaseToken;
import com.collegeconnect.security.CurrentUser;
import static org.mockito.Mockito.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class FirestoreEmulatorIntegrationTest {

    @LocalServerPort
    private int port;

    @Value("${FIRESTORE_EMULATOR_HOST:}")
    private String emulatorHost;

    @Test
    public void createEvent_againstEmulator_shouldReturn200() {
        // Skip if emulator host not configured
        Assumptions.assumeTrue(emulatorHost != null && !emulatorHost.isBlank(), "Firestore emulator not configured; set FIRESTORE_EMULATOR_HOST to run this test");

        RestTemplate rt = new RestTemplate();
        String url = "http://localhost:" + port + "/api/events";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer test");

        String now = java.time.Instant.now().toString();
            String body = "{"
                + "\"name\":\"Integration Event\","
                + "\"description\":\"From emulator test\","
                + "\"dateTime\":\"" + now + "\","
                + "\"location\":{\"lat\":12.34,\"lng\":56.78},"
                + "\"locationName\":\"Test Place\","
                + "\"createdBy\":\"test-uid\""
                + "}";
        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        ResponseEntity<String> resp = rt.postForEntity(url, entity, String.class);
        org.junit.jupiter.api.Assertions.assertEquals(200, resp.getStatusCodeValue());
    }

    @TestConfiguration
    static class TestBeans {
        @Bean
        public FirebaseTokenVerifier firebaseTokenVerifier() {
            return new FirebaseTokenVerifier() {
                @Override
                public FirebaseToken verify(String bearerToken) {
                    FirebaseToken t = mock(FirebaseToken.class);
                    when(t.getUid()).thenReturn("test-uid");
                    return t;
                }
            };
        }

        // Do not re-declare CurrentUser here — the application already provides a
        // request-scoped CurrentUser bean. Only override the FirebaseTokenVerifier
        // so the authentication filter accepts the test token.
    }
}
