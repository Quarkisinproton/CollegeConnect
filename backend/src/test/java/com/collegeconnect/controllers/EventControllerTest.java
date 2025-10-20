package com.collegeconnect.controllers;

import com.collegeconnect.dto.EventDto;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.when;

@WebMvcTest(EventController.class)
public class EventControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private Firestore firestore;

    @Test
    public void createEvent_validPayload_returns200() throws Exception {
        EventDto dto = new EventDto();
        dto.name = "Test Event";
        dto.description = "This is a test event description.";
        dto.dateTime = "2025-10-20T12:00:00Z";
        dto.location = Map.of("lat", 1.0, "lng", 2.0);
        dto.locationName = "Campus";
        dto.createdBy = "uid-123";

        // Mock Firestore add
        DocumentReference mockRef = Mockito.mock(DocumentReference.class);
        ApiFuture<DocumentReference> fakeFuture = CompletableFuture.completedFuture(mockRef);
        when(firestore.collection("events").add(Mockito.any(Map.class))).thenReturn(fakeFuture);

        String body = "{\"name\":\"Test Event\",\"description\":\"This is a test event description.\",\"dateTime\":\"2025-10-20T12:00:00Z\",\"location\":{\"lat\":1.0,\"lng\":2.0},\"locationName\":\"Campus\",\"createdBy\":\"uid-123\"}";

        mockMvc.perform(post("/api/events").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk());
    }
}
