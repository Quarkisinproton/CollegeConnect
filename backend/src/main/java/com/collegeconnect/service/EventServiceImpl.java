package com.collegeconnect.service;

import com.collegeconnect.dto.EventDto;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ExecutionException;

/**
 * Implementation class demonstrating:
 * - Inheritance (extends BaseService)
 * - Interface implementation (implements EventService)
 * - Method overriding
 * - All OOP concepts together
 */
@Service
public class EventServiceImpl extends BaseService implements EventService {
    
    // Private constant
    private static final String COLLECTION_NAME = "events";
    
    // Constructor demonstrating constructor with dependency injection
    public EventServiceImpl(Firestore firestore) {
        super(firestore); // Call to parent constructor
        setServiceName("EventServiceImpl");
    }
    
    // Implementing abstract method from BaseService
    @Override
    public String getCollectionName() {
        return COLLECTION_NAME;
    }
    
    // Implementing abstract method from BaseService
    @Override
    protected boolean validateData(Object data) {
        if (data == null) {
            return false;
        }
        if (data instanceof EventDto) {
            EventDto dto = (EventDto) data;
            return dto.name != null && !dto.name.isEmpty();
        }
        return false;
    }
    
    // Implementing interface method from EventService
    @Override
    public Map<String, String> createEvent(EventDto dto) throws ExecutionException, InterruptedException {
        // Validate data using abstract method
        if (!validateData(dto)) {
            throw new IllegalArgumentException("Invalid event data");
        }
        
        log("Creating event: " + dto.name);
        
        Map<String, Object> data = buildEventData(dto);
        
        ApiFuture<DocumentReference> added = firestore.collection(COLLECTION_NAME).add(data);
        DocumentReference docRef = added.get();
        
        Map<String, String> result = new HashMap<>();
        result.put("id", docRef.getId());
        return result;
    }
    
    // Implementing interface method from EventService
    @Override
    public Map<String, Object> getEventById(String id) throws ExecutionException, InterruptedException {
        log("Fetching event: " + id);
        
        ApiFuture<com.google.cloud.firestore.DocumentSnapshot> future = 
            firestore.collection(COLLECTION_NAME).document(id).get();
        com.google.cloud.firestore.DocumentSnapshot doc = future.get();
        
        if (!doc.exists()) {
            return null;
        }
        
        return convertDocumentToMap(doc);
    }
    
    // Implementing interface method from EventService
    @Override
    public List<Map<String, Object>> getAllEvents() throws ExecutionException, InterruptedException {
        log("Fetching all events");
        
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        List<Map<String, Object>> events = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            events.add(convertDocumentToMap(doc));
        }
        
        return events;
    }
    
    // Implementing interface method from EventService
    @Override
    public void deleteEvent(String id) throws ExecutionException, InterruptedException {
        log("Deleting event: " + id);
        firestore.collection(COLLECTION_NAME).document(id).delete().get();
    }
    
    // Private helper method - encapsulation
    private Map<String, Object> buildEventData(EventDto dto) {
        Map<String, Object> data = new HashMap<>();
        data.put("name", dto.name);
        data.put("description", dto.description);
        
        // Parse ISO datetime to Date for Firestore
        if (dto.dateTime != null) {
            try {
                Instant inst = Instant.parse(dto.dateTime);
                data.put("dateTime", Date.from(inst));
            } catch (Exception ex) {
                log("Error parsing dateTime: " + ex.getMessage());
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
        
        return data;
    }
    
    // Private helper method - method overloading example with different signature
    private Map<String, Object> convertDocumentToMap(com.google.cloud.firestore.DocumentSnapshot doc) {
        Map<String, Object> data = doc.getData();
        if (data == null) {
            return new HashMap<>();
        }
        
        return formatEventData(doc.getId(), data);
    }
    
    // Private helper method - another overloaded version
    private Map<String, Object> formatEventData(String id, Map<String, Object> data) {
        Object dt = data.get("dateTime");
        String dtIso = null;
        
        if (dt instanceof Date) {
            dtIso = Instant.ofEpochMilli(((Date) dt).getTime()).toString();
        } else if (dt != null) {
            dtIso = dt.toString();
        }
        
        Map<String, Object> result = new HashMap<>(data);
        result.put("id", id);
        result.put("dateTime", dtIso);
        
        return result;
    }
}
