package com.collegeconnect.util;

import com.collegeconnect.dto.UserDto;

/**
 * User validator demonstrating:
 * - Another example of inheritance
 * - Method overriding
 * - Different implementation of abstract methods
 */
public class UserValidator extends Validator<UserDto> {
    
    private static final int MIN_NAME_LENGTH = 2;
    
    public UserValidator() {
        super("UserValidator");
    }
    
    @Override
    public boolean validate(UserDto data) {
        if (data == null) {
            return false;
        }
        
        // Validate UID
        if (data.uid == null || data.uid.trim().isEmpty()) {
            return false;
        }
        
        // Validate display name
        if (data.displayName == null || data.displayName.trim().length() < MIN_NAME_LENGTH) {
            return false;
        }
        
        // Validate role
        if (data.role == null || data.role.trim().isEmpty()) {
            return false;
        }
        
        return true;
    }
    
    @Override
    protected String getErrorMessage() {
        return "User validation failed: ensure UID, display name, and role are properly set";
    }
    
    // Additional validation methods
    public boolean validateEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        return email.contains("@") && email.contains(".");
    }
    
    public boolean validateRole(String role) {
        return role != null && (role.equals("student") || role.equals("admin") || role.equals("organizer"));
    }
}
