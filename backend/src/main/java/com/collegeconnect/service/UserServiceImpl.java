package com.collegeconnect.service;

import com.collegeconnect.dto.UserDto;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ExecutionException;

/**
 * UserService implementation demonstrating:
 * - Multiple inheritance (extends BaseService, implements UserService)
 * - Method overriding
 * - Constructor overloading
 */
@Service
public class UserServiceImpl extends BaseService implements UserService {
    
    private static final String COLLECTION_NAME = "users";
    
    // Constructor - demonstrating dependency injection
    public UserServiceImpl(Firestore firestore) {
        super(firestore);
        setServiceName("UserServiceImpl");
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
        if (data instanceof UserDto) {
            UserDto dto = (UserDto) data;
            return dto.uid != null && !dto.uid.isEmpty() 
                && dto.displayName != null && !dto.displayName.isEmpty();
        }
        return false;
    }
    
    // Implementing interface method from UserService
    @Override
    public void saveUser(UserDto dto) throws ExecutionException, InterruptedException {
        if (!validateData(dto)) {
            throw new IllegalArgumentException("Invalid user data");
        }
        
        log("Saving user: " + dto.uid);
        
        Map<String, Object> data = buildUserData(dto);
        firestore.collection(COLLECTION_NAME).document(dto.uid).set(data).get();
    }
    
    // Implementing interface method from UserService
    @Override
    public Map<String, Object> getUserByUid(String uid) throws ExecutionException, InterruptedException {
        log("Fetching user: " + uid);
        
        ApiFuture<com.google.cloud.firestore.DocumentSnapshot> future = 
            firestore.collection(COLLECTION_NAME).document(uid).get();
        com.google.cloud.firestore.DocumentSnapshot doc = future.get();
        
        if (!doc.exists()) {
            return null;
        }
        
        Map<String, Object> data = doc.getData();
        if (data == null) {
            return new HashMap<>();
        }
        
        Map<String, Object> result = new HashMap<>(data);
        result.put("uid", doc.getId());
        return result;
    }
    
    // Implementing interface method from UserService
    @Override
    public List<Map<String, Object>> getAllUsers() throws ExecutionException, InterruptedException {
        log("Fetching all users");
        
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        List<Map<String, Object>> users = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            Map<String, Object> data = doc.getData();
            if (data != null) {
                data.put("uid", doc.getId());
                users.add(data);
            }
        }
        
        return users;
    }
    
    // Implementing interface method from UserService
    @Override
    public void updateUserRole(String uid, String role) throws ExecutionException, InterruptedException {
        log("Updating role for user: " + uid + " to " + role);
        
        Map<String, Object> updates = new HashMap<>();
        updates.put("role", role);
        
        firestore.collection(COLLECTION_NAME).document(uid).update(updates).get();
    }
    
    // Private helper method - encapsulation
    private Map<String, Object> buildUserData(UserDto dto) {
        Map<String, Object> data = new HashMap<>();
        data.put("uid", dto.uid);
        data.put("email", dto.email);
        data.put("displayName", dto.displayName);
        data.put("role", dto.role);
        
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
}
