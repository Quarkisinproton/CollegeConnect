package com.collegeconnect.util;

import com.collegeconnect.dto.EventDto;

/**
 * Concrete validator class demonstrating:
 * - Inheritance (extends Validator)
 * - Method overriding
 * - Implementation of abstract methods
 */
public class EventValidator extends Validator<EventDto> {
    
    // Private constant
    private static final int MIN_NAME_LENGTH = 3;
    private static final int MIN_DESCRIPTION_LENGTH = 10;
    
    // Constructor
    public EventValidator() {
        super("EventValidator");
    }
    
    // Overriding abstract method from parent class
    @Override
    public boolean validate(EventDto data) {
        if (data == null) {
            return false;
        }
        
        // Validate name
        if (data.name == null || data.name.trim().length() < MIN_NAME_LENGTH) {
            return false;
        }
        
        // Validate description
        if (data.description == null || data.description.trim().length() < MIN_DESCRIPTION_LENGTH) {
            return false;
        }
        
        // Validate location
        if (data.locationName == null || data.locationName.trim().isEmpty()) {
            return false;
        }
        
        // Validate creator
        if (data.createdBy == null || data.createdBy.trim().isEmpty()) {
            return false;
        }
        
        return true;
    }
    
    // Overriding abstract method from parent class
    @Override
    protected String getErrorMessage() {
        return "Event validation failed: ensure name, description, location, and creator are properly set";
    }
    
    // Additional method specific to this class
    public boolean validateName(String name) {
        return name != null && name.trim().length() >= MIN_NAME_LENGTH;
    }
    
    // Method overloading - different validation checks
    public boolean validateDescription(String description) {
        return description != null && description.trim().length() >= MIN_DESCRIPTION_LENGTH;
    }
}
