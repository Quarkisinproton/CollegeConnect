package com.collegeconnect.controllers;

import com.collegeconnect.dto.EventDto;
import com.collegeconnect.security.FirebaseTokenVerifier;
import jakarta.validation.Valid;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/events")
public class EventController {

    @Autowired
    private Firestore firestore;

    @Autowired
    private FirebaseTokenVerifier tokenVerifier;

    @PostMapping
    public ResponseEntity<?> createEvent(@Valid @RequestBody EventDto dto) throws ExecutionException, InterruptedException {

        Map<String, Object> data = new HashMap<>();
        data.put("name", dto.name);
        data.put("description", dto.description);

        // parse ISO datetime to Date for Firestore
        if (dto.dateTime != null) {
            try {
                Instant inst = Instant.parse(dto.dateTime);
                data.put("dateTime", Date.from(inst));
            } catch (Exception ex) {
                // ignore parse error; backend could also return 400
            }
        }

        data.put("location", dto.location != null ? dto.location : Map.of());
        data.put("locationName", dto.locationName);
        data.put("createdBy", dto.createdBy);
        data.put("creatorName", dto.creatorName);
        if (dto.createdAt != null) {
            try {
                Instant inst = Instant.parse(dto.createdAt);
                data.put("createdAt", Date.from(inst));
            } catch (Exception ex) {
                data.put("createdAt", new Date());
            }
        } else {
            data.put("createdAt", new Date());
        }

        ApiFuture<DocumentReference> added = firestore.collection("events").add(data);
        DocumentReference docRef = added.get();
        return ResponseEntity.ok(Map.of("id", docRef.getId()));
    }
}
