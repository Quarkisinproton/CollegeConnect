package com.collegeconnect.service;

import com.collegeconnect.dto.UserDto;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

/**
 * Interface for user-related operations
 * Demonstrates interface concept with different method signatures
 */
public interface UserService {
    
    /**
     * Creates or updates a user profile
     */
    void saveUser(UserDto userDto) throws ExecutionException, InterruptedException;
    
    /**
     * Retrieves a user by UID
     */
    Map<String, Object> getUserByUid(String uid) throws ExecutionException, InterruptedException;
    
    /**
     * Retrieves all users
     */
    List<Map<String, Object>> getAllUsers() throws ExecutionException, InterruptedException;
    
    /**
     * Updates user role
     */
    void updateUserRole(String uid, String role) throws ExecutionException, InterruptedException;
}
