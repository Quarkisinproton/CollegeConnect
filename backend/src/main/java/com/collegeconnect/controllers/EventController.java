package com.collegeconnect.controllers;

import com.collegeconnect.dto.EventDto;
import jakarta.validation.Valid;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import com.collegeconnect.security.CurrentUser;
import com.google.cloud.firestore.QuerySnapshot;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

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
    private CurrentUser currentUser;

    @PostMapping
    @CacheEvict(value = {"events", "userEvents"}, allEntries = true)
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

    @GetMapping("/{id}")
    @Cacheable(value = "events", key = "#id")
    public ResponseEntity<?> getEvent(@PathVariable String id) throws ExecutionException, InterruptedException {
        ApiFuture<com.google.cloud.firestore.DocumentSnapshot> future = firestore.collection("events").document(id).get();
        com.google.cloud.firestore.DocumentSnapshot doc = future.get();
        
        if (!doc.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Event not found"));
        }
        
        Map<String, Object> data = doc.getData();
        Map<String, Object> out = convertEventData(doc.getId(), data);
        
        // Add cache control headers for better client-side caching
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(5, TimeUnit.MINUTES).cachePublic())
                .body(out);
    }

    @GetMapping
    @Cacheable(value = "events", key = "#owner + '_' + #uidParam", unless = "#result == null")
    public ResponseEntity<?> listEvents(
            @RequestParam(name = "owner", required = false) Boolean owner,
            @RequestParam(name = "uid", required = false) String uidParam
    ) throws ExecutionException, InterruptedException {
        // If owner=true, return events created by the specified user
        if (owner != null && owner) {
            // For demo purposes, allow uid to be passed as parameter
            // In production, you'd use currentUser.getUid() from the auth token
            String uid = uidParam != null ? uidParam : currentUser.getUid();
            if (uid == null) {
                // Demo-friendly behavior: no uid -> return empty list instead of 401
                return ResponseEntity.ok(List.of());
            }

            // NOTE: Avoid composite index requirement by not ordering in Firestore.
            // We'll sort the results by dateTime in memory instead of using orderBy("dateTime").
            ApiFuture<QuerySnapshot> future = firestore.collection("events")
                    .whereEqualTo("createdBy", uid)
                    .get();

            List<Map<String, Object>> results = future.get().getDocuments().stream()
                    .map(doc -> {
                        Map<String, Object> eventData = convertEventData(doc.getId(), doc.getData());
                        long dtMs = getDateTimeMillis(doc.getData().get("dateTime"));
                        eventData.put("_dtMs", dtMs);
                        return eventData;
                    })
                    .sorted((a, b) -> Long.compare(
                            ((Number) a.getOrDefault("_dtMs", Long.MAX_VALUE)).longValue(),
                            ((Number) b.getOrDefault("_dtMs", Long.MAX_VALUE)).longValue()
                    ))
                    .peek(m -> m.remove("_dtMs"))
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok()
                    .cacheControl(CacheControl.maxAge(2, TimeUnit.MINUTES))
                    .body(results);
        }

        // Default: return all events (unfiltered)
        ApiFuture<QuerySnapshot> future = firestore.collection("events").orderBy("dateTime").get();
        List<Map<String, Object>> results = future.get().getDocuments().stream()
                .map(doc -> convertEventData(doc.getId(), doc.getData()))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(2, TimeUnit.MINUTES))
                .body(results);
    }

    /**
     * Helper method to convert event data with proper date formatting
     */
    private Map<String, Object> convertEventData(String id, Map<String, Object> data) {
        Object dt = data.get("dateTime");
        String dtIso = null;
        if (dt instanceof java.util.Date) {
            dtIso = java.time.Instant.ofEpochMilli(((java.util.Date) dt).getTime()).toString();
        } else if (dt != null) {
            dtIso = dt.toString();
        }
        
        Map<String, Object> out = new HashMap<>(data);
        out.put("id", id);
        out.put("dateTime", dtIso);
        return out;
    }

    /**
     * Helper method to extract milliseconds from dateTime
     */
    private long getDateTimeMillis(Object dt) {
        if (dt instanceof java.util.Date) {
            return ((java.util.Date) dt).getTime();
        } else if (dt != null) {
            try {
                return java.time.Instant.parse(dt.toString()).toEpochMilli();
            } catch (Exception ignore) {
                return Long.MAX_VALUE;
            }
        }
        return Long.MAX_VALUE;
    }
}
