package com.collegeconnect.controllers;

import com.collegeconnect.dto.EventDto;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.Firestore;
import org.junit.jupiter.api.Test;
import com.google.firebase.auth.FirebaseToken;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import com.google.api.core.ApiFutures;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.when;

@WebMvcTest(EventController.class)
public class EventControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private Firestore firestore;

    @MockBean
    private com.collegeconnect.security.FirebaseTokenVerifier tokenVerifier;

    @MockBean
    private com.collegeconnect.security.CurrentUser currentUser;

    @Test
    public void createEvent_validPayload_returns200() throws Exception {
        EventDto dto = new EventDto();
        dto.name = "Test Event";
        dto.description = "This is a test event description.";
        dto.dateTime = "2025-10-20T12:00:00Z";
        dto.location = Map.of("lat", 1.0, "lng", 2.0);
        dto.locationName = "Campus";
        dto.createdBy = "uid-123";

    // Mock token verification to allow the request through
    FirebaseToken mockToken = Mockito.mock(FirebaseToken.class);
    when(mockToken.getUid()).thenReturn("uid-123");
    when(tokenVerifier.verify(Mockito.anyString())).thenReturn(mockToken);

    // Mock Firestore add
        DocumentReference mockRef = Mockito.mock(DocumentReference.class);
        CollectionReference mockCollection = Mockito.mock(CollectionReference.class);
    ApiFuture<DocumentReference> fakeFuture = ApiFutures.immediateFuture(mockRef);
    when(mockRef.getId()).thenReturn("doc-1");
        when(firestore.collection("events")).thenReturn(mockCollection);
        when(mockCollection.add(Mockito.any(Map.class))).thenReturn(fakeFuture);

        String body = "{\"name\":\"Test Event\",\"description\":\"This is a test event description.\",\"dateTime\":\"2025-10-20T12:00:00Z\",\"location\":{\"lat\":1.0,\"lng\":2.0},\"locationName\":\"Campus\",\"createdBy\":\"uid-123\"}";

    mockMvc.perform(post("/api/events").contentType(MediaType.APPLICATION_JSON).content(body)
        .header("Authorization", "Bearer dummy-token"))
        .andExpect(status().isOk());
    }
}
