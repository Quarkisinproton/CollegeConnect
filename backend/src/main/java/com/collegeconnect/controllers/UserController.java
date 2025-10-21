package com.collegeconnect.controllers;

import com.collegeconnect.dto.UserDto;
import com.collegeconnect.security.FirebaseTokenVerifier;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.SetOptions;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private Firestore firestore;

    @Autowired
    private FirebaseTokenVerifier tokenVerifier;

    @PutMapping("/{uid}")
    public ResponseEntity<?> upsertUser(@PathVariable String uid, @Valid @RequestBody UserDto dto) throws ExecutionException, InterruptedException {

        Map<String, Object> data = new HashMap<>();
        data.put("uid", dto.uid);
        data.put("email", dto.email);
        data.put("displayName", dto.displayName);
        data.put("role", dto.role);
        data.put("createdAt", dto.createdAt != null ? dto.createdAt : null);

        DocumentReference docRef = firestore.collection("users").document(uid);
        ApiFuture<com.google.cloud.firestore.WriteResult> write = docRef.set(data, SetOptions.merge());
        write.get();

        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/{uid}")
    public ResponseEntity<?> getUser(@PathVariable String uid) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection("users").document(uid);
        var snap = docRef.get().get();
        if (!snap.exists()) {
            return ResponseEntity.notFound().build();
        }
        Map<String, Object> data = new HashMap<>(snap.getData());
        // ensure uid field is present
        data.putIfAbsent("uid", uid);
        return ResponseEntity.ok(data);
    }
}
